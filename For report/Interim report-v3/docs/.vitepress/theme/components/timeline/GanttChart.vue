<script setup lang="ts">
/**
 * Timeline section 02: the project Gantt chart, read from data/schedule.ts (the team's schedule JSON).
 *
 * Geometry is in calendar days: x = (day − rangeStart) × pxPerDay, a bar spans its first Monday to its last
 * Sunday inclusive. Months are real months (month starts are computed, never 30-day approximations) and the
 * unlisted 4–10 Jan week stays a real, empty week. Filters never touch the data: a semester view only clips
 * what is drawn; the details panel always shows a task's full recorded dates.
 *
 * Layout: the date header is sticky to the page (below the nav) and follows the body's horizontal scroll;
 * the body scrolls horizontally only, so ordinary vertical page scrolling is never captured. Labels are
 * sticky on the left. Below 768 px the default view is a grouped task list (the chart stays one tap away).
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import GlassSurface from '../GlassSurface.vue'
import {
  GROUPS, MEMBERS, WORKSTREAMS, breakSpan, exportedAt, fmt, fmtLong, fmtShort, localToday, monthLabel, monthStart, nextMonth,
  periodRange, semesterLabel, semesters, tasks, weekAt, yearOf, type Group, type Period, type Task
} from '../../data/schedule'
import type { MemberId } from '../../data/team'

// Rows are grouped by team member (recorded owner). A whole-team task ("All members") is listed under every
// member but is still one task: counts of tasks shown are always unique task ids.
type Filter = 'all' | MemberId
const FILTERS: { id: Filter; label: string }[] = [{ id: 'all', label: 'All members' }, ...MEMBERS.map((m) => ({ id: m.id, label: m.first }))]
type RowGroup = MemberId | 'unassigned'
const ROW_GROUPS: { id: RowGroup; label: string }[] = [...MEMBERS.map((m) => ({ id: m.id as RowGroup, label: m.name })), { id: 'unassigned', label: 'Unassigned / Project-wide' }]
const MEMBER_NAME = Object.fromEntries(MEMBERS.map((m) => [m.id, m.name])) as Record<MemberId, string>
const PERIODS: { id: Period; label: string }[] = [
  { id: 'all', label: 'All periods' },
  { id: 's1', label: 'Semester 1' },
  { id: 's2', label: 'Semester 2' }
]
const GROUP_LABEL = Object.fromEntries(GROUPS.map((g) => [g.id, g.label])) as Record<Group, string>

const filter = ref<Filter>('all')
const period = ref<Period>('all')
const scale = ref<'week' | 'month'>('week')
const view = ref<'chart' | 'list'>('chart')
const expanded = ref(new Set<string>())
const selectedId = ref<string | null>(null)
const today = ref<number | null>(null)
const notice = ref('')
const scroller = ref<HTMLElement>()
const panel = ref<HTMLElement>()
const scrollX = ref(0)
const viewW = ref(1000)
const narrow = ref(false)

const LABEL_W = computed(() => (narrow.value ? 168 : 272))
const range = computed(() => periodRange(period.value) ?? { start: 0, end: 0 })
const days = computed(() => range.value.end - range.value.start + 1)
// week view: fixed 18 px/day (126 px per week); month view: the whole range fits the visible track when it can
const ppd = computed(() => (scale.value === 'week' ? 18 : Math.max(4, (viewW.value - LABEL_W.value - 2) / days.value)))
const width = computed(() => Math.round(days.value * ppd.value))
const x = (day: number) => (day - range.value.start) * ppd.value

// ---------------- rows ----------------
const inRange = (t: Task) => t.end >= range.value.start && t.start <= range.value.end
const inGroup = (t: Task, g: RowGroup) => (g === 'unassigned' ? t.owners.length === 0 : t.owners.includes(g))
/** unique tasks in view (each task id once, however many members it is listed under) */
const visible = computed(() => tasks.filter((t) => (filter.value === 'all' || t.owners.includes(filter.value)) && inRange(t)))
interface Stream { key: string; label: string; recorded: string; group: RowGroup; tasks: Task[]; start: number; end: number }
// within a member, tasks are grouped by their recorded category (named as in WORKSTREAMS), in that list's order
const STREAM_ORDER = WORKSTREAMS.map((w) => w.label)
const groups = computed(() =>
  ROW_GROUPS.filter((g) => filter.value === 'all' || g.id === filter.value)
    .map((g) => {
      const mine = visible.value.filter((t) => inGroup(t, g.id))
      const labels = [...new Set(mine.map((t) => t.workstream))].sort((a, b) => (STREAM_ORDER.indexOf(a) + 1 || 99) - (STREAM_ORDER.indexOf(b) + 1 || 99))
      const streams: Stream[] = labels.map((label) => {
        const ts = mine.filter((t) => t.workstream === label).sort((a, b) => a.start - b.start || a.end - b.end)
        const cats = [...new Set(ts.map((t) => t.category))]
        return { key: `${g.id}:${label}`, label, recorded: cats.length === 1 && cats[0] !== label ? cats[0] : '', group: g.id, tasks: ts, start: Math.min(...ts.map((t) => t.start)), end: Math.max(...ts.map((t) => t.end)) }
      })
      return { ...g, streams, count: mine.length }
    })
    .filter((g) => g.streams.length)
)

