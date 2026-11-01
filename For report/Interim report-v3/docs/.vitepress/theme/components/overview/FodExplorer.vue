<script setup lang="ts">
/**
 * Explore FOD Hunter — free-roaming 3D viewer of the final UGV (same canvas/model as the hero, 'free'
 * scene mode). The visitor drives the camera; selecting a hotspot only opens its panel: the camera,
 * zoom and orientation stay exactly where the visitor left them, and the page never scrolls.
 * The feature index below the viewer gives the same eight descriptions and Report links without WebGL.
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { withBase } from 'vitepress'
import { useFodStage } from './useFodStage'
import { hotspots, type Hotspot, type Subsystem } from '../../data/explorer'

const stage = useFodStage()
const host = ref<HTMLElement>()
const selected = ref<Hotspot | null>(null)
const filter = ref<'All' | Subsystem>('All')
const spots = reactive<Record<string, { x: number; y: number; visible: boolean; occluded: boolean }>>({})
const ready = computed(() => stage.status.value === 'ready' && stage.active.value === 'explorer')
const shown = (h: Hotspot) => filter.value === 'All' || h.subsystem === filter.value
const physical = hotspots.filter((h) => h.anchor)
const conceptual = hotspots.filter((h) => !h.anchor)
const reportHref = (id: string) => withBase(`/report#${id}`)

function select(h: Hotspot) {
  selected.value = h
}
function close() {
  const id = selected.value?.id
  selected.value = null
  // return focus to the control that opened the panel
  if (id) (document.querySelector(`[data-hotspot="${id}"]`) as HTMLElement | null)?.focus({ preventScroll: true })
}
const onKey = (e: KeyboardEvent) => e.key === 'Escape' && selected.value && close()

let unregister: (() => void) | undefined
let offFrame: (() => void) | undefined
let lastOcclusion = 0
function attach() {
  const s = stage.scene.value
  if (!s || offFrame) return
  offFrame = s.onFrame(() => {
    if (stage.active.value !== 'explorer') return
    const now = performance.now()
    const checkOcclusion = now - lastOcclusion > 300
    if (checkOcclusion) lastOcclusion = now
    for (const h of physical) {
      const p = s.project(h.anchor!)
      const cur = spots[h.id] ?? (spots[h.id] = { x: 0, y: 0, visible: false, occluded: false })
      cur.x = p.x
      cur.y = p.y
      cur.visible = p.visible
      if (checkOcclusion && p.visible) cur.occluded = s.isOccluded(h.anchor!)
    }
  })
}

onMounted(() => {
  if (host.value) unregister = stage.register('explorer', host.value, 'free')
  addEventListener('keydown', onKey)
})
watch(stage.scene, (s) => s && attach(), { immediate: true })
onBeforeUnmount(() => {
  unregister?.()
  offFrame?.()
  removeEventListener('keydown', onKey)
})
</script>

<template>
  <section id="explore" class="ovx-section xpl" aria-labelledby="explore-title">
    <header class="ovx-head">
      <p class="ovx-index">03</p>
      <h2 id="explore-title" class="ovx-title">Explore FOD Hunter</h2>
      <p class="ovx-lead">
        The final UGV design, from the team's CAD. Drag to rotate, right-drag or Shift-drag to pan, and use the buttons to zoom. Select a marker to read about that
        feature.
      </p>
    </header>

    <div class="xpl__layout">
      <div class="xpl__viewer">
        <img
          class="xpl__fallback"
          :class="{ 'is-hidden': ready }"
          :src="withBase('/assets/images/overview/fod-hunter-render-1536.webp')"
          width="1536"
          height="1024"
          alt="Photorealistic render of the FOD Hunter UGV"
          loading="lazy"
          decoding="async"
        />
        <div ref="host" class="xpl__host" :class="{ 'is-shown': ready }" />

        <template v-if="ready">
          <button
            v-for="h in physical"
            v-show="shown(h) && spots[h.id]?.visible"
            :key="h.id"
            type="button"
            class="xpl__spot"
            :class="{ 'is-active': selected?.id === h.id, 'is-occluded': spots[h.id]?.occluded }"
            :data-hotspot="h.id"
            :style="{ transform: `translate3d(${spots[h.id]?.x ?? 0}px, ${spots[h.id]?.y ?? 0}px, 0)` }"
            :aria-label="`${h.title} (${h.subsystem}) — show details`"
            :aria-pressed="selected?.id === h.id"
            @click="select(h)"
          >
            <span class="xpl__spot-dot" />
            <span class="xpl__spot-label">{{ h.title }}</span>
          </button>
        </template>

        <div class="xpl__concepts" aria-label="System-level features">
          <button
            v-for="h in conceptual"
            v-show="shown(h)"
            :key="h.id"
            type="button"
            class="xpl__concept"
            :class="{ 'is-active': selected?.id === h.id }"
            :data-hotspot="h.id"
            :aria-pressed="selected?.id === h.id"
            @click="select(h)"
          >
            <span class="xpl__concept-kicker">System level</span>{{ h.title }}
          </button>
        </div>

        <div class="xpl__toolbar" role="toolbar" aria-label="3D view controls">
          <button type="button" aria-label="Zoom in" :disabled="!ready" @click="stage.scene.value?.zoom(0.8)">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" /></svg>
          </button>
          <button type="button" aria-label="Zoom out" :disabled="!ready" @click="stage.scene.value?.zoom(1.25)">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12" /></svg>
          </button>
          <button type="button" class="xpl__reset" :disabled="!ready" @click="stage.scene.value?.resetView()">Reset view</button>
        </div>
        <p class="xpl__hint" aria-hidden="true">Drag to rotate · right-drag to pan · scroll to continue</p>
      </div>

      <aside class="xpl__panel" :class="{ 'is-open': selected }" aria-live="polite">
        <template v-if="selected">
          <div class="xpl__panel-head">
            <p class="xpl__panel-sub">{{ selected.subsystem }} system</p>
            <button type="button" class="xpl__close" aria-label="Close details" @click="close">
              <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6" /></svg>
            </button>
          </div>
          <h3 class="xpl__panel-title">{{ selected.title }}</h3>
          <p class="xpl__panel-text">{{ selected.text }}</p>
          <p class="xpl__panel-part">In the CAD: {{ selected.part }}</p>
          <a class="xpl__more" :href="reportHref(selected.report.id)">Find out more <span aria-hidden="true">↗</span></a>
          <p class="xpl__panel-dest">{{ selected.report.label }}</p>
        </template>
        <template v-else>
          <p class="xpl__panel-empty">Select a marker on the vehicle — or a feature below — to read about it.</p>
        </template>
      </aside>
    </div>

    <div class="xpl__filters" role="group" aria-label="Filter features by subsystem">
      <button
        v-for="f in (['All', 'Mechanical', 'Electrical', 'Programming'] as const)"
        :key="f"
        type="button"
        :aria-pressed="filter === f"
        @click="filter = f"
      >
        {{ f }}
      </button>
    </div>
    <ol class="xpl__index" aria-label="FOD Hunter features">
      <li v-for="h in hotspots" v-show="shown(h)" :key="h.id">
        <button type="button" :aria-pressed="selected?.id === h.id" @click="select(h)">
          <span class="xpl__index-sub">{{ h.subsystem }}</span>{{ h.title }}
        </button>
      </li>
    </ol>
  </section>
</template>
