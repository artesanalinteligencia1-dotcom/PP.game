import type { SoundingResult } from '../../engine/sounding'

// Paulet-1 flight profile shared by the SVG and the 3D prologue: countdown → ignition → powered ascent → coast to
// apogee → fall → parachute. Pure, so it is unit-tested.

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x))

/** Seconds after pressing Launch. `count` = countdown seconds (10 with the voice, 3 without). */
export function soundingTimeline(count: number) {
  const ignition = count
  const liftoff = count + 1.2
  return { ignition, liftoff, burnout: liftoff + 2.2, apogee: liftoff + 5.5, chute: liftoff + 8.5, end: liftoff + 10.5, fail: liftoff + 1.6 }
}
export type SoundingTimeline = ReturnType<typeof soundingTimeline>

/** Altitude (km) at time t: powered ease-in, ballistic coast, fall, parachute; frozen at the failure point. */
export function soundingAltKm(t: number, T: SoundingTimeline, r: Pick<SoundingResult, 'apogeeKm' | 'failed'>): number {
  const ap = r.apogeeKm
  const powered = (x: number) => ap * 0.3 * ((x - T.liftoff) / (T.burnout - T.liftoff)) ** 2
  if (r.failed && t >= T.fail) return powered(T.fail)
  if (t < T.liftoff) return 0
  if (t < T.burnout) return powered(t)
  if (t < T.apogee) {
    const u = (t - T.burnout) / (T.apogee - T.burnout)
    return ap * (0.3 + 0.7 * (1 - (1 - u) ** 2))
  }
  if (t < T.chute) {
    const u = (t - T.apogee) / (T.chute - T.apogee)
    return ap * (1 - 0.95 * u * u)
  }
  return ap * 0.05 * clamp(1 - (t - T.chute) / (T.end - T.chute))
}

/** Speed shown on the HUD (km/s). */
export function soundingSpeedKms(t: number, T: SoundingTimeline, r: Pick<SoundingResult, 'burnoutKms' | 'failed'>): number {
  if (r.failed && t >= T.fail) return 0
  if (t < T.burnout) return r.burnoutKms * clamp((t - T.liftoff) / (T.burnout - T.liftoff))
  if (t < T.apogee) return r.burnoutKms * (1 - (t - T.burnout) / (T.apogee - T.burnout))
  if (t < T.chute) return r.burnoutKms * 0.8 * ((t - T.apogee) / (T.chute - T.apogee))
  return 0.01
}
