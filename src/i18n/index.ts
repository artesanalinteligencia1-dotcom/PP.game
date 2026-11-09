// Every in-game string goes through t(key, params). English is the source and the default language;
// strings/<lang>.json hold the tables. A key missing in a translation falls back to English
// (tests/i18n.test.ts fails if any key or {placeholder} is missing, so this only matters mid-translation).
import en from './strings/en.json'
import es from './strings/es.json'
import { useSettings } from '../store/settings'
import { renderParam, type Msg } from '../engine/text'

export const LANGUAGES = ['en', 'es'] as const
export type Lang = (typeof LANGUAGES)[number]
export type StringKey = keyof typeof en
export type Params = Record<string, string | number>

export const TABLES: Record<Lang, Partial<Record<StringKey, string>>> = { en, es }

/** Intl locale per language (number formatting). */
export const LOCALE: Record<Lang, string> = { en: 'en-US', es: 'es-PE' }

export function translate(lang: Lang, key: StringKey, params?: Params): string {
  const text = TABLES[lang][key] ?? en[key] ?? key
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m))
}

/** Current language outside React (event handlers, plain functions). Components should use useT(). */
export function currentLang(): Lang {
  return useSettings.getState().language
}

/** t() for code outside components. It does not re-render on a language change — prefer useT() in components. */
export function t(key: StringKey, params?: Params): string {
  return translate(currentLang(), key, params)
}

/** Components: `const t = useT()` re-renders the component when the language changes. */
export function useT(): (key: StringKey, params?: Params) => string {
  const lang = useSettings((s) => s.language)
  return (key, params) => translate(lang, key, params)
}

/**
 * Keys built at run time from data ids, e.g. `component.${c.id}.name`. The engine keeps its English text as the
 * fallback (engine code stays pure and its tests unchanged); the table entry wins when it exists.
 */
export function translateDynamic(lang: Lang, key: string, fallback: string, params?: Params): string {
  return key in en ? translate(lang, key as StringKey, params) : fallback
}
export function useTx(): (key: string, fallback: string, params?: Params) => string {
  const lang = useSettings((s) => s.language)
  return (key, fallback, params) => translateDynamic(lang, key, fallback, params)
}

/** Renders a message emitted by the engine. A plain string (older in-memory data) passes through. */
export function translateMsg(lang: Lang, m: Msg | string): string {
  if (typeof m === 'string') return m
  const params: Params = {}
  for (const [k, v] of Object.entries(m.params ?? {})) params[k] = renderParam(v, (r) => translateDynamic(lang, r.ref, r.en))
  return translateDynamic(lang, m.key, m.key, params)
}
export function useMsg(): (m: Msg | string) => string {
  const lang = useSettings((s) => s.language)
  return (m) => translateMsg(lang, m)
}

export function useLang(): Lang {
  return useSettings((s) => s.language)
}
