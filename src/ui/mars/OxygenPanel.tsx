import { DEFAULT_OXYGEN_PLAN, MAX_OXYGEN_UNITS, OXYGEN_UNIT, SOL_HOURS, analyzeOxygen, isOxygenPlan } from '../../engine/isru'
import type { Design, DesignReport } from '../../engine/types'
import { useT } from '../../i18n'
import { fmt } from '../../i18n/en'
import { useGame } from '../../store/game'
import { Section, Slider } from '../components'

/** Payload tab, oxygen missions: size the plant and its working hours, and read what it makes and what it costs in power. */
export function OxygenPanel({ design, report }: { design: Design; report: DesignReport }) {
  const update = useGame((s) => s.update)
  const t = useT()
  const plan = isOxygenPlan(design.oxygen) ? design.oxygen : { ...DEFAULT_OXYGEN_PLAN, units: 0 }
  // the report has the plant as the engine sees it; with no units it is absent, so show an empty one
  const o = report.oxygen ?? { ...analyzeOxygen(plan), plannedKg: 0 }
  const rows: [string, string][] = [
    [t('payload.oxygen.perSol'), t('payload.oxygen.kg', { kg: fmt(o.kgPerSol, 2) })],
    [t('payload.oxygen.planned'), t('payload.oxygen.kg', { kg: fmt(o.plannedKg) })],
    [t('payload.oxygen.running'), t('payload.oxygen.w', { w: fmt(o.runningW) })],
    [t('payload.oxygen.energy'), t('payload.oxygen.kwhkg', { v: fmt(o.kWhPerKg, 1) })],
    [t('payload.oxygen.air'), t('payload.oxygen.m3', { v: fmt(o.airM3PerSol) })],
    [t('payload.oxygen.payback'), Number.isFinite(o.paybackSols) ? t('payload.oxygen.sols', { sols: fmt(o.paybackSols) }) : '—'],
  ]
  if (o.nightHours > 0.05) rows.push([t('payload.oxygen.night'), t('payload.oxygen.kwh', { v: fmt(o.nightEnergyWh / 1000, 1) })])
  return (
    <Section title={t('payload.oxygen')} hint={t('payload.oxygen.hint')}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <Slider
            label={t('payload.oxygen.units')}
            value={plan.units}
            min={0}
            max={MAX_OXYGEN_UNITS}
            step={1}
            onChange={(v) => update({ oxygen: { ...plan, units: v } })}
            format={(v) => t('payload.oxygen.units.format', { units: v, mass: OXYGEN_UNIT.massKg, power: OXYGEN_UNIT.powerW })}
          />
          <Slider
            label={t('payload.oxygen.hours')}
            value={plan.hoursPerSol}
            min={0}
            max={24.5}
            step={0.5}
            onChange={(v) => update({ oxygen: { ...plan, hoursPerSol: v } })}
            format={(v) => t('payload.oxygen.hours.format', { hours: fmt(v, 1), sol: fmt(SOL_HOURS, 1), night: fmt(Math.max(0, v - SOL_HOURS / 2), 1) })}
          />
        </div>
        <div className="rounded-xl border border-slate-800 p-3">
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-xs">
            {rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-slate-400">{k}</dt>
                <dd className="text-right font-mono">{v}</dd>
              </div>
            ))}
          </dl>
          {report.edl && o.plannedKg > 0 && <p className="mt-2 text-xs text-emerald-300">{t('payload.oxygen.fromEarth', { kg: fmt(o.plannedKg / report.edl.landedFraction) })}</p>}
        </div>
      </div>
      <p className="mt-3 rounded-lg border border-sky-500/30 bg-sky-500/5 p-3 text-xs text-slate-300">{t('payload.oxygen.moxie')}</p>
    </Section>
  )
}
