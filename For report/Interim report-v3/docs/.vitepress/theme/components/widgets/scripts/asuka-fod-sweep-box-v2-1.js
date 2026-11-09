// Widget script (runs once per page via useWidgetScript); edit here.
/* eslint-disable */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import MODEL from './asuka-fod-sweep-box-v2-model.json'

export default function init() {

const M = MODEL, G = M.G;
const OX = G.OX, LIFT_DOCK = G.LIFT;
const U2 = { z: G.C35, y: G.S35 };            // uphill along the hose axis, in (Z, Y)
const DIRW = new THREE.Vector3(0, G.S35, G.C35); // same, world

const $ = id => document.getElementById(id);
const stage = $('stage');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------------- cycle ---------------- */
const PH = [
  { t: 0,    d: 1.5, n: 'Docked',          s: 'Box parked above the bin inlet, hose straight. Vacuum off. FOD lies on the asphalt ahead.' },
  { t: 1.5,  d: 3.5, n: 'Lower',           s: 'Both Z steppers drive the box 507 mm down to the asphalt. The hose stretches and bends.' },
  { t: 5,    d: 1,   n: 'Scraper opens',   s: 'The scraper lifts to the top of its 42 mm float so it can pass over the FOD.' },
  { t: 6,    d: 3,   n: 'Reach out',       s: 'The blade runs out 355 mm along the beams, past the FOD.' },
  { t: 9,    d: 1,   n: 'Scraper down',    s: 'The scraper drops onto the asphalt behind the FOD. Its TPU edge seals against the ground.' },
  { t: 10,   d: 4,   n: 'Sweep in',        s: 'The blade pulls back. The chevron scraper herds the FOD to the middle and up the ramp; it rides up the ramp and floor on its float.' },
  { t: 14,   d: 1,   n: 'Scraper closes',  s: 'Back at the park stop, the scraper settles into its rest height and closes off the floor.' },
  { t: 15,   d: 3.5, n: 'Raise',           s: 'The box lifts back above the bin. The hose straightens to a 35° fall.' },
  { t: 18.5, d: 4.5, n: 'Vacuum on',       s: 'The floor slopes 6° to the back. FOD slides into the 5" port, through the bend and down the hose into the bin. The air keeps dust and feathers moving.' },
  { t: 23,   d: 1.5, n: 'Ready again',     s: 'Vacuum off, box docked. The rover drives to the next item.' },
];
const TOTAL = 24.5;
const PARK = G.PARK, EXT = G.EXT, SCR_PARK = G.SCR_PARK, SCR_OPEN = 42;

function zf(x) { return G.H_B + (x + 94) * G.KF; }          // floor top
function surf(x) {                                            // box-frame ground under a point (design x)
  if (x > 135) return 0;
  if (x > 90) return Math.max(0, G.H_F - (x - 90) * G.KR);
  return zf(Math.max(x, -94));
}
function liftAt(t) {
  if (t < 1.5) return LIFT_DOCK;
  if (t < 5) return lerp(LIFT_DOCK, 0, ease((t - 1.5) / 3.5));
  if (t < 15) return 0;
  if (t < 18.5) return lerp(0, LIFT_DOCK, ease((t - 15) / 3.5));
  return LIFT_DOCK;
}
function sweepAt(t) {                                          // blade travel from the back stop
  if (t < 6) return PARK;
  if (t < 9) return lerp(PARK, EXT, ease((t - 6) / 3));
  if (t < 10) return EXT;
  if (t < 14) return lerp(EXT, PARK, ease((t - 10) / 4));
  return PARK;
}
const scrX = s => G.XB_BACK + s + 13;                          // scraper centre, design x
function floatAt(t) {
  if (t < 5) return SCR_PARK;
  if (t < 6) return lerp(SCR_PARK, SCR_OPEN, ease(t - 5));
  if (t < 9) return SCR_OPEN;
  if (t < 10) return lerp(SCR_OPEN, surf(scrX(EXT)), ease(t - 9));
  if (t < 14) return surf(scrX(sweepAt(t)));
  if (t < 15) return lerp(surf(scrX(PARK)), SCR_PARK, ease(t - 14));
  return SCR_PARK;
}
function scrState(t) {
  if (t >= 5.5 && t < 9.5) return 'open';
  if (t >= 9.5 && t < 14.5) return 'down';
  return 'closed';
}
const vacOn = t => t >= 18.5 && t < 23.2;

/* ---------------- renderer ---------------- */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.localClippingEnabled = true;
stage.appendChild(renderer.domElement);
renderer.domElement.tabIndex = 0;
renderer.domElement.setAttribute('aria-label', '3D view of the rover');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 16 / 9, 10, 20000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.495;
controls.minDistance = 250; controls.maxDistance = 6000;

scene.add(new THREE.HemisphereLight(0xffffff, 0x6c7378, 1.25));
const sun = new THREE.DirectionalLight(0xffffff, 1.9);
sun.position.set(1400, 2200, 1600);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -1100, right: 1100, top: 1100, bottom: -1100, near: 100, far: 6000 });
sun.shadow.bias = -0.0004;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xffffff, 0.45);
fill.position.set(-1500, 800, -900);
scene.add(fill);

