<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

interface TerminalLine {
  text: string
  type: 'prompt' | 'info' | 'success' | 'warn' | 'data' | 'divider'
  delayMs?: number
}

// Verified recorded lines from DemoComs_C2.py and presentation slide 175 (Simulated ARGUS)
const argusSteps: { lines: TerminalLine[]; delay: number }[] = [
  {
    lines: [
      { text: 'charansagar@Charan:/mnt/c/.../Interim_Communication_Demo$ python3 DemoComs_C2.py', type: 'prompt' },
      { text: 'Waiting for Raspberry Pi...', type: 'info' }
    ],
    delay: 900
  },
  {
    lines: [
      { text: 'Raspberry Pi connected.', type: 'success' }
    ],
    delay: 800
  },
  {
    lines: [
      { text: 'C2 TARGET ALERT SENT', type: 'warn' },
      { text: 'Object: screw', type: 'data' },
      { text: 'Coordinate: (3.2, 1.7)', type: 'data' },
      { text: 'Yaw: 0.0', type: 'data' }
    ],
    delay: 1100
  }
]

// Verified recorded lines from c2_alert_receiver.py and presentation slide 175 (Simulated HUNTER)
const hunterSteps: { lines: TerminalLine[]; delay: number }[] = [
  {
    lines: [
      { text: 'olliesoh@ugv-workstation:~/runway_sim_ws$ ros2 run runway_communication c2_alert_receiver', type: 'prompt' },
      { text: '==========================================', type: 'divider' },
      { text: 'UGV TARGET RECEIVER READY', type: 'info' },
      { text: 'Listening: /c2/target_alert', type: 'info' },
      { text: 'Expected frame: map', type: 'info' },
      { text: '==========================================', type: 'divider' }
    ],
    delay: 900
  },
  {
    lines: [
      { text: '● CycloneDDS Peer Discovered: UAV_ALPHA_01 (192.168.168.50:7400)', type: 'success' }
    ],
    delay: 800
  },
  {
    lines: [
      { text: '========== UAV TARGET RECEIVED ==========', type: 'warn' },
      { text: 'Threat ID   : FOD_THREAT_001', type: 'data' },
      { text: 'Object      : FOD / screw', type: 'data' },
      { text: 'Confidence  : 0.96', type: 'data' },
      { text: 'Target X    : 3.20 m', type: 'data' },
      { text: 'Target Y    : 1.70 m', type: 'data' },
      { text: 'Target Yaw  : 0.00 rad', type: 'data' },
      { text: '==========================================', type: 'divider' },
      { text: '[ugv_c2_bridge] Goal dispatched to Nav2 NavigateToPose -> PoseStamped (map, x=3.20, y=1.70, yaw=0.00)', type: 'success' }
    ],
    delay: 1200
  }
]

const totalSteps = Math.max(argusSteps.length, hunterSteps.length)
const currentStep = ref(totalSteps) // Default to fully visible for SSR
const isPlaying = ref(false)
const isExpanded = ref(false)
const isMounted = ref(false)
const copied = ref(false)
let timerId: ReturnType<typeof setTimeout> | null = null

const visibleArgusLines = computed(() => {
  if (!isMounted.value) {
    return argusSteps.flatMap(s => s.lines)
  }
  return argusSteps.slice(0, currentStep.value).flatMap(s => s.lines)
})

const visibleHunterLines = computed(() => {
  if (!isMounted.value) {
    return hunterSteps.flatMap(s => s.lines)
  }
  return hunterSteps.slice(0, currentStep.value).flatMap(s => s.lines)
})

function clearTimer() {
  if (timerId !== null) {
    clearTimeout(timerId)
    timerId = null
  }
}

function stepForward() {
  if (currentStep.value < totalSteps) {
    currentStep.value++
    if (isPlaying.value && currentStep.value < totalSteps) {
      const nextDelay = argusSteps[currentStep.value]?.delay || 1000
      timerId = setTimeout(stepForward, nextDelay)
    } else {
      isPlaying.value = false
    }
  } else {
    isPlaying.value = false
  }
}

