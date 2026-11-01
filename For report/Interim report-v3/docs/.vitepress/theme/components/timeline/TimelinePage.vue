<script setup lang="ts">
/** Timeline page: exactly two sections — the cinematic hero and the interactive Gantt chart. */
import TimelineHero from './TimelineHero.vue'
import GanttChart from './GanttChart.vue'

/** Scroll to Explore: to the chart's heading, under the floating nav; focus follows for keyboard users */
function explore() {
  const el = document.getElementById('gantt')
  if (!el) return
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vp-nav-height')) || 64
  const top = el.getBoundingClientRect().top + scrollY - (innerWidth >= 960 ? nav : 0) - 8
  window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' })
  const h = el.querySelector<HTMLElement>('#tlg-title')
  if (h) {
    h.setAttribute('tabindex', '-1')
    h.focus({ preventScroll: true })
  }
}
</script>

<template>
  <div class="fod-timeline">
    <TimelineHero @explore="explore" />
    <GanttChart />
  </div>
</template>
