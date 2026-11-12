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

### 1.2 Scope and Objectives

This page covers the STM32 hardware: which MCU we picked, how everything is wired to it, and how it scales to Semester 2. Firmware and test results are on [STM32 Firmware Architecture & Control](./stm32-firmware.md).

1. **Pick an MCU with enough peripherals and compute headroom** ([Section 2](#requirements-selection)). It needs at least 4 UARTs, hardware CAN, USB Host and ≥ 35 MHz of real-time compute (worst-case load with a 2× margin), at a price and toolchain we can work with.
2. **Wire every subsystem without pin conflicts** ([Section 3](#interface-wiring)). That means CAN motor drivers, USB gamepad, 5 V stepper sinking and the RF safety switch now, plus reserved pins for the BMS, IMU, GNSS, radio and ToF so Semester 2 needs no re-wiring.
3. **Move from jumper wires to a carrier PCB** ([Section 4](#carrier-pcb)). Jumpers work on the bench but can shake loose on the runway, so Semester 2 replaces them with locking connectors and brings up the reserved sensors.

### 1.3 Methodology

We built the firmware around the gamepad controller first. Instead of wiring buttons straight to motor commands, every input on the controller calls a firmware function. That kills two birds with one stone: the controller is our user interface for testing now, and the same functions become the interface for ROS 2 later.

Both the gamepad and ROS come down to the same two numbers: forward speed vx (m/s) and turn rate ωz (rad/s). These go through the same kinematics, ramps, safety checks and CAN commands. When the Jetson is connected, its cmd_vel message (linear.x and angular.z) goes straight into Robot_Set_CmdVel(vx, ωz), so nothing below that changes. Every manual test drive is also a test of the code path autonomy will use.

| Controller Input | Function | ROS 2 Equivalent |
| :--- | :--- | :--- |
| RT / LT | Forward and Backward | cmd_vel linear.x |
| Left Joystick | Turn Left and Right | cmd_vel angular.z |
| D-Pad | Adjust Max speed/turning radius | - |
| B | Robot Emergency Stop | E-Stop service |
| A | Robot Clear Faults and Enable | Re-arm service |
| X | Robot Stepper Motor | Lower / retract tool service |

<!-- #endregion microcontrollers -->

<span id="requirements-selection"></span>

## 2. Design Methodology & Selection {#design-selection}

### 2.1 Computational Budget: Estimated CPU Load

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

All 11 external subsystems are mapped onto non-overlapping Morpho and Arduino headers on the NUCLEO-F446RE (**Figure 3.1** and Table 3.1).

<Figure
  src="./assets/images/comm-diagram.jpeg"
  alt="STM32 NUCLEO-F446RE hardware interface and pinout diagram grouped by Sensor, Power, Motor, Visual and User Input subsystems"
  caption="**Figure 3.1: STM32 NUCLEO-F446RE Hardware Interface Map.** Pin allocation across all 11 external subsystems (Motor, User Input, Power, Sensor, Vacuum Actuator, and Visual Lighting)."
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

← [Previous Documentation](./vision-research.md)

Computer Vision Research

</Card>

<Card>

[Next Architecture](./stm32-firmware.md) →

STM32 Firmware Architecture & Control

</Card>

</CardGrid>
