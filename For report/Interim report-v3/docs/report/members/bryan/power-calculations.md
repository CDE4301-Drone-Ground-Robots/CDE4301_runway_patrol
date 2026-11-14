---
title: "Detailed Power Calculations"
owner: "Bryan Ng"
outline: [2,3]
---
# Detailed Power Calculations

<!-- #region report -->

This section presents the estimation of FOD Hunter's electrical power requirements and the selection of a suitable battery. The analysis considers the drivetrain under different operating conditions, the intermittent operation of the FOD remediation mechanism and the power consumption of onboard electrical components. These estimates are used to determine the energy required for the intended mission duration and evaluate the suitability of different battery configurations.

## 5.1.1.1 System Power Consumption

The drivetrain power consumption was estimated under four operating conditions: flat cruising, incline driving, acceleration and zero-radius turning. As the UGV is expected to spend most of its operating time travelling along the runway, flat cruising was assigned the largest proportion of the mission duration. The remaining conditions account for periods of increased motor demand associated with manoeuvring and changes in vehicle motion.

| Operating condition | Mission duration (%) | Estimated electrical power (W) |
|---|---:|---:|
| Flat cruising | 80 | 78.48 |
| Incline driving (5°) | 10 | 165.12 |
| Acceleration | 5 | 222.14 |
| Zero-radius turning | 5 | 708.10 |

*Table 5.2: Estimated drivetrain power under different operating conditions, based on the interim presentation.*

The electrical power of a component is calculated using:

$$
P=VI
$$

where $P$ is electrical power (W), $V$ is operating voltage (V), and $I$ is current (A).

Since the drivetrain does not operate continuously under a single driving condition, a weighted average was used to estimate its power consumption over the mission. This approach accounts for the proportion of operating time spent under each condition.

$$
P_{\text{weighted}}=\sum_{i=1}^{n}P_iD_i
$$

where $P_i$ represents the estimated power under operating condition $i$, and $D_i$ represents its corresponding fraction of the mission duration.

Substituting the values from Table 5.2:

$$
P_{\text{weighted}}=(78.48\times0.80)+(165.12\times0.10)+(222.14\times0.05)+(708.10\times0.05)
$$

$$
P_{\text{weighted}}=125.808\text{ W}\approx125.8\text{ W per motor}
$$

The total system power consumption was estimated by combining the weighted average power of the four hub motors with the average power demand of the remaining electrical components, including the onboard computing system, sensors, communication equipment and auxiliary devices.

$$
P_{\text{system}}=(4\times P_{\text{motor,weighted}})+P_{\text{components,avg}}=602.63\text{ W}
$$

The power consumption of the individual electrical components is summarised in table below, including their operating voltages, estimated current requirements and operating duty cycles. These values form the basis of the overall system power budget and subsequent battery capacity calculations.

### FOD Remediation Duty Cycle

Unlike the drivetrain, the FOD remediation mechanism operates intermittently during debris collection. Its average power consumption therefore depends on the number of FOD objects encountered and the duration required for each collection operation.

For the interim calculation, a scenario involving 10 FOD objects was considered, with an assumed collection duration of 20 seconds per object.

| Parameter | Value |
|---|---:|
| Number of FOD objects | 10 |
| Vacuum operating time per FOD | 20 s |
| Total vacuum operating time | 200 s |
| Assumed mission duration | 5,400 s (1.5 h) |
| Vacuum duty cycle | 3.70% |

*Table 5.3: Estimated vacuum duty cycle during FOD remediation.*

The total vacuum operating time is calculated as:

$$
t_{\text{vacuum}}=10\times20=200\text{ s}
$$

The vacuum duty cycle is therefore:

$$
D_{\text{vacuum}}=\frac{200}{5400}\times100
=\boxed{3.70\%}
$$

Assuming the original vacuum operates at its rated electrical power of 2800 W, its average power contribution is:

$$
P_{\text{vacuum,avg}}=2800\times0.03704
$$

$$
\boxed{P_{\text{vacuum,avg}}\approx103.7\text{ W}}
$$

