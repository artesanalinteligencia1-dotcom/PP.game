// Rocket Engineer pad: build a launcher from parts and watch mass, thrust-to-weight and Δv move live.
import { useMemo, type ReactNode } from 'react'
import { useMusic } from '../../audio/audio'
import { BOOSTERS, FAIRINGS, ROCKET_ENGINES, ROCKET_TANKS } from '../../engine/catalog/rocketParts'
import {
  LIMITS,
  TARGET_DV,
  addStage,
  analyzeRocket,
  getBooster,
  getFairing,
  getRocketEngine,
  getRocketTank,
  removeStage,
  setBoosters,
  updateStage,
  type RocketDesign,
  type RocketIssue,
} from '../../engine/rocket'
import type { LaunchTarget } from '../../engine/types'
import { useT, useTx, type StringKey } from '../../i18n'
import { fmt, localizeParams } from '../../i18n/en'
import { useGame } from '../../store/game'
import { useRocket, type RocketPreset } from '../../store/rocket'
import { Disclaimer, OptionCard, Pill, Section, Slider } from '../components'

const TARGETS: LaunchTarget[] = ['leo', 'sso', 'gto', 'tli']
const PRESETS: RocketPreset[] = ['light', 'medium', 'reusable_medium', 'heavy']
const FUEL_COLOR = { kerosene: '#cbd5e1', methane: '#94a3b8', hydrogen: '#f97316' } as const

function Stepper({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-300">
      <span className="min-w-16">{label}</span>
      <button type="button" className="btn-secondary h-7 w-7" disabled={value <= min} onClick={() => onChange(value - step)} aria-label={`${label} −`}>
        −
      </button>
      <span className="w-6 text-center font-mono text-sky-300">{value}</span>
      <button type="button" className="btn-secondary h-7 w-7" disabled={value >= max} onClick={() => onChange(value + step)} aria-label={`${label} +`}>
        +
      </button>
    </div>
  )
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <label className="block text-xs text-slate-300">
      {label}
      <select className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100" value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </label>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'warn' | 'bad' }) {
  const color = tone === 'bad' ? 'text-rose-300' : tone === 'warn' ? 'text-amber-300' : 'text-slate-100'
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={`font-mono text-lg ${color}`}>{value}</div>
    </div>
  )
}

