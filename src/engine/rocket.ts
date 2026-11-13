// Rocket Engineer pad: build a launcher from parts and get its performance from the rocket equation.
// Pure and deterministic (no React, no store). Values are simplified game values; the physics is the real one
// (Tsiolkovsky's rocket equation, thrust-to-weight). Sources and assumptions: docs/model.md §20.
import { BOOSTERS, FAIRINGS, ROCKET_ENGINES, ROCKET_TANKS } from './catalog/rocketParts'
import type { LaunchTarget, Launcher } from './types'

export const G0 = 9.80665

export type PropellantFuel = 'kerosene' | 'methane' | 'hydrogen'

export interface RocketEngine {
  id: string
  name: string
  fuel: PropellantFuel
  /** Thrust at sea level and in vacuum (kN). Vacuum-only engines have 0 at sea level. */
  thrustSlKN: number
  thrustVacKN: number
  ispSl: number
  ispVac: number
  massKg: number
  costM: number
  reliability: number
  /** Can relight for a landing burn (reusable first stages). */
  restartable: boolean
  description: string
}

export interface RocketTank {
  id: string
  name: string
  fuel: PropellantFuel
  propellantKg: number
  dryKg: number
  diameterM: number
  lengthM: number
  costM: number
}

export interface SolidBooster {
  id: string
  name: string
  propellantKg: number
  dryKg: number
  thrustSlKN: number
  thrustVacKN: number
  ispSl: number
  ispVac: number
  lengthM: number
  costM: number
  reliability: number
  description: string
}

export interface Fairing {
  id: string
  name: string
  massKg: number
  diameterM: number
  /** Packaging limit: the biggest spacecraft that fits inside (kg, a proxy for volume). */
  maxPayloadKg: number
  costM: number
}

export interface RocketStage {
  engineId: string
  engines: number
  tankId: string
  tanks: number
}

export interface RocketDesign {
  /** stages[0] fires at liftoff. */
  stages: RocketStage[]
  boosterId?: string
  boosters: number
  fairingId: string
  /** Landing legs and grid fins on the first stage: together they make it reusable. */
  legs: boolean
  fins: boolean
}

export const ROCKET_ISSUE_CODES = [
  'ROCKET_INCOMPLETE',
  'ROCKET_FUEL_MISMATCH',
  'ROCKET_VACUUM_ENGINE_FIRST',
  'ROCKET_SEA_LEVEL_UPPER',
  'ROCKET_LEGS_NO_FINS',
  'ROCKET_ENGINE_NO_RESTART',
  'ROCKET_TWR_LOW',
  'ROCKET_TWR_MARGINAL',
  'ROCKET_TWR_HIGH',
  'ROCKET_UPPER_TWR_LOW',
  'ROCKET_NO_ORBIT',
  'ROCKET_FAIRING_SMALL',
] as const
export type RocketIssueCode = (typeof ROCKET_ISSUE_CODES)[number]

export interface RocketIssue {
  code: RocketIssueCode
  severity: 'error' | 'warn'
  params: Record<string, string | number>
}

export interface StageReport {
  wetKg: number
  dryKg: number
  propellantKg: number
  dvMs: number
  burnS: number
  /** Thrust-to-weight when the stage ignites (sea level for the first stage, with boosters). */
  twr: number
  lengthM: number
  diameterM: number
}

export interface RocketReport {
  payloadKg: number
  stages: StageReport[]
  liftoffMassKg: number
  liftoffTwr: number
  totalDvMs: number
  /** Payload it can place on each target, limited by Δv, liftoff thrust and the fairing. */
  capacityKg: Record<LaunchTarget, number>
  reusable: boolean
  landingP: number
  costM: number
  reliability: number
  heightM: number
  issues: RocketIssue[]
}

/** Δv to reach each target from the ground, including ~1.5 km/s of gravity and drag losses (rounded, educational). */
export const TARGET_DV: Record<LaunchTarget, number> = { leo: 9400, sso: 9900, gto: 11800, tli: 12600 }

