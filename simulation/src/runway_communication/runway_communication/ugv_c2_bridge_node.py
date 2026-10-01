#!/usr/bin/env python3
"""
UGV C2 Bridge Node
Implements Phase 1 C2 Structured Telemetry & Task Ledger Protocol from communication.md
1. Ingests simulated UAV FOD target alerts on /c2/target_alert (JSON).
2. Dispatches navigation goals to Nav2 (/navigate_to_pose & /goal_pose).
3. Tracks mission state progression: ACKNOWLEDGED -> EN_ROUTE -> VERIFIED -> COLLECTED.
4. Broadcasts live UGV state telemetry on /c2/ugv_telemetry (JSON) at 2 Hz.
"""

import os
import sys
import json
import time
import math
import hashlib
from datetime import datetime, timezone
import threading

import rclpy
from rclpy.node import Node
from rclpy.action import ActionClient
from rclpy.callback_groups import ReentrantCallbackGroup
from std_msgs.msg import String
from geometry_msgs.msg import PoseStamped, Quaternion, Point
from nav_msgs.msg import Odometry
from action_msgs.msg import GoalStatus
from visualization_msgs.msg import Marker, MarkerArray

try:
    from nav2_msgs.action import NavigateToPose
    HAS_NAV2 = True
except ImportError:
    HAS_NAV2 = False

try:
    import tf2_ros
    HAS_TF2 = True
except ImportError:
    HAS_TF2 = False


def yaw_to_quaternion(yaw: float) -> Quaternion:
    q = Quaternion()
    q.x = 0.0
    q.y = 0.0
    q.z = math.sin(yaw / 2.0)
    q.w = math.cos(yaw / 2.0)
    return q


def quaternion_to_yaw(q) -> float:
    siny_cosp = 2.0 * (q.w * q.z + q.x * q.y)
    cosy_cosp = 1.0 - 2.0 * (q.y * q.y + q.z * q.z)
    return math.atan2(siny_cosp, cosy_cosp)


