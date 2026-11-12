import DefaultTheme from 'vitepress/theme'
import { useData, useRoute, withBase, type Theme } from 'vitepress'
import { defineAsyncComponent, defineComponent, h, nextTick, onMounted, watch } from 'vue'
import { MotionConfig } from 'motion-v'
import AmbientBackground from './components/AmbientBackground.vue'
import DocOwnership from './components/DocOwnership.vue'
import GlassFilterDefs from './components/GlassFilterDefs.vue'
import GlassSurface from './components/GlassSurface.vue'
import AssetLink from './components/content/AssetLink.vue'
import Card from './components/content/Card.vue'
import CardGrid from './components/content/CardGrid.vue'
import Figure from './components/content/Figure.vue'
import MissingAsset from './components/content/MissingAsset.vue'
import SubsystemLead from './components/report/SubsystemLead.vue'
import Stat from './components/content/Stat.vue'
import VideoClip from './components/content/VideoClip.vue'
import DecisionCard from './components/DecisionCard.vue'
import BugCard from './components/BugCard.vue'
import StageStepper from './components/StageStepper.vue'
import { prefersReducedMotion, supportsViewTransitions } from './composables/motionEnv'
import { reveal } from './components/report/navigate'
import { duration, ease, spring } from './motion/tokens'
import '@fontsource/italiana/400.css'
import '@fontsource/outfit/300.css'
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/500.css'
import './custom.css'
import './motion.css'
import './overview.css'
import './report.css'
import './content.css'
import './overview-sections.css'
import './timeline.css'
import './components/widgets/widgets.css'

export default {
  extends: DefaultTheme,
  Layout: defineComponent({
    name: 'FodHunterLayout',
    setup() {
      const { page, site } = useData()
      const route = useRoute()
      // Retired URLs whose content now lives elsewhere: old links land on the right place.
      const retired: Record<string, string> = {
        about: '/report#introduction',
        solution: '/report#overview-of-design',
        subsystems: '/report',
        references: '/report#references',
        'research/primary': '/report#primary-research',
        'research/secondary': '/report#secondary-research',
        'shared/literature/primary-research': '/report#primary-research',
        'shared/literature/problem-statement': '/report#secondary-research',
        'shared/literature/references': '/report#refs-literature'
      }
      // A link to something inside a closed dropdown (e.g. a citation into a collapsed reference list) opens it
      // first, in the capture phase, so VitePress then scrolls to the now-visible target.
      onMounted(() => {
        const hashTarget = (hash: string) => (hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null)
        document.addEventListener(
          'click',
          (e) => {
            const a = (e.target as Element | null)?.closest?.('a[href*="#"]') as HTMLAnchorElement | null
            if (a && a.pathname === location.pathname) reveal(hashTarget(a.hash))
          },
          true
        )
        addEventListener('hashchange', () => {
          const el = hashTarget(location.hash)
          if (reveal(el)) el?.scrollIntoView()
        })
      })
      onMounted(() =>
        watch(
          () => [page.value.isNotFound, route.path] as const,
          ([missing, p]) => {
            const key = p.slice(site.value.base.length).replace(/(\.html|\/)$/, '')
            if (missing && retired[key]) location.replace(withBase(retired[key]))
          },
          { immediate: true }
        )
      )
      // reducedMotion "user": every motion-v animation drops transforms under prefers-reduced-motion.
      return () =>
        h(MotionConfig, { reducedMotion: 'user', transition: spring.ui }, () =>
          h(DefaultTheme.Layout, null, {
            'layout-top': () => h(AmbientBackground),
            'doc-before': () => h(DocOwnership),
            'layout-bottom': () => h(GlassFilterDefs)
          })
        )
    }
  }),
  enhanceApp({ app, router }) {
    app.component('GlassSurface', GlassSurface)
    // Author-facing content components (usable in any Markdown page; see the repository README)
    for (const [name, c] of Object.entries({ Card, CardGrid, Stat, Figure, VideoClip, AssetLink, MissingAsset, SubsystemLead, DecisionCard, BugCard, StageStepper })) app.component(name, c)
    // Interactive widgets — one async chunk each, loaded only by pages that use them
    const widgets = import.meta.glob('./components/widgets/*.vue')
    for (const [file, load] of Object.entries(widgets)) {
      app.component(file.replace(/^.*\/|\.vue$/g, ''), defineAsyncComponent(load as () => Promise<{ default: object }>))
    }
    // Page-specific sections load as separate chunks (still server-rendered).
    app.component('FodOverview', defineAsyncComponent(() => import('./components/overview/FodOverview.vue')))
    app.component('MilestoneTracker', defineAsyncComponent(() => import('./components/overview/MilestoneTracker.vue')))
    app.component('PlanAccordion', defineAsyncComponent(() => import('./components/overview/PlanAccordion.vue')))
    app.component('PlanEntry', defineAsyncComponent(() => import('./components/overview/PlanEntry.vue')))

    if (typeof window === 'undefined') return

    // Route transitions. Preferred: native View Transition (root crossfade + rise, motion.css).
    // Fallback: WAAPI fade/rise on .VPContent. Skipped on the hydration route, for same-page
    // hash links (so heading anchors scroll normally), and under reduced motion.
    let inViewTransition = false
    let firstRoute = true
    const samePage = (href: string) => new URL(href, location.href).pathname === location.pathname

    router.onBeforeRouteChange = (href) => {
      if (inViewTransition || firstRoute || samePage(href) || prefersReducedMotion() || !supportsViewTransitions()) return
      inViewTransition = true
      document.documentElement.classList.add('vt-route')
      const transition = document.startViewTransition(async () => {
        await router.go(href)
        await nextTick()
      })
      const safety = window.setTimeout(() => transition.skipTransition(), 1200)
      // a skipped transition (slow page, safety timeout) rejects `ready`; that is expected, not an error
      transition.ready.catch(() => undefined)
      transition.finished
        .catch(() => undefined)
        .finally(() => {
          window.clearTimeout(safety)
          inViewTransition = false
          document.documentElement.classList.remove('vt-route')
        })
      return false
    }

    router.onAfterRouteChange = () => {
      if (firstRoute) {
        firstRoute = false
        return
      }
      if (inViewTransition || prefersReducedMotion()) return
      document.querySelector('.VPContent')?.animate(
        [
          { opacity: 0, transform: 'translateY(6px)' },
          { opacity: 1, transform: 'none' }
        ],
        { duration: duration.page * 1000, easing: `cubic-bezier(${ease.out.join(',')})` }
      )
    }
  }
} satisfies Theme
