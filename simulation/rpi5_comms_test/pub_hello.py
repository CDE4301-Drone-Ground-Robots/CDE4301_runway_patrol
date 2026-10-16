#!/usr/bin/env python3
import os
import rclpy
from rclpy.node import Node
from rclpy.executors import ExternalShutdownException
from std_msgs.msg import String

# Default to CycloneDDS and cyclonedds.xml if not set
os.environ.setdefault('RMW_IMPLEMENTATION', 'rmw_cyclonedds_cpp')
script_dir = os.path.dirname(os.path.abspath(__file__))
xml_path = os.path.join(script_dir, 'cyclonedds.xml')
if os.path.exists(xml_path):
    os.environ.setdefault('CYCLONEDDS_URI', f'file://{xml_path}')


class HelloPublisher(Node):
    def __init__(self):
        super().__init__('hello_publisher')
        self.publisher = self.create_publisher(String, 'hello_topic', 10)
        self.timer = self.create_timer(1.0, self.timer_callback)
        self.count = 0

    def timer_callback(self):
        msg = String()
        msg.data = f'Hello World: {self.count}'
        self.publisher.publish(msg)
        self.get_logger().info(f'Publishing: "{msg.data}"')
        self.count += 1


def main(args=None):
    rclpy.init(args=args)
    node = HelloPublisher()
    try:
        rclpy.spin(node)
    except (KeyboardInterrupt, ExternalShutdownException):
        pass
    finally:
        node.destroy_node()
        rclpy.try_shutdown()


if __name__ == '__main__':
    main()
