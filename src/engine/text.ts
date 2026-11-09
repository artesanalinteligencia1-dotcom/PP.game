// Engine text. The engine is pure and never translates: it emits a message (key + params) and the UI renders it in the
// player's language with useMsg(). The English wording lives in i18n/strings/en.json, which is plain data.
import en from '../i18n/strings/en.json'

export type EnKey = keyof typeof en

/** A param that is itself translatable text: a catalog name, "You"/"Bot"… `en` is the English fallback. */
export interface MsgRef {
  ref: string
  en: string
}
export type MsgParam = string | number | MsgRef | MsgParam[]

export interface Msg {
  key: string
  params?: Record<string, MsgParam>
}

export const M = (key: EnKey, params?: Msg['params']): Msg => (params ? { key, params } : { key })
export const ref = (key: string, english: string): MsgRef => ({ ref: key, en: english })

/** Renders one param with a resolver for the translatable ones. Lists are comma-joined. */
export function renderParam(p: MsgParam, resolve: (r: MsgRef) => string): string | number {
  if (Array.isArray(p)) return p.map((x) => renderParam(x, resolve)).join(', ')
  return typeof p === 'object' ? resolve(p) : p
}

/** English rendering, for tests and for labels the engine's own tests read. */
export function msgEn(m: Msg): string {
  const text = (en as Record<string, string>)[m.key] ?? m.key
  return text.replace(/\{(\w+)\}/g, (raw, name: string) => {
    const p = m.params?.[name]
    return p === undefined ? raw : String(renderParam(p, (r) => r.en))
  })
}
