<script setup lang="ts">
/**
 * Engineering Roadmap (Overview §04), in the report rail's Roadmap Ascent language: a spine fills with
 * real scroll progress through the milestones, the milestone being read lights up, completed ones stay
 * warm, and each rail entry jumps to its milestone. Native scrolling throughout — nothing is pinned.
 * Milestone bodies are slotted <RoadmapMilestone> blocks whose text is composed from canonical Markdown.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { goToSection } from '../report/navigate'

const props = defineProps<{ items: { id: string; title: string }[] }>()
const active = ref(-1)
const fill = ref(0) // 0..1 along the rail
const root = ref<HTMLElement>()
let raf = 0

function measure() {
  raf = 0
  const els = props.items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[]
  if (!els.length) return
  const line = innerHeight * 0.45
  let cur = -1
  els.forEach((el, i) => el.getBoundingClientRect().top <= line && (cur = i))
  active.value = cur
  const first = els[0].getBoundingClientRect().top
  const lastEl = els[els.length - 1].getBoundingClientRect()
  const span = Math.max(1, lastEl.top + lastEl.height * 0.5 - first)
  fill.value = Math.min(1, Math.max(0, (line - first) / span))
}
const schedule = () => {
  if (!raf) raf = requestAnimationFrame(measure)
}
let io: IntersectionObserver | undefined
onMounted(() => {
  measure()
  addEventListener('scroll', schedule, { passive: true })
  addEventListener('resize', schedule, { passive: true })
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  // milestones rise into view once
  io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('is-in'), io?.unobserve(e.target))),
    { rootMargin: '0px 0px -12% 0px' }
  )
  root.value?.querySelectorAll('.rmap__item').forEach((el) => {
    if (el.getBoundingClientRect().top > innerHeight) {
      el.classList.add('is-pending')
      io!.observe(el)
    }
  })
})
onBeforeUnmount(() => {
  removeEventListener('scroll', schedule)
  removeEventListener('resize', schedule)
  if (raf) cancelAnimationFrame(raf)
  io?.disconnect()
})
</script>

<template>
  <div ref="root" class="rmap">
    <nav class="rmap__rail" aria-label="Engineering roadmap milestones">
      <div class="rmap__spine" aria-hidden="true"><span class="rmap__spine-fill" :style="{ transform: `scaleY(${fill})` }" /></div>
      <ol>
        <li v-for="(it, i) in items" :key="it.id" :class="{ 'is-active': active === i, 'is-done': active > i }">
          <a :href="`#${it.id}`" target="_self" :aria-current="active === i ? 'step' : undefined" @click="goToSection(it.id, $event)">
            <span class="rmap__dot" aria-hidden="true" />
            <span class="rmap__num">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="rmap__label">{{ it.title }}</span>
          </a>
        </li>
      </ol>
    </nav>
    <div class="rmap__items"><slot /></div>
  </div>
</template>
