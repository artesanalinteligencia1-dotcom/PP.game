import { describe, expect, it } from 'vitest'
import { makeTimeline } from '../src/ui/launch/LaunchSequence'
import { LAUNCHERS_3D, ascentAt, rocketMetres } from '../src/ui/launch/three/ascent'

describe('3D launch choreography', () => {
  const T = makeTimeline(10)

  it('holds the rocket on the pad until liftoff, engines lit from ignition', () => {
    expect(ascentAt(T.ignition - 0.1, T)).toMatchObject({ alt: 0, thrust: 0, stage: 1 })
    const ign = ascentAt(T.ignition + 0.5, T)
    expect(ign.alt).toBe(0)
    expect(ign.thrust).toBeGreaterThan(0)
    expect(ign.shake).toBeGreaterThan(0.5)
  })

  it('climbs monotonically and clears a 60 m tower about 2 s after liftoff', () => {
    let prev = -1
    for (let t = T.liftoff; t <= T.end; t += 0.1) {
      const a = ascentAt(t, T).alt
      expect(a).toBeGreaterThanOrEqual(prev)
      prev = a
    }
    expect(ascentAt(T.liftoff + 1, T).alt).toBeLessThan(60)
    expect(ascentAt(T.liftoff + 2.2, T).alt).toBeGreaterThan(60)
  })

  it('goes through the cloud deck before the fairing opens and reaches black sky by SECO', () => {
    expect(ascentAt(T.fairing, T).alt).toBeGreaterThan(700)
    expect(ascentAt(T.liftoff + 1, T).space).toBe(0)
    expect(ascentAt(T.seco, T).space).toBe(1)
  })

  it('cuts the first stage at MECO, lights the second stage, then shuts it down at SECO', () => {
    expect(ascentAt(T.meco - 0.01, T)).toMatchObject({ stage: 1, thrust: 1 })
    expect(ascentAt(T.meco + 0.2, T)).toMatchObject({ stage: 2, thrust: 0 })
    expect(ascentAt(T.meco + 1.5, T)).toMatchObject({ stage: 2, thrust: 1 })
    expect(ascentAt(T.seco + 0.1, T).thrust).toBe(0)
  })

  it('shows the Max-Q vapour only around Max-Q and opens the fairing after its cue', () => {
    expect(ascentAt(T.liftoff + 0.5, T).vapor).toBe(0)
    expect(ascentAt((T.maxQ + T.meco) / 2 - 0.2, T).vapor).toBeGreaterThan(0.5)
    expect(ascentAt(T.fairing - 0.1, T).fairing).toBe(0)
    expect(ascentAt(T.fairing + 2, T).fairing).toBe(1)
  })

  it('pitches over gradually and never past 0.5 rad', () => {
    expect(ascentAt(T.liftoff + 1, T).pitch).toBe(0)
    expect(ascentAt(T.seco, T).pitch).toBeCloseTo(0.5, 5)
    expect(ascentAt(T.end, T).pitch).toBeLessThanOrEqual(0.5)
  })

  it('works with the short countdown too (no voice files)', () => {
    const S = makeTimeline(3)
    expect(ascentAt(S.liftoff + 2.2, S).alt).toBeGreaterThan(60)
    expect(ascentAt(S.seco, S).space).toBe(1)
  })

  it('covers the single-core launchers; side-booster rockets keep the SVG scene for now', () => {
    expect([...LAUNCHERS_3D].sort()).toEqual(['light', 'medium', 'reusable_medium', 'rideshare'])
    expect(rocketMetres('light')).toBeLessThan(rocketMetres('medium'))
  })
})
