---
title: "Semester 2 Implementation Plan"
owner: "Hilbert Soh Yong Tai"
role: "Autonomous navigation, SLAM & C2 communications"
description: "Hilbert's Semester 2 (Phase 2) deliverables."
---

# Semester 2 plan — Hilbert Soh Yong Tai

<!-- Edit your plan between the region markers; the Overview and the Meet the Team page show this text. -->
<!-- #region plan -->

- Navigation implementation on actual UGV via STM32 F446RE
- Communications with UAV using RF module

<!-- #endregion plan -->

<!-- Programming Semester 2 task breakdown; included by the Report composition system. -->
<!-- #region programming-tasks -->

## Semester 2 Tasks & Physical Implementation Scope {#programming-semester-2}

<Badge type="info" text="Hilbert's Autonomy Scope • Physical UGV" />

Semester 1 established a ROS 2/Gazebo software-in-the-loop testbed and a UAV-side-to-workstation communications workflow. Semester 2 focuses on transferring those interfaces to the **physical FOD Hunter**, then validating navigation, steering and mission coordination under controlled outdoor conditions. The AgileX Scout 2.0 remains the Semester 1 simulation proxy, not the physical prototype.

**Planned work packages:** embedded motor control and odometry; physical Nav2 tuning; UAV–UGV RF communication; GNSS/IMU/LiDAR fusion; and integrated field testing. The values and equipment below are **design targets or proposed configurations**, not verified physical performance.

[Navigation methodology](./navigation.md) · [Communications implementation](./communications.md) · [Simulation evidence](./simulation.md) · [Steering kinematics](./steering-kinematics.md) · [Motor sizing](./motor-drivetrain-calculation.md)

<ProgrammingWidget5 />

::: details 01 — Firmware & Actuation
<Badge type="info" text="Task 1 • Firmware &amp; Actuation" />

**STM32 F446RE Microcontroller Actuation Bridge & CAN Bus Motor Control**

<Badge type="info" text="Laptop Proxy → STM32 F446RE" />

Transition from laptop-based software command streaming to a dedicated real-time embedded microcontroller running micro-ROS under FreeRTOS, establishing deterministic motor control:

- **micro-ROS Client Node:** Flash and tune micro-ROS client over high-speed USB-CDC serial (`/dev/ttyACM0`) to subscribe to `/cmd_vel` geometry messages at 100 Hz.
- **Isolated CAN 2.0B / RS-485 Drivetrain Bus:** Implement CAN framing at 500 kbps to command the dual ZLAC8015D dual-channel hub motor drivers with precise velocity and current setpoints.
- **High-Resolution Encoder Odometry:** Ingest incremental optical encoder pulses from all 4 hub motors, execute forward differential kinematics with calibrated track width, and publish `/odom` with full covariance matrices.
- **Hardware E-Stop & Heartbeat Watchdog:** Implement hardware emergency stop line monitoring and an automatic zero-velocity cut-off if serial heartbeats cease for &gt; 150 ms.
  :::

::: details 02 — Navigation & Kinematics
<Badge type="info" text="Task 2 • Navigation &amp; Kinematics" />

