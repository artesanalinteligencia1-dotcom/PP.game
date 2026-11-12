import { describe, expect, it } from 'vitest'
import { G0, TARGET_DV, addStage, analyzeRocket, isRocketDesign, removeStage, rocketEquationDv, rocketToLauncher, setBoosters, updateStage, type RocketDesign } from '../src/engine/rocket'
import { ROCKET_PRESETS, ROCKET_TANKS } from '../src/engine/catalog/rocketParts'
import { getLauncher } from '../src/engine/catalog'

const codes = (d: RocketDesign, payload = 0) => analyzeRocket(d, payload).issues.map((i) => i.code)
const medium = ROCKET_PRESETS.medium

describe('rocket equation', () => {
  it('matches Tsiolkovsky', () => {
    expect(rocketEquationDv(300, 100, 25)).toBeCloseTo(300 * G0 * Math.log(4), 6)
    expect(rocketEquationDv(300, 100, 100)).toBe(0)
  })

  it('a single-stage rocket gets exactly the rocket equation', () => {
    const d: RocketDesign = { stages: [{ engineId: 'k_med', engines: 1, tankId: 'kerosene_m', tanks: 1 }], boosters: 0, fairingId: 'fairing_xs', legs: false, fins: false }
    const r = analyzeRocket(d, 0)
    const tank = ROCKET_TANKS.find((t) => t.id === 'kerosene_m')!
    const dry = tank.dryKg + 900 + 50 // tank + engine + fairing
    expect(r.totalDvMs).toBeCloseTo(rocketEquationDv((282 + 311) / 2, dry + tank.propellantKg, dry), 3)
  })

  it('staging beats one big stage with the same propellant', () => {
    const one: RocketDesign = { stages: [{ engineId: 'k_med', engines: 3, tankId: 'kerosene_m', tanks: 4 }], boosters: 0, fairingId: 'fairing_s', legs: false, fins: false }
    const two: RocketDesign = { ...one, stages: [{ engineId: 'k_med', engines: 3, tankId: 'kerosene_m', tanks: 3 }, { engineId: 'k_med_vac', engines: 1, tankId: 'kerosene_m', tanks: 1 }] }
    expect(analyzeRocket(two, 1000).totalDvMs).toBeGreaterThan(analyzeRocket(one, 1000).totalDvMs + 1000)
  })

  it('more payload means less Δv and a lower liftoff thrust-to-weight', () => {
    const a = analyzeRocket(medium, 500)
    const b = analyzeRocket(medium, 2500)
    expect(b.totalDvMs).toBeLessThan(a.totalDvMs)
    expect(b.liftoffTwr).toBeLessThan(a.liftoffTwr)
  })
})

describe('capacity', () => {
  it('the capacity payload still reaches the target, and a little more does not', () => {
    const roomy = { ...medium, fairingId: 'fairing_m' } // so Δv, not the fairing, sets the limit
    const r = analyzeRocket(roomy)
    for (const target of ['leo', 'gto'] as const) {
      const cap = r.capacityKg[target]
      expect(analyzeRocket(roomy, cap).totalDvMs).toBeGreaterThanOrEqual(TARGET_DV[target])
      expect(analyzeRocket(roomy, cap + 50).totalDvMs).toBeLessThan(TARGET_DV[target])
    }
  })

  it('higher targets carry less: LEO > SSO > GTO > TLI', () => {
    const c = analyzeRocket(ROCKET_PRESETS.heavy).capacityKg
    expect(c.leo).toBeGreaterThan(c.sso)
    expect(c.sso).toBeGreaterThan(c.gto)
    expect(c.gto).toBeGreaterThan(c.tli)
  })

  it('presets fly close to the catalog launchers they stand for (LEO within 30 %)', () => {
    for (const id of ['light', 'medium', 'reusable_medium', 'heavy'] as const) {
      const built = analyzeRocket(ROCKET_PRESETS[id])
      expect(built.issues.filter((i) => i.severity === 'error')).toEqual([])
      const catalog = getLauncher(id).capacityKg.leo
      expect(Math.abs(built.capacityKg.leo - catalog) / catalog, id).toBeLessThan(0.3)
    }
  })

  it('the fairing limits what fits', () => {
    const r = analyzeRocket({ ...ROCKET_PRESETS.heavy, fairingId: 'fairing_s' })
    expect(r.capacityKg.leo).toBeLessThanOrEqual(2500)
    expect(codes(ROCKET_PRESETS.light, 600)).toContain('ROCKET_FAIRING_SMALL')
  })
})

