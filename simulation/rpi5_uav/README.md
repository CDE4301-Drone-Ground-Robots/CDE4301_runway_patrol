# 🚁 Raspberry Pi 5 — UAV Tactical C2 Commander & Communications Guide

This guide details how to configure, run, and operate the **UAV Tactical C2 Commander** on the Raspberry Pi 5 to remotely dispatch FOD target alerts and patrol waypoints to the UGV rover over the simulated wireless datalink.

---

## 🗂️ Package Contents (`rpi5_uav/`)

| File / Script | Description |
| :--- | :--- |
| **`uav_waypoint_commander.py`** | Main ROS 2 node featuring a 2D Tactical OpenCV radar HUD and interactive keyboard/mouse controls. |
| **`DemoComs_C2.py`** | **Charan Communications Code**: Automated multi-target alert dispatcher that sequentially transmits 3 structured FOD target alerts. |
| **`run_uav_gui.sh`** | 1-Click launcher for the 2D Tactical HUD GUI (automatically configures CycloneDDS and display). |
| **`run_uav_demo.sh`** | 1-Click launcher for Charan automated FOD communications demo (`DemoComs_C2.py`). |
| **`run_uav_headless.sh`** | 1-Click launcher for Headless Terminal CLI (ideal for pure SSH connections). |
| **`setup_dds.sh`** | Sets up environment variables (`RMW_IMPLEMENTATION=rmw_cyclonedds_cpp` and peer config). |
| **`cyclonedds.xml`** | CycloneDDS unicast network peer discovery profile for reliable wireless bridging. |
| **`deploy_to_rpi5.sh`** | Deployment helper script to transfer this folder from the laptop to the RPi 5. |

---

## ⚙️ 1. Prerequisites on Raspberry Pi 5

Ensure ROS 2 (Jazzy or Humble) is installed on the Raspberry Pi 5, along with CycloneDDS and OpenCV:

```bash
# 1. Install CycloneDDS RMW implementation
sudo apt update
sudo apt install -y ros-${ROS_DISTRO}-rmw-cyclonedds-cpp

# 2. Install Python computer vision and scientific libraries
sudo apt install -y python3-opencv python3-numpy python3-pip
```

---

## 🌐 2. Network & CycloneDDS Configuration

Both the ground laptop running the simulation and the Raspberry Pi 5 must be connected to the same local network with matching `ROS_DOMAIN_ID=0`:

* **WiFi Network (Default):**
  * **Laptop (Simulation):** `192.168.168.50`
  * **RPi 5 (UAV Commander):** `192.168.168.100`
* **Direct Ethernet Cable (Fallback):**
  * **Laptop (Simulation):** `192.168.137.1`
  * **RPi 5 (UAV Commander):** `192.168.137.233`

> [!TIP]
> The launcher scripts automatically inspect your active network interface (`192.168.168.x` vs `192.168.137.x`) and configure unicast peer discovery in `cyclonedds.xml` dynamically.

---

## 🚀 3. How to Launch on Raspberry Pi 5

Open a terminal on the Raspberry Pi 5 (or connect via SSH):

```bash
cd ~/phase1_uav
chmod +x *.sh *.py
source /opt/ros/${ROS_DISTRO}/setup.bash
source ./setup_dds.sh
```

### Option A: Launch Graphical Tactical HUD GUI
Use this when connected to a display monitor or over VNC:

```bash
./run_uav_gui.sh
# or manually:
python3 uav_waypoint_commander.py
```

* Displays an interactive 2D aerial tactical radar map showing the UGV's real-time position.
* Real-time kinematics HUD: linear speed (m/s & km/h), distance to target, ETA, heading, battery, and task ledger state.
* **Controls**:
  * **Single Dispatch**: <kbd>Left-Click</kbd> anywhere on the map to immediately route the UGV to that location.
  * **Multi-Waypoint Patrol**: Hold <kbd>Shift</kbd> and <kbd>Left-Click</kbd> multiple waypoints, then press <kbd>P</kbd> or click `[ DISPATCH PATROL ]`.
  * **Emergency Stop**: Press <kbd>C</kbd> or <kbd>Right-Click</kbd> to halt the UGV and clear the queue.
  * **Return to Base (RTB)**: Press <kbd>H</kbd> to command the UGV back to the staging dock.

