#!/usr/bin/env python3
"""
==============================================================================
🎮 Autonomous UGV Keyboard Waypoint Commander (Demo Video Tool)
==============================================================================
Controls the AgileX Scout 2.0 UGV in the runway simulation using keys 1-5.

Starting Position:
  UGV starts at: (-25.0, 0.0, 0.0)

Key Mappings:
  [1] -> Waypoint 1: (-10.0,  0.0,  0.00)  [Forward Sprint down Centerline]
  [2] -> Waypoint 2: (  5.0, -1.0, -0.20)  [Mid-Runway Progression]
  [3] -> Waypoint 3: ( 20.0, -3.5, -0.20)  [Downfield Station]
  [4] -> Waypoint 4: (  0.0,  3.5,  3.14)  [Lane Shift & Arc Turn]
  [5] -> Waypoint 5: (-25.0,  0.0,  0.00)  [Return to Start (-25, 0)]

Additional Controls:
  [SPACE / S] -> Emergency Stop / Cancel Navigation immediately
  [R / H]     -> Return Home to (-25.0, 0.0, 0.0)
  [P]         -> Auto Patrol sequence (visits 1 -> 2 -> 3 -> 4 -> 5)
  [Q]         -> Quit
==============================================================================
"""

import os
import sys
import time
import math
import json
import select
import tty
import termios
import threading
import argparse
import hashlib
from datetime import datetime, timezone

import rclpy
from rclpy.node import Node
from rclpy.action import ActionClient
from rclpy.callback_groups import ReentrantCallbackGroup
from rclpy.qos import QoSProfile, ReliabilityPolicy, DurabilityPolicy, HistoryPolicy

from std_msgs.msg import String, ColorRGBA
from geometry_msgs.msg import PoseStamped, Point, Quaternion, Twist, Vector3
from nav_msgs.msg import Odometry
from visualization_msgs.msg import Marker, MarkerArray

try:
    from nav2_msgs.action import NavigateToPose
    from action_msgs.msg import GoalStatus
    HAS_NAV2 = True
except ImportError:
    HAS_NAV2 = False
    NavigateToPose = None
    GoalStatus = None


# ==============================================================================
# 🎯 WAYPOINT PRESETS
# ==============================================================================
# 1. NUS EA Field Waypoints (Centered at world origin, bounds ~ ±26m x ±14m)
NUS_WAYPOINTS = {
    '1': {
        'threat_id': 'FOD_THREAT_001',
        'object': 'screw',
        'confidence': 0.96,
        'name': 'FOD_THREAT_001 (screw)',
        'x': -15.0,
        'y': 5.0,
        'yaw': 0.0,
        'desc': 'FOD_THREAT_001 (screw) at (-15.0, 5.0)'
    },
    '2': {
        'threat_id': 'FOD_THREAT_002',
        'object': 'wrench',
        'confidence': 0.92,
        'name': 'FOD_THREAT_002 (wrench)',
        'x': -5.0,
        'y': 2.0,
        'yaw': 0.0,
        'desc': 'FOD_THREAT_002 (wrench) at (-5.0, 2.0)'
    },
    '3': {
        'threat_id': 'FOD_THREAT_002_CLUSTER',
        'object': 'metal_wire',
        'confidence': 0.89,
        'name': 'FOD_THREAT_002_CLUSTER (wire)',
        'x': -6.2,
        'y': 2.0,
        'yaw': 0.0,
        'desc': 'FOD_THREAT_002_CLUSTER (metal_wire) at (-6.2, 2.0)'
    },
    '4': {
        'threat_id': 'FOD_THREAT_003',
        'object': 'bolt',
        'confidence': 0.98,
        'name': 'FOD_THREAT_003 (bolt)',
        'x': -20.0,
        'y': 2.0,
        'yaw': 0.0,
        'desc': 'FOD_THREAT_003 (bolt) at (-20.0, 2.0)'
    },
    '5': {
        'threat_id': 'FOD_THREAT_004',
        'object': 'aircraft_hardware',
        'confidence': 0.95,
        'name': 'FOD_THREAT_004 (hardware)',
        'x': 0.0,
        'y': 0.0,
        'yaw': 0.0,
        'desc': 'FOD_THREAT_004 (hardware) at (0.0, 0.0)'
    },
}

