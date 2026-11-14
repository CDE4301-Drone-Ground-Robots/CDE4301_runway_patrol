---
title: "Autonomous Runway Navigation & Kinematic Path Planning"
owner: "Hilbert Soh"
outline: [2, 3]
---

# Autonomous Runway Navigation & Kinematic Path Planning

> **Semester 1 · Software-in-the-loop navigation**  
> Physical FOD Hunter performance remains to be tested.

<!-- #region report -->

## 3.2.1 Objectives & Requirements {#sec-1-summary}

Autonomous runway patrol requires the UGV to navigate to detected foreign object debris (FOD) coordinates, maintain path containment within designated airport operational corridors, and proactively avoid ground obstacles. Vast airfield environments lack vertical planar features for geometric LiDAR localization, while skid-steer tire slip causes rapid odometry drift. The navigation stack therefore couples 3D LiDAR perception, Dual-EKF GNSS-inertial state estimation, kinematically constrained Hybrid A\* global planning, and Regulated Pure Pursuit (RPP) local path tracking.

The validated Semester 1 software-in-the-loop (SIL) baseline cruise speed is **8.0 km/h ($2.22\text{ m/s}$)**. The target operational sprint velocity of **15.0 km/h ($4.17\text{ m/s}$)** and global localization accuracy of **$\pm 0.10\text{ m}$** represent engineering design criteria for physical deployment rather than measured field outcomes. In the active SIL baseline, `SmacPlannerHybrid` enforces a **1.0 m minimum turning radius** to suppress tire scrub, with a 1.5 m radius evaluated as a candidate setting for open airfield sweeping.

::: details Requirements and operating constraints

| Requirement           | Documented value                                 | Evidence status                  |
| --------------------- | ------------------------------------------------ | -------------------------------- |
| Baseline cruise speed | 8.0 km/h (2.22 m/s)                              | SIL configuration                |
| Future physical speed | 15.0 km/h                                        | Semester 2 target                |
| Localization accuracy | ±0.10 m                                          | Design requirement; not verified |
| Obstacle sensing      | 360° awareness, ≥30 m target                     | Sensor requirement               |
| Planning radius       | 1.0 m in SIL; 1.5 m proposed for physical trials | Configured versus planned        |

Airfield operational constraints include high solar irradiance (&gt; 80,000 lux) and sparse vertical structure. Sensor specifications reflect manufacturer ratings pending on-vehicle environmental validation.

:::

## 3.2.2 System Architecture {#sec-2-overview}

