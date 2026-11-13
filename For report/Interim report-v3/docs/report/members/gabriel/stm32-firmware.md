---
title: "STM32 Firmware Architecture & Control"
description: "Controller-first firmware, 5-stage bottom-up testing, CiA 402 motor control, 3-mode differential-drive kinematics, 50 Hz velocity ramping, and Semester 2 roadmap."
owner: "Gabriel Tan"
outline: [2, 3]
---

# STM32 Firmware Architecture & Control

<!-- #region report -->

<span id="section-1-method"></span>

## 1. Introduction {#objectives-requirements}

### 1.1 Methodology {#methodology}

We built the firmware around the gamepad controller first. Instead of wiring buttons straight to motor commands, every input on the controller calls a firmware function. That kills two birds with one stone: the controller is our user interface for testing now, and the same functions become the interface for ROS 2 later.

Both the gamepad and ROS 2 come down to the same two numbers: forward speed `vx` (m/s) and turn rate `ωz` (rad/s). These go through the same kinematics, ramps, safety checks, and CAN commands. When the Jetson is connected in Semester 2, its `cmd_vel` message (`linear.x` and `angular.z`) goes straight into `Robot_Set_CmdVel(vx, wz)`, so nothing below that changes. Every manual test drive is also a test of the code path autonomy will use (Table 5.2.1).

| Controller Input | Function (Tested, Sem 1) | ROS 2 Equivalent (Planned, Sem 2) |
| :--- | :--- | :--- |
| **RT / LT** | Forward and Backward (`Robot_Set_CmdVel`) | `cmd_vel` `linear.x` |
| **Left Joystick / Right Stick X** | Turn Left and Right (`Robot_Set_CmdVel`) | `cmd_vel` `angular.z` |
| **D-Pad** | Adjust Max speed / turning radius (`g_motor_max_rpm`, `g_turn_angular_velocity`) | ROS parameters |
| **B** | UGV Emergency Stop (`Robot_Emergency_Stop`, `0x0002`) | E-Stop service |
| **A** | UGV Clear Faults and Enable (`Robot_Clear_Faults_And_Enable`, `0x0080`) | Re-arm service (neutral-gated) |
| **X** | UGV Stepper Motor (`Robot_Actuator_Toggle`, 110 mm stroke) | Lower / retract tool service |

<p style="margin-top: -10px; margin-bottom: 24px; font-size: 13.5px; line-height: 1.55; color: var(--vp-c-text-2, #9CA3AF);">Table 5.2.1: Mapping of wireless gamepad inputs to STM32 firmware functions and their planned ROS 2 interface equivalents.</p>

### 1.2 Step-by-Step Bottom-Up Validation {#step-by-step-validation}

