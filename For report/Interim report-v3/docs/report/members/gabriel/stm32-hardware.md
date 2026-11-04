---
title: "STM32 Low-Level Control Unit"
owner: "Gabriel Tan"
outline: [2,3]
---
# STM32 Low-Level Control Unit

<Badge type="info" text="ELECTRICAL & EMBEDDED SUBSYSTEM • GABRIEL" />

<!-- #region microcontrollers -->

<!-- #region report -->

## Why a Dedicated ECU {#why-dedicated-ecu}

The STM32 is the robot’s real-time “spinal cord”. It drives the wheels, runs the vacuum-head stepper, and handles safety, so the Jetson can focus on vision and autonomy. If the Jetson or the controller link drops, the STM32 stops the robot on its own.

<Figure src="./assets/diagrams/stm32-hardware-two-tier-computing-split-architecture-di.svg" alt="Two-Tier Computing Split Architecture Diagram" />

::: tip Failsafe isolation
If the Jetson's OS crashes, reboots, or drops frames — or if the wireless controller link drops — the STM32 detects the communication timeout and independently stops all four wheels on its own.
:::

::: info Deterministic timing
No OS preemption. Control loops (50 Hz velocity ramping) and step pulses run with microsecond-level, predictable timing, and hardware peripherals (CAN, timers, UART, USB Host) handle I/O without loading the CPU.
:::

::: info Proven industry pattern
The same high-level / low-level split is used by Pixhawk flight controllers (STM32 + companion computer) and ROBOTIS TurtleBot3's OpenCR board (STM32).
:::

### Hardware Architecture at a Glance {#hardware-at-a-glance}

| Subsystem | Hardware Implementation | Key Specifications & Role |
| --- | --- | --- |
| **Microcontroller** | **STM32 NUCLEO-F446RE** (ARM Cortex-M4 with FPU) | Chosen for its **2 hardware CAN buses** and **6 UARTs**, 180 MHz clock, and 5 V-tolerant I/O. |
| **Drive** | **2× ZLAC8015D** dual-channel motor drivers | Connected on a shared **CAN bus (500 kbps)**, powering **4 hub motors** (**263 mm wheels**, **400 RPM max**). |
| **Operator Control** | **Wireless gamepad (GameSir)** | Plugged straight into the STM32 over **USB host** (`PA11`/`PA12`); **no laptop needed**. |
| **Vacuum Head** | **Stepper motor + TB6600 driver** (110 mm linear actuator) | Uses **5 V current-sinking** (`PC2` PUL−, `PC3` DIR− open-drain) so the **3.3 V STM32** can switch it reliably without a level shifter. |
| **Power & Safety** | **48 V LiFePO4 battery** + wireless kill switch + contactor | A **wireless kill switch** triggers the motor drivers’ built-in emergency stop, and a **safety contactor** cuts motor power while keeping the computers alive. |
| **Ready for Semester 2** | Pre-allocated expansion interfaces | Pins already allocated for the **battery BMS** (`USART1`), **UM980 RTK GPS** (`USART3`), **9-DOF IMU** (`I2C1`), **telemetry radio** (`UART4`), **ToF sensor** (`UART5`), **vacuum relay** (`PC0`), and **lights** (`PB4`/`PB5`). |

<!-- #endregion microcontrollers -->

## Requirements & Selection {#requirements-selection}

<Badge type="tip" text="STEP A" />

### Hard Requirements Specification

