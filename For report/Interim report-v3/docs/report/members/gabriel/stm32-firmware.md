---
title: "STM32 Firmware Architecture & Control"
owner: "Gabriel Tan"
outline: [2,3]
---
# STM32 Firmware Architecture & Control

<Badge type="info" text="EMBEDDED FIRMWARE SUBSYSTEM • GABRIEL" />

<!-- #region report -->

## Built Step by Step, Verified at Every Layer {#section-1-method}

Every layer of the firmware was developed and tested on the bench in **5 progressive stages** before the next was built on top of it — from proving the physical CAN wire carries a signal, to driving the full robot with a wireless GameSir gamepad.

Step 1

Prove the Wire

CAN bus diagnostics & physical loopback

Step 2

Precise Timing

Stepper timing & 5 V current-sinking

Step 3

Move Four Wheels

Dual motor drivers on shared CAN bus

Step 4

Make It Safe

Fault-handling 5-state machine & GUI

Step 5

Drive It

Full teleoperation, 3-mode steering & 50 Hz ramping

Click any step above to jump directly to its verification phase below.

## How the Final Firmware Fits Together {#section-2-architecture}

The firmware executes a bare-metal, deterministic super-loop on the Cortex-M4F core, decoupling high-level kinematics and safety arbitration on the STM32 from closed-loop Field-Oriented Control (FOC) running inside the ZLAC8015D motor drivers.

<Card>

<Figure src="./assets/diagrams/stm32-firmware-firmware-architecture-block-diagram.svg" alt="Firmware Architecture Block Diagram" />

</Card>

::: tip
**Architecture Overview — One Controller, Two Jobs:** Every gamepad input maps directly to a high-level firmware API function (`Robot_Set_CmdVel`, `Robot_Emergency_Stop`, `Robot_Controlled_Stop`, `Robot_Actuator_Toggle`). In autonomous mode, **ROS 2 calls the exact same functions** (`CONTROL_SOURCE_ROS`), so every manual teleoperation test on the bench or runway also tests the autonomy execution path.
:::

### Core Software Capabilities {#software-capabilities}

- **One Controller, Two Jobs (Unified Teleop & Autonomy API):** Gamepad triggers, stick deflections, and buttons invoke the same internal motion and actuator API (`Robot_Set_CmdVel()`, `Robot_Actuator_Lower()`, `Robot_Actuator_Retract()`, `Robot_Emergency_Stop()`) that the Jetson calls over ROS 2. Switching between manual and autonomous control (`Robot_Set_Control_Source()`) requires zero changes to the underlying kinematics, ramping, or safety state machine.
- **Differential-Drive Steering (`Map_Controller_Inputs` & `Drive_UGV_With_Mode`):**
  - **Three explicit modes:** **Straight** ($\omega_z = 0$ locked for crisp tracking), **Arc Turn** (simultaneous throttle + steering), and **Spot Turn** (zero-radius in-place pivot when stationary).
  - **Minimum turn radius clamp:** During arc turns, yaw rate is bounded by $|\omega_z| \le |v_x| / R_{\min}$ so the inner wheels never reverse mid-arc or scrub the tyres.
  - **Proportional anti-saturation scaling:** When a commanded turn pushes either wheel past `g_motor_max_rpm`, both left and right wheel speeds are scaled down together so the turning curvature is preserved at the motor limit.
- **Smooth Motion (50 Hz Control Loop):** A deterministic **50 Hz (`20 ms`)** control loop (`Update_Ramp_Channel`) ramps wheel speeds smoothly up and down and transitions cleanly through zero on direction reversals, preventing jerking, gear shock, or chassis tipping.
- **Safety First:**
  - **250 ms Watchdog & Instant USB Disconnect Stop:** Automatically stops the robot within **250 ms** (`CONTROLLER_TIMEOUT_MS`) if wireless controller packets stop arriving, and stops **immediately** if the USB host link drops (`HOST_USER_DISCONNECTION`).
  - **Latched Emergency Stop:** Pressing `[B]` (or `BACK`) triggers a CiA 402 Quick-Stop (`0x0002`) and latches `ROBOT_STATE_ESTOP_LATCHED` until explicitly cleared.
  - **Neutral-Gated Re-Arming:** The robot only re-arms (`ROBOT_STATE_READY`) when all triggers and sticks are back at neutral inside their deadzones, preventing sudden lurches on recovery.

