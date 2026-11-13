---
title: "Power Distribution"
owner: "Bryan Ng"
outline: [2,3]
---
# Power Distribution

[← Back to Electrical Subsystem](../../report.md#electrical)

<!-- #region report -->
The power distribution system was designed to supply the drivetrain, FOD remediation mechanism, onboard computing system, sensors and auxiliary components from a centralised 48 V-class battery. As these subsystems operate at different voltages and current levels, separate power branches and DC-DC converters were incorporated to provide the required supplies while allowing individual circuit protection.

The proposed architecture also incorporates a Battery Management System (BMS), main fuse, emergency kill switch and branch-level fuses to address battery operating faults, overcurrent conditions and emergency isolation.

## 5.1.2.1 Power Distribution Architecture

The FOD Hunter uses a nominal 48 V LiFePO₄ battery bus to supply the drivetrain, vacuum system and DC-DC converters. The distribution design combines a master battery protection and isolation path with separately protected high-current and low-voltage branches.

A centralised 48 V-class architecture was adopted to accommodate the power requirements of the hub motors and FOD remediation system while reducing the current required compared with a lower-voltage supply.

For an equivalent power demand, the current is inversely proportional to the supply voltage:

$$
I=\frac{P}{V}
$$

For example, at a load of 2800 W:

$$
I_\text{24 V}= \frac{2800}{24} = 116.67\text{ A}
$$

$$
I_\text{48 V}= \frac{2800}{48} = 58.33\text{ A}
$$


Doubling the supply voltage from 24 V to 48 V reduces the current by half and was therefore selected to reduce current demand and associated wiring losses while maintaining compatibility with the proposed drivetrain and FOD remediation components.

### Power Distribution Branches

The main electrical supply is divided into dedicated branches according to the operating requirements of the connected components.

| Power branch | Main components | Supply requirement |
| --- | --- | --- |
| Drivetrain | Hub motors and ZLAC8015D motor drivers | 48 V class |
| FOD remediation | Vacuum and collection mechanism | 48 V class and regulated auxiliary supply |
| Computing | Jetson Orin NX | Regulated 20V supply |
| Sensors | Cameras, LiDAR and UM980 GPS | Camera and GPS are powered by the Jetson while LiDAR is regulated 12V |
| Communication and control | STM32, CAN transceiver and communication equipment | STM32 is powered by the Jetson NX while STM32 powers the CAN Transceiver |
| Lighting and auxiliaries | Indicator lights, headlights and cooling fans | Regulated auxiliary supply |

*Table 5.6: Proposed power distribution branches.*

The separation of electrical loads allows individual branches to be protected according to their current requirements. It also provides a more organised wiring arrangement for installation, maintenance and future subsystem modifications.

<Card>

<Figure src="../../../shared/assets/diagrams/UGV_Controller_Layer_Interim.svg" alt="FOD Hunter electrical power distribution and wiring diagram" />

</Card>

*Figure 5.1: Overall Electrical Wiring Schematic.*

The schematic illustrates the proposed distribution of power from the battery through the main protection devices to the individual electrical subsystems.

| Distribution stage | Components / supply | Purpose |
| --- | --- | --- |
| **Battery and master isolation** | 48 V 20 Ah LiFePO₄ battery, 100 A BMS, 100 A main fuse and 100 A kill switch | Stores energy, monitors battery conditions, protects the main output and provides manual isolation. |
| **48 V distribution** | XT60 power distribution board and branch fuse enclosure | Routes battery power to the high-current loads and converter inputs. |
| **Motor branch** | ZLAC8015D dual-channel motor driver and two 48 V hub motors | Supplies and controls the drivetrain. |
| **Vacuum branch** | 48 V industrial vacuum | Supplies the FOD collection system. |
| **Regulated branches** | 48 V-to-20 V, 48 V-to-12 V and 48 V-to-5 V DC-DC converters | Provides lower-voltage supplies for computing, auxiliary equipment and logic. |

*Table 5.7: Distribution Branches.*

## 5.1.2.2 Low-Voltage Rails

Although the drivetrain and FOD remediation system are designed around the main battery voltage, the onboard computing system, sensors and control electronics require lower operating voltages.

DC-DC step-down converters were therefore incorporated to provide regulated supplies without requiring separate batteries for each subsystem.

The proposed design includes three regulated voltage rails.

| Converter output | Documented loads |
| --- | --- |
| **20 V** | Onboard computing system. |
| **12 V** | Sensors, Ethernet switch, cooling fans, headlights and indicator light tower. |
| **5 V** | Backup in case STM32 cannot supply enough to connected sensors due to its max current of 500mA. |

*Table 5.8: Proposed DC-DC voltage regulation.*

The low-voltage branches are distributed through a blade-fuse block. Each converter and branch must be wired and fused for its actual input current, output current and conductor rating.

## 5.1.2.3 Electrical Protection

Electrical protection was incorporated into the design to reduce the risk of damage caused by excessive current, battery operating faults and short circuits.

The proposed protection architecture consists of a BMS, main fuse, emergency kill switch and individual branch fuses. Each device serves a different purpose within the electrical system.

### Battery Management System

A 100 A LiFePO4 BMS was selected for the battery system.

The BMS is intended to monitor battery operating conditions and provide protection against overcharging, excessive discharge and overcurrent. Cell balancing and temperature monitoring are also considered, subject to the functions supported by the selected BMS.

The BMS must be configured according to the actual battery cell arrangement and operating limits.

Its continuous and peak current ratings must also be verified against the combined electrical demand of the drivetrain, vacuum and supporting components.

### Main Fuse

A 100 A main fuse was included in the proposed electrical architecture to provide protection against excessive fault current.

Unlike the BMS, which monitors battery operating conditions, the main fuse provides a dedicated overcurrent protection mechanism.

The final fuse rating must be selected according to the maximum operating current, cable ampacity, expected fault current and fuse time-current characteristics.

The selected fuse must also have a suitable DC voltage and interrupting rating for the battery system.

### Emergency Kill Switch

A 100 A-rated kill switch was selected to provide manual electrical isolation during maintenance and emergency conditions.

The switch is intended to interrupt the electrical supply to the connected loads when operated.

Its suitability must be verified against the maximum battery voltage and the expected DC interruption current.

The final emergency-stop arrangement will also consider how the drivetrain and vacuum system enter a safe state during an emergency.

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

*Table 5.9: Electrical protection devices and their intended functions.*

The branch fuse ratings will be reviewed against the operating current, startup current and cable specifications of the connected loads before physical integration.    

## 5.1.2.4 Electrical Integration, Wiring & Verification

The electrical architecture was developed with consideration for component compatibility, wiring arrangement and future maintenance. High-current loads, including the drivetrain and vacuum system, are supplied through dedicated branches, while lower-voltage electronics receive power through regulated DC-DC converters.

The component inventory specifies 8 AWG wiring for the main battery loop, 12 AWG for the motor-driver connections, 16–18 AWG for converter and auxiliary power circuits, and 20–22 AWG shielded twisted-pair cables for communication and low-current signals. These conductor sizes were identified during the interim design and remain subject to verification against the expected electrical loads.

| Circuit | Proposed wire size | Application |
| --- | --- | --- |
| Main battery loop | 8 AWG | Battery connection and primary power distribution |
| Motor-driver circuits | 12 AWG | Power supply to the drivetrain motor drivers |
| Converter and auxiliary circuits | 16–18 AWG | DC-DC converters, sensors and auxiliary components |
| Communication and signal circuits | 20–22 AWG | CAN communication and low-current control signals |

*Table 5.10: Proposed wiring specifications for the electrical subsystem.*

The wiring arrangement separates high-current power circuits from sensitive communication and control signals to minimise electrical interference. A common electrical reference is required for relevant interfaces, including connections between the STM32 and motor drivers, while high-current return paths are routed separately to reduce noise coupling.

The proposed conductor sizes provide the basis for physical integration. Their suitability will be assessed against the installed cable lengths, insulation ratings, connector specifications and expected operating currents, as discussed in the following section.

## 5.1.2.5 Limitations & Semester 2 Future Work

The proposed 48 V power distribution architecture incorporates a Battery Management System (BMS), main fuse, branch fuses and emergency kill switch. However, these protection devices have not yet been fully implemented or validated under the expected operating loads. The final conductor and fuse ratings must be verified against continuous and startup currents, cable routing, insulation temperature ratings and connector current limits. Voltage drop, resistive heating and thermal performance also require assessment during physical integration.

Particular attention is required for the vacuum branch. The interim design specifies a 50 A ANM fuse for selected high-current circuits, while the original 2800 W vacuum corresponds to an estimated current of:

$$
I_{\text{vacuum}}=\frac{2800}{48}=58.33\text{ A}
$$

This estimated current exceeds the nominal 50 A fuse rating. The vacuum's actual operating and startup currents must therefore be verified against the manufacturer's specifications, and the corresponding fuse, wiring and connector ratings must be reassessed before the circuit is energised.

During Semester 2, the BMS, fuse protection and emergency isolation system will be implemented and tested alongside the power distribution network. Further work will include verifying conductor suitability, measuring voltage drop and temperature under representative loads, refining cable routing and confirming the grounding arrangement. The electrical design of a UAV charging platform will also be explored, including its power supply and charging requirements, to support future UAV–UGV integration.
<!-- #endregion report -->
