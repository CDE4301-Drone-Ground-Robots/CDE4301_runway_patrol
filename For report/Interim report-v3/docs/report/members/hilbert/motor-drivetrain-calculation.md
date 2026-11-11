---
title: "4WD Motor & Drivetrain Sizing"
description: "Engineering requirements, first-principles drivetrain calculations, manufacturer data, and validation boundaries for the FOD Hunter four-hub-motor drivetrain."
owner: "Hilbert Soh"
outline: [2, 3]
---

# 4WD Motor & Drivetrain Sizing

**Hilbert Soh · Motor and drivetrain calculations**

> **Test status:** The 65 kg mass, 263 mm wheel diameter and 15 km/h speed are design inputs. Our bench supply is limited to 32 V / 10 A, so we have not verified full 48 V drivetrain performance.

<!-- #region report -->

## 1. Objectives & Requirements {#motor-objectives}

We sized the drivetrain for a **65 kg UGV** with **263 mm wheels** and a **15 km/h target speed**. The calculations cover level travel, acceleration, a **5° incline** and a **15° short-ramp check**. These are design cases, not measured vehicle performance. The final design uses a proposed 48 V supply, but our available bench supply is limited to 32 V / 10 A.

We also calculated the torque needed for skid-steer turning. During a pivot, the tires must slide sideways against the ground, which increases motor load. We compared four operating cases to check whether the selected hub motors have sufficient torque.

::: details Full design assumptions and requirements

#### Design inputs and operating requirements {#sec-1-requirements}

<Badge type="info" text="System Constraints" />

