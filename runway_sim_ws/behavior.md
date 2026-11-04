# Autonomous UGV Navigation Behaviors & Skid-Steer Zero-Radius Turning Dynamics
### ROS 2 Jazzy Jalisco · Nav2 Stack · Gazebo Sim (Harmonic) · AgileX Scout 2.0 4WD Skid-Steer Platform

---

## 1. End-to-End System Architecture: From UAV Coordinate Ingestion to Simulation Execution

The autonomous runway inspection system integrates an inter-agent Command and Control (C2) pipeline connecting aerial reconnaissance (UAV / RPi 5) directly to ground inspection and debris collection (UGV / AgileX Scout 2.0).

```text
  ┌───────────────────────────────────────────────────────────────┐
  │                   AERIAL RECONNAISSANCE LAYER                 │
  │     UAV / Raspberry Pi 5 Tactical Radar HUD / DemoComs_C2      │
  │  - Detects FOD Debris / Target via Downward Vision / GPS Fix   │
  │  - Packages Structured C2 Target Alert JSON                   │
  └───────────────────────────────┬───────────────────────────────┘
                                  │ /c2/target_alert (CycloneDDS)
                                  ▼
  ┌───────────────────────────────────────────────────────────────┐
  │                   MISSION COMMAND & CONTROL                   │
  │            UGV C2 Bridge Node (ugv_c2_bridge_node.py)          │
  │  - Validates Alert & Verifies Coordinate Integrity            │
  │  - Multi-Target Task Ledger FIFO Queue Management             │
  │  - State Machine: IDLE ──> ACKNOWLEDGED ──> EN_ROUTE          │
  │  - Publishes Live 2 Hz Telemetry on /c2/ugv_telemetry         │
  └───────────────────────────────┬───────────────────────────────┘
                                  │ Action Goal: /navigate_to_pose
                                  ▼
  ┌───────────────────────────────────────────────────────────────┐
  │                 AUTONOMOUS NAVIGATION STACK (Nav2)            │
  │                  BT Navigator (bt_navigator)                  │
  │  - Executes NavigateToPose Behavior Tree (10 Hz Tick Rate)    │
  │  - SmacPlannerHybrid: Global Reeds-Shepp Paths (R >= 1.0m)    │
  │  - RegulatedPurePursuit: Dynamic L(v), Curvature Speed Scaling│
  │  - Behavior Server: Autonomous Recovery (Spin, BackUp, Wait)  │
  └───────────────────────────────┬───────────────────────────────┘
                                  │ Commanded /cmd_vel_smoothed
                                  ▼
  ┌───────────────────────────────────────────────────────────────┐
  │               SAFETY & SPEED REGULATION LAYER                 │
  │                 Collision Monitor (collision_monitor)         │
  │  - FootprintApproach Polygon Projection (TTC <= 1.0s)         │
  │  - Smooth Proximity Deceleration & Emergency Stop Intercept   │
  └───────────────────────────────┬───────────────────────────────┘
                                  │ Filtered /cmd_vel
                                  ▼
  ┌───────────────────────────────────────────────────────────────┐
  │              SIMULATION & LOCALIZATION PIPELINE               │
  │               Gazebo Harmonic + ros_gz_bridge                 │
  │  - 4WD Skid-Steer Wheel Actuation & Ground Physics            │
  │  - Sensors: 2D LiDAR (/scan), IMU (/imu/data), RTK (/gps/fix) │
  │  - Dual-EKF (robot_localization): Drift-Free map -> odom TF   │
  └───────────────────────────────────────────────────────────────┘
```

---

## 2. Complete Nav2 Behavior Tree (BT) Specification

When the UGV C2 Bridge issues a navigation goal (`NavigateToPose`), the **Nav2 BT Navigator** executes a hierarchical Behavior Tree. This tree continuously coordinates path planning, path tracking, collision monitoring, and recovery behaviors.

### Graphical Representation of the Navigation Behavior Tree