The autonomous navigation system is structured as a pipeline of **perception → localization → planning → control → actuation**. Volumetric LiDAR scans update dynamic costmap layers. In parallel, a Dual-EKF architecture fuses wheel odometry and 9-DOF IMU streams for local high-rate dead-reckoning while integrating GNSS fixes to eliminate cumulative global drift. Nav2 orchestrates global path computation via `SmacPlannerHybrid` [\[8\]](./references.md#ref-8), and `RegulatedPurePursuitController` generates velocity commands (`/cmd_vel`) [\[18\]](./references.md#ref-18). A BehaviorTree.CPP supervisor coordinates waypoint sequencing and fault recovery.

In runtime simulation execution under WSL2, `ekf_filter_node_odom`, `ekf_filter_node_map`, and `navsat_transform_node` continuously published filtered odometry and maintained the complete `map → odom → base_footprint` TF tree, confirming functional middleware integration.

<Figure src="./assets/diagrams/navigation-diagram.svg" alt="ROS 2 Nav2 navigation and TF2 dataflow" caption="Figure 3.2.1: Navigation architecture showing Nav2 data flow and TF transformations from sensing and localisation to planning, control and actuation." />

Target mission dispatches enter via the inter-agent communications gateway ([Communications →](./communications.md#sec-2-overview)), while low-level wheel-speed mapping, ICR dynamics, and tire scrub calculations are documented in [Steering Kinematics →](./steering-kinematics.md#sec-2-overview).

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

## 3.2.3 Design Methodology & Selection {#sec-4-iterations}

LiDAR sensor architectures, state estimation frameworks, global planners, and local tracking controllers were evaluated against odometry drift, kinematic turning constraints, and path tracking stability.

::: details LiDAR sensor trade study

Five commercial LiDAR sensors were evaluated: WheelTec N10P, PaceCat LDS-M300, Hesai JT16, RPLiDAR S2, and Livox Mid-360S. Single-plane 2D LiDAR units were eliminated because their single scanning elevation cannot reliably detect low-profile airfield debris (&lt; 5 cm) or accommodate vehicle pitch variations on uneven pavement.

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

The Hesai JT16 3D volumetric LiDAR was selected based on its $40^\circ$ vertical field of view, 100,000 lux ambient sunlight immunity, IP6K9K ingress protection, and cost efficiency within the project budget envelope. Operational performance will be characterized during outdoor trials.

:::

::: details Localization choice and Dual-EKF MATLAB demonstration

Vast, feature-sparse airfield corridors undermine scan-matching SLAM frameworks that rely on persistent vertical geometry [\[17\]](./references.md#ref-17), [\[22\]](./references.md#ref-22). Concurrently, skid-steer locomotion induces significant lateral tire slip, causing pure wheel odometry to accumulate unbounded position drift (a constant yaw-rate bias $b_\omega$ generates cumulative angular error $\theta(t) = b_\omega t$ that compounds positional error exponentially over extended linear corridors).

To resolve this, a Dual-EKF sensor fusion topology was implemented via `robot_localization` [\[9\]](./references.md#ref-9). Local estimation fuses wheel odometry and IMU angular velocities at 50 Hz to publish high-rate, smooth `odom → base_footprint` transforms for controller feedback, isolated from discrete GNSS position jumps. Globally, `navsat_transform_node` converts 10 Hz GNSS fixes into map-frame coordinates, enabling the map-level EKF to publish drift-free `map → odom` corrections at 30 Hz.

<Card title="Dual-EKF State Estimation — Sensor Fusion Principles" tag="Simulation Concept">

_Conceptual Comparison: Pure Odometry, Local Dead-Reckoning, and GPS-Corrected Global EKF_

To evaluate state estimation principles before hardware deployment, I developed an educational numerical model in MATLAB (`ekf-demo-test.mlx`) comparing three localization regimes: uncorrected open-loop dead-reckoning, local EKF (fusing wheel odometry and IMU), and global EKF (incorporating periodic 2 Hz GNSS fixes). 

_Educational Model Parameters:_ Duration: $75\text{ s}$ • Speed: $1.3\text{ m/s}$ • Path length: $97.50\text{ m}$ • Simulation rate: $60\text{ Hz}$ ($dt \approx 0.0167\text{ s}$) • GPS rate: $2\text{ Hz}$ ($\sigma_{\text{gps}} = 0.6\text{ m}$) • Wheel noise: $\sigma_v = 0.12\text{ m/s}$ • IMU yaw noise: $\sigma_\omega = 0.35^\circ/\text{s}$ ($b_\omega = 0.03^\circ/\text{s}$) • Odometry yaw bias: $b_{\omega,\text{odom}} = 0.50^\circ/\text{s}$ • Seed: `102`.

The animated 60 FPS trajectory simulation and cumulative tracking-error evaluation are presented in [Section 3.2.5 (Video 3.2.3)](#sec-6-testing).

</Card>

The numerical model illustrates the mechanism of bounding dead-reckoning drift via periodic georeferenced corrections, though quantitative accuracy depends on empirical physical sensor noise.

_Model limitation:_ The simulation assumes idealized differential-drive kinematics and Gaussian noise, omitting lateral slip on wet pavement. See [Simulation](./simulation.md).

The local and global observers fulfill distinct functional roles:

1. **Local estimation:** Supplies high-frequency, continuous velocity feedback for trajectory tracking without discrete GNSS correction jumps.
2. **GNSS loss resilience:** Maintains dead-reckoning continuity during temporary satellite signal occlusion, bounded by IMU bias accumulation.

:::

### 3.2.3.1 Global Planner Selection: A*, Theta* and Hybrid A\* {#nav-planner-tradeoffs}

Standard **A\*** was evaluated as a grid-search baseline, while **Theta\*** introduced line-of-sight shortcutting for any-angle trajectories. However, neither enforces vehicle turning-radius constraints. For a 4-wheel skid-steer UGV, discrete grid paths contain abrupt heading changes that require high-friction in-place point turns, accelerating tire wear.

**Hybrid A\*** (`SmacPlannerHybrid`) was selected as the operational global planner [\[15\]](./references.md#ref-15), [\[16\]](./references.md#ref-16). By searching continuous SE(2) state space $(x, y, \theta)$ with Reeds–Shepp motion primitives, it generates kinematically feasible trajectories respecting the vehicle's minimum turning radius bound ($R_{\min} \ge 1.0\text{ m}$).

### 3.2.3.2 Local Controller Selection: RPP and MPPI {#nav-controller-tradeoffs}

**Regulated Pure Pursuit (RPP)** was selected for the **8.0 km/h baseline cruise implementation** [\[18\]](./references.md#ref-18). RPP resolves classic pure pursuit instability—where short lookaheads cause high-frequency steering chatter and long lookaheads cut corners—by dynamically scaling lookahead with velocity and regulating forward speed based on local path curvature and obstacle proximity.

RPP operates as a deterministic **geometric tracking controller** without modeling tire slip or dynamic friction limits. **Model Predictive Path Integral (MPPI)** control was considered as a predictive alternative [\[19\]](./references.md#ref-19) but, owing to development-computer resource and tuning constraints, was neither implemented nor benchmarked against RPP. RPP was retained for lower computational complexity; MPPI benchmarking on the Jetson Orin is a conditional Semester 2 objective.

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

Hybrid A\* limits planned curvature to a 1.0 m minimum turning radius, ensuring planned trajectories avoid discrete point-turn corners. Detailed turning performance is documented in [Simulation & Validation](./simulation.md#sim-testing).

:::

## 3.2.4 Implementation & Prototype {#sec-5-implementation}

The navigation stack was implemented within **ROS 2 Jazzy and Gazebo Harmonic** under a software-in-the-loop (SIL) testing framework. It integrates Nav2 managed lifecycle nodes [\[8\]](./references.md#ref-8), dynamic costmaps, Dual-EKF state estimation, `SmacPlannerHybrid` path planning, and `RegulatedPurePursuitController` trajectory tracking [\[18\]](./references.md#ref-18), supervised by BehaviorTree.CPP v4. Local estimation publishes continuous odometry for control, while global GNSS fusion updates only the map transform, keeping discrete jumps out of the control frame.

Simulation topology, bridge topics and benchmarking protocols are documented in [Simulation Architecture →](./simulation.md#sec-2-overview).

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

The MATLAB model (`ekf-demo-test.mlx`) contrasts open-loop dead-reckoning with the Dual-EKF observer on a 97.5 m multi-turn course. Wheel slip and angular-rate bias cause unbounded odometry drift, whereas fusing simulated 100 Hz IMU angular velocity and 2 Hz georeferenced fixes bounds the error (simulation model, not physical field accuracy).

<VideoClip 
  src="./assets/videos/Dual EKF matlab demo.mov" 
  poster="./assets/images/posters/dual-ekf-matlab-demo-poster.jpg" 
  caption="Video 3.2.3: MATLAB simulation comparison of unbounded dead-reckoning drift against bounded Dual-EKF fusion with IMU and georeferenced pose fixes (simulation model, not physical field test)." 
/>

::: details Dual-EKF implementation diagrams

In the Gazebo implementation, `ekf_filter_node_odom` fuses simulated wheel velocity and IMU measurements for `odom → base_footprint`, while `ekf_filter_node_map` integrates GPS-derived odometry from `navsat_transform_node` for `map → odom`. In benchmarked WSL2 sessions, all three nodes actively published `/odometry/local` and `/odometry/gps` while maintaining the required TF chain across 23 navigation sessions (57 goals reached), verifying structural software integration.

In SIL testing, open-loop wheel dead-reckoning accumulates unbounded drift from simulated tire slip (Video 3.2.4), whereas the Dual-EKF observer combines high-rate local IMU smoothing with global GNSS corrections against Gazebo simulation ground truth (Video 3.2.2).

<VideoClip 
  src="./assets/videos/131026_UGV_Pure_odom_test.mov" 
  poster="./assets/images/posters/131026-ugv-pure-odom-test-poster.jpg"
  caption="Video 3.2.4: Pure wheel odometry open-loop drift recording in Gazebo SIL demonstrating unbounded error growth under simulated tire slip." 
/>

The three architectures below illustrate the progressive stages of state estimation: uncorrected open-loop integration, high-rate local recursive filtering (`odom → base_footprint`), and georeferenced global drift bounding (`map → odom`).

**Pure odometry (open-loop)**

<Figure src="./assets/diagrams/navigation-diagram-2.svg" alt="Pure odometry architecture" />

**Local EKF**

<Figure src="./assets/diagrams/navigation-diagram-3.svg" alt="Local EKF recursive observer" />

**Global EKF**

<Figure src="./assets/diagrams/navigation-diagram-4.svg" alt="Global EKF georeferenced observer" />

These are architectural diagrams; the MATLAB simulation (Video 3.2.3) is an educational noise-model demonstration rather than validation of physical RTK accuracy.

:::

In RViz2 (Figure 3.2.3), 10 Hz LiDAR point clouds populate the 0.05 m resolution, 12 m × 12 m local rolling window, and an exponential inflation layer (`inflation_radius: 1.20 m`, `cost_scaling_factor: 2.0`) buffers obstacles against the robot footprint for collision-free RPP maneuvers.

<Figure 
  src="./assets/images/rviz_inspection_view.png" 
  alt="Nav2 Costmap Visualization in RViz2" 
  caption="Figure 3.2.3: Nav2 global and local rolling costmap visualization in RViz2 during airfield corridor sweep. Displays obstacle point cloud raytracing, costmap inflation layers, and vehicle footprint." 
/>

### 3.2.4.1 Interactive Pathfinding Demonstration {#sec-4-visualizer}

The browser sandbox illustrates **discrete 8-connected grid search** and how obstacles affect routes. Its JavaScript runtime and explored-node counts must **not** be reported as native C++ Nav2 planner benchmarks.

::: details Open interactive pathfinding laboratory

Draw barriers, reposition the UGV start and FOD goal, and compare search behavior. The browser demo is conceptual and does not implement all Nav2 costmap costs or vehicle curvature constraints.

<NavigationWidget5 />

<NavigationWidget6 />

<NavigationWidget7 />

<NavigationWidget8 />

:::

### 3.2.4.2 Navigation Parameter Tuning {#sec-4-5-tuning}

Planner, controller and costmap parameters were tuned iteratively in simulation at the configured **8.0 km/h ($2.22\text{ m/s}$)** cruise baseline; 15.0 km/h operation and sub-decimeter tracking accuracy remain physical deployment criteria.

After initial qualitative tuning in Gazebo and RViz, controlled experiments were run on the airport runway proving ground (Route A) using the AgileX Scout 2.0 simulation proxy. Route A comprises a $35.6\text{ m}$ trajectory with two major bends and $97.1^\circ$ of cumulative heading change. Gazebo and Nav2 were restarted between trials, and ground-truth poses were recorded. Gazebo was limited to a real-time factor of 0.30, and the controller ran at 6 Hz wall-clock, about 21 updates per simulated second (configured: 20 Hz). Medians of five trials per configuration are reported; Cross-Track Error (CTE) is measured relative to the reference path.

#### RPP Lookahead Distance & Adaptive Scaling {#nav-tuning-lookahead}

- **Problem:** Overly short lookahead distances amplify lateral offsets into aggressive curvature commands ($\kappa = 2y/L^2$), inducing steering chatter. Conversely, excessive lookahead delays curve entry and causes corner-cutting.
- **Parameters:** `lookahead_dist: 1.20 m`, `min_lookahead_dist: 0.40 m`, `max_lookahead_dist: 2.50 m`, `lookahead_time: 1.20 s`.
- **Formulation:** Lookahead scales dynamically with forward velocity $v$:
  $$L(v) = \text{clamp}(v \cdot t_{\text{lookahead}},\, L_{\min},\, L_{\max})$$
  At the $2.22\text{ m/s}$ cruise baseline, velocity scaling saturates at the **2.50 m** ceiling ($2.22 \times 1.2 = 2.66\text{ m}$). The **1.20 m** parameter applies when velocity scaling is inactive.
- **Design Selection:** Velocity-scaled lookahead ($0.4\text{–}2.5\text{ m}$, $1.2\text{ s}$) was selected based on stability and error damping observed in Gazebo.

**Fixed lookahead (velocity scaling disabled).** Holding the lookahead constant isolates the effect of the lookahead distance. Angular acceleration is the RMS rate of change of the RPP angular-velocity command.

| Fixed lookahead | RMS CTE | RMS angular acceleration |
| --------------: | ------: | -----------------------: |
|          0.60 m | 2.85 cm |               1.63 rad/s² |
|          1.20 m | 3.48 cm |               0.53 rad/s² |
|          2.50 m | 9.03 cm |               0.21 rad/s² |

Because RPP commands curvature via $\kappa = 2y/L^2$ ($y$: lateral offset to the lookahead point), increasing fixed lookahead from 0.60 m to 2.50 m decreased RMS angular acceleration from 1.63 to 0.21 rad/s², while RMS CTE rose from 2.85 to 9.03 cm. On Route A, 1.20 m was an effective compromise, reducing steering chatter by 68% relative to 0.60 m for 0.63 cm additional CTE.

<Figure src="./assets/images/nav-tuning-rpp-fixed-lookahead-recorded.png" alt="RPP fixed-lookahead trade-off: RMS and maximum cross-track error and RMS angular-command acceleration for 0.60, 1.20 and 2.50 m" caption="Figure 3.2.4: Fixed-lookahead trade-off on Route A (AgileX Scout 2.0 simulation proxy — Gazebo Harmonic). Points show the median and bars the range of five runs per setting." />

**Velocity-scaled lookahead (2.50 m cap in production, 4.0 m cap in the test variants).** The active lookahead was measured from the RPP lookahead point.

| Configuration | Median active lookahead | RMS CTE |
| ------------- | ----------------------: | ------: |
| 0.60 s        |                  1.33 m | 3.65 cm |
| 1.20 s        |                  2.66 m | 9.19 cm |
| 1.80 s        |                  4.00 m | 20.00 cm |
| Production (1.20 s, 2.50 m cap) |   2.50 m | 8.62 cm |

The production configuration ($t_{\text{lookahead}} = 1.20\text{ s}$, $2.50\text{ m}$ cap) saturated at its ceiling at $2.22\text{ m/s}$, matching fixed 2.50 m lookahead (8.62 vs 9.03 cm RMS CTE). A 0.60 s lookahead time ($1.33\text{ m}$ active horizon) reduced RMS CTE by 58% to 3.65 cm for a minor angular-acceleration increase (0.96 vs 0.85 rad/s²), making it a candidate for high-speed trials.

<Figure src="./assets/images/nav-tuning-rpp-scaled-lookahead-recorded.png" alt="RPP velocity-scaled lookahead comparison against lookahead time, including the production configuration" caption="Figure 3.2.5: Velocity-scaled lookahead trade-off on Route A across 0.60–1.80 s and production configuration (1.20 s, 2.50 m cap) (AgileX Scout 2.0 simulation proxy in Gazebo; median and range of 5 runs)." />

**Behaviour through the bends.** Recorded trajectories diverged primarily at the two bends (Figure 3.2.6), remaining below 0.1 cm RMS CTE on the intermediate straight:
- **Bend 1 ($0^\circ \to -67^\circ$ from standstill):** The 0.60 m and 1.20 m lookaheads peaked at $\sim 15\text{ cm}$ deviation within 1.2 m of travel. The 2.50 m setting delayed curvature correction, peaking at 26 cm deviation at 4 m along the path.
- **Bend 2 (gentle left turn):** The 2.50 m lookahead began turning before the bend (up to 2.9 cm inside the path) before swinging 7.9 cm outside, compared to 3.1 cm for 0.60 m.
Longer lookahead anticipates bends earlier but corrects lateral error more gradually, raising peak CTE through the bends.

<Figure src="./assets/images/nav-tuning-rpp-trajectories-recorded.png" alt="Ground-truth trajectories for fixed lookahead 0.60, 1.20 and 2.50 m against the stored Hybrid A* path, with zooms of both bends" caption="Figure 3.2.6: Ground-truth trajectories for fixed lookahead (0.60, 1.20, 2.50 m) against stored Hybrid A* path with bend details (AgileX Scout 2.0 proxy in Gazebo; 5 unsmoothed runs per setting)." />

#### Cross-Track Error & Steering Oscillation Damping {#nav-tuning-cte}

- **Problem:** Heading discretization across global waypoints can induce high-frequency steering chatter across centerlines.
- **Parameters:** `transform_tolerance: 0.10 s`, `max_angular_accel: 2.5 rad/s²`.
- **Engineering Rationale:** Constraining maximum angular acceleration damps rate-of-turn transients, while Smac path smoothing eliminates sharp lattice directional kinks.
- **Measured:** Peak transient error was concentrated at Bend 1 where the trajectory turns $67^\circ$ from standstill.

#### Curvature-Regulated Velocity Scaling {#nav-tuning-curvature}

- **Problem:** High-speed cornering demands high centripetal acceleration ($a_y = v^2\kappa$), risking lateral tire slip if required lateral force exceeds surface friction limits.
- **Parameters:** `use_regulated_linear_velocity_scaling: true`, `regulated_linear_scaling_min_radius: 0.80 m`, `regulated_linear_scaling_min_speed: 0.40 m/s`.
- **Formulation:** When path curvature radius $R$ drops below threshold $R_{\min} = 0.80\text{ m}$, RPP modulates linear velocity proportionally:
  $$v = \max\!\left(v_{\text{des}} \cdot \frac{R}{R_{\min}},\; v_{\text{floor}}\right) \quad \text{for } R < R_{\min}$$
- **Measured:** Across Route A runs, the minimum radius to the lookahead point was $0.915\text{ m}$, remaining above the $0.80\text{ m}$ threshold. Curvature scaling remained inactive on Route A, maintaining cruise speed until final approach.

#### Hybrid A\* Turning Radius & Heuristic LUT Tuning {#nav-tuning-smac}

- **Problem:** Unconstrained discrete paths produce sharp waypoint cusps that force skid-steer point turns.
- **Parameters:** `minimum_turning_radius: 1.0 m`, `analytic_expansion_ratio: 3.5`, `reverse_penalty: 2.5`.
- **Formulation:** Continuous Reeds-Shepp expansions enforce non-holonomic turning limits ($R_{\min} \ge 1.0\text{ m}$).
- **Heuristic Table:** `lookup_table_size: 10.0 m` with `downsampling_factor: 2`. Downsampling reduced planner plugin configuration time from $38.1\text{ s}$ to **$2.4\text{ s}$** (93.7% reduction).

**Turning-radius comparison.** Radii of 0.80, 1.00, and 1.50 m were evaluated on Route A with five planning requests and five closed-loop tracking runs per configuration (fixed lookahead 1.20 m):

| Minimum radius | Path length | Heading change | Path-relative RMS CTE |
| -------------: | ----------: | -------------: | --------------------: |
|         0.80 m |     35.42 m |         101.6° |               4.97 cm |
|         1.00 m |     35.62 m |          97.1° |               4.23 cm |
|         1.50 m |     35.52 m |          63.5° |               2.34 cm |

Larger radii restructured the planned geometry (Figure 3.2.8): 0.80 m and 1.00 m produced an acute initial turn, a straight corridor and a secondary bend, whereas 1.50 m produced one gradual curve on a direct diagonal heading, reducing cumulative planned heading change from $101.6^\circ$ to $63.5^\circ$ (Figure 3.2.7).

<Figure src="./assets/images/nav-tuning-smac-turning-radius-recorded.png" alt="Hybrid A* minimum turning radius against planned path length, planned heading change, minimum planned radius and planning request duration" caption="Figure 3.2.7: Hybrid A* turning radius evaluation on Route A geometry and wall-clock request duration (AgileX Scout 2.0 proxy in Gazebo; panel (d) includes ROS 2 action overhead, 5 requests per setting)." />

<Figure src="./assets/images/nav-tuning-smac-planned-paths-recorded.png" alt="Planned Route A paths for minimum turning radius 0.8, 1.0 and 1.5 m" caption="Figure 3.2.8: Planned Route A paths for minimum turning radius 0.8, 1.0 and 1.5 m (AgileX Scout 2.0 simulation proxy — Gazebo Harmonic). Planned geometry, not robot motion." />

Path-relative RMS CTE fell from 4.97 cm at 0.80 m to 2.34 cm at 1.50 m due to reduced lookahead tracking lag, achieving the lowest angular-command chatter among tested settings. All 15 runs reached the goal without recovery behaviors. The 1.00 m radius remains the operational baseline; 1.50 m is a candidate for wide runway corridors, pending clearance verification in narrow zones.

> For the complete Nav2 parameter matrix (`runway_navigation/config/nav2_params.yaml`), engineering justifications, and global/local costmap bounds, see **[Appendix J: Navigation & Simulation Technical Reference](/report#appendix-j)**. Recorded simulation results are summarised in [Simulation & Validation Results →](./simulation.md#sim-testing).

## 3.2.5 Testing & Results {#sec-6-testing}

Semester 1 SIL evaluations verified waypoint execution, reactive obstacle circumnavigation, Dual-EKF state estimation under noise, and closed-loop trajectory tracking at the **8.0 km/h** cruise baseline.

**Recorded results:** Across 93 ROS 2 development sessions:
- **Planner architecture:** Transitioned from discrete 2D search to `SmacPlannerHybrid` Reeds–Shepp lattices, eliminating point turns along straightaways.
- **Initialization efficiency:** Heuristic table downsampling accelerated plugin configuration to $2.4\text{ s}$ (from $38.1\text{ s}$).
- **Mission completion:** 146 autonomous navigation goals were successfully completed across varied scenarios.
- **State estimation:** Dual-EKF nodes operated continuously across 23 sessions (57 goals), maintaining consistent TF transforms.

Detailed simulation metrics and operational logs are reported in [Simulation & Validation Results →](./simulation.md#sim-testing). Controlled lookahead and turning-radius benchmarks are documented in [Section 3.2.4.2](#sec-4-5-tuning).

**Dynamic obstacle avoidance test:** In SIL simulation, dynamic obstacles introduced into the planned corridor trigger LiDAR costmap marking, velocity scaling, and trajectory replanning. In a recorded evaluation, RPP logged obstacle proximity warnings and successfully circumnavigated the obstacle to reach the goal within inflation safety margins (Video 3.2.5).

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
| Can RPP track at baseline speed?      | Controlled Gazebo runs on Route A at 8.0 km/h (§3.2.4.2) | Simulation proxy, one route; physical CTE not yet measured |

The browser pathfinding visualizer and MATLAB educational video illustrate principles; they must not be substituted for physical test evidence.

:::

## 3.2.6 Engineering Discussion {#sec-7-evaluation}

**High-Speed Operational Considerations:** Controller gains established at 8.0 km/h ($2.22\text{ m/s}$) cannot be directly extrapolated to the 15.0 km/h ($4.17\text{ m/s}$) target. Because centripetal acceleration scales quadratically ($a_c = v^2/R$), accelerating from 8.0 to 15.0 km/h increases lateral acceleration demands by **3.53×** for an equivalent turning radius. This elevated lateral force demands empirical verification of tire-ground traction, braking deceleration limits, and CANopen actuator latency on the physical FOD Hunter platform. MPPI represents a viable predictive alternative if real-time compute headroom on the Jetson Orin permits.

Comprehensive scrubbing moment models and motor current calculations are detailed in [Motor Drivetrain Calculations →](./motor-drivetrain-calculation.md#sec-1-requirements) and [Steering Kinematics →](./steering-kinematics.md#sec-4-iterations).

## 3.2.7 Limitations & Future Work {#sec-9-semester-2}

Semester 2 milestones focus on physical sensor integration, on-vehicle GNSS-RTK accuracy benchmarking, high-speed controller retuning toward 15.0 km/h, and verifying planner-controller directional compatibility. 

Simulation testing identified a critical architectural constraint: unconstrained `SmacPlannerHybrid` generates Reeds–Shepp reverse cusps to minimize path lengths, whereas the operational runway sweep configuration enforces forward-only motion (`allow_reversing: false`) to maintain continuous sensor coverage. In Semester 2, SmacPlanner will be configured with forward-only Dubins vehicle lattice primitives (`motion_model_for_search: "DUBINS"`) with an initial turning radius $R_{\min} = 1.0\text{ m}$ to guarantee kinematically compatible, non-reversing trajectory execution on asphalt. Physical test protocols will evaluate quantitative stopping distance and Cross-Track Error (CTE) on paved outdoor surfaces under defined pass/fail criteria.

The detailed implementation roadmap is maintained in [Hilbert's Semester 2 Plan →](./semester-2-plan.md#programming-semester-2).

::: details Proposed navigation validation milestones

| Milestone                        | Planned verification                                                             |
| ---------------- | ---------------------------------------------------------------- |
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
