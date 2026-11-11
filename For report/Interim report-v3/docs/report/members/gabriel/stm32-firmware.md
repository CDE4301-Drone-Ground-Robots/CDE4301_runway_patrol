---
title: "STM32 Firmware Architecture & Control"
description: "Controller-first firmware design, progressive 5-phase bottom-up validation, CiA 402 state machine, 3-mode differential-drive kinematics, 50 Hz velocity ramping, and Semester 2 roadmap."
owner: "Gabriel Tan"
outline: [2, 3]
---

# STM32 Firmware Architecture & Control

> **Semester 1 engineering documentation · Gabriel Tan**  
> **Evidence boundary:** This page documents the bare-metal STM32F446RE firmware developed and verified bottom-up across five progressive phases (`Can_debugging_check.c`, `Steppermotor_w_user_input.c`, `2_motor_w_user_input.c`, `state_machine_check.c` + `GUI.py`, and `controller.c`). Semester 1 bench and chassis tests operated on the 32 V / 10.4 A power preset (`USE_POWER_PRESET_3`); 48 V battery deployment (`USE_POWER_PRESET_1`), Jetson ROS 2 integration, 6-DOF IMU fusion, Smart BMS telemetry, and closed-loop encoder slip compensation are scheduled for Semester 2.

<!-- #region report -->

## 1. Methodology: Controller-First Design {#section-1-method}

We built the firmware around the wireless gamepad controller first. Instead of wiring buttons directly to raw motor commands, every input on the controller calls a dedicated firmware function. That serves two purposes at once: the gamepad acts as our user interface for standalone hardware testing now, and the exact same functions become the execution interface for ROS 2 in Semester 2.

Both the gamepad and ROS 2 reduce to the same two motion commands: forward speed $v_x$ ($\text{m/s}$) and turn rate $\omega_z$ ($\text{rad/s}$). Both pass through identical differential-drive kinematics, acceleration ramps, safety checks, and CANopen commands. When the NVIDIA Jetson is connected, its `cmd_vel` message (`linear.x` and `angular.z`) feeds straight into `Robot_Set_CmdVel(vx, wz)`, so nothing below that layer changes. Every manual test drive directly validates the code path that autonomous navigation will use.

| Controller Input | Firmware Function | ROS 2 Equivalent |
| :--- | :--- | :--- |
| **RT / LT / Left Stick Y** | Forward speed $v_x$ (`Robot_Set_CmdVel`) | `cmd_vel` `linear.x` |
| **Right Stick X** | Turn rate $\omega_z$ (`Robot_Set_CmdVel`) | `cmd_vel` `angular.z` |
| **B / BACK** | `Robot_Emergency_Stop()` | E-stop topic or service |
| **A / START** | `Robot_Clear_Faults_And_Enable()` | Re-arm service |
| **X** | `Robot_Actuator_Toggle()` ($110\text{ mm}$ stroke) | Lower / retract tool service |
| **D-pad** | Max RPM and turn-rate globals (`g_motor_max_rpm`, `g_turn_angular_velocity`) | ROS parameters |

## 2. Firmware Architecture & Differential-Drive Kinematics {#section-2-architecture}

The production firmware executes a bare-metal, non-blocking control loop on the STM32F446RE, combining USB Host gamepad parsing, CANopen node supervision, a 6-state safety state machine, and a 50 Hz (`20 ms`) kinematic ramping engine.

<Figure
  src="./assets/diagrams/stm32-firmware-firmware-architecture-block-diagram.svg"
  alt="Firmware Architecture Block Diagram"
  caption="**Figure 2.1: STM32F446RE Bare-Metal Firmware Architecture.** Gamepad USB Host inputs and ROS 2 `cmd_vel` commands converge on `Robot_Set_CmdVel(vx, wz)`, passing through 3-mode differential-drive conditioning, proportional anti-saturation scaling, 50 Hz velocity ramping, and dual-node CiA 402 CANopen dispatch."
/>

### 2.1 Three-Mode Differential-Drive Steering & Anti-Saturation {#steering-modes}

Using the robot's physical geometry (**$W = 0.575\text{ m}$ track width**, **$488.75\text{ mm}$ wheelbase**, and **$r = 0.1315\text{ m}$ wheel radius** / $263\text{ mm}$ diameter), left and right wheel linear speeds and target RPMs are computed from $v_x$ and $\omega_z$:

$$v_{\text{left}} = v_x - \frac{\omega_z \cdot W}{2}, \qquad v_{\text{right}} = v_x + \frac{\omega_z \cdot W}{2}, \qquad \text{RPM} = \frac{v \cdot 60}{2\pi \cdot 0.1315\text{ m}}$$

Steering operates across three discrete modes with an exponential stick curve ($\text{expo} = 0.45$) for finer control near the centre:

1. **Straight (`DRIVE_MODE_STRAIGHT`):** When $\omega_z = 0$, left and right wheel channels receive equal speed targets.
2. **Arc Turn (`DRIVE_MODE_ARC_TURN`):** When moving forward or backward while steering, the turn radius is clamped to $R_{\min} \ge 0.5\text{ m}$ ($|\omega_z| \le |v_x| / R_{\min}$ under Preset 3, or $1.5\text{ m}$ under Preset 1) so the inner wheels never reverse direction mid-arc.
3. **Spot Turn (`DRIVE_MODE_SPOT_TURN`):** When stationary ($v_x = 0$), the left and right wheel banks spin in opposite directions for zero-radius heading alignment.

**Anti-Saturation Scaling:** If a commanded turn would push either wheel past `g_motor_max_rpm`, both wheels are scaled down proportionally so the turn preserves its exact curvature rather than clipping:

$$\text{if } \max(|\text{RPM}_{\text{left}}|, |\text{RPM}_{\text{right}}|) > \text{RPM}_{\max}: \quad \text{scale} = \frac{\text{RPM}_{\max}}{\max(|\text{RPM}_{\text{left}}|, |\text{RPM}_{\text{right}}|)}, \quad \text{RPM}_{\text{left, right}} \leftarrow \text{scale} \cdot \text{RPM}_{\text{left, right}}$$

### 2.2 50 Hz Velocity Ramping Loop {#ramping-loop}

Every **20 ms (`50 Hz`)**, wheel targets are ramped smoothly at **40 RPM/s** (Preset 3 bench supply) or **35 RPM/s acceleration / 20 RPM/s deceleration** (Preset 1 48 V battery) and transmitted over CAN to both ZLAC8015D drivers. Because left-side motors are mounted mirrored on both axles, channel polarity inversion is handled in a single low-level wrapper (`Motor_Set_Velocity_All(-left_rpm, right_rpm)`).

## 3. System Integration, Progressive Validation & Experimental Testing {#five-stages}

System integration followed a strict bottom-up validation methodology across five experimental firmware phases. Each hardware and protocol layer was verified in isolation before activating the next layer above it.

---

### 3.1 Phase 1: CAN Bus Physical & Protocol Diagnostics (`Can_debugging_check.c`) {#phase-1}

Progressive validation of the CAN bus uses a bottom-up, 4-level diagnostic staircase. Each layer of the physical and protocol stack is verified before any higher layer is activated:

```text
[Level 4] Hardware Bus Diagnostics (CAN_ESR: TEC, REC, LEC=1 Stuff, LEC=3 ACK, BOFF Recovery)
    ^
[Level 3] Mailbox Protection & Deadlock Prevention (AutoRetransmission = DISABLE + TX Abort)
    ^
[Level 2] Bit-Timing Synthesis & Dynamic Baud Rate Sweeping (B1 Button: 500k / 250k / 1M / 125k)
    ^
[Level 1] Physical DC Loopback Test (Bit-Bang PB9 TX -> Read PB8 RX before CAN Init)
```

