---
title: "STM32 Firmware Architecture & Control"
description: "Controller-first firmware design, 5-stage bottom-up validation, CiA 402 state machine, 3-mode differential-drive kinematics, 50 Hz velocity ramping, and Semester 2 roadmap."
owner: "Gabriel Tan"
outline: [2, 3]
---

# STM32 Firmware Architecture & Control

<p class="fh-lead-summary">
  Bare-metal STM32F446RE firmware validated across 5 progressive stages unifies wireless USB Host teleoperation and ROS 2 <code>cmd_vel</code> into one 50 Hz (20 ms) kinematic and CiA 402 safety pipeline.
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
    <span class="fh-pill fh-pill--untested">48 V battery</span>
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
    <span class="fh-hero-slot__desc">50 Hz differential-drive teleoperation, arc/spot turns, 110 mm stepper actuation, and CiA 402 E-stop braking (`controller.c`).</span>
  </div>
  <MissingAsset name="stm32-drive-hero.mp4" alt="Short looping 4WD firmware drive video placeholder" />
</div>

<!-- #region report -->

<span id="section-1-method"></span>

## 1. Objectives & Requirements {#objectives-requirements}

The STM32F446RE firmware converts manual gamepad inputs and autonomous ROS 2 `cmd_vel` commands into synchronized 4-wheel CANopen velocity targets and microsecond stepper pulses while enforcing hardware and communication watchdogs. Every requirement in Table 1.1 maps to a verification row in [Section 5](#testing-results).

| ID | Requirement | Target Metric | Firmware Module |
| :--- | :--- | :--- | :--- |
| **FW-R1** | Unified manual & ROS 2 entry point | 1 shared `Robot_Set_CmdVel(vx, wz)` API | `controller.c` input layer |
| **FW-R2** | Differential-drive kinematics & anti-saturation | $W = 0.575\text{ m}$, $r = 0.1315\text{ m}$, $R_{\min} \ge 0.50\text{ m}$, $0\%$ clipping | `Drive_UGV_With_Mode()` |
| **FW-R3** | Fixed-rate velocity ramping | $50\text{ Hz}$ ($20\text{ ms}$) loop; $40\text{ RPM/s}$ (Preset 3) / $35\text{ & }20\text{ RPM/s}$ (Preset 1) | `Motor_Ramp_Update()` |
| **FW-R4** | CAN bus fault tolerance & dual-node sync | $0$ mailbox deadlocks; $150\text{ ms}$ `0x6041` Statusword poll | `Can_debugging_check.c` + `zlac8015d.c` |
| **FW-R5** | Sub-microsecond stepper pulse timing | $11.9\text{ ns}$ resolution ($200\text{–}5,000\ \mu\text{s}$ pulses), $20\ \mu\text{s}$ `DIR` guard | `Steppermotor_w_user_input.c` (`DWT->CYCCNT`) |
| **FW-R6** | Communication loss & E-stop supervision | $\le 250\text{ ms}$ gamepad watchdog ($500\text{ ms}$ ROS 2) + neutral re-arm | 6-state supervisor FSM (`controller.c`) |
| **FW-R7** | High-level Jetson & sensor telemetry | $50\text{ Hz}$ odometry + BMS/IMU/GNSS parsing | Semester 2 expansion drivers |

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

The firmware architecture separates the **motion data flow** (**Figure 2.1**) from the **6-state safety state machine** (**Figure 2.2**). Click any block in either diagram to jump to its section.

<Figure
  src="./assets/diagrams/stm32-firmware-firmware-architecture-block-diagram.svg"
  alt="Firmware Data Flow Diagram from Gamepad / ROS cmd_vel to 4 Motors"
  caption="**Figure 2.1: Firmware Motion Data Flow.** Gamepad USB Host inputs and ROS 2 `cmd_vel` commands converge at `Robot_Set_CmdVel(vx, wz)`, passing through 3-mode kinematics, proportional anti-saturation scaling, the 50 Hz (20 ms) velocity ramp, and 500 kbps CAN1 dispatch to both ZLAC8015D drivers and 4 hub motors."
/>

<Figure
  src="./assets/diagrams/stm32-firmware-safety-state-machine.svg"
  alt="6-State Firmware Safety State Machine Diagram"
  caption="**Figure 2.2: Six-State Robot Safety State Machine.** Velocity commands are dispatched only in `ROBOT_STATE_READY`. Any communication timeout (≥ 250 ms), USB unplug, operator E-stop (`B`/`BACK`), or CAN/driver fault (`0x6041` Bit 3 / `CAN_ESR` `BOFF`) halts the motors and requires a neutral-gated `A`/`START` reset to re-arm."
/>

## 3. Design Methodology & Selection {#design-selection}

### 3.1 Why a controller-first API? {#why-controller-first}

<DecisionCard
  title="Why build the firmware around a controller-first function API before connecting ROS 2?"
  need="Test all 4 hub motors, 110 mm stepper actuation, kinematics, and safety cutoffs on the physical chassis before the NVIDIA Jetson ROS 2 stack is mounted."
  choice="Every wireless gamepad input calls a hardware-agnostic C entry point (Robot_Set_CmdVel(vx, wz), Robot_Emergency_Stop(), Robot_Actuator_Toggle()) that ROS 2 invokes identically."
  tradeoff="Requires an onboard USB OTG FS Host HID parser (PA11/PA12) on the STM32, but guarantees that every manual test drive exercises the exact code path used by autonomous navigation."
>

- **Zero Duplicate Control Code:** Both gamepad sticks/triggers and ROS 2 `geometry_msgs/Twist` messages reduce to $(v_x\text{ [m/s]},\ \omega_z\text{ [rad/s]})$ at `Robot_Set_CmdVel(vx, wz)`.
- **Dual-Trigger Conflict Check:** Pulling both throttle triggers (`RT` and `LT`) simultaneously cancels $v_x$ to $0\text{ m/s}$ before reaching the kinematic solver.

</DecisionCard>

### 3.2 Why three steering modes and anti-saturation scaling? {#steering-modes}

<DecisionCard
  title="Why enforce 3 discrete steering modes and proportional wheel scaling instead of raw differential mixing?"
  need="Prevent inner-wheel reversal during forward arcs (which tears turf and induces skid-steer yaw jerk) and preserve commanded turn curvature when an outer wheel hits the RPM ceiling."
  choice="Three-mode steering (STRAIGHT, ARC_TURN with R_min ≥ 0.50 m, SPOT_TURN at v_x = 0) with expo = 0.45 stick shaping and proportional dual-wheel anti-saturation scaling."
  tradeoff="Caps peak angular rate during high-speed forward arcs (|ω_z| ≤ |v_x| / R_min), but prevents inner-wheel direction reversals and eliminates trajectory widening at top speed."
>

Using the vehicle track width **$W = 0.575\text{ m}$** ($488.75\text{ mm}$ wheelbase) and wheel radius **$r = 0.1315\text{ m}$** ($263\text{ mm}$ diameter), left and right wheel linear velocities and RPMs are:

$$v_{\text{left}} = v_x - \frac{\omega_z \cdot W}{2}, \qquad v_{\text{right}} = v_x + \frac{\omega_z \cdot W}{2}, \qquad \text{RPM} = \frac{v \cdot 60}{2\pi \cdot 0.1315\text{ m}}$$

If either wheel exceeds $\text{RPM}_{\max}$ (`g_motor_max_rpm`), both wheels scale by the same factor so the turn radius $R = v_x / \omega_z$ stays constant:

$$\text{if } \max(\lvert\text{RPM}_{\text{left}}\rvert, \lvert\text{RPM}_{\text{right}}\rvert) > \text{RPM}_{\max}: \quad \text{scale} = \frac{\text{RPM}_{\max}}{\max(\lvert\text{RPM}_{\text{left}}\rvert, \lvert\text{RPM}_{\text{right}}\rvert)}, \quad \text{RPM}_{\text{L,R}} \leftarrow \text{scale} \cdot \text{RPM}_{\text{L,R}}$$

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

### 3.3 Why a 50 Hz software ramp alongside driver ramps? {#ramping-loop}

<DecisionCard
  title="Why run a 50 Hz (20 ms) software velocity ramp on the STM32 in addition to the ZLAC8015D internal ramps?"
  need="Limit bus current spikes on the 32 V / 10.4 A bench supply (Preset 3) and coordinate left/right wheel acceleration rates during combined throttle-and-steering transitions."
  choice="50 Hz (20 ms) software ramp on the STM32 (40 RPM/s under Preset 3; 35 RPM/s accel / 20 RPM/s decel under Preset 1) feeding 100 ms CiA 402 profile ramps (0x6083/0x6084) on both drivers."
  tradeoff="Adds a 20 ms discretization grid to velocity updates, but bounds peak inrush current below the 10.4 A bench supply trip point while keeping emergency Quick-Stop (0x0002) bypasses instantaneous."
>

- **Single-Line Power Preset Switch:** `USE_POWER_PRESET_3` ($32\text{ V}$, $10.4\text{ A}$ bench supply: $25\text{ RPM}$ max, $40\text{ RPM/s}$ ramp, $0.45\text{ rad/s}$ turn rate, $R_{\min} = 0.50\text{ m}$) vs. `USE_POWER_PRESET_1` ($48\text{ V}$ battery: $30\text{ RPM}$ max, $35 / 20\text{ RPM/s}$ ramps, $1.40\text{ rad/s}$ turn rate, $R_{\min} = 1.50\text{ m}$).
- **Mirrored Axle Polarity Wrapper:** Because left-side hub motors are mounted mirrored on both axles, `Motor_Set_Velocity_All(-left_rpm, right_rpm)` negates Channel 1 in one place.

</DecisionCard>

```c
/* Left motors are mirrored on both axles: CH1 negative = forward */
void Motor_Set_Velocity_All(int32_t left_rpm, int32_t right_rpm) {
  ZLAC8015D_SetVelocity_Node(ZLAC_NODE_ID_1, -left_rpm, right_rpm);
  HAL_Delay(2);
  ZLAC8015D_SetVelocity_Node(ZLAC_NODE_ID_2, -left_rpm, right_rpm);
}
```

<span id="five-stages"></span>
<span id="phase-1"></span>
<span id="phase-2"></span>
<span id="phase-3"></span>
<span id="phase-4"></span>
<span id="phase-5"></span>

## 4. Implementation & Prototype {#implementation-prototype}

Firmware integration progressed bottom-up across five standalone stages. Select any tab in the stepper below to inspect the **Risk retired**, **Test**, **Result**, **Console log**, **Video slot**, and **Collapsed C implementation** for that stage.

<StageStepper />

<div class="fig-row">
  <Figure
    src="./assets/images/fsm-diagram.png"
    alt="State Machine Diagram for Motor showing DISENGAGE, LOCK, MOVEMENT, JERK, and ERR states and transitions"
    caption="**Figure 4.1: Stage 4 Five-State CiA 402 Motor FSM (`state_machine_check.c`).** Blocks direct `DISENGAGE` → `MOVEMENT` jumps; enforces `LOCK` (`0 RPM`) before motion and latches hardware faults (`ERR`) until cleared."
  />
  <Figure
    src="./assets/images/gui-screenshot.png"
    alt="ZLAC8015D Motor Controller Python GUI showing state banner, RPM speedometer, velocity slider, machine state buttons, and live CAN serial monitor"
    caption="**Figure 4.2: Stage 4 Python Verification Dashboard (`GUI.py`).** Streams target RPMs over `USART2` (`115,200 baud`), triggers state transitions (`ENGAGE LOCK`, `QUICK STOP`, `CLEAR ALARM`), and logs raw CAN frames."
  />
</div>

## 5. Testing & Results {#testing-results}

### 5.1 Requirements Verification Matrix

Each row verifies the corresponding firmware requirement defined in [Section 1](#objectives-requirements):

| Requirement | Test | Result | Status |
| :--- | :--- | :--- | :--- |
| **FW-R1: Unified API** (`Robot_Set_CmdVel`) | Gamepad HID input sweep (`RT`/`LT`, sticks, buttons) in `controller.c` | All 6 controller actions map 1:1 to ROS 2 entry points; dual-trigger conflict zeroes RPM | <span class="fh-pill fh-pill--tested">Bench-tested</span> |
| **FW-R2: 3-Mode Kinematics & Scaling** | Straight, arc ($R_{\min} = 0.50\text{ m}$), and spot turns up to $25\text{ RPM}$ | $0\%$ wheel clipping; proportional scaling preserves curvature; inner wheels never reverse in arc mode | <span class="fh-pill fh-pill--tested">Bench-tested</span> |
| **FW-R3: 50 Hz Velocity Ramp** | Step throttle $0 \rightarrow 25\text{ RPM}$ on $32\text{ V} / 10.4\text{ A}$ supply | Ramps at $40\text{ RPM/s}$ ($20\text{ ms}$ ticks) without tripping the $10.4\text{ A}$ supply protection; $48\text{ V}$ preset ready | <span class="fh-pill fh-pill--tested">Bench-tested</span> |
| **FW-R4: CAN Diagnostics & Sync** | DC loopback + `B1` baud sweep + dual-node `0x6041` poll (`150 ms`) | $100\%$ loopback pass; `500 kbps` locked; `0` TX mailbox stalls with `AutoRetransmission = DISABLE` | <span class="fh-pill fh-pill--tested">Bench-tested</span> |
| **FW-R5: DWT Stepper Timing** | `USART2` CLI (`W`/`S`, `+`/`-`) across $200\text{–}5,000\ \mu\text{s}$ delays | $11.9\text{ ns}$ `DWT->CYCCNT` resolution + $20\ \mu\text{s}$ `DIR` setup guard moves $110\text{ mm}$ stroke without missed steps | <span class="fh-pill fh-pill--tested">Bench-tested</span> |
| **FW-R6: Safety Watchdog & E-Stop** | Controller power-off, USB unplug, `B`/`BACK` E-stop, throttle-held `A` re-arm | Stops in $\le 250\text{ ms}$ on packet timeout, $< 1\text{ ms}$ on USB unplug; blocks re-arm until `controls_neutral == 1` | <span class="fh-pill fh-pill--tested">Bench-tested</span> |
| **FW-R7: Jetson ROS 2 & Sensor Link** | `Robot_Set_CmdVel()` & $500\text{ ms}$ watchdog code inspection | Entry point compiled in `controller.c`; live Jetson serial stream and BMS/IMU/GNSS drivers scheduled for Sem 2 | <span class="fh-pill fh-pill--partial">Partial</span> |

<span id="section-8-safety"></span>

### 5.2 Multi-Layer Fault & Safety Matrix

| Hazard / Failure Mode | Mitigation Mechanism | Layer | Stage |
| :--- | :--- | :--- | :--- |
| **Controller packets stop arriving** | **250 ms watchdog** (`CONTROLLER_TIMEOUT_MS`) enters `WATCHDOG_STOP` and runs `Motor_Stop_Controlled()` ($500\text{ ms}$ in ROS 2 mode) | <Badge type="info" text="Firmware" /> | [Stage 5](#phase-5) |
| **USB receiver unplugged** | `HOST_USER_DISCONNECTION` interrupt enters `DISCONNECTED` and zeroes velocity in $< 1\text{ ms}$ | <Badge type="info" text="Firmware" /> | [Stage 5](#phase-5) |
| **Operator emergency stop** | Gamepad `B` / `BACK` latches `ESTOP_LATCHED`, sends CiA 402 Quick-Stop (`0x0002`) to both nodes, and halts stepper | <Badge type="info" text="Firmware" /> | [Stage 3](#phase-3), [5](#phase-5) |
| **Re-arm while throttle active** | `Robot_Clear_Faults_And_Enable()` (`A` / `START`) is blocked unless triggers and sticks are at neutral (`controls_neutral`) | <Badge type="info" text="Firmware" /> | [Stage 5](#phase-5) |
| **Driver overcurrent / stall / fault** | `150 ms` background poll of Statusword (`0x6041`); Bit 3 (`0x0008`) trips `STATE_ERR` and zeroes RPM; cleared via Bit 7 rising edge (`0x0080`) | <Badge type="info" text="Firmware + CAN" /> | [Stage 4](#phase-4) |
| **Inner-wheel reversal** | Arc turn clamp $\lvert \omega_z \rvert \le \lvert v_x \rvert / R_{\min}$ ($R_{\min} = 0.50\text{ m}$ Preset 3 / $1.50\text{ m}$ Preset 1) + proportional anti-saturation scaling | <Badge type="info" text="Firmware" /> | [Stage 5](#phase-5) |
| **Unacknowledged CAN / Bus-Off** | `AutoRetransmission = DISABLE` + mailbox abort prevents FIFO deadlock; `CAN_ESR` `BOFF` auto-restarts `CAN1` | <Badge type="info" text="Firmware + HW" /> | [Stage 1](#phase-1), [5](#phase-5) |
| **Software freeze or total link loss** | Hardware RF safety interlock (`PB1`) and main battery cutoff switch | <Badge type="warning" text="Hardware" /> | [Hardware](./stm32-hardware.md#interface-wiring) |

<span id="section-9-problems"></span>

## 6. Engineering Discussion {#engineering-discussion}

Bottom-up testing across Stages 1 to 5 isolated and fixed four hardware–firmware bugs prior to full chassis trials:

<BugCard
  title="Bug 1 · Stepper ignoring 3.3 V pulses (Stage 2)"
  symptom="The vacuum-actuator stepper motor remained stationary when driven with 3.3 V push-pull pulses on PC2 (PULSE) and PC3 (DIR)."
  rootCause="Sourcing 3.3 V in common-cathode mode across the TB6600 internal IR optocoupler LED (~1.6 V forward drop) and 220 Ω resistor left only ~1.7 V (~7.7 mA), insufficient to saturate the optoisolator phototransistor."
  fix="Switched to common-anode 5 V low-side sinking: tied PUL+ and DIR+ to +5 V and configured PC2 and PC3 as 5 V-tolerant open-drain outputs (GPIO_MODE_OUTPUT_OD) with active-LOW pulse switching and a 20 µs DIR setup delay."
  evidence="Delivered a full 5.0 V swing (~15.4 mA LED current) without external level shifters; verified zero missed steps across the 110 mm stroke down to 200 µs pulse widths."
>

```c
GPIO_InitStruct.Pin  = STEPPER_PUL_PIN | STEPPER_DIR_PIN;
GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_OD; /* 5V open-drain sink */
HAL_GPIO_Init(GPIOC, &GPIO_InitStruct);
```

</BugCard>

<BugCard
  title="Bug 2 · Left and right wheels fighting due to mirrored motor mounting (Stage 5)"
  symptom="Commanding positive RPM on all 4 channels caused the left and right wheel banks to spin in opposite directions, rotating the chassis in place instead of driving straight."
  rootCause="Left-side hub motors (Channel 1 on Node 1 and Node 2) are physically mounted 180° mirrored relative to right-side motors (Channel 2), so positive shaft rotation on Channel 1 drives the vehicle backward."
  fix="Encapsulated the polarity inversion inside a single low-level driver wrapper, Motor_Set_Velocity_All(-left_rpm, right_rpm), negating Channel 1 on both ZLAC8015D nodes while keeping Channel 2 positive."
  evidence="All upper kinematic functions (Robot_Set_CmdVel, Drive_UGV_With_Mode, and velocity ramps) operate in standard forward-positive coordinates; verified straight, arc, and spot turns on the 4WD chassis."
>

```c
void Motor_Set_Velocity_All(int32_t left_rpm, int32_t right_rpm) {
  ZLAC8015D_SetVelocity_Node(ZLAC_NODE_ID_1, -left_rpm, right_rpm);
  HAL_Delay(2);
  ZLAC8015D_SetVelocity_Node(ZLAC_NODE_ID_2, -left_rpm, right_rpm);
}
```

</BugCard>

<BugCard
  title="Bug 3 · CAN TX mailboxes locking without ACK (Stage 1)"
  symptom="When the ZLAC8015D drivers were unpowered or at a mismatched baud rate, all 3 STM32 bxCAN transmit mailboxes filled up and permanently blocked subsequent CAN transmissions."
  rootCause="With STM32 HAL's default AutoRetransmission = ENABLE, unacknowledged frames (LEC = 3 ACK Error) retry infinitely in hardware, wedging MAILBOX0..2 and starving the main loop."
  fix="Disabled automatic retransmission (hcan1.Init.AutoRetransmission = DISABLE), added explicit TX mailbox aborts before diagnostic pings, and implemented automatic CAN_ESR BOFF recovery."
  evidence="Main loop continues running at 50 Hz even with the CAN bus unplugged; console prints LEC = 3 (ACK Error) or LEC = 1 (Stuff Error) and reconnects within 1 cycle when driver power returns."
>

```c
hcan1.Init.AutoRetransmission = DISABLE;
if (HAL_CAN_IsTxMessagePending(&hcan1, CAN_TX_MAILBOX0))
  HAL_CAN_AbortTxRequest(&hcan1, CAN_TX_MAILBOX0);
```

</BugCard>

<BugCard
  title="Bug 4 · HAL_Delay() capping stepper pulse rate at 500 Hz (Stage 2)"
  symptom="Using HAL_Delay(1) for stepper pulse generation capped the step frequency at ≤ 500 steps/s (2 ms period) with visible vibration from 1 ms SysTick quantization."
  rootCause="HAL_Delay() resolves only to 1 ms ticks (1,000 µs minimum delay), whereas microstepped TB6600 operation requires smooth 18–800 µs pulse widths."
  fix="Enabled the Cortex-M4 Data Watchpoint and Trace cycle counter (DWT->CYCCNT at 84 MHz = 11.9 ns/cycle) inside Stepper_DelayUs(), with a calibrated 21-NOP/µs fallback loop when a debugger disables DWT."
  evidence="Continuous pulse-width tuning verified from 5,000 µs down to 200 µs in Stage 2 (100 µs steps via UART CLI) and 18 µs half-step period in Stage 5."
>

```c
uint32_t start = DWT->CYCCNT;
uint32_t wait  = us * (SystemCoreClock / 1000000);
while ((DWT->CYCCNT - start) < wait);
```

</BugCard>

<span id="section-10-roadmap"></span>

## 7. Limitations & Semester 2 {#limitations-semester-2}

1. **32 V Bench Power Ceiling $\rightarrow$ 48 V LiFePO4 Deployment (`USE_POWER_PRESET_1`):** Semester 1 chassis tests ran under `USE_POWER_PRESET_3` ($32\text{ V} / 10.4\text{ A}$ bench supply, $25\text{ RPM}$ / $0.34\text{ m/s}$ ceiling). In Semester 2, compiling with `USE_POWER_PRESET_1` activates the $48\text{ V}$ profile ($30\text{ RPM}$ / $0.41\text{ m/s}$, $35 / 20\text{ RPM/s}$ asymmetric ramps, $1.40\text{ rad/s}$ turn rate, $R_{\min} = 1.50\text{ m}$).
2. **Open-Loop Wheel Commands $\rightarrow$ Closed-Loop Skid-Steer Slip Compensation (`CAN1`):** Semester 1 kinematics send open-loop RPM setpoints to the drivers' internal FOC loops. Semester 2 reads back real-time wheel encoder velocities over `CAN1` (`PB8`/`PB9`) to close an outer slip-compensation loop on damp tarmac.
3. **6-DOF / 9-DOF IMU Sensor Fusion (`I2C1` on `PB6`/`PB7`):** Fuse accelerometer and gyroscope readings (`0x68` at $100\text{ Hz}$) with ZLAC8015D wheel odometry via an onboard Complementary or Extended Kalman Filter (EKF) for heading and tilt estimation.
4. **NVIDIA Jetson ROS 2 Link & Smart BMS Telemetry (`USART1` on `PA9`/`PA10`):** Connect the Jetson companion computer to stream `cmd_vel` into `Robot_Set_CmdVel(vx, wz)` under the $500\text{ ms}$ ROS watchdog, and parse 6S–22S LiFePO4 Smart BMS cell voltages, current, and State of Charge (SoC) over `USART1` at $115,200\text{ baud}$.

**Related documentation:** [STM32 Hardware Subsystem →](./stm32-hardware.md) · [Steering Kinematics →](../hilbert/steering-kinematics.md) · [Autonomous Navigation →](../hilbert/navigation.md) · [UAV–UGV Communications →](../hilbert/communications.md)

<!-- #endregion report -->

National University of Singapore · CDE4301 Capstone Project

← [Previous Architecture: STM32 Hardware Subsystem](./stm32-hardware.md)