```text
                                  [ NavigateRecovery ]
                                    (RecoveryNode)
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │ (Primary Navigation Pipeline)               │ (Escalating Recovery System)
                    ▼                                             ▼
          [ NavigateToPosePipeline ]                       [ RecoveryFallback ]
             (PipelineSequence)                               (RoundRobin)
                    │                                             │
      ┌─────────────┴─────────────┐           ┌───────────┬───────┴───────┬───────────┐
      │                           │           │           │               │           │
      ▼                           ▼           ▼           ▼               ▼           ▼
[ ComputePathBranch ]     [ FollowPathBranch ] [ClearLocal] [ SpinRecovery ] [ BackUp ] [ Wait ]
   (RateController 1Hz)     (RecoveryNode)     (Service)   (In-Place Spin)  (Service)  (Service)
      │                           │                          (R = 0 Turn)
      ▼                           ▼                          (1.0 rad/s)
[ ComputePathRecovery ]     [ FollowPathAction ]
   (RecoveryNode)           (RegulatedPurePursuit)
      │                           │
 ┌────┴─────┐               ┌─────┴────────────────┐
 │          │               │                      │
 ▼          ▼               ▼                      ▼
[ComputePath] [ClearGlobal] [Initial Heading Pivot] [Continuous Arc Driving]
(SmacPlanner) (Service)     (Zero-Radius Turn #1)   (R >= 1.0m, v <= 2.22m/s)
(R >= 1.0m)                 (|Δθ| > 45°)
```

### Detailed Component Descriptions of the Behavior Tree

#### 1. Root: `NavigateRecovery` (`nav2_behavior_tree::RecoveryNode`)
* **Role:** The top-level supervisor. It executes the primary navigation pipeline child (left branch). If the primary pipeline encounters an unresolvable failure (such as an insurmountable roadblock or severe localization loss), control cascades to the recovery branch (right branch).
* **Retry Counter:** Configured to attempt up to **`6` recovery iterations** before reporting mission failure back to the C2 Task Ledger.

#### 2. Left Branch: `NavigateToPosePipeline` (`nav2_behavior_tree::PipelineSequence`)
Executes two sub-branches concurrently in a synchronized pipeline:
* **Sub-Branch A: Global Replanning (`ComputePathBranch`):**
  * **Rate Controller (1.0 Hz):** Ticks global replanning once every second to adapt to newly discovered dynamic obstacles or personnel moving across the runway.
  * **ComputePathToPose (`SmacPlannerHybrid`):** Computes a 3D kinodynamic Reeds-Shepp trajectory respecting the rover's minimum turning radius ($R \ge 1.0\text{ m}$).
  * **Costmap Recovery:** If path planning fails, calls `ClearEntireCostmap` on the global costmap to eliminate spurious noise before re-attempting.
* **Sub-Branch B: Local Path Following (`FollowPathBranch`):**
  * **FollowPath (`RegulatedPurePursuitController`):** Computes instantaneous wheel velocities at $20\text{ Hz}$. Dynamically scales lookahead distance $L(v) \in [0.4\text{ m}, 2.5\text{ m}]$, regulates linear speed on curves ($R < 0.8\text{ m}$), and decelerates near obstacles.
  * **Local Clearance Recovery:** If path following fails or progress stalls, triggers a targeted costmap clearance around the vehicle hull.

#### 3. Right Branch: `RecoveryFallback` (`nav2_behavior_tree::RoundRobin`)
When primary navigation fails, Nav2 executes escalating recovery behaviors in round-robin order:
1. **Clear Local & Global Costmaps:** Flushes temporary sensor buffers to verify if an apparent blockage was caused by sensor noise.
2. **`Spin` (Zero-Radius In-Place Rotation):** Rotates the robot $360^\circ$ at $1.0\text{ rad/s}$ ($R = 0$). This sweeps the 2D LiDAR around the full perimeter, clears shadow zones, and locates open terrain.
3. **`BackUp`:** Commands the rover to reverse smoothly $0.50\text{ m}$ along its heading to extract itself from tight geometric dead-ends.
4. **`Wait`:** Halts the vehicle completely for $5.0\text{ seconds}$ to permit transient ground crew, patrol vehicles, or landing aircraft to clear the operational corridor.

---