<MissingAsset name="phase1-can.mp4" alt="Phase 1 CAN bus diagnostics video demo" />

::: details Level 1: DC Loopback Test (Bit-Bang PB9 TX)

- **Objective:** Verify the external CAN transceiver chip and power connections before the STM32 CAN controller peripheral is even started.
- **Technical Implementation:** `Transceiver_DC_Loopback_Test()` temporarily overrides `PB9` as a standard GPIO Output and `PB8` as a GPIO Input:
  - **Recessive Test:** Drive `PB9` HIGH. Differential bus voltage drops to $0\text{ V}$ and `PB8` must read HIGH.
  - **Dominant Test:** Drive `PB9` LOW. Differential bus voltage rises to $2\text{ V}$ and `PB8` must read LOW.
  - Pins are then restored to alternate function `GPIO_AF9_CAN1`.
- **Key Takeaway:** Isolates physical transceiver or wiring faults immediately without triggering CAN protocol bus errors.

```c
/* Step A: Drive PB9 HIGH (Recessive) */
HAL_GPIO_WritePin(GPIOB, GPIO_PIN_9, GPIO_PIN_SET);
HAL_Delay(5);
uint8_t rxHigh = HAL_GPIO_ReadPin(GPIOB, GPIO_PIN_8);

/* Step B: Drive PB9 LOW (Dominant) */
HAL_GPIO_WritePin(GPIOB, GPIO_PIN_9, GPIO_PIN_RESET);
HAL_Delay(5);
uint8_t rxLow = HAL_GPIO_ReadPin(GPIOB, GPIO_PIN_8);

if (rxHigh == GPIO_PIN_SET && rxLow == GPIO_PIN_RESET) {
  printf("  --> [RESULT] Transceiver Physical Loopback: 100%% PASS!\r\n");
} else {
  printf("  --> [RESULT] Transceiver Physical Loopback: FAILED!\r\n");
}
```

:::

::: details Level 2: Bit-Timing Synthesis & Dynamic Baud Rate Sweeping

- **Objective:** Synthesize exact bit timing across standard industrial baud rates and provide an on-the-fly sweeping mechanism to detect unknown or misconfigured motor driver speeds without reflashing firmware.
- **Technical Implementation:** A lookup table stores prescalers for `500 kbps`, `250 kbps`, `1 Mbps`, and `125 kbps`. Pressing the blue Nucleo user button (`B1`, `PC13`) dynamically advances the prescaler index, re-initializes `CAN1`, and immediately transmits an NMT Reset and SDO Read ping (`0x1000`).
- **Key Takeaway:** Interactive push-button cycling enables live discovery of the motor driver's configured baud rate at the workbench without recompiling code.

```c
/* Baud Rate Configuration Lookup Table */
typedef struct {
  uint32_t baudrate;
  uint32_t prescaler;
  const char* label;
} CAN_BaudConfig;

static const CAN_BaudConfig baudConfigs[] = {
  {500000,  6,  "500 kbps (Default)"},
  {250000,  12, "250 kbps"},
  {1000000, 3,  "1000 kbps (1 Mbps)"},
  {125000,  24, "125 kbps"}
};

/* Dynamic Runtime Switching via User Button B1 */
static void CAN_Switch_Baudrate(void) {
  currentBaudIdx = (currentBaudIdx + 1) % NUM_BAUD_CONFIGS;
  printf("\r\n[BUTTON] >>> Switching CAN Baud Rate to: %s <<<\r\n", baudConfigs[currentBaudIdx].label);

  HAL_CAN_Stop(&hcan1);
  MX_CAN1_Init_Baud(baudConfigs[currentBaudIdx].prescaler);

  /* Send NMT Reset and Ping at the new baud rate */
  CAN_Send_NMT_Reset(1);
  HAL_Delay(10);
  CAN_Send_SDO_Read(1, 0x1000, 0x00);
}
```

:::

::: details Level 3: Mailbox Protection & Deadlock Prevention

- **Objective:** Prevent the microcontroller's three hardware transmit mailboxes from permanently locking up when no receiver acknowledges frames on the bus.
- **Technical Implementation:** In default bxCAN configurations, missing ACKs trigger continuous hardware retransmissions at line rate, saturating the bus and locking the transmit FIFO. The firmware disables automatic retransmission (`AutoRetransmission = DISABLE`) and explicitly aborts stalled mailboxes (`CAN_TX_MAILBOX0..2`) before queuing each periodic ping.
- **Key Takeaway:** Frames are transmitted once and retired cleanly if unacknowledged, ensuring the MCU never suffers from mailbox starvation and remains responsive to user input.

```c
/* In MX_CAN1_Init_Baud: */
hcan1.Init.AutoRetransmission = DISABLE; /* Prevent stuck mailboxes if ACK missing */

/* In Main Loop: Flush pending mailboxes before queuing new ping */
if (HAL_CAN_IsTxMessagePending(&hcan1, CAN_TX_MAILBOX0)) HAL_CAN_AbortTxRequest(&hcan1, CAN_TX_MAILBOX0);
if (HAL_CAN_IsTxMessagePending(&hcan1, CAN_TX_MAILBOX1)) HAL_CAN_AbortTxRequest(&hcan1, CAN_TX_MAILBOX1);
if (HAL_CAN_IsTxMessagePending(&hcan1, CAN_TX_MAILBOX2)) HAL_CAN_AbortTxRequest(&hcan1, CAN_TX_MAILBOX2);
```

:::

::: details Level 4: Hardware Bus Diagnostics (CAN_ESR Decoding)

- **Objective:** Read internal bxCAN error registers to provide clear diagnostic messages for physical and protocol faults.
- **Technical Implementation:** `CAN_Print_Bus_Status()` inspects the Error Status Register (`CAN_ESR`), extracting the Transmit Error Counter (`TEC`), Receive Error Counter (`REC`), and Last Error Code (`LEC`):
  - **`LEC = 1` (Stuff Error):** More than 5 consecutive identical bits detected, indicating a baud rate mismatch.
  - **`LEC = 3` (ACK Error):** Frame transmitted cleanly, but no node asserted dominant during the ACK slot, indicating disconnected wires, swapped `CAN_H`/`CAN_L`, or an unpowered driver.
  - **`BOFF` (Bus-Off State):** `TEC` exceeded 255; firmware automatically stops, clears, and restarts the CAN controller.
- **Key Takeaway:** Replaces trial-and-error guesswork with deterministic hardware fault codes that isolate the root cause immediately.

```c
uint32_t esr = hcan1.Instance->ESR;
uint8_t tec = (uint8_t)((esr & CAN_ESR_TEC) >> CAN_ESR_TEC_Pos);
uint8_t rec = (uint8_t)((esr & CAN_ESR_REC) >> CAN_ESR_REC_Pos);
uint8_t lec = (uint8_t)((esr & CAN_ESR_LEC) >> CAN_ESR_LEC_Pos);

if (lec == 1) printf("  -> [DIAGNOSTIC] Stuff Error (LEC=1, TEC=%d). Baud rate mismatch?\r\n", tec);
if (lec == 3) printf("  -> [DIAGNOSTIC] No Acknowledgment (ACK Error, LEC=3, TEC=%d).\r\n", tec);

if (esr & CAN_ESR_BOFF) {
  printf("  -> [BUS ERROR] Bus-Off! Restarting CAN controller...\r\n");
  HAL_CAN_Stop(&hcan1);
  hcan1.Instance->ESR = 0;
  HAL_CAN_Start(&hcan1);
}
```

