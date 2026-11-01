/**
 * FOD Hunter cinematic scene (Overview page). One renderer / one WebGL context for the whole page:
 * the canvas is re-parented between the hero stage (scroll-driven 'orbit' mode) and the Explore
 * FOD Hunter viewer ('free' mode: OrbitControls rotate/pan, button zoom, wheel left to the page).
 *
 * Layers, drawn in order each frame:
 *  1. liquid-metal background (full-screen shader, bronze → sapphire with progress)
 *  2. the FOD Hunter CAD model (PBR, chiaroscuro key/rim/fill lighting, RoomEnvironment reflections)
 *  3. forge particles (additive points, warm orange 60 % / icy blue 40 %)
 *
 * Lighting, tone mapping, orbit and shader constants start from the Laocoön reference values supplied
 * in the design brief and are adapted to a ~1 m vehicle. Model orientation was determined from the
 * CAD: +Y up, +Z = vehicle front (front plate, camera and fans at z ≈ +0.40 m).
 */
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MathUtils,
  OrthographicCamera,
  CanvasTexture,
  MeshBasicMaterial,
  PerspectiveCamera,
  MOUSE,
  PlaneGeometry,
  PMREMGenerator,
  Points,
  Raycaster,
  TOUCH,
  Scene,
  ShaderMaterial,
  Sphere,
  SpotLight,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Material,
  type Object3D
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { disposeMaterials, upgradeMaterial } from './fod-materials'

export type Quality = 'high' | 'low'
export type SceneMode = 'orbit' | 'highlight' | 'free'
export interface SceneOptions {
  canvas: HTMLCanvasElement
  glbUrl: string
  quality: Quality
  reduced: boolean
  onReady?: () => void
  onError?: (e: unknown) => void
}
export interface ViewPreset {
  azimuth: number // degrees, 0 = from +Z (front), 90 = from +X (vehicle's left)
  elevation: number // degrees above horizontal
  zoom: number // 1 = framing distance
  focus?: Vector3 // world point to aim at (defaults to model centre)
}

const BG_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`
const BG_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uScroll;
  uniform float uPalette;
  uniform vec2 uRes;
  varying vec2 vUv;
  vec2 rot(vec2 p, float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c) * p; }
  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= uRes.x / uRes.y;
    float t = uTime * 0.08;
    // organic warp of the wave coordinates
    vec2 w = uv + 0.22 * vec2(sin(uv.y * 1.7 + t * 1.9), cos(uv.x * 1.5 - t * 1.4));
    float s = uScroll * 5.0;
    float f1 = sin(rot(w, 0.6).x * 2.4 + t * 1.0 + s);
    float f2 = sin(rot(w, -0.7).x * 3.2 - t * 1.3 + s * 0.6);
    float f3 = sin(rot(w, 1.2).x * 4.0 + t * 0.7 - s * 0.4);
    float h = 0.50 * f1 + 0.35 * f2 + 0.15 * f3;
    float crest = pow(max(h, 0.0), 3.0) * 1.4;
    vec3 bronzeDeep = vec3(0.045, 0.026, 0.014), bronzeLit = vec3(0.62, 0.36, 0.15);
    vec3 sapphDeep = vec3(0.010, 0.020, 0.050), sapphLit = vec3(0.18, 0.36, 0.70);
    vec3 deep = mix(bronzeDeep, sapphDeep, uPalette);
    vec3 lit = mix(bronzeLit, sapphLit, uPalette);
    vec3 col = deep + lit * (0.10 * smoothstep(-1.0, 1.0, h) + 0.22 * crest);
    col *= 1.0 - dot(uv, uv) * 0.12;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`

const P_VERT = /* glsl */ `
  attribute vec4 aSeed;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uTurb;
  uniform float uSize;
  uniform float uHeight;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float speed = 0.04 + aSeed.x * 0.08;
    p.y = mod(p.y + uTime * speed * (1.0 + uTurb * 2.5), uHeight);
    float sway = 0.06 + uTurb * 0.25;
    p.x += sin(uTime * (0.3 + aSeed.y * 0.5) + aSeed.z * 6.283) * sway;
    p.z += cos(uTime * (0.25 + aSeed.x * 0.4) + aSeed.w * 6.283) * sway;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.4 + aSeed.w) / -mv.z;
    vColor = aColor;
    // fade in at the floor, out at the top
    float y = p.y / uHeight;
    vAlpha = smoothstep(0.0, 0.12, y) * (1.0 - smoothstep(0.75, 1.0, y)) * (0.35 + 0.65 * aSeed.y);
  }`
