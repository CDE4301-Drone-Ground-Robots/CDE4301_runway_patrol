---
title: "STM32 Low-Level Control Unit"
description: "Two-tier embedded control architecture, STM32 NUCLEO-F446RE selection rationale, peripheral pin allocation, and hardware safety interlocks."
owner: "Gabriel Tan"
outline: [2, 3]
---

# STM32 Low-Level Control Unit

> **Semester 1 engineering documentation · Gabriel Tan**  
> **Evidence boundary:** This page documents the STM32 NUCLEO-F446RE low-level controller architecture, worst-case compute budget, and benchtop hardware integration (CAN motor drivers, USB Host gamepad, and 5 V current-sinking stepper drive). Semester 2 expansion sensors (BMS, RTK GPS, IMU, telemetry radio, ToF) have pre-allocated pins and buses but remain to be integrated on the final carrier PCB.

<!-- #region microcontrollers -->

<!-- #region report -->

## 1. Objectives & Role as the Real-Time "Spinal Cord" {#why-dedicated-ecu}

The STM32 is the robot’s real-time “spinal cord”. It drives the four wheels, runs the vacuum-head stepper actuator, and handles low-level safety so the Jetson companion computer can focus on computer vision and high-level autonomy. If the Jetson or the wireless controller link drops, the STM32 stops the robot on its own.

Splitting the UGV compute stack into a high-level autonomy processor (NVIDIA Jetson) and a bare-metal microcontroller (STM32 NUCLEO-F446RE) follows the proven industry pattern used in Pixhawk flight controllers and ROBOTIS TurtleBot3 (OpenCR). It guarantees **failsafe isolation** (an OS crash or frame drop on the Jetson triggers an independent CiA 402 Quick-Stop on the STM32) and **deterministic timing** (microsecond step pulses and a 50 Hz velocity control loop execute without Linux OS preemption).

<Figure
  src="./assets/diagrams/stm32-hardware-two-tier-computing-split-architecture-di.svg"
  alt="Two-Tier Computing Split Architecture Diagram"
  caption="**Figure 1.1: Two-Tier Computing Split Architecture.** High-level perception and ROS 2 path planning execute on the Jetson companion computer, while the bare-metal STM32F446RE handles deterministic 500 kbps CAN motor control, microsecond stepper timing, USB Host teleoperation, and hardware/firmware safety watchdogs."
/>

::: details Detailed architectural rationale and hardware summary

| Subsystem | Hardware Implementation | Key Specifications & Role |
| :--- | :--- | :--- |
| **Microcontroller** | **STM32 NUCLEO-F446RE** (ARM Cortex-M4 with FPU) | 180 MHz clock, chosen for its **2 hardware CAN buses** and **6 UARTs** plus 5 V-tolerant I/O. |
| **Drive** | **2× ZLAC8015D** motor drivers on shared CAN bus | **500 kbps CAN1** (`PB8`/`PB9`), powering **4 hub motors** (**263 mm wheels**, **400 RPM max**). |
| **Operator Control** | **Wireless gamepad (GameSir)** | Plugged straight into the STM32 over **USB host** (`PA11`/`PA12`); **no laptop needed**. |
| **Vacuum Head** | **Stepper motor + TB6600 driver** (110 mm stroke) | Uses **5 V current-sinking** (`PC2` PUL−, `PC3` DIR− open-drain) so the **3.3 V STM32** can switch it reliably. |
| **Power & Safety** | **48 V LiFePO4 battery** + wireless kill switch + contactor | A **wireless kill switch** triggers the motor drivers’ built-in emergency stop, and a **safety contactor** cuts motor power while keeping the computers alive. |
| **Ready for Semester 2** | Pre-allocated expansion pins & serial buses | Pins already allocated for the **battery BMS** (`USART1`), **UM980 RTK GPS** (`USART3`), **IMU** (`I2C1`), **telemetry radio** (`UART4`), **ToF sensor** (`UART5`), **vacuum relay** (`PC0`), and **lights** (`PB4`/`PB5`). |

:::

<!-- #endregion microcontrollers -->

## 2. Design Methodology & Microcontroller Selection {#requirements-selection}

Selecting the low-level controller required matching the UGV's concurrent peripheral demands — dual-node CANopen motor control, standalone USB Host teleoperation, microsecond stepper pulse generation, and four concurrent asynchronous UART streams — without relying on fragile software bit-banging or external protocol bridges.

The **STM32 NUCLEO-F446RE** (ARM Cortex-M4 with FPU at 180 MHz) was selected over five alternative boards primarily for its **2 hardware CAN buses** and **6 hardware UARTs**, native USB 2.0 OTG Full-Speed Host support, and **5 V-tolerant I/O pins**. Worst-case cycle budgeting across all active peripherals totals **17.16 MHz** (9.5% of the 180 MHz clock), or **34.32 MHz** (19.1%) with a conservative $2\times$ industrial safety margin, leaving **>80% compute headroom** (145.68 MHz) for Semester 2 sensor fusion and micro-ROS serial framing.

