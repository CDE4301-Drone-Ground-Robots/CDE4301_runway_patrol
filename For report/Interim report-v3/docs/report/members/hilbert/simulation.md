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

Gazebo Harmonic was used to develop and verify autonomous navigation while the physical vehicle was being built. The simulations tested global path planning, local path tracking, obstacle avoidance, and recovery behaviors with repeatable physics. The results show that the software works on a kinematic proxy; they do not show how the physical chassis will perform.

Testing focused on a baseline cruise speed of **8.0 km/h ($2.22\text{ m/s}$)**, with additional runs at **10.0 km/h ($2.78\text{ m/s}$)**. The target sprint speed of **15.0 km/h ($4.17\text{ m/s}$)** is a Semester 2 goal for the physical vehicle. Tests evaluated real-time factor, tracking error, turning feasibility, and obstacle clearance.

### 3.4.1.1 Analytical Braking Distance & Obstacle Clearance Limits {#sim-braking-safety}

Airfield navigation requires stopping-distance estimates to inform velocity limits and obstacle-clearance planning. Autonomous cruise speed was limited to **8.0 km/h ($2.22\text{ m/s}$)** for the confined NUS EA Field proving ground ($52.2\text{ m} \times 29.1\text{ m}$). The theoretical stopping distance is the distance travelled during the sensor-to-actuator latency ($\Delta t_{\text{lat}}$) plus the braking distance at a constant deceleration ($a_{\text{decel}}$):

$$
d_{\text{stop}} = v \cdot \Delta t_{\text{lat}} + \frac{v^2}{2|a_{\text{decel}}|}
$$

Where $\Delta t_{\text{lat}} \approx 0.07\text{ s}$ is the total pipeline latency (assumed $0.05\text{ s}$ controller cycle at $20\text{ Hz}$ plus $0.02\text{ s}$ additional delay), and $a_{\text{decel}} = -2.5\text{ m/s}^2$ is an assumed deceleration, lower than the configured velocity-smoother limit of $3.0\text{ m/s}^2$:
- **Development Cruise Baseline ($8.0\text{ km/h} \approx 2.22\text{ m/s}$):**
  $$d_{\text{stop}} = (2.22\text{ m/s})(0.07\text{ s}) + \frac{(2.22\text{ m/s})^2}{2(2.5\text{ m/s}^2)} = 0.155\text{ m} + 0.986\text{ m} \approx \mathbf{1.14\text{ m}} \le 1.15\text{ m}$$
- **Sprint Target ($15.0\text{ km/h} \approx 4.17\text{ m/s}$):**
  $$d_{\text{stop, 15km/h}} = (4.17)(0.07) + \frac{4.17^2}{2(2.5)} = 0.292\text{ m} + 3.478\text{ m} \approx \mathbf{3.77\text{ m}}$$
- **Actuator Lag Sensitivity:** With an estimated physical actuator lag of $0.15\text{–}0.25\text{ s}$ (not yet measured on hardware), the stopping distance increases to **$\approx 4.1\text{–}4.5\text{ m}$**. Autonomous tracking at $15.0\text{ km/h}$ was not simulated and is a staged Semester 2 objective.

> [!NOTE]
> **Analytical Stopping Distance:** The calculated stopping distances are theoretical estimates based on the assumed deceleration and response time. They have not been verified through physical testing.
> 
> At 8.0 km/h, the estimated stopping distance is 1.14 m. Although the costmap uses a 1.20 m inflation radius, this does not guarantee sufficient stopping clearance. At the target speed of 15.0 km/h, the estimated stopping distance increases to approximately 3.8–4.5 m. Further testing is required to determine suitable obstacle-clearance distances, controller settings and braking performance for the physical UGV.

::: details Simulation requirements, operating constraints and verification traceability

#### Navigation Testing Objectives

The simulation requirements covered planning, path tracking and recovery:

- **Hybrid A\* Global Path Feasibility:** The planner must produce kinematically feasible Reeds-Shepp paths that respect a minimum turning radius ($R_{\min} \ge 1.0\text{ m}$). Paths must avoid unnecessary in-place turns during transit on high-friction tarmac to reduce tire scrub and actuator stress, while preserving in-place rotation for heading alignment and emergency Behavior Tree recovery.
- **Regulated Pure Pursuit Path Tracking:** The local controller must maintain Cross-Track Error ($\text{CTE} \le 0.15\text{ m}$) along high-speed straightaways at 8 km/h ($2.22\text{ m/s}$), bound centripetal acceleration ($a_c = \frac{v^2}{R} \le 1.8\text{ m/s}^2 < 0.2g$) through curvature regulation, and limit steering chatter ($\dot{\omega}^2 \le 0.50\text{ rad}^2/\text{s}^4$).
- **Behavior Tree Autonomous Recovery:** The navigation supervisor must detect obstacle deadlock or path planning failure within $10\text{ seconds}$, then run an escalating recovery sequence (costmap clearing → bounded spin → linear backup → pause) for up to 6 retries before reporting the mission status to C2.

#### Software and Computing Constraints

Simulation ran on an Ubuntu 24.04 WSL2 workstation with two constraints: static unicast DDS peering was required across Hyper-V NAT adapters (`cyclonedds.xml`), and Gazebo rendering and Nav2 shared the same computer, giving an observed real-time factor of $0.31\text{–}0.33$.

