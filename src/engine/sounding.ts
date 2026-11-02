// First Light: a suborbital hop on Paulet-1. Pure and seeded.
import { getInstrument, getLauncher } from './catalog/components'
import { mixSeed, rngNext } from './rng'

export const SPACE_LINE_KM = 100
export const G = 9.80665
/** Speed needed to stay in a low orbit (km/s) — shown to explain why a sounding rocket falls back. */
export const ORBITAL_SPEED_KMS = 7.8

export interface SoundingResult {
  ok: boolean
  problem?: 'no_payload' | 'overweight'
  payloadKg: number
  limitKg: number
  failed: boolean
  apogeeKm: number
  burnoutKms: number
  secondsInSpace: number
  recovered: boolean
  reachedSpace: boolean
  science: number
}

/** Vertical shot (no drag): apogee h = v² / 2g  ⇒  v = √(2 g h). Time above 100 km = 2·√(2 (h − 100 km) / g). */
export function flySounding(payloadIds: string[], seed: number): SoundingResult {
  const rocket = getLauncher('paulet')
  const limitKg = rocket.suborbital!.payloadKg
  const ids = [...new Set(payloadIds)]
  const payloadKg = ids.reduce((t, id) => t + getInstrument(id).massKg, 0)
  const base = { payloadKg, limitKg, failed: false, apogeeKm: 0, burnoutKms: 0, secondsInSpace: 0, recovered: false, reachedSpace: false, science: 0 }
  if (ids.length === 0) return { ...base, ok: false, problem: 'no_payload' }
  if (payloadKg > limitKg) return { ...base, ok: false, problem: 'overweight' }
  let st = mixSeed(seed)
  const r = () => {
    const [v, n] = rngNext(st)
    st = n
    return v
  }
  const failed = r() > rocket.reliability
  const apogeeKm = failed ? 8 + r() * 30 : rocket.suborbital!.apogeeKm + 3 * (limitKg - payloadKg) + (r() * 6 - 3)
  const burnoutKms = Math.sqrt(2 * G * apogeeKm * 1000) / 1000
  const reachedSpace = apogeeKm >= SPACE_LINE_KM
  const secondsInSpace = reachedSpace ? 2 * Math.sqrt((2 * (apogeeKm - SPACE_LINE_KM) * 1000) / G) : 0
  const recovered = !failed && r() < 0.9
  const science = ids.reduce((t, id) => t + getInstrument(id).science, 0) * 0.3 * (reachedSpace ? 1 : 0.2) * (recovered ? 1 : 0.6)
  return { ok: true, payloadKg, limitKg, failed, apogeeKm, burnoutKms, secondsInSpace, recovered, reachedSpace, science }
}
