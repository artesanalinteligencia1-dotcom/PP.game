import { describe, expect, it } from 'vitest'
import en from '../src/i18n/strings/en.json'
import { translateMsg } from '../src/i18n'
import { msgEn, type Msg } from '../src/engine/text'
import { CONTRACTS, contractStatus, newCampaign } from '../src/engine/campaign'
import { getOrbit, launchers } from '../src/engine/catalog/components'
import { ROUTES, getRoute, marsCruiseDays } from '../src/engine/catalog/routes'
import { getScenario } from '../src/engine/catalog/scenarios'
import { evaluateDesign } from '../src/engine/evaluate'
import {
  MARS,
  MARS_DELAY_MAX,
  MARS_DELAY_MIN,
  MARS_WINDOW_EVERY_MONTHS,
  areostationaryAltitudeKm,
  conjunctionDays,
  departurePhaseDeg,
  earthMarsDistanceAu,
  hohmannArrivalVInfKms,
  hohmannDays,
  marsCaptureDv,
  marsDelayMin,
  nextWindowMonth,
  synodicDays,
  transferView,
} from '../src/engine/mars'
import { orbitalPeriodMin } from '../src/engine/orbit'
import { TARGET_DV } from '../src/engine/rocket'
import { scoreMission } from '../src/engine/score'
import { advanceWeek, botChoice, createMission, decide, simulateMission, type MissionState } from '../src/engine/simulate'
import type { Design } from '../src/engine/types'

const scenario = getScenario('mars_orbiter')
const design = (over: Partial<Design> = {}): Design => ({
  ...scenario.baseDesign,
  instruments: [{ id: 'neutron_spectrometer', duty: 1 }, { id: 'ir_spectrometer', duty: 0.05 }],
  bandId: 'kaband',
  ...over,
})

