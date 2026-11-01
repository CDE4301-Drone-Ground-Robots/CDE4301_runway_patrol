<script setup lang="ts">
/**
 * Section 01: scroll-driven 360° orbit inside a sticky stage. The stage is released at the end of
 * its track, so the rest of the page scrolls normally (no pinning, no scroll hijacking: the track
 * is just a tall section and the stage uses `position: sticky`).
 *
 * The approved render shows immediately; the canvas fades in over it once the GLB is ready.
 * Reduced motion: the track collapses to one screen, the model stays at its opening pose and all
 * chapter texts are listed statically below the hero.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import RevealHeading from './RevealHeading.vue'
import { useFodStage } from './useFodStage'
import { chapters, hero } from '../../data/overview'

const stage = useFodStage()
const section = ref<HTMLElement>()

// Scroll to Discover: jump past the cinematic section to the Overview content that follows it
function discover() {
  const el = section.value
  if (!el) return
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: el.offsetTop + el.offsetHeight - 56, behavior: reduced ? 'auto' : 'smooth' })
}
const host = ref<HTMLElement>()
const progress = ref(0)
const reduced = ref(false)
const chapterIndex = computed(() => {
  let idx = -1
  chapters.forEach((c, i) => progress.value >= c.at - 0.07 && (idx = i))
  return idx
})
const heroActive = computed(() => progress.value < 0.12)
// Sequence number shown above each slide's kicker (hero = 01, chapters 02…); same numbering as 14.1.
const pad = (n: number) => String(n).padStart(2, '0')
const total = pad(chapters.length + 1)
const modelShown = computed(() => !reduced.value && stage.status.value === 'ready')
const dots = Array.from({ length: 14 }, (_, i) => ({ x: (i * 37) % 100, y: (i * 61) % 100, d: 14 + ((i * 7) % 11) }))

let unregister: (() => void) | undefined
let revert: (() => void) | undefined

onMounted(async () => {
  reduced.value = matchMedia('(prefers-reduced-motion: reduce)').matches
  // Reduced motion keeps the static reference render as the hero (no late crossfade, no orbit).
  // Push the model right on wide screens so the left column holds the typography.
  if (host.value && !reduced.value) unregister = stage.register('hero', host.value, 'orbit', () => (innerWidth >= 1100 ? 0.18 : 0))
  if (reduced.value || !section.value) return
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
  gsap.registerPlugin(ScrollTrigger)
  const st = ScrollTrigger.create({
    trigger: section.value,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      progress.value = self.progress
      stage.scene.value?.setProgress(self.progress)
    }
  })
  revert = () => st.kill()
})
onBeforeUnmount(() => {
  unregister?.()
  revert?.()
})
</script>

<template>
  <section ref="section" class="cine" :class="{ 'is-reduced': reduced }" aria-labelledby="cine-title">
    <div class="cine__stage">
      <img
        class="cine__fallback"
        :class="{ 'is-hidden': modelShown }"
        :src="withBase('/assets/images/overview/fod-hunter-render-1536.webp')"
        :srcset="`${withBase('/assets/images/overview/fod-hunter-render-960.webp')} 960w, ${withBase('/assets/images/overview/fod-hunter-render-1536.webp')} 1536w`"
        sizes="100vw"
        width="1536"
        height="1024"
        alt="Photorealistic render of the FOD Hunter autonomous ground vehicle on a dark runway"
        fetchpriority="high"
        decoding="async"
      />
      <div ref="host" class="cine__host" :class="{ 'is-shown': modelShown }" />
      <div class="cine__shade" aria-hidden="true" />

      <!-- technical grid -->
      <div class="cine__grid" aria-hidden="true">
        <span v-for="i in 5" :key="i" class="cine__vline" :style="{ left: `${(i - 1) * 25}%` }" />
        <span class="cine__hline" />
        <span v-for="(d, i) in dots" :key="`d${i}`" class="cine__dot" :style="{ left: `${d.x}%`, top: `${d.y}%`, animationDuration: `${d.d}s` }" />
      </div>

      <!-- story progress -->
      <div class="cine__progress" aria-hidden="true">
        <span class="cine__progress-fill" :style="{ transform: `scaleY(${progress})` }" />
        <span v-for="(c, i) in chapters" :key="i" class="cine__tick" :class="{ 'is-on': chapterIndex >= i }" :style="{ top: `${c.at * 100}%` }" />
      </div>

      <!-- hero -->
      <div class="cine__hero" :class="{ 'is-out': !heroActive && !reduced }">
        <p class="cine__count" aria-hidden="true"><span>01</span> / {{ total }}</p>
        <p class="cine__eyebrow">{{ hero.eyebrow }}</p>
        <RevealHeading id="cine-title" as="h1" class="cine__title" :text="hero.title" :active="heroActive" />
        <p class="cine__tagline">{{ hero.tagline }}</p>
        <p class="cine__desc">{{ hero.description }}</p>
        <span class="cine__scroll" aria-hidden="true"><span /></span>
      </div>

      <!-- always-available actions (any point of the cinematic scroll) -->
      <a class="cine__report" :href="withBase('/report')">Read full report <span aria-hidden="true">↗</span></a>
      <button type="button" class="cine__discover" @click="discover">Scroll to discover <span aria-hidden="true">↓</span></button>

      <!-- chapters -->
      <div v-if="!reduced" class="cine__chapters">
        <article v-for="(c, i) in chapters" :key="c.title" class="cine__chapter" :class="{ 'is-active': chapterIndex === i }" :aria-hidden="chapterIndex !== i">
          <p class="cine__count" aria-hidden="true"><span>{{ pad(i + 2) }}</span> / {{ total }}</p>
          <p class="cine__kicker">{{ c.kicker }}</p>
          <RevealHeading as="h2" class="cine__chapter-title" :text="c.title" :active="chapterIndex === i" />
          <p class="cine__chapter-body">{{ c.body }}</p>
          <p class="cine__source">{{ c.source }}</p>
        </article>
      </div>
    </div>

    <!-- static chapter list for reduced motion -->
    <div v-if="reduced" class="cine__static">
      <article v-for="c in chapters" :key="c.title">
        <p class="cine__kicker">{{ c.kicker }}</p>
        <h2 class="cine__chapter-title">{{ c.title }}</h2>
        <p class="cine__chapter-body">{{ c.body }}</p>
        <p class="cine__source">{{ c.source }}</p>
      </article>
    </div>
  </section>
</template>
