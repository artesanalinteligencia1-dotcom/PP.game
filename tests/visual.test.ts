import { describe, expect, it } from 'vitest'
import { getScenario, type Design } from '../src/engine'
import { spacecraftVisual } from '../src/ui/spacecraft/visual'
import { FAREWELLS, failureTime, farewellIndex, makeTimeline } from '../src/ui/launch/LaunchSequence'

const base = getScenario('earth_watch').baseDesign

describe('spacecraft drawing follows the design (visible on pad and in flight)', () => {
  it('each instrument added appears as a module owned by its scientist', () => {
    const v = spacecraftVisual({ ...base, instruments: [{ id: 'multispectral', duty: 0.05 }, { id: 'sar', duty: 0.03 }] })
    expect(v.instruments.map((i) => [i.id, i.shape, i.discipline])).toEqual([
      ['multispectral', 'camera', 'astrobiologist'],
      ['sar', 'radar', 'astrophysicist'],
    ])
  })
  it('array type and area change the wings; heavier spacecraft get a bigger bus', () => {
    const small = spacecraftVisual(base)
    const big: Design = { ...base, arrayId: 'tracking', arrayAreaM2: 20, instruments: [{ id: 'hires_camera', duty: 0.02 }, { id: 'sar', duty: 0.03 }] }
    const vb = spacecraftVisual(big)
    expect(small.arrays.kind).toBe('deployable')
    expect(vb.arrays.kind).toBe('tracking')
    expect(vb.arrays.wing).toBeGreaterThan(small.arrays.wing)
    expect(vb.bus).toBeGreaterThan(small.bus)
    expect(spacecraftVisual({ ...base, arrayId: 'body' }).arrays.wing).toBe(0)
  })
  it('antenna, propulsion and thermal choices are carried through', () => {
    const v = spacecraftVisual({ ...base, antennaId: 'dish', propulsionId: 'electric', thermalId: 'active' })
    expect([v.antenna, v.propulsion, v.activeThermal]).toEqual(['dish', 'electric', true])
  })
})

describe('launch sequence timeline', () => {
  it.each([3, 10])('phases happen in physical order (countdown %i s)', (count) => {
    const T = makeTimeline(count)
    expect(T.ignition).toBeLessThan(T.liftoff)
    expect(T.liftoff).toBeLessThan(T.maxQ)
    expect(T.maxQ).toBeLessThan(T.meco)
    expect(T.meco).toBeLessThan(T.fairing)
    expect(T.fairing).toBeLessThan(T.seco)
    expect(T.seco).toBeLessThan(T.deploy)
  })
  it('a failed launch fails at a deterministic, seed-dependent moment after liftoff', () => {
    const T = makeTimeline(10)
    expect(failureTime(5, T)).toEqual(failureTime(5, T))
    const times = new Set([0, 1, 2].map((s) => failureTime(s, T).at))
    expect(times.size).toBe(3)
    for (const s of [0, 1, 2]) expect(failureTime(s, T).at).toBeGreaterThan(T.liftoff)
  })
  it('the farewell line is chosen deterministically from the seed', () => {
    expect(farewellIndex(123456)).toBe(farewellIndex(123456))
    expect(new Set([0, 1, 2, 3, 4].map((s) => FAREWELLS[farewellIndex(s)])).size).toBe(5)
  })
})
