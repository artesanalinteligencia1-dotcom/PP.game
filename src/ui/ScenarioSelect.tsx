import { useMusic } from '../audio/audio'
import { scenarios } from '../engine/catalog'
import { useGame } from '../store/game'
import { Disclaimer, Pill } from './components'

export function ScenarioSelect() {
  const start = useGame((s) => s.startScenario)
  const go = useGame((s) => s.go)
  useMusic('home')
  return (
    <main className="mx-10 py-6">
      <header className="flex items-end gap-6 border-b border-white/15 pb-3">
        <div>
          <button type="button" data-sound="back" onClick={() => go('home')} className="hud-label hover:text-white">
            ← Main menu
          </button>
          <h1 className="mt-1 font-display text-3xl">Free mission</h1>
        </div>
        <p className="ml-auto max-w-xl text-right text-sm text-white/60">
          Any scenario, no career progress. Every choice moves mass, power, data, budget, schedule and lifetime — and there is never
          just one right answer.
        </p>
      </header>
      <section className="mt-6">
                <div className="grid grid-cols-3 gap-4">
          {scenarios.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => start(s.id)}
              className="rounded-xl border border-slate-700 bg-slate-900/70 p-5 text-left transition hover:border-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold">{s.name}</span>
                <Pill tone={s.difficulty === 'beginner' ? 'emerald' : s.difficulty === 'sandbox' ? 'sky' : s.difficulty === 'engineer' ? 'amber' : 'rose'}>{s.difficulty}</Pill>
              </div>
              <p className="mt-1 text-sm text-sky-300">{s.tagline}</p>
              <p className="mt-3 text-sm text-slate-400">{s.objective}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Pill>${s.budgetM} M</Pill>
                <Pill>{s.devMonths} months to launch</Pill>
                <Pill>{s.requiredLifeYears} yr mission</Pill>
              </div>
            </button>
          ))}
        </div>
      </section>
      <section className="mt-10 rounded-xl border border-slate-800 p-5 text-sm text-slate-300">
        <h2 className="font-semibold text-slate-200">How to play (60 seconds)</h2>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-slate-400">
          <li>Read the briefing: goal, budget, deadline and requirements.</li>
          <li>Pick instruments in <b>Payload</b>; watch the resource meters on the right react.</li>
          <li>Tune the spacecraft, orbit, launcher and ground stations until nothing is red.</li>
          <li>Open <b>Review</b>: every warning explains why, and what you could change.</li>
        </ol>
      </section>
      <footer className="mt-8 text-center">
        <Disclaimer />
      </footer>
    </main>
  )
}
