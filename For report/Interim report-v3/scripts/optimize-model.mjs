// Makes a web copy of any SolidWorks glTF export for <ModelViewer>.
// Geometry is not simplified: duplicate data is removed, vertices are welded and quantised, and the
// result is meshopt-compressed (ModelViewer loads the meshopt decoder). Parts and colours are kept.
//
// Usage: node scripts/optimize-model.mjs <input.glb> <output.glb>
import fs from 'node:fs'
import path from 'node:path'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, meshopt, prune, quantize, weld } from '@gltf-transform/functions'
import { MeshoptEncoder } from 'meshoptimizer'

const [src, out] = process.argv.slice(2)
if (!src || !out) {
  console.error('Usage: node scripts/optimize-model.mjs <input.glb> <output.glb>')
  process.exit(1)
}

await MeshoptEncoder.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder })
const doc = await io.read(src)
await doc.transform(dedup(), prune(), weld(), quantize(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }))
fs.mkdirSync(path.dirname(out), { recursive: true })
await io.write(out, doc)

const mb = (f) => (fs.statSync(f).size / 1048576).toFixed(2) + ' MB'
console.log(`${path.basename(src)} ${mb(src)} -> ${path.basename(out)} ${mb(out)}`)
