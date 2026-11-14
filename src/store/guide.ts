// What the robot guide is saying. Screens publish their content (useGuideContent); the dock in App shows it.
import { useEffect } from 'react'
import { create } from 'zustand'
import type { GuideMood } from '../ui/guide/robots'

export interface GuideAction {
  label: string
  run: () => void
}

export interface GuideLine {
  title?: string
  text: string
  mood?: GuideMood
  /** e.g. "Show me": opens the tab where the fix is. */
  action?: GuideAction
}

export interface GuideContent {
  /** A new id resets the dock (closed, first line); the same id keeps where the player was. */
  id: string
  /** The face while the dock is closed. */
  mood: GuideMood
  /** Number on the closed robot (issues waiting). */
  badge?: number
  lines: GuideLine[]
  /** Opens by itself the first time this key is seen (e.g. a mission's results). */
  autoOpenKey?: string
  /** Always open (the tutorial). */
  forceOpen?: boolean
  /** Tutorial buttons, instead of browsing the lines. */
  primary?: GuideAction
  secondary?: GuideAction
  /** "2 of 8" for the tutorial. */
  progress?: string
}

interface GuideStore {
  content: GuideContent | null
  open: boolean
  index: number
  openedKeys: string[]
  /** The id of the last content shown, kept while no screen talks (a screen remounting keeps its place). */
  lastId: string | null
  setContent: (c: GuideContent | null) => void
  setOpen: (open: boolean) => void
  setIndex: (i: number) => void
}

export const useGuide = create<GuideStore>((set) => ({
  content: null,
  open: false,
  index: 0,
  openedKeys: [],
  lastId: null,
  setContent: (c) =>
    set((s) => {
      if (!c) return { content: null }
      const changed = s.lastId !== c.id
      let open = changed ? false : s.open
      const index = changed ? 0 : Math.min(s.index, Math.max(0, c.lines.length - 1))
      if (c.autoOpenKey && !s.openedKeys.includes(c.autoOpenKey)) return { content: c, lastId: c.id, open: true, index: 0, openedKeys: [...s.openedKeys, c.autoOpenKey] }
      if (c.forceOpen) open = true
      return { content: c, lastId: c.id, open, index }
    }),
  setOpen: (open) => set({ open }),
  setIndex: (index) => set({ index }),
}))

/** A screen tells the guide what to say while it is on screen. */
export function useGuideContent(content: GuideContent | null) {
  const setContent = useGuide((s) => s.setContent)
  useEffect(() => {
    setContent(content)
  })
  useEffect(() => () => setContent(null), [setContent])
}
