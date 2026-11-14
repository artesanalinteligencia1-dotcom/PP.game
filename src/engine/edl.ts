// Entry, descent and landing on Mars: the mass budget from the launch pad down to the ground, and whether the thin
// Martian air can stop the lander at all. Pure functions, no randomness. Game values; docs/model.md §23.
import { MARS } from './mars'

export const MARS_G = 3.71
const G0 = 9.80665
/** Air density at the Martian reference level (kg/m³) and its scale height (km): ρ = ρ0 · exp(−h / H). */
export const MARS_AIR_RHO0 = 0.02
export const MARS_AIR_SCALE_KM = 11.1
/** Drag coefficients of a blunt 70° entry capsule and (effective) of a supersonic parachute. */
export const SHELL_CD = 1.6
export const CHUTE_CD = 0.4
/** Highest ballistic coefficient (kg/m²) that still slows down in time for the parachute, at −2 km. */
export const BETA_MAX_REF = 150
export const BETA_REF_ELEVATION_KM = -2
/** Cruise stage (solar panels, thrusters, antenna for the trip), as a share of the entry mass. */
export const CRUISE_STAGE_FRACTION = 0.15
/** Speed at which the parachute opens (about Mach 2 on Mars), m/s. */
export const CHUTE_DEPLOY_MS = 450
/** Default landing site elevation (km above the Martian reference level). */
export const DEFAULT_SITE_KM = -2

export interface Aeroshell {
  id: string
  name: string
  diameterM: number
  costM: number
  realWorld: string
}
export interface Parachute {
  id: string
  name: string
  diameterM: number
  massKg: number
  costM: number
}
export interface DescentSystem {
  id: string
  name: string
  /** Heaviest mass it can set down (kg). */
  maxLandedKg: number
  /** Landing hardware as a share of the landed mass. */
  hardwareFraction: number
  /** Braking Δv = speedFactor · terminal speed + extraDv (hover, divert, fly-away). */
  speedFactor: number
  extraDv: number
  ispS: number
  /** Fastest parachute descent it can take over from (m/s). */
  maxTerminalMs: number
  reliability: number
  costM: number
  devMonths: number
  /** Landing ellipse (km) with guided entry; without it every system lands within ~100 km. */
  guidedEllipseKm: number
  description: string
  realWorld: string
}

export const AEROSHELLS: Aeroshell[] = [
  { id: 'shell_s', name: 'Aeroshell 2.65 m', diameterM: 2.65, costM: 8, realWorld: 'The size that carried Mars Pathfinder (1997) and the rovers Spirit and Opportunity (2004).' },
  { id: 'shell_m', name: 'Aeroshell 3.5 m', diameterM: 3.5, costM: 14, realWorld: 'The Viking landers (1976) entered behind 3.5 m shells.' },
  { id: 'shell_l', name: 'Aeroshell 4.5 m', diameterM: 4.5, costM: 25, realWorld: 'The largest flown to Mars: Curiosity (2012) and Perseverance (2021).' },
]
export const PARACHUTES: Parachute[] = [
  { id: 'chute_s', name: 'Parachute 11 m', diameterM: 11, massKg: 25, costM: 3 },
  { id: 'chute_m', name: 'Parachute 16 m', diameterM: 16, massKg: 55, costM: 6 },
  { id: 'chute_l', name: 'Parachute 21.5 m', diameterM: 21.5, massKg: 100, costM: 10 },
]
export const DESCENT_SYSTEMS: DescentSystem[] = [
  {
    id: 'airbags', name: 'Airbags', maxLandedKg: 550, hardwareFraction: 0.3, speedFactor: 1, extraDv: 0, ispS: 260, maxTerminalMs: 70,
    reliability: 0.95, costM: 12, devMonths: 0, guidedEllipseKm: 25,
    description: 'Solid rockets stop the fall a few metres up, then the lander drops inside airbags and bounces to a halt. Simple and cheap, only for light landers, and it rolls where it wants.',
    realWorld: 'Mars Pathfinder (1997) and the rovers Spirit and Opportunity (2004) bounced to a stop inside airbags.',
  },
  {
    id: 'legs', name: 'Legs and retro-rockets', maxLandedKg: 900, hardwareFraction: 0.18, speedFactor: 1.25, extraDv: 80, ispS: 225, maxTerminalMs: 90,
    reliability: 0.93, costM: 30, devMonths: 1, guidedEllipseKm: 20,
    description: 'Throttled engines brake all the way down and the lander touches on three legs. Heavier loads than airbags; the engines must work on the first try.',
    realWorld: 'Viking (1976), Phoenix (2008) and InSight (2018) landed on legs with retro-rockets.',
  },
  {
    id: 'skycrane', name: 'Sky crane', maxLandedKg: 1300, hardwareFraction: 0.75, speedFactor: 1.25, extraDv: 150, ispS: 225, maxTerminalMs: 90,
    reliability: 0.96, costM: 70, devMonths: 3, guidedEllipseKm: 8,
    description: 'A rocket stage hovers and lowers the load on cables, then flies away. The heaviest and most precise landings, at the price of a descent stage almost as heavy as the load.',
    realWorld: 'Curiosity (2012) and Perseverance (2021), about one tonne each, were lowered by a sky crane; Perseverance landed within a few kilometres of its target.',
  },
]

