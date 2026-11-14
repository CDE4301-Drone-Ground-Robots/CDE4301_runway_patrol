/**
 * Project schedule for the Timeline page (hero progress line + Gantt chart).
 *
 * Single source: docs/shared/assets/data/timeline.json — the team's exported Gantt (tasks, owners,
 * week indices, statuses) plus its week calendar (`calendar.weeks`, Monday–Sunday ISO dates). Edit that file;
 * nothing here holds schedule data of its own. Project start/end and the semester boundaries are derived from
 * the calendar, task dates from each task's week indices.
 *
 * Dates are calendar dates, never instants: an ISO date maps to a whole "day number" (days since 1970-01-01,
 * computed in UTC), and the visitor's today is their local calendar date mapped the same way. No time-of-day
 * or timezone offset can shift a bar or the today marker by a day.
 *
 * Nothing is inferred: the JSON records no completion percentages, so `completion` is always null and the UI
 * says "Not recorded". Status is shown exactly as recorded at `exportedAt`.
 */
import raw from '@docs/shared/assets/data/timeline.json'
import { memberById, team, type MemberId } from './team'

export type Group = 'programming' | 'mechanical' | 'electrical' | 'project'
export type Period = 'all' | 's1' | 's2'

interface RawTask {
  id: string
  owner: string
  ownerCode: string
  category: string
  title: string
  period: string
  startWeekIdx: number
  endWeekIdx: number
  semester: string
  isMilestone: boolean
  status: string
  notes?: string
}
interface RawWeek { index: number; code: string; semester: string; start: string; end: string }

const data = raw as unknown as { tasks: RawTask[]; exportedAt: string; calendar: { weeks: RawWeek[] } }

// ---------------- calendar dates ----------------
const DAY = 86_400_000
/** 'YYYY-MM-DD' → day number, or NaN when the string is not a real calendar date */
export function dayOf(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '')
  if (!m) return NaN
  const [y, mo, d] = [+m[1], +m[2], +m[3]]
  const t = Date.UTC(y, mo - 1, d)
  const back = new Date(t)
  return back.getUTCFullYear() === y && back.getUTCMonth() === mo - 1 && back.getUTCDate() === d ? t / DAY : NaN
}
export const isoOf = (day: number) => new Date(day * DAY).toISOString().slice(0, 10)
/** the visitor's local calendar date as a day number */
export function localToday(now = new Date()): number {
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const parts = (day: number) => {
  const d = new Date(day * DAY)
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), w: d.getUTCDay() }
}
/** 10 Aug 2026 */
export const fmt = (day: number) => {
  const p = parts(day)
  return `${p.d} ${MONTHS[p.m]} ${p.y}`
}
/** 10 Aug */
export const fmtShort = (day: number) => {
  const p = parts(day)
  return `${p.d} ${MONTHS[p.m]}`
}
/** Monday, 10 August 2026 (for screen readers) */
export const fmtLong = (day: number) => {
  const p = parts(day)
  return `${WEEKDAYS[p.w]}, ${p.d} ${MONTHS_LONG[p.m]} ${p.y}`
}
/** first day of the month containing `day`, and of the following month */
export const monthStart = (day: number) => {
  const p = parts(day)
  return Date.UTC(p.y, p.m, 1) / DAY
}
export const nextMonth = (day: number) => {
  const p = parts(day)
  return Date.UTC(p.y, p.m + 1, 1) / DAY
}
export const monthLabel = (day: number, long = false) => {
  const p = parts(day)
  return long ? `${MONTHS_LONG[p.m]} ${p.y}` : MONTHS[p.m]
}
export const yearOf = (day: number) => parts(day).y

// ---------------- weeks, project range, semesters ----------------
export interface Week { index: number; code: string; semester: string; start: number; end: number }
export const weeks: Week[] = (data.calendar?.weeks ?? []).map((w) => ({ index: w.index, code: w.code, semester: w.semester, start: dayOf(w.start), end: dayOf(w.end) }))

const span = (ws: Week[]) => (ws.length ? { start: Math.min(...ws.map((w) => w.start)), end: Math.max(...ws.map((w) => w.end)) } : null)
/** whole project: first calendar week's Monday → last calendar week's Sunday (null when the calendar is missing) */
export const project = span(weeks)
export const semesters = {
  s1: span(weeks.filter((w) => w.semester === '1')),
  s2: span(weeks.filter((w) => w.semester === '2'))
}
/** the weeks between the semesters (reading, exams, vacation — recorded as `vac`) */
export const breakSpan = semesters.s1 && semesters.s2 ? { start: semesters.s1.end + 1, end: semesters.s2.start - 1 } : null
export const exportedAt = data.exportedAt ? dayOf(data.exportedAt.slice(0, 10)) : NaN

/** visible date range of a period filter */
export function periodRange(p: Period): { start: number; end: number } | null {
  return p === 'all' ? project : semesters[p]
}

/** calendar week containing `day` (null in the unlisted 4–10 Jan week or outside the project) */
export const weekAt = (day: number) => weeks.find((w) => day >= w.start && day <= w.end) ?? null

// ---------------- time elapsed ----------------
export type ElapsedState = 'before' | 'during' | 'after' | 'invalid'
/**
 * P = (today − start) / (end − start) × 100, clamped to 0–100. Time only — it says nothing about how much of
 * the engineering is done.
 */
