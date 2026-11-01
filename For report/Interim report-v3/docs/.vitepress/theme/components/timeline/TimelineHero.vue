<script setup lang="ts">
/**
 * Timeline section 01: full-bleed FOD Hunter render (the approved CAD visualisation also used by the Overview),
 * editorial heading, and a live line from project start to project end with the visitor's date on it.
 *
 * Dates come only from data/schedule.ts (the schedule JSON). "Today" is computed in the browser after mount, so
 * the server-rendered page never bakes in a build date; it re-checks at local midnight and when the tab returns.
 * Scroll transition: one GSAP ScrollTrigger (scrub) over the hero's own height — no pinning, no extra track.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { breakSpan, elapsed, fmt, fmtLong, localToday, project, semesters, weekAt } from '../../data/schedule'

const emit = defineEmits<{ explore: [] }>()
const root = ref<HTMLElement>()
const today = ref<number | null>(null)

const len = project ? project.end - project.start : 0
/** % position of a day on the line (same formula as the elapsed percentage, so the marker and number agree) */
const at = (day: number) => (project && len > 0 ? Math.min(100, Math.max(0, ((day - project.start) / len) * 100)) : 0)
const segments = computed(() => {
  if (!project) return []
  const out: { cls: string; label: string; from: number; to: number; title: string }[] = []
  if (semesters.s1) out.push({ cls: 's1', label: 'Semester 1', from: at(semesters.s1.start), to: at(semesters.s1.end), title: `Semester 1: ${fmt(semesters.s1.start)} – ${fmt(semesters.s1.end)}` })
  if (breakSpan) out.push({ cls: 'brk', label: 'Break', from: at(semesters.s1!.end), to: at(semesters.s2!.start), title: `Reading, exams and vacation: ${fmt(breakSpan.start)} – ${fmt(breakSpan.end)}` })
  if (semesters.s2) out.push({ cls: 's2', label: 'Semester 2', from: at(semesters.s2.start), to: at(semesters.s2.end), title: `Semester 2: ${fmt(semesters.s2.start)} – ${fmt(semesters.s2.end)}` })
  return out
})
const state = computed(() => (today.value == null ? null : elapsed(today.value)))
const pctText = computed(() => (state.value && state.value.state !== 'invalid' ? `${Math.floor(state.value.pct)}%` : '—'))
const note = computed(() => {
  const s = state.value?.state
  if (s === 'before') return 'The project has not started yet'
  if (s === 'after') return 'The scheduled project period has ended'
  if (s === 'invalid') return 'Project dates are unavailable'
  const w = today.value != null ? weekAt(today.value) : null
  return w ? w.code.replace('Wk', 'Week ').replace('Exam Week', 'Exam week') : 'Between scheduled weeks'
})
const markerAt = computed(() => (today.value == null ? 0 : at(today.value)))

let timer: ReturnType<typeof setTimeout> | undefined
function tick() {
  today.value = localToday()
  clearTimeout(timer)
  const now = new Date()
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1)
  timer = setTimeout(tick, Math.min(midnight.getTime() - now.getTime(), 6 * 3600_000))
}
const onVisible = () => document.visibilityState === 'visible' && tick()

let ctx: { revert: () => void } | undefined
onMounted(async () => {
  tick()
  document.addEventListener('visibilitychange', onVisible)
  const el = root.value
  if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
  gsap.registerPlugin(ScrollTrigger)
  ctx = gsap.context(() => {
    // entrance: heading lines rise, the line draws to today
    gsap.from(el.querySelectorAll('.tlh__reveal'), { y: 28, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.09, delay: 0.1 })
    gsap.from(el.querySelector('.tlh__fill'), { scaleX: 0, duration: 1.6, ease: 'power2.out', delay: 0.5 })
    // leaving: the render drifts and darkens into the page, the heading lifts away; the date line stays readable
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: 0.6 } })
    tl.to(el.querySelector('.tlh__img'), { yPercent: 9, scale: 1.05, ease: 'none' }, 0)
      .to(el.querySelector('.tlh__dim'), { opacity: 1, ease: 'none' }, 0)
      .to(el.querySelector('.tlh__copy'), { y: -90, opacity: 0.15, ease: 'none' }, 0)
      .to(el.querySelector('.tlh__line'), { y: -30, ease: 'none' }, 0)
  }, el)
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  document.removeEventListener('visibilitychange', onVisible)
  ctx?.revert()
})
</script>

