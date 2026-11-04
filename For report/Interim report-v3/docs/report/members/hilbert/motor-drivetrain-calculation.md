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

We based the drivetrain calculations on the runway FOD collection requirements and relevant pavement guidance (FAA AC 150/5220-24 [\[2\]](./references.md#ref-2); ASTM D5340-20 [\[1\]](./references.md#ref-1)). The design assumes travel speeds of up to $15\text{ km/h}$ ($4.167\text{ m/s}$) to sweep an active $3,000\text{ m}$ runway in under $20\text{ minutes}$, rapid acceleration ($t_{\text{acc}} = 3.0\text{ s}$), and sustained torque over runway drainage verges.

<Card>

**Selected drivetrain: four direct-drive hub motors**

The design uses **one hub motor per wheel** and **two ZLAC8015D dual-channel drivers**. The documented control arrangement uses CANopen (STM32 CAN1 at $500\text{ kbps}$), with one driver for each axle. Hub motors avoid a separate gearbox and mechanical differential. The actual wiring and controller configuration still need confirmation.

</Card>

| Parameter                                       | Design Value                                                      | Engineering Justification & Airfield Operating Context                                                                                                                                                                         |
| ----------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Gross Vehicle Mass ($m$)**                    | **$65.0\text{ kg}$** (Fully Laden)                                | Worst-case sizing mass: includes 6061-T6 chassis ($18\text{ kg}$), 48V 20Ah battery ($12\text{ kg}$), vacuum turbine & bin ($15\text{ kg}$), sensors & computer stack ($5\text{ kg}$), and 4 hub drive units ($15\text{ kg}$). |
| **Drive Architecture ($N$)**                    | **4 Independent Hub Motors (4WD)**                               | Four-wheel independent skid-steer control. Tractive driving force is distributed across 4 direct-drive motors, reducing individual continuous motor loading.                                                                   |
| **Wheel Outer Diameter ($D$) & Radius ($r$)**   | **$D = 263\text{ mm}$**, **$r = 0.1315\text{ m}$**               | 10-inch all-terrain tubeless pneumatic tire mounted on ZLLG80 hub. Matches firmware macro `ROBOT_WHEEL_RADIUS_MM = 131.5f`.                                                                                                    |
| **Design Cruise Velocity ($v$)**                | **$15.0\text{ km/h}$** ($4.167\text{ m/s}$)                      | Authoritative target speed enabling rapid sweep of active $3,000\text{ m}$ runway corridors within 15–20 minute air traffic control intervals.                                                                                 |
| **Required Wheel Speed ($N_{\text{req}}$)**     | **$302.6\text{ RPM}$** at $15\text{ km/h}$                       | Direct kinematic conversion: $N = \frac{60 \cdot v}{\pi \cdot D} = \frac{60 \times 4.1667}{\pi \times 0.263} = 302.58\text{ RPM}$.                                                                                             |
| **Motor No-Load Speed ($N_{\text{no-load}}$)**  | **$415.6\text{ RPM}$** ($20.59\text{ km/h}$)                      | Factory rating of ZLLG80ASM250 hub motor at 48V. Provides a verified **$1.373\times$ speed margin** ($37.3\%$ reserve) over cruise speed.                                                                                      |
| **Design Incline Angle ($\theta$)**             | **$5.0^\circ$** (Verge) / **$15.0^\circ$** (Ramp)                | Airside runways have $<1.5^\circ$ cross-fall; $5.0^\circ$ ($8.7\%$) represents taxiway shoulder embankment verges, while $15.0^\circ$ represents drainage culvert access ramps.                                                |
| **Design Acceleration ($a_{\text{des}}$)**      | **$1.389\text{ m/s}^2$** ($t_{\text{acc}} = 3.0\text{ s}$)       | Accelerates from standstill to $15\text{ km/h}$ in $3.0\text{ seconds}$ to clear runway active areas with urgency ($F_{\text{acc}} = 90.28\text{ N}$).                                                                         |
| **Rolling Resistance Coefficient ($C_{rr}$)**   | **$0.025$**                                                       | Pneumatic rubber tires on dry grooved airport asphalt pavement at nominal pressure ($2.5\text{ bar}$).                                                                                                                         |
| **Aerodynamic Drag Area ($C_d \cdot A$)**       | **$0.28\text{ m}^2$** ($C_d = 0.80$, $A = 0.35\text{ m}^2$)      | Blunt frontal profile of chassis, LiDAR mast, and cyclonic vacuum intake hood. Air density $\rho = 1.204\text{ kg/m}^3$ at $20^\circ\text{C}$.                                                                                 |
| **Tarmac Scrub Friction ($\mu_{\text{skid}}$)** | **$0.80$**                                                        | Coulomb friction coefficient during lateral tire scrubbing in in-place zero-radius turns on textured runway asphalt.                                                                                                           |
| **Drivetrain Efficiency ($\eta$)**              | **$0.85$** ($85\%$)                                               | Direct-drive configuration: zero gearbox mesh friction. Factor accounts for motor inverter switching, stator copper/iron losses, and tire carcass dissipation.                                                                 |

:::

## 2. Drivetrain Architecture {#motor-architecture}

We selected **four ZLLG80ASM250 hub motors** and **two ZLAC8015D dual-channel drivers**. Each wheel is driven independently, so no mechanical differential or steering linkage is needed. An STM32 controller is planned to send motor commands. We still need to confirm the final wiring and driver settings on the assembled UGV.

**[Add photograph M1 — Show the actual hub motor and ZLAC8015D driver, with labels identifying the model and connector interfaces.]**

**M6 — Motor-driver wiring and CAN communications:** Documented in [Figure 4.5 — 48V Power Distribution Architecture](#sec-power-sizing), illustrating the 48V power distribution, STM32 CAN interface, and dual ZLAC8015D drivers. Physical wiring harness photography is preserved as pending hardware assembly.

The detailed geometric justification for choosing skid steering over Ackermann and Mecanum configurations is documented in [Steering Kinematics →](./steering-kinematics.md). The team-wide battery, DC conversion and auxiliary load budget belongs in Bryan's Electrical documentation.

::: details Selected motor and driver specifications

#### Selected motor and driver specifications {#sec-trade-study}

<Badge type="info" text="Hardware Bill of Materials" />

Rather than employing conventional brushed DC motors, omnidirectional Mecanum drive (US Patent 3,876,255, Ilon, 1975 [\[16\]](./references.md#ref-16); RobotPlatform.com, 2024 [\[17\]](./references.md#ref-17)), or BLDC motors paired with multi-stage planetary gearboxes (which suffer from mechanical backlash, seal leakage, gear tooth shear under vibration, and abrasive aggregate ingestion), the platform adopts **Four Direct-Drive BLDC Hub Motors**:

<CardGrid :cols="2">

<Card title="4x ZLTECH ZLLG80ASM250 Direct-Drive Hub Motors">

- **Rated Voltage:** $48.0\text{ V DC}$ (Operational range $36 - 60\text{V}$).
- **Rated Speed:** $300\text{ RPM}$ ($\approx 15.0\text{ km/h}$ on $263\text{ mm}$ tire).
- **No-Load Speed:** $415.6\text{ RPM}$ ($\approx 20.6\text{ km/h}$, **$1.373\times$ speed margin**).
- **Continuous Rated Torque:** $15.0\text{ Nm}$ (thermal rating without overheating).
- **Peak Stall Torque:** $28.50\text{ Nm}$ (**$1.806\times$ peak torque headroom** over $15.78\text{ Nm}$).
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

We calculated the required wheel speed and torque, then compared them with the manufacturer's motor data. Direct-drive hubs simplify the drivetrain, but the motors must provide wheel torque without gear reduction. At **15 km/h**, the **263 mm** wheel requires **302.6 RPM**. The supplier reports **415.6 RPM no-load at 48 V**. This indicates a theoretical speed margin, not proof that the UGV can reach 15 km/h under load.

The main calculations use **65 kg, 263 mm wheels and 15 km/h**. Earlier notes used **40 kg, 200 mm and 10 km/h**; those figures should only be shown as an earlier design iteration if the project records confirm it.

## 4. Engineering Calculations {#motor-calculations}

We calculated motor torque for four operating cases using the stated mass, wheel size, friction and efficiency assumptions. The results are **0.73 N·m per motor** for level cruising, **2.88 N·m** for a 5° incline, **4.22 N·m** for acceleration to 15 km/h in 3 s, and **15.78 N·m** for an in-place pivot. **Pivoting requires the most torque** in this model. These are calculated values, not physical test results.

| Calculated case        | Shaft torque per motor | Interpretation                                                 |
| ---------------------- | ---------------------: | -------------------------------------------------------------- |
| Flat cruising, 15 km/h |               0.73 N·m | Low longitudinal road load                                     |
| 5° incline, 15 km/h    |               2.88 N·m | Grade resistance dominates                                     |
| 0–15 km/h in 3 s       |               4.22 N·m | Short-duration acceleration load                               |
| Zero-radius pivot      |              15.78 N·m | Highest calculated torque; sensitive to tire scrub assumptions |

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

| Tire Size Spec                                   | Diameter ($D$)                               | Radius ($r$)                                  | Required RPM at $15\text{ km/h}$               | Obstacle Crossing & Trade-off Evaluation                                                                                                               |
| ------------------------------------------------ | -------------------------------------------- | --------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| $105\text{ mm}$ Micro Tire                       | $0.105\text{ m}$                             | $0.0525\text{ m}$                             | $758\text{ RPM}$                               | Poor obstacle clearance, exceeds standard BLDC hub speed ratings.                                                                                      |
| $6\text{ inch} / 152\text{ mm}$                  | $0.152\text{ m}$                             | $0.076\text{ m}$                              | $524\text{ RPM}$                               | Low ground clearance, excessive rolling resistance over runway grooving.                                                                               |
| $8\text{ inch} / 200\text{ mm}$                  | $0.200\text{ m}$                             | $0.100\text{ m}$                              | $398\text{ RPM}$                               | Moderate clearance, high RPM requirement leaves narrow margin below no-load.                                                                           |
| **$10.35\text{ in} / 263\text{ mm}$ (Selected)** | **$0.263\text{ m}$**                         | **$0.1315\text{ m}$**                         | **$302.6\text{ RPM}$**                         | **Selected:** Provides $45\text{ mm}$ ground clearance, crossings over tarmac seams, and generous $1.373\times$ speed margin below $415.6\text{ RPM}$. |
| $12\text{ inch} / 300\text{ mm}$                 | $0.300\text{ m}$                             | $0.150\text{ m}$                              | $265\text{ RPM}$                               | Increases wheel moment arm, requiring higher torque and raising chassis CG.                                                                            |
| $16\text{ inch} / 406\text{ mm}$                 | $0.406\text{ m}$                             | $0.203\text{ m}$                              | $196\text{ RPM}$                               | Excessive wheel inertia and packaging penalty for compact airside chassis.                                                                             |

::: tip Speed Headroom Verification
The ZLLG80 hub motor delivers a no-load speed of $415.6\text{ RPM}$ ($20.59\text{ km/h}$). Operating at $302.6\text{ RPM}$ provides a **$1.373\times$ speed margin** ($37.3\%$ reserve), but does not confirm loaded cruise speed when battery bus voltage settles from $51.2\text{V}$ down to nominal $48.0\text{V}$.
:::

:::

::: details Full force, torque and four-case free-body calculations

#### Tractive effort and four operating cases {#sec-2-resistance}

<Badge type="info" text="Dynamic Force Sizing" />

The total tractive effort $F_{\text{total}}$ required at the road contact patches derives from longitudinal vehicle dynamics and rolling contact mechanics (Siegwart et al., 2011 [\[14\]](./references.md#ref-14); Gillespie, 1992 [\[15\]](./references.md#ref-15)). In our **4WD independent hub motor architecture ($N = 4$)**, total tractive force and driving yaw torque are distributed across four wheels. Shaft torque demanded from each individual motor is:

$$
\tau_{\text{motor}} = \frac{F_i \cdot r}{\eta} = \frac{F_{\text{total}} \cdot r}{N \cdot \eta} = \frac{F_{\text{total}} \cdot 0.1315}{4 \times 0.85} = \frac{F_{\text{total}} \cdot 0.1315}{3.40} = \mathbf{0.038676 \cdot F_{\text{total}}}
$$

#### Case 1: Straight Flat Cruising at $15\text{ km/h}$ ($4.167\text{ m/s}$)

Governed by rolling resistance on dry runway asphalt and aerodynamic drag:

$$
F_{rr} = m \cdot g \cdot C_{rr} = 65.0 \times 9.81 \times 0.025 = \mathbf{15.94\text{ N}}
$$

$$
F_{aero} = \frac{1}{2}\rho \cdot C_d \cdot A \cdot v^2 = 0.5 \times 1.204 \times 0.80 \times 0.35 \times (4.1667)^2 = \mathbf{2.93\text{ N}}
$$

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

When executing an in-place pivot, all four tires must shear laterally across dry textured tarmac ($\mu_{\text{skid}} = 0.80$). This represents the maximum mechanical torque and peak electrical current demand on the powertrain:

$$
F_{\text{skid}} = m \cdot g \cdot \mu_{\text{skid}} = 65.0 \times 9.81 \times 0.80 = \mathbf{510.12\text{ N}}
$$

$$
F_{y,i} = \frac{F_{\text{skid}}}{4} = \mathbf{127.53\text{ N per wheel}}
$$

$$
M_{\text{scrub}} = 4 \times \left(F_{y,i} \cdot \frac{L}{2}\right) = 2 \times 127.53 \cdot L = \mathbf{255.06 \cdot L\text{ Nm}}
$$

$$
M_{\text{drive}} = 4 \times \left(F_x \cdot \frac{B}{2}\right) = 2 F_x \cdot B
$$

Equating driving yaw moment to resisting scrub moment ($M_{\text{drive}} = M_{\text{scrub}}$) at stance ratio $L/B = 0.80$:

$$
2 F_x \cdot B = 255.06 \cdot L \implies F_x = 127.53 \cdot \left(\frac{L}{B}\right) = 127.53 \times 0.80 = \mathbf{102.02\text{ N per wheel}}
$$

Reflecting required tractive force into motor shaft torque with radius $r = 0.1315\text{ m}$ and $\eta = 0.85$:

$$
\tau_{\text{motor}} = \frac{F_x \cdot r}{\eta} = \frac{102.02 \times 0.1315}{0.85} = \mathbf{15.7838\text{ Nm}} \approx \mathbf{15.78\text{ Nm per motor}}
$$

FIGURE 3.4 • CASE 4 FREE-BODY DIAGRAM (ZERO-RADIUS SKID-STEER PIVOT)

![Case 4 Zero Radius Turn 4WD FBD](./assets/diagrams/motor-fbd-case4-pivot.svg)

#### Summary of calculated drivetrain loads

| Operating Case                                             | Total Force / Moment       | Torque / Motor ($\tau_m$)                                 | Motor Phase Current ($I_m$) | Total 4-Motor Bus Current | Mechanical Output ($P_{\text{mech}}$) | Motor Headroom Margin                                              |
| ---------------------------------------------------------- | -------------------------- | --------------------------------------------------------- | --------------------------- | ------------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| **Case 1: Flat Cruising** ($15\text{ km/h}$)               | $F = 18.87\text{ N}$       | **$0.73\text{ Nm}$**                                      | $1.64\text{ A}$             | $6.56\text{ A}$           | $78.6\text{ W}$ ($19.7\text{ W/m}$)   | <Badge type="tip" text="20.5x Continuous Margin" />                |
| **Case 2: Slope Climbing** ($5.0^\circ$, $15\text{ km/h}$) | $F = 74.44\text{ N}$       | **$2.88\text{ Nm}$**                                      | $3.44\text{ A}$             | $13.76\text{ A}$          | $310.2\text{ W}$ ($77.5\text{ W/m}$)  | <Badge type="tip" text="5.2x Continuous Margin" />                 |
| **Case 3: Linear Acceleration** ($1.389\text{ m/s}^2$)     | $F = 109.15\text{ N}$      | **$4.22\text{ Nm}$**                                      | $4.63\text{ A}$             | $18.52\text{ A}$          | $454.8\text{ W}$ ($113.7\text{ W/m}$) | <Badge type="info" text="6.75x Peak Margin" />                     |
| **Case 4: Zero-Radius Pivot** ($R = 0\text{ m}$)           | $M_s = 255.06 L\text{ Nm}$ | **$15.78\text{ Nm}$**                                     | $14.72\text{ A}$            | $58.87\text{ A}$          | $499.7\text{ W}$ (Peak transient)     | <Badge type="danger" text="1.81x Peak Headroom" />                 |

<Badge type="warning" text="Interactive 3D Simulation" /> <Badge type="info" text="Vehicle Dynamics • 4 Operating Scenarios" />

Visual Platform: **AgileX Scout 2.0 Simulation Proxy**

<MotorDrivetrainCalculationWidget4 />

:::

## 5. Testing & Results {#motor-testing}

The team's available bench supply is limited to **32 V and 10 A (320 W nominal maximum)**, rather than the proposed 48 V battery. Full-speed, maximum-torque, loaded pivot and thermal endurance tests therefore remain unverified. Before further testing, confirm that the exact driver/motor combination supports the proposed bench voltage and current-limited operating conditions.

**[Add video M7 — Existing physical motor bench demonstration: show power-supply settings, motor direction/speed response and driver commands. State what was actually tested.]**

**[Add test evidence M8, if available — Photograph or short log of the 32 V / 10 A supply and measured motor RPM/current. Do not create a full-voltage performance graph from limited-supply data.]**

## 6. Engineering Discussion {#motor-discussion}

The analysis suggests that **low-speed pivoting may impose a larger torque demand than straight-line travel**. This makes skid-steer tire scrub, driver current limits and motor heating important design risks.

Motor **phase current** must not be treated as identical to **DC battery-bus current**. The source contains tables that mix current and power assumptions; these require reconciliation with actual driver data and Bryan's authoritative electrical budget before any claim about battery capacity, brownout immunity or endurance is finalized.

::: details Historical power-bus calculations — requires electrical-team reconciliation

> **Review note:** The following source calculations are preserved for traceability, not approved as the final electrical design. Confirm voltage, battery chemistry, current definitions, auxiliary loads and BMS ratings with Bryan before using these values as verified system specifications. See the Electrical section of the main Report for the canonical power architecture.

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

| Mission Operational Regime                         | 4WD Traction Power ($P_{\text{traction}}$) | Traction Bus Current ($I_{\text{trac}}$) | Auxiliary Systems ($P_{\text{aux}}$) | Total 48V Bus Current ($I_{\text{bus}}$)                  | Total Electrical Power ($P_{\text{total}}$) | BMS Capacity & Safety Headroom                                                    |
| -------------------------------------------------- | ------------------------------------------ | ---------------------------------------- | ------------------------------------ | --------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------- |
| **1. Nominal Cruise ($15\text{ km/h}$)**           | $291.2\text{ W}$                           | $6.07\text{ A}$ ($1.54\text{ A/m}$)      | $356.0\text{ W}$ ($7.42\text{ A}$)   | **$13.49\text{ A}$**                                      | $\mathbf{647.2\text{ W}}$                   | **$5.93\times$ Continuous Margin** below 80A BMS                                  |
| **2. Verge Slope ($5.0^\circ$, $15\text{ km/h}$)** | $668.8\text{ W}$                           | $13.93\text{ A}$ ($3.44\text{ A/m}$)     | $356.0\text{ W}$ ($7.42\text{ A}$)   | **$21.35\text{ A}$**                                      | $\mathbf{1,024.8\text{ W}}$                 | **$3.75\times$ Continuous Margin** below 80A BMS                                  |
| **3. Linear Accel ($1.389\text{ m/s}^2$)**         | $886.0\text{ W}$                           | $18.46\text{ A}$ ($4.63\text{ A/m}$)     | $356.0\text{ W}$ ($7.42\text{ A}$)   | **$25.88\text{ A}$**                                      | $\mathbf{1,242.0\text{ W}}$                 | **$3.09\times$ Continuous Margin** (Transient $3.0\text{ s}$)                     |
| **4. In-Place Pivot ($R = 0\text{ m}$)**           | $2,831.6\text{ W}$                         | $58.99\text{ A}$ ($14.72\text{ A/m}$)    | $356.0\text{ W}$ ($7.42\text{ A}$)   | **$66.41\text{ A}$**                                      | $\mathbf{3,187.6\text{ W}}$                 | **$1.20\times$ Margin** below 80A cont. / **$1.81\times$ Margin** below 120A peak |

<CardGrid :cols="3">

<Card tag="Continuous Mission Runtime">

Usable Energy ($85\%\text{ DoD}$): $960\text{ Wh} \times 0.85 = \mathbf{816.0\text{ Wh}}$<br> Nominal Sweep Power (Cruise + Vac + Aux): $\mathbf{647.2\text{ W}}$<br> **Mission Endurance: $t_{\text{run}} = \frac{816.0}{647.2} \approx \mathbf{1.26\text{ to } 1.35\text{ hours}}$**<br> Runway Coverage: At $15\text{ km/h}$, platform sweeps $\mathbf{18.9\text{ km}}$ per charge.

</Card>

<Card tag="BMS Transient Discharge Verification">

Peak Pivot Current: $\mathbf{66.41\text{ A}}$ ($58.99\text{ A traction} + 7.42\text{ A aux}$)<br> Duration: $< 2.0\text{ s}$ per micro-alignment turn<br> BMS Rating: **80A Continuous / 120A Peak ($10\text{ s}$)**<br> **Verdict: Safe with $1.81\times$ margin below peak BMS cutoff**.

</Card>

<Card tag="Hardware Current Clamping (ZLAC8015D)">

CANopen Object `0x2038`: **$16.0\text{ A}$ phase clamp per channel**.<br> Max Traction Demand: $4 \times 16.0\text{ A} = \mathbf{64.0\text{ A}}$ bus equivalent.<br> Absolute Maximum Bus Draw: $64.0\text{ A} + 7.42\text{ A} = \mathbf{71.42\text{ A}}$<br> **Guarantees zero brownout risk even under full mechanical wheel jam**.

</Card>

</CardGrid>

:::

::: details Analytical braking distance and assumptions

#### Stopping-distance calculation and tire grip {#sec-braking}

<Badge type="danger" text="Safety Verification" />

To prevent collision with runway infrastructure or airside vehicles upon emergency obstacle detection by the 3D LiDAR, the stopping distance from full cruise speed ($15\text{ km/h} = 4.167\text{ m/s}$) is governed by dynamic normal load transfer and tire adhesion limits (Gillespie, 1992 [\[15\]](./references.md#ref-15)) and must be analytically bounded:

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

We still need to test the drivetrain on the physical FOD Hunter using the final battery and power system. The planned checks are motor and driver voltage/current limits, encoder RPM, phase and bus current, turning calibration, temperature rise, acceleration, stopping distance and fail-safe response. Testing should start at low speed and increase gradually. The **15 km/h target** and calculated torque margins remain unverified.

[Read Hilbert's Semester 2 implementation plan →](./semester-2-plan.md)

<!-- #endregion report -->

[Hilbert's References →](./references.md) · [Steering Kinematics →](./steering-kinematics.md) · [Navigation →](./navigation.md)