const CLIP = [];
const clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0.5);
const allMats = [];
function mat(color, o = {}) {
  const m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.62, metalness: 0.05, side: THREE.DoubleSide }, o));
  if (!o.noClip) m.clippingPlanes = CLIP;
  allMats.push(m);
  return m;
}
const rgb = c => new THREE.Color().setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace);

/* ground: asphalt with a taxiway edge line */
{
  const g = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshStandardMaterial({ color: 0x4a4f53, roughness: 0.95 }));
  g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
  const line = new THREE.Mesh(new THREE.PlaneGeometry(150, 9000), new THREE.MeshStandardMaterial({ color: 0xe2a600, roughness: 0.8 }));
  line.rotation.x = -Math.PI / 2; line.position.set(-620, 0.6, 0); line.receiveShadow = true; scene.add(line);
}

/* ---------------- geometry helpers ---------------- */
function tubeAlong(pts, radiusFn, radial = 22) {   // open tube with a ring per point; normal X keeps it planar
  const n = pts.length, pos = new Float32Array(n * (radial + 1) * 3), idx = [];
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  fillTube(geo, pts, radiusFn, radial);
  return geo;
}
const _t = new THREE.Vector3(), _b = new THREE.Vector3(), XA = new THREE.Vector3(1, 0, 0);
function fillTube(geo, pts, radiusFn, radial = 22) {
  const pos = geo.attributes.position.array, n = pts.length;
  let s = 0;
  for (let i = 0; i < n; i++) {
    if (i > 0) s += pts[i].distanceTo(pts[i - 1]);
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(n - 1, i + 1)];
    _t.subVectors(p1, p0).normalize();
    _b.crossVectors(_t, XA).normalize();
    const r = radiusFn(s, i);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2, c = Math.cos(a) * r, d = Math.sin(a) * r, k = (i * (radial + 1) + j) * 3;
      pos[k] = pts[i].x + c * XA.x + d * _b.x;
      pos[k + 1] = pts[i].y + c * XA.y + d * _b.y;
      pos[k + 2] = pts[i].z + c * XA.z + d * _b.z;
    }
  }
  geo.attributes.position.needsUpdate = true;
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
}
function cylBetween(a, b, r, m, open = false, seg = 28) {
  const len = a.distanceTo(b);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg, 1, open), m);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return mesh;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);

