<script setup lang="ts">
/**
 * Interactive 3D view of a CAD export:
 *   <ModelViewer src="./assets/models/part.glb" caption="Figure 4.3.11: …" />
 * Drag to orbit, right-drag to pan, scroll to zoom. The model is framed automatically and only
 * downloads when the figure scrolls into view. Make the .glb with scripts/optimize-model.mjs.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{ src: string; caption?: string; alt?: string; height?: number }>(), {
  caption: undefined,
  alt: undefined,
  height: 480
})

const host = ref<HTMLDivElement>()
const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
let cleanup = () => {}

async function start() {
  status.value = 'loading'
  const THREE = await import('three')
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
  const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')
  const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js')
  const { MeshoptDecoder } = await import('three/examples/jsm/libs/meshopt_decoder.module.js')
  const el = host.value
  if (!el) return

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  el.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04)
  scene.environment = env.texture
  const sun = new THREE.DirectionalLight(0xffffff, 1.2)
  sun.position.set(1, 2, 1.5)
  scene.add(sun)

  const camera = new THREE.PerspectiveCamera(35, 1, 0.001, 1000)
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  let frame = 0
  const render = () => {
    frame = requestAnimationFrame(render)
    controls.update()
    renderer.render(scene, camera)
  }
  const resize = () => {
    const w = el.clientWidth
    renderer.setSize(w, props.height)
    camera.aspect = w / props.height
    camera.updateProjectionMatrix()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(el)
  resize()

  cleanup = () => {
    cancelAnimationFrame(frame)
    ro.disconnect()
    controls.dispose()
    scene.traverse((o) => {
      const m = o as InstanceType<typeof THREE.Mesh>
      if (!m.isMesh) return
      m.geometry.dispose()
      for (const mat of [m.material].flat()) mat.dispose()
    })
    env.dispose()
    pmrem.dispose()
    renderer.dispose()
    renderer.domElement.remove()
  }

  try {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    const gltf = await loader.loadAsync(props.src)
    const model = gltf.scene
    // centre the model and frame it from a three-quarter view
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3()).length()
    model.position.sub(box.getCenter(new THREE.Vector3()))
    scene.add(model)
    camera.near = size / 100
    camera.far = size * 100
    camera.position.set(size * 0.75, size * 0.5, size * 0.85)
    camera.updateProjectionMatrix()
    controls.target.set(0, 0, 0)
    controls.minDistance = size * 0.2
    controls.maxDistance = size * 4
    status.value = 'ready'
    render()
  } catch (e) {
    console.error('[ModelViewer]', props.src, e)
    status.value = 'error'
  }
}

onMounted(() => {
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect()
        start()
      }
    },
    { rootMargin: '300px' }
  )
  if (host.value) io.observe(host.value)
  const prev = cleanup
  cleanup = () => (io.disconnect(), prev())
})
onBeforeUnmount(() => cleanup())
</script>

<template>
  <figure class="fh-figure fh-model">
    <div ref="host" class="fh-model__stage" :style="{ height: `${height}px` }" role="img" :aria-label="alt || caption || '3D model'">
      <p v-if="status !== 'ready'" class="fh-model__status">
        {{ status === 'error' ? 'The 3D model could not be loaded.' : 'Loading 3D model…' }}
      </p>
    </div>
    <p v-if="status === 'ready'" class="fh-model__hint">Drag to rotate · right-drag to pan · scroll to zoom</p>
    <figcaption v-if="caption" v-html="caption"></figcaption>
  </figure>
</template>

<style scoped>
/* the shared .fh-figure shrink-wraps its content and sits left; a canvas has no intrinsic width, so
   the viewer takes the full text column and is centred instead */
.fh-model {
  width: 100%;
  max-width: 100%;
  margin: 32px auto;
}
.fh-model__stage {
  position: relative;
  width: 100%;
  cursor: grab;
  touch-action: none;
}
.fh-model__stage:active {
  cursor: grabbing;
}
.fh-model__stage :deep(canvas) {
  display: block;
}
.fh-model__status {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  font-size: 14px;
  color: var(--vp-c-text-3);
}
.fh-model__hint {
  margin: 6px 0 0;
  font-size: 12.5px;
  color: var(--vp-c-text-3);
  text-align: center;
}
.fh-model figcaption {
  text-align: center;
}
</style>
