import { describe, expect, it } from 'vitest'
import {
  L2_LYAPUNOV,
  L2_LYAPUNOV_STATE,
  butterfly,
  evaluateDesign,
  getScenario,
  jacobi,
  lagrangeX,
  propagate,
  routesFor,
  scoreMission,
  simulateMission,
  type Design,
} from '../src/engine'

describe('circular restricted three-body problem (Earth–Moon)', () => {
  it('collinear Lagrange points match the literature (normalised units)', () => {
    expect(lagrangeX(1)).toBeCloseTo(0.836915, 5)
    expect(lagrangeX(2)).toBeCloseTo(1.155682, 5)
    expect(lagrangeX(3)).toBeCloseTo(-1.005063, 5)
  })

  it('RK4 conserves the Jacobi constant over one orbit (|ΔC| < 1e-9)', () => {
    const { states } = propagate(L2_LYAPUNOV_STATE, 0.001, Math.round(L2_LYAPUNOV.period / 0.001))
    const c0 = jacobi(states[0])
    expect(Math.abs(jacobi(states[states.length - 1]) - c0)).toBeLessThan(1e-9)
  })

  it('the L2 Lyapunov orbit is periodic: back within ~200 km after one period (~15 days)', () => {
    const { states, crashed } = propagate(L2_LYAPUNOV_STATE, 0.001, Math.round(L2_LYAPUNOV.period / 0.001))
    const end = states[states.length - 1]
    expect(crashed).toBeNull()
    expect(Math.sqrt((end[0] - L2_LYAPUNOV.x0) ** 2 + end[1] ** 2) * 384400).toBeLessThan(200)
  })

  it('determinism snapshot: 1 000 fixed RK4 steps reproduce the stored state (tolerance 1e-12, documented in docs/model.md §18)', () => {
    const { states } = propagate(L2_LYAPUNOV_STATE, 0.001, 1000)
    const expected = [1.1240182046975817, -0.10707576456962899, -0.06372172935665169, 0.0360900150876889]
    states[states.length - 1].forEach((v, i) => expect(Math.abs(v - expected[i])).toBeLessThan(1e-12))
  })

  it('butterfly effect: a 0.01 % change in speed grows past 1 000 km in a couple of weeks; 0.0001 % takes longer', () => {
    const big = butterfly(1e-4)
    const small = butterfly(1e-6)
    expect(big.daysTo1000km).not.toBeNull()
    expect(big.daysTo1000km!).toBeGreaterThan(8)
    expect(big.daysTo1000km!).toBeLessThan(25)
    expect(small.daysTo1000km!).toBeGreaterThan(big.daysTo1000km!)
    // exponential growth: the divergence keeps increasing by orders of magnitude
    expect(big.divergence[big.divergence.length - 1]).toBeGreaterThan(1000 * big.divergence[4])
  })
})

describe('Lagrange Observatory (Act 2)', () => {
  const lo = getScenario('lagrange_observatory')
  const lowEnergyMedium: Design = { ...lo.baseDesign, instruments: [{ id: 'ir_telescope', duty: 0.3 }], routeId: 'low_energy' }
  const directMedium: Design = { ...lowEnergyMedium, routeId: 'direct' }
  const directR3: Design = { ...directMedium, launcherId: 'reusable_heavy' }
  const blocking = (d: Design) => evaluateDesign(d, lo).review.filter((r) => r.blocking).map((r) => r.code)

  it('routes trade time for propellant: low-energy needs far less Δv but takes months', () => {
    const routes = routesFor('em_l2_halo')
    const direct = routes.find((r) => r.id === 'direct')!
    const low = routes.find((r) => r.id === 'low_energy')!
    expect(low.insertionDv).toBeLessThan(direct.insertionDv / 3)
    expect(low.transferMonths).toBeGreaterThan(10 * direct.transferMonths)
    const a = evaluateDesign(lowEnergyMedium, lo)
    const b = evaluateDesign(directMedium, lo)
    expect(a.mass.totalDv).toBeLessThan(b.mass.totalDv)
    expect(a.schedule.transferMonths).toBeGreaterThan(b.schedule.transferMonths)
  })

  it('the low-energy route lets the telescope fit the cheaper Medium rocket; the direct route does not', () => {
    expect(blocking(lowEnergyMedium)).toEqual([])
    expect(blocking(directMedium)).toContain('MASS_OVER_CAPACITY')
    expect(blocking(directR3)).toEqual([])
  })

  it('a thin correction reserve on a chaotic route is flagged', () => {
    expect(evaluateDesign({ ...lowEnergyMedium, tcmReserveDv: 10 }, lo).review.map((r) => r.code)).toContain('TCM_RESERVE_LOW')
  })

  it.each([
    ['Medium + low-energy route', lowEnergyMedium],
    ['R-3 reusable heavy + direct route', directR3],
  ])('%s wins most seeds', (_n, d) => {
    const seeds = Array.from({ length: 30 }, (_, i) => 1000 + i * 7919)
    const wins = seeds.filter((s) => ['Success', 'Outstanding'].includes(scoreMission(simulateMission(d, lo, s), lo).rank)).length
    expect(wins / seeds.length).toBeGreaterThan(0.7)
  })

  it('chaos decides the real correction need in flight, deterministically from the seed', () => {
    const a = simulateMission(lowEnergyMedium, lo, 31337)
    const b = simulateMission(lowEnergyMedium, lo, 31337)
    expect(a.tcmNeed).toBe(b.tcmNeed)
    if (a.endReason !== 'launch_failure') expect(a.tcmNeed).toBeGreaterThan(0)
    expect(a.log).toEqual(b.log)
  })
})
