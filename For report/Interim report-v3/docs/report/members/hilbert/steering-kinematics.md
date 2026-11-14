---
title: "Steering Kinematics & Drive Architecture Selection"
owner: "Hilbert Soh"
outline: [2, 3]
---

# Steering Kinematics & Drive Architecture Selection

Semester 1 · Steering design and calculations

<!-- #region report -->

## 4.5.1 Objectives & Requirements {#steer-objectives}

Autonomous airfield inspection requires path tracking during straight sweeps and in-place positioning over detected foreign object debris (FOD). Drive layouts were compared on swept clearance, mechanical complexity, pavement traction, and compatibility with ROS 2 velocity commands (`geometry_msgs/msg/Twist`). Calculations assume a nominal vehicle mass of **65.0 kg**, wheel diameter of **263.0 mm** ($r = 131.5\text{ mm}$), wheelbase of **488.8 mm**, and track width of **575.0 mm**.

:::: details Detailed steering requirements and assumptions

The operating concept sets an 8.0 km/h nominal patrol speed and a 15.0 km/h sprint target. Counter-rotating the wheel banks allows zero-radius in-place pivots, but real skid-steer turning involves lateral tire scrub that ideal differential-drive kinematics do not capture. Traction on wet asphalt, sealing against airfield grit, and compatibility with the suspension were also important selection criteria.

::::

<span id="sec-2-overview"></span>

## 4.5.2 Steering Architecture {#steer-architecture}

The selected architecture uses **four independently driven hub motors**, coordinated as synchronized left and right wheel banks. Equal wheel speeds drive the vehicle straight, unequal speeds produce curved paths, and counter-rotating banks pivot it in place. Component sizing and torque requirements are in [Motor Drivetrain Calculations](./motor-drivetrain-calculation.md), and chassis fabrication, hub mounting brackets, and suspension kinematics are in [Chassis Design](../zacarias/chassis-design.md).

<span id="sec-4-iterations"></span>

## 4.5.3 Design Methodology & Selection {#steer-selection}

### 4.5.3.1 2WD vs 4WD Drive Selection {#steer-2wd-4wd}

A two-wheel differential-drive layout with passive casters was evaluated as a simpler baseline. It needs fewer actuators and less wiring, but it halves the driven tractive effort under uniform wheel loading, and passive casters can snag on runway expansion joints. I recommended a four-wheel-drive (4WD) layout because it uses all four contact patches for traction and fits directly with the independent trailing-arm suspension, despite the higher hardware cost and control complexity.

### 4.5.3.2 Steering Topology Evaluation {#steer-topology}

Three steering topologies were evaluated: **four-wheel skid-steer, Ackermann front-wheel steering, and Mecanum omnidirectional drive**. I recommended skid steering because it allows in-place rotation without additional steering linkages, although it introduces tire scrub. Ackermann steering avoids lateral tire scrub when cruising but has a minimum swept turning radius ($R_{\text{swept}} \ge 1.2\text{ m}$), so the vehicle would need multi-point maneuvers to position itself over debris. Mecanum wheels allow holonomic motion but have low pavement friction ($\mu \approx 0.35$), severe roller vibration, and poor resistance to grit.

<Figure src="./assets/diagrams/steering-architecture-comparison.svg" alt="Steering and drive architecture down-selection trade study" caption="Figure 4.5.1: Steering and drive architecture down-selection trade study." />

