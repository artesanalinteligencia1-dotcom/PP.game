// UI strings and Design Review explanations. Engine returns codes + params; text lives in strings/*.json.
import type { ResourceKey, ReviewItem, Role } from '../engine/types'
import { adcs, antennas, arrays, bands, batteries, compression, instruments, launchers, obcs, orbits, propulsion, stations, thermal } from '../engine/catalog/components'
import { ROUTES } from '../engine/catalog/routes'
import { LOCALE, currentLang, t, type StringKey } from './index'

export const fmt = (n: number | string | undefined, digits = 0): string => {
  if (typeof n === 'string') return n
  if (n === undefined || Number.isNaN(n)) return '—'
  if (!Number.isFinite(n)) return '∞'
  return n.toLocaleString(LOCALE[currentLang()], { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

const ROLES: Role[] = ['lead', 'engineer', 'astrophysicist', 'astrobiologist']
export const ROLE_LABEL: Record<Role, string> = Object.defineProperties(
  {} as Record<Role, string>,
  Object.fromEntries(ROLES.map((r) => [r, { get: () => t(`role.${r}.name` as StringKey), enumerable: true }]))
)

export const ROLE_BLURB: Record<Role, string> = Object.defineProperties(
  {} as Record<Role, string>,
  Object.fromEntries(ROLES.map((r) => [r, { get: () => t(`role.${r}.blurb` as StringKey), enumerable: true }]))
)

const RESOURCES: ResourceKey[] = ['mass', 'power', 'data', 'cost', 'schedule', 'life', 'science', 'risk']
export const RESOURCE_LABEL: Record<ResourceKey, string> = Object.defineProperties(
  {} as Record<ResourceKey, string>,
  Object.fromEntries(RESOURCES.map((r) => [r, { get: () => t(`resource.${r}` as StringKey), enumerable: true }]))
)

const LIFE_FACTORS = ['battery', 'panels', 'propellant', 'radiation', 'orbit'] as const
const LIFE_FACTOR: Record<string, string> = Object.defineProperties(
  {} as Record<string, string>,
  Object.fromEntries(LIFE_FACTORS.map((f) => [f, { get: () => t(`lifeFactor.${f}` as StringKey), enumerable: true }]))
)

export interface Message {
  title: string
  why: string
  levers?: string[]
}

type P = ReviewItem['params']
const n = (p: P, k: string, d = 0) => fmt(p[k] as number, d)

export const MESSAGES: Record<string, (p: P) => Message> = {
  NO_PAYLOAD: () => ({
    title: t('review.msg.NO_PAYLOAD.title'),
    why: t('review.msg.NO_PAYLOAD.why'),
    levers: [t('review.msg.NO_PAYLOAD.lever.0')],
  }),
  MASS_OVER_CAPACITY: (p) => ({
    title: t('review.msg.MASS_OVER_CAPACITY.title'),
    why: t('review.msg.MASS_OVER_CAPACITY.why', { wet: n(p, 'wet'), launcher: String(p.launcher), capacity: n(p, 'capacity') }),
    levers: [
      t('review.msg.MASS_OVER_CAPACITY.lever.0'),
      t('review.msg.MASS_OVER_CAPACITY.lever.1'),
      t('review.msg.MASS_OVER_CAPACITY.lever.2'),
      t('review.msg.MASS_OVER_CAPACITY.lever.3'),
    ],
  }),
  MASS_MARGIN_LOW: (p) => ({
    title: t('review.msg.MASS_MARGIN_LOW.title'),
    why: t('review.msg.MASS_MARGIN_LOW.why', { wet: n(p, 'wet'), capacity: n(p, 'capacity') }),
    levers: [t('review.msg.MASS_MARGIN_LOW.lever.0'), t('review.msg.MASS_MARGIN_LOW.lever.1')],
  }),
  LAUNCHER_NO_TARGET: (p) => ({
    title: t('review.msg.LAUNCHER_NO_TARGET.title'),
    why: t('review.msg.LAUNCHER_NO_TARGET.why', { launcher: String(p.launcher), orbit: String(p.orbit) }),
    levers: [t('review.msg.LAUNCHER_NO_TARGET.lever.0')],
  }),
  LAUNCHER_OVERSIZED: (p) => ({
    title: t('review.msg.LAUNCHER_OVERSIZED.title'),
    why: t('review.msg.LAUNCHER_OVERSIZED.why', { cheaper: String(p.cheaper), saving: n(p, 'saving'), launcher: String(p.launcher) }),
    levers: [t('review.msg.LAUNCHER_OVERSIZED.lever.0', { cheaper: String(p.cheaper) }), t('review.msg.LAUNCHER_OVERSIZED.lever.1')],
  }),
  NO_PROPULSION_INSERTION: (p) => ({
    title: t('review.msg.NO_PROPULSION_INSERTION.title'),
    why: t('review.msg.NO_PROPULSION_INSERTION.why', { orbit: String(p.orbit), dv: n(p, 'dv') }),
    levers: [t('review.msg.NO_PROPULSION_INSERTION.lever.0')],
  }),
  DV_INFEASIBLE: (p) => ({
    title: t('review.msg.DV_INFEASIBLE.title'),
    why: t('review.msg.DV_INFEASIBLE.why', { dv: n(p, 'dv'), isp: n(p, 'isp') }),
    levers: [t('review.msg.DV_INFEASIBLE.lever.0')],
  }),
  POWER_NEGATIVE: (p) => ({
    title: t('review.msg.POWER_NEGATIVE.title'),
    why: t('review.msg.POWER_NEGATIVE.why', { gen: n(p, 'gen'), need: n(p, 'need') }),
    levers: [
      t('review.msg.POWER_NEGATIVE.lever.0'),
      t('review.msg.POWER_NEGATIVE.lever.1'),
      t('review.msg.POWER_NEGATIVE.lever.2'),
      t('review.msg.POWER_NEGATIVE.lever.3'),
    ],
  }),
  POWER_EOL_NEGATIVE: (p) => ({
    title: t('review.msg.POWER_EOL_NEGATIVE.title'),
    why: t('review.msg.POWER_EOL_NEGATIVE.why', { years: n(p, 'years', 1), gen: n(p, 'gen'), need: n(p, 'need') }),
    levers: [t('review.msg.POWER_EOL_NEGATIVE.lever.0'), t('review.msg.POWER_EOL_NEGATIVE.lever.1')],
  }),
  POWER_MARGIN_LOW: (p) => ({
    title: t('review.msg.POWER_MARGIN_LOW.title'),
    why: t('review.msg.POWER_MARGIN_LOW.why', { marginPct: n(p, 'marginPct') }),
    levers: [t('review.msg.POWER_MARGIN_LOW.lever.0')],
  }),
  POWER_OVERSIZED: (p) => ({
    title: t('review.msg.POWER_OVERSIZED.title'),
    why: t('review.msg.POWER_OVERSIZED.why', { marginPct: n(p, 'marginPct') }),
    levers: [t('review.msg.POWER_OVERSIZED.lever.0'), t('review.msg.POWER_OVERSIZED.lever.1')],
  }),
  BATTERY_DEPLETED: (p) => ({
    title: t('review.msg.BATTERY_DEPLETED.title'),
    why: t('review.msg.BATTERY_DEPLETED.why', { eclipseMin: n(p, 'eclipseMin'), need: n(p, 'need'), have: n(p, 'have') }),
    levers: [t('review.msg.BATTERY_DEPLETED.lever.0'), t('review.msg.BATTERY_DEPLETED.lever.1'), t('review.msg.BATTERY_DEPLETED.lever.2')],
  }),
  BATTERY_DOD_HIGH: (p) => ({
    title: t('review.msg.BATTERY_DOD_HIGH.title'),
    why: t('review.msg.BATTERY_DOD_HIGH.why', { dodPct: n(p, 'dodPct'), cycles: n(p, 'cycles'), limitPct: n(p, 'limitPct') }),
    levers: [t('review.msg.BATTERY_DOD_HIGH.lever.0'), t('review.msg.BATTERY_DOD_HIGH.lever.1')],
  }),
  BATTERY_WORST_CASE: (p) => ({
    title: t('review.msg.BATTERY_WORST_CASE.title'),
    why: t('review.msg.BATTERY_WORST_CASE.why', { peak: n(p, 'peak'), eclipseMin: n(p, 'eclipseMin'), have: n(p, 'have') }),
    levers: [t('review.msg.BATTERY_WORST_CASE.lever.0'), t('review.msg.BATTERY_WORST_CASE.lever.1')],
  }),
  LONG_ECLIPSE_RISK: (p) => ({
    title: t('review.msg.LONG_ECLIPSE_RISK.title'),
    why: t('review.msg.LONG_ECLIPSE_RISK.why', { hours: n(p, 'hours', 1), need: n(p, 'need'), have: n(p, 'have') }),
    levers: [t('review.msg.LONG_ECLIPSE_RISK.lever.0'), t('review.msg.LONG_ECLIPSE_RISK.lever.1')],
  }),
  ELECTRIC_UNDERPOWERED: (p) => ({
    title: t('review.msg.ELECTRIC_UNDERPOWERED.title'),
    why: t('review.msg.ELECTRIC_UNDERPOWERED.why', { need: n(p, 'need'), have: n(p, 'have') }),
    levers: [t('review.msg.ELECTRIC_UNDERPOWERED.lever.0'), t('review.msg.ELECTRIC_UNDERPOWERED.lever.1')],
  }),
  NO_STATIONS: () => ({
    title: t('review.msg.NO_STATIONS.title'),
    why: t('review.msg.NO_STATIONS.why'),
    levers: [t('review.msg.NO_STATIONS.lever.0')],
  }),
  NO_DEEP_STATION: (p) => ({
    title: t('review.msg.NO_DEEP_STATION.title'),
    why: t('review.msg.NO_DEEP_STATION.why', { orbit: String(p.orbit) }),
    levers: [t('review.msg.NO_DEEP_STATION.lever.0')],
  }),
  DATA_BOTTLENECK: (p) => ({
    title: t('review.msg.DATA_BOTTLENECK.title'),
    why: t('review.msg.DATA_BOTTLENECK.why', {
      generated: n(p, 'generated', 1),
      downlink: n(p, 'downlink', 1),
      storage: n(p, 'storage'),
      daysToFull: n(p, 'daysToFull', 1),
      lostPct: n(p, 'lostPct'),
    }),
    levers: [
      t('review.msg.DATA_BOTTLENECK.lever.0'),
      t('review.msg.DATA_BOTTLENECK.lever.1'),
      t('review.msg.DATA_BOTTLENECK.lever.2'),
      t('review.msg.DATA_BOTTLENECK.lever.3'),
    ],
  }),
  ANTENNA_INCOMPATIBLE: (p) => ({
    title: t('review.msg.ANTENNA_INCOMPATIBLE.title'),
    why: t('review.msg.ANTENNA_INCOMPATIBLE.why', { antenna: String(p.antenna), band: String(p.band) }),
    levers: [t('review.msg.ANTENNA_INCOMPATIBLE.lever.0')],
  }),
  DISH_NEEDS_POINTING: (p) => ({
    title: t('review.msg.DISH_NEEDS_POINTING.title'),
    why: t('review.msg.DISH_NEEDS_POINTING.why', { adcs: String(p.adcs) }),
    levers: [t('review.msg.DISH_NEEDS_POINTING.lever.0')],
  }),
  MAGNETORQUERS_NO_FIELD: () => ({
    title: t('review.msg.MAGNETORQUERS_NO_FIELD.title'),
    why: t('review.msg.MAGNETORQUERS_NO_FIELD.why'),
    levers: [t('review.msg.MAGNETORQUERS_NO_FIELD.lever.0')],
  }),
  POINTING_INSUFFICIENT: (p) => ({
    title: t('review.msg.POINTING_INSUFFICIENT.title', { instrument: String(p.instrument) }),
    why: t('review.msg.POINTING_INSUFFICIENT.why', { need: String(p.need), have: String(p.have) }),
    levers: [t('review.msg.POINTING_INSUFFICIENT.lever.0'), t('review.msg.POINTING_INSUFFICIENT.lever.1')],
  }),
  POINTING_DEGRADED: (p) => ({
    title: t('review.msg.POINTING_DEGRADED.title', { instrument: String(p.instrument) }),
    why: t('review.msg.POINTING_DEGRADED.why', { need: String(p.need), have: String(p.have) }),
    levers: [t('review.msg.POINTING_DEGRADED.lever.0')],
  }),
  LOW_SUN_OPTICAL: () => ({
    title: t('review.msg.LOW_SUN_OPTICAL.title'),
    why: t('review.msg.LOW_SUN_OPTICAL.why'),
    levers: [t('review.msg.LOW_SUN_OPTICAL.lever.0'), t('review.msg.LOW_SUN_OPTICAL.lever.1')],
  }),
  COLD_RISK: (p) => ({
    title: t('review.msg.COLD_RISK.title'),
    why: t('review.msg.COLD_RISK.why', { orbit: String(p.orbit) }),
    levers: [t('review.msg.COLD_RISK.lever.0')],
  }),
  DEBRIS_NO_DISPOSAL: (p) => ({
    title: t('review.msg.DEBRIS_NO_DISPOSAL.title'),
    why: t('review.msg.DEBRIS_NO_DISPOSAL.why', { dv: n(p, 'dv') }),
    levers: [t('review.msg.DEBRIS_NO_DISPOSAL.lever.0')],
  }),
  LIFE_SHORT: (p) => ({
    title: t('review.msg.LIFE_SHORT.title'),
    why: t('review.msg.LIFE_SHORT.why', {
      life: n(p, 'life', 1),
      required: n(p, 'required', 1),
      factor: LIFE_FACTOR[p.factor as string] ?? String(p.factor),
    }),
    levers: [t('review.msg.LIFE_SHORT.lever.0')],
  }),
  RADIATION: (p) => ({
    title: t('review.msg.RADIATION.title'),
    why: t('review.msg.RADIATION.why', { dose: n(p, 'dose', 1), obc: String(p.obc), years: n(p, 'years', 1) }),
    levers: [t('review.msg.RADIATION.lever.0')],
  }),
  OVER_BUDGET: (p) => ({
    title: t('review.msg.OVER_BUDGET.title'),
    why: t('review.msg.OVER_BUDGET.why', { total: n(p, 'total', 1), budget: n(p, 'budget') }),
    levers: [
      t('review.msg.OVER_BUDGET.lever.0'),
      t('review.msg.OVER_BUDGET.lever.1'),
      t('review.msg.OVER_BUDGET.lever.2'),
      t('review.msg.OVER_BUDGET.lever.3'),
    ],
  }),
  BUDGET_TIGHT: (p) => ({
    title: t('review.msg.BUDGET_TIGHT.title'),
    why: t('review.msg.BUDGET_TIGHT.why', { total: n(p, 'total', 1), budget: n(p, 'budget') }),
  }),
  LATE: (p) => ({
    title: t('review.msg.LATE.title'),
    why: t('review.msg.LATE.why', { months: n(p, 'months'), deadline: n(p, 'deadline') }),
    levers: [t('review.msg.LATE.lever.0'), t('review.msg.LATE.lever.1'), t('review.msg.LATE.lever.2')],
  }),
  LAUNCHER_SUBORBITAL: (p) => ({
    title: t('review.msg.LAUNCHER_SUBORBITAL.title', { launcher: String(p.launcher) }),
    why: t('review.msg.LAUNCHER_SUBORBITAL.why', { apogee: n(p, 'apogee') }),
    levers: [t('review.msg.LAUNCHER_SUBORBITAL.lever.0')],
  }),
  RIDESHARE_ALTITUDE: (p) => ({
    title: t('review.msg.RIDESHARE_ALTITUDE.title'),
    why: t('review.msg.RIDESHARE_ALTITUDE.why', { max: n(p, 'max'), alt: n(p, 'alt') }),
    levers: [t('review.msg.RIDESHARE_ALTITUDE.lever.0', { max: n(p, 'max') }), t('review.msg.RIDESHARE_ALTITUDE.lever.1')],
  }),
  RIDESHARE_SCHEDULE: (p) => ({
    title: t('review.msg.RIDESHARE_SCHEDULE.title'),
    why: t('review.msg.RIDESHARE_SCHEDULE.why', { every: n(p, 'every'), wait: n(p, 'wait', 1) }),
    levers: [t('review.msg.RIDESHARE_SCHEDULE.lever.0'), t('review.msg.RIDESHARE_SCHEDULE.lever.1')],
  }),
  TCM_RESERVE_LOW: (p) => ({
    title: t('review.msg.TCM_RESERVE_LOW.title'),
    why: t('review.msg.TCM_RESERVE_LOW.why', { route: String(p.route), need: n(p, 'need'), reserve: n(p, 'reserve') }),
    levers: [t('review.msg.TCM_RESERVE_LOW.lever.0'), t('review.msg.TCM_RESERVE_LOW.lever.1')],
  }),
  MASS_OK: () => ({ title: t('review.msg.MASS_OK.title'), why: t('review.msg.MASS_OK.why') }),
  POWER_OK: () => ({ title: t('review.msg.POWER_OK.title'), why: t('review.msg.POWER_OK.why') }),
  DATA_OK: () => ({ title: t('review.msg.DATA_OK.title'), why: t('review.msg.DATA_OK.why') }),
  COST_OK: () => ({ title: t('review.msg.COST_OK.title'), why: t('review.msg.COST_OK.why') }),
  SCHEDULE_OK: () => ({ title: t('review.msg.SCHEDULE_OK.title'), why: t('review.msg.SCHEDULE_OK.why') }),
  LIFE_OK: () => ({ title: t('review.msg.LIFE_OK.title'), why: t('review.msg.LIFE_OK.why') }),
  SCIENCE_OK: () => ({ title: t('review.msg.SCIENCE_OK.title'), why: t('review.msg.SCIENCE_OK.why') }),
}

// The engine's review params and requirement targets carry catalog names in English. They are shown translated.
const NAME_KEYS = new Map<string, string>([
  ['No compression', 'component.compression_none.name'],
  ['thrusters for rendezvous', 'requirement.target.thrusters'],
])
for (const list of [instruments, launchers, orbits, arrays, batteries, bands, antennas, obcs, adcs, propulsion, thermal, compression, stations]) {
  for (const c of list) if (!NAME_KEYS.has(c.name)) NAME_KEYS.set(c.name, `component.${c.id}.name`)
}
for (const [orbit, list] of Object.entries(ROUTES)) for (const r of list) NAME_KEYS.set(r.name, `route.${orbit}.${r.id}.name`)

/** Translates a catalog name, or a " / "-separated list of them. Anything else is returned as it came. */
export function localName(value: string): string {
  return value
    .split(' / ')
    .map((name) => {
      const key = NAME_KEYS.get(name)
      return key ? t(key as StringKey) : name
    })
    .join(' / ')
}

const POINTING = new Set(['coarse', 'fine', 'precise'])

export function message(item: ReviewItem): Message {
  const f = MESSAGES[item.code]
  if (!f) return { title: item.code, why: '' }
  const params = Object.fromEntries(
    Object.entries(item.params).map(([k, v]) => {
      if (typeof v !== 'string') return [k, v]
      return [k, k === 'need' && POINTING.has(v) ? t(`spacecraft.adcs.${v}` as StringKey) : localName(v)]
    }),
  ) as P
  return f(params)
}

const REQUIREMENTS = [
  'instrumentAny',
  'orbitIn',
  'lifeYears',
  'dataDeliveredGbDay',
  'withinBudget',
  'onSchedule',
  'scienceAtLeast',
  'cargoAtLeast',
  'altitudeAtMost',
  'propulsionAny',
  'costAtMost',
  'dvAtMost',
  'arrivalByMonth',
] as const
export const REQUIREMENT_LABEL: Record<string, string> = Object.defineProperties(
  {} as Record<string, string>,
  Object.fromEntries(REQUIREMENTS.map((k) => [k, { get: () => t(`requirement.${k}` as StringKey), enumerable: true }]))
)

const GLOSSARY_ITEMS = [
  'Δv (delta-v)',
  'Duty cycle',
  'Eclipse',
  'Depth of discharge',
  'TRL',
  'Link budget',
  'Payload capacity',
  'Isp (specific impulse)',
] as const
const GLOSSARY_KEY_MAP: Record<string, StringKey> = {
  'Δv (delta-v)': 'glossary.dv',
  'Duty cycle': 'glossary.dutyCycle',
  Eclipse: 'glossary.eclipse',
  'Depth of discharge': 'glossary.dod',
  TRL: 'glossary.trl',
  'Link budget': 'glossary.linkBudget',
  'Payload capacity': 'glossary.payloadCapacity',
  'Isp (specific impulse)': 'glossary.isp',
}
export const GLOSSARY: Record<string, string> = Object.defineProperties(
  {} as Record<string, string>,
  Object.fromEntries(GLOSSARY_ITEMS.map((k) => [k, { get: () => t(GLOSSARY_KEY_MAP[k]), enumerable: true }]))
)

// ---------------------------------------------------------------------------
// Post-mission analysis (Phase 2)
// ---------------------------------------------------------------------------
type CP = Record<string, number | string>
export interface CauseMessage {
  title: string
  why: string
  change?: string
}
export const CAUSE_TEXT: Record<string, (p: CP) => CauseMessage> = {
  CAUSE_LAUNCH_FAILURE: (p) => ({
    title: t('cause.CAUSE_LAUNCH_FAILURE.title'),
    why: t('cause.CAUSE_LAUNCH_FAILURE.why', { reliability: String(p.reliability) }),
    change: t('cause.CAUSE_LAUNCH_FAILURE.change'),
  }),
  CAUSE_END_BATTERY: (p) => ({
    title: t('cause.CAUSE_END_BATTERY.title'),
    why: t('cause.CAUSE_END_BATTERY.why', { life: String(p.life), required: String(p.required) }),
    change: t('cause.CAUSE_END_BATTERY.change'),
  }),
  CAUSE_END_POWER: (p) => ({
    title: t('cause.CAUSE_END_POWER.title'),
    why: t('cause.CAUSE_END_POWER.why', { life: String(p.life) }),
    change: t('cause.CAUSE_END_POWER.change'),
  }),
  CAUSE_END_RADIATION: (p) => ({
    title: t('cause.CAUSE_END_RADIATION.title'),
    why: t('cause.CAUSE_END_RADIATION.why', { life: String(p.life) }),
    change: t('cause.CAUSE_END_RADIATION.change'),
  }),
  CAUSE_END_ORBIT: (p) => ({
    title: t('cause.CAUSE_END_ORBIT.title'),
    why: t('cause.CAUSE_END_ORBIT.why', { life: String(p.life) }),
    change: t('cause.CAUSE_END_ORBIT.change'),
  }),
  CAUSE_END_FUNDING: (p) => ({
    title: t('cause.CAUSE_END_FUNDING.title'),
    why: t('cause.CAUSE_END_FUNDING.why', { life: String(p.life) }),
    change: t('cause.CAUSE_END_FUNDING.change'),
  }),
  CAUSE_END_COLLISION: () => ({
    title: t('cause.CAUSE_END_COLLISION.title'),
    why: t('cause.CAUSE_END_COLLISION.why'),
    change: t('cause.CAUSE_END_COLLISION.change'),
  }),
  CAUSE_END_ECLIPSE: () => ({
    title: t('cause.CAUSE_END_ECLIPSE.title'),
    why: t('cause.CAUSE_END_ECLIPSE.why'),
    change: t('cause.CAUSE_END_ECLIPSE.change'),
  }),
  CAUSE_DATA_LOST: (p) => ({
    title: t('cause.CAUSE_DATA_LOST.title'),
    why: t('cause.CAUSE_DATA_LOST.why', { lostPct: String(p.lostPct) }),
    change: t('cause.CAUSE_DATA_LOST.change'),
  }),
  CAUSE_BOTTLENECK: (p) => ({
    title: t('cause.CAUSE_BOTTLENECK.title'),
    why: t('cause.CAUSE_BOTTLENECK.why', { gen: String(p.gen), down: String(p.down) }),
    change: t('cause.CAUSE_BOTTLENECK.change'),
  }),
  CAUSE_SAFE_MODE: (p) => ({
    title: t('cause.CAUSE_SAFE_MODE.title'),
    why: t('cause.CAUSE_SAFE_MODE.why', { weeks: String(p.weeks) }),
    change: t('cause.CAUSE_SAFE_MODE.change'),
  }),
  CAUSE_MISSED_OPPORTUNITY: (p) => ({
    title: t('cause.CAUSE_MISSED_OPPORTUNITY.title'),
    why: t('cause.CAUSE_MISSED_OPPORTUNITY.why', { title: String(p.title), count: String(p.count) }),
    change: t('cause.CAUSE_MISSED_OPPORTUNITY.change'),
  }),
  CAUSE_SEIZED_OPPORTUNITY: (p) => ({
    title: t('cause.CAUSE_SEIZED_OPPORTUNITY.title'),
    why: t('cause.CAUSE_SEIZED_OPPORTUNITY.why', { points: String(p.points) }),
  }),
  CAUSE_POOR_DECISIONS: (p) => ({
    title: t('cause.CAUSE_POOR_DECISIONS.title'),
    why: t('cause.CAUSE_POOR_DECISIONS.why', { count: String(p.count) }),
    change: t('cause.CAUSE_POOR_DECISIONS.change'),
  }),
  CAUSE_GOOD_DECISIONS: (p) => ({
    title: t('cause.CAUSE_GOOD_DECISIONS.title'),
    why: t('cause.CAUSE_GOOD_DECISIONS.why', { count: String(p.count) }),
  }),
  CAUSE_OVER_BUDGET: (p) => ({
    title: t('cause.CAUSE_OVER_BUDGET.title'),
    why: t('cause.CAUSE_OVER_BUDGET.why', { cost: String(p.cost), budget: String(p.budget) }),
    change: t('cause.CAUSE_OVER_BUDGET.change'),
  }),
  CAUSE_LATE: (p) => ({
    title: t('cause.CAUSE_LATE.title'),
    why:
      Number(p.delay) > 0
        ? t('cause.CAUSE_LATE.whyWithDelay', { months: String(p.months), delay: String(p.delay) })
        : t('cause.CAUSE_LATE.why', { months: String(p.months) }),
    change: t('cause.CAUSE_LATE.change'),
  }),
  CAUSE_COMPLETED: (p) => ({
    title: t('cause.CAUSE_COMPLETED.title'),
    why: t('cause.CAUSE_COMPLETED.why', { life: String(p.life) }),
  }),
  CAUSE_BOOSTER_LANDED: () => ({
    title: t('cause.CAUSE_BOOSTER_LANDED.title'),
    why: t('cause.CAUSE_BOOSTER_LANDED.why'),
  }),
  CAUSE_BOOSTER_LOST: () => ({
    title: t('cause.CAUSE_BOOSTER_LOST.title'),
    why: t('cause.CAUSE_BOOSTER_LOST.why'),
    change: t('cause.CAUSE_BOOSTER_LOST.change'),
  }),
  CAUSE_STRONG_DOWNLINK: (p) => ({
    title: t('cause.CAUSE_STRONG_DOWNLINK.title'),
    why: t('cause.CAUSE_STRONG_DOWNLINK.why', { down: String(p.down) }),
  }),
  CAUSE_LOW_SCIENCE: (p) => ({
    title: t('cause.CAUSE_LOW_SCIENCE.title'),
    why: t('cause.CAUSE_LOW_SCIENCE.why', { science: String(p.science), target: String(p.target) }),
    change: t('cause.CAUSE_LOW_SCIENCE.change'),
  }),
}

const END_REASONS = [
  'completed',
  'launch_failure',
  'battery',
  'power',
  'radiation',
  'orbit',
  'funding',
  'collision',
  'eclipse',
] as const
export const END_REASON_LABEL: Record<string, string> = Object.defineProperties(
  {} as Record<string, string>,
  Object.fromEntries(END_REASONS.map((k) => [k, { get: () => t(`endReason.${k}` as StringKey), enumerable: true }]))
)

/** Default protagonist (fictional). The player will be able to rename them in Phase 3. */
export const PROTAGONIST = {
  name: 'Pedro Goicochea',
  title: 'Dr.',
  get bio() {
    return t('protagonist.bio')
  },
}
