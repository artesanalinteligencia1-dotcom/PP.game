// Mission score (0–1000) and rank. Documented in docs/model.md §12.
import type { MissionState, Quality } from './simulate'
import { SIM_WEEKS_PER_YEAR } from './simulate'
import type { Scenario } from './types'

export type Rank = 'Fail' | 'Partial' | 'Success' | 'Outstanding'

export interface ScoreLine {
  key: 'success' | 'science' | 'efficiency' | 'decisions' | 'schedule' | 'bonus'
  label: string
  points: number
  max: number
  detail: string
}

export interface ActualRequirement {
  id: string
  kind: string
  optional: boolean
  met: boolean
  actual: number | string
  target: number | string
}

export interface MissionScore {
  total: number
  rank: Rank
  lines: ScoreLine[]
  requirements: ActualRequirement[]
  /** Solo games have no collaboration component; the rest is rescaled so the maximum stays 1 000. */
  soloRescale: number
  actual: {
    lifeYears: number
    deliveredGbDay: number
    costM: number
    devMonths: number
    science: number
  }
}

const QUALITY_VALUE: Record<Quality, number> = { good: 1, ok: 0.6, poor: 0.2 }

/** Plateau scoring: 0 at `zero`, 1 between lo and hi, sloping down to `tail` value at `far`. */
export function plateau(x: number, zero: number, lo: number, hi: number, far: number, tail: number): number {
  if (!Number.isFinite(x)) return 0
  if (x <= zero) return 0
  if (x < lo) return 0.2 + (0.8 * (x - zero)) / (lo - zero)
  if (x <= hi) return 1
  if (x >= far) return tail
  return 1 - ((1 - tail) * (x - hi)) / (far - hi)
}

