import { onMounted, onUnmounted, readonly, ref } from 'vue'

/**
 * Decides whether SVG-displacement refraction (liquid-glass-vue's GlassFilter) may run.
 *
 * The glass look is always on (there is no on/off toggle). Refraction is an enhancement on top
 * of it: every glass surface already renders a CSS backdrop-filter version during SSR, so returning false
 * never breaks layout. Refraction is skipped automatically when:
 *  - the engine is not Chromium (Safari/Firefox ignore url() in backdrop pipelines),
 *  - the user prefers reduced motion or reduced transparency,
 *  - the primary pointer is coarse (phones/tablets: protect GPU and battery).
 * Those devices get the translucent backdrop-filter glass instead.
 */
const supported = ref(false)
const refract = ref(false)
let listeners = 0
const queries: MediaQueryList[] = []

function isChromium() {
  const uaData = (navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } }).userAgentData
  if (uaData?.brands) return uaData.brands.some((b) => /Chromium/i.test(b.brand))
  // Safari and Firefox expose no userAgentData and no "Chrome/" token.
  return /Chrome\//.test(navigator.userAgent)
}

function evaluate() {
  const blocked = queries.some((q) => q.matches)
  supported.value = isChromium() && !blocked
  refract.value = supported.value
  document.documentElement.classList.toggle('lg-refract', refract.value)
}

export function useGlassCapability() {
  onMounted(() => {
    if (listeners++ === 0) {
      // the retired toolbar stored an on/off choice; it no longer applies
      try {
        localStorage.removeItem('fod-hunter:glass-refraction')
      } catch {
        /* storage unavailable */
      }
      for (const q of ['(prefers-reduced-motion: reduce)', '(prefers-reduced-transparency: reduce)', '(pointer: coarse)']) {
        const mq = window.matchMedia(q)
        mq.addEventListener('change', evaluate)
        queries.push(mq)
      }
      evaluate()
    }
  })
  onUnmounted(() => {
    if (--listeners === 0) {
      queries.splice(0).forEach((mq) => mq.removeEventListener('change', evaluate))
    }
  })
  return { refract: readonly(refract), supported: readonly(supported) }
}
