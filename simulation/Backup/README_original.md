<div align="center">

# 🛩️ Aarhus Airport Runway Patrol & Autonomous Navigation UGV

<p align="center">
  <b>Autonomous Runway Inspection & Navigation System</b><br>
  Modeled after <b>Aarhus Airport (IATA: AAR, ICAO: EKAH)</b><br>
  Built with <b>ROS 2 Jazzy</b>, <b>Gazebo Sim (Harmonic)</b>, and <b>Nav2</b>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Location-Aarhus%20Airport%20(EKAH)-C60C30?logo=denmark&logoColor=white" alt="Aarhus Airport" />
  <img src="https://img.shields.io/badge/ROS%202-Jazzy%20Jalisco-22314E?logo=ros&logoColor=white" alt="ROS 2 Jazzy" />
  <img src="https://img.shields.io/badge/Gazebo-Harmonic-FF6F00?logo=gazebo&logoColor=white" alt="Gazebo Harmonic" />
  <img src="https://img.shields.io/badge/Ubuntu-24.04%20LTS-E95420?logo=ubuntu&logoColor=white" alt="Ubuntu 24.04" />
  <img src="https://img.shields.io/badge/Nav2-Autonomous%20Navigation-3498DB" alt="Nav2" />
  <img src="https://img.shields.io/badge/Robot-AgileX%20Scout%20V2-2ECC71" alt="Robot Scout V2" />
</p>

</div>

---

## 🎥 Simulation Demo Showcase

<div align="center">
  <table>
    <tr>
      <td align="center" width="50%">
        <b>🛫 Aarhus Airport Runway Navigation & Patrol</b><br><br>
        <a href="assets/simulation_demo.mp4">
          <img src="assets/simulation_demo.gif" alt="Simulation Navigation Demo - Aarhus Airport" width="100%" style="border-radius: 6px; box-shadow: 0 4px 14px rgba(0,0,0,0.35);" />
        </a>
        <br><br>
        <sub><a href="assets/simulation_demo.mp4"><b>▶ Download / Watch Full HD Video (assets/simulation_demo.mp4)</b></a></sub>
      </td>
      <td align="center" width="50%">
        <b>📍 NUS EA Field Autonomous Navigation & Avoidance</b><br><br>
        <a href="assets/nus_ea_simulation_demo.mp4">
          <img src="assets/nus_ea_simulation_poster.png" alt="NUS EA Field Simulation Demo Poster" width="100%" style="border-radius: 6px; box-shadow: 0 4px 14px rgba(0,0,0,0.35);" />
        </a>
        <br><br>
        <sub><a href="assets/nus_ea_simulation_demo.mp4"><b>▶ Download / Watch Full 60 FPS Video (assets/nus_ea_simulation_demo.mp4)</b></a></sub>
      </td>
    </tr>
  </table>
</div>

---

## 📖 Overview & Simulation Environments

The system supports two distinct outdoor simulation environments:
1. **Aarhus Airport Runway (EKAH)**: A 100m high-fidelity asphalt runway for centerline inspection, high-speed patrol, and dynamic FOD obstacle avoidance.
2. **NUS EA Field**: An outdoor campus courtyard featuring intricate concrete walkways, open grass areas, buildings, and custom pedestrian obstacle layouts.

<div align="center">
  <h3>📍 1. NUS EA Field Environment</h3>
  <table>
    <tr>
      <td align="center" width="50%">
        <b>🗺️ NUS EA Field Aerial Satellite Model</b><br><br>
        <img src="assets/nus_ea_field_texture.png" alt="NUS EA Field Aerial Satellite Model" width="100%" style="border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);" />
      </td>
      <td align="center" width="50%">
        <b>📐 NUS EA Field Dimensions & Boundaries</b><br><br>
        <img src="assets/nus_ea_field_dimensions.png" alt="NUS EA Field Dimension Model" width="100%" style="border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);" />
      </td>
    </tr>
  </table>

  <h3>📍 2. Aarhus Airport Runway (EKAH) Environment</h3>
  <table>
    <tr>
      <td align="center" width="50%">
        <b>🌐 Aarhus Airport (EKAH) Gazebo 3D Runway</b><br><br>
        <img src="assets/gazebo_runway_world.png" alt="Aarhus Airport Gazebo Runway World" width="100%" style="border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);" />
      </td>
      <td align="center" width="50%">
        <b>🛫 Aarhus Airport Runway Surface Model</b><br><br>
        <img src="assets/runway_ground_plane.png" alt="Aarhus Airport Runway Surface Texture" width="100%" style="border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);" />
      </td>
    </tr>
  </table>
