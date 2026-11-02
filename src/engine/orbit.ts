// Orbit geometry, eclipses, ground contacts and orbit lifetime. Two-body, circular orbits.
import type { GroundStation, Orbit } from './types'

export const BODY = {
  earth: { radiusKm: 6371, muKm3s2: 398600.4418 },
  moon: { radiusKm: 1737.4, muKm3s2: 4902.8 },
} as const

export const MINUTES_PER_DAY = 1440
export const MINUTES_PER_YEAR = 365.25 * MINUTES_PER_DAY

/** Kepler's third law: T = 2π·sqrt(a³/μ). Returns minutes. Heliocentric orbits return one day (no eclipse cycling). */
export function orbitalPeriodMin(orbit: Orbit, altitudeKm: number): number {
  if (orbit.body === 'sun') return MINUTES_PER_DAY
  const b = BODY[orbit.body]
  const a = b.radiusKm + altitudeKm
  return (2 * Math.PI * Math.sqrt((a * a * a) / b.muKm3s2)) / 60
}

/**
 * Worst-case eclipse fraction of a circular orbit (Sun in the orbit plane, β = 0):
 * f = asin(R / (R + h)) / π.
 */
export function eclipseFraction(orbit: Orbit, altitudeKm: number): number {
  if (orbit.eclipseOverride !== undefined) return orbit.eclipseOverride
  if (orbit.body === 'sun') return 0
  const R = BODY[orbit.body].radiusKm
  return Math.asin(R / (R + altitudeKm)) / Math.PI
}

/** Reference contact geometry per orbit family (per station per day). */
const CONTACT: Record<string, { passes: number; minutes: number; refAltKm?: number; polar?: boolean }> = {
  leo: { passes: 5, minutes: 8, refAltKm: 500 },
  sso: { passes: 5, minutes: 10, refAltKm: 700, polar: true },
  sso_dd: { passes: 5, minutes: 10, refAltKm: 700, polar: true },
  meo: { passes: 2, minutes: 240 },
  geo: { passes: 1, minutes: MINUTES_PER_DAY },
  lunar_polar: { passes: 1, minutes: 290 },
  helio: { passes: 1, minutes: 480 },
}

/**
 * Contact minutes per day a single station gets.
 * - Polar orbits (SSO): high-latitude stations see almost every orbit: factor 1 + 1.6·(|lat|/90)².
 * - 51.6° LEO: stations above 60° latitude rarely see it (factor 0.2).
 * - Pass duration scales with sqrt(altitude / reference altitude).
 * - Lunar and deep-space orbits need a deep-space antenna (0 minutes otherwise).
 */
export function stationContactMinutes(orbit: Orbit, altitudeKm: number, station: GroundStation): number {
  const c = CONTACT[orbit.id] ?? { passes: 1, minutes: 60 }
  if (orbit.contact === 'deep' && !station.deepSpace) return 0
  let passes = c.passes
  if (c.polar) passes *= 1 + 1.6 * (Math.abs(station.latDeg) / 90) ** 2
  else if (orbit.id === 'leo' && Math.abs(station.latDeg) > 60) passes *= 0.2
  const minutes = c.refAltKm ? c.minutes * Math.sqrt(altitudeKm / c.refAltKm) : c.minutes
  return passes * minutes
}

/** Total contact minutes per day across stations, capped at 24 h (GEO sees one station continuously). */
export function contactMinutesPerDay(orbit: Orbit, altitudeKm: number, stations: GroundStation[]): number {
  if (orbit.contact === 'continuous') return stations.length > 0 ? MINUTES_PER_DAY : 0
  const total = stations.reduce((s, st) => s + stationContactMinutes(orbit, altitudeKm, st), 0)
  return Math.min(MINUTES_PER_DAY, total)
}

/** Drag station-keeping Δv per year (m/s/yr): 25·exp(−(h − 400)/60). Game approximation, average solar activity. */
export function dragDvPerYear(altitudeKm: number): number {
  return 25 * Math.exp(-(altitudeKm - 400) / 60)
}

/** Natural orbit lifetime from drag without propulsion (years): exp((h − 400)/60). */
export function dragLifetimeYears(altitudeKm: number): number {
  return Math.exp((altitudeKm - 400) / 60)
}

/** Station-keeping Δv per year for this orbit (m/s/yr). */
export function maintenanceDvPerYear(orbit: Orbit, altitudeKm: number): number {
  return orbit.drag ? dragDvPerYear(altitudeKm) : orbit.stationKeepingDv
}

/** How long the orbit stays usable without any propulsion (years). */
export function noPropulsionOrbitLifeYears(orbit: Orbit, altitudeKm: number): number {
  if (orbit.drag) return dragLifetimeYears(altitudeKm)
  if (orbit.id === 'lunar_polar') return 0.3 // lumpy lunar gravity pulls low orbits into the surface
  if (orbit.id === 'geo') return 0.5 // drifts out of its assigned slot
  return Infinity
}

export function clampAltitude(orbit: Orbit, altitudeKm: number): number {
  const [lo, hi] = orbit.altitudeKm
  if (!Number.isFinite(altitudeKm)) return orbit.defaultAltitudeKm
  return Math.min(hi, Math.max(lo, altitudeKm))
}