# 2. Airport Runway Waypoints
RUNWAY_WAYPOINTS = {
    '1': {
        'threat_id': 'FOD_THREAT_001',
        'object': 'screw',
        'confidence': 0.96,
        'name': 'FOD_THREAT_001 (screw)',
        'x': -7.57,
        'y': -29.64,
        'yaw': 1.31,
        'desc': 'FOD_THREAT_001 (screw) at (-7.57, -29.64)'
    },
    '2': {
        'threat_id': 'FOD_THREAT_002',
        'object': 'wrench',
        'confidence': 0.92,
        'name': 'FOD_THREAT_002 (wrench)',
        'x': -2.92,
        'y': -11.94,
        'yaw': 0.14,
        'desc': 'FOD_THREAT_002 (wrench) at (-2.92, -11.94)'
    },
    '3': {
        'threat_id': 'FOD_THREAT_003',
        'object': 'metal_wire',
        'confidence': 0.89,
        'name': 'FOD_THREAT_003 (metal_wire)',
        'x': 39.63,
        'y': -5.93,
        'yaw': 2.90,
        'desc': 'FOD_THREAT_003 (metal_wire) at (39.63, -5.93)'
    },
    '4': {
        'threat_id': 'FOD_THREAT_004',
        'object': 'bolt',
        'confidence': 0.98,
        'name': 'FOD_THREAT_004 (bolt)',
        'x': 15.83,
        'y': 0.06,
        'yaw': 3.13,
        'desc': 'FOD_THREAT_004 (bolt) at (15.83, 0.06)'
    },
    '5': {
        'threat_id': 'FOD_THREAT_005',
        'object': 'aircraft_hardware',
        'confidence': 0.95,
        'name': 'FOD_THREAT_005 (aircraft_hardware)',
        'x': 7.75,
        'y': 0.15,
        'yaw': 3.14,
        'desc': 'FOD_THREAT_005 (aircraft_hardware) at (7.75, 0.15)'
    },
}

DEFAULT_WAYPOINTS = NUS_WAYPOINTS
START_POSE = {'x': -25.0, 'y': 0.0, 'yaw': 0.0}


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


