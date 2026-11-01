import { nextTick, ref } from 'vue'
import { startTransition } from 'motion-v'
import { prefersReducedMotion, supportsViewTransitions } from './motionEnv'

/** A transition still running after this is skipped, so a browser fault can never freeze the UI. */
const VT_SAFETY_MS = 1200

/**
 * Open/close state for App Store-style shared-element expansion.
 *
 * - View Transitions available, motion allowed and `sharedElement` true: the state change runs
 *   inside motion-v's `startTransition`, so matching `<AnimateView name>` elements morph.
 * - Otherwise (`mode === 'fallback'`): the state changes immediately and the dialog animates
 *   itself with motion-v springs (opacity only under reduced motion, via the app MotionConfig).
 *
 * `sharedElement: false` is used for <video>: in Chromium 156 a view transition never finishes
 * if a *named* layer containing a <video> is outside the viewport, and motion-v names every
 * mounted <AnimateView> for every transition (verified in browser QA).
 *
 * Focus returns to the element that opened the dialog. The trigger may have been re-created
 * while the dialog was open, so it is looked up again by id.
 */
export function useSharedExpand<T extends string>({ sharedElement = true } = {}) {
  const openId = ref<T | null>(null)
  const mode = ref<'vt' | 'fallback'>('fallback')
  let triggerId: string | null = null

  function run(update: () => void) {
    if (!sharedElement || !supportsViewTransitions() || prefersReducedMotion()) {
      mode.value = 'fallback'
      update()
      return undefined
    }
    mode.value = 'vt'
    const transition = startTransition(update)
    if (transition) {
      const timer = window.setTimeout(() => transition.skipTransition(), VT_SAFETY_MS)
      transition.ready.catch(() => undefined) // rejects when skipped; expected
      transition.finished.finally(() => window.clearTimeout(timer)).catch(() => undefined)
    }
    return transition
  }

  function open(id: T, fromTriggerId: string) {
    if (openId.value === id) return
    triggerId = fromTriggerId
    run(() => {
      openId.value = id
    })
  }

  async function close() {
    if (openId.value === null) return
    const transition = run(() => {
      openId.value = null
    })
    if (transition) await transition.finished.catch(() => undefined)
    await nextTick()
    if (triggerId) document.getElementById(triggerId)?.focus({ preventScroll: true })
  }

  return { openId, mode, open, close }
}