/** drawn (clipped) geometry of a span inside the current range */
function bar(start: number, end: number) {
  const s = Math.max(start, range.value.start)
  const e = Math.min(end, range.value.end)
  return { left: `${x(s)}px`, width: `${Math.max(ppd.value, (e - s + 1) * ppd.value)}px`, clipL: start < range.value.start, clipR: end > range.value.end }
}

// ---------------- header ----------------
const months = computed(() => {
  const out: { key: number; left: number; w: number; label: string; long: string }[] = []
  for (let m = monthStart(range.value.start); m <= range.value.end; m = nextMonth(m)) {
    const s = Math.max(m, range.value.start)
    const e = Math.min(nextMonth(m) - 1, range.value.end)
    const w = (e - s + 1) * ppd.value
    out.push({ key: m, left: x(s), w, label: w > 70 ? monthLabel(m, true) : monthLabel(m), long: monthLabel(m, true) })
  }
  return out
})
const weekCols = computed(() => {
  const out: { key: number; left: number; code: string; date: string }[] = []
  for (let d = range.value.start; d <= range.value.end; d += 7) {
    const w = weekAt(d)
    out.push({ key: d, left: x(d), code: w ? w.code.replace(' Wk', ' W').replace('Recess', 'Rec') : '—', date: fmtShort(d) })
  }
  return out
})
const bands = computed(() => {
  const list = [
    semesters.s1 && { cls: 's1', label: 'Semester 1', ...semesters.s1 },
    breakSpan && { cls: 'brk', label: 'Break', ...breakSpan },
    semesters.s2 && { cls: 's2', label: 'Semester 2', ...semesters.s2 }
  ].filter(Boolean) as { cls: string; label: string; start: number; end: number }[]
  return list.filter((b) => b.end >= range.value.start && b.start <= range.value.end).map((b) => ({ ...b, ...bar(b.start, b.end) }))
})
const gridLines = computed(() => (scale.value === 'week' ? weekCols.value.map((w) => w.left) : months.value.map((m) => m.left)).filter((l) => l > 0))
const yearLabel = computed(() => {
  const a = yearOf(range.value.start)
  const b = yearOf(range.value.end)
  return a === b ? String(a) : `${a}–${b}`
})
const todayIn = computed(() => today.value != null && today.value >= range.value.start && today.value <= range.value.end)
const todayX = computed(() => (today.value == null ? 0 : x(today.value) + ppd.value / 2))

// ---------------- interaction ----------------
const isOpen = (s: Stream) => expanded.value.has(s.key)
function toggle(s: Stream) {
  const n = new Set(expanded.value)
  n.has(s.key) ? n.delete(s.key) : n.add(s.key)
  expanded.value = n
}
// member groups start open (showing their workstreams); each can be folded away on its own
const closedGroups = ref(new Set<string>())
const groupOpen = (id: string) => !closedGroups.value.has(id)
function toggleGroup(id: string) {
  const n = new Set(closedGroups.value)
  n.has(id) ? n.delete(id) : n.add(id)
  closedGroups.value = n
}
const allOpen = computed(() => groups.value.every((g) => groupOpen(g.id) && g.streams.every(isOpen)))
function toggleAll() {
  if (allOpen.value) expanded.value = new Set()
  else {
    closedGroups.value = new Set()
    expanded.value = new Set(groups.value.flatMap((g) => g.streams.map((s) => s.key)))
  }
}

