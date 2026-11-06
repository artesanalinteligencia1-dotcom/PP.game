// Art-direction mock-ups (?mock=1|2|3). Static, coded screens with the game's real data, for the user to choose a
// visual direction before the whole UI is restyled. Loaded lazily so the fonts below never reach the normal game.
import { lazy, Suspense, useState } from 'react'

export type MockId = 1 | 2 | 3
export function mockFromUrl(): MockId | null {
  try {
    const n = Number(new URLSearchParams(window.location.search).get('mock'))
    return n === 1 || n === 2 || n === 3 ? n : null
  } catch {
    return null
  }
}

const Mocks = lazy(() => import('./Mocks'))

export const MOCK_NAMES: Record<MockId, string> = {
  1: "Paulet's notebook",
  2: 'Retro-futurist console',
  3: 'Modern space-agency HUD',
}

export function MockScreen({ n }: { n: MockId }) {
  const [view, setView] = useState<'menu' | 'design'>('menu')
  return (
    <div className="relative h-full">
      <Suspense fallback={<div className="grid h-full place-items-center text-slate-400">Loading mock-up…</div>}>
        <Mocks n={n} view={view} />
      </Suspense>
      <div className="absolute bottom-2 left-1/2 z-50 flex -translate-x-1/2 opacity-80 transition hover:opacity-100 items-center gap-2 rounded-full border border-white/20 bg-black/75 px-3 py-1.5 font-sans text-xs text-white shadow-xl backdrop-blur">
        <span className="text-white/60">Mock-up</span>
        {([1, 2, 3] as MockId[]).map((m) => (
          <a key={m} href={`?mock=${m}`} className={`rounded-full px-2 py-0.5 ${m === n ? 'bg-white text-black' : 'hover:bg-white/15'}`}>
            {m}. {MOCK_NAMES[m]}
          </a>
        ))}
        <span className="mx-1 h-4 w-px bg-white/30" />
        {(['menu', 'design'] as const).map((v) => (
          <button key={v} type="button" onClick={() => setView(v)} className={`rounded-full px-2 py-0.5 ${view === v ? 'bg-sky-500 text-white' : 'hover:bg-white/15'}`}>
            {v === 'menu' ? 'Main menu' : 'Design screen'}
          </button>
        ))}
        <a href="./" className="ml-1 rounded-full px-2 py-0.5 text-white/60 hover:bg-white/15">Exit</a>
      </div>
    </div>
  )
}
