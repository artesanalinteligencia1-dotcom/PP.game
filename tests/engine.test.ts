import { describe, expect, it } from 'vitest'
import { mulberry32 } from '../src/engine/rng'
import { deltaV } from '../src/engine/budget'

describe('rng', () => {
  it('is deterministic for the same seed', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
  it('differs across seeds and stays in [0,1)', () => {
    const x = mulberry32(1)()
    expect(x).not.toBe(mulberry32(2)())
    expect(x).toBeGreaterThanOrEqual(0)
    expect(x).toBeLessThan(1)
  })
})

describe('deltaV', () => {
  it('matches the rocket equation (Isp 300 s, mass ratio e => 300*g0)', () => {
    expect(deltaV(300, Math.E * 100, 100)).toBeCloseTo(300 * 9.80665, 6)
  })
  it('rejects invalid masses', () => {
    expect(() => deltaV(300, 50, 100)).toThrow(RangeError)
  })
})
