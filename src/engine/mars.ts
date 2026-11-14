// Mars: the planet's orbit, launch windows, cruise, capture burn and the radio delay. Pure functions, no randomness.
// Circular, coplanar orbits for Earth and Mars (game approximation; Mars' real orbit is eccentric, so real windows and
// distances vary from one opposition to the next). Every number is documented in docs/model.md §22.

export const AU_KM = 149_597_870.7
export const LIGHT_SPEED_KMS = 299_792.458
export const MU_SUN_KM3S2 = 1.327_124_400_18e11
export const EARTH_YEAR_DAYS = 365.256
export const DAYS_PER_MONTH = 365.25 / 12

export const MARS = {
  radiusKm: 3389.5,
  muKm3s2: 42_828.4,
  /** Mean distance from the Sun (AU). */
  orbitAu: 1.5237,
  /** One Martian year (days). */
  yearDays: 686.98,
  /** One sol: a Martian day (hours). */
  solHours: 24.6597,
} as const

const DEG = Math.PI / 180
/** Mean motions (degrees per day). */
const N_EARTH = 360 / EARTH_YEAR_DAYS
const N_MARS = 360 / MARS.yearDays

/** Time between two launch windows: the synodic period, 1 / (1/T_Earth − 1/T_Mars). About 780 days (≈ 26 months). */
export function synodicDays(): number {
  return 1 / (1 / EARTH_YEAR_DAYS - 1 / MARS.yearDays)
}
export const MARS_WINDOW_EVERY_MONTHS = Math.round((synodicDays() / DAYS_PER_MONTH) * 10) / 10

/** Minimum-energy (Hohmann) trip: half the period of the ellipse that touches both orbits. About 259 days (8.5 months). */
export function hohmannDays(): number {
  const a = ((1 + MARS.orbitAu) / 2) * AU_KM
  return (Math.PI * Math.sqrt((a * a * a) / MU_SUN_KM3S2)) / 86400
}

/** Angle the spacecraft sweeps around the Sun during the cruise: 180° on a Hohmann transfer, less on faster trips. */
export function sweepDeg(cruiseDays: number): number {
  return 180 * Math.min(1, cruiseDays / hohmannDays())
}

/**
 * How far ahead of Earth (degrees around the Sun) Mars must be on launch day, so that the planet is there when the
 * spacecraft arrives: sweep − n_Mars·T. About 44° for a Hohmann transfer. This is why the window "will not wait".
 */
export function departurePhaseDeg(cruiseDays = hohmannDays()): number {
  return sweepDeg(cruiseDays) - N_MARS * cruiseDays
}

/** Mars' lead over Earth (degrees), `day` days after a launch in the window. Earth is faster, so it shrinks. */
export function phaseDeg(day: number, cruiseDays = hohmannDays()): number {
  return departurePhaseDeg(cruiseDays) - (N_EARTH - N_MARS) * day
}

/** Earth–Mars distance (AU) for a given lead angle: law of cosines on the two circular orbits. */
export function earthMarsDistanceAu(phase: number): number {
  const r = MARS.orbitAu
  return Math.sqrt(1 + r * r - 2 * r * Math.cos(phase * DEG))
}

/** One-way radio delay (minutes) over a distance in AU. 1 AU ≈ 8.3 light-minutes. */
export function lightDelayMin(distanceAu: number): number {
  return (distanceAu * AU_KM) / LIGHT_SPEED_KMS / 60
}

/** One-way radio delay (minutes) between Earth and Mars, `day` days after launch. */
export function marsDelayMin(day: number, cruiseDays = hohmannDays()): number {
  return lightDelayMin(earthMarsDistanceAu(phaseDeg(day, cruiseDays)))
}

export const MARS_DELAY_MIN = lightDelayMin(MARS.orbitAu - 1)
export const MARS_DELAY_MAX = lightDelayMin(MARS.orbitAu + 1)

/**
 * Days after launch of the first solar conjunctions: Mars passes behind the Sun as seen from Earth (lead = 180°) and
 * the radio link drops for about two weeks. They repeat every synodic period.
 */
