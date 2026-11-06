import { describe, expect, it } from 'vitest'
import { LANDING_TOUCH, boosterLandingAt } from '../src/ui/launch/three/ascent'
import { soundingAltKm, soundingSpeedKms, soundingTimeline } from '../src/ui/hub/soundingProfile'

describe('booster landing on the drone ship', () => {
  it('comes down monotonically, opens the legs before touchdown and lands on the deck', () => {
    let prev = Infinity
    for (let t = 0; t <= LANDING_TOUCH; t += 0.1) {
      const y = boosterLandingAt(t, true).y
      expect(y).toBeLessThanOrEqual(prev)
      prev = y
    }
    expect(boosterLandingAt(0, true).y).toBe(120)
    expect(boosterLandingAt(LANDING_TOUCH - 0.3, true).legs).toBe(1)
    expect(boosterLandingAt(LANDING_TOUCH + 1, true)).toMatchObject({ y: 0, crashed: false, tilt: 0, burning: false })
  })
  it('fires the landing burn only in the last part of the fall', () => {
    expect(boosterLandingAt(1, true).burning).toBe(false)
    expect(boosterLandingAt(2.5, true).burning).toBe(true)
  })
  it('leans over and is lost when the mission roll says so', () => {
    expect(boosterLandingAt(1, false).tilt).toBe(0)
    expect(boosterLandingAt(3, false).tilt).toBeGreaterThan(0.3)
    expect(boosterLandingAt(LANDING_TOUCH - 0.01, false).crashed).toBe(false)
    expect(boosterLandingAt(LANDING_TOUCH, false).crashed).toBe(true)
  })
})

describe('Paulet-1 flight profile', () => {
  const T = soundingTimeline(10)
  const ok = { apogeeKm: 120, failed: false, burnoutKms: 1.5 }
  it('stays on the rail until liftoff and peaks at the apogee', () => {
    expect(soundingAltKm(T.liftoff - 0.1, T, ok)).toBe(0)
    expect(soundingAltKm(T.apogee - 0.001, T, ok)).toBeCloseTo(120, 1)
    for (let t = T.liftoff; t < T.end; t += 0.1) expect(soundingAltKm(t, T, ok)).toBeLessThanOrEqual(120.0001)
  })
  it('falls back under the parachute to the ground', () => {
    expect(soundingAltKm(T.chute, T, ok)).toBeCloseTo(6, 1)
    expect(soundingAltKm(T.end, T, ok)).toBe(0)
  })
  it('freezes at the failure point and stops the speed', () => {
    const bad = { apogeeKm: 20, failed: true, burnoutKms: 0.6 }
    const atFail = soundingAltKm(T.fail, T, bad)
    expect(soundingAltKm(T.fail + 2, T, bad)).toBe(atFail)
    expect(soundingSpeedKms(T.fail + 1, T, bad)).toBe(0)
  })
  it('works with the short countdown (no voice files)', () => {
    const S = soundingTimeline(3)
    expect(S.ignition).toBe(3)
    expect(soundingAltKm(S.apogee - 0.001, S, ok)).toBeCloseTo(120, 1)
  })
})
