<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { prefersReducedMotion } from '../../composables/motionEnv'

interface Milestone {
  id: number
  code: string
  title: string
  shortTitle: string
  workstream: string
  lead: string
  period: string
  completion: number
  description: string
  deliverables: string[]
}

const milestones: Milestone[] = [
  {
    id: 1,
    code: 'M1',
    title: 'Primary & Secondary Research',
    shortTitle: 'Research & Standards',
    workstream: 'Stakeholder & Regulatory',
    lead: 'Full Team & System Lead',
    period: 'Weeks 1 – 5',
    completion: 100,
    description: 'Validated runway operations, airbase ROT constraints, and regulatory standards with key industry & defense stakeholders.',
    deliverables: ['Interviews with RSAF air traffic controller, technician & CAAS', 'ICAO Annex 14 & FAA AC 150/5210-24 standard requirements extraction', 'Operational Concept Definition & ROT reduction targets']
  },
  {
    id: 2,
    code: 'M2',
    title: 'System Architecture Design',
    shortTitle: 'System Architecture',
    workstream: 'Multi-Agent Autonomy',
    lead: 'Hilbert Soh & Gabriel Tan',
    period: 'Weeks 4 – 8',
    completion: 100,
    description: 'Architected heterogeneous multi-agent collaboration linking aerial macro scanning (UAV) with ground extraction (UGV).',
    deliverables: ['Airborne UAV cued targeting to ground rover dispatch protocol', 'ROS 2 Jazzy DDS communication topology & QoS policies', 'Dual-EKF sensor fusion & localized coordinate frame hierarchy']
  },
  {
    id: 3,
    code: 'M3',
    title: 'Mechanical Prototype Design',
    shortTitle: 'Chassis & Kinematics',
    workstream: 'Mechanical Systems',
    lead: 'Zacarias Ng & Hilbert Soh',
    period: 'Weeks 6 – 11',
    completion: 100,
    description: 'Engineered custom welded chassis, differential drive kinematics, and trailing-arm suspension geometry.',
    deliverables: ['4-wheel skid-steer kinematic model & 3D dynamic visualizer', 'Chassis FEA stress & deformation simulations under dynamic load', 'Material selection (Al 6061-T6) & DFM for manufacturing']
  },
  {
    id: 4,
    code: 'M4',
    title: 'FOD Remediation Module',
    shortTitle: 'FOD Remediation',
    workstream: 'Suction & Aerodynamics',
    lead: 'Takeuchi Asuka',
    period: 'Weeks 7 – 12',
    completion: 100,
    description: 'Designed and fabricated the Critical Function Prototype (CFP) centrifugal vacuum impeller and sweep box ducting.',
    deliverables: ['Centrifugal impeller sizing & fluid flow optimization', 'CFP bench testing with standardized airfield FOD debris', 'Debris sweep box integration & dynamic ground clearance ducting']
  },
  {
    id: 5,
    code: 'M5',
    title: 'Electrical Architecture & Schematics',
    shortTitle: 'Electrical Systems',
    workstream: 'Power & Embedded Electronics',
    lead: 'Bryan Ng & Gabriel Tan',
    period: 'Weeks 8 – 12',
    completion: 100,
    description: 'Established the primary high-voltage battery architecture, multi-rail DC-DC regulators, and microcontroller pinout.',
    deliverables: ['25.6V 20Ah LiFePO4 battery pack sizing & power budget analysis', 'Regulated buck power distribution schematic (24V, 12V, 5V)', 'STM32 microcontroller hardware & firmware actuation interfaces']
  },
  {
    id: 6,
    code: 'M6',
    title: 'Navigation & Comms SIL Simulation',
    shortTitle: 'Autonomy & Comms',
    workstream: 'Programming & SIL',
    lead: 'Hilbert Soh',
    period: 'Weeks 8 – 13',
    completion: 100,
    description: 'Validated autonomous airfield transit in Gazebo Harmonic with AgileX Scout 2.0 proxy and CycloneDDS datalinks.',
    deliverables: ['Nav2 Regulated Pure Pursuit (RPP) path tracking & parameter tuning', 'Dual-EKF state estimation on NUS EA Field photorealistic world', 'UAV–UGV ROS 2 target-coordinate exchange & waypoint dispatch']
  }
]

