import rclpy
from rclpy.node import Node
from std_msgs.msg import String
from rclpy.qos import (
    QoSProfile,
    ReliabilityPolicy,
    DurabilityPolicy,
    HistoryPolicy,
)

import json
import hashlib
from datetime import datetime, timezone


def main(args=None):
    rclpy.init(args=args)

    node = Node('detection_sender')

    # Match the QoS used by the UGV receiver / original C2 interface
    qos = QoSProfile(
        reliability=ReliabilityPolicy.RELIABLE,
        durability=DurabilityPolicy.TRANSIENT_LOCAL,
        history=HistoryPolicy.KEEP_LAST,
        depth=1
    )

    publisher = node.create_publisher(
        String,
        '/c2/target_alert',
        qos
    )

    # List of demo detections (Valid open coordinates in NUS EA Field & Runway)
    targets = [
        {
            "threat_id": "FOD_THREAT_001",
            "object": "screw",
            "x": -15.0,
            "y": 5.0,
            "yaw": 0.0,
            "confidence": 0.96
        },
        {
            "threat_id": "FOD_THREAT_002",
            "object": "wrench",
            "x": -5.0,
            "y": 2.0,
            "yaw": 0.0,
            "confidence": 0.92
        },
        {
            "threat_id": "FOD_THREAT_003",
            "object": "bolt",
            "x": -20.0,
            "y": 2.0,
            "yaw": 0.0,
            "confidence": 0.98
        }
    ]

    print("Waiting for UGV receiver / bridge on /c2/target_alert...")

    # Wait until the subscriber is discovered
    while publisher.get_subscription_count() == 0:
        rclpy.spin_once(node, timeout_sec=0.1)

    print("UGV Receiver connected. Dispatching multi-target alert sequence...\n")

    # Small settling time
    for _ in range(5):
        rclpy.spin_once(node, timeout_sec=0.1)

    # Dispatch each target alert sequentially into the UGV queue
    for i, target in enumerate(targets, start=1):
        now_utc = datetime.now(timezone.utc).isoformat()
        threat_id = target["threat_id"]
        x = target["x"]
        y = target["y"]
        yaw = target["yaw"]
        obj = target["object"]
        confidence = target["confidence"]

        payload = {
            "threat_id": threat_id,
            "timestamp_utc": now_utc,
            "source_agent_id": "UAV_ALPHA_01",
            "mission_id": "RUNWAY_PATROL_PHASE1",
            "anomaly_metadata": {
                "primary_class": "FOD",
                "sub_class": obj,
                "confidence_score": confidence
            },
            "target_georeference": {
                "latitude_deg": 1.300000 + (y / 111320.0),
                "longitude_deg": 103.770000 + (x / 111320.0),
                "altitude_msl_m": 15.0
            },
            "target_metric": {
                "x": x,
                "y": y,
                "z": 0.0,
                "yaw": yaw
            },
            "priority_level": "HIGH_ACTIVE_REMEDIATION",
            "suggested_action": "AUTONOMOUS_INTERCEPT_AND_VACUUM",
            "signature": hashlib.sha256(
                f"{now_utc}-{threat_id}-{x}-{y}".encode()
            ).hexdigest()
        }

        msg = String()
        msg.data = json.dumps(payload)
        publisher.publish(msg)

        print(f"[{i}/{len(targets)}] C2 TARGET ALERT SENT -> {threat_id} ({obj}) at ({x}, {y})")

        # Brief delay between dispatches so the UGV registers each into queue
        for _ in range(5):
            rclpy.spin_once(node, timeout_sec=0.1)

    print("\nAll waypoints dispatched! UGV queue populated.")

    # Keep node alive briefly to flush DDS buffer
    for _ in range(15):
        rclpy.spin_once(node, timeout_sec=0.1)

    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
