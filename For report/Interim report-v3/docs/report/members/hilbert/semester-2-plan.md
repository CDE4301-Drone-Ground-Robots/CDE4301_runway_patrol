---
title: "Semester 2 Implementation Plan"
owner: "Hilbert Soh Yong Tai"
role: "Autonomous navigation, SLAM & C2 communications"
description: "Planned physical UGV integration and validation tasks."
---

# Semester 2 plan — Hilbert Soh Yong Tai

<!-- Edit your plan between the region markers; the Overview and the Meet the Team page show this text. -->
<!-- #region plan -->

- Integrate the tested Hybrid A\* and RPP navigation stack with the physical FOD Hunter, then tune it using measured steering and stopping behaviour.
- Connect physical GNSS, IMU and LiDAR sensors to the Dual-EKF localization system and measure localization error.
- Select and test a compliant UAV–UGV radio link, then carry out coordinated outdoor trials.

<!-- #endregion plan -->

<!-- Detailed task breakdown; retain this region for existing composition references. -->
<!-- #region programming-tasks -->

## Semester 2 Tasks & Physical Implementation Scope {#programming-semester-2}

<Badge type="info" text="Hilbert's Autonomy Scope • Physical UGV" />

The ROS 2 navigation stack, including Hybrid A\*, RPP and Dual-EKF, has been run in Gazebo. UAV–UGV target dispatch was tested between a Raspberry Pi 5 and a laptop over an indoor Wi-Fi network. The next step is to connect these systems to the physical FOD Hunter and test them outdoors. The simulation robot is not a one-to-one model of the final UGV.

The four tasks below cover navigation, radio communications, physical sensor integration and field testing. **Values described as targets or starting settings have not been verified on the physical UGV.** Gabriel leads STM32 firmware and motor-driver integration; Hilbert leads navigation, localization and UAV–UGV communications.

[Navigation methodology](./navigation.md) · [Communications implementation](./communications.md) · [Simulation evidence](./simulation.md) · [Steering kinematics](./steering-kinematics.md) · [Motor sizing](./motor-drivetrain-calculation.md)

<ProgrammingWidget5 />

::: details 01 — Navigation & Kinematics

**Transfer Nav2 to the physical UGV and tune its steering** [\[15\]](./references.md#ref-15), [\[16\]](./references.md#ref-16)

The simulation uses SmacPlannerHybrid with a Reeds–Shepp motion model and RPP for path tracking. We will start from the tested configuration, then adjust it using the physical UGV's measured behaviour.

- **Turning radius:** Start from the simulated 1.0 m planner setting. Measure actual turning behaviour before deciding whether a larger planning radius, such as 1.5 m, is needed.
- **Planner settings:** Recheck heading resolution, reverse penalties and planning time on the onboard computer. The simulation used 64 heading bins; proposed changes must be tested rather than assumed to improve performance.
- **Reverse-path limitation:** Reeds–Shepp can plan reverse segments, but the current RPP configuration has `allow_reversing: false`. Resolve this mismatch before allowing reverse-path execution on hardware; retain Reeds–Shepp as the selected planner motion model.
- **Speed and lookahead:** Begin at low speed and retune RPP lookahead, curvature-based speed limits and stopping distance. The 8 km/h simulation setting does not establish safe operation at the 15 km/h design target [\[18\]](./references.md#ref-18).
- **ROS 2 to STM32 interface:** Work with Gabriel to connect Nav2 `/cmd_vel` to the existing `Robot_Set_CmdVel(vx, wz)` firmware interface. Select and test the transport method; micro-ROS is not a fixed requirement.

:::

::: details 02 — RF Telemetry & Datalink

**Test UAV–UGV communication without the indoor router**

The indoor test used CycloneDDS static unicast between a Raspberry Pi 5 and a laptop. The Microhard P900 V2 is a proposed radio candidate; it has not been purchased or tested [\[20\]](./references.md#ref-20).

- **Radio selection:** Check available hardware, range, power needs and whether it can be used legally at the test site. Verify applicable IMDA frequency, power and approval requirements before transmitting [\[3\]](./references.md#ref-3), [\[10\]](./references.md#ref-10).
- **Message transport:** Build and test the bridge needed for the chosen radio. UART framing with COBS is one option, not a confirmed implementation.
- **Message handling:** Test alert delivery, acknowledgements, duplicate handling and compatible ROS 2 QoS settings. Evaluate message authentication if required by the final design.
- **Link loss:** Define and test a heartbeat timeout and safe response on the physical UGV. Do not assume the proposed 2 Hz heartbeat and 1.5 s timeout are already validated.

:::

::: details 03 — Sensor Fusion & State Estimation

**Connect physical sensors to the working ROS 2 localization setup**

The local EKF, global EKF and `navsat_transform_node` were observed running in the Gazebo simulation, with odometry messages and the `map → odom → base_footprint` transform chain present. This confirms runtime operation, **not localization accuracy**.

- **GNSS:** Integrate the selected physical receiver and correction service, if available. Confirm coordinate frames and datum handling before using GNSS-derived navigation goals.
- **Dual-EKF:** Reuse the `robot_localization` architecture with physical wheel odometry, IMU and GNSS measurements. Tune covariances and filter rates based on real sensor data [\[9\]](./references.md#ref-9), [\[22\]](./references.md#ref-22). The simulated EKFs were configured at 30 Hz; any proposed 100 Hz physical rate requires testing.
- **Wheel odometry:** Coordinate with Gabriel to add motor velocity feedback and odometry output. The current STM32 firmware sends velocity commands but does not yet integrate encoder odometry.
- **LiDAR and safety:** Configure obstacle detection and test collision-monitor stop/slowdown distances against measured stopping behaviour. The proposed 0.40 m, 1.20 m and 2.50 m zones are starting points only.
- **Validation:** Compare filtered position and heading against a suitable reference during motion. Record error, drift and behaviour during temporary GNSS loss.

:::

::: details 04 — Physical Integration & Validation

**Test the complete system on FOD Hunter**

Gabriel has demonstrated ground movement with the preliminary four-motor chassis under an estimated 30 kg load, using a 32 V supply with an approximately 10 A current limit. The intended 48 V battery was delayed. These tests support basic motor operation, but do not verify the 65 kg design calculations or 15 km/h target.

- **Drivetrain readiness:** Coordinate with Gabriel on 48 V power integration, motor-driver limits, feedback and safe stop behaviour before autonomous driving. Gabriel owns the embedded implementation and motor tests.
- **Steering calibration:** Measure yaw response and effective track width using encoder-based odometry and an independent heading reference. Compare results with the analytical skid-steer model [\[13\]](./references.md#ref-13).
- **Navigation tests:** Start with low-speed straight runs and turns, then measure cross-track error, obstacle clearance, stopping distance and controller behaviour as speed increases.
- **Target approach:** Measure final position error at FOD targets. The proposed ±5 cm target remains unverified.
- **Integrated trial:** Test the full chain from UAV target coordinates through communication and UGV navigation to FOD clearance. Record successful runs, failures and the conditions of each test.

:::

::: warning Items to verify before physical testing
The final chassis mass and geometry are not yet confirmed; 65 kg remains the drivetrain sizing baseline. Check planner–controller reverse compatibility, physical steering limits, sensor accuracy, radio approval and safe stopping distances before outdoor trials. The simulated navigation results and preliminary 32 V ground test do not establish full-load performance.
:::

<!-- #endregion programming-tasks -->
