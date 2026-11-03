import { useCallback, useMemo, useState } from 'react'
import { audio, useMusic } from '../../audio/audio'
import { getInstrument, getLauncher } from '../../engine/catalog'
import { flySounding } from '../../engine/sounding'
import { fmt } from '../../i18n/en'
import { randomSeed, useGame } from '../../store/game'
import { Disclaimer, Pill } from '../components'
import { SoundingSequence } from './SoundingSequence'

const OPTIONS = ['magnetometer', 'particle_detector']

export function FirstLightScreen() {
  const campaign = useGame((s) => s.campaign)
  const finishSounding = useGame((s) => s.finishSounding)
  const go = useGame((s) => s.go)
  const [picked, setPicked] = useState<string[]>(['magnetometer'])
  const [seed, setSeed] = useState(randomSeed())
  const [phase, setPhase] = useState<'ready' | 'flying' | 'done'>('ready')
  const rocket = getLauncher('paulet')
  const limit = rocket.suborbital!.payloadKg
  const result = useMemo(() => flySounding(picked, seed), [picked, seed])
  useMusic(phase === 'ready' ? 'design' : phase === 'done' && result.reachedSpace ? 'launch' : 'none')
  const onDone = useCallback(() => setPhase('done'), [])
  const mass = picked.reduce((t, id) => t + getInstrument(id).massKg, 0)

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <button type="button" onClick={() => go(campaign ? 'campaign' : 'home')} className="text-sm text-slate-400 hover:text-slate-100" disabled={phase === 'flying'}>
        ← Back
      </button>
      <h1 className="mt-2 text-2xl font-semibold">Prologue — First Light</h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-300">
        In a workshop in Arequipa, {campaign ? `${campaign.profile.title} ${campaign.profile.name}` : 'Dr. Pedro Goicochea'} rebuilt the liquid-propellant
        rocket described in Pedro Paulet’s notebooks. Investors will only listen once it reaches space — the 100 km line — with a real experiment on board.
      </p>
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <SoundingSequence result={result} running={phase !== 'ready'} onDone={onDone} />
        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
            <h2 className="text-sm font-semibold">Experiment (max {limit} kg)</h2>
            <ul className="mt-2 space-y-2">
              {OPTIONS.map((id) => {
                const inst = getInstrument(id)
                const on = picked.includes(id)
                return (
                  <li key={id}>
                    <button
                      type="button"
                      disabled={phase !== 'ready'}
                      onClick={() => setPicked(on ? picked.filter((x) => x !== id) : [...picked, id])}
                      className={`w-full rounded-lg border p-2 text-left ${on ? 'border-sky-400 bg-sky-500/10' : 'border-slate-700'}`}
                      aria-pressed={on}
                    >
                      <div className="font-medium">
                        {on ? '☑' : '☐'} {inst.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {inst.massKg} kg · {inst.description}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="mt-2 text-xs">
              Payload {mass} / {limit} kg {mass > limit && <span className="text-rose-300">— too heavy! A small rocket cannot carry both.</span>}
            </div>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-slate-300">
            <span className="font-semibold text-amber-200">History, honestly: </span>
            {rocket.realWorld}
          </div>
          {phase === 'ready' && (
            <>
              <label className="block text-xs text-slate-400">
                Seed
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(Math.abs(Math.floor(Number(e.target.value))) >>> 0)}
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-slate-200"
                />
              </label>
              <button
                type="button"
                disabled={!result.ok}
                onClick={() => {
                  audio.unlock()
                  setPhase('flying')
                }}
                className="font-display w-full btn-primary px-4 py-4 text-lg  disabled:cursor-not-allowed disabled:bg-slate-700"
              >
                🔥 Launch Paulet-1
              </button>
            </>
          )}
          {phase === 'done' && (
            <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-sm">
              <h2 className="font-display text-lg font-semibold">{result.reachedSpace ? 'You reached space!' : result.failed ? 'Paulet-1 failed' : 'Not quite space'}</h2>
              <dl className="mt-2 grid grid-cols-2 gap-y-1 text-xs">
                <dt className="text-slate-400">Apogee</dt>
                <dd>{fmt(result.apogeeKm)} km</dd>
                <dt className="text-slate-400">Burnout speed</dt>
                <dd>{fmt(result.burnoutKms, 2)} km/s</dd>
                <dt className="text-slate-400">Time in space</dt>
                <dd>{fmt(result.secondsInSpace)} s</dd>
                <dt className="text-slate-400">Payload recovered</dt>
                <dd>{result.recovered ? 'yes (parachute)' : 'no'}</dd>
                <dt className="text-slate-400">Science</dt>
                <dd>{fmt(result.science, 1)} pts</dd>
              </dl>
              <p className="mt-2 text-xs text-slate-400">
                Lesson: reaching space is about going <b>up</b> 100 km; staying there is about going <b>sideways</b> at ~7.8 km/s — about five times faster than Paulet-1.
              </p>
              {campaign ? (
                <button
                  type="button"
                  onClick={() => finishSounding(result, seed)}
                  className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white hover:bg-emerald-500"
                >
                  {result.reachedSpace ? 'Report to investors →' : 'Back to the workshop (−$1.5 M)'}
                </button>
              ) : (
                <button type="button" onClick={() => go('home')} className="mt-3 w-full rounded-lg bg-slate-700 px-3 py-2 text-white">
                  Back home
                </button>
              )}
              <div className="mt-2">
                <Pill tone="slate">seed {seed}</Pill>
              </div>
            </div>
          )}
        </aside>
      </div>
      <div className="mt-6">
        <Disclaimer />
      </div>
    </main>
  )
}