</div>

<table>
  <tr>
    <td width="50%">
      <h3>🤖 Robotic Platform</h3>
      <ul>
        <li><b>Chassis:</b> AgileX Scout V2 4WD differential-drive rover</li>
        <li><b>RTK-GNSS:</b> Centimeter-level NavSat receiver (<code>/gps/fix</code>, 10 Hz) with realistic Gaussian noise</li>
        <li><b>9-DOF IMU:</b> High-rate inertial sensor (<code>/imu/data</code>, 50 Hz) for gyro angular rate & acceleration</li>
        <li><b>2D LiDAR:</b> Hokuyo laser scanner (<code>/scan</code>) for obstacle avoidance & costmap generation</li>
        <li><b>Forward Camera:</b> Optical sensor (<code>/camera/image_raw</code>) for forward visual feed</li>
        <li><b>State Estimation:</b> Dual Extended Kalman Filter (<code>robot_localization</code>) fusing RTK-GNSS + IMU + Wheel Odometry to eliminate wheel-scrub drift on featureless runways</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🧠 Autonomous Stack</h3>
      <ul>
        <li><b>Global Planning:</b> Nav2 Smac Planner Hybrid (Hybrid A*) with continuous Reeds-Shepp curvature curves (R ≥ 1.0m) to eliminate skid-steer tire scrubbing</li>
        <li><b>Local Controller:</b> Regulated Pure Pursuit (RPP) with curvature speed scaling & in-place rotation</li>
        <li><b>Navigation Speed:</b> High-speed patrol up to <b>10 km/h</b> (2.78 m/s) with dynamic cornering regulation</li>
        <li><b>Obstacle Avoidance:</b> Expanded 1.20m inflation safety boundary around obstacles & pedestrians</li>
        <li><b>Visualization:</b> Pre-configured RViz2 inspection interface</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🗂️ Repository Architecture

```text
runway_sim_ws/
├── assets/                   # Simulation demo video recordings, snapshots, & poster previews
│   ├── simulation_demo.mp4   # Full simulation demonstration video (HD 60fps)
│   ├── simulation_demo.gif   # Animated simulation demo preview (auto-plays on GitHub)
│   ├── demo_poster.jpg       # Video preview poster
│   ├── gazebo_runway_world.png # Gazebo 3D simulation runway world snapshot
│   ├── runway_ground_plane.png # Airport runway surface terrain model
│   └── rviz_inspection_view.png # RViz autonomous navigation screenshot
├── src/
│   ├── 📦 runway_description/       # URDF/XACRO model, sensor meshes, and Gazebo world
│   │   ├── launch/sim.launch.py     # Gazebo Harmonic launcher + ROS-GZ bridges
│   │   ├── meshes/                  # Base link, Hokuyo LiDAR, and wheel meshes (.dae)
│   │   ├── models/                  # Airport runway terrain, lighting, & person obstacle models
│   │   ├── urdf/                    # Scout V2 xacro definitions & sensor mount transforms
│   │   └── worlds/airport_runway.sdf # High-fidelity runway environment
│   │
│   ├── 🧭 runway_navigation/        # Nav2 autonomous navigation & costmap stack
│   │   ├── config/ekf.yaml          # Dual EKF + NavSat transform configuration (Airport Runway)
│   │   ├── config/ekf_nus.yaml      # Dual EKF + NavSat transform configuration (NUS EA Field)
│   │   ├── config/nav2_params.yaml  # Tuned Nav2 parameters for ROS 2 Jazzy
│   │   ├── launch/bringup_nav2.launch.py # Map server, Dual EKF, and Nav2 lifecycle
│   │   ├── launch/runway_navigation_launch.py # Custom lightweight navigation launcher
│   │   ├── maps/                    # 100m × 20m occupancy grid map (runway_map.yaml/pgm)
│   │   └── rviz/runway_nav2.rviz    # Pre-configured RViz2 inspection interface
│   │
│   └── 📡 runway_communication/     # Inter-agent C2 telemetry, mission ledger, and tactical HUD
│       ├── ugv_c2_bridge_node.py     # C2 bridge, task ledger state machine, & FIFO goal queue
│       ├── uav_waypoint_commander.py # Aerial C2 radar HUD, multi-waypoint patrol & alert GUI
│       ├── DemoComs_C2.py            # Headless multi-target FOD alert transmitter script
│       └── package.xml
│
├── 🚀 rpi5_uav/                     # Standalone deployment package for RPi 5 / UAV simulated PC
│   ├── uav_waypoint_commander.py     # Tactical GUI & headless CLI node
│   ├── DemoComs_C2.py                # Automated FOD alert dispatcher
│   ├── run_uav_gui.sh                # 1-click launcher for 2D tactical HUD
│   ├── run_uav_headless.sh           # 1-click launcher for SSH CLI
│   ├── run_uav_demo.sh               # 1-click automated demo runner
│   ├── setup_dds.sh                  # CycloneDDS environment config
│   ├── cyclonedds.xml                # Unicast peer discovery XML
│   ├── deploy_to_rpi5.sh             # 1-click deployment script (rsync to RPi 5)
│   └── README.md                     # Step-by-step RPi 5 setup guide
│
└── 📄 README.md
```

