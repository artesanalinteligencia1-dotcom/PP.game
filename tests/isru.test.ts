import { describe, expect, it } from 'vitest'
import en from '../src/i18n/strings/en.json'
import { translateMsg } from '../src/i18n'
import { MESSAGES } from '../src/i18n/en'
import { msgEn, type Msg } from '../src/engine/text'
import { CONTRACTS, contractStatus, newCampaign } from '../src/engine/campaign'
import { getScenario } from '../src/engine/catalog/scenarios'
import { evaluateDesign } from '../src/engine/evaluate'
import { CO2_PER_O2, MOXIE, OXYGEN_UNIT, SOLS_PER_YEAR, SOL_HOURS, analyzeOxygen } from '../src/engine/isru'
import { analyseMission } from '../src/engine/report'
import { scoreMission } from '../src/engine/score'
import { advanceWeek, botChoice, createMission, decide, simulateMission, type MissionState } from '../src/engine/simulate'
import type { Design } from '../src/engine/types'

const scenario = getScenario('mars_oxygen')
const design = (over: Partial<Design> = {}): Design => ({ ...scenario.baseDesign, oxygen: { units: 3, hoursPerSol: 12 }, arrayAreaM2: 20, ...over })

describe('oxygen plant: the budget', () => {
  it('production follows units and hours; the chemistry needs 2.75 kg of CO2 per kg of O2', () => {
    const o = analyzeOxygen({ units: 2, hoursPerSol: 10 })
    expect(o.kgPerSol).toBeCloseTo(2 * OXYGEN_UNIT.kgPerHour * 10, 9)
    expect(o.kgPerYear).toBeCloseTo(o.kgPerSol * SOLS_PER_YEAR, 9)
    expect(analyzeOxygen({ units: 4, hoursPerSol: 10 }).kgPerSol).toBeCloseTo(2 * o.kgPerSol, 9)
    expect(CO2_PER_O2).toBeCloseTo(2.75, 2)
    expect(o.co2KgPerSol).toBeCloseTo((o.kgPerSol * CO2_PER_O2) / 0.5, 9)
    expect(o.airM3PerSol).toBeGreaterThan(100) // thin air: hundreds of cubic metres for less than a kilogram
    expect(o.paybackSols).toBeCloseTo(100 / o.kgPerSol, 6)
    expect(SOLS_PER_YEAR).toBeCloseTo(355.5, 0)
  })

  it('uses less energy per kilogram than the MOXIE experiment did', () => {
    const o = analyzeOxygen({ units: 1, hoursPerSol: 10 })
    expect(o.kWhPerKg).toBeCloseTo(12.5, 6)
    expect(o.kWhPerKg).toBeLessThan(MOXIE.powerW / 1000 / MOXIE.kgPerHour)
  })

  it('it runs by day first: only the hours after dark come from the battery', () => {
    const day = analyzeOxygen({ units: 2, hoursPerSol: 12 })
    expect(day.nightHours).toBe(0)
    expect(day.nightEnergyWh).toBe(0)
    expect(day.arrayNeedW).toBeCloseTo(day.avgW, 9)
    const late = analyzeOxygen({ units: 2, hoursPerSol: 16 })
    expect(late.nightHours).toBeCloseTo(16 - SOL_HOURS / 2, 9)
    expect(late.nightEnergyWh).toBeCloseTo(1000 * late.nightHours, 6)
    expect(late.arrayNeedW).toBeGreaterThan(late.avgW) // battery losses
    expect(analyzeOxygen({ units: 99, hoursPerSol: 99 }).units).toBe(8)
    expect(analyzeOxygen({ units: 2, hoursPerSol: 99 }).hoursPerSol).toBeCloseTo(SOL_HOURS, 9)
  })
})

describe('oxygen plant in a design', () => {
  it('the base design falls just short; a bigger plant with more array makes it', () => {
    const base = evaluateDesign(scenario.baseDesign, scenario)
    expect(base.canLaunch).toBe(true)
    expect(base.oxygen!.plannedKg).toBeGreaterThan(250)
    expect(base.requirements.find((q) => q.id === 'ox_made')?.met).toBe(false)
    const r = evaluateDesign(design(), scenario)
    expect(r.canLaunch).toBe(true)
    expect(r.requirements.find((q) => q.id === 'ox_made')?.met).toBe(true)
    expect(r.oxygen!.plannedKg).toBeCloseTo(r.oxygen!.kgPerSol * SOLS_PER_YEAR, 6)
    expect(r.mass.items.find((i) => i.label === 'Oxygen plant')?.kg).toBe(150)
    expect(r.edl!.landedKg).toBeGreaterThan(evaluateDesign(design({ oxygen: { units: 1, hoursPerSol: 12 } }), scenario).edl!.landedKg + 100)
    expect(r.review.map((i) => i.code)).not.toContain('NO_PAYLOAD')
  })

  it('the plant is the biggest load: the arrays must be sized for it', () => {
    const r = evaluateDesign(design(), scenario)
    expect(r.power.avgLoadW).toBeGreaterThan(700)
    expect(r.power.requiredAvgW).toBeGreaterThan(r.oxygen!.avgW)
    const small = evaluateDesign(design({ arrayAreaM2: 8 }), scenario)
    expect(small.review.map((i) => i.code)).toContain('POWER_NEGATIVE')
    expect(small.oxygen!.plannedKg).toBeLessThan(r.oxygen!.plannedKg)
  })

  it('running into the night needs more battery than exists', () => {
    const r = evaluateDesign(design({ oxygen: { units: 3, hoursPerSol: 18 }, arrayAreaM2: 36 }), scenario)
    const codes = r.review.map((i) => i.code)
    expect(codes).toContain('OXYGEN_NIGHT_RUN')
    expect(codes).toContain('BATTERY_DEPLETED')
    expect(r.canLaunch).toBe(false)
    const item = r.review.find((i) => i.code === 'OXYGEN_NIGHT_RUN')!
    expect(MESSAGES.OXYGEN_NIGHT_RUN(item.params).why).toMatch(/5\.7 h after sunset.*8\.5 kWh every night.*4\.0 kWh/)
    expect(evaluateDesign(design(), scenario).power.dodNominal).toBeLessThan(0.6)
  })

  it('there is no air to work in orbit', () => {
    const orbiter = getScenario('mars_orbiter')
    const r = evaluateDesign({ ...orbiter.baseDesign, oxygen: { units: 1, hoursPerSol: 5 } }, orbiter)
    expect(r.review.filter((i) => i.blocking).map((i) => i.code)).toContain('OXYGEN_NEEDS_SURFACE')
    expect(evaluateDesign(orbiter.baseDesign, orbiter).oxygen).toBeUndefined()
    expect(evaluateDesign(orbiter.baseDesign, orbiter).power.requiredAvgW).toBeUndefined()
  })
})

