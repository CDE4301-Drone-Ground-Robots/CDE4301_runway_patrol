/**
 * Mirror Hall scene: five portrait cards on an invisible ring above a dark reflective floor.
 *
 * The cards are real DOM (buttons with text) placed in 3D by CSS3DRenderer, so they stay crisp, focusable
 * and clickable. A WebGL pass with the same camera draws what the DOM cannot: each card's reflection (its
 * photo, mirrored, faded and rippled) and the floor's lighting. Both read one ring angle, so the
 * reflections can never drift from the cards. Without WebGL the cards still work; only the reflections
 * are missing (the floor falls back to the CSS gradient behind the stage).
 *
 * Units are CSS pixels (CSS3DRenderer's world unit). The ring angle is unbounded: the carousel has no ends.
 */
import {
  Color,
  DoubleSide,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector3,
  WebGLRenderer
} from 'three'
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js'

export interface MirrorSceneOptions {
  host: HTMLElement
  cards: HTMLElement[]
  /** portrait URL per card, for the reflections */
  photos: string[]
  /** CSS object-position per card ("50% 30%"), so reflections crop like the cards */
  focus: string[]
  reduced: boolean
  onFocusChange?: (index: number) => void
}

const TAU = Math.PI * 2

const reflectionVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
// The mesh is the card mirrored below the floor; uv.y = 0 is the edge touching the floor.
const reflectionFrag = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec2 uScale;
  uniform vec2 uOffset;
  uniform float uTime;
  uniform float uRipple;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float depth = vUv.y;
    vec2 uv = vUv;
    // ripples grow with distance from the floor edge and with how fast the ring is turning
    uv.x += sin(depth * 46.0 - uTime * 2.4) * uRipple * depth;
    uv.y += sin(uv.x * 30.0 + uTime * 1.7) * uRipple * 0.5 * depth;
    vec3 col = texture2D(uMap, uv * uScale + uOffset).rgb;
    col *= 0.62;
    col = mix(col, col * vec3(0.78, 0.86, 1.08), 0.5);
    float fade = 1.0 - smoothstep(0.0, 0.62, depth);
    gl_FragColor = vec4(col, fade * uOpacity * 0.7);
  }
`
const floorVert = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`
// Dark glossy floor: near-black, bronze pool of light under the focused card, sapphire glow behind the ring,
// faint concentric ripples, fading into the background colour towards the horizon.
const floorFrag = /* glsl */ `
  uniform float uTime;
  uniform float uRipple;
  uniform float uRadius;
  uniform vec3 uBg;
  varying vec3 vWorld;
  void main() {
    vec2 p = vWorld.xz;
    float front = length((p - vec2(0.0, uRadius)) / vec2(1.25, 0.75)) / uRadius;
    float back = length((p - vec2(0.0, -uRadius * 0.6)) / vec2(1.6, 0.9)) / uRadius;
    vec3 bronze = vec3(0.91, 0.64, 0.36);
    vec3 sapphire = vec3(0.30, 0.48, 0.86);
    vec3 col = uBg;
    col += bronze * 0.11 * exp(-front * front * 2.6);
    col += sapphire * 0.07 * exp(-back * back * 1.8);
    float r = length(p - vec2(0.0, uRadius * 0.4));
    col += vec3(0.6, 0.7, 0.9) * 0.012 * (0.5 + 0.5 * sin(r * 0.045 - uTime * 1.2)) * (0.4 + uRipple * 40.0);
    // translucent near the cards so their reflections show through, opaque into the distance
    float dist = length(p) / uRadius;
    float alpha = mix(0.24, 0.92, smoothstep(0.9, 3.0, dist));
    // and dissolves into the background towards the horizon, so there is no hard edge
    alpha *= 1.0 - smoothstep(3.2, 8.5, dist);
    gl_FragColor = vec4(col, alpha);
  }
`

