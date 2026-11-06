/** Seeded PRNG (mulberry32). Deterministic: same seed => same sequence. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    const [v, next] = rngNext(a)
    a = next
    return v
  }
}

/**
 * One step of mulberry32 with explicit, serialisable state.
 * rngNext(seed)[0] equals the first value of mulberry32(seed)().
 */
export function rngNext(state: number): [value: number, nextState: number] {
  const a = (state + 0x6d2b79f5) >>> 0
  let t = a
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a]
}

/** Normalise any user-entered seed into a uint32. */
export function normaliseSeed(seed: number | string): number {
  if (typeof seed === 'number' && Number.isFinite(seed)) return Math.abs(Math.floor(seed)) >>> 0
  let h = 2166136261
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return h >>> 0
}

/** Scramble a seed (murmur3 fmix32) so that consecutive seeds give unrelated streams. */
export function mixSeed(seed: number): number {
  let h = seed >>> 0
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return h >>> 0
}