---

### Option B: Launch Charan Communications Code (Automated Multi-Target Demo)
Use this to test end-to-end autonomous dispatch without manually clicking on a map:

```bash
./run_uav_demo.sh
# or manually:
python3 DemoComs_C2.py
```

**What it does:**
1. Connects to the UGV C2 telemetry bridge over `/c2/target_alert`.
2. Sequentially dispatches 3 structured FOD target detection alerts:
   - `[1/3] FOD_THREAT_001` (screw at `x: -15.0, y: 5.0`)
   - `[2/3] FOD_THREAT_002` (wrench at `x: -5.0, y: 2.0`)
   - `[3/3] FOD_THREAT_003` (bolt at `x: -20.0, y: 2.0`)
3. The UGV ingests the alerts, schedules them into its FIFO mission queue, navigates autonomously to each target, conducts visual verification, remediates the hazard, and auto-advances to the next waypoint.

---

### Option C: Launch Headless Terminal CLI (SSH Session)
Use this when operating over a text-only SSH terminal without X11/VNC forwarding:

```bash
./run_uav_headless.sh
# or manually:
python3 uav_waypoint_commander.py --headless
```

**Interactive CLI Commands:**
```text
UAV-C2> goto -15.0 5.0                # Dispatches single target waypoint
UAV-C2> patrol -20,2 -10,8 5,3        # Dispatches multi-point patrol queue
UAV-C2> status                        # Shows live UGV telemetry & kinematics
UAV-C2> stop                          # Emergency aborts active navigation
UAV-C2> home                          # Returns UGV to staging dock
UAV-C2> exit                          # Quits CLI
```

---

## 📡 4. Communication Protocol & Telemetry Topics

The RPi 5 communicates with the UGV simulation over two primary ROS 2 topics:

### 1. Downlink: `/c2/target_alert` (`std_msgs/msg/String`, JSON payload)
Transmitted from RPi 5 UAV to the UGV containing detection parameters and metric destination:
```json
{
  "threat_id": "FOD_THREAT_001",
  "timestamp_utc": "2026-10-09T02:30:00Z",
  "source_agent_id": "UAV_ALPHA_01",
  "priority_level": "HIGH_ACTIVE_REMEDIATION",
  "anomaly_metadata": {
    "primary_class": "FOD",
    "sub_class": "screw",
    "confidence_score": 0.96
  },
  "target_metric": {
    "x": -15.0,
    "y": 5.0,
    "yaw": 0.0
  }
}
```

### 2. Uplink: `/c2/ugv_telemetry` (`std_msgs/msg/String`, JSON payload, 2 Hz)
Transmitted from UGV back to the RPi 5 containing live RTK-GNSS pose, kinematics, and task state:
```json
{
  "heartbeat_sequence": 142,
  "agent_id": "UGV_ROVER_01",
  "operational_state": "EN_ROUTE",
  "active_task_id": "FOD_THREAT_001",
  "kinematics": {
    "pose_metric": { "x": -22.45, "y": 1.12, "yaw_rad": 0.35 },
    "linear_speed_mps": 2.22,
    "distance_to_goal_m": 7.82,
    "eta_seconds": 3.52
  },
  "battery_percentage": 95.0
}
```

---

## 🔍 5. Verification & Troubleshooting

1. **Verify Network Ping:**
   ```bash
   ping -c 3 192.168.168.50
   ```
2. **Verify ROS 2 Discovery:**
   ```bash
   ros2 topic list
   # Verify /c2/target_alert and /c2/ugv_telemetry are visible
   ```
3. **Monitor Live Telemetry from UGV:**
   ```bash
   ros2 topic echo /c2/ugv_telemetry
   ```