/** Share of the first stage's propellant kept for the landing burn when it is reusable. */
export const LANDING_RESERVE = 0.1
export const MIN_LIFTOFF_TWR = 1.05
const SEPARATION_RELIABILITY = 0.995
/** A reused first stage costs this share of a new one per flight (refurbishment and recovery). */
const REUSE_COST_SHARE = 0.5
/** A rocket of your own has no flight history yet: new designs fail more often than proven ones. */
export const NEW_DESIGN_RELIABILITY = 0.97
/** Length of every stage's engine section (thrust structure and nozzles), in metres. */
export const ENGINE_LENGTH_M = 2.5
/** Fairing length = this × its diameter. */
export const FAIRING_FINENESS = 2.5

const find = <T extends { id: string }>(list: T[], id: string | undefined): T | undefined => list.find((x) => x.id === id)
export const getRocketEngine = (id: string) => find(ROCKET_ENGINES, id)
export const getRocketTank = (id: string) => find(ROCKET_TANKS, id)
export const getBooster = (id: string | undefined) => find(BOOSTERS, id)
export const getFairing = (id: string) => find(FAIRINGS, id)

/** Ideal rocket equation: Δv = Isp · g0 · ln(m0 / mf). */
export function rocketEquationDv(ispS: number, m0: number, mf: number): number {
  return mf > 0 && m0 > mf ? ispS * G0 * Math.log(m0 / mf) : 0
}

const avg = (a: number, b: number) => (a + b) / 2

interface StageParts {
  engine: RocketEngine
  tank: RocketTank
  stage: RocketStage
  propellantKg: number
  dryKg: number
}

/** Legs and fins scale with the first stage's dry mass. */
const legsKg = (dry: number) => Math.max(100, 0.08 * dry)
const finsKg = (dry: number) => Math.max(30, 0.02 * dry)

function parts(design: RocketDesign): StageParts[] | null {
  const out: StageParts[] = []
  for (const stage of design.stages) {
    const engine = getRocketEngine(stage.engineId)
    const tank = getRocketTank(stage.tankId)
    if (!engine || !tank || stage.engines < 1 || stage.tanks < 1) return null
    out.push({ engine, tank, stage, propellantKg: tank.propellantKg * stage.tanks, dryKg: tank.dryKg * stage.tanks + engine.massKg * stage.engines })
  }
  return out
}

function isReusable(design: RocketDesign, s: StageParts[]): boolean {
  return design.legs && design.fins && s.length > 0 && s[0].engine.restartable
}

/** Legs, grid fins and a restartable first-stage engine: the first stage can land and fly again. */
export function isReusableDesign(design: RocketDesign): boolean {
  const s = parts(design)
  return !!s && isReusable(design, s)
}

