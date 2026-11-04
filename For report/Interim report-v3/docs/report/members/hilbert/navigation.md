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

The navigation subsystem must guide the UGV to georeferenced FOD targets, remain inside permitted paved corridors, and avoid obstacles. Wide, largely featureless runway surfaces challenge scan-matching localization; wheel slip further degrades dead reckoning. The design therefore combines obstacle perception, GNSS-assisted state estimation, curvature-aware planning and regulated path tracking.

The documented Semester 1 SIL speed baseline is **8.0 km/h**. The **15.0 km/h** physical-vehicle speed and **±0.10 m** localization accuracy are _targets_, not measured field results. Source documents mention both **1.0 m** and **1.5 m** minimum planning radii; the authoritative configuration requires confirmation.

::: details Requirements and operating constraints

| Requirement           | Documented value                           | Evidence status                  |
| --------------------- | ------------------------------------------ | -------------------------------- |
| Baseline cruise speed | 8.0 km/h (2.22 m/s)                        | SIL configuration                |
| Future physical speed | 15.0 km/h                                  | Semester 2 target                |
| Localization accuracy | ±0.10 m                                    | Design requirement; not verified |
| Obstacle sensing      | 360° awareness, ≥30 m target               | Sensor requirement               |
| Planning radius       | 1.0 m / 1.5 m in different source sections | Verify actual YAML and phase     |

The runway environment imposes strong daylight, limited fixed landmarks, and a need for reliable obstacle response. Sensor specifications and supplier claims must not be confused with physical field validation.

:::

## 2. System Architecture {#sec-2-overview}

