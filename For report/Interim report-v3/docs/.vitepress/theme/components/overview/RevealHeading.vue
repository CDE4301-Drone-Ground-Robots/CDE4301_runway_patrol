<script setup lang="ts">
/**
 * Per-character blur-up heading (stagger 0.035 s, blur 12 px, rise 50 px — brief reference values).
 * Server-rendered fully visible; on the client the characters are hidden only once GSAP is ready,
 * so the text never disappears without JS. Screen readers get the whole string via aria-label.
 * `active` controls the reveal when given (cinematic chapters); otherwise it reveals on scroll entry.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

// `active: undefined` must be an explicit default: Vue casts an absent boolean prop to `false`,
// which would make every scroll-revealed heading look like a never-activated controlled one.
const props = withDefaults(defineProps<{ text: string; as?: string; active?: boolean; delay?: number }>(), {
  as: 'h2',
  delay: 0,
  active: undefined
})
const el = ref<HTMLElement>()
const words = computed(() => props.text.split(' ').map((w) => [...w]))
let gsap: typeof import('gsap').gsap | undefined
let io: IntersectionObserver | undefined
let shown = false
let reduced = false

function chars() {
  return el.value ? [...el.value.querySelectorAll<HTMLElement>('.rh-char')] : []
}
function hide() {
  gsap?.set(chars(), { opacity: 0, y: 50, filter: 'blur(12px)' })
  shown = false
}
function reveal() {
  if (!gsap || shown) return
  shown = true
  gsap.to(chars(), { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out', stagger: 0.035, delay: props.delay, overwrite: true })
}
function conceal() {
  if (!gsap || !shown) return
  shown = false
  gsap.to(chars(), { opacity: 0, y: -24, filter: 'blur(8px)', duration: 0.35, ease: 'power2.in', stagger: 0.008, overwrite: true })
}

onMounted(async () => {
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) return
  gsap = (await import('gsap')).gsap
  if (!el.value) return
  if (props.active === undefined) {
    hide()
    io = new IntersectionObserver(([e]) => e.isIntersecting && (reveal(), io?.disconnect()), { threshold: 0.4 })
    io.observe(el.value)
  } else {
    hide()
    if (props.active) reveal()
  }
})
watch(
  () => props.active,
  (a) => {
    if (a === undefined || reduced) return
    a ? reveal() : conceal()
  }
)
onBeforeUnmount(() => {
  io?.disconnect()
  gsap?.killTweensOf(chars())
})
</script>

<template>
  <component :is="as" ref="el" class="rh" :aria-label="text">
    <span v-for="(w, wi) in words" :key="wi" class="rh-word" aria-hidden="true"
      ><span v-for="(c, ci) in w" :key="ci" class="rh-char">{{ c }}</span
      ><span v-if="wi < words.length - 1" class="rh-space">&nbsp;</span></span
    >
  </component>
</template>
