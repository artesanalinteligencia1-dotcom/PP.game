// What Kuntur says: pure functions from the design review and the mission analysis to lines, so they can be tested.
import type { Cause } from '../../engine/report'
import type { Rank } from '../../engine/score'
import type { DesignReport, ResourceKey, ReviewItem } from '../../engine/types'
import { t } from '../../i18n'
import { CAUSE_TEXT, message } from '../../i18n/en'
import type { TabId } from '../../store/game'
import type { GuideMood } from './robots'

/** The tab where each kind of problem is fixed. */
const TAB_BY_RESOURCE: Record<ResourceKey, TabId> = {
  mass: 'orbit',
  power: 'spacecraft',
  data: 'comms',
  cost: 'mission',
  schedule: 'payload',
  life: 'spacecraft',
  science: 'payload',
  risk: 'review',
}
const TAB_BY_PREFIX: [string, TabId][] = [
  ['EDL_', 'orbit'],
  ['MARS_WINDOW_', 'orbit'],
  ['LAUNCHER_', 'orbit'],
  ['RIDESHARE_', 'orbit'],
  ['TCM_', 'orbit'],
  ['MASS_', 'orbit'],
  ['OXYGEN_', 'payload'],
  ['POINTING_', 'payload'],
  ['NO_PAYLOAD', 'payload'],
  ['LOW_SUN_', 'orbit'],
  ['ANTENNA_', 'comms'],
  ['DISH_', 'comms'],
  ['NO_STATIONS', 'comms'],
  ['NO_DEEP_STATION', 'comms'],
  ['DATA_', 'comms'],
]

export function tabFor(item: Pick<ReviewItem, 'code' | 'resource'>): TabId {
  return TAB_BY_PREFIX.find(([p]) => item.code.startsWith(p))?.[1] ?? TAB_BY_RESOURCE[item.resource]
}

/** Problems in the order Kuntur raises them: what blocks the launch first, and on each level the open tab first. */
export function orderedIssues(report: DesignReport, tab: TabId): ReviewItem[] {
  const rank = (i: ReviewItem) => (i.blocking ? 0 : 2) + (tabFor(i) === tab ? 0 : 1)
  return report.review
    .filter((i) => i.severity !== 'ok')
    .map((item, k) => ({ item, k }))
    .sort((a, b) => rank(a.item) - rank(b.item) || a.k - b.k)
    .map((x) => x.item)
}

export interface HintLine {
  title: string
  text: string
  mood: GuideMood
  tab: TabId | null
}

export function designMood(report: DesignReport): GuideMood {
  if (report.review.some((i) => i.blocking)) return 'worried'
  if (report.review.some((i) => i.severity === 'warn')) return 'thinking'
  return 'happy'
}

/** One line per problem: what is wrong, why, and the first lever that fixes it. All green: one happy line. */
export function designHints(report: DesignReport, tab: TabId): HintLine[] {
  const issues = orderedIssues(report, tab)
  if (issues.length === 0) return [{ title: t('guide.hint.allGood.title'), text: t('guide.hint.allGood.text'), mood: 'happy', tab: null }]
  return issues.map((item) => {
    const m = message(item)
    const lever = m.levers?.[0]
    const where = tabFor(item)
    return {
      title: m.title,
      text: lever ? `${m.why} ${t('guide.hint.try', { lever })}` : m.why,
      mood: item.blocking ? 'worried' : 'explaining',
      tab: where === tab ? null : where,
    }
  })
}

export function resultsMood(rank: Rank): GuideMood {
  return rank === 'Fail' ? 'worried' : rank === 'Partial' ? 'thinking' : 'happy'
}

/** After a mission: the causes that cost most first, then what went well. */
export function resultsLines(causes: Cause[]): HintLine[] {
  const bad = causes.filter((c) => c.impact < 0).sort((a, b) => a.impact - b.impact)
  const good = causes.filter((c) => c.impact >= 0).sort((a, b) => b.impact - a.impact)
  return [...bad, ...good].map((c) => {
    const m = CAUSE_TEXT[c.code]?.(c.params) ?? { title: c.code, why: '' }
    return {
      title: m.title,
      text: m.change && c.impact < 0 ? `${m.why} ${t('guide.results.change', { change: m.change })}` : m.why,
      mood: c.impact < 0 ? 'explaining' : 'happy',
      tab: null,
    }
  })
}

export const TUTORIAL: { id: string; tab: TabId; mood: GuideMood }[] = [
  { id: 'welcome', tab: 'mission', mood: 'happy' },
  { id: 'mission', tab: 'mission', mood: 'explaining' },
  { id: 'payload', tab: 'payload', mood: 'explaining' },
  { id: 'spacecraft', tab: 'spacecraft', mood: 'explaining' },
  { id: 'orbit', tab: 'orbit', mood: 'explaining' },
  { id: 'comms', tab: 'comms', mood: 'explaining' },
  { id: 'review', tab: 'review', mood: 'thinking' },
  { id: 'end', tab: 'review', mood: 'happy' },
]
