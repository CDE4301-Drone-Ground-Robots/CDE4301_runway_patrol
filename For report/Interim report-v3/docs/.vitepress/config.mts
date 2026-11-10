import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vitepress'
import { expandCompose } from './compose'

const DOCS = fileURLToPath(new URL('..', import.meta.url))

// @wxperia/liquid-glass-vue@1.0.9 ships `new Worker(new URL("/assets/shader-worker-*.js", import.meta.url))`.
// The leading slash makes Vite look in *our* public/ dir and fail the build (upstream issue #7).
// Rewriting to a package-relative URL lets Vite bundle the worker that the package actually ships.
const fixLiquidGlassWorkerUrl = (): Plugin => ({
  name: 'fix-liquid-glass-worker-url',
  enforce: 'pre',
  transform(code, id) {
    if (!id.replace(/\\/g, '/').includes('/@wxperia/liquid-glass-vue/dist/')) return
    return { code: code.replace(/(["'])\/assets\/shader-worker-/g, '$1./assets/shader-worker-'), map: null }
  }
})

// Expands <!--@compose: …--> in Markdown before VitePress renders it (see compose.ts).
const composeMarkdown = (): Plugin => ({
  name: 'fod-compose-markdown',
  enforce: 'pre',
  transform(code, id) {
    if (!id.endsWith('.md') || !code.includes('@compose:')) return
    return { code: expandCompose(id, code, (dep) => this.addWatchFile(dep)), map: null }
  }
})

// Member documentation lives inside docs/report/ (one canonical source per topic, next to the Report text that
// composes it) but is also published as one page per document at a short, stable URL:
//   report/members/<m>/<page>.md -> /members/<m>/<page>
// A real report/ output folder next to report.html would make GitHub Pages redirect /report to /report/.
// With rewrites, relative links in those pages resolve from the published URL (members/<m>/).
// Primary and Secondary Research are read in the Report only (sections 1.2 and 1.3); they have no page of their own.
const MEMBERS = ['hilbert', 'asuka', 'zacarias', 'gabriel', 'bryan']
// Partials composed into the Report that are not standalone member pages
const NON_STANDALONE = ['software-environment.md']
function rewrites() {
  const map: Record<string, string> = {
    'report/members/index.md': 'members/index.md'
  }
  for (const m of MEMBERS)
    for (const f of fs.readdirSync(path.join(DOCS, 'report/members', m)).filter((f) => f.endsWith('.md') && f !== 'README.md' && !NON_STANDALONE.includes(f)))
      map[`report/members/${m}/${f}`] = `members/${m}/${f}`
  return map
}

// Sidebar for team documentation, built from the folders (title from frontmatter).
function memberSidebar() {
  const names: Record<string, string> = { hilbert: 'Hilbert Soh', asuka: 'Takeuchi Asuka', zacarias: 'Zacarias Ng', gabriel: 'Gabriel Tan', bryan: 'Bryan Ng' }
  const title = (f: string) => /^title:\s*"?(.+?)"?\s*$/m.exec(fs.readFileSync(f, 'utf8'))?.[1] ?? path.basename(f, '.md')
  return [
    { text: 'Documentation', items: [{ text: 'All documentation', link: '/members/' }] },
    ...MEMBERS.map((m) => ({
      text: names[m],
      collapsed: false,
      items: fs
        .readdirSync(path.join(DOCS, 'report/members', m))
        .filter((f) => f.endsWith('.md') && f !== 'README.md' && f !== 'index.md' && !NON_STANDALONE.includes(f))
        .sort((a, b) => {
          if (a === 'references.md') return 1
          if (b === 'references.md') return -1
          if (a === 'semester-2-plan.md') return 1
          if (b === 'semester-2-plan.md') return -1
          return a.localeCompare(b)
        })
        .map((f) => ({ text: title(path.join(DOCS, 'report/members', m, f)), link: `/members/${m}/${f.replace(/\.md$/, '')}` }))
    }))
  ]
}

// Site base path. GitHub Pages serves the site at /CDE4301_runway_patrol/; the deploy workflow
// (.github/workflows/deploy.yml at the repository root) sets VP_BASE for that build. Locally it is "/".
// Every link and asset goes through it.
const base = process.env.VP_BASE ?? '/'

export default defineConfig({
  title: 'FOD Hunter',
  description: 'FOD Hunter - Autonomous Multi-Agent Airfield Clearance System. NUS CDE4301 Runway Patrol.',
  lang: 'en-SG',
  base,
  // report/** are partials composed into the Report and the Overview (only member pages are published on their
  // own, see rewrites); README.md files are contributor guides for GitHub, not site pages.
  srcExclude: [
    'report/preliminary/**',
    'report/design-overview/**',
    'report/lead/**',
    'report/introduction/**',
    'report/conclusion.md',
    'report/references.md',
    'report/members/**/software-environment.md',
    '**/README.md'
  ],
  rewrites: rewrites(),
  cleanUrls: true,
  // permanently dark: VitePress hides its light/dark switch in this mode
  appearance: 'force-dark',
  lastUpdated: false,
  head: [
    // Explicit, base-aware icon: without it browsers request /favicon.ico at the origin root (404 under a sub-path).
    ['link', { rel: 'icon', href: `${base}favicon.ico` }],
    ['meta', { name: 'theme-color', content: '#0b0b10', media: '(prefers-color-scheme: dark)' }],
    ['meta', { name: 'theme-color', content: '#f5f5f7', media: '(prefers-color-scheme: light)' }]
  ],
  markdown: {
    math: true,
    lineNumbers: false,
    image: { lazyLoading: true },
    // Markdown tables get a scroll wrapper, so they can fill the column and still scroll on their own when wide
    config(md) {
      md.renderer.rules.table_open = () => '<div class="md-table">\n<table>\n'
      md.renderer.rules.table_close = () => '</table>\n</div>\n'
    }
  },
  vue: {
    template: {
      // relative paths in these components (as authors write them in Markdown) become imported, hashed,
      // base-aware asset URLs — exactly like Markdown images
      transformAssetUrls: {
        video: ['src', 'poster'],
        source: ['src'],
        img: ['src'],
        image: ['xlink:href', 'href'],
        Figure: ['src'],
        VideoClip: ['src', 'poster'],
        AssetLink: ['href']
      }
    }
  },
  vite: {
    plugins: [composeMarkdown(), fixLiquidGlassWorkerUrl()],
    resolve: {
      alias: {
        '@docs': DOCS
      }
    },
    // engineering files that pages link to or widgets load (models, diagrams, MATLAB, data)
    assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.drawio', '**/*.mlx', '**/*.mov', '**/*.xlsx', '**/*.stl'],
    // Pre-bundling would bypass the transform above in dev.
    optimizeDeps: { exclude: ['@wxperia/liquid-glass-vue'] }
  },
  themeConfig: {
    // nav bar: NUS logo + course code (styled as a chip in custom.css); the browser tab title stays "FOD Hunter"
    logo: { src: '/assets/images/nus-logo.png', alt: 'National University of Singapore', width: 75, height: 36 },
    siteTitle: 'ASI-406',
    // Research and Subsystem are dropdown buttons (VitePress flyouts: hover, keyboard and tap), not pages;
    // their items open sections of the Report (anchors are the Report's own heading ids).
    nav: [
      { text: 'Overview', link: '/' },
      { text: 'Meet the Team', link: '/team' },
      {
        text: 'Research',
        items: [
          { text: 'Primary Research', link: '/report#primary-research' },
          { text: 'Secondary Research', link: '/report#secondary-research' }
        ]
      },
      {
        text: 'Subsystem',
        items: [
          { text: 'Mechanical', link: '/report#mechanical' },
          { text: 'Electrical', link: '/report#electrical' },
          { text: 'Programming', link: '/report#programming' }
        ]
      },
      { text: 'Timeline', link: '/timeline' },
      { text: 'Report', link: '/report' }
    ],
    // Documentation is reached from the team page, the report and each section, not the top nav.
    sidebar: {
      '/members/': memberSidebar()
    },
    outline: { level: [2, 3], label: 'On this page' },
    docFooter: { prev: false, next: false },
    search: {
      provider: 'local',
      options: {
        // index composed report text as well as each page's own text
        async _render(src, env, md) {
          const file = env.realPath ?? env.path
          const text = file && src.includes('@compose:') ? expandCompose(file, src) : src
          return md.render(text, env)
        }
      }
    },
    footer: {
      message: 'NUS College of Design and Engineering · CDE4301 Innovation & Design Capstone',
      copyright: '© AY2627 FOD Hunter CDE4301 Team'
    }
  }
})
