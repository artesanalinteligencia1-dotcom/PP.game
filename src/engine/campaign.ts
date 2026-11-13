// Campaign ("career"): contracts, investors, Funds + Prestige, technology unlocks. Pure functions over a serialisable state.
import { M, type Msg } from './text'
import { getLauncher } from './catalog/components'
import type { RocketDesign } from './rocket'
import type { MissionScore, Rank } from './score'
import type { MissionState } from './simulate'
import type { SoundingResult } from './sounding'
import type { Difficulty } from './types'

export type InvestorId = 'agency' | 'commercial' | 'foundation'
export type Level = 'cadet' | 'researcher' | 'director'
export const LEVEL_TO_DIFFICULTY: Record<Level, Difficulty> = { cadet: 'beginner', researcher: 'engineer', director: 'expert' }

export interface Profile {
  name: string
  title: 'Dr.' | 'Eng.'
  level: Level
}

export interface ContractDef {
  id: string
  act: 0 | 1 | 2 | 3 | 4
  title: string
  kind: 'sounding' | 'orbital' | 'preview'
  scenarioId?: string
  client: InvestorId | 'self'
  paymentM: number
  blurb: string
  requires: { contracts?: string[]; prestige?: number; act1Completed?: number }
  /** Short honest note for speculative/far-future content. */
  note?: string
}

export const INVESTORS: Record<InvestorId, { name: string; wants: string }> = {
  agency: { name: 'Space Agency', wants: 'Science and safety. Dislikes failures and risk.' },
  commercial: { name: 'Commercial Partner', wants: 'Delivery on time and on budget. Pays per result.' },
  foundation: { name: 'Earth Foundation', wants: 'Impact on people and the planet. Patient with small budgets.' },
}

export const CONTRACTS: ContractDef[] = [
  {
    id: 'first_light',
    act: 0,
    title: 'First Light',
    kind: 'sounding',
    client: 'self',
    paymentM: 10,
    blurb: 'Fly Paulet-1, the sounding rocket you built from Paulet’s notebooks, past the 100 km line with a small experiment.',
    requires: {},
  },
  {
    id: 'earth_watch',
    act: 1,
    title: 'Earth Watch',
    kind: 'orbital',
    scenarioId: 'earth_watch',
    client: 'agency',
    paymentM: 40,
    blurb: 'Your first satellite: watch forests and farms for two years.',
    requires: { contracts: ['first_light'] },
  },
  {
    id: 'andean_eye',
    act: 1,
    title: 'Andean Eye',
    kind: 'orbital',
    scenarioId: 'andean_eye',
    client: 'foundation',
    paymentM: 30,
    blurb: 'Glaciers and forest edges of the Andes on a foundation budget.',
    requires: { contracts: ['earth_watch'] },
  },
  {
    id: 'station_resupply',
    act: 1,
    title: 'Station Resupply',
    kind: 'orbital',
    scenarioId: 'station_resupply',
    client: 'commercial',
    paymentM: 50,
    blurb: 'Carry a tonne of supplies to the space station. Reusable rockets shine here.',
    requires: { contracts: ['earth_watch'] },
  },
  {
    id: 'storm_tracker',
    act: 1,
    title: 'Storm Tracker',
    kind: 'orbital',
    scenarioId: 'storm_tracker',
    client: 'agency',
    paymentM: 60,
    blurb: 'A geostationary weather watcher: far, expensive, irradiated.',
    requires: { contracts: ['earth_watch'], prestige: 60 },
  },
  {
    id: 'lunar_pathfinder',
    act: 2,
    title: 'Lunar Pathfinder',
    kind: 'orbital',
    scenarioId: 'lunar_pathfinder',
    client: 'agency',
    paymentM: 120,
    blurb: 'Act 2 begins: hunt for water ice at the lunar poles.',
    requires: { prestige: 150, act1Completed: 3 },
  },
  {
    id: 'lagrange_observatory',
    act: 2,
    title: 'Lagrange Observatory',
    kind: 'orbital',
    scenarioId: 'lagrange_observatory',
    client: 'agency',
    paymentM: 150,
    blurb: 'A telescope on a halo orbit around Earth–Moon L2 — where the three-body problem and chaos rule.',
    requires: { contracts: ['lunar_pathfinder'] },
  },
  {
    id: 'mars_stranded',
    act: 3,
    title: 'Stranded',
    kind: 'preview',
    client: 'agency',
    paymentM: 0,
    blurb: 'An astronaut is stranded on Mars. Send supplies and a radio relay — the launch window will not wait.',
    requires: { prestige: 400 },
    note: 'Coming in Act 3: launch windows every ~26 months, 7–9 month trips, minutes of radio delay, entry–descent–landing.',
  },
  {
    id: 'mars_oxygen',
    act: 3,
    title: 'Breathing Mars',
    kind: 'preview',
    client: 'foundation',
    paymentM: 0,
    blurb: 'Make oxygen from the Martian air, as a real rover experiment already did on a small scale.',
    requires: { prestige: 500 },
    note: 'Coming in Act 3. Real reference: the MOXIE experiment on the Perseverance rover produced oxygen from CO₂ (2021–2023).',
  },
  {
    id: 'mars_terraform',
    act: 4,
    title: 'Terraforming (grand challenge)',
    kind: 'preview',
    client: 'foundation',
    paymentM: 0,
    blurb: 'Warm and thicken the Martian atmosphere over centuries — the dream at the end of the road.',
    requires: { prestige: 1000 },
    note: 'Speculative. A 2018 NASA-supported study found too little accessible CO₂ to terraform Mars with today’s technology.',
  },
]

