import { useCallback, useMemo, useState } from 'react'
import { audio, useMusic } from '../audio/audio'
import { getLauncher, getOrbit, getScenario } from '../engine/catalog'
import { evaluateDesign } from '../engine/evaluate'
import { fmt } from '../i18n/en'
import { randomSeed, useGame } from '../store/game'
import { Disclaimer } from './components'
import { LaunchSequence, type LaunchOutcome } from './launch/LaunchSequence'
import { SpacecraftSprite } from './spacecraft/SpacecraftSprite'

type Phase = 'ready' | 'flying' | 'success' | 'failure'

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
  const [skip, setSkip] = useState(false)
  useMusic(phase === 'ready' ? 'design' : phase === 'failure' ? 'none' : 'launch')

  const failed = mission?.endReason === 'launch_failure'
  const go = () => {
    launch()
    audio.unlock()
    setSkip(reducedMotion())
    setPhase('flying')
  }
  const onDone = useCallback((o: LaunchOutcome) => setPhase(o), [])

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={backToDesign} className="text-sm text-slate-400 hover:text-slate-100" disabled={phase === 'flying'}>
          ← Back to design
        </button>
        <span className="text-xs text-slate-500">Same design + same seed + same decisions = same mission</span>
      </div>
      <h1 className="mt-3 text-2xl font-semibold">Launch pad — {scenario.name}</h1>
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <LaunchSequence design={design} running={phase !== 'ready'} failed={failed} seed={seed} onDone={onDone} skipTo={skip} />
        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
            <h2 className="text-sm font-semibold">Payload in the fairing</h2>
            <div className="mt-2 flex items-center gap-3">
              <div className="rounded-lg bg-slate-950/70 p-1">
                <SpacecraftSprite design={design} size={96} deployed={false} />
              </div>
              <dl className="grid flex-1 grid-cols-2 gap-y-1 text-xs">
                <dt className="text-slate-400">Wet mass</dt>
                <dd>{fmt(report.mass.wetKg)} kg</dd>
                <dt className="text-slate-400">Capacity</dt>
                <dd>{fmt(report.mass.capacityKg)} kg</dd>
                <dt className="text-slate-400">Target</dt>
                <dd>{orbit.name}</dd>
              </dl>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-y-1 text-xs">
              <dt className="text-slate-400">Launcher</dt>
              <dd>{launcher.name}</dd>
              <dt className="text-slate-400">Reliability</dt>
              <dd>{fmt(launcher.reliability * 100)}%</dd>
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
              <button
                type="button"
                className="rounded border border-slate-700 px-2 text-xs hover:border-slate-400"
                disabled={phase !== 'ready'}
                onClick={() => setSeed(randomSeed())}
                aria-label="Random seed"
              >
                🎲
              </button>
            </div>
            <span className="mt-1 block text-[11px] text-slate-500">Share it so friends can fly the exact same mission.</span>
          </label>
          {phase === 'ready' && (
            <button
              type="button"
              onClick={go}
              className="font-display w-full rounded-xl bg-orange-500 px-4 py-4 text-lg font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-400"
            >
              🚀 Launch
            </button>
          )}
          {phase === 'flying' && (
            <button type="button" onClick={() => setSkip(true)} className="w-full rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300">
              Skip animation
            </button>
          )}
          {phase === 'success' && (
            <button
              type="button"
              onClick={startFlight}
              className="font-display w-full rounded-xl bg-emerald-600 px-4 py-4 text-lg font-bold text-white hover:bg-emerald-500"
            >
              Start mission ▶
            </button>
          )}
          {phase === 'failure' && (
            <button type="button" onClick={showResults} className="w-full rounded-xl bg-slate-700 px-4 py-4 font-semibold text-white hover:bg-slate-600">
              See mission report
            </button>
          )}
        </aside>
      </div>
      <div className="mt-6">
        <Disclaimer />
      </div>
    </main>
  )
}
