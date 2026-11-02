import { useEffect, useRef, useState } from 'react'
import type { DesignReport, Severity } from '../engine/types'
import { fmt } from '../i18n/en'
import { SEV_BG, SEV_TEXT } from './components'

type DeltaKey = 'mass' | 'power' | 'data' | 'cost' | 'schedule' | 'life' | 'science'

function snapshot(r: DesignReport): Record<DeltaKey, number> {
  return {
    mass: r.mass.wetKg,
    power: r.power.avgLoadW,
    data: r.data.generatedGbDay,
    cost: r.cost.totalM,
    schedule: r.schedule.devMonths,
    life: r.life.lifeYears,
    science: r.science.perYear,
  }
}

const DELTA_UNIT: Record<DeltaKey, [string, number]> = {
  mass: ['kg', 0],
  power: ['W', 0],
  data: ['GB/d', 1],
  cost: ['M$', 1],
  schedule: ['mo', 1],
  life: ['yr', 1],
  science: ['pts', 0],
}

function worst(report: DesignReport, pred: (code: string, resource: string) => boolean): Severity {
  let s: Severity = 'ok'
  for (const r of report.review) {
    if (!pred(r.code, r.resource)) continue
    if (r.severity === 'error') return 'error'
    if (r.severity === 'warn') s = 'warn'
  }
  return s
}