<Badge type="info" text="PHASE 1" />

## Stage 1: CAN Bus Diagnostics {#phase-1}

`can_debugging_check.c`

**Problem Statement:** “Before commanding any motor, prove the CAN link itself works — and when it doesn't, know exactly why.”

## 1 DC Loopback Test

Bit-bangs the transceiver as plain GPIO before the CAN controller starts, separating wiring faults from protocol faults.

::: details Details

PB9 is temporarily driven as GPIO output and PB8 read as input. Recessive test: PB9 HIGH → PB8 must read HIGH. Dominant test: PB9 LOW → PB8 must read LOW. Pins are then restored to AF9 (CAN1).

:::

## 2 Live Baud-Rate Sweep

Pressing the blue user button (PC13) cycles 500k → 250k → 1M → 125k and re-pings the driver, discovering its baud rate without reflashing.

## 3 Mailbox Deadlock Prevention

Auto-retransmission is disabled and stalled TX mailboxes are aborted before each ping, so a missing ACK can never lock up the controller.

## 4 Hardware Bus Diagnostics

Decodes the CAN Error Status Register (TEC, REC, LEC) into plain-English faults and auto-recovers from Bus-Off.

::: details Details

LEC=1 (stuff error) → baud mismatch. LEC=3 (ACK error) → disconnected wires, swapped CAN\_H/CAN\_L, or unpowered driver. BOFF → controller restarted automatically.

:::

<MissingAsset name="phase1-can.mp4" alt="video" />

Phase 1 Video Demo `/assets/images/Gabriel/phase1-can.mp4` Place recording here to enable live loop preview

**Code (C)**

```c
uint32_t esr = hcan1.Instance->ESR;
uint8_t tec = (esr & CAN_ESR_TEC) >> CAN_ESR_TEC_Pos;
uint8_t lec = (esr & CAN_ESR_LEC) >> CAN_ESR_LEC_Pos;

if (lec == 1) printf("[DIAGNOSTIC] Stuff Error (LEC=1, TEC=%d). Baud rate mismatch?\r\n", tec);
if (lec == 3) printf("[DIAGNOSTIC] No Acknowledgment (LEC=3, TEC=%d).\r\n", tec);

if (esr & CAN_ESR_BOFF) {
  printf("[BUS ERROR] Bus-Off! Restarting CAN controller...\r\n");
  HAL_CAN_Stop(&hcan1);
  HAL_CAN_Start(&hcan1);
}
```

**Console Output**

```
--> [RESULT] Transceiver Physical Loopback: 100% PASS!
[BUTTON] >>> Switching CAN Baud Rate to: 500 kbps (Default) <<<
-> [DIAGNOSTIC] No Acknowledgment (ACK Error, LEC=3, TEC=8).
```

<Badge type="info" text="PHASE 2" />

## Stage 2: Stepper Timing {#phase-2}

`steppermotor_w_user_input.c` / `stepper.c`

**Problem Statement:** “Drive the vacuum-head stepper motor through a TB6600 driver with clean microsecond pulses from 3.3 V STM32 logic.”

## 1 5 V Current-Sinking (Common-Anode)

PUL+/DIR+ are tied to the 5 V rail; the STM32 sinks PUL−/DIR− (`PC2`/`PC3` in open-drain mode), giving the TB6600 optocouplers full 5 V drive current so the 3.3 V STM32 switches them reliably without an external level shifter.

::: details Details

Sourcing from 3.3 V leaves only ~1.7 V across the opto's internal resistor after the LED drop — not enough current. Sinking puts the full 5 V across it while the 5 V-tolerant GPIO simply switches to ground.

:::

## 2 Microsecond Timing via DWT

The Cortex-M4 cycle counter (`DWT->CYCCNT`) replaces `HAL_Delay()`, whose 1 ms tick is too coarse for sub-millisecond step pulses.

## 3 Direction Setup Guard

A 20 µs guard after every DIR change (TB6600 requires ≥5 µs) prevents lost steps on reversal across the 110 mm vacuum-head actuator stroke.

## 4 Interactive Tuning & Non-Blocking Execution

Tuned live over UART (`W`/`S` jog, `+`/`−` pulse delay adjustment) and wrapped into a non-blocking state machine (`Stepper_Update()`) so raising or lowering the vacuum head never stalls CAN motor updates.

