import { describe, expect, it } from 'vitest'
import en from '../src/i18n/strings/en.json'
import es from '../src/i18n/strings/es.json'
import { translate, translateMsg } from '../src/i18n'
import { msgEn, type Msg } from '../src/engine/text'
import { INVESTORS, TECH, CONTRACTS } from '../src/engine/campaign'
import { botChoice, createMission, advanceWeek, decide, type MissionState } from '../src/engine/simulate'
import { getScenario, scenarios } from '../src/engine/catalog/scenarios'
import { ROUTES } from '../src/engine/catalog/routes'
import { BOOSTERS, FAIRINGS, ROCKET_ENGINES, ROCKET_TANKS } from '../src/engine/catalog/rocketParts'
import { ROCKET_ISSUE_CODES } from '../src/engine/rocket'
import { INTRO_SEGMENTS, buildCues, cueAt } from '../src/i18n/introCaptions'

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
const tables: Record<string, Record<string, string>> = { es }

describe('i18n tables', () => {
  for (const [lang, table] of Object.entries(tables)) {
    it(`${lang} has every English key, and no extra ones`, () => {
      expect(Object.keys(en).filter((k) => !(k in table))).toEqual([])
      expect(Object.keys(table).filter((k) => !(k in en))).toEqual([])
    })
    it(`${lang} keeps every {placeholder} of the English text`, () => {
      const bad = Object.entries(en).filter(([k, v]) => k in table && placeholders(v).join() !== placeholders(table[k]).join())
      expect(bad.map(([k]) => k)).toEqual([])
    })
    it(`${lang} has no empty strings`, () => {
      expect(Object.entries(table).filter(([, v]) => !v.trim()).map(([k]) => k)).toEqual([])
    })
  }

  it('catalog text in en.json is the same as the engine English', () => {
    const E = en as Record<string, string>
    const bad: string[] = []
    const same = (k: string, v?: string) => { if (v && E[k] !== v) bad.push(k) }
    for (const s of scenarios) {
      for (const f of ['name', 'tagline', 'objective', 'whyItMatters'] as const) same(`scenario.${s.id}.${f}`, s[f])
      same(`scenario.${s.id}.opportunity.title`, s.opportunity?.title)
      same(`scenario.${s.id}.opportunity.text`, s.opportunity?.text)
    }
    for (const [orbit, list] of Object.entries(ROUTES)) for (const r of list) for (const f of ['name', 'description', 'realWorld'] as const) same(`route.${orbit}.${r.id}.${f}`, r[f])
    for (const c of CONTRACTS) { same(`contract.${c.id}.title`, c.title); same(`contract.${c.id}.blurb`, c.blurb); same(`contract.${c.id}.note`, c.note) }
    for (const c of TECH) { same(`tech.${c.id}.name`, c.name); same(`tech.${c.id}.description`, c.description) }
    for (const [id, c] of Object.entries(INVESTORS)) { same(`investor.${id}.name`, c.name); same(`investor.${id}.wants`, c.wants) }
    expect(bad).toEqual([])
  })

  it('rocket parts in en.json match the engine English, and every rocket review code has its text', () => {
    const E = en as Record<string, string>
    const parts = [...ROCKET_ENGINES, ...ROCKET_TANKS, ...BOOSTERS, ...FAIRINGS]
    expect(parts.filter((p) => E[`rocketPart.${p.id}.name`] !== p.name).map((p) => p.id)).toEqual([])
    expect([...ROCKET_ENGINES, ...BOOSTERS].filter((p) => E[`rocketPart.${p.id}.description`] !== p.description).map((p) => p.id)).toEqual([])
    expect(ROCKET_ISSUE_CODES.filter((c) => !E[`rocket.issue.${c}.title`] || !E[`rocket.issue.${c}.why`])).toEqual([])
  })

  it('every message a mission emits has a key and no unfilled placeholder, in both languages', () => {
    const msgs: Msg[] = []
    const take = (s: MissionState) => { if (s.pending) msgs.push(s.pending.title, s.pending.text, ...s.pending.options.flatMap((o) => [o.label, o.hint])) }
    const ew = getScenario('earth_watch')
    for (let seed = 1; seed <= 150; seed++) {
      for (const personality of ['bold', 'prudent'] as const) {
        const design = { ...ew.baseDesign, instruments: [{ id: 'multispectral', duty: 0.05 }], stationIds: ['mid_north', 'arctic'] }
        const s = createMission(design, ew, seed)
        for (let w = 0; w < 200 && s.phase !== 'ended'; w++) {
          take(s)
          if (s.pending) decide(s, botChoice(s.pending, personality), seed % 2 === 0)
          else advanceWeek(s)
        }
        msgs.push(...s.log.map((l) => l.msg))
      }
    }
    expect(msgs.length).toBeGreaterThan(500)
    const E = en as Record<string, string>
    for (const m of msgs) {
      expect(E[m.key], m.key).toBeDefined()
      expect(msgEn(m), m.key).not.toMatch(/\{\w+\}/)
      expect(translateMsg('es', m), m.key).not.toMatch(/\{\w+\}/)
    }
  })

  it('fills placeholders and falls back to English', () => {
    expect(translate('es', 'settings.saved', { file: 'a.json' })).toBe('Guardado: a.json')
    expect(translate('en', 'settings.install', { game: 'Paulet' })).toBe('Install Paulet')
  })
})

describe('intro captions', () => {
  const texts = INTRO_SEGMENTS.map((_, i) => (es as Record<string, string>)[`intro.caption.${i}`])
  it('cues are short, ordered and do not overlap', () => {
    const cues = buildCues(texts)
    expect(cues.every((c) => c.words.length <= 4 && c.end > c.start)).toBe(true)
    for (let i = 1; i < cues.length; i++) expect(cues[i].start).toBeGreaterThanOrEqual(cues[i - 1].end)
  })
  it('keeps every word of the translation and finds the cue at a given time', () => {
    const cues = buildCues(texts)
    expect(cues.flatMap((c) => c.words.map((w) => w.word)).join(' ')).toBe(texts.join(' '))
    expect(cueAt(cues, 0)).toBeNull()
    expect(cueAt(cues, cues[0].start + 0.01)?.words[0].word).toBe('Arequipa,')
  })
})
