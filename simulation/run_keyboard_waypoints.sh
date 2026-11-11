#!/usr/bin/env bash
# ==============================================================================
# 🎮 Run Interactive Keyboard Waypoint Sender for Runway UGV Simulation Video
# Usage:
#   ./run_keyboard_waypoints.sh
#   ./run_keyboard_waypoints.sh --wp1 "-12,0,0" --wp2 "8,-1,0"
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Source CycloneDDS and ROS 2 environment
if [ -f "${SCRIPT_DIR}/setup_dds.sh" ]; then
    source "${SCRIPT_DIR}/setup_dds.sh"
else
    source /opt/ros/jazzy/setup.bash
    if [ -f "${SCRIPT_DIR}/install/setup.bash" ]; then
        source "${SCRIPT_DIR}/install/setup.bash"
    fi
fi

# 2. Check for shortcut positional world argument: ./run_keyboard_waypoints.sh [nus|runway]
ARGS=()
for arg in "$@"; do
    if [ "$arg" == "runway" ]; then
        ARGS+=(--world runway)
    elif [ "$arg" == "nus" ]; then
        ARGS+=(--world nus)
    else
        ARGS+=("$arg")
    fi
done

# 3. Launch interactive keyboard waypoint commander
exec python3 "${SCRIPT_DIR}/keyboard_waypoint_sender.py" "${ARGS[@]}"
