import { useEffect, useRef } from 'react'
import { audio, useMusic } from '../audio/audio'
import { JourneyView } from './JourneyView'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getObc, getScenario } from '../engine/catalog'
import { SIM_WEEKS_PER_YEAR, type Personality } from '../engine/simulate'
import type { Role } from '../engine/types'
import { ROLE_BLURB, ROLE_LABEL, fmt } from '../i18n/en'
import { ALL_ROLES, useGame } from '../store/game'
import { Disclaimer, Pill } from './components'
import { ROLE_ICON } from './tabs/MissionTab'
import { useT, useTx, type StringKey } from '../i18n'

const SPEEDS: [number, StringKey][] = [
  [4, 'flight.speed.month'],
  [13, 'flight.speed.quarter'],
  [52, 'flight.speed.year'],
]

const LOG_COLOR = { info: 'text-slate-300', good: 'text-emerald-300', warn: 'text-amber-300', bad: 'text-rose-300' } as const

function Gauge({ label, value, fill, tone, tip }: { label: string; value: string; fill: number; tone: 'ok' | 'warn' | 'bad'; tip: string }) {
  const color = tone === 'ok' ? 'bg-emerald-500' : tone === 'warn' ? 'bg-amber-400' : 'bg-rose-500'
  return (
    <div title={tip} className="cursor-help">
      <div className="flex justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="font-mono text-slate-100">{value}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded bg-slate-800">
        <div className={`h-full ${color} transition-all`} style={{ width: `${Math.max(0, Math.min(100, fill * 100))}%` }} />
      </div>
    </div>
  )
}

