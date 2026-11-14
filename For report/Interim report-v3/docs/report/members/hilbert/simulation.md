---
title: "Autonomous Navigation Simulation & Validation"
owner: "Hilbert Soh"
outline: [2, 3]
---

# Autonomous Navigation Simulation & Validation

> **Hilbert Soh · Semester 1 software-in-the-loop (SIL)**  
> **Scope:** AgileX Scout 2.0 is the simulation proxy, not the final FOD Hunter physical chassis. Results are from simulation runs, configuration files and recorded ROS 2 logs. Physical vehicle performance has not been verified.

<!-- #region report -->

## 3.4.1 Objectives & Requirements {#sim-objectives}

Gazebo Harmonic was employed to develop and verify autonomous navigation during concurrent physical vehicle fabrication. Evaluations characterized global path planning, local path tracking, obstacle avoidance, and recovery behaviors under repeatable physics. Results establish algorithmic functionality on a kinematic proxy rather than physical chassis performance.

Testing focused on a development baseline cruise speed of **8.0 km/h ($2.22\text{ m/s}$)**, with supplementary runs at **10.0 km/h ($2.78\text{ m/s}$)**. The target operational sprint speed of **15.0 km/h ($4.17\text{ m/s}$)** remains a Semester 2 physical objective. Evaluations analyzed real-time factor, tracking error, turning feasibility, and obstacle clearance.

### 3.4.1.1 Analytical Braking Distance & Obstacle Clearance Limits {#sim-braking-safety}

Airfield corridor navigation introduces dynamic stopping constraints that govern velocity-smoother limits and emergency clearance envelopes. Autonomous cruise velocity was clamped to **8.0 km/h ($2.22\text{ m/s}$)** for the confined NUS EA Field proving ground ($52.2\text{ m} \times 29.1\text{ m}$). Total theoretical stopping distance is governed by kinematic deceleration accounting for sensor-to-actuator latency ($\Delta t_{\text{lat}}$) and controlled braking deceleration ($a_{\text{decel}}$):

$$
d_{\text{stop}} = v \cdot \Delta t_{\text{lat}} + \frac{v^2}{2|a_{\text{decel}}|}
$$

Where $\Delta t_{\text{lat}} \approx 0.07\text{ s}$ represents total pipeline latency (assumed $0.05\text{ s}$ controller cycle at $20\text{ Hz}$ plus $0.02\text{ s}$ additional delay), and $a_{\text{decel}} = -2.5\text{ m/s}^2$ is an assumed deceleration, lower than the configured velocity-smoother limit of $3.0\text{ m/s}^2$:
- **Development Cruise Baseline ($8.0\text{ km/h} \approx 2.22\text{ m/s}$):**
  $$d_{\text{stop}} = (2.22\text{ m/s})(0.07\text{ s}) + \frac{(2.22\text{ m/s})^2}{2(2.5\text{ m/s}^2)} = 0.155\text{ m} + 0.986\text{ m} \approx \mathbf{1.14\text{ m}} \le 1.15\text{ m}$$
- **Sprint Target ($15.0\text{ km/h} \approx 4.17\text{ m/s}$):**
  $$d_{\text{stop, 15km/h}} = (4.17)(0.07) + \frac{4.17^2}{2(2.5)} = 0.292\text{ m} + 3.478\text{ m} \approx \mathbf{3.77\text{ m}}$$
- **Actuator Lag Sensitivity:** Factoring an estimated physical actuator lag of $0.15\text{–}0.25\text{ s}$ (pending hardware characterization), stopping distance expands to **$\approx 4.1\text{–}4.5\text{ m}$**. High-speed autonomous tracking at $15.0\text{ km/h}$ was not simulated and forms a staged Semester 2 objective.

> [!NOTE]
> **Status Label — Analytical Prediction:** These values provide analytical stopping-distance estimates under controlled deceleration rather than empirically measured braking on physical hardware. The $1.20\text{ m}$ costmap inflation radius provides an obstacle clearance buffer appropriate for the $8.0\text{ km/h}$ cruise baseline ($d_{\text{stop}} \approx 1.14\text{ m}$), but does not guarantee stopping clearance at $15.0\text{ km/h}$ ($3.8\text{–}4.5\text{ m}$), which will require retuning inflation buffers, lookahead horizons, and braking decelerations during physical field trials.

