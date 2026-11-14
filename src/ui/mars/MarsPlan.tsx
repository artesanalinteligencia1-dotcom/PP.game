import { getScenario } from '../../engine/catalog'
import { marsCruiseDays, type Route } from '../../engine/catalog/routes'
import { MARS_DELAY_MAX, MARS_DELAY_MIN, MARS_WINDOW_EVERY_MONTHS, departurePhaseDeg } from '../../engine/mars'
import type { Design, DesignReport } from '../../engine/types'
import { useT } from '../../i18n'
import { fmt } from '../../i18n/en'
import { MarsTransferView } from './MarsTransferView'

/** Orbit tab, Mars destinations: the launch window on the project calendar, the radio delay and the trip to scale. */
export function MarsPlan({ design, report, route }: { design: Design; report: DesignReport; route: Route }) {
  const t = useT()
  const cruiseDays = marsCruiseDays(route)
  const window = getScenario(design.scenarioId).launchWindow
  const { devMonths, launchMonth, windowWaitMonths = 0, transferMonths, arrivalDelayMin = 0 } = report.schedule
  const missed = !!window && launchMonth !== undefined && devMonths > window.firstMonth
  const arrival = (launchMonth ?? devMonths) + transferMonths
  const max = Math.max(arrival, window ? window.firstMonth + window.everyMonths : 0) + 3
  const W = 320
  const x = (m: number) => 10 + ((W - 20) * m) / max
  const windows = window ? [0, 1, 2].map((k) => window.firstMonth + k * window.everyMonths).filter((m) => m <= max) : []
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="space-y-3">
        {window && launchMonth !== undefined && (
          <div className="rounded-xl border border-slate-800 p-3">
            <h3 className="hud-label">{t('orbit.window.title')}</h3>
            <p className="mt-1 text-xs text-slate-400">{t('orbit.window.hint', { phase: fmt(departurePhaseDeg(cruiseDays)), every: fmt(MARS_WINDOW_EVERY_MONTHS, 1) })}</p>
            <svg viewBox={`0 0 ${W} 62`} className="mt-2 w-full" role="img" aria-label={t('orbit.window.title')}>
              <line x1={x(0)} y1={30} x2={x(max)} y2={30} stroke="#334155" strokeWidth={2} />
              <line x1={x(0)} y1={30} x2={x(devMonths)} y2={30} stroke="#94a3b8" strokeWidth={4} />
              <line x1={x(launchMonth)} y1={30} x2={x(arrival)} y2={30} stroke="#38bdf8" strokeWidth={4} strokeDasharray="4 3" />
              {windows.map((m) => (
                <g key={m}>
                  <rect x={x(m) - 2} y={18} width={4} height={24} rx={2} fill="#f97316" opacity={m === launchMonth ? 1 : 0.45} />
                  <text x={x(m)} y={12} textAnchor="middle" fill="#fdba74" fontSize={9}>
                    {t('orbit.window.open')} {fmt(m)}
                  </text>
                </g>
              ))}
              <circle cx={x(devMonths)} cy={30} r={4} fill={missed ? '#f43f5e' : '#e2e8f0'} />
              <circle cx={x(arrival)} cy={30} r={4} fill="#34d399" />
              <text x={x(0)} y={56} fill="#64748b" fontSize={9}>
                0
              </text>
              <text x={x(max)} y={56} textAnchor="end" fill="#64748b" fontSize={9}>
                {fmt(max)} · {t('orbit.window.axis')}
              </text>
            </svg>
            <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <dt className="text-slate-400">{t('orbit.window.ready')}</dt>
              <dd className="font-mono">{t('orbit.window.month', { month: fmt(devMonths, 1) })}</dd>
              <dt className="text-slate-400">{t('orbit.window.launch')}</dt>
              <dd className="font-mono">{t('orbit.window.month', { month: fmt(launchMonth, 1) })}</dd>
              <dt className="text-slate-400">{t('orbit.window.arrival')}</dt>
              <dd className="font-mono">{t('orbit.window.month', { month: fmt(arrival, 1) })}</dd>
            </dl>
            <p className={`mt-2 text-xs ${missed ? 'text-rose-300' : windowWaitMonths < 3 ? 'text-amber-300' : 'text-emerald-300'}`}>
              {missed ? t('orbit.window.missed', { missed: fmt(window.firstMonth), wait: fmt(windowWaitMonths, 1) }) : t('orbit.window.wait', { wait: fmt(windowWaitMonths, 1) })}
            </p>
          </div>
        )}
        <div className="rounded-xl border border-slate-800 p-3">
          <h3 className="hud-label">{t('orbit.delay.title')}</h3>
          <p className="mt-1 font-mono text-sm text-violet-300">{t('orbit.delay.value', { arrival: fmt(arrivalDelayMin), min: fmt(MARS_DELAY_MIN), max: fmt(MARS_DELAY_MAX) })}</p>
          <p className="mt-1 text-xs text-slate-400">{t('orbit.delay.hint')}</p>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-800">
        <MarsTransferView cruiseDays={cruiseDays} label={t('orbit.mars.transfer.label')} className="h-64 w-full" />
        <p className="px-3 py-2 text-[11px] text-slate-500">{t('orbit.mars.transfer.legend')}</p>
      </div>
    </div>
  )
}