:::: details Architecture comparison and weighted selection evidence

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin: 16px 0;">
  <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--apple-border); border-radius: 8px; padding: 14px; text-align: center;">
    <div style="height: 100px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.25); border-radius: 6px; margin-bottom: 10px;">
      <img src="./assets/images/differential-drive.png" alt="4WD Skid-Steer" style="max-height: 85px; max-width: 100%; object-fit: contain;">
    </div>
    <span class="badge badge-purple" style="font-size: 10.5px;">Selected Architecture</span>
    <h4 style="font-size: 14px; font-weight: 700; color: var(--apple-text-primary); margin: 8px 0 4px 0;">4WD Skid-Steer</h4>
    <p style="font-size: 12px; color: var(--apple-text-secondary); margin: 0; line-height: 1.4;">Zero-radius in-place pivoting with 4 independent hub motors. No steering linkages or kingpins.</p>
  </div>
  <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--apple-border); border-radius: 8px; padding: 14px; text-align: center;">
    <div style="height: 100px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.25); border-radius: 6px; margin-bottom: 10px;">
      <img src="./assets/images/ackermann-steering.png" alt="Ackermann Steering" style="max-height: 85px; max-width: 100%; object-fit: contain;">
    </div>
    <span class="badge badge-amber" style="font-size: 10.5px;">Evaluated Alternative</span>
    <h4 style="font-size: 14px; font-weight: 700; color: var(--apple-text-primary); margin: 8px 0 4px 0;">Ackermann Steering</h4>
    <p style="font-size: 12px; color: var(--apple-text-secondary); margin: 0; line-height: 1.4;">Pure rolling during cruise, but cannot pivot in place: R<sub>min</sub> ≈ 0.7 m at 35° steering (≈ 1.2 m swept clearance). Linkages exposed to debris.</p>
  </div>
  <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--apple-border); border-radius: 8px; padding: 14px; text-align: center;">
    <div style="height: 100px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.25); border-radius: 6px; margin-bottom: 10px;">
      <img src="./assets/images/mecanum-drive.webp" alt="Mecanum Drive" style="max-height: 85px; max-width: 100%; object-fit: contain;">
    </div>
    <span class="badge badge-amber" style="font-size: 10.5px;">Evaluated Alternative</span>
    <h4 style="font-size: 14px; font-weight: 700; color: var(--apple-text-primary); margin: 8px 0 4px 0;">Mecanum Drive</h4>
    <p style="font-size: 12px; color: var(--apple-text-secondary); margin: 0; line-height: 1.4;">Holonomic 3-DOF crabbing, but passive rollers induce vibration, grit vulnerability, and reduced tarmac friction.</p>
  </div>
</div>

The scoring criteria, formulations, and kinematic equations are in the appendix.

::::

## 4.5.4 Engineering Calculations & Interactive Kinematics {#steer-kinematics}

The commanded forward velocity $v_x$ and yaw rate $\omega_z$ are converted to left and right wheel bank angular velocities using the rolling wheel radius $r$ and effective track width $B_{\mathrm{eff}}$:

$$
\omega_L = \frac{v_x - \omega_z B_{\mathrm{eff}}/2}{r}, \qquad
\omega_R = \frac{v_x + \omega_z B_{\mathrm{eff}}/2}{r}
$$

For non-zero yaw rate ($\omega_z \ne 0$), the instantaneous turning radius is $R = v_x / \omega_z$. For pure pivoting ($v_x = 0$), the kinematic model predicts zero turning radius ($R = 0$). Because lateral tire scrub resists chassis rotation, $B_{\mathrm{eff}}$ exceeds the physical track width ($B$) and must be calibrated using measured yaw motion.

> **Interactive models:** Widget 1 uses the AgileX Scout 2.0 simulation geometry ($B = 0.583\text{ m}$, $L = 0.498\text{ m}$) with the 65.0 kg FOD Hunter design mass to show the kinematic steering response. The Gazebo simulation model itself specifies a 52.37 kg base mass. Widget 2 uses the provisional FOD Hunter chassis geometry ($B = 0.575\text{ m}$, $L = 0.4888\text{ m}$) with adjustable surface friction. Both are theoretical kinematic approximations, not field measurements.

<SteeringKinematicsWidget1 />

<SteeringKinematicsWidget2 />

:::: details Tire-scrub forces, effective track width and detailed derivations

<Figure src="./assets/diagrams/skid-steer-forces-fbd.svg" alt="Skid-steer tire-scrub free-body diagram" caption="Figure 4.5.2: Skid-steer tire-scrub free-body diagram." />

The appendix covers the friction model, track width calibration factor, pitch stability thresholds, and five operating torque scenarios. Motor sizing calculations are in [Motor Drivetrain Calculations](./motor-drivetrain-calculation.md).

::::

## 4.5.5 Testing & Results {#steer-testing}