class KeyboardWaypointCommander(Node):
    def __init__(self, waypoints: dict, enable_c2: bool = True, world_name: str = 'nus'):
        super().__init__('keyboard_waypoint_commander')
        self.cb_group = ReentrantCallbackGroup()
        self.waypoints = waypoints
        self.enable_c2 = enable_c2
        self.world_name = world_name

        # Robot live state
        self.robot_x = START_POSE['x']
        self.robot_y = START_POSE['y']
        self.robot_yaw = START_POSE['yaw']
        self.robot_speed = 0.0
        self.pose_received = False

        # Active goal tracking
        self.active_goal_key = None
        self.active_goal_handle = None
        self.active_target_x = None
        self.active_target_y = None
        self.active_target_yaw = None
        self.active_goal_status = "IDLE"
        self.distance_remaining = 0.0
        self.nav_start_time = None
        self.eta_seconds = 0.0

        # Auto Patrol sequence state
        self.patrol_active = False
        self.patrol_queue = []
        self.last_uav_alert = None

        # 1. Nav2 NavigateToPose Action Client
        if HAS_NAV2:
            self.nav_client = ActionClient(
                self,
                NavigateToPose,
                '/navigate_to_pose',
                callback_group=self.cb_group
            )
        else:
            self.nav_client = None

        # 2. Goal Pose Fallback Publisher
        self.goal_pub = self.create_publisher(PoseStamped, '/goal_pose', 10)

        # 3. Emergency Stop Velocity Publisher
        self.cmd_vel_pub = self.create_publisher(Twist, '/cmd_vel', 10)

        # 4. RViz Marker Publisher for active visual feedback
        self.marker_pub = self.create_publisher(MarkerArray, '/keyboard_waypoint_marker', 10)

        # 5. C2 Target Alert Publisher (to trigger C2 bridge & telemetry HUD)
        qos_latched = QoSProfile(
            reliability=ReliabilityPolicy.RELIABLE,
            durability=DurabilityPolicy.TRANSIENT_LOCAL,
            history=HistoryPolicy.KEEP_LAST,
            depth=10
        )
        self.c2_alert_pub = self.create_publisher(String, '/c2/target_alert', qos_latched)

        # 6. Odometry subscribers (Global EKF / Local EKF / Odom)
        self.create_subscription(Odometry, '/odometry/global', self.odom_cb, 10, callback_group=self.cb_group)
        self.create_subscription(Odometry, '/odometry/local', self.odom_cb, 10, callback_group=self.cb_group)
        self.create_subscription(Odometry, '/odom', self.odom_cb, 10, callback_group=self.cb_group)

        # Publish initial static waypoint markers in RViz
        self.create_timer(1.0, self.publish_all_waypoint_markers, callback_group=self.cb_group)

    def odom_cb(self, msg: Odometry):
        pos = msg.pose.pose.position
        ori = msg.pose.pose.orientation
        self.robot_x = pos.x
        self.robot_y = pos.y
        self.robot_yaw = quaternion_to_yaw(ori)
        vx = msg.twist.twist.linear.x
        vy = msg.twist.twist.linear.y
        self.robot_speed = math.hypot(vx, vy)
        self.pose_received = True

        if self.active_target_x is not None:
            self.distance_remaining = math.hypot(
                self.active_target_x - self.robot_x,
                self.active_target_y - self.robot_y
            )
            speed = max(0.5, self.robot_speed)
            self.eta_seconds = self.distance_remaining / speed

    def send_waypoint(self, key: str):
        if key not in self.waypoints:
            return

        wp = self.waypoints[key]
        gx = float(wp['x'])
        gy = float(wp['y'])
        gyaw = float(wp['yaw'])
        threat_id = wp.get('threat_id', f"FOD_THREAT_{int(key):03d}")
        obj = wp.get('object', 'debris')
        conf = float(wp.get('confidence', 0.95))
        lat = 1.300000 + (gy / 111320.0)
        lon = 103.770000 + (gx / 111320.0)
        now_time_str = datetime.now().strftime("%H:%M:%S")

        self.last_uav_alert = {
            'idx': key,
            'threat_id': threat_id,
            'object': obj,
            'confidence': conf,
            'x': gx,
            'y': gy,
            'yaw': gyaw,
            'lat': lat,
            'lon': lon,
            'time': now_time_str
        }

        self.active_goal_key = key
        self.active_target_x = gx
        self.active_target_y = gy
        self.active_target_yaw = gyaw
        self.active_goal_status = "DISPATCHING"
        self.distance_remaining = math.hypot(gx - self.robot_x, gy - self.robot_y)
        self.nav_start_time = time.time()

        # 1. Send Goal via Nav2 Action
        pose_msg = PoseStamped()
        pose_msg.header.frame_id = 'map'
        pose_msg.header.stamp = self.get_clock().now().to_msg()
        pose_msg.pose.position.x = gx
        pose_msg.pose.position.y = gy
        pose_msg.pose.position.z = 0.0
        pose_msg.pose.orientation = yaw_to_quaternion(gyaw)

        # Fallback topic publish
        self.goal_pub.publish(pose_msg)

        if self.nav_client is not None:
            if not self.nav_client.server_is_ready():
                # Try non-blocking wait or check
                self.nav_client.wait_for_server(timeout_sec=0.2)

            if self.nav_client.server_is_ready():
                # Cancel existing goal if any
                if self.active_goal_handle is not None:
                    try:
                        self.active_goal_handle.cancel_goal_async()
                    except Exception:
                        pass

                goal_msg = NavigateToPose.Goal()
                goal_msg.pose = pose_msg
                send_future = self.nav_client.send_goal_async(
                    goal_msg,
                    feedback_callback=self.nav_feedback_cb
                )
                send_future.add_done_callback(self.goal_response_cb)
            else:
                self.active_goal_status = "SENT_TOPIC_ONLY"
        else:
            self.active_goal_status = "SENT_TOPIC_ONLY"

        # 2. Publish active visual highlight marker (named FOD_THREAT_001 etc.)
        self.publish_active_marker(key, gx, gy, gyaw, wp)

        # 3. Publish C2 Target Alert (matches DemoComs_C2.py UAV alert structure)
        if self.enable_c2:
            self.publish_c2_alert(key, gx, gy, gyaw, wp)

    def publish_c2_alert(self, key: str, gx: float, gy: float, yaw: float, wp: dict):
        now_utc = datetime.now(timezone.utc).isoformat()
        threat_id = wp.get('threat_id', f"FOD_THREAT_{int(key):03d}")
        obj = wp.get('object', 'debris')
        conf = float(wp.get('confidence', 0.96))
        lat = 1.300000 + (gy / 111320.0)
        lon = 103.770000 + (gx / 111320.0)

        payload = {
            "threat_id": threat_id,
            "timestamp_utc": now_utc,
            "source_agent_id": "UAV_ALPHA_01",
            "mission_id": "RUNWAY_PATROL_PHASE1",
            "anomaly_metadata": {
                "primary_class": "FOD",
                "sub_class": obj,
                "confidence_score": conf
            },
            "target_georeference": {
                "latitude_deg": lat,
                "longitude_deg": lon,
                "altitude_msl_m": 15.0
            },
            "target_metric": {
                "x": round(gx, 2),
                "y": round(gy, 2),
                "z": 0.0,
                "yaw": round(yaw, 2)
            },
            "priority_level": "HIGH_ACTIVE_REMEDIATION",
            "suggested_action": "AUTONOMOUS_INTERCEPT_AND_VACUUM",
            "override_queue": True,
            "signature": hashlib.sha256(f"{now_utc}-{threat_id}-{gx}-{gy}".encode()).hexdigest()
        }
        msg = String()
        msg.data = json.dumps(payload)
        self.c2_alert_pub.publish(msg)

    def nav_feedback_cb(self, feedback_msg):
        fb = feedback_msg.feedback
        self.distance_remaining = fb.distance_remaining
        speed = max(0.5, self.robot_speed)
        self.eta_seconds = max(0.5, self.distance_remaining / speed)
        self.active_goal_status = "EN_ROUTE"

    def goal_response_cb(self, future):
        try:
            goal_handle = future.result()
            if not goal_handle.accepted:
                self.active_goal_status = "REJECTED"
                return

            self.active_goal_handle = goal_handle
            self.active_goal_status = "EN_ROUTE"
            result_future = goal_handle.get_result_async()
            result_future.add_done_callback(self.goal_result_cb)
        except Exception as e:
            self.active_goal_status = f"ERR: {e}"

    def goal_result_cb(self, future):
        try:
            result = future.result()
            status = result.status
            if status == 4:  # STATUS_SUCCEEDED
                self.active_goal_status = "REACHED_SUCCESS"
                # If patrol is active, pop next
                if self.patrol_active and len(self.patrol_queue) > 0:
                    next_k = self.patrol_queue.pop(0)
                    time.sleep(1.0)
                    self.send_waypoint(next_k)
                elif self.patrol_active:
                    self.patrol_active = False
            elif status == 5:  # STATUS_CANCELED
                self.active_goal_status = "CANCELLED"
            elif status == 6:  # STATUS_ABORTED
                self.active_goal_status = "ABORTED"
            else:
                self.active_goal_status = f"FINISHED_{status}"
        except Exception as e:
            self.active_goal_status = f"ERR: {e}"

    def emergency_stop(self):
        """Immediately halts robot and cancels goal."""
        self.patrol_active = False
        self.patrol_queue.clear()

        # 1. Cancel Nav2 action goal
        if self.active_goal_handle is not None:
            try:
                self.active_goal_handle.cancel_goal_async()
            except Exception:
                pass
            self.active_goal_handle = None

        # 2. Send immediate zero velocity
        stop_cmd = Twist()
        for _ in range(5):
            self.cmd_vel_pub.publish(stop_cmd)
            time.sleep(0.02)

        # 3. Notify C2 bridge
        if self.enable_c2:
            now_utc = datetime.now(timezone.utc).isoformat()
            abort_payload = {
                "threat_id": "EMERGENCY_STOP",
                "timestamp_utc": now_utc,
                "priority_level": "STOP",
                "suggested_action": "STOP"
            }
            msg = String()
            msg.data = json.dumps(abort_payload)
            self.c2_alert_pub.publish(msg)

        self.active_goal_status = "EMERGENCY_STOPPED"
        self.active_goal_key = None

    def start_patrol_sequence(self):
        """Dispatches Waypoint 1, and queues 2, 3, 4, 5."""
        self.patrol_active = True
        self.patrol_queue = ['2', '3', '4', '5']
        self.send_waypoint('1')

    def publish_active_marker(self, key: str, x: float, y: float, yaw: float, wp: dict):
        arr = MarkerArray()
        stamp = self.get_clock().now().to_msg()
        threat_id = wp.get('threat_id', f"FOD_THREAT_{int(key):03d}")

        # 1. Base Ring / Cylinder
        base = Marker()
        base.header.frame_id = 'map'
        base.header.stamp = stamp
        base.ns = 'active_waypoint'
        base.id = 100
        base.type = Marker.CYLINDER
        base.action = Marker.ADD
        base.pose.position.x = x
        base.pose.position.y = y
        base.pose.position.z = 0.05
        base.scale.x = 1.2
        base.scale.y = 1.2
        base.scale.z = 0.10
        base.color = ColorRGBA(r=0.0, g=1.0, b=0.4, a=0.85)
        arr.markers.append(base)

        # 2. Heading Arrow
        arrow = Marker()
        arrow.header.frame_id = 'map'
        arrow.header.stamp = stamp
        arrow.ns = 'active_waypoint'
        arrow.id = 101
        arrow.type = Marker.ARROW
        arrow.action = Marker.ADD
        arrow.pose.position.x = x
        arrow.pose.position.y = y
        arrow.pose.position.z = 0.15
        arrow.pose.orientation = yaw_to_quaternion(yaw)
        arrow.scale.x = 1.5  # Length
        arrow.scale.y = 0.25 # Width
        arrow.scale.z = 0.25 # Height
        arrow.color = ColorRGBA(r=1.0, g=0.85, b=0.0, a=1.0)
        arr.markers.append(arrow)

        # 3. Text Label (Displaying threat_id, e.g. FOD_THREAT_001)
        text = Marker()
        text.header.frame_id = 'map'
        text.header.stamp = stamp
        text.ns = 'active_waypoint'
        text.id = 102
        text.type = Marker.TEXT_VIEW_FACING
        text.action = Marker.ADD
        text.pose.position.x = x
        text.pose.position.y = y
        text.pose.position.z = 1.2
        text.scale.z = 0.65
        text.color = ColorRGBA(r=1.0, g=1.0, b=1.0, a=1.0)
        text.text = f"🎯 {threat_id}"
        arr.markers.append(text)

        self.marker_pub.publish(arr)

    def publish_all_waypoint_markers(self):
        """Draws numbered pins for all 5 preset waypoints on RViz map named FOD_THREAT_001 etc."""
        arr = MarkerArray()
        stamp = self.get_clock().now().to_msg()

        for k, wp in self.waypoints.items():
            idx = int(k)
            threat_id = wp.get('threat_id', f"FOD_THREAT_{idx:03d}")
            # Cylinder pin
            pin = Marker()
            pin.header.frame_id = 'map'
            pin.header.stamp = stamp
            pin.ns = 'preset_waypoints'
            pin.id = idx
            pin.type = Marker.CYLINDER
            pin.action = Marker.ADD
            pin.pose.position.x = wp['x']
            pin.pose.position.y = wp['y']
            pin.pose.position.z = 0.02
            pin.scale.x = 0.8
            pin.scale.y = 0.8
            pin.scale.z = 0.04
            pin.color = ColorRGBA(r=0.2, g=0.6, b=1.0, a=0.6)
            arr.markers.append(pin)

            # Floating text
            txt = Marker()
            txt.header.frame_id = 'map'
            txt.header.stamp = stamp
            txt.ns = 'preset_waypoint_labels'
            txt.id = idx
            txt.type = Marker.TEXT_VIEW_FACING
            txt.action = Marker.ADD
            txt.pose.position.x = wp['x']
            txt.pose.position.y = wp['y']
            txt.pose.position.z = 0.6
            txt.scale.z = 0.45
            txt.color = ColorRGBA(r=0.8, g=0.9, b=1.0, a=0.9)
            txt.text = threat_id
            arr.markers.append(txt)

        self.marker_pub.publish(arr)