---

## ⚙️ Prerequisites & One-Time Installation

If you are setting this up on a fresh machine or have never used ROS 2 before, follow these steps:

### 1. System Requirements
- **Operating System:** Ubuntu 24.04 LTS (Noble Numbat)
- **ROS Version:** ROS 2 Jazzy Jalisco
- **Simulator:** Gazebo Sim (Harmonic / `gz-sim`)

### 2. Install Required Packages
Open a terminal (<kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>T</kbd>) and run:

```bash
sudo apt update && sudo apt install -y \
  python3-colcon-common-extensions \
  ros-jazzy-navigation2 \
  ros-jazzy-nav2-bringup \
  ros-jazzy-ros-gz-sim \
  ros-jazzy-ros-gz-bridge \
  ros-jazzy-robot-state-publisher \
  ros-jazzy-joint-state-publisher \
  ros-jazzy-xacro \
  ros-jazzy-tf2-ros \
  ros-jazzy-tf2-tools
```

---

## 🔨 Building the Project

Before running the simulation for the first time (or whenever code is modified), build the workspace:

```bash
cd ~/runway_sim_ws
source /opt/ros/jazzy/setup.bash
colcon build --symlink-install
source install/setup.bash
```

> [!NOTE]
> *`source /opt/ros/jazzy/setup.bash` loads ROS 2 commands, and `source install/setup.bash` loads this project's custom packages into the current terminal.*

---

## 🚀 Step-by-Step Running Guide

### 1. Launch Simulation & Navigation (All-in-One Launcher)
Launch Gazebo Harmonic, Nav2 (Hybrid A* + RPP), and RViz2 together in a **single terminal window**:

```bash
source /opt/ros/jazzy/setup.bash && source ~/runway_sim_ws/install/setup.bash

# For NUS EA Field (default):
ros2 launch runway_navigation sim_and_nav.launch.py

# Or for Aarhus Airport Runway:
ros2 launch runway_navigation sim_and_nav.launch.py world_name:=airport_runway
```
*(Gazebo launches immediately, followed by Nav2 and RViz2 after a 5-second automatic initialization delay. Press Ctrl+C to close everything cleanly together).*

---

### 2. (Optional) Spawn Pedestrians & Obstacles

If you want to test dynamic obstacle avoidance, open a second terminal and spawn people:

#### For NUS EA Field:
```bash
ros2 run ros_gz_sim create -file ~/runway_sim_ws/src/runway_description/models/person/model.sdf -name person_1 -x -1.95 -y 10.32 -z 0.0 && \
ros2 run ros_gz_sim create -file ~/runway_sim_ws/src/runway_description/models/person/model.sdf -name person_2 -x 4.39 -y 8.48 -z 0.0 && \
ros2 run ros_gz_sim create -file ~/runway_sim_ws/src/runway_description/models/person/model.sdf -name person_3 -x 4.24 -y 7.52 -z 0.0 && \
ros2 run ros_gz_sim create -file ~/runway_sim_ws/src/runway_description/models/person/model.sdf -name person_4 -x 7.59 -y 10.24 -z 0.0 && \
ros2 run ros_gz_sim create -file ~/runway_sim_ws/src/runway_description/models/person/model.sdf -name person_5 -x 10.71 -y 9.51 -z 0.0
```

