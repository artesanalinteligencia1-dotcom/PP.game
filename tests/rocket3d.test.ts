import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { ROCKET_PRESETS } from '../src/engine/catalog/rocketParts'
import { LIMITS, analyzeRocket, setBoosters, type RocketDesign } from '../src/engine/rocket'
import { boosterDiameterM, engineSpots, launchDisplayScale, rocketLayout } from '../src/engine/rocketLayout'
import { makeTimeline } from '../src/ui/launch/LaunchSequence'
import { customStagingAt, stagingTimes } from '../src/ui/launch/three/ascent'
import { buildRocket3D } from '../src/ui/launch/three/rocket3d'

const presets = Object.entries(ROCKET_PRESETS) as [string, RocketDesign][]
const threeStage: RocketDesign = {
  stages: [
    { engineId: 'm_big', engines: 9, tankId: 'methane_l', tanks: 3 },
    { engineId: 'm_vac', engines: 2, tankId: 'methane_m', tanks: 2 },
    { engineId: 'h_upper', engines: 1, tankId: 'hydrogen_s', tanks: 1 },
  ],
  boosterId: 'srb_s',
  boosters: 4,
  fairingId: 'fairing_m',
  legs: true,
  fins: true,
}
const all: [string, RocketDesign][] = [...presets, ['threeStage', threeStage]]

describe('rocket layout (blueprint of the 3D model)', () => {
  it.each(all)('%s: same height and stage sizes as analyzeRocket', (_, d) => {
    const r = analyzeRocket(d)
    const l = rocketLayout(d)
    expect(l.heightM).toBeCloseTo(r.heightM, 9)
    expect(l.stages.map((s) => s.lengthM)).toEqual(r.stages.map((s) => s.lengthM))
    expect(l.stages.map((s) => s.diameterM)).toEqual(r.stages.map((s) => s.diameterM))
    expect(l.reusable).toBe(r.reusable)
    // stages are stacked without gaps and the fairing sits on the last one
    l.stages.forEach((s, i) => expect(s.y0).toBeCloseTo(l.stages.slice(0, i).reduce((t, x) => t + x.lengthM, 0), 9))
    expect(l.fairing!.y0 + l.fairing!.lengthM).toBeCloseTo(l.heightM, 9)
  })

  it('scales every length and keeps the proportions', () => {
    const a = rocketLayout(threeStage)
    const b = rocketLayout(threeStage, 0.5)
    expect(b.heightM).toBeCloseTo(a.heightM / 2, 9)
    expect(b.widthM).toBeCloseTo(a.widthM / 2, 9)
    expect(b.stages[1].y0).toBeCloseTo(a.stages[1].y0 / 2, 9)
    expect(b.legs!.lengthM).toBeCloseTo(a.legs!.lengthM / 2, 9)
    expect(b.legs!.deployAngle).toBeCloseTo(a.legs!.deployAngle, 9)
    expect(b.stages[0].engines[1].exitR).toBeCloseTo(a.stages[0].engines[1].exitR / 2, 9)
  })

  it('draws 1 to 9 nozzles that fit under the stage without touching', () => {
    for (const vacuum of [false, true]) {
      for (let n = 1; n <= 12; n++) {
        const spots = engineSpots(n, 2, vacuum)
        expect(spots.length).toBe(Math.min(n, LIMITS.engines))
        for (const [i, a] of spots.entries()) {
          expect(Math.hypot(a.x, a.z) + a.exitR).toBeLessThanOrEqual(2 + 1e-9)
          for (const b of spots.slice(i + 1)) expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThanOrEqual(a.exitR + b.exitR - 1e-9)
        }
      }
    }
  })

  it('puts boosters in opposite pairs around the first stage', () => {
    for (const n of [2, 4, 6]) {
      const l = rocketLayout(setBoosters(ROCKET_PRESETS.medium, 'srb_s', n))
      const spots = l.boosters!.spots
      expect(spots.length).toBe(n)
      expect(spots.reduce((t, s) => t + s.x, 0)).toBeCloseTo(0, 9)
      expect(spots.reduce((t, s) => t + s.z, 0)).toBeCloseTo(0, 9)
      const d = l.stages[0].diameterM / 2 + boosterDiameterM('srb_s') / 2
      spots.forEach((s) => expect(Math.hypot(s.x, s.z)).toBeGreaterThan(d))
    }
    expect(rocketLayout(ROCKET_PRESETS.medium).boosters).toBeNull()
  })

  it('legs reach below the nozzles when deployed; no legs or fins unless the design has them', () => {
    const l = rocketLayout(threeStage)
    const foot = l.legs!.pivotY + l.legs!.lengthM * Math.cos(l.legs!.deployAngle)
    expect(foot).toBeCloseTo(-l.legs!.footDropM, 9)
    expect(l.fins!.y).toBeLessThan(l.stages[0].y0 + l.stages[0].lengthM)
    expect(l.fins!.y).toBeGreaterThan(l.stages[0].tankY0)
    const plain = rocketLayout(ROCKET_PRESETS.medium)
    expect(plain.legs).toBeNull()
    expect(plain.fins).toBeNull()
  })

  it('fits any rocket to the launch pad (34 to 62 m) without changing one that already fits', () => {
    expect(launchDisplayScale(50)).toBe(1)
    expect(launchDisplayScale(10) * 10).toBeCloseTo(34, 9)
    expect(launchDisplayScale(300) * 300).toBeCloseTo(62, 9)
    expect(launchDisplayScale(0)).toBe(1)
  })
})

