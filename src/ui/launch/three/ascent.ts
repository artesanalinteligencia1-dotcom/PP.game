import type { Timeline } from '../LaunchSequence'

// Choreography of the 3D launch scene, driven by the game's launch timeline (`makeTimeline`).
// World units are metres; the rocket's origin is the first-stage nozzle. Pure functions, so they are unit-tested.

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x))

/** Launchers drawn in 3D (all of them since delivery 2). */
export const LAUNCHERS_3D = new Set(['light', 'medium', 'rideshare', 'reusable_medium', 'heavy', 'reusable_heavy'])

/** Strap-on side boosters (they drop away just before MECO). */
export const hasSideBoosters = (id: string) => id === 'heavy' || id === 'reusable_heavy'

/** First stages that carry legs and grid fins for landing. */
export const isReusableLauncher = (id: string) => id === 'reusable_medium' || id === 'reusable_heavy'

/** Rocket height in metres per launcher (the SVG heights scaled: medium = 50 m). */
export const rocketMetres = (id: string) => (id === 'light' ? 38 : id === 'heavy' || id === 'reusable_heavy' ? 58 : 50)

export interface AscentState {
  /** altitude of the nozzle above the pad (m) */
  alt: number
  /** downrange distance (m) */
  down: number
  /** pitch from vertical (rad) */
  pitch: number
  /** engine throttle 0..1 of the stage that is burning */
  thrust: number
  /** 1 or 2 */
  stage: 1 | 2
  /** camera shake 0..1 */
  shake: number
  /** Max-Q vapour cone 0..1 */
  vapor: number
  /** service arms swung away 0..1 */
  arms: number
  /** fairing halves opening 0..1 */
  fairing: number
  /** sky towards black 0..1 */
  space: number
}

/**
 * State at time t (seconds after pressing Launch). The real ascent is compressed (1 s ≈ 1 min after liftoff), so the
 * altitudes here are "camera metres": slow first metres (thrust ≈ 1.3 × weight), clear of the tower in ≈ 2 s,
 * through the cloud deck (≈ 650 m) around MECO, black sky by SECO.
 */
export function ascentAt(t: number, T: Timeline): AscentState {
  const tf = Math.max(0, t - T.liftoff)
  const alt = 6 * tf * tf + 8 * tf * tf * tf
  const pitch = 0.5 * clamp((tf - 1.5) / (T.seco - T.liftoff - 1.5)) ** 1.3
  const down = alt * Math.sin(pitch) * 0.6
  const stage: 1 | 2 = t < T.meco ? 1 : 2
  let thrust = 0
  if (t >= T.ignition && t < T.meco) thrust = clamp((t - T.ignition) / (T.liftoff - T.ignition) + 0.15)
  else if (t >= T.meco + 0.5 && t < T.seco) thrust = clamp((t - T.meco - 0.5) / 0.4)
  const shake = t < T.ignition ? 0 : t < T.liftoff + 1.5 ? 1 - clamp((t - T.liftoff) / 1.5) * 0.7 : 0.3 * clamp(1 - (t - T.liftoff - 1.5) / 2.5)
  const q0 = T.maxQ - 0.3
  const q1 = T.meco - 0.4
  const vapor = t > q0 && t < q1 ? Math.sin(((t - q0) / (q1 - q0)) * Math.PI) : 0
  const arms = clamp((t - (T.ignition - 3)) / 1.5)
  const fairing = clamp((t - T.fairing) / 1.4)
  const space = clamp((alt - 500) / 2600)
  return { alt, down, pitch, thrust, stage, shake, vapor, arms, fairing, space }
}

/** Seconds from the start of the booster-landing inset to touchdown. */
export const LANDING_TOUCH = 3.2

export interface LandingState {
  /** height of the booster's base above the drone-ship deck (m) */
  y: number
  /** landing legs deployed 0..1 */
  legs: number
  /** landing burn on */
  burning: boolean
  /** lean from vertical (rad): grows when the landing goes wrong */
  tilt: number
  /** the booster hit the deck too hard and was lost */
  crashed: boolean
}

/** The reusable first stage coming down on the drone ship, `t` seconds after the inset opens (outcome from the mission roll). */
export function boosterLandingAt(t: number, landed: boolean): LandingState {
  const k = clamp(t / LANDING_TOUCH)
  const y = 120 * (1 - k) ** 2
  const legs = clamp((t - 2) / 0.8)
  const burning = t > 1.4 && t < LANDING_TOUCH
  const tilt = landed ? 0 : 0.5 * clamp((t - 2.2) / 1)
  return { y, legs, burning, tilt, crashed: !landed && t >= LANDING_TOUCH }
}
