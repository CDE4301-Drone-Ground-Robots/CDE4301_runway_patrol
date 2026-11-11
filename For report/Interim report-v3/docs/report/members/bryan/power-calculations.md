---
title: "Detailed Power Calculations"
owner: "Bryan Ng"
outline: [2,3]
---
# Detailed Power Calculations

<!-- #region report -->

## System Power Consumption

The drivetrain power was estimated for four operating conditions. The mission-duration proportions and estimated power per motor are shown below.

| Operating condition | Mission duration (%) | Estimated electrical power (W) |
|---|---:|---:|
| Flat cruising | 80 | 78.48 |
| Incline driving (5°) | 10 | 165.12 |
| Acceleration | 5 | 222.14 |
| Zero-radius turning | 5 | 708.10 |

*Table 5.1: Estimated drivetrain power under different operating conditions, based on the interim presentation.*

The electrical power of a component is calculated using:

$$
P=VI
$$

where $P$ is electrical power (W), $V$ is operating voltage (V), and $I$ is current (A).

For an intermittently operated load, average power is estimated using its duty cycle $D$:

$$
P_{\text{avg}}=P\times D
$$

The weighted average drivetrain power is calculated from the operating-condition powers and their mission fractions:

$$
P_{\text{weighted}}=\sum_{i=1}^{n}P_iD_i
$$

Using the proportions in Table 5.1:

$$
P_{\text{weighted}}=(78.48\times0.80)+(165.12\times0.10)+(222.14\times0.05)+(708.10\times0.05)
$$

$$
P_{\text{weighted}}=125.808\text{ W}\approx125.8\text{ W per motor}
$$

The interim estimate reports total average system power of:

$$
P_{\text{system}}=2P_{\text{motor,weighted}}+P_{\text{collection,avg}}+P_{\text{aux,avg}}=611.36\text{ W}
$$

If the drivetrain term represents two motors, the implied collection and auxiliary contribution is:

$$
P_{\text{collection,avg}}+P_{\text{aux,avg}}=611.36-(2\times125.8)=359.76\text{ W}
$$

This remainder cannot be independently verified from the current information because the revised FOD collection load and its operating duty cycle are not specified. Therefore, 611.36 W is retained as a preliminary interim estimate, not a fully reconciled load calculation. The final budget must distinguish drivetrain, collection, computing, sensing and auxiliary loads and apply each load's actual duty cycle.

### Consolidated Subsystem Load Budget

A 48 V-class power bus is used to reduce current relative to a 24 V bus for the same power. Since resistive losses scale with current squared ($P_{\text{loss}}=I^2R$), reducing current can reduce wiring and connector losses, subject to suitable component ratings and protection.

| Subsystem / consumer | Operating voltage | Continuous current (nominal) | Peak inrush current | Nominal power | Peak power | Operational duty cycle |
|---|---|---:|---:|---:|---:|---|
| Dual hub motors (ZLLG80ASM25) via ZLAC8015D | 48 V DC | 12.66 A total | 31.00 A total | 1,000 W rated | 1,488 W calculated | 18.62% assumed |
| Industrial suction vacuum | 48 V assumed | 58.33 A | To be measured | 2,800 W | At least 2,800 W; surge TBD | Off in transit; 100% when active |
| Onboard laptop | Internal battery, independent of 48 V bus | 0 A from 48 V bus | 0 A from 48 V bus | 0 W from 48 V bus | 0 W from 48 V bus | Runs from internal battery |
| 12 V auxiliary rail (switch, fans, lights, tower) | 12 V / 5 V regulated | 3.77 A (12 V equivalent) | 6.30 A (12 V equivalent) | 45.21 W | 75.58 W | 50–100%, by component |
| 5 V logic rail (STM32 F446RE, UM980 GPS, CAN) | 5 V / 3.3 V regulated | 0.21 A (5 V equivalent) | 0.76 A (5 V equivalent) | 1.05 W | 3.93 W | 100% |
| DC-DC buck-converter inefficiencies (~8%) | 48 V input | 0.084 A (48 V) | 0.144 A (48 V) | 4.02 W | 6.91 W | 100% when rails are active |
| Total transit state (vacuum standby) | 48 V DC | Approximately 2.18 A average | Approximately 33.0 A simultaneous peak (estimated) | Approximately 104.6 W average | Approximately 1,574 W | Vacuum off; motors at assumed 18.62% duty |
| Peak active remediation (vacuum active) | 48 V DC | Approximately 81.2 A | At least 91.6 A | Approximately 3,898 W | At least 4,398 W (vacuum surge excluded) | Motors and vacuum fully active |