## 3. Kinematic Principles of Skid-Steer Turning

The **AgileX Scout 2.0** uses differential velocity control across its 4 independent hub motors to steer.

```text
       ┌──────────┐                     ┌──────────┐
       │ Left Front│ (v_L)               │Right Front│ (v_R)
       └────┬─────┘                     └────┬─────┘
            │                                │
            │◄────────── Track Width (w) ───►│
            │           [ w = 0.582 m ]      │
            │                                │
       ┌────┴─────┐                     ┌────┴─────┐
       │ Left Rear│ (v_L)               │Right Rear│ (v_R)
       └──────────┘                     └──────────┘
```

### Pure In-Place Rotation (Zero-Radius Turn: $R = 0$)
In a zero-radius turn, the vehicle's forward linear velocity is zero ($v = 0.0\text{ m/s}$), and the left and right wheels rotate at equal speeds in opposite directions:

$$v_R = -v_L = \omega \cdot \frac{w}{2}$$

where:
* $\omega$ is the commanded angular yaw rate ($\text{rad/s}$).
* $w = 0.582\text{ m}$ is the vehicle track width.
* The Instantaneous Center of Rotation (ICR) collapses directly onto the geometric centroid of the robot chassis.

### Strategic Operational Balance
Skid-steer zero-radius turning provides unmatched spatial agility in confined spaces, allowing the rover to re-orient instantaneously without needing a wide turning radius. The navigation stack is tuned to leverage this superpower strategically:
1. **Zero-Radius Turning ($R = 0$)** is utilized for **static re-orientation**, **payload alignment**, and **obstacle escape maneuvers**.
2. **Continuous Curvature Driving ($R \ge 1.0\text{ m}$)** is utilized during **high-speed runway cruising ($8 - 10\text{ km/h}$)** to eliminate excessive tire wear, prevent dynamic tip-over, and preserve dead-reckoning odometry accuracy.

---

## 4. The 3 Distinct Conditions Triggering Zero-Radius Turns

### Condition 1: Initial Path Alignment (`use_rotate_to_heading`)

