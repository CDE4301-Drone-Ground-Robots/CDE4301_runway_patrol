#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
import socket
import json

class UdpTeleopReceiver(Node):
    def __init__(self):
        super().__init__('udp_teleop_receiver')
        self.publisher = self.create_publisher(Twist, '/cmd_vel', 10)
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock.bind(('0.0.0.0', 9870))
        self.sock.setblocking(False)
        self.timer = self.create_timer(0.02, self.poll_udp) # 50 Hz
        self.get_logger().info('UDP Gamepad Teleop Receiver listening on port 9870...')

    def poll_udp(self):
        try:
            data, _ = self.sock.recvfrom(1024)
            payload = json.loads(data.decode('utf-8'))
            msg = Twist()
            msg.linear.x = float(payload.get('linear', 0.0))
            msg.angular.z = float(payload.get('angular', 0.0))
            self.publisher.publish(msg)
        except BlockingIOError:
            pass

def main():
    rclpy.init()
    node = UdpTeleopReceiver()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
