// Share a mission by link: design + seed encoded in the URL hash (#m=…). No server needed.
import { evaluateDesign } from '../engine/evaluate'
import { getScenario } from '../engine/catalog'
import type { Design } from '../engine/types'

const b64url = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const unb64url = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))))

export function encodeShare(design: Design, seed: number): string {
  return b64url(JSON.stringify({ v: 1, d: design, s: seed }))
}

/** Returns null for anything malformed or referring to unknown parts. */
export function decodeShare(token: string): { design: Design; seed: number } | null {
  try {
    const o = JSON.parse(unb64url(token)) as { v: number; d: Design; s: number }
    if (o.v !== 1 || typeof o.s !== 'number' || !o.d || typeof o.d.scenarioId !== 'string') return null
    evaluateDesign(o.d, getScenario(o.d.scenarioId)) // throws on unknown ids
    return { design: o.d, seed: o.s >>> 0 }
  } catch {
    return null
  }
}

export function shareUrl(design: Design, seed: number): string {
  const base = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : ''
  return `${base}#m=${encodeShare(design, seed)}`
}

export function readShareFromHash(): { design: Design; seed: number } | null {
  if (typeof window === 'undefined') return null
  const m = window.location.hash.match(/[#&]m=([A-Za-z0-9_-]+)/)
  return m ? decodeShare(m[1]) : null
}
