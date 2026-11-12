<script setup lang="ts">
import { ref, computed } from 'vue'
import { withBase } from 'vitepress'

export interface StageStep {
  id: string
  stage: string
  title: string
  file: string
  risk: string
  test: string
  result: string
  videoSrc?: string
  videoAlt?: string
  figureSrc?: string
  figureAlt?: string
  figureCaption?: string
  secondaryFigureSrc?: string
  secondaryFigureAlt?: string
  secondaryFigureCaption?: string
  consoleLog: string
  code: string
}

const props = withDefaults(
  defineProps<{
    stages?: StageStep[]
  }>(),
  {
    stages: () => [
      {
        id: 'phase-1',
        stage: 'Stage 1',
        title: 'CAN Bus Physical & Protocol Diagnostics',
        file: 'Can_debugging_check.c',
        risk: 'Transceiver wiring faults, unknown driver baud rate, or unacknowledged CAN frames locking the 3 hardware TX mailboxes before motor commands are sent.',
        test: 'Bit-bang DC GPIO loopback on PB9 (TX) -> PB8 (RX); push-button baud sweep on PC13 across 500k / 250k / 1M / 125k bps with AutoRetransmission = DISABLE; read CAN_ESR (TEC, REC, LEC).',
        result: '100% DC loopback pass (PB9 HIGH -> 0 V diff -> PB8 HIGH; PB9 LOW -> 2 V diff -> PB8 LOW); confirmed 500 kbps driver baud rate (prescaler 6); 0 stuck TX mailboxes; deterministic LEC=1 (Stuff) and LEC=3 (ACK) fault decoding.',
        videoSrc: 'assets/videos/phase1-can.mp4',
        videoAlt: 'Stage 1 CAN bus physical loopback and dynamic baud sweep bench video',
        consoleLog: `--> [RESULT] Transceiver Physical Loopback: 100% PASS!
[BUTTON] >>> Switching CAN Baud Rate to: 500 kbps (Default) <<<
  -> [DIAGNOSTIC] No Acknowledgment (ACK Error, LEC=3, TEC=8).`,
        code: `/* Step A: Drive PB9 HIGH (Recessive) | Step B: Drive PB9 LOW (Dominant) */
HAL_GPIO_WritePin(GPIOB, GPIO_PIN_9, GPIO_PIN_SET);   HAL_Delay(5);
uint8_t rxHigh = HAL_GPIO_ReadPin(GPIOB, GPIO_PIN_8);
HAL_GPIO_WritePin(GPIOB, GPIO_PIN_9, GPIO_PIN_RESET); HAL_Delay(5);
uint8_t rxLow  = HAL_GPIO_ReadPin(GPIOB, GPIO_PIN_8);

/* Disable auto-retransmit & flush pending mailboxes 0..2 */
hcan1.Init.AutoRetransmission = DISABLE;
if (HAL_CAN_IsTxMessagePending(&hcan1, CAN_TX_MAILBOX0)) HAL_CAN_AbortTxRequest(&hcan1, CAN_TX_MAILBOX0);

/* Decode CAN_ESR hardware fault codes */
uint32_t esr = hcan1.Instance->ESR;
uint8_t tec = (uint8_t)((esr & CAN_ESR_TEC) >> CAN_ESR_TEC_Pos);
uint8_t lec = (uint8_t)((esr & CAN_ESR_LEC) >> CAN_ESR_LEC_Pos);
if (lec == 1) printf("  -> [DIAGNOSTIC] Stuff Error (LEC=1, TEC=%d). Baud rate mismatch?\\r\\n", tec);
if (lec == 3) printf("  -> [DIAGNOSTIC] No Acknowledgment (ACK Error, LEC=3, TEC=%d).\\r\\n", tec);`
      },
      {
        id: 'phase-2',
        stage: 'Stage 2',
        title: 'Stepper 5 V Sinking & DWT Microsecond Timing',
        file: 'Steppermotor_w_user_input.c',
        risk: '3.3 V STM32 GPIO failing to switch 5 V TB6600 optocouplers (leaving ~1.7 V after IR LED drop) and 1 ms SysTick (HAL_Delay) capping step rate at <= 500 Hz.',
        test: 'Wire PUL+ / DIR+ to +5 V and sink PUL- (PC2) and DIR- (PC3) as 5 V-tolerant open-drain outputs; time pulses with 84 MHz DWT->CYCCNT (11.9 ns/cycle) and 20 us direction guard (>= 5 us TB6600 spec); sweep delay via USART2 CLI (W/S +/-400 steps, +/- delay).',
        result: 'Full 5.0 V swing across optocouplers without level shifters; pulse delay adjustable from 200 us to 5,000 us in 100 us steps (18 us half-step in production controller.c) over the 110 mm actuator stroke.',
        videoSrc: 'assets/videos/phase2-stepper.mp4',
        videoAlt: 'Stage 2 TB6600 stepper motor 5 V open-drain current-sinking and DWT speed sweep video',
        consoleLog: `>>> [STEPPER] Jog Forward +400 steps (Delay = 500 us)
>>> [SPEED] Faster! Delay = 400 us
>>> [SPEED] Faster! Delay = 300 us
>>> [SPEED] Faster! Delay = 200 us`,
        code: `/* PC2 (PUL-) & PC3 (DIR-) as 5 V-tolerant Open-Drain Sinks */
GPIO_InitStruct.Pin   = STEPPER_PUL_PIN | STEPPER_DIR_PIN;
GPIO_InitStruct.Mode  = GPIO_MODE_OUTPUT_OD;
GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
HAL_GPIO_Init(GPIOC, &GPIO_InitStruct);

/* 84 MHz Cortex-M4 DWT cycle counter delay (11.9 ns resolution) */
void Stepper_DelayUs(uint32_t us) {
  if (dwt_active) {
    uint32_t startCycles = DWT->CYCCNT;
    uint32_t waitCycles  = us * (SystemCoreClock / 1000000);
    while ((DWT->CYCCNT - startCycles) < waitCycles);
  } else {
    volatile uint32_t count = us * 21; /* 84 MHz calibrated fallback */
    while (count--) { __NOP(); }
  }
}`
      },
      {
        id: 'phase-3',
        stage: 'Stage 3',
        title: 'Dual ZLAC8015D 4WD CANopen Locomotion',
        file: '2_motor_w_user_input.c / zlac8015d.c',
        risk: 'Packet collisions between two motor drivers on a single CAN bus, startup inrush current spikes, or lack of immediate emergency braking across all 4 wheels.',
        test: 'Address Driver 1 (front axle) on Node ID 1 (0x601 TX / 0x581 RX) and Driver 2 (rear axle) on Node ID 2 (0x602 TX / 0x582 RX) at 500 kbps; run CiA 402 handshake (0x0006 -> 0x0007 -> 0x000F) with 100 ms ramps; test [Q] ramp stop vs. [E] Quick-Stop (0x0002).',
        result: 'Zero SDO collisions across both nodes; synchronized 4-wheel forward/reverse at +/-50 RPM with 100 ms accel/decel ramps (0x6083/0x6084); instant electromagnetic braking on 0x0002.',
        videoSrc: 'assets/videos/phase3-four-wheels.mp4',
        videoAlt: 'Stage 3 synchronized 4-wheel CANopen velocity mode and Quick-Stop bench video',
        consoleLog: `[INIT] Initializing ZLAC8015D Driver 1 (Node ID 1)...
[INIT] Initializing ZLAC8015D Driver 2 (Node ID 2)...
>>> [DRIVE] All 4 wheels commanded to +50 RPM (100 ms ramp)
>>> [ALERT] EMERGENCY STOP TRIGGERED ON ALL MOTORS! (Controlword = 0x0002)`,
        code: `HAL_StatusTypeDef ZLAC8015D_Init_Velocity_Mode_Async_Node(uint8_t nodeId, uint32_t accel_ms, uint32_t decel_ms) {
  ZLAC8015D_SendNMT_Node(nodeId, 0x01);                                            HAL_Delay(50);
  ZLAC8015D_Write8_Node(nodeId, ZLAC_OBJ_MODES_OF_OPERATION, ZLAC_SUB_ALL, 0x03);  HAL_Delay(30);
  ZLAC8015D_Write32_Node(nodeId, ZLAC_OBJ_PROFILE_ACCEL, ZLAC_SUB_CH1_LEFT, accel_ms);  HAL_Delay(30);
  ZLAC8015D_Write32_Node(nodeId, ZLAC_OBJ_PROFILE_ACCEL, ZLAC_SUB_CH2_RIGHT, accel_ms); HAL_Delay(30);
  ZLAC8015D_Write32_Node(nodeId, ZLAC_OBJ_PROFILE_DECEL, ZLAC_SUB_CH1_LEFT, decel_ms);  HAL_Delay(30);
  ZLAC8015D_Write32_Node(nodeId, ZLAC_OBJ_PROFILE_DECEL, ZLAC_SUB_CH2_RIGHT, decel_ms); HAL_Delay(30);
  /* CiA 402 Power Enable Handshake: Shutdown (0x06) -> Switch On (0x07) -> Enable (0x0F) */
  ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_CONTROLWORD, ZLAC_SUB_ALL, 0x0006); HAL_Delay(30);
  ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_CONTROLWORD, ZLAC_SUB_ALL, 0x0007); HAL_Delay(30);
  ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_CONTROLWORD, ZLAC_SUB_ALL, 0x000F); HAL_Delay(50);
  return HAL_OK;
}`
      },
      {
        id: 'phase-4',
        stage: 'Stage 4',
        title: 'Closed-Loop CiA 402 State Machine & Python GUI',
        file: 'state_machine_check.c + GUI.py',
        risk: 'Unsafe direct transitions from freewheel (DISENGAGE) to spinning (MOVEMENT) or undetected driver hardware faults (overcurrent, stall, overvoltage).',
        test: 'Enforce 5-state FSM (DISENGAGE, LOCK, MOVEMENT, JERK, ERR) over UART CLI and Python slider GUI (+/-50 RPM steps up to +/-350 RPM); poll Statusword (0x6041) every 150 ms; clear latched faults via Controlword Bit 7 rising edge (0x0080 -> 30 ms -> 0x0000).',
        result: '100% rejection of invalid DISENGAGE -> MOVEMENT jumps; 150 ms Statusword polling trips STATE_ERR on Bit 3 (0x0008) and zeroes velocity; [C] key resets hardware fault latch in 30 ms without MCU reboot.',
        videoSrc: 'assets/videos/phase4-fsm-gui.mp4',
        videoAlt: 'Stage 4 CiA 402 state machine and Python desktop GUI test video',
        figureSrc: '/assets/images/gabriel/fsm-diagram.png',
        figureAlt: '5-state motor supervisory FSM diagram',
        figureCaption: 'Figure 4.1: Stage 4 5-state CiA 402 motor supervisory state machine.',
        secondaryFigureSrc: '/assets/images/gabriel/gui-screenshot.png',
        secondaryFigureAlt: 'Python desktop GUI screenshot',
        secondaryFigureCaption: 'Figure 4.2: Desktop verification GUI (GUI.py) streaming velocity setpoints and state commands.',
        consoleLog: `>>> [ACTION] RUN: Enabling driver & locking shaft at 0 RPM...
>>> [ACTION] QUICK STOP: Fast magnetic deceleration...
>>> [!] HARDWARE ALARM DETECTED (Statusword 0x6041 Bit 3 = 1): Entering STATE_ERR!
>>> [RECOVERY] Controlword Bit 7 rising edge (0x0080 -> 0x0000) sent. Fault cleared.`,
        code: `/* Silent background health query sent every 150 ms */
if (HAL_GetTick() - lastPollTick >= 150) {
  lastPollTick = HAL_GetTick();
  CAN_Send_Silent(0x600 + NODE_ID, 0x40, 0x41, 0x60, 0x00, 0x00, 0x00, 0x00, 0x00);
}
/* Decode Statusword 0x6041 Bit 3 (Fault) */
if (lastHardwareStatusword & 0x0008) {
  currentState = STATE_ERR;
  currentSpeedRpm = 0;
}
/* Rising-edge fault reset on Controlword (0x6040) Bit 7 */
static void Driver_Clear_Fault(void) {
  CAN_Send(0x600 + NODE_ID, 0x2B, 0x40, 0x60, 0x00, 0x80, 0x00, 0x00, 0x00);
  HAL_Delay(30);
  CAN_Send(0x600 + NODE_ID, 0x2B, 0x40, 0x60, 0x00, 0x00, 0x00, 0x00, 0x00);
}`
      },
      {
        id: 'phase-5',
        stage: 'Stage 5',
        title: 'Production Gamepad Teleop, Kinematics & Watchdogs',
        file: 'controller.c',
        risk: 'Mirrored left-side hub motors fighting right-side motors, inner-wheel reversal during tight turns, or runaway motion on wireless controller drop.',
        test: 'Drive 4-wheel chassis (~30 kg load) under Preset 3 (32 V / 10.4 A bench supply, 25 RPM max = 0.34 m/s, 40 RPM/s ramp, 0.45 rad/s turn rate, R_min = 0.50 m); test 250 ms gamepad watchdog, USB disconnect, B/BACK E-stop latch, and neutral-gated A/START re-arm.',
        result: 'Both nodes acknowledge boot probe (Statusword 0x0237); smooth 50 Hz (20 ms) ramping across straight, arc (R >= 0.5 m), and spot turns; controlled stop within 250 ms of packet loss.',
        videoSrc: 'assets/videos/phase5-drive.mp4',
        videoAlt: 'Stage 5 full 4WD teleoperation and safety watchdog test video',
        consoleLog: `>>> [INIT] Connecting to ZLAC8015D Motor Drivers...
  >>> [CAN OK] Node 1 acknowledged (Statusword: 0x0237)
  >>> [CAN OK] Node 2 acknowledged (Statusword: 0x0237)
>>> [USB] Controller Dongle Attached & Class Active!
[READY|ARC] v:+0.34 m/s w:+0.45 | L:+18 R:+25 (Tgt:+18 +25) | CAN:N1[O] N2[O] | WD: 12ms`,
        code: `/* Left motors are mirrored on both axles: CH1 negative = forward */
void Motor_Set_Velocity_All(int32_t left_rpm, int32_t right_rpm) {
  ZLAC8015D_SetVelocity_Node(ZLAC_NODE_ID_1, -left_rpm, right_rpm);
  HAL_Delay(2);
  ZLAC8015D_SetVelocity_Node(ZLAC_NODE_ID_2, -left_rpm, right_rpm);
}
/* 250 ms Gamepad watchdog + Neutral-gated re-arming */
if (HAL_GetTick() - last_valid_report_tick >= CONTROLLER_TIMEOUT_MS) {
  robot_state = ROBOT_STATE_WATCHDOG_STOP;
  Motor_Stop_Controlled();
}
if (reset_pressed && controls_neutral) {
  Robot_Clear_Faults_And_Enable();
}`
      }
    ]
  }
)

