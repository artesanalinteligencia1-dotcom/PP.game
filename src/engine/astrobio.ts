// Astrobiologist pad: choose a world, instruments and an observation plan; see which lines of evidence you can gather
// for the three questions of astrobiology (water, habitability, biosignatures) and whether the data fits the downlink.
// Pure and deterministic. Values are simplified game values (0..1 scores); the reasoning is the real one. docs/model.md §21.
import { dataGbPerDay } from './budget'
import { instruments as INSTRUMENTS } from './catalog/components'

export const EVIDENCE_LINES = ['hydrogen', 'minerals', 'ice', 'ocean', 'heat', 'organics', 'radiation', 'gases', 'pigments'] as const
export type EvidenceLine = (typeof EVIDENCE_LINES)[number]
export type AstroQuestion = 'water' | 'habitability' | 'biosignature'

/** Which question each line of evidence answers first. */
export const LINE_QUESTION: Record<EvidenceLine, AstroQuestion> = {
  hydrogen: 'water',
  minerals: 'water',
  ice: 'water',
  ocean: 'water',
  heat: 'habitability',
  organics: 'habitability',
  radiation: 'habitability',
  gases: 'biosignature',
  pigments: 'biosignature',
}

/** How well each instrument measures each line of evidence (0..1). Instruments not listed give context only. */
export const INSTRUMENT_SENSITIVITY: Record<string, Partial<Record<EvidenceLine, number>>> = {
  neutron_spectrometer: { hydrogen: 0.9 },
  ir_spectrometer: { minerals: 0.8, gases: 0.7, organics: 0.6, ice: 0.4 },
  hyperspectral: { pigments: 0.8, minerals: 0.7, organics: 0.4 },
  multispectral: { pigments: 0.6, ice: 0.3 },
  thermal_ir: { heat: 0.85, ice: 0.5 },
  mw_radiometer: { ice: 0.5, ocean: 0.3 },
  magnetometer: { ocean: 0.8 },
  laser_altimeter: { ocean: 0.5, ice: 0.3 },
  particle_detector: { radiation: 0.9 },
  sar: { ice: 0.6, ocean: 0.3 },
  ir_telescope: { gases: 0.8, organics: 0.3 },
}

export interface AstroTarget {
  id: string
  /** How much of each signal is there to be found, from what is known today (0 = none expected, 1 = plain to see). */
  presence: Record<EvidenceLine, number>
  /** A typical downlink from there (Gb/day): the farther the world, the thinner the link. */
  downlinkGbDay: number
}

const world = (id: string, downlinkGbDay: number, p: number[]): AstroTarget => ({
  id,
  downlinkGbDay,
  presence: Object.fromEntries(EVIDENCE_LINES.map((l, i) => [l, p[i]])) as Record<EvidenceLine, number>,
})

//                                                        hydr  min   ice   ocean heat  org   rad   gases pigm
export const ASTRO_TARGETS: AstroTarget[] = [
  world('earth', 200, /*                                */ [1, 1, 1, 0, 1, 1, 0.3, 1, 1]),
  world('moon_poles', 100, /*                           */ [0.8, 0.2, 0.7, 0, 0, 0.1, 1, 0, 0]),
  world('mars', 40, /*                                  */ [0.8, 0.9, 0.8, 0.1, 0.1, 0.4, 1, 0.3, 0]),
  world('europa', 15, /*                                */ [0.3, 0.7, 1, 0.95, 0.5, 0.3, 1, 0.1, 0]),
  world('enceladus', 10, /*                           */ [0.3, 0.5, 1, 0.9, 0.8, 0.7, 0.5, 0.4, 0]),
  world('titan', 10, /*                               */ [0.3, 0.2, 0.6, 0.6, 0.2, 1, 0.3, 0.8, 0]),
]
export const getAstroTarget = (id: string) => ASTRO_TARGETS.find((t) => t.id === id)

export interface AstroPlan {
  targetId: string
  instruments: { id: string; duty: number }[]
  downlinkGbDay: number
}

export const ASTRO_ISSUE_CODES = [
  'ASTRO_NO_INSTRUMENTS',
  'ASTRO_DATA_OVER_DOWNLINK',
  'ASTRO_INSTRUMENT_NO_SIGNAL',
  'ASTRO_WATER_UNCHECKED',
  'ASTRO_OCEAN_MISSED',
  'ASTRO_BIOSIGNATURE_SINGLE_LINE',
  'ASTRO_BIOSIGNATURE_NO_CONTEXT',
] as const
export type AstroIssueCode = (typeof ASTRO_ISSUE_CODES)[number]
export interface AstroIssue {
  code: AstroIssueCode
  severity: 'error' | 'warn'
  params: Record<string, string | number>
}

export interface LineReport {
  line: EvidenceLine
  /** how well your instruments and plan can measure it, whatever is there (0..1) */
  coverage: number
  /** what is expected to be there */
  presence: number
  /** coverage × presence: the chance of a clear finding */
  detection: number
  /** the instrument that contributes most, if any */
  best: string | null
}

export interface AstroReport {
  lines: LineReport[]
  questions: Record<AstroQuestion, number>
  dataGbDay: number
  /** share of the data that reaches the ground (1 = all of it) */
  delivered: number
  massKg: number
  powerW: number
  costM: number
  issues: AstroIssue[]
}

/** A line counts as covered from here on (and as a clear finding when its detection passes 0.5). */
export const COVERED = 0.25
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const any = (xs: number[]) => 1 - xs.reduce((p, x) => p * (1 - x), 1)