/** Side view to scale: stages bottom to top, fairing on top, boosters on the sides. */
function RocketDrawing({ design, label }: { design: RocketDesign; label: string }) {
  const H = 380
  const W = 200
  const parts = design.stages.map((s) => ({ s, engine: getRocketEngine(s.engineId), tank: getRocketTank(s.tankId) }))
  const fairing = getFairing(design.fairingId)
  const booster = design.boosters > 0 ? getBooster(design.boosterId) : undefined
  const lengths = parts.map((p) => (p.tank ? p.tank.lengthM * p.s.tanks : 0) + 2.5)
  const fairingLen = fairing ? fairing.diameterM * 2.5 : 0
  const total = lengths.reduce((a, b) => a + b, 0) + fairingLen
  const maxD = Math.max(...parts.map((p) => p.tank?.diameterM ?? 1), fairing?.diameterM ?? 1)
  const k = Math.min((H - 30) / Math.max(total, 1), (W * 0.32) / maxD)
  const cx = W / 2
  let y = H - 14
  const shapes: ReactNode[] = []
  parts.forEach((p, i) => {
    const len = lengths[i] * k
    const w = (p.tank?.diameterM ?? 1) * k
    const top = y - len
    const color = p.tank ? FUEL_COLOR[p.tank.fuel] : '#64748b'
    shapes.push(<rect key={`s${i}`} x={cx - w / 2} y={top} width={w} height={len - 2.5 * k} fill={color} stroke="#0f172a" strokeWidth={1} rx={1} />)
    // engine bells
    const n = Math.min(p.s.engines, 9)
    const bw = Math.min(w / n, 2 * k)
    for (let e = 0; e < n; e++) {
      const bx = cx - (n * bw) / 2 + e * bw + bw / 2
      shapes.push(<path key={`b${i}-${e}`} d={`M${bx - bw * 0.25} ${y - 2.5 * k} L${bx + bw * 0.25} ${y - 2.5 * k} L${bx + bw * 0.45} ${y} L${bx - bw * 0.45} ${y} Z`} fill="#334155" />)
    }
    if (i === 0 && design.fins) {
      shapes.push(<rect key="fl" x={cx - w / 2 - 0.9 * k} y={top + 1 * k} width={0.9 * k} height={1.2 * k} fill="#475569" />)
      shapes.push(<rect key="fr" x={cx + w / 2} y={top + 1 * k} width={0.9 * k} height={1.2 * k} fill="#475569" />)
    }
    if (i === 0 && design.legs) {
      shapes.push(<path key="ll" d={`M${cx - w / 2} ${y - 4 * k} L${cx - w / 2 - 2 * k} ${y}`} stroke="#94a3b8" strokeWidth={1.5} />)
      shapes.push(<path key="lr" d={`M${cx + w / 2} ${y - 4 * k} L${cx + w / 2 + 2 * k} ${y}`} stroke="#94a3b8" strokeWidth={1.5} />)
    }
    if (i === 0 && booster) {
      const bl = booster.lengthM * k
      const bd = (booster.id === 'srb_l' ? 3.2 : 1.6) * k
      const pairs = design.boosters / 2
      for (let b = 0; b < pairs; b++) {
        const off = w / 2 + bd / 2 + b * (bd * 0.55)
        for (const side of [-1, 1]) {
          const bx = cx + side * off
          shapes.push(
            <path key={`sb${b}${side}`} d={`M${bx - bd / 2} ${y} L${bx - bd / 2} ${y - bl + bd} Q${bx} ${y - bl - bd * 0.6} ${bx + bd / 2} ${y - bl + bd} L${bx + bd / 2} ${y} Z`} fill="#e2e8f0" stroke="#0f172a" strokeWidth={1} opacity={b === 0 ? 1 : 0.7} />,
          )
        }
      }
    }
    y = top
  })
  if (fairing) {
    const fw = fairing.diameterM * k
    const fl = fairingLen * k
    shapes.push(<path key="fair" d={`M${cx - fw / 2} ${y} L${cx - fw / 2} ${y - fl * 0.45} Q${cx - fw / 2} ${y - fl} ${cx} ${y - fl} Q${cx + fw / 2} ${y - fl} ${cx + fw / 2} ${y - fl * 0.45} L${cx + fw / 2} ${y} Z`} fill="#f8fafc" stroke="#0f172a" strokeWidth={1} />)
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto h-80 w-full max-w-52" role="img" aria-label={label}>
      <line x1={0} x2={W} y1={H - 14} y2={H - 14} stroke="#334155" />
      {shapes}
    </svg>
  )
}

