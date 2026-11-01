<script setup lang="ts">
/**
 * PlanAccordion: Parent container coordinating the two-level Semester 2 Development Plans.
 * Enforces single-open behavior across members and manages GSAP ScrollTrigger entrance.
 */
import { ref, provide, onMounted, onBeforeUnmount } from 'vue'

const activeId = ref<string | null>(null)
const isReducedMotion = ref(false)
const root = ref<HTMLElement | null>(null)

let ctx: { revert: () => void } | undefined

function toggle(id: string) {
  if (activeId.value === id) {
    activeId.value = null
  } else {
    activeId.value = id
  }
}

provide('planAccordion', {
  activeId,
  toggle,
  isReducedMotion
})

onMounted(async () => {
  if (typeof window === 'undefined') return
  isReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const el = root.value
  if (!el || isReducedMotion.value) return

  const [{ gsap }, { ScrollTrigger }] = await Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger')
  ])
  gsap.registerPlugin(ScrollTrigger)

  ctx = gsap.context(() => {
    const items = el.querySelectorAll('.plan-item')
    if (items.length) {
      gsap.from(items, {
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true
        },
        y: 26,
        opacity: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: 'power2.out'
      })
    }
  }, el)
})

onBeforeUnmount(() => {
  ctx?.revert()
})
</script>

<template>
  <div ref="root" class="plan-accordion" role="region" aria-label="Semester 2 Member Development Plans">
    <slot />
  </div>
</template>

<style>
.plan-accordion {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: clamp(24px, 3vw, 40px);
}
</style>
