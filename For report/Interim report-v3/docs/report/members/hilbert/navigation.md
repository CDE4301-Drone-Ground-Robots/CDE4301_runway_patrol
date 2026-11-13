---
title: "Autonomous Runway Navigation & Kinematic Path Planning"
owner: "Hilbert Soh"
outline: [2, 3]
---

# Autonomous Runway Navigation & Kinematic Path Planning

> **Semester 1 · Software-in-the-loop navigation**  
> Physical FOD Hunter performance remains to be tested.

<!-- #region report -->

## 1. Objectives & Requirements {#sec-1-summary}

The UGV needs to reach FOD coordinates, stay within the permitted route and avoid obstacles. Open runway areas provide few landmarks for LiDAR-based localization, while wheel slip makes odometry less reliable. I therefore used LiDAR obstacle detection, GPS-assisted localization, Hybrid A\* planning and RPP path tracking.

The documented Semester 1 SIL speed baseline is **8.0 km/h**. The **15.0 km/h** physical-vehicle speed and **±0.10 m** localization accuracy are _targets_, not measured field results. The active SIL Hybrid A\* configuration uses a **1.0 m minimum planning radius**. A 1.5 m radius is a proposed setting for future physical trials, not the tested SIL configuration.

::: details Requirements and operating constraints

| Requirement           | Documented value                                 | Evidence status                  |
| --------------------- | ------------------------------------------------ | -------------------------------- |
| Baseline cruise speed | 8.0 km/h (2.22 m/s)                              | SIL configuration                |
| Future physical speed | 15.0 km/h                                        | Semester 2 target                |
| Localization accuracy | ±0.10 m                                          | Design requirement; not verified |
| Obstacle sensing      | 360° awareness, ≥30 m target                     | Sensor requirement               |
| Planning radius       | 1.0 m in SIL; 1.5 m proposed for physical trials | Configured versus planned        |

Runway conditions include bright sunlight and few fixed landmarks. The listed sensor requirements have not been validated on the physical UGV.

:::

## 2. System Architecture {#sec-2-overview}

