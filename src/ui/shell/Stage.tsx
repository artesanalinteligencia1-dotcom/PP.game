// The game stage: a fixed 16:9 canvas (1440×810 design pixels) zoomed to fit the window, with letterbox bars.
// Screens scroll inside the stage when they are taller than it; the page itself never scrolls.
import { useEffect, useState, type ReactNode } from 'react'
import { audio } from '../../audio/audio'
import { useSettings } from '../../store/settings'

export const STAGE_W = 1440
export const STAGE_H = 810

function fit() {
  if (typeof window === 'undefined') return 1
  return Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H)
}

export function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(fit)
  const uiSounds = useSettings((s) => s.uiSounds)
  useEffect(() => {
    const on = () => setScale(fit())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  // Interface sounds come from real input events (never from animation frames).
  const isControl = (el: EventTarget | null) => el instanceof Element && el.closest('button:not(:disabled), [role="button"], a[href], select, input[type="range"]')
  return (
    <div className="fixed inset-0 grid place-items-center overflow-hidden bg-black">
      <div
        id="stage"
        className="stage relative overflow-hidden bg-[#020617]"
        style={{ width: STAGE_W, height: STAGE_H, zoom: scale }}
        onPointerOver={(e) => {
          if (!uiSounds || e.pointerType !== 'mouse') return
          const el = isControl(e.target)
          if (el && el !== isControl(e.relatedTarget)) audio.ui('hover')
        }}
        onClickCapture={(e) => {
          if (!uiSounds) return
          const el = isControl(e.target)
          if (el) audio.ui(el.getAttribute('data-sound') === 'back' ? 'back' : 'click')
        }}
      >
        {children}
      </div>
    </div>
  )
}