function play() {
  clearTimer()
  if (currentStep.value >= totalSteps) {
    currentStep.value = 0
  }
  isPlaying.value = true
  stepForward()
}

function pause() {
  clearTimer()
  isPlaying.value = false
}

function togglePlay() {
  if (isPlaying.value) {
    pause()
  } else {
    play()
  }
}

function replay() {
  clearTimer()
  currentStep.value = 0
  isPlaying.value = true
  stepForward()
}

function reset() {
  clearTimer()
  isPlaying.value = false
  currentStep.value = 1
}

function copyOutput() {
  const argusText = visibleArgusLines.value.map(l => l.text).join('\n')
  const hunterText = visibleHunterLines.value.map(l => l.text).join('\n')
  const fullText = `=== ARGUS (C2 SENDER) ===\n${argusText}\n\n=== HUNTER (C2 RECEIVER) ===\n${hunterText}`
  navigator.clipboard?.writeText(fullText).then(() => {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  })
}

onMounted(() => {
  isMounted.value = true
  // Check prefers-reduced-motion
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (mediaQuery.matches) {
    currentStep.value = totalSteps
    isPlaying.value = false
  } else {
    // Start at step 1 on interactive load
    currentStep.value = 1
  }
})

onBeforeUnmount(() => {
  clearTimer()
})
</script>