const activeIndex = ref(0)
const current = computed(() => props.stages[activeIndex.value])

function selectStage(idx: number) {
  activeIndex.value = idx
}
</script>

<template>
  <div class="fh-stage-stepper">
    <!-- Stepper Navigation Tabs -->
    <div class="fh-stage-stepper__nav" role="tablist" aria-label="Firmware verification stages">
      <button
        v-for="(item, idx) in stages"
        :key="item.id"
        type="button"
        role="tab"
        :id="item.id"
        :aria-selected="idx === activeIndex"
        class="fh-stage-stepper__tab"
        :class="{ 'is-active': idx === activeIndex }"
        @click="selectStage(idx)"
      >
        <span class="fh-stage-stepper__tab-num">{{ item.stage }}</span>
        <span class="fh-stage-stepper__tab-title">{{ item.title }}</span>
      </button>
    </div>

    <!-- Active Stage Content Card -->
    <div v-if="current" class="fh-stage-stepper__panel" role="tabpanel">
      <header class="fh-stage-stepper__head">
        <div>
          <span class="fh-stage-stepper__badge">{{ current.stage }}</span>
          <h4 class="fh-stage-stepper__title">{{ current.title }}</h4>
        </div>
        <code class="fh-stage-stepper__file">{{ current.file }}</code>
      </header>

      <div class="fh-stage-stepper__grid">
        <div class="fh-stage-stepper__box fh-stage-stepper__box--risk">
          <span class="fh-stage-stepper__label">Risk retired</span>
          <p class="fh-stage-stepper__text">{{ current.risk }}</p>
        </div>
        <div class="fh-stage-stepper__box">
          <span class="fh-stage-stepper__label">Test</span>
          <p class="fh-stage-stepper__text">{{ current.test }}</p>
        </div>
        <div class="fh-stage-stepper__box fh-stage-stepper__box--result">
          <span class="fh-stage-stepper__label">Result</span>
          <p class="fh-stage-stepper__text">{{ current.result }}</p>
        </div>
      </div>

      <!-- Console Output + Video Placeholder Row -->
      <div class="fh-stage-stepper__media">
        <div class="fh-stage-stepper__console">
          <span class="fh-stage-stepper__console-head">UART2 Virtual COM Port Log (115,200 baud)</span>
          <pre><code>{{ current.consoleLog }}</code></pre>
        </div>

        <figure v-if="current.videoSrc" class="fh-missing fh-stage-stepper__missing" role="img" :aria-label="`${current.videoAlt || 'Video'} (file missing)`">
          <span>Video slot (not yet in repo): {{ current.videoAlt }}</span>
          <code>{{ current.videoSrc }}</code>
        </figure>
      </div>

      <!-- Collapsed Code Implementation -->
      <details class="fh-stage-stepper__details">
        <summary class="fh-stage-stepper__summary">
          View {{ current.stage }} C implementation ({{ current.file }})
        </summary>
        <div class="fh-stage-stepper__code">
          <pre><code>{{ current.code }}</code></pre>
        </div>
      </details>

      <!-- Footer Prev / Next Controls -->
      <footer class="fh-stage-stepper__foot">
        <button
          type="button"
          class="fh-stage-stepper__btn"
          :disabled="activeIndex === 0"
          @click="selectStage(activeIndex - 1)"
        >
          ← Previous stage
        </button>
        <span class="fh-stage-stepper__counter">
          Stage {{ activeIndex + 1 }} of {{ stages.length }}
        </span>
        <button
          type="button"
          class="fh-stage-stepper__btn"
          :disabled="activeIndex === stages.length - 1"
          @click="selectStage(activeIndex + 1)"
        >
          Next stage →
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.fh-stage-stepper {
  margin: 20px 0 28px;
  border: 1px solid var(--fh-border, var(--vp-c-divider));
  border-radius: 14px;
  background: var(--fh-surface, var(--vp-c-bg-soft));
  overflow: hidden;
}

