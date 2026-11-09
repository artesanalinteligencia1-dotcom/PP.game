import { rich } from './rich'
import { useMusic } from '../audio/audio'
import { scenarios } from '../engine/catalog'
import { useGame } from '../store/game'
import { Disclaimer, Pill } from './components'
import { useT, useTx, type StringKey } from '../i18n'

export function ScenarioSelect() {
  const start = useGame((s) => s.startScenario)
  const go = useGame((s) => s.go)
  const t = useT()
  const tx = useTx()
  useMusic('home')
  return (
    <main className="mx-10 py-6">
      <header className="flex items-end gap-6 border-b border-white/15 pb-3">
        <div>
          <button type="button" data-sound="back" onClick={() => go('home')} className="hud-label hover:text-white">
            {t('select.back')}
          </button>
          <h1 className="mt-1 font-display text-3xl">{t('select.title')}</h1>
        </div>
        <p className="ml-auto max-w-xl text-right text-sm text-white/60">
          {t('select.subtitle')}
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
                <span className="text-xl font-semibold">{tx(`scenario.${s.id}.name`, s.name)}</span>
                <Pill tone={s.difficulty === 'beginner' ? 'emerald' : s.difficulty === 'sandbox' ? 'sky' : s.difficulty === 'engineer' ? 'amber' : 'rose'}>{t(`difficulty.${s.difficulty}` as StringKey)}</Pill>
              </div>
              <p className="mt-1 text-sm text-sky-300">{tx(`scenario.${s.id}.tagline`, s.tagline)}</p>
              <p className="mt-3 text-sm text-slate-400">{tx(`scenario.${s.id}.objective`, s.objective)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Pill>{t('select.budget', { budget: s.budgetM })}</Pill>
                <Pill>{t('select.devMonths', { months: s.devMonths })}</Pill>
                <Pill>{t(s.requiredLifeYears === 1 ? 'select.lifeYears.one' : 'select.lifeYears.other', { years: s.requiredLifeYears })}</Pill>
              </div>
            </button>
          ))}
        </div>
      </section>
      <section className="mt-10 rounded-xl border border-slate-800 p-5 text-sm text-slate-300">
        <h2 className="font-semibold text-slate-200">{t('select.howToPlay')}</h2>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-slate-400">
          <li>{t('select.step1')}</li>
          <li>{rich(t('select.step2'))}</li>
          <li>{t('select.step3')}</li>
          <li>{rich(t('select.step4'))}</li>
        </ol>
      </section>
      <footer className="mt-8 text-center">
        <Disclaimer />
      </footer>
    </main>
  )
}
