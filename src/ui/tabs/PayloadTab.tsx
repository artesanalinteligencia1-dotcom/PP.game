import { dataGbPerDay } from '../../engine/budget'
import { instruments } from '../../engine/catalog'
import type { Design, Scenario } from '../../engine/types'
import { fmt } from '../../i18n/en'
import { useGame } from '../../store/game'
import { Pill, Section, Slider } from '../components'

const POINTING_LABEL = { coarse: 'any ADCS', fine: 'needs wheels', precise: 'needs star tracker' } as const

export function PayloadTab({ design, scenario }: { design: Design; scenario: Scenario }) {
  const toggle = useGame((s) => s.toggleInstrument)
  const setDuty = useGame((s) => s.setDuty)
  const sorted = [...instruments].sort((a, b) => (scenario.relevance[b.id] ?? 0.2) - (scenario.relevance[a.id] ?? 0.2))
  return (
    <div>
      <Section
        title="Instruments"
        hint="Pick what your mission carries. Each instrument adds mass, power, data and cost. Stars = how useful it is for this scenario. Duty cycle = share of the day it is switched on."
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
                      <span className={sel ? 'text-sky-300' : 'text-slate-500'}>{sel ? '☑' : '☐'}</span> {inst.name}
                    </span>
                    <span className="text-amber-300" title={`Relevance to this mission: ${fmt(rel * 100)}%`}>
                      {'★'.repeat(stars)}
                      <span className="text-slate-700">{'★'.repeat(3 - stars)}</span>
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-400">
                    <span>{inst.massKg} kg</span>
                    <span>{inst.powerW} W</span>
                    <span>{inst.dataRateMbps} Mbit/s</span>
                    <span>${inst.costM} M</span>
                    <span>science {inst.science}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Pill tone={inst.trl >= 8 ? 'emerald' : inst.trl === 7 ? 'amber' : 'rose'}>TRL {inst.trl}</Pill>
                    <Pill>{POINTING_LABEL[inst.pointing]}</Pill>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{inst.description}</p>
                </button>
                {sel && (
                  <div className="mt-2">
                    <Slider
                      label="Duty cycle"
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
