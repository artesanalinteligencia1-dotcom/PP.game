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

/**
 * Asynchronous multiplayer: a challenge is a scenario, a seed and the score to beat. The friend designs their own
 * spacecraft and flies the same seed, so both face the same events; only the design and the decisions differ.
 */
export interface Challenge {
  scenarioId: string
  seed: number
  score: number
  name: string
}

export function encodeChallenge(c: Challenge): string {
  return b64url(JSON.stringify({ v: 1, c: c.scenarioId, s: c.seed >>> 0, p: Math.round(c.score), n: c.name.slice(0, 24) }))
}

/** Returns null for anything malformed or for an unknown scenario. */
export function decodeChallenge(token: string): Challenge | null {
  try {
    const o = JSON.parse(unb64url(token)) as { v: number; c: string; s: number; p: number; n: string }
    if (o.v !== 1 || typeof o.c !== 'string' || typeof o.s !== 'number' || !Number.isFinite(o.p)) return null
    getScenario(o.c) // throws on an unknown scenario
    return { scenarioId: o.c, seed: o.s >>> 0, score: Math.round(o.p), name: typeof o.n === 'string' ? o.n.slice(0, 24) : '' }
  } catch {
    return null
  }
}

export function challengeUrl(c: Challenge): string {
  const base = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : ''
  return `${base}#c=${encodeChallenge(c)}`
}

export function readChallengeFromHash(): Challenge | null {
  if (typeof window === 'undefined') return null
  const m = window.location.hash.match(/[#&]c=([A-Za-z0-9_-]+)/)
  return m ? decodeChallenge(m[1]) : null
}

/** A result only counts against a challenge when it flew the same scenario with the same seed. */
export function challengeVerdict(c: Challenge, scenarioId: string, seed: number, score: number): 'win' | 'tie' | 'lose' | null {
  if (c.scenarioId !== scenarioId || c.seed !== seed >>> 0) return null
  return score > c.score ? 'win' : score === c.score ? 'tie' : 'lose'
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
