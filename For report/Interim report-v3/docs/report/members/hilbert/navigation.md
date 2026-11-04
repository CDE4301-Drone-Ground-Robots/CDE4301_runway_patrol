---
title: "Autonomous Runway Navigation & Kinematic Path Planning"
owner: "Hilbert Soh"
outline: [2, 3]
---

# Autonomous Runway Navigation & Kinematic Path Planning

> **Semester 1 engineering documentation · Hilbert Soh**  
> **Evidence boundary:** This page documents a software-in-the-loop (SIL) navigation prototype. Physical FOD Hunter performance and unverified numerical targets are not presented as achieved results.

<!-- #region report -->

## 1. Objectives & Requirements {#sec-1-summary}

The UGV needs to reach FOD coordinates, stay within the permitted route and avoid obstacles. Open runway areas provide few landmarks for LiDAR-based localization, while wheel slip makes odometry less reliable. We therefore used LiDAR obstacle detection, GPS-assisted localization, Hybrid A\* planning and RPP path tracking.

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

The system follows **perception → localization → planning → control → actuation**. LiDAR data updates the obstacle costmaps. A local EKF combines wheel odometry and IMU data, while a global EKF uses GPS-derived position to correct drift. Nav2 plans a route ([\[8\]](./references.md#ref-8)) and Regulated Pure Pursuit (RPP) converts it into `/cmd_vel` commands ([\[18\]](./references.md#ref-18)). A behavior tree coordinates execution and recovery.

**Runtime evidence:** In the November 2026 WSL2 check, both EKF nodes and `navsat_transform_node` launched, filtered odometry topics published, and the `map → odom → base_footprint` TF chain was observed. This verifies operation of the configured localization pipeline at rest; motion-tracking accuracy remains unmeasured.

<Figure src="./assets/diagrams/navigation-diagram.svg" alt="ROS 2 Nav2 navigation and TF2 dataflow" />

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

The active simulation configures wheel odometry and IMU at **50 Hz**, GPS and LiDAR at **10 Hz**, and both EKFs at **30 Hz in simulation time**. A WSL2 runtime check confirmed the EKF nodes and their output topics; wall-clock rates were lower while Gazebo ran below real time.

<NavigationWidget9 />

:::

## 3. Design Methodology & Selection {#sec-4-iterations}

We compared LiDAR sensors, localization methods, planners and controllers. Our main concerns were odometry drift, sharp turns and stable tracking. These comparisons explain the design choices; they are not physical test results.

::: details LiDAR sensor trade study

We compared five LiDAR options: WheelTec N10P, PaceCat LDS-M300, Hesai JT16, RPLiDAR S2, and Livox Mid-360S. We did not select 2D LiDAR because a single scan plane can miss low debris (&lt; 5 cm) and changes in ground height.

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

We selected the Hesai JT16 for its vertical scanning coverage, stated sunlight tolerance and 0.05–30 m specified range. These are supplier specifications, not results from our outdoor tests.

:::

::: details Localization choice and Dual-EKF MATLAB demonstration

Open runways have fewer features for LiDAR scan matching. Although 2D LiDAR SLAM is often used indoors ([\[17\]](./references.md#ref-17)), open pavement can make scan matching less reliable ([\[22\]](./references.md#ref-22)). Skid-steer turning also causes wheel slip, so wheel odometry alone can accumulate position error. A constant yaw-rate bias $b_\omega$ produces a heading error $\theta(t)=b_\omega t$; the resulting position error depends on the route and speed.

We chose a Dual-EKF arrangement using `robot_localization` ([\[9\]](./references.md#ref-9)). In the Gazebo implementation, the local EKF fuses **50 Hz simulated wheel odometry and 50 Hz IMU measurements** and publishes `odom → base_footprint`. A `navsat_transform_node` converts **10 Hz simulated GPS fixes** to Cartesian odometry for the global EKF, which publishes `map → odom`. Both EKFs are configured at **30 Hz in simulation time**. This is simulated GPS, not a physical RTK-GNSS accuracy test.

<Card title="Dual-EKF State Estimation — MATLAB Educational Simulation" tag="MATLAB Simulation">

_Comparing Pure Odometry, Local Dead-Reckoning, and GPS-Corrected Global EKF (60 FPS Simulation)_

<VideoClip src="./assets/videos/Dual EKF matlab demo.mov" poster="./assets/images/posters/dual-ekf-matlab-demo-poster.jpg" caption="Video 3.2.1: Dual-EKF State Estimation — MATLAB Educational Simulation (Comparing Odometry Drift, Local EKF, and Global EKF)." />

**In the video:** The left panel compares the planned route (green line), uncorrected pure odometry (red dashed line), local EKF dead-reckoning (orange dotted line), GPS-corrected global EKF (blue solid line), and discrete 2 Hz GPS fixes (magenta dots). The right panel shows position error during the 75-second run.

_Educational Model Parameters:_ Duration: $75\text{ s}$ • Speed: $1.3\text{ m/s}$ • Simulation rate: $60\text{ Hz}$ ($dt \approx 0.0167\text{ s}$) • GPS rate: $2\text{ Hz}$ ($\sigma_{\text{gps}} = 0.6\text{ m}$) • Wheel noise: $\sigma_v = 0.12\text{ m/s}$ • IMU yaw noise: $\sigma_\omega = 0.35^\circ/\text{s}$ ($b_\omega = 0.03^\circ/\text{s}$) • Odometry yaw bias: $b_{\omega,\text{odom}} = 0.50^\circ/\text{s}$ • Seed: `102`.

</Card>

We also built a MATLAB example to show how odometry drift accumulates and how periodic GPS corrections affect the estimate. It is an illustration, not a Gazebo or physical localization accuracy test.

_MATLAB limitation:_ The model uses differential-drive kinematics and simulated noise. It does not measure tire slip on wet pavement. See [Simulation](./simulation.md).

The demonstration illustrates two reasons for separating local and global estimation:

1. **Smooth local estimates:** Local high-rate control loops receive smooth velocity feedback without discrete GPS correction jumps.
2. **Temporary GNSS loss:** If GNSS is temporarily degraded, the local filter can continue dead reckoning, but its position uncertainty grows without absolute corrections.

:::

### 3.1 Global Planner Selection: A*, Theta* and Hybrid A\* {#nav-planner-tradeoffs}

We considered **A\*** as a grid-search baseline because it is straightforward to implement and provides a useful reference for path length and search effort. **Theta\*** was also considered: its line-of-sight checks can produce shorter, any-angle paths, but add computational work and do not enforce the UGV's turning radius. Whether Theta* is slower than A* in our test conditions must be established from comparable benchmarks, not assumed.

Neither A* nor Theta* was run as a separate Nav2 planner benchmark in the audited workspace; this is a design trade study, not a measured algorithm comparison. For the four-wheel skid-steer UGV, the main concern is **path geometry**. A short path is not necessarily easy to follow: abrupt heading changes can require strong steering corrections and tire scrub. **Hybrid A\*** was therefore considered for curvature-constrained planning, accepting the cost of searching position and heading rather than grid position alone. The planned path must also be trackable by the chosen controller ([\[15\]](./references.md#ref-15), [\[16\]](./references.md#ref-16)).

### 3.2 Local Controller Selection: RPP and MPPI {#nav-controller-tradeoffs}

**Regulated Pure Pursuit (RPP)** was used for the **8 km/h software-in-the-loop baseline** because it tracks a planned path with relatively low computational demand and regulates speed around curves ([\[18\]](./references.md#ref-18)). Short lookahead can cause repeated steering corrections. Longer lookahead can smooth steering but may cut corners. We therefore tuned lookahead alongside speed regulation and obstacle clearance. Increasing lookahead alone does not make higher-speed tracking safe.

RPP is primarily a **geometric controller**. It does not explicitly predict the full dynamics of the proposed 65 kg skid-steer vehicle, including tire slip, motor torque limits and actuator response. **MPPI** was considered but not integrated into the final simulation because of development-computer resource constraints; no comparable runtime benchmark was retained. It remains a possible alternative because it evaluates predicted control sequences and can penalize tracking error, obstacles and abrupt commands ([\[19\]](./references.md#ref-19)). However, standard MPPI configurations also depend on the chosen motion model: mass, momentum and tire friction are **not automatically represented**. MPPI also needs more computation and tuning. We have not compared it against RPP in a controlled runtime benchmark or on the physical UGV.

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
  caption="Video 3.2.2 (V2): SmacPlannerHybrid global path generation in Gazebo/RViz around obstacles showing start/goal poses and continuous Reeds-Shepp lattice expansion." 
/>

<Figure 
  src="./assets/diagrams/astar-vs-hybrid-astar-comparison.svg" 
  alt="V8 — A* versus Hybrid A*: side-by-side route comparison" 
  caption="Figure 3.2.2 (V8): Side-by-side route comparison between standard 2D discrete A* (8-connected grid) and SmacPlannerHybrid (SE(2) Reeds-Shepp lattice). Note: This is an analytical illustration comparing trajectory geometry and kinematic heading continuity; not an empirical physical runtime benchmark." 
/>

The original source reports a 78% reduction in cumulative yaw rotation for a simulation comparison. This figure needs its test route and logs verified before it is treated as a measured improvement. It does not establish reduced physical tire wear. See [Simulation & Validation](./simulation.md#sec-1-summary).

:::

## 4. Implementation & Prototype {#sec-5-implementation}

We implemented the navigation stack in **ROS 2 Jazzy and Gazebo Harmonic** using software-in-the-loop (SIL) testing. This was not a test of the completed physical UGV. Nav2 lifecycle nodes ([\[8\]](./references.md#ref-8)), costmaps, localization, a global planner, RPP ([\[18\]](./references.md#ref-18)) and behavior-tree recovery form the implementation. Correct transform ownership is essential: the local estimator must supply smooth odometry, while global corrections update the map relationship without causing abrupt control-frame jumps.

For the complete simulation environment, bridge topics and benchmark setup, see [Simulation Architecture →](./simulation.md#sec-2-overview).

<VideoClip 
  src="./assets/videos/231026-sem1-demo-final-compressed-.mp4" 
  poster="./assets/images/posters/sem1-demo-final-poster.jpg"
  caption="Video 3.2.3 (V1): Complete autonomous navigation demonstration in Gazebo Harmonic SIL using AgileX Scout 2.0 simulation proxy, SmacPlannerHybrid, and Regulated Pure Pursuit." 
/>

<VideoClip 
  src="./assets/videos/131026-ugv-multiwaypoint.mov" 
  poster="./assets/images/posters/131026-ugv-multiwaypoint-poster.jpg"
  caption="Video 3.2.4 (V10): Sequential multi-waypoint navigation demonstration in Gazebo Harmonic SIL showing autonomous queue traversal without human intervention." 
/>

::: details Nav2 configuration and costmaps

The active simulation uses a 10 Hz LiDAR sensor; the obstacle layer uses raytracing (15 m clearing range and 2 m marking range) and an inflation layer for safety margins. A global map resolution of 0.05 m and local rolling-window costmap at 5 Hz are documented; confirm current YAML before treating these as final parameters.

`SmacPlannerHybrid` is described with 64 heading bins and Reeds–Shepp analytical expansions. RPP is described at 20 Hz with velocity-scaled lookahead. **Planner–controller reverse-motion compatibility is an identified limitation:** Hybrid A\* uses Reeds–Shepp (`minimum_turning_radius: 1.0 m`, 64 heading bins), but RPP has `allow_reversing: false`. The current controller may not follow paths containing reverse cusps. We retained Reeds–Shepp and will test this failure case before physical deployment.

BehaviorTree.CPP supervises waypoint execution and recovery actions such as costmap clearing, backing up and spin recovery.

:::

<VideoClip 
  src="./assets/videos/131026-ugv-dual-ekf-test.mov" 
  poster="./assets/images/posters/131026-ugv-dual-ekf-test-poster.jpg"
  caption="Video 3.2.5 (V5): Dual-EKF state estimation test in Gazebo SIL: local odometry smoothing coupled with simulated RTK-GNSS global drift correction." 
/>

<Figure
  src="./assets/images/ekf-drift-comparison-plot.png"
  alt="Figure 3.4.1 (V6): Odometry drift versus Dual-EKF state estimation trajectory comparison"
  caption="Figure 3.4.1 (V6): Odometry drift versus Dual-EKF state estimation trajectory comparison from MATLAB simulation. Illustrates unbounded dead-reckoning divergence under simulated wheel slip compared to bounded error when fusing wheel odometry with IMU angular velocity and georeferenced pose fixes (simulation illustration, not physical field test)."
/>

::: details Dual-EKF implementation diagrams

The local `ekf_filter_node_odom` fuses simulated wheel velocity and IMU measurements for `odom → base_footprint`; the global `ekf_filter_node_map` uses GPS-derived odometry from `navsat_transform_node` for `map → odom`. In the November 2026 WSL2 runtime verification, all three nodes were active, `/odometry/local` and `/odometry/gps` published messages, and both TF links were observed. This confirms the pipeline was running at rest; it does **not** establish localization accuracy during motion.

<VideoClip 
  src="./assets/videos/131026_UGV_Pure_odom_test.mov" 
  poster="./assets/images/posters/131026-ugv-pure-odom-test-poster.jpg"
  caption="Video 3.2.6: Pure wheel odometry open-loop drift recording in Gazebo SIL demonstrating unbounded error growth under simulated tire slip." 
/>

**Pure odometry (open-loop)**

<Figure src="./assets/diagrams/navigation-diagram-2.svg" alt="Pure odometry architecture" />

**Local EKF**

<Figure src="./assets/diagrams/navigation-diagram-3.svg" alt="Local EKF recursive observer" />

**Global EKF**

<Figure src="./assets/diagrams/navigation-diagram-4.svg" alt="Global EKF georeferenced observer" />

These are architectural diagrams; the MATLAB video in Section 3 is an educational noise-model demonstration rather than validation of physical RTK accuracy.

:::

<Figure 
  src="./assets/images/rviz_inspection_view.png" 
  alt="V7 — Nav2 Costmap Visualization in RViz2" 
  caption="Figure 3.2.5 (V7): Nav2 global and local rolling costmap visualization in RViz2 during airfield corridor sweep. Displays obstacle point cloud raytracing, costmap inflation layers, and vehicle footprint." 
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

::: details Supplementary drivetrain interaction models (pending relocation)

These three interactive models remain here until they are moved to the appropriate pages. Their engineering explanations belong in [Motor Drivetrain Calculations →](./motor-drivetrain-calculation.md#sec-1-requirements) and [Steering Kinematics →](./steering-kinematics.md#sec-4-iterations). They are **not** independent navigation validation results.

<ProgrammingWidget2 />

<ProgrammingWidget3 />

<ProgrammingWidget4 />

:::

### 4.5 Navigation Parameter Tuning {#sec-4-5-tuning}

We tuned Nav2 planning, control and costmap settings using simulation routes. The configured cruise baseline was **8.0 km/h**. The 15.0 km/h speed and centimetre-level tracking figures are physical design targets, not demonstrated results.

For each adjustment, the sections below state the problem, parameter change, reason and reported result. The recorded tuning graphs and `tuning_documentation.md` provide supporting SIL comparisons. Fixed-lookahead sweep results must be distinguished from the final velocity-scaled RPP settings, and claims about tire forces or physical wear remain unverified.

#### 1. RPP Lookahead Distance & Adaptive Scaling

- **Problem:** Fixed short lookahead distances ($L < 0.60\text{ m}$) caused frequent steering oscillations ($\dot{\omega}^2 > 38\text{ rad}^2/\text{s}^4$) and tire scrubbing on high-speed sprints ($2.22\text{ m/s}$), while excessively large lookahead ($L > 2.00\text{ m}$) caused corner cutting across taxiway bend boundaries.
- **Parameter:** `lookahead_dist: 1.20 m`, `min_lookahead_dist: 0.40 m`, `max_lookahead_dist: 2.50 m`, `lookahead_time: 1.20 s`.
- **Engineering Rationale:** Dynamic lookahead scales with linear velocity $v$:
  $$L(v) = \text{clamp}(v \cdot t_{\text{lookahead}},\, L_{\min},\, L_{\max})$$
  This increases the preview distance with speed, up to the configured limit. At 2.22 m/s, the active velocity-scaled lookahead is clamped to **2.50 m**. The **1.20 m** value reported in the fixed-lookahead sweep is not the operating lookahead at that cruise speed.
- **Observed Result:** The recorded fixed-lookahead sweep reports lower steering chatter as lookahead increases, alongside greater cross-track error and corner cutting. The comparison is simulation evidence; it does not measure physical tire scrub or motor current.

#### 2. Cross-Track Error & Steering Oscillation Damping

- **Problem:** Discontinuous goal pose switching along the discrete global path induced limit-cycle heading oscillations across corridor centerlines.
- **Parameter:** `use_interpolation: true`, `transform_tolerance: 0.10 s`, `max_angular_accel: 2.5 rad/s²`.
- **Engineering Rationale:** Dense cubic spline interpolation along the Reeds-Shepp trajectory smooths target lookahead poses, reducing abrupt heading changes in the sampled path. This is a geometric explanation, not proof of zero tracking error.
- **Observed Result:** Cross-Track Error (CTE) bounded to a steady-state $\pm 0.042\text{ m}$ on straight sprints ($100\text{ m}$ corridor) with maximum transient deviation $< 0.115\text{ m}$ on acute $90^\circ$ turns.

<Figure 
  src="./assets/images/tuning_rpp_cte_oscillation.png" 
  alt="RPP Cross-Track Error and Steering Oscillation Analysis" 
  caption="Figure 3.2.6: Regulated Pure Pursuit Cross-Track Error (CTE) and Steering Rate Oscillation ($\dot{\omega}^2$) across lookahead parameter sweeps. Illustrates the underdamped instability regime ($L \le 0.5\text{ m}$), overdamped corner cutting ($L \ge 2.0\text{ m}$), and the optimal stability window at $L = 1.20\text{ m}$." 
/>

#### 3. Curvature-Regulated Velocity Scaling

- **Problem:** Taking tight bends at $2.22\text{ m/s}$ increases the required lateral acceleration ($a_y=v^2\kappa$). This may cause slip if available traction is insufficient; tire forces were not measured in the simulation.
- **Parameter:** `use_regulated_linear_velocity_scaling: true`, `regulated_linear_scaling_min_radius: 0.80 m`, `regulated_linear_scaling_min_speed: 0.40 m/s`.
- **Reason:** RPP reduces commanded speed as path curvature increases:
  $$v(\kappa) = v_{\max} \cdot \sqrt{\kappa_{\max} / \kappa}$$
  so tighter turns are approached more slowly.
- **Recorded result:** The tuning notes report speeds of approximately $0.40 - 0.75\text{ m/s}$ on sharp bends ($R \le 1.5\text{ m}$). The stated lateral-acceleration limit is a calculation from speed and curvature, not a tire-slip measurement.

#### 4. Hybrid A\* Turning Radius & Heuristic LUT Tuning

- **Problem:** Grid-based paths can contain sharp changes in heading. Following them may require tight turns or pivots, which increase the calculated motor load.
- **Parameter:** `minimum_turning_radius: 1.0 m`, `analytic_expansion_ratio: 3.5`, `reverse_penalty: 2.5`.
- **Engineering Rationale:** Restricting path curvature to continuous Reeds-Shepp segments ($R_{\min} \ge 1.0\text{ m}$) limits planned curvature; actual skid-steer slip remains outside the idealized model.
- **Recorded result:** The tuning notes report 78% less cumulative yaw rotation in one simulation comparison. This does **not** measure tire scrub force or wear. Include the route and calculation when presenting the percentage.

::: details Complete Nav2 configuration parameters and master tuning matrix

The complete parameter configuration applied across the Semester 1 SIL prototype is summarized below. For multi-run empirical trajectory logs, spatial tracking sweeps, and full-scale validation plots, refer to [Simulation & Validation Results →](./simulation.md#sec-6-testing).

| Component          | Parameter                                    | Default Value    | Tuned Value                           | Engineering Justification                                                                              |
| :----------------- | :------------------------------------------- | :--------------- | :------------------------------------ | :----------------------------------------------------------------------------------------------------- |
| **RPP Controller** | `desired_linear_vel`                         | $0.5\text{ m/s}$ | $2.22\text{ m/s}$ ($8.0\text{ km/h}$) | Target Semester 1 baseline cruise speed for runway corridor sweep.                                     |
| **RPP Controller** | `lookahead_dist`                             | $0.6\text{ m}$   | $1.20\text{ m}$                       | Fixed-lookahead tuning reference; velocity-scaled lookahead is enabled in the final configuration.     |
| **RPP Controller** | `min_lookahead_dist`                         | $0.3\text{ m}$   | $0.40\text{ m}$                       | Lower bound for speed-scaled lookahead.                                                                |
| **RPP Controller** | `max_lookahead_dist`                         | $0.9\text{ m}$   | $2.50\text{ m}$                       | Caps lookahead to prevent severe corner-cutting around taxiway edges.                                  |
| **RPP Controller** | `lookahead_time`                             | $1.0\text{ s}$   | $1.20\text{ s}$                       | Velocity-scaled lookahead gain providing stable lead time at $2.22\text{ m/s}$.                        |
| **RPP Controller** | `use_regulated_linear_velocity_scaling`      | `false`          | `true`                                | Enables automatic corner deceleration based on instantaneous path curvature.                           |
| **RPP Controller** | `regulated_linear_scaling_min_radius`        | $0.9\text{ m}$   | $0.80\text{ m}$                       | Curvature-based speed regulation threshold; distinct from the planner's 1.00 m minimum turning radius. |
| **RPP Controller** | `use_cost_regulated_linear_velocity_scaling` | `false`          | `true`                                | Decelerates vehicle proportionally when traversing high-cost obstacle proximity zones.                 |
| **Smac Planner**   | `minimum_turning_radius`                     | $0.4\text{ m}$   | $1.00\text{ m}$                       | Constrains planned curvature; does not directly measure tire scrub.                                    |
| **Smac Planner**   | `analytic_expansion_ratio`                   | $3.5$            | $3.5$                                 | Balances Reeds-Shepp analytic shot frequency with Voronoi collision checking.                          |
| **Costmap 2D**     | `inflation_radius`                           | $0.55\text{ m}$  | $1.20\text{ m}$                       | Enforces safe standoff margin exceeding UGV half-width ($0.33\text{ m}$) on taxiways.                  |
| **Costmap 2D**     | `cost_scaling_factor`                        | $10.0$           | $3.0$                                 | Provides smooth exponential cost decay for gradual proximity deceleration.                             |

:::

## 5. Testing & Results {#sec-6-testing}

Semester 1 SIL work examined waypoint execution, dynamic obstacle handling, localization under simulated noise and path tracking at the documented **8.0 km/h** baseline. The recorded tuning documentation supports several SIL comparisons. A separate WSL2 runtime audit also confirmed active Dual-EKF nodes and TF output. Neither result establishes physical UGV performance or measured localization accuracy against ground truth.

Detailed test scenarios, trajectory-error metrics, planner tuning and benchmark plots are maintained in [Simulation & Validation Results →](./simulation.md#sec-6-testing).

**V4 — Dynamic obstacle avoidance test:** In SIL simulation, dynamic obstacles (such as crossing ground vehicles or personnel) introduced into the planned corridor trigger real-time LiDAR costmap marking, velocity scaling, and trajectory replanning. _The primary video recording of this test is maintained in [Simulation & Validation Results (Video 3.4.3) →](./simulation.md#sec-6-testing)._

<VideoClip 
  src="./assets/videos/131026-ugv-object-avoidance.mov" 
  poster="./assets/images/posters/131026-ugv-object-avoidance-poster.jpg"
  caption="Video 3.6.1 (V9): Dynamic obstacle avoidance and local costmap replanning in Gazebo Harmonic SIL, demonstrating robot deceleration and lateral avoidance around obstacle perimeter within inflation safety buffers." 
/>

::: details Navigation-specific test scope and evidence limits

| Test question                         | Test approach described                              | Evidence limitation                               |
| ------------------------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| Can a target be dispatched?           | C2 goal ingestion and Nav2 waypoint execution in SIL | Refer to communications and simulation logs       |
| Can the rover avoid obstacles?        | Dynamic costmap marking and replanning               | No outdoor obstacle trial established here        |
| Does global localization limit drift? | Simulated sensor noise and Dual-EKF demonstration    | Physical RTK accuracy unverified                  |
| Can RPP track at baseline speed?      | SIL trajectory tracking at 8.0 km/h                  | Quantitative CTE requires traceable benchmark log |

The browser pathfinding visualizer and MATLAB educational video illustrate principles; they must not be substituted for physical test evidence.

:::

## 6. Engineering Discussion {#sec-7-evaluation}

**Limits at higher speeds:** The 8 km/h SIL controller settings cannot be assumed suitable for the 15 km/h physical design target. At a fixed turning radius, lateral acceleration increases with the square of speed, $a_y=v^2/R$. Increasing speed from 8 to 15 km/h raises the required lateral acceleration by about **3.5 times** for the same radius. This is a kinematic estimate, not a measured tire-force result. The physical UGV will need progressive speed testing, lookahead and curvature tuning, and checks of traction, braking and actuator limits. MPPI can be compared with RPP if the available computing hardware and model fidelity justify it.

**Other limitations:** Hybrid A* searches a larger state space than grid A*, and reverse-capable paths must match the tracking controller. Dual-EKF separates smooth local odometry from global corrections, but physical GNSS quality and wheel slip remain unverified. The planner and controller should be evaluated as a pair rather than selected independently.

Path planning, localization and skid-steer control need to be tested together. Detailed scrub-force and motor-current calculations are intentionally not repeated here; see [Motor Drivetrain Calculations →](./motor-drivetrain-calculation.md#sec-1-requirements) and [Steering Kinematics →](./steering-kinematics.md#sec-4-iterations).

## 7. Limitations & Semester 2 Plan {#sec-9-semester-2}

The main limitations are the absence of physical airfield validation, unverified high-speed tracking and localization accuracy, and the Reeds–Shepp planner / forward-only RPP mismatch. A November 2026 WSL2 verification also ran Gazebo at approximately 0.31–0.33 real-time factor, so those wall-clock measurements cannot establish real-time operation at full speed. Semester 2 should prioritize physical sensor bring-up, coordinate-frame calibration, planner/controller compatibility, progressive speed tuning, and logged field tests with explicit pass/fail criteria.

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
