<script setup lang="ts">
/**
 * Roadmap-Ascent-style report navigator (getlayers.ai "Roadmap Ascent": a glowing node glides down a
 * spine, lighting each milestone, while a split-flap counter rolls upward). The full reference is
 * premium-gated, so this follows its published description, in the Overview's bronze palette.
 *
 * Progress is real document progress: heading positions are cached (re-measured on resize / content
 * resize) and one rAF-throttled passive scroll listener maps scrollY onto them. The node sits on the
 * active chapter's milestone and travels toward the next one as that chapter is read.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import TocList from './TocList.vue'
import GlassSurface from '../GlassSurface.vue'
import { toc } from './toc'
import { docTop, goToSection, holdHashTarget, reportOffset } from './navigate'

let releaseHash = () => {}

const rail = ref<HTMLElement>()
const scroller = ref<HTMLElement>()
const drawer = ref<HTMLElement>()
const drawerBtn = ref<HTMLElement>()
const active = ref(-1)
const activeSub = ref<string | null>(null)
const activeLeaf = ref<string | null>(null)
const manual = ref(new Set<number>())
// level-2 sections the reader expanded or collapsed by hand (id → open?); the active one opens by itself
const manualSub = ref(new Map<string, boolean>())
const drawerOpen = ref(false)
const entered = ref(false)
const nodeY = ref(0)
const reduced = ref(false)

const total = toc.filter((c) => c.num).length
const flap = computed(() => {
  const c = toc[active.value]
  return (c?.num || '00').split('')
})
const activeTitle = computed(() => toc[active.value]?.title ?? 'Contents')
const isOpen = (i: number) => i === active.value || manual.value.has(i)
const isSubOpen = (id: string) => manualSub.value.get(id) ?? id === activeSub.value

// ---- geometry ----
interface Mark { id: string; chapter: number; sub: string | null; top: number }
let marks: Mark[] = []
let chapterTops: number[] = []
let measuredHeight = 0
function measure() {
  measuredHeight = document.documentElement.scrollHeight
  marks = []
  chapterTops = toc.map((c, i) => {
    const el = document.getElementById(c.id)
    const top = el ? docTop(el) : Infinity
    marks.push({ id: c.id, chapter: i, sub: null, top })
    for (const s of c.subs) {
      const se = document.getElementById(s.id)
      if (se) marks.push({ id: s.id, chapter: i, sub: s.id, top: docTop(se) })
      for (const l of s.leaves) {
        const le = document.getElementById(l.id)
        if (le) marks.push({ id: l.id, chapter: i, sub: s.id, top: docTop(le) })
      }
    }
    return top
  })
  marks.sort((a, b) => a.top - b.top)
}
const offset = reportOffset
const line = () => window.scrollY + offset() + Math.min(160, innerHeight * 0.2)

let raf = 0
function update() {
  raf = 0
  // lazy media above the reader (e.g. an iframe resizing itself) can shift headings a frame before
  // the ResizeObserver reports it; re-measure first so the active chapter never flips back and forth
  if (document.documentElement.scrollHeight !== measuredHeight) measure()
  const l = line()
  const atEnd = window.scrollY + innerHeight >= document.documentElement.scrollHeight - 4
  let cur: Mark | undefined
  for (const m of marks) if (m.top <= l) cur = m
  if (atEnd && marks.length) cur = marks[marks.length - 1]
  const ch = cur ? cur.chapter : -1
  const sub = cur?.sub ?? null
  const leaf = cur && cur.sub && cur.id !== cur.sub ? cur.id : null
  if (ch !== active.value) {
    active.value = ch
    manual.value = new Set()
  }
  if (sub !== activeSub.value) {
    activeSub.value = sub
    manualSub.value = new Map()
  }
  activeLeaf.value = leaf

  // glowing node: from this milestone toward the next by the fraction of the chapter read
  const list = scroller.value
  if (!list) return
  const dots = list.querySelectorAll<HTMLElement>('.rtoc__item > .rtoc__row .rtoc__dot')
  const base = list.getBoundingClientRect().top
  const dotY = (i: number) => {
    const r = dots[i]?.getBoundingClientRect()
    return r ? r.top - base + r.height / 2 : 0
  }
  if (ch < 0) {
    nodeY.value = dotY(0)
    return
  }
  const start = chapterTops[ch]
  // last chapter ends where the reading line sits at maximum scroll
  const end = ch + 1 < chapterTops.length ? chapterTops[ch + 1] : document.documentElement.scrollHeight - innerHeight + (l - window.scrollY)
  const f = Math.min(1, Math.max(0, (l - start) / Math.max(1, end - start)))
  const from = dotY(ch)
  const to = ch + 1 < dots.length ? dotY(ch + 1) : list.scrollHeight - 8
  nodeY.value = from + (to - from) * (atEnd ? 1 : f)
}
const onResize = () => (measure(), schedule())
const schedule = () => {
  if (!raf) raf = requestAnimationFrame(update)
}
// subsection lists animate their height for ~0.5 s; keep the node glued to the dots meanwhile
let followUntil = 0
function follow() {
  followUntil = performance.now() + 650
  const tick = () => {
    update()
    if (performance.now() < followUntil) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

// ---- keep the active chapter visible inside a tall rail (without touching the page scroll) ----
watch(active, async (i) => {
  follow()
  await nextTick()
  const box = scroller.value?.parentElement
  const item = scroller.value?.querySelector<HTMLElement>(`.rtoc__item[data-i="${i}"]`)
  if (!box || !item || box.scrollHeight <= box.clientHeight) return
  const y = item.offsetTop - box.clientHeight * 0.3
  box.scrollTo({ top: Math.max(0, y), behavior: reduced.value ? 'auto' : 'smooth' })
})

// ---- navigation ----
function navigate(id: string, e: MouseEvent) {
  if (goToSection(id, e)) drawerOpen.value = false
}
/** Return to Top: back to the start of the Report (the cover), focus moves to the page heading */
function toTop() {
  window.scrollTo({ top: 0, behavior: reduced.value ? 'auto' : 'smooth' })
  if (location.hash) history.replaceState(history.state, '', location.pathname + location.search)
  const cover = document.querySelector<HTMLElement>('.rpt-cover__title')
  if (cover) {
    if (!cover.hasAttribute('tabindex')) cover.setAttribute('tabindex', '-1')
    cover.focus({ preventScroll: true })
  }
}
function toggle(i: number) {
  const s = new Set(manual.value)
  if (isOpen(i) && i !== active.value) s.delete(i)
  else s.add(i)
  manual.value = s
  follow()
}
function toggleSub(id: string) {
  const m = new Map(manualSub.value)
  m.set(id, !isSubOpen(id))
  manualSub.value = m
  follow()
}
watch(activeSub, () => follow())