<MissingAsset name="phase2-stepper.mp4" alt="video" />

Phase 2 Video Demo `/assets/images/Gabriel/phase2-stepper.mp4` Place recording here to preview live playback

**Code (C)**

```c
/* Enable Cortex-M4 DWT cycle counter */
CoreDebug->DEMCR |= CoreDebug_DEMCR_TRCENA_Msk;
DWT->CTRL |= DWT_CTRL_CYCCNTENA_Msk;
DWT->CYCCNT = 0;

void Stepper_DelayUs(uint32_t us) {
  uint32_t start = DWT->CYCCNT;
  uint32_t wait  = us * (SystemCoreClock / 1000000);
  while ((DWT->CYCCNT - start) < wait);
}
```

**Console Output**

```
>>> [SPEED] Faster! Delay = 400 us
>>> [SPEED] Faster! Delay = 300 us
```

<Badge type="tip" text="PHASE 3" />

## Stage 3: Dual Motor Drivers {#phase-3}

`2_motor_w_user_input.c` / `zlac8015d.c`

**Problem Statement:** “Run two ZLAC8015D drivers (four 263 mm, 400 RPM max hub motors) on one shared 500 kbps CAN bus, smoothly and safely.”

## 1 Multi-Node Addressing

CANopen SDO IDs route each command to the right driver on the shared 500 kbps bus: Node 1 (front axle) listens on `0x601` (replies `0x581`), Node 2 (rear axle) on `0x602` (replies `0x582`). No extra pins needed.

## 2 CiA 402 Power-Up Handshake

Each driver is set to Profile Velocity Mode with hardware accel/decel ramps, then armed via Shutdown (`0x06`) → Switch On (`0x07`) → Enable Operation (`0x0F`), with targets initialised at 0 RPM.

## 3 Synchronised Drive & Two-Tier Braking

All four wheels are commanded together. Controlled stop ramps velocity to 0 RPM while keeping coils enabled; Emergency Stop sends CiA 402 Quick-Stop (`Controlword 0x0002`) to lock all four wheels immediately.

<MissingAsset name="phase3-four-wheels.mp4" alt="video" />

Phase 3 Video Demo `/assets/images/Gabriel/phase3-four-wheels.mp4` Place recording here to preview live playback

**Code (C)**

```c
/* CiA 402 power-enable handshake, per driver node */
ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_CONTROLWORD, ZLAC_SUB_ALL, 0x0006); /* Shutdown         */
ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_CONTROLWORD, ZLAC_SUB_ALL, 0x0007); /* Switch On        */
ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_CONTROLWORD, ZLAC_SUB_ALL, 0x000F); /* Enable Operation */
```

**Console Output**

```
[INIT] Initializing ZLAC8015D Driver 1 (Node ID 1)...
[INIT] Initializing ZLAC8015D Driver 2 (Node ID 2)...
>>> [ALERT] EMERGENCY STOP TRIGGERED ON ALL MOTORS!
```

<Badge type="warning" text="PHASE 4" />

## Stage 4: Fault-Handling State Machine {#phase-4}

`state_machine_check.c + GUI.py`

**Problem Statement:** “Stop guessing what the driver is doing — track its real state, latch faults, and reject unsafe commands before they reach the CAN bus.”

![Five-state motor state machine: Disengage, Lock, Movement, Jerk, Error](./assets/images/fsm-diagram.png)

Five-state motor state machine: Disengage, Lock, Movement, Jerk, Error

![Python desktop GUI with speed slider streaming commands to the STM32](./assets/images/gui-screenshot.png)

Python desktop GUI with speed slider streaming commands to the STM32

## 1 Five Explicit States

`DISENGAGE` (freewheel), `LOCK` (holding 0 RPM), `MOVEMENT` (active velocity control), `JERK` (latched Quick-Stop), `ERR` (driver hardware fault).

## 2 Enforced Transitions + GUI

You cannot jump from `DISENGAGE` straight to `MOVEMENT`; the motor must be locked at 0 RPM first. Invalid inputs are rejected before any CAN frame is sent. A Python desktop GUI streams target speeds from a slider for bench validation.

## 3 Statusword Polling & Fault Recovery

