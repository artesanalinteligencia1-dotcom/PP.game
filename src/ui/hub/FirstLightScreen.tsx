import { rich } from '../rich'
import { useCallback, useMemo, useState } from 'react'
import { audio, useMusic } from '../../audio/audio'
import { getInstrument, getLauncher } from '../../engine/catalog'
import { flySounding } from '../../engine/sounding'
import { fmt } from '../../i18n/en'
import { randomSeed, useGame } from '../../store/game'
import { Disclaimer, Pill } from '../components'
import { SoundingSequence } from './SoundingSequence'
import { useT, useTx } from '../../i18n'

const OPTIONS = ['magnetometer', 'particle_detector']

export function FirstLightScreen() {
  const campaign = useGame((s) => s.campaign)
  const finishSounding = useGame((s) => s.finishSounding)
  const go = useGame((s) => s.go)
  const t = useT()
  const tx = useTx()
  const [picked, setPicked] = useState<string[]>(['magnetometer'])
  const [seed, setSeed] = useState(randomSeed())
  const [phase, setPhase] = useState<'ready' | 'flying' | 'done'>('ready')
  const rocket = getLauncher('paulet')
  const limit = rocket.suborbital!.payloadKg
  const result = useMemo(() => flySounding(picked, seed), [picked, seed])
  useMusic(phase === 'ready' ? 'design' : phase === 'done' && result.reachedSpace ? 'launch' : 'none')
  const onDone = useCallback(() => setPhase('done'), [])
  const mass = picked.reduce((acc, id) => acc + getInstrument(id).massKg, 0)

  const director = campaign ? `${campaign.profile.title} ${campaign.profile.name}` : t('firstLight.defaultDirector')

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <button type="button" onClick={() => go(campaign ? 'campaign' : 'home')} className="text-sm text-slate-400 hover:text-slate-100" disabled={phase === 'flying'}>
        {t('firstLight.back')}
      </button>
      <h1 className="mt-2 text-2xl font-semibold">{t('firstLight.title')}</h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-300">
        {t('firstLight.desc', { director })}
      </p>
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <SoundingSequence result={result} running={phase !== 'ready'} onDone={onDone} />
        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
            <h2 className="text-sm font-semibold">{t('firstLight.experimentTitle', { limit })}</h2>
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
                        {on ? '☑' : '☐'} {tx(`component.${inst.id}.name`, inst.name)}
                      </div>
                      <div className="text-xs text-slate-400">
                        {inst.massKg} kg · {tx(`component.${inst.id}.description`, inst.description)}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="mt-2 text-xs">
              {t('firstLight.payload', { mass, limit })} {mass > limit && <span className="text-rose-300">{t('firstLight.tooHeavy')}</span>}
            </div>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-slate-300">
            <span className="font-semibold text-amber-200">{t('firstLight.history')}</span>
            {tx(`component.${rocket.id}.realWorld`, rocket.realWorld)}
          </div>
          {phase === 'ready' && (
            <>
              <label className="block text-xs text-slate-400">
                {t('firstLight.seed')}
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
                {t('firstLight.launchBtn')}
              </button>
            </>
          )}
          {phase === 'done' && (
            <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-sm">
              <h2 className="font-display text-lg font-semibold">
                {result.reachedSpace
                  ? t('firstLight.result.space')
                  : result.failed
                  ? t('firstLight.result.failed')
                  : t('firstLight.result.notQuite')}
              </h2>
              <dl className="mt-2 grid grid-cols-2 gap-y-1 text-xs">
                <dt className="text-slate-400">{t('firstLight.apogee')}</dt>
                <dd>{fmt(result.apogeeKm)} km</dd>
                <dt className="text-slate-400">{t('firstLight.burnout')}</dt>
                <dd>{fmt(result.burnoutKms, 2)} km/s</dd>
                <dt className="text-slate-400">{t('firstLight.timeInSpace')}</dt>
                <dd>{fmt(result.secondsInSpace)} s</dd>
                <dt className="text-slate-400">{t('firstLight.payloadRecovered')}</dt>
                <dd>{result.recovered ? t('firstLight.recovered.yes') : t('firstLight.recovered.no')}</dd>
                <dt className="text-slate-400">{t('firstLight.science')}</dt>
                <dd>{t('firstLight.sciencePts', { pts: fmt(result.science, 1) })}</dd>
              </dl>
              <p className="mt-2 text-xs text-slate-400">
                {rich(t('firstLight.lesson'))}
              </p>
              {campaign ? (
                <button
                  type="button"
                  onClick={() => finishSounding(result, seed)}
                  className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white hover:bg-emerald-500"
                >
                  {result.reachedSpace ? t('firstLight.reportToInvestors') : t('firstLight.backToWorkshop')}
                </button>
              ) : (
                <button type="button" onClick={() => go('home')} className="mt-3 w-full rounded-lg bg-slate-700 px-3 py-2 text-white">
                  {t('firstLight.backHome')}
                </button>
              )}
              <div className="mt-2">
                <Pill tone="slate">{t('results.seed', { seed })}</Pill>
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
