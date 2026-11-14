import { describe, expect, it } from 'vitest'
import en from '../src/i18n/strings/en.json'
import es from '../src/i18n/strings/es.json'
import { translateMsg } from '../src/i18n'
import { MESSAGES } from '../src/i18n/en'
import { msgEn, type Msg } from '../src/engine/text'
import { CONTRACTS, contractStatus, newCampaign } from '../src/engine/campaign'
import { getOrbit } from '../src/engine/catalog/components'
import { getScenario } from '../src/engine/catalog/scenarios'
import {
  AEROSHELLS,
  DEFAULT_LANDING,
  DESCENT_SYSTEMS,
  EDL_ISSUE_CODES,
  PARACHUTES,
  UNGUIDED_ELLIPSE_KM,
  analyzeEdl,
  betaMax,
  marsAirDensity,
  marsEscapeKms,
  terminalVelocityMs,
  type LandingDesign,
} from '../src/engine/edl'
import { evaluateDesign } from '../src/engine/evaluate'
import { analyseMission } from '../src/engine/report'
import { scoreMission } from '../src/engine/score'
import { advanceWeek, botChoice, createMission, decide, simulateMission, type MissionState } from '../src/engine/simulate'
import type { Design } from '../src/engine/types'

const scenario = getScenario('mars_stranded')
const land = (over: Partial<LandingDesign> = {}): LandingDesign => ({ ...DEFAULT_LANDING, guided: true, ...over })
const design = (over: Partial<Design> = {}): Design => ({ ...scenario.baseDesign, landing: land(), ...over })

describe('entry, descent and landing: the physics', () => {
  it('the air thins with elevation, and with it the mass a shield can stop', () => {
    expect(marsAirDensity(0)).toBeCloseTo(0.02, 9)
    expect(marsAirDensity(-4)).toBeGreaterThan(marsAirDensity(2))
    expect(betaMax(-2)).toBeCloseTo(150, 9)
    expect(betaMax(2)).toBeLessThan(betaMax(-4))
  })

  it('a bigger parachute or a lighter load falls slower', () => {
    const v = terminalVelocityMs(800, 16, -2)
    expect(v).toBeGreaterThan(40)
    expect(v).toBeLessThan(70)
    expect(terminalVelocityMs(800, 21.5, -2)).toBeLessThan(v)
    expect(terminalVelocityMs(400, 16, -2)).toBeCloseTo(v / Math.SQRT2, 6)
    expect(terminalVelocityMs(800, 16, 2)).toBeGreaterThan(v)
  })

  it('the budget adds up from the ground to the launch pad', () => {
    const e = analyzeEdl(land(), 600)
    expect(e.entryKg).toBeCloseTo(e.landedKg + e.descentHardwareKg + e.descentPropellantKg + e.chuteKg + e.guidanceKg + e.shellKg, 6)
    expect(e.launchKg).toBeCloseTo(e.entryKg + e.cruiseStageKg, 6)
    expect(e.landedFraction).toBeGreaterThan(0.35)
    expect(e.landedFraction).toBeLessThan(0.6)
    expect(e.issues).toEqual([])
  })

  it('is close to real landers', () => {
    // Curiosity: a 899 kg rover, sky crane, 4.5 m shell, 21.5 m parachute: 3 300 kg at entry, 3 840 kg at launch
    const msl = analyzeEdl({ shellId: 'shell_l', chuteId: 'chute_l', descentId: 'skycrane', guided: true }, 899, { elevationKm: -4.4 })
    expect(msl.entryKg).toBeGreaterThan(2400)
    expect(msl.entryKg).toBeLessThan(3600)
    expect(msl.issues.filter((i) => i.severity === 'error')).toEqual([])
    // Phoenix: about 350 kg landed on legs behind a 2.65 m shell: 570 kg at entry, 670 kg at launch
    const phoenix = analyzeEdl({ shellId: 'shell_s', chuteId: 'chute_s', descentId: 'legs', guided: false }, 350, { elevationKm: -4.1 })
    expect(phoenix.entryKg).toBeGreaterThan(500)
    expect(phoenix.entryKg).toBeLessThan(800)
    expect(phoenix.ellipseKm).toBe(UNGUIDED_ELLIPSE_KM)
    expect(marsEscapeKms()).toBeCloseTo(5.03, 1)
  })

  it('a heavy capsule needs a wider shell; a faster entry needs a heavier one', () => {
    const small = analyzeEdl(land(), 880)
    expect(small.issues.map((i) => i.code)).toContain('EDL_SHELL_TOO_SMALL')
    const wide = analyzeEdl(land({ shellId: 'shell_m' }), 880)
    expect(wide.issues.map((i) => i.code)).not.toContain('EDL_SHELL_TOO_SMALL')
    expect(wide.beta).toBeLessThan(small.beta)
    expect(analyzeEdl(land(), 600, { entrySpeedKms: 6.1 }).shellKg).toBeGreaterThan(analyzeEdl(land(), 600, { entrySpeedKms: 5.7 }).shellKg)
    // the same capsule that works on the low plains fails in the highlands
    const edge = analyzeEdl(land(), 690, { elevationKm: -2 })
    expect(edge.issues.filter((i) => i.severity === 'error')).toEqual([])
    expect(analyzeEdl(land(), 690, { elevationKm: 3 }).issues.map((i) => i.code)).toContain('EDL_SHELL_TOO_SMALL')
  })

  it('each landing system has its limit', () => {
    expect(analyzeEdl(land({ descentId: 'airbags' }), 600).issues.map((i) => i.code)).toContain('EDL_DESCENT_LIMIT')
    expect(analyzeEdl(land({ descentId: 'airbags' }), 500).issues).toEqual([])
    expect(analyzeEdl(land({ descentId: 'airbags', chuteId: 'chute_s', shellId: 'shell_m' }), 540).issues.map((i) => i.code)).toContain('EDL_CHUTE_TOO_SMALL')
    // the sky crane is the heaviest and the most precise
    const crane = analyzeEdl(land({ descentId: 'skycrane', shellId: 'shell_l', chuteId: 'chute_l' }), 600)
    const legs = analyzeEdl(land({ shellId: 'shell_l', chuteId: 'chute_l' }), 600)
    expect(crane.launchKg).toBeGreaterThan(1.3 * legs.launchKg)
    expect(crane.ellipseKm).toBeLessThan(legs.ellipseKm)
    expect(analyzeEdl(land({ guided: false }), 600).ellipseKm).toBe(100)
  })
})

