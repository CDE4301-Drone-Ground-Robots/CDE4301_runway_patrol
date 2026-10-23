#!/usr/bin/env bash
# ==============================================================================
# 🛫 Launch Airport Runway Simulation & Nav2 Autonomous Stack
# ==============================================================================

set -e

WS_DIR="/home/oliver/runway_sim_ws"
cd "$WS_DIR"

if [ -f "/opt/ros/jazzy/setup.bash" ]; then
    source /opt/ros/jazzy/setup.bash
fi

if [ -f "$WS_DIR/install/setup.bash" ]; then
    source "$WS_DIR/install/setup.bash"
fi

echo "======================================================================"
echo "🚀 Launching Airport Runway World Simulation (Gazebo + Nav2 + RViz)"
echo "   World       : airport_runway"
echo "   Map         : runway_map.yaml"
echo "   EKF Config  : ekf.yaml (Lat: 56.3000°, Lon: 10.6190°)"
echo "   Spawn Pose  : X = -25.0 m, Y = 0.0 m, Yaw = 0.0 rad"
echo "======================================================================"

ros2 launch runway_navigation sim_and_nav.launch.py world_name:=airport_runway "$@"