export function conjunctionDays(count = 4, cruiseDays = hohmannDays()): number[] {
  const first = (departurePhaseDeg(cruiseDays) + 180) / (N_EARTH - N_MARS)
  return Array.from({ length: count }, (_, k) => first + k * synodicDays())
}
/** Length of the radio blackout around a conjunction (weeks). */
export const CONJUNCTION_BLACKOUT_WEEKS = 2

export interface LaunchWindow {
  /** Project month in which the first window opens. */
  firstMonth: number
  /** Months between windows. */
  everyMonths: number
}

/** The project month of the first window a spacecraft ready at `readyMonth` can take. */
export function nextWindowMonth(readyMonth: number, w: LaunchWindow): number {
  const k = Math.max(0, Math.ceil((readyMonth - w.firstMonth) / w.everyMonths - 1e-9))
  return w.firstMonth + k * w.everyMonths
}

/**
 * Braking burn (m/s) to be captured from an arrival speed `vInfKms` (hyperbolic excess) into an orbit with the given
 * periapsis and apoapsis altitudes; the burn is done at periapsis, where it is cheapest (Oberth effect). A second burn
 * circularises at apoapsis when `circulariseAtApo` is set (high circular orbits such as the areostationary one).
 */
export function marsCaptureDv(vInfKms: number, periAltKm: number, apoAltKm = periAltKm, circulariseAtApo = false): number {
  const mu = MARS.muKm3s2
  const rp = MARS.radiusKm + periAltKm
  const ra = MARS.radiusKm + Math.max(apoAltKm, periAltKm)
  const a = (rp + ra) / 2
  const vHyp = Math.sqrt(vInfKms * vInfKms + (2 * mu) / rp)
  const vPeri = Math.sqrt(mu * (2 / rp - 1 / a))
  let dv = vHyp - vPeri
  if (circulariseAtApo && ra > rp) dv += Math.sqrt(mu / ra) - Math.sqrt(mu * (2 / ra - 1 / a))
  return dv * 1000
}

/** Arrival speed relative to Mars (km/s) on a Hohmann transfer: Mars' orbital speed minus the ellipse's aphelion speed. */
export function hohmannArrivalVInfKms(): number {
  const r1 = AU_KM
  const r2 = MARS.orbitAu * AU_KM
  const a = (r1 + r2) / 2
  return Math.sqrt(MU_SUN_KM3S2 / r2) - Math.sqrt(MU_SUN_KM3S2 * (2 / r2 - 1 / a))
}

/** Altitude (km) of the areostationary orbit: one revolution per sol, from Kepler's third law. */
export function areostationaryAltitudeKm(): number {
  const T = MARS.solHours * 3600
  return Math.cbrt((MARS.muKm3s2 * T * T) / (4 * Math.PI * Math.PI)) - MARS.radiusKm
}

export interface TransferView {
  /** Positions in AU, Sun at the origin, Earth on the +x axis on launch day; counter-clockwise. */
  earth: [number, number]
  mars: [number, number]
  craft: [number, number]
  delayMin: number
}

/** Where Earth, Mars and the spacecraft are `day` days after launch (for the journey view and its tests). */
export function transferView(day: number, cruiseDays = hohmannDays()): TransferView {
  const at = (r: number, deg: number): [number, number] => [r * Math.cos(deg * DEG), r * Math.sin(deg * DEG)]
  const earth = at(1, N_EARTH * day)
  const marsDeg = departurePhaseDeg(cruiseDays) + N_MARS * day
  const mars = at(MARS.orbitAu, marsDeg)
  let craft = mars
  if (day < cruiseDays) {
    // Kepler's equation on the transfer ellipse (perihelion at Earth, aphelion at Mars); faster trips reuse its shape.
    const e = (MARS.orbitAu - 1) / (MARS.orbitAu + 1)
    const a = (1 + MARS.orbitAu) / 2
    const meanAnomaly = Math.PI * Math.max(0, day / cruiseDays)
    let E = meanAnomaly
    for (let i = 0; i < 8; i++) E -= (E - e * Math.sin(E) - meanAnomaly) / (1 - e * Math.cos(E))
    const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2))
    const r = a * (1 - e * Math.cos(E))
    craft = at(r, (nu / DEG) * (sweepDeg(cruiseDays) / 180))
  }
  return { earth, mars, craft, delayMin: marsDelayMin(day, cruiseDays) }
}