:::

---

### 3.2 Phase 2: Stepper Motor Electrical & Timing Validation (`Steppermotor_w_user_input.c`) {#phase-2}

Progressive validation for the vacuum-head stepper motor subsystem uses a 4-level diagnostic staircase, validating electrical topology, microsecond pulse generation, direction setup timing, and interactive velocity tuning before full stroke actuation:

```text
[Level 4] Interactive Motion Diagnostics & Dynamic Speed Tuning (UART CLI: W/S Jog, +/- Delay)
    ^
[Level 3] Direction Setup Dynamics & Signal Timing (20 us Guard Time >= 5 us TB6600 Spec)
    ^
[Level 2] High-Resolution Microsecond Timing Architecture (84 MHz DWT->CYCCNT + NOP Fallback)
    ^
[Level 1] Electrical Topology & Common-Anode 5 V Low-Side Sinking (PC2 PUL-, PC3 DIR- Open-Drain)
```

<MissingAsset name="phase2-stepper.mp4" alt="Phase 2 stepper actuator timing video demo" />

::: details Level 1: Common-Anode 5 V Low-Side Sinking

- **Objective:** Eliminate optocoupler drive failure caused by the STM32F446RE's $3.3\text{ V}$ GPIO logic levels, ensuring sufficient forward current to switch the TB6600 driver's internal optoisolators:
  - The STM32F446RE operates strictly at $3.3\text{ V}$; its GPIO pins cannot source $5\text{ V}$.
  - If wired in Common-Cathode mode, the forward voltage drop of the internal IR LED leaves only $\approx 1.7\text{ V}$ across the driver's series resistor, resulting in inadequate turn-on current.
- **Technical Implementation:** Positive terminals (`PUL+` and `DIR+`) are tied to the F446RE's `+5V` rail while negative terminals (`PUL-` and `DIR-`) are connected to `PC2` and `PC3` configured as 5 V-tolerant open-drain outputs (`GPIO_MODE_OUTPUT_OD`):
  - **Active Phase:** Pin pulls LOW (`GPIO_PIN_RESET`); the full $5\text{ V}$ potential drops across the optocoupler into the STM32 ground sink and the LED conducts.
  - **Idle Phase:** Pin is set HIGH (`GPIO_PIN_SET`, high-impedance open-drain), eliminating differential voltage and turning the LED off.
- **Key Takeaway:** Shifting from high-side sourcing to low-side sinking lets the $+5\text{ V}$ rail supply the drive current while the F446RE acts as a ground switch, guaranteeing clean optocoupler switching without external level-shifter ICs.

```c
/* GPIO Configuration: PC2 (PUL-) and PC3 (DIR-) as 5V-tolerant Open-Drain Sinks */
GPIO_InitStruct.Pin = STEPPER_PUL_PIN | STEPPER_DIR_PIN;
GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_OD;
GPIO_InitStruct.Pull = GPIO_NOPULL;
GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
HAL_GPIO_Init(GPIOC, &GPIO_InitStruct);

/* Initial Idle State: Optocoupler LEDs OFF */
HAL_GPIO_WritePin(STEPPER_PUL_PORT, STEPPER_PUL_PIN, GPIO_PIN_SET);
HAL_GPIO_WritePin(STEPPER_DIR_PORT, STEPPER_DIR_PIN, GPIO_PIN_SET);
```

:::

::: details Level 2: High-Resolution Microsecond Timing Architecture

- **Objective:** Deliver sub-millisecond, low-jitter step pulses without blocking hardware timers or relying on `HAL_Delay()`. `HAL_Delay()` relies on the $1\text{ ms}$ SysTick interrupt, whereas stepper pulses require $200\text{–}800\ \mu\text{s}$ intervals; `HAL_Delay()` cannot reach operational speeds without severe stepping jitter.
- **Technical Implementation:** `Stepper_Init()` enables the Cortex-M4 Data Watchpoint and Trace Cycle Counter (`DWT->CYCCNT`). At $84\text{ MHz}$, each clock cycle is $\approx 11.9\text{ ns}$. `Stepper_DelayUs()` measures elapsed CPU cycles against `SystemCoreClock / 1,000,000`. If DWT is disabled by a debug probe, it falls back automatically to a calibrated assembly loop ($\approx 21$ `NOP` iterations per microsecond at $84\text{ MHz}$).
- **Key Takeaway:** Hardware cycle counting guarantees accurate pulse widths across hundreds of microseconds ($200\ \mu\text{s}$ to $2,000\ \mu\text{s}$), providing continuous linear control over stepper RPM and preventing pulse collapse under microstepping.

```c
/* Enable Cortex-M4 DWT Cycle Counter for microsecond timing */
CoreDebug->DEMCR |= CoreDebug_DEMCR_TRCENA_Msk;
DWT->CTRL |= DWT_CTRL_CYCCNTENA_Msk;
DWT->CYCCNT = 0;

/* High-precision microsecond delay loop */
void Stepper_DelayUs(uint32_t us) {
  if (dwt_active) {
    uint32_t startCycles = DWT->CYCCNT;
    uint32_t waitCycles = us * (SystemCoreClock / 1000000);
    while ((DWT->CYCCNT - startCycles) < waitCycles);
  } else {
    /* Fallback: calibrated CPU cycle loop at 84 MHz */
    volatile uint32_t count = us * 21;
    while (count--) { __NOP(); }
  }
}
```

:::

::: details Level 3: Direction Setup & Signal Timing

- **Objective:** Prevent step slippage, directional glitches, and optocoupler turn-on delay mismatch when reversing the motor shaft.
- **Technical Implementation:** The TB6600 driver specifies a minimum setup guard time of $5\ \mu\text{s}$ where `DIR` must stabilize before an active edge occurs on `PUL`. `Stepper_SetDirection()` updates the sinking state on `PC3` and enforces a mandatory $20\ \mu\text{s}$ guard delay before returning control to `Stepper_SingleStep()`.
- **Key Takeaway:** Enforcing optocoupler propagation and setup hold times prevents internal phase confusion and lost microsteps during rapid direction reversals.

```c
/* Direction Switch with Setup Guard Time */
void Stepper_SetDirection(uint8_t dir) {
  if (dir == STEPPER_DIR_CW) {
    HAL_GPIO_WritePin(STEPPER_DIR_PORT, STEPPER_DIR_PIN, GPIO_PIN_RESET); /* Sinks current -> Opto ON */
  } else {
    HAL_GPIO_WritePin(STEPPER_DIR_PORT, STEPPER_DIR_PIN, GPIO_PIN_SET);   /* No current -> Opto OFF */
  }
  Stepper_DelayUs(20); /* TB6600 direction setup time */
}

/* Active-LOW Step Pulse Generation */
void Stepper_SingleStep(uint32_t pulse_width_us) {
  HAL_GPIO_WritePin(STEPPER_PUL_PORT, STEPPER_PUL_PIN, GPIO_PIN_RESET); /* Active: 5V flows */
  Stepper_DelayUs(pulse_width_us);
  HAL_GPIO_WritePin(STEPPER_PUL_PORT, STEPPER_PUL_PIN, GPIO_PIN_SET);   /* Idle: LED turns OFF */
  Stepper_DelayUs(pulse_width_us);
}
```

:::

::: details Level 4: Interactive Motion & Dynamic Speed Tuning

