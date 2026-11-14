---
title: "Components List"
owner: "Bryan Ng"
outline: [2,3]
---
# Components List

[← Back to Electrical Subsystem](../../report.md#electrical)

<!-- #region report -->

The electrical components of FOD Hunter were selected based on the power requirements established in Section 5.1.1 and the distribution architecture developed in Section 5.1.2. The selection considers electrical compatibility, communication interfaces, physical integration and component availability to support the intended runway patrol and FOD remediation operations.

This section presents the component selection criteria, electrical hardware specifications and integration requirements, followed by the limitations of the interim design and the remaining work planned for Semester 2.

## 5.1.3.1 Component Selection Criteria

The selection of electrical components was guided by their operating requirements and compatibility with the overall UGV architecture. Particular consideration was given to components operating directly from the main battery supply and those requiring regulated low-voltage power.

| Selection criterion | Design consideration | Engineering justification |
| --- | --- | --- |
| Voltage compatibility | Compatibility with the 48 V-class battery and regulated 20 V, 12 V and 5 V supplies | Ensures that components operate within their specified voltage ranges |
| Current requirements | Continuous current, startup current and peak demand | Supports appropriate selection of converters, wiring, connectors and protection devices |
| Communication interfaces | CAN, UART, USB, RS485 and Ethernet compatibility | Allows communication between the STM32, onboard computer, motor drivers and sensors |
| Electrical protection | Compatibility with the BMS, fuses and switching devices | Supports circuit protection and electrical isolation |
| Physical integration | Dimensions, connector types, cooling and mounting requirements | Allows components to be accommodated and maintained within the chassis |
| Cost and availability | Procurement cost, supplier availability and lead time | Supports component selection within the project budget and schedule |

*Table 5.12: Electrical component selection criteria.*

These criteria were used to evaluate the electrical hardware and identify potential integration constraints. Components with unconfirmed specifications will undergo further datasheet review and testing before final installation.

## 5.1.3.2 Electrical Components List

The electrical components are grouped according to their functions within the UGV, including energy storage, electrical protection, power distribution, drivetrain control, computing, sensing, communication and auxiliary operation.

### A. Battery, Power Distribution & Electrical Protection

| No. | Component / Hardware Item | Subsystem Category | Key Specifications / Ratings | Operational Function |
| --- | --- | --- | --- | --- |
| **1** | **48 V 20 Ah LiFePO4 Battery Pack** | Power Storage | 48 V class; 51.2 V nominal if 16S; 20 Ah; 1024 Wh for 16S | Main electrical energy storage |
| **2** | **BMS 6S–22S LiFePO4 100 A** | Battery Management | 100 A continuous discharge rating; cell monitoring and balancing | Battery monitoring and protection |
| **3** | **8 AWG Main Wiring & 100 A Fuse** | Primary Protection | 8 AWG conductor; 100 A fuse, subject to coordination verification | Main battery output protection |
| **4** | **100 A Kill Switch** | Hardware Safety | 100 A-rated master disconnect; DC interruption rating to be verified | Manual electrical isolation |
| **6** | **201 ANM Fuse Box** | Power Distribution | High-current ANM bolted fuse holder | Houses high-current branch fuses |
| **7** | **50 A ANM Fuses** | Branch Protection | Three 50 A ANM fuses | Protection of selected high-current circuits |
| **8** | **Blade Fuse Box** | Auxiliary Distribution | Multi-slot automotive blade fuse holder | Houses auxiliary circuit fuses |
| **9** | **10 A & 15 A Blade Fuses** | Branch Protection | Automotive blade fuses | Protection of selected auxiliary circuits |
| **12** | **XT60 1-to-6 Power Distribution Board** | Power Distribution | One XT60 input and six XT60 outputs | Distribution to compatible branches |
| **13** | **XT60-to-XT30 Distribution Board** | Power Distribution | XT60 input and six XT30 outputs | Distribution to lower-current circuits |
| **28** | **20 V Buck Converter** | Computing Power | 20 V output; 10 A maximum | Regulated supply for compatible computing equipment |
| **29** | **12 V Buck Converter** | Auxiliary Power | 12 V output; 15 A maximum | Supplies sensors, communication equipment and auxiliaries |
| **30** | **5 V Buck Converter** | Logic Power | 5 V output; 5 A maximum | Supplies compatible low-voltage electronics |

*Table 5.13: Battery, power distribution and electrical protection components.*

The battery and distribution components form the main electrical supply system. Their circuit arrangements and protection requirements are discussed in Section 5.1.2.

### B. Drivetrain & Motor Control

| No. | Component / Hardware Item | Subsystem Category | Key Specifications / Ratings | Operational Function |
| --- | --- | --- | --- | --- |
| **10** | **CAN Transceiver** | Communication | High-speed CAN interface; isolation dependent on selected module | Physical-layer communication between STM32 and motor drivers |
| **11** | **STM32 Nucleo-F446RE** | Low-Level Control | ARM Cortex-M4, 180 MHz; CAN, UART, USB and I2C peripherals | Motor commands, actuator control and peripheral interfacing |
| **14** | **ZLLG80ASM25 0-HT V2.0 Hub Motor** | Traction Actuation | 8-inch brushless hub motor with encoder | Wheel propulsion and motion feedback |
| **15** | **ZLAC8015D V4.2 Servo Driver** | Motor Control | Dual-channel brushless servo driver; CAN communication | Closed-loop hub motor control |
| **25** | **Wireless Switch for ESC Remote** | Wireless Safety | Two-channel RF receiver and transmitter | Remote switching or motor-disable function, subject to verification |

*Table 5.14: Drivetrain and motor control components.*

The STM32 provides low-level control of the drivetrain through CAN communication with the ZLAC8015D motor drivers. Hub motor encoders provide feedback for closed-loop control. Detailed motor control algorithms and STM32 firmware development are documented separately.

### C. Onboard Computing, Sensors & Imaging

| No. | Component / Hardware Item | Subsystem Category | Key Specifications / Ratings | Operational Function |
|---|---|---|---|---|
| **21** | **ELP 5MP 6mm USB Camera** | Perception Sensor | 5 MP; 2592 × 1944 resolution; 6 mm lens; USB UVC; 5 V DC; approximately 1.05 W for assumed model | Visual perception and FOD confirmation |
| **22** | **Hesai JT16 LiDAR** | Navigation Sensor | 16-channel 3D LiDAR; 12–16 V DC; approximately 4.3 W typical; RS485 interface | Environmental perception and obstacle detection |
| **23** | **Headlights for Computer Vision** | Active Illumination | 12 V LED floodlights | Illumination during low-light operation |
| **24** | **UM980 GNSS Module** | Localisation | Multi-band, multi-constellation RTK GNSS receiver | High-precision positioning for navigation |

*Table 5.15: Computing, sensing and imaging components.*

The ELP camera replaces the original GMSL2 configuration and connects through a compatible USB interface without requiring a separate GMSL2 deserialiser.

The Hesai JT16 LiDAR provides three-dimensional environmental measurements through its RS485 interface. A compatible high-speed RS485 connection is required for communication with the onboard computer.

The final electrical specifications and communication connections will be verified against the purchased sensor variants.

### D. Communication & Electrical Interfaces

| No. | Component / Hardware Item | Subsystem Category | Key Specifications / Ratings | Operational Function |
| --- | --- | --- | --- | --- |
| **16** | **Ethernet Switch** | Networking | Compact five-port Gigabit Ethernet switch; supply rating dependent on model | Connects Ethernet-enabled onboard devices |
| **19** | **RJ45 Cable** | Networking | 3 m Cat6 cable | Wired Ethernet communication |
| **20** | **USB 3.2 Four-Port Hub** | Computing Interface | USB-C input; four USB ports | Expands available USB connections |
| **31** | **USB-to-UART Interface** | Serial Communication | CP2102 or FTDI interface | Serial debugging and communication monitoring |
| **37** | **USB-to-RS485 Interface — Proposed** | LiDAR Communication | High-speed RS485 interface compatible with JT16 data rate | Connects JT16 LiDAR to the onboard computer |

*Table 5.16: Communication and electrical interface components.*

These interfaces support data exchange between the onboard computer, microcontroller, motor drivers and sensors. The revised camera and LiDAR selections remove the need for GMSL2-specific hardware but require verification of the JT16 serial interface.

### E. FOD Remediation & Auxiliary Electrical Components

| No. | Component / Hardware Item | Subsystem Category | Key Specifications / Ratings | Operational Function |
| --- | --- | --- | --- | --- |
| **5** | **2800 W Industrial Vacuum** | FOD Remediation | 2800 W rated; proposed 48 V-class switched supply; actual input specifications to be confirmed | Generates suction for FOD collection |
| **32** | **10 A Solid State Relay** | Power Switching | 3–32 V DC control; 10 A load rating, subject to device specification | Switching of compatible auxiliary loads |
| **33** | **Indicator Light Tower** | Visual Safety | Three-tier 12 V LED indicator with buzzer | Displays operating and fault states |
| **34** | **Bay Cooling Fans** | Thermal Control | Dual 12 V brushless fans | Cooling of onboard electrical equipment |
| **35** | **Rear Red Status Light** | Visual Safety | 12 V LED strip | Rear visibility and vehicle status indication |
| **39** | **Stepper Motor & Driver — Planned** | Collection Actuation | NEMA17-class stepper; ratings to be confirmed | Actuation of the redesigned collection mechanism |
| **40** | **IR Sensor — Planned** | Collection Verification | Model and supply requirements to be confirmed | Confirmation of FOD clearance |

*Table 5.17: FOD remediation and auxiliary electrical components.*

The 2800 W industrial vacuum remains the selected suction component for the interim electrical design. The proposed redesign of the FOD collection mechanism introduces additional electrical requirements for stepper motor actuation and IR-based clearance confirmation. These components will be incorporated into the updated power budget once their specifications and operating sequence have been confirmed.

The component numbers correspond to the original inventory, with structural materials and mechanical components excluded. Detailed electrical protection and power distribution considerations are presented in Section 5.1.2.

## 5.1.3.3 Wire Gauge & Interconnect Specifications

The wiring harness was divided into conductor groups according to the expected current demand and function of each circuit. Larger conductors were proposed for the main battery and motor-driver connections, while smaller conductors were allocated to auxiliary power and communication signals.

| Circuit | Proposed conductor | Intended application |
| --- | --- | --- |
| Main battery loop | 8 AWG high-flex silicone wire | Battery connection and primary distribution |
| Motor-driver supply | 12 AWG silicone wire | Power connections to ZLAC8015D drivers |
| Selected auxiliary circuits | 16–18 AWG wire | Converter inputs and lower-current auxiliary connections |
| Communication and control | 20–22 AWG shielded twisted pair | CAN communication and compatible low-current signals |
| Vacuum supply | To be verified | High-current connection to the 2800 W vacuum |

*Table 5.18: Proposed wire gauge and interconnect specifications.*

The conductor sizes remain subject to verification against continuous and startup currents, cable lengths, insulation ratings and connector specifications. The vacuum supply requires particular attention because its estimated current is approximately 58.33 A at 48 V, assuming the 2800 W rating represents electrical input power.

The final wiring arrangement will also consider separation of high-current power connections from sensitive communication and control signals to reduce electromagnetic interference.

Detailed electrical protection and conductor verification requirements are discussed in Section 5.1.2.

## 5.1.3.4 Limitations & Semester 2 Future Work

The electrical components were identified based on the interim design requirements and proposed system architecture. However, several specifications and integration requirements remain subject to confirmation, particularly for the revised camera, LiDAR and collection mechanism.

During Semester 2, electrical integration will focus on wiring and testing the UM980 GNSS module, Hesai JT16 LiDAR and ELP camera, together with further IMU testing. The redesigned FOD collection mechanism will also require integration of the 2800 W vacuum, stepper motors and IR sensor.

A PCB breakout board will be designed to organise the electrical connections, simplify cable routing and improve maintainability. Its design will be developed around the final component interfaces and electrical requirements.

These activities will support the completion of the electrical subsystem and provide the basis for subsequent component-level and system-level validation.

<!-- #endregion report -->
