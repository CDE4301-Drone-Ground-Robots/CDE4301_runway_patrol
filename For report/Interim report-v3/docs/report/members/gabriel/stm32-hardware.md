---
title: "STM32 Low-Level Control Unit"
description: "Two-tier embedded control architecture, STM32 NUCLEO-F446RE selection rationale, peripheral pin allocation, and hardware safety interlocks."
owner: "Gabriel Tan"
outline: [2, 3]
---

# STM32 Low-Level Control Unit

> **Semester 1 engineering documentation · Gabriel Tan**  
> **Evidence boundary:** This page documents the STM32 NUCLEO-F446RE low-level controller architecture, worst-case computational budget, comparative platform trade study, and benchtop hardware interfacing (CAN motor drivers, USB Host gamepad, and 5 V current-sinking stepper drive). Semester 2 expansion sensors (BMS, RTK GNSS, IMU, telemetry radio, and ToF) have pre-allocated pins and hardware buses ready for integration on the final carrier PCB.

<!-- #region microcontrollers -->

## 1. Context & System Architecture {#why-dedicated-ecu}

### 1.1 Why the UGV Needs a Dedicated Controller

Foreign Object Debris (FOD) on a runway damages tyres and airframes, and engines can suck it in. Our UGV patrols the runway, spots debris with a camera and picks it up with a vacuum head. The Jetson does the spotting. Driving to the debris and picking it up is the STM32's job.

To do that, the UGV has to do three things on time, all at once:

1. Send velocity commands to four hub motors over CAN.
2. Generate step pulses for the vacuum-head stepper.
3. Stop immediately when the safety switch trips.

Linux on the Jetson can't guarantee any of these. If the scheduler stalls or a ROS node crashes, the motors keep running on the last command they got. That's why the system is split in two.

### 1.2 Two-Tier Compute Split

| Tier | Hardware | Responsibility |
| :--- | :--- | :--- |
| **High level** | NVIDIA Jetson Orin Nano Super | YOLO FOD detection, sensor fusion and ROS 2 path planning. Outputs a target velocity. |
| **Low level** | STM32 NUCLEO-F446RE | Bare-metal **50 Hz (`20 ms`) loop**. Turns velocity targets into CAN commands, drives the stepper and monitors the RF safety switch. On a fault it sends a CiA 402 Quick-Stop (`0x0002`) without waiting for the Jetson. |