function primMesh(p, m) {
  if (p.t === 'box') {
    const sx = p.hi[0] - p.lo[0], sy = p.hi[1] - p.lo[1], sz = p.hi[2] - p.lo[2];
    // the box back wall carries the 5" port: build it as a plate with a hole
    if (Math.abs(p.lo[2] - (OX - 100)) < 0.1 && Math.abs(sz - 6) < 0.1 && Math.abs(p.lo[0] + 83) < 0.1) {
      const sh = new THREE.Shape();
      sh.moveTo(p.lo[0], p.lo[1]); sh.lineTo(p.hi[0], p.lo[1]); sh.lineTo(p.hi[0], p.hi[1]); sh.lineTo(p.lo[0], p.hi[1]); sh.closePath();
      const h = new THREE.Path(); h.absarc(0, G.PORT_Z, G.BORE_R, 0, Math.PI * 2, true); sh.holes.push(h);
      const g = new THREE.ExtrudeGeometry(sh, { depth: sz, bevelEnabled: false, curveSegments: 40 });
      const mesh = new THREE.Mesh(g, m); mesh.position.z = p.lo[2]; return mesh;
    }
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m);
    mesh.position.set((p.lo[0] + p.hi[0]) / 2, (p.lo[1] + p.hi[1]) / 2, (p.lo[2] + p.hi[2]) / 2);
    return mesh;
  }
  if (p.t === 'cyl') {
    const n = V(...p.n), c = V(...p.c);
    return cylBetween(c.clone().addScaledVector(n, p.w0), c.clone().addScaledVector(n, p.w1), p.r, m);
  }
  if (p.t === 'poly') {
    const sh = new THREE.Shape(p.pts.map(q => new THREE.Vector2(q[0], q[1])));
    const g = new THREE.ExtrudeGeometry(sh, { depth: p.w1 - p.w0, bevelEnabled: false });
    const eu = V(...p.eu), ev = V(...p.ev), en = V(...p.en);
    g.applyMatrix4(new THREE.Matrix4().makeBasis(eu, ev, en));
    g.translate(en.x * p.w0, en.y * p.w0, en.z * p.w0);
    g.computeVertexNormals();
    return new THREE.Mesh(g, m);
  }
  if (p.t === 'arc') {
    const pts = [], sgn = p.above ? 1 : -1;
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * p.ang * Math.PI / 180;
      pts.push(V(0, p.yaxis + sgn * p.R * Math.cos(a), p.z0 + p.dir * p.R * Math.sin(a)));
    }
    return new THREE.Mesh(tubeAlong(pts, () => p.ro, 32), m);
  }
  if (p.t === 'tube') {
    return cylBetween(V(0, p.a[1], p.a[0]), V(0, p.b[1], p.b[0]), p.ro, m, true, 32);
  }
  return null;
}

/* ---------------- model ---------------- */
const roverG = new THREE.Group(), liftG = new THREE.Group(), sweepG = new THREE.Group(), scrG = new THREE.Group();
scene.add(roverG, liftG); liftG.add(sweepG); sweepG.add(scrG);
const pickables = [];
function tag(mesh, info) { mesh.userData.info = info; mesh.castShadow = true; mesh.receiveShadow = true; pickables.push(mesh); return mesh; }

const GROUP = { carriage: liftG, sweep: sweepG, scraper: scrG, tpu: scrG, rover: roverG };
const MATS = {};
for (const part of M.parts) {
  const isRef = part.mat === '-';
  const m = mat(rgb(part.col), { metalness: isRef ? 0.5 : 0.05, roughness: isRef ? 0.4 : 0.62 });
  MATS[part.name] = m;
  const info = { name: part.name, meta: (isRef ? 'Reference hardware' : part.mat) + (part.grp === 'rover' ? ' · fixed to the rover' : part.grp === 'carriage' ? ' · lifts with the box' : ' · rides on the blade'), note: part.note };
  for (const p of part.prims) { const mesh = primMesh(p, m); if (mesh) GROUP[part.grp].add(tag(mesh, info)); }
}

