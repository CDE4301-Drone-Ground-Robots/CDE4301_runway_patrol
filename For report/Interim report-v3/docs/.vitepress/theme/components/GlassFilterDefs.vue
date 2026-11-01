<script setup lang="ts">
/**
 * Mounts liquid-glass-vue's <GlassFilter> SVG definitions once per page, client-side only,
 * and only when refraction is allowed (Chromium, fine pointer, no reduced motion/transparency,
 * viewer has not turned it off). Surfaces reference them with `filter: url(#lg-…)` from CSS.
 *
 * One definition serves surfaces of any size: when an SVG filter is applied to an HTML element,
 * its primitive percentages resolve against that element's own box, so the displacement map
 * (feImage width/height 100%) is stretched to whichever surface uses it.
 */
import { onBeforeUnmount, shallowRef, watch, type Component } from 'vue'
import { useGlassCapability } from '../composables/useGlassCapability'

const { refract } = useGlassCapability()
const GlassFilter = shallowRef<Component | null>(null)

/**
 * Refraction re-runs the SVG displacement filter every frame the backdrop moves. Measured on an
 * RTX 4060 (120 Hz) with a scripted homepage scroll: 62 fps with lenses on vs 114 fps with them
 * removed. So lenses fade out while the page scrolls
 * (html.lg-scrolling) and return 160 ms after scrolling stops; the CSS blur glass stays.
 */
let idleTimer = 0
function onScroll() {
  const root = document.documentElement
  if (!root.classList.contains('lg-scrolling')) root.classList.add('lg-scrolling')
  window.clearTimeout(idleTimer)
  idleTimer = window.setTimeout(() => root.classList.remove('lg-scrolling'), 160)
}
watch(
  refract,
  (on) => {
    if (typeof window === 'undefined') return
    if (on) window.addEventListener('scroll', onScroll, { passive: true })
    else window.removeEventListener('scroll', onScroll)
  },
  { immediate: true }
)
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.clearTimeout(idleTimer)
  document.documentElement.classList.remove('lg-scrolling')
})

// Strength per surface family: nav is wide and sits over the hero, so it bends gently;
// small floating controls can take a stronger lens.
const filters = [
  { id: 'lg-nav', scale: 34, aberration: 1.2 },
  { id: 'lg-control', scale: 56, aberration: 1.5 }
]

watch(
  refract,
  async (on) => {
    if (on && !GlassFilter.value) {
      const mod = await import('@wxperia/liquid-glass-vue')
      GlassFilter.value = mod.GlassFilter as Component
    }
  },
  { immediate: true }
)
</script>

<template>
  <div v-if="refract && GlassFilter" class="lg-defs" aria-hidden="true">
    <component
      :is="GlassFilter"
      v-for="f in filters"
      :id="f.id"
      :key="f.id"
      mode="standard"
      :displacement-scale="f.scale"
      :aberration-intensity="f.aberration"
      :width="1"
      :height="1"
    />
  </div>
</template>