<template>
  <div class="c2-terminal-wrapper vp-raw">
    <!-- Component Header -->
    <div class="c2-terminal-header-bar">
      <div class="c2-header-meta">
        <span class="c2-live-tag">
          <span class="c2-pulse-dot" :class="{ 'is-active': isPlaying }"></span>
          Recorded Indoor C2 Communication Demonstration
        </span>
        <span class="c2-header-subtitle">
          ROS 2 Jazzy · CycloneDDS static unicast · Topic: <code>/c2/target_alert</code> · Wi-Fi router testbed
        </span>
      </div>

      <!-- Global Controls -->
      <div class="c2-controls">
        <button
          type="button"
          class="c2-btn c2-btn-primary"
          @click="togglePlay"
          :title="isPlaying ? 'Pause replay' : 'Play replay'"
        >
          <span v-if="isPlaying" class="c2-icon">⏸ Pause</span>
          <span v-else class="c2-icon">▶ Play Sequence</span>
        </button>

        <button
          type="button"
          class="c2-btn c2-btn-secondary"
          @click="replay"
          title="Replay from beginning"
        >
          <span class="c2-icon">↺ Replay</span>
        </button>

        <button
          type="button"
          class="c2-btn c2-btn-secondary"
          @click="reset"
          title="Reset terminal"
        >
          <span class="c2-icon">⟲ Reset</span>
        </button>

        <button
          type="button"
          class="c2-btn c2-btn-secondary"
          @click="copyOutput"
          :title="copied ? 'Copied to clipboard' : 'Copy terminal text'"
        >
          <span class="c2-icon">{{ copied ? '✓ Copied' : '⧉ Copy' }}</span>
        </button>

        <button
          type="button"
          class="c2-btn c2-btn-secondary c2-btn-expand"
          @click="isExpanded = !isExpanded"
          :title="isExpanded ? 'Collapse terminal' : 'Expand full height'"
        >
          <span>{{ isExpanded ? '⤡ Compact' : '⤢ Expand' }}</span>
        </button>
      </div>
    </div>

    <!-- Stepper indicator -->
    <div class="c2-stepper-strip">
      <div
        class="c2-step-node"
        :class="{ 'is-completed': currentStep >= 1, 'is-current': currentStep === 1 }"
      >
        <span class="c2-step-num">1</span>
        <span class="c2-step-label">Node Discovery</span>
      </div>
      <div class="c2-step-connector" :class="{ 'is-active': currentStep >= 2 }"></div>
      <div
        class="c2-step-node"
        :class="{ 'is-completed': currentStep >= 2, 'is-current': currentStep === 2 }"
      >
        <span class="c2-step-num">2</span>
        <span class="c2-step-label">Handshake Ready</span>
      </div>
      <div class="c2-step-connector" :class="{ 'is-active': currentStep >= 3 }"></div>
      <div
        class="c2-step-node"
        :class="{ 'is-completed': currentStep >= 3, 'is-current': currentStep === 3 }"
      >
        <span class="c2-step-num">3</span>
        <span class="c2-step-label">Alert Dispatched & Ingested</span>
      </div>
    </div>

    <!-- Two Terminal Windows Side-by-Side -->
    <div class="c2-terminal-grid" :class="{ 'is-expanded': isExpanded }">
      <!-- Terminal A: ARGUS (C2 Sender) -->
      <div class="c2-terminal-card argus-terminal">
        <div class="c2-window-chrome">
          <div class="c2-traffic-lights">
            <span class="c2-dot c2-dot-close"></span>
            <span class="c2-dot c2-dot-min"></span>
            <span class="c2-dot c2-dot-zoom"></span>
          </div>
          <div class="c2-window-title">
            <span class="c2-host-badge argus-badge">ARGUS — C2 SENDER</span>
            <span class="c2-title-script">DemoComs_C2.py (Laptop / WSL2)</span>
          </div>
          <div class="c2-chrome-tag">DDS Publisher</div>
        </div>

        <div class="c2-window-body">
          <div
            v-for="(line, idx) in visibleArgusLines"
            :key="'a-' + idx"
            class="c2-line"
            :class="'c2-line-' + line.type"
          >
            <span v-if="line.type === 'prompt'" class="c2-prompt-symbol">❯ </span>
            <span class="c2-text">{{ line.text }}</span>
          </div>
          <div v-if="isPlaying && currentStep < totalSteps" class="c2-cursor">_</div>
        </div>
      </div>

      <!-- Terminal B: HUNTER (C2 Receiver) -->
      <div class="c2-terminal-card hunter-terminal">
        <div class="c2-window-chrome">
          <div class="c2-traffic-lights">
            <span class="c2-dot c2-dot-close"></span>
            <span class="c2-dot c2-dot-min"></span>
            <span class="c2-dot c2-dot-zoom"></span>
          </div>
          <div class="c2-window-title">
            <span class="c2-host-badge hunter-badge">HUNTER — C2 RECEIVER</span>
            <span class="c2-title-script">c2_alert_receiver (RPi 5 / Workstation)</span>
          </div>
          <div class="c2-chrome-tag">DDS Subscriber</div>
        </div>

        <div class="c2-window-body">
          <div
            v-for="(line, idx) in visibleHunterLines"
            :key="'h-' + idx"
            class="c2-line"
            :class="'c2-line-' + line.type"
          >
            <span v-if="line.type === 'prompt'" class="c2-prompt-symbol">❯ </span>
            <span class="c2-text">{{ line.text }}</span>
          </div>
          <div v-if="isPlaying && currentStep < totalSteps" class="c2-cursor">_</div>
        </div>
      </div>
    </div>

    <!-- Footnote Verification Banner -->
    <div class="c2-terminal-footer">
      <div class="c2-footer-content">
        <span class="c2-verify-icon">ℹ</span>
        <span>
          <strong>Recorded Demonstration Logs:</strong> Values shown (Threat ID: <code>FOD_THREAT_001</code>, Object: <code>screw</code>, Conf: <code>0.96</code>, Coordinate: <code>(3.20 m, 1.70 m)</code>, Yaw: <code>0.00 rad</code>) reflect verified testbed transmissions recorded during the multi-machine demonstration (slide 175). Not a live shell session.
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.c2-terminal-wrapper {
  margin: 28px 0;
  background: rgba(13, 17, 23, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
}

.c2-terminal-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 14px 18px;
  background: rgba(22, 27, 34, 0.85);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.c2-header-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.c2-live-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #f0f6fc;
  letter-spacing: 0.02em;
}

.c2-pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 8px #38bdf8;
}

.c2-pulse-dot.is-active {
  background: #10b981;
  box-shadow: 0 0 10px #10b981;
  animation: pulse-glow 1.5s infinite;
}

