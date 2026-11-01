import { data } from './report.data'

/** Level 3: an individual technical document inside a section (3.4.1 Vision Research). */
export interface TocLeaf { id: string; num: string; title: string }
/** Level 2: a section (3.4 Computer Vision), optionally with documents of its own. */
export interface TocSub { id: string; num: string; title: string; leaves: TocLeaf[] }
/** Level 1: a chapter. */
export interface TocChapter { id: string; num: string; title: string; subs: TocSub[]; group?: string; missing?: boolean }

/** Report navigation: two preliminary sections, then chapters → sections → documents of the composed report. */
const chapters: TocChapter[] = []
for (const h of data.headings) {
  if (h.level === 2) {
    const n = chapters.length + 1
    chapters.push({ id: h.id, num: String(n).padStart(2, '0'), title: h.title, subs: [], missing: !!h.note, group: n === 1 ? 'Report' : undefined })
  } else if (h.level === 3 && chapters.length) {
    const c = chapters[chapters.length - 1]
    c.subs.push({ id: h.id, num: `${Number(c.num)}.${c.subs.length + 1}`, title: h.title, leaves: [] })
  } else if (h.level === 4 && chapters.length) {
    const s = chapters[chapters.length - 1].subs.at(-1)
    if (s) s.leaves.push({ id: h.id, num: `${s.num}.${s.leaves.length + 1}`, title: h.title })
  }
}

export const toc: TocChapter[] = [
  { id: 'acknowledgements', num: '', title: 'Acknowledgements', subs: [], group: 'Preliminary' },
  { id: 'executive-summary', num: '', title: 'Executive Summary', subs: [] },
  ...chapters
]