# ==============================================================================
# Non-Blocking Terminal Input Handler
# ==============================================================================
class NonBlockingKeyboard:
    def __init__(self):
        self.is_tty = sys.stdin.isatty()
        if self.is_tty:
            self.fd = sys.stdin.fileno()
            self.old_settings = termios.tcgetattr(self.fd)
        else:
            self.fd = None
            self.old_settings = None

    def enable_cbreak(self):
        if self.is_tty:
            tty.setcbreak(self.fd)

    def restore(self):
        if self.is_tty and self.old_settings is not None:
            termios.tcsetattr(self.fd, termios.TCSADRAIN, self.old_settings)

    def get_key(self, timeout=0.05):
        rlist, _, _ = select.select([sys.stdin], [], [], timeout)
        if rlist:
            char = sys.stdin.read(1)
            # Handle escape sequences (arrows)
            if char == '\x1b':
                r2, _, _ = select.select([sys.stdin], [], [], 0.02)
                if r2:
                    char += sys.stdin.read(2)
            return char
        return None


# ==============================================================================
# ANSI Terminal HUD UI
# ==============================================================================
CLEAR_SCREEN = "\033[2J\033[H"
RESET = "\033[0m"
BOLD = "\033[1m"
GREEN = "\033[38;5;46m"
YELLOW = "\033[38;5;226m"
CYAN = "\033[38;5;51m"
RED = "\033[38;5;196m"
BLUE = "\033[38;5;75m"
WHITE = "\033[38;5;255m"
GRAY = "\033[38;5;244m"
BG_BLUE = "\033[48;5;24m"


