---
title: "STM32 Firmware Architecture & Control"
description: "Bare-metal STM32F446RE firmware architecture, unified teleop/ROS 2 control API, 3-mode differential-drive steering, 50 Hz velocity ramping, multi-layer safety watchdogs, and 5-stage verification."
owner: "Gabriel Tan"
outline: [2, 3]
---

# STM32 Firmware Architecture & Control

> **Semester 1 engineering documentation · Gabriel Tan**  
> **Evidence boundary:** This page documents the bare-metal STM32F446RE firmware (`controller.c`, `zlac8015d.c`, `stepper.c`) developed and bench-verified across five progressive stages during Semester 1. Bench testing operated under the 32 V / 10.4 A current-safe power preset (`USE_POWER_PRESET_3`); full 48 V battery field trials, ROS 2 serial link integration with the Jetson, IMU/encoder fusion, and BMS telemetry remain Semester 2 work.

<!-- #region report -->

## 1. Objectives & Dual-Role Control Philosophy {#section-1-method}

The STM32 firmware serves as the deterministic execution layer between high-level operator or autonomy commands and the physical motor drivers. Rather than writing separate, throwaway test scripts for manual driving and autonomous control, the firmware is built around a single principle — **one controller, two jobs**:

- **Unified Teleop & Autonomy API:** Every wireless GameSir gamepad input maps directly to a high-level firmware function (`Robot_Set_CmdVel()`, `Robot_Emergency_Stop()`, `Robot_Controlled_Stop()`, `Robot_Actuator_Toggle()`). In autonomous mode, **ROS 2 calls the exact same functions** (`CONTROL_SOURCE_ROS`), so every manual teleoperation test on the bench or runway directly exercises and validates the autonomy execution path.
- **Built Step by Step (5 Tested Stages):** Every layer of the firmware was developed and verified on physical hardware in five incremental stages before the next layer was added on top of it:
  1. **CAN bus diagnostics** (`can_debugging_check.c`) — transceiver loopback, live baud sweep, and register-level error decoding.
  2. **Stepper timing** (`steppermotor_w_user_input.c` / `stepper.c`) — 5 V open-drain current-sinking and Cortex-M4 DWT microsecond pulse timing.
  3. **Dual motor drivers** (`2_motor_w_user_input.c` / `zlac8015d.c`) — multi-node CANopen SDO addressing (`0x601`/`0x602`) and CiA 402 velocity handshakes.
  4. **Fault-handling state machine** (`state_machine_check.c + GUI.py`) — 5-state transition guard and Statusword (`0x6041`) fault polling.
  5. **Full teleoperation** (`controller.c`) — standalone USB Host gamepad parsing, 3-mode differential steering, 50 Hz velocity ramping, and safety watchdogs.

## 2. Firmware Architecture & Differential-Drive Kinematics {#section-2-architecture}

The firmware executes a bare-metal, non-blocking super-loop on the Cortex-M4F core, decoupling chassis-level kinematics and safety arbitration on the STM32 from the high-frequency closed-loop Field-Oriented Control (FOC) running inside the dual ZLAC8015D motor drivers.

<Figure
  src="./assets/diagrams/stm32-firmware-firmware-architecture-block-diagram.svg"
  alt="Firmware Architecture Block Diagram"
  caption="**Figure 2.1: STM32F446RE Bare-Metal Firmware Architecture.** Gamepad USB HID reports and future ROS 2 `cmd_vel` twists converge on the same 3-mode kinematic conditioning, anti-saturation scaling, 50 Hz velocity ramping loop, and CiA 402 CANopen dispatcher."
/>

### 2.1 Three-Mode Differential-Drive Steering & Anti-Saturation {#steering-modes}

Using the vehicle's physical geometry (**575.0 mm track width**, **488.75 mm wheelbase**, **263 mm wheel diameter** / $r = 0.1315\text{ m}$), `Map_Controller_Inputs()` and `Drive_UGV_With_Mode()` in `controller.c` translate throttle and steering inputs into left and right wheel RPM targets across three discrete regimes (see [Steering Kinematics](../hilbert/steering-kinematics.md) for the theoretical derivation):