const activeIndex = ref(0)
const selectMilestone = (idx: number) => {
  activeIndex.value = idx
}

// Animated completion percentage
const displayPercent = ref(100)
const rootRef = ref<HTMLElement>()
const progressLineRef = ref<HTMLElement>()
const nodeRefs = ref<HTMLElement[]>([])

let observer: IntersectionObserver | null = null

onMounted(async () => {
  if (typeof window === 'undefined') return

  if (prefersReducedMotion()) {
    displayPercent.value = 100
    if (progressLineRef.value) progressLineRef.value.style.width = '100%'
    return
  }

  // Set initial state
  displayPercent.value = 0
  if (progressLineRef.value) progressLineRef.value.style.width = '0%'

  // IntersectionObserver to trigger animation once
  observer = new IntersectionObserver((entries) => {
    const [entry] = entries
    if (entry.isIntersecting) {
      animateTracker()
      if (observer && rootRef.value) observer.unobserve(rootRef.value)
    }
  }, { threshold: 0.25 })

  if (rootRef.value) observer.observe(rootRef.value)
})

async function animateTracker() {
  try {
    const { gsap } = await import('gsap')

    // Animate progress line width
    if (progressLineRef.value) {
      gsap.to(progressLineRef.value, {
        width: '100%',
        duration: 1.2,
        ease: 'power2.out'
      })
    }

    // Animate counter from 0 to 100
    const counterObj = { val: 0 }
    gsap.to(counterObj, {
      val: 100,
      duration: 1.2,
      ease: 'power2.out',
      onUpdate: () => {
        displayPercent.value = Math.round(counterObj.val)
      }
    })

    // Stagger milestone nodes
    const nodes = rootRef.value?.querySelectorAll('.mst-node')
    if (nodes && nodes.length > 0) {
      gsap.fromTo(nodes, 
        { opacity: 0, y: 12, scale: 0.8 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.12, ease: 'back.out(1.4)', delay: 0.2 }
      )
    }
  } catch {
    displayPercent.value = 100
    if (progressLineRef.value) progressLineRef.value.style.width = '100%'
  }
}

onBeforeUnmount(() => {
  if (observer && rootRef.value) {
    observer.unobserve(rootRef.value)
    observer.disconnect()
  }
})
</script>