The driver's Statusword (`0x6041`) is monitored over CAN; a set fault bit (bit 3) forces `STATE_ERR` and zeros speed automatically. Faults latch until cleared with the CiA 402 Fault Reset rising edge (`0x0080` on Controlword bit 7) — no reboot needed.

<MissingAsset name="phase4-fsm-gui.mp4" alt="video" />

Phase 4 Video Demo `/assets/images/Gabriel/phase4-fsm-gui.mp4` Place recording here to preview live playback

**Code (C)**

```c
case STATE_LOCK:
  if (ch == 'w' || ch == 'W') {
    currentSpeedRpm = SPEED_STEP_RPM;
    Driver_Set_Speed_Right_Only(currentSpeedRpm);
    currentState = STATE_MOVEMENT;
  }
  else if (ch == 'd' || ch == 'D') {
    Driver_Disengage();
    currentState = STATE_DISENGAGE;
  }
  break;
```

**Console Output**

```
>>> [ACTION] RUN: Enabling driver & locking shaft at 0 RPM...
>>> [!] HARDWARE ALARM DETECTED: Entering STATE_ERR!
```

<Badge type="info" text="PHASE 5" />

## Stage 5: Full Teleoperation & Autonomy-Ready Control {#phase-5}

`controller.c`

**Problem Statement:** “Bring everything together: a wireless GameSir gamepad plugged straight into the STM32 drives the full robot and vacuum-head actuator with no laptop needed — while exposing the exact same functions for ROS 2 autonomy.”

## 1 One Controller, Two Jobs (Unified API & USB Host Gamepad)

The GameSir wireless dongle plugs directly into the STM32's USB OTG FS Host port (`PA11`/`PA12`). Every gamepad action calls the same firmware API functions that ROS 2 invokes in autonomous mode (`Robot_Set_CmdVel()`, `Robot_Actuator_Toggle()`, `Robot_Emergency_Stop()`, `Robot_Clear_Faults_And_Enable()`). Pulling both `LT` and `RT` triggers simultaneously cancels throttle to `0.0 m/s`, and button `[X]` raises or lowers the 110 mm vacuum-head stepper actuator non-blockingly.

## 2 Three-Mode Differential-Drive Steering & Anti-Saturation

Using the robot's physical geometry (**575.0 mm track width**, **488.75 mm wheelbase**, **263 mm wheel diameter** / 131.5 mm radius), `Map_Controller_Inputs()` and `Drive_UGV_With_Mode()` implement three steering modes:

1. **Straight (`DRIVE_MODE_STRAIGHT`):** When throttle is active and the steering stick is within the 8% deadband, yaw rate is locked to $\omega_z = 0\text{ rad/s}$ with identical left/right RPMs.
2. **Arc Turn (`DRIVE_MODE_ARC_TURN`):** When moving and steering simultaneously, the firmware enforces a **minimum turn radius clamp** ($|\omega_z| \le |v_x| / R_{\min}$) so the inner wheels never reverse mid-arc.
3. **Spot Turn (`DRIVE_MODE_SPOT_TURN`):** When stationary ($v_x = 0$) and the stick is deflected, the robot pivots in place ($RPM_R = -RPM_L$) with cubic exponential stick shaping for fine heading adjustments.

If a combined arc command pushes the outer wheels past the speed limit (`g_motor_max_rpm`), **kinematic anti-saturation** scales both left and right wheel speeds proportionally so the exact turning curve is preserved. Left-channel polarity is inverted in `Motor_Set_Velocity_All(-left_rpm, right_rpm)` to account for the mirrored hub motor mounting.

## 3 50 Hz Smooth Velocity Ramping

A deterministic **50 Hz (`20 ms`)** control loop runs `Update_Ramp_Channel()` on both wheel channels, ramping speed up and down (e.g., `35 RPM/s` accel, `20–28 RPM/s` decel) and decelerating cleanly through `0 RPM` before reversing direction — eliminating jerking, wheel slip, and chassis tipping.

## 4 Watchdogs, Latched E-Stop & Neutral-Gated Re-Arming

