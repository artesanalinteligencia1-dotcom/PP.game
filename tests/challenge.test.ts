import { describe, expect, it } from 'vitest'
import { getScenario } from '../src/engine/catalog'
import { scoreMission } from '../src/engine/score'
import { advanceWeek, botChoice, createMission, decide } from '../src/engine/simulate'
import { challengeVerdict, decodeChallenge, encodeChallenge, type Challenge } from '../src/store/share'

const c: Challenge = { scenarioId: 'earth_watch', seed: 521261, score: 742, name: 'Dra. Quispe' }

describe('asynchronous multiplayer: challenge links', () => {
  it('round-trips a challenge, accents included', () => {
    const token = encodeChallenge(c)
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(decodeChallenge(token)).toEqual(c)
  })

  it('rejects broken links and unknown scenarios, and trims long names', () => {
    expect(decodeChallenge('not-a-token')).toBeNull()
    expect(decodeChallenge(encodeChallenge({ ...c, scenarioId: 'nowhere' }))).toBeNull()
    expect(decodeChallenge(encodeChallenge({ ...c, name: 'x'.repeat(80) }))!.name.length).toBe(24)
    expect(decodeChallenge(encodeChallenge({ ...c, seed: -1 }))!.seed).toBe(4294967295)
  })

  it('only counts a flight of the same scenario and seed', () => {
    expect(challengeVerdict(c, 'earth_watch', 521261, 800)).toBe('win')
    expect(challengeVerdict(c, 'earth_watch', 521261, 742)).toBe('tie')
    expect(challengeVerdict(c, 'earth_watch', 521261, 100)).toBe('lose')
    expect(challengeVerdict(c, 'earth_watch', 1, 999)).toBeNull()
    expect(challengeVerdict(c, 'lagrange_observatory', 521261, 999)).toBeNull()
  })

  it('is fair: the same design, seed and decisions always score the same', () => {
    const sc = getScenario('earth_watch')
    const fly = () => {
      const m = createMission(structuredClone(sc.baseDesign), sc, c.seed)
      for (let i = 0; i < 2000 && m.phase !== 'ended'; i++) {
        if (m.pending) decide(m, botChoice(m.pending, 'balanced'))
        else advanceWeek(m)
      }
      return scoreMission(m, sc).total
    }
    expect(fly()).toBe(fly())
  })
})