@keyframes pulse-glow {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.c2-header-subtitle {
  font-size: 11.5px;
  color: #8b949e;
}

.c2-header-subtitle code {
  color: #58a6ff;
  background: rgba(56, 189, 248, 0.12);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 11px;
}

.c2-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.c2-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 11px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.c2-btn-primary {
  background: #238636;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.c2-btn-primary:hover {
  background: #2ea043;
}

.c2-btn-secondary {
  background: rgba(255, 255, 255, 0.06);
  color: #c9d1d9;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.c2-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

/* Stepper strip */
.c2-stepper-strip {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  background: rgba(18, 22, 28, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  gap: 12px;
}

.c2-step-node {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: #6e7681;
  transition: color 0.2s ease;
}

.c2-step-node.is-completed {
  color: #c9d1d9;
}

.c2-step-node.is-current {
  color: #58a6ff;
  font-weight: 600;
}

.c2-step-num {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  font-size: 10px;
}

.c2-step-node.is-completed .c2-step-num {
  background: #238636;
  color: #fff;
}

.c2-step-node.is-current .c2-step-num {
  background: #1f6feb;
  color: #fff;
}

.c2-step-connector {
  flex: 1;
  max-width: 60px;
  height: 2px;
  background: rgba(255, 255, 255, 0.08);
  transition: background 0.2s ease;
}

.c2-step-connector.is-active {
  background: #238636;
}

/* Grid layout */
.c2-terminal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: rgba(255, 255, 255, 0.08);
}

@media (max-width: 860px) {
  .c2-terminal-grid {
    grid-template-columns: 1fr;
  }
}

.c2-terminal-card {
  background: #0d1117;
  display: flex;
  flex-direction: column;
  min-height: 280px;
  max-height: 380px;
  transition: max-height 0.3s ease;
}

.c2-terminal-grid.is-expanded .c2-terminal-card {
  max-height: 600px;
}

.c2-window-chrome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #161b22;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.c2-traffic-lights {
  display: flex;
  gap: 6px;
}

.c2-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.c2-dot-close { background: #ff5f56; }
.c2-dot-min { background: #ffbd2e; }
.c2-dot-zoom { background: #27c93f; }

.c2-window-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 11px;
}

.c2-host-badge {
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.03em;
}

.argus-badge {
  background: rgba(14, 165, 233, 0.2);
  color: #38bdf8;
  border: 1px solid rgba(14, 165, 233, 0.3);
}

.hunter-badge {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.c2-title-script {
  color: #8b949e;
}

.c2-chrome-tag {
  font-size: 10px;
  color: #484f58;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.c2-window-body {
  padding: 14px 16px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 11.5px;
  line-height: 1.55;
  color: #c9d1d9;
  overflow-y: auto;
  flex: 1;
}

.c2-line {
  margin-bottom: 2px;
  word-break: break-all;
}

.c2-line-prompt {
  color: #79c0ff;
  font-weight: 600;
  margin-bottom: 6px;
}

.c2-prompt-symbol {
  color: #a5d6ff;
}

.c2-line-info {
  color: #8b949e;
}

.c2-line-success {
  color: #56d364;
}

.c2-line-warn {
  color: #f2cc60;
  font-weight: 600;
}

.c2-line-data {
  color: #e6edf3;
  padding-left: 12px;
}

.c2-line-divider {
  color: #30363d;
  user-select: none;
}

.c2-cursor {
  display: inline-block;
  color: #58a6ff;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

.c2-terminal-footer {
  padding: 10px 18px;
  background: rgba(22, 27, 34, 0.85);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.c2-footer-content {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 11.5px;
  color: #8b949e;
  line-height: 1.45;
}

.c2-verify-icon {
  color: #38bdf8;
  font-weight: bold;
}

.c2-footer-content code {
  color: #58a6ff;
  background: rgba(56, 189, 248, 0.1);
  padding: 1px 4px;
  border-radius: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .c2-pulse-dot.is-active {
    animation: none;
  }
  .c2-cursor {
    animation: none;
  }
}
</style>

