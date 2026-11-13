---
title: "Steering Kinematics & Drive Architecture Selection"
owner: "Hilbert Soh"
outline: [2, 3]
---

# Steering Kinematics & Drive Architecture Selection

Semester 1 · Steering design and calculations

<!-- #region report -->

## 1. Objectives & Requirements {#steer-objectives}

FOD Hunter must travel along paved runway routes and position itself over detected foreign object debris (FOD). I compared steering options based on turning space, mechanical complexity, traction and compatibility with ROS 2 velocity commands. The calculations assume **65 kg**, **263 mm wheel diameter**, **488.8 mm wheelbase** and **575 mm track width**; the assembled vehicle has not been measured.

:::: details Detailed steering requirements and assumptions

The intended patrol speed is 8 km/h, with a 15 km/h sprint design target. Opposite wheel-bank speeds can command an in-place turn, but real skid steering involves tire slip. The ideal differential-drive model does not capture this effect. I also considered outdoor traction and protection from debris.

The full requirement tables and stability calculations are available in the detailed appendix on the individual page.

::::

## 2. Steering Architecture {#steer-architecture}

I selected **four independently driven hub motors**, operated as left and right wheel banks. Equal bank speeds move the UGV straight; different speeds produce a turn; opposite speeds command an in-place pivot. Sizing and torque requirements are established in [Motor Drivetrain Calculations](./motor-drivetrain-calculation.md), while chassis fabrication, hub mounting brackets and suspension integration are documented in [Chassis Design](../zacarias/chassis-design.md).

![Steering architecture down-selection decision tree](./assets/diagrams/steering-decision-tree.svg)

## 3. Design Methodology & Selection {#steer-selection}

### 2WD vs 4WD Drive Selection

A two-wheel differential-drive layout with passive casters was considered as a simpler alternative. It would require fewer motors and drivers, reducing cost, weight and electrical complexity.

However, only the driven wheels would provide traction. With equal wheel loading, 2WD provides approximately half the available driven-wheel traction of 4WD on the same surface. Casters would also complicate suspension integration on uneven ground.

I selected 4WD to provide traction at all four wheels and maintain compatibility with the planned independent suspension. The trade-off is higher hardware cost, weight and motor-control complexity.

### Steering Topology Evaluation

I compared **skid-steer, Ackermann and Mecanum** steering. I chose skid-steer because it supports tight turns without separate steering linkages. Ackermann reduces tire scrub during turns but cannot pivot in place. Mecanum allows sideways motion, but its exposed rollers add maintenance concerns for outdoor use.

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

The appendix contains the weighted scores and alternative kinematic models. The scores are design judgments, not test results.

::::

## 4. Engineering Calculations & Interactive Kinematics {#steer-kinematics}

I convert the commanded forward speed $v_x$ and yaw rate $\omega_z$ into left and right wheel speeds using wheel radius $r$ and effective track width $B_{\mathrm{eff}}$:

$$
\omega_L=\frac{v_x-\omega_z B_{\mathrm{eff}}/2}{r},\qquad
\omega_R=\frac{v_x+\omega_z B_{\mathrm{eff}}/2}{r}
$$

For $\omega_z\ne0$, the ideal turning radius is $R=v_x/\omega_z$. When $v_x=0$ and the wheel banks rotate in opposite directions, the model predicts an in-place turn. Actual turning depends on tire slip, so $B_{\mathrm{eff}}$ must be calibrated using measured yaw motion.

> **Interactive models:** Widget 1 combines the AgileX Scout 2.0 geometry with the 65 kg FOD Hunter design mass to examine steering behaviour under the selected loading assumption. The Scout simulation model itself has a mass of 52.37 kg. Widget 2 explores the provisional FOD Hunter geometry using adjustable dimensions and surface friction. Neither widget measures physical steering performance.

<SteeringKinematicsWidget1 />

<SteeringKinematicsWidget2 />

:::: details Tire-scrub forces, effective track width and detailed derivations

![Skid-steer tire-scrub free-body diagram](./assets/diagrams/skid-steer-forces-fbd.svg)

The appendix contains the friction model, geometry comparison, pitch analysis and operating scenarios. These torque estimates use assumed friction. Motor sizing is covered in [Motor Drivetrain Calculations](./motor-drivetrain-calculation.md).

::::

## 5. Testing & Results {#steer-testing}

