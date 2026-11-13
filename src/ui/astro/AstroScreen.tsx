// Astrobiologist pad: plan the search for water, habitability and signs of life on a world, and watch the evidence and
// the data budget move live.
import { useMemo } from 'react'
import { useMusic } from '../../audio/audio'
import { ASTRO_INSTRUMENT_IDS, ASTRO_TARGETS, COVERED, LINE_QUESTION, analyzeAstro, getAstroTarget, toggleAstroInstrument, type AstroIssue, type AstroQuestion } from '../../engine/astrobio'
import { dataGbPerDay } from '../../engine/budget'
import { getInstrument } from '../../engine/catalog'
import { useT, useTx, type StringKey } from '../../i18n'
import { fmt, localizeParams } from '../../i18n/en'
import { useAstro } from '../../store/astro'
import { useGame } from '../../store/game'
import { Disclaimer, OptionCard, Section, Slider } from '../components'

const QUESTIONS: AstroQuestion[] = ['water', 'habitability', 'biosignature']
const Q_COLOR: Record<AstroQuestion, string> = { water: 'bg-sky-400', habitability: 'bg-emerald-400', biosignature: 'bg-fuchsia-400' }
const Q_TEXT: Record<AstroQuestion, string> = { water: 'text-sky-300', habitability: 'text-emerald-300', biosignature: 'text-fuchsia-300' }

function Bar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div className="h-2 overflow-hidden rounded bg-slate-800" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)} aria-label={label}>
      <div className={`h-full ${color}`} style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  )
}