The system follows **perception → localization → planning → control → actuation**. LiDAR data updates the obstacle costmaps. A local EKF combines wheel odometry and IMU data, while a global EKF uses GPS-derived position to correct drift. Nav2 plans a route [\[8\]](./references.md#ref-8) and Regulated Pure Pursuit (RPP) converts it into `/cmd_vel` commands [\[18\]](./references.md#ref-18). A behavior tree coordinates execution and recovery.

Both EKF nodes and `navsat_transform_node` ran in WSL2, publishing filtered odometry and the `map → odom → base_footprint` TF chain. This confirms that the localization pipeline ran, but not its motion-tracking accuracy.

<Figure src="./assets/diagrams/navigation-diagram.svg" alt="ROS 2 Nav2 navigation and TF2 dataflow" caption="Figure 3.2.1: Navigation architecture showing Nav2 data flow and TF transformations from sensing and localisation to planning, control and actuation." />

Target alerts enter through the communications bridge; packet transport, authentication and inter-agent dispatch are covered in [Communications →](./communications.md#sec-2-overview). The low-level wheel-speed conversion and skid-steer geometry are covered in [Steering Kinematics →](./steering-kinematics.md#sec-2-overview).

::: details ROS 2 frames, sensors and navigation interfaces

| Layer                   | Role                           | Documented interface    |
| ----------------------- | ------------------------------ | ----------------------- |
| Perception              | LiDAR-based obstacle awareness | `/scan` / local costmap |
| Local state estimation  | Wheel velocity + IMU yaw rate  | `odom → base_footprint` |
| Global state estimation | GNSS-corrected map pose        | `map → odom`            |
| Global planner          | Feasible route                 | Nav2 planning action    |
| Local controller        | Curvature-regulated tracking   | `/cmd_vel`              |
| Mission supervisor      | Goal dispatch and recovery     | BehaviorTree.CPP        |

The active simulation configures wheel odometry and IMU at **50 Hz**, GPS and LiDAR at **10 Hz**, and both EKFs at **30 Hz in simulation time**. The EKF nodes published these output topics in WSL2; wall-clock rates were lower while Gazebo ran below real time.

Nav2 coordinates mission execution via BehaviorTree.CPP v4, orchestrating task flow across global planning (`ComputePathToPose`), path following (`FollowPath`), and configured recovery behaviors (`Spin`, `BackUp`, `DriveOnHeading`, `Wait`). The interactive viewer below visualizes this execution tree, showing active node transitions and fallback recovery branching during navigation.

<NavigationWidget9 />

:::

## 3. Design Methodology & Selection {#sec-4-iterations}

I compared LiDAR sensors, localization methods, planners and controllers, focusing on odometry drift, turning constraints and path tracking.

::: details LiDAR sensor trade study

I compared five LiDAR options: WheelTec N10P, PaceCat LDS-M300, Hesai JT16, RPLiDAR S2, and Livox Mid-360S. I did not select 2D LiDAR because a single scan plane can miss low debris (&lt; 5 cm) and changes in ground height.

<Card title="Commercial LiDAR Sensor Engineering Evaluation">

Trade Study Analysis

| Sensor Model         | Architecture      | Field of View (H × V)       | Detection Range | Sunlight Immunity | Ingress Rating | Unit Cost    | Selection Verdict          |
| -------------------- | ----------------- | --------------------------- | --------------- | ----------------- | -------------- | ------------ | -------------------------- |
| **WheelTec N10P**    | 2D Planar         | $360^\circ \times 0^\circ$  | 10 – 25 m       | &lt; 30,000 lux   | IP54           | ~\$180 SGD   | Rejected • Sunlight Blind  |
| **PaceCat LDS-M300** | 2D Planar         | $360^\circ \times 0^\circ$  | 30 m            | 60,000 lux        | IP65           | ~\$250 SGD   | Rejected • Single-Plane 2D |
| **Hesai JT16**       | **3D Volumetric** | $360^\circ \times 40^\circ$ | 30 m            | 100,000 lux       | IP6K9K         | ~\$388 SGD   | Selected for Platform      |
| **RPLiDAR S2**       | 2D Planar         | $360^\circ \times 0^\circ$  | 30 m            | 80,000 lux        | IP65           | ~\$450 SGD   | Rejected • Planar Only     |
| **Livox Mid-360S**   | 3D Solid-State    | $360^\circ \times 59^\circ$ | 40 m            | 100,000 lux       | IP67           | ~\$1,100 SGD | Rejected • Budget Exceeded |

</Card>

I selected the Hesai JT16 for its vertical scanning coverage, stated sunlight tolerance and 0.05–30 m specified range. These are supplier specifications, not results from outdoor field tests.

:::

::: details Localization choice and Dual-EKF MATLAB demonstration

Open runways have fewer features for LiDAR scan matching. Although 2D LiDAR SLAM is often used indoors [\[17\]](./references.md#ref-17), open pavement can make scan matching less reliable [\[22\]](./references.md#ref-22). Skid-steer turning also causes wheel slip, so wheel odometry alone can accumulate position error. A constant yaw-rate bias $b_\omega$ produces a heading error $\theta(t)=b_\omega t$; the resulting position error depends on the route and speed.

I chose a Dual-EKF arrangement using `robot_localization` [\[9\]](./references.md#ref-9). In the Gazebo implementation, the local EKF fuses **50 Hz simulated wheel odometry and 50 Hz IMU measurements** and publishes `odom → base_footprint`. A `navsat_transform_node` converts **10 Hz simulated GPS fixes** to Cartesian odometry for the global EKF, which publishes `map → odom`. Both EKFs are configured at **30 Hz in simulation time**. This is simulated GPS, not a physical RTK-GNSS accuracy test.

<Card title="Dual-EKF State Estimation — Sensor Fusion Principles" tag="Simulation Concept">

_Conceptual Comparison: Pure Odometry, Local Dead-Reckoning, and GPS-Corrected Global EKF_

To evaluate state estimation principles before hardware deployment, I developed an educational numerical model in MATLAB (`ekf-demo-test.mlx`) comparing three localization regimes: uncorrected open-loop dead-reckoning, local EKF (fusing wheel odometry and IMU), and global EKF (incorporating periodic 2 Hz GNSS fixes). 

_Educational Model Parameters:_ Duration: $75\text{ s}$ • Speed: $1.3\text{ m/s}$ • Path length: $97.50\text{ m}$ • Simulation rate: $60\text{ Hz}$ ($dt \approx 0.0167\text{ s}$) • GPS rate: $2\text{ Hz}$ ($\sigma_{\text{gps}} = 0.6\text{ m}$) • Wheel noise: $\sigma_v = 0.12\text{ m/s}$ • IMU yaw noise: $\sigma_\omega = 0.35^\circ/\text{s}$ ($b_\omega = 0.03^\circ/\text{s}$) • Odometry yaw bias: $b_{\omega,\text{odom}} = 0.50^\circ/\text{s}$ • Seed: `102`.

The animated 60 FPS trajectory simulation and cumulative tracking-error evaluation are presented in [Section 5 (Video 3.2.3)](#sec-6-testing).

</Card>

I built a MATLAB model to compare odometry drift with periodic GPS correction. It does not measure Gazebo or physical localization accuracy.

_MATLAB limitation:_ The model uses differential-drive kinematics and simulated noise. It does not measure tire slip on wet pavement. See [Simulation](./simulation.md).

The local and global filters serve different purposes:

1. **Local estimation:** Provides smooth velocity feedback without GPS correction jumps.
2. **GNSS loss:** Local dead reckoning continues, but position uncertainty increases without absolute corrections.

:::

### 3.1 Global Planner Selection: A*, Theta* and Hybrid A\* {#nav-planner-tradeoffs}

I considered **A\*** as a grid-search baseline because it is straightforward to implement and provides a useful reference for path length and search effort. **Theta\*** was also considered: its line-of-sight checks can produce shorter, any-angle paths, but add computational work and do not enforce the UGV's turning radius. Whether Theta* is slower than A* in the target test conditions must be established from comparable benchmarks, not assumed.

Neither A* nor Theta* was run as a separate Nav2 planner benchmark in the project workspace; this is a design trade study, not a measured algorithm comparison. For the four-wheel skid-steer UGV, the main concern is **path geometry**. A short path is not necessarily easy to follow: abrupt heading changes can require strong steering corrections and tire scrub. **Hybrid A\*** was therefore considered for curvature-constrained planning, accepting the cost of searching position and heading rather than grid position alone. The planned path must also be trackable by the chosen controller [\[15\]](./references.md#ref-15), [\[16\]](./references.md#ref-16).

### 3.2 Local Controller Selection: RPP and MPPI {#nav-controller-tradeoffs}

**Regulated Pure Pursuit (RPP)** was used for the **8 km/h software-in-the-loop baseline** because it tracks a planned path with relatively low computational demand and regulates speed around curves [\[18\]](./references.md#ref-18). Short lookahead can cause repeated steering corrections. Longer lookahead can smooth steering but may cut corners. I therefore tuned lookahead alongside speed regulation and obstacle clearance. Increasing lookahead alone does not make higher-speed tracking safe.

RPP is primarily a **geometric controller**. It does not explicitly predict the full dynamics of the proposed 65 kg skid-steer vehicle, including tire slip, motor torque limits and actuator response. **MPPI** was considered but not integrated into the final simulation because of development-computer resource constraints; no comparable runtime benchmark was retained. It remains a possible alternative because it evaluates predicted control sequences and can penalize tracking error, obstacles and abrupt commands [\[19\]](./references.md#ref-19). However, standard MPPI configurations also depend on the chosen motion model: mass, momentum and tire friction are **not automatically represented**. MPPI also needs more computation and tuning. I have not compared it against RPP in a controlled runtime benchmark or on the physical UGV.

::: details Planner comparison, supporting media and limitations

| Approach   | Benefit                                                    | Limitation / decision                                                          |
| ---------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| A\*        | Simple, useful grid-search baseline                        | Grid-constrained headings; path smoothing may be needed                        |
| Theta\*    | Any-angle, potentially shorter paths                       | Line-of-sight checks; no built-in vehicle turning-radius constraint            |
| Hybrid A\* | Incorporates heading and curvature constraints             | Larger search space; motion-model and controller compatibility must be checked |
| RPP        | Lightweight tracking with curvature-based speed regulation | Lookahead trade-off; no full vehicle-dynamics prediction                       |
| MPPI       | Predictive trajectory sampling and configurable costs      | Higher computation/tuning demand; dynamics depend on the model used            |

<VideoClip 
  src="./assets/videos/Global Path Planning Comparison.mov" 
  poster="./assets/images/posters/global-path-planning-comparison-poster.jpg"
  caption="Video 3.2.1: SmacPlannerHybrid global path generation in Gazebo/RViz around obstacles showing start/goal poses and continuous Reeds-Shepp lattice expansion." 
/>

<Figure 
  src="./assets/diagrams/astar-vs-hybrid-astar-comparison.svg" 
  alt="A* versus Hybrid A*: side-by-side route comparison" 
  caption="Figure 3.2.2: Analytical path comparison between discrete 2D A* and SmacPlannerHybrid (SE(2) Reeds-Shepp lattice), showing kinematic heading continuity (geometric comparison, not physical benchmark)." 
/>

Hybrid A\* limits planned curvature to a 1.0 m minimum turning radius, so the planned path avoids the pivot turns a grid planner may produce. The reduction in turning was not measured; further measurement is required. See [Simulation & Validation](./simulation.md#sim-testing).

:::

## 4. Implementation & Prototype {#sec-5-implementation}

I implemented the navigation stack in **ROS 2 Jazzy and Gazebo Harmonic** using software-in-the-loop (SIL) testing. This was not a test of the completed physical UGV. Nav2 lifecycle nodes [\[8\]](./references.md#ref-8), costmaps, localization, a global planner, RPP [\[18\]](./references.md#ref-18) and behavior-tree recovery form the implementation. Correct transform ownership is essential: the local estimator must supply smooth odometry, while global corrections update the map relationship without causing abrupt control-frame jumps.

For the complete simulation environment, bridge topics and benchmark setup, see [Simulation Architecture →](./simulation.md#sec-2-overview).

::: details Nav2 configuration and costmaps

The active simulation uses a 10 Hz LiDAR sensor; the obstacle layer uses raytracing (15 m clearing range and 12 m marking range) and an inflation layer (`inflation_radius: 1.20 m`, `cost_scaling_factor: 2.0`) for safety margins. The costmaps are configured at 0.05 m resolution, with a 12 m × 12 m local rolling window updated at 5 Hz. The global costmap takes the resolution of the loaded map (0.028 m for the NUS EA Field map).

`SmacPlannerHybrid` is described with 64 heading bins and Reeds–Shepp analytical expansions. RPP is described at 20 Hz with velocity-scaled lookahead. **Planner–controller reverse-motion compatibility is an identified limitation:** Hybrid A\* uses Reeds–Shepp (`minimum_turning_radius: 1.0 m`, 64 heading bins), but RPP has `allow_reversing: false`. The current controller may not follow paths containing reverse cusps. I retained Reeds–Shepp and will test this failure case before physical deployment.

BehaviorTree.CPP supervises waypoint execution and recovery actions such as costmap clearing, backing up and spin recovery.

:::

<VideoClip 
  src="./assets/videos/131026-ugv-dual-ekf-test.mov" 
  poster="./assets/images/posters/131026-ugv-dual-ekf-test-poster.jpg"
  caption="Video 3.2.2: Dual-EKF state estimation test in Gazebo SIL: local odometry smoothing coupled with simulated RTK-GNSS global drift correction." 
/>

The numerical simulation (`ekf-demo-test.mlx`) models a 97.5 m multi-turn course to contrast open-loop dead-reckoning against the Dual-EKF observer. Continuous wheel slip and angular rate bias cause pure odometry to accumulate unbounded trajectory drift, whereas fusing simulated 100 Hz IMU angular velocity and 2 Hz georeferenced position fixes bounds cumulative estimation error (simulation model, not physical field test accuracy).

<VideoClip 
  src="./assets/videos/Dual EKF matlab demo.mov" 
  poster="./assets/images/posters/dual-ekf-matlab-demo-poster.jpg" 
  caption="Video 3.2.3: MATLAB simulation comparison of unbounded dead-reckoning drift against bounded Dual-EKF fusion with IMU and georeferenced pose fixes (simulation model, not physical field test)." 
/>

::: details Dual-EKF implementation diagrams

The local `ekf_filter_node_odom` fuses simulated wheel velocity and IMU measurements for `odom → base_footprint`; the global `ekf_filter_node_map` uses GPS-derived odometry from `navsat_transform_node` for `map → odom`. In a recorded WSL2 session, all three nodes were active, `/odometry/local` and `/odometry/gps` published messages, and both TF links were observed. The ROS 2 logs also show the EKF nodes running in 23 navigation sessions, during which 57 goals were reached using the `map → odom → base_footprint` chain. This shows the pipeline running during navigation; it does **not** establish localization accuracy, which was not measured against ground truth.

In SIL testing, open-loop wheel dead-reckoning accumulates unbounded drift from simulated tire slip (Video 3.2.4), whereas the Dual-EKF observer combines high-rate local IMU smoothing with global GNSS corrections against Gazebo simulation ground truth (Video 3.2.2).

<VideoClip 
  src="./assets/videos/131026_UGV_Pure_odom_test.mov" 
  poster="./assets/images/posters/131026-ugv-pure-odom-test-poster.jpg"
  caption="Video 3.2.4: Pure wheel odometry open-loop drift recording in Gazebo SIL demonstrating unbounded error growth under simulated tire slip." 
/>

The three architectures below illustrate the progressive stages of state estimation: open-loop integration suffers from unbounded drift due to wheel slip; the local EKF fuses wheel odometry with high-rate IMU angular rates to provide smooth, high-frequency estimates for controller tracking; and the global EKF integrates periodic georeferenced pose fixes to eliminate cumulative drift without causing discrete transform jumps in the control frame.

**Pure odometry (open-loop)**

<Figure src="./assets/diagrams/navigation-diagram-2.svg" alt="Pure odometry architecture" />

**Local EKF**

<Figure src="./assets/diagrams/navigation-diagram-3.svg" alt="Local EKF recursive observer" />

**Global EKF**

<Figure src="./assets/diagrams/navigation-diagram-4.svg" alt="Global EKF georeferenced observer" />

These are architectural diagrams; the MATLAB simulation (Video 3.2.3) is an educational noise-model demonstration rather than validation of physical RTK accuracy.

:::

In the RViz2 visualization (Figure 3.2.3), 10 Hz LiDAR point clouds populate the 0.05 m resolution local rolling window (12 m × 12 m). An exponential inflation layer (`inflation_radius: 1.20 m`, `cost_scaling_factor: 2.0`) buffers obstacle perimeters against the robot footprint, enabling RPP to execute collision-free local maneuvers.

<Figure 
  src="./assets/images/rviz_inspection_view.png" 
  alt="Nav2 Costmap Visualization in RViz2" 
  caption="Figure 3.2.3: Nav2 global and local rolling costmap visualization in RViz2 during airfield corridor sweep. Displays obstacle point cloud raytracing, costmap inflation layers, and vehicle footprint." 
/>

### Interactive Pathfinding Demonstration {#sec-4-visualizer}

The browser sandbox illustrates **discrete 8-connected grid search** and how obstacles affect routes. Its JavaScript runtime and explored-node counts must **not** be reported as native C++ Nav2 planner benchmarks.

::: details Open interactive pathfinding laboratory

Draw barriers, reposition the UGV start and FOD goal, and compare search behavior. The browser demo is conceptual and does not implement all Nav2 costmap costs or vehicle curvature constraints.

<NavigationWidget5 />

<NavigationWidget6 />

<NavigationWidget7 />

<NavigationWidget8 />

:::

### 4.5 Navigation Parameter Tuning {#sec-4-5-tuning}

I tuned Nav2 planning, control and costmap settings using simulation routes. The configured cruise baseline was **8.0 km/h**. The 15.0 km/h speed and centimetre-level tracking figures are physical design targets, not demonstrated results.

I first adjusted the parameters through repeated Gazebo runs and RViz observations during functional navigation testing. The sections below explain each change. Recorded planner times and goal outcomes from that testing are in [Simulation §5](./simulation.md#sim-testing).

I then used controlled Gazebo experiments to compare the effects of the lookahead and turning-radius settings. Every run restarted Gazebo and Nav2 and recorded the Gazebo ground-truth pose. The tracking runs all followed the same stored Hybrid A\* path on Route A of the airport map. Route A contains two major bends and approximately 97° of total planned heading change. Gazebo was limited to a real-time factor of 0.30. In the experiment configuration, the controller and velocity smoother ran at 6 Hz wall-clock, giving about 21 controller updates per simulated second; this is close to the configured 20 Hz in simulated time. Each configuration was repeated five times, and the tables give medians. Cross-track error (CTE) is the distance from the ground-truth position to the reference path. All results are from the AgileX Scout 2.0 simulation proxy, not the FOD Hunter; lateral acceleration and tire forces were not measured.

#### 1. RPP Lookahead Distance & Adaptive Scaling {#nav-tuning-lookahead}

- **Problem:** Longer lookahead increased path deviation through bends, while shorter lookahead produced more frequent steering corrections.
- **Parameter:** `lookahead_dist: 1.20 m`, `min_lookahead_dist: 0.40 m`, `max_lookahead_dist: 2.50 m`, `lookahead_time: 1.20 s`.
- **Reason:** Lookahead increases with speed $v$:
  $$L(v) = \text{clamp}(v \cdot t_{\text{lookahead}},\, L_{\min},\, L_{\max})$$
  This increases the preview distance with speed, up to the configured limit. At 2.22 m/s, the active velocity-scaled lookahead is clamped to **2.50 m** ($2.22 \times 1.2 = 2.66$ m). The **1.20 m** `lookahead_dist` applies only when velocity scaling is disabled; it is not the operating lookahead at that cruise speed.
- **Decision:** I retained velocity-scaled lookahead (0.4–2.5 m, 1.2 s) based on the steering behaviour observed in Gazebo.

**Fixed lookahead (velocity scaling disabled).** Holding the lookahead constant isolates the effect of the lookahead distance. Angular acceleration is the RMS rate of change of the RPP angular-velocity command.

| Fixed lookahead | RMS CTE | RMS angular acceleration |
| --------------: | ------: | -----------------------: |
|          0.60 m | 2.85 cm |               1.63 rad/s² |
|          1.20 m | 3.48 cm |               0.53 rad/s² |
|          2.50 m | 9.03 cm |               0.21 rad/s² |

RPP steers toward a point a distance $L$ ahead on the path and commands a curvature of $\kappa = 2y/L^2$, where $y$ is the lateral offset of that point in the robot frame. A short lookahead turns a small offset into a large curvature command: the robot corrects quickly, but its angular-velocity command changes more from cycle to cycle. A long lookahead gives gentler commands but corrects more slowly and aims further around a bend. The measurements follow this pattern: from 0.60 m to 2.50 m, RMS angular acceleration fell from 1.63 to 0.21 rad/s² while RMS CTE rose from 2.85 to 9.03 cm. On Route A, 1.20 m was a reasonable compromise: RMS CTE was 0.63 cm higher than at 0.60 m, while RMS angular acceleration was 68% lower. This holds for this route and speed; it does not make 1.20 m the best setting for every route.

<Figure src="./assets/images/nav-tuning-rpp-fixed-lookahead-recorded.png" alt="RPP fixed-lookahead trade-off: RMS and maximum cross-track error and RMS angular-command acceleration for 0.60, 1.20 and 2.50 m" caption="Figure 3.2.4: Fixed-lookahead trade-off on Route A (AgileX Scout 2.0 simulation proxy — Gazebo Harmonic). Points show the median and bars the range of five runs per setting." />

**Velocity-scaled lookahead (2.50 m cap in production, 4.0 m cap in the test variants).** The active lookahead was measured from the RPP lookahead point.

| Configuration | Median active lookahead | RMS CTE |
| ------------- | ----------------------: | ------: |
| 0.60 s        |                  1.33 m | 3.65 cm |
| 1.20 s        |                  2.66 m | 9.19 cm |
| 1.80 s        |                  4.00 m | 20.00 cm |
| Production (1.20 s, 2.50 m cap) |   2.50 m | 8.62 cm |

With velocity scaling, the lookahead follows the scaling law above. At the 2.22 m/s cruise speed, the production lookahead time of 1.20 s gives 2.66 m, above the 2.50 m cap. During cruising, the production configuration therefore behaved like a fixed 2.50 m lookahead (8.62 cm against 9.03 cm RMS CTE). Reducing the lookahead time to 0.60 s gives an active lookahead of 1.33 m, close to the 1.20 m fixed setting, and RMS CTE fell to 3.65 cm, 58% lower than the production setting. In both families, tracking error followed the active lookahead distance rather than the lookahead mode. Steering activity was slightly higher at 0.60 s (0.96 against 0.85 rad/s²).

The production configuration is unchanged. A 0.60 s lookahead time is a candidate setting, tested only on Route A at 8.0 km/h in simulation. Because the lookahead scales with speed, 0.60 s would give 2.50 m at the 15 km/h (4.17 m/s) design target (calculated, not tested). It therefore needs testing at other speeds and on other routes before adoption.

<Figure src="./assets/images/nav-tuning-rpp-scaled-lookahead-recorded.png" alt="RPP velocity-scaled lookahead comparison against lookahead time, including the production configuration" caption="Figure 3.2.5: Velocity-scaled lookahead trade-off on Route A across 0.60–1.80 s and production configuration (1.20 s, 2.50 m cap) (AgileX Scout 2.0 simulation proxy in Gazebo; median and range of 5 runs)." />

**Behaviour through the bends.** The recorded trajectories separate only at the two bends (Figure 3.2.6). On the straight between them, RMS CTE was below 0.1 cm for 0.60 and 1.20 m, and 1.3 cm for 2.50 m, which was still converging after the first bend.

- **Bend 1.** This bend starts at the start pose: the robot begins aligned with the x-axis while the path turns right immediately, so every setting first runs outside the turn. With 0.60 and 1.20 m, the deviation peaked at about 15 cm, 1.2 m along the path. With 2.50 m, the smaller curvature command delayed the correction, and the deviation reached 26 cm about 4 m along the path.
- **Bend 2.** At this gentler left-hand bend, the 2.50 m lookahead began turning before the bend (up to 2.9 cm inside the path) and then deviated up to 7.9 cm outside it, against 3.1 cm for 0.60 m.

The longer lookahead both anticipates a bend earlier and corrects the resulting error more slowly; this is the source of its higher CTE.

<Figure src="./assets/images/nav-tuning-rpp-trajectories-recorded.png" alt="Ground-truth trajectories for fixed lookahead 0.60, 1.20 and 2.50 m against the stored Hybrid A* path, with zooms of both bends" caption="Figure 3.2.6: Ground-truth trajectories for fixed lookahead (0.60, 1.20, 2.50 m) against stored Hybrid A* path with bend details (AgileX Scout 2.0 proxy in Gazebo; 5 unsmoothed runs per setting)." />

#### 2. Cross-Track Error & Steering Oscillation Damping {#nav-tuning-cte}

- **Problem:** Abrupt changes in the target point along the discrete global path can cause repeated heading corrections across corridor centrelines.
- **Parameter:** `transform_tolerance: 0.10 s`, `max_angular_accel: 2.5 rad/s²`.
- **Engineering Rationale:** Limiting angular acceleration smooths the commanded turn rate, and the Smac path smoother reduces abrupt heading changes in the planned path. This is a geometric explanation, not proof of zero tracking error.
- **Measured:** CTE and angular-command acceleration are given in Section 1 above. The largest errors occurred at the first bend, where the path turns from 0° to about −67° directly from the start pose.

#### 3. Curvature-Regulated Velocity Scaling {#nav-tuning-curvature}

- **Problem:** Taking tight bends at $2.22\text{ m/s}$ increases the required lateral acceleration ($a_y=v^2\kappa$). This may cause slip if available traction is insufficient; tire forces were not measured in the simulation.
- **Parameter:** `use_regulated_linear_velocity_scaling: true`, `regulated_linear_scaling_min_radius: 0.80 m`, `regulated_linear_scaling_min_speed: 0.40 m/s`.
- **Reason:** When the path radius $R$ falls below `regulated_linear_scaling_min_radius` ($R_{\min} = 0.80$ m), RPP scales the commanded speed in proportion to the radius, with a floor of 0.40 m/s:
  $$v = \max\!\left(v_{\text{des}} \cdot \frac{R}{R_{\min}},\; v_{\text{floor}}\right) \quad \text{for } R < R_{\min}$$
  so tighter turns are approached more slowly.
- **Measured:** Across all fixed and velocity-scaled lookahead runs, the smallest radius to the RPP lookahead point was 0.915 m, above the 0.80 m regulation radius. Curvature regulation therefore did not activate on Route A, and the commanded speed stayed at 2.22 m/s until the robot was within about 1.5 m of the goal. These runs evaluate path tracking, not curvature-based speed reduction; a route with tighter bends is needed to test the regulation law. Lateral acceleration was not measured.

#### 4. Hybrid A\* Turning Radius & Heuristic LUT Tuning {#nav-tuning-smac}

- **Problem:** Grid-based paths can contain sharp changes in heading. Following them may require tight turns or pivots, which increase the calculated motor load.
- **Parameter:** `minimum_turning_radius: 1.0 m`, `analytic_expansion_ratio: 3.5`, `reverse_penalty: 2.5`.
- **Reason:** Reeds–Shepp paths respect the configured minimum turning radius ($R_{\min} \ge 1.0\text{ m}$); tire slip is not represented.
- **Heuristic table:** `lookup_table_size: 10.0 m` with `downsampling_factor: 2`.
- **Recorded result:** The ROS 2 logs show two planner changes. After the switch from SmacPlanner2D, every later session used SmacPlannerHybrid. After the heuristic table was reduced, Smac plugin configuration time on the NUS EA Field map fell from a median of 38.1 s (5 sessions) to 2.4 s (16 sessions).

**Turning-radius comparison.** The minimum turning radius sets the tightest curve that Hybrid A\* may plan. I compared 0.80, 1.00 and 1.50 m to see how the limit changes the planned path and how closely RPP follows it. For each setting I requested the Route A path five times (the planner returned the same path each time). I then drove the route five times with `NavigateToPose`, using the 1.20 m fixed lookahead. During these runs, Nav2 replanned about three times per simulated second.

| Minimum radius | Path length | Heading change | Path-relative RMS CTE |
| -------------: | ----------: | -------------: | --------------------: |
|         0.80 m |     35.42 m |         101.6° |               4.97 cm |
|         1.00 m |     35.62 m |          97.1° |               4.23 cm |
|         1.50 m |     35.52 m |          63.5° |               2.34 cm |

The turning-radius limit changes the shape of the whole path, not only the radius of each turn (Figure 3.2.8).

- **0.80 and 1.00 m:** the planner turned tightly near the start, ran a long straight segment and then added a second bend before the goal.
- **1.50 m:** the planner could not turn as sharply, so it used a gradual curve onto a more direct diagonal line to the goal.

The minimum planned radius followed the configured limit (0.81, 1.22 and 1.50 m), and the total planned heading change fell from 101.6° to 63.5° (Figure 3.2.7). Path length changed by less than 0.2 m and did not follow the radius in order, because the path shape changed rather than only the turns.

<Figure src="./assets/images/nav-tuning-smac-turning-radius-recorded.png" alt="Hybrid A* minimum turning radius against planned path length, planned heading change, minimum planned radius and planning request duration" caption="Figure 3.2.7: Hybrid A* turning radius evaluation on Route A geometry and wall-clock request duration (AgileX Scout 2.0 proxy in Gazebo; panel (d) includes ROS 2 action overhead, 5 requests per setting)." />

<Figure src="./assets/images/nav-tuning-smac-planned-paths-recorded.png" alt="Planned Route A paths for minimum turning radius 0.8, 1.0 and 1.5 m" caption="Figure 3.2.8: Planned Route A paths for minimum turning radius 0.8, 1.0 and 1.5 m (AgileX Scout 2.0 simulation proxy — Gazebo Harmonic). Planned geometry, not robot motion." />

Path-relative RMS CTE, measured against the latest published `/plan`, fell from 4.97 cm at 0.80 m to 2.34 cm at 1.50 m. A path with less heading change and gentler curvature gives RPP fewer and milder bends to follow, so the same lookahead lags the path less. The 1.50 m runs also had the lowest angular-command activity of the three settings. The controller adopted each new plan after a median of about 0.1 s of simulated time, so this metric is close to, but not exactly, the path being followed at each instant. All 15 runs reached the goal without recovery behaviours.

The production planner remains at 1.00 m. A 1.50 m limit is a candidate for open runway areas. It needs testing in narrow areas, where a larger turning radius leaves less room to find a feasible path. Median wall-clock planning request time was 0.13–0.15 s, including ROS 2 action communication. With the production 20 ms behaviour-tree server timeout, the first run at each setting was aborted because `follow_path` did not acknowledge the goal in time; for these runs, the timeout was 2000 ms in the experiment configuration. These results apply to Route A and the simulation proxy. Tire scrub was not measured, and a larger planned radius is not evidence of lower physical scrub.

::: details Complete Nav2 configuration parameters and master tuning matrix

The tuned values below are taken from `runway_navigation/config/nav2_params.yaml`. Recorded simulation results are summarised in [Simulation & Validation Results →](./simulation.md#sim-testing).

| Component          | Parameter                                    | Default Value    | Tuned Value                           | Engineering Justification                                                                              |
| :----------------- | :------------------------------------------- | :--------------- | :------------------------------------ | :----------------------------------------------------------------------------------------------------- |
| **RPP Controller** | `desired_linear_vel`                         | $0.5\text{ m/s}$ | $2.22\text{ m/s}$ ($8.0\text{ km/h}$) | Target Semester 1 baseline cruise speed for runway corridor sweep.                                     |
| **RPP Controller** | `lookahead_dist`                             | $0.6\text{ m}$   | $1.20\text{ m}$                       | Fixed-lookahead tuning reference; velocity-scaled lookahead is enabled in the final configuration.     |
| **RPP Controller** | `min_lookahead_dist`                         | $0.3\text{ m}$   | $0.40\text{ m}$                       | Lower bound for speed-scaled lookahead.                                                                |
| **RPP Controller** | `max_lookahead_dist`                         | $0.9\text{ m}$   | $2.50\text{ m}$                       | Caps lookahead to prevent severe corner-cutting around taxiway edges.                                  |
| **RPP Controller** | `lookahead_time`                             | $1.5\text{ s}$   | $1.20\text{ s}$                       | Velocity-scaled lookahead gain providing stable lead time at $2.22\text{ m/s}$.                        |
| **RPP Controller** | `use_regulated_linear_velocity_scaling`      | `true`           | `true`                                | Keeps automatic corner deceleration based on instantaneous path curvature.                             |
| **RPP Controller** | `regulated_linear_scaling_min_radius`        | $0.9\text{ m}$   | $0.80\text{ m}$                       | Curvature-based speed regulation threshold; distinct from the planner's 1.00 m minimum turning radius. |
| **RPP Controller** | `use_cost_regulated_linear_velocity_scaling` | `true`           | `true`                                | Keeps proportional deceleration near high-cost obstacle zones (`cost_scaling_dist: 1.0 m`).            |
| **Smac Planner**   | `minimum_turning_radius`                     | $0.4\text{ m}$   | $1.00\text{ m}$                       | Constrains planned curvature; does not directly measure tire scrub.                                    |
| **Smac Planner**   | `analytic_expansion_ratio`                   | $3.5$            | $3.5$                                 | Balances Reeds-Shepp analytic shot frequency with Voronoi collision checking.                          |
| **Costmap 2D**     | `inflation_radius`                           | $0.55\text{ m}$  | $1.20\text{ m}$                       | Enforces safe standoff margin exceeding UGV half-width ($0.33\text{ m}$) on taxiways.                  |
| **Costmap 2D**     | `cost_scaling_factor`                        | $10.0$           | $2.0$                                 | Provides smooth exponential cost decay for gradual proximity deceleration.                             |

:::

## 5. Testing & Results {#sec-6-testing}

Semester 1 SIL work examined waypoint execution, dynamic obstacle handling, localization under simulated noise and path tracking at the documented **8.0 km/h** baseline.

**Recorded results:** Across 93 ROS 2 development sessions:

- **Planner change:** the early sessions used SmacPlanner2D. Every later session used SmacPlannerHybrid (Hybrid A\*, Reeds–Shepp).
- **Faster planner start-up:** reducing the heuristic lookup table lowered Smac plugin configuration time from a median of 38.1 s to 2.4 s.
- **Goals reached:** the logs record 146 navigation goals reached. Goals came from RViz, scripts and the C2 bridge during development, so they are not a controlled trial set.
- **Localization during navigation:** the dual-EKF nodes ran in 23 of these sessions (57 goals reached).

See [Simulation & Validation Results →](./simulation.md#sim-testing) for the underlying results and their limits. These sessions tested functional waypoint execution. The controlled lookahead and turning-radius comparisons, which measured cross-track error and steering-command variation, are reported in [Section 4.5](#sec-4-5-tuning).

**Dynamic obstacle avoidance test:** In SIL simulation, dynamic obstacles (such as crossing ground vehicles or personnel) introduced into the planned corridor trigger LiDAR costmap marking, velocity scaling and trajectory replanning. In one recorded session, RPP reported an obstacle in its path 43 times during one 11.7 m goal and still reached the goal in 18.4 s. Obstacle clearance distance was not recorded. The recording is shown below.

<VideoClip 
  src="./assets/videos/131026-ugv-object-avoidance.mov" 
  poster="./assets/images/posters/131026-ugv-object-avoidance-poster.jpg"
  caption="Video 3.2.5: Dynamic obstacle avoidance and local costmap replanning in Gazebo Harmonic SIL, demonstrating robot deceleration and lateral avoidance around obstacle perimeter within inflation safety buffers." 
/>

::: details Navigation-specific test scope and evidence limits

| Test question                         | Test approach described                              | Evidence limitation                               |
| ------------------------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| Can a target be dispatched?           | C2 goal ingestion and Nav2 waypoint execution in SIL | Refer to communications and simulation logs       |
| Can the rover avoid obstacles?        | Dynamic costmap marking and replanning               | No outdoor obstacle trial established here        |
| Does global localization limit drift? | Simulated sensor noise and Dual-EKF demonstration    | Physical RTK accuracy not yet measured            |
| Can RPP track at baseline speed?      | Controlled Gazebo runs on Route A at 8.0 km/h (§4.5) | Simulation proxy, one route; physical CTE not yet measured |

The browser pathfinding visualizer and MATLAB educational video illustrate principles; they must not be substituted for physical test evidence.

:::

## 6. Engineering Discussion {#sec-7-evaluation}

**Limits at higher speeds:** The 8 km/h SIL controller settings cannot be assumed suitable for the 15 km/h physical design target. At a fixed turning radius, lateral acceleration increases with the square of speed, $a_y=v^2/R$. Increasing speed from 8 to 15 km/h raises the required lateral acceleration by about **3.5 times** for the same radius. This is a kinematic estimate, not a measured tire-force result. The physical UGV will need progressive speed testing, lookahead and curvature tuning, and checks of traction, braking and actuator limits. MPPI can be compared with RPP if the available computing hardware and model fidelity justify it.

Hybrid A* requires more search effort than grid A*, and reverse-capable paths must be compatible with the controller. Dual-EKF separates local odometry from global corrections, but physical GNSS quality and wheel slip still need testing.

Path planning, localization and skid-steer control need to be tested together. Detailed scrub-force and motor-current calculations are intentionally not repeated here; see [Motor Drivetrain Calculations →](./motor-drivetrain-calculation.md#sec-1-requirements) and [Steering Kinematics →](./steering-kinematics.md#sec-4-iterations).

## 7. Limitations & Semester 2 Plan {#sec-9-semester-2}

Semester 2 testing will focus on physical sensor integration, localization accuracy, high-speed tracking and compatibility between Reeds–Shepp paths and forward-only RPP. Gazebo ran at a real-time factor of about 0.31–0.33 in the recorded WSL2 session, so laptop runtime does not demonstrate full-speed real-time performance. Field tests will use logged measurements and defined pass/fail criteria.

The detailed owner-specific work breakdown is maintained in [Hilbert's Semester 2 Plan →](./semester-2-plan.md#programming-semester-2).

::: details Proposed navigation validation milestones

| Milestone                        | Planned verification                                                             |
| -------------------------------- | -------------------------------------------------------------------------------- |
| Physical sensor integration      | Check LiDAR, IMU, GNSS and wheel odometry topic rates and timestamps             |
| Planner–controller compatibility | Compare forward-only and reverse-capable path execution, including failure cases |
| RPP tuning                       | Measure cross-track error as speed increases toward the physical target          |
| Localization                     | Compare GNSS-corrected estimates against an independent reference                |
| End-to-end trials                | Demonstrate target dispatch, obstacle response and approach accuracy             |

_These are planned tests, not completed Semester 1 results._

:::

<!-- #endregion report -->

National University of Singapore · CDE4301 Capstone Project

[Academic references →](./references.md)
