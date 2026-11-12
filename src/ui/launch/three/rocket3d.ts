import * as THREE from 'three'
import type { RocketLayout } from '../../../engine/rocketLayout'

// The player's rocket in 3D, built from `rocketLayout(design)`: one group per stage (tanks, engine section, nozzles and
// the interstage that hides the engines of the stage above), strap-on boosters, the two fairing halves, landing legs and
// grid fins. Used by the workbench viewer and by the launch scene. No DOM here (plain geometry), so it is unit-tested.
// Origin: the first stage's nozzle exits; +y is up.

const COLORS = { kerosene: 0xcbd5e1, methane: 0x94a3b8, hydrogen: 0xf97316, unknown: 0x64748b, dark: 0x334155, seam: 0x1e293b, fairing: 0xf8fafc, booster: 0xe2e8f0, fin: 0x475569, leg: 0x64748b }
const SEG = 32

export interface Rocket3D {
  /** everything, for a viewer; the launch scene takes the stages and boosters apart instead */
  root: THREE.Group
  layout: RocketLayout
  /** stages[0] lifts off. Each group keeps the rocket's origin, so a stage that is put back sits at (0, 0, 0). */
  stages: THREE.Group[]
  /** `out` is the unit vector pointing away from the rocket's axis */
  boosters: { group: THREE.Group; home: THREE.Vector3; out: THREE.Vector3 }[]
  /** two halves inside the top stage's group: [0] opens towards +z, [1] towards −z */
  fairing: THREE.Group[]
  /** 0 = legs folded up along the first stage, 1 = down for the landing */
  setLegs: (k: number) => void
  dispose: () => void
}

