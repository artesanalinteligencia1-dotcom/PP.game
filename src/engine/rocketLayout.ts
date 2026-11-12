// Where every part of a player-built rocket sits, in metres: the shared blueprint of the 3D model (workbench viewer and
// launch scene). Pure (no three.js, no DOM). Same proportions as the side view in RocketScreen and as
// `analyzeRocket().heightM`: a stage is its tanks plus a 2.5 m engine section, the fairing is 2.5 × its diameter.
// Origin: the centre of the first stage's nozzle exits; +y is up.
import { ENGINE_LENGTH_M, FAIRING_FINENESS, getBooster, getFairing, getRocketEngine, getRocketTank, isReusableDesign, type PropellantFuel, type RocketDesign } from './rocket'

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/** Solid boosters: the catalog gives their length; the diameter is a drawing value (same as the side view). */
export const boosterDiameterM = (id: string) => (id === 'srb_l' ? 3.2 : 1.6)

export interface EngineSpot {
  x: number
  z: number
  /** radius of the nozzle exit */
  exitR: number
}

export interface StageLayout {
  /** base of the stage (nozzle exits) */
  y0: number
  /** tanks + engine section */
  lengthM: number
  /** where the tanks start, above the engine section */
  tankY0: number
  tankLengthM: number
  tanks: number
  diameterM: number
  engineLengthM: number
  fuel: PropellantFuel | null
  /** vacuum-only engine: a longer, wider nozzle */
  vacuum: boolean
  engines: EngineSpot[]
}

export interface RocketLayout {
  stages: StageLayout[]
  fairing: { y0: number; lengthM: number; diameterM: number; baseDiameterM: number } | null
  boosters: { id: string; lengthM: number; diameterM: number; spots: { angle: number; x: number; z: number }[] } | null
  /** landing legs on the first stage: hinged at `pivotY`, folded up along the body, they swing down by `deployAngle` */
  legs: { lengthM: number; pivotY: number; deployAngle: number; footDropM: number } | null
  /** grid fins near the top of the first stage */
  fins: { y: number; sizeM: number } | null
  reusable: boolean
  /** stages + fairing (equals `analyzeRocket().heightM` × scale) */
  heightM: number
  /** widest span on the ground, boosters included */
  widthM: number
  scale: number
}

/**
 * Nozzles under a stage: one in the centre, or a ring (with a centre engine from 7 up, like the classic 1 + 8).
 * Never more than 9 are drawn; every bell stays inside the stage's radius and clear of its neighbours.
 */
export function engineSpots(count: number, radius: number, vacuum: boolean): EngineSpot[] {
  const n = clamp(Math.round(count), 1, 9)
  if (n === 1) return [{ x: 0, z: 0, exitR: radius * (vacuum ? 0.62 : 0.45) }]
  const centre = n >= 7 ? 1 : 0
  const ring = n - centre
  const ringR = radius * 0.62
  const exitR = Math.min(radius * 0.34, ringR * Math.sin(Math.PI / ring) * 0.94)
  const spots: EngineSpot[] = centre ? [{ x: 0, z: 0, exitR }] : []
  for (let i = 0; i < ring; i++) {
    const a = (i / ring) * Math.PI * 2
    spots.push({ x: Math.cos(a) * ringR, z: Math.sin(a) * ringR, exitR })
  }
  return spots
}

/** The blueprint of a design. `scale` multiplies every length (the launch scene fits any rocket to its pad). */
export function rocketLayout(design: RocketDesign, scale = 1): RocketLayout {
  const k = scale
  const stages: StageLayout[] = []
  let y = 0
  for (const s of design.stages) {
    const tank = getRocketTank(s.tankId)
    const engine = getRocketEngine(s.engineId)
    const tanks = Math.max(1, Math.round(s.tanks))
    const tankLengthM = (tank?.lengthM ?? 0) * k
    const diameterM = (tank?.diameterM ?? 1) * k
    const engineLengthM = ENGINE_LENGTH_M * k
    const lengthM = tankLengthM * tanks + engineLengthM
    const vacuum = !!engine && engine.thrustSlKN <= 0
    stages.push({ y0: y, lengthM, tankY0: y + engineLengthM, tankLengthM, tanks, diameterM, engineLengthM, fuel: tank?.fuel ?? null, vacuum, engines: engineSpots(s.engines, diameterM / 2, vacuum) })
    y += lengthM
  }
  const top = stages[stages.length - 1]
  const first = stages[0]
  const f = getFairing(design.fairingId)
  const fairing = f ? { y0: y, lengthM: f.diameterM * FAIRING_FINENESS * k, diameterM: f.diameterM * k, baseDiameterM: top ? top.diameterM : f.diameterM * k } : null
  const heightM = y + (fairing?.lengthM ?? 0)

  const b = design.boosters > 0 && first ? getBooster(design.boosterId) : undefined
  const bd = b ? boosterDiameterM(b.id) * k : 0
  const boosters =
    b && first
      ? {
          id: b.id,
          lengthM: b.lengthM * k,
          diameterM: bd,
          spots: Array.from({ length: design.boosters }, (_, i) => {
            const angle = (i / design.boosters) * Math.PI * 2
            const d = first.diameterM / 2 + bd / 2 + 0.1 * k
            return { angle, x: Math.cos(angle) * d, z: Math.sin(angle) * d }
          }),
        }
      : null

  // Legs: long enough to reach below the nozzles when they swing down from the bottom of the tanks.
  let legs: RocketLayout['legs'] = null
  if (design.legs && first) {
    const L = clamp(1.6 * (first.diameterM / k) + 1.5, 3.4, 9)
    const footDrop = 0.4
    legs = { lengthM: L * k, pivotY: first.tankY0, deployAngle: Math.acos(clamp(-(ENGINE_LENGTH_M + footDrop) / L, -1, 1)), footDropM: footDrop * k }
  }
  const fins = design.fins && first ? { y: first.y0 + first.lengthM - Math.min(1.6 * k, first.tankLengthM * first.tanks * 0.5), sizeM: clamp(0.35 * (first.diameterM / k), 0.5, 1.6) * k } : null

  const bodyW = Math.max(...stages.map((s) => s.diameterM), fairing?.diameterM ?? 0, 0)
  const widthM = Math.max(bodyW, boosters && first ? first.diameterM + 2 * bd + 0.2 * k : 0)
  return { stages, fairing, boosters, legs, fins, reusable: isReusableDesign(design), heightM, widthM, scale: k }
}

/**
 * The launch scene is built around a pad and a tower for rockets of 34 to 62 m, and player rockets go from a few metres
 * to hundreds: this is the scale that brings one into that range. Proportions do not change.
 */
export function launchDisplayScale(heightM: number): number {
  return heightM > 0 ? clamp(heightM, 34, 62) / heightM : 1
}