| Requirement | Target Specification | Peripheral Allocation | Engineering Justification |
| --- | --- | --- | --- |
| **Hardware Serial Ports** | **≥ 4 UART / USART** (6 available) | BMS (`USART1`), ST-Link / Jetson (`USART2`), UM980 RTK GPS (`USART3`), Microhard Telemetry Radio (`UART4`), ToF Sensor (`UART5`) | Enables concurrent, non-blocking DMA serial streaming without software serial emulation or bus multiplexing. |
| **CAN Bus Controller** | **≥ 1 bxCAN @ 500 kbps** (2 available) | `CAN1` (`PB8`/`PB9`) → Two ZLAC8015D motor drivers powering 4 hub motors (263 mm wheels, 400 RPM max) | Native differential industrial bus with hardware message ID filtering for real-time CiA 402 velocity commands. |
| **USB Host Interface** | **USB 2.0 OTG FS Host** | `PA11` (`DM`), `PA12` (`DP`) → Wireless GameSir gamepad plugged directly into the STM32 | Permits direct standalone teleoperation and field diagnostics with no laptop or ROS 2 network stack needed. |
| **Compute Clock Budget** | **≥ 35 MHz (FPU core)** | STM32F446RE ARM Cortex-M4 with FPU operating at 180 MHz | Comfortably absorbs peak peripheral interrupt loads (17.16 MHz raw + 2× margin = 34.32 MHz) with &gt;80% headroom. |

<Badge type="info" text="STEP B" />

### Worst-Case Compute Budget

Cortex-M4F 180 MHz Frequency Budget Allocation

Peak throughput under concurrent CAN saturation, 4× UART DMA streaming, 10 kHz stepper interrupts, and IMU polling.

<Badge type="tip" text="> 80% Headroom Available" />

9.5%

+9.5%

&gt; 80% headroom for sensor fusion, telemetry and RTOS overhead (145.68 MHz)

**17.16 MHz (9.5%)** Base Worst-Case Load

**34.32 MHz (19.1%)** Peak Load (2× Safety Margin)

**&gt; 80% Headroom** for sensor fusion, telemetry and RTOS overhead

::: details Show breakdown: task assumptions & cycle budget

| Task | Assumption | Load |
| --- | --- | --- |
| **4× UART (BMS, GPS, radio, ToF)** | 4 ch × 11,520 B/s (115,200 baud ÷ 10 bits) = 46,080 B/s | × 150 cycles/byte = **6.91 MHz** |
| **CAN to ZLAC8015D** | 9,000 frames/s (1 Mbps bus saturation) | × 350 cycles/frame = **3.15 MHz** |
| **GPS parsing** | 10 Hz × 5 sentences × 80 B = 4,000 B/s | × 100 cycles/byte = **0.40 MHz** |
| **Stepper pulses** | 20,000 interrupts/s (10 kHz, 2 per pulse) | × 75 cycles = **1.50 MHz** |
| **IMU over I2C** | 100 reads/s | × 2,000 cycles = **0.20 MHz** |
| **USB host + main loop** | — | **5.00 MHz** |
| **Total** | Worst-case unscaled sum across active peripherals | **17.16 MHz** |
| **With 2× safety margin** | Conservative industrial doubling for RTOS jitter & telemetry spikes | **34.32 MHz** |

:::

<Badge type="info" text="STEP C" />

### Candidate Evaluation

<table class="data-table"><tbody>
<tr><th>Board</th><th>UART</th><th>CAN</th><th>Logic / Clock</th><th>Verdict</th></tr>
<tr><td><strong>Arduino Uno/Nano</strong></td><td>1</td><td>0</td><td>5 V, 16 MHz</td><td><Badge type="danger" text="✗ Too few ports, too slow" /></td></tr>
<tr><td><strong>Arduino Mega 2560</strong></td><td>4</td><td>0</td><td>5 V, 16 MHz</td><td><Badge type="danger" text="✗ No CAN, too slow" /></td></tr>
<tr><td><strong>ESP32</strong></td><td>3</td><td>1</td><td>3.3 V, 240 MHz</td><td><Badge type="danger" text="✗ Too few UARTs" /></td></tr>
<tr><td><strong>Raspberry Pi Pico</strong></td><td>2</td><td>0</td><td>3.3 V, 133 MHz</td><td><Badge type="danger" text="✗ Too few UARTs, no CAN" /></td></tr>
<tr><td><strong>Teensy 4.1</strong></td><td>8</td><td>3</td><td>3.3 V, 600 MHz</td><td><Badge type="warning" text="Backup" /></td></tr>
<tr><td><strong>NUCLEO-F446RE</strong> <Badge type="tip" text="SELECTED" /></td><td>6</td><td>2</td><td><strong>3.3 V (5 V-tolerant I/O), 180 MHz</strong></td><td><Badge type="tip" text="✓ Selected" /></td></tr>
</tbody></table>

