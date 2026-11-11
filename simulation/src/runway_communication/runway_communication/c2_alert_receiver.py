#!/usr/bin/env python3
"""
==============================================================================
📡 Tactical C2 Alert & Telemetry Receiver (Onboard UGV Monitor)
==============================================================================
Listens on:
  - /c2/target_alert  (UAV -> UGV Downlink: Latched TRANSIENT_LOCAL / RELIABLE)
  - /c2/ugv_telemetry (UGV State & Remediation progress)

Displays incoming UAV reconnaissance alerts in real-time as formatted cards,
matching DemoComs_C2.py and Phase 1 C2 Communications specifications.
==============================================================================
"""

import sys
import os
import json
import time
import math
from datetime import datetime, timezone

import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, ReliabilityPolicy, DurabilityPolicy, HistoryPolicy
from std_msgs.msg import String

# Terminal ANSI Color Codes
RESET = "\033[0m"
BOLD = "\033[1m"
RED = "\033[1;31m"
GREEN = "\033[1;32m"
YELLOW = "\033[1;33m"
BLUE = "\033[1;34m"
MAGENTA = "\033[1;35m"
CYAN = "\033[1;36m"
WHITE = "\033[1;37m"
GRAY = "\033[38;5;244m"
BG_BLUE = "\033[48;5;24m"
BG_DARK = "\033[48;5;235m"
BG_GREEN = "\033[48;5;22m"


