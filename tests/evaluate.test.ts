import { describe, expect, it } from 'vitest'
import {
  deltaV,
  downlinkGbPerDay,
  dataGbPerDay,
  eclipseFraction,
  evaluateDesign,
  getOrbit,
  getScenario,
  orbitalPeriodMin,
  propellantForDv,
  requiredAveragePowerW,
  scenarios,
  sunlitPowerW,
  type Design,
} from '../src/engine'
import { MESSAGES } from '../src/i18n/en'

const ew = getScenario('earth_watch')
const lp = getScenario('lunar_pathfinder')
const evalD = (d: Design) => evaluateDesign(d, getScenario(d.scenarioId))

/** Reference Earth Watch designs: two different ways to win. */
const ewSmallsat: Design = {
  ...ew.baseDesign,
  instruments: [{ id: 'multispectral', duty: 0.05 }],
  stationIds: ['mid_north', 'arctic'],
}
const ewHyper: Design = {
  ...ew.baseDesign,
  instruments: [{ id: 'hyperspectral', duty: 0.03 }],
  arrayAreaM2: 0.8,
  compressionId: 'lossless',
  stationIds: ['arctic', 'andes'],
  obcId: 'highperf',
  propulsionId: 'hydrazine',
}
/** Reference Lunar Pathfinder designs: electric vs chemical. */
const lpElectric: Design = {
  ...lp.baseDesign,
  instruments: [
    { id: 'laser_altimeter', duty: 0.1 },
    { id: 'neutron_spectrometer', duty: 1 },
  ],
  arrayId: 'tracking',
  arrayAreaM2: 2.5,
  batteryId: 'b1000',
  obcId: 'radhard',
  propulsionId: 'electric',
  thermalId: 'active',
  compressionId: 'lossless',
  antennaId: 'dish',
  stationIds: ['deep_west', 'deep_south'],
}
const lpChemical: Design = {
  ...lp.baseDesign,
  instruments: [
    { id: 'neutron_spectrometer', duty: 1 },
    { id: 'ir_spectrometer', duty: 0.05 },
  ],
  arrayAreaM2: 1.8,
  batteryId: 'b1000',
  obcId: 'radhard',
  thermalId: 'active',
  compressionId: 'lossless',
  antennaId: 'dish',
  stationIds: ['deep_west', 'deep_south'],
}

const mustPass = (d: Design) => {
  const r = evalD(d)
  const failed = r.requirements.filter((x) => !x.optional && !x.met).map((x) => x.id)
  const blocking = r.review.filter((x) => x.blocking).map((x) => x.code)
  return { r, failed, blocking }
}

describe('orbit mechanics (known values)', () => {
  it('Kepler period: LEO 500 km ≈ 94.6 min, GEO ≈ 1436 min, lunar 100 km ≈ 118 min', () => {
    expect(orbitalPeriodMin(getOrbit('leo'), 500)).toBeCloseTo(94.6, 0)
    expect(orbitalPeriodMin(getOrbit('geo'), 35786)).toBeCloseTo(1436, 0)
    expect(orbitalPeriodMin(getOrbit('lunar_polar'), 100)).toBeCloseTo(117.8, 0)
  })
  it('worst-case eclipse fraction: LEO ~38 %, GEO ~5 %, dawn-dusk 0', () => {
    expect(eclipseFraction(getOrbit('leo'), 500)).toBeCloseTo(0.378, 2)
    expect(eclipseFraction(getOrbit('geo'), 35786)).toBeCloseTo(0.048, 2)
    expect(eclipseFraction(getOrbit('sso_dd'), 700)).toBe(0)
  })
})

describe('budget formulas', () => {
  it('propellant sizing satisfies the rocket equation (tanks included in dry mass)', () => {
    const dry = 200
    const { propellantKg, tankKg } = propellantForDv(dry, 1000, 220)
    expect(deltaV(220, dry + tankKg + propellantKg, dry + tankKg)).toBeCloseTo(1000, 6)
  })
  it('impossible Δv with a weak engine is reported as infinite, not NaN', () => {
    expect(propellantForDv(100, 5000, 65).propellantKg).toBe(Infinity)
  })
  it('solar power: 1 m² × 0.3 × 1361 W/m² × cos 0 = 408.3 W; halves at 1.414 AU', () => {
    expect(sunlitPowerW(1, 0.3, 1)).toBeCloseTo(408.3, 1)
    expect(sunlitPowerW(1, 0.3, 1, Math.SQRT2)).toBeCloseTo(204.15, 1)
  })
  it('required average power includes battery round-trip losses', () => {
    expect(requiredAveragePowerW(100, 0)).toBe(100)
    expect(requiredAveragePowerW(90, 0.5)).toBeCloseTo(95, 6)
  })
  it('data: 100 Mbit/s for 60 min at 70 % efficiency = 31.5 GB; 120 Mbit/s at 5 % duty = 64.8 GB/day', () => {
    expect(downlinkGbPerDay(60, 100)).toBeCloseTo(31.5, 6)
    expect(dataGbPerDay(120, 0.05)).toBeCloseTo(64.8, 6)
  })
})