::: details Hard requirements specification and worst-case compute budget

**Table 2.1: Hard Peripheral & Compute Requirements**

| Requirement | Target Specification | Peripheral Allocation | Engineering Justification |
| :--- | :--- | :--- | :--- |
| **Hardware Serial Ports** | **≥ 4 UART / USART** (6 available) | BMS (`USART1`), Jetson / Debug (`USART2`), UM980 RTK GPS (`USART3`), Telemetry Radio (`UART4`), ToF (`UART5`) | Enables concurrent, non-blocking DMA serial streaming without software serial emulation or bus multiplexing. |
| **CAN Bus Controller** | **≥ 1 bxCAN @ 500 kbps** (2 available) | `CAN1` (`PB8`/`PB9`) → Two ZLAC8015D drivers (4 hub motors, 263 mm wheels, 400 RPM max) | Native differential industrial bus with hardware message ID filtering for real-time CiA 402 velocity commands. |
| **USB Host Interface** | **USB 2.0 OTG FS Host** | `PA11` (`DM`), `PA12` (`DP`) → Wireless GameSir gamepad plugged directly into the STM32 | Permits direct standalone manual driving and diagnostics with no laptop or ROS 2 network stack needed. |
| **Compute Clock Budget** | **≥ 35 MHz (FPU core)** | STM32F446RE ARM Cortex-M4F operating at 180 MHz | Comfortably absorbs peak peripheral interrupt loads (17.16 MHz raw + 2× margin = 34.32 MHz) with &gt;80% headroom. |

**Table 2.2: Worst-Case Compute Cycle Budget (180 MHz Cortex-M4F)**

| Task | Assumption | CPU Load |
| :--- | :--- | :--- |
| **4× UART (BMS, GPS, radio, ToF)** | 4 ch × 11,520 B/s (115,200 baud ÷ 10 bits) = 46,080 B/s | × 150 cycles/byte = **6.91 MHz** |
| **CAN to ZLAC8015D** | 9,000 frames/s (1 Mbps bus saturation ceiling) | × 350 cycles/frame = **3.15 MHz** |
| **GPS parsing** | 10 Hz × 5 sentences × 80 B = 4,000 B/s | × 100 cycles/byte = **0.40 MHz** |
| **Stepper pulses** | 20,000 interrupts/s (10 kHz, 2 edges per pulse) | × 75 cycles = **1.50 MHz** |
| **IMU over I2C** | 100 reads/s | × 2,000 cycles = **0.20 MHz** |
| **USB host + main loop** | Polling, HID parsing & 50 Hz kinematics/ramping | **5.00 MHz** |
| **Total Base Load** | Worst-case unscaled sum across active peripherals | **17.16 MHz (9.5%)** |
| **With 2× Safety Margin** | Conservative industrial doubling for jitter & telemetry spikes | **34.32 MHz (19.1%)** |
| **Available Headroom** | Remaining clock budget on 180 MHz Cortex-M4F | **145.68 MHz (>80%)** |

:::

::: details Candidate microcontroller evaluation matrix

<table class="data-table"><tbody>
<tr><th>Board</th><th>UART</th><th>CAN</th><th>Logic / Clock</th><th>Verdict</th></tr>
<tr><td><strong>Arduino Uno/Nano</strong></td><td>1</td><td>0</td><td>5 V, 16 MHz</td><td><Badge type="danger" text="✗ Too few ports, too slow" /></td></tr>
<tr><td><strong>Arduino Mega 2560</strong></td><td>4</td><td>0</td><td>5 V, 16 MHz</td><td><Badge type="danger" text="✗ No CAN, too slow" /></td></tr>
<tr><td><strong>ESP32</strong></td><td>3</td><td>1</td><td>3.3 V, 240 MHz</td><td><Badge type="danger" text="✗ Too few UARTs" /></td></tr>
<tr><td><strong>Raspberry Pi Pico</strong></td><td>2</td><td>0</td><td>3.3 V, 133 MHz</td><td><Badge type="danger" text="✗ Too few UARTs, no CAN" /></td></tr>
<tr><td><strong>Teensy 4.1</strong></td><td>8</td><td>3</td><td>3.3 V, 600 MHz</td><td><Badge type="warning" text="Backup" /></td></tr>
<tr><td><strong>NUCLEO-F446RE</strong> <Badge type="tip" text="SELECTED" /></td><td>6</td><td>2</td><td><strong>3.3 V (5 V-tolerant I/O), 180 MHz</strong></td><td><Badge type="tip" text="✓ Selected" /></td></tr>
</tbody></table>

**Selection Rationale:** While the Teensy 4.1 offers a higher clock frequency on paper, its 3.3 V-only GPIOs are not 5 V-tolerant. The **STM32 NUCLEO-F446RE** provides 5 V-tolerant open-drain pins (enabling direct 5 V current-sinking for the TB6600 stepper optocouplers), STM32CubeMX pin/clock configuration, industry-standard HAL drivers, and an integrated ST-Link hardware debugger with Virtual COM Port telemetry.

:::