- **Objective:** Enable real-time benchtop validation of torque, mechanical step accuracy, and resonance speeds without recompiling firmware.
- **Technical Implementation:** A non-blocking UART CLI over `USART2` (ST-Link Virtual COM Port at `115200` baud) maps single-character keypresses into discrete motion commands:
  - `[W]` / `[S]`: Incremental jog forward (`+400` steps) or backward (`-400` steps) with onboard LED `LD2` visual feedback.
  - `[+]` / `[-]`: On-the-fly step delay adjustment ($200\ \mu\text{s}$ to $5,000\ \mu\text{s}$ in $100\ \mu\text{s}$ increments) to identify resonance bands and maximum velocity limits.
- **Key Takeaway:** Provides immediate visual and serial feedback during mechanical actuator bring-up.

```c
/* Non-blocking UART Command Parser in main() */
if (__HAL_UART_GET_FLAG(&huart2, UART_FLAG_RXNE)) {
  char inputChar = (char)(huart2.Instance->DR & 0xFF);

  if (inputChar == 'w' || inputChar == 'W') {
    HAL_GPIO_WritePin(LD2_GPIO_Port, LD2_Pin, GPIO_PIN_SET);
    Stepper_MoveSteps(STEPPER_STEPS_PER_PRESS, currentStepDelayUs);
    HAL_GPIO_WritePin(LD2_GPIO_Port, LD2_Pin, GPIO_PIN_RESET);
  }
  else if (inputChar == 's' || inputChar == 'S') {
    HAL_GPIO_WritePin(LD2_GPIO_Port, LD2_Pin, GPIO_PIN_SET);
    Stepper_MoveSteps(-STEPPER_STEPS_PER_PRESS, currentStepDelayUs);
    HAL_GPIO_WritePin(LD2_GPIO_Port, LD2_Pin, GPIO_PIN_RESET);
  }
  else if (inputChar == '+' || inputChar == '=') {
    if (currentStepDelayUs > 200) currentStepDelayUs -= 100;
    printf(">>> [SPEED] Faster! Delay = %lu us\r\n", currentStepDelayUs);
  }
  else if (inputChar == '-' || inputChar == '_') {
    if (currentStepDelayUs < 5000) currentStepDelayUs += 100;
    printf(">>> [SPEED] Slower! Delay = %lu us\r\n", currentStepDelayUs);
  }
}
```

:::

---

### 3.3 Phase 3: Dual-Driver 4WD CANopen Locomotion (`2_motor_w_user_input.c`) {#phase-3}

Phase 3 brings both ZLAC8015D motor drivers online simultaneously across the shared 500 kbps CAN bus to coordinate all four hub motors across three progressive levels:

```text
[Level 3] Synchronized 4-Wheel Locomotion & Dual-Tier Safety Braking ([Q] 100 ms Ramp vs [E] 0x0002 Quick-Stop)
    ^
[Level 2] CiA 402 Velocity Mode & Acceleration Ramp (0x6060 = 0x03, 100 ms Ramps, 0x06 -> 0x07 -> 0x0F)
    ^
[Level 1] Multi-Node CAN Bus Addressing (Shared 500 kbps Bus: Node 1 0x601/0x581, Node 2 0x602/0x582)
```

<MissingAsset name="phase3-four-wheels.mp4" alt="Phase 3 four-wheel CANopen drive video demo" />

::: details Level 1: Multi-Node CAN Bus Addressing

- **Objective:** Control two separate ZLAC8015D dual-channel motor drivers over the same 2-wire CAN bus (`PB8` RX, `PB9` TX at `500 kbps`) without packet collisions. Under CANopen / CiA 402 Service Data Objects (SDO), the COB-ID is offset by the target driver's Node ID:
  - **Driver 1 (Node ID 1):** Listens on CAN ID `0x601` and replies on `0x581`.
  - **Driver 2 (Node ID 2):** Listens on CAN ID `0x602` and replies on `0x582`.
- **Technical Implementation:** Every CAN driver function accepts `nodeId` as a parameter, allowing the F446RE to address Driver 1 (front axle) and Driver 2 (rear axle) individually over the shared bus without additional pins.
- **Key Takeaway:** Both drivers share a single physical differential bus; CANopen message ID filtering ensures each driver acts only on commands addressed to its node.

```c
/* Startup initialization for both driver nodes on the shared CAN bus */
printf("[INIT] Initializing ZLAC8015D Driver 1 (Node ID 1)...\r\n");
ZLAC8015D_Init_Velocity_Mode_Async_Node(ZLAC_NODE_ID_1, MOTOR_ACCEL_TIME_MS, MOTOR_DECEL_TIME_MS);

printf("[INIT] Initializing ZLAC8015D Driver 2 (Node ID 2)...\r\n");
ZLAC8015D_Init_Velocity_Mode_Async_Node(ZLAC_NODE_ID_2, MOTOR_ACCEL_TIME_MS, MOTOR_DECEL_TIME_MS);
```

:::

::: details Level 2: CiA 402 Velocity Mode & Acceleration Ramp

- **Objective:** Transition the motors from standby into active speed control smoothly, preventing inrush current spikes and mechanical hub shock that occur if a motor steps abruptly from $0$ to $50\text{ RPM}$.
- **Technical Implementation:** Inside `zlac8015d.c`, `ZLAC8015D_Init_Velocity_Mode_Async_Node()` configures three parameters on each driver node:
  - **NMT Operational & Profile Velocity Mode:** Wakes the node (`NMT = 0x01`) and sets Mode of Operation (`Object 0x6060 = 0x03`).
  - **Acceleration & Deceleration Ramps:** Configures `Object 0x6083` and `0x6084` to `100 ms` (`MOTOR_ACCEL_TIME_MS` and `MOTOR_DECEL_TIME_MS`) on both Left and Right channels.
  - **CiA 402 Power-Up Handshake:** Unlocks the inverter bridge through the mandatory 3-step sequence on Controlword (`0x6040`): **Shutdown (`0x0006`) → Switch On (`0x0007`) → Enable Operation (`0x000F`)**, then initializes target velocity (`0x60FF`) at `0 RPM`.
- **Key Takeaway:** Neither driver starts up abruptly; both nodes are systematically armed with controlled acceleration profiles before any velocity command is accepted.