export function AstroScreen() {
  const t = useT()
  const tx = useTx()
  const go = useGame((s) => s.go)
  const update = useGame((s) => s.update)
  // opened from a mission's payload tab: offer to send the instruments back
  const inMission = useGame((s) => s.design !== null && s.mission === null)
  const { plan, setPlan } = useAstro()
  useMusic('design')
  const report = useMemo(() => analyzeAstro(plan), [plan])
  const target = getAstroTarget(plan.targetId) ?? ASTRO_TARGETS[0]
  const name = (id: string) => tx(`component.${id}.name`, getInstrument(id).name)
  const issueText = (i: AstroIssue) => {
    const p = localizeParams(i.params)
    return { title: t(`astro.issue.${i.code}.title` as StringKey, p), why: t(`astro.issue.${i.code}.why` as StringKey, p) }
  }
  const presenceKey = (p: number): StringKey => (p <= 0 ? 'astro.presence.none' : p < 0.5 ? 'astro.presence.weak' : 'astro.presence.strong')

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <button type="button" onClick={() => go(inMission ? 'design' : 'home')} className="text-sm text-slate-400 hover:text-slate-100">
        {t(inMission ? 'astro.backToMission' : 'astro.back')}
      </button>
      <h1 className="mt-2 text-2xl font-semibold">{t('astro.title')}</h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-400">{t('astro.subtitle')}</p>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_minmax(0,26rem)]">
        <div>
          <Section title={t('astro.targets')} hint={t('astro.targets.hint')}>
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
              {ASTRO_TARGETS.map((w) => (
                <OptionCard key={w.id} selected={plan.targetId === w.id} onClick={() => setPlan({ ...plan, targetId: w.id, downlinkGbDay: w.downlinkGbDay })} title={tx(`astro.target.${w.id}.name`, w.id)}>
                  {tx(`astro.target.${w.id}.blurb`, '')}
                </OptionCard>
              ))}
            </div>
            <p className="mt-3 rounded-lg border border-sky-500/30 bg-sky-500/5 p-3 text-xs text-slate-300">
              <span className="font-semibold text-sky-300">{t('orbit.realWorld')}</span>
              {tx(`astro.target.${target.id}.real`, '')}
            </p>
          </Section>

          <Section title={t('astro.instruments')} hint={t('astro.instruments.hint')}>
            <div className="grid gap-2 sm:grid-cols-2">
              {ASTRO_INSTRUMENT_IDS.map((id) => {
                const inst = getInstrument(id)
                const sel = plan.instruments.find((i) => i.id === id)
                return (
                  <div key={id} className={`rounded-lg border p-3 ${sel ? 'border-sky-400/70 bg-sky-500/5' : 'border-slate-800 bg-slate-900/60'}`}>
                    <button type="button" className="w-full text-left" aria-pressed={!!sel} onClick={() => setPlan(toggleAstroInstrument(plan, id))}>
                      <span className="font-medium text-slate-100">{name(id)}</span>
                      <span className="mt-0.5 block text-[11px] text-slate-400">{t('astro.instrument.stats', { kg: fmt(inst.massKg), w: fmt(inst.powerW), gb: fmt(dataGbPerDay(inst.dataRateMbps, sel?.duty ?? inst.defaultDuty), 1) })}</span>
                      <span className="mt-1 block text-xs text-slate-300">{tx(`astro.why.${id}`, inst.description)}</span>
                    </button>
                    {sel && (
                      <div className="mt-2">
                        <Slider label={t('astro.duty')} value={Math.round(sel.duty * 100)} min={1} max={100} step={1} onChange={(v) => setPlan({ ...plan, instruments: plan.instruments.map((i) => (i.id === id ? { ...i, duty: v / 100 } : i)) })} format={(v) => `${v}%`} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Section>

          <Section title={t('astro.downlink')} hint={t('astro.downlink.hint')}>
            <Slider label={t('astro.downlink')} value={plan.downlinkGbDay} min={1} max={300} step={1} onChange={(v) => setPlan({ ...plan, downlinkGbDay: v })} format={(v) => `${fmt(v)} Gb`} />
            <p className="mt-1 text-xs text-slate-400">{t('astro.downlink.typical', { gb: fmt(target.downlinkGbDay) })}</p>
          </Section>
        </div>

        <aside className="space-y-5">
          <section>
            <h3 className="hud-label">{t('astro.questions')}</h3>
            <ul className="mt-2 space-y-3">
              {QUESTIONS.map((q) => (
                <li key={q}>
                  <div className="flex justify-between text-sm">
                    <span className={Q_TEXT[q]}>{t(`astro.q.${q}` as StringKey)}</span>
                    <span className="font-mono text-slate-100">{Math.round(report.questions[q] * 100)}%</span>
                  </div>
                  <Bar value={report.questions[q]} color={Q_COLOR[q]} label={t(`astro.q.${q}` as StringKey)} />
                  <p className="mt-0.5 text-[11px] text-slate-400">{t(`astro.q.${q}.hint` as StringKey)}</p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="hud-label">{t('astro.lines')}</h3>
            <p className="mt-1 text-xs text-slate-400">{t('astro.lines.hint')}</p>
            <ul className="mt-2 space-y-2 text-sm">
              {report.lines.map((l) => (
                <li key={l.line} className={l.coverage >= COVERED ? '' : 'opacity-60'}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={Q_TEXT[LINE_QUESTION[l.line]]}>{t(`astro.line.${l.line}.name` as StringKey)}</span>
                    <span className="text-[11px] text-slate-400">{t(presenceKey(l.presence))}</span>
                  </div>
                  <Bar value={l.coverage} color="bg-sky-500" label={t(`astro.line.${l.line}.name` as StringKey)} />
                  <p className="text-[11px] text-slate-500">
                    {t(`astro.line.${l.line}.what` as StringKey)}
                    {l.best ? ` · ${t('astro.best', { instrument: name(l.best) })}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="hud-label">{t('astro.payload')}</h3>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
              <dt className="text-slate-400">{t('astro.mass')}</dt>
              <dd className="text-right font-mono">{fmt(report.massKg)} kg</dd>
              <dt className="text-slate-400">{t('astro.power')}</dt>
              <dd className="text-right font-mono">{fmt(report.powerW)} W</dd>
              <dt className="text-slate-400">{t('astro.cost')}</dt>
              <dd className="text-right font-mono">${fmt(report.costM, 1)} M</dd>
              <dt className="text-slate-400">{t('astro.data')}</dt>
              <dd className="text-right font-mono">{fmt(report.dataGbDay, 1)} Gb</dd>
              <dt className="text-slate-400">{t('astro.delivered')}</dt>
              <dd className={`text-right font-mono ${report.delivered < 0.999 ? 'text-amber-300' : 'text-emerald-300'}`}>{Math.round(report.delivered * 100)}%</dd>
            </dl>
            {inMission && plan.instruments.length > 0 && (
              <button
                type="button"
                className="btn-secondary mt-3 w-full px-3 py-1.5 text-sm"
                onClick={() => {
                  update({ instruments: plan.instruments.map((i) => ({ id: i.id, duty: i.duty })) })
                  go('design')
                }}
              >
                {t('astro.sendToMission')}
              </button>
            )}
          </section>

          <section>
            <h3 className="hud-label">{t('astro.review')}</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {report.issues.length === 0 ? (
                <li className="rounded-lg border border-emerald-500/40 p-2">
                  <span className="font-medium text-emerald-300">{t('astro.ok.title')}</span>
                  <p className="text-xs text-slate-400">{t('astro.ok.why')}</p>
                </li>
              ) : (
                report.issues.map((issue, i) => {
                  const m = issueText(issue)
                  return (
                    <li key={i} className={`rounded-lg border p-2 ${issue.severity === 'error' ? 'border-rose-500/50' : 'border-amber-400/50'}`}>
                      <span className={`font-medium ${issue.severity === 'error' ? 'text-rose-300' : 'text-amber-300'}`}>{m.title}</span>
                      <p className="text-xs text-slate-400">{m.why}</p>
                    </li>
                  )
                })
              )}
            </ul>
          </section>
        </aside>
      </div>
      <div className="mt-6">
        <Disclaimer />
      </div>
    </main>
  )
}
