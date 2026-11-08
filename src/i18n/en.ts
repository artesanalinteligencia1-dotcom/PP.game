// English UI strings and Design Review explanations. Engine returns codes + params; text lives here.
import type { ResourceKey, ReviewItem, Role } from '../engine/types'
import { LOCALE, currentLang } from './index'

export const fmt = (n: number | string | undefined, digits = 0): string => {
  if (typeof n === 'string') return n
  if (n === undefined || Number.isNaN(n)) return '—'
  if (!Number.isFinite(n)) return '∞'
  return n.toLocaleString(LOCALE[currentLang()], { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

export const ROLE_LABEL: Record<Role, string> = {
  lead: 'Mission Director',
  engineer: 'Spacecraft Engineer',
  astrophysicist: 'Astrophysicist',
  astrobiologist: 'Astrobiologist',
}

export const ROLE_BLURB: Record<Role, string> = {
  lead: 'Principal Investigator: contract, investors, budget, launcher, ground stations, schedule, final sign-off.',
  engineer: 'Builds the spacecraft: power, propulsion, structure, thermal, computer, radio and antenna.',
  astrophysicist: 'Orbits and trajectories, space weather, telescopes, radar and particle instruments.',
  astrobiologist: 'Water, life and habitability; Earth-system and planetary science; spectrometers and imagers.',
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
  LAUNCHER_SUBORBITAL: (p) => ({
    title: `${p.launcher} cannot reach orbit`,
    why: `It is a sounding rocket: it climbs to ~${n(p, 'apogee')} km for a few minutes and falls back. Staying in orbit needs ~7.8 km/s of sideways speed; Paulet-1 reaches about 1.5 km/s straight up.`,
    levers: ['Choose an orbital launcher (unlocked after First Light in the campaign)'],
  }),
  RIDESHARE_ALTITUDE: (p) => ({
    title: 'The rideshare does not go that high',
    why: `Shared flights drop everyone at the same place (up to ~${n(p, 'max')} km). You asked for ${n(p, 'alt')} km.`,
    levers: [`Lower the altitude to ${n(p, 'max')} km or less`, 'Or buy a dedicated launcher'],
  }),
  RIDESHARE_SCHEDULE: (p) => ({
    title: 'Waiting for the next shared flight',
    why: `Rideshares fly every ${n(p, 'every')} months; your satellite waits ~${n(p, 'wait', 1)} months on the ground after it is ready.`,
    levers: ['Accept the wait (it is cheap)', 'Or pay for a dedicated launcher to fly as soon as you are ready'],
  }),
  TCM_RESERVE_LOW: (p) => ({
    title: 'Small correction reserve for a chaotic route',
    why: `On the ${p.route} small navigation errors grow quickly (chaos). Expected corrections are ~${n(p, 'need')} m/s but you carry ${n(p, 'reserve')} m/s.`,
    levers: ['Raise the correction reserve (Orbit & Launch)', 'Pick a faster, less sensitive route'],
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
  cargoAtLeast: 'Cargo ≥ (kg)',
  altitudeAtMost: 'Altitude ≤ (km)',
  propulsionAny: 'Thrusters for rendezvous',
  costAtMost: 'Total cost ≤ ($ M)',
  dvAtMost: 'Total Δv ≤ (m/s)',
  arrivalByMonth: 'Operating by month',
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
    title: 'The rocket failed',
    why: `Your launcher succeeds about ${p.reliability}% of the time. This time it did not. Bad luck — but a real risk you chose.`,
    change: 'Fly again with a new seed, or pay for a more reliable launcher.',
  }),
  CAUSE_END_BATTERY: (p) => ({
    title: 'Battery wore out early',
    why: `The battery died after ${p.life} years (needed ${p.required}). Deep discharges in thousands of eclipses age it fast.`,
    change: 'Use a bigger battery so each eclipse drains less of it.',
  }),
  CAUSE_END_POWER: (p) => ({
    title: 'Not enough power at the end',
    why: `Solar arrays degraded until they could not run the spacecraft (after ${p.life} years).`,
    change: 'Add array area margin for end of life.',
  }),
  CAUSE_END_RADIATION: (p) => ({
    title: 'Radiation killed the computer',
    why: `The computer exceeded its radiation tolerance after ${p.life} years.`,
    change: 'Use a radiation-hardened computer or a gentler orbit.',
  }),
  CAUSE_END_ORBIT: (p) => ({
    title: 'Could not keep the orbit',
    why: `Without enough propellant or thrusters, the orbit decayed after ${p.life} years.`,
    change: 'Carry propulsion and size propellant for the whole mission.',
  }),
  CAUSE_END_FUNDING: (p) => ({
    title: 'The money ran out',
    why: `Investors stopped paying for operations after ${p.life} years. Society’s rules apply in space too.`,
    change: 'Keep a larger budget reserve or cheaper operations (fewer stations).',
  }),
  CAUSE_END_COLLISION: () => ({
    title: 'Lost to space debris',
    why: 'You accepted a collision risk and lost the bet.',
    change: 'Carry propellant for avoidance manoeuvres and use it.',
  }),
  CAUSE_END_ECLIPSE: () => ({
    title: 'Frozen in a lunar eclipse',
    why: 'The battery could not carry the spacecraft through hours of Earth’s shadow.',
    change: 'Size the battery for the long eclipse, or power down before it.',
  }),
  CAUSE_DATA_LOST: (p) => ({
    title: 'Data was lost',
    why: `${p.lostPct}% of everything your instruments produced never reached the ground.`,
    change: 'More ground stations, a faster radio, lower duty cycles or compression.',
  }),
  CAUSE_BOTTLENECK: (p) => ({
    title: 'Downlink bottleneck',
    why: `Instruments produced ${p.gen} GB/day but only ${p.down} GB/day could be downloaded.`,
    change: 'Add a high-latitude station or a higher band.',
  }),
  CAUSE_SAFE_MODE: (p) => ({
    title: 'Too much time in safe mode',
    why: `${p.weeks} weeks without science after flares, anomalies or eclipses.`,
    change: 'Radiation-hardened electronics and battery margin reduce downtime.',
  }),
  CAUSE_MISSED_OPPORTUNITY: (p) => ({
    title: 'Missed a science opportunity',
    why: `"${p.title}" happened ${p.count} time(s) and no instrument on board could observe it.`,
    change: 'Fly an instrument that fits the scenario’s surprises.',
  }),
  CAUSE_SEIZED_OPPORTUNITY: (p) => ({ title: 'Seized a science opportunity', why: `Retargeting earned +${p.points} science points.` }),
  CAUSE_POOR_DECISIONS: (p) => ({
    title: 'Risky calls in flight',
    why: `${p.count} decision(s) took more risk than the situation justified.`,
    change: 'Read what each role is worried about before choosing.',
  }),
  CAUSE_GOOD_DECISIONS: (p) => ({ title: 'Sound decisions under pressure', why: `${p.count} in-flight decisions matched the situation.` }),
  CAUSE_OVER_BUDGET: (p) => ({
    title: 'Over budget',
    why: `Final cost $${p.cost} M vs budget $${p.budget} M.`,
    change: 'Cheaper launcher, fewer stations or more mature instruments.',
  }),
  CAUSE_LATE: (p) => ({
    title: 'Launched late',
    why: `${p.months} months behind schedule${Number(p.delay) > 0 ? ` (including a ${p.delay}-month launcher delay)` : ''}.`,
    change: 'Higher-TRL instruments and a lighter spacecraft develop faster.',
  }),
  CAUSE_COMPLETED: (p) => ({ title: 'Mission completed', why: `The spacecraft operated for ${p.life} years as planned.` }),
  CAUSE_BOOSTER_LANDED: () => ({ title: 'The booster came home', why: 'Your reusable first stage landed and can fly again — cheaper launches and prestige.' }),
  CAUSE_BOOSTER_LOST: () => ({
    title: 'Booster lost at sea',
    why: 'The reusable first stage missed its landing. The mission was fine, but replacing the booster costs money.',
    change: 'Landings get more reliable with experience; it is still worth it on average.',
  }),
  CAUSE_STRONG_DOWNLINK: (p) => ({ title: 'Plenty of downlink', why: `${p.down} GB/day of capacity kept data flowing even during outages.` }),
  CAUSE_LOW_SCIENCE: (p) => ({
    title: 'Science fell short',
    why: `${p.science} science points against a target of ${p.target}.`,
    change: 'More relevant instruments (stars in Payload), higher duty cycles if downlink allows.',
  }),
}

export const END_REASON_LABEL: Record<string, string> = {
  completed: 'Mission complete',
  launch_failure: 'Launch failure',
  battery: 'Battery worn out',
  power: 'Power failure',
  radiation: 'Radiation failure',
  orbit: 'Orbit lost',
  funding: 'Funding cut',
  collision: 'Debris collision',
  eclipse: 'Frozen in eclipse',
}

/** Default protagonist (fictional). The player will be able to rename them in Phase 3. */
export const PROTAGONIST = {
  name: 'Pedro Goicochea',
  title: 'Dr.',
  bio: 'Physicist from Arequipa, Peru. Inspired as a kid by the story of Pedro Paulet, now Mission Director (Principal Investigator) of a small space institute.',
}