::: tip
<Badge type="tip" text="SELECTION VERDICT" />

**Microcontroller Selection Rationale**

The **STM32 NUCLEO-F446RE** (ARM Cortex-M4 with FPU) was chosen for its **2 hardware CAN buses** and **6 UARTs**, alongside 5 V-tolerant I/O pins that support 5 V current-sinking for the TB6600 stepper driver. While the Teensy 4.1 out-specs the F446RE on raw clock speed, the STM32 provides STM32CubeMX pin/clock configuration, HAL libraries, an on-board ST-Link debugger, and >80% compute headroom.
:::

## Interface & Wiring {#interface-wiring}

Complete hardware mapping for all 11 external devices connected to the STM32 NUCLEO-F446RE, covering both the active Semester 1 drive/actuation bench and the pre-allocated Semester 2 sensor and power expansion pins:

- **Drive & Vacuum-Head Actuation:** Two **ZLAC8015D** motor drivers share `CAN1` (`PB8`/`PB9` at 500 kbps) to power the four 263 mm, 400 RPM max hub motors, while the vacuum-head stepper motor is driven through a **TB6600** driver using **5 V current-sinking** (`PC2` PUL−, `PC3` DIR−) so the 3.3 V STM32 can switch it reliably.
- **Power & Hardware Safety Interlocks:** Powered by the **48 V LiFePO4 battery**. A **wireless kill switch** triggers the motor drivers’ built-in emergency stop (`PB1` monitor), and a **safety contactor** cuts high-voltage motor power while keeping the STM32 and Jetson computers alive.
- **Ready for Semester 2:** Pins are already allocated and routed for the **battery BMS** (`USART1`), **UM980 RTK GPS** (`USART3`), **9-DOF IMU** (`I2C1`), **telemetry radio** (`UART4`), **ToF sensor** (`UART5`), **vacuum relay** (`PC0`), and **lights** (`PB4`, `PB5`).

![NUCLEO-F446RE wiring diagram grouped by Sensor, Power, Motor, Visual and User Input subsystems](./assets/images/comm-diagram.jpeg)

Click to Enlarge

NUCLEO-F446RE wiring diagram grouped by Sensor, Power, Motor, Visual and User Input subsystems (Click image to open full-size lightbox preview)

<Stm32HardwareWidget1 />

<Stm32HardwareWidget2 />

<Badge type="warning" text="WIP · Semester 2" />

## Carrier PCB (Work in Progress) {#carrier-pcb}

A custom carrier board is being designed in KiCad so the Nucleo, CAN transceiver and sensor harnesses plug into locking JST connectors instead of loose jumper wires — improving reliability under runway vibration.

![KiCad carrier board schematic and layout placeholder](./assets/images/kicad-schematic.png)

Click to Enlarge

KiCad carrier board schematic placeholder (lockable JST-XH/PA connectors, isolated CAN transceiver, and low-noise LDO rails)

::: info
<Badge type="info" text="SOFTWARE ARCHITECTURE" /> <Badge type="tip" text="PHASES 1–5 COMPLETED" />

**STM32 Firmware Architecture & Control**

Explore the unified gamepad/ROS 2 firmware architecture, 3-mode differential-drive steering, 50 Hz velocity ramping loop, multi-layer safety watchdogs, and the 5 tested development stages.

[Open STM32 Firmware →](./stm32-firmware.md)
:::

<!-- #endregion report -->

<CardGrid :cols="2">

<Card>

←

[Previous Documentation](./vision-research.md)

Computer Vision Research

</Card>

<Card>

[Next Architecture](./stm32-firmware.md)

STM32 Firmware Architecture →

</Card>

</CardGrid>