The skid-steer inverse kinematics formulation was implemented in the STM32 motor-control firmware (`CDE4301Stm32/Core/Src/controller.c`, `Drive_UGV_With_Mode()`, lines 650–666) written by Gabriel Tan. It converts the commanded body twist into left and right wheel RPM setpoints using the nominal dimensions ($B = 575\text{ mm}$, $r = 131.5\text{ mm}$, $L = 488.75\text{ mm}$).

```c
/* CDE4301Stm32/Core/Src/controller.c (lines 650–666) — Gabriel Tan */
/* 1. Compute wheel linear velocities (m/s) from commanded linear and angular velocity */
float half_track_wz = (wz * ROBOT_TRACK_WIDTH_M) / 2.0f;
float v_left  = vx - half_track_wz;
float v_right = vx + half_track_wz;

/* 2. Convert to wheel RPM: RPM = (v / (2 * PI * r)) * 60 */
const float wheel_circ_m = 2.0f * 3.14159265f * ROBOT_WHEEL_RADIUS_M;
float rpm_left  = (v_left  * 60.0f) / wheel_circ_m;
float rpm_right = (v_right * 60.0f) / wheel_circ_m;

/* 3. Anti-saturation proportional scaling preserves commanded curvature (R = v / wz) */
float max_wheel_rpm = fmaxf(fabsf(rpm_left), fabsf(rpm_right));
if (max_wheel_rpm > (float)g_motor_max_rpm && max_wheel_rpm > 0.0001f) {
  float scale = (float)g_motor_max_rpm / max_wheel_rpm;
  rpm_left  *= scale;
  rpm_right *= scale;
}
```

The firmware also scales saturated commands proportionally: if either wheel bank exceeds the maximum motor RPM (`g_motor_max_rpm`), both bank commands are scaled by the same ratio, so the commanded curvature ($R = v_x / \omega_z$) is preserved in the ideal kinematic model. Commands are sent over the CAN bus at 50 Hz. Wheel odometry feedback from the motor encoders will be implemented in Semester 2.

A preliminary four-wheel prototype chassis was bench-tested with an **estimated 30 kg test load** powered by a **32 V / 10.4 A bench DC power supply**. The test verified forward, reverse, and differential skid-steer velocity control with all four hub motors running (Video 4.5.1). Turning radius, lateral tire scrub forces, and full-load motor current were not measured.

<VideoClip
  src="./assets/videos/Video K8.MOV"
  poster="./assets/images/posters/video-k8-poster.jpg"
  caption="Video 4.5.1: Preliminary physical chassis bench test demonstrating forward, reverse, and skid-steer motion under ~30 kg load with a 32 V / 10.4 A DC supply."
/>

:::: details Original analytical scenarios and verification status

The five analytical operating scenarios are in the appendix (see [Table 4.5.2 in Appendix L: Drivetrain & Steering Calculations](/report#appendix-l)). Encoder odometry, CAN bus telemetry, and turning circle measurements will be checked against logged data during Semester 2 field trials.

::::

## 4.5.6 Engineering Discussion {#steer-discussion}

Skid steering offers **maneuverability at the cost of tire scrub**. In-place pivots let the vehicle turn on the spot in confined airfield areas but increase tire wear and short-term electrical load. The navigation stack limits this by using curves ($R \ge 1.0\text{ m}$) during wide sweeps and keeping in-place pivots for debris alignment and docking.

Accurate turning commands require calibration of effective track width ($B_{\mathrm{eff}}$) to account for lateral slip. Motor sizing and power demand are detailed in [Motor Drivetrain Calculations](./motor-drivetrain-calculation.md), autonomous navigation in [Navigation](./navigation.md), and Gazebo simulation in [Simulation](./simulation.md).

## 4.5.7 Limitations & Future Work {#steer-future}

Validation on FOD Hunter requires field trials on runway asphalt: measuring turning radii, calibrating $B_{\mathrm{eff}}$ via onboard dual-EKF state estimation and optical ground truth, and logging motor currents during pivot maneuvers. Testing will move from low-speed trials to full-scale sweeps. The testing milestones are in the [Semester 2 Plan](./semester-2-plan.md).

<!-- #endregion report -->

[View Hilbert’s References →](./references.md)
