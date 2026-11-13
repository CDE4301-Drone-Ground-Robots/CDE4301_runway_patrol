---
title: "STM32 Low-Level Control Unit"
description: "Two-tier embedded control architecture, STM32 NUCLEO-F446RE selection, 11-subsystem pin allocation, and hardware verification."
owner: "Gabriel Tan"
outline: [2, 3]
---

# STM32 Low-Level Control Unit

<!-- #region microcontrollers -->

<!-- #region report -->

## 1. Introduction

### 1.1 System Architecture Rationale: High-Level vs. Low-Level Partitioning 

A key design paradigm in modern autonomous mobile robots (AMRs) and unmanned ground vehicles (UGVs) is the architectural separation between high-level autonomy processing and low-level motion control. High-level computing platforms, such as the NVIDIA Jetson series, execute feature-rich operating systems (e.g., Linux) to manage computationally intensive workloads including perception, sensor fusion (LiDAR/cameras), SLAM, and global trajectory planning. However, general-purpose operating systems introduce non-deterministic execution delays, kernel preemptions, and potential software freezes that make them unsuitable for direct, time-critical hardware actuation.

To ensure system safety and reliable motion control, direct hardware interfacing is offloaded to a dedicated low-level microcontroller. Running bare-metal firmware with a fixed 50 Hz control loop, the microcontroller gives predictable timing for motor commands and sensor polling. Furthermore, this dual-node architecture provides critical failsafe isolation: if the high-level OS crashes, reboots, or experiences frame drops, the STM32 independently detects the communication timeout and executes a safe, immediate quick-stop sequence. Finally, the dedicated microcontroller offers good on-chip peripheral density (hardware CAN controllers, multiple UART interfaces, and high-resolution pulse timers), delivering precise timing and robust hardware control without overburdening the high-level processor.

<Figure
  src="./assets/diagrams/stm32-hardware-two-tier-computing-split-architecture-di.svg"
  alt="Two-Tier Computing Split Architecture Diagram from NVIDIA Jetson to STM32 F446RE to Motors, Sensors, and Actuators"
  caption="Figure 5.2.1: Two-tier computing split between the high-level NVIDIA Jetson autonomy processor and the dedicated real-time STM32 F446RE low-level control unit."
/>

### 1.2 Scope and Objectives

This page covers the STM32 hardware: choosing the MCU and wiring everything to it. Firmware, testing and results are on [STM32 Firmware Architecture & Control](./stm32-firmware.md).