describe('reuse', () => {
  it('legs and fins make the first stage reusable: cheaper flights, less payload', () => {
    const exp = analyzeRocket(medium)
    const reu = analyzeRocket(ROCKET_PRESETS.reusable_medium)
    expect(reu.reusable).toBe(true)
    expect(reu.costM).toBeLessThan(exp.costM)
    expect(reu.capacityKg.leo).toBeLessThan(exp.capacityKg.leo)
    expect(reu.capacityKg.leo).toBeGreaterThan(exp.capacityKg.leo * 0.6)
  })

  it('legs without fins, or an engine that cannot relight, is not reusable', () => {
    expect(analyzeRocket({ ...medium, legs: true }).reusable).toBe(false)
    expect(codes({ ...medium, legs: true })).toContain('ROCKET_LEGS_NO_FINS')
    const noRestart = { ...ROCKET_PRESETS.light, legs: true, fins: true }
    expect(analyzeRocket(noRestart).reusable).toBe(false)
    expect(codes(noRestart)).toContain('ROCKET_ENGINE_NO_RESTART')
  })
})

describe('design review', () => {
  it('flags a rocket too heavy to leave the pad', () => {
    const d: RocketDesign = { ...medium, stages: [{ engineId: 'k_med', engines: 1, tankId: 'kerosene_l', tanks: 1 }, medium.stages[1]] }
    expect(codes(d)).toContain('ROCKET_TWR_LOW')
    expect(analyzeRocket(d).capacityKg.leo).toBe(0)
  })

  it('flags a vacuum engine on the first stage and mixed fuels', () => {
    expect(codes({ ...medium, stages: [{ ...medium.stages[0], engineId: 'k_med_vac' }, medium.stages[1]] })).toContain('ROCKET_VACUUM_ENGINE_FIRST')
    expect(codes({ ...medium, stages: [{ ...medium.stages[0], tankId: 'hydrogen_m' }, medium.stages[1]] })).toContain('ROCKET_FUEL_MISMATCH')
  })

  it('a single stage cannot reach orbit with these parts', () => {
    const d: RocketDesign = { stages: [{ engineId: 'k_med', engines: 3, tankId: 'kerosene_m', tanks: 3 }], boosters: 0, fairingId: 'fairing_xs', legs: false, fins: false }
    expect(codes(d)).toContain('ROCKET_NO_ORBIT')
  })

  it('incomplete designs are blocked, not crashed', () => {
    expect(codes({ ...medium, stages: [] })).toEqual(['ROCKET_INCOMPLETE'])
    expect(codes({ ...medium, stages: [{ ...medium.stages[0], engineId: 'nope' }] })).toEqual(['ROCKET_INCOMPLETE'])
  })

  it('is deterministic and becomes a launcher the game understands', () => {
    expect(analyzeRocket(ROCKET_PRESETS.heavy, 3000)).toEqual(analyzeRocket(ROCKET_PRESETS.heavy, 3000))
    const l = rocketToLauncher(ROCKET_PRESETS.reusable_medium, 'My rocket')
    expect(l.id).toBe('custom')
    expect(l.kind).toBe('reusable')
    expect(l.landing?.successP).toBeGreaterThan(0)
    expect(l.capacityKg.leo).toBe(analyzeRocket(ROCKET_PRESETS.reusable_medium).capacityKg.leo)
  })
})

describe('workbench editing', () => {
  it('changing an engine keeps the tank on its fuel and size', () => {
    const d = updateStage(medium, 0, { engineId: 'h_main' })
    expect(d.stages[0].tankId).toBe('hydrogen_m')
    expect(codes(d)).not.toContain('ROCKET_FUEL_MISMATCH')
  })

  it('counts stay in range; stages and boosters respect their limits', () => {
    expect(updateStage(medium, 0, { engines: 40, tanks: 0 }).stages[0]).toMatchObject({ engines: 9, tanks: 1 })
    expect(removeStage(removeStage(ROCKET_PRESETS.light, 1), 0).stages.length).toBe(1)
    const three = addStage(medium)
    expect(three.stages.length).toBe(3)
    expect(addStage(three).stages.length).toBe(3)
    expect(setBoosters(medium, 'srb_s', 3).boosters).toBe(2)
    expect(setBoosters(medium, undefined, 4)).toMatchObject({ boosters: 0, boosterId: undefined })
  })

  it('only valid designs are accepted back from storage', () => {
    expect(isRocketDesign(ROCKET_PRESETS.heavy)).toBe(true)
    expect(isRocketDesign({ ...medium, fairingId: 'nope' })).toBe(false)
    expect(isRocketDesign(null)).toBe(false)
  })
})
