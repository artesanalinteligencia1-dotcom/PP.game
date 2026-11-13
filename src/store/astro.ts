// The plan on the astrobiology lab's bench (per device, localStorage).
import { create } from 'zustand'
import { DEFAULT_ASTRO_PLAN, isAstroPlan, type AstroPlan } from '../engine/astrobio'

const KEY = 'ppgame.astro.v1'

function load(): AstroPlan {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (isAstroPlan(v)) return v
  } catch {
    // unreadable: start from the default plan
  }
  return DEFAULT_ASTRO_PLAN
}

export const useAstro = create<{ plan: AstroPlan; setPlan: (plan: AstroPlan) => void }>((set) => ({
  plan: load(),
  setPlan: (plan) => {
    set({ plan })
    try {
      localStorage.setItem(KEY, JSON.stringify(plan))
    } catch {
      // storage full or blocked: the lab still works for this session
    }
  },
}))
