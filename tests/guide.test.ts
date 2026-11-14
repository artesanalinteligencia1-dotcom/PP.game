import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import en from '../src/i18n/strings/en.json'
import es from '../src/i18n/strings/es.json'
import { GUIDE_ACCENT, GUIDE_MOODS, GUIDE_VARIANTS, ROBOTS } from '../src/ui/guide/robots'

describe('robot guide candidates', () => {
  it('every look draws every face, moving or still, talking or not', () => {
    for (const v of GUIDE_VARIANTS)
      for (const mood of GUIDE_MOODS)
        for (const still of [false, true])
          for (const talking of [false, true]) {
            const svg = renderToStaticMarkup(createElement(ROBOTS[v], { mood, still, talking, title: v }))
            expect(svg).toMatch(/^<svg/)
            expect(svg).toContain(`<title>${v}</title>`)
            // a still robot never animates (reduced motion, small icons)
            if (still) expect(svg).not.toMatch(/class="guide-/)
            if (talking && !still) expect(svg).toContain('guide-talk')
          }
  })

  it('the faces differ from one another', () => {
    for (const v of GUIDE_VARIANTS) {
      const faces = GUIDE_MOODS.map((mood) => renderToStaticMarkup(createElement(ROBOTS[v], { mood, still: true })))
      expect(new Set(faces).size).toBe(GUIDE_MOODS.length)
    }
  })

  it('each look has its name, meaning and concept in both languages', () => {
    const E = en as Record<string, string>
    const S = es as Record<string, string>
    for (const v of GUIDE_VARIANTS) {
      expect(GUIDE_ACCENT[v]).toMatch(/^#[0-9a-f]{6}$/)
      for (const f of ['name', 'meaning', 'concept']) {
        expect(E[`guide.${v}.${f}`], `${v}.${f}`).toBeTruthy()
        expect(S[`guide.${v}.${f}`], `${v}.${f}`).toBeTruthy()
      }
    }
    for (const m of GUIDE_MOODS) expect(S[`guide.mood.${m}`]).toBeTruthy()
  })
})
