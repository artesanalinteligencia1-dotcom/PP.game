import { dataGbPerDay } from '../../engine/budget'
import { instruments } from '../../engine/catalog'
import type { Design, PointingLevel, Scenario } from '../../engine/types'
import { fmt } from '../../i18n/en'
import { useGame } from '../../store/game'
import { Pill, Section, Slider } from '../components'
import { useT, useTx, type StringKey } from '../../i18n'

const POINTING_LABEL: Record<PointingLevel, StringKey> = {
  coarse: 'payload.pointing.coarse',
  fine: 'payload.pointing.fine',
  precise: 'payload.pointing.precise',
}

export function PayloadTab({ design, scenario }: { design: Design; scenario: Scenario }) {
  const toggle = useGame((s) => s.toggleInstrument)
  const setDuty = useGame((s) => s.setDuty)
  const update = useGame((s) => s.update)
  const t = useT()
  const tx = useTx()
  const cargoReq = scenario.requirements.find((r) => r.kind === 'cargoAtLeast' && !r.optional)
  const sorted = [...instruments].sort((a, b) => (scenario.relevance[b.id] ?? 0.2) - (scenario.relevance[a.id] ?? 0.2))
  return (
    <div>
      {cargoReq && (
        <Section title={t('payload.cargo')} hint={t('payload.cargo.hint')}>
          <Slider
            label={t('payload.cargo.mass')}
            value={design.cargoKg ?? 0}
            min={0}
            max={2500}
            step={50}
            onChange={(v) => update({ cargoKg: v })}
            format={(v) => t('payload.cargo.format', { val: fmt(v), req: fmt(cargoReq.value) })}
          />
        </Section>
      )}
      <Section
        title={t('payload.instruments')}
        hint={t('payload.instruments.hint')}
      >
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {sorted.map((inst) => {
            const sel = design.instruments.find((i) => i.id === inst.id)
            const rel = scenario.relevance[inst.id] ?? 0.2
            const stars = Math.round(rel * 3)
            return (
              <div
                key={inst.id}
                className={`rounded-lg border p-3 ${sel ? 'border-sky-400 bg-sky-500/10' : 'border-slate-700 bg-slate-900/60'}`}
              >
                <button type="button" className="w-full text-left" onClick={() => toggle(inst.id)} aria-pressed={!!sel}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">
                      <span className={sel ? 'text-sky-300' : 'text-slate-500'}>{sel ? '☑' : '☐'}</span> {tx(`component.${inst.id}.name`, inst.name)}
                    </span>
                    <span className="text-amber-300" title={t('payload.relevance', { pct: fmt(rel * 100) })}>
                      {'★'.repeat(stars)}
                      <span className="text-slate-700">{'★'.repeat(3 - stars)}</span>
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-400">
                    <span>{inst.massKg} kg</span>
                    <span>{inst.powerW} W</span>
                    <span>{inst.dataRateMbps} Mbit/s</span>
                    <span>${inst.costM} M</span>
                    <span>{t('payload.science', { val: inst.science })}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Pill tone={inst.trl >= 8 ? 'emerald' : inst.trl === 7 ? 'amber' : 'rose'}>TRL {inst.trl}</Pill>
                    <Pill>{t(POINTING_LABEL[inst.pointing])}</Pill>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{tx(`component.${inst.id}.description`, inst.description)}</p>
                </button>
                {sel && (
                  <div className="mt-2">
                    <Slider
                      label={t('payload.dutyCycle')}
                      value={sel.duty}
                      min={0.01}
                      max={1}
                      step={0.01}
                      onChange={(v) => setDuty(inst.id, v)}
                      format={(v) => `${fmt(v * 100)}% → ${fmt(dataGbPerDay(inst.dataRateMbps, v), 1)} GB/day`}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Section>
    </div>
  )
}
