import { create } from 'zustand'
import { getInstrument, getOrbit, getBand, getScenario } from '../engine/catalog'
import { advanceWeek, botChoice, createMission, decide, type MissionState, type Personality } from '../engine/simulate'
import type { Design, Role } from '../engine/types'

export type TabId = 'mission' | 'payload' | 'spacecraft' | 'orbit' | 'comms' | 'review'
export type Screen = 'design' | 'launch' | 'flight' | 'results'

export const ALL_ROLES: Role[] = ['lead', 'engineer', 'astrophysicist', 'astrobiologist']

export function randomSeed(): number {
  return Math.floor(Math.random() * 900000) + 100000
}

interface GameState {
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
  scenarioId: null,
  design: null,
  tab: 'mission',
  screen: 'design',
  seed: randomSeed(),
  mission: null,
  tick: 0,
  playing: false,
  speed: 13,
  delegated: { lead: false, engineer: false, astrophysicist: false, astrobiologist: false },
  personality: 'balanced',
  startScenario: (id) =>
    set({ scenarioId: id, design: structuredClone(getScenario(id).baseDesign), tab: 'mission', screen: 'design', mission: null }),
  exit: () => set({ scenarioId: null, design: null, tab: 'mission', screen: 'design', mission: null, playing: false }),
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
    const mission = createMission(design, getScenario(design.scenarioId), seed)
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
