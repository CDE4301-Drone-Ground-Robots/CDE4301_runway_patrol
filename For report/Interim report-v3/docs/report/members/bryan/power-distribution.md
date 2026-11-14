---
title: "Power Distribution"
owner: "Bryan Ng"
outline: [2,3]
---
# Power Distribution

[← Back to Electrical Subsystem](../../report.md#electrical)

<!-- #region report -->
The power distribution system was designed to supply the drivetrain, FOD remediation mechanism, onboard computing system, sensors and auxiliary components from a centralised 48 V-class LiFePO4 battery. As these subsystems operate at different voltages and current levels, the architecture separates high-current loads from lower-voltage electronics through dedicated power branches and DC-DC converters.

The design incorporates battery monitoring, overcurrent protection and emergency isolation to address the electrical risks associated with the drivetrain and FOD collection mechanism. This section presents the distribution architecture, voltage regulation, protection devices and wiring considerations, followed by the limitations identified during the interim design.

## 5.1.2.1 Power Distribution Architecture

The FOD Hunter uses a nominal 48 V LiFePO₄ battery bus to supply the drivetrain, vacuum system and DC-DC converters. The distribution design combines a master battery protection and isolation path with separately protected high-current and low-voltage branches.

A centralised 48 V-class architecture was adopted to accommodate the power requirements of the hub motors and FOD remediation system while reducing the current required compared with a lower-voltage supply.

For an equivalent power demand, the current is inversely proportional to the supply voltage:

$$
I=\frac{P}{V}
$$

For comparison, consider the 2800 W vacuum load operating at 24 V and 48 V:

$$
I_\text{24 V}= \frac{2800}{24} = 116.67\text{ A}
$$

$$
I_\text{48 V}= \frac{2800}{48} = 58.33\text{ A}
$$


Doubling the supply voltage from 24 V to 48 V therefore reduces the current by half and the corresponding resistive losses to approximately one-quarter, assuming equal transmitted power and conductor resistance.

The 48 V-class architecture was selected to reduce current demand while remaining compatible with the proposed drivetrain. Components requiring lower operating voltages are supplied through dedicated DC-DC converters.

### Power Distribution Branches

The electrical system is divided into separate branches according to the operating voltage and current requirements of the connected components.

| Power branch | Main components | Supply requirement |
| --- | --- | --- |
| Drivetrain | Hub motors and ZLAC8015D motor drivers | 48 V class |
| FOD remediation | 2800W Vacuum and collection mechanism | 48 V class and regulated auxiliary supply |
| Computing | Jetson Orin NX | Regulated 20V supply |
| Sensors | ELP Camera, Hesai JT16 LiDAR and UM980 GPS | Camera and GPS are powered by the Jetson while LiDAR is regulated 12V |
| Communication and control | STM32, CAN transceiver and communication equipment | STM32 is powered by the Jetson NX while STM32 powers the CAN Transceiver |
| Lighting and auxiliaries | Indicator lights, headlights and cooling fans | Regulated auxiliary supply |

*Table 5.7: Proposed power distribution branches.*

Separating the electrical loads allows the individual circuits to be supplied and protected according to their operating requirements. It also simplifies cable routing and supports future modification of the FOD remediation and sensing systems.

<Card>

<Figure src="./assets/images/Overall_schematic.svg" alt="FOD Hunter electrical power distribution and wiring diagram" />

</Card>

*Figure 5.1: Overall Electrical Wiring Schematic.*

The schematic illustrates the distribution of electrical power from the battery through the main protection and isolation devices to the drivetrain, FOD remediation system and regulated auxiliary branches.

| Distribution stage | Components / supply | Purpose |
| --- | --- | --- |
| **Battery and master isolation** | 48 V 20 Ah LiFePO₄ battery, 100 A BMS, 100 A main fuse and 100 A kill switch | Stores energy, monitors battery conditions, protects the main output and provides manual isolation. |
| **48 V distribution** | XT60 power distribution board and branch fuse enclosure | Routes battery power to the high-current loads and converter inputs. |
| **Motor branch** | ZLAC8015D dual-channel motor driver and two 48 V hub motors | Supplies and controls the drivetrain. |
| **Vacuum branch** | Stepper motors supplied through regulated auxiliary power (2800 W vacuum supplied by a separate external battery) | Supplies the FOD collection system. |
| **Regulated branches** | 48 V-to-20 V, 48 V-to-12 V and 48 V-to-5 V DC-DC converters | Provides lower-voltage supplies for computing, auxiliary equipment and logic. |

*Table 5.8: Distribution Branches.*

The schematic illustrates the distribution of electrical power from the main 48 V LiFePO4 battery through the protection and isolation devices to the drivetrain, onboard computing system, sensors and auxiliary components. The 2800 W vacuum operates from a separate external battery supply and is therefore electrically independent of the main UGV power distribution system. This arrangement prevents the vacuum's high power demand from loading the main battery, allowing its capacity to be allocated primarily to vehicle propulsion and onboard electronics. However, the stepper motors and other low-voltage components associated with the FOD collection mechanism remain connected to the UGV's regulated power supply.

## 5.1.2.2 Low-Voltage Rails

Although the drivetrain and FOD remediation system are designed around the main battery voltage, the onboard computing system, sensors and control electronics require lower operating voltages.

DC-DC step-down converters were therefore incorporated to provide regulated supplies without requiring separate batteries for each subsystem.

The proposed design includes three regulated voltage rails.

| Converter output | Documented loads |
| --- | --- |
| **20 V** | Onboard computing system. |
| **12 V** | Sensors, Ethernet switch, cooling fans, headlights and indicator light tower. |
| **5 V** | Backup in case STM32 cannot supply enough to connected sensors due to its max current of 500mA. |

*Table 5.9: Proposed DC-DC voltage regulation.*

The converters must operate across the full battery-voltage range rather than at its nominal voltage alone. For a typical 16S LiFePO4 configuration, the nominal voltage is 51.2 V, while the maximum charging voltage is approximately 58.4 V.

The selected converters must therefore tolerate the maximum battery voltage and maintain suitable output regulation throughout the intended discharge range.

## 5.1.2.3 Electrical Protection

Electrical protection was incorporated into the proposed architecture to address battery operating faults, excessive current, short circuits and emergency isolation.

The protection system consists of a Battery Management System (BMS), main fuse, emergency kill switch and individual branch fuses. These devices serve different functions and must be selected according to the electrical characteristics of the circuits they protect.   

### Battery Management System

A 100 A LiFePO4 BMS was selected to monitor and protect the battery during charging and discharging.

The BMS is intended to provide cell-voltage monitoring, overcharge and over-discharge protection, cell balancing and temperature monitoring, subject to the specifications of the selected model.

Its continuous and peak discharge ratings must be compatible with the battery cells and the combined electrical demand of the connected loads.

The BMS does not replace the need for correctly rated fuses, wiring and emergency isolation devices.

### Main Fuse

A 100 A main fuse was included in the interim design to protect the main battery output circuit against excessive fault current.

The fuse must be selected based on the expected operating current, conductor ampacity, time-current characteristics and prospective short-circuit current.

Its DC voltage and interrupting ratings must also be suitable for the battery's maximum operating voltage.

The 100 A rating remains subject to verification against the final electrical load and wiring arrangement.

### Emergency Kill Switch

A 100 A-rated master kill switch was selected to provide manual isolation of the vehicle's electrical supply.

The switch must be suitable for DC operation at the maximum battery voltage and expected interruption current.

The emergency-stop design must also consider the behaviour of the motor drivers and vacuum system when power is interrupted. A controlled stopping response and complete electrical isolation serve different purposes and will be assessed separately during integration.

### Branch-Level Fuse Protection

Individual fuse circuits were introduced to protect the electrical branches supplying the drivetrain, FOD remediation mechanism and auxiliary electronics.

The preliminary design incorporates ANM fuses for higher-current branches and blade fuses for lower-current circuits.

| Protection element | Documented rating / type | Intended role |
| --- | --- | --- |
| **Battery management system** | 100 A BMS | Battery monitoring and internal cell protection. |
| **Main fuse** | 100 A, 8 AWG main circuit | Protects the main battery output circuit. |
| **Kill switch** | 100 A | Manual isolation of the vehicle power bus. |
| **High-current branch fuses** | 50 A ANM fuses | Branch protection for high-current loads. Confirm final branch assignments and ratings against measured load and startup current. |
| **Low-voltage branch fuses** | 10 A and 15 A automotive blade fuses | Protects the converter-fed computer, auxiliary and logic circuits; confirm each fuse against its wiring and load. |

*Table 5.10: Electrical protection devices and their intended functions.*

The branch fuse ratings will be reviewed against the operating current, startup current and cable specifications of the connected loads before physical integration.    

## 5.1.2.4 Electrical Integration, Wiring & Verification

The electrical architecture was developed with consideration for component compatibility, wiring arrangement and future maintenance. High-current loads, including the drivetrain and vacuum system, are supplied through dedicated branches, while lower-voltage electronics receive power through regulated DC-DC converters.

The component inventory specifies 8 AWG wiring for the main battery loop, 12 AWG for the motor-driver connections, 16–18 AWG for converter and auxiliary power circuits, and 20–22 AWG shielded twisted-pair cables for communication and low-current signals. These conductor sizes were identified during the interim design and remain subject to verification against the expected electrical loads.

| Circuit | Proposed wire size | Application |
| --- | --- | --- |
| Main battery loop | 8 AWG | Battery connection and primary power distribution |
| Motor-driver circuits | 12 AWG | Power supply to the ZLAC8015D motor drivers |
| Converter and auxiliary circuits | 16–18 AWG | DC-DC converters, sensors and auxiliary components |
| Communication and signal circuits | 20–22 AWG | CAN communication and low-current control signals |

*Table 5.11: Proposed wiring specifications for the electrical subsystem.*

The wiring arrangement separates high-current power circuits from sensitive communication and control signals to minimise electrical interference. A common electrical reference is required for relevant interfaces, including connections between the STM32 and motor drivers, while high-current return paths are routed separately to reduce noise coupling.

The proposed conductor sizes provide the basis for physical integration. Their suitability will be assessed against the installed cable lengths, insulation ratings, connector specifications and expected operating currents, as discussed in the following section.

## 5.1.2.5 Limitations & Semester 2 Future Work

The proposed 48 V power distribution architecture incorporates a Battery Management System (BMS), main fuse, branch fuses and emergency kill switch. However, these protection devices have not yet been fully implemented or validated under the expected operating loads. The final conductor and fuse ratings must be verified against continuous and startup currents, cable routing, insulation temperature ratings and connector current limits. Voltage drop, resistive heating and thermal performance also require assessment during physical integration.

The FOD remediation system will undergo further development during Semester 2, with the original 2800 W vacuum replaced by a lower-power 24 V DC vacuum motor (AMETEK LAMB 116514-13). This change is intended to reduce the electrical power demand of the collection mechanism while maintaining sufficient suction performance. As the revised vacuum operates at a different voltage from the main 48 V battery, a dedicated 48 V-to-24 V DC-DC converter will be required if it is powered by the UGV's main battery. The converter capacity, vacuum startup current, wiring and protection ratings must be reassessed to ensure compatibility with the updated electrical architecture.

During Semester 2, the BMS, fuse protection and emergency isolation system will be implemented and tested alongside the power distribution network. Further work will include verifying conductor suitability, measuring voltage drop and temperature under representative loads, refining cable routing and confirming the grounding arrangement. The electrical designs of the UGV charging dock and UAV charging platform will also be explored, including their power supply, charging requirements and integration considerations, to support future autonomous UAV–UGV operations.

<!-- #endregion report -->