- **250 ms Comms Watchdog & Instant USB Disconnect Stop:** If no valid gamepad packet arrives within **250 ms** (`CONTROLLER_TIMEOUT_MS`), the STM32 enters `ROBOT_STATE_WATCHDOG_STOP` and brings the motors to a controlled stop. Unplugging the USB receiver triggers `HOST_USER_DISCONNECTION`, stopping the robot **immediately**.
- **Latched Emergency Stop:** Pressing `[B]` (or `BACK`) calls `Robot_Emergency_Stop()`, firing a CiA 402 Quick-Stop (`0x0002`) on both ZLAC8015D nodes, halting the stepper, and latching `ROBOT_STATE_ESTOP_LATCHED`.
- **Neutral-Gated Re-Arming:** Pressing `[A]` (or `START`) to clear faults and re-arm is only accepted when `controls_neutral` is true (both triggers released and stick centered), ensuring the robot never lurches upon re-arming.

<MissingAsset name="phase5-drive.mp4" alt="video" />

Phase 5 Full Teleoperation Demo `/assets/images/Gabriel/phase5-drive.mp4` Featured live verification capture (largest video in firmware scope)

**Code (C) — Three-Mode Steering & Proportional Anti-Saturation (`controller.c`)**

```c
/* Regime 2: Arc Turn While Moving — enforce minimum turn radius so inner wheels never reverse */
if (throttle_moving && steer_active) {
  mode = DRIVE_MODE_ARC_TURN;
  float shaped_steer = Process_Analog_Stick(raw_steer, STICK_DEADZONE, CONFIG_STEERING_EXPO);
  float unconstrained_wz = shaped_steer * g_turn_angular_velocity;
  float max_wz = fabsf(vx) / g_min_turn_radius; /* |wz| <= |vx| / R_min */
  wz = (fabsf(unconstrained_wz) > max_wz) ? copysignf(max_wz, unconstrained_wz) : unconstrained_wz;
}

/* Differential-drive inverse kinematics + proportional anti-saturation scaling */
float v_left  = vx - (wz * ROBOT_TRACK_WIDTH_M) / 2.0f;
float v_right = vx + (wz * ROBOT_TRACK_WIDTH_M) / 2.0f;
float rpm_left  = (v_left  * 60.0f) / (2.0f * 3.14159265f * ROBOT_WHEEL_RADIUS_M);
float rpm_right = (v_right * 60.0f) / (2.0f * 3.14159265f * ROBOT_WHEEL_RADIUS_M);

float max_wheel_rpm = fmaxf(fabsf(rpm_left), fabsf(rpm_right));
if (max_wheel_rpm > (float)g_motor_max_rpm && max_wheel_rpm > 0.0001f) {
  float scale = (float)g_motor_max_rpm / max_wheel_rpm;
  rpm_left  *= scale; /* Scale both wheels together to preserve turning curve */
  rpm_right *= scale;
}
```

**Console Output**

```
>>> [INIT] Connecting to ZLAC8015D Motor Drivers...
  >>> [CAN OK] Node 1 acknowledged (Statusword: 0x0237)
  >>> [CAN OK] Node 2 acknowledged (Statusword: 0x0237)
>>> [USB] Controller Dongle Attached & Class Active!
>>> [SYSTEM READY] Controls neutral & controller linked! Ready to drive.
[READY|ARC] v:+0.34 m/s w:+0.45 | L:+18 R:+25 (Tgt:+18 +25) | StkX: +65% RT:100% LT:  0% | CAN:N1[O] N2[O] | WD: 12ms
```

## Safety Is Layered, Not Bolted On {#section-8-safety}

A multi-layer safety matrix enforces determinism across the hardware interlocks, USB/CAN watchdogs, and firmware state machine.