```c
/* In main.c: Configuration Constants */
#define MOTOR_DEFAULT_SPEED_RPM     50      /* Operating Speed: 50 RPM */
#define MOTOR_ACCEL_TIME_MS         100     /* Acceleration ramp: 100 ms */
#define MOTOR_DECEL_TIME_MS         100     /* Deceleration ramp: 100 ms */
#define ZLAC_NODE_ID_1              1       /* Driver 1 CAN Node ID */
#define ZLAC_NODE_ID_2              2       /* Driver 2 CAN Node ID */

/* In zlac8015d.c: Low-level driver setup function */
HAL_StatusTypeDef ZLAC8015D_Init_Velocity_Mode_Async_Node(uint8_t nodeId, uint32_t accel_ms, uint32_t decel_ms)
{
  /* Step 0: Wake up the CANopen node and enter Operational Mode */
  ZLAC8015D_SendNMT_Node(nodeId, 0x01);
  HAL_Delay(50);

  /* Step 1: Set Profile Velocity Mode (Object 0x6060 = 0x03) */
  ZLAC8015D_Write8_Node(nodeId, ZLAC_OBJ_MODES_OF_OPERATION, ZLAC_SUB_ALL, 0x03);
  HAL_Delay(30);

  /* Step 2: Configure Acceleration Ramp (100 ms) for Left & Right wheels */
  ZLAC8015D_Write32_Node(nodeId, ZLAC_OBJ_PROFILE_ACCEL, ZLAC_SUB_CH1_LEFT, accel_ms);
  HAL_Delay(30);
  ZLAC8015D_Write32_Node(nodeId, ZLAC_OBJ_PROFILE_ACCEL, ZLAC_SUB_CH2_RIGHT, accel_ms);
  HAL_Delay(30);

  /* Step 3: Configure Deceleration Ramp (100 ms) for Left & Right wheels */
  ZLAC8015D_Write32_Node(nodeId, ZLAC_OBJ_PROFILE_DECEL, ZLAC_SUB_CH1_LEFT, decel_ms);
  HAL_Delay(30);
  ZLAC8015D_Write32_Node(nodeId, ZLAC_OBJ_PROFILE_DECEL, ZLAC_SUB_CH2_RIGHT, decel_ms);
  HAL_Delay(30);

  /* Step 4: CiA 402 Power Enable Handshake (Shutdown -> Switch On -> Enable) */
  ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_CONTROLWORD, ZLAC_SUB_ALL, 0x0006); /* Shutdown */
  HAL_Delay(30);
  ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_CONTROLWORD, ZLAC_SUB_ALL, 0x0007); /* Switch On */
  HAL_Delay(30);
  ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_CONTROLWORD, ZLAC_SUB_ALL, 0x000F); /* Enable Operation */
  HAL_Delay(50);

  /* Step 5: Initialize Target Speeds safely at 0 RPM */
  ZLAC8015D_Write32_Node(nodeId, ZLAC_OBJ_TARGET_VELOCITY, ZLAC_SUB_CH1_LEFT, 0);
  HAL_Delay(30);
  ZLAC8015D_Write32_Node(nodeId, ZLAC_OBJ_TARGET_VELOCITY, ZLAC_SUB_CH2_RIGHT, 0);
  HAL_Delay(30);

  return HAL_OK;
}
```

:::

::: details Level 3: Synchronized 4-Wheel Locomotion & Dual-Tier Safety Braking

- **Objective:** Synchronize all four motors for forward and backward travel while providing two distinct braking tiers (Normal Stop vs. Emergency Quick-Stop).
- **Technical Implementation:** Both Left and Right channels on both drivers receive velocity commands simultaneously:
  - **4-Wheel Drive:** Driver 1 (Node 1) powers the front-left and front-right motors while Driver 2 (Node 2) powers the rear-left and rear-right motors.
  - **Dual-Tier Braking:**
    - **`[Q]` Key (Normal Stop):** Calls `ZLAC8015D_Stop_Node()`, ramping the motors smoothly down to `0 RPM` along their programmed `100 ms` deceleration curve.
    - **`[E]` Key (Emergency Stop):** Calls `ZLAC8015D_EmergencyStop_Node()`, sending the CiA 402 Quick-Stop command (`Controlword = 0x0002`) to cut driving power immediately and apply hard electromagnetic braking.
- **Key Takeaway:** Delivers synchronized 4WD traction with both smooth normal deceleration and immediate hardware quick-stop protection.

```c
/* Forward Motion: Commands all 4 wheels to +50 RPM */
static void Motor_Move_Forward(int32_t speedRpm) {
  ZLAC8015D_SetVelocity_Node(ZLAC_NODE_ID_1, speedRpm, speedRpm); // Driver 1: Left + Right
  ZLAC8015D_SetVelocity_Node(ZLAC_NODE_ID_2, speedRpm, speedRpm); // Driver 2: Left + Right
  HAL_GPIO_WritePin(LD2_GPIO_Port, LD2_Pin, GPIO_PIN_SET);        // LED indicator ON
}

/* Backward Motion: Commands all 4 wheels to -50 RPM */
static void Motor_Move_Backward(int32_t speedRpm) {
  ZLAC8015D_SetVelocity_Node(ZLAC_NODE_ID_1, -speedRpm, -speedRpm);
  ZLAC8015D_SetVelocity_Node(ZLAC_NODE_ID_2, -speedRpm, -speedRpm);
  HAL_GPIO_WritePin(LD2_GPIO_Port, LD2_Pin, GPIO_PIN_SET);
}

/* Emergency Stop: Forces both drivers into instant CiA 402 Quick-Stop */
static void Motor_Emergency_Stop(void) {
  printf(">>> [ALERT] EMERGENCY STOP TRIGGERED ON ALL MOTORS!\r\n");
  ZLAC8015D_EmergencyStop_Node(ZLAC_NODE_ID_1);
  ZLAC8015D_EmergencyStop_Node(ZLAC_NODE_ID_2);
  HAL_GPIO_WritePin(LD2_GPIO_Port, LD2_Pin, GPIO_PIN_RESET);
}
```

:::

---

### 3.4 Phase 4: Closed-Loop CiA 402 State Machine & GUI (`state_machine_check.c` & `GUI.py`) {#phase-4}

Phase 4 implements a closed-loop Finite State Machine (FSM) adhering to the CiA 402 motion control standard. Instead of assuming the motor's state, the F446RE continuously polls the driver's internal registers, enforces valid state transitions, and latches hardware faults across three levels:

```text
[Level 3] Real-Time Statusword Polling & Autonomous Fault Recovery (150 ms 0x6041 Poll + Bit 7 Rising-Edge Reset)
    ^
[Level 2] Deterministic State Machine Transitions and Python GUI (DISENGAGE -> LOCK -> MOVEMENT / JERK)
    ^
[Level 1] CiA 402 State Definitions (DISENGAGE, LOCK, MOVEMENT, JERK, ERR)
```

<Figure
  src="./assets/images/fsm-diagram.png"
  alt="State Machine Diagram for Motor showing DISENGAGE, LOCK, MOVEMENT, JERK, and ERR states and transitions"
  caption="**Figure 3.1: Phase 4 Five-State Motor Supervisory FSM.** Enforces valid state transitions (`DISENGAGE` → `LOCK` → `MOVEMENT`), Quick-Stop braking (`JERK`), and hardware alarm latching (`ERR`) with `CLEAR ALARM` recovery."
/>

<MissingAsset name="phase4-fsm-gui.mp4" alt="Phase 4 state machine and GUI video demo" />

::: details Level 1: CiA 402 State Definitions

- **Objective:** Define strict, discrete operating states for the motor driver and isolate channels for safe bench testing.
- **Technical Implementation:** The firmware maps the motor driver into 5 discrete operational states:
  - `STATE_DISENGAGE`: Motor coils completely de-energized (shaft freewheeling, zero power consumption).
  - `STATE_LOCK`: Motor coils actively powered, holding the shaft firmly at `0 RPM` with electromagnetic holding torque.
  - `STATE_MOVEMENT`: Motor actively rotating at a controlled speed (between `-350 RPM` and `+350 RPM` in `50 RPM` steps).
  - `STATE_JERK`: Emergency Quick-Stop engaged (rapid magnetic deceleration holding state).
  - `STATE_ERR`: Hardware alarm or fault tripped (overcurrent, stall, or overvoltage).
- **Key Takeaway:** The driver cannot transition directly from unpowered freewheel into high-speed rotation; state definitions enforce a controlled, predictable sequence.

```c
/* In state_machine_check.c: CiA 402 FSM State Definitions */
typedef enum {
  STATE_DISENGAGE = 0,    /* Motor coils de-energized, shaft freewheeling */
  STATE_LOCK,             /* Driver enabled, actively holding 0 RPM       */
  STATE_MOVEMENT,         /* Driver enabled, motor spinning at target RPM */
  STATE_JERK,             /* Quick stop active (Emergency deceleration)   */
  STATE_ERR               /* Fault / Hardware Alarm active                */
} FSM_State_t;

#define SPEED_STEP_RPM      50      /* Increment per keypress (+/- 50 RPM) */
#define MAX_SPEED_RPM       350     /* Maximum safe operating limit        */
```

