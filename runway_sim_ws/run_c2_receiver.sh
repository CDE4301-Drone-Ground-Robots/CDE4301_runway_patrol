#!/bin/bash
# ==============================================================================
# 📡 Launch Tactical C2 Alert Receiver (Onboard UGV Terminal)
# ==============================================================================
# Run this in a dedicated terminal window alongside the keyboard commander!
# Whenever you press [1-5] in the commander terminal, this terminal displays the
# incoming UAV reconnaissance alert message and tracks live UGV task progress.
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

export PYTHONUNBUFFERED=1

exec python3 "$WS_DIR/src/runway_communication/runway_communication/c2_alert_receiver.py" "$@"
