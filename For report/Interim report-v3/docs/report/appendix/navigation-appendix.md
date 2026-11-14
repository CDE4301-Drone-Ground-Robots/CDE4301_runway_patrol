---
title: "Appendix J: Navigation & Simulation Technical Reference"
description: "Complete Nav2 parameter configuration matrix, Gazebo physics parameters, bridge topic schemas, and extended simulation test procedures."
owner: "Hilbert Soh"
---

# Appendix J: Navigation & Simulation Technical Reference

<!-- #region nav-sim-appendix -->

This appendix compiles the complete configuration parameters, middleware bridge schemas, physics engine settings, and step-by-step verification procedures for the autonomous navigation and simulation subsystems.

### J.1 Master Nav2 Configuration Parameters

The table below documents the production parameter configuration for the Nav2 autonomy stack, established during Stage B2 tuning trials and configured in `runway_navigation/config/nav2_params.yaml`.

**Table J.1: Nav2 Component Parameter Matrix and Configuration Limits**

| Subsystem Component | Configuration Parameter | Value | Engineering Rationale |
| :--- | :--- | :---: | :--- |
| **Global Costmap** | `robot_radius` | $0.45\text{ m}$ | Enforces vehicle footprint bounding cylinder with $0.05\text{ m}$ clearance margin beyond chassis corners. |
| **Global Costmap** | `resolution` | $0.05\text{ m}$ | Balances obstacle boundary fidelity against A* 2D wavefield expansion latency on airfield maps. |
| **Local Costmap** | `rolling_window` | `true` | Centers a $12.0\text{ m} \times 12.0\text{ m}$ dynamic window on base link for real-time obstacle reactivity. |
| **Local Costmap** | `update_frequency` | $5.0\text{ Hz}$ | Provides sub-200 ms obstacle detection latency without saturating CPU thread pools. |
| **Smac Hybrid A\*** | `motion_model` | `REEDS_SHEPP` | Evaluates forward and reverse motion primitives; Dubins constrained model selected for physical deployment. |
| **Smac Hybrid A\*** | `minimum_turning_radius` | $1.00\text{ m}$ | Kinematically bounds trajectory curvature to prevent excessive lateral tire scrub on tarmac. |
| **Smac Hybrid A\*** | `angle_quantization_bins` | 64 | Discretizes angular search space into $5.625^\circ$ bins, ensuring smooth orientation transitions. |
| **Smac Hybrid A\*** | `lookup_table_size` | $20.0\text{ m}$ | Heuristic wavefield cache radius; reduced from default to accelerate node startup from 38.1 s to 2.4 s. |
| **RPP Controller** | `desired_linear_vel` | $2.22\text{ m/s}$ | Standard development baseline cruise velocity ($8.0\text{ km/h}$). |
| **RPP Controller** | `lookahead_time` | $1.20\text{ s}$ | Velocity-scaled lookahead factor providing dampening against cross-track steering chatter. |
| **RPP Controller** | `min_lookahead_dist` | $0.60\text{ m}$ | Lower bound on lookahead distance ensuring stable low-speed goal convergence without oscillation. |
| **RPP Controller** | `max_lookahead_dist` | $2.50\text{ m}$ | Upper bound preventing excessive path chord shortcutting across acute transit curves. |
| **RPP Controller** | `use_regulated_linear_velocity_scaling` | `true` | Dynamically regulates forward velocity proportional to instantaneous path curvature. |
| **RPP Controller** | `regulated_linear_scaling_min_radius` | $1.20\text{ m}$ | Curvature radius threshold below which linear deceleration begins. |
| **RPP Controller** | `regulated_linear_scaling_min_speed` | $0.60\text{ m/s}$ | Enforces minimum forward velocity floor to maintain steering control during tight curve tracking. |
| **Costmap 2D** | `inflation_radius` | $1.20\text{ m}$ | Enforces safe standoff margin exceeding UGV half-width ($0.33\text{ m}$) on taxiways. |
| **Costmap 2D** | `cost_scaling_factor` | $2.0$ | Provides smooth exponential cost decay for gradual proximity deceleration. |

