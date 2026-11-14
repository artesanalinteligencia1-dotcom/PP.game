import { AEROSHELLS, CHUTE_DEPLOY_MS, DEFAULT_LANDING, DESCENT_SYSTEMS, EDL_MINUTES, GUIDANCE, PARACHUTES, UNGUIDED_ELLIPSE_KM, getAeroshell, getDescent, isLandingDesign, type EdlReport, type LandingDesign } from '../../engine/edl'
import type { Design, DesignReport } from '../../engine/types'
import { useT, useTx } from '../../i18n'
import { fmt } from '../../i18n/en'
import { useGame } from '../../store/game'
import { Grid, OptionCard } from '../components'

const ROWS: { key: 'landed' | 'hardware' | 'propellant' | 'chute' | 'guidance' | 'shell' | 'cruise'; color: string; kg: (e: EdlReport) => number }[] = [
  { key: 'landed', color: '#34d399', kg: (e) => e.landedKg },
  { key: 'hardware', color: '#38bdf8', kg: (e) => e.descentHardwareKg },
  { key: 'propellant', color: '#a78bfa', kg: (e) => e.descentPropellantKg },
  { key: 'chute', color: '#f472b6', kg: (e) => e.chuteKg },
  { key: 'guidance', color: '#facc15', kg: (e) => e.guidanceKg },
  { key: 'shell', color: '#f97316', kg: (e) => e.shellKg },
  { key: 'cruise', color: '#64748b', kg: (e) => e.cruiseStageKg },
]