export interface TechDef {
  id: string
  name: string
  launcherId?: string
  costM: number
  prestige: number
  requires?: string[]
  act: 1 | 2 | 3 | 4
  available: boolean
  description: string
}

export const TECH: TechDef[] = [
  { id: 'rideshare', name: 'Rideshare contract', launcherId: 'rideshare', costM: 3, prestige: 40, act: 1, available: true, description: 'Book seats on shared flights to sun-synchronous orbit. Cheap per kg; fixed dates and altitude.' },
  { id: 'reusable_medium', name: 'Reusable boosters (R-2)', launcherId: 'reusable_medium', costM: 35, prestige: 120, requires: ['earth_watch'], act: 1, available: true, description: 'First stages that land and fly again: ~40% cheaper launches, ~30% less payload.' },
  { id: 'reusable_heavy', name: 'Reusable heavy (R-3)', launcherId: 'reusable_heavy', costM: 60, prestige: 250, requires: ['lunar_pathfinder'], act: 2, available: true, description: 'Three cores that land: heavy-lift capacity at a medium price. Opens fast routes to the Moon and L2.' },
  { id: 'hydrogen_stages', name: 'Cryogenic hydrogen stages', costM: 20, prestige: 80, act: 1, available: true, description: 'Liquid hydrogen engines and tanks for your own rockets, plus the large solid booster and the 5.2 m fairing: the parts of a heavy launcher.' },
  { id: 'methane_engines', name: 'Methane engines (M-20)', costM: 30, prestige: 150, act: 2, available: true, description: 'Methane engines and tanks for your own rockets: efficient, clean-burning and made to fly again and again.' },
  { id: 'super_heavy', name: 'Fully reusable super-heavy + orbital refuelling', costM: 200, prestige: 600, act: 3, available: false, description: 'In development in the real world. Coming in Act 3 (Moon and Mars).' },
  { id: 'nuclear_stage', name: 'Nuclear-thermal upper stage', costM: 400, prestige: 1000, act: 4, available: false, description: 'Speculative: researched for decades, not operational. Act 4.' },
]

export interface ContractRecord {
  best: number
  rank: Rank
  seed: number
  runs: number
}

export interface CampaignState {
  version: 1
  profile: Profile
  fundsM: number
  prestige: number
  trust: Record<InvestorId, number>
  completed: Record<string, ContractRecord>
  unlocked: string[]
  boostersLanded: number
  history: { contractId: string; score: number; rank: Rank; fundsM: number; prestige: number }[]
}

export function newCampaign(profile: Profile): CampaignState {
  return {
    version: 1,
    profile,
    fundsM: 20,
    prestige: 0,
    trust: { agency: 50, commercial: 50, foundation: 50 },
    completed: {},
    unlocked: ['paulet'],
    boostersLanded: 0,
    history: [],
  }
}

const COMMERCIAL_LAUNCHERS = ['light', 'medium', 'heavy']