const selected = computed(() => tasks.find((t) => t.id === selectedId.value) ?? null)
let opener: HTMLElement | null = null
async function select(t: Task, e?: Event) {
  opener = (e?.currentTarget as HTMLElement) ?? null
  selectedId.value = t.id
  await nextTick()
  panel.value?.querySelector<HTMLElement>('.tlg-details__title')?.focus({ preventScroll: true })
}
function closeDetails() {
  selectedId.value = null
  // back to the row (or list card) that opened it; when that was a bar, to the row's label button
  const back = opener?.matches('button') ? opener : opener?.closest('.tlg-row')?.querySelector<HTMLElement>('.tlg-label button')
  back?.focus({ preventScroll: true })
  opener = null
}
const onKey = (e: KeyboardEvent) => e.key === 'Escape' && selectedId.value && closeDetails()

/** keep the date at the left edge of the view when the scale or period changes */
let anchorDay: number | null = null
watch([scale, period], () => {
  anchorDay = scroller.value ? range.value.start + scroller.value.scrollLeft / ppd.value : null
}, { flush: 'pre' })
watch([ppd, range], async () => {
  await nextTick()
  const el = scroller.value
  if (!el || anchorDay == null) return
  const max = el.scrollWidth - el.clientWidth
  el.scrollLeft = Math.min(max, Math.max(0, (anchorDay - range.value.start) * ppd.value))
  anchorDay = null
  onScroll()
})

function goToday() {
  const el = scroller.value
  if (today.value == null || !el) return
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const r = range.value
  const where = PERIODS.find((p) => p.id === period.value)!.label.toLowerCase()
  let target = today.value
  notice.value = ''
  if (today.value < r.start) {
    target = r.start
    notice.value = `Today (${fmt(today.value)}) is before ${period.value === 'all' ? 'the project schedule' : where} — showing its start.`
  } else if (today.value > r.end) {
    target = r.end
    notice.value = `Today (${fmt(today.value)}) is after ${period.value === 'all' ? 'the project schedule' : where} — showing its end.`
  }
  const track = el.clientWidth - LABEL_W.value
  el.scrollTo({ left: Math.max(0, x(target) - track * 0.35), behavior: reduced ? 'auto' : 'smooth' })
}

const onScroll = () => (scrollX.value = scroller.value?.scrollLeft ?? 0)
let ro: ResizeObserver | undefined
let timer: ReturnType<typeof setTimeout> | undefined
const mq = typeof window !== 'undefined' ? matchMedia('(max-width: 767px)') : null
function tickToday() {
  today.value = localToday()
  const now = new Date()
  clearTimeout(timer)
  timer = setTimeout(tickToday, Math.min(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1).getTime() - now.getTime(), 6 * 3600_000))
}
const onMq = () => {
  narrow.value = !!mq?.matches
  view.value = narrow.value ? 'list' : 'chart'
}
onMounted(() => {
  tickToday()
  onMq()
  mq?.addEventListener('change', onMq)
  addEventListener('keydown', onKey)
  ro = new ResizeObserver(() => (viewW.value = scroller.value?.clientWidth ?? viewW.value))
  if (scroller.value) ro.observe(scroller.value)
})
watch(scroller, (el) => el && ro?.observe(el))
onBeforeUnmount(() => {
  clearTimeout(timer)
  mq?.removeEventListener('change', onMq)
  removeEventListener('keydown', onKey)
  ro?.disconnect()
})

// ---------------- list view (phones) ----------------
const listGroups = computed(() =>
  groups.value.map((g) => {
    const ts = g.streams.flatMap((s) => s.tasks)
    // (a task appears once per member it belongs to)
    const sems = ['1', 'vac', '2']
      .map((s) => ({ s, label: semesterLabel(s), tasks: ts.filter((t) => t.semester === s).sort((a, b) => a.start - b.start) }))
      .filter((x) => x.tasks.length)
    return { id: g.id, label: g.label, count: g.count, sems }
  })
)

const statusKey = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, '-')
const assigned = (t: Task) => (t.owners.length ? t.owners.map((o) => MEMBER_NAME[o]).join(', ') : 'Not recorded')
/** colour of the details panel: the member's, or the neutral team colour for shared / unassigned tasks */
const tone = (t: Task) => (t.owners.length === 1 ? t.owners[0] : t.owners.length ? 'team' : 'unassigned')
const weeksOf = (t: Task) => Math.round((t.end - t.start + 1) / 7)
const weekCode = (day: number) => weekAt(day)?.code ?? ''
</script>