This average power contribution will be incorporated into the consolidated system load budget to account for the intermittent operation of the FOD remediation system. The assumed collection duration and vacuum power consumption will be reviewed during Semester 2 following integration of the redesigned collection mechanism.

### Consolidated Subsystem Load Budget

In addition to the drivetrain and FOD remediation system, the battery must supply the onboard computing platform, sensors, communication equipment and auxiliary components.

| Components | Voltage (V) | Current draw (A) | Peak current (A) | Power (W) | Duty cycle (%) | Average power (W) | 48 V nominal current (A) | 48 V peak current (A) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| | | | | <div style="text-align: center;"><strong>DRIVETRAIN</strong></div> | | | | |
| Drive Motor 1 | 48.0 | 6.33 | 15.50 | 500.00 | 25.16% | 125.80 | 6.33 | 15.50 |
| Drive Motor 2 | 48.0 | 6.33 | 15.50 | 500.00 | 25.16% | 125.80 | 6.33 | 15.50 |
| Drive Motor 3 | 48.0 | 6.33 | 15.50 | 500.00 | 25.16% | 125.80 | 6.33 | 15.50 |
| Drive Motor 4 | 48.0 | 6.33 | 15.50 | 500.00 | 25.16% | 125.80 | 6.33 | 15.50 |
| | | | | <div style="text-align: center;"><strong>COMPUTE</strong></div> | | | | |
| NX Orin | 12.0 | 2.70 | 3.30 | 32.40 | 100.00% | 32.40 | 0.75 | 0.92 |
| Nucleo F446RE | 5.0 | 0.08 | 0.50 | 0.40 | 100.00% | 0.40 | 0.01 | 0.06 |
| | | | | <div style="text-align: center;"><strong>SENSORS</strong></div> | | | | |
| ELP 5MP 6mm USB Camera | 5.0 | 0.21 | TBD | 1.05 | 100.00% | 1.05 | 0.02 | TBD |
| Hesai JT16 LiDAR | 12.0 | 0.36 | 0.67 | 4.30 | 100.00% | 4.30 | 0.09 | 0.17 |
| UM980 GPS | 5.0 | 0.12 | 0.20 | 0.60 | 100.00% | 0.60 | 0.01 | 0.02 |
| | | | | <div style="text-align: center;"><strong>COMMUNICATION</strong></div> | | | | |
| BMS 6S-22S LiFePO4 100A | 51.2 | 0.02 | 0.05 | 0.77 | 100.00% | 0.77 | 0.02 | 0.05 |
| CAN Transceiver (SN65HVD230) | 3.3 | 0.02 | 0.07 | 0.05 | 100.00% | 0.05 | 0.00 | 0.01 |
| Ethernet Switch (TP-Link LS105G) | 5.0 | 0.38 | 0.50 | 1.90 | 100.00% | 1.90 | 0.04 | 0.06 |
| Microhard pMDDL2550 Wireless C2 Transceiver | 12.0 | 0.40 | 1.20 | 4.80 | 100.00% | 4.80 | 0.11 | 0.33 |
| Wireless Switch for ESC Driver (E-Stop) | 12.0 | 0.01 | 0.01 | 0.12 | 100.00% | 0.12 | 0.00 | 0.00 |
| DC-DC Relay | 3.3 | 0.01 | 0.01 | 0.02 | 100.00% | 0.02 | 0.00 | 0.00 |
| | | | | <div style="text-align: center;"><strong>VACUUM</strong></div> | | | | |
| NEMA17 Stepper (+ driver) | 12.0 | 1.20 | 1.50 | 14.40 | 100.00% | 14.40 | 0.33 | 0.42 |
| | | | | <div style="text-align: center;"><strong>LIGHTING</strong></div> | | | | |
| Indicator Light Tower | 12.0 | 0.20 | 0.40 | 2.40 | 100.00% | 2.40 | 0.06 | 0.11 |
| Bay Cooling Fans | 12.0 | 0.50 | 0.80 | 6.00 | 100.00% | 6.00 | 0.14 | 0.22 |
| Headlights for CV | 12.0 | 0.83 | 1.20 | 9.96 | 50.00% | 4.98 | 0.23 | 0.33 |
| Rear Red Light Strip / Status Light | 12.0 | 0.25 | 0.40 | 3.00 | 100.00% | 3.00 | 0.07 | 0.11 |

