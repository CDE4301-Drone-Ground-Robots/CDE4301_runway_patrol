---
title: "Semester 2 Implementation Plan"
owner: "Hilbert Soh Yong Tai"
role: "Autonomous navigation, SLAM & C2 communications"
description: "Planned physical UGV integration and validation tasks."
---

# Semester 2 plan — Hilbert Soh Yong Tai

<!-- Edit your plan between the region markers; the Overview and the Meet the Team page show this text. -->
<!-- #region plan -->

- Finalize UGV mechanical CAD detailing and packaging during vacation, then dispatch fabrication drawings and assemble the frame post-reservist.
- Bench-test sensors and deploy the ROS 2 navigation stack to the onboard computer, tuning skid-steer kinematics and low-speed path tracking.
- Calibrate Dual-EKF localization with physical wheel odometry, IMU, and RTK-GNSS, and configure Nav2 collision monitor safety zones.
- Verify progressive speed scaling up to 15 km/h, conduct joint UAV–UGV airfield trials, and prepare the final capstone demonstration.

<!-- #endregion plan -->

<!-- Detailed task breakdown; retain this region for existing composition references. -->
<!-- #region programming-tasks -->

## Semester 2 Tasks & Physical Implementation Scope {#programming-semester-2}

<Badge type="info" text="Hilbert's Autonomy Scope • Physical UGV" />

The ROS 2 navigation stack, including Hybrid A\*, RPP and Dual-EKF, has been tested in Gazebo simulation. Target coordinate dispatch between UAV and UGV was verified on an indoor test bench between a Raspberry Pi 5 and a laptop. In Semester 2, these systems will be integrated with the physical FOD Hunter and evaluated on paved outdoor surfaces.

The tasks below outline the mechanical completion, firmware and sensor integration, navigation tuning, wireless telemetry, and field verification steps. Values described as targets or initial settings are design baselines to be verified on hardware.

[Navigation methodology](./navigation.md) · [Communications implementation](./communications.md) · [Simulation evidence](./simulation.md) · [Steering kinematics](./steering-kinematics.md) · [Motor sizing](./motor-drivetrain-calculation.md)

<ProgrammingWidget5 />

::: details 01 — Mechanical Detailing & Fabrication Dispatch

**Finalize CAD assembly and dispatch for fabrication**

Chassis packaging and component placement are finalized before and during the vacation period. Modeling work continues during reservist, followed by fabrication dispatch and mechanical assembly.

- **CAD detailing (Vac Wk 1–3):** Complete master assembly in SolidWorks. Package chassis frame, trailing-arm suspension geometry, vacuum sweep box mounting, 48 V battery enclosure, and electronics mounting plates.
- **Reservist constraint (Vac Wk 2–3):** National Service reservist duty. Physical workshop fabrication and lab access are paused; only computer-based CAD modeling continues.
- **Fabrication dispatch & assembly (Vac Wk 4 – S2 Wk 2):** Release 2D drawings and DXF flat patterns to machining and welding vendors immediately post-reservist. Order fasteners and raw stock. Assemble welded frame and drivetrain components with Zacarias.

:::

::: details 02 — Navigation & Kinematics Tuning

