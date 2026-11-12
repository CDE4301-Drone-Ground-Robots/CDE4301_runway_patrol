---
title: "STM32 Firmware Architecture & Control"
description: "Controller-first firmware, 5-stage bottom-up testing, CiA 402 motor control, 3-mode differential-drive kinematics, 50 Hz velocity ramping, and Semester 2 roadmap."
owner: "Gabriel Tan"
outline: [2, 3]
---

# STM32 Firmware Architecture & Control

<!-- #region report -->

<p class="fh-lead-summary">
  Bare-metal STM32F446RE firmware that turns gamepad input now, and ROS 2 <code>cmd_vel</code> in Semester 2, into 4-wheel CAN velocity commands and stepper pulses inside one 50 Hz (20 ms) loop with layered stop paths. Built and tested bottom-up in 5 stages.
</p>

<div class="fh-status-strip" role="region" aria-label="Subsystem verification status">
  <div class="fh-status-row">
    <span class="fh-status-label">Tested</span>
    <span class="fh-pill fh-pill--tested">CAN diagnostics</span>
    <span class="fh-pill fh-pill--tested">2× ZLAC8015D on shared CAN</span>
    <span class="fh-pill fh-pill--tested">4WD drive</span>
    <span class="fh-pill fh-pill--tested">USB gamepad</span>
    <span class="fh-pill fh-pill--tested">250 ms watchdog</span>
    <span class="fh-pill fh-pill--tested">E-stop</span>
    <span class="fh-pill fh-pill--tested">stepper</span>
  </div>
  <div class="fh-status-row">
    <span class="fh-status-label">Designed, not yet tested</span>
    <span class="fh-pill fh-pill--untested">48 V 20 Ah battery</span>
    <span class="fh-pill fh-pill--untested">safety contactor</span>
    <span class="fh-pill fh-pill--untested">BMS</span>
    <span class="fh-pill fh-pill--untested">IMU</span>
    <span class="fh-pill fh-pill--untested">GNSS</span>
    <span class="fh-pill fh-pill--untested">ROS 2 link</span>
    <span class="fh-pill fh-pill--untested">carrier PCB</span>
  </div>
</div>

<div class="fh-hero-slot">
  <div class="fh-hero-slot__meta">
    <span class="fh-hero-slot__title">Hero Looping Drive Video Slot (<code>stm32-drive-hero.mp4</code>)</span>
    <span class="fh-hero-slot__desc">Gamepad drive, arc and spot turns, 110 mm stepper stroke, and CiA 402 E-stop braking (`controller.c`).</span>
  </div>
  <MissingAsset name="stm32-drive-hero.mp4" alt="Short looping 4WD firmware drive video placeholder" />
</div>

<span id="section-1-method"></span>

## 1. Objectives & Requirements {#objectives-requirements}

