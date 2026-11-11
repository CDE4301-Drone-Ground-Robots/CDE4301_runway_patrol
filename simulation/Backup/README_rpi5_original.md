# 🚁 Raspberry Pi 5 — UAV C2 Tactical Ground Station Instructions

This guide provides step-by-step instructions to set up and run the UAV Tactical C2 Waypoint Commander node on the Raspberry Pi 5.

---

## 📂 Required Files on Raspberry Pi 5

All files should be placed inside `~/phase1_uav/` on the Raspberry Pi 5:

| File | Purpose |
| :--- | :--- |
| `uav_waypoint_commander.py` | Main Python ROS 2 node (Tactical HUD GUI & Headless CLI) |
| `DemoComs_C2.py` | Automated demo script (dispatches 3 pre-defined FOD alerts) |
| `cyclonedds.xml` | CycloneDDS network and peer discovery configuration |
| `run_uav_gui.sh` | 1-Click launcher for 2D Tactical Map GUI (OpenCV HUD) |
| `run_uav_headless.sh` | 1-Click launcher for Headless Terminal CLI (SSH) |
| `run_uav_demo.sh` | 1-Click launcher for Automated Demo Mode (`DemoComs_C2.py`) |
| `RPi5_INSTRUCTIONS.md` | This instruction reference |

---

## ⚙️ 1. Prerequisites on Raspberry Pi 5

Ensure ROS 2 (Jazzy or Humble) is installed on the RPi 5, along with CycloneDDS and OpenCV:

```bash
# 1. Install CycloneDDS RMW
sudo apt update
sudo apt install -y ros-${ROS_DISTRO}-rmw-cyclonedds-cpp

# 2. Install Python dependencies
sudo apt install -y python3-opencv python3-numpy
```

---

## 🌐 2. Network Configuration

Both the laptop and RPi 5 must be on the same network with matching `ROS_DOMAIN_ID=0`:

* **WiFi Router Setup (Current):**
  * **Laptop IP:** `192.168.168.50`
  * **RPi 5 IP:** `192.168.168.100`
* **Direct RJ45 Ethernet Cable (Fallback):**
  * **Laptop IP:** `192.168.137.1`
  * **RPi 5 IP:** `192.168.137.233`

> 💡 **Note:** All launcher scripts (`run_uav_gui.sh`, `run_uav_headless.sh`, and `run_uav_demo.sh`) automatically detect whether the RPi 5 is connected via `192.168.168.x` (WiFi) or `192.168.137.x` (Ethernet) and configure CycloneDDS unicast peers automatically.

---

## 🚀 3. How to Launch on Raspberry Pi 5

### Step 1: Make scripts executable
```bash
cd ~/phase1_uav
chmod +x *.sh *.py
```

### Step 2: Choose Launch Mode

#### **Option A: 2D Tactical Visual Map GUI (Direct Monitor / VNC)**
```bash
./run_uav_gui.sh
```
* Opens the dark-mode tactical radar HUD.
* Displays live map, UGV real-time position, telemetry HUD, and C2 message ledger.

#### **Option B: Headless Terminal CLI (over SSH)**
```bash
./run_uav_headless.sh
```
* Interactive command-line terminal when accessing RPi 5 remotely via pure SSH.

#### **Option C: Automated Demo Mode (Hands-Free)**
```bash
./run_uav_demo.sh
```
* Automatically fires 3 pre-programmed FOD target alerts into the UGV queue in sequence:
  1. `FOD_THREAT_001` (screw at `-15.0, 5.0`)
  2. `FOD_THREAT_002` (wrench at `-5.0, 2.0`)
  3. `FOD_THREAT_003` (bolt at `-20.0, 2.0`)
* Exits cleanly once all 3 threats are ingested by the rover.

---

## 🎮 4. How to Operate & Send Waypoints

### In GUI Mode:
* **Single Waypoint / FOD Alert:** <kbd>Left-Click</kbd> anywhere on the map to dispatch the UGV to that location.
* **Multi-Queue Waypoints (Patrol Mission):**
  1. Hold <kbd>Shift</kbd> and <kbd>Left-Click</kbd> multiple points on the map. Amber numbered badges (`#1`, `#2`, `#3`...) will connect with flight paths.
  2. Click **`[ DISPATCH PATROL (P) ]`** or press <kbd>P</kbd> / <kbd>Space</kbd> to execute the sequence.
* **Clear Queue:** Click **`[ CLEAR (R) ]`** or press <kbd>R</kbd>.
* **Emergency Stop:** Click **`[ EMERGENCY STOP (C) ]`** or press <kbd>C</kbd> or <kbd>Right-Click</kbd>.
* **Return to Base / Dock:** Click **`[ RTB / DOCK (H) ]`** or press <kbd>H</kbd>.
* **Exit:** Click **`[ EXIT APP ]`** or press <kbd>Q</kbd> / <kbd>Esc</kbd>.

### In Headless CLI Mode:
```text
UAV-C2> goto -15.0 5.0                # Dispatches single target waypoint
UAV-C2> patrol -20,2 -10,8 5,3        # Dispatches multi-point patrol queue
UAV-C2> status                        # Shows live UGV telemetry & kinematics
UAV-C2> stop                          # Emergency aborts active navigation
UAV-C2> home                          # Returns UGV to staging dock
UAV-C2> exit                          # Quits CLI
```

---

## 🔍 5. Troubleshooting & Sanity Checks

1. **Verify network connectivity to laptop:**
   ```bash
   ping -c 3 192.168.168.50
   ```
2. **Verify ROS 2 communication:**
   ```bash
   # On RPi 5:
   ros2 topic echo /c2/target_alert
   
   # On Laptop (in a terminal with 'source setup_dds.sh'):
   ros2 topic pub --once /c2/target_alert std_msgs/msg/String "data: 'test'"
   ```
3. **If GUI displays `cv2.error: Cannot connect to display`:**
   * Make sure you are running on desktop or with VNC (`DISPLAY=:0`), or use `./run_uav_headless.sh` for terminal mode.
