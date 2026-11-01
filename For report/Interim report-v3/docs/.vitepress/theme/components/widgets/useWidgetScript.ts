/**
 * Runs the widget scripts (scripts/*.js). One script often drives several widgets that live in
 * separate components on the same page (each loaded as its own async chunk), so each script runs once
 * per page — after the widgets that share it have stopped mounting for a short settle window — and its
 * window/document listeners are removed when the last of them unmounts.
 */
import { onBeforeUnmount, onMounted } from 'vue'
import { runWidget } from '../report/runWidget'

const SETTLE_MS = 250

interface Run {
  users: number
  started: boolean
  timer?: ReturnType<typeof setTimeout>
  cleanup: () => void
}
const running = new Map<string, Run>()

export function useWidgetScript(scripts: Array<[string, () => void]>) {
  onMounted(() => {
    for (const [key, init] of scripts) {
      let r = running.get(key)
      if (!r) running.set(key, (r = { users: 0, started: false, cleanup: () => {} }))
      r.users++
      if (r.started) continue
      // a sibling widget sharing this script mounted: restart the settle window
      clearTimeout(r.timer)
      const run = r
      run.timer = setTimeout(() => {
        if (run.started || !running.has(key)) return
        run.started = true
        run.cleanup = runWidget(init)
      }, SETTLE_MS)
    }
  })
  onBeforeUnmount(() => {
    for (const [key] of scripts) {
      const r = running.get(key)
      if (!r || --r.users > 0) continue
      clearTimeout(r.timer)
      r.cleanup()
      running.delete(key)
    }
  })
}