function Meter({
  label,
  value,
  fill,
  severity,
  tip,
  delta,
  deltaKey,
}: {
  label: string
  value: string
  fill: number
  severity: Severity
  tip: string
  delta?: number
  deltaKey?: DeltaKey
}) {
  const pct = Math.max(0, Math.min(100, (Number.isFinite(fill) ? fill : 1) * 100))
  const showDelta = deltaKey && delta !== undefined && Number.isFinite(delta) && Math.abs(delta) > 0.05
  return (
    <div title={tip} className="cursor-help">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="flex items-baseline gap-1.5">
          {showDelta && (
            <span key={`${delta}`} className={`delta-flash font-mono text-[10px] ${delta > 0 ? 'text-sky-300' : 'text-fuchsia-300'}`}>
              {delta > 0 ? '+' : '−'}
              {fmt(Math.abs(delta), DELTA_UNIT[deltaKey][1])} {DELTA_UNIT[deltaKey][0]}
            </span>
          )}
          <span className={`font-mono ${SEV_TEXT[severity]}`}>{value}</span>
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded bg-slate-800">
        <div className={`h-full ${SEV_BG[severity]} transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function Dashboard({ report, designKey }: { report: DesignReport; designKey: string }) {
  const prev = useRef<Record<DeltaKey, number> | null>(null)
  const [deltas, setDeltas] = useState<Partial<Record<DeltaKey, number>>>({})
  useEffect(() => {
    const now = snapshot(report)
    if (prev.current) {
      const d: Partial<Record<DeltaKey, number>> = {}
      for (const k of Object.keys(now) as DeltaKey[]) d[k] = now[k] - prev.current[k]
      setDeltas(d)
    }
    prev.current = now
    // designKey changes exactly when the design changes
  }, [designKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const { mass, power, data, cost, schedule, life, science, risk } = report
  const errors = report.review.filter((r) => r.severity === 'error').length
  const warns = report.review.filter((r) => r.severity === 'warn').length
  const powerNeed = power.avgLoadW * (1 - power.eclipseFraction + power.eclipseFraction / 0.9)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Resources</h2>
        <span className={`text-xs font-semibold ${errors ? 'text-rose-400' : warns ? 'text-amber-400' : 'text-emerald-400'}`}>
          {errors ? `${errors} blocking` : 'Launchable'}
          {warns ? ` · ${warns} warnings` : ''}
        </span>
      </div>
      <Meter
        label="Mass (wet / launcher)"
        value={`${fmt(mass.wetKg)} / ${fmt(mass.capacityKg)} kg`}
        fill={mass.capacityKg > 0 ? mass.wetKg / mass.capacityKg : 1}
        severity={worst(report, (_c, r) => r === 'mass')}
        tip="Wet mass = parts + 22% structure + 20% design margin + tanks + propellant (rocket equation). Must fit the launcher's capacity to this orbit."
        delta={deltas.mass}
        deltaKey="mass"
      />
      <Meter
        label="Power (need / generated EOL)"
        value={`${fmt(powerNeed)} / ${fmt(power.avgGenEolW)} W`}
        fill={power.avgGenEolW > 0 ? powerNeed / power.avgGenEolW : 1}
        severity={worst(report, (c, r) => r === 'power' && !c.startsWith('BATTERY') && !c.startsWith('LONG'))}
        tip="Orbit-average generation P = A·η·1361 W/m²·cosθ·(1−eclipse), degraded each year. Need = average load incl. battery recharge losses."
        delta={deltas.power}
        deltaKey="power"
      />
      <Meter
        label="Battery depth of discharge"
        value={`${fmt(power.dodNominal * 100)}% (max ${fmt(power.dodLimit * 100)}%)`}
        fill={power.dodNominal / power.dodLimit}
        severity={worst(report, (c) => c.startsWith('BATTERY') || c.startsWith('LONG'))}
        tip="Share of the battery used in each eclipse. Many deep cycles per year wear the battery out."
      />
      <Meter
        label="Data (produced / downlink per day)"
        value={`${fmt(data.generatedGbDay, 1)} / ${fmt(data.downlinkGbDay, 1)} GB`}
        fill={data.downlinkGbDay > 0 ? data.generatedGbDay / data.downlinkGbDay : data.generatedGbDay > 0 ? 1 : 0}
        severity={worst(report, (_c, r) => r === 'data')}
        tip="Produced = Σ rate × duty cycle ÷ compression. Downlink = contact minutes × link rate × 70% efficiency."
        delta={deltas.data}
        deltaKey="data"
      />
      <Meter
        label="Budget"
        value={`$${fmt(cost.totalM, 1)} / ${fmt(cost.budgetM)} M`}
        fill={cost.totalM / cost.budgetM}
        severity={worst(report, (_c, r) => r === 'cost')}
        tip="Instruments (× TRL factor) + bus + integration + launcher + operations, plus 15% contingency."
        delta={deltas.cost}
        deltaKey="cost"
      />
      <Meter
        label="Development time"
        value={`${fmt(schedule.devMonths, 1)} / ${fmt(schedule.deadlineMonths)} mo`}
        fill={schedule.devMonths / schedule.deadlineMonths}
        severity={worst(report, (_c, r) => r === 'schedule')}
        tip="18 months base + extra for low-TRL items + 1.5 per extra instrument + 1 per 100 kg."
        delta={deltas.schedule}
        deltaKey="schedule"
      />
      <Meter
        label={`Lifetime (limit: ${life.limitingFactor})`}
        value={`${fmt(life.lifeYears, 1)} / ${fmt(life.requiredYears, 1)} yr`}
        fill={Math.min(1, life.lifeYears / life.requiredYears)}
        severity={worst(report, (_c, r) => r === 'life')}
        tip="Life = min(battery, panels, propellant/plan, radiation, orbit). The smallest one ends the mission."
        delta={deltas.life}
        deltaKey="life"
      />
      <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
        <div className="rounded border border-slate-800 p-2" title="Expected science points per year (value × relevance × data actually delivered).">
          <div className="text-slate-400">Science / year</div>
          <div className="font-mono text-lg text-violet-300">
            {fmt(science.perYear)}
            {deltas.science !== undefined && Math.abs(deltas.science) >= 0.5 && (
              <span key={deltas.science} className="delta-flash ml-1 text-[10px] text-sky-300">
                {deltas.science > 0 ? '+' : '−'}
                {fmt(Math.abs(deltas.science))}
              </span>
            )}
          </div>
        </div>
        <div className="rounded border border-slate-800 p-2" title="Launcher reliability × bus × instruments (by TRL) × environmental risks.">
          <div className="text-slate-400">Success chance</div>
          <div className="font-mono text-lg text-sky-300">{fmt(risk.successProbability * 100)}%</div>
        </div>
      </div>
    </div>
  )
}
