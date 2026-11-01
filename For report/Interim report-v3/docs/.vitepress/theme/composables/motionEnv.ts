import { onBeforeUnmount, onMounted, ref } from 'vue'

/** Client-side environment checks. All return the "safe" answer during SSR. */
export const inBrowser = typeof window !== 'undefined'

export function prefersReducedMotion() {
  return inBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function supportsViewTransitions() {
  return inBrowser && typeof document.startViewTransition === 'function'
}

/** Reactive reduced-motion flag; `false` on the server, updated live on the client. */
export function useReducedMotionPref() {
  const reduced = ref(false)
  let mq: MediaQueryList | undefined
  const update = () => (reduced.value = !!mq?.matches)
  onMounted(() => {
    mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    update()
    mq.addEventListener('change', update)
  })
  onBeforeUnmount(() => mq?.removeEventListener('change', update))
  return reduced
}