/** Guided entry: the capsule steers its lift on the way down. */
export const GUIDANCE = { massKg: 40, costM: 10, devMonths: 2 }
export const UNGUIDED_ELLIPSE_KM = 100

export interface LandingDesign {
  shellId: string
  chuteId: string
  descentId: string
  guided: boolean
}
export const DEFAULT_LANDING: LandingDesign = { shellId: 'shell_s', chuteId: 'chute_m', descentId: 'legs', guided: false }

export const getAeroshell = (id: string) => AEROSHELLS.find((x) => x.id === id) ?? AEROSHELLS[0]
export const getParachute = (id: string) => PARACHUTES.find((x) => x.id === id) ?? PARACHUTES[1]
export const getDescent = (id: string) => DESCENT_SYSTEMS.find((x) => x.id === id) ?? DESCENT_SYSTEMS[1]

export function isLandingDesign(x: unknown): x is LandingDesign {
  const l = x as LandingDesign | undefined
  return !!l && typeof l.shellId === 'string' && typeof l.chuteId === 'string' && typeof l.descentId === 'string'
}

/** Air density (kg/m³) at a site `elevationKm` above the reference level. Low plains have more air to brake in. */
export function marsAirDensity(elevationKm: number): number {
  return MARS_AIR_RHO0 * Math.exp(-elevationKm / MARS_AIR_SCALE_KM)
}

/** Highest ballistic coefficient that works at this elevation: it shrinks with the air density. */
export function betaMax(elevationKm: number): number {
  return BETA_MAX_REF * (marsAirDensity(elevationKm) / marsAirDensity(BETA_REF_ELEVATION_KM))
}

/** Steady fall speed under a parachute: weight = drag → v = √(2·m·g / (ρ·Cd·A)). */
export function terminalVelocityMs(massKg: number, chuteDiameterM: number, elevationKm: number): number {
  const area = Math.PI * (chuteDiameterM / 2) ** 2
  return Math.sqrt((2 * massKg * MARS_G) / (marsAirDensity(elevationKm) * CHUTE_CD * area))
}

export type EdlIssueCode = 'EDL_SHELL_TOO_SMALL' | 'EDL_SHELL_MARGIN' | 'EDL_CHUTE_TOO_SMALL' | 'EDL_DESCENT_LIMIT'
export const EDL_ISSUE_CODES: EdlIssueCode[] = ['EDL_SHELL_TOO_SMALL', 'EDL_SHELL_MARGIN', 'EDL_CHUTE_TOO_SMALL', 'EDL_DESCENT_LIMIT']

export interface EdlReport {
  landedKg: number
  /** Legs, airbags or descent stage (dry). */
  descentHardwareKg: number
  descentPropellantKg: number
  chuteKg: number
  guidanceKg: number
  shellKg: number
  entryKg: number
  cruiseStageKg: number
  launchKg: number
  entrySpeedKms: number
  /** Ballistic coefficient m / (Cd·A) of the capsule and the highest one this site allows (kg/m²). */
  beta: number
  betaMax: number
  terminalMs: number
  touchdownDv: number
  ellipseKm: number
  reliability: number
  costM: number
  devMonths: number
  /** Share of the launch mass that reaches the ground. */
  landedFraction: number
  issues: { code: EdlIssueCode; severity: 'warn' | 'error'; params: Record<string, number | string> }[]
}

