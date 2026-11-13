#!/usr/bin/env bash
# ==============================================================================
# UAV C2 Automated Demo Runner (DemoComs_C2.py)
# Target: Raspberry Pi 5 / Laptop
# Automatically configures CycloneDDS and dispatches 3 FOD target alerts
# ==============================================================================

# 1. Source ROS 2
if [ -f /opt/ros/jazzy/setup.bash ]; then
    source /opt/ros/jazzy/setup.bash
elif [ -f /opt/ros/humble/setup.bash ]; then
    source /opt/ros/humble/setup.bash
elif [ -f /opt/ros/iron/setup.bash ]; then
    source /opt/ros/iron/setup.bash
fi

# 2. Configure DDS Network Settings (WiFi Router 192.168.168.x or RJ45 Ethernet 192.168.137.x)
export RMW_IMPLEMENTATION=rmw_cyclonedds_cpp
export ROS_DOMAIN_ID=0

# Detect local IP on 192.168.168.x or 192.168.137.x subnet
LOCAL_IP=$(ip -4 addr show | grep -oP '(?<=inet\s)(192\.168\.168|192\.168\.137)\.[0-9]+' | head -n 1)
if [ -n "$LOCAL_IP" ]; then
    export CYCLONEDDS_URI="<CycloneDDS xmlns='https://cdds.io/config'><Domain id='any'><General><Interfaces><NetworkInterface address='${LOCAL_IP}' priority='default' multicast='default'/></Interfaces></General><Discovery><Peers><Peer address='192.168.168.50'/><Peer address='192.168.168.100'/><Peer address='192.168.137.1'/><Peer address='192.168.137.233'/></Peers></Discovery></Domain></CycloneDDS>"
    echo "[Datalink] Bound to network interface IP: ${LOCAL_IP}"
else
    echo "[Datalink] No 192.168.168.x or 192.168.137.x IP found, using auto-discovery."
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_PATH="${SCRIPT_DIR}/src/runway_communication/runway_communication/DemoComs_C2.py"
if [ ! -f "$SCRIPT_PATH" ]; then
    SCRIPT_PATH="${SCRIPT_DIR}/DemoComs_C2.py"
fi
if [ ! -f "$SCRIPT_PATH" ]; then
    SCRIPT_PATH="$HOME/phase1_uav/DemoComs_C2.py"
fi
if [ ! -f "$SCRIPT_PATH" ]; then
    SCRIPT_PATH="$HOME/DemoComs_C2.py"
fi

echo "=================================================="
echo "Starting UAV C2 Automated Demo Dispatch..."
echo "Target: $SCRIPT_PATH"
echo "=================================================="
python3 "$SCRIPT_PATH"