## 3. Hardware Architecture, Power & Safety Interlocks {#interface-wiring}

The low-level hardware architecture integrates five functional groups around the STM32 NUCLEO-F446RE, separating high-power 48 V traction lines from 3.3 V / 5 V logic and ensuring that hardware emergency stops function even if software freezes:

1. **4WD CAN Bus Drivetrain:** Two **ZLAC8015D** dual-channel FOC servo drivers share a single **500 kbps CAN bus** (`CAN1` on `PB8` RX / `PB9` TX via an external CAN transceiver), powering the **four 263 mm, 400 RPM max hub motors** (Node 1 = front axle, Node 2 = rear axle). For drivetrain torque sizing, see [Motor Drivetrain Calculations](../hilbert/motor-drivetrain-calculation.md).
2. **Standalone USB Host Operator Control:** A wireless **GameSir** gamepad receiver plugs straight into the STM32's **USB 2.0 OTG FS Host** port (`PA11` DM / `PA12` DP), allowing an operator to drive the robot and jog the vacuum head directly without a laptop.
3. **Vacuum-Head Stepper Drive (5 V Current-Sinking):** The 110 mm linear actuator stepper motor is driven through a **TB6600** microstep driver. Because a 3.3 V GPIO cannot source enough current through the TB6600's internal optocoupler LEDs + series resistors, `PUL+` and `DIR+` are tied to the **5 V rail** and the STM32 sinks `PUL−` (`PC2`) and `DIR−` (`PC3`) in **open-drain mode**, switching the full 5 V swing reliably without an external level shifter.
4. **48 V Power & Dual-Tier Hardware Safety:** The traction system runs off a **48 V LiFePO4 battery**. A **wireless kill switch** triggers the ZLAC8015D motor drivers' built-in emergency stop input (monitored on `PB1`), while a **safety contactor** cuts 48 V motor power completely while keeping the STM32 and Jetson computers alive for diagnostics and logging. For the full power distribution schematic, see [Components & BOM](../bryan/components-bom.md).
5. **Pre-Allocated Semester 2 Expansion:** Pins and hardware buses are already assigned in the pinout map for the **battery BMS** (`USART1`), **UM980 RTK GPS** (`USART3`), **9-DOF IMU** (`I2C1`), **telemetry radio** (`UART4`), **ToF distance sensor** (`UART5`), **vacuum relay** (`PC0`), and **headlights / status lights** (`PB4`, `PB5`).

<Figure
  src="./assets/images/comm-diagram.jpeg"
  alt="NUCLEO-F446RE wiring diagram grouped by Sensor, Power, Motor, Visual and User Input subsystems"
  caption="**Figure 3.1: STM32 NUCLEO-F446RE Complete Pin & Interface Allocation.** Hardware wiring map covering all 11 external devices across Motor, User Input, Power, Sensor, Actuator, and Visual subsystems."
/>

::: details Interactive pinout & peripheral interface table (11 devices)

Use the search bar or subsystem filter pills below to inspect the exact protocol and pin assignment for each connected device:

<Stm32HardwareWidget1 />

<Stm32HardwareWidget2 />

:::

## 4. Limitations & Semester 2 Plan (Carrier PCB & Sensor Bring-Up) {#carrier-pcb}

During Semester 1 benchtop and chassis testing, interconnections between the Nucleo board, CAN transceiver, TB6600 stepper driver, and USB Host port were routed using breadboard and DuPont jumper harnesses. While sufficient for laboratory verification, loose jumper headers are susceptible to fretting corrosion and disconnection under runway pavement vibration.

For Semester 2, a custom **KiCad carrier PCB** is being designed to seat the NUCLEO-F446RE headers and route all 11 interfaces — including the pre-allocated BMS, UM980 RTK GPS, IMU, telemetry radio, ToF sensor, vacuum relay, and indicator lights — to **lockable JST-XH / JST-PA connectors** with an onboard isolated CAN transceiver and regulated 5 V rail.

<Figure
  src="./assets/images/kicad-schematic.png"
  alt="KiCad carrier board schematic and layout placeholder"
  caption="**Figure 4.1: Custom STM32 Carrier PCB (Work in Progress for Semester 2).** Replaces loose jumper wires with locking JST-XH/PA connectors, an onboard CAN transceiver, and dedicated 5 V common-anode pull-ups for the TB6600 stepper driver."
/>

**Related documentation:** [STM32 Firmware Architecture & Control →](./stm32-firmware.md) · [Motor Drivetrain Calculations →](../hilbert/motor-drivetrain-calculation.md) · [Steering Kinematics →](../hilbert/steering-kinematics.md) · [Electrical Components & BOM →](../bryan/components-bom.md)

<!-- #endregion report -->

National University of Singapore · CDE4301 Capstone Project

<CardGrid :cols="2">

<Card>

← [Previous Documentation](./vision-research.md)

Computer Vision Research

</Card>

<Card>

[Next Architecture](./stm32-firmware.md) →

STM32 Firmware Architecture & Control

</Card>

</CardGrid>
