import { describe, expect, it } from 'vitest'
import {
  ASTRO_INSTRUMENT_IDS,
  ASTRO_ISSUE_CODES,
  ASTRO_TARGETS,
  DEFAULT_ASTRO_PLAN,
  EVIDENCE_LINES,
  INSTRUMENT_SENSITIVITY,
  analyzeAstro,
  isAstroPlan,
  toggleAstroInstrument,
  type AstroPlan,
} from '../src/engine/astrobio'
import { instruments } from '../src/engine/catalog'
import en from '../src/i18n/strings/en.json'

const plan = (targetId: string, ids: string[], downlinkGbDay = 1000): AstroPlan => ({
  targetId,
  downlinkGbDay,
  instruments: ids.map((id) => ({ id, duty: instruments.find((i) => i.id === id)!.defaultDuty })),
})
const line = (p: AstroPlan, l: string) => analyzeAstro(p).lines.find((x) => x.line === l)!
const codes = (p: AstroPlan) => analyzeAstro(p).issues.map((i) => i.code)

describe('astrobiology lab', () => {
  it('the tables are consistent with the instrument catalog', () => {
    for (const id of Object.keys(INSTRUMENT_SENSITIVITY)) expect(instruments.some((i) => i.id === id)).toBe(true)
    for (const s of Object.values(INSTRUMENT_SENSITIVITY)) for (const v of Object.values(s)) expect(v > 0 && v <= 1).toBe(true)
    for (const t of ASTRO_TARGETS) for (const l of EVIDENCE_LINES) expect(t.presence[l] >= 0 && t.presence[l] <= 1).toBe(true)
    // every line of evidence can be measured by something
    for (const l of EVIDENCE_LINES) expect(Object.values(INSTRUMENT_SENSITIVITY).some((s) => (s[l] ?? 0) >= 0.5)).toBe(true)
    // the farther the world, the thinner the link
    const link = (id: string) => ASTRO_TARGETS.find((t) => t.id === id)!.downlinkGbDay
    expect(link('earth')).toBeGreaterThan(link('mars'))
    expect(link('mars')).toBeGreaterThan(link('europa'))
  })

  it('a neutron spectrometer finds hydrogen at the lunar poles, and a magnetometer the ocean under Europa', () => {
    expect(line(plan('moon_poles', ['neutron_spectrometer']), 'hydrogen').detection).toBeGreaterThan(0.5)
    expect(analyzeAstro(plan('moon_poles', ['neutron_spectrometer'])).questions.water).toBeGreaterThan(0.5)
    const europa = plan('europa', ['magnetometer'])
    expect(line(europa, 'ocean')).toMatchObject({ best: 'magnetometer' })
    expect(line(europa, 'ocean').detection).toBeGreaterThan(0.7)
    // the same magnetometer finds no hidden ocean on Mars: nothing is expected there
    expect(line(plan('mars', ['magnetometer']), 'ocean').detection).toBeLessThan(0.1)
    expect(codes(plan('mars', ['magnetometer']))).toContain('ASTRO_INSTRUMENT_NO_SIGNAL')
  })

  it('habitability needs water, energy and chemistry together', () => {
    const waterOnly = analyzeAstro(plan('enceladus', ['mw_radiometer', 'magnetometer']))
    const full = analyzeAstro(plan('enceladus', ['mw_radiometer', 'magnetometer', 'thermal_ir', 'ir_spectrometer']))
    expect(waterOnly.questions.water).toBeGreaterThan(0.7)
    expect(waterOnly.questions.habitability).toBeLessThan(0.35)
    expect(full.questions.habitability).toBeGreaterThan(waterOnly.questions.habitability + 0.25)
  })

  it('a biosignature claim needs two independent lines and a habitable context', () => {
    const one = plan('earth', ['ir_spectrometer'])
    const two = plan('earth', ['ir_spectrometer', 'hyperspectral', 'thermal_ir'])
    expect(codes(one)).toContain('ASTRO_BIOSIGNATURE_SINGLE_LINE')
    expect(codes(two)).not.toContain('ASTRO_BIOSIGNATURE_SINGLE_LINE')
    expect(analyzeAstro(two).questions.biosignature).toBeGreaterThan(analyzeAstro(one).questions.biosignature * 1.5)
    expect(analyzeAstro(two).questions.biosignature).toBeGreaterThan(0.6)
    // gases alone on a world not shown to be habitable
    expect(codes(plan('titan', ['ir_telescope']))).toEqual(expect.arrayContaining(['ASTRO_BIOSIGNATURE_SINGLE_LINE', 'ASTRO_BIOSIGNATURE_NO_CONTEXT']))
    // beyond Earth nothing known scores as a clear biosignature
    for (const t of ASTRO_TARGETS.filter((x) => x.id !== 'earth')) expect(analyzeAstro(plan(t.id, ASTRO_INSTRUMENT_IDS)).questions.biosignature).toBeLessThan(0.5)
  })

  it('data that does not fit the downlink is lost, and so is its science', () => {
    const fits = analyzeAstro(plan('mars', ['hyperspectral', 'ir_spectrometer'], 1000))
    const starved = analyzeAstro(plan('mars', ['hyperspectral', 'ir_spectrometer'], fits.dataGbDay / 4))
    expect(fits.delivered).toBe(1)
    expect(starved.delivered).toBeCloseTo(0.25, 6)
    expect(starved.questions.water).toBeLessThan(fits.questions.water)
    expect(starved.issues.find((i) => i.code === 'ASTRO_DATA_OVER_DOWNLINK')?.params.lost).toBe(75)
    // a low-rate instrument is the way out on a thin link
    expect(analyzeAstro(plan('europa', ['magnetometer', 'neutron_spectrometer'], 15)).delivered).toBe(1)
  })

  it('more observing time helps, with diminishing returns', () => {
    const at = (duty: number) => analyzeAstro({ targetId: 'mars', downlinkGbDay: 1000, instruments: [{ id: 'ir_spectrometer', duty }] }).lines.find((l) => l.line === 'minerals')!.coverage
    expect(at(0.0125)).toBeCloseTo(at(0.05) / 2, 6)
    expect(at(0.2)).toBe(at(0.05))
  })

  it('flags the empty plan, the unchecked water and the missed ocean', () => {
    expect(codes(plan('mars', []))).toEqual(['ASTRO_NO_INSTRUMENTS'])
    expect(codes(plan('europa', ['particle_detector']))).toEqual(expect.arrayContaining(['ASTRO_WATER_UNCHECKED', 'ASTRO_OCEAN_MISSED']))
    expect(codes(plan('europa', ['magnetometer', 'particle_detector']))).toEqual([])
  })

  it('is deterministic, totals the payload and edits the plan', () => {
    const p = plan('mars', ['neutron_spectrometer', 'thermal_ir'])
    expect(analyzeAstro(p)).toEqual(analyzeAstro(p))
    expect(analyzeAstro(p).massKg).toBe(50)
    expect(analyzeAstro(p).costM).toBe(24)
    expect(isAstroPlan(DEFAULT_ASTRO_PLAN)).toBe(true)
    expect(isAstroPlan({ ...p, targetId: 'pluto' })).toBe(false)
    expect(isAstroPlan({ ...p, instruments: [{ id: 'pan_camera', duty: 0.1 }] })).toBe(false)
    const added = toggleAstroInstrument(p, 'magnetometer')
    expect(added.instruments.map((i) => i.id)).toEqual(['neutron_spectrometer', 'thermal_ir', 'magnetometer'])
    expect(toggleAstroInstrument(added, 'magnetometer')).toEqual(p)
    expect(toggleAstroInstrument(p, 'pan_camera')).toEqual(p)
  })

  it('every world, line, lab instrument and review code has its text', () => {
    const E = en as Record<string, string>
    const need = [
      ...ASTRO_TARGETS.flatMap((t) => [`astro.target.${t.id}.name`, `astro.target.${t.id}.blurb`, `astro.target.${t.id}.real`]),
      ...EVIDENCE_LINES.flatMap((l) => [`astro.line.${l}.name`, `astro.line.${l}.what`]),
      ...ASTRO_INSTRUMENT_IDS.map((id) => `astro.why.${id}`),
      ...ASTRO_ISSUE_CODES.flatMap((c) => [`astro.issue.${c}.title`, `astro.issue.${c}.why`]),
    ]
    expect(need.filter((k) => !E[k])).toEqual([])
  })
})
