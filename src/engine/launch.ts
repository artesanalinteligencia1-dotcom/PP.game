// Launcher ↔ orbit ↔ mass compatibility and mission success probability.
import type { Launcher, Orbit, Trl } from './types'

/** Payload capacity (kg) of a launcher for the chosen orbit. 0 = cannot reach it. */
export function launchCapacityKg(launcher: Launcher, orbit: Orbit): number {
  return launcher.capacityKg[orbit.launchTarget] * orbit.capacityFactor
}

/** Reliability of a component as a function of its technology readiness level. */
export const TRL_RELIABILITY: Record<Trl, number> = { 9: 0.995, 8: 0.985, 7: 0.965, 6: 0.94 }
/** Development cost multiplier by TRL (less mature = more expensive to finish). */
export const TRL_COST_FACTOR: Record<Trl, number> = { 9: 1, 8: 1.1, 7: 1.25, 6: 1.5 }
/** Extra development months by TRL. */
export const TRL_MONTHS: Record<Trl, number> = { 9: 0, 8: 2, 7: 5, 6: 9 }

/** Baseline reliability of a well-built spacecraft bus. */
export const BUS_RELIABILITY = 0.98

export function successProbability(launcherReliability: number, trls: Trl[], riskFactors: number[]): number {
  const payload = trls.reduce((p, t) => p * TRL_RELIABILITY[t], 1)
  const extra = riskFactors.reduce((p, f) => p * f, 1)
  return launcherReliability * BUS_RELIABILITY * payload * extra
}
