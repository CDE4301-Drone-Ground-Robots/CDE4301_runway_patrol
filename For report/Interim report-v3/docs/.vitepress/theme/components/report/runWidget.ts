/**
 * Runs a widget script after its component has mounted.
 * The scripts were written for static pages: they attach window/document listeners they never
 * remove, and several start themselves on DOMContentLoaded / load, which have already fired when a
 * component mounts. While a script initialises, those two events run immediately; other listeners are
 * recorded so they can be detached when the page unmounts.
 */
type Listener = [EventTarget, string, EventListenerOrEventListenerObject, boolean | AddEventListenerOptions | undefined]

export function runWidget(init: () => void): () => void {
  const added: Listener[] = []
  const targets: EventTarget[] = [window, document]
  const originals = targets.map((t) => t.addEventListener)
  const deferred: Array<() => void> = []
  targets.forEach((t, i) => {
    t.addEventListener = function (type: string, fn: EventListenerOrEventListenerObject, opts?: boolean | AddEventListenerOptions) {
      if (type === 'DOMContentLoaded' || (t === window && type === 'load')) {
        const call = typeof fn === 'function' ? () => fn.call(t, new Event(type)) : () => fn.handleEvent(new Event(type))
        deferred.push(call)
        return
      }
      added.push([t, type, fn, opts])
      return originals[i].call(t, type, fn, opts)
    }
  })
  try {
    init()
    for (const call of deferred) call()
  } catch (err) {
    console.warn('[widget] failed to initialise', err)
  } finally {
    targets.forEach((t, i) => (t.addEventListener = originals[i]))
  }
  return () => added.forEach(([t, type, fn, opts]) => t.removeEventListener(type, fn, opts))
}