| Hazard | Mitigation | Layer | Stage |
| --- | --- | --- | --- |
| **Controller signals stop arriving** | **250 ms watchdog** (`CONTROLLER_TIMEOUT_MS`) triggers `ROBOT_STATE_WATCHDOG_STOP` and zeroes wheel speed; **500 ms watchdog** on ROS 2 `cmd_vel` | <Badge type="info" text="Firmware" /> | [Stage 5](#phase-5) |
| **USB receiver link drops** | `HOST_USER_DISCONNECTION` interrupt immediately enters `ROBOT_STATE_DISCONNECTED` and stops all four wheels | <Badge type="info" text="Firmware" /> | [Stage 5](#phase-5) |
| **Operator emergency** | Gamepad `[B]` / `BACK` latches `ROBOT_STATE_ESTOP_LATCHED` and sends CiA 402 Quick-Stop (`0x0002`) + halts stepper until cleared | <Badge type="info" text="Firmware" /> | [Stage 3](#phase-3), [5](#phase-5) |
| **Unsafe re-arm while throttle held** | Re-arming (`[A]` / `START`) is rejected unless all triggers and sticks are back at neutral (`controls_neutral`) | <Badge type="info" text="Firmware" /> | [Stage 5](#phase-5) |
| **Inner-wheel reversal / tyre scrubbing** | Minimum turn radius clamp ($|\omega_z| \le |v_x| / R_{\min}$) and proportional anti-saturation scaling preserve curvature | <Badge type="info" text="Firmware" /> | [Stage 5](#phase-5) |
| **Sudden speed jumps (jerking / tipping)** | **50 Hz (`20 ms`)** software velocity ramping loop + ZLAC8015D hardware accel/decel profiles | <Badge type="info" text="Firmware" /> | [Stage 3](#phase-3), [5](#phase-5) |
| **No ACK locks the CAN TX mailboxes** | Auto-retransmit disabled; stalled mailboxes aborted; automatic Bus-Off recovery | <Badge type="info" text="Firmware" /> | [Stage 1](#phase-1), [5](#phase-5) |
| **Driver fault (stall, overvoltage)** | Statusword (`0x6041`) monitored → latches fault state and zeros speed | <Badge type="info" text="Firmware" /> | [Stage 4](#phase-4), [5](#phase-5) |
| **Firmware or comms failure** | Wireless kill switch triggers the motor drivers' built-in emergency stop; safety contactor cuts 48 V motor power while keeping computers alive | <Badge type="warning" text="Hardware" /> | [Hardware → Power & Safety](./stm32-hardware.md#interface-wiring) |

## Problems We Hit {#section-9-problems}

Key benchtop troubleshooting lessons learned during actuator and motor driver integration.

#### “Stepper driver ignored our pulses”

Symptom Driver didn't respond reliably.

Cause 3.3 V GPIO couldn't push enough current through the TB6600 driver's optocoupler LEDs (~1.7 V left after the LED drop).

Fix Rewired common-anode to 5 V and used 5 V current-sinking on the negative inputs (`PC2`/`PC3` open-drain GPIO) so the 3.3 V STM32 switches it reliably.

#### “The wheels fought each other”

Symptom Commanding positive RPM to all motors locked the chassis.

Cause Left and right hub motors are mounted mirrored on opposite sides of the chassis.

Fix Per-side polarity inversion inside `Motor_Set_Velocity_All(-left_rpm, right_rpm)` so higher layers command strictly in ROS REP 103 vehicle-forward coordinates.

#### “Step timing was too coarse”

Symptom Stepper motor couldn't reach usable speed smoothly along its 110 mm stroke.

Cause `HAL_Delay()` has 1 ms resolution; microstep pulses needed microsecond-level timing.

Fix DWT cycle-counter microsecond timing paired with a non-blocking `Stepper_Update()` super-loop task.

## Next: Semester 2 Firmware Roadmap {#section-10-roadmap}

Target enhancements scheduled for Semester 2 integration with the Jetson companion computer and pre-allocated sensor buses:

ROS 2 Link to the Jetson for Autonomous Driving <Badge type="info" text="Planned" />

Connect the Jetson to the STM32 over serial/micro-ROS so `cmd_vel` and actuator service calls drive the existing `Robot_Set_CmdVel()` and `Robot_Actuator_Toggle()` functions, guarded by the 500 ms autonomy watchdog.

IMU and Wheel-Odometry Fusion <Badge type="info" text="Planned" />

Fuse 9-DOF IMU (`I2C1`) attitude/yaw-rate measurements with ZLAC8015D dual-axle wheel encoder feedback to publish drift-corrected odometry (`/odom`) on uneven runway surfaces.

Live Battery Telemetry <Badge type="info" text="Planned" />

Ingest 48 V LiFePO4 BMS telemetry (pack voltage, current, SoC, and cell temperatures) over `USART1`, with automatic low-battery power throttling and fault cutoffs.

Closed-Loop Speed Control <Badge type="info" text="Planned" />

Use real-time velocity feedback from the ZLAC8015D motor drivers (`0x606C`) to close an outer slip- and heading-compensation loop on the STM32.

<!-- #endregion report -->

←

[Previous Architecture](./stm32-hardware.md)

STM32 Hardware Subsystem