/** Δv profile for one payload. Boosters burn alongside the first stage and drop when empty. */
function profile(design: RocketDesign, s: StageParts[], payloadKg: number) {
  const fairing = getFairing(design.fairingId)
  const booster = design.boosters > 0 ? getBooster(design.boosterId) : undefined
  const reusable = isReusable(design, s)
  const extra1 = (design.legs ? legsKg(s[0].dryKg) : 0) + (design.fins ? finsKg(s[0].dryKg) : 0)
  const upperWet = s.slice(1).reduce((t, x) => t + x.dryKg + x.propellantKg, 0)
  const bProp = booster ? booster.propellantKg * design.boosters : 0
  const bDry = booster ? booster.dryKg * design.boosters : 0
  const fairingKg = fairing?.massKg ?? 0
  const stages: StageReport[] = []

  // First stage (and boosters).
  const first = s[0]
  const usable1 = first.propellantKg * (reusable ? 1 - LANDING_RESERVE : 1)
  const m0 = first.dryKg + extra1 + first.propellantKg + upperWet + bProp + bDry + fairingKg + payloadKg
  const t1Sl = first.engine.thrustSlKN * first.stage.engines
  const t1 = avg(first.engine.thrustSlKN, first.engine.thrustVacKN) * first.stage.engines * 1000
  const isp1 = avg(first.engine.ispSl, first.engine.ispVac)
  const mdot1 = t1 / (isp1 * G0)
  let dv1 = 0
  let m = m0
  let coreLeft = usable1
  if (booster && bProp > 0) {
    const tb = avg(booster.thrustSlKN, booster.thrustVacKN) * design.boosters * 1000
    const ispB = avg(booster.ispSl, booster.ispVac)
    const mdotB = tb / (ispB * G0)
    const burn = bProp / mdotB
    const coreUsed = Math.min(coreLeft, mdot1 * burn)
    const ispEff = (tb + t1) / ((mdotB + mdot1) * G0)
    dv1 += rocketEquationDv(ispEff, m, m - bProp - coreUsed)
    m -= bProp + coreUsed + bDry
    coreLeft -= coreUsed
  }
  dv1 += rocketEquationDv(isp1, m, m - coreLeft)
  const liftoffThrust = t1Sl + (booster ? booster.thrustSlKN * design.boosters : 0)
  const liftoffTwr = (liftoffThrust * 1000) / (m0 * G0)
  stages.push({
    wetKg: first.dryKg + extra1 + first.propellantKg,
    dryKg: first.dryKg + extra1,
    propellantKg: first.propellantKg,
    dvMs: dv1,
    burnS: mdot1 > 0 ? usable1 / mdot1 : 0,
    twr: liftoffTwr,
    lengthM: first.tank.lengthM * first.stage.tanks + ENGINE_LENGTH_M,
    diameterM: first.tank.diameterM,
  })

  // Upper stages: the fairing is dropped with the first stage (above the dense atmosphere).
  let above = upperWet + payloadKg
  for (let i = 1; i < s.length; i++) {
    const x = s[i]
    above -= x.dryKg + x.propellantKg
    const ms = x.dryKg + x.propellantKg + above
    const thrust = x.engine.thrustVacKN * x.stage.engines * 1000
    const mdot = thrust / (x.engine.ispVac * G0)
    stages.push({
      wetKg: x.dryKg + x.propellantKg,
      dryKg: x.dryKg,
      propellantKg: x.propellantKg,
      dvMs: rocketEquationDv(x.engine.ispVac, ms, ms - x.propellantKg),
      burnS: mdot > 0 ? x.propellantKg / mdot : 0,
      twr: thrust / (ms * G0),
      lengthM: x.tank.lengthM * x.stage.tanks + ENGINE_LENGTH_M,
      diameterM: x.tank.diameterM,
    })
  }
  return { stages, m0, liftoffTwr, liftoffThrustKN: liftoffThrust, totalDv: stages.reduce((t, x) => t + x.dvMs, 0) }
}

/** Largest payload that still reaches `dv`, by bisection (Δv falls as payload grows). */
function maxPayload(design: RocketDesign, s: StageParts[], dv: number): number {
  if (profile(design, s, 0).totalDv < dv) return 0
  let lo = 0
  let hi = profile(design, s, 0).m0
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2
    if (profile(design, s, mid).totalDv >= dv) lo = mid
    else hi = mid
  }
  return Math.floor(lo / 10) * 10
}

const EMPTY_CAPACITY: Record<LaunchTarget, number> = { leo: 0, sso: 0, gto: 0, tli: 0 }