/**
 * The landing budget, from the ground up: the mass to set down decides the descent system and its propellant, that
 * decides the parachute load, everything rides inside the aeroshell, and the cruise stage carries the capsule to Mars.
 */
export function analyzeEdl(landing: LandingDesign, landedKg: number, opts: { elevationKm?: number; entrySpeedKms?: number } = {}): EdlReport {
  const elevationKm = opts.elevationKm ?? DEFAULT_SITE_KM
  const entrySpeedKms = opts.entrySpeedKms ?? 5.7
  const shell = getAeroshell(landing.shellId)
  const chute = getParachute(landing.chuteId)
  const descent = getDescent(landing.descentId)
  const issues: EdlReport['issues'] = []

  const descentHardwareKg = descent.hardwareFraction * landedKg
  const touchdownDry = landedKg + descentHardwareKg
  // Terminal speed depends on the mass under the parachute, which includes the braking propellant: two passes converge.
  let prop = 0
  let terminalMs = 0
  let touchdownDv = 0
  for (let i = 0; i < 6; i++) {
    terminalMs = terminalVelocityMs(touchdownDry + prop, chute.diameterM, elevationKm)
    touchdownDv = descent.speedFactor * terminalMs + descent.extraDv
    prop = touchdownDry * (Math.exp(touchdownDv / (descent.ispS * G0)) - 1)
  }
  const guidanceKg = landing.guided ? GUIDANCE.massKg : 0
  const underShell = touchdownDry + prop + chute.massKg + guidanceKg
  // Aeroshell: 28 kg per m² of heat shield and back shell, plus a share of the entry mass that grows with entry speed.
  const area = Math.PI * (shell.diameterM / 2) ** 2
  const shellShare = 0.08 * (entrySpeedKms / 5.7) ** 2
  const entryKg = (underShell + 28 * area) / (1 - shellShare)
  const shellKg = entryKg - underShell
  const cruiseStageKg = CRUISE_STAGE_FRACTION * entryKg
  const launchKg = entryKg + cruiseStageKg

  const beta = entryKg / (SHELL_CD * area)
  const max = betaMax(elevationKm)
  if (beta > max) issues.push({ code: 'EDL_SHELL_TOO_SMALL', severity: 'error', params: { beta, max, diameter: shell.diameterM, entry: entryKg } })
  else if (beta > 0.9 * max) issues.push({ code: 'EDL_SHELL_MARGIN', severity: 'warn', params: { beta, max } })
  if (terminalMs > descent.maxTerminalMs) issues.push({ code: 'EDL_CHUTE_TOO_SMALL', severity: 'error', params: { speed: terminalMs, max: descent.maxTerminalMs, diameter: chute.diameterM, system: descent.id } })
  if (landedKg > descent.maxLandedKg) issues.push({ code: 'EDL_DESCENT_LIMIT', severity: 'error', params: { landed: landedKg, max: descent.maxLandedKg, system: descent.id } })

  const reliability = descent.reliability * 0.99 * 0.98 * (beta > 0.9 * max ? 0.97 : 1)
  return {
    landedKg,
    descentHardwareKg,
    descentPropellantKg: prop,
    chuteKg: chute.massKg,
    guidanceKg,
    shellKg,
    entryKg,
    cruiseStageKg,
    launchKg,
    entrySpeedKms,
    beta,
    betaMax: max,
    terminalMs,
    touchdownDv,
    ellipseKm: landing.guided ? descent.guidedEllipseKm : UNGUIDED_ELLIPSE_KM,
    reliability,
    costM: shell.costM + chute.costM + descent.costM + (landing.guided ? GUIDANCE.costM : 0),
    devMonths: descent.devMonths + (landing.guided ? GUIDANCE.devMonths : 0),
    landedFraction: landedKg / launchKg,
    issues,
  }
}

/** Minutes from the top of the atmosphere to the ground: the lander is on its own for all of it. */
export const EDL_MINUTES = 7
/** Escape speed at the Martian surface (km/s): the least an arriving spacecraft can enter with. */
export const marsEscapeKms = () => Math.sqrt((2 * MARS.muKm3s2) / MARS.radiusKm)
