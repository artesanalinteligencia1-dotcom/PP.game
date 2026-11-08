import { describe, expect, it } from 'vitest'
import en from '../src/i18n/strings/en.json'
import es from '../src/i18n/strings/es.json'
import { translate } from '../src/i18n'

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

  it('fills placeholders and falls back to English', () => {
    expect(translate('es', 'settings.saved', { file: 'a.json' })).toBe('Guardado: a.json')
    expect(translate('en', 'settings.install', { game: 'Paulet' })).toBe('Install Paulet')
  })
})
