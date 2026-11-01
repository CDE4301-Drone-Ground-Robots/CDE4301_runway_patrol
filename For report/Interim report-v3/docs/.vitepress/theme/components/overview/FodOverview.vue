<script setup lang="ts">
/**
 * Overview §00: the cinematic FOD Hunter introduction (the sticky stage is confined to its
 * own section). The rest of the Overview is composed in docs/index.md; the full engineering report has
 * its own page (docs/report.md). The 3D stage is provided by the page (provideFodStage) and shared with
 * the Explore FOD Hunter viewer. The rise-in observer also covers the Overview sections below.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import CinematicStage from './CinematicStage.vue'
import CursorRings from './CursorRings.vue'
import { data as reportOutline } from '../report/report.data'

const root = ref<HTMLElement>()
let io: IntersectionObserver | undefined

onMounted(() => {
  // The full report lives at /report: keep old shared links such as /#mechanical working.
  const id = decodeURIComponent(location.hash.slice(1))
  if (id && !document.getElementById(id) && reportOutline.headings.some((h) => h.id === id)) {
    location.replace(withBase('/report') + location.hash)
    return
  }
  // Gentle rise-in for Overview blocks; skipped entirely under reduced motion (content always visible).
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !root.value) return
  const items = document.querySelectorAll<HTMLElement>('.ov-reveal, .ovx-head')
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        e.target.classList.add('is-in')
        io?.unobserve(e.target)
      }
    },
    { rootMargin: '0px 0px -10% 0px' }
  )
  items.forEach((el) => {
    if (el.getBoundingClientRect().top > innerHeight) {
      el.classList.add('is-pending')
      io!.observe(el)
    }
  })
})
onBeforeUnmount(() => io?.disconnect())
</script>

<template>
  <div ref="root" class="fod-overview">
    <CursorRings />

    <!-- A. cinematic introduction -->
    <CinematicStage />

  </div>
</template>
