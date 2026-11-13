import { describe, expect, it } from 'vitest'
import { TECH, buyTech, customRocketAllowed, missingRocketTech, newCampaign, rocketPartTech } from '../src/engine/campaign'
import { getLauncher, getScenario } from '../src/engine/catalog'
import { BOOSTERS, FAIRINGS, ROCKET_ENGINES, ROCKET_PRESETS, ROCKET_TANKS } from '../src/engine/catalog/rocketParts'
import { evaluateDesign } from '../src/engine/evaluate'
import { resolveLauncher } from '../src/engine/launch'
import { CUSTOM_LAUNCHER_ID, TARGET_DV, analyzeRocket, rocketEquationDv, rocketToLauncher, stagedDvMs, type RocketDesign } from '../src/engine/rocket'
import { createMission } from '../src/engine/simulate'
import type { Design } from '../src/engine/types'

const scenario = getScenario('earth_watch')
const withRocket = (rocket: RocketDesign | undefined): Design => ({ ...structuredClone(scenario.baseDesign), launcherId: CUSTOM_LAUNCHER_ID, customRocket: rocket })

describe('your own rocket as a mission launcher', () => {
  it('resolves catalog launchers by id and a custom design from its parts', () => {
    expect(resolveLauncher(scenario.baseDesign)).toBe(getLauncher(scenario.baseDesign.launcherId))
    const own = resolveLauncher(withRocket(ROCKET_PRESETS.medium))
    expect(own).toEqual(rocketToLauncher(ROCKET_PRESETS.medium))
    expect(own.id).toBe(CUSTOM_LAUNCHER_ID)
    expect(own.capacityKg.leo).toBeGreaterThan(2000)
  })

  it('falls back to the medium launcher when the rocket is missing or unreadable', () => {
    expect(resolveLauncher(withRocket(undefined)).id).toBe('medium')
    expect(resolveLauncher(withRocket({ stages: [] } as unknown as RocketDesign)).id).toBe('medium')
  })

  it('the design review uses its price, reliability and capacity', () => {
    const catalog = evaluateDesign({ ...structuredClone(scenario.baseDesign), launcherId: 'medium' }, scenario)
    const own = evaluateDesign(withRocket(ROCKET_PRESETS.medium), scenario)
    const r = analyzeRocket(ROCKET_PRESETS.medium)
    expect(own.cost.launchM).toBeCloseTo(r.costM, 6)
    expect(own.risk.launchReliability).toBe(r.reliability)
    expect(own.mass.wetKg).toBeCloseTo(catalog.mass.wetKg, 6)
    // a rocket too small for the spacecraft is caught like any launcher
    const far = getScenario('lagrange_observatory')
    const tiny = evaluateDesign({ ...structuredClone(far.baseDesign), launcherId: CUSTOM_LAUNCHER_ID, customRocket: ROCKET_PRESETS.light }, far)
    const codes = tiny.review.map((i) => i.code)
    expect(codes.some((c) => c === 'MASS_OVER_CAPACITY' || c === 'LAUNCHER_NO_TARGET')).toBe(true)
  })

  it('a rocket with a design error cannot carry anything', () => {
    const broken: RocketDesign = { ...ROCKET_PRESETS.medium, stages: [{ ...ROCKET_PRESETS.medium.stages[0], engineId: 'k_med_vac' }, ROCKET_PRESETS.medium.stages[1]] }
    expect(resolveLauncher(withRocket(broken)).capacityKg).toEqual({ leo: 0, sso: 0, gto: 0, tli: 0 })
    expect(evaluateDesign(withRocket(broken), scenario).review.map((i) => i.code)).toContain('LAUNCHER_NO_TARGET')
  })

  it('missions fly on it deterministically, and a reusable one rolls its landing', () => {
    const a = createMission(withRocket(ROCKET_PRESETS.reusable_medium), scenario, 7)
    const b = createMission(withRocket(ROCKET_PRESETS.reusable_medium), scenario, 7)
    expect(a.log).toEqual(b.log)
    expect(a.phase).toBe(b.phase)
    expect(typeof a.boosterLanded === 'boolean' || a.phase === 'ended').toBe(true)
  })

  it('opens in the career with the commercial launch market', () => {
    const c = newCampaign({ name: 'Test', level: 'explorer' } as never)
    expect(customRocketAllowed(c)).toBe(false)
    expect(customRocketAllowed({ ...c, unlocked: [...c.unlocked, 'commercial_launchers'] })).toBe(true)
  })
})