> The full requirements traceability and verification status (Table J.2) are in **[Appendix J: Navigation & Simulation Technical Reference](/report#appendix-j)**.

:::

<span id="sec-2-overview"></span>

## 3.4.2 Simulation Architecture {#sim-architecture}

The simulation connects **Gazebo Harmonic** to **ROS 2 Jazzy** [\[7\]](./references.md#ref-7) through `ros_gz_bridge`. Gazebo publishes simulated odometry, 2D LiDAR scans, IMU data, and GNSS fixes to Nav2 [\[8\]](./references.md#ref-8) and receives smoothed `/cmd_vel` commands. A shared simulation clock (`/clock`) and consistent TF trees keep the nodes synchronized.

**Runtime localization verification:** In WSL2, `ekf_filter_node_odom`, `ekf_filter_node_map`, and `navsat_transform_node` published `/odometry/local`, `/odometry/global`, and `/odometry/gps` and maintained the full `map → odom → base_footprint` transform chain. This confirms that the Dual-EKF pipeline runs, but its absolute position accuracy still needs to be evaluated against moving ground truth. Simulated IMU and odometry published at 50 Hz, GNSS and LiDAR at 10 Hz, and EKF state estimates at 30 Hz in simulation time ($RTF \approx 0.31\text{–}0.33$).

<Figure src="./assets/diagrams/ros2-gazebo-architecture.svg" alt="ROS 2, Gazebo Harmonic and Nav2 simulation architecture" />

::: details ROS–Gazebo bridge topic schemas and development workflow

Before hardware integration, the simulation was used to check skid-steer yaw kinematics, run repeatable parameter tests ($\Delta t = 1.0\text{ ms}$ fixed DART physics step), and confirm ROS 2 message compatibility (`geometry_msgs/msg/Twist`, `sensor_msgs/msg/LaserScan`, `nav_msgs/msg/Odometry`).

> The bridge topic schemas, QoS settings (Table J.3), and development workflow flowchart (Figure J.1) are in **[Appendix J: Navigation & Simulation Technical Reference](/report#appendix-j)**.

:::

## 3.4.3 Design Methodology & Selection {#sim-methodology}

I used the **AgileX Scout 2.0** commercial UGV model as a software-in-the-loop simulation proxy so that navigation development could proceed while the physical FOD Hunter chassis was being fabricated. Because both platforms use four-wheel differential skid steering, the proxy allowed end-to-end testing of ROS 2 communication, global planners, and local controllers. Its dimensions, mass, and drivetrain differ from the physical prototype. In parallel, I constructed a simulation model of the NUS EA Field courtyard to test navigation through narrow corridors and around obstacles.

The viewer below shows the AgileX Scout 2.0 simulation proxy (`scout_v2.glb`) built from the project meshes:

<SimulationWidget1 />

The reasons for choosing the navigation algorithms are in [Navigation](./navigation.md); this page covers the simulation assumptions and the measured effects of tuning. The software distribution comparison is in [Software & Development Environment](/report#software-environment).

::: details Proxy selection, environment iterations, mapping and simulation assumptions

> Software/OS selection is documented in [Programming — Software & Development Environment](/report#software-environment).

#### AgileX Scout 2.0 Model Selection as Kinematic Proxy

Before the chassis was fabricated, the **AgileX Scout 2.0** was used as a kinematic simulation proxy [\[13\]](./references.md#ref-13) to develop the Nav2 stack, sensor interfaces, and Command and Control (C2) links.

<Card>

![AgileX Scout 2.0 4WD Mobile Robot Chassis](./assets/images/agilex-scout-2.0.png)

AgileX Scout 2.0 Kinematic Simulation Proxy

4WD industrial mobile chassis ($52.37\text{ kg}$ modeled, $0.498\text{ m}$ wheelbase, $0.583\text{ m}$ track width). Used in Gazebo Harmonic to test SmacPlannerHybrid paths, Regulated Pure Pursuit tracking and behaviour-tree recovery before the FOD Hunter chassis was assembled.

</Card>

**Wheelbase-to-track aspect ratio:** Skid-steer platforms turn by deliberately slipping their tires sideways [\[13\]](./references.md#ref-13). The ratio of wheelbase $L$ to effective track width $W$ affects maneuverability and tire scrub:

$$
\text{Ratio} = \frac{L}{W} = \frac{0.498\text{ m}}{0.583\text{ m}} \approx \mathbf{0.854} < 1.0
$$

An aspect ratio below one ($L/W < 1.0$) means the drive wheel moment arms are longer than the longitudinal wheelbase, which reduces tire scrub torque and motor current during turns.

#### Proving Ground Iterations & Corridor Bounding

Testing moved from an open airport runway model ($2,702\text{ m} \times 45\text{ m}$) to the smaller NUS EA Field courtyard ($52.2\text{ m} \times 29.1\text{ m}$), which has more geometric features for obstacle avoidance tests. A full runway map would need $1.2 \times 10^8\text{ cells}$, which is too much memory for an embedded computer. Limiting the map to an operational corridor ($300\text{ m} \times 200\text{ m}$ at $0.10\text{ m/px}$) gives a **95.0% memory reduction** ($6.0\text{ MB}$ footprint).

> For a comparison of the Scout 2.0 proxy parameters with the physical prototype assumptions (Table J.4), and of the two proving grounds (Table J.5), see **[Appendix J: Navigation & Simulation Technical Reference](/report#appendix-j)**.

:::

## 3.4.4 Implementation & Prototype {#sim-implementation}

The simulation combines the AgileX Scout 2.0 kinematic model, Gazebo Harmonic worlds, sensor plugins, `ros_gz_bridge`, and the ROS 2 Nav2 stack. This setup enabled closed-loop evaluation of path planning, tracking and recovery in the simulated corridors.

**NUS EA Field Gazebo Demonstration**

Video 3.4.1 shows autonomous multi-waypoint navigation across the simulated **NUS EA Field courtyard**, including narrow paved passages ($2.2\text{ m}\text{–}4.5\text{ m}$), costmap inflation around building perimeters, and collision-free path tracking:

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

The simulation loads `nus_ea_field.sdf` and spawns the Scout model from `scout_v2.xacro` with DART running at $1,000\text{ Hz}$. `bringup_nav2.launch.py` starts the navigation nodes: Dual-EKF state estimation ($50\text{ Hz}$), costmap updates from LiDAR ($10\text{ Hz}$), `SmacPlannerHybrid` ($1\text{ Hz}$), and `RegulatedPurePursuitController` ($20\text{ Hz}$).

> For the full parameter tables for `SmacPlannerHybrid` (Table 3.4.3) and `RegulatedPurePursuitController` (Table 3.4.4), behavior tree recovery sequences, and controller turning mechanics, see **[Appendix J: Navigation & Simulation Technical Reference](/report#appendix-j)**.

:::

## 3.4.5 Testing & Results {#sim-testing}

Navigation was tested in the NUS EA Field and airport runway simulations, with goals sent from RViz, automated mission scripts, and the C2 communications bridge. Table 3.4.5 summarizes runtime data from 93 logged Nav2 development sessions. These sessions checked waypoint execution in a range of scenarios. The controlled tracking tests, which measured Cross-Track Error and angular acceleration chatter, were run separately under standard test conditions ([Navigation §3.2.4.2](./navigation.md#sec-4-5-tuning)).

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

The recording below shows autonomous navigation in the full-scale **Airport Runway environment (`airport_runway.sdf`)**, modeled on Aarhus Airport Runway 10R/28L ($2,702\text{ m} \times 45\text{ m}$ asphalt runway). It includes open corridor sweeps, centerline tracking, and dynamic costmap clearing at the $2.22\text{ m/s}$ baseline:

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

Four scenarios were used for functional controller tuning in Gazebo Harmonic:
- **Route 1 (Runway High-Speed Sprint):** $100.0\text{ m}$ straight corridor to test tracking stability at $2.22\text{–}2.78\text{ m/s}$ ($8\text{–}10\text{ km/h}$).
- **Route 2 (Acute 90° Taxiway Bend):** Traversing a sharp $90^\circ$ corner ($R = 4.0\text{ m}$) bordered by runway edge lighting and berms.
- **Route 3 (High-Density FOD S-Curve Avoidance):** S-curve circumnavigation around two stationary debris targets and service vehicles.
- **Route 4 (NUS EA Courtyard Narrow Doorway):** Navigating through a $2.2\text{ m}$ narrow pedestrian passage between concrete columns on the campus map.

> For the step-by-step test procedures (Procedures E1 to E4), cost-regulated deceleration curves (Figure J.2), and SIL functional verification results (Table J.6), see **[Appendix J: Navigation & Simulation Technical Reference](/report#appendix-j)**.

#### Planner Configuration & Recovery Observations

- **Hybrid A\*:** Replaced 2D grid search with continuous Reeds-Shepp arcs ($R \ge 1.0\text{ m}$). Reducing the heuristic lookup table size (`lookup_table_size: 10.0 m`) decreased configuration time from 38.1 s to 2.4 s (93.7% reduction).
- **RPP Speed Regulation:** Regulated Pure Pursuit scales velocity with path curvature and nearby obstacle cost ($v_{\min} = 0.40\text{ m/s}$, $d_{\text{cost}} = 1.0\text{ m}$).
- **Recovery Behaviors:** In five logged recovery events, Nav2's default recovery sequence (clear costmap, spin, wait, back up) cleared the blockage in two cases, while two others aborted because of unmapped obstacles.

The following still require validation on the physical prototype:
- **Goal and localisation accuracy on the physical robot.** In the controlled simulation runs, the robot stopped a median 0.32–0.34 m from the goal (within the 0.35 m goal tolerance, but above the 0.15 m target).
- **Obstacle clearance**, which was not measured.
- **An active collision-stopping layer.** The Nav2 Collision Monitor node is configured but not launched.
- **Physical braking, tire slip and actuator performance.**

_Additional recordings:_ Milestone videos are stored in the repository archive: <AssetLink href="./assets/videos/231026-sem1-demo-final-compressed-.mp4">Semester 1 Milestone Demo Final (MP4)</AssetLink> • <AssetLink href="./assets/videos/131026-ugv-dual-ekf-test.mov">Dual-EKF RViz Test (MOV)</AssetLink> • <AssetLink href="./assets/videos/131026-ugv-multiwaypoint.mov">Multi-Waypoint Route Test (MOV)</AssetLink> • <AssetLink href="./assets/videos/131026-ugv-object-avoidance.mov">Reactive Obstacle Avoidance Test (MOV)</AssetLink>.

:::

## 3.4.6 Engineering Discussion {#sim-discussion}

Simulation results show multi-waypoint navigation in both tested environments using `SmacPlannerHybrid` and `RegulatedPurePursuitController`. Reducing the heuristic lookup table also reduced planner configuration time. Curvature-constrained Reeds-Shepp paths avoid planned zero-radius turns during nominal transit, potentially reducing tire scrub and drivetrain loads. However, physical testing is required to account for mass differences ($52.37\text{ kg}$ proxy vs $65.0\text{ kg}$ prototype), CANopen motor delays, and tarmac tire friction.

Planner and controller formulations are in [Navigation](./navigation.md), skid-steer dynamics and tire scrub models are in [Steering Kinematics](./steering-kinematics.md), and actuator torque sizing is in [Motor Drivetrain Calculations](./motor-drivetrain-calculation.md).

::: details Evaluation, lessons learned and further technical analysis

#### Hybrid A\* Performance

`SmacPlannerHybrid` generated kinematically feasible trajectories. Constraining paths to continuous Reeds-Shepp arcs ($R \ge 1.0\text{ m}$) replaced planned in-place zero-radius turns with rolling arcs. The added path length and the reduction in tire scrub were not measured.

There is also a conflict over driving direction. `reverse_penalty = 2.5` strongly favors forward driving, but the planner does _not strictly prohibit_ reversing. Because the local controller (RPP) is configured with `allow_reversing: False`, it cannot execute a plan that contains a reverse segment. This limitation needs to be watched in cluttered dead-ends.

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

Two middleware and computing problems were solved during development:

**WSL2 networking:** DDS multicast discovery was unreliable across the virtualized network adapter. CycloneDDS static unicast peering was configured in `cyclonedds.xml` to link the host workstation and companion computer.

**Costmap memory:** Full-scale runway maps were estimated to require over 500 MB of RAM. `generate_map.py` was changed to limit the map to the active corridor ($300\text{ m} \times 200\text{ m}$ at $0.10\text{ m/px}$), giving a $6.0 \times 10^6$ cell grid and a 95% reduction in memory use.

:::

## 3.4.7 Limitations & Future Work {#sim-future-work}

Transferring to hardware requires testing the physical FOD Hunter platform to measure mass distribution, effective track width, CANopen actuator latency, and sensor noise covariances. Testing will follow a staged progression, starting with baseline trials at $8.0\text{ km/h}$ to tune Dual-EKF covariances and RPP lookahead settings before evaluating higher speeds up to $15.0\text{ km/h}$ against tracking and stopping-distance criteria.

[View Hilbert's Semester 2 Implementation Plan →](./semester-2-plan.md#programming-semester-2)

::: details Detailed simulation-to-hardware transition and validation roadmap

#### Progressive RPP Tuning Toward 15 km/h

In Semester 2, path tracking will be tested on the physical testbed at increasing speeds:

8.0 km/h (2.22 m/s, Baseline) → 10.0 km/h (2.78 m/s) → 12.0 km/h (3.33 m/s) → 15.0 km/h (4.17 m/s, Target Sprint)

Each speed tier will require:

- lookahead and curvature settings retuned and re-measured for that speed;
- stopping distance checked against the calculated values (Section 1);
- an active collision-stopping layer (the Nav2 Collision Monitor is configured but not launched in the current simulation);
- IMU pitch monitoring during emergency stops (proposed limit $|\theta| \le 4.0^\circ$).

#### Conditional MPPI Evaluation

I will consider MPPI [\[19\]](./references.md#ref-19) on the NVIDIA Jetson Orin if RPP [\[18\]](./references.md#ref-18) does not meet tracking requirements above $10\text{ km/h}$ and sufficient computing resources are available.

_Technical Clarification on MPPI:_ MPPI does not strictly require GPU acceleration, as CPU multithreaded implementations exist in Nav2. However, GPU acceleration allows evaluating thousands of trajectory rollouts per control cycle. If RPP provides sufficient tracking accuracy at lower computational cost, RPP will be retained as the production controller to preserve CPU cycles for real-time edge vision (YOLO).

#### Physical Hunter Integration

Transferring the simulation setup to FOD Hunter requires four integration steps:

<Figure src="./assets/diagrams/sim2real-transition-roadmap.svg" alt="Sim2Real Transition Strategy and Phased Roadmap" caption="Figure 3.4.5: Simulation-to-hardware transition roadmap. Four stages for moving the Gazebo SIL setup to FOD Hunter: parameter calibration, CANopen drivers, sensor integration and EKF noise tuning." />

1. **URDF Calibration:** Update robot description with measured physical parameters (65 kg assumed mass, 263 mm purchased wheel diameter, and measured wheelbase/track width once the chassis is finalized).
2. **CANopen Actuator Bridge:** Replace Gazebo diff-drive plugin with ROS 2 CANopen driver nodes communicating with dual ZLAC8015D motor controllers via STM32 firmware, implementing deadband compensation and feedforward anti-cogging.
3. **Sensor Driver Integration:** Interface physical Hesai JT16 3D LiDAR, ArduSimple SimpleRTK2B GPS, and BNO085 9-DOF IMU with calibrated empirical covariance matrices ($Q$ and $R$).
4. **Impeller Vibration Filtering:** Apply 4th-order Butterworth low-pass filters to the IMU accelerometer topics to keep $24,000\text{ RPM}$ vacuum impeller vibration out of state estimation.

#### Physical Navigation Validation

Physical testing at the NUS EA Field proving ground will follow four phases:

- **Phase 1:** Manual teleoperation motor current profiling and deadband calibration on dry concrete pavers.
- **Phase 2:** Open-loop velocity step responses and empirical wheel-slip odometry calibration.
- **Phase 3:** Single-waypoint trajectory tracking and Cross-Track Error verification at $8.0\text{ km/h}$.
- **Phase 4:** Full autonomous mission: runway debris inspection sweeps and C2 target interception.

:::

<!-- #endregion report -->

[View Hilbert’s References →](./references.md)