<template>
  <section ref="root" class="tlh" aria-labelledby="tlh-title">
    <div class="tlh__media" aria-hidden="true">
      <img
        class="tlh__img"
        :src="withBase('/assets/images/overview/fod-hunter-render-1536.webp')"
        :srcset="`${withBase('/assets/images/overview/fod-hunter-render-960.webp')} 960w, ${withBase('/assets/images/overview/fod-hunter-render-1536.webp')} 1536w`"
        sizes="(max-width: 767px) 160vw, 82vw"
        width="1536"
        height="1024"
        alt=""
        fetchpriority="high"
        decoding="async"
      />
      <span class="tlh__shade" />
      <span class="tlh__dim" />
    </div>

    <div class="tlh__copy">
      <p class="tlh__kicker tlh__reveal">Project Timeline</p>
      <h1 id="tlh-title" class="tlh__title">
        <span class="tlh__reveal">From Concept</span>
        <span class="tlh__reveal">to Autonomy</span>
      </h1>
      <p class="tlh__lede tlh__reveal">The development journey of FOD Hunter.</p>
      <p class="tlh__caption tlh__reveal">Photorealistic visualisation of the final FOD Hunter CAD design.</p>
    </div>

    <div class="tlh__line" role="group" aria-label="Project time line">
      <div class="tlh__ends">
        <p>
          <span class="tlh__label">Project start</span>
          <span class="tlh__date">{{ project ? fmt(project.start) : '(To Be Filled)' }}</span>
        </p>
        <p class="tlh__end">
          <span class="tlh__label">Project end</span>
          <span class="tlh__date">{{ project ? fmt(project.end) : '(To Be Filled)' }}</span>
        </p>
      </div>
      <div class="tlh__track">
        <span
          v-for="s in segments"
          :key="s.cls"
          class="tlh__seg"
          :class="`tlh__seg--${s.cls}`"
          :style="{ left: `${s.from}%`, width: `${s.to - s.from}%` }"
          :title="s.title"
        >
          <span class="tlh__seglabel">{{ s.label }}</span>
        </span>
        <span v-if="semesters.s2" class="tlh__tick" :style="{ left: `${at(semesters.s2.start)}%` }" :title="`Semester 2 begins ${fmt(semesters.s2.start)}`" />
        <span v-if="state" class="tlh__fill" :style="{ width: `${markerAt}%` }" />
        <span
          v-if="state && state.state !== 'invalid'"
          class="tlh__marker"
          :class="{ 'is-edge': state.state !== 'during' }"
          :style="{ left: `${markerAt}%` }"
        />
      </div>
      <div class="tlh__now" :style="{ '--x': `${markerAt}%` }" aria-live="polite">
        <template v-if="state">
          <span class="tlh__label">Current date</span>
          <span class="tlh__date">
            <time :datetime="today != null ? new Date(today * 86400000).toISOString().slice(0, 10) : undefined" :aria-label="today != null ? fmtLong(today) : undefined">{{ fmt(today!) }}</time>
            <span class="tlh__week"> · {{ note }}</span>
          </span>
          <span class="tlh__pct"><strong>{{ pctText }}</strong> of project time elapsed</span>
        </template>
        <span v-else class="tlh__label">Current date</span>
      </div>
    </div>

    <button type="button" class="tlh__explore" @click="emit('explore')">
      Scroll to explore <span aria-hidden="true">↓</span>
    </button>
  </section>
</template>
