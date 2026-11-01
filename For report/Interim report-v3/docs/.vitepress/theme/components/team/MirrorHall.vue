<script setup lang="ts">
/**
 * Meet the Team: the Mirror Hall. Five portrait cards on a ring above a reflective floor (mirror-scene.ts);
 * drag or swipe to turn it, click a side card to bring it forward, click the front card (or "Click here
 * for more") to flip it open into that member's profile. The profiles are the <TeamProfile> blocks in
 * team.md (default slot); identity comes from data/team.ts.
 *
 * Without JavaScript the cards render as a plain grid. Without WebGL the ring still works, without
 * reflections. Under reduced motion the ring snaps and the profile fades instead of flipping.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref } from 'vue'
import { team, type MemberId } from '../../data/team'
import type { MirrorScene } from './mirror-scene'

const stage = ref<HTMLElement>()
const cardEls = ref<HTMLElement[]>([])
const overlay = ref<HTMLElement>()
const panel = ref<HTMLElement>()
const closeBtn = ref<HTMLButtonElement>()

const active = ref<MemberId | null>(null)
const focusIndex = ref(0)
const ready = ref(false)
const busy = ref(false)
// a documentation link inside a profile leaves the page: drop the scroll lock straight away
function leave() {
  document.documentElement.classList.remove('mh-locked')
  removeEventListener('keydown', onKey)
}
provide('mirror-hall', { active, leave })

const activeMember = computed(() => team.find((m) => m.id === active.value) ?? null)

let scene: MirrorScene | undefined
let gsap: typeof import('gsap').gsap | undefined
let reduced = false
let cardRect: DOMRect | undefined
let returnFocus: HTMLElement | null = null

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

onMounted(async () => {
  reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const [{ createMirrorScene }, g] = await Promise.all([import('./mirror-scene'), import('gsap')])
  gsap = g.gsap
  if (!stage.value) return
  scene = createMirrorScene({
    host: stage.value,
    cards: cardEls.value,
    photos: team.map((m) => m.portrait),
    focus: team.map((m) => m.focus),
    reduced,
    onFocusChange: (i) => (focusIndex.value = i)
  })
  ready.value = true
  // deep link: /team#gabriel (or the old #gabriel-name anchors) opens that profile
  const id = decodeURIComponent(location.hash.slice(1)).replace(/-(name|subsystem|record)$/, '')
  const i = team.findIndex((m) => m.id === id)
  if (i >= 0) openProfile(i)
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('mh-locked')
  removeEventListener('keydown', onKey)
  scene?.dispose()
})

function onCardClick(i: number, e: MouseEvent) {
  if (!scene || busy.value || scene.clickSuppressed()) return
  const more = (e.target as HTMLElement).closest('.mh-card__more')
  if (more || i === scene.focusIndex) openProfile(i)
  else scene.focus(i)
}

function onCardFocus(i: number, e: FocusEvent) {
  // keyboard (Tab) focus turns the ring; a mouse press leaves that to the click
  if (scene && (e.target as HTMLElement).matches(':focus-visible') && i !== scene.focusIndex) scene.focus(i)
}

function onStageKey(e: KeyboardEvent) {
  if (!scene || active.value) return
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    e.preventDefault()
    scene.next(e.key === 'ArrowRight' ? 1 : -1)
    // keep keyboard focus on the card that is now in front
    setTimeout(() => cardEls.value[scene!.focusIndex]?.focus({ preventScroll: true }), 30)
  }
}

async function openProfile(i: number) {
  if (!scene || !gsap || busy.value || active.value) return
  busy.value = true
  returnFocus = cardEls.value[i]
  await sleep(scene.focus(i))
  const st = scene.openState
  st.index = i
  scene.beginAnimation()
  const render = () => scene?.requestRender()

  if (!reduced) await tween(st, { lift: 1, dim: 1, duration: 0.45, ease: 'power3.out', onUpdate: render })
  else Object.assign(st, { lift: 0, dim: 1 })
  cardRect = cardEls.value[i].getBoundingClientRect()
  if (!reduced) await tween(st, { flip: 1, duration: 0.26, ease: 'power2.in', onUpdate: render })

  active.value = team[i].id
  document.documentElement.classList.add('mh-locked')
  await nextTick()
  const el = panel.value!
  gsap.set(overlay.value!, { autoAlpha: 0 })
  gsap.to(overlay.value!, { autoAlpha: 1, duration: 0.35, ease: 'power2.out' })
  if (reduced) {
    gsap.set(el, { clearProps: 'transform', autoAlpha: 1 })
  } else {
    // shared-element hand-off: the panel starts exactly where the turned card was, edge-on, and opens out
    gsap.set(el, { ...fromCard(el), rotationY: -90, transformPerspective: 1800, autoAlpha: 1 })
    await tween(el, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotationY: 0, duration: 0.62, ease: 'power3.out' })
  }
  el.querySelectorAll<HTMLElement>('.mh-reveal').forEach((n, k) =>
    gsap!.fromTo(n, { autoAlpha: 0, y: reduced ? 0 : 14 }, { autoAlpha: 1, y: 0, duration: 0.4, delay: k * 0.05, ease: 'power2.out' })
  )
  scene.endAnimation()
  addEventListener('keydown', onKey)
  closeBtn.value?.focus({ preventScroll: true })
  busy.value = false
}

async function closeProfile() {
  if (!scene || !gsap || busy.value || !active.value) return
  busy.value = true
  removeEventListener('keydown', onKey)
  const st = scene.openState
  const el = panel.value!
  scene.beginAnimation()
  const render = () => scene?.requestRender()
  gsap.to(overlay.value!, { autoAlpha: 0, duration: reduced ? 0.2 : 0.5, ease: 'power2.inOut' })
  if (!reduced) {
    await tween(el.querySelectorAll('.mh-reveal'), { autoAlpha: 0, duration: 0.15 })
    await tween(el, { ...fromCard(el), rotationY: -90, duration: 0.46, ease: 'power3.in' })
  } else await sleep(200)
  active.value = null
  document.documentElement.classList.remove('mh-locked')
  gsap.set(el, { clearProps: 'all' })
  if (!reduced) {
    await tween(st, { flip: 0, duration: 0.3, ease: 'power2.out', onUpdate: render })
    await tween(st, { lift: 0, dim: 0, duration: 0.42, ease: 'power3.inOut', onUpdate: render })
  } else Object.assign(st, { flip: 0, lift: 0, dim: 0 })
  st.index = -1
  scene.endAnimation()
  busy.value = false
  returnFocus?.focus({ preventScroll: true })
}

/** transform that places the (final-size) panel over the card's last on-screen box */
function fromCard(el: HTMLElement) {
  const r = cardRect!
  const f = el.getBoundingClientRect()
  // measure without the current transform
  const fw = el.offsetWidth
  const fh = el.offsetHeight
  const fx = f.left + f.width / 2 - ((gsap!.getProperty(el, 'x') as number) || 0)
  const fy = f.top + f.height / 2 - ((gsap!.getProperty(el, 'y') as number) || 0)
  return { x: r.left + r.width / 2 - fx, y: r.top + r.height / 2 - fy, scaleX: r.width / fw, scaleY: r.height / fh }
}

