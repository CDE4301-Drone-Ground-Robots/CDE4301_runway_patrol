# 🚀 Autonomous UGV Launch Commands & Operational Reference
### Comprehensive Guide to Launching, Controlling, and Monitoring the Simulation System
**ROS 2 Jazzy Jalisco · Gazebo Harmonic · Nav2 (SmacHybrid + RPP) · Dual-EKF RTK Localization**

---

## ⚡ 1. Quick Reference Cheat Sheet

| Command / Script | Description | World / Mode |
| :--- | :--- | :--- |
| **`./launch_nus.sh`** | Launches Gazebo, Dual-EKF, Nav2, and RViz | 🏫 **NUS EA Field** (Default) |
| **`./launch_runway.sh`** | Launches Gazebo, Dual-EKF, Nav2, and RViz | 🛫 **Airport Runway** |
| **`./run_c2_receiver.sh`** | Live onboard terminal displaying incoming UAV alerts & progress | 📡 **C2 Alert Monitor** (Both Worlds) |
| **`./run_keyboard_waypoints.sh`** | Interactive keyboard commander (Keys `1-5`, `Space`, `R`, `P`) | 🎮 **NUS Waypoints** |
| **`./run_keyboard_waypoints.sh runway`** | Interactive keyboard commander for Runway video demo | 🎮 **Runway Waypoints** |

---

## 🏫 2. Mode A: NUS EA Field Simulation (Courtyard / Campus)

Use this setup for standard testing, multi-agent C2 telemetry experiments, and campus obstacle avoidance.

### Recommended 3-Terminal Layout:

#### **Terminal 1: Simulation, Localization & Autonomous Navigation**
```bash
cd /home/oliver/runway_sim_ws
./launch_nus.sh
```
*Equivalent ROS 2 command:*
```bash
source /opt/ros/jazzy/setup.bash && source /home/oliver/runway_sim_ws/install/setup.bash
ros2 launch runway_navigation sim_and_nav.launch.py world_name:=nus_ea_field
```
- **World:** `nus_ea_field.sdf` (Centered at world origin, bounds ~ ±26m × ±14m)
- **Map:** `nus_ea_field.yaml`
- **EKF Datum:** Singapore WGS-84 (`1.2995° N, 103.7712° E`)
- **Robot Spawn:** `X = -25.0 m, Y = 0.0 m, Yaw = 0.0 rad`

---

#### **Terminal 2: Tactical C2 Alert Receiver (Onboard UGV Monitor)**
```bash
cd /home/oliver/runway_sim_ws
./run_c2_receiver.sh
```
*Monitors `/c2/target_alert` and `/c2/ugv_telemetry`. Whenever an alert is triggered, it prints a formatted alert card with coordinates, classification confidence, and cryptographic hash verification.*

---

#### **Terminal 3: Keyboard Waypoint Commander**
```bash
cd /home/oliver/runway_sim_ws
./run_keyboard_waypoints.sh
```
*(No `<Enter>` required — simply tap keys to drive!)*

---

### Alternative Command Sources for NUS Mode:
- **Run Automated Multi-Target Sequence (DemoComs):**
  ```bash
  ros2 run runway_communication DemoComs_C2
  ```
- **Launch UAV Tactical Ground Station GUI (OpenCV Radar HUD):**
  ```bash
  ros2 run runway_communication uav_waypoint_commander
  ```

---

## 🛫 3. Mode B: Airport Runway Simulation (Demo Video Mode)

Use this setup for demo video recordings, high-speed sprint demonstrations, and runway FOD sweeps. Obstacles are replaced with low-profile pink cubes (`0.03m` tall) to keep the LiDAR scan plane completely clear.

### Recommended 3-Terminal Layout:

#### **Terminal 1: Simulation, Localization & Navigation**
```bash
cd /home/oliver/runway_sim_ws
./launch_runway.sh
```
*Equivalent ROS 2 command:*
```bash
source /opt/ros/jazzy/setup.bash && source /home/oliver/runway_sim_ws/install/setup.bash
ros2 launch runway_navigation sim_and_nav.launch.py world_name:=airport_runway
```
- **World:** `airport_runway.sdf` (100m straight centerline)
- **Map:** `runway_map.yaml`
- **EKF Datum:** Aarhus Denmark (`56.3000° N, 10.6190° E`)
- **Robot Spawn:** `X = -25.0 m, Y = 0.0 m, Yaw = 0.0 rad`

---

#### **Terminal 2: Tactical C2 Alert Receiver**
```bash
cd /home/oliver/runway_sim_ws
./run_c2_receiver.sh
```

---

#### **Terminal 3: Keyboard Waypoint Commander (Runway Coordinates)**
```bash
cd /home/oliver/runway_sim_ws
./run_keyboard_waypoints.sh runway
```

---

## 🎮 4. Keyboard Keymap & Coordinates Table