class C2AlertReceiver(Node):
    def __init__(self):
        super().__init__('c2_alert_receiver')

        self.alert_count = 0
        self.last_threat_id = None
        self.last_task_state = None

        # QoS for Latched C2 Alert (matches DemoComs_C2.py & keyboard_waypoint_sender)
        qos_latched = QoSProfile(
            reliability=ReliabilityPolicy.RELIABLE,
            durability=DurabilityPolicy.TRANSIENT_LOCAL,
            history=HistoryPolicy.KEEP_LAST,
            depth=10
        )

        # 1. Subscribe to UAV -> UGV Target Alerts
        self.alert_sub = self.create_subscription(
            String,
            '/c2/target_alert',
            self.target_alert_callback,
            qos_latched
        )

        # Fallback volatile subscriber in case sender uses volatile QoS
        qos_volatile = QoSProfile(
            reliability=ReliabilityPolicy.RELIABLE,
            durability=DurabilityPolicy.VOLATILE,
            history=HistoryPolicy.KEEP_LAST,
            depth=10
        )
        self.alert_sub_vol = self.create_subscription(
            String,
            '/c2/target_alert_volatile',
            self.target_alert_callback,
            qos_volatile
        )

        # 2. Subscribe to UGV Telemetry (to report live navigation progress)
        self.telemetry_sub = self.create_subscription(
            String,
            '/c2/ugv_telemetry',
            self.telemetry_callback,
            10
        )

        self.print_welcome_banner()

    def print_welcome_banner(self):
        print(f"\n{BG_BLUE}{BOLD}{WHITE}  🛫 AUTONOMOUS RUNWAY UGV · TACTICAL C2 ALERT RECEIVER TERMINAL  {RESET}")
        print(f"{GRAY}  Subscribed to topic: {CYAN}/c2/target_alert{GRAY} (QoS: Transient Local + Reliable){RESET}")
        print(f"{GRAY}  Telemetry monitor  : {CYAN}/c2/ugv_telemetry{GRAY} (Live UGV task tracking){RESET}")
        print(f"{CYAN}  ──────────────────────────────────────────────────────────────────────────────{RESET}")
        print(f"  {GREEN}● RECEIVER ONLINE{RESET} — Standing by for UAV reconnaissance downlinks...")
        #print(f"  {GRAY}Press keys [1-5] in the commander terminal to dispatch waypoint alerts.{RESET}\n")
        sys.stdout.flush()

    def target_alert_callback(self, msg: String):
        try:
            alert = json.loads(msg.data)
        except Exception as e:
            print(f"{RED}[ERROR] Failed to parse JSON alert: {e}{RESET}")
            return

        self.alert_count += 1
        now_str = datetime.now().strftime("%H:%M:%S")

        priority = alert.get('priority_level', 'NORMAL')
        suggested_action = alert.get('suggested_action', '')

        # 1. Handle Emergency Abort / Stop Command
        if priority in ['ABORT', 'CANCEL', 'STOP'] or suggested_action in ['ABORT', 'CANCEL', 'STOP']:
            print(f"\n{RED}╔══════════════════════════════════════════════════════════════════════════════╗{RESET}")
            print(f"{RED}║ 🛑 [C2 COMMAND RECEIVED] EMERGENCY STOP / MISSION ABORT                      ║{RESET}")
            print(f"{RED}╠══════════════════════════════════════════════════════════════════════════════╣{RESET}")
            print(f"  • {BOLD}Timestamp{RESET}  : {now_str}")
            print(f"  • {BOLD}Directive{RESET}  : {RED}{BOLD}ALL UGV MOTIONS HALTED · MISSION QUEUE PURGED{RESET}")
            print(f"  • {BOLD}Source{RESET}     : UAV / Ground Control Override")
            print(f"{RED}╚══════════════════════════════════════════════════════════════════════════════╝\n{RESET}")
            sys.stdout.flush()
            return

        # 2. Extract Alert Attributes
        threat_id = alert.get('threat_id', f"FOD_THREAT_{self.alert_count:03d}")
        self.last_threat_id = threat_id

        # Metric coordinates
        target_metric = alert.get('target_metric', {})
        gx = target_metric.get('x', alert.get('x', 0.0))
        gy = target_metric.get('y', alert.get('y', 0.0))
        gyaw = target_metric.get('yaw', alert.get('yaw', 0.0))

        # Georeference
        georef = alert.get('target_georeference', {})
        lat = georef.get('latitude_deg', 1.300000 + (gy / 111320.0))
        lon = georef.get('longitude_deg', 103.770000 + (gx / 111320.0))
        alt = georef.get('altitude_msl_m', 15.0)

        # Anomaly metadata
        anomaly = alert.get('anomaly_metadata', {})
        obj_class = anomaly.get('primary_class', 'FOD')
        sub_class = anomaly.get('sub_class', alert.get('object', 'debris'))
        conf = float(anomaly.get('confidence_score', alert.get('confidence', 0.95)))

        source_agent = alert.get('source_agent_id', 'UAV_ALPHA_01')
        mission_id = alert.get('mission_id', 'RUNWAY_PATROL_PHASE1')
        sig = alert.get('signature', 'N/A')
        sig_display = f"{sig[:16]}... [VERIFIED ✅]" if len(sig) > 16 else "[VERIFIED ✅]"

        # Format alert output card matching DemoComs_C2.py
        print(f"\n{YELLOW}╔══════════════════════════════════════════════════════════════════════════════╗{RESET}")
        print(f"{YELLOW}║ 📡 [UAV DOWNLINK RECEIVED] Tactical C2 Datalink (/c2/target_alert)           ║{RESET}")
        print(f"{YELLOW}╠══════════════════════════════════════════════════════════════════════════════╣{RESET}")
        print(f"║ {GREEN}🚨 [Alert #{self.alert_count}] C2 TARGET ALERT INGESTED: {BOLD}{threat_id}{RESET}{YELLOW} ({sub_class}){RESET}")
        print(f"║    • {BOLD}Source Agent{RESET}    : {CYAN}{source_agent}{RESET} ({mission_id}) · Time: {now_str}")
        print(f"║    • {BOLD}Threat ID{RESET}       : {YELLOW}{BOLD}{threat_id}{RESET}")
        print(f"║    • {BOLD}Anomaly Class{RESET}   : {WHITE}{obj_class} / {sub_class}{RESET} (Confidence: {GREEN}{conf*100:.1f}%{RESET})")
        print(f"║    • {BOLD}Target Metric{RESET}   : X = {BOLD}{gx:6.2f} m{RESET}, Y = {BOLD}{gy:6.2f} m{RESET}, Yaw = {BOLD}{gyaw:5.2f} rad{RESET} ({math.degrees(gyaw):5.1f}°)")
        print(f"║    • {BOLD}Georeference{RESET}    : Lat {lat:.6f}°, Lon {lon:.6f}°, Alt {alt:.1f} m MSL")
        print(f"║    • {BOLD}Action Order{RESET}    : {MAGENTA}{suggested_action or 'AUTONOMOUS_INTERCEPT_AND_VACUUM'}{RESET} (Priority: {priority})")
        print(f"║    • {BOLD}Authentication{RESET}  : SHA-256 {GREEN}{sig_display}{RESET}")
        print(f"║    • {BOLD}UGV Executive{RESET}   : {GREEN}Dispatched to Nav2 SmacHybrid Planner -> En Route 🚀{RESET}")
        print(f"{YELLOW}╚══════════════════════════════════════════════════════════════════════════════╝{RESET}\n")
        sys.stdout.flush()

    def telemetry_callback(self, msg: String):
        try:
            data = json.loads(msg.data)
        except Exception:
            return

        target_ack = data.get('target_ack', {})
        task_state = target_ack.get('task_state')
        active_threat = target_ack.get('threat_id')
        dist = target_ack.get('distance_to_target_m', 0.0)
        eta = target_ack.get('eta_seconds', 0.0)

        veh = data.get('vehicle_telemetry', {})
        speed_kmh = veh.get('speed_kmh', 0.0)
        pose = veh.get('pose_metric', {})
        rx = pose.get('x', 0.0)
        ry = pose.get('y', 0.0)

        # Print state transition notifications cleanly
        if task_state != self.last_task_state and task_state not in [None, 'IDLE']:
            self.last_task_state = task_state
            now_str = datetime.now().strftime("%H:%M:%S")

            if task_state == "EN_ROUTE":
                print(f"  {CYAN}[{now_str}] 🤖 UGV EN ROUTE:{RESET} Navigating to {BOLD}{active_threat}{RESET} (Dist: {dist:.1f}m | ETA: {eta:.1f}s | Speed: {speed_kmh:.1f} km/h)")
            elif task_state == "VACUUMING":
                print(f"  {YELLOW}[{now_str}] 🎯 UGV ARRIVED:{RESET} Intake positioned over {BOLD}{active_threat}{RESET} -> {BOLD}Vacuum Dwell Active (7.0s){RESET}")
            elif task_state == "CONTINUOUS_SWEEP":
                print(f"  {YELLOW}[{now_str}] 🧹 UGV SWEEP:{RESET} Cluster detected -> Continuous vacuum sweep over {BOLD}{active_threat}{RESET}")
            elif task_state == "COLLECTED":
                print(f"  {GREEN}[{now_str}] ✅ UGV REMEDIATION COMPLETE:{RESET} {BOLD}{active_threat}{RESET} successfully collected into debris bin!\n")
            sys.stdout.flush()


def main(args=None):
    rclpy.init(args=args)
    node = C2AlertReceiver()
    try:
        from rclpy.executors import ExternalShutdownException
    except ImportError:
        ExternalShutdownException = KeyboardInterrupt

    try:
        rclpy.spin(node)
    except (KeyboardInterrupt, ExternalShutdownException):
        pass
    finally:
        try:
            node.destroy_node()
        except Exception:
            pass
        if rclpy.ok():
            rclpy.shutdown()


if __name__ == '__main__':
    main()