function tween(t: gsap.TweenTarget, vars: gsap.TweenVars) {
  return new Promise<void>((resolve) => gsap!.to(t, { ...vars, onComplete: () => resolve() }))
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    closeProfile()
  } else if (e.key === 'Tab' && panel.value) {
    // keep Tab inside the open profile
    const f = [...panel.value.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')].filter((n) => n.offsetParent)
    if (!f.length) return
    const first = f[0]
    const last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus())
    else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus())
  }
}
</script>

<template>
  <section class="mh" :class="{ 'is-ready': ready, 'is-open': !!active }" aria-labelledby="mh-title">
    <header class="mh__head">
      <p class="mh__kicker">Meet the Team</p>
      <h1 id="mh-title" class="mh__title">The People Behind FOD Hunter</h1>
      <p class="mh__lede">Five minds. One mission.</p>
    </header>

    <div ref="stage" class="mh__stage" tabindex="-1" @keydown="onStageKey">
      <p class="mh__sr" id="mh-help">Use the left and right arrow keys to turn the gallery. Press Enter to open a profile.</p>
      <div class="mh__cards">
        <button
          v-for="(m, i) in team"
          :key="m.id"
          ref="cardEls"
          type="button"
          class="mh-card"
          :class="{ 'is-front': ready && i === focusIndex }"
          :aria-label="`${m.name}, ${m.role}. Open profile`"
          aria-describedby="mh-help"
          @click="onCardClick(i, $event)"
          @focus="onCardFocus(i, $event)"
        >
          <img class="mh-card__photo" :src="m.portrait" :alt="`Portrait of ${m.name}`" :style="{ objectPosition: m.focus }" draggable="false" loading="eager" />
          <span class="mh-card__shade" aria-hidden="true" />
          <span class="mh-card__text">
            <span class="mh-card__name">{{ m.shortName }}</span>
            <span class="mh-card__role">{{ m.role }}</span>
            <span class="mh-card__id">{{ m.matric }}</span>
            <span class="mh-card__more">Click here for more <span aria-hidden="true">↗</span></span>
          </span>
        </button>
      </div>
      <p class="mh__hint" aria-hidden="true">Drag to turn · Click a portrait</p>
    </div>

    <nav class="mh__index" aria-label="Team members">
      <button v-for="(m, i) in team" :key="m.id" type="button" class="mh__chip" :class="{ 'is-front': i === focusIndex }" @click="openProfile(i)">
        {{ m.shortName }}
      </button>
    </nav>

    <div ref="overlay" class="mh-overlay" :class="{ 'is-active': !!active }" @click.self="closeProfile">
      <div
        ref="panel"
        class="mh-panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="active ? `profile-${active}-name` : undefined"
      >
        <figure v-if="activeMember" class="mh-panel__photo">
          <img :src="activeMember.portrait" :alt="`Portrait of ${activeMember.name}`" :style="{ objectPosition: activeMember.focus }" />
        </figure>
        <div class="mh-panel__body">
          <button ref="closeBtn" type="button" class="mh-panel__close" aria-label="Close profile" @click="closeProfile">
            <span aria-hidden="true">✕</span>
          </button>
          <slot />
        </div>
      </div>
    </div>
  </section>