### A. NUS EA Field Key Mappings (`./run_keyboard_waypoints.sh` or `nus`)
| Key | Threat Identifier | Object Class | Coordinates $(X, Y)$ | Description |
| :---: | :--- | :--- | :---: | :--- |
| **`1`** | `FOD_THREAT_001` | `screw` (96%) | **$(-15.00, +5.00)$** | North Courtyard Station |
| **`2`** | `FOD_THREAT_002` | `wrench` (92%) | **$(-5.00, +2.00)$** | Center Field Infield |
| **`3`** | `FOD_THREAT_002_CLUSTER` | `metal_wire` (89%)| **$(-6.20, +2.00)$** | Clustered Target (Sweep Mode) |
| **`4`** | `FOD_THREAT_003` | `bolt` (98%) | **$(-20.00, +2.00)$** | West Field Perimeter |
| **`5`** | `FOD_THREAT_004` | `hardware` (95%) | **$(0.00, 0.00)$** | Courtyard Center Origin |

---

### B. Airport Runway Key Mappings (`./run_keyboard_waypoints.sh runway`)
| Key | Threat Identifier | Object Class | Coordinates $(X, Y)$ | Description |
| :---: | :--- | :--- | :---: | :--- |
| **`1`** | `FOD_THREAT_001` | `screw` (96%) | **$(-7.57, -29.64)$** | Southern Taxiway |
| **`2`** | `FOD_THREAT_002` | `wrench` (92%) | **$(-2.92, -11.94)$** | Mid-Field Approach |
| **`3`** | `FOD_THREAT_003` | `metal_wire` (89%)| **$(+39.63, -5.93)$** | Downfield East Station |
| **`4`** | `FOD_THREAT_004` | `bolt` (98%) | **$(+15.83, +0.06)$** | Centerline Return |
| **`5`** | `FOD_THREAT_005` | `hardware` (95%) | **$(+7.75, +0.15)$** | Near-Field Threshold |

---

### Universal Control Keys:
- **`[SPACE]` or `[S]`** : 🛑 **Emergency Stop** — Immediately halts robot and cancels Nav2 path execution.
- **`[R]` or `[H]`** : 🏠 **Return Home** — Dispatches autonomous return path back to starting bay `(-25.0, 0.0)`.
- **`[P]`** : 🚀 **Auto-Patrol Loop** — Sequentially navigates `1` $\rightarrow$ `2` $\rightarrow$ `3` $\rightarrow$ `4` $\rightarrow$ `5`.
- **`[Q]` or `[Ctrl+C]`** : 🚪 **Exit** cleanly without terminal corruption.

---

## 🛠️ 5. Modular / Component-by-Component Launches

If you want to debug or launch individual modules separately:

### A. Launch Only Gazebo Simulation
```bash
# NUS EA Field
ros2 launch runway_description sim.launch.py world_name:=nus_ea_field

# Airport Runway
ros2 launch runway_description sim.launch.py world_name:=airport_runway
```

### B. Launch Only Nav2 Stack, Map Server & RViz (Headless / External Sim)
```bash
# NUS EA Field
ros2 launch runway_navigation bringup_nav2.launch.py world_name:=nus_ea_field

# Airport Runway
ros2 launch runway_navigation bringup_nav2.launch.py world_name:=airport_runway
```

### C. Launch Only the UGV C2 Telemetry Executive Bridge
```bash
ros2 run runway_communication ugv_c2_bridge_node
```

### D. Launch Only RViz Pre-Configured Inspection Interface
```bash
rviz2 -d /home/oliver/runway_sim_ws/src/runway_navigation/rviz/runway_nav2.rviz
```

---

## 🔍 6. Useful Verification & Telemetry Commands

### Monitor Real-Time Communications:
```bash
# Echo incoming target alert downlinks (from UAV / Keyboard)
ros2 topic echo /c2/target_alert

# Echo outgoing UGV state, speed, battery, and task ledger telemetry
ros2 topic echo /c2/ugv_telemetry

# Check cmd_vel velocities dispatched by Nav2
ros2 topic echo /cmd_vel
```

### Verify Localization & Sensor Fusion:
```bash
# Global EKF fused odometry (RTK-GNSS + IMU + Wheels in map frame)
ros2 topic echo /odometry/global

# Raw wheel odometry
ros2 topic hz /odom

# 2D LiDAR scan frequency (should be ~10-20 Hz)
ros2 topic hz /scan

# Raw RTK-GNSS fix stream
ros2 topic echo /gps/fix
```

### Check Nav2 Action Client Status:
```bash
ros2 action info /navigate_to_pose
```

---

## 🚨 7. Troubleshooting & Common Fixes

### 1. "Command not found" or "package runway_... not found"
Ensure your terminal environment has sourced ROS 2 and workspace setup files:
```bash
source /opt/ros/jazzy/setup.bash
source /home/oliver/runway_sim_ws/install/setup.bash
```

### 2. Gazebo or RViz GUI Rendering Lag
Run with software rendering if running inside WSL or without dedicated GPU pass-through:
```bash
export LIBGL_ALWAYS_SOFTWARE=1
```

### 3. Kill All Lingering Simulation Processes
If nodes hang or Gazebo crashes in the background, run:
```bash
killall -9 gz-sim-server gz-sim-gui ruby ros2 rviz2 ekf_node 2>/dev/null || true
```

### 4. Build Workspace After Custom Edits
```bash
cd /home/oliver/runway_sim_ws
source /opt/ros/jazzy/setup.bash
colcon build --symlink-install
```