export function analyzeRocket(design: RocketDesign, payloadKg = 0): RocketReport {
  const issues: RocketIssue[] = []
  const add = (code: RocketIssueCode, severity: RocketIssue['severity'], params: RocketIssue['params'] = {}) => issues.push({ code, severity, params })
  const s = parts(design)
  const fairing = getFairing(design.fairingId)
  if (!s || s.length === 0) {
    add('ROCKET_INCOMPLETE', 'error')
    return { payloadKg, stages: [], liftoffMassKg: 0, liftoffTwr: 0, totalDvMs: 0, capacityKg: { ...EMPTY_CAPACITY }, reusable: false, landingP: 0, costM: 0, reliability: 0, heightM: 0, issues }
  }
  s.forEach((x, i) => {
    if (x.engine.fuel !== x.tank.fuel) add('ROCKET_FUEL_MISMATCH', 'error', { stage: i + 1, engine: x.engine.name, tank: x.tank.name })
  })
  if (s[0].engine.thrustSlKN <= 0) add('ROCKET_VACUUM_ENGINE_FIRST', 'error', { engine: s[0].engine.name })
  if (s.length > 1 && s.slice(1).some((x) => x.engine.thrustSlKN > 0 && x.engine.ispVac < 330))
    add('ROCKET_SEA_LEVEL_UPPER', 'warn', {})
  if (design.boosters > 0 && !getBooster(design.boosterId)) add('ROCKET_INCOMPLETE', 'error')
  if (!fairing) add('ROCKET_INCOMPLETE', 'error')

  const p = profile(design, s, payloadKg)
  const reusable = isReusable(design, s)
  if (design.legs && !design.fins) add('ROCKET_LEGS_NO_FINS', 'warn')
  if (design.legs && design.fins && !s[0].engine.restartable) add('ROCKET_ENGINE_NO_RESTART', 'warn', { engine: s[0].engine.name })

  if (p.liftoffTwr < 1) add('ROCKET_TWR_LOW', 'error', { twr: Math.round(p.liftoffTwr * 100) / 100 })
  else if (p.liftoffTwr < 1.2) add('ROCKET_TWR_MARGINAL', 'warn', { twr: Math.round(p.liftoffTwr * 100) / 100 })
  else if (p.liftoffTwr > 3) add('ROCKET_TWR_HIGH', 'warn', { twr: Math.round(p.liftoffTwr * 100) / 100 })
  p.stages.slice(1).forEach((st, i) => {
    if (st.twr < 0.4) add('ROCKET_UPPER_TWR_LOW', 'warn', { stage: i + 2, twr: Math.round(st.twr * 100) / 100 })
  })

  // Capacity per target: Δv, then what the engines can lift off the pad, then what fits in the fairing.
  const liftLimit = Math.max(0, (p.liftoffThrustKN * 1000) / (MIN_LIFTOFF_TWR * G0) - profile(design, s, 0).m0)
  const capacityKg = { ...EMPTY_CAPACITY }
  const blocked = issues.some((x) => x.severity === 'error')
  if (!blocked) {
    for (const target of Object.keys(TARGET_DV) as LaunchTarget[]) {
      capacityKg[target] = Math.floor(Math.min(maxPayload(design, s, TARGET_DV[target]), liftLimit, fairing?.maxPayloadKg ?? 0) / 10) * 10
    }
    if (capacityKg.leo <= 0) add('ROCKET_NO_ORBIT', 'warn', { dv: Math.round(profile(design, s, 0).totalDv), need: TARGET_DV.leo })
  }
  if (fairing && payloadKg > fairing.maxPayloadKg) add('ROCKET_FAIRING_SMALL', 'error', { payload: payloadKg, max: fairing.maxPayloadKg })

  // Price per flight and reliability.
  const booster = design.boosters > 0 ? getBooster(design.boosterId) : undefined
  const stageCost = (x: StageParts) => x.engine.costM * x.stage.engines + x.tank.costM * x.stage.tanks + 0.5
  const firstCost = stageCost(s[0]) + (design.legs ? 1 : 0) + (design.fins ? 0.5 : 0)
  const hardware =
    (reusable ? firstCost * REUSE_COST_SHARE : firstCost) +
    s.slice(1).reduce((t, x) => t + stageCost(x), 0) +
    (booster ? booster.costM * design.boosters : 0) +
    (fairing?.costM ?? 0)
  const costM = Math.round(hardware * 1.15 * 10) / 10
  const separations = s.length - 1 + (booster ? 1 : 0) + 1 // + fairing
  const reliability =
    s.reduce((r, x) => r * x.engine.reliability ** x.stage.engines, 1) *
    (booster ? booster.reliability ** design.boosters : 1) *
    SEPARATION_RELIABILITY ** separations *
    NEW_DESIGN_RELIABILITY
  const fairingLength = fairing ? fairing.diameterM * FAIRING_FINENESS : 0
  return {
    payloadKg,
    stages: p.stages,
    liftoffMassKg: Math.round(p.m0),
    liftoffTwr: p.liftoffTwr,
    totalDvMs: p.totalDv,
    capacityKg,
    reusable,
    landingP: reusable ? 0.85 : 0,
    costM,
    reliability: Math.round(reliability * 1000) / 1000,
    heightM: p.stages.reduce((t, x) => t + x.lengthM, 0) + fairingLength,
    issues,
  }
}