The firmware has one job: take a drive command $(v_x, \omega_z)$, turn it into safe wheel speeds, and stop the robot when anything goes wrong. Each requirement in Table 1.1 is verified in [Section 5](#testing-results).

| ID | Requirement | Target | Firmware Module |
| :--- | :--- | :--- | :--- |
| **FW-R1** | One entry point for gamepad and ROS 2 | Both call `Robot_Set_CmdVel(vx, wz)` | `controller.c` |
| **FW-R2** | Kinematics with no wheel saturation or inner-wheel reversal | $W = 0.575\text{ m}$, $r = 0.1315\text{ m}$, $R_{\min} \ge 0.50\text{ m}$; no wheel above $\text{RPM}_{\max}$ | `Drive_UGV_With_Mode()` |
| **FW-R3** | Rate-limited acceleration | $50\text{ Hz}$ loop; $40\text{ RPM/s}$ (Preset 3), $35 / 20\text{ RPM/s}$ accel/decel (Preset 1) | `Motor_Ramp_Update()` |
| **FW-R4** | CAN keeps running through bus faults | No TX mailbox lockup; `0x6041` polled every $150\text{ ms}$ on both nodes | `Can_debugging_check.c`, `zlac8015d.c` |
| **FW-R5** | Stepper timing finer than 1 ms | $11.9\text{ ns}$ DWT tick; $200\text{–}5,000\ \mu\text{s}$ pulses; $20\ \mu\text{s}$ `DIR` setup | `Steppermotor_w_user_input.c` |
| **FW-R6** | Stop on link loss or E-stop | $\le 250\text{ ms}$ gamepad timeout ($500\text{ ms}$ for ROS 2); re-arm only at neutral | 6-state supervisor (`controller.c`) |
| **FW-R7** | Jetson and sensor link | $50\text{ Hz}$ odometry out; BMS / IMU / GNSS in | Semester 2 |

Every gamepad button calls the same function ROS 2 will call in Semester 2:

| Controller Input | Firmware Function | ROS 2 Equivalent |
| :--- | :--- | :--- |
| **RT / LT / Left Stick Y** | Forward speed $v_x$ (`Robot_Set_CmdVel`) | `cmd_vel` `linear.x` |
| **Right Stick X** | Turn rate $\omega_z$ (`Robot_Set_CmdVel`) | `cmd_vel` `angular.z` |
| **B / BACK** | `Robot_Emergency_Stop()` (CiA 402 `0x0002`) | E-stop topic or service |
| **A / START** | `Robot_Clear_Faults_And_Enable()` (`0x0080` reset) | Re-arm service (neutral-gated) |
| **X** | `Robot_Actuator_Toggle()` ($110\text{ mm}$ stroke) | Lower / retract tool service |
| **D-pad** | Live tuning (`g_motor_max_rpm` $\pm 1$, `g_turn_angular_velocity` $\pm 0.1$) | ROS parameters |

<span id="section-2-architecture"></span>

## 2. System Architecture {#system-architecture}

Figure 2.1 shows how a command becomes wheel speed. Figure 2.2 shows when commands are allowed through at all. Click any block to jump to its section.

There are two separate state machines. The **robot supervisor** (6 states, Figure 2.2) decides whether the robot may move. The **motor FSM** (5 states, [Figure 4.1](#implementation-prototype)) runs the CiA 402 enable sequence on each driver.

<Figure
  src="./assets/diagrams/stm32-firmware-firmware-architecture-block-diagram.svg"
  alt="Firmware Data Flow Diagram from Gamepad / ROS cmd_vel to 4 Motors"
  caption="**Figure 2.1: Motion Data Flow.** Gamepad and ROS 2 inputs meet at `Robot_Set_CmdVel(vx, wz)`, then pass through 3-mode kinematics, anti-saturation scaling and the 50 Hz ramp before going out on CAN1 (500 kbps) to both ZLAC8015D drivers."
/>

<Figure
  src="./assets/diagrams/stm32-firmware-safety-state-machine.svg"
  alt="6-State Firmware Safety State Machine Diagram"
  caption="**Figure 2.2: Robot Supervisor State Machine.** Motors only receive velocity in `ROBOT_STATE_READY`. A timeout (≥ 250 ms), USB unplug, E-stop (`B`/`BACK`) or driver/CAN fault stops the motors. Re-arming with `A`/`START` only works with all controls at neutral."
/>

## 3. Design Decisions {#design-selection}

### 3.1 Why a controller-first API? {#why-controller-first}

<DecisionCard
  title="Why build the firmware around the gamepad before connecting ROS 2?"
  need="Test the motors, stepper, kinematics and stop paths on the chassis before the Jetson and ROS 2 stack were ready."
  choice="Each gamepad input calls the same C function ROS 2 will call: Robot_Set_CmdVel(vx, wz), Robot_Emergency_Stop(), Robot_Actuator_Toggle()."
  tradeoff="Needs a USB Host HID parser on the STM32 (PA11/PA12), but every manual test drive runs the exact code path autonomy will use."
>

- **One kinematics path:** stick input and `geometry_msgs/Twist` both reduce to $(v_x\text{ [m/s]},\ \omega_z\text{ [rad/s]})$, so there's only one path to debug.
- **Conflicting inputs never reach the motors:** pulling `RT` and `LT` together sets $v_x = 0$ before kinematics.

</DecisionCard>

### 3.2 Why three steering modes and anti-saturation scaling? {#steering-modes}

<DecisionCard
  title="Why use 3 steering modes and proportional wheel scaling instead of raw differential mixing?"
  need="Raw mixing has two problems. A tight turn at speed can make the inner wheel reverse, causing skid and a yaw jerk. And if only the outer wheel gets clipped at the RPM limit, the turn widens."
  choice="Three modes: STRAIGHT, ARC_TURN (R ≥ R_min) and SPOT_TURN (v_x = 0). Stick expo of 0.45 gives fine control near centre. Both wheels scale together when one saturates."
  tradeoff="Arc turn rate is capped at |ω_z| ≤ |v_x| / R_min, so a tight turn at speed needs a stop and a spot turn."
>

With track width $W = 0.575\text{ m}$ and wheel radius $r = 0.1315\text{ m}$:

$$v_{\text{left}} = v_x - \frac{\omega_z W}{2}, \qquad v_{\text{right}} = v_x + \frac{\omega_z W}{2}, \qquad \text{RPM} = \frac{60\,v}{2\pi r}$$

**Why $R_{\min} = 0.50\text{ m}$:** the inner wheel stays at or above zero as long as $R = v_x / \omega_z \ge W/2 = 0.2875\text{ m}$. Setting $R_{\min} = 0.50\text{ m}$ clears that with margin, so arc turns can never reverse the inner wheel.

**Why scale both wheels:** if either wheel exceeds $\text{RPM}_{\max}$, both are multiplied by the same factor. This keeps the left/right ratio, and therefore $R$, unchanged:

$$\text{scale} = \frac{\text{RPM}_{\max}}{\max(\lvert\text{RPM}_{\text{L}}\rvert, \lvert\text{RPM}_{\text{R}}\rvert)}, \qquad \text{RPM}_{\text{L,R}} \leftarrow \text{scale} \cdot \text{RPM}_{\text{L,R}}$$

</DecisionCard>

```c
float half_track_wz = (wz * ROBOT_TRACK_WIDTH_M) / 2.0f;
float rpm_left  = ((vx - half_track_wz) * 60.0f) / (2.0f * 3.14159265f * ROBOT_WHEEL_RADIUS_M);
float rpm_right = ((vx + half_track_wz) * 60.0f) / (2.0f * 3.14159265f * ROBOT_WHEEL_RADIUS_M);
float max_rpm   = fmaxf(fabsf(rpm_left), fabsf(rpm_right));
if (max_rpm > g_motor_max_rpm) {
  float scale = g_motor_max_rpm / max_rpm;
  rpm_left *= scale; rpm_right *= scale;
}
```

### 3.3 Why a 50 Hz software ramp on top of the driver ramps? {#ramping-loop}

<DecisionCard
  title="Why ramp velocity on the STM32 when the ZLAC8015D already has internal ramps?"
  need="Step changes in RPM tripped the 32 V / 10.4 A bench supply. The two drivers also ramp independently, so left and right could accelerate unevenly during combined throttle and steering."
  choice="A 50 Hz STM32 ramp (Preset 3: 40 RPM/s; Preset 1: 35 RPM/s accel, 20 RPM/s decel) on top of 100 ms CiA 402 profile ramps (0x6083/0x6084) on both drivers."
  tradeoff="Velocity changes in 20 ms steps, but peak current stays under the supply limit. Quick-Stop (0x0002) bypasses the ramp, so braking is never delayed."
>

One `#define` switches between power presets:

| Preset | Supply | Max RPM | Top speed | Ramp | Turn rate | $R_{\min}$ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `USE_POWER_PRESET_3` (Sem 1) | 32 V / 10.4 A bench | 25 | 0.34 m/s | 40 RPM/s | 0.45 rad/s | 0.50 m |
| `USE_POWER_PRESET_1` (Sem 2) | 48 V 20 Ah LiFePO4 | 30 | 0.41 m/s | 35 / 20 RPM/s | 1.40 rad/s | 1.50 m |

</DecisionCard>

<span id="five-stages"></span>
<span id="phase-1"></span>
<span id="phase-2"></span>
<span id="phase-3"></span>
<span id="phase-4"></span>
<span id="phase-5"></span>

## 4. Implementation & Prototype {#implementation-prototype}

Each stage was tested on its own before the next was added, so every new failure could be traced to one layer. Select a stage below to see the risk it retired, the test, the result, console output and code.

<StageStepper />

<div class="fig-row">
  <Figure
    src="./assets/images/fsm-diagram.png"
    alt="State Machine Diagram for Motor showing DISENGAGE, LOCK, MOVEMENT, JERK, and ERR states and transitions"
    caption="**Figure 4.1: Stage 4 Motor FSM (`state_machine_check.c`).** Motors must pass through `LOCK` (0 RPM) before `MOVEMENT`. Faults latch in `ERR` until cleared."
  />
  <Figure
    src="./assets/images/gui-screenshot.png"
    alt="ZLAC8015D Motor Controller Python GUI showing state banner, RPM speedometer, velocity slider, machine state buttons, and live CAN serial monitor"
    caption="**Figure 4.2: Stage 4 Test GUI (`GUI.py`).** Sends target RPM and state commands over `USART2` (115,200 baud) and logs raw CAN frames."
  />
</div>

## 5. Testing & Results {#testing-results}

### 5.1 Requirements Verification

| Requirement | Test | Result | Status |
| :--- | :--- | :--- | :--- |
| **FW-R1: Unified API** | Swept all gamepad inputs (`RT`/`LT`, sticks, buttons) | All 6 actions map 1:1 to ROS 2 entry points; both triggers together give 0 RPM | <span class="fh-pill fh-pill--tested">Bench-tested</span> |
| **FW-R2: Kinematics & scaling** | Straight, arc ($R_{\min} = 0.50\text{ m}$) and spot turns up to $25\text{ RPM}$ | No wheel exceeded $\text{RPM}_{\max}$; scaling kept curvature; inner wheel never reversed in arc mode | <span class="fh-pill fh-pill--tested">Bench-tested</span> |
| **FW-R3: Velocity ramp** | Throttle step $0 \rightarrow 25\text{ RPM}$ on $32\text{ V} / 10.4\text{ A}$ supply | Ramped at $40\text{ RPM/s}$ without tripping the supply | <span class="fh-pill fh-pill--tested">Bench-tested</span> |
| **FW-R4: CAN robustness** | Loopback, `B1` baud sweep, dual-node `0x6041` poll | Loopback 100% pass; locked at 500 kbps; no mailbox stalls with retransmission off | <span class="fh-pill fh-pill--tested">Bench-tested</span> |
| **FW-R5: Stepper timing** | `USART2` CLI (`W`/`S`, `+`/`-`) from $5,000$ down to $200\ \mu\text{s}$ | Full $110\text{ mm}$ stroke with no missed steps | <span class="fh-pill fh-pill--tested">Bench-tested</span> |
| **FW-R6: Watchdog & E-stop** | Controller off, USB unplug, `B`/`BACK`, `A` with throttle held | Stops ≤ 250 ms after last packet, < 1 ms on unplug; re-arm blocked until controls at neutral | <span class="fh-pill fh-pill--tested">Bench-tested</span> |

<span id="section-8-safety"></span>

### 5.2 Fault & Safety Matrix

| Failure | What happens | Layer | Stage |
| :--- | :--- | :--- | :--- |
| **Controller packets stop** | After 250 ms, enters `WATCHDOG_STOP` and runs `Motor_Stop_Controlled()` (500 ms planned for ROS 2) | <Badge type="info" text="Firmware" /> | [Stage 5](#phase-5) |
| **USB receiver unplugged** | `HOST_USER_DISCONNECTION` enters `DISCONNECTED` and zeroes velocity in < 1 ms | <Badge type="info" text="Firmware" /> | [Stage 5](#phase-5) |
| **Operator E-stop** | `B` / `BACK` latches `ESTOP_LATCHED`, sends Quick-Stop (`0x0002`) to both drivers and stops the stepper | <Badge type="info" text="Firmware" /> | [Stage 3](#phase-3), [5](#phase-5) |
| **Re-arm with throttle held** | `A` / `START` is ignored unless triggers and sticks are at neutral | <Badge type="info" text="Firmware" /> | [Stage 5](#phase-5) |
| **Driver overcurrent / stall** | `0x6041` polled every 150 ms; Bit 3 (`0x0008`) trips `STATE_ERR` and zeroes RPM; cleared with `0x0080` | <Badge type="info" text="Firmware + CAN" /> | [Stage 4](#phase-4) |
| **Inner-wheel reversal** | Arc clamp $\lvert \omega_z \rvert \le \lvert v_x \rvert / R_{\min}$ with $R_{\min} > W/2$, plus proportional scaling | <Badge type="info" text="Firmware" /> | [Stage 5](#phase-5) |
| **No ACK / bus-off** | Retransmission off + mailbox abort prevents lockup; `CAN_ESR` `BOFF` restarts `CAN1` | <Badge type="info" text="Firmware + HW" /> | [Stage 1](#phase-1), [5](#phase-5) |
| **STM32 firmware hangs** | RF kill switch is wired straight to the ZLAC8015D E-stop inputs (X0/X1), so it works without the MCU. `PB1` also reads it so firmware latches the E-stop. STM32 IWDG added in Sem 2. | <Badge type="warning" text="Hardware" /> | [Hardware](./stm32-hardware.md#interface-wiring) |

<span id="section-9-problems"></span>

## 6. Engineering Discussion {#engineering-discussion}

Testing each stage on its own caught four hardware–firmware bugs before full chassis trials:

<BugCard
  title="Bug 1 · Stepper ignoring 3.3 V pulses (Stage 2)"
  symptom="The stepper didn't move when PC2 (PULSE) and PC3 (DIR) were driven with 3.3 V push-pull outputs."
  rootCause="The TB6600 inputs are optocouplers. 3.3 V minus the LED drop (~1.6 V) leaves ~1.7 V across the 220 Ω resistor, giving ~7.7 mA, which isn't enough to switch the opto reliably."
  fix="Switched to common-anode wiring: PUL+ and DIR+ tied to 5 V, and PC2/PC3 set to open-drain (GPIO_MODE_OUTPUT_OD) to sink PUL−/DIR− active-LOW. This works because these pins are 5 V tolerant in open-drain. Added a 20 µs DIR setup delay."
  evidence="(5 − 1.6) / 220 ≈ 15.4 mA LED current with no level shifter. Full 110 mm stroke with no missed steps down to 200 µs pulses."
>

```c
GPIO_InitStruct.Pin  = STEPPER_PUL_PIN | STEPPER_DIR_PIN;
GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_OD; /* 5V open-drain sink */
HAL_GPIO_Init(GPIOC, &GPIO_InitStruct);
```

</BugCard>

<BugCard
  title="Bug 2 · Left and right wheels fighting (Stage 5)"
  symptom="Sending the same positive RPM to all 4 channels made the robot spin on the spot instead of driving straight."
  rootCause="The left hub motors (Channel 1 on both nodes) are mounted mirrored, so positive rotation on Channel 1 drives that side backward."
  fix="Negate Channel 1 in one place, inside Motor_Set_Velocity_All(-left_rpm, right_rpm), so nothing above it needs to know about the mounting."
  evidence="All kinematics and ramp code works in forward-positive coordinates. Straight, arc and spot turns verified on the 4WD chassis."
>

```c
/* Left motors are mirrored on both axles: CH1 negative = forward */
void Motor_Set_Velocity_All(int32_t left_rpm, int32_t right_rpm) {
  ZLAC8015D_SetVelocity_Node(ZLAC_NODE_ID_1, -left_rpm, right_rpm);
  HAL_Delay(2);
  ZLAC8015D_SetVelocity_Node(ZLAC_NODE_ID_2, -left_rpm, right_rpm);
}
```

</BugCard>

<BugCard
  title="Bug 3 · CAN TX mailboxes locking up with no ACK (Stage 1)"
  symptom="With the drivers off or at the wrong baud rate, all 3 bxCAN TX mailboxes filled up and no further CAN frames could be sent."
  rootCause="HAL defaults to AutoRetransmission = ENABLE, so unacknowledged frames (LEC = 3, ACK error) retry forever in hardware and hold MAILBOX0..2."
  fix="Set AutoRetransmission = DISABLE, abort pending mailboxes before diagnostic pings, and restart CAN1 automatically on CAN_ESR BOFF. A dropped velocity frame isn't retried, but a new one goes out 20 ms later anyway."
  evidence="The 50 Hz loop keeps running with the CAN bus unplugged. The console reports LEC = 3 (ACK) or LEC = 1 (stuff error), and the link recovers within 1 cycle once driver power returns."
>

```c
hcan1.Init.AutoRetransmission = DISABLE;
if (HAL_CAN_IsTxMessagePending(&hcan1, CAN_TX_MAILBOX0))
  HAL_CAN_AbortTxRequest(&hcan1, CAN_TX_MAILBOX0);
```

</BugCard>

<BugCard
  title="Bug 4 · HAL_Delay() capping stepper speed at 500 steps/s (Stage 2)"
  symptom="Using HAL_Delay(1) per pulse half capped the step rate at 500 steps/s (2 ms period), and the motor vibrated visibly."
  rootCause="HAL_Delay() counts 1 ms SysTick ticks. Microstepping needs pulse widths well below 1 ms."
  fix="Stepper_DelayUs() uses the Cortex-M4 DWT cycle counter (DWT->CYCCNT, 11.9 ns per cycle at 84 MHz), with a calibrated NOP loop as fallback if DWT isn't running."
  evidence="Pulse width tuned from 5,000 µs down to 200 µs in 100 µs steps over the UART CLI with no missed steps."
>

```c
uint32_t start = DWT->CYCCNT;
uint32_t wait  = us * (SystemCoreClock / 1000000);
while ((DWT->CYCCNT - start) < wait);
```

</BugCard>

<span id="section-10-roadmap"></span>

## 7. Limitations & Semester 2 {#limitations-semester-2}

1. **Speed is capped well below the operating target.** Semester 1 ran Preset 3 (25 RPM, 0.34 m/s) to stay within the bench supply. Preset 1 on the 48 V 20 Ah LiFePO4 pack raises this to 30 RPM (0.41 m/s). The 15 km/h operating target needs ~303 RPM, so the cap will only go up after the battery, BMS and contactor have been tested.
2. **Open-loop wheel commands → closed-loop slip compensation.** Semester 1 sends RPM setpoints to the drivers' internal FOC loops. Semester 2 reads encoder velocity back over `CAN1` to correct for wheel slip on damp tarmac.
3. **IMU fusion (`I2C1`, `PB6`/`PB7`).** Fuse the IMU (`0x68`, 100 Hz) with wheel odometry using a complementary filter or EKF for heading and tilt.
4. **Jetson ROS 2 link and BMS telemetry (`USART1`, `PA9`/`PA10`).** Stream `cmd_vel` into `Robot_Set_CmdVel(vx, wz)` under the 500 ms watchdog, and read cell voltages, current and SoC from the BMS at 115,200 baud.
5. **STM32 hardware watchdog (IWDG).** Reset the MCU if the main loop hangs, so a firmware freeze no longer depends only on the RF kill switch.

**Related documentation:** [STM32 Hardware Subsystem →](./stm32-hardware.md) · [Steering Kinematics →](../hilbert/steering-kinematics.md) · [Autonomous Navigation →](../hilbert/navigation.md) · [UAV–UGV Communications →](../hilbert/communications.md)

<!-- #endregion report -->

National University of Singapore · CDE4301 Capstone Project

← [Previous Architecture: STM32 Hardware Subsystem](./stm32-hardware.md)