We based the drivetrain calculations on operational runway sweep requirements from FAA AC 150/5220-24 [\[2\]](./references.md#ref-2) and airport pavement conditions from ASTM D5340-20 [\[1\]](./references.md#ref-1). The design adopts an operational cruise target of up to $15\text{ km/h}$ ($4.167\text{ m/s}$) to sweep an active $3,000\text{ m}$ runway in under $20\text{ minutes}$ between aircraft movements, an acceleration allowance of $t_{\text{acc}} = 3.0\text{ s}$, and sustained torque over runway drainage verges.

<Card>

**Selected drivetrain: four direct-drive hub motors**

The team purchased **four ZLLG80ASM250 hub motors** and **two ZLAC8015D dual-channel drivers**. Gabriel implemented CANopen communication over a 500 kbps CAN bus, with one driver per axle. Each driver controls two motors. The hub motors avoid a separate gearbox and mechanical differential. The final vehicle wiring and full-load performance still need validation.

</Card>

| Parameter                                       | Design Value                                                | Engineering Justification & Airfield Operating Context                                                                                                                                                                         |
| ----------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Gross Vehicle Mass ($m$)**                    | **$65.0\text{ kg}$** (Fully Laden)                          | Worst-case sizing mass: includes 6061-T6 chassis ($18\text{ kg}$), 48V 20Ah battery ($12\text{ kg}$), vacuum turbine & bin ($15\text{ kg}$), sensors & computer stack ($5\text{ kg}$), and 4 hub drive units ($15\text{ kg}$). |
| **Drive Architecture ($N$)**                    | **4 Independent Hub Motors (4WD)**                          | Four-wheel independent skid-steer control. Tractive driving force is distributed across 4 direct-drive motors, reducing individual continuous motor loading.                                                                   |
| **Wheel Outer Diameter ($D$) & Radius ($r$)**   | **$D = 263\text{ mm}$**, **$r = 0.1315\text{ m}$**          | 10-inch all-terrain tubeless pneumatic tire mounted on ZLLG80 hub. Matches firmware macro `ROBOT_WHEEL_RADIUS_MM = 131.5f`.                                                                                                    |
| **Design Cruise Velocity ($v$)**                | **$15.0\text{ km/h}$** ($4.167\text{ m/s}$)                 | Authoritative target speed enabling rapid sweep of active $3,000\text{ m}$ runway corridors within 15–20 minute air traffic control intervals.                                                                                 |
| **Required Wheel Speed ($N_{\text{req}}$)**     | **$302.6\text{ RPM}$** at $15\text{ km/h}$                  | Direct kinematic conversion: $N = \frac{60 \cdot v}{\pi \cdot D} = \frac{60 \times 4.1667}{\pi \times 0.263} = 302.58\text{ RPM}$.                                                                                             |
| **Motor No-Load Speed ($N_{\text{no-load}}$)**  | **$415.6\text{ RPM}$** ($20.59\text{ km/h}$)                | Factory rating of ZLLG80ASM250 hub motor at 48V. Provides a verified **calculated $1.373\times$ no-load speed ratio** ($37.3\%$ above required RPM) over cruise speed.                                                         |
| **Design Incline Angle ($\theta$)**             | **$5.0^\circ$** (Verge) / **$15.0^\circ$** (Ramp)           | Airside runways have $<1.5^\circ$ cross-fall; $5.0^\circ$ ($8.7\%$) represents taxiway shoulder embankment verges, while $15.0^\circ$ represents drainage culvert access ramps.                                                |
| **Design Acceleration ($a_{\text{des}}$)**      | **$1.389\text{ m/s}^2$** ($t_{\text{acc}} = 3.0\text{ s}$)  | Accelerates from standstill to $15\text{ km/h}$ in $3.0\text{ seconds}$ to clear runway active areas ($F_{\text{acc}} = 90.28\text{ N}$).                                                                                      |
| **Rolling Resistance Coefficient ($C_{rr}$)**   | **$0.025$**                                                 | Pneumatic rubber tires on dry grooved airport asphalt pavement at nominal pressure ($2.5\text{ bar}$).                                                                                                                         |
| **Aerodynamic Drag Area ($C_d \cdot A$)**       | **$0.28\text{ m}^2$** ($C_d = 0.80$, $A = 0.35\text{ m}^2$) | Effective drag area based on frontal area $A = 0.35\text{ m}^2$ and a conservative drag coefficient $C_d = 0.80$ for the blunt chassis, LiDAR mast, and intake ducting (yielding $2.93\text{ N}$ at $15\text{ km/h}$; a baseline $C_d = 0.70$ would give $2.56\text{ N}$). Air density $\rho = 1.204\text{ kg/m}^3$ at $20^\circ\text{C}$. |
| **Tarmac Scrub Friction ($\mu_{\text{skid}}$)** | **$0.80$**                                                  | Coulomb lateral friction coefficient baseline for dry grooved airport asphalt following Gillespie (1992) [\[14\]](./references.md#ref-14) and pavement condition survey context from ASTM D5340-20 [\[1\]](./references.md#ref-1).                                     |
| **Drivetrain Efficiency ($\eta$)**              | **$0.85$** ($85\%$)                                         | Direct-drive configuration: zero gearbox mesh friction. Factor accounts for motor inverter switching, stator copper/iron losses, and tire carcass dissipation.                                                                 |

:::

## 2. Drivetrain Architecture {#motor-architecture}

We selected **four ZLLG80ASM250 hub motors** and **two ZLAC8015D dual-channel drivers**. Each wheel is driven independently, so no mechanical differential or steering linkage is needed. Gabriel has implemented STM32 velocity commands over CANopen and tested the four-motor setup on a preliminary chassis. Integration with Nav2 and validation at the intended supply voltage remain outstanding.

**TODO (Hardware Team / Physical Prototype): Photograph M1 — Purchased ZLLG80ASM250 hub motors and ZLAC8015D dual CANopen drivers with specification nameplates and scale reference.**

**M6 — Motor-driver wiring and CAN communications:** Documented in [Figure 4.5 — 48V Power Distribution Architecture](#sec-power-sizing), illustrating the 48V power distribution, STM32 CAN interface, and dual ZLAC8015D drivers. Physical wiring harness photography is preserved as pending hardware assembly.

The detailed geometric justification for choosing skid steering over Ackermann and Mecanum configurations is documented in [Steering Kinematics →](./steering-kinematics.md). The team-wide battery, DC conversion and auxiliary load budget belongs in Bryan's Electrical documentation.

::: details Selected motor and driver specifications

#### Selected motor and driver specifications {#sec-trade-study}

<Badge type="info" text="Hardware Bill of Materials" />

Rather than employing conventional brushed DC motors, omnidirectional Mecanum drive [\[13\]](./references.md#ref-13), or BLDC motors paired with multi-stage planetary gearboxes (which suffer from mechanical backlash, seal leakage, gear tooth shear under vibration, and abrasive aggregate ingestion), the platform adopts **Four Direct-Drive BLDC Hub Motors**:

<CardGrid :cols="2">

<Card title="4x ZLTECH ZLLG80ASM250 Direct-Drive Hub Motors">

- **Rated Voltage:** $48.0\text{ V DC}$ (Operational range $36 - 60\text{V}$).
- **Rated Speed:** $300\text{ RPM}$ ($\approx 14.87\text{ km/h}$ on $263\text{ mm}$ tire at rated continuous torque).
- **Speed Suitability & Limitations:** The $15.0\text{ km/h}$ design target requires approximately $302.6\text{ RPM}$, slightly above the manufacturer's nominal rated speed of $300\text{ RPM}$. The manufacturer's reported no-load speed of $415.6\text{ RPM}$ at $48\text{V}$ suggests that $302.6\text{ RPM}$ may be achievable under light cruise loading ($0.73\text{ Nm}$ torque), but this has not been physically verified on the vehicle. Loaded vehicle speed under airfield conditions is not guaranteed and remains unverified.
- **No-Load Speed:** $415.6\text{ RPM}$ ($\approx 20.6\text{ km/h}$, **$1.373\times$ speed margin**).
- **Continuous Rated Torque:** $15.0\text{ Nm}$ (thermal rating under rated conditions).
- **Peak Stall Torque:** $28.50\text{ Nm}$ (**$1.806\times$ peak torque headroom** over $15.78\text{ Nm}$ design estimate).
- **Wheel Outer Diameter:** $263\text{ mm}$ ($r = 0.1315\text{ m}$) with tubeless pneumatic tread.
- **Encoder Feedback:** Built-in 1024-line optical encoder ($4096\text{ counts/rev}$ with $4\times$ decoding), delivering $0.202\text{ mm}$ displacement resolution.
- **Ingress Protection:** IP65 sealed hub preventing tarmac bitumen aggregate, grit, and water ingress.

</Card>

<Card title="2x ZLAC8015D Dual-Channel FOC Servo Drives">

- **Architecture:** Dual-channel Field-Oriented Control (FOC) sinusoidal vector driver.
- **Node Allocation:** Driver 1 (Node 1) controls Front Axle (FL/FR); Driver 2 (Node 2) controls Rear Axle (RL/RR).
- **Continuous Output Current:** $15.0\text{ A}$ continuous per channel ($30.0\text{ A}$ peak).
- **Communications Protocol:** CANopen (CiA 402 device profile at $500\text{ kbps}$) with secondary RS485 interface.
- **Firmware Integration:** Interfaced directly to STM32F446RE MCU running `zlac8015d.c` at $50\text{ Hz}$ velocity command loop.
- **Protection Features:** Overvoltage, phase short circuit, stator thermal foldback, and regenerative voltage clamping.

</Card>

</CardGrid>

<Card title="Direct-Drive Kinematic Benefit:">

Eliminating gearboxes removes driveline backlash ($\Delta \theta_{\text{backlash}} = 0^\circ$). Wheel velocity and heading reversal during zero-radius pivots occur instantaneously without mechanical play, but does not by itself prevent odometry drift or establish docking accuracy.

</Card>

:::

## 3. Design Methodology & Selection {#motor-methodology}

The motor and drivetrain engineering followed a four-stage development sequence:

1. **Stage 1 — Preliminary Calculations:** Before purchasing motors or finalizing chassis CAD, we estimated motor torque from first principles using an assumed $65\text{ kg}$ gross vehicle mass, $263\text{ mm}$ wheels, and an assumed $0.80$ wheelbase-to-track-width ratio ($L/B$).
2. **Stage 2 — Hardware Selection:** The preliminary sizing indicated that level cruising required $0.73\text{ Nm}$, incline climbing required $2.88\text{ Nm}$, acceleration required $4.22\text{ Nm}$, and in-place pivoting required a preliminary design torque estimate of $15.78\text{ Nm}$ per motor (assuming $85\%$ efficiency). Based on these figures, we selected four direct-drive ZLLG80ASM250 hub motors ($15.0\text{ Nm}$ continuous, $28.5\text{ Nm}$ peak) and two ZLAC8015D dual-channel FOC drivers ($15\text{ A}$ continuous, $30\text{ A}$ peak per channel).
3. **Stage 3 — Preliminary Physical Testing:** Gabriel implemented STM32 motor control firmware and CANopen communication. Ground tests on a preliminary test chassis moved under an estimated $30\text{ kg}$ load powered by a laboratory bench supply at approximately $32\text{ V}$ with a $10.4\text{ A}$ current limit (`USE_POWER_PRESET_3`, clamped to $25\text{ RPM}$ in firmware). The test confirmed forward/reverse travel, variable-speed control, and four-motor coordination.
4. **Stage 4 — Remaining Validation:** The intended $48\text{ V}$ battery pack was delayed. Full-load torque at the $65\text{ kg}$ design mass, incline climbing, in-place pivoting on tarmac, and loaded $15\text{ km/h}$ travel remain unverified. The $30\text{ kg}$ bench test was a functional verification of motor control and firmware, not a direct validation of the $65\text{ kg}$ design calculations.

## 4. Engineering Calculations {#motor-calculations}

We calculated motor torque for four operating cases using the preliminary design assumptions ($65\text{ kg}$ mass, $263\text{ mm}$ wheels, $L/B = 0.80$, $\mu_{\text{skid}} = 0.80$, and an assumed $85\%$ efficiency allowance). The results are **0.73 N·m per motor** for level cruising, **2.88 N·m** for a 5° incline, **4.22 N·m** for acceleration to 15 km/h in 3 s, and a preliminary design estimate of **15.78 N·m** for an in-place pivot. **Pivoting represents the sizing case** in this model. These are calculated values, not physical test results.

| Calculated case        | Shaft torque per motor | Preliminary design torque ($\eta = 0.85$) | Interpretation                                                 |
| ---------------------- | ---------------------: | ----------------------------------------: | -------------------------------------------------------------- |
| Flat cruising, 15 km/h |               0.62 N·m |                                  0.73 N·m | Low longitudinal road load                                     |
| 5° incline, 15 km/h    |               2.45 N·m |                                  2.88 N·m | Grade resistance dominates                                     |
| 0–15 km/h in 3 s       |               3.59 N·m |                                  4.22 N·m | Short-duration acceleration load                               |
| Zero-radius pivot      |              13.42 N·m |                                 15.78 N·m | Sizing case; sensitive to tire scrub and stance ratio          |

::: details Wheel-speed derivation and tire-size comparison

#### 2. Kinematic Velocity & Wheel Rotational Speed (RPM) Derivation

<Badge type="tip" text="Kinematic Model" />

For a drive wheel with outer diameter $D = 263\text{ mm}$ (radius $r = 0.1315\text{ m}$) in rolling contact, vehicle linear velocity $v$ and wheel rotational angular velocity $\omega$ are related by:

$$
v = \omega \cdot r = \frac{\pi \cdot D \cdot N}{60}
$$

Rearranging to solve for required wheel RPM as a function of wheel diameter $D$ and velocity $v = 15\text{ km/h} = 4.1667\text{ m/s}$:

$$
N = \frac{60 \cdot v}{\pi \cdot D} = \frac{60 \times 4.1667}{\pi \cdot D} = \frac{\mathbf{79.577}}{D} = \frac{\mathbf{39.789}}{r}
$$

Substituting the physical wheel diameter $D = 0.263\text{ m}$ ($r = 0.1315\text{ m}$):

$$
N_{\text{req}} = \frac{79.577}{0.263\text{ m}} = \mathbf{302.58\text{ RPM}} \approx \mathbf{302.6\text{ RPM}}
$$

#### Tire Diameter & Motor RPM Trade-Off Matrix

| Tire Size Spec                                   | Diameter ($D$)       | Radius ($r$)          | Required RPM at $15\text{ km/h}$ | Obstacle Crossing & Trade-off Evaluation                                                                                                                        |
| ------------------------------------------------ | -------------------- | --------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| $105\text{ mm}$ Micro Tire                       | $0.105\text{ m}$     | $0.0525\text{ m}$     | $758\text{ RPM}$                 | Poor obstacle clearance, exceeds standard BLDC hub speed ratings.                                                                                               |
| $6\text{ inch} / 152\text{ mm}$                  | $0.152\text{ m}$     | $0.076\text{ m}$      | $524\text{ RPM}$                 | Low ground clearance, excessive rolling resistance over runway grooving.                                                                                        |
| $8\text{ inch} / 200\text{ mm}$                  | $0.200\text{ m}$     | $0.100\text{ m}$      | $398\text{ RPM}$                 | Moderate clearance, high RPM requirement leaves narrow margin below no-load.                                                                                    |
| **$10.35\text{ in} / 263\text{ mm}$ (Selected)** | **$0.263\text{ m}$** | **$0.1315\text{ m}$** | **$302.6\text{ RPM}$**           | **Selected:** Provides $45\text{ mm}$ ground clearance, crossings over tarmac seams, and calculated $1.373\times$ no-load speed ratio below $415.6\text{ RPM}$. |
| $12\text{ inch} / 300\text{ mm}$                 | $0.300\text{ m}$     | $0.150\text{ m}$      | $265\text{ RPM}$                 | Increases wheel moment arm, requiring higher torque and raising chassis CG.                                                                                     |
| $16\text{ inch} / 406\text{ mm}$                 | $0.406\text{ m}$     | $0.203\text{ m}$      | $196\text{ RPM}$                 | Excessive wheel inertia and packaging penalty for compact airside chassis.                                                                                      |

::: tip Motor Speed Sizing & Validation Boundary
The $15\text{ km/h}$ target speed requires approximately $302.6\text{ RPM}$ on a $263\text{ mm}$ wheel, slightly exceeding the motor's nominal rated speed of $300\text{ RPM}$. While the manufacturer's reported no-load speed of $415.6\text{ RPM}$ ($48\text{ V}$) suggests the target may be achievable under light cruise loads ($0.73\text{ Nm}$), reaching $15\text{ km/h}$ is not guaranteed and has not been physically verified under loaded operating conditions.
:::

:::

::: details Full force, torque and four-case free-body calculations

#### Tractive effort and four operating cases {#sec-2-resistance}

<Badge type="info" text="Dynamic Force Sizing" />

The total tractive effort $F_{\text{total}}$ required at the road contact patches derives from longitudinal vehicle dynamics and rolling contact mechanics [\[13\]](./references.md#ref-13), [\[14\]](./references.md#ref-14). In our **4WD independent hub motor architecture ($N = 4$)**, total tractive force and driving yaw torque are distributed across four wheels. Shaft torque demanded from each individual motor is:

$$
\tau_{\text{motor}} = \frac{F_i \cdot r}{\eta} = \frac{F_{\text{total}} \cdot r}{N \cdot \eta} = \frac{F_{\text{total}} \cdot 0.1315}{4 \times 0.85} = \frac{F_{\text{total}} \cdot 0.1315}{3.40} = \mathbf{0.038676 \cdot F_{\text{total}}}
$$

#### Case 1: Straight Flat Cruising at $15\text{ km/h}$ ($4.167\text{ m/s}$)

Governed by rolling resistance on dry runway asphalt and aerodynamic drag:

$$
F_{rr} = m \cdot g \cdot C_{rr} = 65.0 \times 9.81 \times 0.025 = \mathbf{15.94\text{ N}}
$$

$$
F_{\text{aero}} = \frac{1}{2}\rho \cdot (C_d \cdot A) \cdot v^2 = 0.5 \times 1.204 \times 0.28 \times (4.1667)^2 = \mathbf{2.93\text{ N}}
$$

> **Aerodynamic Drag Sizing Note:** A baseline streamlined body with $C_d = 0.70$ and frontal area $A = 0.35\text{ m}^2$ ($C_d \cdot A = 0.245\text{ m}^2$) produces $F_{\text{aero}} = 2.56\text{ N}$. The original calculation deliberately adopted a conservative drag coefficient of $C_d = 0.80$ to account for the blunt UGV profile, open chassis recesses, external LiDAR mast, and vacuum intake hood, yielding an effective drag area of $C_d \cdot A = 0.80 \times 0.35 = \mathbf{0.28\text{ m}^2}$ ($F_{\text{aero}} = 2.93\text{ N}$). Retaining $2.93\text{ N}$ provides a $0.37\text{ N}$ conservative sizing allowance. (If the baseline $2.56\text{ N}$ were used, $F_{\text{total}} = 18.50\text{ N}$ and $\tau_{\text{motor}} = 0.72\text{ Nm}$, a difference of only $0.01\text{ Nm}$).

$$
F_{\text{total}} = F_{rr} + F_{aero} = 15.94 + 2.93 = \mathbf{18.87\text{ N}}
$$

$$
\tau_{\text{motor}} = \frac{18.87 \times 0.1315}{4 \times 0.85} = \mathbf{0.73\text{ Nm per motor}}
$$

FIGURE 3.1 • CASE 1 FREE-BODY DIAGRAM (FLAT CRUISING)

![Case 1 Straight Flat Cruising FBD](./assets/diagrams/motor-fbd-case1-cruise.svg)

#### Case 2: Incline Slope Climbing ($5.0^\circ$ at $15\text{ km/h}$)

Traversing airport shoulder embankment verges ($\theta = 5.0^\circ$, $\sin 5^\circ = 0.08715$):

$$
F_{\text{slope}} = m \cdot g \cdot \sin(5.0^\circ) = 65.0 \times 9.81 \times 0.087156 = \mathbf{55.57\text{ N}}
$$

$$
F_{\text{total}} = F_{rr} + F_{\text{slope}} + F_{aero} = 15.94 + 55.57 + 2.93 = \mathbf{74.44\text{ N}}
$$

$$
\tau_{\text{motor}} = \frac{74.44 \times 0.1315}{4 \times 0.85} = \mathbf{2.88\text{ Nm per motor}}
$$

FIGURE 3.2 • CASE 2 FREE-BODY DIAGRAM (SLOPE CLIMBING)

![Case 2 Incline Slope Climbing FBD](./assets/diagrams/motor-fbd-case2-slope.svg)

_Drainage Culvert Ramp Check ($15.0^\circ$ Peak):_ For worst-case airfield drainage transitions ($\theta = 15.0^\circ$, $\sin 15^\circ = 0.2588$): $F_{\text{slope}} = 65 \times 9.81 \times 0.2588 = 165.0\text{ N}$, yielding total tractive force $F_{\text{total}} = 183.9\text{ N}$ and $\tau_{\text{motor}} = \frac{183.9 \times 0.1315}{4 \times 0.85} = \mathbf{7.11\text{ Nm}}$, well below the motor's $15.0\text{ Nm}$ continuous thermal rating.

#### Case 3: Flat Dynamic Acceleration ($0 \to 15\text{ km/h}$ in $t_{\text{acc}} = 3.0\text{ s}$)

Accelerating from standstill to full cruise speed at $a = 1.389\text{ m/s}^2$:

$$
a = \frac{v}{t_{\text{acc}}} = \frac{4.1667\text{ m/s}}{3.0\text{ s}} = \mathbf{1.3889\text{ m/s}^2}
$$

$$
F_{\text{acc}} = m \cdot a = 65.0 \times 1.3889 = \mathbf{90.28\text{ N}}
$$

$$
F_{\text{total}} = F_{rr} + F_{\text{acc}} + F_{aero} = 15.94 + 90.28 + 2.93 = \mathbf{109.15\text{ N}}
$$

$$
\tau_{\text{motor}} = \frac{109.15 \times 0.1315}{4 \times 0.85} = \mathbf{4.22\text{ Nm per motor}}
$$

FIGURE 3.3 • CASE 3 FREE-BODY DIAGRAM (DYNAMIC ACCELERATION)

![Case 3 Linear Acceleration FBD](./assets/diagrams/motor-fbd-case3-accel.svg)

#### Case 4: In-Place Zero-Radius Skid-Steer Pivot ($R = 0\text{ m}$) — Peak Sizing Case {#sec-tarmac-scrub}

When executing an in-place pivot, all four tires must shear laterally across dry textured tarmac ($\mu_{\text{skid}} = 0.80$). This represents the maximum mechanical load case in the preliminary sizing model:

$$
F_{\text{skid}} = m \cdot g \cdot \mu_{\text{skid}} = 65.0 \times 9.81 \times 0.80 = \mathbf{510.12\text{ N}}
$$

$$
F_{y,w} = \frac{F_{\text{skid}}}{4} = \mathbf{127.53\text{ N per wheel}}
$$

$$
M_{\text{scrub}} = 4 \times \left(F_{y,w} \cdot \frac{L}{2}\right) = 2 \times 127.53 \cdot L = \mathbf{255.06 \cdot L\text{ Nm}}
$$

$$
M_{\text{drive}} = 4 \times \left(F_{x,w} \cdot \frac{B}{2}\right) = 2 F_{x,w} \cdot B
$$

Equating driving yaw moment to resisting scrub moment ($M_{\text{drive}} = M_{\text{scrub}}$) using the preliminary stance ratio assumption $L/B = 0.80$:

$$
2 F_{x,w} \cdot B = 255.06 \cdot L \implies F_{x,w} = 127.53 \cdot \left(\frac{L}{B}\right) = 127.53 \times 0.80 = \mathbf{102.024\text{ N per wheel}}
$$

The mechanical shaft torque required at the wheel hub ($r = 0.1315\text{ m}$) to produce this tractive force is:

$$
\tau_{\text{shaft}} = F_{x,w} \cdot r = 102.024 \times 0.1315 = \mathbf{13.416\text{ Nm per wheel}}
$$

Applying the assumed drivetrain and motor efficiency allowance of $\eta = 0.85$ yields the preliminary design torque estimate:

$$
\tau_{\text{design}} = \frac{\tau_{\text{shaft}}}{\eta} = \frac{13.416}{0.85} = \mathbf{15.7838\text{ Nm}} \approx \mathbf{15.78\text{ Nm per motor}}
$$

The value **$15.78\text{ Nm}$** was retained as the **preliminary design torque estimate with an assumed 85% efficiency allowance** to guide motor procurement. The calculated mechanical shaft torque required at the hub is **$13.42\text{ Nm}$**. Neither figure represents measured physical torque.

FIGURE 3.4 • CASE 4 FREE-BODY DIAGRAM (ZERO-RADIUS SKID-STEER PIVOT)

![Case 4 Zero Radius Turn 4WD FBD](./assets/diagrams/motor-fbd-case4-pivot.svg)

#### Summary of calculated drivetrain loads

| Operating Case                                             | Total Force / Moment       | Shaft Torque ($\tau_{\text{shaft}}$) | Design Torque ($\eta = 0.85$) | Estimated Phase Current ($I_m$) | Summed Phase Current (4 Motors) | Mechanical Output ($P_{\text{mech}}$) | Motor Headroom Margin                               |
| ---------------------------------------------------------- | -------------------------- | -----------------------------------: | ----------------------------: | ------------------------------: | ------------------------------: | ------------------------------------- | --------------------------------------------------- |
| **Case 1: Flat Cruising** ($15\text{ km/h}$)               | $F = 18.87\text{ N}$       | $0.62\text{ Nm}$                     | **$0.73\text{ Nm}$**          | $1.64\text{ A}$                 | $6.56\text{ A}$                 | $78.6\text{ W}$ ($19.7\text{ W/m}$)   | <Badge type="tip" text="20.5x Continuous Margin" /> |
| **Case 2: Slope Climbing** ($5.0^\circ$, $15\text{ km/h}$) | $F = 74.44\text{ N}$       | $2.45\text{ Nm}$                     | **$2.88\text{ Nm}$**          | $3.44\text{ A}$                 | $13.76\text{ A}$                | $310.2\text{ W}$ ($77.5\text{ W/m}$)  | <Badge type="tip" text="5.2x Continuous Margin" />  |
| **Case 3: Linear Acceleration** ($1.389\text{ m/s}^2$)     | $F = 109.15\text{ N}$      | $3.59\text{ Nm}$                     | **$4.22\text{ Nm}$**          | $4.63\text{ A}$                 | $18.52\text{ A}$                | $454.8\text{ W}$ ($113.7\text{ W/m}$) | <Badge type="info" text="6.75x Peak Margin" />      |
| **Case 4: Zero-Radius Pivot** ($R = 0\text{ m}$)**         | $M_s = 255.06 L\text{ Nm}$ | $13.42\text{ Nm}$                    | **$15.78\text{ Nm}$**         | $14.72\text{ A}$                | $58.87\text{ A}$                | $499.7\text{ W}$ (Peak transient)     | <Badge type="danger" text="1.81x Peak Headroom" />  |

> **Note on current values:** The current values in this table are estimated AC motor phase currents derived from nominal motor torque constants ($I_m \approx \tau / K_t$), summed across four motors. They represent stator phase currents, not DC battery current. In an inverter-driven system, DC bus current depends on motor speed, back-EMF, and inverter PWM duty cycle. True loaded battery current and electrical power draw remain unverified until physical battery testing.

<Badge type="warning" text="Interactive 3D Simulation" /> <Badge type="info" text="Vehicle Dynamics • 4 Operating Scenarios" />

> [!IMPORTANT]
> **SIMULATION KINEMATIC PROXY DISCLAIMER:** The interactive 3D model below renders the **AgileX Scout 2.0** digital twin, which serves strictly as an analytical and simulation proxy for vehicle dynamics and kinematic calculations. It does **not** represent the physical custom welded steel chassis, trailing-arm suspension geometry, or centrifugal vacuum payload of the FOD Hunter prototype.

<MotorDrivetrainCalculationWidget4 />

:::

## 5. Testing & Results {#motor-testing}

### Preliminary loaded ground test

Gabriel tested the purchased motors and drivers on a preliminary UGV chassis that **moved on the ground under an estimated 30 kg total load**. The test used a laboratory power supply set to approximately **32 V**, with a current limit of about **10 A**. The firmware audit identifies a 32 V / 10.4 A bench preset (`USE_POWER_PRESET_3`) with a **25 RPM command limit**. This is a software limit, not a measured wheel speed.

The ground test demonstrated forward and reverse travel, variable-speed commands and simultaneous operation of all four motors. Gabriel implemented the STM32 motor-control firmware and CANopen driver communication; the motor-sizing calculations in this chapter are Hilbert's contribution.

| Test item                | Evidence and outcome                                                                |
| ------------------------ | ----------------------------------------------------------------------------------- |
| Supply                   | Approximately 32 V; about 10 A current limit (firmware preset specifies 10.4 A)     |
| Load                     | Estimated 30 kg total on a preliminary moving chassis; not a calibrated measurement |
| Direction control        | Forward and reverse ground movement demonstrated                                    |
| Speed control            | Variable-speed operation demonstrated; 25 RPM configured command ceiling            |
| Four-motor control       | Both ZLAC8015D drivers operated four motors together                                |
| Motor torque and current | No measured shaft torque or motor phase-current dataset available                   |
| Full design conditions   | 48 V, 65 kg design mass, 15 km/h speed and peak pivot torque not tested             |

**TODO (Gabriel Tan / Physical Prototype): Video M7 — Preliminary ground mobility test: prototype chassis moving forward and backward under ~30 kg test load, powered by 32 V / 10.4 A bench power supply.**

**TODO (Gabriel Tan / Physical Prototype): Video M8 — Variable-speed and zero-radius turn ground demonstration with STM32 CANopen motor velocity ramping.**

**TODO (Gabriel Tan / Physical Prototype): Photograph M9 — Test chassis bench setup showing dual ZLAC8015D drivers, four hub motors, STM32 controller, and laboratory DC power supply.**

The test shows that the selected drivetrain can move the preliminary chassis under these conditions. It **does not verify** the calculated torque values, full-load acceleration, incline climbing or 15 km/h operation. The intended 48 V battery was delayed, so full-voltage testing remains outstanding. For the STM32 code and test procedure, see Gabriel's firmware documentation.

## 6. Engineering Discussion {#motor-discussion}

Under the preliminary friction assumptions ($\mu_{\text{skid}} = 0.80$), **in-place pivoting produces the highest calculated motor torque** ($15.78\text{ Nm}$ preliminary design torque, $13.42\text{ Nm}$ required shaft torque). This makes lateral tire scrub, driver current limits and motor thermal rise important engineering considerations. If runway pavement friction is lower (e.g. wet tarmac $\mu = 0.55$), the required pivot torque decreases proportionally.

### Distinction Between Phase Current and Battery DC Current

A clear physical distinction must be maintained between motor **phase current** and **battery DC supply current**:

1. **Motor Phase Current:** In three-phase BLDC hub motors driven by Field-Oriented Control (FOC), electromagnetic torque is generated by stator phase current through the motor torque constant ($I_{\text{phase}} \approx \tau / K_t$). For the preliminary pivot design torque ($15.78\text{ Nm}$), the estimated phase current is $14.72\text{ A}$ per motor.
2. **Battery DC Current:** In an inverter-driven system, DC current drawn from the battery bus is governed by electrical power conservation ($P_{\text{dc}} = V_{\text{bus}} \cdot I_{\text{dc}} = P_{\text{mech}} / \eta + P_{\text{losses}}$). The inverter modulates voltage via PWM duty cycle ($D \approx V_{\text{phase}} / V_{\text{bus}}$).
3. **Traceability of the 58.99 A Figure:** In the historical power budget (Table 5.1 below), the reported traction current of **$58.99\text{ A}$** was calculated by summing the estimated motor phase currents across four motors ($4 \times 14.72\text{ A} = 58.88\text{ A} \approx 58.99\text{ A}$) and then multiplying directly by the $48\text{ V}$ nominal bus voltage to obtain $2,831.6\text{ W}$. This calculation treated motor phase current as battery current, which is physically incorrect for an inverter drive.
4. **Current Status:** During in-place pivoting at low wheel rotational speed, back-EMF is small and the true DC current drawn from the battery is substantially less than the stator phase current. However, because detailed motor electrical parameters (winding resistance, inductance, back-EMF constants, and inverter switching losses) were not available during preliminary sizing, battery current and total electrical power under load **remain unverified** until physical measurements are conducted with Bryan's 48 V battery pack.

::: details Historical power-bus calculations — requires electrical-team reconciliation

> **Review Note & Technical Precaution:** The following table and calculations are preserved strictly for design traceability from preliminary sizing records. The traction current values ($6.07\text{ A}$, $13.93\text{ A}$, $18.46\text{ A}$, $58.99\text{ A}$) represent summed estimated motor phase currents, not measured or verified DC battery current. Multiplying summed phase current by the $48\text{ V}$ bus voltage ($58.99\text{ A} \times 48\text{ V} = 2,831.6\text{ W}$) significantly overstates battery demand at low rotational speeds. Refer to Bryan Ng's Electrical documentation for the authoritative battery, DC-DC distribution, and BMS specifications.

#### 5. Electrical Power Bus, BMS Discharge Capacity & Auxiliary Load Sizing {#sec-power-bus}

<Badge type="warning" text="48V LiFePO4 Bus" />

The FOD Hunter electrical architecture operates on a shared **$48.0\text{ V DC nominal LiFePO4 bus}$ ($51.2\text{ V float}, 42.0\text{ V cut-off}$)** powered by a $20.0\text{ Ah}$ lithium iron phosphate pack ($960\text{ Wh}$ energy capacity). The bus concurrently feeds two major branches: (1) the **4WD Traction Powertrain** via dual ZLAC8015D servo drives, and (2) the **Airside Auxiliary Subsystems** (~$350\text{ W}$ continuous):

FIGURE 5.1 • 48V DC ELECTRICAL POWER BUS & CAN ARCHITECTURE

![48V Power Distribution Architecture](./assets/diagrams/motor-power-distribution.svg)

#### Auxiliary Subsystem Electrical Allocations (~350 W Continuous)

<CardGrid :cols="3">

<Card tag="Direct 48V">

**Airside Vacuum Turbine**

High-static cyclonic blower fan extracting metallic fasteners, tire wires, and bitumen stones from runway pavement seams.<br> **Power:** $\approx 250.0\text{ W continuous}$<br> **Current:** $\mathbf{5.20\text{ A}}$ at $48.0\text{ V}$

</Card>

<Card tag="Regulated 19V Rail">

**Onboard Autonomy Compute**

Intel NUC 12 / NVIDIA Jetson Orin running ROS 2 Jazzy, Nav2 costmaps, and YOLOv8 real-time FOD detection inference.<br> **Power:** $\approx 70.0\text{ W}$ ($3.68\text{ A}$ @ $19\text{V}$)<br> **Bus Draw:** $\mathbf{1.55\text{ A}}$ at $48\text{V}$ ($\eta_{\text{dcdc}} = 94\%$)

</Card>

<Card tag="Regulated 12V / 5V">

**Perception & Communications**

RoboSense 3D LiDAR ($12\text{W}$), RealSense D435i ($5\text{W}$), Microhard P900 radio ($8\text{W}$), Dual RTK GNSS ($4\text{W}$), STM32 MCU ($1\text{W}$).<br> **Power:** $\approx 30.0\text{ W}$ total<br> **Bus Draw:** $\mathbf{0.67\text{ A}}$ at $48\text{V}$ ($\eta_{\text{dcdc}} = 94\%$)

</Card>

</CardGrid>

#### Total Mission Electrical Bus Budget Across Operational Regimes

| Mission Operational Regime                         | 4WD Traction Power ($P_{\text{traction}}$) | Traction Bus Current ($I_{\text{trac}}$) | Auxiliary Systems ($P_{\text{aux}}$) | Total 48V Bus Current ($I_{\text{bus}}$) | Total Electrical Power ($P_{\text{total}}$) | BMS Capacity & Safety Headroom                                                    |
| -------------------------------------------------- | ------------------------------------------ | ---------------------------------------- | ------------------------------------ | ---------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------- |
| **1. Nominal Cruise ($15\text{ km/h}$)**           | $291.2\text{ W}$                           | $6.07\text{ A}$ ($1.54\text{ A/m}$)      | $356.0\text{ W}$ ($7.42\text{ A}$)   | **$13.49\text{ A}$**                     | $\mathbf{647.2\text{ W}}$                   | **$5.93\times$ Continuous Margin** below 80A BMS                                  |
| **2. Verge Slope ($5.0^\circ$, $15\text{ km/h}$)** | $668.8\text{ W}$                           | $13.93\text{ A}$ ($3.44\text{ A/m}$)     | $356.0\text{ W}$ ($7.42\text{ A}$)   | **$21.35\text{ A}$**                     | $\mathbf{1,024.8\text{ W}}$                 | **$3.75\times$ Continuous Margin** below 80A BMS                                  |
| **3. Linear Accel ($1.389\text{ m/s}^2$)**         | $886.0\text{ W}$                           | $18.46\text{ A}$ ($4.63\text{ A/m}$)     | $356.0\text{ W}$ ($7.42\text{ A}$)   | **$25.88\text{ A}$**                     | $\mathbf{1,242.0\text{ W}}$                 | **$3.09\times$ Continuous Margin** (Transient $3.0\text{ s}$)                     |
| **4. In-Place Pivot ($R = 0\text{ m}$)**           | $2,831.6\text{ W}$                         | $58.99\text{ A}$ ($14.72\text{ A/m}$)    | $356.0\text{ W}$ ($7.42\text{ A}$)   | **$66.41\text{ A}$**                     | $\mathbf{3,187.6\text{ W}}$                 | **$1.20\times$ Margin** below 80A cont. / **$1.81\times$ Margin** below 120A peak |

* Table 5.1 Note: The traction current figures ($6.07\text{ A}$, $13.93\text{ A}$, $18.46\text{ A}$, $58.99\text{ A}$) and corresponding electrical power estimates ($291.2\text{ W}$, $668.8\text{ W}$, $886.0\text{ W}$, $2,831.6\text{ W}$) are preserved strictly for preliminary design traceability. They reflect aggregate estimated motor stator phase currents rather than measured DC battery draw. The historical electrical power estimate was calculated by multiplying the summed estimated motor phase currents by the nominal $48\text{ V}$ supply voltage. This does not represent actual DC battery power consumption. Battery current and electrical input power remain unverified pending physical measurements with the flight battery pack.

<CardGrid :cols="3">

<Card tag="Continuous Mission Runtime">

Usable Energy ($85\%\text{ DoD}$): $960\text{ Wh} \times 0.85 = \mathbf{816.0\text{ Wh}}$<br> Nominal Sweep Power (Cruise + Vac + Aux): $\mathbf{647.2\text{ W}}$<br> **Mission Endurance: $t_{\text{run}} = \frac{816.0}{647.2} \approx \mathbf{1.26\text{ to } 1.35\text{ hours}}$**<br> Runway Coverage: At $15\text{ km/h}$, platform sweeps $\mathbf{18.9\text{ km}}$ per charge.

</Card>

<Card tag="BMS Transient Discharge Verification">

Peak Phase Current Sum: $\mathbf{66.41\text{ A}}$ ($58.99\text{ A traction phase} + 7.42\text{ A aux}$)<br> Duration: $< 2.0\text{ s}$ per micro-alignment turn<br> BMS Rating: **80A Continuous / 120A Peak ($10\text{ s}$)**<br> **Design Precaution: Even if phase currents were drawn directly from the DC bus, the aggregate peak demand remains below the BMS peak cutoff. Actual battery DC current under low-speed pivoting will be lower due to inverter PWM duty cycle, but remains unverified until battery testing.**

</Card>

<Card tag="Hardware Current Clamping (ZLAC8015D)">

CANopen Object `0x2038`: **$16.0\text{ A}$ phase clamp per channel**.<br> Max Traction Demand: $4 \times 16.0\text{ A} = \mathbf{64.0\text{ A}}$ bus equivalent.<br> Absolute Maximum Bus Draw: $64.0\text{ A} + 7.42\text{ A} = \mathbf{71.42\text{ A}}$<br> **Guarantees zero brownout risk even under full mechanical wheel jam**.

</Card>

</CardGrid>

:::

::: details Analytical braking distance and assumptions

#### Stopping-distance calculation and tire grip {#sec-braking}

<Badge type="danger" text="Safety Verification" />

To prevent collision with runway infrastructure or airside vehicles upon emergency obstacle detection by the 3D LiDAR, the stopping distance from full cruise speed ($15\text{ km/h} = 4.167\text{ m/s}$) is governed by dynamic normal load transfer and tire adhesion limits [\[14\]](./references.md#ref-14) and must be analytically bounded:

Assuming an asphalt friction coefficient $\mu = 0.80$ and regenerative dynamic braking deceleration $a_{\text{brake}} = 3.5\text{ m/s}^2$ (well below the tire skid limit $\mu g \approx 7.85\text{ m/s}^2$):

$$
d_{\text{stop}} = \frac{v^2}{2 \cdot a_{\text{brake}}} = \frac{(4.1667)^2}{2 \times 3.5} = \frac{17.361}{7.0} = \mathbf{2.48\text{ metres}}
$$

Accounting for combined 3D LiDAR detection latency ($50\text{ ms}$) and ROS 2 emergency stop CAN broadcast delay ($50\text{ ms}$), total perception-to-actuation reaction latency is $t_{\text{react}} \approx 100\text{ ms}$:

$$
d_{\text{total,stop}} = v \cdot t_{\text{react}} + d_{\text{stop}} = (4.1667 \times 0.10) + 2.48 = 0.42 + 2.48 = \mathbf{2.90\text{ metres}}
$$

The total emergency stopping distance of $2.90\text{ m}$ is maintained within the $3.5\text{ m}$ obstacle stop margin configured in the Nav2 local costmap footprint inflation layer.

:::

## 7. Limitations & Semester 2 Plan {#motor-future-work}

The preliminary chassis moved under an estimated 30 kg load at approximately 32 V, but we still need to test the completed FOD Hunter using the intended 48 V battery and the 65 kg design-load case. The planned checks are motor and driver voltage/current limits, encoder RPM, phase and bus current, turning calibration, temperature rise, acceleration, stopping distance and fail-safe response. Testing should start at low speed and increase gradually. The **15 km/h target** and calculated torque margins remain unverified.

[Read Hilbert's Semester 2 implementation plan →](./semester-2-plan.md)

<!-- #endregion report -->

[Hilbert's References →](./references.md) · [Steering Kinematics →](./steering-kinematics.md) · [Navigation →](./navigation.md)
