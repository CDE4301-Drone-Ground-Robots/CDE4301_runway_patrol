---
title: "Components BOM"
owner: "Bryan Ng"
outline: [2,3]
---
# Components BOM

[← Back to Electrical Subsystem](../../report.md#electrical)

<!-- #region report -->

## Master Electrical & Hardware Component List (35 Items)

Comprehensive itemized inventory of all electrical hardware, battery storage, safety disconnects, high-power DC-DC converters, motor drivers, and sensor interfaces engineered for the FOD Hunter UGV:

| No. | Component / Hardware Item | Subsystem Category | Key Specifications / Ratings | Operational Function |
| --- | --- | --- | --- | --- |
| **1** | **48V 20Ah LiFePO4 Battery Pack** | Power Storage | 48V nom (51.2V float), 20Ah, 960–1024 Wh, with dedicated CC/CV charger | Primary high-voltage energy storage for drive and vacuum |
| **2** | **BMS 6S–22S LiFePO4 100A** | Battery Management | 100A continuous discharge, cell balancing, low/over voltage & temp cutoffs | Internal cell protection against short-circuit and over-current |
| **3** | **8 AWG Main Fuse 100A** | Primary Protection | 8 AWG high-flex silicone wire, 100A fast-acting inline fuse | Master battery output circuit protection against dead shorts |
| **4** | **Kill Switch 100A** | Hardware Safety | 100A continuous heavy-duty master rotary disconnect switch | Manual lock-out / tag-out safety isolation for entire vehicle |
| **5** | **2800W Industrial Vacuum** | FOD Remediation | 2800W high-flow suction motor, 48V switched supply | Heavy debris suction and ingestion into containment hopper |
| **6** | **201 ANM Fuse Box** | Power Distribution | High-current ANM bolted fuse holder enclosure | Encloses primary high-amperage branch fuses |
| **7** | **50A 3-Piece ANM Fuse** | Branch Protection | 50A bolted ANM fuses (3 pcs) | Protects 2800W vacuum and ZLAC8015D motor driver branches |
| **8** | **Blade Fuse Box** | Low-Voltage PDB | Multi-slot automotive ATC/ATO blade fuse distribution block | Houses individual branch fuses for buck regulators and lights |
| **9** | **Blade Fuses 10A & 15A** | Branch Protection | Standard automotive blade fuses (10A, 15A) | Protects 20V laptop, 12V auxiliary, and 5V MCU buck lines |
| **10** | **CAN Transceiver** | Communications | High-speed isolated CAN bus transceiver module (1 Mbps) | Enables robust CAN communication between MCU and ZLAC driver |
| **11** | **Microcontroller (MCU): STM32 F446RE** | Low-Level Control | STM32F446RE ARM Cortex-M4 (180 MHz, CAN, UART, USB CDC) | Connects via USB to Hilbert's PC; sends CAN bus velocity commands to ZLAC8015D driver |
| **12** | **PDB XT60 1-to-6 Way** | Power Distribution | Heavy-copper parallel busboard, 1x XT60 input to 6x XT60 outputs | Distributes 48V power to motor driver, vacuum, and buck inputs |
| **13** | **PDB XT60 to XT30 6-Way** | Power Distribution | XT60 input stepping down to 6x compact XT30 distribution lines | Feeds lower-current buck converters and auxiliary devices |
| **14** | **Hub Motor ZLLG80ASM25 0-HT V2.0** | Traction Actuation | 8-inch direct-drive brushless hub motor, built-in encoder, high torque | Direct-drive UGV wheels achieving ≥10 km/h with zero gearbox backlash |
| **15** | **Servo Driver ZLAC8015D V4.2** | Motor Control | Dual-channel DC brushless servo driver, CAN / RS485 / PWM interfaces | Precision closed-loop current, velocity, and position control |
| **16** | **Ethernet Switch** | Networking | Industrial compact 5-port Gigabit Ethernet switch (12V DC) | Bridges onboard compute, base telemetry router, and vision nodes |
| **17** | **PETG CF Filament** | Structural Materials | Carbon-fiber reinforced PETG 3D printing filament | High stiffness, heat-resistant brackets, sensor mounts, and ducting |
| **18** | **Suspension Shock Absorber** | Mechanical Chassis | Adjustable coil-over spring hydraulic dampers | Isolates chassis and electronics from airfield joint vibrations |
| **19** | **RJ45 Cable 3m** | Networking | Cat6 shielded twisted pair (STP) Ethernet cabling | Interconnects onboard Ethernet switch with telemetry transceivers |
| **20** | **USB Dongle \[C HUB\] USB 3.2×4 0.15m** | Compute I/O | High-speed USB-C to 4-port USB 3.2 Gen 2 hub | Expands Hilbert's Laptop I/O to GMSL2 deserializer, MCU, and GPS |
| **21** | **LI-IMX568-GMSL2-050H RGB Camera** | Perception Sensor | Sony IMX568 global shutter CMOS, GMSL2 serial interface, IP67 | High-speed, low-latency target FOD detection without motion blur |
| **22** | **GMSL2 Deserialiser Board** | Sensor Interface | Maxim MAX9296A deserializer to USB3 / MIPI CSI-2 bridge | Decodes camera Fakra GMSL2 stream directly into Hilbert's laptop |
| **23** | **Headlights for CV** | Active Illumination | High-lumen wide-angle 12V LED floodlights | Eliminates pavement shadow false positives during dawn/dusk sweeps |
| **24** | **UM980 GPS Module** | Localization | Unicore UM980 multi-band all-constellation high-precision RTK GNSS | Provides centimeter-level positioning accuracy along runway axis |
| **25** | **Wireless Switch for ESC Remote** | Wireless Safety | 2-channel long-range RF remote relay receiver with transmitter | Safety operator wireless remote kill switch for ESC cut-off |
| **26** | **Fakra 1m Type 7 Cable** | Sensor Cabling | Automotive coaxial cable with water-tight Fakra Type Z/7 connectors | Transmits high-bandwidth GMSL2 video from camera to deserializer |
| **27** | **TPU 98A Filament** | Vibration Dampening | Abrasion-resistant 98A Shore hardness thermoplastic polyurethane | Flexible seals, weather gaskets, and vibration-absorbing motor boots |
| **28** | **20V Buck Converter** | Compute Power | 48V to 20V DC-DC synchronous step-down converter (10A max) | Powers Hilbert's Laptop directly from the 48V vehicle battery |
| **29** | **12V Buck Converter** | Auxiliary Power | 48V to 12V DC-DC synchronous step-down converter (15A max) | Powers Ethernet switch, cooling fans, CV headlights, and light tower |
| **30** | **5V Buck Converter** | Logic Power | 48V to 5V DC-DC step-down converter (5A max) | Powers MCU, UM980 GPS, CAN transceiver, and USB peripherals |
| **31** | **UART Interface Module** | Control Interface | CP2102 / FTDI USB-to-UART serial interface | Debugging telemetry bridge and MCU serial console monitoring |
| **32** | **Solid State Relay (SSR) 10A** | Power Switching | DC-DC optocoupled solid state relay (3–32V DC control, 10A load) | Allows MCU digital output pin to switch auxiliary coils and beacons |
| **33** | **Indicator Light Tower** | Visual Safety | 3-tier 12V LED industrial stack light (Red, Amber, Green) + buzzer | Visual indication of UGV state (Manual, Autonomous, Error/E-Stop) |
| **34** | **Bay Cooling Fans** | Thermal Control | Dual 12V high-CFM brushless chassis exhaust fans | Forces cooling airflow across the laptop, motor driver, and battery bay |
| **35** | **Rear Red Light Strip / Status Light** | Airfield Safety | Automotive-grade 12V red LED tail illumination strip | Guarantees airside visibility from behind for escort and ATC vehicles |

## Wire Gauge & Interconnect Specifications

To safely handle the high currents demanded by the 48V power bus without excessive resistive voltage drop or overheating, the wiring harness is partitioned into distinct gauge tiers:

- **8 AWG Silicone High-Flex Wire:** Master battery loop, 100A kill switch, and 2800W vacuum motor feed (rated up to 100A peak).
- **12 AWG Silicone Wire:** ZLAC8015D dual-channel motor driver power leads (rated for 30A continuous per channel).
- **16–18 AWG Wire:** 48V-to-12V and 48V-to-19V DC-DC buck converter inputs and high-current 12V auxiliary branches.
- **20–22 AWG Shielded Twisted Pair:** CAN bus communication lines, encoder feedback, and logic power to Arduino/RP2040 microcontrollers.

## Procurement Status & Testing Notes

All 35 listed hardware components have been successfully sourced and bench-tested:

- **Battery & BMS Validation:** The 48V 20Ah LiFePO4 pack has undergone charge/discharge cycling with individual cell balancing verified within ±15mV.
- **Kill Switch & Emergency Stop:** Dual hardware E-Stop contactors tested under full 50A simulated load; disconnect response latency verified &lt;10ms.
- **Power Bus Stability:** Step-down regulators (48V to 19V for laptop, 48V to 12V for lights/fans, 48V to 5V for sensors) maintain &lt;1.5% voltage ripple under transient motor loads.

<!-- #endregion report -->
