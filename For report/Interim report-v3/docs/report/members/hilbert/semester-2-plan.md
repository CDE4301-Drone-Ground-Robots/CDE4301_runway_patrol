---
title: "Semester 2 Implementation Plan"
owner: "Hilbert Soh Yong Tai"
role: "Autonomous navigation, SLAM & C2 communications"
description: "Planned physical UGV integration and validation tasks."
---

# Semester 2 plan — Hilbert Soh Yong Tai

<!-- Edit your plan between the region markers; the Overview and the Meet the Team page show this text. -->
<!-- #region plan -->

- Configure, tune and test Nav2 path planning and kinematic steering models on FOD Hunter.
- Integrate RTK-GNSS, tactical IMU and 3D LiDAR for outdoor airside localization.
- Deploy the UAV–UGV RF datalink and execute coordinated multi-agent field operations.

<!-- #endregion plan -->

<!-- Detailed task breakdown; retain this region for existing composition references. -->
<!-- #region programming-tasks -->

## Semester 2 Tasks & Physical Implementation Scope {#programming-semester-2}

<Badge type="info" text="Hilbert's Autonomy Scope • Physical UGV" />

The ROS 2 navigation stack and UAV-side communications were developed using a Gazebo simulation and a local network testbed. The next step is to integrate these systems with the **physical FOD Hunter** and test them outdoors. The AgileX Scout 2.0 was the simulation proxy; it is not the physical UGV.

The work is divided into four autonomy tasks: navigation, RF communications, sensor fusion and physical field validation (low-level motor firmware and driver bring-up are led under Gabriel's subsystem). **All settings and performance figures below are proposed targets unless explicitly stated otherwise.**

[Navigation methodology](./navigation.md) · [Communications implementation](./communications.md) · [Simulation evidence](./simulation.md) · [Steering kinematics](./steering-kinematics.md) · [Motor sizing](./motor-drivetrain-calculation.md)

<ProgrammingWidget5 />

::: details 01 — Navigation & Kinematics

**Physical Nav2 configuration and steering calibration** ([\[19\]](./references.md#ref-19), [\[20\]](./references.md#ref-20))

Configure and test SmacPlannerHybrid on FOD Hunter, then tune the planner and controller based on measured steering behaviour.

- **Turning radius:** Start with a proposed minimum planning radius of 1.50 m to reduce unnecessary skid-steer pivots. Reconcile this with the steering model and measured turning performance.
- **Heading resolution:** Evaluate 72 orientation bins (5° increments) on a 0.05 m costmap.
- **Motion penalties:** Evaluate reverse and direction-change penalties of 2.0 and 3.0, respectively. Confirm compatibility with the selected Dubins or Reeds–Shepp motion model.
- **Planning performance:** Test analytical goal connections and measure planning time. The proposed target is under 25 ms for the specified test scenario; this is not yet verified.
- **Speed:** Assess the proposed 10 km/h operating target only after low-speed control and safety testing.

:::

::: details 02 — RF Telemetry & Datalink

**UAV–UGV radio communication**

Replace the local Wi-Fi test connection with a suitable radio link for target alerts and UGV telemetry. The Microhard P900 V2 is a candidate, not an approved or installed system ([\[24\]](./references.md#ref-24)).

- **Regulatory review:** Confirm permitted frequencies, output power, equipment approval and test-site authorization under the applicable IMDA requirements ([\[3\]](./references.md#ref-3), [\[11\]](./references.md#ref-11)) and relevant aviation guidance ([\[4\]](./references.md#ref-4)). The proposed 917–925 MHz and 100 mW ERP settings require verification.
- **Serial bridge:** Develop a UART-to-ROS 2 bridge using COBS framing for JSON messages.
- **Message integrity:** Evaluate HMAC-SHA-256 authentication with secure shared-key management.
- **Link-loss response:** Test a proposed 2 Hz heartbeat and 1.5 s loss timeout, including a safe stop and operator warning. Confirm the braking response on the actual vehicle.

:::

::: details 03 — Sensor Fusion & State Estimation

**RTK-GNSS, IMU and LiDAR integration**

Integrate the physical sensors and configure localization for outdoor navigation. The aim is to reduce accumulated odometry drift; centimetre-level accuracy remains a target dependent on GNSS conditions.

- **RTK-GNSS:** Connect the proposed UM980 receiver, process NMEA data and obtain RTCM3 corrections through NTRIP where available.
- **Dual-EKF:** Configure local wheel-odometry/IMU fusion and global GNSS-corrected localization using `robot_localization` ([\[9\]](./references.md#ref-9), [\[26\]](./references.md#ref-26)). The proposed local filter rate is 100 Hz.
- **LiDAR:** Filter ground points and supply obstacle data to the Nav2 voxel costmap.
- **Collision monitor:** Test proposed stop, slowdown and approach zones at 0.40 m, 1.20 m and 2.50 m. Adjust these using actual stopping-distance measurements.

:::

::: details 04 — Physical Integration & Validation

**Outdoor testing on FOD Hunter**

Integrate the software stack on the proposed 65 kg four-wheel skid-steer UGV and verify its behaviour in controlled outdoor tests.

- **Steering calibration:** Compare encoder-derived heading with an independent heading estimate to determine effective track width and the slip correction factor $\chi = c_{\text{eff}}/c_{\text{nominal}}$ ([\[14\]](./references.md#ref-14)).
- **RPP tuning:** Test lookahead and curvature-based speed control. Proposed starting values are $L=1.80\text{ m}$ and lookahead time $t=0.6\text{ s}$ ([\[22\]](./references.md#ref-22)).
- **Target approach:** Measure final positioning error relative to FOD targets. The proposed cross-track error target is $\pm 5.0\text{ cm}$.
- **Integrated trial:** Demonstrate UAV target detection, RF coordinate transfer, UGV navigation and FOD clearance, recording both successes and failures.

:::

::: warning Items to verify before implementation
Reconcile the 1.50 m planning radius with physical Steering Kinematics, and verify RF telemetry requirements with current IMDA regulations and site authorizations. All proposed filter rates, timeouts, transit speeds, and accuracy targets must be validated empirically against physical hardware during Semester 2 field trials.
:::

<!-- #endregion programming-tasks -->
