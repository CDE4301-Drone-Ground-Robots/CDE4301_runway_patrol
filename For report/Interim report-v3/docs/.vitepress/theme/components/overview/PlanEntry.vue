<script setup lang="ts">
/**
 * PlanEntry: Level 1 Member Accordion item with GSAP animated disclosure.
 * Houses the Level 2 technical work packages composed from canonical member Markdown.
 */
import { ref, computed, inject, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { withBase } from 'vitepress'

interface PlanAccordionContext {
  activeId: { value: string | null }
  toggle: (id: string) => void
  isReducedMotion: { value: boolean }
}

const props = defineProps<{
  index: string
  name: string
  role?: string
  preview?: string
  docs: string
  plan: string
}>()

const accordion = inject<PlanAccordionContext | null>('planAccordion', null)
const localOpen = ref(false)

const isOpen = computed(() => {
  return accordion ? accordion.activeId.value === props.index : localOpen.value
})

const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const isReducedMotion = computed(() => accordion?.isReducedMotion.value ?? false)

let gsapInstance: typeof import('gsap').gsap | null = null

onMounted(async () => {
  if (typeof window !== 'undefined' && !isReducedMotion.value) {
    const { gsap } = await import('gsap')
    gsapInstance = gsap
  }

  // Ensure initial SSR state is cleanly applied
  if (panelRef.value && !isOpen.value) {
    panelRef.value.style.display = 'none'
    panelRef.value.style.height = '0px'
    panelRef.value.style.opacity = '0'
  }
})

watch(isOpen, async (open) => {
  await nextTick()
  const panel = panelRef.value
  const root = rootRef.value
  if (!panel) return

  if (isReducedMotion.value || !gsapInstance) {
    panel.style.display = open ? 'block' : 'none'
    panel.style.height = open ? 'auto' : '0px'
    panel.style.opacity = open ? '1' : '0'
    if (open && root) {
      root.scrollIntoView({ behavior: 'auto', block: 'nearest' })
    }
    return
  }

  gsapInstance.killTweensOf(panel)

  if (open) {
    // Preserve scroll position gracefully when switching between members
    const initialTop = root?.getBoundingClientRect().top ?? 0

    panel.style.display = 'block'
    panel.style.height = 'auto'
    const targetHeight = panel.scrollHeight
    panel.style.height = '0px'
    panel.style.opacity = '0'

    gsapInstance.fromTo(
      panel,
      { height: 0, opacity: 0 },
      {
        height: targetHeight,
        opacity: 1,
        duration: 0.4,
        ease: 'power2.inOut',
        onComplete: () => {
          if (panel) panel.style.height = 'auto'

          // Level 2 technical work packages reveal animation
          const cards = panel.querySelectorAll<HTMLElement>('.details.custom-block')
          if (cards.length > 0 && gsapInstance) {
            gsapInstance.fromTo(
              cards,
              { opacity: 0, y: 12 },
              {
                opacity: 1,
                y: 0,
                duration: 0.36,
                stagger: 0.06,
                ease: 'power2.out',
                overwrite: 'auto'
              }
            )
          }
        }
      }
    )

    // Smooth viewport adjustment if member moved significantly off screen
    setTimeout(() => {
      if (root) {
        const currentTop = root.getBoundingClientRect().top
        if (Math.abs(currentTop - initialTop) > 40 && currentTop < 80) {
          root.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      }
    }, 50)
  } else {
    const currentHeight = panel.scrollHeight
    panel.style.height = `${currentHeight}px`

    gsapInstance.to(panel, {
      height: 0,
      opacity: 0,
      duration: 0.35,
      ease: 'power2.inOut',
      onComplete: () => {
        if (panel) {
          panel.style.display = 'none'
          panel.style.height = '0px'
        }
      }
    })
  }
})

function handleToggle() {
  if (accordion) {
    accordion.toggle(props.index)
  } else {
    localOpen.value = !localOpen.value
  }
}

onBeforeUnmount(() => {
  if (panelRef.value && gsapInstance) {
    gsapInstance.killTweensOf(panelRef.value)
  }
})
</script>

<template>
  <article
    ref="rootRef"
    class="plan-item"
    :class="{ 'is-open': isOpen }"
    :id="`plan-member-${index}`"
  >
    <div class="plan-item__divider" aria-hidden="true" />

    <h3 class="plan-item__heading">
      <button
        :id="`plan-btn-${index}`"
        type="button"
        class="plan-item__btn"
        :aria-expanded="isOpen"
        :aria-controls="`plan-panel-${index}`"
        @click="handleToggle"
      >
        <div class="plan-item__header-left">
          <span class="plan-item__num">{{ index }}</span>
          <div class="plan-item__meta">
            <span class="plan-item__name">{{ name }}</span>
            <span v-if="role" class="plan-item__role">{{ role }}</span>
            <p v-if="preview" class="plan-item__preview" :class="{ 'is-collapsed-only': isOpen }">
              {{ preview }}
            </p>
          </div>
        </div>

        <div class="plan-item__action">
          <span class="plan-item__icon" aria-hidden="true" />
        </div>
      </button>
    </h3>

    <div
      :id="`plan-panel-${index}`"
      ref="panelRef"
      class="plan-item__panel"
      role="region"
      :aria-labelledby="`plan-btn-${index}`"
      :inert="!isOpen || undefined"
    >
      <div class="plan-item__inner">
        <div class="plan-item__body ov-md">
          <slot />
        </div>

        <footer class="plan-item__footer">
          <a class="plan-item__doc-link" :href="withBase(docs)">
            <span>View Original Documentation</span>
            <svg class="plan-item__arrow" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </a>
          <a v-if="plan" class="plan-item__plan-link" :href="withBase(plan)">
            <span>View Full Plan Page</span>
            <svg class="plan-item__arrow" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </a>
        </footer>
      </div>
    </div>
  </article>
</template>

<style>
/* Base member row styling */
.plan-item {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s ease;
}

.plan-item__divider {
  width: 100%;
  height: 1px;
  background: rgba(255, 255, 255, 0.09);
  transition: background 0.4s ease;
}

.plan-item.is-open .plan-item__divider {
  background: linear-gradient(90deg, rgba(233, 163, 92, 0.7) 0%, rgba(233, 163, 92, 0.25) 55%, rgba(255, 255, 255, 0.08) 100%);
}

.plan-item__heading {
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
}

.plan-item__btn {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  padding: clamp(26px, 3.2vw, 38px) clamp(8px, 1.5vw, 20px);
  background: transparent;
  border: 0;
  cursor: pointer;
  text-align: left;
  border-radius: 8px;
  transition: background-color 0.25s ease;
}

.plan-item__btn:hover {
  background-color: rgba(255, 255, 255, 0.02);
}

.plan-item__btn:focus-visible {
  outline: 2px solid var(--ov-amber);
  outline-offset: -2px;
}

.plan-item__header-left {
  display: flex;
  align-items: flex-start;
  gap: clamp(16px, 2.5vw, 36px);
  flex: 1;
  min-width: 0;
}

.plan-item__num {
  font-family: var(--ov-sans);
  font-size: clamp(14px, 1.2vw, 17px);
  font-weight: 600;
  letter-spacing: 0.16em;
  color: var(--ov-amber);
  width: clamp(28px, 2.5vw, 40px);
  flex-shrink: 0;
  margin-top: 5px;
}

.plan-item__meta {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.plan-item__name {
  font-family: var(--ov-display);
  font-size: clamp(26px, 3vw, 40px);
  font-weight: 400;
  line-height: 1.1;
  letter-spacing: 0.015em;
  color: var(--ov-ink);
  text-transform: uppercase;
  transition: color 0.25s ease;
}

.plan-item__btn:hover .plan-item__name {
  color: #fff;
}

.plan-item.is-open .plan-item__name {
  color: #fff;
}

.plan-item__role {
  margin: 6px 0 0 0;
  font-family: var(--ov-sans);
  font-size: clamp(11px, 0.9vw, 12px);
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ov-amber);
  opacity: 0.92;
}

.plan-item__preview {
  margin: 10px 0 0 0 !important;
  font-family: var(--ov-sans);
  font-size: 15px !important;
  line-height: 1.6 !important;
  color: var(--ov-ink-2) !important;
  max-width: 68ch;
  transition: opacity 0.3s ease;
}

.plan-item__preview.is-collapsed-only {
  display: block;
}

.plan-item__action {
  margin-left: 20px;
  flex-shrink: 0;
  margin-top: 4px;
}

/* Plus to minus rotating indicator */
.plan-item__icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.025);
  color: var(--ov-ink);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.25s ease,
              background-color 0.25s ease,
              color 0.25s ease;
}

