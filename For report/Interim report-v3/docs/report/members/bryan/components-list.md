---
title: "Components List"
owner: "Bryan Ng"
outline: [2,3]
---
# Components List

[← Back to Electrical Subsystem](../../report.md#electrical)

<!-- #region report -->

This section presents the electrical components selected for FOD Hunter, outlining their specifications, functions and compatibility with the overall system. The components are categorised according to their roles in power distribution, drivetrain control, computing, sensing, communication and auxiliary operations.

## 5.1.3.1 Component Selection Criteria

The selection of electrical components was guided by the following criteria.

| Criterion | Design consideration | Justification |
| --- | --- | --- |
| Voltage compatibility | Compatibility with the 48 V-class battery and regulated 20 V, 12 V and 5 V supplies | Prevents operation outside the allowable voltage range of individual components |
| Current requirements | Continuous operating current, peak current and startup demand | Ensures that components and their power connections can support the expected electrical loads |
| Communication interfaces | Compatibility with CAN, UART, I2C, USB and Ethernet interfaces | Supports communication between the STM32, onboard computer, motor drivers and sensors |
| Electrical protection | Compatibility with the proposed BMS, fuse and isolation arrangement | Allows electrical loads to be protected according to their operating requirements |
| Physical integration | Dimensions, connector arrangement, cooling and mounting requirements | Supports installation and maintenance within the available chassis space |
| Cost and availability | Component price, procurement lead time and availability | Supports component selection within the project budget and development schedule |

*Table 5.12: Proposed wiring specifications for the electrical subsystem.*

## 5.1.3.2 Electrical Components List

The electrical components are grouped according to their functions within the UGV, including energy storage, electrical protection, power distribution, drivetrain control, computing, sensing, communication and auxiliary operation.

### A. Battery, Power Distribution & Electrical Protection

| No. | Component / Hardware Item | Subsystem Category | Key Specifications / Ratings | Operational Function |
| --- | --- | --- | --- | --- |
| **1** | **48V 20Ah LiFePO4 Battery Pack** | Power Storage | 48V class; 51.2V nominal if 16S, 20Ah, 960–1024 Wh, dedicated CC/CV charger | Primary energy storage for the drivetrain, vacuum and onboard electronics |
| **2** | **BMS 6S–22S LiFePO4 100A** | Battery Management | 100A continuous discharge rating; cell balancing, voltage and temperature protection | Battery monitoring and protection against abnormal operating conditions |
| **3** | **8 AWG Main Fuse 100A** | Primary Protection | 8 AWG main wiring; 100A inline fuse | Main battery output overcurrent protection |
| **4** | **Kill Switch 100A** | Hardware Safety | 100A-rated master rotary disconnect switch | Manual isolation of the vehicle's electrical supply |
| **6** | **201 ANM Fuse Box** | Power Distribution | High-current ANM bolted fuse holder | Houses high-current branch fuses |
| **7** | **50A 3-Piece ANM Fuse** | Branch Protection | 50A ANM fuses, 3 pieces | Protection of selected motor-driver and high-current branches |
| **8** | **Blade Fuse Box** | Low-Voltage Distribution | Multi-slot automotive blade fuse holder | Houses auxiliary circuit fuses |
| **9** | **Blade Fuses 10A & 15A** | Branch Protection | Automotive blade fuses, 10A and 15A | Protection of converter and auxiliary circuits |
| **12** | **PDB XT60 1-to-6 Way** | Power Distribution | 1 XT60 input, 6 XT60 outputs | Distribution of battery power to compatible electrical branches |
| **13** | **PDB XT60 to XT30 6-Way** | Power Distribution | XT60 input, 6 XT30 outputs | Distribution to lower-current power circuits |
| **28** | **20V Buck Converter** | Compute Power | 48V-class input to 20V DC output, 10A maximum | Regulated supply for compatible onboard computing equipment |
| **29** | **12V Buck Converter** | Auxiliary Power | 48V-class input to 12V DC output, 15A maximum | Supplies communication equipment, cooling fans, lighting and auxiliary components |
| **30** | **5V Buck Converter** | Logic Power | 48V-class input to 5V DC output, 5A maximum | Supplies low-voltage control electronics and peripherals |

#### B. Drivetrain & Motor Control

| No. | Component / Hardware Item | Subsystem Category | Key Specifications / Ratings | Operational Function |
| --- | --- | --- | --- | --- |
| **10** | **CAN Transceiver** | Communications | High-speed CAN transceiver module, up to 1 Mbps; isolation subject to selected model | Provides CAN physical-layer communication between STM32 and motor drivers |
| **11** | **Microcontroller (MCU): STM32 F446RE** | Low-Level Control | ARM Cortex-M4, 180 MHz, CAN, UART and USB interfaces | Receives commands from onboard computing and controls motor drivers and auxiliary devices |
| **14** | **Hub Motor ZLLG80ASM25 0-HT V2.0** | Traction Actuation | 8-inch brushless direct-drive hub motor with encoder | Wheel propulsion and encoder-based motion feedback |
| **15** | **Servo Driver ZLAC8015D V4.2** | Motor Control | Dual-channel brushless servo driver; CAN and other control interfaces | Closed-loop control of hub motor speed and direction |
| **25** | **Wireless Switch for ESC Remote** | Wireless Safety | Two-channel RF remote relay receiver with transmitter | Remote switching or motor-disable function, subject to safety verification |

#### C. Onboard Computing, Sensors & Imaging

| No. | Component / Hardware Item | Subsystem Category | Key Specifications / Ratings | Operational Function |
|---|---|---|---|---|
| **21** | **ELP 5MP 6mm USB Camera** | Perception Sensor | 5MP (2592 × 1944), 6mm M12 lens, USB 2.0 UVC, 5V DC, approximately 0.21A, 1.05W | Visual detection and confirmation of FOD |
| **22** | **Hesai JT16 LiDAR** | Navigation Sensor | 16-channel 3D LiDAR, 360° horizontal and 40° vertical FOV, 12–16V DC, 4.3W typical, RS485 interface | 3D environmental perception, obstacle detection and navigation |
| **23** | **Headlights for CV** | Active Illumination | 12V LED floodlights | Provides illumination for visual detection under low-light conditions |
| **24** | **UM980 GPS Module** | Localisation | Multi-band, multi-constellation RTK GNSS receiver | High-precision positioning for navigation |


#### D. Communication & Electrical Interfaces

| No. | Component / Hardware Item | Subsystem Category | Key Specifications / Ratings | Operational Function |
| --- | --- | --- | --- | --- |
| **16** | **Ethernet Switch** | Networking | Compact 5-port Gigabit Ethernet switch; input voltage subject to model | Connects onboard computing and Ethernet-enabled devices |
| **19** | **RJ45 Cable 3m** | Networking | 3m Cat6 Ethernet cable | Provides wired Ethernet connections |
| **20** | **USB Dongle [C HUB] USB 3.2×4 0.15m** | Compute I/O | USB-C hub with four USB 3.2 ports | Expands the onboard computer's USB connections |
| **31** | **UART Interface Module** | Control Interface | CP2102 / FTDI USB-to-UART interface | Serial debugging, telemetry and communication monitoring |


#### E. FOD Remediation & Auxiliary Electrical Components

| No. | Component / Hardware Item | Subsystem Category | Key Specifications / Ratings | Operational Function |
| --- | --- | --- | --- | --- |
| **5** | **2800W Industrial Vacuum** | FOD Remediation | 2800W-rated suction motor; proposed 48V switched supply | Suction and collection of FOD into the containment system |
| **32** | **Solid State Relay (SSR) 10A** | Power Switching | DC-control SSR, 3–32V DC control input, 10A load rating | MCU-controlled switching of compatible auxiliary loads |
| **33** | **Indicator Light Tower** | Visual Safety | Three-tier 12V LED indicator, red/amber/green, with buzzer | Indicates operating states and fault conditions |
| **34** | **Bay Cooling Fans** | Thermal Control | Dual 12V brushless cooling fans | Provides airflow for onboard electrical equipment |
| **35** | **Rear Red Light Strip / Status Light** | Visual Safety | 12V red LED strip | Rear visibility and vehicle status indication |


The component numbers correspond to the original inventory, with structural materials and mechanical components excluded. Detailed electrical protection and power distribution considerations are presented in Section 5.1.2.

## 5.1.3.3 Wire Gauge & Interconnect Specifications

The wiring harness was divided into different conductor sizes according to the expected current demand and function of each circuit. Larger conductors were considered for the main battery and motor power connections, while smaller conductors were allocated to auxiliary power and communication signals.

| Wire specification | Intended application | Design consideration |
| --- | --- | --- |
| 8 AWG high-flex silicone wire | Main battery loop, kill switch and high-current power connections | High-current capacity and reduced resistive voltage drop |
| 12 AWG silicone wire | ZLAC8015D motor-driver power connections | Continuous and peak drivetrain current requirements |
| 16–18 AWG wire | DC-DC converter inputs and auxiliary power circuits | Converter input current, cable length and thermal limits |
| 20–22 AWG shielded twisted pair | CAN communication, encoder feedback and low-current signals | Signal integrity and reduced electromagnetic interference |

*Table 5.13: Proposed wire gauge and interconnect specifications.*

The proposed wire sizes remain subject to verification against the installed cable lengths, routing, insulation temperature ratings, connector specifications and measured operating currents. In particular, the 8 AWG main wiring and 100 A protection arrangement must be assessed together to ensure that the selected fuse provides adequate conductor protection.

The 50 A ANM branch fuse rating also requires review against the vacuum's actual electrical demand. Based on the original 2800 W rating at 48 V, the estimated current is approximately 58.33 A, exceeding the nominal fuse rating. The final branch protection, wiring and connectors must therefore be confirmed before the vacuum circuit is energised.

Detailed electrical protection considerations are presented in Section 5.1.2.


## 5.1.3.4 Component Integration & Verification

The electrical components have been identified based on the interim design requirements and proposed system architecture. However, several component specifications and integration requirements remain subject to confirmation.

| Development area | Outstanding work | Intended outcome |
| --- | --- | --- |
| Component verification | Confirm manufacturer specifications, voltage limits and current ratings | Finalise component compatibility |
| Power integration | Complete connections between the battery, distribution boards and electrical loads | Establish the physical electrical system |
| Sensor integration | Complete power and communication connections for the cameras, LiDAR and GNSS | Verify sensor operation with the onboard computing system |
| FOD remediation | Finalise the vacuum, stepper motor and IR sensor requirements | Update the collection-system electrical design |
| Electrical testing | Measure operating currents and verify component behaviour | Validate component selection and update the power budget |

*Table 5.14: Component integration and verification activities planned for Semester 2.*

These requirements provide the basis for subsequent hardware integration and testing. Detailed power distribution and electrical protection considerations are discussed in Section 5.1.2.

## 5.1.3.5 Limitations & Semester 2 Future Work

Although the electrical components have been identified based on the interim design requirements, several sensors and auxiliary devices have yet to be fully integrated and tested. Their compatibility and performance within the complete electrical system therefore remain unverified.

During Semester 2, electrical integration will focus on wiring and testing the GPS, JT16 LiDAR and ELP camera, together with further IMU testing. A PCB breakout board will also be designed to organise the electrical connections, simplify cable routing and improve maintainability. In addition, the electrical requirements of the redesigned FOD collection mechanism, including the stepper motors and IR sensor, will be incorporated into the final component configuration.

These developments will support the completion of the electrical subsystem and provide the basis for subsequent system-level validation.

<!-- #endregion report -->