describe('oxygen plant in flight', () => {
  const flights = Array.from({ length: 60 }, (_, i) => simulateMission(design(), scenario, i + 1))
  const done = flights.filter((m) => m.endReason === 'completed')

  it('makes a little less than planned: dust and storms', () => {
    const planned = evaluateDesign(design(), scenario).oxygen!.plannedKg
    expect(done.length).toBeGreaterThan(45)
    for (const m of done) {
      expect(m.oxygenKg!).toBeGreaterThan(0.7 * planned)
      expect(m.oxygenKg!).toBeLessThanOrEqual(planned * 1.001)
      expect(['Success', 'Outstanding']).toContain(scoreMission(m, scenario).rank)
    }
    const score = scoreMission(done[0], scenario)
    expect(score.lines.find((l) => l.key === 'science')?.label).toBe('Oxygen made')
    expect(score.requirements.find((q) => q.id === 'ox_made')?.actual).toBeCloseTo(done[0].oxygenKg!, 9)
  })

  it('a lander lost on the way makes nothing', () => {
    const lost = flights.filter((m) => m.endReason === 'launch_failure' || m.endReason === 'landing_failure')
    expect(lost.length).toBeGreaterThan(0)
    for (const m of lost) {
      expect(m.oxygenKg ?? 0).toBe(0)
      expect(scoreMission(m, scenario).rank).toBe('Fail')
    }
  })

  it('a plant sized exactly for the requirement comes up short, and the report says why', () => {
    const exact = { ...scenario.baseDesign, oxygen: { units: 2, hoursPerSol: 10.6 } }
    expect(evaluateDesign(exact, scenario).requirements.find((q) => q.id === 'ox_made')?.met).toBe(true)
    const short = Array.from({ length: 30 }, (_, i) => simulateMission(exact, scenario, i + 1)).filter((m) => m.endReason === 'completed' && m.oxygenKg! < 300)
    expect(short.length).toBeGreaterThan(10)
    const score = scoreMission(short[0], scenario)
    expect(score.rank).toBe('Partial')
    expect(analyseMission(short[0], score, scenario).causes.map((c) => c.code)).toContain('CAUSE_LOW_OXYGEN')
  })

  it('dust storms and cleaning gusts happen on the surface, with text in both languages', () => {
    const msgs: Msg[] = []
    const take = (s: MissionState) => { if (s.pending) msgs.push(s.pending.title, s.pending.text, ...s.pending.options.flatMap((o) => [o.label, o.hint])) }
    for (let seed = 1; seed <= 60; seed++) {
      const s = createMission(design({ designLifeYears: 2, arrayAreaM2: 30 }), scenario, seed)
      for (let w = 0; w < 300 && s.phase !== 'ended'; w++) {
        take(s)
        if (s.pending) decide(s, botChoice(s.pending, seed % 2 ? 'prudent' : 'bold'), seed % 2 === 0)
        else advanceWeek(s)
      }
      msgs.push(...s.log.map((l) => l.msg))
    }
    const keys = new Set(msgs.map((m) => m.key))
    for (const k of ['sim.dustStorm.title', 'sim.do.dustStorm.throttle', 'sim.do.dustStorm.drained', 'sim.do.dustStorm.lucky', 'sim.gust']) expect(keys.has(k), k).toBe(true)
    const E = en as Record<string, string>
    for (const m of msgs) {
      expect(E[m.key], m.key).toBeDefined()
      expect(msgEn(m), m.key).not.toMatch(/\{\w+\}/)
      expect(translateMsg('es', m), m.key).not.toMatch(/\{\w+\}/)
    }
    // orbiters never see them
    const orbiter = getScenario('mars_orbiter')
    const o = simulateMission({ ...orbiter.baseDesign, instruments: [{ id: 'neutron_spectrometer', duty: 1 }] }, orbiter, 3)
    expect(o.log.some((l) => l.msg.key === 'sim.gust')).toBe(false)
    expect(o.oxygenKg).toBeUndefined()
  })
})

describe('oxygen plant: the career', () => {
  it('Breathing Mars is playable after Stranded', () => {
    const c = CONTRACTS.find((k) => k.id === 'mars_oxygen')!
    expect(c.kind).toBe('orbital')
    expect(getScenario(c.scenarioId!).scoring).toBe('oxygen')
    const fresh = newCampaign({ name: 'Test', title: 'Dr.', level: 'researcher' })
    expect(contractStatus(fresh, c)).toBe('locked')
    const ready = { ...fresh, prestige: 500, completed: { mars_stranded: { best: 800, rank: 'Success' as const, seed: 1, runs: 1 } } }
    expect(contractStatus(ready, c)).toBe('available')
  })
})
