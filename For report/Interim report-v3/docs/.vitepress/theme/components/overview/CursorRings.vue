<script setup lang="ts">
/**
 * Double-ring cursor for fine pointers: the dot follows immediately, the ring trails (lerp 0.2) and
 * grows over interactive elements. Not mounted for touch/coarse pointers or reduced motion; the native
 * cursor is only hidden while this is active (html.fod-cursor).
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

const enabled = ref(false)
const dot = ref<HTMLElement>()
const ring = ref<HTMLElement>()
let raf = 0
const target = { x: -100, y: -100 }
const pos = { x: -100, y: -100 }
let hovering = false

function onMove(e: PointerEvent) {
  if (e.pointerType !== 'mouse') return
  target.x = e.clientX
  target.y = e.clientY
  if (dot.value) dot.value.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`
  const t = e.target as Element | null
  const over = !!t?.closest?.('a, button, [role="button"], summary, label, input, select, textarea, .fod-hotspot')
  if (over !== hovering) {
    hovering = over
    ring.value?.classList.toggle('is-hover', over)
  }
}
function loop() {
  raf = requestAnimationFrame(loop)
  pos.x += (target.x - pos.x) * 0.2
  pos.y += (target.y - pos.y) * 0.2
  if (ring.value) ring.value.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`
}
function onLeave() {
  target.x = target.y = -100
}

onMounted(() => {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!fine || reduced) return
  enabled.value = true
  document.documentElement.classList.add('fod-cursor')
  window.addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('pointerleave', onLeave)
  raf = requestAnimationFrame(loop)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('pointermove', onMove)
  document.removeEventListener('pointerleave', onLeave)
  document.documentElement.classList.remove('fod-cursor')
})
</script>

<template>
  <div v-if="enabled" class="fod-cursor-layer" aria-hidden="true">
    <div ref="ring" class="fod-cursor-ring" />
    <div ref="dot" class="fod-cursor-dot" />
  </div>
</template>
