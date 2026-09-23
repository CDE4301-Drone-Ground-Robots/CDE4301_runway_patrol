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
from geometry_msgs.msg import PoseStamped, Quaternion
from nav_msgs.msg import Odometry
from action_msgs.msg import GoalStatus

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

            self.get_logger().info(
                f"🚨 [C2 ALERT INGESTED] Threat: {threat_id} at ({tx:.2f}, {ty:.2f}) | "
                f"Class: {alert.get('anomaly_metadata', {}).get('primary_class', 'unknown')} | "
                f"Priority: {alert.get('priority_level', 'NORMAL')}"
            )

            # Update Ledger to ACKNOWLEDGED
            self.active_threat_id = threat_id
            self.target_x = float(tx)
            self.target_y = float(ty)
            self.task_state = "ACKNOWLEDGED"
            self.task_start_time = time.time()

            target_yaw = target_metric.get('yaw') if isinstance(target_metric, dict) else None
            # Dispatch to Nav2
            self.dispatch_nav_goal(self.target_x, self.target_y, target_yaw)

        except Exception as e:
            self.get_logger().error(f"Failed to parse C2 target alert: {e}")

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
            self.task_state = "CANCELLED"
            self.active_threat_id = None
        else:
            self.task_state = "FAILED"
            self.active_threat_id = None

    def complete_remediation(self):
        """Simulate clearance module completion."""
        self.get_logger().info(f"✅ [REMEDIATION COMPLETE] {self.active_threat_id} successfully COLLECTED!")
        self.task_state = "COLLECTED"
        # Reset to IDLE after 5 seconds
        threading.Timer(5.0, self.reset_task_idle).start()

    def reset_task_idle(self):
        if self.task_state == "COLLECTED":
            self.task_state = "IDLE"
            self.active_threat_id = None

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

        # Create Section 3.2 Compliant JSON Payload
        now_utc = datetime.now(timezone.utc).isoformat()
        
        telemetry_dict = {
            "mission_id": self.mission_id,
            "timestamp_utc": now_utc,
            "source_agent_id": self.ugv_id,
            "target_ack": {
                "threat_id": self.active_threat_id if self.active_threat_id else "NONE",
                "task_state": self.task_state,
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