// ---- mobile drawer ----
watch(drawerOpen, async (o) => {
  await nextTick()
  if (o) drawer.value?.querySelector<HTMLElement>('[aria-current], .rtoc__link')?.focus()
  else drawerBtn.value?.focus({ preventScroll: true })
})
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && drawerOpen.value) drawerOpen.value = false
}

// ---- entrance: spine draws, milestones ascend (once, when the report reaches the viewport) ----
let io: IntersectionObserver | undefined
let ro: ResizeObserver | undefined
let tl: { kill: () => void } | undefined
async function enter() {
  entered.value = true
  if (reduced.value || !rail.value) return
  const { gsap } = await import('gsap')
  const r = rail.value
  tl = gsap
    .timeline({ defaults: { ease: 'power3.out' } })
    .fromTo(r.querySelector('.rtoc__head'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5 })
    .fromTo(r.querySelector('.rtoc__spine'), { scaleY: 0 }, { scaleY: 1, duration: 0.9, ease: 'power2.out' }, 0.1)
    .fromTo(r.querySelectorAll('.rtoc__list > li'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.045 }, 0.2)
    .fromTo(r.querySelector('.rtoc__node'), { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.5 }, 0.55)
}

onMounted(() => {
  reduced.value = matchMedia('(prefers-reduced-motion: reduce)').matches
  measure()
  update()
  releaseHash = holdHashTarget()
  addEventListener('scroll', schedule, { passive: true })
  addEventListener('resize', onResize, { passive: true })
  addEventListener('keydown', onKey)
  addEventListener('load', () => (measure(), schedule()), { once: true })
  const root = rail.value?.closest<HTMLElement>('.rpt')
  if (root) {
    // body too: content above the report (fonts, the hero) can move it without resizing it
    ro = new ResizeObserver(() => (measure(), schedule()))
    ro.observe(root)
    ro.observe(document.body)
    const alreadyIn = root.getBoundingClientRect().top < innerHeight * 0.85
    if (alreadyIn || reduced.value) entered.value = true // refresh / deep link mid-report: no entrance replay
    else {
      io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return
          io?.disconnect()
          enter()
        },
        { rootMargin: '0px 0px -15% 0px' }
      )
      io.observe(root)
    }
  }
})
onBeforeUnmount(() => {
  releaseHash()
  removeEventListener('scroll', schedule)
  removeEventListener('resize', onResize)
  removeEventListener('keydown', onKey)
  if (raf) cancelAnimationFrame(raf)
  io?.disconnect()
  ro?.disconnect()
  tl?.kill()
})
</script>