/* rover stand-ins (simplified) */
const alu = mat(0xb9c0c4, { metalness: 0.55, roughness: 0.35 });
const dark = mat(0x2a2e31, { roughness: 0.8 });
const steel = mat(0x8e969b, { metalness: 0.75, roughness: 0.3 });
const motorM = mat(0x23272a, { metalness: 0.3, roughness: 0.5 });
const RINFO = (name, note) => ({ name, meta: 'Your rover · simplified stand-in', note });
function beam(a, b, info) { const s = b.clone().sub(a); const mesh = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(s.x) || 40, Math.abs(s.y) || 40, Math.abs(s.z) || 40), alu); mesh.position.copy(a).add(b).multiplyScalar(0.5); roverG.add(tag(mesh, info)); }
const FR = RINFO('40×40 frame', 'Aluminium profile chassis.');
for (const x of [-135, 135]) {
  for (const y of [200, 345]) beam(V(x, y, -330), V(x, y, 330), FR);
  for (const z of [-330, 330]) beam(V(x, 180, z), V(x, 365, z), FR);
  beam(V(x, 365, 330), V(x, 735, 330), RINFO('Z column', '40×40 column carrying the lead screw and the top bridge.'));
}
for (const z of [-330, -110, 110, 330]) beam(V(-115, 200, z), V(115, 200, z), FR);
for (const z of [-330, 330]) beam(V(-115, 345, z), V(115, 345, z), FR);
const WINFO = RINFO('Wheel', 'Off-road wheel on its suspension module.');
for (const x of [-1, 1]) for (const z of [-1, 1]) {
  const w = new THREE.Group(); w.position.set(x * 250, 132, z * 285);
  const tyre = new THREE.Mesh(new THREE.CylinderGeometry(132, 132, 105, 40), dark); tyre.rotation.z = Math.PI / 2; w.add(tag(tyre, WINFO));
  for (let i = 0; i < 20; i++) { const lug = new THREE.Mesh(new THREE.BoxGeometry(110, 10, 24), dark); const a = (i / 20) * Math.PI * 2; lug.position.set(0, Math.cos(a) * 133, Math.sin(a) * 133); lug.rotation.x = -a; w.add(lug); }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(62, 62, 108, 28), steel); hub.rotation.z = Math.PI / 2; w.add(hub);
  roverG.add(w);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(80, 30, 30), alu); arm.position.set(x * 175, 200, z * 285); roverG.add(arm);
}
/* bin (vacuum drum) */
const ghostM = new THREE.MeshStandardMaterial({ color: 0xc9cdd0, metalness: 0.5, roughness: 0.35, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false, clippingPlanes: CLIP });
allMats.push(ghostM);
const BINFO = RINFO('Vacuum bin', 'Your 2800 W canister. FOD lands on its floor.');
const drum = new THREE.Mesh(new THREE.CylinderGeometry(150, 150, 260, 56, 1, true), ghostM); drum.position.set(0, 495, 160); roverG.add(tag(drum, BINFO)); drum.castShadow = false;
const drumBase = new THREE.Mesh(new THREE.CylinderGeometry(150, 150, 4, 56), ghostM); drumBase.position.set(0, 367, 160); roverG.add(drumBase);
const lid = new THREE.Mesh(new THREE.SphereGeometry(152, 48, 16, 0, Math.PI * 2, 0, Math.PI * 0.28), steel); lid.position.set(0, 560, 160); lid.scale.y = 0.75; roverG.add(tag(lid, RINFO('Vacuum head', 'Motor head on top of the bin.')));
const handle = new THREE.Mesh(new THREE.TorusGeometry(60, 6, 10, 24, Math.PI), steel); handle.position.set(0, 668, 160); roverG.add(handle);
/* lead screws, motors, collars, couplers, nuts */
const nutM = mat(0xc49a3a, { metalness: 0.7, roughness: 0.3 });
const nuts = [];
for (const x of [-G.NUT_X, G.NUT_X]) {
  roverG.add(tag(cylBetween(V(x, 136.3, G.NUT_Z), V(x, 736.3, G.NUT_Z), 4, steel), RINFO('T8 lead screw', '600 mm, driven from the top by the NEMA17.')));
  const mot = new THREE.Mesh(new THREE.BoxGeometry(42.3, 48, 42.3), motorM); mot.position.set(x, 761 + 24, G.NUT_Z); roverG.add(tag(mot, RINFO('NEMA17 (Z)', 'Sits in the top bridge, shaft down into the coupler.')));
  roverG.add(tag(cylBetween(V(x, 731, G.NUT_Z), V(x, 750, G.NUT_Z), 11, steel), RINFO('Coupler', '5 mm motor shaft to the 8 mm screw.')));
  for (const y of [137, 700]) roverG.add(tag(cylBetween(V(x, y, G.NUT_Z), V(x, y + 12, G.NUT_Z), 18, steel), RINFO('Stop collar', 'Hard stop at each end of the lift. The Z arm\'s stop ring lands on the bottom one.')));
  const nut = new THREE.Group();
  nut.add(cylBetween(V(0, 0, 0), V(0, 10, 0), 22, nutM)); nut.add(cylBetween(V(0, 10, 0), V(0, 40, 0), 12, nutM));
  nut.position.set(x, G.ARM_TOP, G.NUT_Z); liftG.add(nut); nuts.push(nut);
}