#### For Aarhus Airport Runway:
```bash
ros2 run ros_gz_sim create -file ~/runway_sim_ws/src/runway_description/models/person/model.sdf -name person_1 -x 4.0 -y 0.5 -z 0.0 && \
ros2 run ros_gz_sim create -file ~/runway_sim_ws/src/runway_description/models/person/model.sdf -name person_2 -x 5.5 -y -1.0 -z 0.0 && \
ros2 run ros_gz_sim create -file ~/runway_sim_ws/src/runway_description/models/person/model.sdf -name person_3 -x 7.0 -y 0.0 -z 0.0
```

---

## 🕹️ How to Drive & Navigate the Robot

<div align="center">
  <img src="assets/rviz_inspection_view.png" alt="Nav2 RViz Inspection View" width="750" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.25);" />
</div>

Follow these simple mouse actions in the **RViz2 window**:

1. Look at the top toolbar in RViz2 and click the **`Nav2 Goal`** button (or press the <kbd>g</kbd> key on your keyboard).
2. Move your cursor to the desired destination on the map.
3. **Left-click and hold** at your desired destination point.
4. **Drag the mouse** in the direction you want the robot to face when it arrives.
5. **Release the mouse button**.

**Result:**
- A **green line** (global path) will appear connecting the robot to the goal.
- The robot will immediately start driving autonomously in both Gazebo and RViz2 while dynamically avoiding any spawned obstacles!

---

## ⚡ Nav2 Performance & Kinematics Configuration

The autonomous navigation stack has been optimized for the AgileX Scout v2 4WD platform:

| Parameter | Value | Description |
| :--- | :--- | :--- |
| **Global Planner** | `SmacPlannerHybrid` | Hybrid A* SE(2) planner with continuous curvature arcs ($R_{\min} = 1.0\text{ m}$) |
| **Local Controller** | `RegulatedPurePursuitController` | Path tracking with lookahead regulation & collision detection |
| **Max Linear Velocity** | **$2.78\text{ m/s}$ ($10.0\text{ km/h}$)** | High-speed runway & courtyard traverse |
| **Min Lookahead Distance** | **$1.00\text{ m}$** (Max: $3.50\text{ m}$) | Lookahead dynamically scaled with vehicle speed |
| **Rotate-to-Heading** | `True` ($\Delta\theta > 45^\circ$) | In-place zero-radius turns before setting off on new path segments |
| **Curvature Speed Scaling** | $R_{\min} = 1.20\text{ m}$, $V_{\min} = 0.60\text{ m/s}$ | Automatically reduces speed on tight corners to prevent skid-steer drift |
| **Inflation Radius** | **$1.20\text{ m}$** (`cost_scaling_factor: 2.0`) | Enhanced safety margin around dynamic pedestrian obstacles |

---

## 🚁 Raspberry Pi 5 (Simulated UAV) Waypoint Integration

You can connect an external **Raspberry Pi 5** (or simulated UAV node) over your local network to:
1. **View the live map** (NUS EA Field or Runway) and real-time UGV location.
2. **Send navigation goals** (single clicks or multi-point patrol missions) directly from the RPi5 to the UGV in Gazebo.

### Quick Start with Standalone `rpi5_uav/` Package:

All scripts and configurations needed on the Raspberry Pi 5 / simulated UAV PC are packaged in the standalone **`rpi5_uav/`** folder:

```bash
# Option 1: 1-Click deploy from your PC to the RPi5 over network
./rpi5_uav/deploy_to_rpi5.sh 192.168.168.100 pi

# Option 2: Run directly on RPi5 (or secondary PC) inside the folder
cd rpi5_uav
./run_uav_gui.sh       # 2D Tactical Radar HUD & Map GUI
./run_uav_headless.sh  # Interactive SSH Terminal CLI
./run_uav_demo.sh      # Automated 3-target FOD alert demo
```
> 📖 **Full Setup Instructions:** See the complete [RPi5 Guide](rpi5_uav/README.md) and [Phase 1 UAV-UGV Communication Guide](Phase1_ugvuav_communications.md) for network configuration, unicast peer setup, and telemetry specs.

