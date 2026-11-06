// Player settings (per device, localStorage). Volumes live in the audio engine (it persists them itself).
import { create } from 'zustand'

export type PadLight = 'auto' | 'dawn' | 'day' | 'night'
export type MotionPref = 'system' | 'reduced' | 'full'
export type Language = 'en'

export interface Settings {
  padLight: PadLight
  motion: MotionPref
  language: Language
  uiSounds: boolean
}

const KEY = 'ppgame.settings.v1'
export const DEFAULT_SETTINGS: Settings = { padLight: 'auto', motion: 'system', language: 'en', uiSounds: true }

function read(): Settings {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Settings> | null
    if (!v) return { ...DEFAULT_SETTINGS }
    return {
      padLight: ['auto', 'dawn', 'day', 'night'].includes(v.padLight as string) ? v.padLight! : 'auto',
      motion: ['system', 'reduced', 'full'].includes(v.motion as string) ? v.motion! : 'system',
      language: 'en',
      uiSounds: v.uiSounds !== false,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

interface SettingsStore extends Settings {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

export const useSettings = create<SettingsStore>((set, get) => ({
  ...(typeof window !== 'undefined' ? read() : DEFAULT_SETTINGS),
  set: (key, value) => {
    set({ [key]: value } as Partial<SettingsStore>)
    const { padLight, motion, language, uiSounds } = get()
    try {
      localStorage.setItem(KEY, JSON.stringify({ padLight, motion, language, uiSounds }))
    } catch {
      /* ignore */
    }
  },
}))

/** True when animations should be cut short: the player's choice, or the system setting when on "system". */
export function prefersReducedMotion(): boolean {
  const m = useSettings.getState().motion
  if (m !== 'system') return m === 'reduced'
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
}
export function useReducedMotion(): boolean {
  const m = useSettings((s) => s.motion)
  if (m !== 'system') return m === 'reduced'
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
}
