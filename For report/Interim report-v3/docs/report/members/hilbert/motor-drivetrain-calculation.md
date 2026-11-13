---
title: "4WD Motor & Drivetrain Sizing"
description: "Engineering requirements, first-principles drivetrain calculations, manufacturer data, and validation boundaries for the FOD Hunter four-hub-motor drivetrain."
owner: "Hilbert Soh"
outline: [2, 3]
---

# 4WD Motor & Drivetrain Sizing

**Hilbert Soh · Motor and drivetrain calculations**

> **Test status:** The 65 kg mass, 263 mm wheels and 15 km/h speed are design inputs. The 32 V bench test does not establish performance at the intended 48 V supply.

<!-- #region report -->

## 4.4.1 Objectives & Requirements {#motor-objectives}

The powertrain was sized from first principles for a **65.0 kg gross vehicle mass (fully laden)** utilizing four **263 mm outer diameter wheels** at a target operational sprint velocity of **15.0 km/h ($4.17\text{ m/s}$)**. Four operating regimes were evaluated: level aerodynamic cruising, slope climbing on a $5.0^\circ$ taxiway shoulder embankment, dynamic acceleration ($0\text{–}15\text{ km/h}$ in $3.0\text{ s}$), and in-place zero-radius skid-steer pivoting, supplemented by a $15.0^\circ$ drainage culvert check.

In-place pivoting represents the sizing load case, where lateral tire scrubbing against high-friction tarmac ($\mu_{\text{skid}} = 0.80$) governs peak shaft torque requirements.

::: details Full design assumptions and requirements

#### Design inputs and operating requirements {#sec-1-requirements}

<Badge type="info" text="System Constraints" />