describe('evaluateDesign', () => {
  it('Phase 1 acceptance: adding an instrument moves mass, power, data and cost at once', () => {
    const before = evalD(ew.baseDesign)
    const after = evalD({ ...ew.baseDesign, instruments: [{ id: 'multispectral', duty: 0.05 }] })
    expect(after.mass.wetKg).toBeGreaterThan(before.mass.wetKg)
    expect(after.power.avgLoadW).toBeGreaterThan(before.power.avgLoadW)
    expect(after.data.generatedGbDay).toBeGreaterThan(before.data.generatedGbDay)
    expect(after.cost.totalM).toBeGreaterThan(before.cost.totalM)
    expect(after.science.perYear).toBeGreaterThan(before.science.perYear)
  })

  it('is pure and deterministic (same input → same output, input untouched)', () => {
    const d = structuredClone(ewSmallsat)
    const a = evalD(d)
    const b = evalD(d)
    expect(a).toEqual(b)
    expect(d).toEqual(ewSmallsat)
  })

  it('empty base designs explain what is missing instead of crashing', () => {
    const r = evalD(ew.baseDesign)
    expect(r.canLaunch).toBe(false)
    expect(r.review[0].code).toBe('NO_PAYLOAD')
  })

  it('absurd design (radar + hi-res + weather imager on the Light launcher) gives a clear blocking error, no NaN', () => {
    const r = evalD({
      ...ew.baseDesign,
      instruments: [
        { id: 'sar', duty: 0.03 },
        { id: 'hires_camera', duty: 0.02 },
        { id: 'weather_imager', duty: 0.3 },
      ],
    })
    const codes = r.review.map((x) => x.code)
    expect(codes).toContain('MASS_OVER_CAPACITY')
    expect(codes).toContain('POINTING_INSUFFICIENT')
    expect(r.canLaunch).toBe(false)
    expect(Number.isNaN(r.mass.wetKg)).toBe(false)
    expect(Number.isNaN(r.cost.totalM)).toBe(false)
  })

  it('handles garbage inputs (NaN area, negative duty, unknown-free duplicates) without NaN', () => {
    const r = evalD({
      ...ew.baseDesign,
      arrayAreaM2: Number.NaN,
      designLifeYears: -3,
      instruments: [
        { id: 'multispectral', duty: -1 },
        { id: 'multispectral', duty: 2 },
      ],
    })
    expect(r.mass.items.filter((i) => i.label === 'Multispectral Imager')).toHaveLength(1)
    expect(Number.isNaN(r.power.avgLoadW)).toBe(false)
    expect(Number.isNaN(r.life.lifeYears)).toBe(false)
  })

  it('data bottleneck explains the problem with levers', () => {
    const r = evalD({ ...ew.baseDesign, instruments: [{ id: 'multispectral', duty: 0.05 }] })
    const item = r.review.find((x) => x.code === 'DATA_BOTTLENECK')
    expect(item).toBeDefined()
    expect(MESSAGES.DATA_BOTTLENECK(item!.params).levers!.length).toBeGreaterThanOrEqual(3)
  })

  it('magnetorquers do not work at the Moon; ordinary stations cannot hear it', () => {
    const codes = evalD({ ...lpChemical, adcsId: 'magnetorquers', stationIds: ['mid_north'] }).review.map((x) => x.code)
    expect(codes).toContain('MAGNETORQUERS_NO_FIELD')
    expect(codes).toContain('NO_DEEP_STATION')
  })

  it('reaching lunar orbit needs propulsion', () => {
    const codes = evalD({ ...lpChemical, propulsionId: 'none' }).review.map((x) => x.code)
    expect(codes).toContain('NO_PROPULSION_INSERTION')
  })

  it('dawn-dusk orbit removes eclipses but penalises optical science', () => {
    const sso = evalD(ewSmallsat)
    const dd = evalD({ ...ewSmallsat, orbitId: 'sso_dd' })
    expect(dd.power.eclipseFraction).toBe(0)
    expect(dd.power.dodNominal).toBe(0)
    expect(dd.science.perYear).toBeLessThan(sso.science.perYear)
    expect(dd.review.map((x) => x.code)).toContain('LOW_SUN_OPTICAL')
  })

  it('every review code has an explanation', () => {
    for (const d of [ew.baseDesign, lp.baseDesign, ewSmallsat, ewHyper, lpElectric, lpChemical]) {
      for (const item of evalD(d).review) expect(MESSAGES[item.code], item.code).toBeDefined()
    }
  })
})

describe('scenarios have several winning designs (no single optimum)', () => {
  it.each([
    ['Earth Watch — small multispectral sat', ewSmallsat],
    ['Earth Watch — hyperspectral, hydrazine, polar + Andean stations', ewHyper],
    ['Lunar Pathfinder — electric propulsion', lpElectric],
    ['Lunar Pathfinder — hydrazine', lpChemical],
  ])('%s meets all requirements with no blocking issues', (_name, d) => {
    const { failed, blocking } = mustPass(d)
    expect(blocking).toEqual([])
    expect(failed).toEqual([])
  })

  it('the two winning designs per scenario are genuinely different', () => {
    expect(evalD(ewSmallsat).mass.wetKg).not.toBeCloseTo(evalD(ewHyper).mass.wetKg, 0)
    expect(evalD(lpElectric).mass.propellantKg).toBeLessThan(evalD(lpChemical).mass.propellantKg / 2)
  })

  it('all scenarios have base designs that evaluate', () => {
    for (const s of scenarios) expect(() => evaluateDesign(s.baseDesign, s)).not.toThrow()
  })
})