.plan-item__btn:hover .plan-item__icon {
  border-color: rgba(233, 163, 92, 0.5);
  background: rgba(233, 163, 92, 0.08);
  color: var(--ov-amber);
}

.plan-item.is-open .plan-item__icon {
  transform: rotate(45deg);
  border-color: var(--ov-amber);
  background: rgba(233, 163, 92, 0.16);
  color: var(--ov-amber);
}

.plan-item__icon::before,
.plan-item__icon::after {
  content: '';
  position: absolute;
  background-color: currentColor;
  border-radius: 2px;
}

.plan-item__icon::before {
  width: 14px;
  height: 1.5px;
}

.plan-item__icon::after {
  width: 1.5px;
  height: 14px;
}

/* Panel content */
.plan-item__panel {
  overflow: hidden;
  will-change: height, opacity;
}

.plan-item__inner {
  padding: 8px clamp(8px, 1.5vw, 20px) clamp(36px, 4vw, 54px) clamp(44px, 4.5vw, 76px);
}

.plan-item__body {
  width: 100%;
}

/* Level 2 Work Package Card styling */
.plan-item__body .details.custom-block {
  margin: 16px 0 !important;
  padding: 0 !important;
  background: rgba(255, 255, 255, 0.02) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 12px !important;
  overflow: hidden;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: border-color 0.25s ease, background-color 0.25s ease, box-shadow 0.25s ease;
}

