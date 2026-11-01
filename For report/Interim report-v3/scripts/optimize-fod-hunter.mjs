// Builds the web copy of the FOD Hunter CAD model. The SolidWorks export (Final_UGV.glb, 64 MB,
// 1.12 M triangles, 1,654 draw primitives, 99 materials) is read-only; this writes:
//   docs/public/models/fod-hunter.glb             meshopt-compressed, joined by material
//   docs/.vitepress/theme/data/fod-hunter-parts.json   part centres/bounds for hotspots
//
// Geometry: no part is moved, scaled or added. Meshes are simplified with a 1 mm maximum
// deviation (error 0.001 relative to the ~1 m vehicle), then positions are quantised.
// Materials: each primitive is reassigned to a named semantic material from its CAD part name and
// SolidWorks appearance; Three.js upgrades those names to PBR at runtime (fod-materials.ts).
// SolidWorks' blue-grey "no appearance" placeholder (0.60, 0.65, 0.86) is not a real finish and is
// mapped to a neutral satin.
//
// Usage: node scripts/optimize-fod-hunter.mjs [path/to/Final_UGV.glb]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, flatten, join, meshopt, prune, quantize, simplify, weld } from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
// The raw CAD export (Final_UGV.glb, ~68 MB) is not kept in V3; pass its path explicitly.
const SRC = process.argv[2]
if (!SRC) {
  console.error('Usage: node scripts/optimize-fod-hunter.mjs <path to Final_UGV.glb>')
  process.exit(1)
}
const OUT_GLB = path.join(root, 'docs/public/models/fod-hunter.glb')
const OUT_PARTS = path.join(root, 'docs/.vitepress/theme/data/fod-hunter-parts.json')

await MeshoptEncoder.ready
await MeshoptSimplifier.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder })
const doc = await io.read(SRC)
const docRoot = doc.getRoot()

// ---------- 1. Part map: top-level children of "Final UGV" ----------
const assembly = docRoot.listNodes().find((n) => n.getName() === 'Final UGV')
if (!assembly) throw new Error('"Final UGV" assembly node not found')
const partOf = new Map() // descendant node -> top-level part name
for (const part of assembly.listChildren()) {
  const name = part.getName() || '(unnamed part)'
  part.traverse((n) => partOf.set(n, name))
}

// ---------- 2. Part bounds (world space) for hotspots, before any merging ----------
const bounds = {}
const mat4 = (n) => n.getWorldMatrix()
const apply = (m, [x, y, z]) => [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]]
for (const node of docRoot.listNodes()) {
  const mesh = node.getMesh()
  const part = partOf.get(node)
  if (!mesh || !part) continue
  const key = part.replace(/-\d+$/, '')
  const b = (bounds[key] ||= { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity], instances: new Set() })
  b.instances.add(part)
  const m = mat4(node)
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute('POSITION')
    const lo = pos.getMin([]), hi = pos.getMax([])
    for (const x of [lo[0], hi[0]]) for (const y of [lo[1], hi[1]]) for (const z of [lo[2], hi[2]]) {
      const v = apply(m, [x, y, z])
      for (let k = 0; k < 3; k++) { b.min[k] = Math.min(b.min[k], v[k]); b.max[k] = Math.max(b.max[k], v[k]) }
    }
  }
}

// ---------- 3. Semantic material reassignment ----------
const semantic = new Map()
// dedup() compares material properties, not names: give each semantic material a distinct
// placeholder colour so they are never merged (runtime replaces the colour anyway).
const sem = (name) => {
  if (!semantic.has(name)) {
    const i = semantic.size + 1
    semantic.set(name, doc.createMaterial(name).setBaseColorFactor([i / 64, 0.5, 0.5, 1]).setExtras({ semantic: name }))
  }
  return semantic.get(name)
}
const isPlaceholder = ([r, g, b]) => Math.abs(r - 0.6) < 0.02 && b > 0.84 && g > 0.62 // SolidWorks default blue-grey
const isBlack = ([r, g, b]) => Math.max(r, g, b) < 0.1
const isRed = ([r, g, b]) => r > 0.45 && g < 0.05 && b < 0.05
const isGold = ([r, g, b]) => r > 0.9 && g > 0.7 && b < 0.4 && b > 0.3