<template>
  <section id="gantt" class="tlg" aria-labelledby="tlg-title">
    <header class="tlg__head">
      <p class="tlg__kicker">Development schedule</p>
      <h2 id="tlg-title" class="tlg__title">The Engineering Roadmap</h2>
      <p class="tlg__meta">
        {{ visible.length }} of {{ tasks.length }} tasks shown · statuses as recorded in the team schedule on
        {{ Number.isFinite(exportedAt) ? fmt(exportedAt) : '(date not recorded)' }}
      </p>
    </header>

    <GlassSurface class="tlg-controls" variant="panel">
      <div class="tlg-controls__row">
        <div class="tlg-seg tlg-seg--members" role="group" aria-label="Team member">
          <button v-for="f in FILTERS" :key="f.id" type="button" :aria-pressed="filter === f.id" @click="filter = f.id">{{ f.label }}</button>
        </div>
        <div class="tlg-seg" role="group" aria-label="Period">
          <button v-for="p in PERIODS" :key="p.id" type="button" :aria-pressed="period === p.id" @click="period = p.id">{{ p.label }}</button>
        </div>
        <div v-if="view === 'chart'" class="tlg-seg" role="group" aria-label="Time scale">
          <button type="button" :aria-pressed="scale === 'week'" @click="scale = 'week'">Week</button>
          <button type="button" :aria-pressed="scale === 'month'" @click="scale = 'month'">Month</button>
        </div>
        <div class="tlg-controls__end">
          <div v-if="narrow" class="tlg-seg" role="group" aria-label="Layout">
            <button type="button" :aria-pressed="view === 'list'" @click="view = 'list'">List</button>
            <button type="button" :aria-pressed="view === 'chart'" @click="view = 'chart'">Chart</button>
          </div>
          <button v-if="view === 'chart'" type="button" class="tlg-btn" :aria-pressed="allOpen" @click="toggleAll">{{ allOpen ? 'Collapse all' : 'Expand all' }}</button>
          <button v-if="view === 'chart'" type="button" class="tlg-btn tlg-btn--today" :disabled="today == null" @click="goToday">Today <span aria-hidden="true">↗</span></button>
        </div>
      </div>
      <p v-if="notice && view === 'chart'" class="tlg-notice" role="status">{{ notice }}</p>
      <ul class="tlg-legend" aria-label="Legend">
        <li v-for="m in MEMBERS" :key="m.id"><i class="tlg-key" :class="`tlg--${m.id}`" />{{ m.first }}</li>
        <li><i class="tlg-key tlg-key--done" /><span>Completed <span aria-hidden="true">✓</span></span></li>
        <li><i class="tlg-key tlg-key--progress" />In progress (striped)</li>
        <li><i class="tlg-key tlg-key--milestone" />Milestone</li>
        <li><i class="tlg-key tlg-key--today" />Today</li>
      </ul>
    </GlassSurface>

    <!-- ===== chart ===== -->
    <div v-show="view === 'chart'" class="tlg-chart" :class="`is-${scale}`" :style="{ '--label-w': `${LABEL_W}px` }">
      <div class="tlg-axis" aria-hidden="true">
        <div class="tlg-axis__corner"><span>Team member / Task</span><span class="tlg-axis__year">{{ yearLabel }}</span></div>
        <div class="tlg-axis__view">
          <div class="tlg-axis__inner" :style="{ width: `${width}px`, transform: `translate3d(${-scrollX}px,0,0)` }">
            <div class="tlg-axis__bands">
              <span v-for="b in bands" :key="b.cls" class="tlg-band" :class="`tlg-band--${b.cls}`" :style="{ left: b.left, width: b.width }">{{ b.label }}</span>
            </div>
            <div class="tlg-axis__months">
              <span v-for="m in months" :key="m.key" :style="{ left: `${m.left}px`, width: `${m.w}px` }" :title="m.long">{{ m.label }}</span>
            </div>
            <div v-if="scale === 'week'" class="tlg-axis__weeks">
              <span v-for="w in weekCols" :key="w.key" :style="{ left: `${w.left}px` }"><b>{{ w.code }}</b>{{ w.date }}</span>
            </div>
            <span v-if="todayIn" class="tlg-axis__today" :style="{ left: `${todayX}px` }">Today</span>
          </div>
        </div>
      </div>

      <div ref="scroller" class="tlg-scroll" tabindex="0" role="region" aria-label="Gantt chart (scrolls horizontally)" @scroll.passive="onScroll">
        <div class="tlg-body" :style="{ width: `${LABEL_W + width}px` }">
          <div class="tlg-grid" aria-hidden="true" :style="{ left: `${LABEL_W}px`, width: `${width}px` }">
            <span v-for="b in bands.filter((b) => b.cls === 'brk')" :key="b.cls" class="tlg-grid__break" :style="{ left: b.left, width: b.width }" />
            <span v-for="l in gridLines" :key="l" class="tlg-grid__line" :style="{ left: `${l}px` }" />
            <span v-if="todayIn" class="tlg-grid__today" :style="{ left: `${todayX}px` }" />
          </div>

          <div v-for="g in groups" :key="g.id" class="tlg-group" :class="`tlg--${g.id}`" :data-member="g.id" role="list" :aria-label="`${g.label}: ${g.count} tasks`">
            <div class="tlg-row tlg-row--group" role="listitem">
              <div class="tlg-label">
                <button type="button" :aria-expanded="groupOpen(g.id)" :aria-controls="`tlg-member-${g.id}`" @click="toggleGroup(g.id)">
                  <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 3 7.5 6 4.5 9" /></svg>
                  <span class="tlg-label__group">{{ g.label }}</span><span class="tlg-label__count">{{ g.count }} task{{ g.count === 1 ? '' : 's' }}</span>
                </button>
              </div>
              <div class="tlg-track" aria-hidden="true">
                <span v-for="t in g.streams.flatMap((s) => s.tasks)" :key="t.id" class="tlg-span__seg tlg-span__seg--member" :style="{ left: bar(t.start, t.end).left, width: bar(t.start, t.end).width }" />
              </div>
            </div>
            <div :id="`tlg-member-${g.id}`" class="tlg-tasks" :class="{ 'is-open': groupOpen(g.id) }" :inert="!groupOpen(g.id) || undefined">
            <div class="tlg-tasks__inner">
            <template v-for="s in g.streams" :key="s.key">
              <div class="tlg-row tlg-row--stream" role="listitem">
                <div class="tlg-label">
                  <button type="button" :aria-expanded="isOpen(s)" :aria-controls="`tlg-${s.key.replace(/[^a-z0-9]+/gi, '-')}`" @click="toggle(s)">
                    <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 3 7.5 6 4.5 9" /></svg>
                    <span class="tlg-label__text">
                      <span class="tlg-label__name">{{ s.label }}</span>
                      <span class="tlg-label__sub">{{ s.tasks.length }} task{{ s.tasks.length === 1 ? '' : 's' }}<template v-if="s.recorded"> · {{ s.recorded }}</template></span>
                    </span>
                  </button>
                </div>
                <div class="tlg-track" aria-hidden="true">
                  <span class="tlg-span" :class="{ 'is-clip-l': bar(s.start, s.end).clipL, 'is-clip-r': bar(s.start, s.end).clipR }" :style="{ left: bar(s.start, s.end).left, width: bar(s.start, s.end).width }" />
                  <span v-for="t in s.tasks" :key="t.id" class="tlg-span__seg" :style="{ left: bar(t.start, t.end).left, width: bar(t.start, t.end).width }" />
                </div>
              </div>
              <div :id="`tlg-${s.key.replace(/[^a-z0-9]+/gi, '-')}`" class="tlg-tasks" :class="{ 'is-open': isOpen(s) }" :inert="!isOpen(s) || undefined" role="list" :aria-label="`${s.label} tasks`">
                <div class="tlg-tasks__inner">
                  <div v-for="t in s.tasks" :key="t.id" class="tlg-row tlg-row--task" :class="{ 'is-selected': selectedId === t.id }" :data-task="t.id" role="listitem">
                    <div class="tlg-label">
                      <button
                        type="button"
                        :aria-pressed="selectedId === t.id"
                        :aria-label="`${t.title}. ${assigned(t)}. ${fmtLong(t.start)} to ${fmtLong(t.end)}. Status: ${t.status}. Show details`"
                        @click="select(t, $event)"
                      >
                        <span class="tlg-label__text">
                          <span class="tlg-label__name">{{ t.title }}</span>
                          <span class="tlg-label__sub"><template v-if="t.owners.length !== 1">{{ t.owner }} · </template>{{ fmtShort(t.start) }} – {{ fmtShort(t.end) }}</span>
                        </span>
                      </button>
                    </div>
                    <div class="tlg-track">
                      <span
                        class="tlg-bar"
                        :class="[`is-${statusKey(t.status)}`, { 'is-milestone': t.milestone, 'is-clip-l': bar(t.start, t.end).clipL, 'is-clip-r': bar(t.start, t.end).clipR, 'is-selected': selectedId === t.id }]"
                        :style="{ left: bar(t.start, t.end).left, width: bar(t.start, t.end).width }"
                        :title="`${t.title} — ${fmt(t.start)} to ${fmt(t.end)} (${t.status})`"
                        aria-hidden="true"
                        @click="select(t, $event)"
                      >
                        <span v-if="t.status === 'Completed'" class="tlg-bar__mark">✓</span>
                        <span v-if="t.milestone" class="tlg-bar__diamond" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            </div>
            </div>
          </div>
          <p v-if="!groups.length" class="tlg-empty">No tasks in this view.</p>
        </div>
      </div>
      <p class="tlg-hint">Scroll sideways inside the chart (trackpad, Shift + wheel or the scrollbar) to move through time.</p>
    </div>

    <!-- ===== list (phones) ===== -->
    <div v-if="view === 'list'" class="tlg-list">
      <section v-for="g in listGroups" :key="g.id" class="tlg-list__group" :class="`tlg--${g.id}`">
        <h3>{{ g.label }} <span>{{ g.count }} tasks</span></h3>
        <div v-for="s in g.sems" :key="s.s" class="tlg-list__sem">
          <h4>{{ s.label }}</h4>
          <ul>
            <li v-for="t in s.tasks" :key="t.id">
              <button type="button" class="tlg-card" :class="{ 'is-selected': selectedId === t.id }" :data-task="t.id" :aria-pressed="selectedId === t.id" @click="select(t, $event)">
                <span class="tlg-card__ws">{{ t.workstream }}<template v-if="t.milestone"> · Milestone</template></span>
                <span class="tlg-card__title">{{ t.title }}</span>
                <span class="tlg-card__meta"><template v-if="t.owners.length !== 1">{{ t.owner }} · </template>{{ fmtShort(t.start) }} – {{ fmt(t.end) }}</span>
                <span class="tlg-card__meta">
                  <span class="tlg-status" :class="`is-${statusKey(t.status)}`">{{ t.status }}</span> · Completion: Not recorded
                </span>
              </button>
            </li>
          </ul>
        </div>
      </section>
      <p v-if="!listGroups.length" class="tlg-empty">No tasks in this view.</p>
    </div>

    <!-- ===== task details ===== -->
    <Transition name="tlg-details">
      <aside v-if="selected" ref="panel" class="tlg-details" :class="`tlg--${tone(selected)}`" role="dialog" aria-modal="false" aria-labelledby="tlg-details-title">
        <GlassSurface variant="panel" class="tlg-details__glass">
          <button type="button" class="tlg-details__close" aria-label="Close task details" @click="closeDetails">
            <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6" /></svg>
          </button>
          <p class="tlg-details__kicker">{{ selected.workstream }}</p>
          <h3 id="tlg-details-title" class="tlg-details__title" tabindex="-1">{{ selected.title }}</h3>
          <dl class="tlg-details__list">
            <div><dt>Assigned to</dt><dd>{{ assigned(selected) }}<template v-if="selected.owners.length > 1"> <span>(recorded as {{ selected.owner }})</span></template></dd></div>
            <div v-if="selected.group !== 'project'"><dt>Subsystem</dt><dd>{{ GROUP_LABEL[selected.group] }}</dd></div>
            <div><dt>Start date</dt><dd><time :datetime="new Date(selected.start * 864e5).toISOString().slice(0, 10)">{{ fmt(selected.start) }}</time> <span>{{ weekCode(selected.start) }}</span></dd></div>
            <div><dt>End date</dt><dd><time :datetime="new Date(selected.end * 864e5).toISOString().slice(0, 10)">{{ fmt(selected.end) }}</time> <span>{{ weekCode(selected.end) }}</span></dd></div>
            <div><dt>Duration</dt><dd>{{ weeksOf(selected) }} week{{ weeksOf(selected) === 1 ? '' : 's' }}</dd></div>
            <div><dt>Status</dt><dd><span class="tlg-status" :class="`is-${statusKey(selected.status)}`">{{ selected.status }}</span><template v-if="selected.milestone"> · Milestone</template></dd></div>
            <div><dt>Completion</dt><dd>{{ selected.completion == null ? 'Not recorded' : `${selected.completion}%` }}</dd></div>
            <div><dt>Recorded category</dt><dd>{{ selected.category }}</dd></div>
            <div v-if="selected.notes"><dt>Notes</dt><dd>{{ selected.notes }}</dd></div>
          </dl>
        </GlassSurface>
      </aside>
    </Transition>
  </section>
</template>
