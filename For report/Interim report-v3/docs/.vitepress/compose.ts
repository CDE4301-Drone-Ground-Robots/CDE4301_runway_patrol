/**
 * Build-time report composition.
 *
 *   <!--@compose: ./members/asuka/vacuum-module.md#cfp-design{shift=2}-->
 *
 * inserts another Markdown file (or one `<!-- #region name -->…<!-- #endregion name -->` of it) at build
 * time. Unlike VitePress' @include, relative paths inside the inserted text — images, links, <Figure src>,
 * <VideoClip src>, <AssetLink href> — are rebased, so authors always write paths relative to their own
 * file (./assets/…) and the same text works on their page and inside the Overview report.
 * `shift=N` moves every heading N levels down (negative moves up). Nothing is fetched at runtime.
 *
 * `prefix=name` is for whole pages composed into one long page (the Report): the inserted text's anchor ids
 * get `name-` in front so two pages can both have `{#sec-1-summary}`, and an anchor `#name` marks where the
 * page starts. Links anywhere on the composing page that point at a prefixed page then stay on the page:
 * `[x](./members/hilbert/navigation.md#sec-2-overview)` becomes `[x](#nav-sec-2-overview)` (or `#nav` when
 * that id is not part of the composed region).
 */
import fs from 'node:fs'
import path from 'node:path'

