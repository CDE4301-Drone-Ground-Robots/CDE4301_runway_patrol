---
title: "Appendix L: Drivetrain & Steering Calculations"
description: "Steering architecture decision matrix, skid-steer unicycle kinematic derivations, lateral tire-scrub moment equations, and calculated operating scenarios."
owner: "Hilbert Soh"
---

# Appendix L: Drivetrain & Steering Calculations

<!-- #region kinematics-appendix -->

This appendix compiles the quantitative steering selection trade study, formal skid-steer kinematic formulations, lateral tire-scrub moment derivations, dynamic stability constraints, and calculated vehicle operating regimes.

### L.1 Steering Architecture Down-Selection Decision Matrix

Three candidate drivetrain topologies were evaluated for the autonomous runway patrol UGV: four-wheel independent skid steering, front-wheel Ackermann steering, and Mecanum wheel omnidirectional drive [\[13\]](../members/hilbert/references.md#ref-13). Mechanical reliability, structural simplicity, and debris tolerance were weighted above cruising efficiency for airfield operations.

<Card tag="Weighted Selection Matrix">

**Table L.1: Quantitative Steering Architecture Down-Selection Decision Matrix**

| Evaluation Criterion | Weight | 4WD Skid-Steer | Ackermann Steering | Mecanum Wheel | Engineering Rationale |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Mechanical Simplicity & Part Count** | 20% | 5/5 (1.00) | 2/5 (0.40) | 3/5 (0.60) | Skid steering eliminates mechanical steering knuckles, kingpins, tie-rods, rack-and-pinion linkages, and servo actuators. |
| **Zero-Radius Turning Capability** | 20% | 5/5 (1.00) | 1/5 (0.20) | 5/5 (1.00) | Essential for in-place reorientation directly over detected FOD coordinates without multi-point turning maneuvers. |
| **Outdoor Asphalt Traction & Incline Hold** | 15% | 5/5 (1.00) | 4/5 (0.80) | 2/5 (0.40) | Full rubber contact patches maintain friction ($\mu \approx 0.85$); Mecanum passive rollers slip on wet tarmac ($\mu \approx 0.35$). |
| **Environmental Sealing & FOD Resilience** | 15% | 5/5 (1.00) | 2/5 (0.40) | 1/5 (0.20) | Direct-drive hub motors can be sealed against airfield grit; Mecanum roller bearings are vulnerable to grit ingress. |
| **High-Speed Directional Stability ($15\text{ km/h}$)** | 10% | 3/5 (0.60) | 5/5 (1.00) | 2/5 (0.40) | Ackermann geometry provides passive castor centering; skid steering requires active IMU yaw rate stabilization. |
| **Tire Wear & Power Efficiency in Turns** | 10% | 2/5 (0.40) | 5/5 (1.00) | 3/5 (0.60) | Skid steering dissipates energy through lateral tire scrub during tight turns; mitigated by planning sweeping turns ($R \ge 1.0\text{ m}$). |
| **Autonomous Navigation / Control Tractability** | 10% | 4/5 (0.80) | 3/5 (0.60) | 4/5 (0.80) | Standard unicycle kinematic interfaces in ROS 2 Nav2 with effective track width parameterization. |
| **Weighted Composite Score (100% Max)** | — | **88.0%** | 56.0% | 59.0% | **Selected: 4WD Skid-Steer Drive** |

</Card>

#### Alternative Architecture Kinematic Formulations

1. **Ackermann Steering Kinematics:**
   Ackermann steering enforces concentric turning circles for front wheels via geometry:
   $$\cot\delta_o - \cot\delta_i = \frac{w}{L}$$
   Where $\delta_i$ is inside steer angle, $\delta_o$ is outside steer angle, $w$ is track width ($0.575\text{ m}$), and $L$ is wheelbase ($0.4888\text{ m}$). Minimum turning radius is constrained by maximum mechanical steering angle ($\delta_{\max} \approx 35^\circ$):
   $$R_{\min} = \frac{L}{\sin\delta_{\max}} = \frac{0.4888}{\sin 35^\circ} \approx \mathbf{0.852\text{ m}}$$
   This non-holonomic constraint prevents zero-radius in-place turns, requiring multi-point reverse maneuvers to align remediation nozzles over debris.

2. **Mecanum Wheel Kinematics:**
   Mecanum wheels feature passive rollers oriented at $\pm 45^\circ$ to the wheel plane:
   $$\begin{bmatrix} \omega_1 \\ \omega_2 \\ \omega_3 \\ \omega_4 \end{bmatrix} = \frac{1}{R} \begin{bmatrix} 1 & -1 & -(l_x + l_y) \\ 1 & 1 & (l_x + l_y) \\ 1 & 1 & -(l_x + l_y) \\ 1 & -1 & (l_x + l_y) \end{bmatrix} \begin{bmatrix} v_x \\ v_y \\ \omega_z \end{bmatrix}$$
   While offering 3-DOF planar mobility, small roller contact points yield high ground pressure, rapid polyurethane wear on coarse tarmac, and low traction coefficients on wet runway asphalt ($\mu_{\text{wet}} \le 0.35$).

---

### L.2 Skid-Steer Kinematic Model Derivations

The four-wheel skid-steer platform is kinematically modeled as an equivalent two-wheeled differential drive system by synchronizing front and rear motors on each side: $\omega_{\text{FL}} = \omega_{\text{RL}} = \omega_L$ and $\omega_{\text{FR}} = \omega_{\text{RR}} = \omega_R$.

#### 1. Forward Kinematics
Given measured wheel linear velocities $v_L = \omega_L R$ and $v_R = \omega_R R$ with wheel radius $R = 0.1315\text{ m}$:
$$v = \frac{v_R + v_L}{2}$$
$$\omega = \frac{v_R - v_L}{B_{\text{eff}}}$$
Where $v$ is body longitudinal velocity ($\text{m/s}$), $\omega$ is vehicle yaw rate ($\text{rad/s}$), and $B_{\text{eff}}$ is the effective track width accounting for lateral wheel slip.

#### 2. Inverse Kinematics
Given target trajectory velocity setpoints $(v, \omega)$ dispatched by Nav2:
$$v_L = v - \frac{\omega B_{\text{eff}}}{2}, \quad \omega_L = \frac{v_L}{R} = \frac{1}{R}\left(v - \frac{\omega B_{\text{eff}}}{2}\right)$$
$$v_R = v + \frac{\omega B_{\text{eff}}}{2}, \quad \omega_R = \frac{v_R}{R} = \frac{1}{R}\left(v + \frac{\omega B_{\text{eff}}}{2}\right)$$
Wheel rotational speed in revolutions per minute ($\text{RPM}$) is:
$$N_L = \frac{60 \omega_L}{2\pi} = \frac{30 v_L}{\pi R}, \quad N_R = \frac{60 \omega_R}{2\pi} = \frac{30 v_R}{\pi R}$$

#### 3. Instantaneous Centre of Rotation (ICR)
Due to lateral tire scrub during turning, the actual ICR does not lie on the physical lateral wheel axle line. For a symmetric four-wheel vehicle with longitudinal wheelbase $L$ and track width $B$:
$$x_{\text{ICR}} = \frac{-v_y}{\omega}, \quad y_{\text{ICR}, L} = \frac{v_{x,L} - v_x}{\omega}, \quad y_{\text{ICR}, R} = \frac{v_{x,R} - v_x}{\omega}$$
For steady-state symmetric maneuvers on level ground, longitudinal slip shifts the effective track width outward: $B_{\text{eff}} = y_{\text{ICR}, R} - y_{\text{ICR}, L} > B$.

#### 4. Effective Track Width ($B_{\text{eff}}$) Formulation
Effective track width accounts for lateral tire slip during turns. Following experimental calibrations on skid-steer platforms [\[14\]](../members/hilbert/references.md#ref-14):
$$B_{\text{eff}} = \chi \cdot B$$
Where $\chi \ge 1.0$ is the empirical slip factor. For the FOD Hunter platform on clean dry airfield asphalt:
- Nominal track width: $B = 0.575\text{ m}$
- Slip factor range: $\chi \approx 1.25\text{–}1.35$
- Calibrated effective track width: $B_{\text{eff}} \approx 1.30 \times 0.575\text{ m} \approx \mathbf{0.7475\text{ m}}$

---

### L.3 Tire-Scrub Resistance & Motor Torque Analysis

During zero-radius or tight-radius turns, wheels rotate about the vehicle geometric center while contact patches are forced laterally across pavement, generating significant scrubbing moments.

#### 1. Normal Load Distribution
For vehicle total mass $m = 65.0\text{ kg}$ on level ground ($\theta = 0^\circ$):
$$F_z = m g = 65.0\text{ kg} \times 9.80665\text{ m/s}^2 = 637.43\text{ N}$$
Under static symmetric mass distribution ($50/50$ front-to-rear, $50/50$ left-to-right):
$$F_{z,i} = \frac{F_z}{4} = \frac{637.43}{4} \approx \mathbf{159.36\text{ N per wheel}}$$

#### 2. Lateral Scrub Moment Derivation
Assuming Coulomb friction model with friction coefficient $\mu$, the lateral friction force opposing tire scrub at each wheel contact patch is:
$$F_{y,i} = \mu \cdot F_{z,i} = \mu \frac{m g}{4}$$
Moment arm from vehicle rotation center to wheel contact patch along the longitudinal axis is half the wheelbase: $d_x = L / 2 = 0.4888 / 2 = 0.2444\text{ m}$.
Total scrubbing moment resisting vehicle yaw rotation across all four wheels is:
$$M_{\text{scrub}} = 4 \times \left(F_{y,i} \cdot \frac{L}{2}\right) = 4 \times \left(\mu \frac{m g}{4} \cdot \frac{L}{2}\right) = \frac{1}{2} \mu m g L$$
- **Nominal dry asphalt assumption ($\mu = 0.80$):**
  $$M_{\text{scrub}} = 0.5 \times 0.80 \times 65.0\text{ kg} \times 9.80665\text{ m/s}^2 \times 0.4888\text{ m} = \mathbf{124.63\text{ Nm}}$$
- **High-grip clean asphalt ($\mu = 0.90$):**
  $$M_{\text{scrub}} = 0.5 \times 0.90 \times 65.0 \times 9.80665 \times 0.4888 = \mathbf{140.21\text{ Nm}}$$
- **Wet asphalt runway ($\mu = 0.50$):**
  $$M_{\text{scrub}} = 0.5 \times 0.50 \times 65.0 \times 9.80665 \times 0.4888 = \mathbf{77.89\text{ Nm}}$$

#### 3. Combined Friction Circle & Slip Vector Analysis
At each wheel contact patch, longitudinal traction force $F_{x,i}$ and lateral scrub force $F_{y,i}$ interact according to the friction circle inequality:
$$F_{\text{res},i} = \sqrt{F_{x,i}^2 + F_{y,i}^2} \le \mu F_{z,i}$$
In a pure zero-radius turn ($v = 0$, $\omega \ne 0$), longitudinal wheel motion provides the driving torque while lateral slip dissipates energy:
$$F_{x,i} = \frac{T_i}{R}, \quad F_{y,i} \approx \mu F_{z,i} \cdot \text{sgn}(\omega)$$
To initiate rotation without wheel stall, tire-ground contact must enter sliding friction regime.

#### 4. Motor Torque Sizing for Zero-Radius Turning
To overcome the lateral scrubbing moment $M_{\text{scrub}}$ during an in-place turn, drive wheels must generate an opposing yaw torque couple about the vehicle centerline. Moment arm of longitudinal tire forces is half the physical track width: $d_y = B / 2 = 0.575 / 2 = 0.2875\text{ m}$.
Yaw torque generated by four drive motors (two driving forward with force $+F_x$, two in reverse with $-F_x$):
$$M_{\text{drive}} = 2 \cdot F_x \cdot \frac{B}{2} + 2 \cdot F_x \cdot \frac{B}{2} = 2 F_x B = 4 F_{x,i} \frac{B}{2} = 2 F_{x,i} B$$
Equating drive moment to scrub resistance ($M_{\text{drive}} \ge M_{\text{scrub}}$):
$$2 F_x B \ge M_{\text{scrub}} \implies F_x = \frac{M_{\text{scrub}}}{2 B}$$
Per-wheel longitudinal tractive force ($F_{x,i} = F_x / 2$):
$$F_{x,i} = \frac{M_{\text{scrub}}}{4 (B / 2)} = \frac{M_{\text{scrub}}}{2 B}$$
Required motor output torque per wheel with wheel radius $R = 0.1315\text{ m}$:
$$T_{\text{pivot}, i} = F_{x,i} \cdot R = \frac{M_{\text{scrub}} \cdot R}{2 B}$$
Substituting nominal values ($M_{\text{scrub}} = 124.63\text{ Nm}$, $B = 0.575\text{ m}$, $R = 0.1315\text{ m}$):
$$T_{\text{pivot}, i} = \frac{124.63 \times 0.1315}{2 \times 0.575} = \frac{16.389}{1.150} \approx \mathbf{14.25\text{ Nm per wheel}}$$
Applying dynamic safety factor $S_f = 1.30$ to overcome static-to-kinetic friction transition peak:
$$T_{\text{peak}, i} = 1.30 \times 14.25\text{ Nm} \approx \mathbf{18.53\text{ Nm per wheel}}$$
The selected ZLLG80ASM250 hub motors deliver $15.0\text{ Nm}$ continuous rated torque and **$30.0\text{ Nm}$ peak torque**, confirming $1.62\times$ torque margin above peak pivot requirements.

#### 5. Parasitic Power Dissipation
Frictional power dissipated in tire scrub during a zero-radius turn at yaw rate $\omega = 0.873\text{ rad/s}$ ($50^\circ/\text{s}$):
$$P_{\text{scrub}} = M_{\text{scrub}} \cdot |\omega| = 124.63\text{ Nm} \times 0.873\text{ rad/s} \approx \mathbf{108.8\text{ W}}$$
This power is dissipated directly as thermal energy in tire rubber and tarmac abrasion. Planning sweeping turns with radius $R \ge 1.0\text{ m}$ reduces lateral scrub moment by over $60\%$, conserving battery capacity and extending tire life.

---

### L.4 Vehicle Stance & Dynamic Stability Analysis

#### 1. Wheelbase-to-Track-Width Ratio ($L/B$) Limits
The geometric ratio $L/B$ governs the balance between directional stability and skid-steer maneuverability:
$$\frac{L}{B} = \frac{0.4888\text{ m}}{0.575\text{ m}} \approx \mathbf{0.850}$$
- **Steering Efficiency Bound ($L/B < 1.0$):** Values below $1.0$ ensure that lateral scrub moment arm ($L/2$) is smaller than drive torque moment arm ($B/2$), maintaining positive steering mechanical advantage:
  $$\frac{M_{\text{scrub}}}{M_{\text{drive}}} \propto \frac{L}{B} = 0.850 < 1.0 \implies \text{Favorable turnability}$$
- **Directional Stability Bound ($L/B > 0.60$):** Values above $0.60$ prevent excessive yaw sensitivity and hunting oscillations during high-speed linear cruising ($15\text{ km/h}$).

---

### L.5 Calculated Skid-Steer Operating Scenarios

Table L.2 compiles five operational kinematics and loading regimes calculated for the $65.0\text{ kg}$ FOD Hunter platform on clean dry airfield asphalt ($\mu = 0.80$, $B_{\text{eff}} = 0.7475\text{ m}$, $R = 0.1315\text{ m}$).

**Table L.2: Calculated Skid-Steer Operating Scenarios**

| Operating Regime | Forward Speed $v$ | Yaw Rate $\omega$ | Turn Radius $R_{\text{turn}}$ | Left Wheel Speed $v_L$ (RPM) | Right Wheel Speed $v_R$ (RPM) | Scrub Moment $M_{\text{scrub}}$ | Per-Motor Torque $T_i$ | Mechanical Power $P_{\text{mech}}$ |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Straight Cruise** | $4.167\text{ m/s}$ ($15\text{ km/h}$) | $0.00\text{ rad/s}$ | $\infty$ | $4.167\text{ m/s}$ ($302.2$) | $4.167\text{ m/s}$ ($302.2$) | $0.0\text{ Nm}$ | $1.65\text{ Nm}$ | $208.5\text{ W}$ |
| **2. High-Speed Curve** | $4.167\text{ m/s}$ ($15\text{ km/h}$) | $0.833\text{ rad/s}$ | $5.00\text{ m}$ | $3.856\text{ m/s}$ ($279.6$) | $4.478\text{ m/s}$ ($324.7$) | $24.9\text{ Nm}$ | $3.25\text{ Nm}$ | $275.0\text{ W}$ |
| **3. Sweeping Turn** | $2.222\text{ m/s}$ ($8\text{ km/h}$) | $1.111\text{ rad/s}$ | $2.00\text{ m}$ | $1.807\text{ m/s}$ ($131.0$) | $2.637\text{ m/s}$ ($191.2$) | $62.3\text{ Nm}$ | $6.80\text{ Nm}$ | $215.0\text{ W}$ |
| **4. Tight Taxiway Turn**| $1.000\text{ m/s}$ ($3.6\text{ km/h}$)| $1.000\text{ rad/s}$ | $1.000\text{ m}$ | $0.626\text{ m/s}$ ($45.4$) | $1.374\text{ m/s}$ ($99.6$) | $93.5\text{ Nm}$ | $10.50\text{ Nm}$ | $145.0\text{ W}$ |
| **5. Zero-Radius Pivot** | $0.000\text{ m/s}$ ($0\text{ km/h}$) | $0.873\text{ rad/s}$ ($50^\circ/\text{s}$) | $0.000\text{ m}$ | $-0.326\text{ m/s}$ ($-23.6$)| $+0.326\text{ m/s}$ ($+23.6$)| $124.6\text{ Nm}$ | $14.25\text{ Nm}$ | $110.0\text{ W}$ |

<!-- #endregion kinematics-appendix -->