export function elapsed(today: number, start = project?.start ?? NaN, end = project?.end ?? NaN): { pct: number; state: ElapsedState } {
  if (![today, start, end].every(Number.isFinite) || end <= start) return { pct: 0, state: 'invalid' }
  if (today < start) return { pct: 0, state: 'before' }
  if (today > end) return { pct: 100, state: 'after' }
  return { pct: ((today - start) / (end - start)) * 100, state: 'during' }
}

// ---------------- tasks and workstreams ----------------
export interface Task {
  id: string
  title: string
  /** display name of the recorded owner ("All members" for whole-team tasks) */
  owner: string
  ownerCode: string
  /** members the task is recorded against: one, all five for whole-team tasks, none if the owner is unknown */
  owners: MemberId[]
  /** category exactly as recorded in the schedule */
  category: string
  group: Group
  workstream: string
  start: number
  end: number
  /** recorded week span, e.g. "S1 Wk1 - S1 Wk4" */
  period: string
  semester: string
  status: string
  milestone: boolean
  notes: string
  /** never recorded in the schedule: always null (shown as "Not recorded") */
  completion: number | null
}

/**
 * Recorded categories → Timeline workstreams. Where a category is one of the Report's sections it takes that
 * name (the recorded category stays visible in the task details); categories with no counterpart keep their
 * recorded name. Tasks are never moved between categories.
 */
export const WORKSTREAMS: { group: Group; label: string; categories: string[] }[] = [
  { group: 'programming', label: 'Navigation', categories: ['Navigation'] },
  { group: 'programming', label: 'Communication', categories: ['UAV Communication'] },
  { group: 'programming', label: 'Computer Vision', categories: ['Computer Vision & YOLO Architecture'] },
  { group: 'mechanical', label: 'Chassis', categories: ['Chassis Design & Assembly'] },
  { group: 'mechanical', label: 'Plate Design & Fabrication', categories: ['Plate Design & Fabrication'] },
  { group: 'mechanical', label: 'Structural Analysis & Validation', categories: ['Structural Analysis & Validation'] },
  { group: 'mechanical', label: 'Material Selection & Procurement', categories: ['Material Selection & Procurement'] },
  { group: 'mechanical', label: 'Mechanical Documentation', categories: ['Mechanical Documentation'] },
  { group: 'mechanical', label: 'Suspension', categories: ['Suspension Subsystem'] },
  { group: 'mechanical', label: 'Motor Drivetrain Calculations', categories: ['Motor Calculations'] },
  { group: 'mechanical', label: 'FOD Remediation', categories: ['Vacuum Subsystem'] },
  { group: 'electrical', label: 'Circuit Design & Component Selection', categories: ['Circuit Design & Component Selection'] },
  { group: 'electrical', label: 'Hardware Procurement & Assembly', categories: ['Hardware Procurement & Assembly'] },
  { group: 'electrical', label: 'Hardware Procurement & Electrical', categories: ['Hardware Procurement & Electrical'] },
  { group: 'electrical', label: 'Firmware & Testing', categories: ['Firmware & Testing'] },
  { group: 'project', label: 'Capstone Milestones', categories: ['Capstone Milestones'] },
  { group: 'project', label: 'Problem Finding & Definition', categories: ['Problem Finding & Definition'] },
  { group: 'project', label: 'Needs Definition', categories: ['Needs Definition'] },
  { group: 'project', label: 'Report', categories: ['Report'] },
  { group: 'project', label: 'Administrative', categories: ['Administrative'] },
  { group: 'project', label: 'Extra', categories: ['Extra'] }
]
export const GROUPS: { id: Group; label: string }[] = [
  { id: 'programming', label: 'Programming' },
  { id: 'mechanical', label: 'Mechanical' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'project', label: 'Project-wide' }
]

/** schedule order of the team (Hilbert, Asuka, Zacarias, Gabriel, Bryan) — the order of the shared team data */
export const MEMBERS = team.map((m) => ({ id: m.id, name: m.shortName, first: m.id.charAt(0).toUpperCase() + m.id.slice(1) }))
const ownerName = (t: RawTask) => (t.ownerCode === 'all' ? 'All members' : memberById(t.ownerCode)?.shortName ?? t.owner)
/** recorded owner → members: a member code resolves through the team data; "all" (isAllMembers) is the whole team */
const ownersOf = (t: RawTask): MemberId[] =>
  t.ownerCode === 'all' ? team.map((m) => m.id) : memberById(t.ownerCode) ? [t.ownerCode as MemberId] : []
const byCategory = new Map(WORKSTREAMS.flatMap((w) => w.categories.map((c) => [c, w] as const)))

export const tasks: Task[] = data.tasks.map((t) => {
  // an unmapped category is still shown (as its own project-wide workstream), never dropped
  const ws = byCategory.get(t.category) ?? { group: 'project' as Group, label: t.category }
  return {
    id: t.id,
    title: t.title,
    owner: ownerName(t),
    ownerCode: t.ownerCode,
    owners: ownersOf(t),
    category: t.category,
    group: ws.group,
    workstream: ws.label,
    start: weeks[t.startWeekIdx]?.start ?? NaN,
    end: weeks[t.endWeekIdx]?.end ?? NaN,
    period: t.period,
    semester: t.semester,
    status: t.status,
    milestone: !!t.isMilestone,
    notes: t.notes ?? '',
    completion: null
  }
})

export const semesterLabel = (s: string) => (s === '1' ? 'Semester 1' : s === '2' ? 'Semester 2' : s === 'vac' ? 'Break (reading, exams & vacation)' : s)
