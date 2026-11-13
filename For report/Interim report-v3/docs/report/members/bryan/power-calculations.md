---
title: "Detailed Power Calculations"
owner: "Bryan Ng"
outline: [2,3]
---
# Detailed Power Calculations

<!-- #region report -->

## 5.1.1.1 System Power Consumption

The drivetrain power was estimated for four operating conditions. The mission-duration proportions and estimated power per motor are shown below.

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

For an intermittently operated load, average power is estimated using its duty cycle $D$:

$$
P_{\text{avg}}=P\times D
$$

The weighted average drivetrain power is calculated from the operating-condition powers and their mission fractions:

$$
P_{\text{weighted}}=\sum_{i=1}^{n}P_iD_i
$$

Using the proportions in Table 5.2:

$$
P_{\text{weighted}}=(78.48\times0.80)+(165.12\times0.10)+(222.14\times0.05)+(708.10\times0.05)
$$

$$
P_{\text{weighted}}=125.808\text{ W}\approx125.8\text{ W per motor}
$$

The total system power consumption was estimated by combining the weighted average power of the four hub motors with the average power demand of the remaining electrical components, including the onboard computing system, sensors, communication equipment and auxiliary devices.

$$
P_{\text{system}}=(4\times P_{\text{motor,weighted}})+P_{\text{components,avg}}=611.36\text{ W}
$$

The power consumption of the individual electrical components is summarised in table below, including their operating voltages, estimated current requirements and operating duty cycles. These values form the basis of the overall system power budget and subsequent battery capacity calculations.

### Consolidated Subsystem Load Budget

A 48 V-class power bus is used to reduce current relative to a 24 V bus for the same power. Since resistive losses scale with current squared ($P_{\text{loss}}=I^2R$), reducing current can reduce wiring and connector losses, subject to suitable component ratings and protection.

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
| LI-IMX568-GMSL2-050H RGB Camera | 12.0 | 0.15 | 0.25 | 1.80 | 100.00% | 1.80 | 0.04 | 0.07 |
| Deserialiser/Adapter | 12.0 | 0.20 | 0.40 | 2.40 | 100.00% | 2.40 | 0.06 | 0.11 |
| Livox Mid-360 | 12.0 | 0.54 | 2.00 | 6.48 | 100.00% | 6.48 | 0.15 | 0.56 |
| RPLidar S2 | 5.0 | 0.45 | 0.80 | 0.80 | 100.00% | 0.80 | 0.05 | 0.09 |
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

*Table 5.3: Total Power Table of Interim System.*

The consolidated load budget summarises the estimated electrical requirements of each subsystem, including operating voltage, nominal current, peak current, power consumption and duty cycle. The nominal current and operating voltage are used to determine the power demand of individual components through (P=VI), while the duty cycle accounts for intermittent operation to obtain the average power consumption. These average power values are then combined to estimate the total system load, which forms the basis for the subsequent battery capacity and runtime calculations.

The peak current values are considered separately to assess the maximum electrical demand during startup, acceleration and simultaneous component operation. These values are important for selecting suitable wiring, connectors, DC-DC converters and protection devices, including the BMS and fuses. The equivalent 48 V current values allow loads operating at different voltages to be compared on a common battery-bus basis, helping to evaluate the overall current demand on the power distribution system.

As the values are based on interim calculations, the power budget will be further refined during Semester 2 to account for additional components and changes to the FOD remediation system as our future works. These include the redesigned vacuum and collection mechanism, stepper motors for mechanical actuation, and an infrared (IR) sensor to confirm successful FOD clearance. 

## 5.1.1.2 Energy Requirement & Battery Capacity

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

## 5.1.1.3 Battery Chemistry Comparison

Four chemistries were considered using energy density, cycle life, thermal behaviour, discharge capability, mass and suitability for repeated UGV operation.

| Battery chemistry | Voltage / configuration considered | Cycle life (80% DoD) | Energy density | Thermal behaviour | Discharge capability | Engineering advantages and limitations |
|---|---|---:|---:|---|---|---|
| LiFePO4 | 48 V class; 51.2 V if 16S | 2,000–3,500 cycles | 100–130 Wh/kg | Comparatively low thermal-runaway risk; prior estimate reports onset above 270°C | 5C burst / 2C continuous (100 A BMS in prior estimate) | Good thermal stability and cycle life; lower energy density means greater mass for equivalent energy |
| Conventional Li-ion (NMC) | 48.1 V (13S) | 500–800 cycles | 160–220 Wh/kg | Requires careful electrical and thermal protection; prior estimate reports onset around 210°C | 3C–5C | Higher energy density and lower mass; thermal protection and management remain important |
| LiPo | 44.4 V (12S) | 300–500 cycles | 180–240 Wh/kg | More sensitive to mechanical damage and swelling; prior estimate reports onset around 150°C | 25C–50C | Lightweight packaging and high discharge capability in suitable designs; greater sensitivity to damage and swelling |
| Lead-acid (SLA / AGM) | 48 V (four 12 V batteries) | 300–400 cycles | 30–40 Wh/kg | Low thermal-runaway risk in the prior comparison | 1C | Established and relatively low initial cost; high mass and low usable energy density |

*Table 5.4: Preliminary comparison of battery chemistries and reported specifications.*

The numerical ranges above were present in the project comparison, but the project's reference list does not currently identify the sources or exact models behind them. They should be treated as indicative, unverified values—not manufacturer specifications—until supported by cited cell or battery datasheets. Battery characteristics vary by product, configuration and test conditions, so final comparison should use referenced specifications for the actual candidate packs.

LiFePO4 was selected provisionally for its thermal stability and cycle-life characteristics. Its lower energy density was considered an acceptable mass trade-off for a ground-based platform. Chemistry alone does not ensure safe operation; electrical protection, thermal management and secure mechanical mounting are also required.

## 5.1.1.4 Final Battery Selection & Runtime

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

*Table 5.5: Final Battery Selected.*

The selected battery provides a preliminary balance between runtime, mass and electrical safety. Further testing and datasheet verification are required to confirm its discharge capability, usable energy and runtime under representative operating conditions.

<!-- #endregion report -->