describe('landing in a design', () => {
  it('the surface needs no braking burn, and the launch mass is the landing budget', () => {
    const r = evaluateDesign(design(), scenario)
    expect(getOrbit('mars_surface').surface).toBe(true)
    expect(r.edl).toBeDefined()
    expect(r.mass.totalDv).toBe(0)
    expect(r.mass.wetKg).toBeCloseTo(r.edl!.launchKg, 6)
    expect(r.edl!.landedKg).toBeCloseTo(r.mass.dryKg, 6)
    expect(r.canLaunch).toBe(true)
    expect(r.requirements.find((q) => q.id === 'st_ellipse')?.met).toBe(true)
    expect(r.requirements.find((q) => q.id === 'st_arrival')?.met).toBe(true)
    expect(r.power.eclipseFraction).toBe(0.5) // twelve-hour nights
    expect(r.risk.successProbability).toBeLessThan(r.risk.launchReliability * r.edl!.reliability)
  })

  it('the base design lands too far away until the entry is guided', () => {
    const r = evaluateDesign(scenario.baseDesign, scenario)
    expect(r.review.map((i) => i.code)).toContain('EDL_ELLIPSE_WIDE')
    expect(r.requirements.find((q) => q.id === 'st_ellipse')?.met).toBe(false)
    const guided = evaluateDesign(design(), scenario)
    expect(guided.schedule.devMonths - r.schedule.devMonths).toBeCloseTo(2, 6)
    expect(guided.cost.busM - r.cost.busM).toBeCloseTo(10, 6)
  })

  it('the sky crane lands closest but takes longest to build', () => {
    const crane = evaluateDesign(design({ landing: land({ descentId: 'skycrane', shellId: 'shell_m', chuteId: 'chute_l' }) }), scenario)
    const legs = evaluateDesign(design(), scenario)
    expect(crane.requirements.find((q) => q.id === 'st_bonus_ellipse')?.met).toBe(true)
    expect(legs.requirements.find((q) => q.id === 'st_bonus_ellipse')?.met).toBe(false)
    expect(crane.schedule.windowWaitMonths!).toBeLessThan(legs.schedule.windowWaitMonths!)
    expect(crane.schedule.launchMonth).toBe(25)
  })

  it('more cargo needs the wider shell', () => {
    const r = evaluateDesign(design({ cargoKg: 500 }), scenario)
    expect(r.canLaunch).toBe(false)
    expect(r.review.filter((i) => i.blocking).map((i) => i.code)).toEqual(['EDL_SHELL_TOO_SMALL'])
    expect(evaluateDesign(design({ cargoKg: 500, landing: land({ shellId: 'shell_m', chuteId: 'chute_l' }) }), scenario).canLaunch).toBe(true)
  })

  it('orbits have no landing budget', () => {
    const orbiter = getScenario('mars_orbiter')
    expect(evaluateDesign(orbiter.baseDesign, orbiter).edl).toBeUndefined()
  })
})

