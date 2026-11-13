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

*Table 5.11: Proposed wiring specifications for the electrical subsystem.*

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
| --- | --- | --- | --- | --- |
| **21** | **LI-IMX568-GMSL2-050H RGB Camera** | Perception Sensor | Sony IMX568 global-shutter CMOS sensor, GMSL2 interface, IP67-rated camera assembly | Visual detection and confirmation of FOD |
| **22** | **GMSL2 Deserialiser Board** | Sensor Interface | MAX9296A-based GMSL2 deserialiser; host interface dependent on selected board | Converts camera serial data for the onboard computing system |
| **23** | **Headlights for CV** | Active Illumination | 12V LED floodlights | Provides illumination for visual detection under low-light conditions |
| **24** | **UM980 GPS Module** | Localisation | Unicore UM980 multi-band, multi-constellation RTK GNSS receiver | Provides high-precision positioning for navigation |
| **26** | **Fakra 1m Type 7 Cable** | Sensor Cabling | 1m automotive coaxial cable with compatible Fakra connectors | Transmits GMSL2 camera data to the deserialiser |


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

*Table 5.12: Proposed wire gauge and interconnect specifications.*

The proposed wire sizes remain subject to verification against the installed cable lengths, routing, insulation temperature ratings, connector specifications and measured operating currents. In particular, the 8 AWG main wiring and 100 A protection arrangement must be assessed together to ensure that the selected fuse provides adequate conductor protection.

The 50 A ANM branch fuse rating also requires review against the vacuum's actual electrical demand. Based on the original 2800 W rating at 48 V, the estimated current is approximately 58.33 A, exceeding the nominal fuse rating. The final branch protection, wiring and connectors must therefore be confirmed before the vacuum circuit is energised.

Detailed electrical protection considerations are presented in Section 5.1.2.


## 5.1.3.4 Limitations & Semester 2 Future Work

The electrical components have been identified based on the interim design requirements and proposed system architecture. However, several component specifications and integration requirements remain subject to confirmation.

| Development area | Outstanding work | Intended outcome |
| --- | --- | --- |
| Component verification | Confirm manufacturer specifications, voltage limits and current ratings | Finalise component compatibility |
| Power integration | Complete connections between the battery, distribution boards and electrical loads | Establish the physical electrical system |
| Sensor integration | Complete power and communication connections for the cameras, LiDAR and GNSS | Verify sensor operation with the onboard computing system |
| FOD remediation | Finalise the vacuum, stepper motor and IR sensor requirements | Update the collection-system electrical design |
| Electrical testing | Measure operating currents and verify component behaviour | Validate component selection and update the power budget |

*Table 5.13: Component integration and verification activities planned for Semester 2.*

The component selection establishes the hardware required for the electrical subsystem and provides the basis for subsequent physical integration. The final component specifications and operating performance will be verified during Semester 2 through datasheet review, subsystem testing and full-system integration.

<!-- #endregion report -->