/** The player's rocket as a launcher the rest of the game understands. */
export const CUSTOM_LAUNCHER_ID = 'custom'
export const CUSTOM_LAUNCHER_NAME = 'Your rocket'

export function rocketToLauncher(design: RocketDesign, name = CUSTOM_LAUNCHER_NAME): Launcher {
  const r = analyzeRocket(design)
  return {
    id: CUSTOM_LAUNCHER_ID,
    name,
    kind: r.reusable ? 'reusable' : 'expendable',
    capacityKg: r.capacityKg,
    costM: r.costM,
    reliability: r.reliability,
    ...(r.reusable ? { landing: { successP: r.landingP } } : {}),
    realWorld: 'Built on your workbench from engines, tanks and boosters. Price and reliability come from its parts; a new design has no flight history yet.',
  }
}

// ---------------------------------------------------------------------------
// Editing helpers for the workbench. They keep every stage's tank on its engine's fuel and the counts in range.
// ---------------------------------------------------------------------------

export const LIMITS = { stages: 3, engines: 9, tanks: 6, boosters: 6 } as const

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)))
const tankSize = (tankId: string) => tankId.split('_').pop() ?? 'm'

function tankForFuel(fuel: PropellantFuel, tankId: string): string {
  const same = `${fuel}_${tankSize(tankId)}`
  return getRocketTank(same) ? same : `${fuel}_m`
}

export function updateStage(d: RocketDesign, i: number, patch: Partial<RocketStage>): RocketDesign {
  const stages = d.stages.map((s, k) => {
    if (k !== i) return s
    const next = { ...s, ...patch }
    const engine = getRocketEngine(next.engineId)
    if (engine && patch.engineId) next.tankId = tankForFuel(engine.fuel, next.tankId)
    next.engines = clamp(next.engines, 1, LIMITS.engines)
    next.tanks = clamp(next.tanks, 1, LIMITS.tanks)
    return next
  })
  return { ...d, stages }
}

export function addStage(d: RocketDesign): RocketDesign {
  if (d.stages.length >= LIMITS.stages) return d
  return { ...d, stages: [...d.stages, { engineId: 'k_small_vac', engines: 1, tankId: 'kerosene_s', tanks: 1 }] }
}

export function removeStage(d: RocketDesign, i: number): RocketDesign {
  if (d.stages.length <= 1) return d
  return { ...d, stages: d.stages.filter((_, k) => k !== i) }
}

/** Boosters come in pairs (they must balance each other). */
export function setBoosters(d: RocketDesign, boosterId: string | undefined, count: number): RocketDesign {
  if (!boosterId) return { ...d, boosterId: undefined, boosters: 0 }
  const n = clamp(count, 2, LIMITS.boosters)
  return { ...d, boosterId, boosters: n - (n % 2) }
}

/** For data read back from storage: is this a design the engine can analyse? */
export function isRocketDesign(x: unknown): x is RocketDesign {
  const d = x as RocketDesign
  return (
    !!d &&
    Array.isArray(d.stages) &&
    d.stages.length >= 1 &&
    d.stages.length <= LIMITS.stages &&
    d.stages.every((s) => !!getRocketEngine(s.engineId) && !!getRocketTank(s.tankId) && s.engines >= 1 && s.tanks >= 1) &&
    typeof d.boosters === 'number' &&
    (d.boosters === 0 || !!getBooster(d.boosterId)) &&
    !!getFairing(d.fairingId) &&
    typeof d.legs === 'boolean' &&
    typeof d.fins === 'boolean'
  )
}