export function RocketScreen() {
  const t = useT()
  const tx = useTx()
  const go = useGame((s) => s.go)
  const { design, payloadKg, setDesign, setPayload, loadPreset } = useRocket()
  useMusic('design')
  const report = useMemo(() => analyzeRocket(design, payloadKg), [design, payloadKg])
  const empty = useMemo(() => analyzeRocket(design, 0), [design])
  const partName = (id: string, fallback: string) => tx(`rocketPart.${id}.name`, fallback)
  const issueText = (i: RocketIssue) => {
    const p = localizeParams(i.params)
    return { title: t(`rocket.issue.${i.code}.title` as StringKey, p), why: t(`rocket.issue.${i.code}.why` as StringKey, p) }
  }
  const twrTone = report.liftoffTwr < 1 ? 'bad' : report.liftoffTwr < 1.2 || report.liftoffTwr > 3 ? 'warn' : 'ok'
  const payloadMax = Math.max(1000, Math.ceil((Math.max(...TARGETS.map((x) => empty.capacityKg[x])) * 1.3) / 500) * 500)

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <button type="button" onClick={() => go('home')} className="text-sm text-slate-400 hover:text-slate-100">
        {t('rocket.back')}
      </button>
      <h1 className="mt-2 text-2xl font-semibold">{t('rocket.title')}</h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-400">{t('rocket.subtitle')}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-400">{t('rocket.presets')}</span>
        {PRESETS.map((id) => (
          <button key={id} type="button" className="btn-secondary px-3 py-1" onClick={() => loadPreset(id)}>
            {tx(`component.${id}.name`, id)}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_minmax(0,26rem)]">
        <div>
          <Section title={t('rocket.stages')} hint={t('rocket.stages.hint')}>
            <div className="space-y-3">
              {design.stages.map((s, i) => {
                const engine = getRocketEngine(s.engineId)
                return (
                  <div key={i} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-100">{i === 0 ? t('rocket.stage.liftoff') : t('rocket.stage.n', { n: i + 1 })}</h4>
                      {i > 0 && (
                        <button type="button" className="text-xs text-rose-300 hover:text-rose-200" onClick={() => setDesign(removeStage(design, i))}>
                          {t('rocket.stage.remove')}
                        </button>
                      )}
                    </div>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Select label={t('rocket.engine')} value={s.engineId} onChange={(v) => setDesign(updateStage(design, i, { engineId: v }))}>
                          {ROCKET_ENGINES.map((e) => (
                            <option key={e.id} value={e.id}>
                              {partName(e.id, e.name)}
                            </option>
                          ))}
                        </Select>
                        <Stepper label={t('rocket.engines')} value={s.engines} min={1} max={LIMITS.engines} onChange={(v) => setDesign(updateStage(design, i, { engines: v }))} />
                        {engine && (
                          <p className="text-[11px] text-slate-400">
                            {t('rocket.engine.stats', { sl: engine.thrustSlKN, vac: engine.thrustVacKN, isp: engine.ispVac })}
                            <br />
                            {tx(`rocketPart.${engine.id}.description`, engine.description)}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Select label={t('rocket.tank')} value={s.tankId} onChange={(v) => setDesign(updateStage(design, i, { tankId: v }))}>
                          {ROCKET_TANKS.filter((tk) => tk.fuel === engine?.fuel).map((tk) => (
                            <option key={tk.id} value={tk.id}>
                              {partName(tk.id, tk.name)} · {fmt(tk.propellantKg / 1000)} t
                            </option>
                          ))}
                        </Select>
                        <Stepper label={t('rocket.tanks')} value={s.tanks} min={1} max={LIMITS.tanks} onChange={(v) => setDesign(updateStage(design, i, { tanks: v }))} />
                        {report.stages[i] && (
                          <p className="text-[11px] text-slate-400">
                            {t('rocket.stage.stats', {
                              wet: fmt(report.stages[i].wetKg / 1000, 1),
                              prop: fmt(report.stages[i].propellantKg / 1000, 1),
                              dv: fmt(report.stages[i].dvMs),
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {design.stages.length < LIMITS.stages && (
                <button type="button" className="btn-secondary px-3 py-1.5 text-sm" onClick={() => setDesign(addStage(design))}>
                  {t('rocket.stage.add')}
                </button>
              )}
            </div>
          </Section>

          <Section title={t('rocket.boosters')} hint={t('rocket.boosters.hint')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select label={t('rocket.boosters.type')} value={design.boosters > 0 ? design.boosterId ?? '' : ''} onChange={(v) => setDesign(setBoosters(design, v || undefined, Math.max(2, design.boosters)))}>
                <option value="">{t('rocket.boosters.none')}</option>
                {BOOSTERS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {partName(b.id, b.name)}
                  </option>
                ))}
              </Select>
              {design.boosters > 0 && (
                <div className="self-end">
                  <Stepper label={t('rocket.boosters.count')} value={design.boosters} min={2} max={LIMITS.boosters} step={2} onChange={(v) => setDesign(setBoosters(design, design.boosterId, v))} />
                </div>
              )}
            </div>
          </Section>

          <Section title={t('rocket.fairing')} hint={t('rocket.fairing.hint')}>
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
              {FAIRINGS.map((f) => (
                <OptionCard key={f.id} selected={design.fairingId === f.id} onClick={() => setDesign({ ...design, fairingId: f.id })} title={partName(f.id, f.name)} stats={[t('rocket.fairing.fits', { kg: fmt(f.maxPayloadKg) }), `${fmt(f.massKg)} kg`]} />
              ))}
            </div>
          </Section>

          <Section title={t('rocket.recovery')} hint={t('rocket.recovery.hint')}>
            <div className="flex flex-wrap gap-2">
              <OptionCard selected={design.legs} onClick={() => setDesign({ ...design, legs: !design.legs })} title={t('rocket.legs')} />
              <OptionCard selected={design.fins} onClick={() => setDesign({ ...design, fins: !design.fins })} title={t('rocket.fins')} />
            </div>
          </Section>
        </div>

        <aside className="space-y-4">
          <RocketDrawing design={design} label={t('rocket.drawing')} />
          <Slider label={t('rocket.payload')} value={Math.min(payloadKg, payloadMax)} min={0} max={payloadMax} step={payloadMax > 5000 ? 100 : 10} onChange={setPayload} format={(v) => `${fmt(v)} kg`} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label={t('rocket.liftoffMass')} value={`${fmt(report.liftoffMassKg / 1000, 1)} t`} />
            <Stat label={t('rocket.liftoffTwr')} value={fmt(report.liftoffTwr, 2)} tone={twrTone} />
            <Stat label={t('rocket.dv')} value={`${fmt(report.totalDvMs)} m/s`} tone={report.totalDvMs < TARGET_DV.leo ? 'warn' : 'ok'} />
            <Stat label={t('rocket.price')} value={`$${fmt(report.costM, 1)} M`} />
            <Stat label={t('rocket.reliability')} value={`${fmt(report.reliability * 100, 1)}%`} />
            <Stat label={t('rocket.height')} value={`${fmt(report.heightM, 1)} m`} />
          </div>
          <div>{report.reusable ? <Pill tone="emerald">{t('rocket.reusable', { pct: Math.round(report.landingP * 100) })}</Pill> : <Pill>{t('rocket.expendable')}</Pill>}</div>

          <section>
            <h3 className="hud-label">{t('rocket.capacity')}</h3>
            <p className="mt-1 text-xs text-slate-400">{t('rocket.capacity.hint')}</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {TARGETS.map((target) => {
                const reach = Math.min(1, report.totalDvMs / TARGET_DV[target])
                return (
                  <li key={target}>
                    <div className="flex justify-between">
                      <span className="text-slate-300">{t(`rocket.target.${target}` as StringKey)}</span>
                      <span className="font-mono text-slate-100">{fmt(empty.capacityKg[target])} kg</span>
                    </div>
                    <div className="mt-0.5 h-1.5 overflow-hidden rounded bg-slate-800" title={t('rocket.target.need', { dv: fmt(TARGET_DV[target]) })}>
                      <div className={`h-full ${reach >= 1 ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${reach * 100}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          <section>
            <h3 className="hud-label">{t('rocket.stageTable')}</h3>
            <table className="mt-2 w-full text-left text-xs">
              <thead className="text-slate-400">
                <tr>
                  <th className="font-normal">{t('rocket.col.stage')}</th>
                  <th className="font-normal">{t('rocket.col.dv')}</th>
                  <th className="font-normal">{t('rocket.col.burn')}</th>
                  <th className="font-normal">{t('rocket.col.twr')}</th>
                </tr>
              </thead>
              <tbody className="font-mono text-slate-200">
                {report.stages.map((st, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{fmt(st.dvMs)} m/s</td>
                    <td>{fmt(st.burnS)} s</td>
                    <td>{fmt(st.twr, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="hud-label">{t('rocket.review')}</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {report.issues.length === 0 ? (
                <li className="rounded-lg border border-emerald-500/40 p-2">
                  <span className="font-medium text-emerald-300">{t('rocket.ok.title')}</span>
                  <p className="text-xs text-slate-400">{t('rocket.ok.why')}</p>
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