.fh-stage-stepper__nav {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  border-bottom: 1px solid var(--fh-border, var(--vp-c-divider));
  background: var(--vp-c-bg-alt);
}

.fh-stage-stepper__tab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 12px 14px;
  border: 0;
  border-right: 1px solid var(--fh-border, var(--vp-c-divider));
  border-bottom: 2px solid transparent;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.fh-stage-stepper__tab:last-child {
  border-right: 0;
}

.fh-stage-stepper__tab:hover {
  background: var(--vp-c-bg-soft);
}

.fh-stage-stepper__tab.is-active {
  background: var(--fh-surface, var(--vp-c-bg-soft));
  border-bottom-color: var(--vp-c-brand-1, #3b82f6);
}

.fh-stage-stepper__tab-num {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}

.fh-stage-stepper__tab.is-active .fh-stage-stepper__tab-num {
  color: var(--vp-c-brand-1, #3b82f6);
}

.fh-stage-stepper__tab-title {
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--vp-c-text-2);
}

.fh-stage-stepper__tab.is-active .fh-stage-stepper__tab-title {
  color: var(--vp-c-text-1);
}

.fh-stage-stepper__panel {
  padding: 20px 22px;
}

.fh-stage-stepper__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.fh-stage-stepper__badge {
  display: inline-block;
  margin-right: 8px;
  padding: 2px 8px;
  border-radius: 6px;
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--vp-c-brand-1, #3b82f6);
  background: var(--vp-c-brand-soft, rgba(59, 130, 246, 0.14));
}

.fh-stage-stepper__title {
  display: inline;
  margin: 0 !important;
  font-size: 17px;
  font-weight: 650;
  color: var(--vp-c-text-1);
}

.fh-stage-stepper__file {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-2);
}