describe('Mars: orbits, windows and radio delay', () => {
  it('launch windows repeat every synodic period, about 26 months', () => {
    expect(synodicDays()).toBeCloseTo(779.9, 0)
    expect(MARS_WINDOW_EVERY_MONTHS).toBe(25.6)
  })

  it('a minimum-energy trip takes about 8.5 months and needs Mars 44 degrees ahead', () => {
    expect(hohmannDays()).toBeGreaterThan(255)
    expect(hohmannDays()).toBeLessThan(262)
    expect(departurePhaseDeg()).toBeCloseTo(44.3, 0)
  })

  it('the radio delay goes from about 4 to 21 minutes one way', () => {
    expect(MARS_DELAY_MIN).toBeCloseTo(4.36, 1)
    expect(MARS_DELAY_MAX).toBeCloseTo(20.99, 1)
    expect(earthMarsDistanceAu(0)).toBeCloseTo(MARS.orbitAu - 1, 9)
    expect(earthMarsDistanceAu(180)).toBeCloseTo(MARS.orbitAu + 1, 9)
    expect(marsDelayMin(hohmannDays())).toBeCloseTo(13.3, 0)
    // the delay keeps growing until the conjunction, about 16 months after launch
    const [first, second] = conjunctionDays(2)
    expect(first).toBeCloseTo(486, 0)
    expect(second - first).toBeCloseTo(synodicDays(), 6)
    expect(marsDelayMin(first)).toBeCloseTo(MARS_DELAY_MAX, 6)
  })

  it('the next window is the first one the spacecraft is ready for', () => {
    const w = { firstMonth: 30, everyMonths: 25.6 }
    expect(nextWindowMonth(21, w)).toBe(30)
    expect(nextWindowMonth(30, w)).toBe(30)
    expect(nextWindowMonth(30.1, w)).toBeCloseTo(55.6, 9)
    expect(nextWindowMonth(60, w)).toBeCloseTo(81.2, 9)
  })

  it('the spacecraft leaves from Earth and meets Mars', () => {
    const start = transferView(0)
    expect(start.craft[0]).toBeCloseTo(1, 6)
    expect(start.craft[1]).toBeCloseTo(0, 6)
    for (const cruise of [hohmannDays(), 213]) {
      const end = transferView(cruise - 1e-6, cruise)
      expect(Math.hypot(end.craft[0] - end.mars[0], end.craft[1] - end.mars[1])).toBeLessThan(1e-3)
    }
  })

  it('catalog braking burns agree with the capture formula', () => {
    const v = hohmannArrivalVInfKms()
    expect(v).toBeCloseTo(2.65, 1)
    const near = (catalog: number, physics: number) => expect(Math.abs(catalog - physics) / physics).toBeLessThan(0.05)
    near(getRoute('mars_low', 'hohmann')!.insertionDv, marsCaptureDv(v, 400))
    near(getRoute('mars_low', 'fast')!.insertionDv, marsCaptureDv(3.5, 400))
    near(getRoute('mars_areo', 'hohmann')!.insertionDv, marsCaptureDv(v, 400, 17030, true))
    near(getRoute('mars_areo', 'fast')!.insertionDv, marsCaptureDv(3.5, 400, 17030, true))
    // aerobraking: only the capture into a long ellipse is paid with propellant
    expect(getRoute('mars_low', 'aerobrake')!.insertionDv).toBeLessThan(0.5 * getRoute('mars_low', 'hohmann')!.insertionDv)
    expect(marsCaptureDv(v, 300, 44000)).toBeLessThan(getRoute('mars_low', 'aerobrake')!.insertionDv)
    expect(marsCruiseDays(getRoute('mars_low', 'aerobrake')!)).toBeCloseTo(marsCruiseDays(getRoute('mars_low', 'hohmann')!), 6)
  })

  it('the areostationary orbit turns once per sol', () => {
    const areo = getOrbit('mars_areo')
    expect(Math.abs(areostationaryAltitudeKm() - areo.defaultAltitudeKm)).toBeLessThan(50)
    expect(orbitalPeriodMin(areo, areo.defaultAltitudeKm) / (MARS.solHours * 60)).toBeCloseTo(1, 2)
    expect(orbitalPeriodMin(getOrbit('mars_low'), 400)).toBeGreaterThan(110)
    expect(orbitalPeriodMin(getOrbit('mars_low'), 400)).toBeLessThan(125)
  })

  it('every launcher lifts less towards Mars than towards the Moon', () => {
    for (const l of launchers) expect(l.capacityKg.tmi).toBeLessThanOrEqual(l.capacityKg.tli)
    expect(TARGET_DV.tmi).toBeGreaterThan(TARGET_DV.tli)
    for (const id of Object.keys(ROUTES).filter((k) => k.startsWith('mars'))) expect(getOrbit(id).launchTarget).toBe('tmi')
  })
})

