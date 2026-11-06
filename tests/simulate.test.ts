import { describe, expect, it } from 'vitest'
import {
  advanceWeek,
  analyseMission,
  botChoice,
  createMission,
  decide,
  getScenario,
  mulberry32,
  plateau,
  rngNext,
  scoreMission,
  simulateMission,
  type Design,
} from '../src/engine'
import { CAUSE_TEXT } from '../src/i18n/en'

const ew = getScenario('earth_watch')
const lp = getScenario('lunar_pathfinder')

const ewSmallsat: Design = { ...ew.baseDesign, instruments: [{ id: 'multispectral', duty: 0.05 }], stationIds: ['mid_north', 'arctic'] }
const ewHyper: Design = {
  ...ew.baseDesign,
  instruments: [{ id: 'hyperspectral', duty: 0.03 }],
  arrayAreaM2: 0.8,
  compressionId: 'lossless',
  stationIds: ['arctic', 'andes'],
  obcId: 'highperf',
  propulsionId: 'hydrazine',
}
const ewBottleneck: Design = { ...ew.baseDesign, instruments: [{ id: 'multispectral', duty: 0.05 }] }
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

const SEEDS = Array.from({ length: 30 }, (_, i) => 1000 + i * 7919)

describe('rng', () => {
  it('rngNext reproduces mulberry32 exactly', () => {
    const g = mulberry32(12345)
    let s = 12345
    for (let i = 0; i < 5; i++) {
      const [v, next] = rngNext(s)
      expect(v).toBe(g())
      s = next
    }
  })
})

describe('simulateMission — determinism (Phase 2 acceptance)', () => {
  it('same design + same seed = identical result, event log and series', () => {
    const a = simulateMission(ewSmallsat, ew, 424242)
    const b = simulateMission(ewSmallsat, ew, 424242)
    expect(b.log).toEqual(a.log)
    expect(b.series).toEqual(a.series)
    expect(scoreMission(b, ew)).toEqual(scoreMission(a, ew))
  })

  it('different seeds give different missions', () => {
    const logs = new Set(SEEDS.slice(0, 10).map((seed) => JSON.stringify(simulateMission(ewSmallsat, ew, seed).log)))
    expect(logs.size).toBeGreaterThan(5)
  })

  it('a replay with the same human decisions gives the same result', () => {
    const play = (choices: string[]) => {
      const s = createMission(lpChemical, lp, 77)
      const made: string[] = []
      let i = 0
      let guard = 0
      while (s.phase !== 'ended' && guard++ < 2000) {
        if (s.pending) {
          const opt = choices[i++] ?? s.pending.options[s.pending.options.length - 1].id
          made.push(opt)
          decide(s, opt)
        } else advanceWeek(s)
      }
      return { s, made }
    }
    const first = play([])
    const second = play(first.made)
    expect(second.s.log).toEqual(first.s.log)
    expect(scoreMission(second.s, lp).total).toBe(scoreMission(first.s, lp).total)
  })

  it('does not mutate the input design', () => {
    const d = structuredClone(lpElectric)
    simulateMission(d, lp, 5)
    expect(d).toEqual(lpElectric)
  })
})

describe('outcomes', () => {
  const rate = (d: Design, sc = ew) => {
    const ranks = SEEDS.map((seed) => scoreMission(simulateMission(d, sc, seed), sc).rank)
    return ranks.filter((r) => r === 'Success' || r === 'Outstanding').length / ranks.length
  }

  it('≥ 2 different designs can win the same scenario (Earth Watch)', () => {
    expect(rate(ewSmallsat)).toBeGreaterThan(0.8)
    expect(rate(ewHyper)).toBeGreaterThan(0.8)
  })

  it('≥ 2 different designs can win Lunar Pathfinder (electric vs hydrazine)', () => {
    expect(rate(lpElectric, lp)).toBeGreaterThan(0.75)
    expect(rate(lpChemical, lp)).toBeGreaterThan(0.75)
  })

  it('a data-bottlenecked design scores lower on average than the fixed one', () => {
    const avg = (d: Design) => SEEDS.reduce((t, seed) => t + scoreMission(simulateMission(d, ew, seed), ew).total, 0) / SEEDS.length
    expect(avg(ewBottleneck)).toBeLessThan(avg(ewSmallsat) - 30)
  })

  it('scores stay within 0–1000 and lunar missions complete their year', () => {
    for (const seed of SEEDS) {
      const s = simulateMission(lpElectric, lp, seed)
      const sc = scoreMission(s, lp)
      expect(sc.total).toBeGreaterThanOrEqual(0)
      expect(sc.total).toBeLessThanOrEqual(1000)
      if (s.endReason !== 'launch_failure' && s.endReason !== 'collision' && s.endReason !== 'eclipse') expect(s.endReason).toBe('completed')
    }
  })

  it('a launch failure ends the mission immediately with rank Fail', () => {
    const failed = SEEDS.concat(Array.from({ length: 200 }, (_, i) => i)).map((seed) => simulateMission(ewSmallsat, ew, seed)).find((s) => s.endReason === 'launch_failure')
    expect(failed).toBeDefined()
    expect(failed!.opsWeeks).toBe(0)
    expect(scoreMission(failed!, ew).rank).toBe('Fail')
  })

  it('a non-hardened computer around the Moon dies of radiation in a long mission', () => {
    const s = simulateMission({ ...lpChemical, obcId: 'basic', designLifeYears: 3 }, lp, 9)
    expect(['radiation', 'launch_failure']).toContain(s.endReason)
  })
})

describe('bots and analysis', () => {
  it('bot personalities pick safe / best / bold options', () => {
    const p = {
      eventId: 'x',
      week: 1,
      role: 'engineer' as const,
      title: '',
      text: '',
      options: [
        { id: 'a', label: '', hint: '', quality: 'ok' as const, safe: true },
        { id: 'b', label: '', hint: '', quality: 'good' as const },
        { id: 'c', label: '', hint: '', quality: 'poor' as const, bold: true },
      ],
    }
    expect(botChoice(p, 'prudent')).toBe('a')
    expect(botChoice(p, 'balanced')).toBe('b')
    expect(botChoice(p, 'bold')).toBe('c')
  })

  it('post-mission analysis gives ≤ 3 explained causes', () => {
    for (const seed of SEEDS.slice(0, 10)) {
      const s = simulateMission(ewBottleneck, ew, seed)
      const a = analyseMission(s, scoreMission(s, ew), ew)
      expect(a.causes.length).toBeGreaterThan(0)
      expect(a.causes.length).toBeLessThanOrEqual(3)
      for (const c of a.causes) expect(CAUSE_TEXT[c.code], c.code).toBeDefined()
    }
  })

  it('plateau scoring rewards healthy margins over thin or bloated ones', () => {
    expect(plateau(0.2, 0, 0.15, 0.35, 0.9, 0.4)).toBe(1)
    expect(plateau(0.05, 0, 0.15, 0.35, 0.9, 0.4)).toBeLessThan(1)
    expect(plateau(0.85, 0, 0.15, 0.35, 0.9, 0.4)).toBeLessThan(1)
    expect(plateau(-0.1, 0, 0.15, 0.35, 0.9, 0.4)).toBe(0)
  })
})
