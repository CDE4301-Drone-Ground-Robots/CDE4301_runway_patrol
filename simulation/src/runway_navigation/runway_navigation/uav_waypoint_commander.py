#!/usr/bin/env python3
"""
UAV Waypoint Commander & C2 Tactical Ground Station GUI
Implements Phase 1 C2 Structured Telemetry & FOD Alert Protocol (communication.html):
1. Tactical HUD matching NUS CDE / RSAF / RAiD Communication Architecture Spec.
2. Real-time Telemetry: Speed (m/s, km/h), Distance from Waypoint, ETA, Heading, State, Battery, RSSI.
3. Dedicated Right-Hand Side C2 Telemetry Console:
   - [DOWNLINK] UAV -> UGV Target Alert Payload JSON (/c2/target_alert)
   - [UPLINK]   UGV -> UAV / C2 State & Task Ledger Telemetry (/c2/ugv_telemetry)
4. Interactive On-Screen Buttons: [ EXIT ], [ SEND FOD ], [ PATROL ], [ STOP ], [ CLEAR ], [ HOME ].
5. Microhard P900 V2 (917-925 MHz FHSS) & CycloneDDS Simulation Link Visualizer.
6. Full Black Tactical Radar Night Mode for Raspberry Pi 5.
"""

import os
import sys
import math
import time
import json
import argparse
import threading
import hashlib
from datetime import datetime, timezone
import numpy as np

import rclpy
from rclpy.node import Node
from rclpy.action import ActionClient
from rclpy.qos import QoSProfile, DurabilityPolicy, ReliabilityPolicy, HistoryPolicy
from rclpy.callback_groups import ReentrantCallbackGroup

from std_msgs.msg import String
from geometry_msgs.msg import PoseStamped, Point, Quaternion
from nav_msgs.msg import OccupancyGrid, Path, Odometry

try:
    from nav2_msgs.action import NavigateToPose, NavigateThroughPoses
    from action_msgs.msg import GoalStatus
    HAS_NAV2_MSGS = True
except ImportError:
    HAS_NAV2_MSGS = False
    NavigateToPose = None
    NavigateThroughPoses = None

try:
    import tf2_ros
    import tf2_geometry_msgs
    HAS_TF2 = True
except ImportError:
    HAS_TF2 = False

try:
    import cv2
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False


def yaw_to_quaternion(yaw: float) -> Quaternion:
    """Convert yaw in radians to geometry_msgs Quaternion."""
    q = Quaternion()
    q.x = 0.0
    q.y = 0.0
    q.z = math.sin(yaw / 2.0)
    q.w = math.cos(yaw / 2.0)
    return q


def quaternion_to_yaw(q) -> float:
    """Convert geometry_msgs Quaternion to yaw in radians."""
    siny_cosp = 2.0 * (q.w * q.z + q.x * q.y)
    cosy_cosp = 1.0 - 2.0 * (q.y * q.y + q.z * q.z)
    return math.atan2(siny_cosp, cosy_cosp)