The STM32 accepts drive inputs the same way ROS will send them. In Semester 1 the gamepad is the command source. In Semester 2, ROS `cmd_vel` replaces the gamepad behind a `500 ms` communication watchdog ([Section 4](#carrier-pcb)), and none of the motor-control code changes.

<Figure
  src="./assets/diagrams/stm32-hardware-two-tier-computing-split-architecture-di.svg"
  alt="Two-Tier Computing Split Architecture Diagram"
  caption="**Figure 1.1: Two-Tier Compute Split.** The Jetson handles perception and planning. The STM32 handles CAN motor control, stepper timing, gamepad teleoperation and safety."
>

### 1.3 Subsystem Summary

| Subsystem | Hardware | Design choice and why |
| :--- | :--- | :--- |
| **Traction** | 2× ZLAC8015D, 4 hub motors, 263 mm wheels | `CAN1` (`PB8`/`PB9`) at 500 kbps. At 400 RPM, $v = 400 \times \pi \times 0.263 / 60 \approx 5.5\text{ m/s}$ (~19.8 km/h), above our 15 km/h operating target. |
| **Teleoperation** | GameSir wireless gamepad | `USB_OTG_FS` Host (`PA11`/`PA12`). Lets us test drive without a laptop. |
| **Vacuum head** | Stepper + TB6600, 110 mm stroke | The TB6600's opto inputs need 5 V, which 3.3 V GPIO can't drive reliably. `PULSE+`/`DIR+` are tied to 5 V and the STM32 sinks `PULSE-`/`DIR-` with open-drain pins (`PC2`/`PC3`). |
| **Power & safety** | 48 V LiFePO4 (32 V bench supply in Sem 1), RF switch | RF switch read on `PB1` and backed up by CiA 402 Quick-Stop. Motor power is cut while the Jetson and MCU stay alive. |
| **Sem 2 expansion** | Reserved pins | BMS (`USART1`), IMU (`I2C1`), UM980 GNSS (`USART3`), radio (`UART4`), ToF (`UART5`), vacuum relay (`PC0`), lighting (`PB4`/`PB5`). |

This page covers MCU selection ([Section 2](#requirements-selection)), pin allocation ([Section 3](#interface-wiring)) and the Semester 2 carrier PCB and sensor bring-up ([Section 4](#carrier-pcb)). Integration testing is in [STM32 Firmware Architecture & Control](./stm32-firmware.md).

<!-- #endregion microcontrollers -->

## 2. Microcontroller Selection & Evaluation {#requirements-selection}

### 2.1 Computational Budget: Estimated CPU Load

To size the microcontroller without under-provisioning or over-specifying hardware, we calculated the worst-case CPU clock load across all concurrent serial buses, CANopen frame processing, microstep interrupt generation, and main-loop telemetry tasks:

| Task / Subsystem | Load Assumption | Effective Load |
| :--- | :--- | :--- |
| **4× UART** *(BMS, GPS, Radio, ToF)* | 4 channels @ 115,200 baud ($11,520\text{ bytes/s}$ each) = $46,080\text{ bytes/s}$ | $46,080\text{ bytes/s} \times 150\text{ cycles/byte} =$ **6.91 MHz** |
| **CAN Processing** *(ZLAC8015D Motor Bus)* | $9,000\text{ frames/s}$ ($1\text{ Mbps}$ bus worst-case saturation) | $9,000\text{ frames/s} \times 350\text{ cycles/frame} =$ **3.15 MHz** |
| **GPS Parsing** | $10\text{ Hz} \times 5\text{ sentences/cycle} \times 80\text{ bytes/sentence} = 4,000\text{ bytes/s}$ | $4,000\text{ bytes/s} \times 100\text{ cycles/byte} =$ **0.40 MHz** |
| **Microstep Pulse Generation** | $20,000\text{ interrupts/s}$ | $20,000\text{ interrupts/s} \times 75\text{ cycles/interrupt} =$ **1.50 MHz** |
| **IMU Fast-Mode Polling** | $100\text{ sensor reads/s}$ | $100\text{ reads/s} \times 2,000\text{ cycles/read} =$ **0.20 MHz** |
| **Telemetry and Main Loop** | 50 Hz kinematics, ramping, USB Host polling & status logging | **5.00 MHz** |
| **Total** | Worst-Case Summed Load | **17.16 MHz** |
| **2× Safety Margin** | Conservative industrial doubling for interrupt bursts | **34.34 MHz** |

**Utilization Summary:**  
The estimated worst-case load across all subsystems is **17.16 MHz**. Our Semester 1 firmware runs the STM32F446RE at **84 MHz** (the chip is rated up to **180 MHz**), which places the unscaled worst-case load at **~20% CPU utilization**. Applying a **2× safety margin** raises the requirement to **34.34 MHz**, or **~41% of the 84 MHz clock**, leaving **nearly 60% compute headroom** for Semester 2 sensor fusion and expanded telemetry. Scaling the system clock to the chip's full **180 MHz** rating brings even the 2× safety-margin load **below 20%** (19.1% utilization, leaving >80% headroom).

### 2.2 Microcontroller Comparative Trade-Off

Six candidate microcontroller platforms were evaluated against the UGV's hard peripheral requirements (at least 4 hardware UARTs, native hardware CAN controller, and $\ge 35\text{ MHz}$ real-time compute capability):

<table class="data-table"><tbody>
<tr><th>Platform</th><th>Hardware Serial</th><th>Hardware CAN</th><th>Operating Freq</th><th>Verdict</th></tr>
<tr><td><strong>Arduino Uno / Nano</strong></td><td>1</td><td>0</td><td>16 MHz</td><td><Badge type="danger" text="Rejected" /> Insufficient ports, no hardware CAN; severe clock deficit</td></tr>
<tr><td><strong>Espressif ESP32</strong></td><td>3</td><td>1</td><td>240 MHz</td><td><Badge type="danger" text="Rejected" /> Only 3 hardware UARTs</td></tr>
<tr><td><strong>Raspberry Pi Pico</strong></td><td>2</td><td>0</td><td>133 MHz</td><td><Badge type="danger" text="Rejected" /> Insufficient native UARTs; lacks integrated CAN controller</td></tr>
<tr><td><strong>STM32G474RE</strong></td><td>5</td><td>3</td><td>170 MHz</td><td><Badge type="warning" text="Viable Alternative" /> Similar specs to selected choice; considered for backup</td></tr>
<tr><td><strong>Teensy 4.1</strong></td><td>8</td><td>3</td><td>600 MHz</td><td><Badge type="warning" text="Viable Alternative" /> Excellent specs, but not chosen due to higher cost and our familiarity with STM32CubeIDE</td></tr>
<tr><td><strong>STM32 NUCLEO-F446RE</strong></td><td><strong>6</strong></td><td><strong>2</strong></td><td><strong>180 MHz</strong></td><td><Badge type="tip" text="Selected Platform" /> Meets all requirements with dedicated hardware CAN and 5 V-tolerant I/O</td></tr>
</tbody></table>

::: details Detailed selection rationale for the STM32 NUCLEO-F446RE

The **STM32 NUCLEO-F446RE** was selected as the optimal microcontroller platform for the UGV control unit because it combines integrated industrial hardware peripherals, deterministic real-time execution, and mature development tooling:

- **Dedicated Hardware CAN & Ample Serial Connectivity:** Features dual `bxCAN` controllers (`CAN1`, `CAN2`) and six hardware `USART`/`UART` interfaces, enabling direct, high-bandwidth interfacing with dual ZLAC8015D motor drivers, RTK GNSS, BMS, radio telemetry, and ToF sensors without external protocol coprocessors or software bit-banging.
- **Real-Time Deterministic Performance:** Powered by an ARM Cortex-M4 core operating at up to 180 MHz with a hardware single-precision Floating Point Unit (FPU), providing low interrupt latency, hardware cycle counting (`DWT->CYCCNT`), and sub-microsecond determinism for closed-loop motion control.
- **5 V-Tolerant Open-Drain I/O & Prototyping Ecosystem:** Supports 5 V-tolerant open-drain GPIO configurations (allowing direct low-side sinking of the 5 V TB6600 stepper optocouplers without level shifters) and is backed by STM32CubeIDE, HAL libraries, and an onboard ST-Link debugger with Virtual COM Port telemetry.

:::

## 3. Hardware Interfacing & Pin Assignments {#interface-wiring}

The hardware interface map for the **STM32 NUCLEO-F446RE** defines dedicated pin routing across serial communication buses, power management interfaces, peripheral sensors, and digital I/O channels:

<Figure
  src="./assets/images/comm-diagram.jpeg"
  alt="STM32 NUCLEO-F446RE hardware interface and pinout diagram grouped by Sensor, Power, Motor, Visual and User Input subsystems"
  caption="**Figure 3.1: STM32 NUCLEO-F446RE Hardware Interface Map.** Complete pin allocation across all 11 external subsystems (Motor, User Input, Power, Sensor, Vacuum Actuator, and Visual Lighting)."
/>

| Subsystem / Function | Interface | Pin Assignments | Target Device / Note |
| :--- | :--- | :--- | :--- |
| **BMS Interface** | `USART1` | `PA9 (TX), PA10 (RX)` | BMS 6S–22S LiFePO4 100A |
| **IMU Sensor** | `I2C1` | `PB6 (SCL), PB7 (SDA)` | 9-DOF IMU (I2C Addr: `0x68`) |
| **GPS Module** | `USART3` | `PC10 (TX), PC11 (RX)` | UM980 RTK GNSS Module |
| **Radio Telemetry** | `UART4` | `PA0 (TX), PA1 (RX)` | Microhard Radio v2 |
| **ToF Distance Sensor** | `UART5` | `PC12 (TX), PD2 (RX)` | Time-of-Flight Ranging Sensor |
| **CAN Motor Bus** | `CAN1` | `PB8 (RX), PB9 (TX)` | CAN Transceiver → ZLAC8015D Motor Driver |
| **Gamepad Controller** | `USB_OTG_FS` | `PA11 (DM), PA12 (DP)` | Embedded USB Host Gamepad |
| **Vacuum Control Relay** | `GPIO Output` | `PC0` | Vacuum Circuit Relay Control |
| **Visual Lighting** | `GPIO Output` | `PB4, PB5` | Headlights & Status Indicators |
| **RF Safety Interlock** | `GPIO Input` | `PB1` | RF Relay Emergency Switch |
| **Microstep Stepper** | `GPIO Output` | `PC2 (PULSE-), PC3 (DIR-)` | Microstep Driver Signal Control (5 V Open-Drain Sink) |

::: details Interactive pinout & peripheral interface explorer (11 devices)

Use the interactive search bar or subsystem filter pills below to inspect the protocol, pin assignment, and electrical notes for each connected device:

<Stm32HardwareWidget1 />

<Stm32HardwareWidget2 />

:::

## 4. Semester 2 Hardware Roadmap (Carrier PCB & Sensor Bring-Up) {#carrier-pcb}

During Semester 1 benchtop and chassis testing, interconnections between the Nucleo-F446RE headers, CAN transceiver, TB6600 stepper driver, and USB Host port were routed using breadboard and jumper harnesses. While suitable for laboratory verification, friction jumper headers are vulnerable to fretting and mechanical disconnection under runway vibration.

For Semester 2, a custom **KiCad carrier PCB** is being designed to seat the NUCLEO-F446RE Morpho headers and route all 11 subsystem interfaces to locking industrial connectors with an onboard CAN transceiver and dedicated 5 V common-anode pull-up rail, alongside full bring-up of the pre-allocated peripherals:

1. **6-DOF / 9-DOF IMU Sensor Fusion (`I2C1` on `PB6`/`PB7`):** Integrate real-time accelerometer and gyroscope telemetry with ZLAC8015D wheel encoder odometry via an onboard Extended Kalman Filter (EKF) or Complementary Filter for attitude estimation, tilt sensing, and vibration rejection on uneven tarmac.
2. **NVIDIA Jetson & ROS 2 High-Level Link (`UART`/`USB` or `CAN`):** Connect the Jetson companion computer to the STM32 so high-level `cmd_vel` trajectories invoke `Robot_Set_CmdVel(vx, wz)` directly under a `500 ms` ROS communication watchdog while publishing wheel odometry and diagnostic status.
3. **Smart LiFePO4 BMS Telemetry (`USART1` on `PA9`/`PA10`):** Ingest live individual cell voltages, pack State of Charge (SoC), temperatures, and discharge current from the 6S–22S 100A LiFePO4 Smart BMS to enforce dynamic power throttling and automated under-voltage or over-temperature cutoffs.
4. **Closed-Loop Skid-Steer Slip Compensation (`CAN1` on `PB8`/`PB9`):** Close the outer velocity and heading control loop using real-time encoder feedback from both ZLAC8015D drivers to compensate for lateral wheel skidding on damp or high-speed runway turns.

<Figure
  src="./assets/images/kicad-schematic.png"
  alt="KiCad carrier board schematic and layout for Semester 2"
  caption="**Figure 4.1: Custom STM32 Carrier PCB (Semester 2 Integration).** Replaces loose jumper wires with locking connectors, an onboard CAN transceiver, and dedicated 5 V common-anode pull-ups for the TB6600 stepper driver."
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