export function availableLaunchers(state: CampaignState): string[] {
  return state.unlocked.flatMap((u) => {
    const tech = TECH.find((t) => t.id === u)
    if (tech?.launcherId) return [tech.launcherId]
    if (u === 'commercial_launchers') return COMMERCIAL_LAUNCHERS
    return [u]
  })
}

/**
 * Rocket Engineer pad: the technology a workbench part needs before a rocket that uses it can fly career contracts.
 * Kerosene engines and tanks, the small booster and the fairings up to 4 m need none. Free play has no locks.
 */
export function rocketPartTech(partId: string): string | undefined {
  if (partId === 'legs' || partId === 'fins') return 'reusable_medium'
  if (partId.startsWith('h_') || partId.startsWith('hydrogen_') || partId === 'srb_l' || partId === 'fairing_l') return 'hydrogen_stages'
  if (partId.startsWith('m_') || partId.startsWith('methane_')) return 'methane_engines'
  return undefined
}

/** Technologies (ids, in TECH order) this rocket still needs in the career; empty = ready to fly contracts. */
export function missingRocketTech(state: CampaignState, design: RocketDesign): string[] {
  const parts = [...design.stages.flatMap((s) => [s.engineId, s.tankId]), design.fairingId, ...(design.boosters > 0 && design.boosterId ? [design.boosterId] : []), ...(design.legs ? ['legs'] : []), ...(design.fins ? ['fins'] : [])]
  const need = new Set(parts.map(rocketPartTech).filter((t): t is string => !!t && !state.unlocked.includes(t)))
  return TECH.filter((t) => need.has(t.id)).map((t) => t.id)
}

/** A rocket of your own can fly contracts once the commercial launch market is open to you (after First Light). */
export function customRocketAllowed(state: CampaignState): boolean {
  return state.unlocked.includes('commercial_launchers')
}

const isSuccess = (r?: Rank) => r === 'Success' || r === 'Outstanding'

export function contractStatus(state: CampaignState, c: ContractDef): 'locked' | 'available' | 'completed' {
  if (state.completed[c.id] && (isSuccess(state.completed[c.id].rank) || c.kind === 'sounding')) return 'completed'
  if (c.kind === 'preview') return 'locked'
  const req = c.requires
  if (req.contracts?.some((id) => !(state.completed[id] && (isSuccess(state.completed[id].rank) || id === 'first_light')))) return 'locked'
  if (req.prestige !== undefined && state.prestige < req.prestige) return 'locked'
  if (req.act1Completed !== undefined) {
    const n = CONTRACTS.filter((k) => k.act === 1 && isSuccess(state.completed[k.id]?.rank)).length
    if (n < req.act1Completed) return 'locked'
  }
  return 'available'
}

/** Investors pay more when they trust you: ×0.8 at trust 0 … ×1.2 at trust 100. */
export const trustMultiplier = (trust: number) => 0.8 + Math.max(0, Math.min(100, trust)) / 250

const RANK_PRESTIGE: Record<Rank, number> = { Fail: 0, Partial: 10, Success: 30, Outstanding: 50 }

export interface Reward {
  fundsM: number
  prestige: number
  trust: Partial<Record<InvestorId, number>>
  unlocked: string[]
  notes: Msg[]
}

function clampTrust(x: number) {
  return Math.max(0, Math.min(100, Math.round(x)))
}

