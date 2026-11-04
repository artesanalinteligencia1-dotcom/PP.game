import * as THREE from 'three'
import type { InstrumentShape, SpacecraftVisual } from '../../spacecraft/visual'

// The procedural spacecraft in 3D, built from the same `spacecraftVisual(design)` as the 2D drawing (SpacecraftSprite):
// gold-foil bus, solar arrays (body-mounted, deployable or sun-tracking wings), antenna on top, radiator, thruster at the
// back and the instruments on the face that looks at the planet. 1 viewBox unit of the 2D drawing = `busM / v.bus` metres.

const COLORS = { foil: 0xd4a017, foilDark: 0xa07612, cell: 0x1e3a8a, cellEdge: 0x60a5fa, metal: 0xcbd5e1, dark: 0x334155, radiator: 0xf8fafc, astrophysicist: 0xa78bfa, astrobiologist: 0x34d399 }

export interface Spacecraft3D {
  group: THREE.Group
  /** 0 = folded inside the fairing, 1 = arrays and booms fully deployed */
  setDeploy: (k: number) => void
}

export function buildSpacecraft(v: SpacecraftVisual, busM: number): Spacecraft3D {
  const s = busM / v.bus // metres per 2D unit
  const b = busM
  const mat = (color: number, metal = 0.3, rough = 0.5) => new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough })
  const foil = mat(COLORS.foil, 0.45, 0.35) // moderate metalness: without an environment map, shinier gold renders brown
  const foilDark = mat(COLORS.foilDark, 0.45, 0.4)
  const cell = mat(COLORS.cell, 0.5, 0.25)
  const metal = mat(COLORS.metal, 0.6, 0.35)
  const dark = mat(COLORS.dark, 0.3, 0.6)
  const g = new THREE.Group()
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0, parent: THREE.Object3D = g) => {
    const mesh = new THREE.Mesh(geo, m)
    mesh.position.set(x, y, z)
    parent.add(mesh)
    return mesh
  }

  // bus with two darker seams, like the 2D drawing
  add(new THREE.BoxGeometry(b, b, b), foil)
  for (const f of [-1 / 6, 1 / 6]) add(new THREE.BoxGeometry(b * 1.01, b * 0.02, b * 1.01), foilDark, 0, f * b * 2)
  if (v.arrays.kind === 'body') {
    for (const z of [-1, 1]) add(new THREE.BoxGeometry(b * 0.86, b * 0.86, 0.02), cell, 0, 0, z * (b / 2 + 0.011))
    for (const x of [-1, 1]) add(new THREE.BoxGeometry(0.02, b * 0.86, b * 0.86), cell, x * (b / 2 + 0.011), 0, 0)
  }
  if (v.activeThermal) add(new THREE.BoxGeometry(b * 0.7, 4 * s * 0.25, b * 0.7), mat(COLORS.radiator, 0.1, 0.6), 0, b / 2 + s * 0.6)

  // antenna on top (+y)
  const top = b / 2
  if (v.antenna === 'omni') add(new THREE.CylinderGeometry(0.4 * s, 0.4 * s, 14 * s, 6), metal, 0, top + 7 * s)
  if (v.antenna === 'patch') add(new THREE.BoxGeometry(8 * s, 2.5 * s, 8 * s), metal, 0, top + 1.25 * s)
  if (v.antenna === 'helical') {
    const pts = Array.from({ length: 60 }, (_, i) => new THREE.Vector3(Math.cos(i * 0.6) * 2 * s, (i / 59) * 12 * s, Math.sin(i * 0.6) * 2 * s))
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.3 * s, 5), metal, 0, top)
  }
  if (v.antenna === 'dish') {
    const boom = add(new THREE.CylinderGeometry(0.4 * s, 0.4 * s, 9 * s, 6), metal, b * 0.3, top + 4 * s)
    boom.rotation.z = -0.5
    const prof = Array.from({ length: 10 }, (_, i) => new THREE.Vector2((i / 9) * 7 * s, ((i / 9) ** 2) * 3 * s))
    const dish = add(new THREE.LatheGeometry(prof, 24), new THREE.MeshStandardMaterial({ color: COLORS.metal, metalness: 0.5, roughness: 0.35, side: THREE.DoubleSide }), b * 0.3 + 2.5 * s, top + 9 * s)
    dish.rotation.z = -0.6
  }

  // propulsion at the back (-z)
  const back = -b / 2
  if (v.propulsion === 'coldgas') add(new THREE.BoxGeometry(4 * s, 4 * s, 2 * s), dark, 0, 0, back - s)
  if (v.propulsion === 'hydrazine') {
    const n = add(new THREE.CylinderGeometry(2 * s, 5 * s, 5 * s, 12, 1, true), dark, 0, 0, back - 2.5 * s)
    n.rotation.x = Math.PI / 2
  }
  if (v.propulsion === 'electric') {
    const n = add(new THREE.CylinderGeometry(3 * s, 3 * s, 4 * s, 16), dark, 0, 0, back - 2 * s)
    n.rotation.x = Math.PI / 2
  }

  // instruments on the bottom face (-y), spread like the 2D drawing
  const bottom = -b / 2
  const n = v.instruments.length
  v.instruments.forEach((inst, i) => {
    const x = -b / 2 + ((i + 1) * b) / (n + 1)
    instrument(inst.shape, COLORS[inst.discipline], x, bottom, s, g, { metal, dark })
  })

  // solar array wings on ±x: accordion panels that unfold from the side of the bus
  const wings: THREE.Group[] = []
  if ((v.arrays.kind === 'deployable' || v.arrays.kind === 'tracking') && v.arrays.wing > 0) {
    const w = v.arrays.wing * s
    const yoke = (v.arrays.kind === 'tracking' ? 4 : 1.5) * s
    const edge = new THREE.LineBasicMaterial({ color: COLORS.cellEdge })
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group()
      pivot.position.x = side * b / 2
      const arm = add(new THREE.CylinderGeometry(0.5 * s, 0.5 * s, yoke, 6), metal, side * yoke / 2, 0, 0, pivot)
      arm.rotation.z = Math.PI / 2
      if (v.arrays.kind === 'tracking') add(new THREE.SphereGeometry(1.6 * s, 10, 8), dark, side * yoke / 2, 0, 0, pivot)
      const wing = new THREE.Group()
      wing.position.x = side * yoke
      const segs = Math.max(1, Math.floor(v.arrays.wing / 6))
      const panel = new THREE.BoxGeometry(w, 14 * s, 0.05)
      panel.translate(side * w / 2, 0, 0)
      wing.add(new THREE.Mesh(panel, cell))
      const lines: number[] = []
      for (let k = 1; k < segs; k++) {
        const x = side * (k * w) / segs
        lines.push(x, -7 * s, 0.03, x, 7 * s, 0.03)
      }
      lines.push(0, 0, 0.03, side * w, 0, 0.03)
      const lg = new THREE.BufferGeometry()
      lg.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3))
      wing.add(new THREE.LineSegments(lg, edge))
      pivot.add(wing)
      g.add(pivot)
      wings.push(wing)
    }
  }

  const setDeploy = (k: number) => {
    const e = Math.max(0, Math.min(1, k))
    const folded = Math.min(1, (3 * s) / Math.max(v.arrays.wing * s, 1e-6))
    for (const wing of wings) {
      wing.scale.x = folded + (1 - folded) * e
      wing.rotation.x = (1 - e) * 0.25
    }
  }
  setDeploy(0)
  g.traverse((o) => (o.castShadow = true))
  return { group: g, setDeploy }
}

