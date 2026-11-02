import { useEffect, useMemo, useRef, useState } from 'react'
import { getLauncher, getOrbit, getScenario } from '../engine/catalog'
import { evaluateDesign } from '../engine/evaluate'
import { fmt } from '../i18n/en'
import { randomSeed, useGame } from '../store/game'
import { Disclaimer, Pill } from './components'

type Phase = 'ready' | 'countdown' | 'ascent' | 'success' | 'failure'

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function LaunchScreen() {
  const design = useGame((s) => s.design)!
  const seed = useGame((s) => s.seed)
  const setSeed = useGame((s) => s.setSeed)
  const launch = useGame((s) => s.launch)
  const startFlight = useGame((s) => s.startFlight)
  const showResults = useGame((s) => s.showResults)
  const backToDesign = useGame((s) => s.backToDesign)
  const mission = useGame((s) => s.mission)
  const scenario = getScenario(design.scenarioId)
  const report = useMemo(() => evaluateDesign(design, scenario), [design, scenario])
  const launcher = getLauncher(design.launcherId)
  const orbit = getOrbit(design.orbitId)
  const [phase, setPhase] = useState<Phase>('ready')
  const [count, setCount] = useState(3)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const failed = mission?.endReason === 'launch_failure'
  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms))

  const go = () => {
    launch()
    if (reducedMotion()) {
      setPhase(useGame.getState().mission?.endReason === 'launch_failure' ? 'failure' : 'success')
      return
    }
    setPhase('countdown')
    setCount(3)
    later(1000, () => setCount(2))
    later(2000, () => setCount(1))
    later(3000, () => setPhase('ascent'))
    later(7200, () => setPhase(useGame.getState().mission?.endReason === 'launch_failure' ? 'failure' : 'success'))
  }
  const skip = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    if (!mission) launch()
    setPhase(useGame.getState().mission?.endReason === 'launch_failure' ? 'failure' : 'success')
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={backToDesign} className="text-sm text-slate-400 hover:text-slate-100" disabled={phase === 'countdown' || phase === 'ascent'}>
          ← Back to design
        </button>
        <span className="text-xs text-slate-500">Mission seed: same design + same seed + same decisions = same mission</span>
      </div>
      <h1 className="mt-3 text-2xl font-semibold">Launch pad — {scenario.name}</h1>
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className={`launch-stage relative h-[420px] overflow-hidden rounded-xl border border-slate-800 ${phase} ${failed ? 'failing' : ''}`}>
          <div className="stars absolute inset-0" />
          <svg viewBox="0 0 400 420" className="absolute inset-0 h-full w-full" role="img" aria-label="Launch animation">
            <rect x="0" y="380" width="400" height="40" fill="#1e293b" />
            <rect x="150" y="360" width="100" height="22" fill="#334155" />
            <rect x="238" y="210" width="8" height="150" fill="#475569" />
            <g className="rocket">
              <g className="upper">
                <path d="M200 190 C188 205 186 225 186 245 L214 245 C214 225 212 205 200 190 Z" fill="#e2e8f0" />
                <rect x="186" y="245" width="28" height="40" fill="#cbd5e1" />
                <circle cx="200" cy="230" r="5" fill="#38bdf8" />
              </g>
              <g className="booster">
                <rect x="184" y="285" width="32" height="70" fill="#f1f5f9" />
                <rect x="184" y="300" width="32" height="6" fill="#f97316" />
                <path d="M184 340 L172 360 L184 355 Z M216 340 L228 360 L216 355 Z" fill="#94a3b8" />
                <g className="flame">
                  <path d="M190 356 Q200 410 210 356 Z" fill="#fbbf24" />
                  <path d="M194 356 Q200 390 206 356 Z" fill="#fff7ed" />
                </g>
              </g>
            </g>
            <g className="boom" opacity="0">
              <circle cx="200" cy="120" r="40" fill="#f97316" />
              <circle cx="200" cy="120" r="24" fill="#fde68a" />
            </g>
          </svg>
          {phase === 'countdown' && (
            <div className="absolute inset-0 grid place-items-center">
              <span key={count} className="countdown text-8xl font-black text-white drop-shadow-lg">
                {count}
              </span>
            </div>
          )}
          {phase === 'success' && (
            <div className="absolute inset-x-0 top-10 text-center">
              <p className="text-3xl font-bold text-emerald-300">Orbit reached!</p>
              <p className="mt-1 text-sm text-slate-300">Heading to {orbit.name}.</p>
            </div>
          )}
          {phase === 'failure' && (
            <div className="absolute inset-x-0 top-10 text-center">
              <p className="text-3xl font-bold text-rose-400">Launch failure</p>
              <p className="mt-1 text-sm text-slate-300">
                The {launcher.name} succeeds ~{fmt(launcher.reliability * 100)}% of the time. Not today.
              </p>
            </div>
          )}
        </div>
        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
            <h2 className="font-semibold">Flight readiness</h2>
            <dl className="mt-2 grid grid-cols-2 gap-y-1 text-xs">
              <dt className="text-slate-400">Launcher</dt>
              <dd>{launcher.name}</dd>
              <dt className="text-slate-400">Reliability</dt>
              <dd>{fmt(launcher.reliability * 100)}%</dd>
              <dt className="text-slate-400">Wet mass</dt>
              <dd>
                {fmt(report.mass.wetKg)} / {fmt(report.mass.capacityKg)} kg
              </dd>
              <dt className="text-slate-400">Success chance</dt>
              <dd>{fmt(report.risk.successProbability * 100)}%</dd>
              <dt className="text-slate-400">Planned life</dt>
              <dd>{fmt(design.designLifeYears, 1)} yr</dd>
            </dl>
          </div>
          <label className="block rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
            <span className="font-semibold">Mission seed</span>
            <div className="mt-2 flex gap-2">
              <input
                type="number"
                className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 font-mono"
                value={seed}
                disabled={phase !== 'ready'}
                onChange={(e) => setSeed(Number(e.target.value))}
              />
              <button type="button" className="rounded border border-slate-700 px-2 text-xs hover:border-slate-400" disabled={phase !== 'ready'} onClick={() => setSeed(randomSeed())}>
                🎲
              </button>
            </div>
            <span className="mt-1 block text-[11px] text-slate-500">Share it so friends can fly the exact same mission.</span>
          </label>
          {phase === 'ready' && (
            <button type="button" onClick={go} className="w-full rounded-xl bg-orange-500 px-4 py-4 text-lg font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-400">
              🚀 Launch
            </button>
          )}
          {(phase === 'countdown' || phase === 'ascent') && (
            <button type="button" onClick={skip} className="w-full rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300">
              Skip animation
            </button>
          )}
          {phase === 'success' && (
            <button type="button" onClick={startFlight} className="w-full rounded-xl bg-emerald-600 px-4 py-4 text-lg font-bold text-white hover:bg-emerald-500">
              Start mission ▶
            </button>
          )}
          {phase === 'failure' && (
            <button type="button" onClick={showResults} className="w-full rounded-xl bg-slate-700 px-4 py-4 font-semibold text-white hover:bg-slate-600">
              See mission report
            </button>
          )}
          {failed !== undefined && <Pill tone="slate">seed {seed}</Pill>}
        </aside>
      </div>
      <div className="mt-6">
        <Disclaimer />
      </div>
    </main>
  )
}
