import type { DesignReport } from '../../engine/types'
import { RESOURCE_LABEL, ROLE_LABEL, message } from '../../i18n/en'
import { Pill, SEV_BORDER, SEV_TEXT, Section } from '../components'
import { RequirementsList } from './MissionTab'
import { useGame } from '../../store/game'

const ICON = { ok: '●', warn: '▲', error: '■' } as const

export function ReviewTab({ report }: { report: DesignReport }) {
  const errors = report.review.filter((r) => r.blocking)
  const goToLaunchPad = useGame((s) => s.goToLaunchPad)
  return (
    <div>
      <Section
        title="Design review"
        hint="Automatic checklist. Red = blocking (cannot launch). Amber = allowed but risky or costly. Green = healthy. Each item explains why and what you can change."
      >
        <ul className="space-y-2">
          {report.review.map((item, i) => {
            const m = message(item)
            return (
              <li key={`${item.code}-${i}`} className={`rounded-lg border p-3 ${SEV_BORDER[item.severity]}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={SEV_TEXT[item.severity]} aria-label={item.severity}>
                    {ICON[item.severity]}
                  </span>
                  <span className="font-medium">{m.title}</span>
                  <Pill>{RESOURCE_LABEL[item.resource]}</Pill>
                  {item.severity !== 'ok' && <Pill tone="violet">{ROLE_LABEL[item.role]}</Pill>}
                  {item.blocking && <Pill tone="rose">blocking</Pill>}
                </div>
                {item.severity !== 'ok' && <p className="mt-1 text-sm text-slate-300">{m.why}</p>}
                {item.severity === 'ok' && <p className="mt-1 text-xs text-slate-400">{m.why}</p>}
                {m.levers && item.severity !== 'ok' && (
                  <ul className="mt-2 list-inside list-disc text-xs text-slate-400">
                    {m.levers.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </Section>
      <Section title="Requirements (predicted)">
        <RequirementsList report={report} />
      </Section>
      <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
        <button
          type="button"
          disabled={errors.length > 0}
          onClick={goToLaunchPad}
          className={`w-full rounded-lg px-4 py-3 font-semibold ${
            errors.length ? 'cursor-not-allowed bg-slate-800 text-slate-500' : 'btn-primary'
          }`}
        >
          {errors.length ? `Fix ${errors.length} blocking issue${errors.length > 1 ? 's' : ''} to launch` : 'Go to the launch pad 🚀'}
        </button>
        <p className="mt-2 text-center text-xs text-slate-500">
          {errors.length ? 'Red items would make the mission impossible.' : 'Amber items are allowed — but the mission will feel them.'}
        </p>
      </div>
    </div>
  )
}
