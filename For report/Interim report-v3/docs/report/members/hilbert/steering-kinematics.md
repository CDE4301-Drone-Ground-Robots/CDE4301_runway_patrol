---
title: "Steering Kinematics & Drive Architecture Selection"
owner: "Hilbert Soh"
outline: [2, 3]
---

# Steering Kinematics & Drive Architecture Selection

Semester 1 · Steering design and calculations

<!-- #region report -->

## 4.5.1 Objectives & Requirements {#steer-objectives}

Autonomous airfield inspection requires precise trajectory tracking along rectilinear sweeps and zero-radius positioning over detected foreign object debris (FOD). Drivetrain kinematics were evaluated across swept clearance, mechanical complexity, pavement traction, and compatibility with ROS 2 velocity commands (`geometry_msgs/msg/Twist`). Calculations assume a nominal vehicle mass of **65.0 kg**, wheel diameter of **263.0 mm** ($r = 131.5\text{ mm}$), wheelbase of **488.8 mm**, and track width of **575.0 mm**.

:::: details Detailed steering requirements and assumptions

The operational concept establishes an 8.0 km/h nominal patrol speed and a 15.0 km/h sprint target. While counter-rotating wheel banks enable zero-radius in-place pivoting, physical skid-steer turning involves lateral tire scrub that is not captured by ideal differential-drive kinematics. Outdoor traction on wet asphalt, environmental sealing against airfield grit, and suspension compatibility were key selection drivers.

::::

<span id="sec-2-overview"></span>

## 4.5.2 Steering Architecture {#steer-architecture}

The selected architecture utilizes **four independently driven hub motors**, coordinated as synchronized left and right wheel banks. Symmetric wheel speeds produce longitudinal translation, differential speeds produce curved paths, and counter-rotating banks execute in-place pivots. Component sizing and torque requirements are established in [Motor Drivetrain Calculations](./motor-drivetrain-calculation.md), while chassis fabrication, hub mounting brackets, and suspension kinematics are detailed in [Chassis Design](../zacarias/chassis-design.md).

![Steering architecture down-selection decision tree](./assets/diagrams/steering-decision-tree.svg)

<span id="sec-4-iterations"></span>

## 4.5.3 Design Methodology & Selection {#steer-selection}

### 4.5.3.1 2WD vs 4WD Drive Selection {#steer-2wd-4wd}

A two-wheel differential-drive layout with passive casters was evaluated as a lower-complexity baseline. While reducing actuator count and wiring, driven tractive effort is halved under uniform wheel loading, and passive casters introduce snag hazards on runway expansion joints. A four-wheel-drive (4WD) layout was selected to maximize traction across all four contact patches and integrate directly with independent trailing-arm suspension, despite higher hardware cost and control complexity.

### 4.5.3.2 Steering Topology Evaluation {#steer-topology}

Three steering topologies were evaluated: **four-wheel skid-steer, Ackermann front-wheel steering, and Mecanum omnidirectional drive**. Skid steering was selected for zero-radius in-place pivoting without steering knuckles, tie-rods, or linkages. Ackermann steering eliminates lateral tire scrub during cruise but imposes a minimum swept turning radius ($R_{\text{swept}} \ge 1.2\text{ m}$), requiring multi-point maneuvers over detected debris. Mecanum wheels offer holonomic motion but suffer from low pavement friction ($\mu \approx 0.35$), severe roller vibration, and vulnerability to grit ingress.

![Steering and drive architecture down-selection trade study](./assets/diagrams/steering-architecture-comparison.svg)

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

Detailed scoring criteria, mathematical formulations, and kinematic equations are compiled in the appendix.

::::

## 4.5.4 Engineering Calculations & Interactive Kinematics {#steer-kinematics}

Commanded forward velocity $v_x$ and yaw rate $\omega_z$ map to left and right wheel bank angular velocities through rolling wheel radius $r$ and effective track width $B_{\mathrm{eff}}$:

$$
\omega_L = \frac{v_x - \omega_z B_{\mathrm{eff}}/2}{r}, \qquad
\omega_R = \frac{v_x + \omega_z B_{\mathrm{eff}}/2}{r}
$$

For non-zero yaw rate ($\omega_z \ne 0$), the instantaneous turning radius is $R = v_x / \omega_z$. For pure pivoting ($v_x = 0$), the kinematic model predicts zero turning radius ($R = 0$). Because lateral tire scrub resists chassis rotation, $B_{\mathrm{eff}}$ exceeds the physical track width ($B$) and must be calibrated using measured yaw motion.

> **Interactive models:** Widget 1 applies AgileX Scout 2.0 simulation geometry ($B = 0.583\text{ m}$, $L = 0.498\text{ m}$) with the 65.0 kg FOD Hunter design mass to examine kinematic steering response. The Gazebo simulation model itself specifies a 52.37 kg base mass. Widget 2 explores the provisional FOD Hunter chassis geometry ($B = 0.575\text{ m}$, $L = 0.4888\text{ m}$) across adjustable surface friction coefficients. Both models represent theoretical kinematic approximations rather than empirical field measurements.

