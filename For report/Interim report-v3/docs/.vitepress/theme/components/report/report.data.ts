/**
 * Build-time outline of the Report page for the contents rail: every `## Title {#id}` (chapter) and
 * `### Title {#id}` (subsection) after `<!-- report:start -->` in docs/report.md, with @compose expanded.
 * Re-runs whenever the Report page, a report partial or a member page changes.
 */
import path from 'node:path'
import { reportHeadings, type OutlineHeading } from '../../../compose'

export interface ReportOutline {
  headings: OutlineHeading[]
}
declare const data: ReportOutline
export { data }

export default {
  // Re-load on report changes
  watch: ['docs/report.md', 'docs/report/**/*.md', 'docs/index.md', 'docs/team.md'],
  load(watchedFiles: string[]): ReportOutline {
    const index = watchedFiles.find((f) => /(^|[\\/])docs[\\/]report\.md$/.test(f))
    if (!index) throw new Error('report.data: docs/report.md not found (run VitePress from the project root)')
    return { headings: reportHeadings(path.resolve(index)) }
  }
}