const P_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, a * a * vAlpha);
  }`

export function createFodScene(opts: SceneOptions) {
  const { canvas, quality, reduced } = opts
  const high = quality === 'high'
  const renderer = new WebGLRenderer({ canvas, antialias: high, alpha: false, powerPreference: high ? 'high-performance' : 'low-power' })
  // Low quality has no MSAA, so a 1.5 cap keeps edges clean on phones without full-DPR fill cost.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, high ? 1.75 : 1.5))
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.95
  renderer.autoClear = false
  // Skip the synchronous shader info-log query in production (also silences ANGLE's HLSL notes).
  renderer.debug.checkShaderErrors = !import.meta.env.PROD

  // ---------- background ----------
  const bgScene = new Scene()
  const bgCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const bgUniforms = { uTime: { value: 0 }, uScroll: { value: 0 }, uPalette: { value: 0 }, uRes: { value: new Vector2(1, 1) } }
  const bgMat = new ShaderMaterial({ vertexShader: BG_VERT, fragmentShader: BG_FRAG, uniforms: bgUniforms, depthTest: false, depthWrite: false })
  const bgGeo = new PlaneGeometry(2, 2)
  bgScene.add(new Mesh(bgGeo, bgMat))

  // ---------- main scene ----------
  const scene = new Scene()
  const pmrem = new PMREMGenerator(renderer)
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04)
  scene.environment = envRT.texture
  const camera = new PerspectiveCamera(30, 1, 0.05, 50)

  // Chiaroscuro rig (brief: ambient 0.1, key spot 18 @ (4,6,3) π/4 pen 0.9, rim #e3f2ff 10 @ (-5,3,-4),
  // fill #fff3e6 0.8 @ (-2,-4,2)); positions scaled to the vehicle, intensities tuned for physically
  // based lights + ACES.
  const S = 0.32
  scene.add(new AmbientLight(0xffffff, 0.1))
  const key = new SpotLight(0xffffff, 11, 0, Math.PI / 4, 0.9, 0)
  key.position.set(4 * S, 6 * S, 3 * S)
  scene.add(key, key.target)
  const rim = new DirectionalLight(0xe3f2ff, 7)
  rim.position.set(-5 * S, 3 * S, -4 * S)
  const fill = new DirectionalLight(0xfff3e6, 0.8)
  fill.position.set(-2 * S, -4 * S, 2 * S)
  // warm amber kicker from the front-left, echoing the reference render's runway glow
  const amber = new DirectionalLight(0xffa04d, 2.4)
  amber.position.set(1.4, 0.35, 1.2)
  scene.add(rim, fill, amber)

  // Soft contact shadow under the footprint (a cast spotlight shadow fell far from the vehicle
  // at this light angle and read as a detached blob).
  const shadowCanvas = document.createElement('canvas')
  shadowCanvas.width = shadowCanvas.height = 128
  const g2 = shadowCanvas.getContext('2d')!
  const grad = g2.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(0,0,0,0.85)')
  grad.addColorStop(0.55, 'rgba(0,0,0,0.45)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  g2.fillStyle = grad
  g2.fillRect(0, 0, 128, 128)
  const shadowTex = new CanvasTexture(shadowCanvas)
  const ground = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, toneMapped: false }))
  ground.rotation.x = -Math.PI / 2
  ground.position.y = 0.002
  ground.renderOrder = -1
  scene.add(ground)

  const modelRoot = new Group()
  scene.add(modelRoot)
  const center = new Vector3(0, 0.35, 0)
  let radius = 0.7
  let ready = false

  // ---------- particles ----------
  const count = reduced ? 0 : high ? 450 : 160
  const pGeo = new BufferGeometry()
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  const seed = new Float32Array(count * 4)
  const warm = new Color('#ff8a3d')
  const icy = new Color('#bfe6ff')
  for (let i = 0; i < count; i++) {
    const r = 0.6 + Math.random() * 2.2
    const a = Math.random() * Math.PI * 2
    pos.set([Math.cos(a) * r, Math.random() * 2.2, Math.sin(a) * r], i * 3)
    const c = i < count * 0.6 ? warm : icy
    col.set([c.r, c.g, c.b], i * 3)
    seed.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4)
  }
  pGeo.setAttribute('position', new BufferAttribute(pos, 3))
  pGeo.setAttribute('aColor', new BufferAttribute(col, 3))
  pGeo.setAttribute('aSeed', new BufferAttribute(seed, 4))
  const pUniforms = { uTime: { value: 0 }, uTurb: { value: 0 }, uSize: { value: 26 * renderer.getPixelRatio() }, uHeight: { value: 2.2 } }
  const pMat = new ShaderMaterial({ vertexShader: P_VERT, fragmentShader: P_FRAG, uniforms: pUniforms, transparent: true, depthWrite: false, blending: AdditiveBlending })
  const particles = new Points(pGeo, pMat)
  particles.frustumCulled = false
  scene.add(particles)

  // ---------- state ----------
  let mode: SceneMode = 'orbit'
  let targetProgress = 0
  let progress = 0
  let velocity = 0
  const pointer = new Vector2()
  const pointerSmooth = new Vector2()
  const preset: Required<ViewPreset> = { azimuth: 50, elevation: 28, zoom: 1, focus: center.clone() }
  const view = { azimuth: 50, elevation: 28, zoom: 1, focus: center.clone() }
  let framing = 2.6
  let offsetX = 0 // horizontal composition offset as a fraction of the viewport
  const host = { w: 1, h: 1 }
  const frameCallbacks = new Set<() => void>()

  // Initial composition: elevated front-three-quarter from the vehicle's left, like the reference render.
  const AZ0 = 50
  const EL0 = 24
  const HL_DIST = 0.7 // highlight-mode camera distance relative to the fit distance
  const orbitFocus = new Vector3()

  // ---------- free mode (Explore FOD Hunter) ----------
  // The visitor drives the camera: left-drag rotates, right-drag / shift-drag pans (OrbitControls
  // defaults). Wheel zoom is off so the wheel keeps scrolling the page; zoom is on explicit buttons.
  // One-finger touch rotates horizontally while vertical swipes still scroll the page (touch-action).
  let controls: OrbitControls | undefined
  let zoomTo: number | null = null // target camera distance while a zoom/reset animates
  let resetting = false
  const FREE_AZ = 50
  const FREE_EL = 22
  const freeSaved = { position: new Vector3(), target: new Vector3(), saved: false }
  // until the visitor moves the explorer camera, keep it on the default view as the model loads and the viewer resizes
  let freeTouched = false
  function settleFreeDefault() {
    if (mode !== 'free' || !controls || freeTouched) return
    const d = freeDefault()
    camera.position.copy(d.position)
    controls.target.copy(d.target)
    camera.lookAt(d.target)
  }
  const freeDefault = () => {
    const a = MathUtils.degToRad(FREE_AZ)
    const e = MathUtils.degToRad(FREE_EL)
    // squarer viewers (phones) need more distance: the vehicle is wider than it is tall
    const d = framing * (camera.aspect < 1.2 ? 0.8 : 0.66)
    return {
      target: center.clone(),
      position: new Vector3(center.x + Math.sin(a) * Math.cos(e) * d, center.y + Math.sin(e) * d, center.z + Math.cos(a) * Math.cos(e) * d)
    }
  }
  function ensureControls() {
    if (controls) return controls
    const c = new OrbitControls(camera, opts.canvas)
    c.enableDamping = true
    c.dampingFactor = 0.08
    c.enableZoom = false
    c.enablePan = true
    c.screenSpacePanning = true
    c.rotateSpeed = 0.8
    c.minPolarAngle = MathUtils.degToRad(8)
    c.maxPolarAngle = MathUtils.degToRad(84) // never below the floor plane
    c.mouseButtons = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN }
    c.touches = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }
    c.addEventListener('change', requestRender)
    c.addEventListener('start', () => {
      freeTouched = true
      resetting = false
      zoomTo = null
    })
    controls = c
    applyLimits()
    // OrbitControls sets touch-action:none; allow native vertical page scrolling on touch screens
    opts.canvas.style.touchAction = 'pan-y'
    return c
  }
  function applyLimits() {
    if (!controls) return
    controls.minDistance = radius * 1.05 // stay outside the vehicle's bounding sphere: no clipping
    controls.maxDistance = framing * 1.7
  }
  function updateFree(norm: (k: number) => number) {
    const c = ensureControls()
    if (resetting) {
      const d = freeDefault()
      const k = norm(0.12)
      c.target.lerp(d.target, k)
      camera.position.lerp(d.position, k)
      if (camera.position.distanceTo(d.position) < 1e-3 && c.target.distanceTo(d.target) < 1e-3) resetting = false
      requestRender()
    } else if (zoomTo !== null) {
      const dir = camera.position.clone().sub(c.target)
      const dist = dir.length()
      const next = dist + (zoomTo - dist) * norm(0.15)
      camera.position.copy(c.target).add(dir.setLength(next))
      if (Math.abs(zoomTo - next) < 1e-3) zoomTo = null
      requestRender()
    }
    // keep panning near the vehicle
    const off = c.target.clone().sub(center)
    const maxOff = radius * 0.9
    if (off.length() > maxOff) {
      const fix = off.setLength(off.length() - maxOff)
      c.target.sub(fix)
      camera.position.sub(fix)
    }
    c.update()
  }

  // occlusion test for hotspots (throttled by the caller: raycasting ~0.5 M triangles is not free)
  const ray = new Raycaster()

  function cameraFromSpherical(az: number, el: number, dist: number, focus: Vector3) {
    const a = MathUtils.degToRad(az)
    const e = MathUtils.degToRad(el)
    camera.position.set(focus.x + Math.sin(a) * Math.cos(e) * dist, focus.y + Math.sin(e) * dist, focus.z + Math.cos(a) * Math.cos(e) * dist)
    camera.lookAt(focus)
  }

  function updateCamera(dtLerp: (k: number) => number) {
    if (mode === 'orbit') {
      // Laocoön orbit adapted: phi = p·2π, elevation and radius breathe with sin(pπ).
      // Starts close (matching the reference render's scale), pulls back mid-orbit so the whole
      // vehicle stays in frame beside the chapter text, and returns close at the end.
      const s = Math.sin(progress * Math.PI)
      const az = AZ0 + progress * 360 + pointerSmooth.x * 4
      const el = EL0 + s * 8 - pointerSmooth.y * 2
      const dist = framing * (0.62 + s * 0.3)
      // Aim a little above the centre so the charger deck clears the nav bar at the close ends.
      orbitFocus.copy(center).y += camera.aspect < 1 ? 0 : radius * 0.12
      cameraFromSpherical(az, el, dist, orbitFocus)
    } else if (mode === 'free') {
      updateFree(dtLerp)
    } else {
      const k = dtLerp(0.06)
      view.azimuth += shortestAngle(view.azimuth, preset.azimuth) * k
      view.elevation += (preset.elevation - view.elevation) * k
      view.zoom += (preset.zoom - view.zoom) * k
      view.focus.lerp(preset.focus, k)
      cameraFromSpherical(view.azimuth + pointerSmooth.x * 3, view.elevation - pointerSmooth.y * 1.5, framing * HL_DIST * view.zoom, view.focus)
    }
  }
  const shortestAngle = (from: number, to: number) => ((((to - from) % 360) + 540) % 360) - 180

  function applyViewOffset() {
    const { w, h } = host
    // Portrait: lift the vehicle into the upper half, clear of the hero text stacked below it.
    const offsetY = mode === 'orbit' && w < h ? 0.12 : 0
    if (offsetX === 0 && offsetY === 0) camera.clearViewOffset()
    else camera.setViewOffset(w, h, -offsetX * w, offsetY * h, w, h)
  }

  function resize(w: number, h: number) {
    host.w = Math.max(1, Math.round(w))
    host.h = Math.max(1, Math.round(h))
    renderer.setSize(host.w, host.h, false)
    camera.aspect = host.w / host.h
    // Fit the bounding sphere: tighter on wide screens, more distance on portrait.
    const vFov = MathUtils.degToRad(camera.fov)
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect)
    const fit = radius / Math.sin(Math.min(vFov, hFov) / 2)
    framing = fit * (camera.aspect < 1 ? 1.02 : 0.92)
    applyLimits()
    settleFreeDefault()
    camera.updateProjectionMatrix()
    applyViewOffset()
    bgUniforms.uRes.value.set(host.w, host.h)
    requestRender()
  }

  // ---------- model ----------
  const loader = new GLTFLoader()
  loader.setMeshoptDecoder(MeshoptDecoder)
  const envIntensity = 0.28
  loader.load(
    opts.glbUrl,
    (gltf) => {
      const model = gltf.scene
      model.traverse((o: Object3D) => {
        const mesh = o as Mesh
        if (!mesh.isMesh) return
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        const up = mats.map((m) => upgradeMaterial(m as Material, envIntensity))
        mats.forEach((m) => (m as Material).dispose())
        mesh.material = Array.isArray(mesh.material) ? up : up[0]
      })
      // Ground the model (CAD origin is not at the tyre contact patch) and centre it in X/Z.
      const box = new Box3().setFromObject(model)
      model.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2)
      modelRoot.add(model)
      const b2 = new Box3().setFromObject(modelRoot)
      b2.getCenter(center)
      radius = b2.getBoundingSphere(new Sphere()).radius
      const size = b2.getSize(new Vector3())
      ground.scale.set(size.x * 1.35, size.z * 1.45, 1)
      key.target.position.copy(center)
      preset.focus.copy(center)
      view.focus.copy(center)
      resize(host.w, host.h)
      ready = true
      requestRender()
      opts.onReady?.()
    },
    undefined,
    (e) => opts.onError?.(e)
  )

  /** Offset (CAD world) → page coordinates after grounding/centring. */
  const modelOffset = () => (modelRoot.children[0] ? modelRoot.children[0].position : new Vector3())
  function worldFromCad(v: [number, number, number]) {
    return new Vector3(...v).add(modelOffset())
  }

  // ---------- loop ----------
  let raf = 0
  let running = false
  let visible = true
  let last = performance.now()
  let needsRender = true
  const start = performance.now()
  function requestRender() {
    needsRender = true
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame)
    const dt = Math.min(0.1, (now - last) / 1000)
    last = now
    if (!visible || document.hidden) return
    const norm = (k: number) => (reduced ? 1 : 1 - Math.pow(1 - k, dt * 60))
    // smooth inertial scroll (brief: 0.025) and pointer (0.05)
    const prev = progress
    progress += (targetProgress - progress) * norm(0.025)
    if (Math.abs(targetProgress - progress) < 1e-4) progress = targetProgress
    pointerSmooth.lerp(pointer, norm(0.05))
    velocity += (Math.abs(progress - prev) / Math.max(dt, 1e-3) * 4 - velocity) * norm(0.1)
    const animating = !reduced
    if (!animating && !needsRender && Math.abs(progress - prev) < 1e-5) return
    const t = reduced ? 0 : (now - start) / 1000
    bgUniforms.uTime.value = t
    bgUniforms.uScroll.value = mode === 'orbit' ? progress : 1
    bgUniforms.uPalette.value = mode === 'orbit' ? MathUtils.smoothstep(progress, 0.05, 0.95) : 1
    pUniforms.uTime.value = t
    pUniforms.uTurb.value = Math.min(1, velocity)
    updateCamera(norm)
    renderer.clear()
    renderer.render(bgScene, bgCam)
    if (ready) renderer.render(scene, camera)
    frameCallbacks.forEach((cb) => cb())
    needsRender = false
  }

  function startLoop() {
    if (running) return
    running = true
    last = performance.now()
    raf = requestAnimationFrame(frame)
  }
  function stopLoop() {
    running = false
    cancelAnimationFrame(raf)
  }

  return {
    camera,
    renderer,
    get ready() {
      return ready
    },
    resize,
    start: startLoop,
    stop: stopLoop,
    setVisible(v: boolean) {
      visible = v
      if (v) requestRender()
    },
    setMode(m: SceneMode) {
      if (m === mode) return
      if (mode === 'free' && controls) {
        // remember where the visitor left the explorer camera
        freeSaved.position.copy(camera.position)
        freeSaved.target.copy(controls.target)
        freeSaved.saved = true
        controls.enabled = false
      }
      if (m === 'free') {
        const c = ensureControls()
        c.enabled = true
        const from = freeSaved.saved && freeTouched ? freeSaved : freeDefault()
        camera.position.copy(from.position)
        c.target.copy(from.target)
        camera.lookAt(c.target)
        zoomTo = null
        resetting = false
      }
      if (m === 'highlight') {
        // continue from wherever the camera is, so the switch never jumps
        const rel = camera.position.clone().sub(center)
        const dist = rel.length()
        view.azimuth = MathUtils.radToDeg(Math.atan2(rel.x, rel.z))
        view.elevation = MathUtils.radToDeg(Math.asin(rel.y / dist))
        view.zoom = dist / (framing * HL_DIST)
        view.focus.copy(center)
      }
      mode = m
      applyViewOffset()
      requestRender()
    },
    setProgress(p: number) {
      targetProgress = MathUtils.clamp(p, 0, 1)
      requestRender()
    },
    setComposition(fractionX: number) {
      offsetX = fractionX
      applyViewOffset()
      requestRender()
    },
    setPointer(x: number, y: number) {
      pointer.set(x, y)
    },
    focus(p: ViewPreset & { cadFocus?: [number, number, number] }) {
      preset.azimuth = p.azimuth
      preset.elevation = p.elevation
      preset.zoom = p.zoom
      preset.focus.copy(p.cadFocus ? worldFromCad(p.cadFocus).lerp(center, 0.35) : center)
      requestRender()
    },
    /** Project a CAD-space point to host pixels (for HTML hotspots). */
    project(cad: [number, number, number]) {
      const v = worldFromCad(cad).project(camera)
      return { x: ((v.x + 1) / 2) * host.w, y: ((1 - v.y) / 2) * host.h, visible: v.z < 1 && Math.abs(v.x) <= 1.05 && Math.abs(v.y) <= 1.05 }
    },
    /** Explorer zoom buttons: factor < 1 moves closer, > 1 further away (within the clipping limits). */
    zoom(factor: number) {
      if (mode !== 'free' || !controls) return
      const base = zoomTo ?? camera.position.distanceTo(controls.target)
      zoomTo = MathUtils.clamp(base * factor, controls.minDistance, controls.maxDistance)
      freeTouched = true
      resetting = false
      requestRender()
    },
    /** Explorer Reset View: animate back to the default three-quarter view. */
    resetView() {
      if (mode !== 'free') return
      ensureControls()
      zoomTo = null
      resetting = true
      if (reduced) {
        const d = freeDefault()
        camera.position.copy(d.position)
        controls!.target.copy(d.target)
        resetting = false
      }
      requestRender()
    },
    /** True when vehicle geometry sits between the camera and this CAD point (hotspot occlusion). */
    isOccluded(cad: [number, number, number]) {
      if (!ready) return false
      const p = worldFromCad(cad)
      const dir = p.clone().sub(camera.position)
      const dist = dir.length()
      ray.set(camera.position, dir.normalize())
      // anchors sit at part centres, so ignore the part's own skin (12 cm) and see-through panels
      ray.far = dist - 0.12
      return ray.intersectObject(modelRoot, true).some((hit) => {
        const m = (hit.object as Mesh).material as Material | Material[]
        return !(Array.isArray(m) ? m : [m]).every((x) => x.transparent && x.opacity < 0.5)
      })
    },
    onFrame(cb: () => void) {
      frameCallbacks.add(cb)
      return () => frameCallbacks.delete(cb)
    },
    dispose() {
      stopLoop()
      frameCallbacks.clear()
      controls?.dispose()
      modelRoot.traverse((o) => (o as Mesh).geometry?.dispose())
      disposeMaterials()
      bgGeo.dispose()
      bgMat.dispose()
      pGeo.dispose()
      pMat.dispose()
      ground.geometry.dispose()
      ;(ground.material as Material).dispose()
      shadowTex.dispose()
      envRT.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    }
  }
}

export type FodScene = ReturnType<typeof createFodScene>
