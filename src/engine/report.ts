// Post-mission analysis: the three main causes of the result, with what to change next time.
import type { MissionScore } from './score'
import type { MissionState } from './simulate'
import type { Scenario } from './types'

export interface Cause {
  code: string
  /** Positive = helped, negative = hurt. Magnitude ≈ score points. */
  impact: number
  params: Record<string, number | string>
}

export interface MissionAnalysis {
  causes: Cause[]
  /** The single biggest lever for a redesign. */
  suggestion: string | null
}

export function analyseMission(s: MissionState, score: MissionScore, scenario: Scenario): MissionAnalysis {
  const r = s.report
  const causes: Cause[] = []
  const lifeReq = scenario.requiredLifeYears
  const life = score.actual.lifeYears

  if (s.endReason === 'launch_failure') {
    causes.push({ code: 'CAUSE_LAUNCH_FAILURE', impact: -600, params: { reliability: Math.round(r.risk.launchReliability * 100) } })
  } else if (s.endReason && s.endReason !== 'completed') {
    const lost = Math.max(0, lifeReq - life)
    causes.push({ code: `CAUSE_END_${s.endReason.toUpperCase()}`, impact: -150 - 200 * (lost / lifeReq), params: { life: Math.round(life * 10) / 10, required: lifeReq } })
  }

  const generated = s.dataDeliveredGb + s.dataLostGb + s.backlogGb
  if (generated > 0 && s.dataLostGb / generated > 0.05) {
    causes.push({ code: 'CAUSE_DATA_LOST', impact: -250 * (s.dataLostGb / generated), params: { lostPct: Math.round((100 * s.dataLostGb) / generated) } })
  }
  if (r.data.generatedGbDay > r.data.downlinkGbDay * 1.05) {
    causes.push({ code: 'CAUSE_BOTTLENECK', impact: -120 * (1 - r.data.downlinkGbDay / r.data.generatedGbDay), params: { gen: Math.round(r.data.generatedGbDay * 10) / 10, down: Math.round(r.data.downlinkGbDay * 10) / 10 } })
  }
  if (s.opsWeeks > 0 && s.safeWeeks / s.opsWeeks > 0.03) {
    causes.push({ code: 'CAUSE_SAFE_MODE', impact: -100 * (s.safeWeeks / s.opsWeeks), params: { weeks: s.safeWeeks } })
  }
  if (s.missedOpportunities > 0) {
    causes.push({ code: 'CAUSE_MISSED_OPPORTUNITY', impact: -15 * s.missedOpportunities, params: { count: s.missedOpportunities, title: scenario.opportunity.title } })
  }
  if (s.bonusScience > 0) causes.push({ code: 'CAUSE_SEIZED_OPPORTUNITY', impact: s.bonusScience * 1.5, params: { points: s.bonusScience } })
  const poor = s.decisions.filter((d) => d.quality === 'poor').length
  if (poor > 0) causes.push({ code: 'CAUSE_POOR_DECISIONS', impact: -25 * poor, params: { count: poor } })
  const good = s.decisions.filter((d) => d.quality === 'good').length
  if (good >= 2) causes.push({ code: 'CAUSE_GOOD_DECISIONS', impact: 12 * good, params: { count: good } })
  if (score.actual.costM > scenario.budgetM) causes.push({ code: 'CAUSE_OVER_BUDGET', impact: -150, params: { cost: Math.round(score.actual.costM), budget: scenario.budgetM } })
  const late = score.actual.devMonths - scenario.devMonths
  if (late > 0) causes.push({ code: 'CAUSE_LATE', impact: -10 * late, params: { months: Math.round(late * 10) / 10, delay: s.launchDelayMonths } })
  if (s.boosterLanded === true) causes.push({ code: 'CAUSE_BOOSTER_LANDED', impact: 40, params: {} })
  if (s.boosterLanded === false) causes.push({ code: 'CAUSE_BOOSTER_LOST', impact: -30, params: {} })
  if (s.endReason === 'completed' && life >= lifeReq) causes.push({ code: 'CAUSE_COMPLETED', impact: 120, params: { life: Math.round(life * 10) / 10 } })
  if (r.data.generatedGbDay > 0 && r.data.downlinkGbDay >= r.data.generatedGbDay * 1.2 && s.endReason !== 'launch_failure') {
    causes.push({ code: 'CAUSE_STRONG_DOWNLINK', impact: 60, params: { down: Math.round(r.data.downlinkGbDay * 10) / 10 } })
  }
  const lineScience = score.lines.find((l) => l.key === 'science')!
  if (s.endReason !== 'launch_failure' && scenario.scoring !== 'cargo' && lineScience.points < lineScience.max * 0.6) {
    causes.push({ code: 'CAUSE_LOW_SCIENCE', impact: -(lineScience.max - lineScience.points) * 0.6, params: { science: Math.round(s.science), target: scenario.scienceTarget } })
  }

  causes.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
  const top = causes.slice(0, 3)
  const worst = causes.find((c) => c.impact < 0)
  return { causes: top, suggestion: worst?.code ?? null }
}