1. **Straight (`DRIVE_MODE_STRAIGHT`):** When throttle is active and the steering stick is within its $8\%$ deadband, angular velocity is forced to $\omega_z = 0\text{ rad/s}$ so left and right wheel banks receive identical RPM setpoints for straight-line tracking.
2. **Arc Turn (`DRIVE_MODE_ARC_TURN`):** When moving and steering simultaneously, the firmware enforces a **minimum turn radius clamp** so the inner wheels never reverse direction mid-arc or scrub violently:
   $$|\omega_z| \le \frac{|v_x|}{R_{\min}}$$
3. **Spot Turn (`DRIVE_MODE_SPOT_TURN`):** When stationary ($v_x = 0$) and the steering stick is deflected past the deadzone, the robot executes an in-place zero-radius pivot ($\text{RPM}_R = -\text{RPM}_L$) with cubic exponential stick shaping for fine heading alignment.

To convert linear wheel velocities $v_{L,R} = v_x \mp (\omega_z W)/2$ into wheel speeds $\text{RPM}_{L,R} = (60 \, v_{L,R}) / (2\pi r)$ without distorting the commanded trajectory at high speed, **kinematic anti-saturation** scales both wheel banks proportionally whenever either wheel exceeds the configured ceiling `g_motor_max_rpm`:

$$\text{if } \max(|\text{RPM}_L|, |\text{RPM}_R|) > \text{RPM}_{\max}: \quad \text{scale} = \frac{\text{RPM}_{\max}}{\max(|\text{RPM}_L|, |\text{RPM}_R|)}, \quad \text{RPM}_{L,R} \leftarrow \text{scale} \cdot \text{RPM}_{L,R}$$

This preserves the exact turning curvature $R = v_x / \omega_z$ when the motors reach their limit.

### 2.2 Smooth Motion via 50 Hz Velocity Ramping {#ramping-loop}

Rather than forwarding step changes in target RPM directly to the CAN bus, a deterministic **50 Hz (`20 ms`) control loop** executes `Update_Ramp_Channel()` on both wheel channels. Wheel speeds ramp smoothly up (`35 RPM/s`) and down (`20–28 RPM/s`) and decelerate cleanly through `0 RPM` on direction reversals, preventing mechanical jerking, gear/hub shock, or chassis tipping.

::: details Firmware API functions and kinematic conditioning implementation (controller.c)

**Table 2.1: Unified Firmware API (`controller.c`) Shared by Gamepad Teleop and ROS 2 Autonomy**

| Firmware Function | Role & Behavior | Called By (Teleop) | Called By (Autonomy) |
| :--- | :--- | :--- | :--- |
| `Robot_Set_CmdVel(vx, wz)` | Inverse kinematics, anti-saturation scaling & target RPM update | `Calculate_Kinematics()` | ROS 2 `/cmd_vel` subscriber |
| `Robot_Emergency_Stop()` | Latches `ROBOT_STATE_ESTOP_LATCHED`, sends CiA 402 Quick-Stop (`0x0002`) & halts stepper | Button `[B]` or `[BACK]` | ROS 2 `/c2/target_alert` (`ABORT`) |
| `Robot_Controlled_Stop()` | Ramps target wheel speeds down to `0 RPM` while keeping coils enabled | Triggers released / Watchdog | Goal completion / Hold state |
| `Robot_Clear_Faults_And_Enable()` | Sends Fault Reset (`0x0080`), re-initializes Velocity Mode & enables operation (`0x000F`) | Button `[A]` / `[START]` (at neutral) or Nucleo `B1` | ROS 2 recovery service |
| `Robot_Actuator_Toggle()` | Non-blocking 110 mm raise/lower of the vacuum-head stepper (`Stepper_StartMove()`) | Button `[X]` | ROS 2 FOD pickup service |
| `Robot_Get_Telemetry(*out)` | Populates state, drive mode, $v_x$, $\omega_z$, target/active RPMs & actuator status | 10 Hz UART console logger | ROS 2 `/odom` & status publisher |