def render_hud(node: KeyboardWaypointCommander, last_msg: str):
    nav2_ready = "CONNECTED ✅" if (node.nav_client and node.nav_client.server_is_ready()) else "WAITING... ⏳"
    
    status_color = YELLOW
    if "SUCCESS" in node.active_goal_status:
        status_color = GREEN
    elif "STOP" in node.active_goal_status or "ABORT" in node.active_goal_status:
        status_color = RED
    elif "EN_ROUTE" in node.active_goal_status:
        status_color = CYAN

    world_label = "NUS EA FIELD" if "nus" in node.world_name.lower() else "AIRPORT RUNWAY"

    hud = []
    hud.append(CLEAR_SCREEN)
    hud.append(f"{BG_BLUE}{BOLD}{WHITE}  🛫 AUTONOMOUS UGV - KEYBOARD WAYPOINT COMMANDER [{world_label}]  {RESET}")
    hud.append(f"{GRAY}  ROS 2 Jazzy · Nav2 SmacHybrid + RPP · Dual-EKF RTK Localization · AgileX Scout 2.0{RESET}\n")

    hud.append(f"  {BOLD}📍 Active Simulation:{RESET} {CYAN}{world_label}{RESET} | Spawn Start Pose: X = {START_POSE['x']:.2f} m | Y = {START_POSE['y']:.2f} m | Yaw = {START_POSE['yaw']:.2f} rad (0.0°)")
    hud.append(f"  {BOLD}🤖 Live Robot Pose:{RESET}   X = {node.robot_x:6.2f} m | Y = {node.robot_y:6.2f} m | Yaw = {node.robot_yaw:5.2f} rad ({math.degrees(node.robot_yaw):5.1f}°) | Speed: {node.robot_speed*3.6:4.1f} km/h")
    hud.append(f"  {BOLD}📡 Nav2 Server:{RESET}       {nav2_ready}  |  {BOLD}Goal Status:{RESET} {status_color}{node.active_goal_status}{RESET}")

    if node.active_goal_key is not None:
        wp = node.waypoints.get(node.active_goal_key, {})
        t_id = wp.get('threat_id', f"FOD_THREAT_{int(node.active_goal_key):03d}")
        obj = wp.get('object', 'debris')
        hud.append(f"  {BOLD}🎯 Active Target:{RESET}     {YELLOW}{BOLD}{t_id}{RESET} ({obj}) -> ({node.active_target_x:.2f}, {node.active_target_y:.2f})")
        hud.append(f"  {BOLD}📏 Distance to Goal:{RESET} {node.distance_remaining:5.2f} m  |  {BOLD}Estimated ETA:{RESET} {node.eta_seconds:4.1f} s")
    else:
        hud.append(f"  {BOLD}🎯 Active Target:{RESET}     [None] Standing by for UAV alerts / keypress 1-5")
        hud.append(f"  {BOLD}📏 Distance to Goal:{RESET} -- m  |  {BOLD}Estimated ETA:{RESET} -- s")

    # UAV DISPATCH STATUS
    if node.last_uav_alert is not None:
        alt = node.last_uav_alert
        hud.append(f"  {CYAN}📡 Datalink Dispatch:{RESET} [{alt['idx']}/5] {BOLD}{alt['threat_id']}{RESET} ({alt['object']}) -> {GREEN}Transmitted to Receiver Terminal (/c2/target_alert){RESET}")

    hud.append(f"\n{CYAN}  ────────────────────────────────────────────────────────────────────────────{RESET}")
    hud.append(f"  {BOLD}KEYBOARD WAYPOINTS TABLE ({world_label}):{RESET}")
    for k in ['1', '2', '3', '4', '5']:
        wp = node.waypoints[k]
        t_id = wp.get('threat_id', f"FOD_THREAT_{int(k):03d}")
        obj = wp.get('object', 'debris')
        conf = float(wp.get('confidence', 0.95))
        active_flag = f"{GREEN} ◀◀ [ACTIVE TARGET]{RESET}" if node.active_goal_key == k else ""
        hud.append(
            f"   {BOLD}[{k}]{RESET}  {YELLOW}{t_id}:{RESET} (X: {wp['x']:6.2f}, Y: {wp['y']:6.2f})  "
            f"{GRAY}--> {obj} ({conf*100:.0f}% conf){RESET}{active_flag}"
        )
    hud.append(f"{CYAN}  ────────────────────────────────────────────────────────────────────────────{RESET}")
    hud.append(f"  {BOLD}CONTROL KEYS:{RESET}")
    hud.append(f"   {GREEN}[1] [2] [3] [4] [5]{RESET} : Dispatch UAV FOD Target Alert (1 to 5)")
    hud.append(f"   {RED}[SPACE / S]{RESET}         : 🛑 Emergency Stop / Cancel Goal Immediately")
    hud.append(f"   {BLUE}[R / H]{RESET}             : 🏠 Return to Start Bay (-25, 0)")
    hud.append(f"   {YELLOW}[P]{RESET}                 : 🚀 Auto-Patrol Loop (1 -> 2 -> 3 -> 4 -> 5)")
    hud.append(f"   {WHITE}[Q / Ctrl+C]{RESET}       : 🚪 Exit Program")
    hud.append(f"{CYAN}  ────────────────────────────────────────────────────────────────────────────{RESET}")

    if last_msg:
        hud.append(f"  {BOLD}LOG:{RESET} {last_msg}")
    else:
        hud.append(f"  {BOLD}LOG:{RESET} Standing by for UAV alerts / keypress [1-5]...")

    hud.append(f"\n  {BOLD}>> Press key [1, 2, 3, 4, 5] (No ENTER needed): {RESET}")
    print("\n".join(hud), end="", flush=True)