describe('Mars: the launch window in a design', () => {
  it('a simple spacecraft is ready early and takes the first window', () => {
    const r = evaluateDesign(design(), scenario)
    expect(r.canLaunch).toBe(true)
    expect(r.schedule.launchMonth).toBe(30)
    expect(r.schedule.windowWaitMonths).toBeCloseTo(30 - r.schedule.devMonths, 9)
    expect(r.schedule.arrivalDelayMin).toBeCloseTo(13.3, 0)
    expect(r.review.map((i) => i.code)).not.toContain('MARS_WINDOW_MISSED')
    expect(r.requirements.find((q) => q.id === 'mo_bonus_window')?.met).toBe(true)
  })

  it('an immature instrument makes it miss the window: 26 months of waiting, paid for', () => {
    const late = design({ instruments: [{ id: 'neutron_spectrometer', duty: 1 }, { id: 'hires_camera', duty: 0.02 }], arrayAreaM2: 9 })
    const r = evaluateDesign(late, scenario)
    expect(r.schedule.devMonths).toBeGreaterThan(30)
    expect(r.schedule.launchMonth).toBeCloseTo(55.6, 9)
    expect(r.review.map((i) => i.code)).toContain('MARS_WINDOW_MISSED')
    expect(r.review.map((i) => i.code)).not.toContain('LATE')
    expect(r.requirements.find((q) => q.id === 'mo_bonus_window')?.met).toBe(false)
    // the same spacecraft with an open calendar costs less: the wait keeps half the operations team on the payroll
    const free = evaluateDesign(late, { ...scenario, launchWindow: undefined })
    expect(free.schedule.launchMonth).toBeUndefined()
    expect(r.cost.opsM - free.cost.opsM).toBeCloseTo(r.schedule.windowWaitMonths! * 0.6 * 0.5, 6)
  })

  it('a thin margin before the window is flagged', () => {
    const tight = design({ instruments: [{ id: 'neutron_spectrometer', duty: 1 }, { id: 'ir_spectrometer', duty: 0.05 }, { id: 'thermal_ir', duty: 0.1 }], arrayAreaM2: 9 })
    const r = evaluateDesign(tight, scenario)
    expect(r.schedule.windowWaitMonths).toBeLessThan(3)
    expect(r.review.map((i) => i.code)).toContain('MARS_WINDOW_TIGHT')
  })

  it('aerobraking trades propellant for time', () => {
    const direct = evaluateDesign(design(), scenario)
    const aero = evaluateDesign(design({ routeId: 'aerobrake' }), scenario)
    expect(aero.mass.wetKg).toBeLessThan(0.75 * direct.mass.wetKg)
    expect(aero.schedule.transferMonths - direct.schedule.transferMonths).toBe(5)
    expect(aero.requirements.find((q) => q.id === 'mo_bonus_dv')?.met).toBe(true)
    expect(direct.requirements.find((q) => q.id === 'mo_bonus_dv')?.met).toBe(false)
  })

  it('other scenarios have no launch window', () => {
    const ew = getScenario('earth_watch')
    const r = evaluateDesign(ew.baseDesign, ew)
    expect(r.schedule.launchMonth).toBeUndefined()
    expect(r.schedule.arrivalDelayMin).toBeUndefined()
  })
})