#### J.1.1 Hybrid A* Configuration & Tuning Matrix (`SmacPlannerHybrid`)

`SmacPlannerHybrid` parameters were tuned during Gazebo evaluations across both the NUS EA Field and runway maps. Table 3.4.3 distinguishes nominal configurations from runtime observations; recorded timings reflect the heuristic table optimization.

<Card tag="Global Planner">

**Table 3.4.3: `nav2_smac_planner::SmacPlannerHybrid` Parameter Configuration & Tuning Matrix**

| Parameter | Configured Value | Purpose | Selection Rationale | Expected Effect | Observed in Simulation | Trade-off & Future Tuning |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `motion_model_for_search` | `"REEDS_SHEPP"` | Defines the kinodynamic steering expansion primitive model. | Enforces continuous-curvature arcs and forward/reverse rolling segments rather than omnidirectional grid steps. | Avoids sharp point-turn corners in global path plans. | Generates smooth driving arcs that respect non-holonomic limits. | Generates reverse segments if goals are behind vehicle; requires forward penalty to prevent reversing. |
| `minimum_turning_radius` | `1.0 m` | Constrains the minimum radius of planned circular arcs. | Set to $\approx 1.7\times$ track width ($w = 0.582\text{ m}$) to shift ICR outside vehicle wheelbase. | Prevents zero-radius pivot turns, mitigating tire scrubbing torque. | Planned paths used rolling arcs instead of pivot turns (RViz). Controlled comparison of 0.8/1.0/1.5 m: see [Navigation §3.2.4.2](../members/hilbert/navigation.md#nav-tuning-smac). | Larger values may fail to find paths in narrow campus passages (not tested). |
| `reverse_penalty` | `2.5` | Multiplies travel cost during backward search expansions. | Heavily disincentivizes reverse maneuvers along active runway corridors without prohibiting them. | Prefers forward loop turns over multi-point backing maneuvers. | Forward turns were preferred in the observed runs; reverse segments remain possible. | Note: Does not prohibit reversing; forward-only RPP requires careful path validation. |
| `change_penalty` | `0.1` | Penalizes switching between forward and reverse gears. | Suppresses oscillating three-point direction reversals. | Reduces frequent gear-direction changes in tight spaces. | Not measured. | Higher values may lengthen searches in cluttered dead-ends. |
| `non_straight_penalty` | `1.2` | Multiplies search cost for curved trajectory expansions. | Encourages planner to track straight runway centerlines when obstacle-free. | Reduces unnecessary serpentine weaving across open runways. | Paths followed straight corridor sections where free (RViz). | Too high a value may delay turns. |
| `cost_penalty` | `2.0` | Scales the traversal cost of inflated obstacle cells. | Ensures path stays centered between runway edge markings and obstacles. | Pushes trajectory away from high-cost inflation halos. | Paths stayed away from inflated obstacle cells; clearance not measured. | High cost penalty slightly lengthens detours around wide obstacles. |
| `angle_quantization_bins` | `64` | Discretizes orientation heading into search bins ($5.625^\circ$). | Provides fine angular resolution for smooth Reeds-Shepp heading alignment. | Prevents heading discretization errors and jerky orientation jumps. | Smooth heading transitions in RViz; not measured. | Increases memory allocation slightly compared to 16 or 32 bins; negligible on laptop. |
| `downsample_costmap` / `downsampling_factor` | `true / 2` | Downsamples costmap grid cells before search expansion ($0.05 \to 0.10\text{ m}$). | Reduces graph node explosion across large outdoor corridors. | Accelerates A\* heuristic expansion and reduces search time. | Controlled comparison: median request time 0.13–0.15 s on Route A, including ROS 2 action communication. | Slightly coarse cell resolution near narrow pedestrian gateways. |
| `max_planning_time` | `5.0 s` | Hard timeout budget for initial and replanning requests. | Prevents thread starvation if goal is placed in unmapped lethal space. | Gracefully triggers Behavior Tree recovery if search times out. | No timeout observed in the controlled comparison (0.13–0.15 s requests). Logged planner failures were mainly "no valid path found" (37). | Can be tightened to $2.0\text{ s}$ for faster failure detection in Semester 2. |
| `lookup_table_size` | `10.0 m` | Radius of precomputed Dubins/Reeds-Shepp heuristic wavefield. | Tuned down from default $20.0\text{ m}$ to optimize initialization speed and RAM. | Shortens planner start-up. | **Recorded:** plugin configuration median $38.1\text{ s} \to 2.4\text{ s}$ (NUS map; 5 and 16 sessions). Memory not recorded. | Heuristic table covers all local maneuvers; A\* handles distances beyond 10 m. |
| Smoothing Weights (`w_smooth`, `w_data`, `w_curve`, `w_cost`) | `0.3 / 0.2 / 0.15 / 0.05` | Weights for the Smac planner's path smoother. | Balances smoothing path curvature against maintaining distance to obstacles. | Reduces sharp bends in the raw lattice path. | Smoother planned paths in RViz; curvature not measured. | Over-smoothing can pull path toward obstacles if `w_cost` is too low. |

</Card>

#### J.1.2 RegulatedPurePursuitController Configuration & Tuning Matrix

The local controller runs at **$20\text{ Hz}$** and computes linear velocity ($v$) and angular velocity ($\omega$) commands from the global path:

$$
\kappa = \frac{2 y'}{L^2}, \quad \omega_{\text{cmd}} = v_{\text{cmd}} \cdot \kappa
$$

where $y'$ is the lateral offset of the lookahead point in the robot frame and $L$ is the lookahead distance.

<Card tag="Local Controller">

**Table 3.4.4: `RegulatedPurePursuitController` Parameter Configuration & Tuning Matrix**

| Parameter | Configured Value | Purpose | Selection Rationale | Expected Effect | Observed in Simulation | Trade-off & Future Tuning |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `desired_linear_vel` | `2.22 m/s (8.0 km/h)` | Baseline autonomous cruise velocity along clear straightaways. | Provides rapid corridor sweeps while preserving safe stopping distance ($d_{\text{stop}} \le 1.15\text{ m}$). | 100 m takes $45\text{ s}$ at $2.22\text{ m/s}$ (calculated), compared with $200\text{ s}$ at $0.5\text{ m/s}$. | **Recorded:** goals reached on both maps; median average straight-line speed 1.1–1.5 m/s (log wall-clock time). | Hardware rated for $15\text{ km/h}$; will evaluate progressive increases in Semester 2. |
| `lookahead_dist` ($L$) | `1.20 m` | Base lookahead distance when dynamic scaling is disabled or at nominal speed. | Selected during Gazebo controller tuning. | Reduces steering oscillation while limiting path deviation in bends. | **Measured** (scaling disabled): RMS CTE 3.48 cm, RMS angular acceleration 0.53 rad/s². | A fixed $L$ cannot suit both low and high speeds; velocity scaling addresses this. |
| `min_lookahead_dist` / `max_lookahead_dist` | `0.40 m / 2.50 m` | Clamps dynamic lookahead distance $L(v)$ within physical limits. | $L_{\min} = 0.4\text{ m}$ is close to the chassis wheelbase ($0.498\text{ m}$); $L_{\max} = 2.5\text{ m}$ limits path deviation in bends. | Maintains responsiveness at low speeds; limits lookahead at cruise. | **Measured:** the 2.50 m cap was reached during cruising. | Higher-speed values need testing; at $15\text{ km/h}$ a 1.2 s lookahead time would request 5.0 m (calculated). |
| `lookahead_time` | `1.20 s` | Lookahead time horizon scaling distance with velocity ($L(v) = v \cdot t_{\text{lookahead}}$). | Selected during Gazebo tuning; gives a 2.66 m request at $2.22\text{ m/s}$ (calculated). | Adapts lookahead distance continuously across acceleration and deceleration. | **Measured:** active lookahead 2.50 m (cap) at cruise; RMS CTE 8.62 cm. A 0.60 s setting (1.33 m) gave 3.65 cm. | Longer times increased deviation (1.80 s with a 4.0 m cap: 20.00 cm). 0.60 s is a candidate setting, not yet adopted. |
| `use_velocity_scaled_lookahead_dist` | `True` | Enables velocity-proportional lookahead adaptation. | Allows one configuration to cover low and high speeds. | Balances path deviation in bends against steering smoothness. | **Measured:** with the 2.50 m cap active, behaved like a fixed 2.50 m lookahead (8.62 cm against 9.03 cm RMS CTE). | Needs suitable $L_{\min}$ and $L_{\max}$ bounds for each speed range. |
| `regulated_linear_scaling_min_radius` | `0.80 m` | Threshold curvature radius below which linear speed is scaled down. | Limits centripetal acceleration ($a_c = \frac{v^2}{R}$) in tight curves. | Decelerates the vehicle when entering tight curves. | **Measured:** not activated on Route A (minimum lookahead radius 0.915 m > 0.80 m); lateral acceleration not measured. | Deceleration increases transit time around tight curves. |
| `regulated_linear_scaling_min_speed` | `0.40 m/s` | Floor velocity during curvature-regulated deceleration. | Prevents vehicle from stalling or stopping completely on sharp turns. | Maintains positive forward momentum through curve apexes. | Not exercised in the controlled comparison (curvature regulation not activated). | A higher floor reduces the slowdown in tight turns and the margin against wheel slip. |
| `use_cost_regulated_linear_velocity_scaling` | `True` | Modulates speed based on proximity to obstacles in the local costmap. | Slows vehicle ahead of obstacles, providing longer reaction time for replanning. | Gradual deceleration near obstacles; reduces abrupt braking. | Slower motion near obstacles; speed profile not recorded. | Requires properly tuned inflation cost decay to prevent premature slowing. |
| `cost_scaling_dist` / `cost_scaling_gain` | `1.0 m / 1.0` | Distance horizon and exponential gain for cost-regulated slowdown. | Matched to vehicle stopping distance: $d \ge \frac{v^2}{2\|a_{\text{decel}}\|} \approx \frac{2.22^2}{2(2.5)} \approx 0.99\text{ m}$. | Produces a smooth linear deceleration profile into obstacle fields. | Deceleration not measured. | Overly high gain ($\gamma \ge 2.0$) causes timid crawling near harmless grass verges. |
| `use_collision_detection` | `True` | Projects the vehicle footprint along the commanded trajectory arc. | RPP's internal check of the projected footprint against the local costmap (separate from the Collision Monitor node). | Stops trajectory execution if an obstacle is predicted in the projected path within the time horizon. | **Recorded:** 402 "collision ahead" warnings logged across sessions; obstacle clearance not measured. | Software monitor subject to sensor update latency ($10\text{ Hz}$ LiDAR); not a certified hardware E-stop relay. |
| `max_allowed_time_to_collision_up_to_fast_stop` | `1.0 s` | Time-to-collision threshold triggering emergency fast stop. | Intended to allow a stop before reaching an obstacle ($t_{\text{stop}} = \frac{v}{\|a\|} \approx 0.89\text{ s} < 1.0\text{ s}$, calculated). | Stops the robot before an obstacle predicted in its path; not a guarantee against impact. | Not measured. | Key name differs from the Jazzy parameter `max_allowed_time_to_collision_up_to_carrot`, so the Nav2 default (1.0 s) applies. |
| `use_rotate_to_heading` | `True` | Commands pure in-place rotation when initial heading error exceeds threshold. | Aligns chassis with path orientation before forward motion begins. | Prevents large initial cross-track error excursions when dispatched at odd angles. | Rotates in place at mission start if $\|\Delta\theta\| > 45^\circ$, then tracks path forward. | Induces zero-radius scrub at start; minimized by aligning vehicle beforehand. |
| `rotate_to_heading_min_angle` / `rotate_to_heading_angular_vel` | `0.785 rad (45°) / 1.2 rad/s` | Angular error threshold and rotational velocity for heading alignment. | $45^\circ$ threshold allows gentle curves to be negotiated while driving forward. | Limits pivot turns to large initial misalignments. | Not measured. | Angular acceleration is limited to $2.5\text{ rad/s}^2$. |
| `max_linear_accel` / `max_linear_decel` | `2.0 m/s² / -2.5 m/s²` | Listed in the RPP block; active limits applied by `velocity_smoother` (±3.0 m/s², 2.78 m/s). | Kept below 4WD skid-steer tire friction limits ($a_{\max} \le \mu g \approx 0.8 \times 9.81 = 7.85\text{ m/s}^2$). | Prevents wheel spin on acceleration and wheel lockup on braking. | Not measured. | Must be harmonized with downstream velocity smoother nodes. |
| `allow_reversing` | `False` | Restricts controller to forward-only trajectory tracking. | Reversing on active runway corridors is not intended. | Vehicle drives forward only, keeping the front LiDAR and camera facing the direction of travel. | Forward driving only. | **Compatibility limitation:** RPP cannot follow a reverse Reeds–Shepp segment if the planner produces one. `reverse_penalty = 2.5` reduces, but does not remove, this risk. |

</Card>

#### J.1.3 Behavior Tree Architecture & Turning Mechanisms

When a navigation mission is dispatched, the **Nav2 BT Navigator** executes the default Nav2 Jazzy `NavigateToPose` Behavior Tree [\[8\]](../members/hilbert/references.md#ref-8); no custom tree file is used. The tree is ticked every 10 ms (`bt_loop_duration: 10`). A `PipelineSequence` runs global path replanning and local path tracking together:

```text
NavigateRecovery (RecoveryNode, retries = 6)
├── PipelineSequence (Primary Navigation Pipeline)
│   ├── RateController (1 Hz) → ComputePathToPose (SmacPlannerHybrid, R ≥ 1.0m)
│   └── FollowPath (RegulatedPurePursuitController, 20 Hz)
└── RoundRobin (Recovery Actions)
    ├── ClearEntireCostmap (local and global costmaps)
    ├── Spin (nav2_behaviors::Spin; rotation limited to 1.0 rad/s by behavior_server)
    ├── Wait (nav2_behaviors::Wait)
    └── BackUp (nav2_behaviors::BackUp)
```

The recovery order spin → wait → backup matches the sequence recorded in the `behavior_server` logs.

**Turning and Recovery Mechanisms:**
1. **RPP Rotate-to-Heading vs Behavior Tree Spin:** Two separate mechanisms produce in-place rotation:
   - _RPP Rotate-to-Heading:_ Executed inside the local controller when heading error to the path exceeds $45^\circ$ ($|\Delta\theta| > 0.785\text{ rad}$), typically at mission start. Once aligned, RPP returns to forward path tracking.
   - _Behavior Tree Recovery Spin:_ Executed by `nav2_behaviors::Spin` on the behavior server only after path following has failed and costmaps have been cleared. It commands an in-place pivot (limited to $1.0\text{ rad/s}$) to clear sensor blind spots and re-observe obstacles.
2. **Goal Checking Behavior:** `SimpleGoalChecker` evaluates position ($xy \le 0.35\text{ m}$) and orientation ($\theta \le 0.35\text{ rad}$) tolerances. _It does not command rotation._ Final goal orientation alignment is handled by RPP's terminal goal-approach logic.
3. **Hardware Bridge Distinction:** The STM32 F446RE firmware under development is for physical UGV motor driver communication (CANopen to ZLAC8015D). It is _not_ part of the Gazebo simulation loop, which commands the virtual chassis directly via `ros_gz_bridge` and `gz-sim-diff-drive-system`.

---

### J.2 Simulation Requirements Traceability

**Table J.2: Simulation Requirements Traceability & Verification Status**

| Requirement ID | Parameter Description | Target Specification | Simulation Value | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-SIM-01** | Simulation Physics Engine | DART physics, deterministic stepping | $1.0\text{ ms}$ fixed step ($1,000\text{ Hz}$) | <Badge type="tip" text="Verified" /> |
| **REQ-SIM-02** | Middleware Bridge | ROS 2 Jazzy $\leftrightarrow$ Gazebo Harmonic | `ros_gz_bridge` | <Badge type="tip" text="Verified" /> |
| **REQ-SIM-03** | Cruise Velocity Verification | Trajectory tracking at baseline | $8.0\text{ km/h}$ ($2.22\text{ m/s}$) | <Badge type="tip" text="Verified" /> |
| **REQ-SIM-04** | Sprint Velocity Goal | High-speed runway sweeping | $15.0\text{ km/h}$ ($4.17\text{ m/s}$) | <Badge type="warning" text="Semester 2 Target" /> |
| **REQ-SIM-05** | State Estimation Topology | Dual-EKF sensor fusion | Local 50 Hz, Global 30 Hz | <Badge type="tip" text="Verified" /> |
| **REQ-SIM-06** | Curvature Limitation | Bound planned trajectory turning radius | $R_{\min} \ge 1.0\text{ m}$ | <Badge type="tip" text="Verified" /> |

---

### J.3 ROS–Gazebo Bridge Topic Schemas & Data Flow

Table J.3 defines the bridge topic mappings configured in `sim_and_nav.launch.py` to interface Gazebo Harmonic physics simulation with ROS 2 Jazzy.

**Table J.3: `ros_gz_bridge` Topic Schemas, Directions & Quality of Service (QoS)**

| Gazebo Topic | ROS 2 Topic | ROS 2 Message Type | Direction | QoS Profile | Functional Description |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `/world/default/clock` | `/clock` | `rosgraph_msgs/msg/Clock` | GZ $\to$ ROS | Best Effort | Simulation clock synchronisation for deterministic time stepping. |
| `/model/scout/odometry` | `/odom` | `nav_msgs/msg/Odometry` | GZ $\to$ ROS | Reliable | Raw wheel odometry containing wheel encoder poses and linear/angular twists. |
| `/model/scout/cmd_vel` | `/cmd_vel` | `geometry_msgs/msg/Twist` | ROS $\to$ GZ | Reliable | Velocity commands dispatched by RPP local controller to skid-steer plugin. |
| `/lidar/points` | `/scan` | `sensor_msgs/msg/LaserScan` | GZ $\to$ ROS | Sensor Data | Simulated 2D LiDAR planar point-cloud scan for costmap obstacle layer. |
| `/imu/data` | `/imu/data` | `sensor_msgs/msg/Imu` | GZ $\to$ ROS | Sensor Data | High-rate simulated angular velocities and linear accelerations at 50 Hz. |
| `/navsat/fix` | `/gps/fix` | `sensor_msgs/msg/NavSatFix` | GZ $\to$ ROS | Sensor Data | Simulated georeferenced latitude/longitude coordinates at 10 Hz. |

<Figure 
  src="../members/hilbert/assets/diagrams/sim-development-workflow.svg" 
  alt="Closed-Loop Robotics Simulation Development Lifecycle" 
  caption="Figure J.1: Closed-loop simulation development workflow. Robot model (URDF/Xacro), DART physics (1 ms step), simulated sensors, Nav2 execution, and post-trial evaluation." 
/>

---

### J.4 AgileX Scout 2.0 Simulation Proxy vs Physical Prototype Comparison

Table J.4 outlines the structural, inertial, and kinematic discrepancies between the AgileX Scout 2.0 simulation proxy and the preliminary custom physical FOD Hunter prototype.

**Table J.4: Simulation Proxy Versus Preliminary Physical Design Assumptions**

| Parameter | AgileX Scout 2.0 (Simulation Proxy) | FOD Hunter (Physical Prototype Preliminary Design) | Engineering Assessment & Discrepancy Mitigation |
| :--- | :--- | :--- | :--- |
| **Total Mass ($m$)** | $52.37\text{ kg}$ (URDF model) | $65.0\text{ kg}$ (calculated CAD budget) | Prototype is $24.1\%$ heavier. Motor sizing uses 65 kg baseline; gains will be retuned on hardware. |
| **Wheelbase ($L$)** | $0.498\text{ m}$ | $0.4888\text{ m}$ | $1.8\%$ difference; negligible effect on kinematic steering ICR location. |
| **Track Width ($B$)** | $0.583\text{ m}$ | $0.575\text{ m}$ | $1.4\%$ difference; within nominal tire scrub calibration margins ($B_{\text{eff}} \approx 1.30 B$). |
| **Wheel Diameter ($D$)** | $0.330\text{ m}$ ($R = 0.165\text{ m}$) | $0.263\text{ m}$ ($R = 0.1315\text{ m}$) | Smaller prototype wheels increase output torque (+25.5%) but require higher RPM (302 RPM vs 241 RPM at 15 km/h). |
| **Drivetrain Layout** | 4WD differential skid steer, geared hub motors | 4WD direct-drive BLDC hub motors (ZLLG80ASM250) | Eliminates gearbox backlash; direct-drive response reduces deadband lag. |
| **Suspension** | Rigid axle chassis | Independent trailing-arm coilover suspension | Suspension compliance dampens airfield chatter but introduces dynamic roll during high-speed turns. |
| **Computing Host** | Intel Core i7 / WSL2 host | NVIDIA Jetson Orin Nano + STM32 companion | Dual-EKF and Nav2 must be optimized for ARM64 real-time execution. |

---

### J.5 Simulation Proving Grounds: Aarhus Airport vs NUS EA Field

**Table J.5: Proving Ground Environment Layout Comparison**

| Environment Parameter | Aarhus Airport Runway 10R/28L (EKAH) | NUS EA Field Courtyard Proving Ground | Operational Significance |
| :--- | :--- | :--- | :--- |
| **Total Bounding Extent** | $2,702\text{ m} \times 45\text{ m}$ | $52.2\text{ m} \times 29.1\text{ m}$ | EA Field is $51.8\times$ shorter and $1.5\times$ narrower, enforcing tight corridor containment. |
| **Corridor Widths** | $45.0\text{ m}$ (open runway) | $2.2\text{ m}$ to $4.5\text{ m}$ (paved walkways) | EA Field verifies narrow pathway navigation and obstacle standoff margins. |
| **Obstacle Geometry** | None (open tarmac) | Concrete columns, benches, retaining walls, grass keep-out | Verifies dynamic local costmap marking and continuous circumnavigation. |
| **GNSS Multipath Environment**| Unobstructed open sky ($\text{HDOP} \approx 0.8$) | Partial building occlusion ($\text{HDOP} \approx 1.2\text{–}1.8$) | Simulates urban canyon GPS degradation; validates Dual-EKF reliance on IMU dead-reckoning. |
| **Ground Surface** | Uniform asphalt ($\mu \approx 0.85$) | Concrete pavers ($\mu \approx 0.70\text{–}0.80$), wet drainage grates | Realistic friction variations to evaluate skid-steer tire slip. |

---

### J.6 Detailed Simulation Test Procedures (E1 to E4)

#### Procedure E1 — Planner Initialization & Startup Benchmark
- **Objective:** Quantify plugin startup latency and heuristic wavefield pre-computation times.
- **Methodology:** Monitor `planner_server` lifecycle transition logs across varying heuristic lookup table dimensions ($10.0\text{ m}$, $20.0\text{ m}$, and $50.0\text{ m}$).
- **Result:** Reducing table radius from full-map to $20.0\text{ m}$ reduced startup latency from $38.1\text{ s}$ to **$2.4\text{ s}$** ($93.7\%$ reduction) without compromising path optimality.

#### Procedure E2 — Obstacle Costmap Inflation & Replanning
- **Objective:** Verify dynamic obstacle marking, inflation boundary clearance, and local replanning reactivity.
- **Methodology:** Spawn dynamic cylinder obstacles ($r = 0.30\text{ m}$) directly along the planned centerline path in Gazebo Harmonic. Measure vehicle deceleration distance and lateral avoidance margin.
- **Result:** Local costmap marked obstacles within 1 control cycle ($50\text{ ms}$ at $20\text{ Hz}$). Vehicle executed smooth lateral deviations maintaining $>0.80\text{ m}$ standoff margin from obstacle perimeter.

<Figure 
  src="../members/hilbert/assets/images/tuning-cost-regulated-deceleration.png" 
  alt="Cost Regulated Proximity Braking Curves" 
  caption="Figure J.2: Calculated RPP velocity regulation curves approaching obstacles across scaling gains for cost_scaling_dist = 1.0 m (analytical deceleration model)." 
/>

#### Procedure E3 — Dual-EKF Fusion Under Sensor Noise
- **Objective:** Confirm continuous transform generation (`map → odom → base_footprint`) under Gaussian noise injection.
- **Methodology:** Inject $\sigma = 0.05\text{ m/s}$ wheel odometry velocity noise and $\sigma = 0.02\text{ rad/s}$ IMU angular rate noise. Evaluate transform tree continuity across 23 simulation sessions.
- **Result:** EKF filters maintained continuous transform publishing at 30 Hz simulation time without covariance divergence.

#### Procedure E4 — Dynamic Controller Waypoint Tracking
- **Objective:** Characterize Cross-Track Error (CTE) and angular command acceleration chatter across varying lookahead configurations on Route A.
- **Methodology:** Five unsmoothed runs per parameter set on standardized 52 m course with $90^\circ$ and $135^\circ$ turns. Record ground-truth poses from Gazebo physics engine.
- **Result:** Production configuration ($t_{\text{lookahead}} = 1.20\text{ s}$, max $2.50\text{ m}$) achieved RMS CTE of **$0.061\text{ m}$** with smooth steering commands ($RMS\ \dot{\omega} = 0.44\text{ rad/s}^2$).

---

### J.7 Software-in-the-Loop Functional Verification Results

**Table J.6: Software-in-the-Loop Functional Verification Results Summary**

| Autonomous Function | Target Verification Criterion | Recorded Simulation Evidence | Verification Status |
| :--- | :--- | :--- | :---: |
| **Waypoint Dispatch** | Ingest coordinates and dispatch Nav2 goal | 146 goals completed across varying layouts | <Badge type="tip" text="Passed" /> |
| **Curvature Feasibility**| Avoid zero-radius pivot turns during cruise | Reeds-Shepp lattice maintained $R \ge 1.0\text{ m}$ | <Badge type="tip" text="Passed" /> |
| **Obstacle Avoidance** | Dynamically circumnavigate unmapped obstacles | Real-time local costmap inflation; 0 collisions | <Badge type="tip" text="Passed" /> |
| **Recovery Behaviors** | Resolve path blocking via configured behaviors | Costmap clearing and spin recovery cleared blocks | <Badge type="tip" text="Passed" /> |
| **DDS Multicast Discovery** | Unicast peering across WSL2 Hyper-V NAT | Stable topic exchange with external companion | <Badge type="tip" text="Passed" /> |

<!-- #endregion nav-sim-appendix -->