**Deploy Nav2 to the physical UGV and tune steering parameters** [\[15\]](./references.md#ref-15), [\[16\]](./references.md#ref-16)

The simulation uses SmacPlannerHybrid with a Reeds–Shepp motion model and RPP for path tracking. Initial hardware tests will start from these baseline parameters and adapt based on measured vehicle response.

- **Turning radius:** Begin from the 1.0 m planner baseline. Measure actual turning radius and scrub characteristics on asphalt before adjusting planner bounds.
- **Planner settings:** Validate heading resolution (64 heading bins baseline), reverse penalties, and compute times on the onboard Jetson Orin Nano.
- **Reverse-path limitation:** Enforce forward-only motion (`allow_reversing: false`) or configure Dubins lattice primitives to maintain forward sensor coverage during runway sweeps.
- **Speed and lookahead:** Begin with low-speed runs (2.22 m/s / 8 km/h) to calibrate RPP lookahead distances and curvature speed limits before expanding towards the 15 km/h design target [\[18\]](./references.md#ref-18).
- **ROS 2 to STM32 interface:** Connect Nav2 `/cmd_vel` output to Gabriel's STM32 `Robot_Set_CmdVel(vx, wz)` firmware interface over serial transport.

:::

::: details 03 — RF Telemetry & Multi-Agent Datalink

**Validate wireless telemetry without local network dependencies**

Indoor bench testing used CycloneDDS static unicast between a Raspberry Pi 5 and a laptop. Outdoor testing requires an independent long-range radio link.

- **Radio candidate:** Evaluate 915 MHz RF modules (Microhard P900 / LoRa) for range, throughput, and power requirements. Verify compliance with IMDA short-range device regulations [\[3\]](./references.md#ref-3), [\[10\]](./references.md#ref-10).
- **Message framing:** Implement UART serial bridging with COBS byte framing and JSON payload parsing.
- **Failsafe handling:** Implement heartbeat monitoring (e.g. 2 Hz) with a 1.5 s link-loss timeout to safely halt or park the UGV if communication drops.
- **Target dispatch:** Parse incoming aerial target coordinates, transform them into the local navigation frame, and trigger Nav2 goal actions.

:::

::: details 04 — Sensor Fusion & State Estimation

**Integrate physical sensors into Dual-EKF localization**

Simulation confirmed runtime transform publishing (`map → odom → base_footprint`). Hardware deployment requires sensor noise characterization and covariance tuning.

- **Wheel odometry:** Read encoder feedback from ZLAC8015D motor drivers via STM32 firmware to compute wheel odometry and linear/angular velocities.
- **IMU & RTK-GNSS:** Connect BNO085 IMU (50 Hz) and ArduSimple RTK-GNSS (10 Hz). Verify frame alignments and datum coordinates.
- **Dual-EKF tuning:** Configure `robot_localization` instances (local continuous odom, global absolute map). Tune process noise $Q$ and measurement noise $R$ matrices based on static and dynamic bench measurements [\[9\]](./references.md#ref-9), [\[22\]](./references.md#ref-22).
- **Vibration filtering:** Apply digital low-pass filtering to isolate IMU readings from high-frequency structural vibration caused by the vacuum motor.

:::

::: details 05 — Safety Zones, Speed Scaling & Field Verification

**Evaluate active safety, stopping performance, and multi-agent operations**

- **Collision monitor (S2 Wk 7):** Deploy `nav2_collision_monitor` with 3-tier bounding polygons: Stop (0.40 m), Slowdown (1.20 m), and Approach (2.50 m), configured against measured stopping distance.
- **Progressive speed scaling (S2 Wk 8):** Incremental speed runs (8, 10, 12, 15 km/h) on paved ground. Measure empirical stopping distances against analytical braking estimates ($d_{\text{stop}} \approx 3.77\text{–}4.5\text{ m}$) and verify chassis pitch stability ($|\theta| \le 4.0^\circ$).
- **Coordinated field trials (S2 Wk 9):** End-to-end multi-agent test: UAV detects synthetic FOD $\to$ RF transmission $\to$ UGV navigates to target $\to$ precision alignment ($\pm 5\text{ cm}$) $\to$ vacuum pickup.
- **System freeze & final milestones (S2 Wk 10–13):** Freeze software configuration, compile final capstone documentation (Week 11), rehearse live demonstrations, and complete oral defense.

:::

::: warning Items to verify before physical testing
The final chassis mass and geometry must be verified against the 65 kg drivetrain baseline. Check planner–controller reverse compatibility, physical steering limits, sensor accuracy, radio regulatory compliance, and emergency stopping performance before outdoor airfield trials.
:::

<!-- #endregion programming-tasks -->