/* ---------------- hose ---------------- */
const B0 = V(0, G.BOX_BEND_END[1], G.BOX_BEND_END[0]);        // end of the box outlet bend at lift 0
const TIP0 = V(0, G.BOX_TIP[1], G.BOX_TIP[0]);                  // box spigot tip at lift 0
const ETIP = V(0, G.ELB_TIP[1], G.ELB_TIP[0]);                  // bin elbow spigot tip
const HN = 260;
const hosePts = Array.from({ length: HN }, () => new THREE.Vector3());
function hoseCurve(lift, out) {
  const start = B0.clone().addScaledVector(DIRW, -3); start.y += lift;
  const tip = TIP0.clone(); tip.y += lift;
  const eEnd = ETIP.clone().addScaledVector(DIRW, -40);
  const dist = tip.distanceTo(ETIP);
  const docked = lift > LIFT_DOCK - 1;
  const lb = docked ? dist / 3 : Math.min(dist / 3, lerp(dist / 3, 14, clamp((LIFT_DOCK - lift) / 120, 0, 1)));
  const le = lerp(dist / 3, dist * 0.42, clamp((LIFT_DOCK - lift) / 200, 0, 1));
  const bz = new THREE.CubicBezierCurve3(tip, tip.clone().addScaledVector(DIRW, -lb), ETIP.clone().addScaledVector(DIRW, le), ETIP);
  const n1 = 10, n3 = 18, n2 = HN - n1 - n3;
  for (let i = 0; i < n1; i++) out[i].lerpVectors(start, tip, i / n1);
  const bp = bz.getSpacedPoints(n2 - 1);
  for (let i = 0; i < n2; i++) out[n1 + i].copy(bp[i]);
  for (let i = 0; i < n3; i++) out[n1 + n2 + i].lerpVectors(ETIP, eEnd, (i + 1) / n3);
  let L = 0; for (let i = 1; i < HN; i++) L += out[i].distanceTo(out[i - 1]);
  return L;
}
const hoseM = mat(0x1d2023, { roughness: 0.55, metalness: 0.1 });
const ribR = s => 66.8 + 2.7 * (0.5 + 0.5 * Math.cos(2 * Math.PI * s / 7.5));
hoseCurve(LIFT_DOCK, hosePts);
const hoseGeo = tubeAlong(hosePts, ribR, 22);
const hose = tag(new THREE.Mesh(hoseGeo, hoseM), { name: '5" corrugated hose', meta: 'Bought · 127 mm bore', note: 'Box outlet to bin elbow. Stretches as the box lowers; straight at 35° when docked.' });
scene.add(hose);
const L_DOCK = hoseCurve(LIFT_DOCK, hosePts), L_LOW = hoseCurve(0, hosePts);
hoseCurve(LIFT_DOCK, hosePts);
/* band clamps */
const clampM = mat(0xc7ccd0, { metalness: 0.85, roughness: 0.25 });
function bandClamp() {
  const g = new THREE.Group();
  const band = new THREE.Mesh(new THREE.CylinderGeometry(71.5, 71.5, 12.5, 48, 1, true), clampM); g.add(band);
  const worm = new THREE.Mesh(new THREE.BoxGeometry(16, 10, 14), clampM); worm.position.set(0, 0, -76); g.add(worm);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), DIRW);
  g.traverse(o => { if (o.isMesh) tag(o, { name: 'Band clamp', meta: 'Bought · 130–150 mm worm drive', note: 'Sits on the flat land behind the spigot bead. Keep the screw housing on top at the box end.' }); });
  return g;
}
const clampBox = bandClamp(); liftG.add(clampBox);
clampBox.position.copy(TIP0).addScaledVector(DIRW, 15.25);
const clampBin = bandClamp(); roverG.add(clampBin);
clampBin.position.copy(ETIP).addScaledVector(DIRW, -19.5);