</template>

<style>
.mh {
  --mh-bronze: #e9a35c;
  --mh-sapphire: #5f8fe8;
  --mh-ink: #f3eee7;
  position: relative;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  color: var(--mh-ink);
  background:
    radial-gradient(60% 45% at 50% 62%, rgba(233, 163, 92, 0.1), transparent 70%),
    radial-gradient(70% 50% at 50% 30%, rgba(95, 143, 232, 0.09), transparent 70%),
    linear-gradient(#050507 0%, #07080c 55%, #050507 100%);
  overflow: hidden;
  isolation: isolate;
}
.mh__head {
  position: relative;
  z-index: 3;
  padding: clamp(36px, 7vh, 72px) 24px 0;
  text-align: center;
  pointer-events: none;
}
.mh__kicker {
  margin: 0 0 12px;
  font-family: var(--ov-sans);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.36em;
  text-transform: uppercase;
  color: var(--mh-bronze);
}
.mh__title {
  margin: 0;
  font-family: var(--ov-display);
  font-weight: 400;
  font-size: clamp(30px, 5.2vw, 72px);
  line-height: 1.02;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--mh-ink);
}
.mh__lede {
  margin: 14px 0 0;
  font-family: var(--ov-sans);
  font-size: clamp(15px, 1.4vw, 19px);
  color: rgba(243, 238, 231, 0.66);
}

.mh__stage {
  position: relative;
  height: clamp(520px, 74vh, 860px);
  margin-top: clamp(-40px, -3vh, -12px);
  touch-action: pan-y; /* vertical swipes scroll the page; horizontal ones turn the ring */
  cursor: grab;
  outline: none;
  user-select: none;
  -webkit-user-select: none;
}
.mh__stage:active {
  cursor: grabbing;
}
.mh-gl,
.mh-css3d {
  position: absolute !important;
  inset: 0;
}
.mh-css3d {
  z-index: 2;
}
.mh__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
.mh__hint {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 18px;
  z-index: 3;
  margin: 0;
  text-align: center;
  font-family: var(--ov-sans);
  font-size: 11px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(243, 238, 231, 0.42);
  pointer-events: none;
}

/* Before the scene takes over (and without JavaScript), the cards are a simple grid. */
.mh__cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 20px;
  max-width: 1180px;
  margin: 40px auto 0;
  padding: 0 24px;
}
.mh.is-ready .mh__cards {
  display: contents;
}