---

## 🎯 Semester 2 Implementation: Multi-Queue / Multi-Target Feature

In Phase 1 / Semester 1, the UGV navigation pipeline focused on single-goal intercept and basic sequential waypoint ingestion. For **Semester 2 autonomous operations**, the system transitions to **multi-target Foreign Object Debris (FOD) clearance and patrol routing**, where an aerial UAV reconnaissance scan or ground radar flags multiple debris coordinates concurrently across a 100m+ runway.

Managing multiple targets requires selecting an optimal queueing and route-planning policy to maximize operational clearance speed while minimizing energy drain and mechanical wear on the 4WD skid-steer rover.

---

### 1. Comparative Analysis: Routing & Queueing Algorithms

| Metric / Feature | **FIFO (First-In, First-Out)** *(Current Baseline)* | **Greedy / Nearest Neighbor (NN)** | **TSP (Traveling Salesperson Problem)** | **Priority-Weighted TSP** *(Semester 2 Target)* | **Genetic / Swarm (GA / ACO)** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Algorithmic Complexity** | $\mathcal{O}(1)$ push / pop | $\mathcal{O}(N^2)$ (or $\mathcal{O}(N \log N)$ with KD-Tree) | $\mathcal{O}(N^2)$ (2-Opt heuristic) / $\mathcal{O}(N!)$ (exact brute force) | $\mathcal{O}(N^2)$ with priority heuristic matrix | $\mathcal{O}(G \cdot P \cdot N)$ (generations $\times$ pop) |
| **Path Efficiency / Tour Length** | **Poor** (risk of severe zigzagging) | **Moderate** (local optima, ~15–25% off optimal) | **Optimal / Near-Optimal** ($\le 3$–$5\%$ above theoretical lower bound) | **Near-Optimal** (balanced against threat urgency) | **High** (near-optimal for very large sets) |
| **Total Runway Clearance Time** | Longest (frequent long cross-runway traverses) | Moderate | **Shortest** (monotonic sweep down strip) | Fast (clears critical hazards first, then sweeps) | Fast |
| **Skid-Steer Pivot Turns** | High frequency of $180^\circ$ zero-radius turns | Low-to-moderate | **Minimal** (smooth directional flow along runway) | Low | Low |
| **Tire Scrub & Odometry Slip** | High mechanical scrub & wheel slip drift | Moderate | **Lowest** (maximizes smooth forward driving) | Low | Low |
| **Hazard Priority / Urgency Awareness** | ⚠️ None (processed strictly in receipt order) | ⚠️ None (geometry only) | ⚠️ None (pure distance minimization) | **Native** (weights distance by threat severity & centerline risk) | Configurable via fitness function |
| **Real-Time Dynamic Re-planning** | Instantaneous | Instantaneous ($< 1\text{ ms}$) | Fast ($< 5\text{ ms}$ for $N \le 30$ using 2-Opt) | Fast ($< 10\text{ ms}$ in Python) | Slow (convergence latency $> 100\text{ ms}$) |
| **Implementation Complexity** | Trivial (built-in Python list queue) | Low (~20 lines of code) | Low-Medium (standard 2-Opt / Lin-Kernighan) | Medium (cost matrix + preemption logic) | High (requires external metaheuristic libraries) |

---

### 2. In-Depth Method Comparison & Operational Trade-offs

#### A. FIFO (First-In, First-Out) — Current Baseline
* **How It Works:** As FOD targets arrive over `/c2/target_alert`, they are appended to `self.goal_queue`. The UGV services targets in the exact order received (`self.goal_queue.pop(0)`).
* **Pros:**
  * Zero computational overhead; deterministic order; respects chronological detection timestamp.
* **Cons (The "Runway Yo-Yo" Effect):**
  * If the UAV detects FOD at $x = 10\text{ m}$, then $x = 85\text{ m}$, then $x = 18\text{ m}$, then $x = 75\text{ m}$, the UGV backtracks the full length of the runway three times.
  * Excessive zero-radius pivot rotations ($\Delta\theta > 45^\circ$) cause significant skid-steer tire scrubbing on tarmac and odometry drift.

#### B. Greedy / Nearest-Neighbor (NN)
* **How It Works:** From the UGV's current position $p_{\text{curr}}$, the next goal is always the closest unvisited target:
  $$\text{Next} = \arg\min_{i \in \text{Unvisited}} \| p_{\text{curr}} - p_i \|$$