The architecture follows **perception → localization → global planning → local control → actuation**. LiDAR observations populate obstacle costmaps. Wheel odometry and IMU measurements feed a local EKF for continuous motion estimation; GNSS corrections support a global EKF. The Nav2 stack supplies a route ([\[8\]](./references.md#ref-8)) and Regulated Pure Pursuit (RPP) converts it into `/cmd_vel` commands ([\[22\]](./references.md#ref-22)). A behavior tree coordinates execution and recovery.

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

The source describes local and global EKFs operating at 30 Hz, with wheel inputs at 50 Hz, IMU at 100 Hz and GNSS at 5 Hz. Confirm these rates against the actual configuration before describing them as measured.

<NavigationWidget9 />

:::

## 3. Design Methodology & Selection {#sec-4-iterations}

We compared LiDAR types, localization methods, planners and path-tracking controllers. The main concerns were localization drift on open pavement, tire scrub during sharp turns and stable path tracking. The comparisons below explain our choices; they do not demonstrate physical UGV performance.

::: details LiDAR sensor trade study

We compared five LiDAR options: WheelTec N10P, PaceCat LDS-M300, Hesai JT16, RPLiDAR S2, and Livox Mid-360S. Planar 2D LiDARs were eliminated due to inability to detect low-profile debris (&lt; 5 cm) and vertical terrain undulations.

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

The Hesai JT16 3D LiDAR was selected for its 16-channel vertical coverage, 100,000 lux ambient sunlight immunity, and 0.05–30 m operating range tailored to airport apron environments.

:::

::: details Localization choice and Dual-EKF MATLAB demonstration

Open runway areas provide fewer landmarks for scan-matching localization. Although indoor robots often use 2D LiDAR SLAM ([\[21\]](./references.md#ref-21)), runways lack the vertical architectural landmarks necessary for point cloud registration, leading to dead-reckoning drift under probabilistic motion models ([\[26\]](./references.md#ref-26)). Pure wheel odometry on a 4WD skid-steer chassis suffers from continuous wheel slip during turns, causing gyro bias $b_\omega$ to compound orientation error linearly ($\theta(t) = b_\omega \cdot t$) and positional error quadratically ($e(t) \propto t^2$).

We chose a Dual-EKF arrangement using `robot_localization` ([\[9\]](./references.md#ref-9)). A local EKF fuses 50 Hz wheel speeds with 100 Hz tactical IMU gyroscopic yaw rates, producing smooth odometry on `odom → base_footprint` at 30 Hz without jump discontinuities. Concurrently, a global EKF integrates periodic 5 Hz RTK-GNSS Cartesian coordinates, limiting long-term drift subject to GNSS quality and publishing drift corrections on `map → odom` at 30 Hz.

<Card title="Dual-EKF State Estimation — MATLAB Educational Simulation" tag="MATLAB Simulation">

_Comparing Pure Odometry, Local Dead-Reckoning, and GPS-Corrected Global EKF (60 FPS Simulation)_

<VideoClip src="./assets/videos/Dual EKF matlab demo.mov" caption="Video 3.2.1: Dual-EKF State Estimation — MATLAB Educational Simulation (Comparing Odometry Drift, Local EKF, and Global EKF)." />

**Video Demonstration Playback:** Left panel illustrates spatial trajectory tracking across a multi-turn course comparing the planned route (green line), uncorrected pure odometry (red dashed line), local EKF dead-reckoning (orange dotted line), GPS-corrected global EKF (blue solid line), and discrete 2 Hz GPS fixes (magenta dots). Right panel tracks instantaneous Euclidean position error over the 75-second run.

_Educational Model Parameters:_ Duration: $75\text{ s}$ • Speed: $1.3\text{ m/s}$ • Simulation rate: $60\text{ Hz}$ ($dt \approx 0.0167\text{ s}$) • GPS rate: $2\text{ Hz}$ ($\sigma_{\text{gps}} = 0.6\text{ m}$) • Wheel noise: $\sigma_v = 0.12\text{ m/s}$ • IMU yaw noise: $\sigma_\omega = 0.35^\circ/\text{s}$ ($b_\omega = 0.03^\circ/\text{s}$) • Odometry yaw bias: $b_{\omega,\text{odom}} = 0.50^\circ/\text{s}$ • Seed: `102`.

</Card>

To validate multi-rate sensor fusion before configuring ROS 2 Nav2, a kinematic MATLAB simulation was developed under pseudo-random Gaussian noise. The demonstration compares accumulating odometry drift with periodic GNSS-corrected position estimates; numerical errors must be verified against the MATLAB output.

_Model Limitations:_ This simulation models kinematic differential drive behavior; physical tire slip on wet tarmac is not established by this educational MATLAB demonstration as detailed in [simulation.html](./simulation.md).

The demonstration illustrates two reasons for separating local and global estimation:

1. **Smooth local estimates:** Local high-rate control loops receive smooth velocity feedback without discrete GPS correction jumps.
2. **Temporary GNSS loss:** If RTK-GNSS is temporarily degraded, the local filter maintains accurate dead-reckoning until satellite lock is re-established.

:::

### 3.1 Global Planner Selection: A*, Theta* and Hybrid A* {#nav-planner-tradeoffs}

We used **A*** as a grid-search baseline because it is straightforward to implement and provides a useful reference for path length and search effort. **Theta*** was also considered: its line-of-sight checks can produce shorter, any-angle paths, but add computational work and do not enforce the UGV's turning radius. Whether Theta* is slower than A* in our test conditions must be established from comparable benchmarks, not assumed.

For the four-wheel skid-steer UGV, the main concern is **path geometry**. A short path is not necessarily easy to follow: abrupt heading changes can require strong steering corrections and tire scrub. **Hybrid A*** was therefore considered for curvature-constrained planning, accepting the cost of searching position and heading rather than grid position alone. Its motion-model and reverse-path settings must agree with the controller configuration ([\[19\]](./references.md#ref-19), [\[20\]](./references.md#ref-20)).

### 3.2 Local Controller Selection: RPP and MPPI {#nav-controller-tradeoffs}

**Regulated Pure Pursuit (RPP)** was used for the **8 km/h software-in-the-loop baseline** because it tracks a planned path with relatively low computational demand and regulates speed around curves ([\[22\]](./references.md#ref-22)). Its lookahead setting affects tracking: a short lookahead can produce frequent steering corrections, while a longer lookahead generally smooths commands but can increase corner cutting. Lookahead must therefore be tuned together with speed, curvature limits and obstacle clearance; increasing it alone is not a complete high-speed solution.

RPP is primarily a **geometric controller**. It does not explicitly predict the full dynamics of the proposed 65 kg skid-steer vehicle, including tire slip, motor torque limits and actuator response. **MPPI** is a possible alternative because it evaluates predicted control sequences and can penalize tracking error, obstacles and abrupt commands ([\[23\]](./references.md#ref-23)). However, standard MPPI configurations also depend on the chosen motion model: mass, momentum and tire friction are **not automatically represented**. MPPI also requires more computation and tuning. We have not established that it performs better on physical FOD Hunter hardware.

::: details Planner comparison, supporting media and limitations

| Approach | Benefit | Limitation / decision |
| --- | --- | --- |
| A* | Simple, useful grid-search baseline | Grid-constrained headings; path smoothing may be needed |
| Theta* | Any-angle, potentially shorter paths | Line-of-sight checks; no built-in vehicle turning-radius constraint |
| Hybrid A* | Incorporates heading and curvature constraints | Larger search space; motion-model and controller compatibility must be checked |
| RPP | Lightweight tracking with curvature-based speed regulation | Lookahead trade-off; no full vehicle-dynamics prediction |
| MPPI | Predictive trajectory sampling and configurable costs | Higher computation/tuning demand; dynamics depend on the model used |

<VideoClip 
  src="./assets/videos/Global Path Planning Comparison.mov" 
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

We implemented the navigation stack in **ROS 2 Jazzy and Gazebo Harmonic** using software-in-the-loop (SIL) testing. This was not a test of the completed physical UGV. Nav2 lifecycle nodes ([\[8\]](./references.md#ref-8)), costmaps, localization, a global planner, RPP ([\[22\]](./references.md#ref-22)) and behavior-tree recovery form the implementation. Correct transform ownership is essential: the local estimator must supply smooth odometry, while global corrections update the map relationship without causing abrupt control-frame jumps.

For the complete simulation environment, bridge topics and benchmark setup, see [Simulation Architecture →](./simulation.md#sec-2-overview).

<VideoClip 
  src="./assets/videos/231026-sem1-demo-final-compressed-.mp4" 
  caption="Video 3.2.3 (V1): Complete autonomous navigation demonstration in Gazebo Harmonic SIL using AgileX Scout 2.0 simulation proxy, SmacPlannerHybrid, and Regulated Pure Pursuit." 
/>

<VideoClip 
  src="./assets/videos/131026-ugv-multiwaypoint.mov" 
  caption="Video 3.2.4 (V10): Sequential multi-waypoint navigation demonstration in Gazebo Harmonic SIL showing autonomous queue traversal without human intervention." 
/>

::: details Nav2 configuration and costmaps

The source describes an obstacle layer using LiDAR raytracing (5 Hz; 15 m clearing range and 2 m marking range) and an inflation layer for safety margins. A global map resolution of 0.05 m and local rolling-window costmap at 5 Hz are documented; confirm current YAML before treating these as final parameters.

`SmacPlannerHybrid` is described with 64 heading bins and Reeds–Shepp analytical expansions. RPP is described at 20 Hz with velocity-scaled lookahead. **Planner and controller reverse-motion compatibility remains an identified issue**, because Reeds–Shepp paths can include reverse segments not supported by a forward-only tracking configuration.

BehaviorTree.CPP supervises waypoint execution and recovery actions such as costmap clearing, backing up and spin recovery.

:::

<VideoClip 
  src="./assets/videos/131026-ugv-dual-ekf-test.mov" 
  caption="Video 3.2.5 (V5): Dual-EKF state estimation test in Gazebo SIL: local odometry smoothing coupled with simulated RTK-GNSS global drift correction." 
/>

**[Add picture of V6 — Odometry drift versus EKF correction: labelled comparison of dead-reckoned and corrected paths, with ground truth only if available. If this is a conceptual diagram, caption it as illustrative rather than a measured result.]**

::: details Dual-EKF implementation diagrams

The local `ekf_filter_node_odom` fuses wheel velocity and IMU yaw rate for `odom → base_footprint`; the global `ekf_filter_node_map` fuses GNSS information through `navsat_transform_node` for `map → odom`.

<VideoClip 
  src="./assets/videos/131026_UGV_Pure_odom_test.mov" 
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

These three existing interactive models are retained here temporarily to avoid losing unique functionality while the Motor Drivetrain and Steering Kinematics documents are reviewed separately. Their authoritative engineering explanations belong in [Motor Drivetrain Calculations →](./motor-drivetrain-calculation.md#sec-1-requirements) and [Steering Kinematics →](./steering-kinematics.md#sec-4-iterations). They are **not** independent navigation validation results.

<ProgrammingWidget2 />

<ProgrammingWidget3 />

<ProgrammingWidget4 />

:::

### 4.5 Navigation Parameter Tuning {#sec-4-5-tuning}

We adjusted Nav2 planner, controller and costmap parameters to examine path tracking, turning and obstacle clearance. The documented SIL baseline was **8.0 km/h**; 15.0 km/h and centimetre-level tracking remain targets rather than verified physical results.

For each adjustment, the sections below state the problem, parameter change, reason and reported result. Numerical outcomes require the original configuration and test logs for verification.

#### 1. RPP Lookahead Distance & Adaptive Scaling
- **Problem:** Fixed short lookahead distances ($L < 0.60\text{ m}$) caused frequent steering oscillations ($\dot{\omega}^2 > 38\text{ rad}^2/\text{s}^4$) and tire scrubbing on high-speed sprints ($2.22\text{ m/s}$), while excessively large lookahead ($L > 2.00\text{ m}$) caused corner cutting across taxiway bend boundaries.
- **Parameter:** `lookahead_dist: 1.20 m`, `min_lookahead_dist: 0.50 m`, `max_lookahead_dist: 2.50 m`, `lookahead_time: 1.50 s`.
- **Engineering Rationale:** Dynamic lookahead scales with linear velocity $v$:
  $$L(v) = \text{clamp}(v \cdot t_{\text{lookahead}},\, L_{\min},\, L_{\max})$$
  This extends the preview horizon at speed to dampen heading transients while retracting lookahead during tight maneuvers for geometric accuracy.
- **Observed Result:** Steering chatter metric $\dot{\omega}^2$ reduced from $38.4\text{ rad}^2/\text{s}^4$ to $< 4.2\text{ rad}^2/\text{s}^4$, reducing reported yaw oscillations; verify against recorded runs.

#### 2. Cross-Track Error & Steering Oscillation Damping
- **Problem:** Discontinuous goal pose switching along the discrete global path induced limit-cycle heading oscillations across corridor centerlines.
- **Parameter:** `use_interpolation: true`, `transform_tolerance: 0.10 s`, `max_angular_accel: 2.5 rad/s²`.
- **Engineering Rationale:** Dense cubic spline interpolation along the Reeds-Shepp trajectory smooths target lookahead poses, eliminating heading step changes.
- **Observed Result:** Cross-Track Error (CTE) bounded to a steady-state $\pm 0.042\text{ m}$ on straight sprints ($100\text{ m}$ corridor) with maximum transient deviation $< 0.115\text{ m}$ on acute $90^\circ$ turns.

<Figure 
  src="./assets/images/tuning_rpp_cte_oscillation.png" 
  alt="RPP Cross-Track Error and Steering Oscillation Analysis" 
  caption="Figure 3.2.6: Regulated Pure Pursuit Cross-Track Error (CTE) and Steering Rate Oscillation ($\dot{\omega}^2$) across lookahead parameter sweeps. Illustrates the underdamped instability regime ($L \le 0.5\text{ m}$), overdamped corner cutting ($L \ge 2.0\text{ m}$), and the optimal stability window at $L = 1.20\text{ m}$." 
/>

#### 3. Curvature-Regulated Velocity Scaling
- **Problem:** Attempting to traverse acute taxiway bends at nominal cruise velocity ($2.22\text{ m/s}$) induces excessive lateral acceleration ($a_y = v^2 \kappa > 4.5\text{ m/s}^2$), breaking tire friction limits ($\mu = 0.80$) and triggering severe lateral skid.
- **Parameter:** `use_regulated_linear_velocity_scaling: true`, `regulated_linear_scaling_min_radius: 1.0 m`, `regulated_linear_scaling_min_speed: 0.50 m/s`.
- **Engineering Rationale:** Command velocity regulates against path curvature $\kappa$:
  $$v(\kappa) = v_{\max} \cdot \sqrt{\kappa_{\max} / \kappa}$$
  decelerating smoothly prior to entering sharp corners.
- **Observed Result:** Automatic deceleration to $0.50 - 0.75\text{ m/s}$ along sharp bends ($R \le 1.5\text{ m}$), maintaining lateral acceleration $< 1.8\text{ m/s}^2$ and reducing the risk of wheel slip, followed by acceleration upon exiting into straight corridors.

#### 4. Hybrid A* Turning Radius & Heuristic LUT Tuning
- **Problem:** Unconstrained discrete grid search produces jagged point-turn waypoints requiring zero-radius pivot turns ($15.78\text{ Nm}$ scrub torque).
- **Parameter:** `minimum_turning_radius: 1.0 m`, `analytic_expansion_ratio: 3.5`, `reverse_penalty: 2.0`.
- **Engineering Rationale:** Restricting path curvature to continuous Reeds-Shepp segments ($R_{\min} \ge 1.0\text{ m}$) limits planned curvature; actual skid-steer slip remains outside the idealized model.
- **Observed Result:** 78% reduction in normalized cumulative absolute yaw rotation compared to zero-radius pivot paths, reducing planned in-place turns in the reported simulation comparison.

::: details Complete Nav2 configuration parameters and master tuning matrix

The complete parameter configuration applied across the Semester 1 SIL prototype is summarized below. For multi-run empirical trajectory logs, spatial tracking sweeps, and full-scale validation plots, refer to [Simulation & Validation Results →](./simulation.md#sec-6-testing).

| Component | Parameter | Default Value | Tuned Value | Engineering Justification |
| :--- | :--- | :--- | :--- | :--- |
| **RPP Controller** | `desired_linear_vel` | $0.5\text{ m/s}$ | $2.22\text{ m/s}$ ($8.0\text{ km/h}$) | Target Semester 1 baseline cruise speed for runway corridor sweep. |
| **RPP Controller** | `lookahead_dist` | $0.6\text{ m}$ | $1.20\text{ m}$ | Eliminates underdamped steering chatter on high-speed sprints. |
| **RPP Controller** | `min_lookahead_dist` | $0.3\text{ m}$ | $0.50\text{ m}$ | Prevents vehicle stalling and singularity near terminal waypoints. |
| **RPP Controller** | `max_lookahead_dist` | $0.9\text{ m}$ | $2.50\text{ m}$ | Caps lookahead to prevent severe corner-cutting around taxiway edges. |
| **RPP Controller** | `lookahead_time` | $1.0\text{ s}$ | $1.50\text{ s}$ | Velocity-scaled lookahead gain providing stable lead time at $2.22\text{ m/s}$. |
| **RPP Controller** | `use_regulated_linear_velocity_scaling` | `false` | `true` | Enables automatic corner deceleration based on instantaneous path curvature. |
| **RPP Controller** | `regulated_linear_scaling_min_radius` | $0.9\text{ m}$ | $1.00\text{ m}$ | Matches vehicle minimum turning radius capability. |
| **RPP Controller** | `use_cost_regulated_linear_velocity_scaling` | `false` | `true` | Decelerates vehicle proportionally when traversing high-cost obstacle proximity zones. |
| **Smac Planner** | `minimum_turning_radius` | $0.4\text{ m}$ | $1.00\text{ m}$ | Suppresses zero-radius point turns and reduces lateral tire scrub torque. |
| **Smac Planner** | `analytic_expansion_ratio` | $3.5$ | $3.5$ | Balances Reeds-Shepp analytic shot frequency with Voronoi collision checking. |
| **Costmap 2D** | `inflation_radius` | $0.55\text{ m}$ | $0.85\text{ m}$ | Enforces safe standoff margin exceeding UGV half-width ($0.33\text{ m}$) on taxiways. |
| **Costmap 2D** | `cost_scaling_factor` | $10.0$ | $3.0$ | Provides smooth exponential cost decay for gradual proximity deceleration. |

:::

## 5. Testing & Results {#sec-6-testing}

Semester 1 SIL work examined waypoint execution, dynamic obstacle handling, localization under simulated noise and path tracking at the documented **8.0 km/h** baseline. The current Navigation source describes these capabilities but does not provide verified log extracts for every quantitative claim. Results that lack traceable measurements should remain labelled **pending verification**, not presented as validated performance.

Detailed test scenarios, trajectory-error metrics, planner tuning and benchmark plots are maintained in [Simulation & Validation Results →](./simulation.md#sec-6-testing).

**V4 — Dynamic obstacle avoidance test:** In SIL simulation, dynamic obstacles (such as crossing ground vehicles or personnel) introduced into the planned corridor trigger real-time LiDAR costmap marking, velocity scaling, and trajectory replanning. _The primary video recording of this test is maintained in [Simulation & Validation Results (Video 3.4.3) →](./simulation.md#sec-6-testing)._

**[Add video of V9 (optional, if available) — Navigation failure and recovery: show a blocked path or failed navigation attempt, Nav2 recovery behavior and whether the goal was eventually reached. Keep this as a pending media slot until a real recording is confirmed.]**

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

The main limitations are the absence of physical airfield validation, unconfirmed planner and controller settings across source documents, and unverified high-speed tracking and localization accuracy. Semester 2 should prioritize physical sensor bring-up, coordinate-frame calibration, planner/controller compatibility, progressive speed tuning, and logged field tests with explicit pass/fail criteria.

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