function Choice<T extends { id: string }>({ label, items, value, onPick, text }: { label: string; items: T[]; value: string; onPick: (id: string) => void; text: (x: T) => string }) {
  return (
    <div>
      <div className="hud-label">{label}</div>
      <div className="mt-1 flex flex-wrap gap-1">
        {items.map((x) => (
          <button
            key={x.id}
            type="button"
            aria-pressed={x.id === value}
            onClick={() => onPick(x.id)}
            className={`rounded-lg border px-3 py-1.5 text-xs ${x.id === value ? 'border-sky-400 bg-sky-500/15 text-sky-200' : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}
          >
            {text(x)}
          </button>
        ))}
      </div>
    </div>
  )
}

/** The seven minutes, drawn: speed and height at each handover between heat shield, parachute and landing system. */
function Sequence({ edl, delay }: { edl: EdlReport; delay: number }) {
  const t = useT()
  const steps = [
    { x: 30, y: 22, title: t('orbit.landing.seq.entry'), v: t('orbit.landing.seq.kms', { v: fmt(edl.entrySpeedKms, 1) }), alt: t('orbit.landing.seq.alt', { km: 125 }), color: '#f97316' },
    { x: 125, y: 62, title: t('orbit.landing.seq.chute'), v: t('orbit.landing.seq.ms', { v: CHUTE_DEPLOY_MS }), alt: t('orbit.landing.seq.alt', { km: 10 }), color: '#f472b6' },
    { x: 215, y: 98, title: t('orbit.landing.seq.descent'), v: t('orbit.landing.seq.ms', { v: fmt(edl.terminalMs) }), alt: t('orbit.landing.seq.alt', { km: 1.5 }), color: '#a78bfa' },
    { x: 290, y: 122, title: t('orbit.landing.seq.touchdown'), v: t('orbit.landing.seq.ms', { v: 0 }), alt: '', color: '#34d399' },
  ]
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <svg viewBox="0 0 320 150" className="w-full" role="img" aria-label={t('orbit.landing.seq.aria')}>
        <rect x={0} y={128} width={320} height={22} fill="#7c2d12" opacity={0.7} />
        <path d="M30 22 C 90 26, 110 50, 125 62 S 190 92, 215 98 S 280 112, 290 122" fill="none" stroke="#e2e8f0" strokeWidth={1.2} strokeDasharray="4 3" />
        {steps.map((s, i) => (
          <g key={i}>
            <circle cx={s.x} cy={s.y} r={5} fill={s.color} />
            <text x={s.x + (i === 3 ? -8 : 9)} y={s.y - 7} textAnchor={i === 3 ? 'end' : 'start'} fill="#e2e8f0" fontSize={9.5} fontWeight={600}>
              {s.title}
            </text>
            <text x={s.x + (i === 3 ? -8 : 9)} y={s.y + 4} textAnchor={i === 3 ? 'end' : 'start'} fill="#94a3b8" fontSize={8.5}>
              {s.v}
              {s.alt ? ` · ${s.alt}` : ''}
            </text>
          </g>
        ))}
      </svg>
      <p className="px-3 py-2 text-[11px] text-slate-400">{t('orbit.landing.seq.caption', { minutes: EDL_MINUTES, delay: fmt(delay) })}</p>
    </div>
  )
}

/** Orbit tab, landing sites: choose the landing system, parachute and aeroshell, and read the budget they produce. */
export function LandingPanel({ design, report }: { design: Design; report: DesignReport }) {
  const update = useGame((s) => s.update)
  const t = useT()
  const tx = useTx()
  const edl = report.edl
  if (!edl) return null
  const landing: LandingDesign = isLandingDesign(design.landing) ? design.landing : DEFAULT_LANDING
  const set = (patch: Partial<LandingDesign>) => update({ landing: { ...landing, ...patch } })
  const descent = getDescent(landing.descentId)
  const shell = getAeroshell(landing.shellId)
  const over = edl.beta > edl.betaMax
  const tight = !over && edl.beta > 0.9 * edl.betaMax
  return (
    <div className="space-y-4">
      <div>
        <div className="hud-label">{t('orbit.landing.descent')}</div>
        <div className="mt-1">
          <Grid>
            {DESCENT_SYSTEMS.map((d) => (
              <OptionCard
                key={d.id}
                selected={d.id === landing.descentId}
                onClick={() => set({ descentId: d.id })}
                title={tx(`edl.descent.${d.id}.name`, d.name)}
                stats={[
                  t('orbit.landing.descent.max', { max: fmt(d.maxLandedKg) }),
                  t('orbit.landing.descent.ellipse', { km: d.guidedEllipseKm }),
                  t('orbit.landing.descent.reliable', { pct: Math.round(d.reliability * 100) }),
                  `$${fmt(d.costM)} M`,
                ]}
              >
                {tx(`edl.descent.${d.id}.description`, d.description)}
              </OptionCard>
            ))}
          </Grid>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Choice label={t('orbit.landing.shell')} items={AEROSHELLS} value={landing.shellId} onPick={(id) => set({ shellId: id })} text={(x) => `${tx(`edl.shell.${x.id}.name`, x.name)} · $${fmt(x.costM)} M`} />
        <Choice label={t('orbit.landing.chute')} items={PARACHUTES} value={landing.chuteId} onPick={(id) => set({ chuteId: id })} text={(x) => `${tx(`edl.chute.${x.id}.name`, x.name)} · ${x.massKg} kg`} />
      </div>
      <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-800 p-3 text-xs text-slate-300">
        <input type="checkbox" className="mt-0.5" checked={landing.guided} onChange={(e) => set({ guided: e.target.checked })} />
        <span>
          <span className="font-semibold text-slate-100">{t('orbit.landing.guided')}</span>
          <br />
          {t('orbit.landing.guided.hint', { guided: descent.guidedEllipseKm, unguided: UNGUIDED_ELLIPSE_KM, mass: GUIDANCE.massKg, cost: GUIDANCE.costM, months: GUIDANCE.devMonths })}
        </span>
      </label>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 p-3">
          <h3 className="hud-label">{t('orbit.landing.budget')}</h3>
          <div className="mt-2 flex h-4 overflow-hidden rounded">
            {ROWS.map((r) => (
              <div key={r.key} style={{ width: `${(100 * r.kg(edl)) / edl.launchKg}%`, background: r.color }} />
            ))}
          </div>
          <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-xs">
            {ROWS.filter((r) => r.kg(edl) > 0).map((r) => (
              <div key={r.key} className="contents">
                <dt className="flex items-center gap-2 text-slate-400">
                  <span className="inline-block h-2 w-2 rounded-sm" style={{ background: r.color }} />
                  {t(`orbit.landing.row.${r.key}`)}
                </dt>
                <dd className="text-right font-mono">{fmt(r.kg(edl))} kg</dd>
              </div>
            ))}
            <dt className="border-t border-slate-800 pt-1 font-semibold text-slate-200">{t('orbit.landing.row.launch')}</dt>
            <dd className="border-t border-slate-800 pt-1 text-right font-mono font-semibold">{fmt(edl.launchKg)} kg</dd>
          </dl>
          <p className="mt-2 text-xs text-emerald-300">{t('orbit.landing.fraction', { pct: Math.round(edl.landedFraction * 100) })}</p>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-800 p-3">
            <div className="flex items-baseline justify-between">
              <h3 className="hud-label">{t('orbit.landing.beta')}</h3>
              <span className={`font-mono text-xs ${over ? 'text-rose-300' : tight ? 'text-amber-300' : 'text-emerald-300'}`}>{t('orbit.landing.beta.value', { beta: fmt(edl.beta), max: fmt(edl.betaMax) })}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded bg-slate-800">
              <div className={`h-full ${over ? 'bg-rose-400' : tight ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${Math.min(100, (100 * edl.beta) / edl.betaMax)}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-400">{t('orbit.landing.beta.hint')}</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <dt className="text-slate-400">{t('orbit.landing.ellipse')}</dt>
              <dd className="font-mono">{fmt(edl.ellipseKm)} km</dd>
              <dt className="text-slate-400">{t('orbit.landing.reliability')}</dt>
              <dd className="font-mono">{Math.round(edl.reliability * 100)}%</dd>
            </dl>
          </div>
          <Sequence edl={edl} delay={report.schedule.arrivalDelayMin ?? 0} />
        </div>
      </div>
      <p className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-3 text-xs text-slate-300">
        <span className="font-semibold text-sky-300">{t('orbit.landing.realWorld')}</span>
        {tx(`edl.descent.${descent.id}.realWorld`, descent.realWorld)} {tx(`edl.shell.${shell.id}.realWorld`, shell.realWorld)}
      </p>
    </div>
  )
}