<template>
  <div ref="rootRef" class="mst-wrapper">
    <!-- Header: Title + Completion Statistics -->
    <div class="mst-header">
      <div class="mst-header__info">
        <span class="mst-badge">CAPSTONE PHASE 1</span>
        <h3 class="mst-title">Semester 1 Milestone Execution</h3>
        <p class="mst-caption">Multi-domain velocity tracking across core capstone engineering workstreams.</p>
      </div>

      <div class="mst-header__metrics">
        <div class="mst-stat">
          <div class="mst-stat__num">{{ displayPercent }}<span class="mst-stat__pct">%</span></div>
          <div class="mst-stat__label">Semester 1 Complete</div>
        </div>
        <div class="mst-phase-badge">
          <span class="mst-phase-dot" aria-hidden="true" />
          <span>Overall Capstone: Phase 1 of 2 Complete (50%)</span>
        </div>
      </div>
    </div>

    <!-- Horizontal Milestone Track -->
    <div class="mst-track-container" role="region" aria-label="Semester 1 milestones horizontal timeline">
      <div class="mst-track-rail">
        <div class="mst-track-bg" />
        <div ref="progressLineRef" class="mst-track-fill" />
      </div>

      <div class="mst-nodes">
        <button
          v-for="(m, i) in milestones"
          :key="m.id"
          type="button"
          class="mst-node"
          :class="{ 'is-active': activeIndex === i }"
          :aria-selected="activeIndex === i"
          :aria-label="`${m.code}: ${m.title} (100% Complete)`"
          @mouseenter="selectMilestone(i)"
          @click="selectMilestone(i)"
        >
          <div class="mst-node__indicator">
            <span class="mst-node__check">✓</span>
          </div>
          <div class="mst-node__meta">
            <span class="mst-node__code">{{ m.code }}</span>
            <span class="mst-node__name">{{ m.shortTitle }}</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Active Milestone Detail Card -->
    <div class="mst-detail-card">
      <div class="mst-detail__head">
        <div class="mst-detail__tags">
          <span class="mst-detail__workstream">{{ milestones[activeIndex].workstream }}</span>
          <span class="mst-detail__period">{{ milestones[activeIndex].period }}</span>
        </div>
        <span class="mst-detail__status">100% Satisfied for Interim Review</span>
      </div>

      <h4 class="mst-detail__title">{{ milestones[activeIndex].title }}</h4>
      <p class="mst-detail__lead"><strong>Engineering Lead:</strong> {{ milestones[activeIndex].lead }}</p>
      <p class="mst-detail__desc">{{ milestones[activeIndex].description }}</p>

      <div class="mst-detail__deliverables">
        <span class="mst-deliverables__label">Key Deliverables:</span>
        <ul>
          <li v-for="(d, idx) in milestones[activeIndex].deliverables" :key="idx">{{ d }}</li>
        </ul>
      </div>
    </div>

    <!-- Footer Summary Legend -->
    <div class="mst-footer">
      <div class="mst-legend">
        <span class="mst-legend__item"><i class="mst-dot is-done" /> All 6 Phase 1 Milestones Achieved</span>
        <span class="mst-legend__sep">·</span>
        <span class="mst-legend__item"><i class="mst-dot is-next" /> Semester 2 Hardware Integration Upcoming</span>
      </div>
      <div class="mst-footer__action">
        <span class="mst-hint">Hover or tap any milestone to inspect deliverables</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mst-wrapper {
  margin: 20px 0 32px;
  padding: clamp(20px, 3.2vw, 32px);
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 16px 40px -12px rgba(0, 0, 0, 0.4);
}

.mst-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.mst-header__info {
  flex: 1 1 340px;
}

.mst-badge {
  display: inline-block;
  margin-bottom: 10px;
  font-family: var(--ov-sans);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--ov-bronze, #e9a35c);
}

