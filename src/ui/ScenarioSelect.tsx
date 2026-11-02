import { useMusic } from '../audio/audio'
import { scenarios } from '../engine/catalog'
import { useGame } from '../store/game'
import { Disclaimer, Pill } from './components'

export function ScenarioSelect() {
  const start = useGame((s) => s.startScenario)
  const go = useGame((s) => s.go)
  useMusic('home')
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <button type="button" onClick={() => go('home')} className="text-sm text-slate-400 hover:text-slate-100">
        ← Home
      </button>
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-400">Space Mission Design</p>
        <h1 className="mt-2 text-4xl font-bold sm:text-5xl">PP.game</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-300">
          Design a real-feeling space mission. Every choice moves mass, power, data, budget, schedule and lifetime — and there is
          never just one right answer.
        </p>
      </header>
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Free mission — choose any scenario (no career progress)</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
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