| # | Objective | Done when | Section |
| :--- | :--- | :--- | :--- |
| 1 | **Size the compute** | Worst-case CPU load is estimated for every Sem 1 and Sem 2 peripheral, with a 2× margin | [2.1](#cpu-load) |
| 2 | **Pick the MCU** | It has ≥ 4 UARTs, hardware CAN, USB Host for the gamepad ([1.3](#methodology)) and enough compute for the load in 2.1, at a cost and toolchain we can work with | [2.2](#mcu-tradeoff) |
| 3 | **Wire everything without pin conflicts** | All 11 subsystems are mapped, and the Sem 2 sensors already have reserved pins, so adding them needs no re-wiring | [3](#interface-wiring) |

**Not covered this semester:** bringing up the Sem 2 sensors (BMS, IMU, GNSS, radio, ToF) and the carrier PCB that replaces the jumper wires. Their pins are reserved now so that work can start without changing the pin map.

### 1.3 Methodology {#methodology}

We designed the hardware around the interfaces first, not the parts. Before choosing the board, we listed every device the UGV needs to talk to, now and in Semester 2, and the type of connection each one uses. That set the requirement: a microcontroller with enough hardware CAN, UART, I²C and USB peripherals that nothing needs to be bit-banged in software.

That also kills two birds with one stone. Every interface is allocated a pin now, including the ones we won't wire until Semester 2 (GPS, BMS, IMU, radio, ToF). So adding a sensor later means plugging it in and writing its driver, with no rewiring or pin conflicts.

Each interface was then brought up on its own and tested before integration. We checked the CAN transceiver with a DC loopback test before connecting the motor drivers, and the stepper signals before attaching the motor. When something failed, we knew which layer it was in.

| Device | Interface | Why this interface | Status |
| :--- | :--- | :--- | :--- |
| **2× ZLAC8015D motor drivers** | CAN (500 kbps) via transceiver | One 2-wire bus for both drivers, addressed by node ID; differential signalling rejects motor noise | Tested |
| **GameSir gamepad** | USB OTG (host) | The wireless dongle plugs straight into the STM32, with no extra board | Tested |
| **PC debug / telemetry** | USART2 (ST-Link virtual COM) | Built into the Nucleo, with no extra adapter | Tested |
| **TB6600 stepper driver** | 2× GPIO, open-drain 5 V sinking | 3.3 V pins can't drive the 5 V optocouplers directly; sinking current from the 5 V rail avoids a level shifter | Tested |
| **UM980 GNSS** | UART | Standard serial output for position data | Allocated (Sem 2) |
| **BMS** | UART | Serial battery telemetry | Allocated (Sem 2) |
| **IMU** | I²C | Standard sensor bus | Allocated (Sem 2) |
| **Telemetry radio** | UART | Serial link | Allocated (Sem 2) |
| **ToF sensor** | UART | Serial ranging data | Allocated (Sem 2) |
| **Vacuum relay, lights** | GPIO outputs | Simple on/off control | Allocated (Sem 2) |
| **RF safety interlock** | GPIO input | Hardware kill-switch status | Allocated (Sem 2) |

<p style="margin-top: -10px; margin-bottom: 24px; font-size: 13.5px; line-height: 1.55; color: var(--vp-c-text-2, #9CA3AF);">Table 5.1.1: Interface-first peripheral mapping across all 11 UGV devices, separating Semester 1 tested interfaces from Semester 2 pre-allocated pins.</p>

<!-- #endregion microcontrollers -->

<span id="requirements-selection"></span>

## 2. Design Methodology & Selection {#design-selection}

### 2.1 Computational Budget: Estimated CPU Load {#cpu-load}

| Task / Subsystem | Load Assumption | Effective Load |
| :--- | :--- | :--- |
| **4× UART** *(BMS, GPS, Radio, ToF)* | 4 channels @ 115,200 baud (11,520 bytes/s each) = 46,080 bytes/s | 46,080 bytes/s × 150 cycles/byte = **6.91 MHz** |
| **CAN Processing** *(ZLAC8015D Motor Bus)* | 9,000 frames/s (1 Mbps bus worst-case saturation) | 9,000 frames/s × 350 cycles/frame = **3.15 MHz** |
| **GPS Parsing** | 10 Hz × 5 sentences/cycle × 80 bytes/sentence = 4,000 bytes/s | 4,000 bytes/s × 100 cycles/byte = **0.40 MHz** |
| **Microstep Pulse Generation** | 20,000 interrupts/s | 20,000 interrupts/s × 75 cycles/interrupt = **1.50 MHz** |
| **IMU Fast-Mode Polling** | 100 sensor reads/s | 100 reads/s × 2,000 cycles/read = **0.20 MHz** |
| **Telemetry and Main Loop** | | **5.00 MHz** |
| **Total** | Worst-Case Summed Load | **17.16 MHz** |
| **2× Safety Margin** | | **34.34 MHz** |

**Utilization Summary**  
The estimated worst-case load is 17.16 MHz. Our firmware runs the F446RE at 84 MHz (the chip can run at up to 180 MHz), so that is about 20% CPU. With a 2× safety margin it is 34.34 MHz, about 41%, which still leaves close to 60% headroom for sensor fusion and more telemetry. Running the chip at its full 180 MHz would bring the same load under 20%.

<span id="mcu-tradeoff"></span>

### 2.2 Microcontroller Comparative Trade-off {#why-f446re}

| Platform | Hardware Serial | Hardware CAN | Operating Freq | Verdict |
| :--- | :---: | :---: | :--- | :--- |
| **Arduino Uno / Nano** | 1 | 0 | 16 MHz | **Rejected:** Insufficient ports, no hardware CAN; severe clock deficit |
| **Espressif ESP32** | 3 | 1 | 240 MHz | **Rejected:** Only 3 UARTs |
| **Raspberry Pi Pico** | 2 | 0 | 133 MHz | **Rejected:** Insufficient native UARTs; lacks integrated CAN controller |
| **STM32G474RE** | 5 | 3 | 170 MHz | **Rejected:** Similar specs to selected choice, needs USB host for controller and has many unneccessary ports |
| **Teensy 4.1** | 8 | 3 | 600 MHz | **Viable Alternative:** Excellent specs, but not chosen due to higher cost and leadtime and our familiarity with STM32CubeIDE |
| **STM32 NUCLEO-F446RE** | **6** | **2** | **180 MHz** | **Selected Platform:** Meets requirements, dedicated CAN |

**Selection Rationale**  
The **STM32 NUCLEO-F446RE** was selected as the optimal microcontroller platform for this UGV control unit because it provides an ideal combination of integrated hardware peripherals, real-time performance, and development support. Specifically, key factors influencing this decision include:

- **Dedicated Hardware CAN & Ample Serial Connectivity:** Features dual bxCAN controllers and six hardware USART/UART interfaces, enabling direct, high-bandwidth interfacing with motor drivers, sensors, and telemetry modules without requiring external coprocessors.
- **Real-Time Deterministic Performance:** Powered by an ARM Cortex-M4 core operating at 180 MHz with a single-precision Floating Point Unit (FPU), offering low interrupt latency and sub-microsecond determinism required for closed-loop motion control.
- **Robust Industrial & Prototyping Ecosystem:** Supported by mature STM32Cube middleware, HAL libraries, integrated debugging tools and extensive industrial adoption, ensuring high reliability and rapid software development.

## 3. Implementation & Prototype {#interface-wiring}

All 11 external subsystems are mapped onto non-overlapping Morpho and Arduino headers on the NUCLEO-F446RE (**Figure 5.2.1**).

<Figure
  src="./assets/images/comm-diagram.jpeg"
  alt="STM32 NUCLEO-F446RE hardware interface and pinout diagram grouped by Sensor, Power, Motor, Visual and User Input subsystems"
  caption="**Figure 5.2.1: STM32 NUCLEO-F446RE Hardware Interface Map.** Pin allocation across all 11 external subsystems (Motor, User Input, Power, Sensor, Vacuum Actuator, and Visual Lighting)."
/>

::: details Interactive pinout & peripheral interface explorer (11 devices)

<Stm32HardwareWidget1 />

<Stm32HardwareWidget2 />

:::

**Related documentation:** [STM32 Firmware Architecture & Control →](./stm32-firmware.md) · [Motor Drivetrain Calculations →](../hilbert/motor-drivetrain-calculation.md) · [Steering Kinematics →](../hilbert/steering-kinematics.md) · [Electrical Components List →](../bryan/components-list.md)

<!-- #endregion report -->

National University of Singapore · CDE4301 Capstone Project

<CardGrid :cols="2">

<Card>

← [Previous Documentation](./yolo-comparison-and-training.md)

YOLO Model Comparison & Training

</Card>

<Card>

[Next Architecture](./stm32-firmware.md) →

STM32 Firmware Architecture & Control

</Card>

</CardGrid>
