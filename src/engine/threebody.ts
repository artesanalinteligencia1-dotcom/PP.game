// Circular restricted three-body problem (Earth–Moon + massless spacecraft), planar, rotating frame, normalised units.
// HANDOFF §16.3: fixed-step RK4 and ONLY + − × ÷ √ inside the integrator (no Math.sin/cos/pow/hypot), so results are
// identical in every browser (IEEE-754 guarantees correctly rounded + − × ÷ √). Documented in docs/model.md §18.

/** Moon / (Earth + Moon) mass ratio. */
export const MU_EM = 0.01215058560962404
/** Length unit: Earth–Moon distance (km). */
export const LU_KM = 384400
/** Time unit: 1 / mean motion of the Moon (days) = 27.32 d / 2π. */
export const TU_DAYS = 4.3425
/** Velocity unit (km/s) = LU / TU. */
export const VU_KMS = LU_KM / (TU_DAYS * 86400)

export type State = readonly [x: number, y: number, vx: number, vy: number]

function deriv(s: State, mu: number): [number, number, number, number] {
  const x = s[0]
  const y = s[1]
  const vx = s[2]
  const vy = s[3]
  const dx1 = x + mu
  const dx2 = x - 1 + mu
  const r1 = Math.sqrt(dx1 * dx1 + y * y)
  const r2 = Math.sqrt(dx2 * dx2 + y * y)
  const r13 = r1 * r1 * r1
  const r23 = r2 * r2 * r2
  const ax = 2 * vy + x - ((1 - mu) * dx1) / r13 - (mu * dx2) / r23
  const ay = -2 * vx + y - ((1 - mu) * y) / r13 - (mu * y) / r23
  return [vx, vy, ax, ay]
}

/** One classical Runge–Kutta 4 step of size h (normalised time). */
export function rk4Step(s: State, h: number, mu = MU_EM): State {
  const k1 = deriv(s, mu)
  const s2: State = [s[0] + (h / 2) * k1[0], s[1] + (h / 2) * k1[1], s[2] + (h / 2) * k1[2], s[3] + (h / 2) * k1[3]]
  const k2 = deriv(s2, mu)
  const s3: State = [s[0] + (h / 2) * k2[0], s[1] + (h / 2) * k2[1], s[2] + (h / 2) * k2[2], s[3] + (h / 2) * k2[3]]
  const k3 = deriv(s3, mu)
  const s4: State = [s[0] + h * k3[0], s[1] + h * k3[1], s[2] + h * k3[2], s[3] + h * k3[3]]
  const k4 = deriv(s4, mu)
  return [
    s[0] + (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
    s[1] + (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
    s[2] + (h / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]),
    s[3] + (h / 6) * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]),
  ]
}

/** Propagate `steps` RK4 steps; keeps every `every`-th state (always the first and last). Stops early on a crash. */
export function propagate(s0: State, h: number, steps: number, every = 1, mu = MU_EM): { states: State[]; crashed: 'earth' | 'moon' | null } {
  const states: State[] = [s0]
  let s = s0
  const rEarth = 6371 / LU_KM
  const rMoon = 1737.4 / LU_KM
  for (let i = 1; i <= steps; i++) {
    s = rk4Step(s, h, mu)
    const dx1 = s[0] + mu
    const dx2 = s[0] - 1 + mu
    if (dx1 * dx1 + s[1] * s[1] < rEarth * rEarth) return { states: [...states, s], crashed: 'earth' }
    if (dx2 * dx2 + s[1] * s[1] < rMoon * rMoon) return { states: [...states, s], crashed: 'moon' }
    if (i % every === 0 || i === steps) states.push(s)
  }
  return { states, crashed: null }
}

/** Jacobi constant C = x² + y² + 2(1−μ)/r1 + 2μ/r2 − v² (conserved by the exact dynamics). */
export function jacobi(s: State, mu = MU_EM): number {
  const dx1 = s[0] + mu
  const dx2 = s[0] - 1 + mu
  const r1 = Math.sqrt(dx1 * dx1 + s[1] * s[1])
  const r2 = Math.sqrt(dx2 * dx2 + s[1] * s[1])
  return s[0] * s[0] + s[1] * s[1] + (2 * (1 - mu)) / r1 + (2 * mu) / r2 - s[2] * s[2] - s[3] * s[3]
}

/** Collinear Lagrange point L1, L2 or L3 (x coordinate), by Newton iteration. */
export function lagrangeX(which: 1 | 2 | 3, mu = MU_EM): number {
  let x = which === 1 ? 0.8 : which === 2 ? 1.15 : -1
  const f = (x: number) => {
    const a = x + mu
    const b = x - 1 + mu
    const r1 = Math.abs(a)
    const r2 = Math.abs(b)
    return x - ((1 - mu) * a) / (r1 * r1 * r1) - (mu * b) / (r2 * r2 * r2)
  }
  for (let i = 0; i < 60; i++) {
    const d = (f(x + 1e-7) - f(x - 1e-7)) / 2e-7
    x -= f(x) / d
  }
  return x
}

/**
 * Planar Lyapunov orbit around Earth–Moon L2 (a planar cousin of the halo orbits real missions use), found by
 * differential correction: start on the x-axis beyond L2 with vx = 0 and adjust vy so the orbit crosses the axis
 * again perpendicularly. Period ≈ 3.44 TU ≈ 15 days.
 */
export const L2_LYAPUNOV = { x0: 1.1856821654448841, vy0: -0.19242256017346465, period: 3.444 } as const
export const L2_LYAPUNOV_STATE: State = [L2_LYAPUNOV.x0, 0, 0, L2_LYAPUNOV.vy0]

/** Distance (km) between two trajectories sampled at the same times. */
export function divergenceKm(a: readonly State[], b: readonly State[]): number[] {
  const n = Math.min(a.length, b.length)
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const dx = a[i][0] - b[i][0]
    const dy = a[i][1] - b[i][1]
    out.push(Math.sqrt(dx * dx + dy * dy) * LU_KM)
  }
  return out
}

/** The "butterfly" experiment: the L2 orbit and a copy whose starting speed differs by `relative` (e.g. 1e-4 = 0.01 %). */
export function butterfly(relative: number, days = 60, h = 0.002, samplesPerDay = 2) {
  const steps = Math.round(days / TU_DAYS / h)
  const every = Math.max(1, Math.round(1 / (samplesPerDay * TU_DAYS * h)))
  const a = propagate(L2_LYAPUNOV_STATE, h, steps, every)
  const b = propagate([L2_LYAPUNOV.x0, 0, 0, L2_LYAPUNOV.vy0 * (1 + relative)], h, steps, every)
  const d = divergenceKm(a.states, b.states)
  const dayOf = (i: number) => (i * every * h * TU_DAYS)
  const firstOver = (km: number) => {
    const i = d.findIndex((x) => x > km)
    return i < 0 ? null : dayOf(i)
  }
  return { a, b, divergence: d, dayOf, daysTo1000km: firstOver(1000), daysTo10000km: firstOver(10000) }
}