:::

::: details Level 2: Deterministic State Machine Transitions & Python GUI

- **Objective:** Prevent invalid or unsafe driver commands by verifying transitions in software before transmitting CAN frames.
- **Technical Implementation:** Jumping directly from `DISENGAGE` to `MOVEMENT` is blocked. The motor must first be energized into `LOCK` (`0 RPM`), ensuring the FOC control loop is stable before commanding velocity:
  - **From `DISENGAGE`:** Only `[R]` (Run) is valid to transition to `LOCK`.
  - **From `LOCK`:** Pressing `[W]` (`+50 RPM`) or `[S]` (`-50 RPM`) enters `MOVEMENT`. Pressing `[D]` returns to `DISENGAGE`.
  - **From `MOVEMENT`:** Pressing `[W]` or `[S]` steps speed up or down in `50 RPM` increments. Pressing `[E]` triggers an immediate `JERK` Quick-Stop.
- **Support for Direct GUI Velocity Commands:** In addition to single keypresses, the UART parser buffers multi-character commands so the external Python desktop dashboard (`gui_controller.py` / `GUI.py`) can stream target speeds directly from a slider.
- **Key Takeaway:** Unsafe user input (such as attempting to accelerate while coils are disengaged) is rejected at the state-machine level before touching the CAN bus.

<Figure
  src="./assets/images/gui-screenshot.png"
  alt="ZLAC8015D Motor Controller Python GUI showing state banner, RPM speedometer, velocity slider, machine state buttons, and live CAN serial monitor"
  caption="**Figure 3.2: Phase 4 Desktop Verification GUI (`GUI.py`).** Provides live RPM telemetry, continuous velocity slider streaming, one-click state transitions (`ENGAGE LOCK`, `COAST / STOP`, `DISENGAGE`, `QUICK STOP`, `CLEAR ALARM`), and a raw STM32 CAN bus monitor."
/>

```c
/* In main() event loop: Enforcing valid state transitions */
switch (currentState) {
  case STATE_DISENGAGE:
    if (ch == 'r' || ch == 'R') {
      printf(">>> [ACTION] RUN: Enabling driver & locking shaft at 0 RPM...\r\n");
      Driver_Run();
      currentState = STATE_LOCK;
      validTransition = 1;
    }
    break;

  case STATE_LOCK:
    if (ch == 'w' || ch == 'W') {
      currentSpeedRpm = SPEED_STEP_RPM;
      Driver_Set_Speed_Right_Only(currentSpeedRpm);
      currentState = STATE_MOVEMENT;
      validTransition = 1;
    }
    else if (ch == 'd' || ch == 'D') {
      Driver_Disengage();
      currentState = STATE_DISENGAGE;
      validTransition = 1;
    }
    break;

  case STATE_MOVEMENT:
    if (ch == 'w' || ch == 'W') {
      if (currentSpeedRpm + SPEED_STEP_RPM <= MAX_SPEED_RPM) {
        currentSpeedRpm += SPEED_STEP_RPM;
      }
      Driver_Set_Speed_Right_Only(currentSpeedRpm);
      validTransition = 1;
    }
    else if (ch == 'e' || ch == 'E') {
      printf(">>> [ACTION] QUICK STOP: Fast magnetic deceleration...\r\n");
      Driver_Quick_Stop();
      currentState = STATE_JERK;
      validTransition = 1;
    }
    break;

  case STATE_JERK:
    if (ch == 'r' || ch == 'R') {
      Driver_Run();
      currentState = STATE_LOCK;
      validTransition = 1;
    }
    break;
}
```

:::

::: details Level 3: Real-Time Statusword Polling & Autonomous Fault Recovery

