#!/usr/bin/env bash
# ==============================================================================
# DDS & Network Environment Setup for Laptop / PC
# Run with: source setup_dds.sh
# Supports WiFi Router (192.168.168.x) and RJ45 Direct Link (192.168.137.x)
# ==============================================================================

# 1. Source ROS 2 Jazzy & Workspace
if [ -f /opt/ros/jazzy/setup.bash ]; then
    source /opt/ros/jazzy/setup.bash
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/install/setup.bash" ]; then
    source "${SCRIPT_DIR}/install/setup.bash"
fi

# 2. DDS Implementation and Domain ID
export RMW_IMPLEMENTATION=rmw_cyclonedds_cpp
export ROS_DOMAIN_ID=0

# 3. Detect Active Network Interface IP (192.168.168.x or 192.168.137.x)
LOCAL_IP=$(ip -4 addr show | grep -oP '(?<=inet\s)(192\.168\.168|192\.168\.137)\.[0-9]+' | head -n 1)

if [ -n "$LOCAL_IP" ]; then
    export CYCLONEDDS_URI="<CycloneDDS xmlns='https://cdds.io/config'><Domain id='any'><General><Interfaces><NetworkInterface address='${LOCAL_IP}' priority='default' multicast='default'/></Interfaces></General><Discovery><Peers><Peer address='192.168.168.50'/><Peer address='192.168.168.100'/><Peer address='192.168.137.1'/><Peer address='192.168.137.233'/></Peers></Discovery></Domain></CycloneDDS>"
    echo "[DDS Setup] RMW: rmw_cyclonedds_cpp | ROS_DOMAIN_ID: 0"
    echo "[DDS Setup] Bound to IP: ${LOCAL_IP}"
    echo "[DDS Setup] Discovery Peers: 192.168.168.50 (Laptop), 192.168.168.100 (RPi5)"
else
    echo "[DDS Setup] Warning: Neither 192.168.168.x nor 192.168.137.x detected. Using default discovery."
fi