Rather than writing the full UGV firmware at once and debugging electrical, protocol, and kinematic faults together, we brought the system up in five isolated stages (detailed with logs, safety checks, and bug fixes in [Section 3](#implementation-prototype)):

1. **[CAN Bus Debugging (`Can_debugging_check.c`)](#phase-1):** Get the STM32 connected to the motor drivers at 500 kbps and prevent unanswered frames from jamming the CAN transmit buffers.
2. **[Stepper Motor Drive (`Steppermotor_w_user_input.c`)](#phase-2):** Drive the TB6600 from 3.3 V pins by sinking its 5 V inputs, with microsecond pulse timing.
3. **[2 Motor Control using Keyboard Input (`2_motor_w_user_input.c`, `zlac8015d.c`)](#phase-3):** Drive two wheels (Left and Right channels) through the ZLAC8015D driver over CAN using keyboard SDO commands (`R`, `W`/`S`, `Q`, `E`), including emergency braking.
4. **[Motor State Machine (`state_machine_check.c`, `GUI.py`)](#phase-4):** Map out the 5-state CiA 402 FSM of the ZLAC8015D driver and build a Python GUI for fault and velocity monitoring.
5. **[Gamepad Controller & Kinematics (`controller.c`)](#phase-5):** Combine gamepad control, 3-mode steering kinematics, and 50 Hz speed ramping, with automatic stops on signal loss, USB unplug, or E-stop press.

<span id="section-2-architecture"></span>

## 2. System Architecture {#system-architecture}

Figure 5.2.2 traces a motion command from input to wheel speed. Two separate state machines govern motion: the **UGV supervisor** (6 states, [Stage 5](#phase-5)) decides whether the chassis is permitted to move, while the **motor FSM** (5 states, [Figure 5.2.5](#phase-4)) runs the CiA 402 enable and fault-recovery sequence on each ZLAC8015D driver.

<Figure
  src="./assets/diagrams/stm32-firmware-firmware-architecture-block-diagram.svg"
  alt="Firmware Data Flow Diagram from Gamepad / ROS cmd_vel to 4 Motors"
  caption="Figure 5.2.2: Motion control data flow from gamepad or ROS 2 input through the kinematics, scaling, and 50 Hz ramp stages to the two ZLAC8015D CANopen motor drivers."
/>

<span id="five-stages"></span>
<span id="testing-results"></span>
<span id="section-8-safety"></span>
<span id="section-9-problems"></span>
<span id="engineering-discussion"></span>

## 3. Staged Verification, Safety & Issues Faced {#implementation-prototype}

<span id="phase-1"></span>

### 3.1 Stage 1: CAN Bus Debugging (`Can_debugging_check.c`) {#stage-1-can}

When first bringing up the CAN bus, the ZLAC8015D drivers gave no reply and a silent bus offered no clue whether the fault lay in the transceiver wiring, baud rate, or termination. We built `Can_debugging_check.c` around four diagnostic steps (Table 5.2.2).

| Problem | Solution |
| :--- | :--- |
| **No reply from driver** | Bit-bang `CAN1_TX` (`PB9`) as a GPIO output high and verify `CAN1_RX` (`PB8`) reads high through the transceiver (and vice versa for low) before starting the bxCAN peripheral. |
| **Driver's baud rate is unknown** | Use the onboard blue user button (`B1`, `PC13`) to cycle through 250 kbps, 500 kbps, and 125 kbps, re-initialising `CAN1` on each press to ping the driver (`0x601`). |
| **Unanswered messages retry forever** | Set `AutoRetransmission = DISABLE` and clear all three TX mailboxes before every new ping. |
| **Silent bus gives no clue as to what is wrong** | Decode the bxCAN Error Status Register (`CAN_ESR`) over `USART2` after every ping (Table 5.2.3). |

<p style="margin-top: -10px; margin-bottom: 24px; font-size: 13.5px; line-height: 1.55; color: var(--vp-c-text-2, #9CA3AF);">Table 5.2.2: Stage 1 CAN bus bring-up problems and the diagnostic routines implemented in Can_debugging_check.c.</p>

#### bxCAN Error Status Register Decoding

The STM32F446RE bxCAN controller tracks bus health in `CAN_ESR`:

```text
bit: | 31 ──────── 24 | 23 ──────── 16 | ... | 6 ── 4 | 3 |   2  |   1  |   0  |
     |   REC (8 bits) |   TEC (8 bits) |     |  LEC   | - | BOFF | EPVF | EWGF |
```

- **`TEC` (Transmit Error Counter) & `REC` (Receive Error Counter):** Increment by +8 on a failed frame and decrement by −1 on a successful frame. Crossing 96 sets `EWGF` (Error Warning), crossing 127 sets `EPVF` (Error Passive), and crossing 255 puts the controller into `BOFF` (Bus-Off, where firmware automatically restarts `CAN1`).
- **`LEC` (Last Error Code, bits 6:4):** Identifies the exact physical or protocol fault on the bus (Table 5.2.3).

| `LEC` | Error Explanation & Physical Root Cause |
| :---: | :--- |
| **0** | No error — frame transmitted and acknowledged cleanly. |
| **1** | **Stuff error:** More than 5 identical consecutive bits detected, indicating a baud rate mismatch. |
| **2** | **Form error:** Fixed-format part of the frame is wrong, caused by a baud rate mismatch. |
| **3** | **Acknowledgement (`ACK`) error:** Caused by an unpowered or faulty driver, or swapped `CANH` / `CANL` wires. |
| **4** | **Bit recessive error:** Controller tried to send recessive (`1`) but read dominant (`0`), caused by `CANH` / `CANL` shorted to `GND`. |
| **5** | **Bit dominant error:** Controller tried to send dominant (`0`) but read recessive (`1`), caused by `CANH` / `CANL` shorted to high. |
| **6** | **CRC (checksum) mismatch:** Caused by electrical noise or a missing 120 Ω termination resistor. |

<p style="margin-top: -10px; margin-bottom: 24px; font-size: 13.5px; line-height: 1.55; color: var(--vp-c-text-2, #9CA3AF);">Table 5.2.3: STM32 bxCAN Last Error Code (LEC, CAN_ESR bits 6:4) fault codes and their physical root causes on the CAN bus.</p>

#### Verification Terminal Output

Cycling `B1` (`PC13`) confirmed transceiver loopback and locked onto 500 kbps across both ZLAC8015D nodes:

```text
 -> [DIAGNOSTIC] No Acknowledgment (ACK Error, LEC=1, TEC=128)
[BUTTON] >>> Switching CAN Baud Rate to: 500 kbps <<<
--> [RESULT] Transceiver Physical Loopback: 100% PASS!
```

<span id="phase-2"></span>

### 3.2 Stage 2: Stepper Motor Drive & Microsecond Timing (`Steppermotor_w_user_input.c`) {#stage-2-stepper}

Driving the TB6600 stepper driver directly from the NUCLEO-F446RE required solving three electrical and timing issues (Table 5.2.4, Figure 5.2.3).

| Problem | Solution |
| :--- | :--- |
| **Driver input requires 5 V signals, but STM32 pins only output 3.3 V** | Tie `PUL+` and `DIR+` to the 5 V rail and configure `PC2` (`PUL−`) and `PC3` (`DIR−`) as 5 V-tolerant open-drain outputs (`GPIO_MODE_OUTPUT_OD`). The pin switches between ground (LED ON) and open-circuit (LED OFF), creating the pulse train without an external level-shifter. |
| **`HAL_Delay()`'s 1 ms resolution cannot generate microsecond motor pulses** | Read the ARM Cortex-M4 DWT cycle counter (`DWT->CYCCNT`), which counts every CPU clock cycle (5.6 ns at 180 MHz; 11.9 ns at 84 MHz), giving microsecond-accurate pulse widths `w` (`1 pulse = 1 step`) for smooth, adjustable speeds. |
| **Changing direction right before a pulse can cause lost or missing steps** | Insert a 20 µs setup delay after every `DIR` state change before issuing the first `PUL` edge (exceeding the 5 µs TB6600 minimum <!-- TODO: source (TB6600 datasheet) -->). |

<p style="margin-top: -10px; margin-bottom: 24px; font-size: 13.5px; line-height: 1.55; color: var(--vp-c-text-2, #9CA3AF);">Table 5.2.4: Stage 2 stepper driver electrical and timing problems and the firmware solutions implemented in Steppermotor_w_user_input.c.</p>

<div class="gif-vertical">
  <Figure
    src="./assets/videos/Stepper motor.gif"
    alt="Bench test of the stepper motor linear actuator driven from the STM32 NUCLEO-F446RE via the TB6600 driver"
    caption="Figure 5.2.3: Stage 2 verification of the TB6600 stepper motor drive and DWT microsecond pulse timing across the 110 mm linear actuator stroke."
  />
</div>

- **Verification:** Swept pulse widths `w` from 5,000 µs down to 200 µs in 100 µs steps over the `USART2` CLI (`W`/`S` to jog ±400 steps, `+`/`-` to adjust delay), achieving the full 110 mm vacuum actuator stroke with zero missed steps. Any active pulse train is aborted immediately if E-stop is triggered.

<span id="phase-3"></span>

### 3.3 Stage 3: 2 Motor Control using Keyboard Input (`2_motor_w_user_input.c`, `zlac8015d.c`) {#stage-3-2wd}

#### Standard CAN 2.0A SDO Frame Structure

Each ZLAC8015D driver communicates over the 500 kbps CAN bus using standard 11-bit CAN 2.0A frames carrying 8-byte CANopen Service Data Object (SDO) payloads (Figure 5.2.4, Table 5.2.5).

<Figure
  src="./assets/diagrams/stm32-firmware-can-sdo-frame-structure.svg"
  alt="Standard CAN 2.0A Frame Structure showing SOF, ID 0x601, RTR, IDE, r0, DLC 8, DATA SDO msg, CRC, ACK, and EOF fields"
  caption="Figure 5.2.4: Standard 11-bit CAN 2.0A frame structure transmitted by the STM32 bxCAN controller for ZLAC8015D SDO motor commands."
/>

| Field | Meaning |
| :--- | :--- |
| **SOF** | Start Of Frame (`0`, 1 bit) |
| **ID** | 11-bit CANopen SDO COB-ID (`0x601` for Driver 1, `0x602` for Driver 2) |
| **RTR** | Remote Transmission Request (`0` inputs data, `1` outputs data) |
| **IDE** | Identifier Extension (`0` uses 11-bit ID, `1` uses 29-bit ID) |
| **DLC** | Data Length Code (`8` — determines how many data bytes follow) |
| **DATA** | 8-byte SDO command payload (little-endian index, sub-index, and value) |
| **CRC / ACK / EOF** | 15-bit Checksum, 2-bit Acknowledge, and 7-bit End of Frame (handled automatically in hardware) |

<p style="margin-top: -10px; margin-bottom: 24px; font-size: 13.5px; line-height: 1.55; color: var(--vp-c-text-2, #9CA3AF);">Table 5.2.5: Bit-level fields of the CAN 2.0A frame used to address and command the ZLAC8015D motor drivers.</p>

#### Keyboard Input to CANopen SDO Mapping

During Stage 3 bench testing, single-character keyboard commands over `USART2` triggered the 8-byte SDO sequences in Table 5.2.6 to arm the driver, spin both wheels at ±50 RPM, ramp to a stop, or lock the shafts immediately:

| Key | SDO DATA (`DATA` Payload, Hex) | Action |
| :---: | :--- | :--- |
| **`R`** | `2B 40 60 00 06 00 00 00` → Shutdown<br>`2B 40 60 00 07 00 00 00` → Switch On<br>`2B 40 60 00 0F 00 00 00` → Enable Operation | Arm the driver (step through the CiA 402 enable sequence on Controlword `0x6040` <!-- TODO: source (ZLAC8015D CANopen manual) -->) |
| **`W` / `S`** | `23 FF 60 01 32 00 00 00` → Left Velocity 50<br>`23 FF 60 02 32 00 00 00` → Right Velocity 50<br>`23 FF 60 01 CE FF FF FF` → Left Velocity −50<br>`23 FF 60 02 CE FF FF FF` → Right Velocity −50 | Speed +50 / −50 RPM on `0x60FF` sub-indices `0x01` (Left) and `0x02` (Right) (hardware limit ±350 RPM) |
| **`Q`** | `23 FF 60 01 00 00 00 00` → RPM 0 | Normal Stop — ramps wheels down to 0 RPM |
| **`E`** | `2B 40 60 00 02 00 00 00` → Emergency Stop | Emergency Stop — locks shaft and sets wheels to 0 RPM instantly (`0x0002` Quick-Stop) |

<p style="margin-top: -10px; margin-bottom: 24px; font-size: 13.5px; line-height: 1.55; color: var(--vp-c-text-2, #9CA3AF);">Table 5.2.6: Stage 3 keyboard commands mapped to 8-byte CANopen SDO payloads and ZLAC8015D driver actions.</p>

- **Issues Faced:** Sending raw step RPM commands (`0 → ±50 RPM` or `+50 → −50 RPM`) is instantaneous and causes violent chassis jolts that can tip the UGV or throw mounted components around, producing unpredictable movement. This directly motivated the 5-state CiA 402 motor state machine in [Stage 4](#phase-4) and the 50 Hz software velocity ramp (`40 RPM/s`) in [Stage 5](#phase-5).

<span id="phase-4"></span>

### 3.4 Stage 4: Motor State Machine & Test GUI (`state_machine_check.c`, `GUI.py`) {#stage-4-fsm}

- **Verification:** Validated all state transitions across the 5-state CiA 402 motor FSM (`DISENGAGE`, `LOCK`, `MOVEMENT`, `JERK`, `ERR`, Figure 5.2.5) using the desktop Python GUI (`GUI.py`, Figure 5.2.6) over `USART2` (115,200 baud). Confirmed 100% rejection of direct `DISENGAGE` → `MOVEMENT` jumps; the drivers must first enter `LOCK` (0 RPM shaft hold) before accepting non-zero velocity setpoints.
- **Safety & Fault Handling (<Badge type="info" text="Firmware + CAN" />):** Polls each driver's Statusword (`0x6041`) every 150 ms. If Bit 3 (`0x0008`, hardware overcurrent, overvoltage, or stall fault) is set, the FSM transitions to `ERR` and zeroes target RPM. Faults remain latched until cleared by a rising edge on Controlword Bit 7 (`0x0080` → 30 ms → `0x0000`), recovering the drivers without rebooting the STM32.

<div class="fig-row">
  <Figure
    src="./assets/diagrams/stm32-firmware-motor-fsm-diagram.svg"
    alt="State Machine Diagram for Motor showing DISENGAGE, LOCK, MOVEMENT, JERK, and ERR states and transitions"
    caption="Figure 5.2.5: Five-state CiA 402 motor state machine in state_machine_check.c, showing transitions between DISENGAGE, LOCK, MOVEMENT, JERK, and ERR."
  />
  <Figure
    src="./assets/videos/GUI.gif"
    alt="Python GUI (GUI.py) driving the 5-state motor FSM and displaying real-time state, RPM, and fault status over USART2"
    caption="Figure 5.2.6: Stage 4 desktop Python GUI (GUI.py) exercising the CiA 402 motor state machine and monitoring wheel RPM and fault status over USART2."
  />
</div>

<span id="phase-5"></span>

### 3.5 Stage 5: Gamepad Controller, Kinematics & Safety Watchdogs (`controller.c`) {#stage-5-controller}

- **Verification:** Drove the 4WD UGV chassis under `USE_POWER_PRESET_3` (32 V / 10.4 A bench supply, 25 RPM max = 0.34 m/s, 40 RPM/s accel/decel ramp, 0.45 rad/s turn rate, 8% stick deadzone, 3% trigger deadzone) inside a fixed 50 Hz (20 ms) CAN dispatch loop:
  - **Unified API:** Gamepad inputs reduce to the same (`vx`, `ωz`) pair and safety calls that ROS 2 will use: `Robot_Set_CmdVel()`, `Robot_Emergency_Stop()`, `Robot_Clear_Faults_And_Enable()` and `Robot_Actuator_Toggle()`. The D-pad (live max-RPM and turn-rate tuning: ±1 RPM, ±0.1 rad/s) has no ROS equivalent. Pulling both `RT` and `LT` triggers simultaneously resolves to 0 RPM before kinematics.
  - **3-Mode Kinematics & Anti-Saturation Scaling:** `Map_Controller_Inputs()` and `Drive_UGV_With_Mode()` enforce `DRIVE_MODE_STRAIGHT` (`ωz = 0`), `DRIVE_MODE_ARC_TURN` (`|ωz| <= |vx| / R_min` with `R_min = 0.50 m > W/2 = 0.2875 m` so the inner wheels never reverse during an arc turn), and `DRIVE_MODE_SPOT_TURN` (`vx = 0`). When a combined throttle-and-turn command exceeds `g_motor_max_rpm`, both left and right wheels are scaled down proportionally so the turn radius `R` does not widen.

<Figure
  src="./assets/stm32-diff-drive.png"
  alt="Differential drive geometry (arc turn and spot turn)"
  caption="Figure 3.5.1: Differential drive geometry (arc turn and spot turn)."
/>

```text
Δv = (W / 2) · ωz
ΔRPM = Δv · 60 / (2π r)
Arc turn: inner wheels = RPM_base − ΔRPM, outer wheels = RPM_base + ΔRPM
Spot turn (vx = 0): left wheels = −ΔRPM, right wheels = +ΔRPM
```

`W` is the track width (`0.575 m`) and `r` the wheel radius (`0.1315 m`).

  - **Mirrored Left-Axle Polarity Correction:** Because the left hub motors (Channel 1 on both nodes) are mounted mirrored relative to the right hub motors, `Motor_Set_Velocity_All(-left_rpm, right_rpm)` negates Channel 1 in one place so all upstream kinematics and ramp code operate in forward-positive coordinates.
  - **50 Hz Software Ramp:** `Update_Ramp_Channel()` steps velocity setpoints by 0.8 RPM per 20 ms tick (40 RPM/s, with sign-reversal ramp-through-zero), limiting current surges on the 10.4 A bench supply.
- **Power Presets & Global Tuning Variables:** Compile-time `#define` presets in `controller.c` initialise `volatile` global motion variables (`g_motor_max_rpm`, `g_turn_angular_velocity`, `g_motor_accel_rpm_per_sec`, `g_motor_decel_rpm_per_sec`, `g_min_turn_radius`) and stepper globals (`g_stepper_step_delay_us = 18 µs`, `g_stepper_travel_mm = 110.0 mm`). During testing, the D-pad adjusts `g_motor_max_rpm` (±1 RPM, clamped 1–100) and `g_turn_angular_velocity` (±0.1 rad/s, clamped 0.10–4.00) at runtime (Table 5.2.7).

| Parameter / Global Variable | `USE_POWER_PRESET_3` (Active, 32 V / 10.4 A) | `USE_POWER_PRESET_1` (48 V Battery, Sem 2) |
| :--- | :--- | :--- |
| **`g_motor_max_rpm`** (`CONFIG_MOTOR_MAX_RPM`) | 25 RPM (~0.34 m/s) | 30 RPM (~0.41 m/s) |
| **`g_motor_accel_rpm_per_sec`** / **`decel`** | 40.0 / 40.0 RPM/s | 35.0 / 20.0 RPM/s |
| **Driver HW Ramp** (`CONFIG_DRIVER_HW_ACCEL` / `DECEL_MS`) | 300 ms / 200 ms | 100 ms / 300 ms |
| **`g_turn_angular_velocity`** (`CONFIG_DEFAULT_TURN_OMEGA_RAD_S`) | 0.45 rad/s | 1.40 rad/s |
| **Steering Expo** (`CONFIG_STEERING_EXPO`) | 0.45 | 0.30 |
| **`g_min_turn_radius`** (`CONFIG_MIN_TURN_RADIUS`) | 0.50 m | 1.50 m |

<p style="margin-top: -10px; margin-bottom: 24px; font-size: 13.5px; line-height: 1.55; color: var(--vp-c-text-2, #9CA3AF);">Table 5.2.7: Power supply presets and runtime global tuning variables defined in controller.c.</p>

- **Safety & Fault Handling (6-State UGV Supervisor):**
  - **250 ms Wireless Packet Watchdog:** If no valid USB HID report arrives within `CONTROLLER_TIMEOUT_MS` (250 ms; `ROS_CMD_VEL_TIMEOUT_MS` is 500 ms for ROS 2), the supervisor transitions to `ROBOT_STATE_WATCHDOG_STOP` and calls `Motor_Stop_Controlled()`.
  - **USB Receiver Unplug:** `HOST_USER_DISCONNECTION` transitions the supervisor to `ROBOT_STATE_DISCONNECTED` and stops the motors immediately.
  - **Operator E-Stop & Neutral-Gated Re-Arm:** Pressing `B` calls `Robot_Emergency_Stop()`, latching `ROBOT_STATE_ESTOP_LATCHED`, sending Quick-Stop (`0x0002`) to both ZLAC8015D nodes, and calling `Stepper_Stop()`. Pressing `A` to re-arm via `Robot_Clear_Faults_And_Enable()` is rejected unless both triggers (`<= 3%`) and sticks (`<= 8%`) are at neutral; onboard `B1` (`PC13`) also triggers a manual fault clear and re-arm.

<span id="section-10-roadmap"></span>

## 4. Limitations & Semester 2 {#limitations-semester-2}

1. **Speed is capped well below the operating target.** Semester 1 ran Preset 3 (25 RPM, 0.34 m/s) to stay within the 32 V / 10.4 A bench supply. Preset 1 on the planned 48 V 20 Ah LiFePO4 pack raises the cap to 30 RPM (0.41 m/s). Reaching the 15 km/h (4.17 m/s) operating target requires `RPM = 60 × 4.17 / (2π × 0.1315) ≈ 303 RPM`, so the cap will only be raised after the battery, BMS, and safety contactor are tested on the chassis.
2. **Hardware RF kill switch not yet functional.** The RF kill switch we bought arrived faulty, so the hardware E-stop path (relay → ZLAC8015D `X0`/`X1` E-stop inputs) has not been installed or tested. In Semester 2 we will fit a replacement and verify that it stops the drivers.
3. **Open-loop wheel commands → closed-loop slip compensation.** Semester 1 sends RPM setpoints to the drivers' internal FOC loops. Semester 2 will read actual encoder velocity back over `CAN1` (`0x606C`) to compensate for wheel slip on damp tarmac.
4. **IMU fusion (`I2C1`, `PB6`/`PB7`).** Fuse the 9-DOF IMU (`0x68`, 100 Hz) with wheel odometry using a complementary filter or EKF for heading and tilt estimation.
5. **Jetson ROS 2 link and BMS telemetry (`USART1`, `PA9`/`PA10`).** Stream `cmd_vel` into `Robot_Set_CmdVel(vx, wz)` under the 500 ms watchdog, and read cell voltages, current, and state of charge from the BMS at 115,200 baud.
6. **STM32 hardware watchdog (IWDG).** Enable the independent hardware watchdog to reset the MCU if the main loop hangs, adding MCU-level recovery alongside the Semester 2 RF kill switch.

**Related documentation:** [STM32 Hardware Subsystem →](./stm32-hardware.md) · [Steering Kinematics →](../hilbert/steering-kinematics.md) · [Autonomous Navigation →](../hilbert/navigation.md) · [UAV–UGV Communications →](../hilbert/communications.md)

<style>
.vp-doc h2 {
  font-size: 1.75rem !important;
  font-weight: 700 !important;
  line-height: 1.3 !important;
  margin-top: 52px !important;
  margin-bottom: 26px !important;
  padding-top: 28px !important;
  padding-bottom: 12px !important;
  border-top: 1px solid var(--vp-c-divider) !important;
  border-bottom: 2px solid var(--vp-c-brand-soft) !important;
}

.vp-doc h3 {
  font-size: 1.25rem !important;
  font-weight: 600 !important;
  line-height: 1.4 !important;
  margin-top: 34px !important;
  margin-bottom: 14px !important;
  padding-left: 12px !important;
  border-left: 3px solid var(--vp-c-brand-1) !important;
}

.vp-doc h2 + h3,
.vp-doc h2 + span + h3 {
  margin-top: 24px !important;
}

.vp-doc h4 {
  font-size: 1.05rem !important;
  font-weight: 600 !important;
  margin-top: 24px !important;
  margin-bottom: 10px !important;
}

.gif-vertical .fh-figure {
  max-width: 240px !important;
  margin: 18px auto !important;
}

.gif-vertical .fh-figure__wrapper {
  max-height: 280px !important;
  overflow: hidden !important;
}

.gif-vertical .fh-figure__img {
  max-height: 280px !important;
  width: 100% !important;
  object-fit: cover !important;
  object-position: center !important;
}

.gif-compact .fh-figure {
  max-width: 520px !important;
  margin: 18px auto !important;
}
</style>

<!-- #endregion report -->

National University of Singapore · CDE4301 Capstone Project

← [Previous Architecture: STM32 Hardware Subsystem](./stm32-hardware.md)