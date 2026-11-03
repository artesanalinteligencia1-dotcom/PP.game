import { describe, expect, it } from 'vitest'
import { newCampaign } from '../src/engine'
import { parseSaveFile, saveFileName, toSaveFile } from '../src/store/save'

const base = newCampaign({ name: 'Pedro Goicochea', title: 'Dr.', level: 'researcher' })

describe('save files', () => {
  it('round-trips a campaign through an exported file', () => {
    const c = { ...base, fundsM: 42, completed: { first_light: { best: 900, rank: 'Outstanding' as const, seed: 1, runs: 2 } } }
    expect(parseSaveFile(JSON.stringify(toSaveFile(c)))).toEqual(c)
  })
  it('accepts a bare campaign object (older builds stored only that)', () => {
    expect(parseSaveFile(JSON.stringify(base))).toEqual(base)
  })
  it('rejects junk, damaged and future saves with a readable message', () => {
    expect(() => parseSaveFile('hello')).toThrow(/not a PP.game save/)
    expect(() => parseSaveFile(JSON.stringify({ ...base, fundsM: 'lots' }))).toThrow(/damaged/)
    expect(() => parseSaveFile(JSON.stringify({ ...toSaveFile(base), saveVersion: 99 }))).toThrow(/newer version/)
  })
  it('drops retired contracts instead of rejecting the save', () => {
    const c = { ...base, completed: { old_contract: { best: 1, rank: 'Fail', seed: 1, runs: 1 } } }
    expect(parseSaveFile(JSON.stringify(c)).completed).toEqual({})
  })
  it('names the file after the player and the date', () => {
    expect(saveFileName(base, new Date('2026-11-03T10:00:00Z'))).toBe('ppgame-Pedro-Goicochea-2026-11-03.json')
  })
})