* **Subsystem:** Local Controller (`nav2_regulated_pure_pursuit_controller::RegulatedPurePursuitController`)
* **Parameter Location:** [`nav2_params.yaml`](file:///home/oliver/runway_sim_ws/src/runway_navigation/config/nav2_params.yaml#L89-L91)
* **Configuration:**
  ```yaml
  FollowPath:
    use_rotate_to_heading: True
    rotate_to_heading_min_angle: 0.785   # 45.0 degrees (pi / 4)
    rotate_to_heading_angular_vel: 1.2   # 1.2 rad/s (~68.8 deg/s)
    max_angular_accel: 2.5               # rad/s^2
  ```

#### When It Triggers:
When a new navigation goal is dispatched from the UAV or operator, the global planner creates a reference path starting at the robot's current coordinates. If the robot is facing away from the initial segment of the path by more than **$45^\circ$ ($0.785\text{ rad}$)**, this behavior is triggered.

#### Physical Behavior:
1. The controller forces linear forward velocity to zero: $v_{\text{cmd}} = 0.0\text{ m/s}$.
2. The controller commands pure angular velocity: $\omega_{\text{cmd}} = \text{sign}(\Delta \theta) \times 1.2\text{ rad/s}$.
3. Left and right wheel pairs rotate in opposite directions ($v_R = -v_L \approx \pm 0.35\text{ m/s}$).
4. Once the heading error drops below $45^\circ$ ($|\Delta \theta| \le 0.785\text{ rad}$), the controller smoothly transitions from pure spinning into forward linear drive.

#### Operational Benefit:
Prevents the robot from driving forward in a wide, clumsy circle or overshooting runway borders when commanded to travel in a direction behind its current heading.

---

### Condition 2: Final Destination Heading Alignment (`general_goal_checker`)

* **Subsystem:** Goal Checker (`nav2_controller::SimpleGoalChecker`)
* **Parameter Location:** [`nav2_params.yaml`](file:///home/oliver/runway_sim_ws/src/runway_navigation/config/nav2_params.yaml#L62-L66)
* **Configuration:**
  ```yaml
  general_goal_checker:
    stateful: True
    plugin: "nav2_controller::SimpleGoalChecker"
    xy_goal_tolerance: 0.35    # 35 cm spatial arrival radius
    yaw_goal_tolerance: 0.35   # 20 degrees (0.35 rad) orientation tolerance
  ```

#### When It Triggers:
When the robot physically arrives at the destination coordinates ($\|\mathbf{x}_{\text{ugv}} - \mathbf{x}_{\text{goal}}\|_2 \le 0.35\text{ m}$), but its final orientation differs from the target goal pose orientation by more than **$20^\circ$ ($0.35\text{ rad}$)**.

#### Physical Behavior:
1. Forward motion stops ($v = 0.0\text{ m/s}$).
2. The robot pivots on its center of rotation until its heading matches the requested arrival orientation.
3. Once within $20^\circ$ of target yaw, Nav2 marks the action goal as `SUCCEEDED`.

#### Operational Benefit:
Essential for payload operations:
* **FOD Inspection Camera:** Directs the forward-facing camera directly at debris identified by the UAV.
* **Autonomous Charging Dock:** Aligns the rear or front bumper contact pins with docking bay guides.
* **Perimeter Security / Gate Entry:** Orients the vehicle facing down the next taxiway segment.

---

### Condition 3: Recovery & Sensor Clearance (`nav2_behaviors::Spin`)

* **Subsystem:** Behavior Server (`nav2_behaviors::Spin`)
* **Parameter Location:** [`nav2_params.yaml`](file:///home/oliver/runway_sim_ws/src/runway_navigation/config/nav2_params.yaml#L224-L240)
* **Configuration:**
  ```yaml
  behavior_server:
    behavior_plugins: ["spin", "backup", "drive_on_heading", "wait"]
    spin:
      plugin: "nav2_behaviors::Spin"
    max_rotational_vel: 1.0     # 1.0 rad/s
    min_rotational_vel: 0.4     # 0.4 rad/s
    rotational_acc_lim: 3.2     # rad/s^2
    simulate_ahead_time: 2.0
  ```

#### When It Triggers:
When the robot gets stuck in dynamic traffic, trapped in a dead-end corridor, or when the local controller fails to make progress within `movement_time_allowance: 10.0 s`.

#### Physical Behavior:
1. The navigation state machine halts standard trajectory following and activates the recovery tree.
2. The robot executes an autonomous in-place rotation (typically $180^\circ$ or $360^\circ$).
3. As the robot rotates, the 2D LiDAR sweeps the surrounding $360^\circ$ perimeter, actively raytracing and clearing any stale obstacle costmap cells that may have caused false traps.
4. After spinning, Nav2 re-evaluates the global costmap and computes an alternate escape trajectory.

#### Operational Benefit:
Self-recovery in complex, unstructured outdoor environments without human operator intervention.

## 6. Rear Vacuum Intake Head FOD Remediation & Clearance Dynamics

### 6.1 Physical Mechanism Geometry & Mounting Dimensions

The physical runway inspection rover is equipped with an active vacuum remediation intake head mounted at the **rear** of the AgileX Scout 2.0 chassis:

```text
                  ▲ +X Forward Driving Direction
                  │
        ┌─────────┴─────────┐
        │  Front Bumper     │
        │ ┌───┐       ┌───┐ │
 (v_L)  │ │W1 │       │W2 │ │  (v_R)
        │ └───┘       └───┘ │
        │     Chassis       │
        │  [width = 0.582m] │
        │     (0, 0)        │ ◄── base_link Origin (Geometric Center)
        │                   │
        │ ┌───┐       ┌───┐ │
 (v_L)  │ │W3 │       │W4 │ │  (v_R)
        │ └───┘       └───┘ │
        │  Rear Bumper      │ ◄── x = -0.4625 m (Chassis Half-Length)
        └─────────┬─────────┘
                  │  20 cm (0.20 m) Clearance Gap
        ┌─────────┴─────────┐
        │ ═════════════════ │ ◄── Vacuum Intake Head Center (x = -0.6625 m)
        │ VACUUM INTAKE HEAD│     Intake Width ≈ 0.58 m (Covers Wheel Track)
        └───────────────────┘
```

#### Key Dimensions & Specifications:
* **Chassis Length:** $0.925\text{ m}$ (Center to rear bumper $L_{\text{rear}} = -0.4625\text{ m}$).
* **Intake Head Standoff:** Extends **$20\text{ cm}$ ($0.20\text{ m}$)** behind the chassis rear bumper.
* **Intake Head Center Offset:** $x_{\text{intake}} = -(0.4625 + 0.20) = \mathbf{-0.6625\text{ m}}$ from `base_link` origin.
* **Intake Head Width:** $\approx \mathbf{0.58\text{ m}}$, matching the rover track width ($w = 0.582\text{ m}$).

---

### 6.2 Centerline Alignment & Safe Ingestion Dynamics

To clear the FOD without tire collision or pushing the debris aside:
1. **Centerline Approach ($y' = 0$):**  
   The approach vector $\theta = \text{atan2}(y_{\text{fod}} - y_r, x_{\text{fod}} - x_r)$ aligns the vehicle centerline with the FOD. Because the intake head spans the full vehicle width ($\approx 0.58\text{ m}$), the FOD passes directly between the left and right front wheels under the chassis into the rear suction throat.
2. **Smooth Approach Deceleration:**  
   Regulated Pure Pursuit activates approach scaling within $1.5\text{ m}$ of the target:
   ```yaml
   FollowPath:
     approach_velocity_scaling_dist: 1.5   # Begins decelerating 1.5m before FOD
     min_approach_linear_velocity: 0.20    # Crawls at 0.20 m/s over debris
   ```
   The UGV ramps down from cruise speed ($2.22\text{ m/s}$ / $8.0\text{ km/h}$) to a steady ingestion crawl speed ($0.20\text{ m/s}$ / $0.72\text{ km/h}$).

---

### 6.3 Intake Overshoot Offset Calculation

Because the vacuum intake head is mounted **$0.66\text{ m}$ behind the robot center**, stopping when the robot center reaches $(x_{\text{fod}}, y_{\text{fod}})$ leaves the intake head $66\text{ cm}$ short of the debris!

To place the intake head directly **over** the FOD, the UGV C2 Bridge calculates an adjusted navigation goal that drives the vehicle forward past the debris:

$$\mathbf{x}_{\text{nav\_goal}} = \mathbf{x}_{\text{fod}} + d_{\text{vacuum\_offset}} \cdot \begin{bmatrix} \cos \theta \\ \sin \theta \end{bmatrix}$$

$$d_{\text{vacuum\_offset}} = L_{\text{rear}} + d_{\text{standoff}} = 0.4625 + 0.20 = \mathbf{+0.6625\text{ m}}$$

When Nav2 signals arrival at $\mathbf{x}_{\text{nav\_goal}}$, the rear intake head sits directly above the FOD.

---

### 6.4 Decision Logic: Isolated FOD Dwell vs Clustered Continuous Sweeping

The system dynamically adapts its remediation sequence based on debris density in the active task ledger:

```text
               [ Rear Intake Head Positioned Over FOD ]
                                  │
                                  ▼
           ┌──────────────────────────────────────────────┐
           │ Check Proximity to Next Queued FOD in Ledger │
           │ Is d_next <= 2.5 meters?                     │
           └──────────────────────┬───────────────────────┘
                                  │
                  ┌───────────────┴───────────────┐
             YES  │                               │  NO (Isolated FOD or Queue Empty)
                  ▼                               ▼
       ┌────────────────────────┐       ┌────────────────────────┐
       │ CLUSTERED FOD MODE     │       │ ISOLATED FOD MODE      │
       │ DO NOT STOP!           │       │ HALT COMPLETELY        │
       │ Maintain continuous    │       │ Dwell for 5 - 10 s     │
       │ slow sweep (0.20 m/s)  │       │ (Nominal: 7.0 seconds) │
       │ directly into next FOD │       │ for high-power suction │
       └──────────┬─────────────┘       └───────────┬────────────┘
                  │                                 │
                  ▼                                 ▼
       [ Pop Next Queued FOD ]           [ Mark Task COLLECTED ]
       [ Continue Sweeping ]             [ Accelerate to Cruise ]
```

#### Case A: Isolated FOD ($d_{\text{next}} > 2.5\text{ m}$ or Single Target)
* **Behavior:** The rover comes to a complete halt ($v = 0.0\text{ m/s}, \omega = 0.0\text{ rad/s}$) over the FOD.
* **Dwell Duration:** Pauses for **$5 - 10\text{ seconds}$** (Nominal: **`7.0 seconds`**) while high-power suction draws debris into the collection hopper.
* **State Transition:** `EN_ROUTE` $\to$ `VACUUMING` (dwell $7.0\text{ s}$) $\to$ `COLLECTED`.
* **Subsequent Action:** Once dwell expires, the rover accelerates back to nominal cruise speed ($2.22\text{ m/s}$) towards the next waypoint.

#### Case B: Clustered FOD ($d_{\text{next}} \le 2.5\text{ m}$)
* **Behavior:** The rover **does not stop**.
* **Rationale:** Stopping and starting every $50\text{ cm}$ in a debris field causes extreme skid-steer tire wear, high motor thermal load, and delays runway clearance.
* **Action:** The system transitions into **`CONTINUOUS_SWEEP` mode**:
  * Bypasses the 5–10s static dwell.
  * Maintains a continuous low-speed crawl ($v_{\text{sweep}} \approx 0.20\text{ m/s}$).
  * Sweeps the vacuum head continuously over the current FOD and immediately begins the approach toward the next adjacent debris piece.

---

## 7. Live Simulation Verification Guide

To observe the complete Behavior Tree and each zero-radius turning condition in the active simulation:

### 1. Test UAV-to-UGV Autonomous Dispatch & Execution:
1. Terminal 1 — Launch simulation & navigation:
   ```bash
   ros2 launch runway_navigation sim_and_nav.launch.py world_name:=airport_runway
   ```
2. Terminal 2 — Dispatch multi-target alert stream:
   ```bash
   python3 src/runway_communication/runway_communication/DemoComs_C2.py
   ```
3. **Observation:**
   * UGV C2 bridge ingests target alerts, acknowledges task, and dispatches to `/navigate_to_pose`.
   * BT Navigator evaluates initial heading: pivots in place ($R = 0$) if $|\Delta \theta| > 45^\circ$.
   * UGV accelerates down the runway centerline at $2.22\text{ m/s}$ ($8.0\text{ km/h}$).
   * Upon reaching target ($d < 0.35\text{ m}$), executes final zero-radius yaw alignment to face the FOD debris.
   * State transitions to `VERIFIED` $\to$ `COLLECTED`, and immediately begins next target in the queue.

### 2. Test Condition 1 (Initial Heading Pivot):
* Set a **Nav2 Goal** directly behind the robot ($X = -10.0\text{ m}$).
* **Observation:** The robot halts forward drive, rotates in place $180^\circ$ at $1.2\text{ rad/s}$, and then drives forward smoothly.

### 3. Test Condition 2 (Arrival Yaw Alignment):
* Click and drag the RViz **2D Goal Pose** arrow pointing perpendicular to the road.
* **Observation:** The robot drives straight down the road, halts at the $(x, y)$ coordinate, and cleanly pivots on its center to match the arrow heading.

### 4. Test Condition 3 (Recovery Spin):
* Spawn a barrier box directly in front of the UGV:
  ```bash
  ros2 run ros_gz_sim create -world airport_runway -name wall_box \
    -string '<sdf version="1.8"><model name="w"><static>true</static><link name="l"><collision name="c"><geometry><box><size>1 3 1</size></box></geometry></collision></link></model></sdf>' \
    -x 2.0 -y 0.0 -z 0.5
  ```
* Send a goal behind the wall.
* **Observation:** Progress checker detects stagnation after 10s, triggering the recovery tree: the UGV executes a $360^\circ$ in-place spin to sweep sensors before re-planning.
