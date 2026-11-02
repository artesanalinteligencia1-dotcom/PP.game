// English UI strings and Design Review explanations. Engine returns codes + params; text lives here.
import type { ResourceKey, ReviewItem, Role } from '../engine/types'

export const fmt = (n: number | string | undefined, digits = 0): string => {
  if (typeof n === 'string') return n
  if (n === undefined || Number.isNaN(n)) return '—'
  if (!Number.isFinite(n)) return '∞'
  return n.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

export const ROLE_LABEL: Record<Role, string> = {
  lead: 'Mission Lead',
  science: 'Science Lead',
  engineer: 'Spacecraft Engineer',
  ops: 'Comms & Ops',
}

export const RESOURCE_LABEL: Record<ResourceKey, string> = {
  mass: 'Mass',
  power: 'Power',
  data: 'Data',
  cost: 'Budget',
  schedule: 'Schedule',
  life: 'Lifetime',
  science: 'Science',
  risk: 'Risk',
}

const LIFE_FACTOR: Record<string, string> = {
  battery: 'the battery wearing out from charge cycles',
  panels: 'solar panels degrading below what you need',
  propellant: 'the planned mission life (propellant and operations are sized for it)',
  radiation: 'radiation damaging the computer',
  orbit: 'the orbit decaying with no thrusters to correct it',
}

export interface Message {
  title: string
  why: string
  levers?: string[]
}

type P = ReviewItem['params']
const n = (p: P, k: string, d = 0) => fmt(p[k] as number, d)

export const MESSAGES: Record<string, (p: P) => Message> = {
  NO_PAYLOAD: () => ({
    title: 'No instruments on board',
    why: 'A spacecraft without instruments returns no science. Open the Payload tab and add at least one instrument.',
    levers: ['Payload tab → add an instrument the scenario needs'],
  }),
  MASS_OVER_CAPACITY: (p) => ({
    title: 'Too heavy for the launcher',
    why: `Your spacecraft weighs ${n(p, 'wet')} kg fully fuelled, but the ${p.launcher} can only carry ${n(p, 'capacity')} kg to this orbit. It would never reach orbit.`,
    levers: ['Choose a bigger launcher', 'Remove or swap heavy instruments', 'Use more efficient propulsion (less propellant)', 'Shorten the design life (less propellant)'],
  }),
  MASS_MARGIN_LOW: (p) => ({
    title: 'Launcher almost full',
    why: `You use ${n(p, 'wet')} of ${n(p, 'capacity')} kg. Real spacecraft tend to grow during development; less than 10 % spare capacity is risky.`,
    levers: ['Trim mass', 'Pick a launcher with more capacity'],
  }),
  LAUNCHER_NO_TARGET: (p) => ({
    title: 'Launcher cannot reach this orbit',
    why: `The ${p.launcher} is not powerful enough to send anything towards ${p.orbit}.`,
    levers: ['Choose a bigger launcher'],
  }),
  LAUNCHER_OVERSIZED: (p) => ({
    title: 'You are paying for unused rocket',
    why: `The ${p.cheaper} could carry this spacecraft and would save about $${n(p, 'saving')} M compared with the ${p.launcher}.`,
    levers: [`Switch to the ${p.cheaper}`, 'Or use the spare capacity for more payload'],
  }),
  NO_PROPULSION_INSERTION: (p) => ({
    title: 'No engine to finish the trip',
    why: `The launcher drops you on a transfer path; reaching ${p.orbit} needs another ${n(p, 'dv')} m/s that only the spacecraft's own engine can provide.`,
    levers: ['Add propulsion (hydrazine or electric)'],
  }),
  DV_INFEASIBLE: (p) => ({
    title: 'This engine cannot do the job',
    why: `You need ${n(p, 'dv')} m/s of Δv but an engine with Isp ${n(p, 'isp')} s would need more propellant than any tank can hold (rocket equation).`,
    levers: ['Use propulsion with higher Isp (hydrazine, electric)'],
  }),
  POWER_NEGATIVE: (p) => ({
    title: 'Not enough power',
    why: `Your solar arrays deliver ${n(p, 'gen')} W on average over an orbit, but the spacecraft needs ${n(p, 'need')} W (including recharging the battery for eclipse). The battery would drain and the spacecraft would shut down — like a phone that uses more than its charger gives.`,
    levers: ['Increase solar array area', 'Use Sun-tracking arrays', 'Lower instrument duty cycles', 'Remove power-hungry instruments'],
  }),
  POWER_EOL_NEGATIVE: (p) => ({
    title: 'Power runs short before end of mission',
    why: `Panels degrade every year. After ${n(p, 'years', 1)} years they give only ${n(p, 'gen')} W vs ${n(p, 'need')} W needed.`,
    levers: ['Add array area as margin', 'Shorten design life'],
  }),
  POWER_MARGIN_LOW: (p) => ({
    title: 'Thin power margin',
    why: `End-of-life power margin is only ${n(p, 'marginPct')} %. Engineers usually keep 10–25 % for surprises.`,
    levers: ['Slightly larger arrays'],
  }),
  POWER_OVERSIZED: (p) => ({
    title: 'Solar arrays bigger than needed',
    why: `You have ${n(p, 'marginPct')} % more power than needed even at end of life. That extra area costs mass and money.`,
    levers: ['Reduce array area', 'Or use the spare power for more instruments'],
  }),
  BATTERY_DEPLETED: (p) => ({
    title: 'Battery dies in every eclipse',
    why: `Each eclipse lasts ${n(p, 'eclipseMin')} min and needs ${n(p, 'need')} Wh, but the battery holds only ${n(p, 'have')} Wh.`,
    levers: ['Bigger battery', 'Lower loads', 'Dawn-dusk orbit (almost no eclipses)'],
  }),
  BATTERY_DOD_HIGH: (p) => ({
    title: 'Battery discharged too deeply',
    why: `Each eclipse empties ${n(p, 'dodPct')} % of the battery. With ~${n(p, 'cycles')} eclipses per year, staying above ${n(p, 'limitPct')} % depth of discharge wears it out quickly (shorter life).`,
    levers: ['Bigger battery', 'Lower average load'],
  }),
  BATTERY_WORST_CASE: (p) => ({
    title: 'Cannot run everything during eclipse',
    why: `With all instruments and the radio on (${n(p, 'peak')} W) for a full ${n(p, 'eclipseMin')} min eclipse, the ${n(p, 'have')} Wh battery would run flat. Operations will have to schedule instruments.`,
    levers: ['Bigger battery', 'Accept scheduled operations'],
  }),
  LONG_ECLIPSE_RISK: (p) => ({
    title: 'May not survive a long eclipse',
    why: `Occasionally the Earth's shadow covers the Moon for ~${n(p, 'hours', 1)} h. Even in safe mode you would need ${n(p, 'need')} Wh but the battery holds ${n(p, 'have')} Wh.`,
    levers: ['Bigger battery', 'Lower safe-mode loads'],
  }),
  ELECTRIC_UNDERPOWERED: (p) => ({
    title: 'Electric thruster starved of power',
    why: `Electric propulsion needs about ${n(p, 'need')} W in sunlight while thrusting; your arrays give ${n(p, 'have')} W.`,
    levers: ['Larger or Sun-tracking arrays', 'Use chemical propulsion'],
  }),
  NO_STATIONS: () => ({
    title: 'No ground stations',
    why: 'Without a ground station nobody can receive your data or send commands.',
    levers: ['Ground & Comms → select at least one station'],
  }),
  NO_DEEP_STATION: (p) => ({
    title: 'Too far for ordinary antennas',
    why: `From ${p.orbit} the signal is extremely weak. Only large deep-space antennas can hear it.`,
    levers: ['Select at least one Deep Space Antenna'],
  }),
  DATA_BOTTLENECK: (p) => ({
    title: 'Data bottleneck',
    why: `Your instruments produce ${n(p, 'generated', 1)} GB/day but you can only download ${n(p, 'downlink', 1)} GB/day. The on-board memory (${n(p, 'storage')} GB) fills in ${n(p, 'daysToFull', 1)} days; after that ${n(p, 'lostPct')} % of the data is lost.`,
    levers: ['Add another ground station (high-latitude ones see polar orbits more often)', 'Use a higher band (X → Ka) or a bigger antenna', 'Lower instrument duty cycles', 'Turn on compression'],
  }),
  ANTENNA_INCOMPATIBLE: (p) => ({
    title: 'Antenna does not fit this radio',
    why: `The ${p.antenna} antenna cannot be used with ${p.band}.`,
    levers: ['Pick a compatible antenna'],
  }),
  DISH_NEEDS_POINTING: (p) => ({
    title: 'Dish cannot be aimed',
    why: `A steerable dish needs accurate attitude control; with ${p.adcs} it misses Earth often and the data rate drops.`,
    levers: ['Use reaction wheels or a star tracker'],
  }),
  MAGNETORQUERS_NO_FIELD: () => ({
    title: 'Magnetorquers need a magnetic field',
    why: 'Magnetorquers push against Earth’s magnetic field. Far from Earth there is no field to push against: the spacecraft would tumble.',
    levers: ['Use reaction wheels or a star tracker'],
  }),
  POINTING_INSUFFICIENT: (p) => ({
    title: `${p.instrument} needs precise pointing`,
    why: `This instrument needs ${p.need} pointing; ${p.have} cannot hold it steady enough, so it would return blurred, useless data.`,
    levers: ['Add a star tracker', 'Or swap the instrument'],
  }),
  POINTING_DEGRADED: (p) => ({
    title: `${p.instrument} works poorly`,
    why: `It needs ${p.need} pointing; with ${p.have} you get about half the science.`,
    levers: ['Use reaction wheels or better'],
  }),
  LOW_SUN_OPTICAL: () => ({
    title: 'Long shadows for optical cameras',
    why: 'In a dawn-dusk orbit the ground below is at sunrise or sunset. Optical cameras get dark, shadowed images (half the science). Radar does not care.',
    levers: ['Use the 10:30 sun-synchronous orbit for optical instruments', 'Or fly radar/microwave instruments'],
  }),
  COLD_RISK: (p) => ({
    title: 'Risk of freezing',
    why: `Around ${p.orbit} long cold periods can freeze batteries and propellant lines without heaters.`,
    levers: ['Use active thermal control'],
  }),
  DEBRIS_NO_DISPOSAL: (p) => ({
    title: 'Cannot clean up after itself',
    why: `Without thrusters you cannot lower the orbit (${n(p, 'dv')} m/s) at end of life; the dead satellite stays as space debris for decades.`,
    levers: ['Add even simple propulsion (cold gas)'],
  }),
  LIFE_SHORT: (p) => ({
    title: 'Mission ends too early',
    why: `Expected life is ${n(p, 'life', 1)} years but ${n(p, 'required', 1)} are required. The limit is ${LIFE_FACTOR[p.factor as string] ?? p.factor}.`,
    levers: ['Fix the limiting factor shown in the Lifetime panel'],
  }),
  RADIATION: (p) => ({
    title: 'Computer may not survive the radiation',
    why: `This orbit gives ~${n(p, 'dose', 1)} krad per year; the ${p.obc} tolerates it for ~${n(p, 'years', 1)} years.`,
    levers: ['Use a radiation-hardened computer'],
  }),
  OVER_BUDGET: (p) => ({
    title: 'Over budget',
    why: `The mission costs $${n(p, 'total', 1)} M but the budget is $${n(p, 'budget')} M. The agency will not approve it.`,
    levers: ['Cheaper launcher', 'Fewer or more mature (higher TRL) instruments', 'Fewer ground stations', 'Shorter design life (less operations cost)'],
  }),
  BUDGET_TIGHT: (p) => ({
    title: 'Budget almost exhausted',
    why: `$${n(p, 'total', 1)} M of $${n(p, 'budget')} M used. Any surprise will push you over.`,
  }),
  LATE: (p) => ({
    title: 'Development will run late',
    why: `Building this spacecraft takes ~${n(p, 'months')} months but launch is planned in ${n(p, 'deadline')}. Immature instruments (low TRL) and heavy designs take longer.`,
    levers: ['Use higher-TRL instruments', 'Fewer instruments', 'Lighter design'],
  }),
  MASS_OK: () => ({ title: 'Mass fits the launcher', why: 'Fully fuelled mass is within launcher capacity with a healthy margin.' }),
  POWER_OK: () => ({ title: 'Power balance positive', why: 'Arrays cover all loads, including battery recharge, through end of life.' }),
  DATA_OK: () => ({ title: 'Downlink keeps up', why: 'Everything your instruments produce can be downloaded each day.' }),
  COST_OK: () => ({ title: 'Within budget', why: 'Total cost, including 15 % contingency, fits the budget.' }),
  SCHEDULE_OK: () => ({ title: 'On schedule', why: 'Development fits before the planned launch date.' }),
  LIFE_OK: () => ({ title: 'Lifetime meets the requirement', why: 'Battery, panels, propellant, radiation tolerance and orbit all last long enough.' }),
  SCIENCE_OK: () => ({ title: 'Payload ready', why: 'Instruments have the pointing and lighting they need.' }),
}

export function message(item: ReviewItem): Message {
  const f = MESSAGES[item.code]
  return f ? f(item.params) : { title: item.code, why: '' }
}

export const REQUIREMENT_LABEL: Record<string, string> = {
  instrumentAny: 'Carry',
  orbitIn: 'Orbit',
  lifeYears: 'Lifetime ≥',
  dataDeliveredGbDay: 'Data delivered ≥',
  withinBudget: 'Within budget',
  onSchedule: 'Ready by deadline',
  scienceAtLeast: 'Science ≥',
}

export const GLOSSARY: Record<string, string> = {
  'Δv (delta-v)': 'How much the spacecraft can change its speed with its own engine. Every manoeuvre costs Δv, and Δv costs propellant (rocket equation).',
  'Duty cycle': 'Fraction of the day an instrument is switched on. More time on = more data and power use.',
  Eclipse: 'Time when the planet blocks the Sun. Solar panels give nothing; the battery must carry the load.',
  'Depth of discharge': 'How much of the battery you use per eclipse. Deep cycles wear batteries out faster.',
  TRL: 'Technology Readiness Level (6–9). 9 = flown many times; 6 = prototype. Lower TRL costs more, takes longer and fails more often.',
  'Link budget': 'How much data per second a radio link can carry; depends on band, antenna and distance.',
  'Payload capacity': 'Maximum mass a launcher can deliver to a given orbit.',
  'Isp (specific impulse)': 'Fuel efficiency of an engine, in seconds. Higher Isp = more Δv per kg of propellant.',
}
