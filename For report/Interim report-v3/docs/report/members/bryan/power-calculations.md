---
title: "Detailed Power Calculations"
owner: "Bryan Ng"
outline: [2,3]
---
# Detailed Power Calculations

<!-- #region report -->

<!-- Report summary (the Report's section text). The detailed write-up follows. -->
## Power Calculations & System Load Budget (48V Architecture)

The power requirements of the drivetrain were estimated under four operating conditions: flat cruising, incline driving, acceleration and zero-radius turning.

These conditions were assigned different proportions of the mission duration to obtain a weighted average power consumption.

| Operating condition | Mission duration (%) | Estimated electrical power (W) |
|---|---:|---:|
| Flat cruising | 80 | 78.48 |
| Incline driving (5°) | 10 | 165.12 |
| Acceleration | 5 | 222.14 |
| Zero-radius turning | 5 | 708.10 |

*Table 5.1: Estimated drivetrain power under different operating conditions*

The electrical power of a component is calculated using:

$$
P=VI
$$

where:

- $P$ = electrical power (W)
- $V$ = operating voltage (V)
- $I$ = current (A)

For loads operating intermittently, the average power is estimated using:

$$
P_{\text{avg}}=P\times D
$$

where $D$ represents the duty cycle of operating time.

The weighted average power is obtained from:

$$
P_{\text{weighted}}=\sum_{i=1}^{n}P_iD_i
$$

The calculations report a weighted drivetrain power of approximately 125.8 W per motor and an estimated total system power of:

$$
\boxed{P_{\text{system}}=611.36\text{ W}}
$$

This value forms the basis of the preliminary battery-sizing calculations.

**Calculation limitation:** The power budget must be updated to reflect the revised FOD collection mechanism and its actual operating duty cycle. The final calculation should also distinguish drivetrain power from the consumption of the computing, sensing and auxiliary systems.

### Energy Requirement

The required energy is calculated from the estimated average system power and operating duration:

$$
E_{\text{required}}=P_{\text{system}}\times t
$$

For a 1.5-hour operating duration:

$$
E_{\text{required}}=611.36\times1.5
$$

$$
\boxed{E_{\text{required}}=917.04\text{ Wh}}
$$

This represents the estimated energy consumption over the selected design duration, assuming the average system power remains at 611.36 W.

### Battery Capacity Calculation

The required battery capacity was determined by considering the energy demand, nominal battery voltage and allowable depth of discharge (DoD).

The calculation follows:

$$
C_{\text{required}}=
\frac{E_{\text{required}}}
{V_{\text{nominal}}\times DoD}
$$

A nominal voltage of 51.2 V was used for the calculation, corresponding to a typical 16-series LiFePO4 battery configuration with a nominal cell voltage of 3.2 V.

Using an assumed DoD of 80%:

$$
C_{\text{required}}=
\frac{917.04}{51.2\times0.8}
$$

$$
\boxed{C_{\text{required}}=22.39\text{ Ah}}
$$

The calculation indicates that approximately 22.39 Ah would be required to achieve the 1.5-hour design target under the estimated average load.

#### Selected Battery Capacity

A 48 V-class, 20 Ah LiFePO4 battery was selected for the preliminary design.

Assuming the selected battery uses a 16S configuration, its nominal energy capacity is:

$$
E_{\text{nominal}}=51.2\times20
$$

$$
E_{\text{nominal}}=1024\text{ Wh}
$$

At 80% DoD:

$$
E_{\text{usable}}=1024\times0.8
$$

$$
E_{\text{usable}}=819.2\text{ Wh}
$$

The estimated operating duration is therefore:

$$
t=\frac{819.2}{611.36}
$$

$$
\boxed{t\approx1.34\text{ hours}}
$$

The selected capacity is expected to satisfy the minimum operating requirement of more than one hour under the current power assumptions. However, it does not meet the full 1.5-hour design target.

The battery capacity will be reassessed after measuring the actual system power consumption, particularly during simultaneous drivetrain and FOD collection operation.

### Electrical & Hardware Component List (BOM)

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

Adopting a **48V nominal power bus** (rather than 24V) is an essential architectural decision: doubling the system voltage halves the current required to deliver equivalent wattage ($P = V \times I$). This reduces resistive heat generation ($P_{\text{loss}} = I^2 R$) across wiring and connectors, supporting the operation of the 2800W vacuum and high-torque ZLLG80 hub motors within an 8 AWG wire harness.

### Subsystem Load Budget

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

### Transit-Only Runtime and Patrol-Distance Estimate

The following estimate uses the earlier transit-state load of 104.6 W, with the vacuum off and the motors operating at the assumed transit duty cycle. It is a transit-only estimate and is not directly comparable to the 611.36 W average system-power assumption used for the battery-sizing calculations above. For consistency with this earlier estimate, the cards use a 48.0 V bus assumption (960 Wh nominal and 768 Wh usable at 80% DoD); the battery-sizing calculation above instead assumes a 51.2 V, 16S battery (1024 Wh nominal and 819.2 Wh usable). Confirm the battery's actual nominal voltage and configuration against its manufacturer's specifications.

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

## Battery Chemistry Selection & Airfield Safety

The presence of aviation turbine kerosene (Jet A-1) along active runways makes battery thermal stability and electrical protection important design considerations. LiFePO4 was selected for its comparatively good thermal stability and cycle-life characteristics.

### Battery Chemistry Comparison

Four battery chemistries were considered: lithium iron phosphate (LiFePO4), conventional lithium-ion, lithium polymer (LiPo) and lead-acid. The comparison considers energy density, thermal stability, operating life and suitability for the UGV. Values are preliminary comparison data; the selected battery's manufacturer specifications should be checked before final design.

| Battery chemistry | Voltage / configuration | Cycle life (80% DoD) | Energy density | Thermal stability / risk | Discharge capability | Advantages | Limitations and selection |
|---|---|---|---|---|---|---|---|
| LiFePO4 | 48 V class; 51.2 V nominal if 16S (to be confirmed) | 2,000–3,500 cycles | 100–130 Wh/kg | Relatively low thermal-runaway risk; thermal onset reported above 270°C | 5C burst / 2C continuous (100 A BMS) | Good thermal stability, long cycle life and repeated-charge suitability; selected for the preliminary design and high-current loads | Lower energy density than many conventional lithium-ion chemistries, resulting in greater mass for equivalent stored energy |
| Li-ion NMC | 48.1 V (13S) | 500–800 cycles | 160–220 Wh/kg | Moderate risk; thermal-runaway temperature reported around 210°C | 3C–5C | High energy density and lower mass for equivalent stored energy | Requires careful electrical and thermal protection; rejected in the preliminary comparison due to thermal-management and volatility concerns |
| LiPo | 44.4 V (12S) | 300–500 cycles | 180–240 Wh/kg | Higher thermal-runaway risk; onset reported around 150°C | 25C–50C | Lightweight packaging and high discharge capability in suitable designs | More sensitive to mechanical damage and swelling; rejected in the preliminary comparison due to fire risk and shorter cycle life |
| Lead-acid (SLA / AGM) | 48 V (four 12 V batteries) | 300–400 cycles | 30–40 Wh/kg | Low thermal-runaway risk | 1C | Established technology and relatively low initial cost | High mass (reported as over 35 kg for the compared pack) and low usable energy density; may reduce payload allowance and climbing performance |

*Table 5.2: Qualitative comparison of battery chemistries.*

LiFePO4's lower energy density means a heavier battery for the same stored energy, but this trade-off was considered acceptable for a ground-based platform. Its cycle-life characteristics also support repeated charging and discharging for patrol and collection operations. Battery chemistry alone does not ensure safe operation; suitable electrical protection, thermal management and mechanical mounting remain necessary.

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
| Predicted operating duration | 1.34 hours |
| Minimum operating requirement | More than 1 hour |
| Design baseline | 1.5 hours |

The selected battery provides a preliminary balance between operating duration, weight and electrical safety. Further testing is required to confirm its discharge capability, actual usable energy and runtime under representative operating conditions.

## System Wiring Diagram & Electrical Architecture (48V Architecture)

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