# ==============================================================================
# Main Program Loop
# ==============================================================================
def main():
    parser = argparse.ArgumentParser(description="Keyboard Waypoint Commander for Runway UGV")
    parser.add_argument('--world', type=str, default='nus', choices=['nus', 'runway', 'nus_ea_field', 'airport_runway'],
                        help="Active world: 'nus' (default) or 'runway'")
    parser.add_argument('--wp1', type=str, default=None, help="Custom WP1 'x,y,yaw'")
    parser.add_argument('--wp2', type=str, default=None, help="Custom WP2 'x,y,yaw'")
    parser.add_argument('--wp3', type=str, default=None, help="Custom WP3 'x,y,yaw'")
    parser.add_argument('--wp4', type=str, default=None, help="Custom WP4 'x,y,yaw'")
    parser.add_argument('--wp5', type=str, default=None, help="Custom WP5 'x,y,yaw'")
    parser.add_argument('--no-c2', action='store_true', help="Disable C2 target alert broadcast")
    args = parser.parse_args()

    # Load waypoints according to selected world
    if 'runway' in args.world.lower():
        base_waypoints = RUNWAY_WAYPOINTS
    else:
        base_waypoints = NUS_WAYPOINTS

    waypoints = {k: dict(v) for k, v in base_waypoints.items()}
    for idx, override in [('1', args.wp1), ('2', args.wp2), ('3', args.wp3), ('4', args.wp4), ('5', args.wp5)]:
        if override:
            parts = [float(p.strip()) for p in override.split(',')]
            yaw = parts[2] if len(parts) >= 3 else 0.0
            waypoints[idx]['x'] = parts[0]
            waypoints[idx]['y'] = parts[1]
            waypoints[idx]['yaw'] = yaw

    rclpy.init()
    node = KeyboardWaypointCommander(waypoints, enable_c2=not args.no_c2, world_name=args.world)

    # Run ROS 2 spin in background daemon thread
    spin_thread = threading.Thread(target=rclpy.spin, args=(node,), daemon=True)
    spin_thread.start()

    # Setup non-blocking terminal
    kb = NonBlockingKeyboard()
    kb.enable_cbreak()

    last_msg = f"{GREEN}Node Online. Ready for commands!{RESET}"
    last_render_time = 0

    try:
        while rclpy.ok():
            now = time.time()
            char = kb.get_key(timeout=0.08)

            if char:
                char_lower = char.lower()
                if char in ['1', '2', '3', '4', '5']:
                    wp = waypoints[char]
                    node.send_waypoint(char)
                    t_id = wp.get('threat_id', f"FOD_THREAT_{int(char):03d}")
                    obj = wp.get('object', 'debris')
                    conf = float(wp.get('confidence', 0.95))
                    last_msg = (
                        f"{YELLOW}[{char}/5] C2 TARGET ALERT RECEIVED FROM UAV_ALPHA_01 -> {BOLD}{t_id}{RESET} ({obj}) at ({wp['x']:.2f}, {wp['y']:.2f})\n"
                        f"  {BOLD}🚨 [C2 ALERT INGESTED]{RESET} Threat: {GREEN}{t_id}{RESET} | Class: FOD / {obj} (Conf: {conf*100:.0f}%) | Action: AUTONOMOUS_INTERCEPT_AND_VACUUM"
                    )

                elif char_lower in ['s', ' ']:
                    node.emergency_stop()
                    last_msg = f"{RED}🛑 EMERGENCY STOP TRIGGERED! Velocity zeroed, goal cancelled.{RESET}"

                elif char_lower in ['h', 'r']:
                    node.send_waypoint('5')
                    last_msg = f"{BLUE}🏠 Heading Return-Home to Start Bay (-25, 0){RESET}"

                elif char_lower == 'p':
                    node.start_patrol_sequence()
                    last_msg = f"{YELLOW}🚀 Auto-Patrol Loop Started! (Sequence: 1 -> 2 -> 3 -> 4 -> 5){RESET}"

                elif char_lower == 'q' or char == '\x03':  # 'q' or Ctrl+C
                    last_msg = "Exiting..."
                    break

            # Render HUD at 10 Hz
            if now - last_render_time >= 0.10:
                render_hud(node, last_msg)
                last_render_time = now

    except KeyboardInterrupt:
        pass
    finally:
        kb.restore()
        print("\n\nRestoring terminal and shutting down gracefully...")
        try:
            node.destroy_node()
        except Exception:
            pass
        try:
            if rclpy.ok():
                rclpy.shutdown()
        except Exception:
            pass
        print("Done. Goodbye!\n")


if __name__ == '__main__':
    main()