Drivetrain sizing incorporates aerodrome sweeping requirements derived from FAA AC 150/5220-24 [\[2\]](./references.md#ref-2) and pavement surface friction standards from ASTM D5340-20 [\[1\]](./references.md#ref-1). Operating at $15.0\text{ km/h}$ ($4.17\text{ m/s}$) enables rapid sweeping of active $3,000\text{ m}$ runway corridors within $15\text{–}20\text{ minute}$ air traffic control separation windows, with an acceleration budget of $t_{\text{acc}} = 3.0\text{ s}$.

<Card>

**Selected drivetrain: four direct-drive hub motors**

The physical drivetrain utilizes **four ZLLG80ASM250 hub motors** and **two ZLAC8015D dual-channel drivers**. Low-level CANopen communication was established over a 500 kbps CAN bus, allocating one driver per axle to control two motors independently. Direct-drive hub motors eliminate gearbox backlash, mechanical transmission wear, and differential maintenance. Full-load validation at nominal 48 V supply is scheduled for Semester 2.

</Card>

| Parameter                                       | Design Value                                                | Engineering Justification & Airfield Operating Context                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Gross Vehicle Mass ($m$)**                    | **$65.0\text{ kg}$** (Fully Laden)                          | Worst-case sizing mass: includes 6061-T6 chassis ($18\text{ kg}$), 48V 20Ah battery ($12\text{ kg}$), vacuum turbine & bin ($15\text{ kg}$), sensors & computer stack ($5\text{ kg}$), and 4 hub drive units ($15\text{ kg}$).                                                                                                             |
| **Drive Architecture ($N$)**                    | **4 Independent Hub Motors (4WD)**                          | Four-wheel independent skid-steer control. Tractive driving force is distributed across 4 direct-drive motors, reducing individual continuous motor loading.                                                                                                                                                                               |
| **Wheel Outer Diameter ($D$) & Radius ($r$)**   | **$D = 263\text{ mm}$**, **$r = 0.1315\text{ m}$**          | 10-inch all-terrain tubeless pneumatic tire mounted on ZLLG80 hub. Matches firmware macro `ROBOT_WHEEL_RADIUS_MM = 131.5f`.                                                                                                                                                                                                                |
| **Design Cruise Velocity ($v$)**                | **$15.0\text{ km/h}$** ($4.167\text{ m/s}$)                 | Authoritative target speed enabling rapid sweep of active $3,000\text{ m}$ runway corridors within 15–20 minute air traffic control intervals.                                                                                                                                                                                             |
| **Required Wheel Speed ($N_{\text{req}}$)**     | **$302.6\text{ RPM}$** at $15\text{ km/h}$                  | Direct kinematic conversion: $N = \frac{60 \cdot v}{\pi \cdot D} = \frac{60 \times 4.1667}{\pi \times 0.263} = 302.58\text{ RPM}$.                                                                                                                                                                                                         |
| **Motor No-Load Speed ($N_{\text{no-load}}$)**  | **$415.6\text{ RPM}$** ($20.59\text{ km/h}$)                | Factory rating of ZLLG80ASM250 hub motor at 48V. Provides a verified **calculated $1.373\times$ no-load speed ratio** ($37.3\%$ above required RPM) over cruise speed.                                                                                                                                                                     |
| **Design Incline Angle ($\theta$)**             | **$5.0^\circ$** (Verge) / **$15.0^\circ$** (Ramp)           | Airside runways have $<1.5^\circ$ cross-fall; $5.0^\circ$ ($8.7\%$) represents taxiway shoulder embankment verges, while $15.0^\circ$ represents drainage culvert access ramps.                                                                                                                                                            |
| **Design Acceleration ($a_{\text{des}}$)**      | **$1.389\text{ m/s}^2$** ($t_{\text{acc}} = 3.0\text{ s}$)  | Accelerates from standstill to $15\text{ km/h}$ in $3.0\text{ seconds}$ to clear runway active areas ($F_{\text{acc}} = 90.28\text{ N}$).                                                                                                                                                                                                  |
| **Rolling Resistance Coefficient ($C_{rr}$)**   | **$0.025$**                                                 | Pneumatic rubber tires on dry grooved airport asphalt pavement at nominal pressure ($2.5\text{ bar}$).                                                                                                                                                                                                                                     |
| **Aerodynamic Drag Area ($C_d \cdot A$)**       | **$0.28\text{ m}^2$** ($C_d = 0.80$, $A = 0.35\text{ m}^2$) | Effective drag area based on frontal area $A = 0.35\text{ m}^2$ and a conservative drag coefficient $C_d = 0.80$ for the blunt chassis, LiDAR mast, and intake ducting (yielding $2.93\text{ N}$ at $15\text{ km/h}$; a baseline $C_d = 0.70$ would give $2.56\text{ N}$). Air density $\rho = 1.204\text{ kg/m}^3$ at $20^\circ\text{C}$. |
| **Tarmac Scrub Friction ($\mu_{\text{skid}}$)** | **$0.80$**                                                  | Coulomb lateral friction coefficient baseline for dry grooved airport asphalt following Gillespie (1992) [\[14\]](./references.md#ref-14) and pavement condition survey context from ASTM D5340-20 [\[1\]](./references.md#ref-1).                                                                                                         |
| **Drivetrain Efficiency ($\eta$)**              | **$0.85$** ($85\%$)                                         | Direct-drive configuration: zero gearbox mesh friction. Factor accounts for motor inverter switching, stator copper/iron losses, and tire carcass dissipation.                                                                                                                                                                             |

:::

<span id="sec-2-overview"></span>

## 4.4.2 Drivetrain Architecture {#motor-architecture}

The physical powertrain comprises **four direct-drive BLDC hub motors (ZLTECH ZLLG80ASM250)** driven by **two dual-channel FOC servo drivers (ZLAC8015D)**. Independent four-wheel drive eliminates mechanical differentials, gearboxes, and steering linkages. Low-level velocity control and CANopen CiA 402 communication (500 kbps) were implemented on an STM32F446RE MCU (Gabriel), validating multi-motor synchronization on a preliminary test chassis under laboratory supply conditions ($32\text{ V}$, $10.4\text{ A}$ limit).

<Figure src="./assets/images/motor-and-driver.jpg" alt="Purchased ZLLG80ASM250 hub motors and ZLAC8015D dual-channel servo driver" caption="Figure 4.4.1: Purchased drivetrain hardware showing ZLTECH ZLLG80ASM250 hub motors with 263 mm pneumatic tyres and ZLAC8015D dual-channel servo driver." />

**Wiring and CAN interface:** The 48 V power distribution, STM32 CAN interface and dual ZLAC8015D drivers are shown in [Figure 4.4.6](#sec-power-bus). Wiring-harness photographs will be added after hardware assembly.

The detailed geometric justification for choosing skid steering over Ackermann and Mecanum configurations is documented in [Steering Kinematics →](./steering-kinematics.md). The team-wide battery, DC conversion and auxiliary load budget belongs in Bryan's Electrical documentation.

::: details Selected motor and driver specifications

#### Selected motor and driver specifications {#sec-trade-study}

<Badge type="info" text="Hardware Bill of Materials" />

Four direct-drive BLDC hub motors were selected to eliminate gearbox backlash and complex steering linkages. The kinematic steering trade study is detailed in [Steering Kinematics](./steering-kinematics.md):

<CardGrid :cols="2">

<Card title="4x ZLTECH ZLLG80ASM250 Direct-Drive Hub Motors">

- **Rated Voltage:** $48.0\text{ V DC}$ (Operational range $36 - 60\text{V}$).
- **Rated Speed:** $300\text{ RPM}$ ($\approx 14.87\text{ km/h}$ on $263\text{ mm}$ tire at rated continuous torque).
- **Speed Suitability & Limitations:** The $15.0\text{ km/h}$ design target requires approximately $302.6\text{ RPM}$, slightly above the manufacturer's nominal rated speed of $300\text{ RPM}$. The manufacturer's reported no-load speed of $415.6\text{ RPM}$ at $48\text{V}$ suggests that $302.6\text{ RPM}$ may be achievable under light cruise loading ($0.73\text{ Nm}$ torque), but this has not been tested on the vehicle. Loaded vehicle speed under airfield conditions has not been measured.
- **No-Load Speed:** $415.6\text{ RPM}$ ($\approx 20.6\text{ km/h}$, **$1.373\times$ speed margin**), from the manufacturer's 48 V load test (Report FA2201060003).
- **Continuous Rated Torque:** $15.0\text{ Nm}$ (stated rating; to be confirmed against the manufacturer's datasheet, which is not yet on file).
- **Peak Torque:** $28.50\text{ Nm}$, the "Max Torque" point of the manufacturer's 48 V load test (**$1.806\times$** the $15.78\text{ Nm}$ design allowance).
- **Pivot duty:** The $13.42\text{ Nm}$ shaft torque is within the continuous rating. The $15.78\text{ Nm}$ design allowance is 5% above it, so pivots are treated as short transients. Motor temperature during repeated pivots has not been tested.
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

Direct-drive motors avoid gearbox backlash. Wheel-speed reversal is still limited by motor torque, controller response and tyre traction; it does not guarantee accurate odometry or positioning.

</Card>

:::

## 4.4.3 Design Methodology & Selection {#motor-methodology}

The drivetrain was developed across four progressive engineering stages:

1. **Stage 1 — Analytical Sizing:** Motor torque and speed requirements were estimated from first principles using an assumed $65.0\text{ kg}$ gross vehicle mass, $263\text{ mm}$ wheels, and an assumed $0.80$ stance ratio ($L/B$).
2. **Stage 2 — Hardware Selection:** Analytical sizing yielded required shaft torques of $0.73\text{ Nm}$ for level cruise, $2.88\text{ Nm}$ for a $5.0^\circ$ incline, $4.22\text{ Nm}$ for linear acceleration, and $15.78\text{ Nm}$ for in-place pivoting (assuming $\eta = 0.85$). Consequently, four direct-drive ZLLG80ASM250 hub motors ($15.0\text{ Nm}$ continuous, $28.5\text{ Nm}$ peak) and two ZLAC8015D dual-channel FOC drivers were procured.
3. **Stage 3 — Embedded Firmware Validation:** STM32 motor control firmware and CANopen communication were developed (Gabriel). Low-voltage ground testing under an estimated $30\text{ kg}$ load powered by a bench supply ($32\text{ V}$, $10.4\text{ A}$ limit, `USE_POWER_PRESET_3`, clamped to $25\text{ RPM}$) validated forward/reverse motion, speed control, and multi-motor coordination.
4. **Stage 4 — Semester 2 Physical Validation:** Characterization of full-load torque at $65.0\text{ kg}$, incline climbing, tarmac pivoting, and loaded $15.0\text{ km/h}$ cruising with the production $48\text{ V}$ battery pack will be conducted in Semester 2.

## 4.4.4 Engineering Calculations {#motor-calculations}

Motor torque was evaluated across four operating cases using the design baseline ($65.0\text{ kg}$ mass, $263\text{ mm}$ wheels, $L/B = 0.80$, $\mu_{\text{skid}} = 0.80$, $\eta = 0.85$). Results yield **0.73 N·m per motor** for level cruising, **2.88 N·m** for a 5° incline, **4.22 N·m** for acceleration ($0\text{–}15\text{ km/h}$ in $3\text{ s}$), and **15.78 N·m** for an in-place pivot. **In-place pivoting represents the sizing case.**

| Calculated case        | Shaft torque per motor | Preliminary design torque ($\eta = 0.85$) | Interpretation                                        |
| ---------------------- | ---------------------: | ----------------------------------------: | ----------------------------------------------------- |
| Flat cruising, 15 km/h |               0.62 N·m |                                  0.73 N·m | Low longitudinal road load                            |
| 5° incline, 15 km/h    |               2.45 N·m |                                  2.88 N·m | Grade resistance dominates                            |
| 0–15 km/h in 3 s       |               3.59 N·m |                                  4.22 N·m | Short-duration acceleration load                      |
| Zero-radius pivot      |              13.42 N·m |                                 15.78 N·m | Sizing case; sensitive to tire scrub and stance ratio |

::: details Wheel-speed derivation and tire-size comparison

#### Kinematic Velocity & Wheel Rotational Speed (RPM) Derivation

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

I estimated the total tractive force $F_{\text{total}}$ from rolling resistance, drag, grade and acceleration [\[13\]](./references.md#ref-13), [\[14\]](./references.md#ref-14). In the **4WD independent hub motor architecture ($N = 4$)**, total tractive force and driving yaw torque are distributed across four wheels. Shaft torque demanded from each individual motor is:

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

> **Aerodynamic drag assumption:** At 15 km/h, $C_d = 0.70$ and $A = 0.35\text{ m}^2$ give $F_{\text{aero}} = 2.56\text{ N}$. I used $C_d = 0.80$ for the exposed chassis and intake components, giving $C_d A = 0.28\text{ m}^2$ and $F_{\text{aero}} = 2.93\text{ N}$. This changes the cruise torque by about $0.01\text{ N\cdot m}$ per motor.

$$
F_{\text{total}} = F_{rr} + F_{aero} = 15.94 + 2.93 = \mathbf{18.87\text{ N}}
$$

$$
\tau_{\text{motor}} = \frac{18.87 \times 0.1315}{4 \times 0.85} = \mathbf{0.73\text{ Nm per motor}}
$$

![Case 1 Straight Flat Cruising FBD](./assets/diagrams/motor-fbd-case1-cruise.svg)

*Figure 4.4.2: Case 1 free-body diagram (flat cruising).*

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

![Case 2 Incline Slope Climbing FBD](./assets/diagrams/motor-fbd-case2-slope.svg)

*Figure 4.4.3: Case 2 free-body diagram (slope climbing).*

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

![Case 3 Linear Acceleration FBD](./assets/diagrams/motor-fbd-case3-accel.svg)

*Figure 4.4.4: Case 3 free-body diagram (dynamic acceleration).*

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

![Case 4 Zero Radius Turn 4WD FBD](./assets/diagrams/motor-fbd-case4-pivot.svg)

*Figure 4.4.5: Case 4 free-body diagram (zero-radius skid-steer pivot).*

#### Summary of calculated drivetrain loads

| Operating Case                                             | Total Force / Moment       | Shaft Torque ($\tau_{\text{shaft}}$) | Design Torque ($\eta = 0.85$) | DC Input Current per Motor (48 V test curve) |  Sum of 4 Motors | Mechanical Output ($P_{\text{mech}} = F v$)                             | Motor Headroom Margin                               |
| ---------------------------------------------------------- | -------------------------- | -----------------------------------: | ----------------------------: | -------------------------------------------: | ---------------: | ----------------------------------------------------------------------- | --------------------------------------------------- |
| **Case 1: Flat Cruising** ($15\text{ km/h}$)               | $F = 18.87\text{ N}$       |                     $0.62\text{ Nm}$ |          **$0.73\text{ Nm}$** |                              $1.64\text{ A}$ |  $6.56\text{ A}$ | $78.6\text{ W}$ ($19.7\text{ W per motor}$)                             | <Badge type="tip" text="20.5x Continuous Margin" /> |
| **Case 2: Slope Climbing** ($5.0^\circ$, $15\text{ km/h}$) | $F = 74.44\text{ N}$       |                     $2.45\text{ Nm}$ |          **$2.88\text{ Nm}$** |                              $3.44\text{ A}$ | $13.76\text{ A}$ | $310.2\text{ W}$ ($77.5\text{ W per motor}$)                            | <Badge type="tip" text="5.2x Continuous Margin" />  |
| **Case 3: Linear Acceleration** ($1.389\text{ m/s}^2$)     | $F = 109.15\text{ N}$      |                     $3.59\text{ Nm}$ |          **$4.22\text{ Nm}$** |                              $4.63\text{ A}$ | $18.52\text{ A}$ | $454.8\text{ W}$ ($113.7\text{ W per motor}$)                           | <Badge type="info" text="6.75x Peak Margin" />      |
| **Case 4: Zero-Radius Pivot** ($R = 0\text{ m}$)           | $M_s = 255.06 L\text{ Nm}$ |                    $13.42\text{ Nm}$ |         **$15.78\text{ Nm}$** |                             $14.72\text{ A}$ | $58.87\text{ A}$ | Depends on pivot yaw rate (not part of the original sizing assumptions) | <Badge type="danger" text="1.81x Peak Headroom" />  |

> **Note on current values:** The currents are **DC input currents per motor, interpolated from the manufacturer's 48 V load-test data** for the ZLLG80ASM250-4096 (Shenzhen Zhongling Technology, Report FA2201060003, 35 test points) at each case's design torque. They are not measured on FOD Hunter, and they are not motor phase currents. On the test curve the motor runs at the speeds below, which differ from FOD Hunter's operating speeds (302.6 rpm for Cases 1–2; about 25 rpm at the wheels during a 1 rad/s pivot). The pivot value is therefore not the battery current of a low-speed pivot, which will be lower. The test current already includes motor losses, so reading it at the 15.78 N·m design torque (which also includes the 85% allowance) is conservative; at the 13.42 N·m shaft torque the test curve gives 12.6 A.
>
> | Case |    Torque | Test-curve speed | DC input current | DC input power |
> | :--- | --------: | ---------------: | ---------------: | -------------: |
> | 1    |  0.73 N·m |          409 rpm |           1.64 A |         72.8 W |
> | 2    |  2.88 N·m |          388 rpm |           3.44 A |        167.2 W |
> | 3    |  4.22 N·m |          377 rpm |           4.63 A |        221.5 W |
> | 4    | 15.78 N·m |          264 rpm |          14.72 A |        707.9 W |

<Badge type="warning" text="Interactive 3D Simulation" /> <Badge type="info" text="Vehicle Dynamics • 4 Operating Scenarios" />

> [!IMPORTANT]
> **Simulation model:** The 3D viewer uses the AgileX Scout 2.0, not the final FOD Hunter chassis. Its dimensions and dynamics are not a physical validation of the drivetrain calculations.

<MotorDrivetrainCalculationWidget4 />

:::

## 4.4.5 Testing & Results {#motor-testing}

### 4.4.5.1 Preliminary Loaded Ground Test {#sec-ground-test}

Preliminary physical validation was conducted on a mobile test chassis operating under an estimated 30 kg payload powered by a laboratory bench power supply ($32\text{ V}$, $10.4\text{ A}$ current limit, `USE_POWER_PRESET_3`, clamped to 25 RPM in firmware). The evaluation confirmed bi-directional ground motion, variable-speed command execution, and synchronous four-wheel coordination via CANopen. Shaft torque measurement, 48 V nominal bus operation, and full 65 kg payload testing will be performed in Semester 2.

Gabriel implemented the STM32 motor-control firmware and CANopen driver communication; the first-principles motor-sizing derivations and architectural specifications are Hilbert's contribution.

| Test item                | Evidence and outcome                                                                |
| ------------------------ | ----------------------------------------------------------------------------------- |
| Supply                   | Approximately 32 V; about 10 A current limit (firmware preset specifies 10.4 A)     |
| Load                     | Estimated 30 kg total on a preliminary moving chassis; not a calibrated measurement |
| Direction control        | Forward and reverse ground movement demonstrated                                    |
| Speed control            | Variable-speed operation demonstrated; 25 RPM configured command ceiling            |
| Four-motor control       | Both ZLAC8015D drivers operated four motors together                                |
| Motor torque and current | No measured shaft torque or motor phase-current dataset available                   |
| Full design conditions   | 48 V, 65 kg design mass, 15 km/h speed and peak pivot torque not tested             |

<VideoClip
  src="./assets/videos/30 kg load, powered by the 32 V bench supply.MOV"
  poster="./assets/images/posters/motor-ground-test-poster.jpg"
  caption="Video 4.4.1: Preliminary four-motor loaded ground test demonstrating forward and reverse drive under ~30 kg load with a 32 V / 10.4 A DC bench supply."
/>

The bench evaluation confirms low-level CANopen actuator control and four-wheel driving synchronization on a mobile chassis. However, verification of calculated full-load continuous torque, acceleration rates, slope climbing, and 15.0 km/h cruising awaits installation of the 48 V production battery pack.

## 4.4.6 Engineering Discussion {#motor-discussion}

Under the Coulomb friction model ($\mu_{\text{skid}} = 0.80$), **zero-radius in-place pivoting constitutes the primary mechanical sizing case** ($15.78\text{ Nm}$ preliminary design torque, $13.42\text{ Nm}$ required shaft torque). Lateral tire scrubbing, driver phase current limits, and stator thermal dissipation govern actuator selection. On reduced-friction surfaces (such as wet asphalt, $\mu \approx 0.55$), required pivoting torque diminishes proportionally.

### 4.4.6.1 Distinction Between Phase Current and Battery DC Current {#sec-phase-dc-current}

Five different current and power quantities appear in this chapter:

1. **Manufacturer test-curve input:** DC current and power measured by the manufacturer at 48 V, at the speed the motor reaches for each torque on its load test (table in Section 4). These are the only manufacturer electrical values used.
2. **Calculated mechanical demand:** force × vehicle speed for each FOD Hunter case ($P_{\text{mech}} = F v$; 78.6 W, 310.2 W and 454.8 W for Cases 1–3).
3. **Estimated vehicle bus demand:** the preliminary budget below sums the four motors' test-curve input power and divides by 48 V. For the pivot: $4 \times 707.9\text{ W} = 2{,}831.6\text{ W}$, and $2{,}831.6 / 48 = 58.99\text{ A}$. Adding the four rounded per-motor currents gives a slightly different total ($4 \times 14.72\text{ A} = 58.88\text{ A}$). Both describe the motor delivering 15.78 N·m at 264 rpm on the test curve, not the electrical power of a low-speed pivot.
4. **Motor-driver phase current:** the AC current that produces motor torque. It has not been measured.
5. **Actual battery current:** depends on wheel speed, driver losses and the auxiliary loads. During a low-speed pivot it will be well below the test-curve value. It will be measured with Bryan's 48 V pack.

::: details Preliminary power-bus calculations — to be reconciled with the electrical design

> **Note:** This is the preliminary electrical budget. Its traction figures are the manufacturer test-curve input powers (Section 6, item 3), and its auxiliary load assumes a **250 W DC vacuum blower**. The vacuum design is still developing: the current concept uses an AC motor that may need its own battery and inverter, and its power requirement is not confirmed (Asuka's sizing estimates 0.9–1.1 kW; Bryan's BOM lists a 2,800 W unit). The runtime and BMS figures below depend on the original 250 W assumption and will be reconciled with Bryan's electrical design, which is the reference for battery, DC-DC and BMS specifications.

#### Electrical Power Bus, BMS Discharge Capacity & Auxiliary Load Sizing {#sec-power-bus}

<Badge type="warning" text="48V LiFePO4 Bus" />

The preliminary FOD Hunter electrical architecture uses a shared **48 V-class LiFePO4 bus** ($51.2\text{ V}$ nominal for a 16S pack, $42.0\text{ V}$ cut-off) powered by a $20.0\text{ Ah}$ lithium iron phosphate pack ($960\text{ Wh}$ energy capacity). The bus concurrently feeds two major branches: (1) the **4WD Traction Powertrain** via dual ZLAC8015D servo drives, and (2) the **Airside Auxiliary Subsystems** (~$350\text{ W}$ continuous):

![48V Power Distribution Architecture](./assets/diagrams/motor-power-distribution.svg)

*Figure 4.4.6: 48V DC electrical power bus & CAN architecture.*

#### Auxiliary Subsystem Electrical Allocations (~350 W Continuous)

<CardGrid :cols="3">

<Card tag="Direct 48V">

**Airside Vacuum (preliminary assumption)**

Original allowance for a DC blower fan. The current vacuum concept differs (see note above).<br> **Power:** $\approx 250.0\text{ W continuous}$ (assumed)<br> **Current:** $\mathbf{5.20\text{ A}}$ at $48.0\text{ V}$

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

**Table 4.4.1: Total mission electrical bus budget across operating conditions.**

| Mission Operational Regime                         | 4WD Traction Power ($P_{\text{traction}}$) | Traction Bus Current ($I_{\text{trac}}$)      | Auxiliary Systems ($P_{\text{aux}}$) | Total 48V Bus Current ($I_{\text{bus}}$) | Total Electrical Power ($P_{\text{total}}$) | BMS Capacity & Safety Headroom                                                    |
| -------------------------------------------------- | ------------------------------------------ | --------------------------------------------- | ------------------------------------ | ---------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------- |
| **1. Nominal Cruise ($15\text{ km/h}$)**           | $291.2\text{ W}$                           | $6.07\text{ A}$ ($1.54\text{ A per motor}$)   | $356.0\text{ W}$ ($7.42\text{ A}$)   | **$13.49\text{ A}$**                     | $\mathbf{647.2\text{ W}}$                   | **$5.93\times$ Continuous Margin** below 80A BMS                                  |
| **2. Verge Slope ($5.0^\circ$, $15\text{ km/h}$)** | $668.8\text{ W}$                           | $13.93\text{ A}$ ($3.44\text{ A per motor}$)  | $356.0\text{ W}$ ($7.42\text{ A}$)   | **$21.35\text{ A}$**                     | $\mathbf{1,024.8\text{ W}}$                 | **$3.75\times$ Continuous Margin** below 80A BMS                                  |
| **3. Linear Accel ($1.389\text{ m/s}^2$)**         | $886.0\text{ W}$                           | $18.46\text{ A}$ ($4.63\text{ A per motor}$)  | $356.0\text{ W}$ ($7.42\text{ A}$)   | **$25.88\text{ A}$**                     | $\mathbf{1,242.0\text{ W}}$                 | **$3.09\times$ Continuous Margin** (Transient $3.0\text{ s}$)                     |
| **4. In-Place Pivot ($R = 0\text{ m}$)**           | $2,831.6\text{ W}$                         | $58.99\text{ A}$ ($14.72\text{ A per motor}$) | $356.0\text{ W}$ ($7.42\text{ A}$)   | **$66.41\text{ A}$**                     | $\mathbf{3,187.6\text{ W}}$                 | **$1.20\times$ Margin** below 80A cont. / **$1.81\times$ Margin** below 120A peak |

- Table 4.4.1 note: Traction power is 4 × the manufacturer test-curve input power for each case; traction current is that power ÷ 48 V. These are test-curve values at the speeds listed in Section 4, not predicted battery current. The pivot row describes the motor delivering 15.78 N·m at 264 rpm and overstates the demand of a low-speed pivot. Battery current has not been measured.

<CardGrid :cols="3">

<Card tag="Continuous Mission Runtime">

Usable Energy ($85\%\text{ DoD}$): $960\text{ Wh} \times 0.85 = \mathbf{816.0\text{ Wh}}$<br> Nominal Sweep Power (Cruise + Vac + Aux): $\mathbf{647.2\text{ W}}$<br> **Mission Endurance: $t_{\text{run}} = \frac{816.0}{647.2} \approx \mathbf{1.26\text{ hours}}$** (original 250 W vacuum and test-curve cruise assumptions)<br> Runway Coverage: At $15\text{ km/h}$, platform sweeps $\mathbf{18.9\text{ km}}$ per charge.

</Card>

<Card tag="BMS Transient Discharge Verification">

Peak Bus Estimate (test-curve pivot point): $\mathbf{66.41\text{ A}}$ ($58.99\text{ A traction} + 7.42\text{ A aux}$)<br> Duration: $< 2.0\text{ s}$ per micro-alignment turn (assumed)<br> BMS Rating: **80A Continuous / 120A Peak ($10\text{ s}$)** (preliminary)<br> This estimate uses the test-curve pivot point, which overstates a low-speed pivot. Actual battery current has not been measured.

</Card>

<Card tag="Proposed Current Limit (ZLAC8015D)">

**Proposed:** a $16.0\text{ A}$ per-channel motor current limit through the driver's CANopen parameters (object `0x2038`, to be confirmed against the driver manual). It is **not yet configured** in the STM32 firmware.<br> If applied: $4 \times 16.0\text{ A} = 64.0\text{ A}$ motor-side limit; $64.0\text{ A} + 7.42\text{ A} = 71.42\text{ A}$ upper estimate. A motor current limit is not the same as a battery current limit.<br> Bus current during a wheel jam has not been measured.

</Card>

</CardGrid>

:::

::: details Analytical braking distance and assumptions

#### Stopping-distance calculation and tire grip {#sec-braking}

<Badge type="warning" text="Analytical Estimate" />

Analytical stopping distance from the target cruise velocity ($15.0\text{ km/h} = 4.167\text{ m/s}$) is governed by dynamic normal load transfer and tire adhesion limits [\[14\]](./references.md#ref-14):

Assuming an asphalt friction coefficient $\mu = 0.80$ and regenerative dynamic braking deceleration $a_{\text{brake}} = 3.5\text{ m/s}^2$ (well below the tire skid limit $\mu g \approx 7.85\text{ m/s}^2$):

$$
d_{\text{stop}} = \frac{v^2}{2 \cdot a_{\text{brake}}} = \frac{(4.1667)^2}{2 \times 3.5} = \frac{17.361}{7.0} = \mathbf{2.48\text{ metres}}
$$

Assuming $50\text{ ms}$ for LiDAR detection and $50\text{ ms}$ for the ROS 2 stop command to reach the drivers over CAN, the reaction time is $t_{\text{react}} \approx 100\text{ ms}$. Both latencies are assumptions; a 10 Hz LiDAR scan alone can add up to $100\text{ ms}$:

$$
d_{\text{total,stop}} = v \cdot t_{\text{react}} + d_{\text{stop}} = (4.1667 \times 0.10) + 2.48 = 0.42 + 2.48 = \mathbf{2.90\text{ metres}}
$$

This is an analytical estimate. The Nav2 simulation configuration uses a 1.20 m inflation radius and a 0.5 s collision-monitor approach polygon; no stop margin has been set to match this distance, and braking distance has not been tested.

:::

## 4.4.7 Limitations & Semester 2 Plan {#motor-future-work}

While preliminary low-voltage bench trials validated low-level actuator control under partial load, rigorous characterization of the fully integrated FOD Hunter prototype under full design conditions ($65.0\text{ kg}$, $48.0\text{ V}$ nominal bus) constitutes the primary Semester 2 focus. Planned experimental evaluations encompass driver current profiling, empirical wheel-slip calibration, thermal rise during prolonged scrubbing, acceleration response, stopping distance under emergency braking, and verification of the target $15.0\text{ km/h}$ cruise velocity.

[Read Hilbert's Semester 2 implementation plan →](./semester-2-plan.md)

<!-- #endregion report -->

[Hilbert's References →](./references.md) · [Steering Kinematics →](./steering-kinematics.md) · [Navigation →](./navigation.md)
