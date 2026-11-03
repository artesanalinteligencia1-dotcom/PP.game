import { create } from 'zustand'
import {
  CONTRACTS,
  LEVEL_TO_DIFFICULTY,
  applyOrbitalResult,
  applySoundingResult,
  availableLaunchers,
  buyTech as buyTechPure,
  newCampaign,
  type CampaignState,
  type Profile,
  type Reward,
} from '../engine/campaign'
import { getInstrument, getOrbit, getBand, getScenario, launchers } from '../engine/catalog'
import { scoreMission } from '../engine/score'
import { advanceWeek, botChoice, createMission, decide, type MissionState, type Personality } from '../engine/simulate'
import type { SoundingResult } from '../engine/sounding'
import type { Design, Role } from '../engine/types'
import { validateCampaign } from './save'
import { readShareFromHash } from './share'

export type TabId = 'mission' | 'payload' | 'spacecraft' | 'orbit' | 'comms' | 'review'
export type Screen = 'home' | 'campaign' | 'free' | 'intro' | 'learn' | 'firstlight' | 'design' | 'launch' | 'flight' | 'results'

const CAMPAIGN_KEY = 'ppgame.campaign.v1'
function loadCampaign(): CampaignState | null {
  try {
    const raw = localStorage.getItem(CAMPAIGN_KEY)
    return raw ? validateCampaign(JSON.parse(raw)) : null
  } catch {
    return null
  }
}
function saveCampaign(c: CampaignState | null) {
  try {
    if (c) localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(c))
    else localStorage.removeItem(CAMPAIGN_KEY)
  } catch {
    /* storage unavailable: progress lasts for this visit only */
  }
}
const shared = readShareFromHash()

export const ALL_ROLES: Role[] = ['lead', 'engineer', 'astrophysicist', 'astrobiologist']

export function randomSeed(): number {
  return Math.floor(Math.random() * 900000) + 100000
}

interface GameState {
  mode: 'free' | 'campaign'
  contractId: string | null
  campaign: CampaignState | null
  lastReward: (Reward & { contractTitle: string }) | null
  rewardCollected: boolean
  learnTab: string
  scenarioId: string | null
  design: Design | null
  tab: TabId
  screen: Screen
  seed: number
  mission: MissionState | null
  /** Bumped whenever the (mutable) mission object changes, to re-render. */
  tick: number
  playing: boolean
  /** Simulated weeks per real second. */
  speed: number
  delegated: Record<Role, boolean>
  personality: Personality
  go: (screen: Screen) => void
  openLearn: (tab?: string) => void
  startCampaign: (profile: Profile) => void
  /** Replace the career with an imported save (already validated by parseSaveFile). */
  loadCampaignState: (c: CampaignState) => void
  resetCampaign: () => void
  setProfile: (profile: Profile) => void
  startContract: (contractId: string) => void
  finishSounding: (result: SoundingResult, seed: number) => void
  collectReward: () => void
  buyTech: (techId: string) => void
  launcherAllowed: (launcherId: string) => boolean
  startScenario: (id: string) => void
  exit: () => void
  resetDesign: () => void
  setTab: (tab: TabId) => void
  update: (patch: Partial<Design>) => void
  toggleInstrument: (id: string) => void
  setDuty: (id: string, duty: number) => void
  toggleStation: (id: string) => void
  setOrbit: (id: string) => void
  setBand: (id: string) => void
  // Phase 2
  goToLaunchPad: () => void
  setSeed: (seed: number) => void
  launch: () => void
  startFlight: () => void
  stepWeeks: (weeks: number) => void
  choose: (optionId: string, byBot?: boolean) => void
  setPlaying: (p: boolean) => void
  setSpeed: (weeksPerSecond: number) => void
  toggleDelegate: (role: Role) => void
  setPersonality: (p: Personality) => void
  showResults: () => void
  backToDesign: () => void
  flyAgain: (sameSeed: boolean) => void
}