* **Pros:**
  * Intuitive, extremely fast ($\approx 0.1\text{ ms}$), and dynamically adapts whenever the rover finishes a clearance task.
* **Cons (The "Stranded Outlier" Trap):**
  * Greedily picking the closest point can leave an isolated FOD item at the far end of the runway unvisited until the very end, requiring an expensive, uncoordinated final deadhead return transit.

#### C. Traveling Salesperson Problem (TSP with 2-Opt / Simulated Annealing)
* **How It Works:** Formulates the $N$ detected FOD coordinates into an open or closed tour that minimizes the total Euclidean traversal distance:
  $$\min_{\pi} \sum_{k=1}^{N-1} \| p_{\pi(k+1)} - p_{\pi(k)} \|$$
* **Pros:**
  * **30%–55% reduction in total distance traveled** compared to FIFO.
  * Transforms multi-point missions into a coherent, monotonic sweep down the runway strip, eliminating erratic backtracking.
  * Readily solved in under $3\text{ ms}$ for typical runway mission sizes ($N \le 25$) using the 2-Opt heuristic.
* **Cons:**
  * Pure geometric TSP treats a harmless plastic wrapper at $10\text{ m}$ identically to a catastrophic titanium turbine bolt at $80\text{ m}$.

#### D. Priority-Weighted TSP (Semester 2 Proposed Architecture)
* **How It Works:** Blends spatial travel cost with FOD severity scoring and runway safety zones (e.g. proximity to runway centerline $y = 0.0$):
  $$\text{Cost}(i, j) = \frac{\| p_i - p_j \|}{\alpha \cdot \text{ThreatScore}_j + \beta \cdot \text{CenterlineRisk}_j + (1 - \alpha - \beta)}$$
  * **Immediate Preemption:** High-priority alerts (`priority_level: "IMMEDIATE"`) immediately preempt the active Nav2 path.
  * **Batch Tour Optimization:** Queued routine targets (`priority_level: "NORMAL"`) are reordered into an optimal tour from the rover's projected position.
* **Pros:**
  * Critical hazards endangering flight operations are prioritized, while routine debris items along the transit path are remediated opportunistically with minimal detour.

#### E. Multi-Robot Task Allocation (MRTA / VRP) — Future Swarm Extension
* **How It Works:** Formulates the problem as a Capacitated Vehicle Routing Problem (CVRP) across multiple cooperative UGVs:
  * Constraints: UGV vacuum debris canister capacity, battery State of Charge (SoC), and dock/dump stations.
  * Solvers: Clarke-Wright Savings algorithm, Genetic Algorithms (GA), or Ant Colony Optimization (ACO).

---

### 3. Proposed Semester 2 Architecture in `ugv_c2_bridge_node`

```
  UAV Radar / Alert Ingestion (/c2/target_alert)
                       │
                       ▼
         ┌───────────────────────────┐
         │ Priority Classifier       │
         │ - IMMEDIATE vs NORMAL     │
         └─────────────┬─────────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
[ IMMEDIATE Alert ]         [ NORMAL Alert ]
 • Preempt active Nav2 goal   • Insert into target ledger
 • Clear / pause routine tour • Trigger Background Route Optimizer:
 • Direct route to hazard       - Build Distance & Threat Matrix
                                - Solve 2-Opt Open Tour from Current Pose
                                - Update self.goal_queue ordering
                                - Publish RViz2 Planned Tour Marker Line
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │ Sequential Nav2 Dispatcher   │
                      │ (Auto-advance upon COLLECTED)│
                      └──────────────────────────────┘
```

---

## 🛑 How to Stop & Clean Up

When you are done:
1. Go to each open terminal and press <kbd>Ctrl</kbd> + <kbd>C</kbd> to stop the running nodes.
2. If any background Gazebo or ROS 2 process remains open, run this cleanup command:

```bash
pkill -9 -f "gz sim|gzserver" 2>/dev/null; pkill -9 -f "ros2" 2>/dev/null; pkill -9 -f "rviz" 2>/dev/null; sleep 2
```

---

<div align="center">
  <sub>Runway & Outdoor Patrol Autonomous Inspection System • ROS 2 Jazzy & Gazebo Harmonic</sub>
</div>


