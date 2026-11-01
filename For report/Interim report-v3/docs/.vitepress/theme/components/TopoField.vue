<script setup lang="ts">
/**
 * Homepage-only Three.js "topographic" line field (scene in topo-scene.ts). Cost controls:
 *  - one WebGL context site-wide (documentation pages never mount this),
 *  - capped at 30 fps, devicePixelRatio ≤ 1.5 (1 and fewer lines on coarse pointers),
 *  - stops rendering when the tab is hidden or the field has faded out on scroll,
 *  - reduced motion: one static frame, no loop,
 *  - full dispose (geometry, material, renderer, context) on unmount / route change.
 * three is loaded with a dynamic import, so it is never part of SSR or the docs-page bundle.
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'
import { ambient } from '../motion/tokens'

const canvas = ref<HTMLCanvasElement>()
const { isDark } = useData()
let cleanup: (() => void) | undefined
let setTheme: ((dark: boolean) => void) | undefined

onMounted(async () => {
  const { createTopoScene } = await import('./topo-scene')
  const el = canvas.value
  if (!el) return // unmounted while loading

  const coarse = window.matchMedia('(pointer: coarse)').matches
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const topo = createTopoScene({ canvas: el, coarse })
  setTheme = topo.setTheme
  topo.setTheme(isDark.value)

  const resize = () => topo.resize(window.innerWidth, window.innerHeight)
  resize()

  // Fade out with scroll (composite-only opacity); stop rendering once invisible.
  let visible = 1
  const onScroll = () => {
    visible = Math.max(0, 1 - window.scrollY / (window.innerHeight * 1.1))
    el.style.opacity = String(visible)
  }
  onScroll()

  let last = 0
  const frameMs = 1000 / ambient.maxFps
  const start = performance.now()
  const loop = (now: number) => {
    if (now - last < frameMs || visible < 0.02) return
    last = now
    topo.render(((now - start) / 1000) * ambient.topoSpeed * 10)
  }
  const play = () => topo.renderer.setAnimationLoop(document.hidden ? null : loop)

  if (reduced) topo.render(0)
  else play()

  const onVisibility = () => !reduced && play()
  // Repaint the static frame after a theme change when the loop is not running.
  setTheme = (dark) => {
    topo.setTheme(dark)
    if (reduced) topo.render(0)
  }
  window.addEventListener('resize', resize)
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('visibilitychange', onVisibility)
  el.classList.add('is-ready')

  cleanup = () => {
    window.removeEventListener('resize', resize)
    window.removeEventListener('scroll', onScroll)
    document.removeEventListener('visibilitychange', onVisibility)
    topo.dispose()
  }
})

watch(isDark, (d) => setTheme?.(d))
onBeforeUnmount(() => cleanup?.())
</script>

<template>
  <canvas ref="canvas" class="topo-field" aria-hidden="true" />
</template>
