#!/usr/bin/env bash
# ==============================================================================
# Launch Hello Subscriber on Laptop
# ==============================================================================

# 1. Source ROS 2 (Jazzy or Humble)
if [ -f /opt/ros/jazzy/setup.bash ]; then
    source /opt/ros/jazzy/setup.bash
elif [ -f /opt/ros/humble/setup.bash ]; then
    source /opt/ros/humble/setup.bash
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 2. Configure CycloneDDS Environment
export RMW_IMPLEMENTATION=rmw_cyclonedds_cpp
export ROS_DOMAIN_ID=0

if [ -f "${SCRIPT_DIR}/cyclonedds.xml" ]; then
    export CYCLONEDDS_URI="file://${SCRIPT_DIR}/cyclonedds.xml"
fi

echo "=========================================="
echo "👂 Launching Hello Subscriber on Laptop..."
echo "  • Topic: /hello_topic"
echo "  • RMW:   ${RMW_IMPLEMENTATION}"
echo "  • XML:   ${CYCLONEDDS_URI}"
echo "=========================================="

exec python3 "${SCRIPT_DIR}/sub_hello.py"