<SteeringKinematicsWidget1 />

<SteeringKinematicsWidget2 />

:::: details Tire-scrub forces, effective track width and detailed derivations

![Skid-steer tire-scrub free-body diagram](./assets/diagrams/skid-steer-forces-fbd.svg)

The appendix details the friction model, track width calibration factor, pitch stability thresholds, and five operating torque scenarios. Motor sizing calculations are established in [Motor Drivetrain Calculations](./motor-drivetrain-calculation.md).

::::

## 4.5.5 Testing & Results {#steer-testing}

The skid-steer inverse kinematics formulation was implemented in the STM32 motor-control firmware (`CDE4301Stm32/Core/Src/controller.c`, `Drive_UGV_With_Mode()`, lines 650–666) authored by Gabriel Tan. The implementation maps commanded body twist into left and right wheel RPM setpoints using nominal dimensions ($B = 575\text{ mm}$, $r = 131.5\text{ mm}$, $L = 488.75\text{ mm}$).

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

The firmware incorporates proportional velocity saturation scaling: when either wheel bank exceeds the maximum motor RPM limit (`g_motor_max_rpm`), both bank commands are scaled by identical ratios, preserving commanded trajectory curvature ($R = v_x / \omega_z$) within the ideal kinematic domain. Commands are dispatched over CAN bus at 50 Hz. Physical wheel odometry feedback from motor encoders is slated for Semester 2 implementation.

A preliminary four-wheel prototype chassis was bench-tested under an **estimated 30 kg preliminary test load** powered by a **32 V / 10.4 A bench DC power supply**. The test verified forward, reverse, and differential skid-steer velocity control across four operating hub motors (Video 4.5.1). Turning radius, lateral tire scrub forces, and full-load motor current were not quantitatively measured.

<VideoClip
  src="./assets/videos/Video K8.MOV"
  poster="./assets/images/posters/video-k8-poster.jpg"
  caption="Video 4.5.1: Preliminary physical chassis bench test demonstrating forward, reverse, and skid-steer motion under ~30 kg load with a 32 V / 10.4 A DC supply."
/>

:::: details Original analytical scenarios and verification status