The steering equations were used in Gabriel's STM32 motor-control firmware. Gabriel also tested a preliminary four-wheel chassis moving on the ground under an **estimated 30 kg load**, using a **32 V supply with an approximately 10 A current limit**. The test demonstrated forward and reverse motion, variable-speed control and four-motor operation. Video evidence is available. Turning radius, tyre scrub and full-load steering torque were not measured.

**Firmware implementation (Gabriel):** `CDE4301Stm32/Core/Src/controller.c`, `Drive_UGV_With_Mode()` (reported lines 650–666), converts commanded linear and angular velocity into left/right wheel speeds and RPM. The code uses a **575 mm track width** and **131.5 mm wheel radius**, matching the design assumptions in this analysis. The **488.75 mm wheelbase** is also defined in the firmware; these dimensions remain provisional until the final chassis is measured.

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

Gabriel also added **proportional speed limiting**: when either wheel bank exceeds the allowed RPM, both commands are scaled by the same factor. This keeps the commanded turning radius unchanged in the ideal kinematic model, although tire slip may still change the actual path. The firmware uses a 50 Hz motor-command dispatch loop; it does not yet calculate physical wheel odometry from encoder feedback.

<VideoClip
  src="./assets/videos/Video K8.MOV"
  poster="./assets/images/posters/video-k8-poster.jpg"
  caption="Video 4.5.1: Preliminary physical chassis bench test demonstrating forward, reverse, and skid-steer motion under ~30 kg load with a 32 V / 10.4 A DC supply."
/>

:::: details Original analytical scenarios and verification status

