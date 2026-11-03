// Loading screen → "Press any key". The key/click is also the gesture browsers require before playing audio.
import { useEffect, useState } from 'react'
import { MenuBackdrop } from '../hub/HomeScreen'

export function BootScreen({ onStart }: { onStart: () => void }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    const min = new Promise((r) => setTimeout(r, 700))
    Promise.all([document.fonts?.ready, min]).then(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [])
  useEffect(() => {
    if (!ready) return
    const go = (e: Event) => {
      if (e instanceof KeyboardEvent && ['F11', 'F12', 'Tab'].includes(e.key)) return
      onStart()
    }
    // Start on release, so the same key/click cannot also press the first menu button that gets focus.
    window.addEventListener('keyup', go)
    window.addEventListener('pointerup', go)
    return () => {
      window.removeEventListener('keyup', go)
      window.removeEventListener('pointerup', go)
    }
  }, [ready, onStart])
  return (
    <main className="relative h-full overflow-hidden">
      <div className="absolute inset-0 opacity-60 blur-[2px]">
        <MenuBackdrop />
      </div>
      <div className="absolute inset-0 bg-slate-950/50" />
      <div className="relative grid h-full place-items-center text-center">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-sky-300">Space Mission Design</p>
          <h1 className="mt-2 text-8xl font-bold tracking-tight">PP.game</h1>
          <div className="mx-auto mt-10 h-1 w-64 overflow-hidden rounded bg-slate-800">
            <div className={`h-full bg-orange-500 transition-all duration-700 ${ready ? 'w-full' : 'w-1/3'}`} />
          </div>
          <p className={`mt-6 font-display text-lg tracking-wide ${ready ? 'boot-pulse text-slate-100' : 'text-slate-500'}`} aria-live="polite">
            {ready ? 'Press any key to start' : 'Loading…'}
          </p>
          <p className="mt-16 text-[11px] text-slate-500">Simplified educational model · Pedro Goicochea is a fictional character inspired by Pedro Paulet</p>
        </div>
      </div>
    </main>
  )
}