The appendix compiles the five analytical operating scenarios (see [Table 4.5.2 in the standalone Steering Kinematics appendix](/members/hilbert/steering-kinematics#sec-detailed-engineering-evidence)). Encoder odometry, CAN bus telemetry, and turning circle measurements will be validated against logged empirical data during Semester 2 field trials.

::::

## 4.5.6 Engineering Discussion {#steer-discussion}

The central trade-off in skid steering is **maneuverability versus parasitic tire scrub**. In-place pivoting enables zero-radius reorientation in confined airfield zones but increases tire wear and transient electrical loading. Autonomous navigation mitigates this by prioritizing sweeping curves ($R \ge 1.0\text{ m}$) during wide sweeps and reserving in-place pivots for debris alignment and docking.

Command dispatch requires empirical calibration of effective track width ($B_{\mathrm{eff}}$) to eliminate understeer from lateral slip. Motor sizing and power demand are detailed in [Motor Drivetrain Calculations](./motor-drivetrain-calculation.md), autonomous navigation in [Navigation](./navigation.md), and Gazebo simulation in [Simulation](./simulation.md).

## 4.5.7 Limitations & Semester 2 Plan {#steer-future}

Validation on FOD Hunter requires field trials on runway asphalt: measuring turning radii, calibrating $B_{\mathrm{eff}}$ via onboard dual-EKF state estimation and optical ground truth, and logging motor currents during pivot maneuvers. Testing will progress incrementally from low-speed trials to full-scale sweeps. Detailed testing milestones are scheduled in the [Semester 2 Plan](./semester-2-plan.md).

<!-- #endregion report -->

## Detailed Engineering Evidence {#sec-detailed-engineering-evidence}

:::: details Original Calculations and Design Analysis

### A. Steering Architecture Selection & Trade-Off Matrix

Three candidate drivetrain topologies were evaluated for the autonomous runway patrol UGV: four-wheel independent skid steering, front-wheel Ackermann steering, and Mecanum wheel omnidirectional drive [\[13\]](./references.md#ref-13). Mechanical reliability, structural simplicity, and debris tolerance were weighted above cruising efficiency for airfield operations.

<Card tag="Weighted Selection Matrix">

**Table 4.5.1: Quantitative Steering Architecture Down-Selection Decision Matrix**

| Evaluation Criterion                                    | Weight | 4WD Skid-Steer | Ackermann Steering | Mecanum Wheel | Engineering Rationale                                                                                                                       |
| :------------------------------------------------------ | :----: | :------------: | :----------------: | :-----------: | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **Mechanical Simplicity & Part Count**                  |  20%   |   5/5 (1.00)   |     2/5 (0.40)     |  3/5 (0.60)   | Skid steering eliminates mechanical steering knuckles, kingpins, tie-rods, rack-and-pinion linkages, and servo actuators.                   |
| **Zero-Radius Turning Capability**                      |  20%   |   5/5 (1.00)   |     1/5 (0.20)     |  5/5 (1.00)   | Essential for in-place reorientation directly over detected FOD coordinates without multi-point turning maneuvers.                          |
| **Outdoor Asphalt Traction & Incline Hold**             |  15%   |   5/5 (1.00)   |     4/5 (0.80)     |  2/5 (0.40)   | Full rubber contact patches maintain friction ($\mu \approx 0.85$); Mecanum passive rollers slip on wet tarmac ($\mu \approx 0.35$).        |
| **Environmental Sealing & FOD Resilience**              |  15%   |   5/5 (1.00)   |     2/5 (0.40)     |  1/5 (0.20)   | Direct-drive hub motors can be sealed against airfield grit; Mecanum roller bearings are vulnerable to grit ingress.                        |
| **High-Speed Directional Stability ($15\text{ km/h}$)** |  10%   |   3/5 (0.60)   |     5/5 (1.00)     |  2/5 (0.40)   | Ackermann geometry provides passive castor centering; skid steering requires active IMU yaw rate stabilization.                             |
| **Tire Wear & Power Efficiency in Turns**               |  10%   |   2/5 (0.40)   |     5/5 (1.00)     |  3/5 (0.60)   | Skid steering dissipates energy through lateral tire scrub during tight turns; mitigated by planning sweeping turns ($R \ge 1.0\text{ m}$). |
| **Autonomous Navigation / Control Tractability**        |  10%   |   4/5 (0.80)   |     3/5 (0.60)     |  4/5 (0.80)   | Standard unicycle kinematic interfaces in ROS 2 Nav2 with effective track width parameterization.                                           |
| **Weighted Composite Score (100% Max)**                 |   —    |   **88.0%**    |       56.0%        |     59.0%     | **Selected: 4WD Skid-Steer Drive**                                                                                                          |

_Scoring Methodology & Composite Arithmetic:_

- **4WD Skid-Steer:** $0.20(1.0) + 0.20(1.0) + 0.15(1.0) + 0.15(1.0) + 0.10(0.6) + 0.10(0.4) + 0.10(0.8) = \mathbf{88.0\%}$
- **Ackermann:** $0.20(0.4) + 0.20(0.2) + 0.15(0.8) + 0.15(0.4) + 0.10(1.0) + 0.10(1.0) + 0.10(0.6) = \mathbf{56.0\%}$
- **Mecanum:** $0.20(0.6) + 0.20(1.0) + 0.15(0.4) + 0.15(0.2) + 0.10(0.4) + 0.10(0.6) + 0.10(0.8) = \mathbf{59.0\%}$

</Card>

#### Alternative Architecture Kinematic Formulations

1. **Ackermann Steering Condition:**
   To maintain pure rolling without lateral tire slip, front wheels must satisfy the geometric Ackermann steering condition:
   $$\cot(\delta_o) - \cot(\delta_i) = \frac{B}{L}$$
   where $\delta_i$ is the inner wheel angle and $\delta_o$ is the outer wheel angle. The minimum theoretical turning radius is bounded by maximum mechanical steer angle $\delta_{\max} \approx 35^\circ$:
   $$R_{\min} = \frac{L}{\tan(\delta_{\max})} = \frac{0.4888\text{ m}}{\tan(35^\circ)} \approx 0.70\text{ m}$$
   In practice, vehicle overhang and track width increase the swept clearance radius to $R_{\text{swept}} \ge 1.2\text{ m}$. Because Ackermann vehicles cannot rotate in place ($R = 0$), reorienting over runway debris requires multi-point K-turns that extend runway occupancy.

2. **Mecanum Omnidirectional Drive:**
   Mecanum wheels employ passive barrel rollers angled at $45^\circ$, giving forward velocity mapping:
   $$\begin{bmatrix} v_x \\ v_y \\ \omega_z \end{bmatrix} = \frac{r}{4} \begin{bmatrix} 1 & 1 & 1 & 1 \\ -1 & 1 & 1 & -1 \\ -\frac{1}{L/2 + B/2} & \frac{1}{L/2 + B/2} & -\frac{1}{L/2 + B/2} & \frac{1}{L/2 + B/2} \end{bmatrix} \begin{bmatrix} \omega_1 \\ \omega_2 \\ \omega_3 \\ \omega_4 \end{bmatrix}$$
   Although capable of omnidirectional motion ($v_y \ne 0$), contact transitions between passive rollers induce high-frequency chassis vibration, degrading LiDAR and IMU measurements. Low rubber volume and reduced tarmac friction ($\mu \approx 0.35\text{--}0.45$) prevent reliable operation on $5^\circ$ drainage slopes.

---

### B. Skid-Steer Kinematic Model Derivations

The planar 4WD skid-steer model maps wheel bank speeds to body velocities using an effective track width $B_{\text{eff}}$ that accounts for lateral tire slip [\[13\]](./references.md#ref-13).

#### 1. Forward Kinematics

Given left wheel bank angular velocity $\omega_L$ and right wheel bank angular velocity $\omega_R$, forward linear velocity $v_x$ and yaw rate $\omega_z$ in the robot body frame are:

$$v_x = \frac{r}{2} (\omega_R + \omega_L), \qquad \omega_z = \frac{r}{B_{\text{eff}}} (\omega_R - \omega_L)$$

In matrix form:

$$\begin{bmatrix} v_x \\ \omega_z \end{bmatrix} = \begin{bmatrix} \frac{r}{2} & \frac{r}{2} \\[6pt] -\frac{r}{B_{\text{eff}}} & \frac{r}{B_{\text{eff}}} \end{bmatrix} \begin{bmatrix} \omega_L \\ \omega_R \end{bmatrix}$$

where $r = 0.1315\text{ m}$ is the effective rolling wheel radius.

#### 2. Inverse Kinematics

Given commanded trajectory twist $(v_x, \omega_z)$ from Nav2, required wheel bank angular velocities are:

$$\omega_L = \frac{1}{r} \left( v_x - \frac{B_{\text{eff}} \,\omega_z}{2} \right), \qquad \omega_R = \frac{1}{r} \left( v_x + \frac{B_{\text{eff}} \,\omega_z}{2} \right)$$

In matrix form:

$$\begin{bmatrix} \omega_L \\ \omega_R \end{bmatrix} = \begin{bmatrix} \frac{1}{r} & -\frac{B_{\text{eff}}}{2r} \\[6pt] \frac{1}{r} & \frac{B_{\text{eff}}}{2r} \end{bmatrix} \begin{bmatrix} v_x \\ \omega_z \end{bmatrix}$$

#### 3. Instantaneous Centre of Rotation (ICR)

During turning maneuvers, the rigid chassis rotates about an Instantaneous Centre of Rotation located on the lateral coordinate axis ($x_{\text{ICR}} = 0$):

$$y_{\text{ICR}} = R = \frac{v_x}{\omega_z} = \frac{B_{\text{eff}}}{2} \left( \frac{\omega_R + \omega_L}{\omega_R - \omega_L} \right)$$

- **Straight-Line Motion ($\omega_L = \omega_R$):** $\omega_R - \omega_L = 0 \implies R \to \infty$, representing pure translation.
- **Zero-Radius Pivot ($\omega_L = -\omega_R$):** $\omega_R + \omega_L = 0 \implies R = 0$, placing the ICR coincident with the geometric center $(0, 0)$.

#### 4. Effective Track Width ($B_{\text{eff}}$) Formulation

Lateral tire scrub during turns resists rotation, causing the vehicle to turn more slowly than an ideal differential-drive robot of physical track width $B$. Kinematically, this is represented by scaling track width by a kinematic slip factor $\chi$:

$$B_{\text{eff}} = \chi \cdot B$$

Kinematic analyses adopt $\chi \approx 1.18$, following classical effective-track-width parameterization for skid-steer mobile robots [\[13\]](./references.md#ref-13). This ratio reflects the Gazebo simulation wheel separation (0.68 m) relative to the provisional FOD Hunter track width (0.575 m):

$$B_{\text{eff}} = 1.18 \times 0.5750\text{ m} = 0.6785\text{ m}$$

| Item                                | Track width / factor                        | Source                               |
| :---------------------------------- | :------------------------------------------ | :----------------------------------- |
| FOD Hunter design track width $B$   | 0.575 m                                     | Design value (chassis not finalised) |
| AgileX Scout 2.0 track width        | 0.583 m                                     | `scout_v2.xacro`                     |
| Gazebo effective wheel separation   | 0.68 m ($\chi \approx 1.17$ for the Scout)  | DiffDrive plugin in `scout_v2.xacro` |
| STM32 firmware                      | 0.575 m ($\chi = 1$, no correction applied) | `controller.c`                       |
| Analytical factor used on this page | $\chi \approx 1.18$                         | Analysis only                        |

_Methodological Note:_ $\chi = 1.18$ has not been calibrated on a vehicle. Rate-gyroscope and wheel-encoder circle tests on runway pavement in Semester 2 will determine the measured value.

---

### C. Tire-Scrub Resistance & Motor Torque Analysis

During an in-place turn ($v_x = 0, \omega_z \ne 0$), the wheels cannot roll purely longitudinally; each contact patch must slide laterally across the pavement.

#### 1. Normal Load Distribution

For assumed total vehicle mass $m = 65.0\text{ kg}$ distributed equally across four wheels:

$$N_w = \frac{m g}{4} = \frac{65.0 \times 9.80665}{4} = 159.36\text{ N per wheel}$$

#### 2. Lateral Scrub Moment Derivation

Wheel contact patches are positioned at coordinates $(\pm L/2, \pm B/2)$ relative to the chassis center. During a zero-radius turn, each wheel's velocity vector is perpendicular to its radius from the center:

$$\vec{r}_i = \left( \pm \frac{L}{2}, \pm \frac{B}{2} \right), \qquad \vec{v}_i = \vec{\omega}_z \times \vec{r}_i = \left( \mp \omega_z \frac{B}{2}, \; \pm \omega_z \frac{L}{2} \right)$$

Under a simplified Coulomb friction model ($\mu = 0.85$ on dry asphalt), the resisting moment produced by lateral scrub forces $F_{y,i} = \mu N_w$ acting at moment arm $L/2$ is:

$$M_{\text{scrub}} = \sum_{i=1}^{4} F_{y,i} \left( \frac{L}{2} \right) = 4 \left( \mu \frac{m g}{4} \right) \left( \frac{L}{2} \right) = \frac{1}{2} \mu m g L$$

Substituting baseline parameters ($m = 65.0\text{ kg}$, $L = 0.4888\text{ m}$, $\mu = 0.85$):

$$M_{\text{scrub}} = 0.5 \times 0.85 \times 65.0\text{ kg} \times 9.80665\text{ m/s}^2 \times 0.4888\text{ m} = \mathbf{132.42\text{ Nm}}$$

Both $124.63\text{ Nm}$ and $132.42\text{ Nm}$ represent analytical estimates derived from the classical Coulomb friction formulation $M_{\text{scrub}} = 0.5 \mu m g L$, differing solely in the assumed pavement friction coefficient:

- **Nominal dry asphalt assumption ($\mu = 0.80$):** $M_{\text{scrub}} = 0.5 \times 0.80 \times 65.0 \times 9.80665 \times 0.4888 = \mathbf{124.63\text{ Nm}}$ (used as the default baseline in the interactive explorer).
- **Conservative sizing assumption ($\mu = 0.85$):** $M_{\text{scrub}} = 0.5 \times 0.85 \times 65.0 \times 9.80665 \times 0.4888 = \mathbf{132.42\text{ Nm}}$ (used for conservative drivetrain torque margin evaluation).

Neither friction coefficient represents an experimentally measured runway value; both serve as analytical boundaries for drivetrain sensitivity evaluation.

#### 3. Combined Friction Circle & Slip Vector Analysis

Tire forces are constrained by the friction circle ($F_x^2 + F_y^2 \le (\mu N_w)^2$). The slip velocity vector at each wheel acts at angle $\theta_{\text{slip}}$:

$$\theta_{\text{slip}} = \arctan\left( \frac{L/2}{B/2} \right) = \arctan\left( \frac{L}{B} \right) = \arctan(0.8501) = 40.37^\circ$$

The total friction force $F_{\text{tot}} = \mu N_w = 135.45\text{ N}$ decomposes into:

- **Lateral scrub resistance:** $F_y = F_{\text{tot}} \sin(40.37^\circ) = 87.73\text{ N}$
- **Longitudinal driving force:** $F_x = F_{\text{tot}} \cos(40.37^\circ) = 103.20\text{ N}$

Under an idealized Coulomb friction-circle model where friction opposes the instantaneous wheel velocity vector, the available driving yaw moment is $M_{\text{drive}} = 2 B F_x$ and resisting scrub moment is $M_{\text{scrub}} = 2 L F_y$. Their ratio depends on the aspect ratio:

$$\frac{M_{\text{drive}}}{M_{\text{scrub}}} = \frac{2 B (\mu N_w \cos\theta)}{2 L (\mu N_w \sin\theta)} = \frac{B}{L} \cot(\theta) = \left( \frac{B}{L} \right)^2 = \left( \frac{1}{0.8501} \right)^2 = 1.3838$$

The expression simplifies to $(B/L)^2 = 1.38$, illustrating the geometric relationship between stance aspect ratio and moment generation. Under simplified Coulomb assumptions, stationary pivoting requires $L/B \le 1.00$ to ensure driving traction overcomes scrub resistance. Because real pneumatic tires exhibit contact-patch compliance and non-linear shear characteristics, in-place pivoting dynamics must be validated empirically on runway pavement during Semester 2 field trials.

#### 4. Motor Torque Sizing for Zero-Radius Turning

To overcome scrub resistance, each wheel must produce longitudinal tractive force:

$$F_w = \frac{\mu m g L}{4 B} = \frac{0.85 \times 65.0 \times 9.80665 \times 0.4888}{4 \times 0.5750} = 115.15\text{ N}$$

With rolling wheel radius $r = 0.1315\text{ m}$, mechanical shaft torque required per motor is:

$$\tau_{\text{shaft}} = F_w \cdot r = 115.15\text{ N} \times 0.1315\text{ m} = \mathbf{15.14\text{ Nm}}$$

Under the nominal friction assumption ($\mu = 0.80$), $F_w = 108.37\text{ N}$, yielding a required mechanical shaft torque of **$14.25\text{ Nm}$** per motor (compared to **$15.14\text{ Nm}$** under conservative $\mu = 0.85$). For preliminary component selection, the initial drivetrain sizing evaluated an earlier baseline geometry ($L/B = 0.80$, $\mu = 0.80$), establishing a baseline shaft torque requirement of **$13.42\text{ Nm}$** and an efficiency-adjusted sizing allowance of **$15.78\text{ Nm}$** ($\tau_{\text{design}} = 13.42 / 0.85$).

Applying the same 85% electrical and inverter efficiency allowance ($\eta \approx 0.85$) to the provisional geometry ($L/B = 0.850$, $\mu = 0.80$) yields an electrical sizing allowance of $\tau_{\text{allowance}} = 14.25 / 0.85 = 16.77\text{ Nm}$, matching Table 4.5.2. This serves as a conservative sizing boundary rather than an empirical measurement; the mechanical shaft torque ($14.25\text{ Nm}$) remains the primary benchmark against motor continuous ratings. The selected ZLLG80ASM250 hub motors provide a rated continuous torque of $15.0\text{ Nm}$ and peak torque of $28.5\text{ Nm}$ (driven by ZLAC8015D servo drivers). Thermal rise and continuous pivoting limits will be evaluated under physical runway conditions.

#### 5. Parasitic Power Dissipation

Power dissipated during stationary pivoting at yaw velocity $\omega_z = 1.0\text{ rad/s}$ ($57.3^\circ/\text{s}$) under nominal $\mu = 0.80$ is:

$$P_{\text{scrub}} = M_{\text{scrub}} \cdot \omega_z = 124.63\text{ Nm} \times 1.0\text{ rad/s} = 124.63\text{ W}$$

Accounting for electrical efficiency ($\eta = 0.85$), the battery supplies approximately $146.6\text{ W}$ purely to overcome lateral tire shear. For this reason, the autonomous path planner is configured to prioritize continuous curvature arcs ($R \ge 1.0\text{ m}$) over in-place pivots during routine runway sweeps.

---

### D. Vehicle Stance & Dynamic Stability Analysis

#### 1. Wheelbase-to-Track-Width Ratio ($L/B$) Limits

The baseline chassis geometry ($L = 488.8\text{ mm}$, $B = 575.0\text{ mm}$) yields aspect ratio:

$$\frac{L}{B} = \frac{488.8\text{ mm}}{575.0\text{ mm}} = 0.8501$$

The bounds on this ratio are established by two preliminary analytical constraints:

1. **Simplified Traction Threshold ($L/B \le 1.00$):**
   Setting tractive driving moment equal to scrub resistance in this simplified Coulomb model gives $F_w = \mu (mg/4) (L/B)$. With maximum longitudinal friction force modeled as $F_{x,\max} = \mu (mg/4)$, the condition $F_w \le F_{x,\max}$ yields $L/B \le 1.00$. Above this simplified threshold, the model predicts longitudinal wheel spin before overcoming lateral scrub. Actual pivoting depends on tire slip, surface conditions and motor torque rather than a rigid universal boundary.

2. **Pitch Stability Threshold under Assumed Braking ($L/B \ge 0.70$):**
   Decelerating at rate $a$ from cruise speed causes dynamic longitudinal load transfer $\Delta N$ from rear to front axle under quasi-static assumptions:
   $$\Delta N = \frac{m a h_{\text{cg}}}{L}$$
   To maintain contact equilibrium ($N_{\text{rear}} = mg/2 - \Delta N > 0$) for a longitudinally centered CG on level ground:
   $$L > 2 h_{\text{cg}} \left( \frac{a}{g} \right) \implies \frac{L}{B} > 2 \left( \frac{h_{\text{cg}}}{B} \right) \left( \frac{a}{g} \right)$$
   For assumed center-of-gravity height $h_{\text{cg}} = 0.200\text{ m}$ and track width $B = 0.575\text{ m}$:
   - At friction-limited braking ($a = 0.80 g$): $L/B > 2(0.200/0.575)(0.80) = 0.557$
   - At hypothetical emergency deceleration ($a = 1.0 g$): $L/B > 2(0.200/0.575)(1.00) = 0.696 \approx 0.70$
   - This threshold is based on quasi-static load transfer and assumed geometry, not a measured dynamic rollover limit.

The design baseline ratio ($L/B = 0.8501$) resides within this preliminary analytical design range, balancing braking load retention with turning resistance.

---

### E. Calculated Operating Scenarios

Five representative operating scenarios were evaluated using the longitudinal road-load model ([Motor Drivetrain Calculations Section 4.4.4](./motor-drivetrain-calculation.md#motor-calculations)) combined with the scrub resistance formulation in Section C. Tabulated values represent analytical shaft torque estimates per motor rather than empirical test measurements.

<Card tag="Analytical Model Predictions">

**Table 4.5.2: Calculated Steering Scenarios — Torque per Motor**

| Scenario                 | Operating condition                                                                  | Shaft torque per motor | Design allowance per motor ($\div\,0.85$) | Calculation basis                                                                                                    |
| :----------------------- | :----------------------------------------------------------------------------------- | ---------------------: | ----------------------------------------: | :------------------------------------------------------------------------------------------------------------------- |
| **1. Cruise patrol**     | 8.0 km/h (2.22 m/s), straight; wheels 16.90 rad/s (161.4 rpm)                        |       $0.55\text{ Nm}$ |                          $0.65\text{ Nm}$ | Rolling resistance 15.94 N + drag 0.83 N                                                                             |
| **2. High-speed sprint** | 15.0 km/h (4.17 m/s), straight; wheels 31.69 rad/s (302.6 rpm)                       |       $0.62\text{ Nm}$ |                          $0.73\text{ Nm}$ | Rolling resistance 15.94 N + drag 2.93 N (same as Motor Drivetrain Case 1)                                           |
| **3. Sweeping turn**     | 8.0 km/h, $\omega_z$ = 0.74 rad/s, R = 3.00 m; wheels 14.99 / 18.81 rad/s            |       $2.16\text{ Nm}$ |                          $2.54\text{ Nm}$ | Scenario 1 road load (0.55 Nm) + scrub term (1.61 Nm) from $M_{\text{scrub}}(R)$ = 14.05 Nm                          |
| **4. In-place pivot**    | 0 km/h, $\omega_z$ = 1.00 rad/s; wheels ∓2.58 rad/s (24.6 rpm)                       |      $14.25\text{ Nm}$ |                         $16.77\text{ Nm}$ | Pivot scrub moment 124.63 Nm at μ = 0.80, L/B = 0.85 (Section C.4)                                                   |
| **5. 5° incline turn**   | 6.0 km/h (1.67 m/s), $\omega_z$ = 0.50 rad/s, R = 3.33 m; wheels 11.38 / 13.96 rad/s |       $3.81\text{ Nm}$ |                          $4.49\text{ Nm}$ | Slope 55.57 N + rolling 15.94 N + drag 0.47 N (2.37 Nm) + scrub term (1.45 Nm) from $M_{\text{scrub}}(R)$ = 12.65 Nm |

_Equations used:_

- Straight-line road load: $F_{\text{road}} = F_{rr} + F_{\text{aero}} + F_{\text{slope}}$, with $F_{rr} = m g C_{rr}$, $F_{\text{aero}} = \tfrac12 \rho C_d A v^2$, $F_{\text{slope}} = m g \sin\theta$ ($m$ = 65 kg, $g$ = 9.81 m/s², $C_{rr}$ = 0.025, $C_d A$ = 0.28 m², $\rho$ = 1.204 kg/m³).
- Road-load shaft torque per motor: $\tau_{\text{shaft}} = F_{\text{road}}\, r / 4$, with $r$ = 0.1315 m.
- Turning scrub: $M_{\text{scrub}}(R) = M_{\text{pivot}} \frac{B_{\text{eff}}}{2\sqrt{R^2 + (L/2)^2}}$, with $M_{\text{pivot}} = \tfrac12 \mu m g L$ = 124.63 Nm, $B_{\text{eff}}$ = 0.6785 m and $L$ = 0.4888 m. This is a simplified scaling with no published source.
- Scrub shaft torque per motor: $\tau_{\text{scrub}} = \frac{M_{\text{scrub}}(R)}{2B}\, r$, with $B$ = 0.575 m. It is added to the road-load torque.
- Design allowance: $\tau_{\text{design}} = \tau_{\text{shaft}} / 0.85$.
- Component values in the table are rounded; totals are calculated from unrounded values (Scenario 5: 2.366 + 1.447 = 3.813 Nm).

_Notes on Scenarios:_

- Wheel speeds in the turning scenarios (3, 4 and 5) use the effective track width $B_{\text{eff}} = 0.6785\text{ m}$ ($\chi = 1.18$).
- The model assumes equal load on all four wheels and divides the scrub moment evenly between them. During real skid steering, wheel loads and slip differ between wheels, so individual motor torques will differ.
- In Scenario 4, the 14.25 Nm shaft torque is within the 15.0 Nm continuous rating. The 16.77 Nm allowance is above it and within the 28.5 Nm peak, so pivots are treated as short transients.
- All values use the preliminary design geometry ($m = 65.0\text{ kg}$, $L = 488.8\text{ mm}$, $B = 575.0\text{ mm}$, $r = 131.5\text{ mm}$) and assumed dry-pavement friction $\mu = 0.80$. Testing on runway pavement is scheduled for Semester 2.

**Two pivot results.** The original Motor Drivetrain sizing used a preliminary stance ratio of $L/B = 0.80$, giving a pivot shaft torque of **13.42 Nm** and a design allowance of **15.78 Nm**. That calculation remains the basis for motor selection. This appendix uses the later provisional chassis geometry ($L = 488.8$ mm, $B = 575$ mm, $L/B \approx 0.85$), which gives **14.25 Nm** shaft torque and a **16.77 Nm** design allowance. The difference comes from the updated wheelbase-to-track-width ratio, not from a change in method.

</Card>

::::

<Card tag="Analytical Model Predictions">

**Table 4.5.2: Calculated Steering Scenarios — Torque per Motor**

| Scenario                 | Operating condition                                                                  | Shaft torque per motor | Design allowance per motor ($\div\,0.85$) | Calculation basis                                                                                                    |
| :----------------------- | :----------------------------------------------------------------------------------- | ---------------------: | ----------------------------------------: | :------------------------------------------------------------------------------------------------------------------- |
| **1. Cruise patrol**     | 8.0 km/h (2.22 m/s), straight; wheels 16.90 rad/s (161.4 rpm)                        |       $0.55\text{ Nm}$ |                          $0.65\text{ Nm}$ | Rolling resistance 15.94 N + drag 0.83 N                                                                             |
| **2. High-speed sprint** | 15.0 km/h (4.17 m/s), straight; wheels 31.69 rad/s (302.6 rpm)                       |       $0.62\text{ Nm}$ |                          $0.73\text{ Nm}$ | Rolling resistance 15.94 N + drag 2.93 N (same as Motor Drivetrain Case 1)                                           |
| **3. Sweeping turn**     | 8.0 km/h, $\omega_z$ = 0.74 rad/s, R = 3.00 m; wheels 14.99 / 18.81 rad/s            |       $2.16\text{ Nm}$ |                          $2.54\text{ Nm}$ | Scenario 1 road load (0.55 Nm) + scrub term (1.61 Nm) from $M_{\text{scrub}}(R)$ = 14.05 Nm                          |
| **4. In-place pivot**    | 0 km/h, $\omega_z$ = 1.00 rad/s; wheels ∓2.58 rad/s (24.6 rpm)                       |      $14.25\text{ Nm}$ |                         $16.77\text{ Nm}$ | Pivot scrub moment 124.63 Nm at μ = 0.80, L/B = 0.85 (Section C.4)                                                   |
| **5. 5° incline turn**   | 6.0 km/h (1.67 m/s), $\omega_z$ = 0.50 rad/s, R = 3.33 m; wheels 11.38 / 13.96 rad/s |       $3.81\text{ Nm}$ |                          $4.49\text{ Nm}$ | Slope 55.57 N + rolling 15.94 N + drag 0.47 N (2.37 Nm) + scrub term (1.45 Nm) from $M_{\text{scrub}}(R)$ = 12.65 Nm |

_Equations used:_

- Straight-line road load: $F_{\text{road}} = F_{rr} + F_{\text{aero}} + F_{\text{slope}}$, with $F_{rr} = m g C_{rr}$, $F_{\text{aero}} = \tfrac12 \rho C_d A v^2$, $F_{\text{slope}} = m g \sin\theta$ ($m$ = 65 kg, $g$ = 9.81 m/s², $C_{rr}$ = 0.025, $C_d A$ = 0.28 m², $\rho$ = 1.204 kg/m³).
- Road-load shaft torque per motor: $\tau_{\text{shaft}} = F_{\text{road}}\, r / 4$, with $r$ = 0.1315 m.
- Turning scrub: $M_{\text{scrub}}(R) = M_{\text{pivot}} \frac{B_{\text{eff}}}{2\sqrt{R^2 + (L/2)^2}}$, with $M_{\text{pivot}} = \tfrac12 \mu m g L$ = 124.63 Nm, $B_{\text{eff}}$ = 0.6785 m and $L$ = 0.4888 m. This is a simplified scaling with no published source.
- Scrub shaft torque per motor: $\tau_{\text{scrub}} = \frac{M_{\text{scrub}}(R)}{2B}\, r$, with $B$ = 0.575 m. It is added to the road-load torque.
- Design allowance: $\tau_{\text{design}} = \tau_{\text{shaft}} / 0.85$.
- Component values in the table are rounded; totals are calculated from unrounded values (Scenario 5: 2.366 + 1.447 = 3.813 Nm).

_Notes on Scenarios:_

- Wheel speeds in the turning scenarios (3, 4 and 5) use the effective track width $B_{\text{eff}} = 0.6785\text{ m}$ ($\chi = 1.18$).
- The model assumes equal load on all four wheels and divides the scrub moment evenly between them. During real skid steering, wheel loads and slip differ between wheels, so individual motor torques will differ.
- In Scenario 4, the 14.25 Nm shaft torque is within the 15.0 Nm continuous rating. The 16.77 Nm allowance is above it and within the 28.5 Nm peak, so pivots are treated as short transients.
- All values use the preliminary design geometry ($m = 65.0\text{ kg}$, $L = 488.8\text{ mm}$, $B = 575.0\text{ mm}$, $r = 131.5\text{ mm}$) and assumed dry-pavement friction $\mu = 0.80$. Testing on runway pavement is scheduled for Semester 2.

**Two pivot results.** The original Motor Drivetrain sizing used a preliminary stance ratio of $L/B = 0.80$, giving a pivot shaft torque of **13.42 Nm** and a design allowance of **15.78 Nm**. That calculation remains the basis for motor selection. This appendix uses the later provisional chassis geometry ($L = 488.8$ mm, $B = 575$ mm, $L/B \approx 0.85$), which gives **14.25 Nm** shaft torque and a **16.77 Nm** design allowance. The difference comes from the updated wheelbase-to-track-width ratio, not from a change in method.

</Card>

::::