export function buildRocket3D(layout: RocketLayout): Rocket3D {
  const k = layout.scale
  const geos: THREE.BufferGeometry[] = []
  const mats: THREE.Material[] = []
  const mat = (color: number, metalness = 0.25, roughness = 0.5, extra: THREE.MeshStandardMaterialParameters = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra })
    mats.push(m)
    return m
  }
  const dark = mat(COLORS.dark, 0.5, 0.5)
  const shell = mat(COLORS.dark, 0.3, 0.6, { side: THREE.DoubleSide })
  const seam = mat(COLORS.seam, 0.3, 0.6)
  const white = mat(COLORS.booster, 0.2, 0.45)
  const fuelMat = { kerosene: mat(COLORS.kerosene, 0.3, 0.4), methane: mat(COLORS.methane, 0.55, 0.3), hydrogen: mat(COLORS.hydrogen, 0.1, 0.7), unknown: mat(COLORS.unknown) }
  const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
    geos.push(geo)
    const mesh = new THREE.Mesh(geo, m)
    mesh.position.set(x, y, z)
    parent.add(mesh)
    return mesh
  }
  /** an open bell: narrow throat on top, wide exit at `y0` */
  const bell = (parent: THREE.Object3D, x: number, y0: number, z: number, exitR: number, height: number) =>
    add(parent, new THREE.CylinderGeometry(exitR * 0.42, exitR, height, 18, 1, true), shell, x, y0 + height / 2, z)

  const root = new THREE.Group()
  const stages = layout.stages.map((s, i) => {
    const g = new THREE.Group()
    const r = s.diameterM / 2
    const tanksLen = s.tankLengthM * s.tanks
    // tanks: one cylinder, with a seam between each pair so the number of tanks reads
    if (tanksLen > 0) add(g, new THREE.CylinderGeometry(r, r, tanksLen, SEG), fuelMat[s.fuel ?? 'unknown'], 0, s.tankY0 + tanksLen / 2, 0)
    for (let j = 1; j < s.tanks; j++) add(g, new THREE.CylinderGeometry(r * 1.006, r * 1.006, Math.min(0.14 * k, s.tankLengthM * 0.2), SEG, 1, true), seam, 0, s.tankY0 + j * s.tankLengthM, 0)
    // engine section: thrust structure on top, the bells below it
    const structure = s.engineLengthM * 0.4
    add(g, new THREE.CylinderGeometry(r, r * 0.94, structure, SEG), dark, 0, s.tankY0 - structure / 2, 0)
    const bellH = s.engineLengthM * (s.vacuum ? 0.72 : 0.64)
    for (const e of s.engines) bell(g, e.x, s.y0, e.z, e.exitR, bellH)
    // interstage up to the tanks of the next stage: it stays with this stage when they separate
    const next = layout.stages[i + 1]
    if (next) add(g, new THREE.CylinderGeometry((next.diameterM / 2) * 1.012, r * 1.012, next.engineLengthM, SEG, 1, true), shell, 0, next.y0 + next.engineLengthM / 2, 0)
    root.add(g)
    return g
  })
  const first = layout.stages[0]
  const s1 = stages[0]

  // strap-on boosters: body, nose cone and nozzle within the booster's catalog length
  const boosters = (layout.boosters?.spots ?? []).map((spot) => {
    const B = layout.boosters!
    const rb = B.diameterM / 2
    const nose = B.diameterM * 1.2
    const nz = B.diameterM * 0.45
    const body = Math.max(0.1, B.lengthM - nose - nz * 0.6)
    const g = new THREE.Group()
    add(g, new THREE.CylinderGeometry(rb, rb, body, 24), white, 0, nz * 0.6 + body / 2, 0)
    add(g, new THREE.ConeGeometry(rb, nose, 24), white, 0, nz * 0.6 + body + nose / 2, 0)
    add(g, new THREE.CylinderGeometry(rb * 1.01, rb * 1.01, B.diameterM * 0.25, 24, 1, true), seam, 0, nz * 0.6 + body * 0.82, 0)
    bell(g, 0, 0, 0, rb * 0.8, nz)
    const home = new THREE.Vector3(spot.x, 0, spot.z)
    g.position.copy(home)
    root.add(g)
    return { group: g, home, out: new THREE.Vector3(Math.cos(spot.angle), 0, Math.sin(spot.angle)) }
  })

  // a part on the first stage's skin at angle `a`: local +x points away from the axis
  const mount = (a: number, y: number, r: number) => {
    const p = new THREE.Group()
    p.position.set(Math.cos(a) * r, y, Math.sin(a) * r)
    p.rotation.y = -a
    s1.add(p)
    return p
  }
  const quarter = (i: number) => (i * Math.PI) / 2 + Math.PI / 4

  // landing legs: hinged at the bottom of the tanks, folded up along the body
  const legPivots: THREE.Group[] = []
  if (layout.legs && first) {
    const { lengthM: L, pivotY } = layout.legs
    const legMat = mat(COLORS.leg, 0.4, 0.5)
    const t = Math.max(0.12 * k, L * 0.045)
    for (let i = 0; i < 4; i++) {
      const p = mount(quarter(i), pivotY, first.diameterM / 2)
      add(p, new THREE.BoxGeometry(t, L, t * 2.4), legMat, t * 0.6, L / 2, 0)
      add(p, new THREE.CylinderGeometry(t * 1.6, t * 1.6, t * 0.5, 12), dark, t * 0.6, L, 0)
      legPivots.push(p)
    }
  }
  // grid fins: a lattice panel sticking out near the top of the first stage
  if (layout.fins && first) {
    const { y, sizeM: w } = layout.fins
    const finMat = mat(COLORS.fin, 0.6, 0.4)
    const bar = w * 0.07
    for (let i = 0; i < 4; i++) {
      const p = mount(quarter(i), y, first.diameterM / 2)
      for (const f of [0, 0.5, 1]) {
        add(p, new THREE.BoxGeometry(w, bar, bar), finMat, w / 2, 0, (f - 0.5) * w * 0.9)
        add(p, new THREE.BoxGeometry(bar, bar, w * 0.9 + bar), finMat, bar / 2 + f * (w - bar), 0, 0)
      }
    }
  }

  // fairing: a short shoulder from the top stage's width, a straight wall, then an ogive to the tip
  const fairing: THREE.Group[] = []
  const F = layout.fairing
  const top = stages[stages.length - 1]
  if (F && top) {
    const rf = F.diameterM / 2
    const rb = F.baseDiameterM / 2
    const L = F.lengthM
    const pts = [new THREE.Vector2(rb, 0)]
    if (Math.abs(rf - rb) > 1e-6) pts.push(new THREE.Vector2(rf, Math.min(L * 0.15, Math.abs(rf - rb) * 1.2)))
    pts.push(new THREE.Vector2(rf, L * 0.45))
    for (let i = 1; i <= 12; i++) pts.push(new THREE.Vector2(i === 12 ? 0 : rf * Math.cos((i / 12) * (Math.PI / 2)) ** 0.7, L * (0.45 + 0.55 * (i / 12))))
    const fairingMat = mat(COLORS.fairing, 0.1, 0.45, { side: THREE.DoubleSide })
    for (const phi of [-Math.PI / 2, Math.PI / 2]) {
      const g = new THREE.Group()
      add(g, new THREE.LatheGeometry(pts, 20, phi, Math.PI), fairingMat)
      g.position.y = F.y0
      top.add(g)
      fairing.push(g)
    }
  }

  const setLegs = (v: number) => {
    const a = (layout.legs?.deployAngle ?? 0) * Math.max(0, Math.min(1, v))
    legPivots.forEach((p) => (p.rotation.z = -a))
  }
  return { root, layout, stages, boosters, fairing, setLegs, dispose: () => [...geos, ...mats].forEach((x) => x.dispose()) }
}