::: details Simulation requirements, operating constraints and verification traceability

#### Navigation Testing Objectives

The simulation requirements covered planning, path tracking and recovery:

- **Hybrid A\* Global Path Feasibility:** The planner must compute kinematically feasible Reeds-Shepp trajectory paths respecting a minimum turning radius constraint ($R_{\min} \ge 1.0\text{ m}$). Paths must strongly suppress unnecessary in-place zero-radius turns during normal transit on high-friction tarmac to mitigate tire scrub and peak actuator stress, while preserving in-place rotation for initial heading alignment and emergency Behavior Tree recovery.
- **Regulated Pure Pursuit Path Tracking:** The local controller must maintain Cross-Track Error ($\text{CTE} \le 0.15\text{ m}$) along high-speed straightaways at 8 km/h ($2.22\text{ m/s}$), bound centripetal acceleration ($a_c = \frac{v^2}{R} \le 1.8\text{ m/s}^2 < 0.2g$) through curvature regulation, and limit steering chatter ($\dot{\omega}^2 \le 0.50\text{ rad}^2/\text{s}^4$).
- **Behavior Tree Autonomous Recovery:** The navigation supervisor must detect obstacle deadlock or path planning failure within $10\text{ seconds}$, executing an escalating recovery sequence (costmap clearing → bounded spin → linear backup → pause) up to a 6-retry threshold before reporting mission status back to C2.

#### Software and Computing Constraints

Simulation was executed on an Ubuntu 24.04 WSL2 workstation under two developmental constraints: static unicast DDS peering was required across Hyper-V NAT adapters (`cyclonedds.xml`), and compute contention between Gazebo rendering and Nav2 yielded an observed real-time factor of $0.31\text{–}0.33$.