.fh-stage-stepper__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.fh-stage-stepper__box {
  padding: 12px 14px;
  border: 1px solid var(--fh-border, var(--vp-c-divider));
  border-radius: 10px;
  background: var(--vp-c-bg-alt);
}

.fh-stage-stepper__box--risk {
  border-left: 3px solid #e9a35c;
}

.fh-stage-stepper__box--result {
  border-left: 3px solid #34c08b;
}

.fh-stage-stepper__label {
  display: block;
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}

.fh-stage-stepper__box--risk .fh-stage-stepper__label {
  color: #e9a35c;
}

.fh-stage-stepper__box--result .fh-stage-stepper__label {
  color: #34c08b;
}

.fh-stage-stepper__text {
  margin: 0 !important;
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--vp-c-text-1);
}

.fh-stage-stepper__media {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 12px;
  margin-bottom: 14px;
}

.fh-stage-stepper__console {
  padding: 12px 14px;
  border: 1px solid var(--fh-border, var(--vp-c-divider));
  border-radius: 10px;
  background: var(--vp-c-bg-alt);
  overflow-x: auto;
}

.fh-stage-stepper__console-head {
  display: block;
  margin-bottom: 6px;
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--vp-c-text-3);
}

.fh-stage-stepper__console pre {
  margin: 0 !important;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  line-height: 1.5;
  color: var(--vp-c-text-1);
  white-space: pre-wrap;
}

.fh-stage-stepper__missing {
  margin: 0 !important;
  min-height: 96px;
}

.fh-stage-stepper__details {
  padding-top: 12px;
  border-top: 1px solid var(--fh-border, var(--vp-c-divider));
}

.fh-stage-stepper__summary {
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--vp-c-brand-1, #3b82f6);
  user-select: none;
}

.fh-stage-stepper__code {
  margin-top: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--vp-c-bg-alt);
  overflow-x: auto;
}

.fh-stage-stepper__code pre {
  margin: 0 !important;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  line-height: 1.5;
  color: var(--vp-c-text-1);
}

.fh-stage-stepper__foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--fh-border, var(--vp-c-divider));
}

.fh-stage-stepper__btn {
  padding: 6px 14px;
  border: 1px solid var(--fh-border, var(--vp-c-divider));
  border-radius: 999px;
  background: var(--vp-c-bg-alt);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  cursor: pointer;
}

.fh-stage-stepper__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.fh-stage-stepper__counter {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

@media (max-width: 900px) {
  .fh-stage-stepper__nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .fh-stage-stepper__grid,
  .fh-stage-stepper__media {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