export function applyOrbitalResult(state: CampaignState, contractId: string, score: MissionScore, mission: MissionState): { state: CampaignState; reward: Reward } {
  const c = CONTRACTS.find((k) => k.id === contractId)!
  const prev = state.completed[contractId]
  const first = !prev || !isSuccess(prev.rank)
  const factor = score.rank === 'Fail' ? 0 : score.rank === 'Partial' ? 0.4 : 0.7 + (0.3 * score.total) / 1000
  const client = c.client === 'self' ? null : c.client
  const pay = c.paymentM * factor * (client ? trustMultiplier(state.trust[client]) : 1) * (first ? 1 : 0.25)
  const notes: Msg[] = []
  let fundsM = pay
  if (mission.boosterLanded === false) {
    fundsM -= 8
    notes.push(M('campaign.note.boosterLost'))
  }
  if (mission.boosterLanded === true) notes.push(M('campaign.note.boosterRecovered'))
  const better = !prev || score.total > prev.best
  let prestige = first ? RANK_PRESTIGE[score.rank] + (isSuccess(score.rank) ? 20 : 0) : better ? Math.round(RANK_PRESTIGE[score.rank] / 3) : 0
  if (first && isSuccess(score.rank) && mission.boosterLanded === true && state.boostersLanded === 0) {
    prestige += 30
    notes.push(M('campaign.note.firstLanding'))
  }
  const trust: Partial<Record<InvestorId, number>> = {}
  for (const id of Object.keys(INVESTORS) as InvestorId[]) {
    const own = id === client
    const delta = isSuccess(score.rank) ? (own ? 10 : 2) : score.rank === 'Fail' ? (own ? -12 : -3) : own ? 2 : 0
    trust[id] = delta
  }
  const next: CampaignState = {
    ...state,
    fundsM: Math.round((state.fundsM + fundsM) * 10) / 10,
    prestige: state.prestige + prestige,
    trust: Object.fromEntries((Object.keys(state.trust) as InvestorId[]).map((id) => [id, clampTrust(state.trust[id] + (trust[id] ?? 0))])) as Record<InvestorId, number>,
    completed: {
      ...state.completed,
      [contractId]: {
        best: Math.max(prev?.best ?? 0, score.total),
        rank: prev && prev.best > score.total ? prev.rank : score.rank,
        seed: prev && prev.best > score.total ? prev.seed : mission.seed,
        runs: (prev?.runs ?? 0) + 1,
      },
    },
    boostersLanded: state.boostersLanded + (mission.boosterLanded ? 1 : 0),
    history: [...state.history, { contractId, score: score.total, rank: score.rank, fundsM: Math.round(fundsM * 10) / 10, prestige }],
  }
  return { state: next, reward: { fundsM: Math.round(fundsM * 10) / 10, prestige, trust, unlocked: [], notes } }
}

export function applySoundingResult(state: CampaignState, result: SoundingResult, seed: number): { state: CampaignState; reward: Reward } {
  const rocketCost = getLauncher('paulet').costM
  const first = !state.completed.first_light
  const notes: Msg[] = []
  let fundsM = -rocketCost
  let prestige = 0
  const unlocked: string[] = []
  if (result.reachedSpace) {
    if (first) {
      fundsM += 10
      prestige += 25
      unlocked.push('commercial_launchers')
      notes.push(M('campaign.note.investorsConvinced'))
    } else prestige += 2
  } else notes.push(M('campaign.note.noSpace'))
  const rank: Rank = result.reachedSpace ? (result.recovered ? 'Outstanding' : 'Success') : result.failed ? 'Fail' : 'Partial'
  const scoreTotal = Math.round(result.science * 10)
  const next: CampaignState = {
    ...state,
    fundsM: Math.round((state.fundsM + fundsM) * 10) / 10,
    prestige: state.prestige + prestige,
    unlocked: [...new Set([...state.unlocked, ...unlocked])],
    completed: result.reachedSpace
      ? { ...state.completed, first_light: { best: Math.max(state.completed.first_light?.best ?? 0, scoreTotal), rank, seed, runs: (state.completed.first_light?.runs ?? 0) + 1 } }
      : state.completed,
    history: [...state.history, { contractId: 'first_light', score: scoreTotal, rank, fundsM, prestige }],
  }
  return { state: next, reward: { fundsM, prestige, trust: {}, unlocked, notes } }
}

export function canBuyTech(state: CampaignState, tech: TechDef): { ok: boolean; why?: Msg } {
  if (!tech.available) return { ok: false, why: M('campaign.why.comingAct', { act: tech.act }) }
  if (state.unlocked.includes(tech.id)) return { ok: false, why: M('campaign.why.unlocked') }
  if (tech.requires?.some((c) => !isSuccess(state.completed[c]?.rank))) return { ok: false, why: M('campaign.why.contract') }
  if (state.prestige < tech.prestige) return { ok: false, why: M('campaign.why.prestige', { prestige: tech.prestige }) }
  if (state.fundsM < tech.costM) return { ok: false, why: M('campaign.why.funds', { cost: tech.costM }) }
  return { ok: true }
}

export function buyTech(state: CampaignState, techId: string): CampaignState {
  const tech = TECH.find((t) => t.id === techId)!
  if (!canBuyTech(state, tech).ok) return state
  return { ...state, fundsM: Math.round((state.fundsM - tech.costM) * 10) / 10, unlocked: [...state.unlocked, tech.id] }
}