The transit and peak-active totals describe different operating states; neither is the same as the 611.36 W interim mission-average estimate. These figures and the vacuum assumptions require verification against measured loads and component datasheets.

### Power Distribution Architecture

The electrical schematic shows the high-current protection, dual hub-motor actuation, vacuum circuit and regulated rails for the onboard computer and sensors.

<Card>

<Figure src="../../../shared/assets/diagrams/electrical-diagram.svg" alt="Electrical power distribution diagram" />

</Card>

<CardGrid :cols="4">

<Card title="1. Primary 48 V Power &amp; Kill Loop">

The 48 V, 20 Ah LiFePO4 battery supplies the main power bus through a 100 A BMS, 100 A main fuse and 100 A kill switch. Power is distributed through individually fused circuits to the hub motors, vacuum and DC-DC converters. The kill switch provides emergency power isolation, while the BMS monitors battery conditions and protects against electrical faults.

</Card>

<Card title="2. 20 V Laptop Power Sub-Circuit">

A dedicated 48 V-to-20 V, 10 A buck converter supplies regulated power to the onboard laptop through a protected auxiliary circuit. The laptop handles ROS 2 processing, navigation and high-level control while communicating with the STM32 microcontroller. This separates computing power requirements from the high-current motor and vacuum circuits.

</Card>

<Card title="3. Direct-Drive Hub Motor Train">

Two 48 V ZLLG80ASM25 hub motors are controlled by the ZLAC8015D V4.2 dual-channel servo driver, supplied through a dedicated 50 A ANM fuse. The STM32 communicates with the driver via CAN bus to control motor speed and direction. The direct-drive configuration eliminates mechanical transmission components, reducing maintenance and improving drivetrain efficiency.

</Card>

<Card title="4. Automotive Vision &amp; Navigation">

Dedicated 12 V and 5 V buck converters supply regulated power to auxiliary electronics, sensors and the STM32 F446RE. The STM32 interfaces with the UM980 GPS and motor driver, while the onboard laptop processes navigation and perception data. Separate low-voltage rails support reliable sensor operation and reduce interference from high-power loads.

</Card>

</CardGrid>

### DC-DC Buck Regulation & Thermal Loss

[To be filled in]

## Energy Requirement & Battery Capacity

The required energy is calculated from the estimated average system power and selected 1.5-hour design duration:

$$
E_{\text{required}}=P_{\text{system}}\times t
$$

$$
E_{\text{required}}=611.36\times1.5=917.04\text{ Wh}
$$

The required battery capacity accounts for nominal voltage and the assumed allowable depth of discharge (DoD):

$$
C_{\text{required}}=
\frac{E_{\text{required}}}
{V_{\text{nominal}}\times DoD}
$$

Assuming a 51.2 V nominal voltage for a 16-series LiFePO4 battery (16 cells at 3.2 V nominal each) and an 80% DoD:

$$
C_{\text{required}}=
\frac{917.04}{51.2\times0.8}
=22.39\text{ Ah}
$$

Approximately 22.39 Ah is therefore required for the 1.5-hour design target under the 611.36 W average-load assumption. The battery's actual nominal voltage and cell configuration must be confirmed from its manufacturer documentation.

## Battery Chemistry Comparison

Four chemistries were considered using energy density, cycle life, thermal behaviour, discharge capability, mass and suitability for repeated UGV operation.