.mh-card {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 4;
  padding: 0;
  border: 1px solid rgba(243, 238, 231, 0.22);
  border-radius: 14px;
  overflow: hidden;
  background: #0b0b10;
  color: var(--mh-ink);
  text-align: left;
  cursor: pointer;
  box-shadow: 0 30px 60px -30px rgba(0, 0, 0, 0.9);
  transition: border-color 0.4s ease, box-shadow 0.4s ease;
  backface-visibility: hidden;
}
.mh-card.is-front {
  border-color: rgba(233, 163, 92, 0.75);
  box-shadow:
    0 0 0 1px rgba(233, 163, 92, 0.25),
    0 0 46px -6px rgba(233, 163, 92, 0.38),
    0 40px 80px -30px rgba(0, 0, 0, 0.95);
}
.mh-card:focus-visible {
  outline: 2px solid var(--mh-bronze);
  outline-offset: 4px;
}
.mh-card__photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}
.mh-card__shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 48%, rgba(5, 5, 7, 0.55) 66%, rgba(5, 5, 7, 0.9) 100%);
  pointer-events: none;
}
.mh-card__text {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 0 18px 18px;
  font-family: var(--ov-sans);
}
.mh-card__name {
  font-family: var(--ov-display);
  font-size: 1.55em;
  line-height: 1.05;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.mh-card__role {
  font-size: 0.86em;
  color: rgba(243, 238, 231, 0.82);
}
.mh-card__id {
  font-size: 0.74em;
  letter-spacing: 0.12em;
  color: rgba(243, 238, 231, 0.55);
}
.mh-card__more {
  margin-top: 10px;
  font-size: 0.68em;
  font-weight: 500;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--mh-bronze);
}

.mh__index {
  position: relative;
  z-index: 3;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  padding: 6px 16px clamp(36px, 7vh, 64px);
}
.mh__chip {
  padding: 8px 16px;
  border: 1px solid rgba(243, 238, 231, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
  font-family: var(--ov-sans);
  font-size: 13px;
  color: rgba(243, 238, 231, 0.7);
  transition: border-color 0.3s ease, color 0.3s ease;
}
.mh__chip:hover,
.mh__chip.is-front {
  border-color: rgba(233, 163, 92, 0.6);
  color: var(--mh-ink);
}
.mh__chip:focus-visible {
  outline: 2px solid var(--mh-bronze);
  outline-offset: 3px;
}

/* ---------- expanded profile ---------- */
html.mh-locked {
  overflow: hidden;
}
.mh-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: none;
  align-items: center;
  justify-content: center;
  /* below the site nav, which stays usable */
  padding: calc(var(--vp-nav-height, 64px) + 14px) clamp(12px, 3vw, 40px) clamp(12px, 3vw, 32px);
  background: radial-gradient(80% 70% at 50% 50%, rgba(5, 5, 7, 0.55), rgba(5, 5, 7, 0.86));
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}
.mh-overlay.is-active {
  display: flex;
}
.mh-panel {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 0.82fr) minmax(0, 1.18fr);
  width: min(1160px, 100%);
  height: min(820px, 100%);
  border: 1px solid rgba(233, 163, 92, 0.42);
  border-radius: 18px;
  overflow: hidden;
  background: linear-gradient(160deg, #101016, #08080c 60%);
  box-shadow:
    0 0 60px -10px rgba(233, 163, 92, 0.25),
    0 50px 120px -30px rgba(0, 0, 0, 0.9);
  transform-origin: 50% 50%;
  will-change: transform;
}
.mh-panel__photo {
  position: relative;
  margin: 0;
  min-height: 0;
}
.mh-panel__photo img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.mh-panel__photo::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 70%, rgba(8, 8, 12, 0.85));
}
.mh-panel__body {
  position: relative;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: clamp(28px, 4vw, 52px) clamp(22px, 3.6vw, 48px) 40px;
}
.mh-panel__close {
  position: sticky;
  top: 0;
  float: right;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin: -12px -12px 0 12px;
  border: 1px solid rgba(243, 238, 231, 0.25);
  border-radius: 50%;
  background: rgba(8, 8, 12, 0.8);
  color: var(--mh-ink);
  font-size: 14px;
}
.mh-panel__close:hover {
  border-color: var(--mh-bronze);
}
.mh-panel__close:focus-visible {
  outline: 2px solid var(--mh-bronze);
  outline-offset: 3px;
}

@media (max-width: 760px) {
  .mh__stage {
    height: clamp(440px, 66vh, 620px);
  }
  .mh-overlay {
    padding: 10px;
  }
  .mh-panel {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(200px, 38%) 1fr;
    height: 100%;
  }
  .mh-panel__photo::after {
    background: linear-gradient(180deg, transparent 60%, rgba(8, 8, 12, 0.9));
  }
}
@media (prefers-reduced-motion: reduce) {
  .mh-card,
  .mh__chip {
    transition: none;
  }
}
</style>