*Table 5.4: Total Power Table of Interim System.*

The consolidated load budget summarises the estimated electrical requirements of each subsystem, including operating voltage, nominal current, peak current, power consumption and duty cycle. The nominal current and operating voltage are used to determine the power demand of individual components through (P=VI), while the duty cycle accounts for intermittent operation to obtain the average power consumption. These average power values are then combined to estimate the total system load, which forms the basis for the subsequent battery capacity and runtime calculations.

The peak current values are considered separately to assess the maximum electrical demand during startup, acceleration and simultaneous component operation. These values are important for selecting suitable wiring, connectors, DC-DC converters and protection devices, including the BMS and fuses. The equivalent 48 V current values allow loads operating at different voltages to be compared on a common battery-bus basis, helping to evaluate the overall current demand on the power distribution system.

As the values are based on interim calculations, the power budget will be further refined during Semester 2 to account for additional components and changes to the FOD remediation system as our future works. These include the redesigned vacuum and collection mechanism, stepper motors for mechanical actuation, and an infrared (IR) sensor to confirm successful FOD clearance. 

## 5.1.1.2 Energy Requirement & Battery Capacity

The required battery capacity was estimated using the system's average power consumption and the intended operating duration. Although the minimum operating requirement is greater than one hour, a 1.5-hour duration was adopted as the battery-sizing target to provide additional operating margin.

The total energy requirement is calculated using:

$$
E_{\text{required}}=P_{\text{system}}\times t
$$

$$
E_{\text{required}}=602.63\times1.5=903.95\text{ Wh}
$$

To account for the usable portion of the battery capacity, an 80% depth of discharge (DoD) was assumed. The required capacity is calculated using:

$$
C_{\text{required}}=
\frac{E_{\text{required}}}
{V_{\text{nominal}}\times DoD}
$$

A nominal voltage of 51.2 V was used, corresponding to a typical 16-series LiFePO4 battery configuration with a nominal cell voltage of 3.2 V.

$$
V_{\text{nominal}}=16\times3.2=51.2\text{ V}
$$

Therefore:

$$
C_{\text{required}}=
\frac{903.95}{51.2\times0.8}
$$

$$
\boxed{C_{\text{required}}=22.07\text{ Ah}}
$$

The calculation indicates that approximately 22.07 Ah would be required to achieve the 1.5-hour operating target under the interim power estimate. This value provides the basis for evaluating the selected battery capacity.

## 5.1.1.3 Battery Chemistry Comparison

Battery chemistry was evaluated based on energy density, thermal stability, cycle life, discharge capability and suitability for repeated UGV operation.

Four battery chemistries were considered: lithium iron phosphate (LiFePO4), conventional lithium-ion (NMC), lithium polymer (LiPo) and lead-acid.

| Battery chemistry | Voltage / configuration considered | Cycle life (80% DoD) | Energy density | Thermal behaviour | Discharge capability | Engineering advantages and limitations |
|---|---|---:|---:|---|---|---|
| LiFePO4 | 48 V class; 51.2 V if 16S | 2,000–3,500 cycles | 100–130 Wh/kg | Comparatively low thermal-runaway risk; prior estimate reports onset above 270°C | 5C burst / 2C continuous (100 A BMS in prior estimate) | Good thermal stability and cycle life; lower energy density means greater mass for equivalent energy |
| Conventional Li-ion (NMC) | 48.1 V (13S) | 500–800 cycles | 160–220 Wh/kg | Requires careful electrical and thermal protection; prior estimate reports onset around 210°C | 3C–5C | Higher energy density and lower mass; thermal protection and management remain important |
| LiPo | 44.4 V (12S) | 300–500 cycles | 180–240 Wh/kg | More sensitive to mechanical damage and swelling; prior estimate reports onset around 150°C | 25C–50C | Lightweight packaging and high discharge capability in suitable designs; greater sensitivity to damage and swelling |
| Lead-acid (SLA / AGM) | 48 V (four 12 V batteries) | 300–400 cycles | 30–40 Wh/kg | Low thermal-runaway risk in the prior comparison | 1C | Established and relatively low initial cost; high mass and low usable energy density |

