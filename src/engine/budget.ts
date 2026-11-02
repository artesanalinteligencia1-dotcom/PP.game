// Design-time resource formulas (mass, power, data, cost). Pure functions; documented in docs/model.md.

export const G0 = 9.80665 // m/s^2, standard gravity
export const SOLAR_CONSTANT = 1361 // W/m^2 at 1 AU

export const STRUCTURE_FRACTION = 0.22
export const MASS_MARGIN = 0.2
export const TANK_FRACTION = 0.1
export const CONTINGENCY = 0.15
export const BATTERY_ROUND_TRIP = 0.9
export const LINK_EFFICIENCY = 0.7
export const BUS_BASE_POWER_W = 10
export const BATTERY_CALENDAR_LIFE_YEARS = 15
export const LONG_ECLIPSE_MAX_DOD = 0.8

/** Tsiolkovsky rocket equation: dv = Isp * g0 * ln(wet / dry). Isp in s, dv in m/s. */
export function deltaV(isp: number, wetMass: number, dryMass: number): number {
  if (dryMass <= 0 || wetMass < dryMass) throw new RangeError('require wet >= dry > 0')
  return isp * G0 * Math.log(wetMass / dryMass)
}

/**
 * Propellant needed to give a spacecraft of dry mass `dryKg` a total `dv` (m/s),
 * when tanks weigh TANK_FRACTION of the propellant they hold:
 * R = exp(dv / (Isp·g0)); m_p = dry·(R − 1) / (1 − f_tank·(R − 1)).
 * Returns Infinity if the requirement is physically impossible with this engine.
 */
export function propellantForDv(dryKg: number, dv: number, ispS: number): { propellantKg: number; tankKg: number } {
  if (dv <= 0) return { propellantKg: 0, tankKg: 0 }
  if (ispS <= 0) return { propellantKg: Infinity, tankKg: Infinity }
  const r = Math.exp(dv / (ispS * G0))
  const denom = 1 - TANK_FRACTION * (r - 1)
  if (denom <= 0) return { propellantKg: Infinity, tankKg: Infinity }
  const propellantKg = (dryKg * (r - 1)) / denom
  return { propellantKg, tankKg: TANK_FRACTION * propellantKg }
}

/** Sunlit array output: P = A · η · S · cos θ, with S = 1361 W/m² / d² (d in AU). */
export function sunlitPowerW(areaM2: number, efficiency: number, cosFactor: number, sunDistanceAu = 1): number {
  return areaM2 * efficiency * (SOLAR_CONSTANT / (sunDistanceAu * sunDistanceAu)) * cosFactor
}

/** End-of-life value after compound degradation: BOL · (1 − d)^years. */
export function degrade(bol: number, ratePerYear: number, years: number): number {
  return bol * (1 - ratePerYear) ** years
}

/**
 * Orbit-average power the arrays must deliver for a given average load, accounting for
 * battery round-trip losses during eclipse: L·((1 − e) + e / η_batt).
 */
export function requiredAveragePowerW(avgLoadW: number, eclipse: number): number {
  return avgLoadW * (1 - eclipse + eclipse / BATTERY_ROUND_TRIP)
}

/** Li-ion cycle life vs depth of discharge (game model): 20 000 · (0.3 / DoD)². */
export function batteryCycleLife(dod: number): number {
  return 20000 * (0.3 / Math.max(dod, 0.05)) ** 2
}

/** Downlink per day (GB) = minutes·60 · rate(Mbit/s) · efficiency / 8 / 1000. */
export function downlinkGbPerDay(contactMinutes: number, rateMbps: number): number {
  return (contactMinutes * 60 * rateMbps * LINK_EFFICIENCY) / 8 / 1000
}

/** Data generated per day (GB) by an instrument of `rateMbps` operating `duty` of the time. */
export function dataGbPerDay(rateMbps: number, duty: number): number {
  return (rateMbps * duty * 86400) / 8 / 1000
}
