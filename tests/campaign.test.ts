import { describe, expect, it } from 'vitest'
import {
  CONTRACTS,
  TECH,
  applyOrbitalResult,
  applySoundingResult,
  availableLaunchers,
  buyTech,
  canBuyTech,
  contractStatus,
  evaluateDesign,
  flySounding,
  getScenario,
  newCampaign,
  scoreMission,
  simulateMission,
  type Design,
} from '../src/engine'

const ae = getScenario('andean_eye')
const st = getScenario('storm_tracker')
const sr = getScenario('station_resupply')
const ew = getScenario('earth_watch')

const andeanSmall: Design = { ...ae.baseDesign, instruments: [{ id: 'multispectral', duty: 0.04 }], stationIds: ['andes', 'arctic'] }
const andeanRideshare: Design = { ...andeanSmall, launcherId: 'rideshare' }
const stormGeo: Design = {
  ...st.baseDesign,
  instruments: [{ id: 'weather_imager', duty: 0.3 }],
  obcId: 'radhard',
  compressionId: 'lossless',
}
const resupplyMedium: Design = { ...sr.baseDesign }
const resupplyReusable: Design = { ...sr.baseDesign, launcherId: 'reusable_medium' }

const blocking = (d: Design) => evaluateDesign(d, getScenario(d.scenarioId)).review.filter((r) => r.blocking).map((r) => r.code)
const unmet = (d: Design) =>
  evaluateDesign(d, getScenario(d.scenarioId))
    .requirements.filter((r) => !r.optional && !r.met)
    .map((r) => r.id)

describe('launchers: Paulet-1, rideshare, reusable', () => {
  it('Paulet-1 is a sounding rocket: it can never reach orbit', () => {
    expect(blocking({ ...ew.baseDesign, instruments: [{ id: 'magnetometer', duty: 1 }], launcherId: 'paulet' })).toContain('LAUNCHER_SUBORBITAL')
  })
  it('rideshare is cheap per kg but only to low SSO, on a fixed calendar', () => {
    const light = evaluateDesign(andeanSmall, ae)
    const ride = evaluateDesign(andeanRideshare, ae)
    expect(ride.cost.launchM).toBeLessThan(light.cost.launchM)
    expect(ride.schedule.devMonths % 6).toBe(0)
    expect(blocking({ ...andeanRideshare, altitudeKm: 750 })).toContain('RIDESHARE_ALTITUDE')
    expect(blocking({ ...andeanRideshare, orbitId: 'leo', altitudeKm: 500 })).toContain('LAUNCHER_NO_TARGET')
  })
  it('the reusable R-2 is cheaper than the expendable medium but lifts less', () => {
    const exp = evaluateDesign(resupplyMedium, sr)
    const reu = evaluateDesign(resupplyReusable, sr)
    expect(reu.cost.launchM).toBeLessThan(exp.cost.launchM)
    expect(reu.mass.capacityKg).toBeLessThan(exp.mass.capacityKg)
  })
})

describe('Act 1 contracts are winnable (and more than one way)', () => {
  it.each([
    ['Andean Eye — small sat on L-1', andeanSmall],
    ['Andean Eye — same sat on a rideshare', andeanRideshare],
    ['Storm Tracker — GEO weather imager', stormGeo],
    ['Station Resupply — expendable medium', resupplyMedium],
    ['Station Resupply — reusable R-2', resupplyReusable],
  ])('%s: no blocking issues, all requirements predicted met', (_n, d) => {
    expect(blocking(d)).toEqual([])
    expect(unmet(d)).toEqual([])
  })
  it('the reusable rocket earns the resupply "cheap" bonus, the expendable one does not', () => {
    const bonus = (d: Design) => evaluateDesign(d, sr).requirements.find((r) => r.id === 'sr_bonus_cheap')!.met
    expect(bonus(resupplyReusable)).toBe(true)
    expect(bonus(resupplyMedium)).toBe(false)
  })
  it('cargo missions are scored on cargo delivered', () => {
    const s = simulateMission(resupplyReusable, sr, 4242)
    const sc = scoreMission(s, sr)
    const line = sc.lines.find((l) => l.key === 'science')!
    expect(line.label).toBe('Cargo delivered')
    if (s.endReason === 'completed') expect(line.points).toBeCloseTo(line.max, 5)
  })
  it('reusable launches roll a deterministic booster landing', () => {
    const a = simulateMission(resupplyReusable, sr, 99)
    const b = simulateMission(resupplyReusable, sr, 99)
    expect(a.boosterLanded).toBe(b.boosterLanded)
    if (a.endReason !== 'launch_failure') expect(typeof a.boosterLanded).toBe('boolean')
    expect(simulateMission(resupplyMedium, sr, 99).boosterLanded).toBeNull()
  })
})

