import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import en from '../src/i18n/strings/en.json'
import es from '../src/i18n/strings/es.json'
import { getScenario } from '../src/engine/catalog/scenarios'
import { evaluateDesign } from '../src/engine/evaluate'
import { analyseMission } from '../src/engine/report'
import { scoreMission } from '../src/engine/score'
import { simulateMission } from '../src/engine/simulate'
import { useGuide } from '../src/store/guide'
import { DEFAULT_SETTINGS } from '../src/store/settings'
import { TUTORIAL, designHints, designMood, orderedIssues, resultsLines, resultsMood, tabFor } from '../src/ui/guide/lines'
import { GUIDE_MOODS, Kuntur } from '../src/ui/guide/robots'

describe('Kuntur, the robot guide', () => {
  it('draws every face, moving or still, talking or not', () => {
    for (const mood of GUIDE_MOODS)
      for (const still of [false, true])
        for (const talking of [false, true]) {
          const svg = renderToStaticMarkup(createElement(Kuntur, { mood, still, talking, title: 'Kuntur' }))
          expect(svg).toMatch(/^<svg/)
          if (still) expect(svg).not.toMatch(/class="guide-/) // reduced motion and small icons never animate
          if (talking && !still) expect(svg).toContain('guide-talk')
        }
    const faces = GUIDE_MOODS.map((mood) => renderToStaticMarkup(createElement(Kuntur, { mood, still: true })))
    expect(new Set(faces).size).toBe(GUIDE_MOODS.length)
  })

  it('is on by default and the tutorial has not been seen', () => {
    expect(DEFAULT_SETTINGS.guide).toBe(true)
    expect(DEFAULT_SETTINGS.tutorialDone).toBe(false)
  })
})

describe('hints on the design screen', () => {
  const ew = getScenario('earth_watch')

  it('the empty base design: what blocks the launch comes first, the open tab first among equals', () => {
    const report = evaluateDesign(ew.baseDesign, ew)
    const issues = orderedIssues(report, 'comms')
    expect(issues.length).toBe(report.review.filter((i) => i.severity !== 'ok').length)
    const firstWarn = issues.findIndex((i) => !i.blocking)
    if (firstWarn >= 0) expect(issues.slice(firstWarn).every((i) => !i.blocking)).toBe(true)
    expect(issues[0].code).toBe('NO_PAYLOAD')
    expect(tabFor(issues[0])).toBe('payload')
    expect(designMood(report)).toBe('worried')
    const hints = designHints(report, 'mission')
    expect(hints[0].tab).toBe('payload')
    expect(hints[0].text).toContain('Try this:')
    expect(designHints(report, 'payload')[0].tab).toBeNull() // already on the tab: no "show me"
  })

  it('the landing and oxygen problems point to the right tabs', () => {
    expect(tabFor({ code: 'EDL_SHELL_TOO_SMALL', resource: 'mass' })).toBe('orbit')
    expect(tabFor({ code: 'MARS_WINDOW_TIGHT', resource: 'schedule' })).toBe('orbit')
    expect(tabFor({ code: 'OXYGEN_NIGHT_RUN', resource: 'power' })).toBe('payload')
    expect(tabFor({ code: 'DATA_BOTTLENECK', resource: 'data' })).toBe('comms')
    expect(tabFor({ code: 'POWER_NEGATIVE', resource: 'power' })).toBe('spacecraft')
  })

  it('a clean design gets one happy line', () => {
    const report = evaluateDesign(ew.baseDesign, ew)
    const clean = { ...report, review: report.review.filter((i) => i.severity === 'ok') }
    expect(designMood(clean)).toBe('happy')
    expect(designHints(clean, 'review')).toEqual([{ title: 'All green', text: en['guide.hint.allGood.text'], mood: 'happy', tab: null }])
  })
})

describe('after a mission', () => {
  it('the causes that cost most come first, then what went well', () => {
    const sc = getScenario('mars_stranded')
    const design = { ...sc.baseDesign, landing: { shellId: 'shell_s', chuteId: 'chute_m', descentId: 'legs', guided: true } }
    const m = simulateMission(design, sc, 5) // lost at landing
    const score = scoreMission(m, sc)
    const lines = resultsLines(analyseMission(m, score, sc).causes)
    expect(resultsMood(score.rank)).toBe('worried')
    expect(lines[0].title).toBe('The lander did not survive the landing')
    expect(lines[0].text).toContain('What I would change:')
    expect(resultsMood('Outstanding')).toBe('happy')
    expect(resultsMood('Partial')).toBe('thinking')
  })
})

describe('the guide store', () => {
  it('opens results by itself once, keeps its place on the same screen and resets on a new one', () => {
    const g = useGuide.getState()
    g.setContent({ id: 'design', mood: 'idle', lines: [{ text: 'a' }, { text: 'b' }] })
    expect(useGuide.getState().open).toBe(false)
    g.setOpen(true)
    g.setIndex(1)
    g.setContent({ id: 'design', mood: 'idle', lines: [{ text: 'a' }, { text: 'b' }, { text: 'c' }] })
    expect(useGuide.getState()).toMatchObject({ open: true, index: 1 })
    g.setContent({ id: 'design', mood: 'idle', lines: [{ text: 'a' }] })
    expect(useGuide.getState().index).toBe(0)
    g.setContent({ id: 'results-1', mood: 'happy', autoOpenKey: 'k1', lines: [{ text: 'x' }] })
    expect(useGuide.getState().open).toBe(true)
    // a screen that unmounts and mounts again (React strict mode) keeps the bubble open
    g.setContent(null)
    g.setContent({ id: 'results-1', mood: 'happy', autoOpenKey: 'k1', lines: [{ text: 'x' }] })
    expect(useGuide.getState().open).toBe(true)
    g.setContent({ id: 'design', mood: 'idle', lines: [{ text: 'a' }] })
    g.setContent({ id: 'results-1', mood: 'happy', autoOpenKey: 'k1', lines: [{ text: 'x' }] })
    expect(useGuide.getState().open).toBe(false) // already explained once
    g.setContent({ id: 'tutorial-welcome', mood: 'happy', forceOpen: true, lines: [{ text: 'hi' }] })
    expect(useGuide.getState().open).toBe(true)
    g.setContent(null)
    expect(useGuide.getState().content).toBeNull()
  })
})

describe('texts', () => {
  it('every tutorial step has its title and text in both languages', () => {
    const E = en as Record<string, string>
    const S = es as Record<string, string>
    expect(TUTORIAL.length).toBe(8)
    for (const s of TUTORIAL) for (const f of ['title', 'text']) {
      expect(E[`guide.tutorial.${s.id}.${f}`], s.id).toBeTruthy()
      expect(S[`guide.tutorial.${s.id}.${f}`], s.id).toBeTruthy()
    }
  })
})