| Battery chemistry | Voltage / configuration considered | Cycle life (80% DoD) | Energy density | Thermal behaviour | Discharge capability | Engineering advantages and limitations |
|---|---|---:|---:|---|---|---|
| LiFePO4 | 48 V class; 51.2 V if 16S | 2,000–3,500 cycles | 100–130 Wh/kg | Comparatively low thermal-runaway risk; prior estimate reports onset above 270°C | 5C burst / 2C continuous (100 A BMS in prior estimate) | Good thermal stability and cycle life; lower energy density means greater mass for equivalent energy |
| Conventional Li-ion (NMC) | 48.1 V (13S) | 500–800 cycles | 160–220 Wh/kg | Requires careful electrical and thermal protection; prior estimate reports onset around 210°C | 3C–5C | Higher energy density and lower mass; thermal protection and management remain important |
| LiPo | 44.4 V (12S) | 300–500 cycles | 180–240 Wh/kg | More sensitive to mechanical damage and swelling; prior estimate reports onset around 150°C | 25C–50C | Lightweight packaging and high discharge capability in suitable designs; greater sensitivity to damage and swelling |
| Lead-acid (SLA / AGM) | 48 V (four 12 V batteries) | 300–400 cycles | 30–40 Wh/kg | Low thermal-runaway risk in the prior comparison | 1C | Established and relatively low initial cost; high mass and low usable energy density |

*Table 5.2: Preliminary comparison of battery chemistries and reported specifications.*

The numerical ranges above were present in the project comparison, but the project's reference list does not currently identify the sources or exact models behind them. They should be treated as indicative, unverified values—not manufacturer specifications—until supported by cited cell or battery datasheets. Battery characteristics vary by product, configuration and test conditions, so final comparison should use referenced specifications for the actual candidate packs.

LiFePO4 was selected provisionally for its thermal stability and cycle-life characteristics. Its lower energy density was considered an acceptable mass trade-off for a ground-based platform. Chemistry alone does not ensure safe operation; electrical protection, thermal management and secure mechanical mounting are also required.

## Final Battery Selection & Runtime

A 48 V-class, 20 Ah LiFePO4 battery was selected for the preliminary design. Assuming a 16S configuration with 51.2 V nominal voltage, its nominal energy is:

$$
E_{\text{nominal}}=51.2\times20=1024\text{ Wh}
$$

At the assumed 80% DoD, usable energy is:

$$
E_{\text{usable}}=1024\times0.8=819.2\text{ Wh}
$$

Using the estimated 611.36 W average system power, predicted runtime is:

$$
t=\frac{819.2}{611.36}\approx1.34\text{ hours}
$$

The 20 Ah selection is expected to exceed the minimum operating requirement of one hour under the current assumptions, but it does not meet the 1.5-hour design target. Achieving that target at the assumed load requires approximately 22.39 Ah at 51.2 V and 80% DoD. Battery capacity and runtime must be reassessed after measuring actual system consumption, particularly with the drivetrain and FOD collection mechanism operating together.

### Transit-Only Runtime Estimate

An earlier transit-only estimate assumes a 104.6 W average bus load, with the vacuum off and the motors at the assumed transit duty cycle. It uses a 48.0 V, 20 Ah battery assumption (960 Wh nominal and 768 Wh usable at 80% DoD), distinct from the 51.2 V basis used above:

$$
t_{\text{transit}}=\frac{768}{104.6}=7.34\text{ hours}
$$

At 10 km/h, that corresponds to an estimated 73.4 km of travel, or more than 18.3 sweeps of a 4 km runway. This is a transit-only estimate, not a prediction for the mixed mission represented by the 611.36 W average-system-power assumption. Confirm the battery's nominal voltage, usable energy and the transit-load estimate against manufacturer specifications and measurements before relying on this runtime.

### Battery Selection Summary

| Parameter | Preliminary selection |
|---|---|
| Battery chemistry | LiFePO4 |
| Marketed voltage class | 48 V |
| Assumed nominal voltage | 51.2 V (16S, subject to confirmation) |
| Capacity | 20 Ah |
| Nominal energy | 1024 Wh |
| Assumed usable energy | 819.2 Wh |
| Estimated average system power | 611.36 W |
| Predicted mixed-mission runtime | Approximately 1.34 hours |
| Minimum operating requirement | More than 1 hour |
| Design target | 1.5 hours |

The selected battery provides a preliminary balance between runtime, mass and electrical safety. Further testing and datasheet verification are required to confirm its discharge capability, usable energy and runtime under representative operating conditions.

<!-- #endregion report -->
