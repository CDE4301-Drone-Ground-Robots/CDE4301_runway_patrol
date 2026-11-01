/**
 * Three.js scene for TopoField.vue. Kept in its own module with *named* imports so Rollup can
 * tree-shake three; TopoField loads this file with a dynamic import (homepage, client only).
 */
import { BufferAttribute, BufferGeometry, Color, LineSegments, PerspectiveCamera, Scene, ShaderMaterial, WebGLRenderer } from 'three'

export interface TopoOptions {
  canvas: HTMLCanvasElement
  coarse: boolean
}

export function createTopoScene({ canvas, coarse }: TopoOptions) {
  const ROWS = coarse ? 36 : 64
  const COLS = coarse ? 90 : 160

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1 : 1.5))
  const scene = new Scene()
  const camera = new PerspectiveCamera(42, 1, 0.1, 100)
  camera.position.set(0, 3.1, 7.5)
  camera.lookAt(0, 0, -1.5)

  // Contour rows across a 16 x 12 plane, written as independent segments (one draw call).
  const W = 16
  const D = 12
  const positions = new Float32Array(ROWS * (COLS - 1) * 2 * 3)
  let o = 0
  for (let r = 0; r < ROWS; r++) {
    const z = -D / 2 + (r / (ROWS - 1)) * D
    for (let c = 0; c < COLS - 1; c++) {
      for (const cc of [c, c + 1]) {
        positions[o++] = -W / 2 + (cc / (COLS - 1)) * W
        positions[o++] = 0
        positions[o++] = z
      }
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))

  const uniforms = {
    uTime: { value: 0 },
    uColorA: { value: new Color() },
    uColorB: { value: new Color() },
    uAlpha: { value: 0.5 }
  }
  const material = new ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    // Height = sum of sines evaluated on the GPU: no per-frame CPU geometry work.
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying float vDepth;
      varying float vX;
      varying float vH;
      void main() {
        vec3 p = position;
        float t = uTime;
        float h = sin(p.x * 0.55 + t) * 0.32
                + sin(p.z * 0.85 - t * 0.7) * 0.24
                + sin((p.x + p.z) * 0.33 + t * 0.4) * 0.42
                + sin(length(p.xz - vec2(2.5, -1.0)) * 1.1 - t * 0.9) * 0.16;
        p.y += h;
        vH = h;
        vX = p.x;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform float uAlpha;
      varying float vDepth;
      varying float vX;
      varying float vH;
      void main() {
        vec3 col = mix(uColorA, uColorB, smoothstep(-6.0, 6.0, vX));
        float fog = 1.0 - smoothstep(4.0, 13.0, vDepth);
        float ridge = 0.55 + 0.45 * smoothstep(-0.6, 0.8, vH);
        float edge = 1.0 - smoothstep(5.5, 8.0, abs(vX));
        gl_FragColor = vec4(col, uAlpha * fog * ridge * edge);
      }`
  })
  scene.add(new LineSegments(geometry, material))

  return {
    renderer,
    render(timeSeconds: number) {
      uniforms.uTime.value = timeSeconds
      renderer.render(scene, camera)
    },
    setTheme(dark: boolean) {
      uniforms.uColorA.value.set(dark ? '#3b82f6' : '#1d4ed8')
      uniforms.uColorB.value.set(dark ? '#a855f7' : '#7c3aed')
      uniforms.uAlpha.value = dark ? 0.55 : 0.32
    },
    resize(w: number, h: number) {
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    },
    dispose() {
      renderer.setAnimationLoop(null)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    }
  }
}