/* ---------------- FOD ---------------- */
const fodDefs = [
  { name: 'M8 washer', x: 205, y: -34, kind: 'washer', h: 1.6, half: 9 },
  { name: 'M5 washer', x: 248, y: 40, kind: 'washer', h: 1.2, half: 6 },
  { name: 'Bolt', x: 225, y: 70, kind: 'bolt', h: 4, half: 16 },
  { name: 'Bird', x: 195, y: 8, kind: 'bird', h: 21, half: 26 },
  { name: 'Stone', x: 262, y: -66, kind: 'stone', h: 7, half: 9 },
  { name: 'Rivet', x: 178, y: -60, kind: 'bolt', h: 3, half: 10 },
];
const fodM = { washer: mat(0xd9dde0, { metalness: 0.85, roughness: 0.25 }), bolt: mat(0x9aa2a8, { metalness: 0.8, roughness: 0.3 }), bird: mat(0x7b5a3c, { roughness: 0.9 }), stone: mat(0x8d8577, { roughness: 0.95 }) };
const fodMeshes = fodDefs.map(f => {
  let m;
  if (f.kind === 'washer') { m = new THREE.Mesh(new THREE.CylinderGeometry(f.half, f.half, f.h * 2, 24), fodM.washer); }
  else if (f.kind === 'bolt') { m = new THREE.Mesh(new THREE.CylinderGeometry(f.h, f.h, f.half * 2, 14), fodM.bolt); m.rotation.x = Math.PI / 2; }
  else if (f.kind === 'stone') { m = new THREE.Mesh(new THREE.DodecahedronGeometry(f.half, 0), fodM.stone); m.scale.y = 0.75; }
  else { m = new THREE.Group(); const body = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), fodM.bird); body.scale.set(56, 21, 26); m.add(body); const head = new THREE.Mesh(new THREE.SphereGeometry(13, 14, 10), fodM.bird); head.position.set(52, 6, 0); m.add(head); }
  const g = new THREE.Group(); g.add(m);
  g.traverse(o => { if (o.isMesh) tag(o, { name: f.name, meta: 'FOD', note: f.kind === 'bird' ? 'About 127 mm long. Fits the 127 mm hose bore lying flat.' : 'Small, heavy FOD. Moves on gravity, not air.' }); });
  scene.add(g); return g;
});

/* where each item ends up after the sweep (box frame, design x/y) */
function swept(f, t) {
  if (t < 10) return { x: f.x, y: f.y };
  const s = sweepAt(Math.min(t, 14));
  const dx = G.XB_BACK + s;
  const face = dx + 6 + Math.max(0, Math.abs(f.y) - 62);
  const x = Math.max(-94 + f.half, Math.min(f.x, face - f.half));
  const pushed = clamp((f.x - x) / Math.max(1, f.x - (-60 - f.half)), 0, 1);
  const yt = Math.sign(f.y) * Math.min(Math.abs(f.y), 46);
  return { x, y: lerp(f.y, yt, pushed) };
}
/* world path the FOD follows with the vacuum on (box docked) */
function buildFlowPath() {
  const L = LIFT_DOCK, P = [];
  const c0 = V(0, 12.5 + L, OX - 100);                         // centre of the outlet bend
  for (let i = 0; i <= 12; i++) { const a = (i / 12) * 35 * Math.PI / 180; P.push(V(0, c0.y + 70 * Math.cos(a), c0.z - 70 * Math.sin(a))); }
  P.push(TIP0.clone().setY(TIP0.y + L));
  P.push(ETIP.clone());
  const ea = V(0, G.ELB_A[1], G.ELB_A[0]); P.push(ea);
  for (let i = 1; i <= 10; i++) { const a = (1 - i / 10) * 35 * Math.PI / 180; P.push(V(0, 585 - 100 * Math.cos(a), 315 + 100 * Math.sin(a))); }
  P.push(V(0, 470, 270));
  return P;
}
const FLOW = buildFlowPath();
function polyAt(P, u) {                                           // point at arc length u
  for (let i = 1; i < P.length; i++) { const d = P[i].distanceTo(P[i - 1]); if (u <= d) return P[i - 1].clone().lerp(P[i], u / d); u -= d; }
  return P[P.length - 1].clone();
}
const polyLen = P => P.reduce((a, p, i) => i ? a + p.distanceTo(P[i - 1]) : 0, 0);
const itemPaths = fodDefs.map((f, k) => {
  const e = swept(f, 14);
  const toWorld = (x, y, z) => V(y, z + LIFT_DOCK, x + OX);
  const P = [toWorld(e.x, e.y, zf(e.x) + f.h)];
  P.push(toWorld(-90, e.y * 0.3, zf(-90) + f.h));
  for (let i = 0; i < FLOW.length - 1; i++) {                  // ride the floor of the bore
    const a = FLOW[i], b = FLOW[i + 1];
    const tdir = b.clone().sub(a).normalize();
    const down = new THREE.Vector3().crossVectors(tdir, XA).normalize(); if (down.y > 0) down.negate();
    P.push(a.clone().addScaledVector(down, 60 - f.h - 1));
  }
  const ang = k * 1.1, rr = 30 + (k % 3) * 28;
  P.push(V(Math.cos(ang) * rr, 380, 160 + Math.sin(ang) * rr + 20));
  P.push(V(Math.cos(ang) * rr, 369 + f.h, 160 + Math.sin(ang) * rr));
  return { P, L: polyLen(P), start: 18.9 + k * 0.5 };
});
function placeFod(t, lift) {
  fodDefs.forEach((f, k) => {
    const g = fodMeshes[k], ip = itemPaths[k];
    if (t >= ip.start) { g.position.copy(polyAt(ip.P, (t - ip.start) * 420)); return; }
    const e = swept(f, t);
    const inBox = e.x < 135;
    const z = inBox ? surf(e.x) : 0;
    g.position.set(e.y, z + f.h + (inBox ? lift : 0), e.x + OX);
  });
}

