# CDE4301 Runway Patrol & FOD Inspection UGV

Autonomous Runway Inspection & Foreign Object Debris (FOD) Detection System built with ROS 2 and Gazebo Sim.

## Project Structure

```text
├── .gitignore
├── README.md
├── udp_teleop_receiver.py      # Low-latency UDP teleop command receiver
├── yolo11n.pt                  # Pre-trained YOLO11n weights for FOD detection
└── src/
    ├── runway_description/     # Robot URDF/XACRO model and Gazebo world
    │   ├── launch/sim.launch.py
    │   ├── urdf/ugv.urdf.xacro
    │   └── worlds/runway.sdf
    ├── runway_navigation/      # Nav2 stack configuration, maps, and SLAM
    │   ├── config/nav2_params.yaml
    │   ├── launch/bringup_nav2.launch.py
    │   ├── launch/runway_navigation_launch.py
    │   ├── launch/slam.launch.py
    │   └── maps/runway_map.yaml
    └── runway_vision/          # Real-time YOLO FOD detector node
        └── runway_vision/fod_detector_node.py
```

## Prerequisites

- **OS**: Ubuntu 24.04 (Noble) or 22.04 (Jammy)
- **ROS 2**: Jazzy Jalisco / Humble Hawksbill
- **Gazebo Sim**: Harmonic / modern `gz-sim`
- **Python Dependencies**:
  ```bash
  pip install ultralytics opencv-python torch torchvision
  ```

## Building the Workspace

```bash
cd ~/runway_sim_ws
source /opt/ros/$ROS_DISTRO/setup.bash
colcon build --symlink-install
source install/setup.bash
```

## Quick Start & Usage

### 1. Launch Simulation World & Robot
```bash
ros2 launch runway_description sim.launch.py
```

### 2. Launch Navigation & Localization (Nav2)
```bash
ros2 launch runway_navigation bringup_nav2.launch.py
```

### 3. Launch FOD Vision Detector (YOLO)
```bash
ros2 run runway_vision fod_detector_node
```

### 4. (Optional) Launch UDP Teleoperation
```bash
python3 udp_teleop_receiver.py
```