```c
/* 3-Regime Steering & Kinematic Anti-Saturation (CDE4301Stm32/Core/Src/controller.c) */
if (throttle_moving) {
  if (!steer_active) {
    mode = DRIVE_MODE_STRAIGHT;
    wz = 0.0f;
  } else {
    mode = DRIVE_MODE_ARC_TURN;
    float shaped_steer = Process_Analog_Stick(raw_steer, STICK_DEADZONE, CONFIG_STEERING_EXPO);
    float unconstrained_wz = shaped_steer * g_turn_angular_velocity;
    /* Minimum turning radius clamp: |wz| <= |vx| / MIN_TURN_RADIUS */
    float max_wz = fabsf(vx) / g_min_turn_radius;
    wz = (fabsf(unconstrained_wz) > max_wz) ? ((unconstrained_wz > 0.0f) ? max_wz : -max_wz) : unconstrained_wz;
  }
} else if (steer_active) {
  mode = DRIVE_MODE_SPOT_TURN;
  wz = Process_Analog_Stick(raw_steer, STICK_DEADZONE, CONFIG_STEERING_EXPO) * g_turn_angular_velocity;
}

/* Proportional anti-saturation scaling to preserve turning curvature */
float max_wheel_rpm = fmaxf(fabsf(rpm_left), fabsf(rpm_right));
if (max_wheel_rpm > (float)g_motor_max_rpm && max_wheel_rpm > 0.0001f) {
  float scale = (float)g_motor_max_rpm / max_wheel_rpm;
  rpm_left  *= scale;
  rpm_right *= scale;
}
```

:::

## 3. Progressive 5-Stage Implementation & Verification {#five-stages}

### 3.1 Stage 1: CAN Bus Diagnostics (`can_debugging_check.c`) {#phase-1}

Before commanding any motor, Stage 1 verified the physical CAN transceiver and bus wiring. A **DC GPIO loopback test** bit-bangs `PB9` (TX) and reads `PB8` (RX) before starting the bxCAN peripheral to separate board-level wiring faults from protocol faults. Pressing the Nucleo user button (`PC13`) sweeps across `500k → 250k → 1M → 125k` bps to identify driver baud rates without reflashing, while auto-retransmission is disabled so a missing ACK never deadlocks the TX mailboxes.

<MissingAsset name="phase1-can.mp4" alt="Stage 1 CAN bus diagnostics video demo" />

::: details Stage 1 diagnostic mechanisms, C implementation and console output

- **DC Loopback Test:** `PB9` is temporarily configured as GPIO output and `PB8` as input (Recessive: `PB9 HIGH → PB8 HIGH`; Dominant: `PB9 LOW → PB8 LOW`), then restored to `AF9 (CAN1)`.
- **ESR Hardware Fault Decoding:** Reads the CAN Error Status Register (`TEC`, `REC`, `LEC`) to translate bus faults into plain English (`LEC=1` Stuff Error → baud mismatch; `LEC=3` ACK Error → unpowered driver or swapped `CAN_H`/`CAN_L`) and automatically recovers from Bus-Off (`BOFF`).

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

```text
--> [RESULT] Transceiver Physical Loopback: 100% PASS!
[BUTTON] >>> Switching CAN Baud Rate to: 500 kbps (Default) <<<
-> [DIAGNOSTIC] No Acknowledgment (ACK Error, LEC=3, TEC=8).
```

:::

### 3.2 Stage 2: Stepper Timing (`steppermotor_w_user_input.c` / `stepper.c`) {#phase-2}

Stage 2 established reliable microsecond pulse generation for the vacuum-head linear actuator's **TB6600** stepper driver. Tying `PUL+`/`DIR+` to **5 V** and configuring `PC2`/`PC3` as **open-drain current-sinking outputs** allowed the 3.3 V STM32 to switch the full 5 V across the TB6600 optocouplers without a level shifter. Timing was upgraded from `HAL_Delay()` (1 ms resolution) to the **Cortex-M4 DWT cycle counter** (`DWT->CYCCNT`) for microsecond-accurate step pulses, with a `20 µs` direction-change guard (`≥5 µs` required by TB6600) to prevent lost steps.