.mst-title {
  margin: 0 0 6px !important;
  padding: 0 !important;
  border: 0 !important;
  font-family: var(--ov-display);
  font-size: clamp(22px, 2.5vw, 30px) !important;
  font-weight: 400 !important;
  line-height: 1.15 !important;
  color: var(--ov-ink, #f3eee7) !important;
}

.mst-caption {
  margin: 0 !important;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(243, 238, 231, 0.65);
}

.mst-header__metrics {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  text-align: right;
}

.mst-stat {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.mst-stat__num {
  font-family: var(--ov-display);
  font-size: clamp(38px, 4.5vw, 52px);
  line-height: 1;
  font-weight: 400;
  color: var(--ov-bronze, #e9a35c);
}

.mst-stat__pct {
  font-size: 0.65em;
  opacity: 0.85;
}

.mst-stat__label {
  font-family: var(--ov-sans);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(243, 238, 231, 0.85);
}

.mst-phase-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  font-size: 12px;
  color: rgba(243, 238, 231, 0.8);
}

.mst-phase-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #6f8fc9;
  box-shadow: 0 0 8px #6f8fc9;
}

/* Horizontal Track */
.mst-track-container {
  position: relative;
  margin: 36px 0 28px;
  padding: 20px 10px 0;
}

.mst-track-rail {
  position: relative;
  height: 4px;
  margin: 0 16px;
  border-radius: 999px;
}

.mst-track-bg {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 999px;
}

.mst-track-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 100%;
  background: linear-gradient(90deg, #c98a4b 0%, #e9a35c 50%, #81a0d8 100%);
  border-radius: 999px;
  box-shadow: 0 0 12px rgba(233, 163, 92, 0.4);
  transition: width 0.1s linear;
}

.mst-nodes {
  display: flex;
  justify-content: space-between;
  margin-top: -18px;
  position: relative;
}

.mst-node {
  background: transparent;
  border: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  text-align: center;
  width: min(100px, 15vw);
  transition: transform 0.25s ease;
  outline: none;
}

.mst-node:hover,
.mst-node.is-active {
  transform: translateY(-3px);
}

.mst-node__indicator {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #0f1016;
  border: 2px solid var(--ov-bronze, #e9a35c);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ov-bronze, #e9a35c);
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 0 10px rgba(233, 163, 92, 0.25);
  transition: border-color 0.25s, box-shadow 0.25s, background-color 0.25s;
}

.mst-node:hover .mst-node__indicator,
.mst-node.is-active .mst-node__indicator {
  background: rgba(233, 163, 92, 0.18);
  border-color: #ffd29c;
  box-shadow: 0 0 18px rgba(233, 163, 92, 0.55);
}

.mst-node.is-active .mst-node__indicator {
  border-color: #ffffff;
  color: #ffffff;
}

.mst-node__meta {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mst-node__code {
  font-family: var(--ov-sans);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.15em;
  color: var(--ov-bronze, #e9a35c);
}

.mst-node__name {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.25;
  color: rgba(243, 238, 231, 0.85);
  transition: color 0.25s;
}

.mst-node:hover .mst-node__name,
.mst-node.is-active .mst-node__name {
  color: #ffffff;
}

/* Detail Card */
.mst-detail-card {
  margin-top: 24px;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(233, 163, 92, 0.22);
  border-left: 3px solid var(--ov-bronze, #e9a35c);
  border-radius: 12px;
  transition: border-color 0.3s ease;
}

.mst-detail__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.mst-detail__tags {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mst-detail__workstream {
  font-family: var(--ov-sans);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ov-bronze, #e9a35c);
}

.mst-detail__period {
  font-size: 11.5px;
  color: rgba(243, 238, 231, 0.55);
}

.mst-detail__status {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  background: rgba(74, 126, 88, 0.15);
  border: 1px solid rgba(74, 126, 88, 0.35);
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 500;
  color: #8be0a4;
}

.mst-detail__title {
  margin: 0 0 6px !important;
  font-size: 18px !important;
  font-weight: 600 !important;
  color: var(--ov-ink, #f3eee7) !important;
}

.mst-detail__lead {
  margin: 0 0 10px !important;
  font-size: 13.5px !important;
  color: rgba(243, 238, 231, 0.75);
}

.mst-detail__desc {
  margin: 0 0 14px !important;
  font-size: 14.5px !important;
  line-height: 1.6;
  color: rgba(243, 238, 231, 0.88);
}

.mst-detail__deliverables {
  padding-top: 12px;
  border-top: 1px dashed rgba(255, 255, 255, 0.08);
}

.mst-deliverables__label {
  display: block;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(243, 238, 231, 0.55);
  margin-bottom: 6px;
}

.mst-detail__deliverables ul {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 4px;
}

.mst-detail__deliverables li {
  font-size: 13.5px;
  line-height: 1.5;
  color: rgba(243, 238, 231, 0.82);
}

.mst-detail__deliverables li::marker {
  color: var(--ov-bronze, #e9a35c);
}

/* Footer */
.mst-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 20px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 12.5px;
}

.mst-legend {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(243, 238, 231, 0.65);
}

.mst-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
}

.mst-dot.is-done {
  background: var(--ov-bronze, #e9a35c);
  box-shadow: 0 0 6px rgba(233, 163, 92, 0.4);
}

.mst-dot.is-next {
  background: #6f8fc9;
}

.mst-legend__sep {
  opacity: 0.3;
}

.mst-hint {
  font-style: italic;
  color: rgba(243, 238, 231, 0.45);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .mst-header__metrics {
    align-items: flex-start;
    text-align: left;
  }
  .mst-track-container {
    overflow-x: auto;
    padding-bottom: 12px;
    -webkit-overflow-scrolling: touch;
  }
  .mst-track-rail {
    width: 600px;
  }
  .mst-nodes {
    width: 600px;
  }
  .mst-node {
    width: 90px;
  }
}
</style>