*Table 5.5: Preliminary comparison of battery chemistries and reported specifications.*

Li-ion and LiPo batteries generally provide higher energy density, allowing greater energy storage for a given battery mass. This is advantageous for weight-sensitive applications. However, their thermal behaviour, mechanical protection requirements and operating characteristics must also be considered.

Lead-acid batteries offer an established and relatively inexpensive alternative but have significantly lower energy density, resulting in greater mass for equivalent energy storage.

LiFePO4 was selected because of its comparatively good thermal stability and cycle-life characteristics. Although its lower energy density results in a heavier battery, this trade-off was considered acceptable for the ground-based UGV, where operational safety and repeated charging are important considerations.

The selection does not eliminate the need for electrical protection. A suitable BMS, fuse arrangement and mechanical enclosure remain necessary to maintain safe battery operation.

## 5.1.1.4 Final Battery Selection & Runtime

Based on the estimated energy requirement and battery chemistry comparison, a 48 V-class, 20 Ah LiFePO4 battery was selected for the interim electrical design.

Assuming a 16S configuration, the nominal stored energy is:

$$
E_{\text{nominal}}=51.2\times20=1024\text{ Wh}
$$

At the assumed 80% DoD, usable energy is:

$$
E_{\text{usable}}=1024\times0.8=819.2\text{ Wh}
$$

Using the estimated 602.63 W average system power, predicted runtime is:

$$
t=\frac{819.2}{602.63}\approx1.36\text{ hours}
$$

The 20 Ah selection is expected to exceed the minimum operating requirement of one hour under the current assumptions, but it does not meet the 1.5-hour design target. Achieving that target at the assumed load requires approximately 22.07 Ah at 51.2 V and 80% DoD. Battery capacity and runtime must be reassessed after measuring actual system consumption, particularly with the drivetrain and FOD collection mechanism operating together.


### Battery Selection Summary

| Parameter | Preliminary selection |
|---|---|
| Battery chemistry | LiFePO4 |
| Marketed voltage class | 48 V |
| Assumed nominal voltage | 51.2 V (16S, subject to confirmation) |
| Capacity | 20 Ah |
| Nominal energy | 1024 Wh |
| Assumed usable energy | 819.2 Wh |
| Estimated average system power | 602.63 W |
| Predicted mixed-mission runtime | Approximately 1.36 hours |
| Minimum operating requirement | More than 1 hour |
| Design target | 1.5 hours |

*Table 5.6: Final Battery Selected.*

The selected 20 Ah battery is expected to satisfy the minimum operating-time requirement under the interim power assumptions. However, the calculated duration of 1.36 hours falls short of the 1.5-hour design target.

The battery selection therefore represents a compromise between operating duration, energy storage and system mass. Its suitability will be reassessed following verification of the complete electrical load budget and physical runtime testing.

## 5.1.1.5 Limitations & Semester 2 Future Work

The interim power calculations were based on estimated component loads and assumed operating duty cycles. In particular, the proportions assigned to the different driving conditions and the duration of FOD collection have not yet been validated through physical testing. The predicted battery runtime is therefore dependent on the accuracy of these assumptions.

During Semester 2, the power budget will be updated to account for the revised FOD remediation mechanism, including the selected vacuum motor, stepper motors and infrared sensor for FOD clearance confirmation. Actual electrical consumption will be measured under representative driving and collection conditions to evaluate the accuracy of the interim calculations.

The measured results will be used to refine the total system power budget, assess peak current requirements and determine whether the selected 20 Ah battery remains suitable for the intended operating duration.

<!-- #endregion report -->