**Nav2 SmacPlannerHybrid Upgrade ($SE(2)$ Dubins State Lattice)** ([\[19\]](./references.md#ref-19), [\[20\]](./references.md#ref-20))

<Badge type="info" text="SmacPlanner2D → SmacPlannerHybrid" />

Upgrade the global path planner from Phase 1 2D smoothed A\* to full non-holonomic $SE(2)$ Dubins state lattice to eliminate asphalt tire scrubbing at high speeds:

- **Kinematic Minimum Turning Radius:** Hardcode $R_{\min} \ge 1.50\text{ m}$ directly into the Dubins motion primitive expansion, discouraging in-place pivot turns during nominal path planning and bounding yaw scrub resistance ($M_{z,\text{scrub}} \le 18.2\text{ N}\cdot\text{m}$).
- **72 Angular Search Discretizations:** Configure 72 discrete orientation angular bins ($5^\circ$ heading resolution) for full 3D state lattice exploration $(x, y, \theta)$ on 0.05 m/px costmaps.
- **Motion Cost Penalties:** Calibrate reverse penalty ($k_{\text{rev}} = 2.0$) and change-of-direction penalty ($k_{\text{dir}} = 3.0$) to enforce continuous forward sweeping trajectories at $\ge 10.0\text{ km/h}$.
- **Analytical Shot-to-Goal Expansions:** Enable Reed-Shepp / Dubins analytical heuristic shots to accelerate global path generation across 500 m runway corridors to &lt; 25 ms compute time.
  :::

::: details 03 — RF Telemetry & Datalink
<Badge type="info" text="Task 3 • Telemetry &amp; Datalink" />

**Airfield-Compliant Long-Range RF Datalink Integration (Microhard P900 V2)**

<Badge type="info" text="Local Wi-Fi → 915 MHz FHSS RF" />

Replace interim 5 GHz Wi-Fi peering with an industrial frequency-hopping transceiver (Microhard P900 V2 [\[24\]](./references.md#ref-24)) adhering to civil aviation ([\[4\]](./references.md#ref-4)) and local statutory radio requirements ([\[3\]](./references.md#ref-3), [\[11\]](./references.md#ref-11)):

- **Singapore IMDA TS SRD Regulatory Compliance:** Restrict frequency hopping channels to 917–925 MHz with $\le 100\text{ mW}$ ERP output power, subject to equipment approval, applicable spectrum rules and site authorization.
- **Serial Packet Bridge Daemon:** Develop a high-speed UART-to-ROS-2 bridge daemon using Consistent Overhead Byte Stuffing (COBS) packet framing for reliable serial JSON telemetry.
- **Cryptographic Packet Signing:** Preserve SHA-256 HMAC message integrity checking on all incoming UAV detection alerts to authenticate packets when a properly managed shared key is used.
- **Heartbeat Fail-Safe Failsafe:** Implement a 2.0 Hz ping/pong telemetry watchdog; upon RF signal loss exceeding 1.5 s, command autonomous rover pause, apply mechanical braking, and sound audio-visual warning beacons.
  :::

::: details 04 — Sensor Fusion & State Estimation
<Badge type="info" text="Task 4 • Sensor Fusion &amp; State Estimation" />

**Centimeter-Level RTK-GNSS & 3D LiDAR Sensor Fusion (Dual-EKF)**

<Badge type="info" text="Simulation Ground-Truth → Dual-EKF Physical Fusion" />

Deploy physical localization hardware to achieve drift-free centimeter-level positioning and active 3D volumetric obstacle perception across open runway corridors:

- **Unicorecomm UM980 RTK-GNSS Integration:** Ingest NMEA GGA messages and stream RTCM3 differential corrections via NTRIP client, targeting centimeter-level positioning under suitable correction and reception conditions.
- **Cascaded Dual-EKF (robot_localization):** Configure continuous 100 Hz local EKF (wheel odometry + IMU angular rate) for smooth `odom` → `base_link` transforms, cascaded into global EKF fusing RTK-GNSS UTM coordinates for absolute `map` → `odom` pose ([\[9\]](./references.md#ref-9), [\[26\]](./references.md#ref-26)).
- **3D LiDAR Pointclouds:** Stream pointclouds with ground-plane filtering, feeding `nav2_costmap_2d` voxel layers.
- **nav2_collision_monitor Polygons:** Define layered stop ($0.40\text{ m}$), slowdown ($1.20\text{ m}$), and approach ($2.50\text{ m}$) dynamic safety polygons directly projected from 3D LiDAR data.
  :::

::: details 05 — Physical Integration & Validation
<Badge type="info" text="Task 5 • Field Integration &amp; Validation" />

**Physical Chassis Kinematic Calibration & Real-World Airfield Field Trials**

<Badge type="info" text="Digital Twin SIL → Outdoor Runway Validation" />

Commission the full software stack onto the custom 65.0 kg 4WD skid-steer rover chassis and conduct rigorous outdoor tarmac field verification:

- **Effective Track Width Calibration:** Empirically identify the asphalt slip correction coefficient $\chi = c_{\text{eff}} / c_{\text{nominal}}$ by comparing encoder-derived yaw integration against RTK-GNSS heading truth ([\[14\]](./references.md#ref-14)).
- **Regulated Pure Pursuit High-Speed Tuning:** Calibrate lookahead distance ($L = 1.80\text{ m}$), velocity-scaled lookahead time ($t = 0.6\text{ s}$), and curvature braking heuristics for stable $\ge 10.0\text{ km/h}$ sprints ([\[22\]](./references.md#ref-22)).
- **FOD Target Docking Verification:** Validate final approach precision to ensure the rover docks directly over detected FOD fasteners within $\pm 5.0\text{ cm}$ cross-track error for mechanical remediation.
- **Live Multi-Agent "Detect-to-Clear" Trials:** Conduct integrated field demonstrations with the aerial UAV scout detecting ground targets, transmitting RF alert coordinates, and verifying autonomous UGV interception and clearance.
  :::

::: warning Evidence and configuration checks
Before final submission, reconcile the proposed 1.50 m turning radius with the steering document, confirm the motor-driver interface (CAN versus RS-485) from actual hardware manuals, verify RF frequency/power requirements with current IMDA rules and campus permissions, and verify the claimed firmware rates, safety timeouts and performance targets against implementation records. Do not treat these as completed tests.
:::

<!-- #endregion programming-tasks -->