class UGVC2BridgeNode(Node):
    def __init__(self):
        super().__init__('ugv_c2_bridge_node')
        self.cb_group = ReentrantCallbackGroup()

        # Telemetry & State
        self.ugv_id = "UGV_ROVER_01"
        self.mission_id = "RUNWAY_PATROL_PHASE1"
        self.heartbeat_seq = 0
        self.battery_pct = 95.0
        self.battery_voltage = 24.8
        
        self.robot_x = -25.0
        self.robot_y = 0.0
        self.robot_yaw = 0.0
        self.robot_speed = 0.0
        self.last_pose_time = time.time()
        self.last_pose_x = -25.0
        self.last_pose_y = 0.0

        # Active Task Ledger
        self.active_threat_id = None
        self.task_state = "IDLE"  # IDLE, ACKNOWLEDGED, EN_ROUTE, VERIFIED, COLLECTED
        self.target_x = None
        self.target_y = None
        self.distance_to_target = 0.0
        self.eta_seconds = 0.0
        self.task_start_time = None
        self.current_goal_handle = None

        # Mission Queue & Multi-Target Management
        self.goal_queue = []
        self.active_goal_item = None

        # 1. C2 Alert Subscriber (UAV -> UGV)
        self.alert_sub = self.create_subscription(
            String,
            '/c2/target_alert',
            self.target_alert_callback,
            10,
            callback_group=self.cb_group
        )

        # 2. C2 Telemetry Publisher (UGV -> UAV / Base)
        self.telemetry_pub = self.create_publisher(
            String,
            '/c2/ugv_telemetry',
            10
        )

        # 3. Goal Pose Fallback Publisher
        self.goal_pub = self.create_publisher(
            PoseStamped,
            '/goal_pose',
            10
        )

        # 3b. RViz2 Marker Publisher for Active & Queued Waypoints
        self.marker_pub = self.create_publisher(
            MarkerArray,
            '/c2/queued_waypoints_markers',
            10
        )

        # 4. Nav2 Action Client
        if HAS_NAV2:
            self.nav_client = ActionClient(
                self,
                NavigateToPose,
                '/navigate_to_pose',
                callback_group=self.cb_group
            )
        else:
            self.nav_client = None

        # 5. Odometry backup subscriber
        self.odom_sub = self.create_subscription(
            Odometry,
            '/odom',
            self.odom_callback,
            10,
            callback_group=self.cb_group
        )

        # 6. TF Buffer for global map tracking
        if HAS_TF2:
            self.tf_buffer = tf2_ros.Buffer()
            self.tf_listener = tf2_ros.TransformListener(self.tf_buffer, self)

        # 2 Hz Telemetry & TF broadcast timer
        self.telemetry_timer = self.create_timer(0.5, self.broadcast_telemetry, callback_group=self.cb_group)
        self.tf_timer = self.create_timer(0.05, self.update_pose_from_tf, callback_group=self.cb_group)

        self.get_logger().info("=" * 60)
        self.get_logger().info("📡 UGV C2 Bridge Node Online (Phase 1 Telemetry Active)")
        self.get_logger().info("📥 Subscribed: /c2/target_alert | 📤 Publishing: /c2/ugv_telemetry (2 Hz)")
        self.get_logger().info("=" * 60)

    # -------------------------------------------------------------
    # Callbacks & Alert Handling
    # -------------------------------------------------------------
    def target_alert_callback(self, msg: String):
        try:
            alert = json.loads(msg.data)
            threat_id = alert.get('threat_id', f'FOD_TARGET_{int(time.time()) % 1000:03d}')
            
            # Extract coordinates (metric x,y or georeference)
            target_metric = alert.get('target_metric', {})
            tx = target_metric.get('x')
            ty = target_metric.get('y')

            if tx is None or ty is None:
                # Check top-level coordinates
                tx = alert.get('x', -15.0)
                ty = alert.get('y', 0.0)

            target_yaw = target_metric.get('yaw') if isinstance(target_metric, dict) else None
            anomaly_meta = alert.get('anomaly_metadata', {})
            primary_class = anomaly_meta.get('primary_class', 'FOD')
            sub_class = anomaly_meta.get('sub_class', 'unknown')
            priority = alert.get('priority_level', 'NORMAL')

            goal_item = {
                'threat_id': threat_id,
                'x': float(tx),
                'y': float(ty),
                'yaw': float(target_yaw) if target_yaw is not None else None,
                'class': f"{primary_class} / {sub_class}",
                'priority': priority
            }

            self.get_logger().info(
                f"🚨 [C2 ALERT INGESTED] Threat: {threat_id} at ({tx:.2f}, {ty:.2f}) | "
                f"Class: {goal_item['class']} | Priority: {priority}"
            )

            # Check if rover is currently busy executing another target
            if self.task_state in ["EN_ROUTE", "VERIFIED"] and self.active_threat_id is not None:
                # Add to queue
                self.goal_queue.append(goal_item)
                self.get_logger().info(
                    f"📋 [MISSION QUEUE] UGV is busy with {self.active_threat_id}. "
                    f"Added {threat_id} to queue (Position #{len(self.goal_queue)} in queue)."
                )
                self.publish_queue_markers()
            else:
                # Free or idle -> Execute immediately
                self.execute_mission_goal(goal_item)

        except Exception as e:
            self.get_logger().error(f"Failed to parse C2 target alert: {e}")

    def execute_mission_goal(self, goal_item: dict):
        """Execute a goal (either immediately or popped from queue)."""
        self.active_goal_item = goal_item
        self.active_threat_id = goal_item['threat_id']
        self.target_x = goal_item['x']
        self.target_y = goal_item['y']
        self.task_state = "ACKNOWLEDGED"
        self.task_start_time = time.time()

        self.get_logger().info(f"🚀 [DISPATCH] Driving to {self.active_threat_id} at ({self.target_x:.2f}, {self.target_y:.2f})")
        self.dispatch_nav_goal(self.target_x, self.target_y, goal_item['yaw'])
        self.publish_queue_markers()

    def dispatch_nav_goal(self, gx: float, gy: float, target_yaw: float = None):
        """Dispatch goal to Nav2."""
        if target_yaw is not None:
            yaw = float(target_yaw)
        elif gx <= -24.0:
            # Home/Docking bay: face outward (+X East, 0.0 rad) so rover reverses into bay
            yaw = 0.0
        elif self.robot_x is not None:
            yaw = math.atan2(gy - self.robot_y, gx - self.robot_x)
        else:
            yaw = 0.0

        pose_msg = PoseStamped()
        pose_msg.header.frame_id = 'map'
        pose_msg.header.stamp = self.get_clock().now().to_msg()
        pose_msg.pose.position.x = gx
        pose_msg.pose.position.y = gy
        pose_msg.pose.position.z = 0.0
        pose_msg.pose.orientation = yaw_to_quaternion(yaw)

        # Fallback publish on topic
        self.goal_pub.publish(pose_msg)
        self.task_state = "EN_ROUTE"

        if self.nav_client is not None and self.nav_client.server_is_ready():
            goal_msg = NavigateToPose.Goal()
            goal_msg.pose = pose_msg
            send_future = self.nav_client.send_goal_async(
                goal_msg,
                feedback_callback=self.nav_feedback_cb
            )
            send_future.add_done_callback(self.goal_response_cb)
        else:
            self.get_logger().info("📡 Nav2 Action server not connected. Sent via /goal_pose topic.")

    def nav_feedback_cb(self, feedback_msg):
        fb = feedback_msg.feedback
        self.distance_to_target = fb.distance_remaining
        # Estimate ETA based on average 1.5 m/s speed
        self.eta_seconds = max(1.0, self.distance_to_target / 1.2)

    def goal_response_cb(self, future):
        goal_handle = future.result()
        if not goal_handle.accepted:
            self.get_logger().warn(f"Goal for {self.active_threat_id} rejected by Nav2.")
            return

        self.current_goal_handle = goal_handle
        self.task_state = "EN_ROUTE"
        result_future = goal_handle.get_result_async()
        result_future.add_done_callback(self.goal_result_cb)

    def goal_result_cb(self, future):
        status = future.result().status
        if status == GoalStatus.STATUS_SUCCEEDED:
            self.get_logger().info(f"🎯 [VERIFICATION] Arrived at {self.active_threat_id}. Verifying & Remediating FOD...")
            self.task_state = "VERIFIED"
            # Simulate active physical clearance sequence (vacuum activation)
            threading.Timer(2.0, self.complete_remediation).start()
        elif status == GoalStatus.STATUS_CANCELED:
            if self.task_state == "EN_ROUTE":
                self.task_state = "CANCELLED"
                self.active_threat_id = None
                self.publish_queue_markers()
        else:
            self.task_state = "FAILED"
            self.active_threat_id = None
            self.publish_queue_markers()

    def complete_remediation(self):
        """Simulate clearance module completion and advance the queue."""
        finished_threat = self.active_threat_id
        self.get_logger().info(f"✅ [REMEDIATION COMPLETE] {finished_threat} successfully COLLECTED!")
        self.task_state = "COLLECTED"

        # Check if there are queued targets waiting!
        if len(self.goal_queue) > 0:
            next_goal = self.goal_queue.pop(0)
            self.get_logger().info(
                f"🔄 [AUTO-ADVANCE] Advancing to next queued target: {next_goal['threat_id']} at ({next_goal['x']:.2f}, {next_goal['y']:.2f}). "
                f"Remaining in queue: {len(self.goal_queue)}"
            )
            # 1-second transition pause before dispatching next goal
            threading.Timer(1.0, lambda: self.execute_mission_goal(next_goal)).start()
        else:
            self.active_goal_item = None
            self.publish_queue_markers()
            # Reset to IDLE after 5 seconds
            threading.Timer(5.0, self.reset_task_idle).start()

    def reset_task_idle(self):
        if self.task_state == "COLLECTED" and len(self.goal_queue) == 0:
            self.task_state = "IDLE"
            self.active_threat_id = None
            self.publish_queue_markers()

    def publish_queue_markers(self):
        """Publish 3D visualization markers for active & queued waypoints in RViz2."""
        marker_array = MarkerArray()
        stamp = self.get_clock().now().to_msg()

        # Delete all previous markers to prevent stale artifacts
        clear_marker = Marker()
        clear_marker.action = Marker.DELETEALL
        marker_array.markers.append(clear_marker)

        pts_for_line = []
        if self.robot_x is not None and self.robot_y is not None:
            p_rob = Point()
            p_rob.x = float(self.robot_x)
            p_rob.y = float(self.robot_y)
            p_rob.z = 0.05
            pts_for_line.append(p_rob)

        marker_id = 1

        # 1. Active Target Marker (Gold / Amber cylinder + floating text)
        if self.target_x is not None and self.target_y is not None and self.active_threat_id is not None:
            # Active cylinder marker
            m = Marker()
            m.header.frame_id = 'map'
            m.header.stamp = stamp
            m.ns = 'active_target'
            m.id = marker_id
            marker_id += 1
            m.type = Marker.CYLINDER
            m.action = Marker.ADD
            m.pose.position.x = float(self.target_x)
            m.pose.position.y = float(self.target_y)
            m.pose.position.z = 0.2
            m.pose.orientation.w = 1.0
            m.scale.x = 0.6
            m.scale.y = 0.6
            m.scale.z = 0.4
            m.color.r = 1.0
            m.color.g = 0.75
            m.color.b = 0.0
            m.color.a = 0.85
            marker_array.markers.append(m)

            # Active text label
            txt = Marker()
            txt.header.frame_id = 'map'
            txt.header.stamp = stamp
            txt.ns = 'active_label'
            txt.id = marker_id
            marker_id += 1
            txt.type = Marker.TEXT_VIEW_FACING
            txt.action = Marker.ADD
            txt.pose.position.x = float(self.target_x)
            txt.pose.position.y = float(self.target_y)
            txt.pose.position.z = 0.8
            txt.scale.z = 0.45
            txt.color.r = 1.0
            txt.color.g = 1.0
            txt.color.b = 1.0
            txt.color.a = 1.0
            txt.text = f"🎯 [ACTIVE] {self.active_threat_id}"
            marker_array.markers.append(txt)

            pt_act = Point()
            pt_act.x = float(self.target_x)
            pt_act.y = float(self.target_y)
            pt_act.z = 0.05
            pts_for_line.append(pt_act)

        # 2. Queued Targets (Cyan cylinders + floating queue numbers)
        for i, q_item in enumerate(self.goal_queue):
            qx = float(q_item['x'])
            qy = float(q_item['y'])

            qm = Marker()
            qm.header.frame_id = 'map'
            qm.header.stamp = stamp
            qm.ns = 'queued_targets'
            qm.id = marker_id
            marker_id += 1
            qm.type = Marker.CYLINDER
            qm.action = Marker.ADD
            qm.pose.position.x = qx
            qm.pose.position.y = qy
            qm.pose.position.z = 0.15
            qm.pose.orientation.w = 1.0
            qm.scale.x = 0.5
            qm.scale.y = 0.5
            qm.scale.z = 0.3
            qm.color.r = 0.0
            qm.color.g = 0.85
            qm.color.b = 1.0
            qm.color.a = 0.80
            marker_array.markers.append(qm)

            q_txt = Marker()
            q_txt.header.frame_id = 'map'
            q_txt.header.stamp = stamp
            q_txt.ns = 'queued_labels'
            q_txt.id = marker_id
            marker_id += 1
            q_txt.type = Marker.TEXT_VIEW_FACING
            q_txt.action = Marker.ADD
            q_txt.pose.position.x = qx
            q_txt.pose.position.y = qy
            q_txt.pose.position.z = 0.7
            q_txt.scale.z = 0.4
            q_txt.color.r = 0.9
            q_txt.color.g = 0.9
            q_txt.color.b = 1.0
            q_txt.color.a = 1.0
            q_txt.text = f"⏳ [#{i+1}] {q_item['threat_id']}"
            marker_array.markers.append(q_txt)

            pt_q = Point()
            pt_q.x = qx
            pt_q.y = qy
            pt_q.z = 0.05
            pts_for_line.append(pt_q)

        # 3. Connecting Breadcrumb Line Strip (shows the sequence in space)
        if len(pts_for_line) >= 2:
            line = Marker()
            line.header.frame_id = 'map'
            line.header.stamp = stamp
            line.ns = 'queue_breadcrumbs'
            line.id = marker_id
            marker_id += 1
            line.type = Marker.LINE_STRIP
            line.action = Marker.ADD
            line.scale.x = 0.08
            line.color.r = 1.0
            line.color.g = 0.85
            line.color.b = 0.2
            line.color.a = 0.7
            line.points = pts_for_line
            marker_array.markers.append(line)

        self.marker_pub.publish(marker_array)

    # -------------------------------------------------------------
    # State & Pose Tracking
    # -------------------------------------------------------------
    def odom_callback(self, msg: Odometry):
        if not HAS_TF2:
            self.robot_x = msg.pose.pose.position.x
            self.robot_y = msg.pose.pose.position.y
            self.robot_yaw = quaternion_to_yaw(msg.pose.pose.orientation)
            self.compute_distance_to_goal()

    def update_pose_from_tf(self):
        if not HAS_TF2:
            return
        try:
            for child_frame in ['base_link', 'base_footprint', 'chassis_link']:
                if self.tf_buffer.can_transform('map', child_frame, rclpy.time.Time()):
                    t = self.tf_buffer.lookup_transform('map', child_frame, rclpy.time.Time())
                    curr_x = t.transform.translation.x
                    curr_y = t.transform.translation.y
                    curr_t = time.time()
                    dt = curr_t - self.last_pose_time
                    if dt > 0.05:
                        dx = curr_x - self.last_pose_x
                        dy = curr_y - self.last_pose_y
                        inst_spd = math.hypot(dx, dy) / dt
                        self.robot_speed = 0.8 * self.robot_speed + 0.2 * inst_spd
                        self.last_pose_x = curr_x
                        self.last_pose_y = curr_y
                        self.last_pose_time = curr_t

                    self.robot_x = curr_x
                    self.robot_y = curr_y
                    self.robot_yaw = quaternion_to_yaw(t.transform.rotation)
                    self.compute_distance_to_goal()
                    break
        except Exception:
            pass

    def compute_distance_to_goal(self):
        if self.target_x is not None and self.target_y is not None:
            dx = self.target_x - self.robot_x
            dy = self.target_y - self.robot_y
            self.distance_to_target = math.sqrt(dx*dx + dy*dy)
            self.eta_seconds = max(0.5, self.distance_to_target / max(0.5, self.robot_speed if self.robot_speed > 0.3 else 1.2))
            
            # If distance < 0.6m and topic-only mode, trigger arrived
            if self.task_state == "EN_ROUTE" and self.distance_to_target < 0.6:
                self.task_state = "VERIFIED"
                threading.Timer(2.0, self.complete_remediation).start()

    # -------------------------------------------------------------
    # Periodic Telemetry Broadcast (Uplink to UAV / Base)
    # -------------------------------------------------------------
    def broadcast_telemetry(self):
        self.heartbeat_seq += 1
        # Slowly deplete battery during operation for realism
        if self.task_state == "EN_ROUTE":
            self.battery_pct = max(10.0, self.battery_pct - 0.005)
            self.battery_voltage = 22.0 + (self.battery_pct / 100.0) * 3.2

        # Periodically refresh RViz2 markers for live robot breadcrumb line
        self.publish_queue_markers()

        # Create Section 3.2 Compliant JSON Payload
        now_utc = datetime.now(timezone.utc).isoformat()
        
        telemetry_dict = {
            "mission_id": self.mission_id,
            "timestamp_utc": now_utc,
            "source_agent_id": self.ugv_id,
            "target_ack": {
                "threat_id": self.active_threat_id if self.active_threat_id else "NONE",
                "task_state": self.task_state,
                "queued_goals_count": len(self.goal_queue),
                "distance_to_target_m": round(self.distance_to_target, 2),
                "eta_seconds": round(self.eta_seconds, 1)
            },
            "vehicle_telemetry": {
                "pose_metric": {
                    "x": round(self.robot_x, 2),
                    "y": round(self.robot_y, 2),
                    "heading_deg": round(math.degrees(self.robot_yaw), 1)
                },
                "speed_mps": round(self.robot_speed, 2),
                "speed_kmh": round(self.robot_speed * 3.6, 1),
                "battery_pct": round(self.battery_pct, 1),
                "battery_state_pct": round(self.battery_pct, 1),
                "battery_voltage_v": round(self.battery_voltage, 1),
                "vacuum_hood_status": "ACTIVE_SUCTION" if self.task_state in ["VERIFIED", "COLLECTED"] else "READY_STANDBY",
                "mode": "AUTONOMOUS_NAV2",
                "operational_mode": "AUTONOMOUS_NAV2"
            },
            "link_watchdog": {
                "heartbeat_seq": self.heartbeat_seq,
                "heartbeat_sequence": self.heartbeat_seq,
                "rssi_dbm": -64
            },
            "signature": hashlib.sha256(f"{now_utc}-{self.heartbeat_seq}".encode()).hexdigest(),
            "cryptographic_signature": hashlib.sha256(f"{now_utc}-{self.heartbeat_seq}".encode()).hexdigest()
        }

        msg = String()
        msg.data = json.dumps(telemetry_dict)
        self.telemetry_pub.publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = UGVC2BridgeNode()
    try:
        rclpy.spin(node)
    except (KeyboardInterrupt, rclpy.executors.ExternalShutdownException):
        pass
    finally:
        node.destroy_node()
        if rclpy.ok():
            rclpy.shutdown()


if __name__ == '__main__':
    main()
