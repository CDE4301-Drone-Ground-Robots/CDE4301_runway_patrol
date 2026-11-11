#!/usr/bin/env bash
# ==============================================================================
# Helper Script: 1-Click Deploy to Raspberry Pi 5 / External UAV PC
# Usage: ./deploy_to_rpi5.sh [RPI_IP] [RPI_USER]
# Default IP: 192.168.168.100 (WiFi) or 192.168.137.233 (Ethernet)
# ==============================================================================

RPI_IP="${1:-192.168.168.100}"
RPI_USER="${2:-pi}"
TARGET_DIR="~/phase1_uav"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=================================================="
echo "🚀 Deploying UAV package to ${RPI_USER}@${RPI_IP}:${TARGET_DIR}"
echo "=================================================="

# Test ping
if ! ping -c 1 -W 2 "$RPI_IP" >/dev/null 2>&1; then
    echo "⚠️ Warning: Cannot ping ${RPI_IP}. Checking if 192.168.137.233 is reachable..."
    if ping -c 1 -W 2 "192.168.137.233" >/dev/null 2>&1; then
        RPI_IP="192.168.137.233"
        echo "✅ Detected RJ45 Ethernet link: Using ${RPI_IP}"
    fi
fi

# Create target dir on RPi 5 and rsync files
ssh -o ConnectTimeout=5 "${RPI_USER}@${RPI_IP}" "mkdir -p ${TARGET_DIR}" || {
    echo "❌ SSH connection failed to ${RPI_USER}@${RPI_IP}. Check network link and SSH keys/credentials."
    exit 1
}

rsync -avz --exclude="*.pyc" --exclude="__pycache__" --exclude=".git" "${SCRIPT_DIR}/" "${RPI_USER}@${RPI_IP}:${TARGET_DIR}/"
ssh "${RPI_USER}@${RPI_IP}" "chmod +x ${TARGET_DIR}/*.sh ${TARGET_DIR}/*.py"

echo "=================================================="
echo "✅ Deployment Successful!"
echo "To run on RPi 5:"
echo "  ssh ${RPI_USER}@${RPI_IP}"
echo "  cd ${TARGET_DIR}"
echo "  ./run_uav_gui.sh     # for visual map HUD"
echo "  ./run_uav_headless.sh # for headless CLI"
echo "=================================================="