export function analyzeAstro(plan: AstroPlan): AstroReport {
  const target = getAstroTarget(plan.targetId) ?? ASTRO_TARGETS[0]
  const chosen = plan.instruments.flatMap((sel) => {
    const inst = INSTRUMENTS.find((i) => i.id === sel.id)
    return inst ? [{ inst, duty: clamp01(sel.duty) }] : []
  })
  const dataGbDay = chosen.reduce((t, c) => t + dataGbPerDay(c.inst.dataRateMbps, c.duty), 0)
  const delivered = dataGbDay > 0 ? Math.min(1, Math.max(0, plan.downlinkGbDay) / dataGbDay) : 1
  // observing time has diminishing returns; data that never reaches the ground is worth nothing
  const quality = (c: (typeof chosen)[number]) => Math.min(1, Math.sqrt(c.duty / c.inst.defaultDuty)) * delivered

  const lines: LineReport[] = EVIDENCE_LINES.map((line) => {
    const parts = chosen.map((c) => ({ id: c.inst.id, v: (INSTRUMENT_SENSITIVITY[c.inst.id]?.[line] ?? 0) * quality(c) }))
    const coverage = any(parts.map((p) => p.v))
    const top = parts.reduce<{ id: string; v: number } | null>((b, p) => (p.v > (b?.v ?? 0) ? p : b), null)
    return { line, coverage, presence: target.presence[line], detection: coverage * target.presence[line], best: top?.id ?? null }
  })
  const det = (l: EvidenceLine) => lines.find((x) => x.line === l)!.detection
  const cov = (l: EvidenceLine) => lines.find((x) => x.line === l)!.coverage

  // Water: any one clear line is enough. Habitability: water, an energy source and carbon chemistry, plus knowing the
  // radiation. Biosignatures: independent lines, and only believable on a world shown to be habitable.
  const water = any((['hydrogen', 'minerals', 'ice', 'ocean'] as const).map(det))
  const habitability = 0.3 * water + 0.3 * det('heat') + 0.3 * det('organics') + 0.1 * det('radiation')
  const bioLines = (['gases', 'pigments'] as const).filter((l) => cov(l) >= COVERED)
  const [strong, weak] = [Math.max(det('gases'), det('pigments')), Math.min(det('gases'), det('pigments'))]
  const biosignature = (0.4 * strong + 0.6 * weak) * (0.5 + 0.5 * habitability)

  const issues: AstroIssue[] = []
  const add = (code: AstroIssueCode, severity: AstroIssue['severity'], params: AstroIssue['params'] = {}) => issues.push({ code, severity, params })
  if (chosen.length === 0) add('ASTRO_NO_INSTRUMENTS', 'error')
  else {
    if (delivered < 0.999) add('ASTRO_DATA_OVER_DOWNLINK', 'warn', { data: Math.round(dataGbDay * 10) / 10, downlink: plan.downlinkGbDay, lost: Math.round((1 - delivered) * 100) })
    for (const c of chosen) {
      const s = INSTRUMENT_SENSITIVITY[c.inst.id] ?? {}
      const useful = Math.max(0, ...EVIDENCE_LINES.map((l) => (s[l] ?? 0) * target.presence[l]))
      if (useful < 0.3) add('ASTRO_INSTRUMENT_NO_SIGNAL', 'warn', { instrument: c.inst.name })
    }
    if (water < COVERED) add('ASTRO_WATER_UNCHECKED', 'warn')
    if (target.presence.ocean >= 0.5 && cov('ocean') < COVERED) add('ASTRO_OCEAN_MISSED', 'warn')
    if (bioLines.length === 1) add('ASTRO_BIOSIGNATURE_SINGLE_LINE', 'warn')
    if (bioLines.length > 0 && habitability < 0.3) add('ASTRO_BIOSIGNATURE_NO_CONTEXT', 'warn')
  }

  return {
    lines,
    questions: { water, habitability, biosignature },
    dataGbDay,
    delivered,
    massKg: chosen.reduce((t, c) => t + c.inst.massKg, 0),
    powerW: chosen.reduce((t, c) => t + c.inst.powerW * c.duty, 0),
    costM: chosen.reduce((t, c) => t + c.inst.costM, 0),
    issues,
  }
}

/** Instruments the lab offers: the ones that measure at least one line of evidence. */
export const ASTRO_INSTRUMENT_IDS = INSTRUMENTS.filter((i) => INSTRUMENT_SENSITIVITY[i.id]).map((i) => i.id)

export const DEFAULT_ASTRO_PLAN: AstroPlan = { targetId: 'mars', instruments: [{ id: 'neutron_spectrometer', duty: 1 }], downlinkGbDay: 40 }

/** For data read back from storage. */
export function isAstroPlan(x: unknown): x is AstroPlan {
  const p = x as AstroPlan
  return (
    !!p &&
    !!getAstroTarget(p.targetId) &&
    Array.isArray(p.instruments) &&
    p.instruments.every((i) => ASTRO_INSTRUMENT_IDS.includes(i?.id) && typeof i.duty === 'number' && i.duty >= 0 && i.duty <= 1) &&
    typeof p.downlinkGbDay === 'number' &&
    p.downlinkGbDay >= 0
  )
}

/** Toggle an instrument in the plan (added at its default observing time). */
export function toggleAstroInstrument(plan: AstroPlan, id: string): AstroPlan {
  if (plan.instruments.some((i) => i.id === id)) return { ...plan, instruments: plan.instruments.filter((i) => i.id !== id) }
  const inst = INSTRUMENTS.find((i) => i.id === id)
  return inst && ASTRO_INSTRUMENT_IDS.includes(id) ? { ...plan, instruments: [...plan.instruments, { id, duty: inst.defaultDuty }] } : plan
}