describe('Mars: the flight', () => {
  const fly = (d: Design, seed: number, personality: 'prudent' | 'bold' | 'balanced' = 'balanced') => simulateMission(d, scenario, seed, personality)

  it('is deterministic and a sound design usually succeeds', () => {
    expect(scoreMission(fly(design(), 7), scenario).total).toBe(scoreMission(fly(design(), 7), scenario).total)
    const ranks = Array.from({ length: 40 }, (_, i) => scoreMission(fly(design(), i + 1), scenario).rank)
    expect(ranks.filter((r) => r === 'Success' || r === 'Outstanding').length).toBeGreaterThanOrEqual(30)
  })

  it('the solar conjunction cuts the link and asks for a decision', () => {
    const flown = Array.from({ length: 12 }, (_, i) => fly(design(), i + 1)).filter((m) => m.endReason === 'completed')
    expect(flown.length).toBeGreaterThan(6)
    for (const m of flown) {
      const c = m.decisions.filter((d) => d.eventId === 'conjunction')
      expect(c.length).toBe(1) // one conjunction in a two-year mission
      expect(m.log.some((l) => l.msg.key === 'sim.mars.capture')).toBe(true)
    }
  })

  it('a slip longer than the margin moves the launch to the next window', () => {
    const tight = design({ instruments: [{ id: 'neutron_spectrometer', duty: 1 }, { id: 'ir_spectrometer', duty: 0.05 }, { id: 'thermal_ir', duty: 0.1 }], arrayAreaM2: 9 })
    const margin = evaluateDesign(tight, scenario).schedule.windowWaitMonths!
    const all = Array.from({ length: 60 }, (_, i) => fly(tight, i + 1)).filter((m) => m.endReason !== 'launch_failure')
    const missed = all.filter((m) => m.launchDelayMonths > margin)
    const held = all.filter((m) => m.launchDelayMonths > 0 && m.launchDelayMonths <= margin)
    expect(missed.length).toBeGreaterThan(0)
    for (const m of missed) {
      expect(m.log.some((l) => l.msg.key === 'sim.mars.windowMissed')).toBe(true)
      const score = scoreMission(m, scenario)
      expect(score.lines.find((l) => l.key === 'schedule')?.points).toBe(0)
      expect(score.requirements.find((q) => q.id === 'mo_bonus_window')?.met).toBe(false)
    }
    for (const m of held) expect(m.log.some((l) => l.msg.key === 'sim.mars.windowHeld')).toBe(true)
    const onTime = all.find((m) => m.launchDelayMonths === 0)!
    expect(scoreMission(onTime, scenario).lines.find((l) => l.key === 'schedule')?.points).toBeGreaterThan(0)
  })

  it('aerobraking can meet a dust storm; raising the orbit costs three weeks', () => {
    const aero = design({ routeId: 'aerobrake' })
    const planned = Math.round((13.5 * 52) / 12)
    const storms = Array.from({ length: 30 }, (_, i) => fly(aero, i + 1, 'prudent')).filter((m) => m.decisions.some((d) => d.eventId === 'aerobrake_storm'))
    expect(storms.length).toBeGreaterThan(5)
    expect(storms.length).toBeLessThan(30)
    for (const m of storms) expect(m.transferWeeks).toBe(planned + 3)
    const direct = Array.from({ length: 30 }, (_, i) => fly(design(), i + 1))
    expect(direct.some((m) => m.decisions.some((d) => d.eventId === 'aerobrake_storm'))).toBe(false)
  })

  it('every message of a Mars flight has its text in both languages', () => {
    const msgs: Msg[] = []
    const take = (s: MissionState) => { if (s.pending) msgs.push(s.pending.title, s.pending.text, ...s.pending.options.flatMap((o) => [o.label, o.hint])) }
    for (let seed = 1; seed <= 40; seed++) {
      for (const personality of ['bold', 'prudent'] as const) {
        const s = createMission(design({ routeId: seed % 2 ? 'aerobrake' : 'hohmann', obcId: seed % 3 ? 'radhard' : 'basic' }), scenario, seed)
        for (let w = 0; w < 400 && s.phase !== 'ended'; w++) {
          take(s)
          if (s.pending) decide(s, botChoice(s.pending, personality), seed % 2 === 0)
          else advanceWeek(s)
        }
        msgs.push(...s.log.map((l) => l.msg))
      }
    }
    const keys = new Set(msgs.map((m) => m.key))
    for (const k of ['sim.conjunction.title', 'sim.aerobrake.title', 'sim.mars.capture', 'sim.do.aerobrake.raise', 'sim.do.conjunction.record']) expect(keys.has(k), k).toBe(true)
    const E = en as Record<string, string>
    for (const m of msgs) {
      expect(E[m.key], m.key).toBeDefined()
      expect(msgEn(m), m.key).not.toMatch(/\{\w+\}/)
      expect(translateMsg('es', m), m.key).not.toMatch(/\{\w+\}/)
    }
  })
})

describe('Mars: the career', () => {
  it('Red Horizon opens Act 3 after the Moon, with enough prestige', () => {
    const c = CONTRACTS.find((k) => k.id === 'mars_orbiter')!
    expect(c.act).toBe(3)
    expect(getScenario(c.scenarioId!).launchWindow?.firstMonth).toBe(30)
    const fresh = newCampaign({ name: 'Test', title: 'Dr.', level: 'researcher' })
    expect(contractStatus(fresh, c)).toBe('locked')
    const moon = { ...fresh, prestige: 300, completed: { lunar_pathfinder: { best: 700, rank: 'Success' as const, seed: 1, runs: 1 } } }
    expect(contractStatus(moon, c)).toBe('available')
    expect(contractStatus({ ...moon, prestige: 299 }, c)).toBe('locked')
  })
})