/* airflow dots */
const AIR_N = 46;
const air = new THREE.InstancedMesh(new THREE.SphereGeometry(4.5, 8, 6), new THREE.MeshBasicMaterial({ color: 0x7fd3ff, transparent: true, opacity: 0.85 }), AIR_N);
air.frustumCulled = false; scene.add(air);
const AIR_PATH = [V(0, LIFT_DOCK + 80, OX + 120), V(0, LIFT_DOCK + 82.5, OX - 40), ...FLOW];
const AIR_L = polyLen(AIR_PATH);
const _m4 = new THREE.Matrix4();
function placeAir(t, on) {
  air.visible = on;
  if (!on) return;
  for (let i = 0; i < AIR_N; i++) {
    const u = ((t * 900 + (i / AIR_N) * AIR_L) % AIR_L);
    const p = polyAt(AIR_PATH, u);
    const w = Math.sin(i * 12.9898) * 28;
    p.x += w * 0.8; p.y += Math.cos(i * 4.1) * 18;
    _m4.makeTranslation(p.x, p.y, p.z); air.setMatrixAt(i, _m4);
  }
  air.instanceMatrix.needsUpdate = true;
}

/* ---------------- UI ---------------- */
const phBox = $('phases'), stepList = $('stepList');
PH.forEach((p, i) => {
  const b = document.createElement('button'); b.className = 'ph'; b.type = 'button';
  b.innerHTML = `<i><b></b></i><span>${p.n}</span>`; b.setAttribute('aria-label', `Jump to ${p.n}`);
  b.onclick = () => seek(p.t + 0.001); phBox.appendChild(b);
  const li = document.createElement('li'); li.tabIndex = 0;
  li.innerHTML = `<div><b>${p.n}</b><span>${p.s}</span></div><span class="at">${p.t.toFixed(1)} s</span>`;
  li.onclick = () => { seek(p.t + 0.001); stage.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
  li.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); li.onclick(); } };
  stepList.appendChild(li);
});
$('lenDock').textContent = Math.round(L_DOCK) + ' mm';
$('lenLow').textContent = Math.round(L_LOW) + ' mm';

let T = 0, playing = !matchMedia('(prefers-reduced-motion: reduce)').matches, last = performance.now();
const playBtn = $('play'), scrub = $('scrub');
function setPlay(p) { playing = p; playBtn.textContent = p ? 'Pause' : 'Play'; }
setPlay(playing);
playBtn.onclick = () => setPlay(!playing);
function seek(t) { T = clamp(t, 0, TOTAL); update(true); }
scrub.oninput = () => { setPlay(false); seek(+scrub.value); };

const tFlow = $('tFlow'), tSec = $('tSec'), tGhost = $('tGhost');
tSec.onchange = () => { CLIP.length = 0; if (tSec.checked) CLIP.push(clipPlane); allMats.forEach(m => m.needsUpdate = true); };
tGhost.onchange = () => { ghostM.opacity = tGhost.checked ? 0.28 : 1; ghostM.transparent = tGhost.checked; ghostM.depthWrite = !tGhost.checked; ghostM.needsUpdate = true; };