> Complete simulation requirements traceability and verification status (Table J.2) are compiled in **[Appendix J: Navigation & Simulation Technical Reference](/report#appendix-j)**.

:::

<span id="sec-2-overview"></span>

## 3.4.2 Simulation Architecture {#sim-architecture}

The simulation integrates **Gazebo Harmonic** with **ROS 2 Jazzy** [\[7\]](./references.md#ref-7) via `ros_gz_bridge`. Gazebo publishes simulated odometry, 2D LiDAR scans, IMU streams, and GNSS fixes to Nav2 [\[8\]](./references.md#ref-8), receiving smoothed `/cmd_vel` commands. Simulation time synchronization (`/clock`) and consistent TF trees ensure deterministic multi-node execution.

**Runtime localization verification:** In WSL2 execution, `ekf_filter_node_odom`, `ekf_filter_node_map`, and `navsat_transform_node` actively published `/odometry/local`, `/odometry/global`, and `/odometry/gps`, maintaining a complete `map → odom → base_footprint` transform chain. This confirms functional execution of the Dual-EKF pipeline, though absolute position accuracy requires evaluation against moving ground truth. Simulated IMU and odometry published at 50 Hz, GNSS and LiDAR at 10 Hz, and EKF state estimates at 30 Hz in simulation time ($RTF \approx 0.31\text{–}0.33$).

<Figure src="./assets/diagrams/ros2-gazebo-architecture.svg" alt="ROS 2, Gazebo Harmonic and Nav2 simulation architecture" />

::: details ROS–Gazebo bridge topic schemas and development workflow

The simulation environment verified kinematic skid-steer yaw dynamics, deterministic parameter benchmarking ($\Delta t = 1.0\text{ ms}$ fixed DART physics step), and software-in-the-loop ROS 2 message compatibility (`geometry_msgs/msg/Twist`, `sensor_msgs/msg/LaserScan`, `nav_msgs/msg/Odometry`) before hardware integration.

> Complete middleware bridge topic schemas, QoS configurations (Table J.3), and the closed-loop robotics development lifecycle flowchart (Figure J.1) are documented in **[Appendix J: Navigation & Simulation Technical Reference](/report#appendix-j)**.

:::

## 3.4.3 Design Methodology & Selection {#sim-methodology}

The **AgileX Scout 2.0** commercial UGV model was adopted as a software-in-the-loop simulation proxy during concurrent FOD Hunter chassis fabrication. As both platforms utilize four-wheel differential skid steering, the proxy enabled end-to-end validation of ROS 2 communication, global planners, and local controllers. However, structural dimensions, mass, and drivetrain configurations differ from the physical prototype. In parallel, a simulation model of the NUS EA Field courtyard was constructed to evaluate narrow corridor traversal and obstacle negotiation.

The viewer below shows the AgileX Scout 2.0 simulation proxy (`scout_v2.glb`) built from the project meshes:

<SimulationWidget1 />

The navigation algorithm selection rationale belongs in [Navigation](./navigation.md), while this document focuses on the simulation assumptions and measured effects of tuning. The software distribution comparison belongs in [Software & Development Environment](/report#software-environment).

::: details Proxy selection, environment iterations, mapping and simulation assumptions

> Software/OS selection is documented in [Programming — Software & Development Environment](/report#software-environment).

#### AgileX Scout 2.0 Model Selection as Kinematic Proxy

Prior to chassis fabrication, the **AgileX Scout 2.0** served as a kinematic simulation proxy [\[13\]](./references.md#ref-13), enabling development of the Nav2 stack, sensor interfaces, and Command and Control (C2) links.

<Card>

![AgileX Scout 2.0 4WD Mobile Robot Chassis](./assets/images/agilex-scout-2.0.png)

AgileX Scout 2.0 Kinematic Simulation Proxy

4WD industrial mobile chassis ($52.37\text{ kg}$ modeled, $0.498\text{ m}$ wheelbase, $0.583\text{ m}$ track width). Used in Gazebo Harmonic to test SmacPlannerHybrid paths, Regulated Pure Pursuit tracking and behaviour-tree recovery before the FOD Hunter chassis was assembled.

</Card>

**Wheelbase-to-track aspect ratio:** Skid-steer platforms turn through deliberate lateral tire slip [\[13\]](./references.md#ref-13). The ratio of wheelbase $L$ to effective track width $W$ governs maneuverability and tire scrubbing:

$$
\text{Ratio} = \frac{L}{W} = \frac{0.498\text{ m}}{0.583\text{ m}} \approx \mathbf{0.854} < 1.0
$$

An aspect ratio below unity ($L/W < 1.0$) ensures drive wheel moment arms exceed the longitudinal wheelbase, reducing tire scrubbing torque and motor current during turns.

#### Proving Ground Iterations & Corridor Bounding

Testing transitioned from an open airport runway model ($2,702\text{ m} \times 45\text{ m}$) to the confined NUS EA Field courtyard ($52.2\text{ m} \times 29.1\text{ m}$), which provided rich geometric features for obstacle circumnavigation. To eliminate massive memory allocation on embedded computers ($1.2 \times 10^8\text{ cells}$ for a full runway), an analytically bounded operational corridor ($300\text{ m} \times 200\text{ m}$ at $0.10\text{ m/px}$) achieves a **95.0% memory reduction** ($6.0\text{ MB}$ footprint).

> For detailed tabular comparisons of Scout 2.0 proxy parameters versus physical prototype assumptions (Table J.4), and proving ground environment characteristics (Table J.5), see **[Appendix J: Navigation & Simulation Technical Reference](/report#appendix-j)**.

:::

## 3.4.4 Implementation & Prototype {#sim-implementation}

The integrated simulation couples the AgileX Scout 2.0 kinematic model, Gazebo Harmonic physics environments, sensor plugins, `ros_gz_bridge`, and the ROS 2 Nav2 stack. This framework enabled closed-loop evaluation of global path planning, local path tracking, and autonomous recovery under realistic corridor constraints.

**NUS EA Field Gazebo Demonstration**

Video 3.4.1 demonstrates autonomous multi-waypoint transit across the simulated **NUS EA Field courtyard**, navigating narrow paved passages ($2.2\text{ m}\text{–}4.5\text{ m}$), executing obstacle costmap inflation around building perimeters, and validating collision-free path tracking:

<VideoClip
  src="./assets/videos/nus-ea-simulation-demo.mp4"
  poster="./assets/images/nus-ea-simulation-poster.png"
  caption="Video 3.4.1: Autonomous navigation demonstration in the NUS EA Field Gazebo Harmonic simulation environment, showing corridor path planning, building perimeter costmap inflation, and multi-waypoint tracking."
/>

**NUS EA Field environment:**

<Figure 
  src="./assets/images/nus_ea_field_dimensions.png" 
  alt="NUS EA Field Gazebo Environment Layout and Dimensions" 
  caption="Figure 3.4.2: NUS EA Field Gazebo simulation world layout showing dimensioned corridors (2.2 m – 4.5 m), paved traversable zones, building perimeters, and UGV origin." 
/>

**AgileX Scout 2.0 proxy:**

<Figure 
  src="./assets/images/agilex-scout-2.0.png" 
  alt="AgileX Scout 2.0 Simulation Proxy Chassis" 
  caption="Figure 3.4.3: AgileX Scout 2.0 industrial mobile robot platform used as the kinematic stand-in for Gazebo Harmonic autonomy evaluations." 
/>

::: details Simulation setup, planner/controller parameters and behaviour-tree configuration

#### Simulation Environment Setup and Architecture Summary

The simulation loads `nus_ea_field.sdf` and spawns the Scout model from `scout_v2.xacro` with DART running at $1,000\text{ Hz}$. Sensor inputs (Dual-EKF state estimation at $50\text{ Hz}$, costmap ingestion with dynamic LiDAR at $10\text{ Hz}$, `SmacPlannerHybrid` at $1\text{ Hz}$, and `RegulatedPurePursuitController` at $20\text{ Hz}$) execute via `bringup_nav2.launch.py`.

> For complete parameter configuration matrices of `SmacPlannerHybrid` (Table 3.4.3) and `RegulatedPurePursuitController` (Table 3.4.4), behavior tree recovery sequences, and controller turning mechanics, see **[Appendix J: Navigation & Simulation Technical Reference](/report#appendix-j)**.

:::

## 3.4.5 Testing & Results {#sim-testing}

Navigation performance was evaluated across the NUS EA Field and airport runway simulation environments using goal inputs dispatched via RViz, automated mission scripts, and the C2 communications bridge. The performance data in Table 3.4.5 summarizes runtime diagnostics extracted from 93 logged Nav2 development sessions. These sessions evaluated functional waypoint execution across varying operational scenarios; controlled quantitative tracking evaluations (measuring Cross-Track Error and angular acceleration chatter) were conducted independently under standardized test conditions ([Navigation §3.2.4.2](./navigation.md#sec-4-5-tuning)).

**Table 3.4.5: Recorded Simulation Results (ROS 2 logs)**

| Result                                         | Recorded value                                                                                                          | Source and note                                                                        |
| :--------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| Smac Hybrid plugin configuration time, NUS map | Median 38.1 s (34.4–38.7 s, 5 sessions) → 2.4 s (1.9–3.8 s, 16 sessions) after the heuristic-table change; 93.7% lower  | `planner_server` logs; plugin configuration only, not total simulation start-up        |
| Navigation requests                            | 213 requests: 146 reached the goal, 43 replaced by a new goal, 12 aborted, 6 failed, 2 cancelled, 4 open at shutdown    | `bt_navigator` logs; mixed demos, manual goals and difficult goals                     |
| C2 goals with Hybrid A\*                       | NUS map: 11 reached, median 10.7 s (median 11.6 m straight-line). Runway map: 13 reached, median 19.1 s (median 25.6 m) | Log wall-clock time; distances differ, so these are not planner-efficiency comparisons |
| Recovery behaviour                             | 5 navigation requests triggered recovery: 2 then reached the goal, 2 failed or aborted, 1 was replaced                  | `behavior_server` logs; events during normal testing (summarised below)                |
| Dual-EKF in use                                | 23 sessions with EKF nodes; 57 goals reached in those sessions                                                          | Shows the localization pipeline running; accuracy not measured                         |

For dynamic obstacle avoidance demonstrations, see [Autonomous Navigation — Section 3.2.5 (Video 3.2.5)](./navigation.md#sec-6-testing). The controller tuning decisions are explained in [Navigation — Section 3.2.4.2](./navigation.md#sec-4-5-tuning). Physical vehicle testing is scheduled for Semester 2.

**Airport Runway Demonstration (Secondary Proving Ground):**

The simulation recording below demonstrates autonomous navigation within the full-scale **Airport Runway environment (`airport_runway.sdf`)**, modeled after Aarhus Airport Runway 10R/28L ($2,702\text{ m} \times 45\text{ m}$ asphalt runway), executing open corridor sweeps, centerline tracking, and dynamic costmap clearing at the $2.22\text{ m/s}$ baseline:

<VideoClip
  src="./assets/videos/simulation-demo.mp4"
  poster="./assets/images/demo-poster.jpg"
  caption="Video 3.4.2: Integrated autonomous navigation simulation in the Aarhus Airport Gazebo Harmonic runway world, demonstrating centerline tracking, sensor perception, costmap inflation, and Nav2 waypoint tracking at 2.22 m/s."
/>

<CardGrid :cols="2">

<Card tag="Semester 1 Target">

**Primary Demo: NUS EA Field Autonomous Navigation**

AgileX Scout 2.0 proxy executing multi-waypoint navigation across paved campus walkways, with obstacle avoidance and path tracking on the aerial-photograph map.

</Card>

<Card tag="Airfield Baseline">

**Secondary Demo: Aarhus Airport Runway Sweep**

Runway corridor sweep at $2.22\text{ m/s}$ with centreline tracking and obstacle avoidance, in a world modelled on Aarhus Airport Runway 10R/28L ($2,702\text{ m} \times 45\text{ m}$).

</Card>

</CardGrid>

::: details Test procedures, planner configuration, recovery behaviour and functional verification results

#### Test Setup and Route Summaries

Four operational scenarios guided functional controller tuning in Gazebo Harmonic:
- **Route 1 (Runway High-Speed Sprint):** $100.0\text{ m}$ straight corridor sprint evaluating cruise tracking stability at $2.22\text{–}2.78\text{ m/s}$ ($8\text{–}10\text{ km/h}$).
- **Route 2 (Acute 90° Taxiway Bend):** Traversing a sharp $90^\circ$ corner ($R = 4.0\text{ m}$) bordered by runway edge lighting and berms.
- **Route 3 (High-Density FOD S-Curve Avoidance):** S-curve circumnavigation around two stationary debris targets and service vehicles.
- **Route 4 (NUS EA Courtyard Narrow Doorway):** Navigating through a $2.2\text{ m}$ narrow pedestrian passage between concrete columns on the campus map.

> For complete step-by-step test procedures (Procedures E1 to E4), cost-regulated deceleration curves (Figure J.2), and software-in-the-loop functional verification matrix (Table J.6), see **[Appendix J: Navigation & Simulation Technical Reference](/report#appendix-j)**.

#### Planner Configuration & Recovery Observations

- **Hybrid A\*:** Replaced 2D grid search with continuous Reeds-Shepp arcs ($R \ge 1.0\text{ m}$). Reducing the heuristic wavefield table size (`lookup_table_size: 10.0 m`) decreased configuration time from 38.1 s to 2.4 s (93.7% reduction).
- **RPP Speed Regulation:** Regulated Pure Pursuit dynamically scales velocity according to curvature and local obstacle cost decay ($v_{\min} = 0.40\text{ m/s}$, $d_{\text{cost}} = 1.0\text{ m}$).
- **Recovery Behaviors:** In five logged recovery events, Nav2's default recovery sequence (clear costmap, spin, wait, back up) resolved blocking in two instances, while two aborted due to unmapped obstacles.

The following still require validation on the physical prototype:
- **Goal and localisation accuracy on the physical robot.** In the controlled simulation runs, the robot stopped a median 0.32–0.34 m from the goal (within the 0.35 m goal tolerance, but above the 0.15 m target).
- **Obstacle clearance**, which was not measured.
- **An active collision-stopping layer.** The Nav2 Collision Monitor node is configured but not launched.
- **Physical braking, tire slip and actuator performance.**

_Additional Verification Archive:_ Milestone video recordings are preserved in the repository archive: <AssetLink href="./assets/videos/231026-sem1-demo-final-compressed-.mp4">Semester 1 Milestone Demo Final (MP4)</AssetLink> • <AssetLink href="./assets/videos/131026-ugv-dual-ekf-test.mov">Dual-EKF RViz Test (MOV)</AssetLink> • <AssetLink href="./assets/videos/131026-ugv-multiwaypoint.mov">Multi-Waypoint Route Test (MOV)</AssetLink> • <AssetLink href="./assets/videos/131026-ugv-object-avoidance.mov">Reactive Obstacle Avoidance Test (MOV)</AssetLink>.

:::

## 3.4.6 Engineering Discussion {#sim-discussion}

Simulation evaluations demonstrate that coupling `SmacPlannerHybrid` with `RegulatedPurePursuitController` achieves reliable multi-waypoint navigation across both airfield and campus environments, while optimizing the heuristic wavefield table significantly reduces planner initialization latency. Generating curvature-constrained Reeds-Shepp paths successfully eliminates zero-radius pivot turns along nominal transit corridors, mitigating anticipated tire scrubbing and powertrain stresses. However, empirical physical validation remains essential to account for mass discrepancies ($52.37\text{ kg}$ proxy vs $65.0\text{ kg}$ prototype), physical CANopen motor actuation delays, and non-ideal tarmac tire friction.

For mathematical planner formulations and controller derivations, refer to [Navigation](./navigation.md); physical skid-steer dynamics and tire scrubbing models are detailed in [Steering Kinematics](./steering-kinematics.md); and actuator torque sizing is presented in [Motor Drivetrain Calculations](./motor-drivetrain-calculation.md).

::: details Evaluation, lessons learned and further technical analysis

#### Hybrid A\* Performance

`SmacPlannerHybrid` generated kinematically feasible trajectories. Constraining paths to continuous Reeds-Shepp arcs ($R \ge 1.0\text{ m}$) replaced planned in-place zero-radius turns with rolling arcs. The added path length and the reduction in tire scrub were not measured.

However, an operational trade-off exists regarding directionality: while `reverse_penalty = 2.5` strongly prefers forward driving, reversing is _not strictly prohibited_ by the planner. Because the local controller (RPP) is configured with `allow_reversing: False`, any plan containing a reverse gear segment cannot be executed, creating an operational limitation that must be monitored in cluttered dead-ends.

#### RPP Performance & Limitations

The Regulated Pure Pursuit controller reached goals at the configured development baseline of **8.0 km/h ($2.22\text{ m/s}$)** on both maps. Median average straight-line speed was 1.1–1.5 m/s because of speed regulation in turns and near obstacles. Velocity-scaled lookahead ($L \in [0.4, 2.5]\text{ m}$) was selected to reduce the steering corrections seen with short lookahead.

The controlled comparison runs on a fixed reference path ([Navigation §3.2.4.2](./navigation.md#sec-4-5-tuning)) measured the tracking trade-off:
- A fixed 1.20 m lookahead gave 3.48 cm RMS CTE.
- The production velocity-scaled setting reached its 2.50 m cap during cruising and gave 8.62 cm.
- Reducing the lookahead time to 0.60 s gave 3.65 cm.
- Curvature regulation did not activate on that route.

A shorter lookahead time is a candidate setting. The production configuration is unchanged, and a 1.50 m maximum lookahead cap has been suggested but was not tested. Lateral acceleration was not measured.

**Speed limitation:** The **$15.0\text{ km/h}$ ($4.17\text{ m/s}$)** physical-vehicle target was not tested in simulation. At $15\text{ km/h}$, the calculated stopping distance rises to about 3.8–4.5 m (Section 1). The lookahead and curvature settings would need retuning, since a 1.2 s lookahead time would request 5.0 m (calculated). Tire slip, which the simulation does not model in detail, would become more significant. Operating at $15\text{ km/h}$ requires staged testing in Semester 2.

#### Behavior Tree Reliability

The standard Nav2 `NavigateToPose` Behavior Tree ran its clear-costmap → spin → wait → backup sequence in five logged requests; two then reached their goal. The two that failed had goals with no valid path, where recovery cannot help. In narrow corridors (such as the $2.2\text{ m}$ gateway on Route 4), in-place recovery spins may fail if costmap inflation overlaps the footprint, which would cause the robot to abort.

#### Differences Between Simulation and Hardware

Four differences need attention before transferring the navigation setup to FOD Hunter:

1. **Chassis mass:** The simulation model ($52.37\text{ kg}$) is lighter than the assumed FOD Hunter mass ($65.0\text{ kg}$). The higher mass is expected to increase braking distance and lateral tire slip.
2. **Actuators and communication delay:** In Gazebo, the diff-drive plugin applies wheel velocities directly. On FOD Hunter, commands pass through STM32 firmware and a CANopen bus to the ZLAC8015D drivers. This adds communication delay (not yet measured), low-speed cogging and motor deadband.
3. **Contact model:** DART uses rigid Coulomb contact (wheel $\mu_1 = 1.2$, $\mu_2 = 0.2$; ground $\mu = 1.0$ in the model files). It does not model tire deformation, lateral slip angles, weight transfer or surface texture.
4. **Sensor noise and vibration:** In the model, only the IMU has added Gaussian noise; the LiDAR and GNSS are noise-free. The physical robot will be exposed to vacuum-impeller vibration, strong sunlight on tarmac and GNSS multipath near buildings.

#### Hybrid A\* Parameter Changes

Two parameter changes affected global planner performance during Semester 1:

First, reducing the precomputed heuristic lookup table (`lookup_table_size: 10.0 m` with `downsampling_factor: 2`) reduced Smac plugin configuration time on the NUS map from a median of $38.1\text{ s}$ to **$2.4\text{ s}$** (93.7% lower; recorded in 5 and 16 sessions). Memory use was not recorded.

Second, directional penalties (`reverse_penalty = 2.5`, `change_penalty = 0.1`) steer the search toward forward loop turns rather than multi-point reversing. This reduces, but does not remove, the incompatibility with forward-only RPP.

#### RPP Parameter Changes

With short static lookahead (about 0.6 m), the simulated UGV corrected its steering repeatedly. I changed to velocity-scaled lookahead ($L(v) \in [0.4, 2.5]\text{ m}$, $t_{\text{lookahead}} = 1.2\text{ s}$), which reduced the visible steering corrections. The controlled comparison later quantified this trade-off (see RPP Performance above). Cost-regulated speed scaling ($\gamma = 1.0$, $d_{\text{cost}} = 1.0\text{ m}$) slows the robot linearly inside 1.0 m of obstacles; deceleration was not recorded.

#### Behavior Tree Settings

Recovery spin speed is limited to $1.0\text{ rad/s}$ with an acceleration limit of $3.2\text{ rad/s}^2$ (`behavior_server`), to keep re-observation sweeps smooth. Chassis tilt during recovery was not measured.

#### Environment and Computing Challenges

Development resolved two key middleware and computational challenges:

**WSL2 networking:** DDS multicast discovery was unreliable across the virtualized network adapter. CycloneDDS static unicast peering was configured in `cyclonedds.xml` to link the host workstation and companion computer.

**Costmap memory:** Full-scale runway maps were estimated to require over 500 MB of RAM. Refactoring `generate_map.py` to bound active corridors ($300\text{ m} \times 200\text{ m}$ at $0.10\text{ m/px}$) yielded a $6.0 \times 10^6$ cell grid, achieving a 95% reduction in memory footprint.

:::

## 3.4.7 Limitations & Future Work {#sim-future-work}

Hardware transfer requires empirical characterization of the physical FOD Hunter platform, including center-of-mass distribution, effective kinematic track width, CANopen actuator response latency, and sensor noise covariances. Physical deployment will follow a staged progression, beginning with low-speed baseline trials ($8.0\text{ km/h}$) to tune Dual-EKF covariances and RPP lookahead horizons before expanding to high-speed runway sweeps ($15.0\text{ km/h}$) evaluated against quantitative tracking and stopping-distance criteria.

[View Hilbert's Semester 2 Implementation Plan →](./semester-2-plan.md#programming-semester-2)

::: details Detailed simulation-to-hardware transition and validation roadmap

#### Progressive RPP Tuning Toward 15 km/h

In Semester 2, autonomous trajectory tracking will progress through staged speed evaluations on the physical testbed:

8.0 km/h (2.22 m/s, Baseline) → 10.0 km/h (2.78 m/s) → 12.0 km/h (3.33 m/s) → 15.0 km/h (4.17 m/s, Target Sprint)

Each speed tier will require:

- lookahead and curvature settings retuned and re-measured for that speed;
- stopping distance checked against the calculated values (Section 1);
- an active collision-stopping layer (the Nav2 Collision Monitor is configured but not launched in the current simulation);
- IMU pitch monitoring during emergency stops (proposed limit $|\theta| \le 4.0^\circ$).

#### Conditional MPPI Evaluation

I will consider MPPI [\[19\]](./references.md#ref-19) on the NVIDIA Jetson Orin if RPP [\[18\]](./references.md#ref-18) does not meet tracking requirements above $10\text{ km/h}$ and sufficient computing resources are available.

_Technical Clarification on MPPI:_ MPPI does not inherently require GPU acceleration; CPU SIMD multithreading implementations exist in Nav2. However, GPU tensor acceleration allows evaluating thousands of trajectory rollouts per control cycle. If RPP's geometric formulation provides sufficient tracking fidelity at lower computational cost, RPP will be retained as the production controller to preserve CPU cycles for real-time edge vision (YOLO).

#### Physical Hunter Integration

Transferring the simulation setup to FOD Hunter requires four integration steps:

<Figure src="./assets/diagrams/sim2real-transition-roadmap.svg" alt="Sim2Real Transition Strategy and Phased Roadmap" caption="Figure 3.4.5: Simulation-to-hardware transition roadmap. Four stages for moving the Gazebo SIL setup to FOD Hunter: parameter calibration, CANopen drivers, sensor integration and EKF noise tuning." />

1. **URDF Calibration:** Update robot description with measured physical parameters (65 kg assumed mass, 263 mm purchased wheel diameter, and measured wheelbase/track width once the chassis is finalized).
2. **CANopen Actuator Bridge:** Replace Gazebo diff-drive plugin with ROS 2 CANopen driver nodes communicating with dual ZLAC8015D motor controllers via STM32 firmware, implementing deadband compensation and feedforward anti-cogging.
3. **Sensor Driver Integration:** Interface physical Hesai JT16 3D LiDAR, ArduSimple SimpleRTK2B GPS, and BNO085 9-DOF IMU with calibrated empirical covariance matrices ($Q$ and $R$).
4. **Impeller Vibration Filtering:** Deploy 4th-order Butterworth low-pass filters on IMU accelerometer topics to isolate $24,000\text{ RPM}$ vacuum impeller vibration from vehicle state estimation.

#### Physical Navigation Validation

Physical deployment on the NUS EA Field proving ground will follow a phased verification protocol:

- **Phase 1:** Manual teleoperation motor current profiling and deadband calibration on dry concrete pavers.
- **Phase 2:** Open-loop velocity step responses and empirical wheel-slip odometry calibration.
- **Phase 3:** Single-waypoint trajectory tracking and Cross-Track Error verification at $8.0\text{ km/h}$.
- **Phase 4:** Full-mission autonomous runway debris inspection sweeping and C2 target interception.

:::

<!-- #endregion report -->

[View Hilbert’s References →](./references.md)
