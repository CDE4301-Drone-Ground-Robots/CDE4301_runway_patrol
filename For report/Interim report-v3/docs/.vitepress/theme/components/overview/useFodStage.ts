import { inject, onBeforeUnmount, onMounted, provide, ref, shallowRef, type InjectionKey, type Ref, type ShallowRef } from 'vue'
import { withBase } from 'vitepress'
import type { FodScene, SceneMode } from './fod-scene'

/**
 * One canvas, one WebGL context, one model load for the whole Overview page. Stages register a
 * host element; the canvas is moved into whichever registered host is most visible, and the scene
 * switches between the scroll-driven orbit (hero) and the free-roaming explorer (Explore FOD
 * Hunter). Rendering pauses when no host is on screen or the tab is hidden; everything is disposed
 * when the page unmounts.
 */
export type StageStatus = 'idle' | 'loading' | 'ready' | 'failed' | 'unsupported'
type HostName = 'hero' | 'highlights' | 'explorer'
interface Host {
  el: HTMLElement
  mode: SceneMode
  composition: () => number
  ratio: number
}
export interface StageApi {
  scene: ShallowRef<FodScene | null>
  status: Ref<StageStatus>
  active: Ref<HostName | null>
  register(name: HostName, el: HTMLElement, mode: Host['mode'], composition?: () => number): () => void
}
const KEY: InjectionKey<StageApi> = Symbol('fod-stage')

export function useFodStage() {
  const api = inject(KEY)
  if (!api) throw new Error('useFodStage() used outside <FodOverview>')
  return api
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export function provideFodStage(glbPath: string) {
  const scene = shallowRef<FodScene | null>(null)
  const status = ref<StageStatus>('idle')
  const active = ref<HostName | null>(null)
  const hosts = new Map<HostName, Host>()
  let canvas: HTMLCanvasElement | undefined
  let io: IntersectionObserver | undefined
  let ro: ResizeObserver | undefined
  let disposed = false

  function fit() {
    const h = active.value && hosts.get(active.value)
    if (!h || !scene.value) return
    const r = h.el.getBoundingClientRect()
    scene.value.resize(r.width, r.height)
    scene.value.setComposition(h.composition())
  }

  function choose() {
    let best: HostName | null = null
    let bestRatio = 0
    for (const [name, h] of hosts) if (h.ratio > bestRatio) ((best = name), (bestRatio = h.ratio))
    scene.value?.setVisible(best !== null)
    if (!best || best === active.value || !canvas) return
    const h = hosts.get(best)!
    h.el.appendChild(canvas)
    active.value = best
    scene.value?.setMode(h.mode)
    ro?.disconnect()
    ro?.observe(h.el)
    fit()
  }

  const api: StageApi = {
    scene,
    status,
    active,
    register(name, el, mode, composition = () => 0) {
      hosts.set(name, { el, mode, composition, ratio: 0 })
      io?.observe(el)
      return () => {
        io?.unobserve(el)
        hosts.delete(name)
        if (active.value === name) active.value = null
      }
    }
  }
  provide(KEY, api)

  const onPointer = (e: PointerEvent) => active.value !== 'explorer' && scene.value?.setPointer((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1)
  const onResize = () => fit()

  onMounted(async () => {
    if (!webglAvailable()) {
      status.value = 'unsupported'
      return
    }
    status.value = 'loading'
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches
    const quality = fine && innerWidth >= 900 ? 'high' : 'low'
    const { createFodScene } = await import('./fod-scene')
    if (disposed) return
    canvas = document.createElement('canvas')
    canvas.className = 'fod-canvas'
    canvas.setAttribute('aria-hidden', 'true')
    const s = createFodScene({
      canvas,
      glbUrl: withBase(glbPath),
      quality,
      reduced,
      onReady: () => !disposed && (status.value = 'ready'),
      onError: (e) => {
        console.warn('[FOD Hunter] model failed to load; keeping the static render.', e)
        if (!disposed) status.value = 'failed'
      }
    })
    scene.value = s
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) for (const h of hosts.values()) if (h.el === e.target) h.ratio = e.isIntersecting ? e.intersectionRatio : 0
        choose()
      },
      { threshold: [0, 0.05, 0.15, 0.3, 0.5, 0.7, 0.9, 1] }
    )
    for (const h of hosts.values()) io.observe(h.el)
    ro = new ResizeObserver(fit)
    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('resize', onResize)
    s.start()
  })

  onBeforeUnmount(() => {
    disposed = true
    io?.disconnect()
    ro?.disconnect()
    window.removeEventListener('pointermove', onPointer)
    window.removeEventListener('resize', onResize)
    scene.value?.dispose()
    scene.value = null
    canvas?.remove()
  })

  return api
}
