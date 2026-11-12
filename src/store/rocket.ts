// The rocket on the workbench (per device, localStorage). The campaign does not use it yet (Rocket Engineer pad, delivery 4).
import { create } from 'zustand'
import { ROCKET_PRESETS } from '../engine/catalog/rocketParts'
import { isRocketDesign, type RocketDesign } from '../engine/rocket'

const KEY = 'ppgame.rocket.v1'
export type RocketPreset = keyof typeof ROCKET_PRESETS

interface Saved {
  design: RocketDesign
  payloadKg: number
}

function load(): Saved {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Saved> | null
    if (v && isRocketDesign(v.design)) return { design: v.design, payloadKg: Math.max(0, Number(v.payloadKg) || 0) }
  } catch {
    // unreadable: start from a preset
  }
  return { design: ROCKET_PRESETS.medium, payloadKg: 1000 }
}

function save(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // storage full or blocked: the workbench still works for this session
  }
}

interface RocketState extends Saved {
  setDesign: (design: RocketDesign) => void
  setPayload: (kg: number) => void
  loadPreset: (id: RocketPreset) => void
}

export const useRocket = create<RocketState>((set, get) => ({
  ...load(),
  setDesign: (design) => {
    set({ design })
    save({ design, payloadKg: get().payloadKg })
  },
  setPayload: (payloadKg) => {
    set({ payloadKg })
    save({ design: get().design, payloadKg })
  },
  loadPreset: (id) => {
    const design = ROCKET_PRESETS[id]
    set({ design })
    save({ design, payloadKg: get().payloadKg })
  },
}))