describe('First Light (Paulet-1 sounding flight)', () => {
  it('rejects empty or overweight payloads', () => {
    expect(flySounding([], 1).problem).toBe('no_payload')
    expect(flySounding(['particle_detector', 'magnetometer'], 1).problem).toBe('overweight')
  })
  it('is deterministic and reaches ~110 km at ~1.5 km/s — far from the 7.8 km/s needed for orbit', () => {
    const results = Array.from({ length: 40 }, (_, i) => flySounding(['magnetometer'], i))
    expect(flySounding(['magnetometer'], 7)).toEqual(flySounding(['magnetometer'], 7))
    const ok = results.filter((r) => r.reachedSpace)
    expect(ok.length).toBeGreaterThan(20)
    for (const r of ok) {
      expect(r.apogeeKm).toBeGreaterThanOrEqual(100)
      expect(r.burnoutKms).toBeGreaterThan(1.3)
      expect(r.burnoutKms).toBeLessThan(1.7)
      expect(r.secondsInSpace).toBeGreaterThan(0)
    }
  })
})

describe('campaign progression', () => {
  const profile = { name: 'Pedro Goicochea', title: 'Dr.' as const, level: 'cadet' as const }
  it('starts with only Paulet-1 and First Light available', () => {
    const c = newCampaign(profile)
    expect(availableLaunchers(c)).toEqual(['paulet'])
    expect(CONTRACTS.filter((k) => contractStatus(c, k) === 'available').map((k) => k.id)).toEqual(['first_light'])
  })
  it('reaching space unlocks commercial launchers and Earth Watch', () => {
    const seed = Array.from({ length: 50 }, (_, i) => i).find((i) => flySounding(['magnetometer'], i).reachedSpace)!
    const { state, reward } = applySoundingResult(newCampaign(profile), flySounding(['magnetometer'], seed), seed)
    expect(reward.unlocked).toContain('commercial_launchers')
    expect(availableLaunchers(state)).toEqual(expect.arrayContaining(['paulet', 'light', 'medium', 'heavy']))
    expect(contractStatus(state, CONTRACTS.find((k) => k.id === 'earth_watch')!)).toBe('available')
  })
  it('a successful contract pays funds, prestige and client trust; technology can then be bought', () => {
    let c = newCampaign(profile)
    c = { ...c, unlocked: [...c.unlocked, 'commercial_launchers'], completed: { first_light: { best: 10, rank: 'Success', seed: 1, runs: 1 } } }
    const d: Design = { ...ew.baseDesign, instruments: [{ id: 'multispectral', duty: 0.05 }], stationIds: ['mid_north', 'arctic'] }
    const seed = [1, 2, 3, 4, 5, 6, 7, 8].find((x) => scoreMission(simulateMission(d, ew, x), ew).rank !== 'Fail')!
    const m = simulateMission(d, ew, seed)
    const sc = scoreMission(m, ew)
    const { state, reward } = applyOrbitalResult(c, 'earth_watch', sc, m)
    expect(reward.fundsM).toBeGreaterThan(20)
    expect(state.prestige).toBeGreaterThan(c.prestige)
    expect(state.trust.agency).toBeGreaterThan(c.trust.agency)
    const rich = { ...state, fundsM: 100, prestige: 200 }
    expect(canBuyTech(rich, TECH.find((t) => t.id === 'reusable_medium')!).ok).toBe(true)
    expect(availableLaunchers(buyTech(rich, 'reusable_medium'))).toContain('reusable_medium')
    expect(canBuyTech(rich, TECH.find((t) => t.id === 'super_heavy')!).ok).toBe(false)
  })
  it('Mars contracts are visible previews, locked for now', () => {
    const c = newCampaign(profile)
    for (const id of ['mars_stranded', 'mars_oxygen', 'mars_terraform']) expect(contractStatus(c, CONTRACTS.find((k) => k.id === id)!)).toBe('locked')
  })
})

describe('share links', () => {
  it('round-trips a design and seed; rejects garbage', async () => {
    const { encodeShare, decodeShare } = await import('../src/store/share')
    const d: Design = { ...ew.baseDesign, instruments: [{ id: 'multispectral', duty: 0.05 }] }
    expect(decodeShare(encodeShare(d, 123456))).toEqual({ design: d, seed: 123456 })
    expect(decodeShare('not-a-token')).toBeNull()
    expect(decodeShare(encodeShare({ ...d, launcherId: 'warp_drive' }, 1))).toBeNull()
  })
})