export const COMPOSE_RE = /<!--\s*@compose:\s*([^\s#{]+)(#[\w-]+)?(\{[^}]*\})?\s*-->/g

export function expandCompose(file: string, src: string, onDep?: (dep: string) => void, depth = 0, pages = new Map<string, string>()): string {
  if (depth > 6) throw new Error(`@compose nested too deeply in ${file}`)
  const out = src.replace(COMPOSE_RE, (_m, rel: string, region?: string, opts?: string) => {
    const target = path.resolve(path.dirname(file), rel)
    if (!fs.existsSync(target)) throw new Error(`@compose target not found: ${rel} (in ${file})`)
    onDep?.(target)
    let text = fs.readFileSync(target, 'utf8').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
    if (region) text = extractRegion(text, region.slice(1), target)
    const shift = Number(/shift\s*=\s*(-?\d+)/.exec(opts || '')?.[1] ?? 0)
    const prefix = /prefix\s*=\s*([\w-]+)/.exec(opts || '')?.[1]
    if (prefix && !pages.has(target)) pages.set(target, prefix)
    // nested compositions first, so this level's shift, prefix and rebase apply to them too
    text = expandCompose(target, text, onDep, depth + 1, pages)
    text = shiftHeadings(text, shift)
    if (prefix) text = prefixIds(text, prefix)
    text = rebase(text, path.dirname(target), path.dirname(file))
    return prefix ? `<span id="${prefix}" class="compose-anchor"></span>\n\n${text}` : text
  })
  return depth === 0 && pages.size ? linkInPage(out, path.dirname(file), pages) : out
}

/** `{#id}` heading ids and `<a|span id="…">` anchors, plus same-page links to them, get `prefix-`. */
function prefixIds(text: string, prefix: string) {
  const ids = new Set<string>()
  text = text
    .replace(/\{#([\w-]+)\}/g, (_m, id: string) => (ids.add(id), `{#${prefix}-${id}}`))
    .replace(/(<(?:a|span)\b[^>]*\sid=")([\w-]+)(")/g, (_m, a: string, id: string, b: string) => (ids.add(id), a + prefix + '-' + id + b))
  return text
    .replace(/(\]\()#([\w-]+)\)/g, (m, a: string, id: string) => (ids.has(id) ? `${a}#${prefix}-${id})` : m))
    .replace(/(href=")#([\w-]+)(")/g, (m, a: string, id: string, b: string) => (ids.has(id) ? `${a}#${prefix}-${id}${b}` : m))
}

/** Links to pages composed (with a prefix) into this page become same-page anchors. */
function linkInPage(text: string, dir: string, pages: Map<string, string>) {
  const ids = new Set([...text.matchAll(/\{#([\w-]+)\}|\sid="([\w-]+)"/g)].map((m) => m[1] ?? m[2]))
  const local = (p: string, hash?: string) => {
    const prefix = pages.get(path.resolve(dir, p))
    if (!prefix) return null
    const want = hash ? `${prefix}-${hash.slice(1)}` : prefix
    return '#' + (ids.has(want) ? want : prefix)
  }
  return text
    .replace(/(\]\()(\.\.?\/[^)\s#]+\.md)(#[\w-]+)?\)/g, (m, a: string, p: string, h?: string) => {
      const to = local(p, h)
      return to ? `${a}${to})` : m
    })
    .replace(/(\shref=")(\.\.?\/[^"#]+\.md)(#[\w-]+)?(")/g, (m, a: string, p: string, h: string | undefined, b: string) => {
      const to = local(p, h)
      return to ? a + to + b : m
    })
}

function extractRegion(text: string, name: string, file: string) {
  const start = new RegExp(`<!--\\s*#region\\s+${name}\\s*-->`).exec(text)
  if (!start) throw new Error(`region "${name}" not found in ${file}`)
  const rest = text.slice(start.index + start[0].length)
  const end = new RegExp(`<!--\\s*#endregion(\\s+${name})?\\s*-->`).exec(rest)
  return end ? rest.slice(0, end.index) : rest
}

/** shift ATX headings outside fenced code blocks */
export function shiftHeadings(text: string, shift: number) {
  if (!shift) return text
  let fence = false
  return text
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) fence = !fence
      if (fence) return line
      return line.replace(/^(#{1,6})(\s)/, (_, h: string, sp: string) => '#'.repeat(Math.min(6, Math.max(1, h.length + shift))) + sp)
    })
    .join('\n')
}

/** rewrite ./ and ../ paths from the included file's folder to the including file's folder */
function rebase(text: string, fromDir: string, toDir: string) {
  if (path.resolve(fromDir) === path.resolve(toDir)) return text
  const fix = (p: string) => {
    if (!/^\.\.?\//.test(p)) return p
    let r = path.relative(toDir, path.resolve(fromDir, p)).replace(/\\/g, '/')
    if (!r.startsWith('.')) r = './' + r
    return r
  }
  return text
    .replace(/(\]\()(\.\.?\/[^)\s]+)/g, (_m, a: string, p: string) => a + fix(p)) // [text](./x) and ![alt](./x)
    .replace(/(\s(?:src|href|poster)=")(\.\.?\/[^"]+)(")/g, (_m, a: string, p: string, b: string) => a + fix(p) + b)
    .replace(/(<!--\s*@compose:\s*)(\.\.?\/[^\s#{]+)/g, (_m, a: string, p: string) => a + fix(p))
}

/** Headings of the composed Overview report (for the contents rail): `## Title {#id}` / `### Title {#id}` */
export interface OutlineHeading {
  level: number
  id: string
  title: string
  note?: string
}
/**
 * Contents-rail outline. Chapters (`##`) and sections (`###`) with an id come from the Report with every
 * @compose expanded (team partials such as problem-scope.md carry their own section heading). The third level
 * comes only from `#### Title {#id .rpt-l3}` lines written in report.md itself: composed member documents have
 * plenty of `####` headings of their own, and those must not flood the rail.
 */
export function reportHeadings(indexFile: string): OutlineHeading[] {
  const src = fs.readFileSync(indexFile, 'utf8').replace(/\r\n/g, '\n')
  const start = src.indexOf('<!-- report:start -->')
  const body = start >= 0 ? src.slice(start) : src
  const out: OutlineHeading[] = []
  const heading = /^(#{2,4})\s+(.+?)\s*\{#([\w-]+)((?:\s+\.[\w-]+)*)\}\s*$/
  const take = (text: string, fromReport: boolean) => {
    let fence = false
    for (const line of text.split('\n')) {
      if (/^\s*(```|~~~)/.test(line)) fence = !fence
      if (fence) continue
      const m = heading.exec(line)
      if (m) {
        const level = m[1].length
        if (level <= 3 || (fromReport && /\.rpt-l3\b/.test(m[4])) || (!fromReport && level === 4 && /^\d+\.\d+\.\d+\s+/.test(m[2])))
          out.push({ level, title: m[2].replace(/\\([*_`[\]])/g, '$1'), id: m[3] })
      }
      const note = /<!--\s*toc-note:\s*(.+?)\s*-->/.exec(line)
      if (note && out.length) out[out.length - 1].note = note[1]
    }
  }
  // walk report.md line by line so its own headings keep their order relative to composed text
  for (const line of body.split('\n')) {
    COMPOSE_RE.lastIndex = 0
    if (COMPOSE_RE.test(line)) take(expandCompose(indexFile, line), false)
    else take(line, true)
  }
  return out
}