- **Objective:** Continuously verify hardware state through live CAN telemetry and provide an automated reset path for driver alarms.
- **Silent Background Polling (Every 150 ms):** Every `150 ms`, the main loop silently queries CANopen Object `0x6041` (the driver's internal 16-bit Statusword).
- **Statusword Decoding & Autonomous State Changes:** When the driver replies, `Process_CAN_RX()` inspects `0x6041`:
  - **Bit 3 (`0x0008`) Set:** A hardware fault or alarm occurred (stall, overcurrent, or overvoltage). The STM32 automatically shifts into `STATE_ERR` and zeroes motor velocity without waiting for user input.
  - **EMCY Frame (`0x081`):** If an Emergency CAN packet arrives, the error code is unpacked and printed immediately on the serial console.
- **Universal Fault Clear via Bit 7 Rising Edge:** Under the CiA 402 standard, clearing a latched driver fault requires a rising edge on Bit 7 of the Controlword (`0x6040`): setting `0x0080` HIGH for `30 ms`, then returning to `0x0000`.
- **Key Takeaway:** Decoding the hardware Statusword and implementing a CiA 402 Bit 7 rising-edge reset achieves bidirectional closed-loop fault protection, allowing operators to clear alarms from the console (`[C]` key or GUI button) without rebooting the MCU.

```c
/* Silent background health query sent every 150 ms */
if (HAL_GetTick() - lastPollTick >= 150) {
  lastPollTick = HAL_GetTick();
  CAN_Send_Silent(0x600 + NODE_ID, 0x40, 0x41, 0x60, 0x00, 0x00, 0x00, 0x00, 0x00);
}

/* In Process_CAN_RX(): Decoding Statusword 0x6041 */
if (lastHardwareStatusword & 0x0008)  /* Bit 3: Fault Bit */
{
  currentState = STATE_ERR;
  currentSpeedRpm = 0;
  printf(">>> [!] HARDWARE ALARM DETECTED: Entering STATE_ERR!\r\n");
}

/* Driver_Clear_Fault(): Rising edge reset on Bit 7 */
static void Driver_Clear_Fault(void) {
  uint32_t cobId = 0x600 + NODE_ID;

  /* Step 1: Set Bit 7 HIGH (0x0080) to reset the hardware latch */
  CAN_Send(cobId, 0x2B, 0x40, 0x60, 0x00, 0x80, 0x00, 0x00, 0x00);
  HAL_Delay(30);

  /* Step 2: Set Bit 7 LOW (0x0000) to return to safe freewheel state */
  CAN_Send(cobId, 0x2B, 0x40, 0x60, 0x00, 0x00, 0x00, 0x00, 0x00);
}
```

:::

---

### 3.5 Phase 5: Integrated Production Firmware (`controller.c`) {#phase-5}

Phase 5 ties Phases 1 through 4 into a single production program structured into four levels: global configuration and power presets at the top, the USB gamepad and CAN discovery layer, the 6-state safety state machine, and differential-drive kinematics with 50 Hz velocity ramping:

```text
[Level 4] Differential Drive Kinematics & Smooth Ramping (3 Modes, Anti-Saturation, 50 Hz / 20 ms Ramp)
    ^
[Level 3] Safety State Machine & Fail-Safes (6 States, 250 ms Watchdog, E-Stop Latch, Neutral Re-Arm)
    ^
[Level 2] Gamepad Input, Node Discovery & Motor Polarity (USB Host HID, Boot 0x6041 Probe, -left_rpm)
    ^
[Level 1] Global Configuration & Power Presets (Preset 3: 32 V Bench vs Preset 1: 48 V Battery + D-Pad Tuning)
```

<MissingAsset name="phase5-drive.mp4" alt="Phase 5 full teleoperation video demo" />

::: details Level 1: Global Configuration & Power Presets

- **Objective:** Consolidate all tuning parameters in one place so speed ceilings, acceleration ramps, turn rates, and power supply limits can be switched without modifying control logic.
- **Technical Implementation:** Section 1 at the top of `controller.c` defines all physical and timing constants: stepper half-step delay ($18\ \mu\text{s}$) and stroke ($110\text{ mm}$), robot geometry ($575\text{ mm}$ track, $488.75\text{ mm}$ wheelbase, $131.5\text{ mm}$ wheel radius), deadzones, timeouts, and CAN node IDs. The active power profile is selected with a single `#define`:
  - **Preset 3 (Active in Sem 1):** $32\text{ V}$, $10.4\text{ A}$ benchtop supply. Max `25 RPM` ($\approx 0.34\text{ m/s}$), acceleration and deceleration ramps `40 RPM/s`, turn rate `0.45 rad/s`, minimum arc radius `0.50 m`.
  - **Preset 1 (48 V Battery):** $48\text{ V}$ LiFePO4 battery. Max `30 RPM` ($\approx 0.41\text{ m/s}$), acceleration `35 RPM/s`, deceleration `20 RPM/s`, turn rate `1.40 rad/s`, minimum arc radius `1.50 m`.
  - **Live D-Pad Tuning:** Max RPM, turn rate, and ramp rates are stored in `volatile` globals so they can be adjusted while driving: D-pad Up/Down changes `g_motor_max_rpm` by $\pm 1\text{ RPM}$, and D-pad Left/Right changes `g_turn_angular_velocity` by $\pm 0.1\text{ rad/s}$.
- **Key Takeaway:** Switching from the bench supply to the 48 V battery is a one-line compile flag change, and live field tuning requires no reflashing.

```c
/* --- 1.2 Power Supply Preset Selection --- */
#define USE_POWER_PRESET_3   /* ACTIVE: 32V 10.4A Benchtop Supply */
//#define USE_POWER_PRESET_1 /* UNCOMMENT FOR 48V BATTERY */
#elif defined(USE_POWER_PRESET_3)
  #define CONFIG_MOTOR_MAX_RPM             25
  #define CONFIG_MOTOR_ACCEL_RPM_PER_SEC   40.0f
  #define CONFIG_MOTOR_DECEL_RPM_PER_SEC   40.0f
  #define CONFIG_DEFAULT_TURN_OMEGA_RAD_S  0.45f
  #define CONFIG_MIN_TURN_RADIUS           0.50f
#endif
/* --- 1.3 Live globals (changed with the D-pad) --- */
volatile int32_t g_motor_max_rpm         = CONFIG_MOTOR_MAX_RPM;
volatile float   g_turn_angular_velocity = CONFIG_DEFAULT_TURN_OMEGA_RAD_S;
```

:::

::: details Level 2: Gamepad Input, Node Discovery & Motor Polarity

- **Objective:** Read the wireless gamepad directly into the STM32, verify both motor drivers are online at boot, and abstract mirrored motor mounting polarity.
- **Gamepad Input:** The GameSir wireless dongle plugs into the STM32 USB Host port (`PA11` / `PA12`). The parser automatically handles XInput, Switch Pro, and DirectInput report formats. `RT` / `LT` or Left Stick Y controls throttle, Right Stick X controls steering, and pulling both triggers simultaneously cancels throttle to zero.
- **Boot Node Discovery:** At startup, each driver is probed with an SDO read of the Statusword (`0x6041`). If either node fails to reply, the console prints specific troubleshooting checks (48 V power, DIP switches, or CAN wiring).
- **Motor Polarity:** Because the left-side hub motors are mounted mirrored on both axles, Channel 1 (`CH1`) receives a negative RPM for forward motion on both nodes while Channel 2 (`CH2`) receives a positive RPM.
- **Key Takeaway:** Everything above this layer operates purely in left speed and right speed; physical mounting polarity is encapsulated in a single function.

```c
/* Left motors are mirrored on both axles: CH1 negative = forward */
void Motor_Set_Velocity_All(int32_t left_rpm, int32_t right_rpm) {
  ZLAC8015D_SetVelocity_Node(ZLAC_NODE_ID_1, -left_rpm, right_rpm);
  HAL_Delay(2);
  ZLAC8015D_SetVelocity_Node(ZLAC_NODE_ID_2, -left_rpm, right_rpm);
}
```

:::

::: details Level 3: Safety State Machine & Fail-Safes

- **Objective:** Ensure the robot only actuates when all safety preconditions are satisfied and halts autonomously when any fault or communication loss occurs.
- **Technical Implementation:** The robot supervisor tracks 6 states: `INIT`, `DISCONNECTED`, `WATCHDOG_STOP`, `ESTOP_LATCHED`, `CAN_FAULT`, and `READY`. Motor velocity commands are transmitted only in `READY`:
  - **250 ms Comms Watchdog:** If no valid gamepad packet arrives within `250 ms` (`CONTROLLER_TIMEOUT_MS`), the robot enters `ROBOT_STATE_WATCHDOG_STOP` and executes a controlled stop. A USB dongle disconnect event immediately stops the motors (`DISCONNECTED`).
  - **Latched E-Stop & Neutral-Gated Re-Arm:** Pressing `B` or `BACK` sends the CiA 402 Quick-Stop (`0x0002`) to both drivers, halts the stepper, and latches `ESTOP_LATCHED`. Pressing `A` or `START` clears faults and re-arms, but only when both triggers and both sticks are returned to neutral (`controls_neutral`).
  - **CAN Bus-Off Fault:** If the CAN controller enters Bus-Off, the state machine transitions to `CAN_FAULT` and halts the drivetrain.
- **Key Takeaway:** A dropped controller, unplugged USB receiver, or CAN bus fault all result in a deterministic stop without operator intervention.

```c
/* Gamepad watchdog: no packet for 250 ms -> controlled stop */
if (HAL_GetTick() - last_valid_report_tick >= CONTROLLER_TIMEOUT_MS) {
  robot_state = ROBOT_STATE_WATCHDOG_STOP;
  Motor_Stop_Controlled();
}
/* Re-arm only when triggers and sticks are back at neutral */
if (reset_pressed && controls_neutral) {
  Robot_Clear_Faults_And_Enable();
}
```

:::

::: details Level 4: Differential Drive Kinematics & Smooth Ramping

- **Objective:** Convert forward speed $v_x$ and turn rate $\omega_z$ into left and right wheel RPM targets and ramp wheel speeds smoothly at 50 Hz.
- **Technical Implementation:** Computes $v_{\text{left}} = v_x - \omega_z W / 2$ and $v_{\text{right}} = v_x + \omega_z W / 2$ ($W = 0.575\text{ m}$), converts to RPM ($v \cdot 60 / (2\pi \cdot 0.1315\text{ m})$), applies proportional anti-saturation scaling so neither wheel clips past `g_motor_max_rpm`, and ramps targets every `20 ms` (`50 Hz`) at `40 RPM/s` before dispatching over CAN.
- **Key Takeaway:** Produces smooth, predictable turning with zero lurching, while `Robot_Set_CmdVel()` shares the exact same kinematic pipeline for ROS 2.

```c
/* Differential drive kinematics (Drive_UGV_With_Mode / Robot_Set_CmdVel) */
float half_track_wz = (wz * ROBOT_TRACK_WIDTH_M) / 2.0f;
float v_left  = vx - half_track_wz;
float v_right = vx + half_track_wz;
const float wheel_circ_m = 2.0f * 3.14159265f * ROBOT_WHEEL_RADIUS_M;
float rpm_left  = (v_left  * 60.0f) / wheel_circ_m;
float rpm_right = (v_right * 60.0f) / wheel_circ_m;
/* Anti-saturation: scale both wheels to keep the turn shape */
float max_rpm = fmaxf(fabsf(rpm_left), fabsf(rpm_right));
if (max_rpm > g_motor_max_rpm) {
  float scale = g_motor_max_rpm / max_rpm;
  rpm_left  *= scale;
  rpm_right *= scale;
}
```

:::

## 4. Multi-Layer Safety Summary {#section-8-safety}

The table below summarizes how faults and hazards are mitigated across the firmware and hardware layers:

| Hazard / Failure Mode | Mitigation Mechanism | Enforcement Layer | Verified Phase |
| :--- | :--- | :--- | :--- |
| **Controller packets stop arriving** | **250 ms watchdog** (`CONTROLLER_TIMEOUT_MS`) transitions to `WATCHDOG_STOP` and executes `Motor_Stop_Controlled()` (`500 ms` in ROS 2 mode) | <Badge type="info" text="Firmware" /> | [Phase 5](#phase-5) |
| **USB receiver unplugged** | `HOST_USER_DISCONNECTION` interrupt immediately transitions to `DISCONNECTED` and zeroes velocity | <Badge type="info" text="Firmware" /> | [Phase 5](#phase-5) |
| **Operator emergency stop** | Gamepad `B` / `BACK` latches `ESTOP_LATCHED`, sends CiA 402 Quick-Stop (`0x0002`) to both nodes, and stops stepper | <Badge type="info" text="Firmware" /> | [Phase 3](#phase-3), [5](#phase-5) |
| **Re-arm attempted while throttle active** | `Robot_Clear_Faults_And_Enable()` (`A` / `START`) is blocked unless both triggers and sticks are at neutral (`controls_neutral`) | <Badge type="info" text="Firmware" /> | [Phase 5](#phase-5) |
| **Driver overcurrent / stall / overvoltage** | `150 ms` background poll of Statusword (`0x6041`); Bit 3 (`0x0008`) trips `STATE_ERR` and zeroes RPM; cleared via Bit 7 rising edge (`0x0080`) | <Badge type="info" text="Firmware + CAN" /> | [Phase 4](#phase-4) |
| **Inner-wheel reversal or saturation clipping** | Minimum arc radius clamp ($R_{\min} \ge 0.5\text{ m}$) + proportional dual-wheel anti-saturation scaling | <Badge type="info" text="Firmware" /> | [Phase 5](#phase-5) |
| **Unacknowledged CAN frames / Bus-Off** | `AutoRetransmission = DISABLE` + mailbox abort prevents FIFO deadlock; `CAN_ESR` `BOFF` auto-restarts CAN peripheral | <Badge type="info" text="Firmware + Hardware" /> | [Phase 1](#phase-1), [5](#phase-5) |
| **Software freeze or total link loss** | Independent RF safety interlock (`PB1`) and main power cutoff | <Badge type="warning" text="Hardware" /> | [Hardware → Pinout](./stm32-hardware.md#interface-wiring) |

## 5. Key Hardware–Software Integration Lessons {#section-9-problems}

Building and testing the stack bottom-up across Phases 1 to 5 resolved three critical hardware–software integration issues before full vehicle trials:

1. **3.3 V GPIO Optocoupler Drop Solved by Common-Anode 5 V Low-Side Sinking ([Phase 2](#phase-2)):** Driving the TB6600 stepper optocouplers in common-cathode mode from $3.3\text{ V}$ push-pull pins left only $\approx 1.7\text{ V}$ after the IR LED drop, causing missed steps. Tying `PUL+`/`DIR+` to $+5\text{ V}$ and sinking `PUL-`/`DIR-` (`PC2`/`PC3`) in 5 V-tolerant open-drain mode delivered the full $5\text{ V}$ swing without external level shifters.
2. **1 ms SysTick Stepper Jitter Solved by 84 MHz DWT Cycle Counting ([Phase 2](#phase-2)):** Standard `HAL_Delay()` ($1\text{ ms}$ resolution) could not generate smooth $200\text{–}800\ \mu\text{s}$ stepper pulses. Using `DWT->CYCCNT` ($\approx 11.9\text{ ns}$ resolution at $84\text{ MHz}$) with a $20\ \mu\text{s}$ direction setup guard eliminated step loss and resonance stalls.
3. **Mirrored Axle Mounting Abstracted in Low-Level Driver Wrapper ([Phase 5](#phase-5)):** Left-bank hub motors are physically mounted mirrored relative to right-bank motors. Negating Channel 1 inside `Motor_Set_Velocity_All(-left_rpm, right_rpm)` allowed all higher-level kinematics and `Robot_Set_CmdVel(vx, wz)` to use standard forward-positive coordinates.

## 6. Future Works for Semester 2 {#section-10-roadmap}

### 6.1 6-DOF IMU Sensor Fusion & Attitude Estimation

The low-level controller will incorporate real-time sensor fusion algorithms combining 6-DOF IMU (accelerometer and gyroscope) telemetry with wheel encoder odometry over `I2C`/`SPI`. By executing an Extended Kalman Filter (EKF) or Complementary Filter directly on the STM32 core, the system will achieve high-frequency attitude estimation, dynamic tilt sensing, and vibration rejection required for accurate motion tracking on uneven airfield runway terrain.

### 6.2 NVIDIA Jetson & ROS 2 High-Level Integration

To bridge low-level real-time actuation with high-level autonomy, the microcontroller will interface with the NVIDIA Jetson board executing ROS 2. Communication will be established via micro-ROS over high-speed UART/USB or native CAN, enabling publication of wheel odometry, system status, and diagnostic telemetry while subscribing to high-level velocity command topics (`cmd_vel`) for autonomous trajectory execution. The entry point is already written: `Robot_Set_CmdVel(vx, wz)` in `controller.c` takes the `cmd_vel` values and runs them through the same kinematics and safety checks as the gamepad. A `500 ms` ROS watchdog is defined and will be enforced once the link is live.

### 6.3 Smart LiFePO4 BMS Telemetry & Power Diagnostics

Full integration of the 6S–22S LiFePO4 Smart Battery Management System (BMS) over `USART1` (`PA9`/`PA10`) will enable live reporting of individual cell voltages, pack State of Charge (SoC), thermal metrics, and discharge current levels. The MCU will enforce dynamic power-throttling limits and automated failsafe cutoffs in response to under-voltage or over-temperature conditions, safeguarding power storage infrastructure during extended operational runs.

### 6.4 Closed-Loop Differential Drive Kinematics & Skid-Steer Slip Compensation

Building upon the open-loop differential-drive kinematics validated in Semester 1, firmware algorithms will incorporate closed-loop speed regulation using real-time encoder feedback from the ZLAC8015D motor drivers. Traction control and dynamic slip-compensation models will be evaluated to correct for lateral wheel skidding and heading drift during high-speed turns or damp asphalt surface conditions.

**Related documentation:** [STM32 Hardware Subsystem →](./stm32-hardware.md) · [Steering Kinematics →](../hilbert/steering-kinematics.md) · [Autonomous Navigation →](../hilbert/navigation.md) · [UAV–UGV Communications →](../hilbert/communications.md)

<!-- #endregion report -->

National University of Singapore · CDE4301 Capstone Project

← [Previous Architecture: STM32 Hardware Subsystem](./stm32-hardware.md)