<MissingAsset name="phase2-stepper.mp4" alt="Stage 2 stepper actuator timing video demo" />

::: details Stage 2 DWT microsecond delay code and console output

```c
/* Enable Cortex-M4 DWT cycle counter for sub-millisecond stepper pulses */
CoreDebug->DEMCR |= CoreDebug_DEMCR_TRCENA_Msk;
DWT->CTRL |= DWT_CTRL_CYCCNTENA_Msk;
DWT->CYCCNT = 0;

void Stepper_DelayUs(uint32_t us) {
  uint32_t start = DWT->CYCCNT;
  uint32_t wait  = us * (SystemCoreClock / 1000000);
  while ((DWT->CYCCNT - start) < wait);
}
```

```text
>>> [SPEED] Faster! Delay = 400 us
>>> [SPEED] Faster! Delay = 300 us
```

:::

### 3.3 Stage 3: Dual Motor Drivers (`2_motor_w_user_input.c` / `zlac8015d.c`) {#phase-3}

Stage 3 brought both **ZLAC8015D** dual-channel drivers (controlling all four 263 mm hub motors) onto the shared 500 kbps CAN bus using **CANopen SDO node addressing**: Node 1 (front axle) listens on `0x601` (replies `0x581`) and Node 2 (rear axle) listens on `0x602` (replies `0x582`). Each driver is initialized into CiA 402 Profile Velocity Mode (`0x6060 = 3`) with hardware acceleration/deceleration profiles and armed through the standard CiA 402 state-machine handshake: **Shutdown (`0x06`) → Switch On (`0x07`) → Enable Operation (`0x0F`)**.

<MissingAsset name="phase3-four-wheels.mp4" alt="Stage 3 four-wheel CANopen drive video demo" />

::: details Stage 3 CiA 402 power-enable handshake code and console output

```c
/* CiA 402 power-enable handshake, executed per ZLAC8015D driver node */
ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_CONTROLWORD, ZLAC_SUB_ALL, 0x0006); /* Shutdown         */
ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_CONTROLWORD, ZLAC_SUB_ALL, 0x0007); /* Switch On        */
ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_CONTROLWORD, ZLAC_SUB_ALL, 0x000F); /* Enable Operation */
```

```text
[INIT] Initializing ZLAC8015D Driver 1 (Node ID 1)...
[INIT] Initializing ZLAC8015D Driver 2 (Node ID 2)...
>>> [ALERT] EMERGENCY STOP TRIGGERED ON ALL MOTORS!
```

:::

### 3.4 Stage 4: Fault-Handling State Machine (`state_machine_check.c + GUI.py`) {#phase-4}

Stage 4 replaced stateless command forwarding with an explicit **5-state supervisory finite state machine** (`DISENGAGE`, `LOCK`, `MOVEMENT`, `JERK`, `ERR`) paired with a Python desktop GUI slider for continuous speed streaming. The state machine forbids unsafe transitions (such as jumping from freewheeling `DISENGAGE` directly to `MOVEMENT` without first locking the shaft at `0 RPM` in `LOCK`) and polls each driver's **Statusword (`0x6041`)** so any hardware alarm (bit 3) automatically forces `STATE_ERR` and zeros speed until cleared via a CiA 402 Fault Reset (`0x0080`).

<Figure
  src="./assets/images/fsm-diagram.png"
  alt="Five-state motor state machine: Disengage, Lock, Movement, Jerk, Error"
  caption="**Figure 3.1: Stage 4 Five-State Motor Supervisory FSM.** Enforces valid state transitions (`DISENGAGE → LOCK → MOVEMENT`) and latches hardware faults (`ERR`) or emergency stops (`JERK`)."
/>

<MissingAsset name="phase4-fsm-gui.mp4" alt="Stage 4 state machine and GUI video demo" />

::: details Stage 4 Python test GUI, transition guard code and console output

