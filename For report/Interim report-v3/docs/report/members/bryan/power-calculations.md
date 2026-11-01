---
title: "Detailed Power Calculations"
owner: "Bryan Ng"
outline: [2,3]
---
# Detailed Power Calculations

<!-- #region report -->

<!-- Report summary (the Report's section text). The detailed write-up follows. -->

## 📦 Master Electrical & Hardware Component List (BOM)

A complete catalogue of 35 hardware components—spanning power storage, safety cut-offs, high-power drivers, microcontrollers, camera sensors, and auxiliary converters—has been specified and procured for the FOD Hunter UGV platform.

<CardGrid :cols="2">

<Card>

Total Acquired Items

35 Components

</Card>

<Card>

Primary Architecture

48V LiFePO4 Bus

</Card>

</CardGrid>

## ⚡ 4.2.1 Power Calculations & System Load Budget (48V Architecture)

Adopting a **48V nominal power bus** (rather than 24V) is an essential architectural decision: doubling the system voltage halves the current required to deliver equivalent wattage ($P = V \times I$). This drastically suppresses resistive heat generation ($P_{\text{loss}} = I^2 R$) across wiring and connectors, enabling the safe operation of the 2800W vacuum and high-torque ZLLG80 hub motors within an 8 AWG wire harness.

| Subsystem / Consumer | Operating Voltage | Continuous Current (Nominal) | Peak Inrush Current | Nominal Power | Peak Power | Operational Duty Cycle |
| --- | --- | --- | --- | --- | --- | --- |
| **Dual Hub Motors (ZLLG80ASM25) via ZLAC8015D** | 48 V DC | 12.66 A total | 31.00 A total | 1,000 W rated | 1,488 W calculated | 18.62% assumed |
| **2800W Industrial Suction Vacuum** | 48 V assumed | 58.33 A | \[To be filled in\] | 2,800 W | &gt;= 2,800 W; surge TBC | 0% transit; 100% active |
| **Hilbert's Laptop (UGV Onboard Compute)** | Internal battery (independent of 48V bus) | 0 A (Independent) | 0 A (Independent) | 0 W (48 V bus) | 0 W (48 V bus) | 100% (Runs on internal battery; 0A from 48V) |
| **12V Auxiliary Rail (Switch, Fans, Lights, Tower)** | 12 V / 5 V regulated | 3.77 A (12 V equivalent) | 6.30 A (12 V equivalent) | 45.21 W | 75.58 W | 50 - 100% by component |
| **5V Logic Rail (STM32 F446RE, UM980 GPS, CAN)** | 5 V / 3.3 V regulated | 0.21 A (5 V equivalent) | 0.76 A (5 V equivalent) | 1.05 W | 3.93 W | 100% |
| **DC-DC Buck Converter Inefficiencies (~8%)** | 48 V input | 0.084 A (48 V) | 0.144 A (48 V) | 4.02 W | 6.91 W | 100% when rails active |
| **TOTAL TRANSIT STATE (Vacuum Standby)** | **48 V DC** | **≈2.18 A average** | **≈33.0 A (estimated simultaneous peak)** | **≈104.6 W average** | **≈1,574 W** | **Vacuum off; motors 18.62% assumed** |
| **PEAK ACTIVE REMEDIATION (Full Vacuum Active)** | **48 V DC** | **≈81.2 A** | **&gt;= 91.6 A** | **≈3,898 W** | **&gt;= 4,398 W (vacuum surge excluded)** | **Motors and vacuum fully active** |

<CardGrid :cols="3">

<Card title="1. Usable Energy Storage (48V 20Ah)" accent="blue">

Calculated for an 80% Depth of Discharge (DoD) margin on the 48V 20Ah LiFePO4 pack:

<Card accent="purple">

E\_gross = 48.0V × 20Ah = 960.0 Wh<br> E\_usable = 960 Wh × 0.80 = 768.0 Wh

</Card>

</Card>

<Card title="2. Transit Patrol Runtime" accent="emerald">

Continuous patrolling at ≥10 km/h with vacuum in standby (104.6W avg drawn from 48V bus):

<Card accent="emerald">

t\_transit = 768.0 Wh / 104.6 W = 7.34 hours<br> t\_transit = 441 minutes continuous runtime

</Card>

</Card>

<Card title="3. Airfield Patrol Distance" accent="purple">

Total runway sweep distance per single charge cycle at 10 km/h:

<Card accent="blue">

D\_patrol = 10 km/h × 7.34 h = 73.4 km<br> Runway Coverage = &gt; 18.3 full sweeps of 4 km runway

</Card>

</Card>

</CardGrid>

## 🔋 4.2.2 Battery Chemistry Selection & Airfield Safety

The presence of aviation turbine kerosene (Jet A-1) along active runways imposes strict safety constraints. Traditional Lithium Polymer (LiPo) cells decompose violently with self-sustaining oxygen generation if damaged. **Lithium Iron Phosphate (LiFePO4)** was selected for its non-combustible cathode chemistry.

| Battery Chemistry | Nominal Voltage | Cycle Life (80% DoD) | Energy Density | Thermal Runaway Risk | Max Continuous Discharge | Selection Status |
| --- | --- | --- | --- | --- | --- | --- |
| **48V LiFePO4 (Lithium Iron Phosphate)** | **48.0 V** (51.2V Float) | **2,000 – 3,500 cycles** | 100 – 130 Wh/kg | <Badge type="tip" text="Extremely Low (Thermal onset >270°C)" /> | 5C Burst / 2C Cont (100A BMS) | **SELECTED:** Inherent fire safety, long cycle life, high current capability for 2800W vacuum. |
| **LiPo (Lithium Polymer)** | 44.4 V (12S) | 300 – 500 cycles | 180 – 240 Wh/kg | <Badge type="danger" text="Severe Hazard (∼150°C thermal runaway)" /> | 25C – 50C | **REJECTED:** Catastrophic fire risk on airside tarmac; poor life cycle durability. |
| **Li-ion NMC (18650 / 21700)** | 48.1 V (13S) | 500 – 800 cycles | 160 – 220 Wh/kg | <Badge type="warning" text="Moderate Risk (∼210°C)" /> | 3C – 5C | **REJECTED:** Requires complex liquid thermal management; volatile decomposition. |
| **Lead-Acid (SLA / AGM)** | 48.0 V (4x 12V) | 300 – 400 cycles | 30 – 40 Wh/kg | <Badge type="tip" text="Negligible" /> | 1C | **REJECTED:** Excessive weight (&gt;35 kg penalty), destroys payload allowance and climbing torque. |

## 🔌 4.2.3 System Wiring Diagram & Electrical Architecture (48V Architecture)

The electrical schematic integrates high-current protection (100A main fuse, 100A kill switch, ANM fuse box), dual hub motor actuation, the 2800W vacuum circuit, and multi-rail buck regulation to power Hilbert's laptop and sensors:

<Card>

<Figure src="../../../shared/assets/diagrams/electrical-diagram.svg" alt="Diagram" />

</Card>

<CardGrid :cols="4">

<Card title="1. Primary 48V Power &amp; Kill Loop">

The 48V 20Ah LiFePO₄ battery supplies the main power bus through a 100A BMS, 100A main fuse and 100A kill switch. Power is distributed through individually fused circuits to the hub motors, vacuum and DC-DC converters. The kill switch provides emergency power isolation, while the BMS monitors battery conditions and protects against electrical faults.

</Card>

<Card title="2. 20V Laptop Power Sub-Circuit">

A dedicated 48V-to-20V, 10A buck converter supplies regulated power to Hilbert's onboard laptop through a protected auxiliary circuit. The laptop handles ROS 2 processing, navigation and high-level control while communicating with the STM32 microcontroller. This separates computing power requirements from the high-current motor and vacuum circuits.

</Card>

<Card title="3. Direct-Drive Hub Motor Train">

Two 48V ZLLG80ASM25 hub motors are controlled by the ZLAC8015D V4.2 dual-channel servo driver, supplied through a dedicated 50A ANM fuse. The STM32 communicates with the driver via CAN bus to control motor speed and direction. The direct-drive configuration eliminates mechanical transmission components, reducing maintenance and improving drivetrain efficiency.

</Card>

<Card title="4. Automotive Vision &amp; Navigation">

Dedicated 12V and 5V buck converters supply regulated power to auxiliary electronics, sensors and the STM32 F446RE. The STM32 interfaces with the UM980 GPS and motor driver, while the onboard laptop processes navigation and perception data. Separate low-voltage rails support reliable sensor operation and reduce interference from high-power loads.

</Card>

</CardGrid>


## Subsystem Power Consumption Breakdown

\[To be filled\]

## DC-DC Buck Regulation & Thermal Loss

\[To be filled\]

## Battery Capacity & Runtime Verification

\[To be filled\]

<!-- #endregion report -->