export function createMirrorScene(opts: MirrorSceneOptions) {
  const { host, cards, reduced } = opts
  const n = cards.length
  const step = TAU / n

  let W = 300
  let H = 400
  let R = 520
  const GAP = 18 // cards float this far above the floor

  // ---------- cameras & renderers ----------
  const camera = new PerspectiveCamera(30, 1, 10, 20000)
  const target = new Vector3()

  const css = new CSS3DRenderer()
  css.domElement.className = 'mh-css3d'
  const cssScene = new Scene()
  const objects = cards.map((el) => {
    const o = new CSS3DObject(el)
    cssScene.add(o)
    return o
  })

  let gl: WebGLRenderer | null = null
  try {
    gl = new WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' })
    gl.setClearColor(0x000000, 0)
    gl.domElement.className = 'mh-gl'
  } catch {
    gl = null // no WebGL: cards still work, the floor is the CSS gradient
  }
  if (gl) host.appendChild(gl.domElement)
  host.appendChild(css.domElement)

  const glScene = new Scene()
  const loader = new TextureLoader()
  const reflGeo = new PlaneGeometry(1, 1)
  const reflections = opts.photos.map((url, i) => {
    const mat = new ShaderMaterial({
      vertexShader: reflectionVert,
      fragmentShader: reflectionFrag,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      uniforms: {
        uMap: { value: null as Texture | null },
        uScale: { value: [1, 1] },
        uOffset: { value: [0, 0] },
        uTime: { value: 0 },
        uRipple: { value: 0 },
        uOpacity: { value: 0 }
      }
    })
    const mesh = new Mesh(reflGeo, mat)
    mesh.renderOrder = 1
    glScene.add(mesh)
    if (gl) {
      loader.load(url, (tex) => {
        tex.colorSpace = SRGBColorSpace
        mat.uniforms.uMap.value = tex
        coverUv(mat, tex, opts.focus[i])
        requestRender()
      })
    }
    return mesh
  })
  const floorGeo = new PlaneGeometry(12000, 12000)
  const floorMat = new ShaderMaterial({
    vertexShader: floorVert,
    fragmentShader: floorFrag,
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uRipple: { value: 0 }, uRadius: { value: R }, uBg: { value: new Color(0x050507) } }
  })
  const floor = new Mesh(floorGeo, floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.renderOrder = 2 // over the reflections: they read as lying under a glossy surface
  glScene.add(floor)

  // object-fit: cover for the reflection texture, matching the card's crop
  function coverUv(mat: ShaderMaterial, tex: Texture, focus: string) {
    const img = tex.image as { width: number; height: number }
    const imgAspect = img.width / img.height
    const cardAspect = W / H
    let sx = 1
    let sy = 1
    if (imgAspect > cardAspect) sx = cardAspect / imgAspect
    else sy = imgAspect / cardAspect
    const [fx, fy] = (focus || '50% 50%').split(/\s+/).map((v) => parseFloat(v) / 100)
    mat.uniforms.uScale.value = [sx, sy]
    // texture v runs bottom-up; the CSS focus is measured from the top
    mat.uniforms.uOffset.value = [(1 - sx) * fx, (1 - sy) * (1 - fy)]
  }

  // ---------- state ----------
  let angle = 0 // ring rotation (radians), unbounded
  let velocity = 0 // radians per second while coasting
  let goal: number | null = null // snap / select target angle
  let focusIndex = 0
  /** 0..1 for the opened card: lift towards the viewer (lift) and the first half of the flip (flip) */
  const open = { index: -1, lift: 0, flip: 0, dim: 0 }
  let time = 0
  let visible = true
  let raf = 0
  let running = false
  let last = 0
  let idleTick = false

  const wrapIndex = (i: number) => ((i % n) + n) % n
  const nearestIndex = () => wrapIndex(Math.round(-angle / step))

  function layout() {
    const lift = open.lift
    for (let i = 0; i < n; i++) {
      // wrap to [-π, π): the card's turn must be measured from the front, or cards past 180° show their backs
      const theta = Math.atan2(Math.sin(i * step + angle), Math.cos(i * step + angle))
      const c = Math.cos(theta)
      const s = Math.sin(theta)
      const o = objects[i]
      const isOpen = i === open.index
      const forward = isOpen ? lift * R * 0.36 : 0
      const up = isOpen ? lift * 26 : 0
      o.position.set(s * R, GAP + H / 2 + up, c * R + forward)
      // cards turn half as fast as the ring: side cards stay angled towards the viewer, not edge-on
      o.rotation.y = theta * 0.55 + (isOpen ? open.flip * (Math.PI / 2) : 0)
      // prominence: front card brightest, cards behind the ring recede
      const front = (c + 1) / 2
      const dim = isOpen ? 0 : open.dim
      const op = (0.18 + 0.82 * Math.pow(front, 1.6)) * (1 - dim * 0.75)
      const el = cards[i]
      el.style.opacity = op.toFixed(3)
      el.style.filter = `brightness(${(0.45 + 0.55 * Math.pow(front, 1.2)) * (1 - dim * 0.4)})`
      el.style.visibility = isOpen && open.flip >= 0.999 ? 'hidden' : 'visible'

      const m = reflections[i]
      m.position.set(o.position.x, -(GAP + H / 2 + up), o.position.z)
      m.rotation.y = o.rotation.y
      m.scale.set(W * Math.max(0.02, Math.cos(isOpen ? open.flip * (Math.PI / 2) : 0)), -H, 1)
      ;(m.material as ShaderMaterial).uniforms.uOpacity.value = op * (isOpen ? 1 - open.flip : 1)
    }
    const f = nearestIndex()
    if (f !== focusIndex) {
      focusIndex = f
      opts.onFocusChange?.(f)
    }
  }

  function render() {
    layout()
    camera.lookAt(target)
    css.render(cssScene, camera)
    if (gl) {
      const ripple = reduced ? 0 : 0.0035 + Math.min(Math.abs(velocity) * 0.006, 0.02)
      for (const m of reflections) {
        const u = (m.material as ShaderMaterial).uniforms
        u.uTime.value = time
        u.uRipple.value = ripple
      }
      floorMat.uniforms.uTime.value = time
      floorMat.uniforms.uRipple.value = ripple
      gl.render(glScene, camera)
    }
  }

  // ---------- animation ----------
  function frame(now: number) {
    raf = 0
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60)
    last = now
    if (!reduced) time += dt
    let moving = false
    if (!dragging) {
      if (goal !== null) {
        // critically damped approach to the snap target
        const k = reduced ? 1 : 1 - Math.exp(-dt * 9)
        angle += (goal - angle) * k
        velocity = 0
        if (Math.abs(goal - angle) < 0.0005) {
          angle = goal
          goal = null
        } else moving = true
      } else if (Math.abs(velocity) > 0.02) {
        angle += velocity * dt
        velocity *= Math.exp(-dt * 2.6) // inertia: coasts briefly, then settles
        moving = true
        if (Math.abs(velocity) < 0.35) snap()
      } else if (velocity !== 0) {
        velocity = 0
        snap()
        moving = true
      }
    } else moving = true
    // idle (only the ripples move): draw every other frame
    idleTick = !idleTick
    if (moving || animating > 0 || idleTick) render()
    // keep ripples alive while on screen; otherwise render only when something moves
    if (visible && (moving || animating > 0 || (!reduced && gl))) schedule()
    else running = false
  }
  function schedule() {
    running = true
    if (!raf) raf = requestAnimationFrame(frame)
  }
  function requestRender() {
    if (!visible) return
    if (!running) last = 0
    schedule()
  }

  function snap() {
    goal = Math.round(angle / step) * step
  }

  // ---------- input ----------
  let dragging = false
  let pointerId = -1
  let startX = 0
  let startAngle = 0
  let lastX = 0
  let lastT = 0
  let moved = false
  let suppressClickUntil = 0
  const DRAG_THRESHOLD = 6

  const pxToAngle = () => (step * 1.15) / Math.max(240, host.clientWidth * 0.32)

  function onDown(e: PointerEvent) {
    if (open.index >= 0 || e.button !== 0) return
    pointerId = e.pointerId
    startX = lastX = e.clientX
    lastT = performance.now()
    startAngle = angle
    moved = false
    velocity = 0
    goal = null
    dragging = true
    addEventListener('pointermove', onMove)
    addEventListener('pointerup', onUp)
    addEventListener('pointercancel', onUp)
    requestRender()
  }
  function onMove(e: PointerEvent) {
    if (e.pointerId !== pointerId) return
    const dx = e.clientX - startX
    if (!moved && Math.abs(dx) < DRAG_THRESHOLD) return
    moved = true
    const now = performance.now()
    const dt = Math.max(1, now - lastT) / 1000
    const inst = ((e.clientX - lastX) * pxToAngle()) / dt
    velocity = velocity * 0.6 + inst * 0.4
    lastX = e.clientX
    lastT = now
    angle = startAngle + dx * pxToAngle()
  }
  function onUp(e: PointerEvent) {
    if (e.pointerId !== pointerId) return
    removeEventListener('pointermove', onMove)
    removeEventListener('pointerup', onUp)
    removeEventListener('pointercancel', onUp)
    dragging = false
    pointerId = -1
    if (moved) {
      suppressClickUntil = performance.now() + 250 // the click after a drag must not open a profile
      velocity = Math.max(-6, Math.min(6, velocity))
      if (reduced || Math.abs(velocity) < 0.35) snap()
    } else velocity = 0
    requestRender()
  }
  host.addEventListener('pointerdown', onDown)

  // ---------- sizing ----------
  function resize() {
    const w = host.clientWidth
    const h = host.clientHeight
    const small = w < 640
    const medium = w < 1100
    W = small ? 210 : medium ? 250 : 300
    H = Math.round(W * 4 / 3)
    R = small ? W * 1.45 : W * 1.75
    for (const el of cards) {
      el.style.width = `${W}px`
      el.style.height = `${H}px`
      el.style.fontSize = `${(W / 20).toFixed(1)}px` // card type scales with the card
    }
    camera.fov = small ? 34 : 30
    camera.aspect = w / h
    // distance so the front card fills ~60% (desktop) / ~52% (phone) of the stage height
    const share = small ? 0.52 : 0.6
    const d = H / share / (2 * Math.tan((camera.fov * Math.PI) / 360))
    const cy = GAP + H * 0.52
    camera.position.set(0, cy + H * 0.16, R + d)
    target.set(0, cy - H * 0.04, 0)
    camera.updateProjectionMatrix()
    css.setSize(w, h)
    if (gl) {
      gl.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1 : 1.5))
      gl.setSize(w, h)
    }
    floorMat.uniforms.uRadius.value = R
    reflections.forEach((m, i) => {
      const tex = (m.material as ShaderMaterial).uniforms.uMap.value as Texture | null
      if (tex?.image) coverUv(m.material as ShaderMaterial, tex, opts.focus[i])
    })
    requestRender()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(host)
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting
    if (visible) requestRender()
  })
  io.observe(host)
  resize()

  let animating = 0
  return {
    get focusIndex() {
      return focusIndex
    },
    /** true right after a drag, so the click that ends it is ignored */
    clickSuppressed: () => performance.now() < suppressClickUntil,
    /** rotate (the shortest way) until card i is at the front */
    focus(i: number) {
      const base = -i * step
      const k = Math.round((angle - base) / TAU)
      goal = base + k * TAU
      velocity = 0
      requestRender()
      const dist = Math.abs(goal - angle)
      return dist < 0.001 ? 0 : reduced ? 0 : Math.min(700, 220 + dist * 380) // ms until settled
    },
    next(dir: 1 | -1) {
      const cur = goal ?? Math.round(angle / step) * step
      goal = cur - dir * step
      velocity = 0
      requestRender()
    },
    /** open-state values animated from outside (GSAP); call during the tween */
    openState: open,
    beginAnimation() {
      animating++
      requestRender()
    },
    endAnimation() {
      animating = Math.max(0, animating - 1)
      requestRender()
    },
    requestRender,
    dispose() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      host.removeEventListener('pointerdown', onDown)
      removeEventListener('pointermove', onMove)
      removeEventListener('pointerup', onUp)
      reflections.forEach((m) => {
        const mat = m.material as ShaderMaterial
        ;(mat.uniforms.uMap.value as Texture | null)?.dispose()
        mat.dispose()
      })
      reflGeo.dispose()
      floorGeo.dispose()
      floorMat.dispose()
      gl?.dispose()
      gl?.domElement.remove()
      // hand the card elements back to Vue's container before removing the 3D layer
      css.domElement.remove()
    }
  }
}

export type MirrorScene = ReturnType<typeof createMirrorScene>