function instrument(shape: InstrumentShape, rim: number, x: number, y: number, s: number, g: THREE.Group, m: { metal: THREE.Material; dark: THREE.Material }) {
  const ring = new THREE.MeshStandardMaterial({ color: rim, metalness: 0.2, roughness: 0.5, emissive: rim, emissiveIntensity: 0.15 })
  const lens = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 })
  const put = (geo: THREE.BufferGeometry, mat: THREE.Material, dx: number, dy: number, dz = 0) => {
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(x + dx, y + dy, dz)
    g.add(mesh)
    return mesh
  }
  switch (shape) {
    case 'camera':
      put(new THREE.BoxGeometry(6 * s, 7 * s, 6 * s), m.dark, 0, -3.5 * s)
      put(new THREE.CylinderGeometry(2.2 * s, 2.2 * s, 1.2 * s, 16), ring, 0, -7.6 * s)
      put(new THREE.CylinderGeometry(1.8 * s, 1.8 * s, 1.3 * s, 16), lens, 0, -7.7 * s)
      break
    case 'bigCamera':
      put(new THREE.BoxGeometry(9 * s, 11 * s, 9 * s), m.dark, 0, -5.5 * s)
      put(new THREE.CylinderGeometry(4 * s, 4 * s, 1.2 * s, 20), ring, 0, -11.6 * s)
      put(new THREE.CylinderGeometry(3.4 * s, 3.4 * s, 1.3 * s, 20), lens, 0, -11.7 * s)
      break
    case 'radar':
      put(new THREE.BoxGeometry(28 * s, 3.5 * s, 10 * s), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.4, roughness: 0.5 }), 0, -1.75 * s)
      put(new THREE.BoxGeometry(28.4 * s, 0.4 * s, 10.4 * s), ring, 0, -3.6 * s)
      break
    case 'spectrometer':
      put(new THREE.BoxGeometry(8 * s, 6 * s, 6 * s), m.metal, 0, -3 * s)
      put(new THREE.BoxGeometry(5 * s, 1.2 * s, 2 * s), lens, 0, -6.4 * s)
      put(new THREE.BoxGeometry(8.2 * s, 0.4 * s, 6.2 * s), ring, 0, -0.4 * s)
      break
    case 'boom': {
      const len = Math.hypot(16, 10) * s
      const boom = put(new THREE.CylinderGeometry(0.4 * s, 0.4 * s, len, 6), m.metal, 8 * s, -5 * s)
      boom.rotation.z = Math.atan2(16, 10)
      put(new THREE.SphereGeometry(1.8 * s, 12, 8), ring, 16 * s, -10 * s)
      break
    }
    case 'detector':
      put(new THREE.CylinderGeometry(3 * s, 1.5 * s, 6 * s, 12), m.metal, 0, -3 * s)
      put(new THREE.CylinderGeometry(3.1 * s, 3.1 * s, 0.4 * s, 12), ring, 0, -0.2 * s)
      break
    case 'laser':
      put(new THREE.BoxGeometry(6 * s, 5 * s, 6 * s), m.dark, 0, -2.5 * s)
      put(new THREE.SphereGeometry(1.4 * s, 12, 8), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.8 }), 0, -5.6 * s)
      break
    case 'canister':
      put(new THREE.CylinderGeometry(2.5 * s, 2.5 * s, 8 * s, 14), m.metal, 0, -4 * s)
      put(new THREE.CylinderGeometry(2.6 * s, 2.6 * s, 0.5 * s, 14), ring, 0, -0.5 * s)
      break
    case 'telescope':
      put(new THREE.CylinderGeometry(5 * s, 5 * s, 14 * s, 20), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.4, roughness: 0.4 }), 0, -7 * s)
      put(new THREE.CylinderGeometry(6 * s, 8 * s, 4 * s, 20), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5, roughness: 0.4 }), 0, -16 * s)
      put(new THREE.CylinderGeometry(2.5 * s, 2.5 * s, 4.2 * s, 16), lens, 0, -16 * s)
      put(new THREE.CylinderGeometry(5.1 * s, 5.1 * s, 0.5 * s, 20), ring, 0, -0.5 * s)
      break
    case 'dipoles':
      for (const [dx, rz] of [[-7, -Math.atan2(14, 12)], [7, Math.atan2(14, 12)], [0, 0]] as const) {
        const len = dx === 0 ? 15 * s : Math.hypot(14, 12) * s
        const rod = put(new THREE.CylinderGeometry(0.35 * s, 0.35 * s, len, 6), ring, dx * s, dx === 0 ? -7.5 * s : -6 * s)
        rod.rotation.z = rz
      }
      break
    case 'dishDown': {
      const prof = Array.from({ length: 10 }, (_, i) => new THREE.Vector2((i / 9) * 5 * s, -((i / 9) ** 2) * 6 * s))
      put(new THREE.LatheGeometry(prof, 20), new THREE.MeshStandardMaterial({ color: COLORS.metal, metalness: 0.5, roughness: 0.35, side: THREE.DoubleSide }), 0, -0.2 * s)
      put(new THREE.TorusGeometry(5 * s, 0.35 * s, 6, 24), ring, 0, -6.2 * s).rotation.x = Math.PI / 2
      break
    }
  }
}
