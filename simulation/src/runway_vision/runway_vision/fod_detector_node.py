#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from vision_msgs.msg import Detection2DArray, Detection2D, ObjectHypothesisWithPose
import cv2
import torch
import numpy as np
from ultralytics import YOLO

class FodDetectorNode(Node):
    def __init__(self):
        super().__init__('fod_detector_node')

        self.declare_parameter('model_weights', 'yolo11n.pt')
        self.declare_parameter('confidence_threshold', 0.25)
        self.declare_parameter('input_topic', '/camera/image_raw')
        
        model_name = self.get_parameter('model_weights').get_parameter_value().string_value
        self.conf_thresh = self.get_parameter('confidence_threshold').get_parameter_value().double_value
        input_topic = self.get_parameter('input_topic').get_parameter_value().string_value

        self.device = 'cuda:0' if torch.cuda.is_available() else 'cpu'
        self.get_logger().info(f'Loading YOLO model [{model_name}] on device: {self.device}...')
        self.model = YOLO(model_name)

        self.subscription = self.create_subscription(
            Image,
            input_topic,
            self.image_callback,
            10
        )

        self.det_pub = self.create_publisher(Detection2DArray, '/ugv/fod_detections', 10)
        self.debug_img_pub = self.create_publisher(Image, '/camera/fod_debug', 10)

        self.get_logger().info('FOD YOLO Detector Node Initialized Successfully.')

    def image_callback(self, msg: Image):
        try:
            # Decode raw byte buffer into OpenCV BGR frame
            cv_image = np.frombuffer(msg.data, dtype=np.uint8).reshape((msg.height, msg.width, 3))
            if msg.encoding == 'rgb8':
                cv_image = cv2.cvtColor(cv_image, cv2.COLOR_RGB2BGR)
        except Exception as e:
            self.get_logger().error(f'Image decode error: {str(e)}')
            return

        # Inference on GPU
        results = self.model.predict(
            source=cv_image,
            conf=self.conf_thresh,
            device=self.device,
            verbose=False
        )

        # Detection Message Assembly
        detection_array = Detection2DArray()
        detection_array.header = msg.header

        for result in results:
            for box in result.boxes:
                det = Detection2D()
                det.header = msg.header

                xywh = box.xywh[0].cpu().numpy()
                det.bbox.center.position.x = float(xywh[0])
                det.bbox.center.position.y = float(xywh[1])
                det.bbox.size_x = float(xywh[2])
                det.bbox.size_y = float(xywh[3])

                conf = float(box.conf[0].cpu().numpy())
                cls_id = int(box.cls[0].cpu().numpy())
                cls_name = self.model.names[cls_id]

                hyp = ObjectHypothesisWithPose()
                hyp.hypothesis.class_id = cls_name
                hyp.hypothesis.score = conf
                det.results.append(hyp)

                detection_array.detections.append(det)

        self.det_pub.publish(detection_array)

        # Direct Image Message Construction (Zero-Crash, No cv_bridge Dependency)
        if self.debug_img_pub.get_subscription_count() > 0:
            try:
                annotated = results[0].plot()  # BGR array
                annotated = np.ascontiguousarray(annotated, dtype=np.uint8)

                debug_msg = Image()
                debug_msg.header = msg.header
                debug_msg.height = annotated.shape[0]
                debug_msg.width = annotated.shape[1]
                debug_msg.encoding = 'bgr8'
                debug_msg.is_bigendian = 0
                debug_msg.step = annotated.shape[1] * 3
                debug_msg.data = annotated.tobytes()

                self.debug_img_pub.publish(debug_msg)
            except Exception as e:
                self.get_logger().error(f'Debug publish error: {str(e)}')

def main(args=None):
    rclpy.init(args=args)
    node = FodDetectorNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()