describe('landing in flight', () => {
  const flights = Array.from({ length: 80 }, (_, i) => simulateMission(design(), scenario, i + 1))

  it('some landers are lost, and a lost lander delivers nothing', () => {
    const crashed = flights.filter((m) => m.endReason === 'landing_failure')
    const landed = flights.filter((m) => m.log.some((l) => l.msg.key === 'sim.edl.landed'))
    expect(crashed.length).toBeGreaterThan(2)
    expect(crashed.length).toBeLessThan(20)
    expect(landed.length).toBeGreaterThan(55)
    for (const m of crashed) {
      const score = scoreMission(m, scenario)
      expect(score.rank).toBe('Fail')
      expect(score.lines.find((l) => l.key === 'science')?.points).toBe(0)
      expect(analyseMission(m, score, scenario).causes.map((c) => c.code)).toContain('CAUSE_LANDING_FAILURE')
    }
  })

  it('a landing in time, close enough, with the cargo, is a success', () => {
    const good = flights.filter((m) => m.endReason === 'completed' && m.launchDelayMonths <= evaluateDesign(design(), scenario).schedule.windowWaitMonths!)
    expect(good.length).toBeGreaterThan(40)
    for (const m of good) expect(['Success', 'Outstanding']).toContain(scoreMission(m, scenario).rank)
  })

  it('a dust storm before entry is a decision; ignoring it costs landing odds', () => {
    const storms = Array.from({ length: 80 }, (_, i) => simulateMission(design(), scenario, i + 1, 'bold')).filter((m) => m.decisions.some((d) => d.eventId === 'landing_storm'))
    expect(storms.length).toBeGreaterThan(10)
    for (const m of storms) expect(m.landingFactor).toBe(0.9)
    const careful = flights.filter((m) => m.decisions.some((d) => d.eventId === 'landing_storm'))
    for (const m of careful) {
      expect(m.landingFactor).toBeUndefined()
      expect(m.extraCostM).toBeGreaterThanOrEqual(2)
    }
  })

  it('every message of a landing has its text in both languages', () => {
    const msgs: Msg[] = []
    const take = (s: MissionState) => { if (s.pending) msgs.push(s.pending.title, s.pending.text, ...s.pending.options.flatMap((o) => [o.label, o.hint])) }
    for (let seed = 1; seed <= 60; seed++) {
      const s = createMission(design({ routeId: seed % 2 ? 'fast' : 'hohmann' }), scenario, seed)
      for (let w = 0; w < 200 && s.phase !== 'ended'; w++) {
        take(s)
        if (s.pending) decide(s, botChoice(s.pending, seed % 3 ? 'prudent' : 'bold'), seed % 2 === 0)
        else advanceWeek(s)
      }
      msgs.push(...s.log.map((l) => l.msg))
    }
    const keys = new Set(msgs.map((m) => m.key))
    for (const k of ['sim.edl.entry', 'sim.edl.landed', 'sim.edl.crash', 'sim.landingStorm.title', 'sim.do.landingStorm.update', 'sim.do.landingStorm.proceed']) expect(keys.has(k), k).toBe(true)
    const E = en as Record<string, string>
    for (const m of msgs) {
      expect(E[m.key], m.key).toBeDefined()
      expect(msgEn(m), m.key).not.toMatch(/\{\w+\}/)
      expect(translateMsg('es', m), m.key).not.toMatch(/\{\w+\}/)
    }
  })
})

describe('landing: texts and career', () => {
  it('landing parts in en.json match the engine English, and every code has its text', () => {
    const E = en as Record<string, string>
    const S = es as Record<string, string>
    for (const x of AEROSHELLS) { expect(E[`edl.shell.${x.id}.name`]).toBe(x.name); expect(E[`edl.shell.${x.id}.realWorld`]).toBe(x.realWorld) }
    for (const x of PARACHUTES) expect(E[`edl.chute.${x.id}.name`]).toBe(x.name)
    for (const x of DESCENT_SYSTEMS) for (const f of ['name', 'description', 'realWorld'] as const) { expect(E[`edl.descent.${x.id}.${f}`]).toBe(x[f]); expect(S[`edl.descent.${x.id}.${f}`]).toBeTruthy() }
    for (const code of [...EDL_ISSUE_CODES, 'EDL_ELLIPSE_WIDE', 'MARS_WINDOW_MISSED', 'MARS_WINDOW_TIGHT']) {
      expect(E[`review.msg.${code}.title`], code).toBeTruthy()
      expect(MESSAGES[code], code).toBeTypeOf('function')
    }
    const issue = analyzeEdl(land({ descentId: 'airbags' }), 700).issues.find((i) => i.code === 'EDL_DESCENT_LIMIT')!
    expect(MESSAGES.EDL_DESCENT_LIMIT(issue.params).why).toBe('You want to set down 700 kg. Airbags can land 550 kg at most.')
  })

  it('Stranded is playable after Red Horizon', () => {
    const c = CONTRACTS.find((k) => k.id === 'mars_stranded')!
    expect(c.kind).toBe('orbital')
    expect(c.scenarioId).toBe('mars_stranded')
    const fresh = newCampaign({ name: 'Test', title: 'Dr.', level: 'researcher' })
    expect(contractStatus(fresh, c)).toBe('locked')
    const ready = { ...fresh, prestige: 400, completed: { mars_orbiter: { best: 800, rank: 'Success' as const, seed: 1, runs: 1 } } }
    expect(contractStatus(ready, c)).toBe('available')
    expect(CONTRACTS.find((k) => k.id === 'mars_terraform')!.kind).toBe('preview')
  })
})
