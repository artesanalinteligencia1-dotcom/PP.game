import { create } from 'zustand'
import { getInstrument, getOrbit, getBand, getScenario } from '../engine/catalog'
import type { Design } from '../engine/types'

export type TabId = 'mission' | 'payload' | 'spacecraft' | 'orbit' | 'comms' | 'review'

interface GameState {
  scenarioId: string | null
  design: Design | null
  tab: TabId
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
}

export const useGame = create<GameState>((set, get) => ({
  scenarioId: null,
  design: null,
  tab: 'mission',
  startScenario: (id) => set({ scenarioId: id, design: structuredClone(getScenario(id).baseDesign), tab: 'mission' }),
  exit: () => set({ scenarioId: null, design: null, tab: 'mission' }),
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
}))
