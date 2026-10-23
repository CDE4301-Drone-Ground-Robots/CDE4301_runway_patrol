#!/usr/bin/env bash
# ==============================================================================
# 🏫 Launch NUS EA Field Simulation & Nav2 Autonomous Stack
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
echo "🚀 Launching NUS EA Field World Simulation (Gazebo + Nav2 + RViz)"
echo "   World       : nus_ea_field"
echo "   Map         : nus_ea_field.yaml"
echo "   EKF Config  : ekf_nus.yaml (Lat: 1.2995°, Lon: 103.7712°)"
echo "   Spawn Pose  : X = -25.0 m, Y = 0.0 m, Yaw = 0.0 rad"
echo "======================================================================"

ros2 launch runway_navigation sim_and_nav.launch.py world_name:=nus_ea_field "$@"