export const useGame = create<GameState>((set, get) => ({
  mode: 'free',
  contractId: null,
  campaign: loadCampaign(),
  lastReward: null,
  rewardCollected: false,
  learnTab: 'orbit',
  scenarioId: shared ? shared.design.scenarioId : null,
  design: shared ? shared.design : null,
  tab: shared ? 'review' : 'mission',
  screen: shared ? 'design' : 'home',
  seed: shared ? shared.seed : randomSeed(),
  mission: null,
  tick: 0,
  playing: false,
  speed: 13,
  delegated: { lead: false, engineer: false, astrophysicist: false, astrobiologist: false },
  personality: 'balanced',
  go: (screen) => set({ screen, playing: false }),
  openLearn: (tab) => set({ screen: 'learn', learnTab: tab ?? get().learnTab }),
  startCampaign: (profile) => {
    const c = newCampaign(profile)
    saveCampaign(c)
    set({ campaign: c, screen: 'campaign', mode: 'campaign', lastReward: null })
  },
  loadCampaignState: (c) => {
    saveCampaign(c)
    set({ campaign: c, screen: 'campaign', mode: 'campaign', lastReward: null })
  },
  resetCampaign: () => {
    saveCampaign(null)
    set({ campaign: null, screen: 'home', lastReward: null })
  },
  setProfile: (profile) => {
    const c = get().campaign
    if (!c) return
    const next = { ...c, profile }
    saveCampaign(next)
    set({ campaign: next })
  },
  startContract: (contractId) => {
    const k = CONTRACTS.find((c) => c.id === contractId)
    if (!k) return
    if (k.kind === 'sounding') return set({ mode: 'campaign', contractId, screen: 'firstlight' })
    const sc = getScenario(k.scenarioId!)
    const allowed = get().campaign ? availableLaunchers(get().campaign!) : launchers.map((l) => l.id)
    const base = structuredClone(sc.baseDesign)
    if (!allowed.includes(base.launcherId)) base.launcherId = allowed.find((id) => id !== 'paulet') ?? base.launcherId
    set({ mode: 'campaign', contractId, scenarioId: sc.id, design: base, tab: 'mission', screen: 'design', mission: null, rewardCollected: false })
  },
  finishSounding: (result, seed) => {
    const c = get().campaign
    if (!c) return
    const { state, reward } = applySoundingResult(c, result, seed)
    saveCampaign(state)
    set({ campaign: state, lastReward: { ...reward, contractTitle: 'First Light' }, screen: 'campaign' })
  },
  collectReward: () => {
    const { campaign, contractId, mission, rewardCollected } = get()
    if (!campaign || !contractId || !mission || rewardCollected) return set({ screen: 'campaign', design: null, mission: null })
    const sc = getScenario(mission.scenarioId)
    const { state, reward } = applyOrbitalResult(campaign, contractId, scoreMission(mission, sc), mission)
    saveCampaign(state)
    set({
      campaign: state,
      lastReward: { ...reward, contractTitle: CONTRACTS.find((k) => k.id === contractId)?.title ?? contractId },
      rewardCollected: true,
      screen: 'campaign',
      design: null,
      mission: null,
    })
  },
  buyTech: (techId) => {
    const c = get().campaign
    if (!c) return
    const next = buyTechPure(c, techId)
    saveCampaign(next)
    set({ campaign: next })
  },
  launcherAllowed: (launcherId) => {
    const { mode, campaign } = get()
    return mode !== 'campaign' || !campaign || availableLaunchers(campaign).includes(launcherId)
  },
  startScenario: (id) =>
    set({ mode: 'free', contractId: null, scenarioId: id, design: structuredClone(getScenario(id).baseDesign), tab: 'mission', screen: 'design', mission: null }),
  exit: () =>
    set({ scenarioId: null, design: null, tab: 'mission', screen: get().mode === 'campaign' ? 'campaign' : 'free', mission: null, playing: false }),
  resetDesign: () => {
    const id = get().scenarioId
    if (id) set({ design: structuredClone(getScenario(id).baseDesign) })
  },
  setTab: (tab) => set({ tab }),
  update: (patch) => set((s) => (s.design ? { design: { ...s.design, ...patch } } : s)),
  toggleInstrument: (id) =>
    set((s) => {
      if (!s.design) return s
      const has = s.design.instruments.some((i) => i.id === id)
      const instruments = has
        ? s.design.instruments.filter((i) => i.id !== id)
        : [...s.design.instruments, { id, duty: getInstrument(id).defaultDuty }]
      return { design: { ...s.design, instruments } }
    }),
  setDuty: (id, duty) =>
    set((s) =>
      s.design ? { design: { ...s.design, instruments: s.design.instruments.map((i) => (i.id === id ? { ...i, duty } : i)) } } : s,
    ),
  toggleStation: (id) =>
    set((s) => {
      if (!s.design) return s
      const has = s.design.stationIds.includes(id)
      return { design: { ...s.design, stationIds: has ? s.design.stationIds.filter((x) => x !== id) : [...s.design.stationIds, id] } }
    }),
  setOrbit: (id) =>
    set((s) => (s.design ? { design: { ...s.design, orbitId: id, altitudeKm: getOrbit(id).defaultAltitudeKm } } : s)),
  setBand: (id) =>
    set((s) => {
      if (!s.design) return s
      const band = getBand(id)
      const antennaId = band.antennas.includes(s.design.antennaId) ? s.design.antennaId : band.antennas[0]
      return { design: { ...s.design, bandId: id, antennaId } }
    }),

  goToLaunchPad: () => set({ screen: 'launch', mission: null, playing: false }),
  setSeed: (seed) => set({ seed: Math.abs(Math.floor(seed)) >>> 0 }),
  launch: () => {
    const { design, seed } = get()
    if (!design) return
    const { mode, campaign } = get()
    const difficulty = mode === 'campaign' && campaign ? LEVEL_TO_DIFFICULTY[campaign.profile.level] : undefined
    const mission = createMission(design, getScenario(design.scenarioId), seed, { difficulty })
    set({ mission, tick: get().tick + 1 })
  },
  startFlight: () => set({ screen: 'flight', playing: true }),
  stepWeeks: (weeks) => {
    const s = get().mission
    if (!s) return
    const { delegated, personality } = get()
    let n = weeks
    let guard = 0
    while (n > 0 && s.phase !== 'ended' && guard++ < 1000) {
      if (s.pending) {
        if (delegated[s.pending.role]) decide(s, botChoice(s.pending, personality), true)
        else break
      } else {
        advanceWeek(s)
        n--
      }
    }
    // Resolve a delegated decision raised in the last step.
    if (s.pending && delegated[s.pending.role]) decide(s, botChoice(s.pending, personality), true)
    set({ tick: get().tick + 1, playing: s.phase === 'ended' ? false : get().playing })
  },
  choose: (optionId, byBot = false) => {
    const s = get().mission
    if (!s || !s.pending) return
    decide(s, byBot ? botChoice(s.pending, get().personality) : optionId, byBot)
    set({ tick: get().tick + 1 })
  },
  setPlaying: (playing) => set({ playing }),
  setSpeed: (speed) => set({ speed }),
  toggleDelegate: (role) => set((s) => ({ delegated: { ...s.delegated, [role]: !s.delegated[role] } })),
  setPersonality: (personality) => set({ personality }),
  showResults: () => set({ screen: 'results', playing: false }),
  backToDesign: () => set({ screen: 'design', tab: 'review', mission: null, playing: false }),
  flyAgain: (sameSeed) => set({ screen: 'launch', mission: null, playing: false, seed: sameSeed ? get().seed : randomSeed() }),
}))