<template>
  <!-- desktop / tablet roadmap rail -->
  <nav ref="rail" class="rtoc" :class="{ 'is-entered': entered }" aria-label="Report contents">
    <div class="rtoc__head">
      <span class="rtoc__label">Contents</span>
      <span class="rtoc__counter" aria-hidden="true">
        <span v-for="(d, i) in flap" :key="i" class="rtoc__flap" :style="{ '--d': `${i * 60}ms` }">
          <Transition name="rtoc-flap"><span :key="d">{{ d }}</span></Transition>
        </span>
        <span class="rtoc__of">/ {{ String(total).padStart(2, '0') }}</span>
      </span>
    </div>
    <div class="rtoc__viewport">
      <div ref="scroller" class="rtoc__track">
        <div class="rtoc__spine" aria-hidden="true">
          <span class="rtoc__spine-fill" :style="{ transform: `scaleY(${nodeY})` }" />
          <span class="rtoc__node" :style="{ transform: `translate3d(0, ${nodeY}px, 0)` }" />
        </div>
        <TocList
          :items="toc" :active="active" :active-sub="activeSub" :active-leaf="activeLeaf" :open="isOpen" :open-sub="isSubOpen"
          prefix="rail" @navigate="navigate" @toggle="toggle" @toggle-sub="toggleSub"
        />
      </div>
    </div>
    <!-- Return to Top: pinned to the bottom of the sticky rail (desktop); the floating twin below serves phones -->
    <GlassSurface variant="toolbar" refract="control" class="rtoc-top">
      <button type="button" class="rtoc-top__btn" aria-label="Return to the top of the report" @click="toTop">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
        <span>Return to top</span>
      </button>
    </GlassSurface>
  </nav>
  <GlassSurface variant="control" refract="control" class="rtoc-top rtoc-top--float">
    <button type="button" class="rtoc-top__btn" aria-label="Return to the top of the report" @click="toTop">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
    </button>
  </GlassSurface>

  <!-- mobile: slim sticky bar + Contents drawer -->
  <div class="rtoc-bar">
    <button ref="drawerBtn" type="button" class="rtoc-bar__btn" aria-haspopup="dialog" :aria-expanded="drawerOpen" aria-controls="rtoc-drawer" @click="drawerOpen = true">
      <span class="rtoc-bar__label">Contents</span>
      <span class="rtoc-bar__current">{{ toc[active]?.num ? `${toc[active].num} · ` : '' }}{{ activeTitle }}</span>
      <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
    </button>
  </div>
  <Transition name="rtoc-drawer">
    <div v-if="drawerOpen" class="rtoc-drawer" @click.self="drawerOpen = false">
      <div id="rtoc-drawer" ref="drawer" class="rtoc-drawer__panel" role="dialog" aria-modal="true" aria-label="Report contents">
        <div class="rtoc-drawer__head">
          <span class="rtoc__label">Contents</span>
          <button type="button" class="rtoc-drawer__close" aria-label="Close contents" @click="drawerOpen = false">
            <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6" /></svg>
          </button>
        </div>
        <nav class="rtoc rtoc--drawer" aria-label="Report contents (drawer)">
          <TocList
            :items="toc" :active="active" :active-sub="activeSub" :active-leaf="activeLeaf" :open="isOpen" :open-sub="isSubOpen"
            prefix="drawer" @navigate="navigate" @toggle="toggle" @toggle-sub="toggleSub"
          />
        </nav>
      </div>
    </div>
  </Transition>
</template>
