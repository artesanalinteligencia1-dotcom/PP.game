// Making oxygen from the Martian air (in-situ resource utilisation). Pure functions; game values, docs/model.md §24.
// Chemistry: solid-oxide electrolysis splits carbon dioxide, 2 CO2 → 2 CO + O2, at about 800 °C.
import { BATTERY_ROUND_TRIP } from './budget'
import { marsAirDensity } from './edl'
import { MARS } from './mars'
import type { Trl } from './types'

/** One plant module: compressor, electrolysis stack and heaters. About five times the MOXIE experiment per kilogram. */
export const OXYGEN_UNIT = {
  massKg: 50,
  /** Electrical power while running (W): most of it keeps the stack hot. */
  powerW: 500,
  /** Oxygen made per hour of operation (kg). */
  kgPerHour: 0.04,
  costM: 8,
  trl: 6 as Trl,
} as const
export const MAX_OXYGEN_UNITS = 8
export const SOL_HOURS = MARS.solHours
export const SOLS_PER_YEAR = (365.25 * 24) / SOL_HOURS
/** Kilograms of CO2 that hold one kilogram of O2 (2 CO2 → 2 CO + O2: 88.02 / 32.00), and the share actually split. */
export const CO2_PER_O2 = 88.02 / 32.0
export const CO2_UTILISATION = 0.5
/** Mass share of CO2 in the Martian air. */
export const MARS_AIR_CO2 = 0.95
/** What the MOXIE experiment on the Perseverance rover did (2021–2023), for comparison. */
export const MOXIE = { massKg: 17.1, powerW: 300, kgPerHour: 0.008, totalKg: 0.122 }

export interface OxygenPlan {
  units: number
  /** Hours of operation per sol (0 to 24.66). */
  hoursPerSol: number
}
export const DEFAULT_OXYGEN_PLAN: OxygenPlan = { units: 2, hoursPerSol: 10 }

export function isOxygenPlan(x: unknown): x is OxygenPlan {
  const p = x as OxygenPlan | undefined
  return !!p && typeof p.units === 'number' && typeof p.hoursPerSol === 'number'
}

export interface OxygenReport {
  units: number
  hoursPerSol: number
  massKg: number
  costM: number
  /** Power while the plant runs, and averaged over the whole sol (W). */
  runningW: number
  avgW: number
  /** Share of the sol the plant runs in daylight and after dark. It runs by day first. */
  dayShare: number
  nightShare: number
  nightHours: number
  /** Energy the battery must give the plant every night (Wh). */
  nightEnergyWh: number
  /** Average power the solar arrays must supply for the plant, with the battery's losses for the night part (W). */
  arrayNeedW: number
  kgPerSol: number
  kgPerYear: number
  kWhPerKg: number
  /** Carbon dioxide and Martian air drawn in per sol. */
  co2KgPerSol: number
  airM3PerSol: number
  /** Sols until the plant has made its own mass in oxygen. */
  paybackSols: number
}

/**
 * The plant's budget. `dayFraction` is the lit share of the sol (0.5 on the surface): the plant runs in daylight first,
 * and every hour after dark comes out of the battery.
 */
export function analyzeOxygen(plan: OxygenPlan, opts: { dayFraction?: number; elevationKm?: number } = {}): OxygenReport {
  const dayFraction = opts.dayFraction ?? 0.5
  const units = Math.max(0, Math.min(MAX_OXYGEN_UNITS, Math.round(Number.isFinite(plan.units) ? plan.units : 0)))
  const hoursPerSol = Math.max(0, Math.min(SOL_HOURS, Number.isFinite(plan.hoursPerSol) ? plan.hoursPerSol : 0))
  const duty = hoursPerSol / SOL_HOURS
  const dayShare = Math.min(duty, dayFraction)
  const nightShare = Math.max(0, duty - dayFraction)
  const runningW = units * OXYGEN_UNIT.powerW
  const kgPerSol = units * OXYGEN_UNIT.kgPerHour * hoursPerSol
  const co2KgPerSol = (kgPerSol * CO2_PER_O2) / CO2_UTILISATION
  const nightHours = nightShare * SOL_HOURS
  return {
    units,
    hoursPerSol,
    massKg: units * OXYGEN_UNIT.massKg,
    costM: units * OXYGEN_UNIT.costM,
    runningW,
    avgW: runningW * duty,
    dayShare,
    nightShare,
    nightHours,
    nightEnergyWh: runningW * nightHours,
    arrayNeedW: runningW * (dayShare + nightShare / BATTERY_ROUND_TRIP),
    kgPerSol,
    kgPerYear: kgPerSol * SOLS_PER_YEAR,
    kWhPerKg: OXYGEN_UNIT.powerW / 1000 / OXYGEN_UNIT.kgPerHour,
    co2KgPerSol,
    airM3PerSol: co2KgPerSol / (marsAirDensity(opts.elevationKm ?? 0) * MARS_AIR_CO2),
    paybackSols: kgPerSol > 0 ? (units * OXYGEN_UNIT.massKg) / kgPerSol : Infinity,
  }
}
