#!/usr/bin/env bash
# ==============================================================================
# UAV Waypoint Commander - Visual GUI Mode (2D Map Window)
# Target: Raspberry Pi 5 (Connected via RJ45 Ethernet to Laptop)
# ==============================================================================

# 1. Source ROS 2
if [ -f /opt/ros/jazzy/setup.bash ]; then
    source /opt/ros/jazzy/setup.bash
elif [ -f /opt/ros/humble/setup.bash ]; then
    source /opt/ros/humble/setup.bash
elif [ -f /opt/ros/iron/setup.bash ]; then
    source /opt/ros/iron/setup.bash
fi

# 2. Configure DDS Network Settings for Direct RJ45 Ethernet Link (192.168.137.x)
export RMW_IMPLEMENTATION=rmw_cyclonedds_cpp
export ROS_DOMAIN_ID=0

# Detect local IP on 192.168.137.x RJ45 subnet
ETH_IP=$(ip -4 addr show | grep -oP '(?<=inet\s)192\.168\.137\.[0-9]+' | head -n 1)
if [ -n "$ETH_IP" ]; then
    export CYCLONEDDS_URI="<CycloneDDS xmlns='https://cdds.io/config'><Domain id='any'><General><Interfaces><NetworkInterface address='${ETH_IP}' priority='default' multicast='default'/></Interfaces></General><Discovery><Peers><Peer address='192.168.137.1'/><Peer address='192.168.137.233'/></Peers></Discovery></Domain></CycloneDDS>"
    echo "[Datalink] Bound to RJ45 Ethernet interface: ${ETH_IP}"
else
    echo "[Datalink] RJ45 IP not found in 192.168.137.x, using auto-discovery."
fi

# 3. Configure GUI Display Environment (X11 / Wayland / HDMI / VNC)
if [ -z "$DISPLAY" ] && [ -z "$WAYLAND_DISPLAY" ]; then
    export DISPLAY=:0
fi
if [ -z "$XAUTHORITY" ] && [ -f "$HOME/.Xauthority" ]; then
    export XAUTHORITY="$HOME/.Xauthority"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_PATH="${SCRIPT_DIR}/uav_waypoint_commander.py"
if [ ! -f "$SCRIPT_PATH" ]; then
    SCRIPT_PATH="$HOME/phase1_uav/uav_waypoint_commander.py"
fi
if [ ! -f "$SCRIPT_PATH" ]; then
    SCRIPT_PATH="$HOME/uav_waypoint_commander.py"
fi

echo "=================================================="
echo "Starting UAV Commander in GUI Map mode..."
echo "=================================================="
python3 "$SCRIPT_PATH"