<Figure
  src="./assets/images/gui-screenshot.png"
  alt="Python desktop GUI with speed slider streaming commands to the STM32"
  caption="**Figure 3.2: Stage 4 Desktop Verification GUI (`GUI.py`).** Streams real-time RPM setpoints and state-transition commands over UART to validate FSM transition guards."
/>

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

```text
>>> [ACTION] RUN: Enabling driver & locking shaft at 0 RPM...
>>> [!] HARDWARE ALARM DETECTED: Entering STATE_ERR!
```

:::

### 3.5 Stage 5: Full Teleoperation (`controller.c`) {#phase-5}

Stage 5 integrated all prior modules into the production `controller.c` firmware: boot-time CAN node probing (`Verify_CAN_Node()`), native USB Host HID parsing for the wireless **GameSir** gamepad (`Parse_Gamepad_Report()`), mirrored hub-motor polarity inversion (`Motor_Set_Velocity_All(-left_rpm, right_rpm)`), 3-mode differential-drive steering, the 50 Hz velocity ramping loop, non-blocking vacuum-head stepper control on button `[X]`, and real-time D-Pad parameter tuning (`±1 RPM` max speed, `±0.1 rad/s` turn rate).

<MissingAsset name="phase5-drive.mp4" alt="Stage 5 full teleoperation video demo" />

::: details Stage 5 safety state machine, watchdog logic and 10 Hz UART telemetry log

```c
/* Step 4: Gamepad Watchdog Check (250 ms timeout) */
if (current_control_source == CONTROL_SOURCE_GAMEPAD && robot_state == ROBOT_STATE_READY) {
  if (HAL_GetTick() - last_valid_report_tick >= CONTROLLER_TIMEOUT_MS) {
    robot_state      = ROBOT_STATE_WATCHDOG_STOP;
    target_left_rpm  = 0;
    target_right_rpm = 0;
    Motor_Stop_Controlled();
    printf("\r\n>>> [WATCHDOG FAIL-SAFE] Gamepad report timeout (>%d ms)! Motors stopped.\r\n",
           CONTROLLER_TIMEOUT_MS);
  }
}

/* Neutral-Gated Re-Arming & Fault Clear ([A] or [START]) */
uint8_t controls_neutral = (current_lt_pct <= TRIGGER_DEADZONE_PCT) &&
                           (current_rt_pct <= TRIGGER_DEADZONE_PCT) &&
                           (fabsf(current_stick_x_norm) <= STICK_DEADZONE) &&
                           (fabsf(current_stick_y_norm) <= STICK_DEADZONE);

if (reset_pressed && controls_neutral) {
  Robot_Clear_Faults_And_Enable();
}
```

```text
>>> [INIT] Connecting to ZLAC8015D Motor Drivers...
  >>> [CAN OK] Node 1 acknowledged (Statusword: 0x0237)
  >>> [CAN OK] Node 2 acknowledged (Statusword: 0x0237)
>>> [USB] Controller Dongle Attached & Class Active!
>>> [SYSTEM READY] Controls neutral & controller linked! Ready to drive.
[READY|ARC] v:+0.34 m/s w:+0.45 | L:+18 R:+25 (Tgt:+18 +25) | StkX: +65% RT:100% LT:  0% | CAN:N1[O] N2[O] | [Cfg:25RPM/0.5rad] WD: 12ms
```

:::

## 4. Multi-Layer Safety Architecture {#section-8-safety}

Safety is enforced across three independent layers — **communications watchdogs**, **state-machine interlocks**, and **physical hardware cutoffs** — so no single software bug or dropped wireless link can leave the 4-wheel drivetrain running uncontrolled:

- **250 ms Comms Watchdog & Instant USB Disconnect Stop:** If wireless gamepad packets stop arriving for more than **250 ms** (`CONTROLLER_TIMEOUT_MS`), the firmware automatically enters `ROBOT_STATE_WATCHDOG_STOP` and commands `0 RPM` (`500 ms` timeout in ROS 2 `cmd_vel` mode). If the USB wireless receiver is unplugged or loses power, the `HOST_USER_DISCONNECTION` interrupt stops the robot **immediately** (`ROBOT_STATE_DISCONNECTED`).
- **Latched Emergency Stop:** Pressing `[B]` (or `BACK`) calls `Robot_Emergency_Stop()`, immediately issuing a CiA 402 Quick-Stop (`0x0002`) to both ZLAC8015D drivers, halting the vacuum-head stepper, and latching `ROBOT_STATE_ESTOP_LATCHED` until explicitly cleared.
- **Neutral-Gated Re-Arming:** The robot refuses to re-arm or clear faults (`[A]` / `START`) unless all triggers and sticks are returned to neutral within their deadzones (`controls_neutral`), preventing sudden lurches upon recovery.

| Hazard / Failure Mode | Mitigation Mechanism | Enforcement Layer | Verified Stage |
| :--- | :--- | :--- | :--- |
| **Controller signals stop arriving** | **250 ms watchdog** (`CONTROLLER_TIMEOUT_MS`) enters `ROBOT_STATE_WATCHDOG_STOP` and stops motors (`500 ms` for ROS 2 `cmd_vel`) | <Badge type="info" text="Firmware" /> | [Stage 5](#phase-5) |
| **USB receiver link drops** | `HOST_USER_DISCONNECTION` callback immediately enters `ROBOT_STATE_DISCONNECTED` and zeroes velocity | <Badge type="info" text="Firmware" /> | [Stage 5](#phase-5) |
| **Operator emergency** | Gamepad `[B]` / `BACK` latches `ROBOT_STATE_ESTOP_LATCHED`, sends CiA 402 Quick-Stop (`0x0002`) & halts stepper | <Badge type="info" text="Firmware" /> | [Stage 3](#phase-3), [5](#phase-5) |
| **Re-arm attempted with throttle held** | Re-arming (`[A]` / `START`) rejected unless triggers and sticks are back at neutral (`controls_neutral`) | <Badge type="info" text="Firmware" /> | [Stage 5](#phase-5) |
| **Both triggers pulled simultaneously** | `lt_pct > deadzone && rt_pct > deadzone` cancels throttle to `0.0 m/s` | <Badge type="info" text="Firmware" /> | [Stage 5](#phase-5) |
| **Inner-wheel reversal / tyre scrub** | Minimum turn radius clamp ($|\omega_z| \le |v_x| / R_{\min}$) + proportional anti-saturation scaling | <Badge type="info" text="Firmware" /> | [Stage 5](#phase-5) |
| **Sudden speed jumps (jerking / tipping)** | **50 Hz (`20 ms`)** software velocity ramping loop + ZLAC8015D hardware accel/decel ramps | <Badge type="info" text="Firmware" /> | [Stage 3](#phase-3), [5](#phase-5) |
| **Missing CAN ACK / Bus-Off** | Auto-retransmit disabled; boot node probe (`60 ms`); automatic Bus-Off (`BOF`) peripheral reset | <Badge type="info" text="Firmware" /> | [Stage 1](#phase-1), [5](#phase-5) |
| **Firmware hang or total comms loss** | **Wireless kill switch** triggers motor drivers' built-in E-stop; **safety contactor** cuts 48 V motor power while keeping computers alive | <Badge type="warning" text="Hardware" /> | [Hardware → Safety](./stm32-hardware.md#interface-wiring) |

## 5. Benchtop Testing, Troubleshooting & Lessons Learned {#section-9-problems}

Developing the firmware bottom-up across the five stages exposed three critical hardware–software interaction bugs on the bench before full chassis integration:

1. **Stepper Driver Ignored 3.3 V Pulses → Resolved via 5 V Current-Sinking:**
   - _Problem:_ Driving the TB6600 `PUL+`/`DIR+` directly from 3.3 V STM32 push-pull GPIOs produced intermittent, unreliable stepping.
   - _Root Cause:_ After the optocoupler LED forward voltage drop ($\approx 1.6\text{ V}$), a 3.3 V pin leaves only $\approx 1.7\text{ V}$ across the driver's internal resistor — below the required turn-on current threshold.
   - _Fix:_ Rewired `PUL+` and `DIR+` to the **5 V rail** (common-anode) and configured `PC2`/`PC3` as 5 V-tolerant **open-drain current-sinking outputs** (`GPIO_MODE_OUTPUT_OD`), delivering the full 5 V swing without extra level-shifter ICs.
2. **Opposing Wheels Fought Each Other → Resolved via Per-Bank Polarity Inversion:**
   - _Problem:_ Commanding `+25 RPM` to all four channels caused the left and right wheel banks to rotate in opposite directions, locking the chassis in a stationary pivot.
   - _Root Cause:_ Left-side (Channel 1) and right-side (Channel 2) hub motors are mounted mirrored on opposite sides of the chassis frame.
   - _Fix:_ Encapsulated left-channel sign inversion inside `Motor_Set_Velocity_All(-left_rpm, right_rpm)` so all higher-level kinematics and ROS 2 interfaces operate strictly in standard ROS REP 103 coordinates ($+v_x$ forward, $+\omega_z$ counter-clockwise).
3. **Coarse Stepper Timing Stalled Actuator → Resolved via DWT Cycle Counter & Non-Blocking Loop:**
   - _Problem:_ Using `HAL_Delay(1)` limited step frequency to $\le 500\text{ Hz}$ and blocked the main loop during the 110 mm vacuum-head stroke.
   - _Fix:_ Replaced `HAL_Delay()` with the 180 MHz Cortex-M4 hardware cycle counter (`DWT->CYCCNT`) inside a non-blocking state machine (`Stepper_Update()`), achieving smooth `18–25 µs` half-step pulses while CAN and USB tasks continue uninterrupted at 50 Hz.

## 6. Limitations & Semester 2 Firmware Roadmap {#section-10-roadmap}

During Semester 1, the complete 5-stage firmware stack was verified using a 32 V / 10.4 A laboratory bench supply (`USE_POWER_PRESET_3`, capping bench wheel speed at `25 RPM`) and open-loop velocity setpoints sent to the ZLAC8015D internal FOC controllers. For Semester 2, four firmware upgrades are scheduled upon full 48 V chassis assembly (`USE_POWER_PRESET_1`):

1. **ROS 2 Link to the Jetson for Autonomous Driving:** Connect the Jetson companion computer to the STM32 over UART/micro-ROS so Nav2 `/cmd_vel` twists and FOD-collection actuator triggers directly invoke `Robot_Set_CmdVel()` and `Robot_Actuator_Toggle()`, supervised by the `500 ms` `ROS_CMD_VEL_TIMEOUT_MS` watchdog.
2. **IMU and Wheel-Odometry Fusion:** Read 100 Hz 9-DOF IMU attitude/yaw-rate data over `I2C1` (`PB6`/`PB7`) and fuse it with ZLAC8015D dual-axle encoder counts to publish slip-compensated wheel odometry (`/odom`) to the Jetson's Dual-EKF stack.
3. **Live Battery Telemetry:** Ingest real-time pack voltage, current draw, State of Charge (SoC), and cell temperatures from the 48 V LiFePO4 BMS over `USART1` (`PA9`/`PA10`), enabling automatic low-battery speed throttling and fault cutoffs.
4. **Closed-Loop Speed Control:** Poll actual wheel velocity feedback from the ZLAC8015D drivers (`Object 0x606C`) over CANopen to close an outer heading- and slip-compensation loop on the STM32 during high-speed runway sweeps.

**Related documentation:** [STM32 Hardware Subsystem →](./stm32-hardware.md) · [Steering Kinematics →](../hilbert/steering-kinematics.md) · [Autonomous Navigation →](../hilbert/navigation.md) · [UAV–UGV Communications →](../hilbert/communications.md)

<!-- #endregion report -->

National University of Singapore · CDE4301 Capstone Project

← [Previous Architecture: STM32 Hardware Subsystem](./stm32-hardware.md)
