/**
 * Runtime PBR materials for the FOD Hunter web model. Keys are the semantic material names written
 * by scripts/optimize-fod-hunter.mjs (fh_*). `cad_*` materials keep their SolidWorks colour (real
 * finishes such as the yellow vacuum, red connectors, battery labels) with a less glossy roughness.
 */
import { Color, DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial, SRGBColorSpace, type Material, type Texture } from 'three'

type Spec = {
  color: string
  metalness: number
  roughness: number
  clearcoat?: number
  clearcoatRoughness?: number
  envMapIntensity?: number
  transparent?: number // opacity
  keepMap?: boolean
}

const SPECS: Record<string, Spec> = {
  // Body panels: dark satin carbon (CAD texture kept as a subtle weave)
  fh_carbon: { color: '#2a2d33', metalness: 0.25, roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.28, keepMap: true },
  fh_body_satin: { color: '#16181c', metalness: 0.3, roughness: 0.5 },
  fh_extrusion: { color: '#1c1f24', metalness: 0.7, roughness: 0.42 },
  fh_alu: { color: '#8a9099', metalness: 1, roughness: 0.42 },
  fh_steel: { color: '#7a756f', metalness: 1, roughness: 0.42 },
  // Wheels
  fh_tyre: { color: '#0f1011', metalness: 0, roughness: 0.93, envMapIntensity: 0.4 },
  fh_hub: { color: '#cfd4db', metalness: 1, roughness: 0.2 },
  // UAV contact-charging platform
  fh_charger_deck: { color: '#4a4f57', metalness: 0.9, roughness: 0.4 },
  fh_charger_frame: { color: '#131417', metalness: 0.4, roughness: 0.45 },
  // Suspension
  fh_damper: { color: '#2b2e33', metalness: 0.85, roughness: 0.33 },
  fh_spring: { color: '#b3261e', metalness: 0.35, roughness: 0.38 },
  // Electronics
  fh_orin: { color: '#aeb4bb', metalness: 0.9, roughness: 0.32 },
  fh_pcb: { color: '#d8d8d2', metalness: 0, roughness: 0.6 },
  fh_gold: { color: '#d4a64a', metalness: 1, roughness: 0.28 },
  fh_polycarbonate: { color: '#eaf2ff', metalness: 0, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 0.9, transparent: 0.12 },
  // SolidWorks "no appearance" placeholder and generic black plastics
  fh_neutral: { color: '#24272c', metalness: 0.35, roughness: 0.52 },
  fh_black_plastic: { color: '#131416', metalness: 0.05, roughness: 0.62 }
}

const created = new Set<Material>()

export function upgradeMaterial(old: Material, envIntensity: number): Material {
  const name = old.name || ''
  const spec = SPECS[name]
  const src = old as MeshStandardMaterial
  if (spec) {
    const m = new MeshPhysicalMaterial({
      name,
      color: new Color(spec.color),
      metalness: spec.metalness,
      roughness: spec.roughness,
      clearcoat: spec.clearcoat ?? 0,
      clearcoatRoughness: spec.clearcoatRoughness ?? 0,
      envMapIntensity: (spec.envMapIntensity ?? 1) * envIntensity
    })
    if (spec.keepMap && src.map) {
      src.map.colorSpace = SRGBColorSpace
      m.map = src.map
    }
    if (spec.transparent !== undefined) {
      m.transparent = true
      m.opacity = spec.transparent
      m.depthWrite = false
      m.side = DoubleSide
    }
    created.add(m)
    return m
  }
  // cad_*: real CAD colours, toned down from SolidWorks' 0.17 roughness "glossy plastic".
  // Hue is kept; lightness is capped so near-white default plates don't blow out under the key light.
  const color = src.color?.clone() ?? new Color('#777')
  const hsl = color.getHSL({ h: 0, s: 0, l: 0 })
  if (hsl.l > 0.42) color.setHSL(hsl.h, hsl.s, 0.42)
  const m = new MeshStandardMaterial({
    name,
    color,
    metalness: Math.min(src.metalness ?? 0, 0.6),
    roughness: Math.max(src.roughness ?? 0.5, 0.48),
    transparent: src.transparent,
    opacity: src.opacity,
    envMapIntensity: envIntensity
  })
  created.add(m)
  return m
}

export function disposeMaterials(extraTextures: Texture[] = []) {
  for (const m of created) {
    const map = (m as MeshStandardMaterial).map
    map?.dispose()
    m.dispose()
  }
  created.clear()
  extraTextures.forEach((t) => t.dispose())
}