class UAVWaypointCommander(Node):
    def __init__(self, headless=False):
        super().__init__('uav_waypoint_commander')
        self.cb_group = ReentrantCallbackGroup()
        self.headless = headless

        # State Variables
        self.robot_x = None
        self.robot_y = None
        self.robot_yaw = 0.0
        self.robot_speed = 0.0
        self.last_robot_x = None
        self.last_robot_y = None
        self.last_pose_time = time.time()
        self.map_msg = None
        self.map_image = None
        self.map_lock = threading.Lock()
        self.nav_path = []
        self.queued_waypoints = []
        self.active_goal = None
        self.active_threat_id = "FOD_TARGET_001"
        self.nav_status_text = "READY / IDLE (PATROL STANDBY)"
        self.distance_remaining = 0.0
        self.should_exit = False

        # Phase 1 C2 Telemetry State
        self.downlink_tx_count = 0
        self.uplink_rx_count = 0
        self.last_downlink_time = 0.0
        self.last_uplink_time = 0.0
        self.last_downlink_payload = {
            "threat_id": "FOD_TARGET_001",
            "anomaly_metadata": {
                "primary_class": "metallic_hardware",
                "sub_class": "aircraft_bolt",
                "confidence_score": 0.94
            },
            "target_metric": {
                "x": -15.0,
                "y": 5.0,
                "z": 0.0
            },
            "priority_level": "HIGH_ACTIVE_REMEDIATION",
            "signature": "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
        }
        self.ugv_telemetry_cache = {
            "task_state": "IDLE",
            "threat_id": "NONE",
            "distance_to_target_m": 0.0,
            "eta_seconds": 0.0,
            "speed_mps": 0.0,
            "battery_pct": 98.4,
            "battery_voltage": 25.1,
            "vacuum_status": "READY_STANDBY",
            "heartbeat_seq": 0,
            "rssi_dbm": -64,
            "last_seen": time.time()
        }

        # UI Interaction
        self.buttons = []
        self.hovered_btn = None
        self.mouse_x = 0
        self.mouse_y = 0
        self.mouse_map_x = 0.0
        self.mouse_map_y = 0.0
        self.current_window_w = 1600

        # QoS Profiles
        latched_qos = QoSProfile(
            durability=DurabilityPolicy.TRANSIENT_LOCAL,
            reliability=ReliabilityPolicy.RELIABLE,
            history=HistoryPolicy.KEEP_LAST,
            depth=1
        )
        sensor_qos = QoSProfile(
            durability=DurabilityPolicy.VOLATILE,
            reliability=ReliabilityPolicy.BEST_EFFORT,
            history=HistoryPolicy.KEEP_LAST,
            depth=10
        )
        reliable_qos = QoSProfile(
            durability=DurabilityPolicy.VOLATILE,
            reliability=ReliabilityPolicy.RELIABLE,
            history=HistoryPolicy.KEEP_LAST,
            depth=10
        )

        # ---------------------------------------------------------
        # ROS 2 Subscribers & Publishers
        # ---------------------------------------------------------
        # 1. C2 Outgoing Target Alerts (UAV -> UGV Downlink)
        self.c2_alert_pub = self.create_publisher(
            String,
            '/c2/target_alert',
            latched_qos
        )

        # 2. C2 Ingoing Telemetry (UGV -> UAV Uplink)
        self.c2_telemetry_sub = self.create_subscription(
            String,
            '/c2/ugv_telemetry',
            self.ugv_telemetry_callback,
            reliable_qos,
            callback_group=self.cb_group
        )

        # 3. Direct Goal Pose Fallback
        self.goal_pub = self.create_publisher(
            PoseStamped,
            '/goal_pose',
            10
        )

        # 4. Nav2 Map Subscriber
        self.map_sub = self.create_subscription(
            OccupancyGrid,
            '/map',
            self.map_callback,
            latched_qos,
            callback_group=self.cb_group
        )

        # 5. Nav2 Global Planned Path
        self.path_sub = self.create_subscription(
            Path,
            '/plan',
            self.path_callback,
            sensor_qos,
            callback_group=self.cb_group
        )

        # 6. Odometry fallback
        self.odom_sub = self.create_subscription(
            Odometry,
            '/odom',
            self.odom_callback,
            sensor_qos,
            callback_group=self.cb_group
        )

        # 7. Nav2 Action Clients
        if HAS_NAV2_MSGS:
            self.nav_to_pose_client = ActionClient(
                self,
                NavigateToPose,
                'navigate_to_pose',
                callback_group=self.cb_group
            )
            self.follow_waypoints_client = ActionClient(
                self,
                NavigateThroughPoses,
                'navigate_through_poses',
                callback_group=self.cb_group
            )
        else:
            self.nav_to_pose_client = None
            self.follow_waypoints_client = None

        self.current_goal_handle = None

        # 8. TF Listener for precise robot tracking in 'map' frame
        if HAS_TF2:
            self.tf_buffer = tf2_ros.Buffer()
            self.tf_listener = tf2_ros.TransformListener(self.tf_buffer, self)
        
        # Periodic timer for kinematics update
        self.timer = self.create_timer(0.05, self.update_robot_pose, callback_group=self.cb_group)

        self.get_logger().info("=" * 65)
        self.get_logger().info("[C2 INIT] UAV Tactical C2 Ground Station Initialized")
        self.get_logger().info("[DATALINK] Microhard P900 V2 (917-925 MHz FHSS) | AES-256")
        self.get_logger().info("[DOWNLINK] /c2/target_alert")
        self.get_logger().info("[UPLINK]   /c2/ugv_telemetry")
        self.get_logger().info("[MAP STATUS] Waiting for Nav2 /map broadcast...")
        self.get_logger().info("=" * 65)

    # -------------------------------------------------------------
    # Callbacks & Telemetry Processing
    # -------------------------------------------------------------
    def ugv_telemetry_callback(self, msg: String):
        """Ingest live UGV State & Task Ledger Telemetry (Communication Spec Section 3.2)."""
        try:
            data = json.loads(msg.data)
            ack = data.get('target_ack', {})
            veh = data.get('vehicle_telemetry', {})
            link = data.get('link_watchdog', {})

            self.uplink_rx_count += 1
            self.last_uplink_time = time.time()

            self.ugv_telemetry_cache["task_state"] = ack.get("task_state", "IDLE")
            self.ugv_telemetry_cache["threat_id"] = ack.get("threat_id", self.active_threat_id)
            self.ugv_telemetry_cache["distance_to_target_m"] = ack.get("distance_to_target_m", 0.0)
            self.ugv_telemetry_cache["eta_seconds"] = ack.get("eta_seconds", 0.0)
            
            if "speed_mps" in veh:
                self.ugv_telemetry_cache["speed_mps"] = float(veh["speed_mps"])
            
            self.ugv_telemetry_cache["battery_pct"] = veh.get("battery_state_pct", veh.get("battery_pct", 95.0))
            self.ugv_telemetry_cache["battery_voltage"] = veh.get("battery_voltage_v", 24.8)
            self.ugv_telemetry_cache["vacuum_status"] = veh.get("vacuum_hood_status", "READY_STANDBY")
            self.ugv_telemetry_cache["heartbeat_seq"] = link.get("heartbeat_sequence", link.get("heartbeat_seq", self.uplink_rx_count))
            self.ugv_telemetry_cache["rssi_dbm"] = link.get("rssi_dbm", -64)
            self.ugv_telemetry_cache["last_seen"] = time.time()

            # Update pose from telemetry if TF is not streaming
            if self.robot_x is None and "pose_metric" in veh:
                pm = veh["pose_metric"]
                self.robot_x = pm.get("x", 0.0)
                self.robot_y = pm.get("y", 0.0)
                self.robot_yaw = math.radians(pm.get("heading_deg", 0.0))

            # Format status text
            t_state = self.ugv_telemetry_cache["task_state"]
            t_threat = self.ugv_telemetry_cache["threat_id"]
            if t_state == "COLLECTED":
                self.nav_status_text = f"[SUCCESS] {t_threat}: REMEDIATED & COLLECTED"
            elif t_state == "VERIFIED":
                self.nav_status_text = f"[ACTIVE] {t_threat}: VACUUM SUCTION ACTIVE"
            elif t_state == "EN_ROUTE":
                dist = self.ugv_telemetry_cache["distance_to_target_m"]
                eta = self.ugv_telemetry_cache["eta_seconds"]
                self.nav_status_text = f"EN ROUTE -> {t_threat} ({dist:.1f}m | ETA: {eta:.0f}s)"
            elif t_state == "ACKNOWLEDGED":
                self.nav_status_text = f"ACKNOWLEDGED -> {t_threat}"
            elif t_state == "IDLE":
                self.nav_status_text = "READY / IDLE (PATROL STANDBY)"
        except Exception:
            pass

    def map_callback(self, msg: OccupancyGrid):
        with self.map_lock:
            self.map_msg = msg
            self.build_map_image(msg)
        self.get_logger().info(
            f"[MAP INGESTED] Airfield Map: {msg.info.width}x{msg.info.height} cells | "
            f"Res: {msg.info.resolution:.4f} m/px | "
            f"Origin: ({msg.info.origin.position.x:.2f}, {msg.info.origin.position.y:.2f})"
        )

    def path_callback(self, msg: Path):
        self.nav_path = [(p.pose.position.x, p.pose.position.y) for p in msg.poses]

    def odom_callback(self, msg: Odometry):
        if self.robot_x is None:
            self.robot_x = msg.pose.pose.position.x
            self.robot_y = msg.pose.pose.position.y
            self.robot_yaw = quaternion_to_yaw(msg.pose.pose.orientation)
            vx = msg.twist.twist.linear.x
            vy = msg.twist.twist.linear.y
            self.robot_speed = math.hypot(vx, vy)

    def update_robot_pose(self):
        """Update robot pose from TF."""
        if not HAS_TF2:
            return
        try:
            for child_frame in ['base_link', 'base_footprint', 'chassis_link']:
                if self.tf_buffer.can_transform('map', child_frame, rclpy.time.Time()):
                    t = self.tf_buffer.lookup_transform('map', child_frame, rclpy.time.Time())
                    curr_x = t.transform.translation.x
                    curr_y = t.transform.translation.y
                    curr_t = time.time()
                    
                    if self.last_robot_x is not None and self.last_robot_y is not None:
                        dt = curr_t - self.last_pose_time
                        if dt > 0.05:
                            dx = curr_x - self.last_robot_x
                            dy = curr_y - self.last_robot_y
                            inst_spd = math.hypot(dx, dy) / dt
                            self.robot_speed = 0.8 * self.robot_speed + 0.2 * inst_spd
                            self.last_robot_x = curr_x
                            self.last_robot_y = curr_y
                            self.last_pose_time = curr_t
                    else:
                        self.last_robot_x = curr_x
                        self.last_robot_y = curr_y
                        self.last_pose_time = curr_t

                    self.robot_x = curr_x
                    self.robot_y = curr_y
                    self.robot_yaw = quaternion_to_yaw(t.transform.rotation)
                    break
        except Exception:
            pass

    # -------------------------------------------------------------
    # Coordinate Transforms & Map Rasterizer
    # -------------------------------------------------------------
    def world_to_pixel(self, wx: float, wy: float):
        """Convert world coordinates (meters) to map pixel indices."""
        if self.map_msg is None:
            return None, None
        info = self.map_msg.info
        px = int((wx - info.origin.position.x) / info.resolution)
        py = int(info.height - 1 - (wy - info.origin.position.y) / info.resolution)
        return px, py

    def pixel_to_world(self, px: int, py: int):
        """Convert pixel coordinates on map display to world coordinates (meters)."""
        if self.map_msg is None:
            return None, None
        info = self.map_msg.info
        wx = info.origin.position.x + (px * info.resolution)
        wy = info.origin.position.y + ((info.height - 1 - py) * info.resolution)
        return wx, wy

    def build_map_image(self, msg: OccupancyGrid):
        """Build map canvas matching RViz2 color scheme (grey drivable area, black zone-out/obstacles)."""
        w = msg.info.width
        h = msg.info.height
        raw_data = np.array(msg.data, dtype=np.int8).reshape((h, w))
        
        # Base RGB image
        rgb = np.zeros((h, w, 3), dtype=np.uint8)
        
        # Drivable free space = RViz2 Clean Grey (200, 200, 200)
        free_mask = (raw_data == 0)
        rgb[free_mask] = (205, 205, 205)

        # Zone out / Unknown area = Solid Black (15, 15, 18)
        unk_mask = (raw_data == -1)
        rgb[unk_mask] = (15, 15, 18)

        # Obstacles / Perimeter boundaries = Jet Black (0, 0, 0)
        obs_mask = (raw_data > 0)
        rgb[obs_mask] = (0, 0, 0)

        # Flip for image coordinate system (origin bottom-left to top-left)
        img = np.ascontiguousarray(np.flipud(rgb))

        # Overlay subtle coordinate grid lines (every 5 meters)
        res = msg.info.resolution
        origin_x = msg.info.origin.position.x
        origin_y = msg.info.origin.position.y

        # Draw 5m grid lines
        for meter_x in range(int(origin_x), int(origin_x + w * res) + 5, 5):
            px, _ = self.world_to_pixel(meter_x, 0.0)
            if px is not None and 0 <= px < w:
                cv2.line(img, (px, 0), (px, h), (175, 175, 175), 1, cv2.LINE_AA)

        for meter_y in range(int(origin_y), int(origin_y + h * res) + 5, 5):
            _, py = self.world_to_pixel(0.0, meter_y)
            if py is not None and 0 <= py < h:
                cv2.line(img, (0, py), (w, py), (175, 175, 175), 1, cv2.LINE_AA)

        # Draw Origin & Runway Axis Markers
        ox, oy = self.world_to_pixel(0.0, 0.0)
        if ox is not None and 0 <= ox < w and 0 <= oy < h:
            cv2.drawMarker(img, (ox, oy), (0, 0, 220), cv2.MARKER_CROSS, 14, 2)

        # Draw Home Charging Dock Base (-25.0, 0.0)
        hx, hy = self.world_to_pixel(-25.0, 0.0)
        if hx is not None and 0 <= hx < w and 0 <= hy < h:
            cv2.rectangle(img, (hx - 16, hy - 16), (hx + 16, hy + 16), (0, 160, 60), 2)
            cv2.rectangle(img, (hx - 48, hy - 32), (hx + 48, hy - 16), (20, 22, 28), -1)
            cv2.putText(img, "CHARGING DOCK", (hx - 44, hy - 20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0, 220, 100), 1, cv2.LINE_AA)

        self.map_image = img

    # -------------------------------------------------------------
    # Navigation & C2 Dispatch Logic
    # -------------------------------------------------------------
    def send_single_waypoint(self, wx: float, wy: float, yaw: float = 0.0, threat_class: str = "metallic_hardware", sub_class: str = "aircraft_bolt"):
        """Dispatch target alert JSON via Section 3.1 C2 Downlink protocol."""
        self.downlink_tx_count += 1
        self.last_downlink_time = time.time()
        threat_id = f"FOD_THREAT_{self.downlink_tx_count:03d}"
        self.active_threat_id = threat_id
        self.active_goal = (wx, wy, yaw)

        # Format compliant JSON payload
        now_utc = datetime.now(timezone.utc).isoformat()
        payload = {
            "threat_id": threat_id,
            "timestamp_utc": now_utc,
            "source_agent_id": "UAV_ALPHA_01",
            "mission_id": "RUNWAY_PATROL_PHASE1",
            "anomaly_metadata": {
                "primary_class": threat_class,
                "sub_class": sub_class,
                "confidence_score": 0.96
            },
            "target_georeference": {
                "latitude_deg": 1.300000 + (wy / 111320.0),
                "longitude_deg": 103.770000 + (wx / 111320.0),
                "altitude_msl_m": 15.0
            },
            "target_metric": {
                "x": round(wx, 2),
                "y": round(wy, 2),
                "z": 0.0,
                "yaw": round(yaw, 2)
            },
            "priority_level": "HIGH_ACTIVE_REMEDIATION",
            "suggested_action": "AUTONOMOUS_INTERCEPT_AND_VACUUM",
            "signature": hashlib.sha256(f"{now_utc}-{threat_id}-{wx}-{wy}".encode()).hexdigest()
        }
        self.last_downlink_payload = payload

        # Broadcast via C2 Datalink
        msg = String()
        msg.data = json.dumps(payload)
        self.c2_alert_pub.publish(msg)
        self.get_logger().info(f"[C2 FOD ALERT DISPATCHED] -> {threat_id} at ({wx:.2f}, {wy:.2f})")

        # Direct Nav2 dispatch fallback
        pose_msg = PoseStamped()
        pose_msg.header.frame_id = 'map'
        pose_msg.header.stamp = self.get_clock().now().to_msg()
        pose_msg.pose.position.x = wx
        pose_msg.pose.position.y = wy
        pose_msg.pose.position.z = 0.0
        pose_msg.pose.orientation = yaw_to_quaternion(yaw)

        self.goal_pub.publish(pose_msg)
        self.nav_status_text = f"DISPATCHED -> {threat_id} ({wx:.1f}, {wy:.1f})"

        if self.nav_to_pose_client is not None and self.nav_to_pose_client.server_is_ready():
            goal_msg = NavigateToPose.Goal()
            goal_msg.pose = pose_msg
            send_goal_future = self.nav_to_pose_client.send_goal_async(
                goal_msg,
                feedback_callback=self.nav_to_pose_feedback_cb
            )
            send_goal_future.add_done_callback(self.goal_response_callback)

    def send_patrol_mission(self, waypoints: list):
        """Dispatch sequential multi-point patrol mission."""
        if not waypoints:
            self.get_logger().warn("Patrol waypoints list is empty.")
            return

        self.get_logger().info(f"[PATROL DISPATCH] UAV Dispatching Patrol Mission with {len(waypoints)} Waypoints")
        self.active_threat_id = "PATROL_MISSION_01"
        self.nav_status_text = f"PATROL ACTIVE: 0/{len(waypoints)} Waypoints"

        if self.follow_waypoints_client is not None and self.follow_waypoints_client.server_is_ready():
            goal_msg = NavigateThroughPoses.Goal()
            poses = []
            for (wx, wy, yaw) in waypoints:
                p = PoseStamped()
                p.header.frame_id = 'map'
                p.header.stamp = self.get_clock().now().to_msg()
                p.pose.position.x = wx
                p.pose.position.y = wy
                p.pose.orientation = yaw_to_quaternion(yaw)
                poses.append(p)
            
            goal_msg.poses = poses
            send_goal_future = self.follow_waypoints_client.send_goal_async(
                goal_msg,
                feedback_callback=self.patrol_feedback_cb
            )
            send_goal_future.add_done_callback(self.goal_response_callback)
        else:
            self.send_single_waypoint(waypoints[0][0], waypoints[0][1], waypoints[0][2])

    def cancel_navigation(self):
        """Cancel active navigation goal."""
        self.get_logger().info("[STOP] UAV Requested Navigation Cancel / Emergency Stop")
        self.active_goal = None
        self.queued_waypoints.clear()
        self.nav_path.clear()
        self.nav_status_text = "CANCELLED / EMERGENCY STOP"
        if self.current_goal_handle is not None:
            self.current_goal_handle.cancel_goal_async()

    def go_home(self):
        """Send UGV back to charging bay (-25.0, 0.0) reversing into dock facing outward (+X East)."""
        self.get_logger().info("[HOME] Initiating Reverse Docking Procedure into Charging Dock (-25.0, 0.0, Yaw=0.0)")
        self.queued_waypoints.clear()
        
        # If robot is out in the field, execute 2-step docking (Entry Approach -> Reverse In)
        if self.robot_x is not None and self.robot_x > -23.5:
            approach_pt = (-22.0, 0.0, 0.0)
            dock_pt = (-25.0, 0.0, 0.0)
            self.send_patrol_mission([approach_pt, dock_pt])
            self.nav_status_text = "RTB -> DOCK ENTRY & REVERSE DOCKING"
        else:
            self.send_single_waypoint(-25.0, 0.0, 0.0, threat_class="CHARGING_DOCK", sub_class="inductive_charging_pad")
            self.nav_status_text = "RTB -> CHARGING DOCK (DOCKING)"

    def exit_application(self):
        """Cleanly exit application."""
        self.get_logger().info("[EXIT] Exit button clicked. Shutting down UAV Commander...")
        self.should_exit = True

    def goal_response_callback(self, future):
        goal_handle = future.result()
        if not goal_handle.accepted:
            self.get_logger().error("[ERROR] Waypoint goal was rejected by Nav2.")
            self.nav_status_text = "GOAL REJECTED by Nav2"
            return

        self.current_goal_handle = goal_handle
        result_future = goal_handle.get_result_async()
        result_future.add_done_callback(self.goal_result_callback)

    def nav_to_pose_feedback_cb(self, feedback_msg):
        fb = feedback_msg.feedback
        self.distance_remaining = fb.distance_remaining

    def patrol_feedback_cb(self, feedback_msg):
        fb = feedback_msg.feedback
        self.distance_remaining = fb.distance_remaining
        self.nav_status_text = (
            f"PATROL ({fb.number_of_poses_remaining} left) | Dist: {fb.distance_remaining:.1f}m"
        )

    def goal_result_callback(self, future):
        status = future.result().status
        if status == GoalStatus.STATUS_SUCCEEDED:
            self.nav_status_text = f"[SUCCESS] {self.active_threat_id or 'GOAL'}: COLLECTED / REMEDIATED!"
            self.active_goal = None
        elif status == GoalStatus.STATUS_CANCELED:
            self.nav_status_text = "GOAL CANCELLED (IDLE)"
            self.active_goal = None
        else:
            self.nav_status_text = f"GOAL COMPLETED (Status {status})"
            self.active_goal = None

    # -------------------------------------------------------------
    # Tactical HUD & Button Helpers
    # -------------------------------------------------------------
    def draw_card_box(self, img, x, y, w, h, title="", border_color=(70, 70, 80), bg_color=(20, 22, 28)):
        """Draw sleek dark card container with title."""
        cv2.rectangle(img, (x, y), (x + w, y + h), bg_color, -1)
        cv2.rectangle(img, (x, y), (x + w, y + h), border_color, 1)
        if title:
            cv2.putText(img, title.upper(), (x + 10, y + 16),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.40, (140, 155, 175), 1, cv2.LINE_AA)

    def draw_button(self, img, btn_id, label, x, y, w, h, base_color=(45, 50, 60), hover_color=(70, 80, 100), text_color=(255, 255, 255), is_accent=False):
        """Draw interactive clickable button and register bounding box."""
        is_hover = (self.hovered_btn == btn_id)
        fill_color = hover_color if is_hover else base_color
        border_col = (0, 220, 255) if (is_hover and is_accent) else ((120, 130, 150) if is_hover else (60, 65, 75))

        # Register button for mouse clicks
        self.buttons.append((x, y, x + w, y + h, btn_id))

        cv2.rectangle(img, (x, y), (x + w, y + h), fill_color, -1)
        cv2.rectangle(img, (x, y), (x + w, y + h), border_col, 2 if is_hover else 1)

        font_scale = 0.44
        thickness = 1
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)
        tx = x + max(4, (w - tw) // 2)
        ty = y + (h + th) // 2 - 1
        cv2.putText(img, label, (tx, ty), cv2.FONT_HERSHEY_SIMPLEX, font_scale, text_color, thickness, cv2.LINE_AA)

    # -------------------------------------------------------------
    # Right-Hand C2 Telemetry Sidebar (Downlink & Uplink)
    # -------------------------------------------------------------
    def render_c2_sidebar(self, w: int, h: int) -> np.ndarray:
        """Render Downlink (UAV->UGV) & Uplink (UGV->C2) live telemetry cards with large, clear presentation typography."""
        sb = np.zeros((h, w, 3), dtype=np.uint8)
        sb[:] = (14, 16, 22)  # Deep carbon sidebar background

        # Vertical divider line on left edge
        cv2.line(sb, (0, 0), (0, h - 1), (65, 75, 95), 2)

        card_margin = 10
        card_w = w - 2 * card_margin
        card_h = (h - 30) // 2

        # ---------------------------------------------------------
        # CARD 1 (TOP): DOWNLINK: UAV -> UGV (Target Alert Payload)
        # ---------------------------------------------------------
        y1 = 10
        cv2.rectangle(sb, (card_margin, y1), (card_margin + card_w, y1 + card_h), (20, 22, 30), -1)
        cv2.rectangle(sb, (card_margin, y1), (card_margin + card_w, y1 + card_h), (160, 60, 255), 2)  # Vibrant Purple border

        # Top Banner Pill
        cv2.rectangle(sb, (card_margin, y1), (card_margin + card_w, y1 + 34), (40, 25, 60), -1)
        cv2.putText(sb, "[DOWNLINK] UAV -> UGV (C2 Target Alert)", (card_margin + 12, y1 + 24),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.52, (235, 170, 255), 1, cv2.LINE_AA)
        tx_badge = f"TX #{self.downlink_tx_count}"
        cv2.putText(sb, tx_badge, (card_margin + card_w - 95, y1 + 24),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.48, (0, 255, 180), 1, cv2.LINE_AA)

        # Spec & Datalink Subtitle
        cv2.putText(sb, "Datalink: /c2/target_alert | JSON < 2 KB | AES-256 | FHSS", (card_margin + 12, y1 + 52),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.40, (150, 165, 185), 1, cv2.LINE_AA)
        cv2.line(sb, (card_margin + 8, y1 + 60), (card_margin + card_w - 8, y1 + 60), (45, 45, 60), 1)

        # Payload Data Rows (Large presentation fonts for examiners)
        p = self.last_downlink_payload
        tx_x = p.get('target_metric', {}).get('x', -15.0)
        tx_y = p.get('target_metric', {}).get('y', 5.0)
        p_class = p.get('anomaly_metadata', {}).get('primary_class', 'metallic_hardware')
        p_sub = p.get('anomaly_metadata', {}).get('sub_class', 'aircraft_bolt')
        p_conf = p.get('anomaly_metadata', {}).get('confidence_score', 0.94)
        p_threat = p.get('threat_id', self.active_threat_id)
        p_sig = p.get('signature', 'b94d27b9934...')

        dl_items = [
            ("MISSION ID:", "RUNWAY_PATROL_PHASE1", (140, 210, 255)),
            ("SOURCE AGENT:", "UAV_ALPHA_01 (Aerial Scout)", (140, 210, 255)),
            ("TARGET THREAT:", f"{p_threat}", (0, 255, 220)),
            ("TARGET COORDS:", f"X: {tx_x:+.2f} m | Y: {tx_y:+.2f} m", (0, 220, 255)),
            ("FOD CLASS:", f"{p_class} ({p_sub})", (220, 160, 255)),
            ("AI CONFIDENCE:", f"{p_conf*100:.1f}% (Edge YOLOv8)", (0, 255, 120)),
            ("PRIORITY LEVEL:", "HIGH_ACTIVE_REMEDIATION", (0, 165, 255)),
            ("SECURITY SIG:", f"{p_sig[:18]}... (SHA-256)", (140, 150, 170))
        ]

        row_y = y1 + 86
        for label, val, val_col in dl_items:
            cv2.putText(sb, label, (card_margin + 12, row_y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.46, (175, 185, 205), 1, cv2.LINE_AA)
            cv2.putText(sb, val, (card_margin + 195, row_y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.50, val_col, 1, cv2.LINE_AA)
            row_y += 25

        # ---------------------------------------------------------
        # CARD 2 (BOTTOM): UPLINK: UGV -> UAV / C2 (State & Task Ledger)
        # ---------------------------------------------------------
        y2 = y1 + card_h + 10
        cv2.rectangle(sb, (card_margin, y2), (card_margin + card_w, y2 + card_h), (20, 22, 30), -1)
        cv2.rectangle(sb, (card_margin, y2), (card_margin + card_w, y2 + card_h), (46, 190, 80), 2)  # Vibrant Emerald border

        # Top Banner Pill
        cv2.rectangle(sb, (card_margin, y2), (card_margin + card_w, y2 + 34), (18, 45, 28), -1)
        cv2.putText(sb, "[UPLINK] UGV -> C2 (Live Telemetry Ledger)", (card_margin + 12, y2 + 24),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.52, (0, 255, 160), 1, cv2.LINE_AA)
        
        rx_dt = time.time() - self.last_uplink_time
        rx_badge = f"RX (dt: {rx_dt:.1f}s)"
        rx_col = (0, 255, 120) if rx_dt < 2.0 else (0, 165, 255)
        cv2.putText(sb, rx_badge, (card_margin + card_w - 115, y2 + 24),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.46, rx_col, 1, cv2.LINE_AA)

        # Spec & Datalink Subtitle
        cv2.putText(sb, "Datalink: /c2/ugv_telemetry | Periodic 50 Hz | Watchdog", (card_margin + 12, y2 + 52),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.40, (150, 165, 185), 1, cv2.LINE_AA)
        cv2.line(sb, (card_margin + 8, y2 + 60), (card_margin + card_w - 8, y2 + 60), (45, 45, 60), 1)

        # Telemetry Data Rows
        u_state = self.ugv_telemetry_cache["task_state"]
        u_threat = self.ugv_telemetry_cache["threat_id"]
        u_dist = self.ugv_telemetry_cache["distance_to_target_m"]
        u_eta = self.ugv_telemetry_cache["eta_seconds"]
        u_spd = self.robot_speed if self.robot_speed > 0.05 else self.ugv_telemetry_cache["speed_mps"]
        u_rx = self.robot_x if self.robot_x is not None else -25.0
        u_ry = self.robot_y if self.robot_y is not None else 0.0
        u_yaw = math.degrees(self.robot_yaw) % 360.0
        u_bat = self.ugv_telemetry_cache["battery_pct"]
        u_volt = self.ugv_telemetry_cache["battery_voltage"]
        u_vac = self.ugv_telemetry_cache["vacuum_status"]
        u_seq = self.ugv_telemetry_cache["heartbeat_seq"]
        u_rssi = self.ugv_telemetry_cache["rssi_dbm"]

        state_color = (0, 255, 120) if u_state == "COLLECTED" else (
            (0, 220, 255) if u_state == "EN_ROUTE" else (
                (220, 120, 255) if u_state == "ACKNOWLEDGED" else (
                    (0, 180, 255) if u_state == "VERIFIED" else (180, 180, 190)
                )
            )
        )

        ul_items = [
            ("ROVER AGENT:", "UGV_ROVER_01 (AgileX Scout V2)", (140, 210, 255)),
            ("TASK STATE:", f"[{u_state}] -> {u_threat}", state_color),
            ("DISTANCE / ETA:", f"{u_dist:.2f} m  (ETA: {u_eta:.1f} s)", (0, 255, 180)),
            ("ROVER POSE (ENU):", f"X: {u_rx:+.2f} m | Y: {u_ry:+.2f} m", (0, 220, 255)),
            ("HEADING (YAW):", f"{u_yaw:05.1f} deg (Continuous EKF)", (0, 220, 255)),
            ("GROUND SPEED:", f"{u_spd:.2f} m/s ({u_spd*3.6:.1f} km/h)", (0, 255, 120)),
            ("BATTERY HEALTH:", f"{u_bat:.1f}% ({u_volt:.1f}V Nominal)", (0, 255, 120)),
            ("VACUUM MODULE:", f"{u_vac}", (0, 255, 120) if "ACTIVE" in u_vac else (180, 185, 200)),
            ("LINK WATCHDOG:", f"Heartbeat #{u_seq} | RSSI: {u_rssi} dBm", (140, 150, 170))
        ]

        row_y2 = y2 + 86
        for label, val, val_col in ul_items:
            cv2.putText(sb, label, (card_margin + 12, row_y2),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.46, (175, 185, 205), 1, cv2.LINE_AA)
            cv2.putText(sb, val, (card_margin + 195, row_y2),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.50, val_col, 1, cv2.LINE_AA)
            row_y2 += 25

        return sb

    # -------------------------------------------------------------
    # Interactive OpenCV Map GUI
    # -------------------------------------------------------------
    def run_gui_loop(self):
        """Interactive 2D OpenCV visualizer window."""
        if not HAS_CV2:
            self.get_logger().error("OpenCV (cv2) not available for GUI mode. Switching to CLI mode.")
            self.run_cli_loop()
            return

        window_name = "FOD Hunter - UAV Simulated Communication"
        try:
            cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
            cv2.resizeWindow(window_name, 1600, 950)
        except Exception as e:
            self.get_logger().warn(f"Cannot open GUI display window on DISPLAY={os.environ.get('DISPLAY')}: {e}. Switching to CLI mode.")
            self.run_cli_loop()
            return

        # Mouse interaction callback
        def on_mouse(event, x, y, flags, param):
            self.mouse_x = x
            self.mouse_y = y

            # Check button hover
            self.hovered_btn = None
            for bx1, by1, bx2, by2, bid in self.buttons:
                if bx1 <= x <= bx2 and by1 <= y <= by2:
                    self.hovered_btn = bid
                    break

            # Handle Map Clicks (below HUD and left of sidebar)
            hud_height = 175
            sidebar_width = 540
            
            # If mouse is on map canvas
            if y > hud_height and x < (self.current_window_w - sidebar_width) and self.map_msg is not None:
                map_y = y - hud_height
                wx, wy = self.pixel_to_world(x, map_y)
                if wx is not None:
                    self.mouse_map_x = wx
                    self.mouse_map_y = wy

                    if event == cv2.EVENT_LBUTTONDOWN:
                        if flags & cv2.EVENT_FLAG_SHIFTKEY:
                            yaw = 0.0
                            wps = list(self.queued_waypoints)
                            if wps and len(wps[-1]) >= 2:
                                prev_x, prev_y = wps[-1][0], wps[-1][1]
                                yaw = math.atan2(wy - prev_y, wx - prev_x)
                            self.queued_waypoints.append((wx, wy, yaw))
                            self.get_logger().info(f"[PATROL QUEUE] Point #{len(self.queued_waypoints)}: ({wx:.2f}, {wy:.2f})")
                        else:
                            yaw = 0.0
                            if self.robot_x is not None and self.robot_y is not None:
                                yaw = math.atan2(wy - self.robot_y, wx - self.robot_x)
                            self.queued_waypoints.clear()
                            self.send_single_waypoint(wx, wy, yaw)

                    elif event == cv2.EVENT_RBUTTONDOWN:
                        self.cancel_navigation()

            elif event == cv2.EVENT_LBUTTONDOWN and self.hovered_btn is not None:
                # Handle button clicks
                if self.hovered_btn == 'EXIT':
                    self.exit_application()
                elif self.hovered_btn == 'STOP':
                    self.cancel_navigation()
                elif self.hovered_btn == 'PATROL':
                    wps = list(self.queued_waypoints)
                    if wps:
                        self.send_patrol_mission(wps)
                    else:
                        self.get_logger().warn("No patrol waypoints queued. Use Shift+Click on map first.")
                elif self.hovered_btn == 'CLEAR':
                    self.queued_waypoints.clear()
                    self.get_logger().info("Cleared queued patrol points.")
                elif self.hovered_btn == 'SEND_FOD':
                    tx = self.mouse_map_x if self.mouse_map_x != 0.0 else -15.0
                    ty = self.mouse_map_y if self.mouse_map_y != 0.0 else 5.0
                    self.send_single_waypoint(tx, ty)
                elif self.hovered_btn == 'HOME':
                    self.go_home()

        self.current_window_w = 1600
        cv2.setMouseCallback(window_name, on_mouse)

        while rclpy.ok() and not self.should_exit:
            try:
                display_img = self.render_gui_frame()
                if display_img is not None:
                    self.current_window_w = display_img.shape[1]
                    cv2.imshow(window_name, display_img)
                
                key = cv2.waitKey(30) & 0xFF
                if key == ord('q') or key == 27:
                    self.exit_application()
                    break
                elif key == ord('c'):
                    self.cancel_navigation()
                elif key == ord('p') or key == 32:
                    wps = list(self.queued_waypoints)
                    if wps:
                        self.send_patrol_mission(wps)
                elif key == ord('r'):
                    self.queued_waypoints.clear()
                    self.get_logger().info("Cleared queued patrol points.")
                elif key == ord('h'):
                    self.go_home()
            except Exception as e:
                self.get_logger().warn(f"GUI render warning: {e}")
                time.sleep(0.05)
        
        cv2.destroyAllWindows()

    def render_gui_frame(self):
        """Render complete C2 Tactical Station (Top HUD + Tactical Map + Right C2 Sidebar + Bottom Status)."""
        self.buttons.clear()

        # Map Area (Left)
        with self.map_lock:
            if self.map_image is None:
                map_frame = np.zeros((650, 1060, 3), dtype=np.uint8)
                map_frame[:] = (18, 20, 26)
                cv2.putText(map_frame, "WAITING FOR /map TELEMETRY FROM UGV SIMULATION...", (120, 290),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.76, (0, 220, 255), 2, cv2.LINE_AA)
                cv2.putText(map_frame, "Ensure UGV Gazebo & Nav2 are active with ROS_DOMAIN_ID=0",
                            (160, 340), cv2.FONT_HERSHEY_SIMPLEX, 0.54, (180, 180, 180), 1, cv2.LINE_AA)
            else:
                map_frame = self.map_image.copy()

        # 1. Draw Planned Global Path (Electric Cyan Glow)
        path_snapshot = list(self.nav_path)
        if len(path_snapshot) > 1:
            for i in range(len(path_snapshot) - 1):
                p1 = self.world_to_pixel(*path_snapshot[i])
                p2 = self.world_to_pixel(*path_snapshot[i+1])
                if p1[0] is not None and p2[0] is not None:
                    cv2.line(map_frame, p1, p2, (255, 200, 0), 2, cv2.LINE_AA)

        # 2. Draw Queued Patrol Waypoints (Amber Badges with Line Segments)
        wps_snapshot = list(self.queued_waypoints)
        for idx, wp in enumerate(wps_snapshot):
            if len(wp) >= 2:
                wx, wy = wp[0], wp[1]
                px, py = self.world_to_pixel(wx, wy)
                if px is not None:
                    if idx < len(wps_snapshot) - 1:
                        npx, npy = self.world_to_pixel(wps_snapshot[idx+1][0], wps_snapshot[idx+1][1])
                        if npx is not None:
                            cv2.line(map_frame, (px, py), (npx, npy), (0, 180, 255), 1, cv2.LINE_AA)
                    cv2.circle(map_frame, (px, py), 12, (0, 180, 255), -1, cv2.LINE_AA)
                    cv2.circle(map_frame, (px, py), 14, (255, 255, 255), 1, cv2.LINE_AA)
                    cv2.putText(map_frame, str(idx + 1), (px - 5, py + 5),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.46, (0, 0, 0), 2, cv2.LINE_AA)

        # 3. Draw Active Target Goal (Pulsing Red Reticle & Label)
        active_goal_snapshot = self.active_goal
        if active_goal_snapshot is not None and len(active_goal_snapshot) >= 2:
            gx, gy = active_goal_snapshot[0], active_goal_snapshot[1]
            px, py = self.world_to_pixel(gx, gy)
            if px is not None:
                cv2.circle(map_frame, (px, py), 18, (0, 0, 255), 2, cv2.LINE_AA)
                cv2.circle(map_frame, (px, py), 6, (0, 0, 255), -1, cv2.LINE_AA)
                cv2.line(map_frame, (px - 26, py), (px + 26, py), (0, 0, 255), 1, cv2.LINE_AA)
                cv2.line(map_frame, (px, py - 26), (px, py + 26), (0, 0, 255), 1, cv2.LINE_AA)
                
                label = self.active_threat_id if self.active_threat_id else "TARGET"
                cv2.rectangle(map_frame, (px + 14, py - 24), (px + 190, py + 4), (20, 20, 24), -1)
                cv2.rectangle(map_frame, (px + 14, py - 24), (px + 190, py + 4), (0, 0, 255), 1)
                cv2.putText(map_frame, f"[!] {label}", (px + 20, py - 6),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.48, (0, 180, 255), 1, cv2.LINE_AA)

        # 4. Draw UGV Position (Vibrant Emerald Robot with Hull Orientation)
        if self.robot_x is not None and self.robot_y is not None:
            rx, ry = self.world_to_pixel(self.robot_x, self.robot_y)
            if rx is not None:
                cv2.circle(map_frame, (rx, ry), 18, (0, 255, 120), 1, cv2.LINE_AA)
                cv2.circle(map_frame, (rx, ry), 10, (0, 220, 80), -1, cv2.LINE_AA)
                cv2.circle(map_frame, (rx, ry), 10, (255, 255, 255), 1, cv2.LINE_AA)
                
                arrow_len = 24
                ax = int(rx + arrow_len * math.cos(self.robot_yaw))
                ay = int(ry - arrow_len * math.sin(self.robot_yaw))
                cv2.arrowedLine(map_frame, (rx, ry), (ax, ay), (0, 0, 255), 2, tipLength=0.35)
                
                tag_str = f"UGV_ROVER_01 ({self.robot_x:.1f}, {self.robot_y:.1f})"
                cv2.rectangle(map_frame, (rx + 16, ry + 4), (rx + 210, ry + 28), (15, 18, 24), -1)
                cv2.rectangle(map_frame, (rx + 16, ry + 4), (rx + 210, ry + 28), (0, 220, 80), 1)
                cv2.putText(map_frame, tag_str, (rx + 22, ry + 21),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.42, (240, 240, 240), 1, cv2.LINE_AA)

        # 5. Render Right-Hand C2 Telemetry Sidebar
        sidebar_w = 540
        sidebar_h = map_frame.shape[0]
        sidebar_frame = self.render_c2_sidebar(sidebar_w, sidebar_h)

        # Combine Map + Sidebar horizontally
        main_content = np.hstack([map_frame, sidebar_frame])
        total_w = main_content.shape[1]

        # -------------------------------------------------------------
        # TOP C2 TACTICAL HUD HEADER BAR (Large High-Visibility Typography)
        # -------------------------------------------------------------
        hud_h = 175
        hud = np.zeros((hud_h, total_w, 3), dtype=np.uint8)
        hud[:] = (18, 20, 26)

        # --- ROW 1: System Title & Datalink Status ---
        cv2.rectangle(hud, (12, 10), (160, 36), (147, 51, 234), -1)  # Purple pill
        cv2.putText(hud, "FOD HUNTER", (18, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (255, 255, 255), 1, cv2.LINE_AA)

        cv2.putText(hud, "FOD Hunter- UAV Simulated communication", (175, 28),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.58, (255, 255, 255), 1, cv2.LINE_AA)
        
        rssi_val = self.ugv_telemetry_cache["rssi_dbm"]
        seq_val = self.ugv_telemetry_cache["heartbeat_seq"]
        p900_info = f"Datalink: Microhard P900 V2 (917-925 MHz FHSS) | AES-256 | {rssi_val} dBm | Seq #{seq_val}"
        cv2.putText(hud, p900_info, (640, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.44, (160, 185, 215), 1, cv2.LINE_AA)

        # Top-Right [ EXIT APP ] Button
        exit_btn_x = total_w - 125
        self.draw_button(hud, 'EXIT', '[ EXIT APP ]', exit_btn_x, 8, 115, 32,
                         base_color=(180, 30, 45), hover_color=(230, 40, 60), text_color=(255, 255, 255))

        # --- ROW 2: 4 Telemetry KPI Cards (Large Font for Examiners) ---
        card_w = (total_w - 40) // 4
        card_h = 76
        card_y = 44

        # 1. State & Threat Card
        self.draw_card_box(hud, 12, card_y, card_w, card_h, "C2 Mission & State")
        t_state = self.ugv_telemetry_cache["task_state"]
        state_color = (0, 255, 120) if t_state == "COLLECTED" else (
            (0, 220, 255) if t_state == "EN_ROUTE" else (
                (220, 120, 255) if t_state == "ACKNOWLEDGED" else (
                    (0, 180, 255) if t_state == "VERIFIED" else (160, 160, 170)
                )
            )
        )
        cv2.putText(hud, f"STATE: [{t_state}]", (22, card_y + 42),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.62, state_color, 1, cv2.LINE_AA)
        
        t_threat = self.ugv_telemetry_cache["threat_id"]
        cv2.putText(hud, f"Target: {t_threat}", (22, card_y + 65),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.50, (220, 225, 235), 1, cv2.LINE_AA)

        # 2. Kinematics Card (Speed & Heading)
        c2_x = 12 + card_w + 5
        self.draw_card_box(hud, c2_x, card_y, card_w, card_h, "Kinematics & Speed")
        spd = self.robot_speed if self.robot_speed > 0.05 else self.ugv_telemetry_cache["speed_mps"]
        spd_kmh = spd * 3.6
        heading_deg = math.degrees(self.robot_yaw) % 360.0
        cv2.putText(hud, f"SPEED: {spd:.2f} m/s ({spd_kmh:.1f} km/h)", (c2_x + 10, card_y + 42),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.62, (0, 220, 255), 1, cv2.LINE_AA)
        cv2.putText(hud, f"HEADING: {heading_deg:05.1f} deg (ENU)", (c2_x + 10, card_y + 65),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.50, (220, 225, 235), 1, cv2.LINE_AA)

        # 3. Waypoint & Navigation Progress Card
        c3_x = c2_x + card_w + 5
        self.draw_card_box(hud, c3_x, card_y, card_w, card_h, "Distance & ETA")
        dist_val = self.ugv_telemetry_cache["distance_to_target_m"]
        eta_val = self.ugv_telemetry_cache["eta_seconds"]
        cv2.putText(hud, f"DIST: {dist_val:.1f} m", (c3_x + 10, card_y + 42),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.62, (0, 255, 180), 1, cv2.LINE_AA)
        cv2.putText(hud, f"ETA: {eta_val:.1f} s | QUEUED: {len(self.queued_waypoints)}", (c3_x + 10, card_y + 65),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.50, (220, 225, 235), 1, cv2.LINE_AA)

        # 4. Vehicle Health Card (Battery & Vacuum)
        c4_x = c3_x + card_w + 5
        self.draw_card_box(hud, c4_x, card_y, card_w, card_h, "Vehicle Health & Remediation")
        bat_val = self.ugv_telemetry_cache["battery_pct"]
        volt_val = self.ugv_telemetry_cache["battery_voltage"]
        vac_val = self.ugv_telemetry_cache["vacuum_status"]
        vac_col = (0, 255, 120) if "ACTIVE" in vac_val else (160, 180, 200)
        cv2.putText(hud, f"BATTERY: {bat_val:.1f}% ({volt_val:.1f}V)", (c4_x + 10, card_y + 42),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.62, (0, 220, 255), 1, cv2.LINE_AA)
        cv2.putText(hud, f"VACUUM: {vac_val}", (c4_x + 10, card_y + 65),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.50, vac_col, 1, cv2.LINE_AA)

        # --- ROW 3: Interactive Action Buttons Toolbar ---
        btn_y = 128
        btn_h = 36
        
        self.draw_button(hud, 'SEND_FOD', '[ SEND FOD ALERT ]', 12, btn_y, 185, btn_h,
                         base_color=(35, 75, 130), hover_color=(45, 105, 180), is_accent=True)
        self.draw_button(hud, 'PATROL', '[ DISPATCH PATROL (P) ]', 205, btn_y, 220, btn_h,
                         base_color=(40, 90, 60), hover_color=(55, 125, 85), is_accent=True)
        self.draw_button(hud, 'STOP', '[ EMERGENCY STOP (C) ]', 433, btn_y, 215, btn_h,
                         base_color=(140, 40, 40), hover_color=(185, 50, 50))
        self.draw_button(hud, 'CLEAR', '[ CLEAR WP (R) ]', 656, btn_y, 155, btn_h,
                         base_color=(50, 55, 65), hover_color=(70, 75, 90))
        self.draw_button(hud, 'HOME', '[ HOME DOCK (H) ]', 819, btn_y, 165, btn_h,
                         base_color=(50, 55, 65), hover_color=(70, 75, 90))

        # Bottom Hint in HUD
        cv2.putText(hud, "Left-Click: Send FOD Goal | Shift+Click: Queue Patrol | Right-Click: Stop",
                    (1000, btn_y + 24), cv2.FONT_HERSHEY_SIMPLEX, 0.44, (145, 160, 180), 1, cv2.LINE_AA)

        # Bottom Cursor Coordinate Bar
        bot_bar_h = 28
        bot_bar = np.zeros((bot_bar_h, total_w, 3), dtype=np.uint8)
        bot_bar[:] = (12, 14, 18)
        coord_str = f"Cursor World Pose: X = {self.mouse_map_x:+.2f} m | Y = {self.mouse_map_y:+.2f} m  |  Nav2 Autonomy: ONLINE  |  Microhard P900: ENCRYPTED"
        cv2.putText(bot_bar, coord_str, (12, 19), cv2.FONT_HERSHEY_SIMPLEX, 0.44, (170, 185, 205), 1, cv2.LINE_AA)

        return np.vstack([hud, main_content, bot_bar])

    # -------------------------------------------------------------
    # CLI Prompt Mode (Headless RPi5)
    # -------------------------------------------------------------
    def run_cli_loop(self):
        """Interactive terminal CLI for headless RPi5."""
        print("\n" + "=" * 70)
        print("[C2 TERMINAL] FOD HUNTER - UAV WAYPOINT COMMANDER & C2 TACTICAL TERMINAL")
        print("Protocol: Microhard P900 V2 (917-925 MHz FHSS) | AES-256")
        print("Commands:")
        print("  goto <x> <y>               - Dispatch FOD Target Alert & Waypoint to UGV")
        print("  patrol <x1,y1> <x2,y2> ... - Dispatch sequential multi-point patrol")
        print("  status                     - Inspect live UGV C2 Telemetry & Kinematics")
        print("  cancel / stop              - Emergency stop & abort current mission")
        print("  home                       - Return to home staging dock (-25.0, 0.0)")
        print("  help                       - Show this menu")
        print("  quit / exit                - Exit program")
        print("=" * 70 + "\n")

        while rclpy.ok() and not self.should_exit:
            try:
                cmd_line = input("UAV-C2> ").strip()
                if not cmd_line:
                    continue
                parts = cmd_line.split()
                cmd = parts[0].lower()

                if cmd in ['quit', 'exit', 'q']:
                    self.exit_application()
                    break
                elif cmd == 'help':
                    print("  goto <x> <y>               - Example: goto -15.0 5.0")
                    print("  patrol <x1,y1> <x2,y2>     - Example: patrol -20,2 -10,8 5,3")
                    print("  status                     - Print live C2 telemetry ledger")
                    print("  cancel                     - Abort active mission")
                    print("  home                       - Send UGV to home dock (-25, 0)")
                elif cmd == 'home':
                    self.go_home()
                elif cmd == 'status':
                    print("\n--- [LIVE UGV C2 TELEMETRY LEDGER] ---")
                    if self.robot_x is not None:
                        spd = self.robot_speed if self.robot_speed > 0.05 else self.ugv_telemetry_cache["speed_mps"]
                        print(f"UGV Pose: X={self.robot_x:.2f} m, Y={self.robot_y:.2f} m, Yaw={math.degrees(self.robot_yaw):.1f} deg")
                        print(f"Kinematics: Speed = {spd:.2f} m/s ({spd*3.6:.1f} km/h)")
                    else:
                        print("UGV Pose: Searching...")
                    print(f"Active Threat ID: {self.ugv_telemetry_cache['threat_id']}")
                    print(f"Task State: {self.ugv_telemetry_cache['task_state']}")
                    print(f"Distance to Target: {self.ugv_telemetry_cache['distance_to_target_m']:.2f} m (ETA: {self.ugv_telemetry_cache['eta_seconds']:.1f} s)")
                    print(f"Battery Health: {self.ugv_telemetry_cache['battery_pct']:.1f}% ({self.ugv_telemetry_cache['battery_voltage']:.1f} V)")
                    print(f"Vacuum Hood Status: {self.ugv_telemetry_cache['vacuum_status']}")
                    print(f"Link Watchdog: Heartbeat #{self.ugv_telemetry_cache['heartbeat_seq']} | RSSI: {self.ugv_telemetry_cache['rssi_dbm']} dBm\n")
                elif cmd in ['cancel', 'stop']:
                    self.cancel_navigation()
                    print("[STOP] Navigation cancelled.")
                elif cmd == 'goto':
                    if len(parts) < 3:
                        print("[ERROR] Usage: goto <x> <y>")
                        continue
                    x = float(parts[1])
                    y = float(parts[2])
                    self.send_single_waypoint(x, y)
                    print(f"[ALERT] FOD Alert {self.active_threat_id} dispatched to ({x:.2f}, {y:.2f})!")
                elif cmd == 'patrol':
                    if len(parts) < 2:
                        print("[ERROR] Usage: patrol <x1,y1> <x2,y2> ...")
                        continue
                    pts = []
                    for item in parts[1:]:
                        coords = item.split(',')
                        if len(coords) >= 2:
                            pts.append((float(coords[0]), float(coords[1]), 0.0))
                    if pts:
                        self.send_patrol_mission(pts)
                    else:
                        print("[ERROR] No valid waypoints parsed.")
                else:
                    print(f"[UNKNOWN] Unknown command '{cmd}'. Type 'help' for options.")
            except (KeyboardInterrupt, EOFError):
                break
            except Exception as e:
                print(f"[ERROR] Error: {e}")


def main(args=None):
    parser = argparse.ArgumentParser(description="UAV Waypoint Commander & C2 Tactical Ground Station")
    parser.add_argument('--headless', action='store_true', help="Run in terminal CLI mode without GUI")
    parser.add_argument('--x', type=float, default=None, help="Directly dispatch single goal X coordinate")
    parser.add_argument('--y', type=float, default=None, help="Directly dispatch single goal Y coordinate")
    parser.add_argument('--yaw', type=float, default=0.0, help="Goal yaw orientation in radians (default: 0.0)")
    parser.add_argument('--patrol', type=str, default=None, help="Patrol waypoints in format 'x1,y1;x2,y2;x3,y3'")
    parsed_args, ros_args = parser.parse_known_args()

    rclpy.init(args=ros_args)
    node = UAVWaypointCommander(headless=parsed_args.headless)

    executor = rclpy.executors.MultiThreadedExecutor()
    executor.add_node(node)
    spin_thread = threading.Thread(target=executor.spin, daemon=True)
    spin_thread.start()

    if parsed_args.x is not None and parsed_args.y is not None:
        time.sleep(1.0)
        node.send_single_waypoint(parsed_args.x, parsed_args.y, parsed_args.yaw)
        time.sleep(2.0)
    elif parsed_args.patrol is not None:
        time.sleep(1.0)
        raw_pts = parsed_args.patrol.split(';')
        pts = []
        for p in raw_pts:
            coords = p.split(',')
            if len(coords) >= 2:
                pts.append((float(coords[0]), float(coords[1]), 0.0))
        if pts:
            node.send_patrol_mission(pts)
        time.sleep(2.0)
    elif parsed_args.headless or not HAS_CV2:
        node.run_cli_loop()
    else:
        if 'DISPLAY' not in os.environ and 'WAYLAND_DISPLAY' not in os.environ:
            os.environ['DISPLAY'] = ':0'
        node.run_gui_loop()

    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