const reassigned = {}
for (const mesh of docRoot.listMeshes()) {
  // Use the first node instancing the mesh to find its part.
  const node = docRoot.listNodes().find((n) => n.getMesh() === mesh)
  const part = (node && partOf.get(node)) || ''
  for (const prim of mesh.listPrimitives()) {
    const mat = prim.getMaterial()
    if (!mat) continue
    const mname = mat.getName()
    const c = mat.getBaseColorFactor()
    let target = null
    if (/^ZLLG80/.test(part)) target = isBlack(c) ? 'fh_tyre' : 'fh_hub'
    else if (/^UAV Charger/.test(part)) target = isBlack(c) ? 'fh_charger_frame' : 'fh_charger_deck'
    else if (/^Shock_Absorber/.test(part)) target = isRed(c) ? 'fh_spring' : 'fh_damper'
    else if (/^Orin_nx/.test(part)) target = 'fh_orin'
    else if (/^NUCLEO/.test(part)) target = isGold(c) ? 'fh_gold' : isPlaceholder(c) || (c[1] > 0.8 && c[2] > 0.95) ? 'fh_pcb' : null
    else if (/Wheelcover/i.test(part)) target = 'fh_body_satin'
    else if (/carbonfiberepoxy/.test(mname)) target = 'fh_carbon'
    else if (/satinfinishaluminum/.test(mname)) target = 'fh_alu'
    else if (/mattesteel/.test(mname)) target = 'fh_steel'
    else if (/polycarbonate/.test(mname)) target = 'fh_polycarbonate'
    else if (/^3030 Square tube|^\(unnamed part\)|^4040/.test(part) && isBlack(c)) target = 'fh_extrusion'
    else if (isPlaceholder(c)) target = 'fh_neutral'
    else if (isBlack(c) && /defaultplastic|blackhighgloss/.test(mname)) target = 'fh_black_plastic'
    if (target) {
      const t = sem(target)
      // carry the carbon texture across
      if (target === 'fh_carbon' && !t.getBaseColorTexture() && mat.getBaseColorTexture()) t.setBaseColorTexture(mat.getBaseColorTexture())
      prim.setMaterial(t)
      reassigned[target] = (reassigned[target] || 0) + 1
    }
  }
}
// Colours that are real (vacuum yellow, connector red, battery labels, fan beige, component plate)
// keep their SolidWorks materials; give them stable names for runtime tuning.
for (const m of docRoot.listMaterials()) if (!m.getName().startsWith('fh_')) m.setName(`cad_${m.getName()}`)

// Drop the SolidWorks viewport camera.
for (const n of docRoot.listNodes()) if (n.getCamera()) n.setCamera(null)
for (const cam of docRoot.listCameras()) cam.dispose()

// ---------- 4. Geometry pipeline ----------
const before = { prims: docRoot.listMeshes().reduce((a, m) => a + m.listPrimitives().length, 0) }
await doc.transform(
  dedup(),
  prune(),
  flatten(),
  join({ keepNamed: false }),
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: 0, error: 0.001, lockBorder: true }),
  prune(),
  quantize({ quantizePosition: 16, quantizeNormal: 10, quantizeTexcoord: 12 }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' })
)
fs.mkdirSync(path.dirname(OUT_GLB), { recursive: true })
await io.write(OUT_GLB, doc)

// ---------- 5. Report + part data ----------
let tris = 0, prims = 0
for (const m of docRoot.listMeshes()) for (const p of m.listPrimitives()) { prims++; tris += (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3 }
const all = Object.values(bounds)
const overall = { min: [0, 1, 2].map((k) => Math.min(...all.map((b) => b.min[k]))), max: [0, 1, 2].map((k) => Math.max(...all.map((b) => b.max[k]))) }
const round = (v) => v.map((x) => +x.toFixed(4))
const parts = Object.fromEntries(Object.entries(bounds).map(([k, b]) => [k, { min: round(b.min), max: round(b.max), center: round(b.min.map((v, i) => (v + b.max[i]) / 2)), instances: b.instances.size }]))
fs.writeFileSync(OUT_PARTS, JSON.stringify({
  source: 'Final_UGV.glb (SolidWorks export), world coordinates in metres; +Y up, +Z vehicle front',
  overall: { min: round(overall.min), max: round(overall.max) },
  parts
}, null, 1))
console.log(JSON.stringify({
  input: path.basename(SRC),
  inputMB: +(fs.statSync(SRC).size / 1048576).toFixed(1),
  outputMB: +(fs.statSync(OUT_GLB).size / 1048576).toFixed(2),
  primitivesBefore: before.prims,
  primitivesAfter: prims,
  trianglesAfter: Math.round(tris),
  materials: docRoot.listMaterials().map((m) => m.getName()),
  reassigned
}, null, 1))