.plan-item__body .details.custom-block:hover {
  border-color: rgba(233, 163, 92, 0.35) !important;
  background: rgba(233, 163, 92, 0.03) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

.plan-item__body .details.custom-block[open] {
  border-color: rgba(233, 163, 92, 0.45) !important;
  background: rgba(18, 16, 15, 0.7) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
}

.plan-item__body .details.custom-block > summary {
  margin: 0 !important;
  padding: 18px 22px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  font-family: var(--ov-sans) !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  letter-spacing: 0.03em !important;
  color: var(--ov-ink) !important;
  cursor: pointer !important;
  user-select: none;
  list-style: none !important;
  outline: none;
  transition: color 0.25s ease, background-color 0.25s ease;
}

.plan-item__body .details.custom-block > summary::-webkit-details-marker {
  display: none !important;
}

.plan-item__body .details.custom-block > summary:hover {
  color: var(--ov-amber) !important;
}

.plan-item__body .details.custom-block > summary:focus-visible {
  outline: 2px solid var(--ov-amber) !important;
  outline-offset: -2px;
}

.plan-item__body .details.custom-block > summary::after {
  content: '';
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background-color: rgba(255, 255, 255, 0.04);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23e9a35c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='12' y1='5' x2='12' y2='19'%3E%3C/line%3E%3Cline x1='5' y1='12' x2='19' y2='12'%3E%3C/line%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 12px;
  flex-shrink: 0;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease, background-color 0.25s ease;
}

.plan-item__body .details.custom-block:hover > summary::after {
  border-color: var(--ov-amber);
  background-color: rgba(233, 163, 92, 0.1);
}

.plan-item__body .details.custom-block[open] > summary {
  color: var(--ov-amber) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.plan-item__body .details.custom-block[open] > summary::after {
  transform: rotate(45deg);
  border-color: var(--ov-amber);
  background-color: rgba(233, 163, 92, 0.18);
}

.plan-item__body .details.custom-block > :not(summary) {
  padding-left: 22px;
  padding-right: 22px;
}

.plan-item__body .details.custom-block > :not(summary):first-of-type {
  margin-top: 18px !important;
}

.plan-item__body .details.custom-block > :not(summary):last-child {
  margin-bottom: 22px !important;
}

/* Footer links */
.plan-item__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: clamp(16px, 2vw, 28px);
  margin-top: clamp(24px, 3vw, 36px);
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.plan-item__doc-link,
.plan-item__plan-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--ov-sans);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  text-decoration: none;
  transition: color 0.2s ease, transform 0.2s ease;
}

.plan-item__doc-link {
  color: var(--ov-amber);
}

.plan-item__doc-link:hover {
  color: #fff;
  transform: translateX(2px);
}

.plan-item__plan-link {
  color: var(--ov-ink-2);
}

.plan-item__plan-link:hover {
  color: var(--ov-ink);
  transform: translateX(2px);
}

.plan-item__arrow {
  transition: transform 0.2s ease;
}

.plan-item__doc-link:hover .plan-item__arrow,
.plan-item__plan-link:hover .plan-item__arrow {
  transform: translate(2px, -2px);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .plan-item__btn {
    padding: 22px 0;
  }
  .plan-item__header-left {
    gap: 14px;
  }
  .plan-item__num {
    width: 22px;
  }
  .plan-item__inner {
    padding: 6px 0 28px 0;
  }
  .plan-item__icon {
    width: 32px;
    height: 32px;
  }
  .plan-item__footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .plan-item,
  .plan-item__divider,
  .plan-item__btn,
  .plan-item__name,
  .plan-item__icon,
  .plan-item__icon::after,
  .plan-item__panel,
  .plan-item__body .details.custom-block,
  .plan-item__body .details.custom-block > summary::after {
    transition: none !important;
    animation: none !important;
  }
}
</style>