export function scoreMission(s: MissionState, scenario: Scenario): MissionScore {
  const r = s.report
  const launched = s.endReason !== 'launch_failure'
  const lifeYears = s.opsWeeks / SIM_WEEKS_PER_YEAR
  const opsDays = s.opsWeeks * 7
  const deliveredGbDay = opsDays > 0 ? s.dataDeliveredGb / opsDays : 0
  const costM = r.cost.totalM + s.extraCostM
  const devMonths = r.schedule.devMonths + s.launchDelayMonths

  const requirements: ActualRequirement[] = scenario.requirements.map((req) => {
    const designed = r.requirements.find((x) => x.id === req.id)!
    const base = { id: req.id, kind: req.kind, optional: !!req.optional }
    switch (req.kind) {
      case 'lifeYears':
        return { ...base, met: launched && lifeYears >= (req.value ?? 0) - 1e-9, actual: lifeYears, target: req.value ?? 0 }
      case 'dataDeliveredGbDay':
        return { ...base, met: launched && deliveredGbDay >= (req.value ?? 0), actual: deliveredGbDay, target: req.value ?? 0 }
      case 'withinBudget':
        return { ...base, met: costM <= scenario.budgetM, actual: costM, target: scenario.budgetM }
      case 'onSchedule':
        return { ...base, met: devMonths <= scenario.devMonths, actual: devMonths, target: scenario.devMonths }
      case 'scienceAtLeast':
        return { ...base, met: s.science >= (req.value ?? 0), actual: s.science, target: req.value ?? 0 }
      case 'costAtMost':
        return { ...base, met: costM <= (req.value ?? Infinity), actual: costM, target: req.value ?? 0 }
      case 'arrivalByMonth': {
        const arrival = devMonths + r.schedule.transferMonths
        return { ...base, met: launched && arrival <= (req.value ?? Infinity), actual: arrival, target: req.value ?? 0 }
      }
      default:
        return { ...base, met: launched && designed.met, actual: designed.actual, target: designed.target }
    }
  })
  const mandatory = requirements.filter((x) => !x.optional)
  const metCount = mandatory.filter((x) => x.met).length
  const allMet = metCount === mandatory.length

  // 1. Mission success (300)
  const success = launched ? (300 * metCount) / Math.max(1, mandatory.length) : 0
  // 2. Science (250) — or cargo delivered for resupply contracts
  const cargo = scenario.scoring === 'cargo'
  const cargoTarget = scenario.requirements.find((q) => q.kind === 'cargoAtLeast' && !q.optional)?.value ?? 1
  const delivered = launched && lifeYears > 0 ? (s.design.cargoKg ?? 0) : 0
  const science = !launched ? 0 : cargo ? 250 * Math.min(1, delivered / cargoTarget) : 250 * Math.min(1, s.science / scenario.scienceTarget)
  // 3. Resource efficiency (150): launcher margin, EOL power margin, budget use
  const launchMargin = r.mass.capacityKg > 0 ? 1 - r.mass.wetKg / r.mass.capacityKg : 0
  const effLaunch = plateau(launchMargin, 0, 0.15, 0.35, 0.9, 0.4)
  const effPower = plateau(r.power.marginEol, 0, 0.15, 0.5, 2, 0.4)
  const used = costM / scenario.budgetM
  const effBudget = used > 1 ? 0 : used <= 0.9 ? 1 : 1 - 4 * (used - 0.9)
  const efficiency = 50 * (effLaunch + effPower + effBudget)
  // 4. Engineering decision quality (100): design warnings at launch + in-flight decisions
  const warns = r.review.filter((x) => x.severity === 'warn').length
  const designQ = Math.max(0, 50 - 10 * warns)
  const flightQ = s.decisions.length ? (50 * s.decisions.reduce((t, d) => t + QUALITY_VALUE[d.quality], 0)) / s.decisions.length : 50
  const decisions = designQ + flightQ
  // 5. Schedule (50)
  const late = devMonths - scenario.devMonths
  const schedule = late <= 0 ? 50 : Math.max(0, 50 - 10 * late)
  // 6. Bonus objectives (≤ 50)
  const bonus = Math.min(
    50,
    scenario.requirements.filter((q) => q.optional && requirements.find((x) => x.id === q.id)?.met).reduce((t, q) => t + (q.bonus ?? 0), 0),
  )

  // Solo: no collaboration (100) → rescale the 850 base points to 950.
  const soloRescale = 950 / 850
  const base = (success + science + efficiency + decisions + schedule) * soloRescale
  const total = Math.round(Math.min(1000, base + (launched ? bonus : 0)))

  let rank: Rank
  if (!launched || success < 150) rank = 'Fail'
  else if (!allMet) rank = 'Partial'
  else if (total >= 800) rank = 'Outstanding'
  else rank = 'Success'

  const fmt1 = (x: number) => (Math.round(x * 10) / 10).toString()
  const lines: ScoreLine[] = [
    { key: 'success', label: 'Mission success', points: success * soloRescale, max: 300 * soloRescale, detail: `${metCount}/${mandatory.length} requirements met` },
    cargo
      ? { key: 'science', label: 'Cargo delivered', points: science * soloRescale, max: 250 * soloRescale, detail: `${Math.round(delivered)} of ${cargoTarget} kg` }
      : { key: 'science', label: 'Science achieved', points: science * soloRescale, max: 250 * soloRescale, detail: `${fmt1(s.science)} of ${scenario.scienceTarget} points` },
    { key: 'efficiency', label: 'Resource efficiency', points: efficiency * soloRescale, max: 150 * soloRescale, detail: `launch margin ${Math.round(launchMargin * 100)}%, power margin ${Math.round(r.power.marginEol * 100)}%, budget used ${Math.round(used * 100)}%` },
    { key: 'decisions', label: 'Engineering decisions', points: decisions * soloRescale, max: 100 * soloRescale, detail: `${warns} design warnings, ${s.decisions.length} flight decisions` },
    { key: 'schedule', label: 'Schedule', points: schedule * soloRescale, max: 50 * soloRescale, detail: late <= 0 ? 'ready on time' : `${fmt1(late)} months late` },
    { key: 'bonus', label: 'Bonus objectives', points: launched ? bonus : 0, max: 50, detail: `${requirements.filter((x) => x.optional && x.met).length} bonus objectives` },
  ]
  return { total, rank, lines, requirements, soloRescale, actual: { lifeYears, deliveredGbDay, costM, devMonths, science: s.science } }
}