describe('rocket 3D model', () => {
  it.each(all)('%s: the model is as tall as the rocket and stands on its nozzles', (_, d) => {
    const layout = rocketLayout(d)
    const m = buildRocket3D(layout)
    const box = new THREE.Box3()
    m.stages.forEach((g) => box.expandByObject(g))
    expect(box.min.y).toBeCloseTo(0, 6)
    expect(box.max.y).toBeCloseTo(analyzeRocket(d).heightM, 4)
    expect(m.stages.length).toBe(d.stages.length)
    expect(m.boosters.length).toBe(d.boosters)
    expect(m.fairing.length).toBe(2)
    // each stage starts at its own base, and its interstage reaches the tanks of the stage above
    layout.stages.forEach((s, i) => {
      const b = new THREE.Box3().setFromObject(m.stages[i])
      expect(b.min.y).toBeCloseTo(s.y0, 6)
      if (i < layout.stages.length - 1) expect(b.max.y).toBeGreaterThanOrEqual(layout.stages[i + 1].tankY0 - 1e-6)
    })
    m.dispose()
  })

  it('boosters keep their catalog length and sit outside the first stage', () => {
    const m = buildRocket3D(rocketLayout(ROCKET_PRESETS.heavy))
    for (const b of m.boosters) {
      const box = new THREE.Box3().setFromObject(b.group)
      expect(box.min.y).toBeCloseTo(0, 6)
      expect(box.max.y).toBeCloseTo(30, 6)
      expect(b.out.length()).toBeCloseTo(1, 9)
      expect(b.home.dot(b.out)).toBeGreaterThan(5.2 / 2)
    }
  })

  it('legs fold along the body and swing below the nozzles', () => {
    const m = buildRocket3D(rocketLayout(ROCKET_PRESETS.reusable_medium))
    const lowest = () => new THREE.Box3().setFromObject(m.stages[0]).min.y
    expect(lowest()).toBeCloseTo(0, 6)
    m.setLegs(1)
    expect(lowest()).toBeLessThan(-0.3)
    m.setLegs(0)
    expect(lowest()).toBeCloseTo(0, 6)
  })

  it('the fairing halves split along z', () => {
    const m = buildRocket3D(rocketLayout(ROCKET_PRESETS.medium))
    const [a, b] = m.fairing.map((g) => new THREE.Box3().setFromObject(g))
    expect(a.min.z).toBeCloseTo(0, 6)
    expect(b.max.z).toBeCloseTo(0, 6)
    expect(a.max.z).toBeCloseTo(1, 6) // fairing S: 2 m across
  })
})

describe('staging of a player-built rocket on the launch timeline', () => {
  const T = makeTimeline(10)
  it('drops the first stage at MECO and shares the rest of the burn', () => {
    expect(stagingTimes(T, 1)).toEqual([])
    expect(stagingTimes(T, 2)).toEqual([T.meco])
    const three = stagingTimes(T, 3)
    expect(three[0]).toBe(T.meco)
    expect(three[1]).toBeCloseTo((T.meco + T.seco) / 2, 9)
  })
  it('names the burning stage and coasts briefly while an upper stage drops', () => {
    expect(customStagingAt(T.liftoff, T, 3)).toEqual({ stage: 0, throttle: 1 })
    expect(customStagingAt(T.meco + 0.1, T, 3)).toEqual({ stage: 1, throttle: 1 })
    const mid = (T.meco + T.seco) / 2
    expect(customStagingAt(mid + 0.1, T, 3)).toEqual({ stage: 2, throttle: 0 })
    expect(customStagingAt(mid + 1, T, 3)).toEqual({ stage: 2, throttle: 1 })
    expect(customStagingAt(T.end, T, 1)).toEqual({ stage: 0, throttle: 1 })
    expect(customStagingAt(T.end, T, 2)).toEqual({ stage: 1, throttle: 1 })
  })
})