/* cameras */
let camMode = 'overview', camAnim = null;
const CAMS = {
  overview: () => ({ pos: V(1500, 1050, 1750), tgt: V(0, 330, 250) }),
  box: () => { const y = liftAt(T); return { pos: V(620, y + 330, OX + 640), tgt: V(0, y + 90, OX + 80) }; },
  hose: () => ({ pos: V(1550, 420, 520), tgt: V(0, 310, 420) }),
};
function setCam(mode, instant) {
  camMode = mode;
  document.querySelectorAll('[data-cam]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cam === mode)));
  const c = CAMS[mode]();
  if (instant) { camera.position.copy(c.pos); controls.target.copy(c.tgt); camAnim = null; }
  else camAnim = { from: camera.position.clone(), fromT: controls.target.clone(), to: c, t0: performance.now() };
  if (mode === 'hose' && !tSec.checked) { tSec.checked = true; tSec.onchange(); }
}
document.querySelectorAll('[data-cam]').forEach(b => b.onclick = () => setCam(b.dataset.cam));
controls.addEventListener('start', () => { camAnim = null; if (camMode === 'box') camMode = 'free'; });

/* picking */
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
let downAt = null;
renderer.domElement.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', e => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
  const r = renderer.domElement.getBoundingClientRect();
  mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  const hits = ray.intersectObjects(pickables, false).filter(h => !tSec.checked || h.point.x <= 1);
  const hit = hits.find(h => h.object.visible);
  if (!hit) { $('pick').hidden = true; return; }
  const inf = hit.object.userData.info;
  $('pickT').textContent = inf.name; $('pickM').textContent = inf.meta; $('pickN').textContent = inf.note || '';
  $('pick').hidden = false;
});
$('pickX').onclick = () => { $('pick').hidden = true; };

/* theme */
function applyTheme() { scene.background = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--scene').trim() || '#d6dad8'); }
applyTheme();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

/* ---------------- frame ---------------- */
let lastPh = -1, lastLift = -1;
function update(force) {
  const lift = liftAt(T), s = sweepAt(T), f = floatAt(T), vac = vacOn(T);
  liftG.position.y = lift;
  sweepG.position.z = s;
  scrG.position.y = f;
  if (force || Math.abs(lift - lastLift) > 0.05) {
    const L = hoseCurve(lift, hosePts); fillTube(hoseGeo, hosePts, ribR, 22); lastLift = lift;
    $('hoseChip').textContent = `Hose ${Math.round(L)} mm`;
  }
  placeFod(T, lift);
  placeAir(T, vac && tFlow.checked);
  let k = 0; for (let i = 0; i < PH.length; i++) if (T >= PH[i].t) k = i;
  if (k !== lastPh) {
    lastPh = k;
    $('phN').textContent = `${String(k + 1).padStart(2, '0')} / ${PH.length}`; $('phT').textContent = PH[k].n;
    [...phBox.children].forEach((b, i) => b.classList.toggle('cur', i === k));
    [...stepList.children].forEach((li, i) => li.classList.toggle('cur', i === k));
  }
  [...phBox.children].forEach((b, i) => { b.firstChild.firstChild.style.width = (clamp((T - PH[i].t) / PH[i].d, 0, 1) * 100) + '%'; });
  $('vacChip').textContent = vac ? 'VAC ON' : 'VAC OFF'; $('vacChip').classList.toggle('on', vac);
  $('liftChip').textContent = `Lift ${Math.round(lift)} mm`;
  $('bladeChip').textContent = `Blade ${Math.round(s)} mm`;
  const st = scrState(T); $('scrChip').textContent = `Scraper ${st}`; $('scrChip').classList.toggle('on', st !== 'closed');
  scrub.value = T.toFixed(2); $('time').textContent = `${T.toFixed(1)} s`;
}

function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);
resize();
setCam('overview', true);
update(true);
$('loading').hidden = true; $('hud').hidden = false; $('hint').hidden = false;

function frame(now) {
  if (!stage.isConnected) { renderer.dispose(); return; }
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (playing) { T += dt; if (T > TOTAL) T = 0; update(false); }
  if (camAnim) {
    const k = ease((now - camAnim.t0) / 900);
    camera.position.lerpVectors(camAnim.from, camAnim.to.pos, k); controls.target.lerpVectors(camAnim.fromT, camAnim.to.tgt, k);
    if (k >= 1) camAnim = null;
  } else if (camMode === 'box') {
    const c = CAMS.box(); controls.target.lerp(c.tgt, 0.08); camera.position.lerp(c.pos, 0.05);
  }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

}
