/**
 * In-page report navigation. Links use target="_self" so VitePress' router (which jumps without
 * animation) leaves them alone; this pushes a normal history entry (state `{}` so VitePress' popstate
 * handler restores the anchor on back/forward), scrolls below the fixed nav and moves focus.
 */
// VitePress fixes its nav only at >= 960px; below that it scrolls away and the Contents bar sits at the top.
const navHeight = () => {
  const nav = document.querySelector('.VPNav')
  if (!nav || getComputedStyle(nav).position !== 'fixed') return 0
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vp-nav-height')) || 64
}

/** Where a section heading should land: under the fixed nav (+ the mobile Contents bar) with breathing room. */
export const reportOffset = () => navHeight() + (innerWidth < 960 ? 52 : 0) + 24

/** Opens every closed <details> around `el` (e.g. a collapsed reference list), so a link to it shows it. */
export function reveal(el: Element | null): boolean {
  let opened = false
  for (let d = el?.closest('details:not([open])'); d; d = d.parentElement?.closest('details:not([open])')) {
    ;(d as HTMLDetailsElement).open = true
    opened = true
  }
  return opened
}

/** Document Y of an element's layout box. Unlike getBoundingClientRect it ignores transforms, so a
 *  heading still mid-reveal (translateY) reports where it will settle. */
export function docTop(el: HTMLElement): number {
  let y = 0
  for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) y += n.offsetTop
  return y
}

/**
 * Keeps the URL's #target under the nav while the page settles. VitePress scrolls to the hash right after
 * a client-side navigation, but the async widgets above the target mount later and push it down the page.
 * Stops on the reader's first scroll input, or once the layout has been still for a while.
 */
export function holdHashTarget(): () => void {
  const id = decodeURIComponent(location.hash.slice(1))
  const el = id ? document.getElementById(id) : null
  reveal(el)
  return el ? holdTarget(el) : () => {}
}

/** Keeps `el` under the nav while widgets and media above it change height (same stop rules as above). */
function holdTarget(el: HTMLElement): () => void {
  const pin = () => window.scrollTo({ top: docTop(el) - reportOffset(), behavior: 'auto' })
  let idle: ReturnType<typeof setTimeout>
  const ro = new ResizeObserver(() => {
    pin()
    clearTimeout(idle)
    idle = setTimeout(stop, 1500)
  })
  const inputs = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const
  function stop() {
    ro.disconnect()
    clearTimeout(idle)
    clearTimeout(cap)
    inputs.forEach((t) => removeEventListener(t, stop))
  }
  inputs.forEach((t) => addEventListener(t, stop, { passive: true }))
  ro.observe(document.body)
  idle = setTimeout(stop, 1500)
  const cap = setTimeout(stop, 8000)
  return stop
}

export function goToSection(id: string, e?: MouseEvent): boolean {
  if (e && (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return false
  const el = document.getElementById(id)
  if (!el) return false
  e?.preventDefault()
  reveal(el)
  if (location.hash !== `#${id}`) history.pushState({}, '', `#${id}`)
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const dest = () => docTop(el) - reportOffset()
  window.scrollTo({ top: dest(), behavior: reduced ? 'auto' : 'smooth' })
  // Lazy widgets and media passed on the way can grow and move the target during a long smooth scroll:
  // when the scroll ends, finish the last stretch, then hold the heading in place while the page settles.
  let tries = 0
  let fallback: ReturnType<typeof setTimeout>
  const arrive = () => {
    clearTimeout(fallback)
    const off = Math.abs(dest() - window.scrollY)
    const far = off >= innerHeight && !reduced && tries < 4
    if (off > 4) window.scrollTo({ top: dest(), behavior: far ? 'smooth' : 'auto' })
    tries++
    if (far) fallback = setTimeout(arrive, 1600) // another smooth leg: wait for its scrollend
    else {
      cancel()
      holdTarget(el)
    }
  }
  // the reader taking over mid-flight (wheel, touch, keys) wins: no correction afterwards
  const inputs = ['wheel', 'touchstart', 'keydown'] as const
  function cancel() {
    clearTimeout(fallback)
    removeEventListener('scrollend', arrive)
    inputs.forEach((t) => removeEventListener(t, cancel))
  }
  inputs.forEach((t) => addEventListener(t, cancel, { passive: true }))
  addEventListener('scrollend', arrive)
  // browsers without scrollend (and scrolls too short to fire one)
  fallback = setTimeout(arrive, 1600)
  // Markdown headings are not focusable by default; make the target programmatically focusable
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
  el.focus({ preventScroll: true })
  return true
}
