import type { DesignReport, Role, Scenario } from '../../engine/types'
import { PROTAGONIST, REQUIREMENT_LABEL, ROLE_BLURB, ROLE_LABEL, fmt, message, localName } from '../../i18n/en'
import { Pill, SEV_BORDER, SEV_TEXT, Section } from '../components'
import { useT, useTx, type StringKey } from '../../i18n'

export const ROLE_ICON: Record<Role, string> = { lead: '★', engineer: '⚙', astrophysicist: '✦', astrobiologist: '❋' }

export function RequirementsList({ report }: { report: DesignReport }) {
  const t = useT()
  return (
    <ul className="space-y-1.5 text-sm">
      {report.requirements.map((r) => {
        const actual = typeof r.actual === 'number' ? fmt(r.actual, 1) : localName(String(r.actual))
        const target =
          r.kind === 'withinBudget' ? `$${fmt(r.target as number)} M` : typeof r.target === 'number' ? fmt(r.target, 1) : localName(String(r.target))
        const unit = r.kind === 'lifeYears' ? t('mission.req.yr') : r.kind === 'dataDeliveredGbDay' ? t('mission.req.gbDay') : ''
        return (
          <li key={r.id} className="flex items-start gap-2">
            <span className={r.met ? 'text-emerald-400' : r.optional ? 'text-slate-500' : 'text-rose-400'}>{r.met ? '✔' : r.optional ? '○' : '✘'}</span>
            <span className="flex-1">
              {r.optional && <Pill tone="violet">{t('mission.bonus')}</Pill>} <span className="text-slate-300">{REQUIREMENT_LABEL[r.kind]}</span>{' '}
              <span className="text-slate-100">
                {target}
                {unit}
              </span>
              {r.kind !== 'withinBudget' && r.kind !== 'instrumentAny' && r.kind !== 'orbitIn' && (
                <span className="text-slate-500">
                  {t('mission.req.now', { actual: `${actual}${unit}` })}
                </span>
              )}
              {r.kind === 'withinBudget' && <span className="text-slate-500">{t('mission.req.nowBudget', { actual: fmt(r.actual as number, 1) })}</span>}
              {r.kind === 'onSchedule' && <span className="text-slate-500">{t('mission.req.months')}</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export function MissionTab({ scenario, report }: { scenario: Scenario; report: DesignReport }) {
  const t = useT()
  const tx = useTx()
  const roles: Role[] = ['lead', 'engineer', 'astrophysicist', 'astrobiologist']
  return (
    <div>
      <Section title={t('mission.briefing')}>
        <p className="mb-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-200">
            {PROTAGONIST.title} {PROTAGONIST.name}
          </span>{' '}
          — {PROTAGONIST.bio} <span className="italic">{t('mission.fictional')}</span>
        </p>
        <p className="text-slate-200">{tx(`scenario.${scenario.id}.objective`, scenario.objective)}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Pill tone="sky">{t('mission.budget', { budget: scenario.budgetM })}</Pill>
          <Pill tone="sky">{t('mission.launchIn', { months: scenario.devMonths })}</Pill>
          <Pill tone="sky">{t('mission.operate', { years: scenario.requiredLifeYears })}</Pill>
          <Pill tone={scenario.difficulty === 'beginner' ? 'emerald' : 'rose'}>{t(`difficulty.${scenario.difficulty}` as StringKey)}</Pill>
        </div>
        <p className="mt-3 rounded border border-slate-800 bg-slate-900/60 p-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">{t('mission.whyMatters')}</span>
          {tx(`scenario.${scenario.id}.whyItMatters`, scenario.whyItMatters)}
        </p>
      </Section>
      <Section title={t('mission.requirements')} hint={t('mission.requirements.hint')}>
        <RequirementsList report={report} />
      </Section>
      <Section title={t('mission.team')} hint={t('mission.team.hint')}>
        <div className="grid gap-2 sm:grid-cols-2">
          {roles.map((role) => {
            const item = report.review.find((r) => r.role === role && r.severity !== 'ok')
            const msg = item ? message(item) : null
            const sev = item?.severity ?? 'ok'
            return (
              <div key={role} className={`rounded-lg border p-3 ${SEV_BORDER[sev]}`}>
                <div className="text-xs font-semibold text-slate-300" title={ROLE_BLURB[role]}>
                  {ROLE_ICON[role]} {ROLE_LABEL[role]}
                </div>
                <p className={`mt-1 text-sm ${SEV_TEXT[sev]}`}>{msg ? t('mission.teamQuote', { title: msg.title }) : t('mission.allGood')}</p>
                {msg && <p className="mt-1 text-xs text-slate-400">{msg.why}</p>}
              </div>
            )
          })}
        </div>
      </Section>
    </div>
  )
}