The appendix lists the five calculated operating scenarios (see [Table 4.5.2 in the standalone Steering Kinematics appendix](/members/hilbert/steering-kinematics#sec-detailed-engineering-evidence)). Encoder, CAN and turning results will be compared against logged data during Semester 2 testing.

::::

## 6. Engineering Discussion {#steer-discussion}

The main trade-off is **tight turning versus tyre scrub**. Pivots increase tyre wear and motor load, so planned curves can reduce their frequency. The wheel-speed equations generate commands, but actual turning requires calibration of effective track width.

For motor torque and electrical demand, see [Motor Drivetrain Calculations](./motor-drivetrain-calculation.md). For planner configuration and localization, see [Navigation](./navigation.md). For software simulation evidence, see [Simulation](./simulation.md).

## 7. Limitations & Semester 2 Plan {#steer-future}

Next, I will measure turning radius and yaw tracking on FOD Hunter, calibrate $B_{\mathrm{eff}}$ using odometry and independent heading measurements, and assess motor current and tire scrub. I will begin with low-speed tests before attempting higher speeds. Detailed scheduling belongs in the [Semester 2 Plan](./semester-2-plan.md).

<!-- #endregion report -->

## Detailed Engineering Evidence {#sec-detailed-engineering-evidence}

:::: details Original Calculations and Design Analysis

### A. Steering Architecture Selection & Trade-Off Matrix

I evaluated three candidate drivetrain topologies for the runway patrol robot: four-wheel independent skid steering, car-like front-wheel Ackermann steering, and Mecanum wheel omnidirectional drive [\[13\]](./references.md#ref-13). I weighted mechanical reliability and debris tolerance above cruising efficiency for runway use.

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

The 4WD skid-steer model uses left and right wheel speeds and an effective track width $B_{\text{eff}}$ to account for lateral slip [\[13\]](./references.md#ref-13).

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

For analysis I use $\chi \approx 1.18$, following the effective-track-width approach for skid-steer robots [\[13\]](./references.md#ref-13). This analytical ratio compares the Gazebo wheel separation (0.68 m) with the provisional FOD Hunter track width (0.575 m):

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

Both $124.63\text{ Nm}$ and $132.42\text{ Nm}$ are analytical estimates calculated using the identical classical formula $M_{\text{scrub}} = 0.5 \mu m g L$, differing only in the assumed pavement friction coefficient:

- **Nominal dry asphalt assumption ($\mu = 0.80$):** $M_{\text{scrub}} = 0.5 \times 0.80 \times 65.0 \times 9.80665 \times 0.4888 = \mathbf{124.63\text{ Nm}}$ (used as the default baseline in the interactive explorer).
- **Conservative sizing assumption ($\mu = 0.85$):** $M_{\text{scrub}} = 0.5 \times 0.85 \times 65.0 \times 9.80665 \times 0.4888 = \mathbf{132.42\text{ Nm}}$ (used for conservative drivetrain torque margin evaluation).

Neither friction coefficient is an experimentally measured runway value; both serve as analytical estimates for drivetrain sensitivity.

#### 3. Combined Friction Circle & Slip Vector Analysis

Tire forces are constrained by the friction circle ($F_x^2 + F_y^2 \le (\mu N_w)^2$). The slip velocity vector at each wheel acts at angle $\theta_{\text{slip}}$:

$$\theta_{\text{slip}} = \arctan\left( \frac{L/2}{B/2} \right) = \arctan\left( \frac{L}{B} \right) = \arctan(0.8501) = 40.37^\circ$$

The total friction force $F_{\text{tot}} = \mu N_w = 135.45\text{ N}$ decomposes into:

- **Lateral scrub resistance:** $F_y = F_{\text{tot}} \sin(40.37^\circ) = 87.73\text{ N}$
- **Longitudinal driving force:** $F_x = F_{\text{tot}} \cos(40.37^\circ) = 103.20\text{ N}$

Under an idealized Coulomb friction-circle model where friction opposes the instantaneous wheel velocity vector, the available driving yaw moment is $M_{\text{drive}} = 2 B F_x$ and resisting scrub moment is $M_{\text{scrub}} = 2 L F_y$. Their ratio depends on the aspect ratio:

$$\frac{M_{\text{drive}}}{M_{\text{scrub}}} = \frac{2 B (\mu N_w \cos\theta)}{2 L (\mu N_w \sin\theta)} = \frac{B}{L} \cot(\theta) = \left( \frac{B}{L} \right)^2 = \left( \frac{1}{0.8501} \right)^2 = 1.3838$$

The ratio reduces to $(B/L)^2 = 1.38$, so it only compares the stance geometry. It splits one assumed friction force into two components and is not a traction reserve. Motor sizing uses the model in Section C.4, where turning in place requires $L/B \le 1$ under the same simplified Coulomb assumptions. Real pneumatic tires have contact-patch compliance and non-linear slip, so in-place pivoting must be tested on runway pavement in Semester 2.

#### 4. Motor Torque Sizing for Zero-Radius Turning

To overcome scrub resistance, each wheel must produce longitudinal tractive force:

$$F_w = \frac{\mu m g L}{4 B} = \frac{0.85 \times 65.0 \times 9.80665 \times 0.4888}{4 \times 0.5750} = 115.15\text{ N}$$

With rolling wheel radius $r = 0.1315\text{ m}$, mechanical shaft torque required per motor is:

$$\tau_{\text{shaft}} = F_w \cdot r = 115.15\text{ N} \times 0.1315\text{ m} = \mathbf{15.14\text{ Nm}}$$

Under the nominal friction assumption ($\mu = 0.80$), $F_w = 108.37\text{ N}$ and required mechanical shaft torque is **$14.25\text{ Nm}$** (compared to **$15.14\text{ Nm}$** under $\mu = 0.85$). For preliminary component selection, Hilbert's Motor Drivetrain chapter evaluated an earlier design baseline ($L/B = 0.80$, $\mu = 0.80$), which established a preliminary mechanical shaft torque requirement of **$13.42\text{ Nm}$** and a preliminary efficiency-adjusted design allowance of **$15.78\text{ Nm}$** ($\tau_{\text{design}} = 13.42 / 0.85 = 15.78\text{ Nm}$).

If an 85% electrical and inverter efficiency margin ($\eta \approx 0.85$) is similarly applied to the later provisional geometry ($L/B = 0.850$, $\mu = 0.80$), it yields an electrical sizing allowance of $\tau_{\text{allowance}} = 14.25 / 0.85 = 16.77\text{ Nm}$. This is the design allowance for the later geometry used in Table 4.5.2. It is a sizing allowance, not a measured torque or electrical input-power result; the 14.25 Nm shaft torque is the value to compare with the motor's mechanical torque ratings. The selected ZLLG80ASM250 direct-drive hub motors provide a rated continuous torque of $15.0\text{ Nm}$ and a peak torque of $28.5\text{ Nm}$ (driven by ZLAC8015D dual-channel servo drivers). Calculated shaft torque is an analytical estimate; continuous pivoting capability and motor temperature have not been tested and require physical field testing on runway tarmac.

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

I calculated five operating scenarios with the Motor Drivetrain road-load model ([Section 4](./motor-drivetrain-calculation.md#motor-calculations)) and the scrub model in Section C of this appendix. The results are preliminary analytical estimates per motor, not measured values.

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