export function FlightScreen() {
  const mission = useGame((s) => s.mission)!
  useGame((s) => s.tick)
  const playing = useGame((s) => s.playing)
  const speed = useGame((s) => s.speed)
  const delegated = useGame((s) => s.delegated)
  const personality = useGame((s) => s.personality)
  const stepWeeks = useGame((s) => s.stepWeeks)
  const setPlaying = useGame((s) => s.setPlaying)
  const setSpeed = useGame((s) => s.setSpeed)
  const toggleDelegate = useGame((s) => s.toggleDelegate)
  const setPersonality = useGame((s) => s.setPersonality)
  const choose = useGame((s) => s.choose)
  const showResults = useGame((s) => s.showResults)
  const t = useT()
  const tx = useTx()
  const scenario = getScenario(mission.scenarioId)
  const r = mission.report
  const acc = useRef(0)
  useMusic('flight')
  const pendingKey = mission.pending ? `${mission.pending.eventId}-${mission.pending.week}` : ''
  useEffect(() => {
    if (pendingKey) audio.play('alert')
  }, [pendingKey])

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      acc.current += speed / 10
      const n = Math.floor(acc.current)
      if (n > 0) {
        acc.current -= n
        stepWeeks(n)
      }
    }, 100)
    return () => window.clearInterval(id)
  }, [playing, speed, stepWeeks])

  const ended = mission.phase === 'ended'
  const pending = mission.pending
  const waitingForYou = !!pending && !delegated[pending.role]
  const years = mission.opsWeeks / SIM_WEEKS_PER_YEAR
  const obc = getObc(mission.design.obcId)
  const last = mission.series[mission.series.length - 1]
  const batteryHealth = last ? last.battery / 100 : 1
  const powerRatio = last ? last.power / 100 : 1
  const logs = [...mission.log].reverse().slice(0, 40)

  return (
    <main className="mx-auto max-w-7xl px-4 py-4">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-xl font-semibold">
          {t('flight.title', { name: tx(`scenario.${scenario.id}.name`, scenario.name) })}
        </h1>
        <Pill tone={mission.phase === 'transfer' ? 'violet' : mission.phase === 'operations' ? 'sky' : 'slate'}>
          {t(`flight.phase.${mission.phase}` as StringKey)}
        </Pill>
        <span className="font-mono text-sm text-slate-300">
          {mission.phase === 'transfer'
            ? t('flight.transferWeek', { week: mission.week, total: mission.transferWeeks })
            : t('flight.opsYear', {
                year: fmt(years, 2),
                total: fmt(mission.plannedOpsWeeks / SIM_WEEKS_PER_YEAR, 1),
              })}
        </span>
        <span className="text-xs text-slate-500">{t('results.seed', { seed: mission.seed })}</span>
        <div className="ml-auto flex items-center gap-1">
          {!ended && (
            <button
              type="button"
              onClick={() => setPlaying(!playing)}
              disabled={waitingForYou}
              className="rounded border border-slate-700 px-3 py-1 text-sm hover:border-slate-400 disabled:opacity-40"
            >
              {playing ? t('flight.pause') : t('flight.play')}
            </button>
          )}
          {SPEEDS.map(([v, labelKey]) => (
            <button
              key={v}
              type="button"
              onClick={() => setSpeed(v)}
              className={`rounded px-2 py-1 text-xs ${speed === v ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-4 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)_320px]">
        {/* Team */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="hud-label">{t('flight.team.title')}</h2>
          <p className="mt-1 text-xs text-slate-400">{t('flight.team.hint')}</p>
          <ul className="mt-3 space-y-2">
            {ALL_ROLES.map((role: Role) => (
              <li key={role} className="flex items-center justify-between gap-2 rounded border border-slate-800 px-2 py-1.5" title={ROLE_BLURB[role]}>
                <span className="text-sm">
                  {ROLE_ICON[role]} {ROLE_LABEL[role]}
                </span>
                <button
                  type="button"
                  onClick={() => toggleDelegate(role)}
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${delegated[role] ? 'bg-violet-500/20 text-violet-300' : 'bg-sky-500/20 text-sky-300'}`}
                  aria-pressed={!delegated[role]}
                >
                  {delegated[role] ? t('flight.team.bot') : t('flight.team.you')}
                </button>
              </li>
            ))}
          </ul>
          <label className="mt-3 block text-xs text-slate-400">
            {t('flight.personality.label')}
            <select
              value={personality}
              onChange={(e) => setPersonality(e.target.value as Personality)}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
            >
              <option value="prudent">{t('flight.personality.prudent')}</option>
              <option value="balanced">{t('flight.personality.balanced')}</option>
              <option value="bold">{t('flight.personality.bold')}</option>
            </select>
          </label>
        </section>

        {/* Center: chart + log */}
        <section className="min-w-0 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2">
            <JourneyView mission={mission} playing={playing} />
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="mb-1 flex justify-between text-xs text-slate-400">
              <span>{t('flight.chartLegend')}</span>
            </div>
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={mission.series.slice()} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
                  <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 12 }} labelFormatter={(w) => t('results.chartWeek', { week: String(w) })} />
                  <Line isAnimationActive={false} type="monotone" dataKey="science" name={t('flight.chart.science')} stroke="#a78bfa" dot={false} strokeWidth={2} />
                  <Line isAnimationActive={false} type="monotone" dataKey="battery" name={t('flight.chart.battery')} stroke="#38bdf8" dot={false} />
                  <Line isAnimationActive={false} type="monotone" dataKey="power" name={t('flight.chart.power')} stroke="#fbbf24" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
            <h2 className="hud-label">{t('flight.log.title')}</h2>
            <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto pr-1 text-sm" aria-live="polite">
              {logs.map((l, i) => (
                <li key={`${l.week}-${i}`} className={LOG_COLOR[l.severity]}>
                  <span className="mr-2 font-mono text-[11px] text-slate-500">w{l.week}</span>
                  <span className="mr-1" title={ROLE_LABEL[l.role]}>
                    {ROLE_ICON[l.role]}
                  </span>
                  {l.text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Gauges */}
        <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="hud-label">{t('flight.status.title')}</h2>
          <Gauge
            label={t('flight.gauge.science')}
            value={`${fmt(mission.science)} / ${scenario.scienceTarget}`}
            fill={mission.science / scenario.scienceTarget}
            tone="ok"
            tip={t('flight.gauge.science.tip')}
          />
          <Gauge
            label={t('flight.gauge.battery')}
            value={`${fmt(batteryHealth * 100)}%`}
            fill={batteryHealth}
            tone={mission.batteryWear > 0.8 ? 'bad' : mission.batteryWear > 0.5 ? 'warn' : 'ok'}
            tip={t('flight.gauge.battery.tip')}
          />
          <Gauge
            label={t('flight.gauge.power')}
            value={`${fmt(powerRatio * 100)}%`}
            fill={powerRatio / 2}
            tone={powerRatio < 1 ? 'bad' : powerRatio < 1.1 ? 'warn' : 'ok'}
            tip={t('flight.gauge.power.tip')}
          />
          <Gauge
            label={t('flight.gauge.radiation')}
            value={`${fmt(mission.doseKrad, 1)} / ${obc.radToleranceKrad} krad`}
            fill={mission.doseKrad / obc.radToleranceKrad}
            tone={mission.doseKrad / obc.radToleranceKrad > 0.8 ? 'bad' : mission.doseKrad / obc.radToleranceKrad > 0.5 ? 'warn' : 'ok'}
            tip={t('flight.gauge.radiation.tip')}
          />
          <Gauge
            label={t('flight.gauge.backlog')}
            value={`${fmt(mission.backlogGb, 1)} / ${r.data.storageGb} GB`}
            fill={mission.backlogGb / r.data.storageGb}
            tone={mission.backlogGb / r.data.storageGb > 0.9 ? 'bad' : mission.backlogGb > 0.5 * r.data.storageGb ? 'warn' : 'ok'}
            tip={t('flight.gauge.backlog.tip')}
          />
          <Gauge
            label={t('flight.gauge.budget')}
            value={`$${fmt(mission.reserveM, 1)} M`}
            fill={mission.reserveM / Math.max(1, r.cost.contingencyM + Math.max(0, scenario.budgetM - r.cost.totalM))}
            tone={mission.reserveM < 1 ? 'bad' : mission.reserveM < 5 ? 'warn' : 'ok'}
            tip={t('flight.gauge.budget.tip')}
          />
          {r.mass.ispS > 0 && (
            <Gauge
              label={t('flight.gauge.dv')}
              value={`${fmt(mission.dvRemaining, 1)} m/s`}
              fill={mission.dvRemaining / Math.max(1, r.mass.totalDv)}
              tone={mission.dvRemaining < 2 ? 'warn' : 'ok'}
              tip={t('flight.gauge.dv.tip')}
            />
          )}
          <div className="text-xs text-slate-400">
            {t('flight.dataDelivered', {
              delivered: fmt(mission.dataDeliveredGb),
              lost: fmt(mission.dataLostGb),
            })}
          </div>
          {ended && (
            <button type="button" onClick={showResults} className="mt-2 w-full btn-primary px-4 py-3 ">
              {t('flight.seeReport')}
            </button>
          )}
        </section>
      </div>

      {waitingForYou && pending && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="decision-title">
          <div className="w-full max-w-lg rounded-2xl border border-amber-400/50 bg-slate-900 p-5 shadow-2xl">
            <div className="text-xs font-semibold uppercase tracking-wide text-amber-300">
              {ROLE_ICON[pending.role]} {t('flight.decision.header', { role: ROLE_LABEL[pending.role], week: pending.week })}
            </div>
            <h2 id="decision-title" className="mt-1 text-xl font-semibold">
              {pending.title}
            </h2>
            <p className="mt-2 text-sm text-slate-300">{pending.text}</p>
            <div className="mt-4 space-y-2">
              {pending.options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => choose(o.id)}
                  className="w-full rounded-lg border border-slate-700 p-3 text-left hover:border-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  <div className="font-medium">{o.label}</div>
                  <div className="text-xs text-slate-400">{o.hint}</div>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => choose('', true)} className="mt-3 text-xs text-violet-300 hover:text-violet-200">
              {t('flight.decision.delegateBot', {
                personality: t(`flight.personality.name.${personality}` as StringKey),
              })}
            </button>
          </div>
        </div>
      )}
      <div className="mt-6">
        <Disclaimer />
      </div>
    </main>
  )
}