describe('price and reliability calibration against the catalog', () => {
  it.each(['light', 'medium', 'reusable_medium', 'heavy'] as const)('%s: the same rocket built from parts costs about the catalog price', (id) => {
    const r = analyzeRocket(ROCKET_PRESETS[id])
    const cat = getLauncher(id)
    expect(Math.abs(r.costM - cat.costM) / cat.costM).toBeLessThan(0.15)
    // a new design is never more reliable than proven rockets by much, nor hopeless
    expect(r.reliability).toBeGreaterThan(cat.reliability - 0.04)
    expect(r.reliability).toBeLessThan(cat.reliability + 0.04)
  })

  it('reuse is still cheaper per flight than throwing the same rocket away', () => {
    expect(analyzeRocket(ROCKET_PRESETS.reusable_medium).costM).toBeLessThan(analyzeRocket(ROCKET_PRESETS.medium).costM * 0.7)
  })
})

describe('rocket parts unlocked by technology (career)', () => {
  const start = { ...newCampaign({ name: 'Test', level: 'explorer' } as never), unlocked: ['paulet', 'commercial_launchers'] }

  it('kerosene parts need nothing; hydrogen, methane and recovery hardware need their technology', () => {
    expect(['k_small', 'k_med_vac', 'kerosene_l', 'srb_s', 'fairing_m'].map(rocketPartTech)).toEqual([undefined, undefined, undefined, undefined, undefined])
    expect(['h_main', 'h_upper', 'hydrogen_m', 'srb_l', 'fairing_l'].map(rocketPartTech)).toEqual(Array(5).fill('hydrogen_stages'))
    expect(['m_big', 'm_vac', 'methane_s'].map(rocketPartTech)).toEqual(Array(3).fill('methane_engines'))
    expect(['legs', 'fins'].map(rocketPartTech)).toEqual(['reusable_medium', 'reusable_medium'])
    // every part of the catalog is either free or tied to a technology that exists and can be bought
    for (const p of [...ROCKET_ENGINES, ...ROCKET_TANKS, ...BOOSTERS, ...FAIRINGS]) {
      const tech = rocketPartTech(p.id)
      if (tech) expect(TECH.find((t) => t.id === tech)?.available).toBe(true)
    }
  })

  it('lists what a rocket still needs, and nothing once it is bought', () => {
    expect(missingRocketTech(start, ROCKET_PRESETS.light)).toEqual([])
    expect(missingRocketTech(start, ROCKET_PRESETS.medium)).toEqual([])
    expect(missingRocketTech(start, ROCKET_PRESETS.reusable_medium)).toEqual(['reusable_medium'])
    expect(missingRocketTech(start, ROCKET_PRESETS.heavy)).toEqual(['hydrogen_stages'])
    const mixed: RocketDesign = { ...ROCKET_PRESETS.heavy, stages: [{ engineId: 'm_big', engines: 3, tankId: 'methane_l', tanks: 2 }, ROCKET_PRESETS.heavy.stages[1]], legs: true, fins: true }
    expect(missingRocketTech(start, mixed)).toEqual(['reusable_medium', 'hydrogen_stages', 'methane_engines'])
    const rich = { ...start, fundsM: 500, prestige: 500 }
    const bought = buyTech(rich, 'hydrogen_stages')
    expect(bought.fundsM).toBe(480)
    expect(missingRocketTech(bought, ROCKET_PRESETS.heavy)).toEqual([])
    // a booster that is selected but not mounted does not count
    expect(missingRocketTech(start, { ...ROCKET_PRESETS.medium, boosterId: 'srb_l', boosters: 0 })).toEqual([])
  })
})

describe('staging lesson', () => {
  it('one stage is the plain rocket equation', () => {
    const [dv] = stagedDvMs(1, 100_000, 2_000, 320, 0.08)
    expect(dv).toBeCloseTo(rocketEquationDv(320, 110_000, 10_000), 6)
  })
  it('more stages give more Δv from the same propellant, each one adding less', () => {
    const total = (n: number) => stagedDvMs(n, 100_000, 2_000, 340, 0.08).reduce((a, b) => a + b, 0)
    expect(stagedDvMs(3, 100_000, 2_000, 320, 0.08).length).toBe(3)
    expect(total(2)).toBeGreaterThan(total(1) + 1000)
    expect(total(3)).toBeGreaterThan(total(2))
    expect(total(4)).toBeGreaterThan(total(3))
    expect(total(2) - total(1)).toBeGreaterThan(total(3) - total(2))
    expect(total(3) - total(2)).toBeGreaterThan(total(4) - total(3))
    // the lesson's default: one stage falls short of orbit, two reach it
    expect(total(1)).toBeLessThan(TARGET_DV.leo)
    expect(total(2)).toBeGreaterThan(TARGET_DV.leo)
  })
})
