// Seeded, weekly mission simulation. Deterministic: same design + same seed + same decisions = same result.
// Documented in docs/model.md §11–13.
import { BATTERY_CALENDAR_LIFE_YEARS, batteryCycleLife } from './budget'
import { getInstrument, getLauncher, getObc, getOrbit, getStation } from './catalog/components'
import { COLLISION_AVOIDANCE_DV, evaluateDesign } from './evaluate'
import { getScenario } from './catalog/scenarios'
import { getRoute } from './catalog/routes'
import { MINUTES_PER_YEAR, maintenanceDvPerYear, noPropulsionOrbitLifeYears, stationContactMinutes } from './orbit'
import { mixSeed, rngNext } from './rng'
import type { Design, DesignReport, Difficulty, Role, Scenario } from './types'

export type Quality = 'good' | 'ok' | 'poor'
export type Personality = 'prudent' | 'balanced' | 'bold'
export type EndReason =
  | 'completed'
  | 'launch_failure'
  | 'battery'
  | 'power'
  | 'radiation'
  | 'orbit'
  | 'funding'
  | 'collision'
  | 'eclipse'

export interface DecisionOption {
  id: string
  label: string
  hint: string
  quality: Quality
  /** The safest option (what a prudent bot picks). */
  safe?: boolean
  /** The option a bold bot picks (more science / less cost, more risk). */
  bold?: boolean
}

export interface PendingDecision {
  eventId: string
  week: number
  role: Role
  title: string
  text: string
  options: DecisionOption[]
  /** Event-specific data needed to apply the decision. */
  meta?: Record<string, number | string>
}

export interface LogEntry {
  week: number
  role: Role
  severity: 'info' | 'good' | 'warn' | 'bad'
  text: string
}

export interface SeriesPoint {
  week: number
  science: number
  battery: number
  power: number
  backlogGb: number
  reserveM: number
  doseKrad: number
}

export interface MissionState {
  seed: number
  rng: number
  design: Design
  scenarioId: string
  difficulty: Difficulty
  report: DesignReport
  phase: 'transfer' | 'operations' | 'ended'
  week: number
  transferWeeks: number
  plannedOpsWeeks: number
  launchDelayMonths: number
  endReason: EndReason | null
  /** Reusable launchers: did the first stage land? (null = expendable) */
  boosterLanded: boolean | null
  /** Three-body routes: correction Δv actually needed (drawn at launch; chaos makes it uncertain) and the reserve carried. */
  tcmNeed: number | null
  tcmReserve: number
  /** Multiplier on science (e.g. after accepting a looser, less stable orbit). */
  scienceFactor: number
  // spacecraft health
  batteryWear: number
  batteryWearFactor: number
  panelFactor: number
  doseKrad: number
  dvRemaining: number
  dutyFactor: number
  safeModeUntil: number
  stationsDown: { id: string; untilWeek: number }[]
  removedStations: string[]
  // money
  reserveM: number
  extraCostM: number
  // accumulators
  science: number
  bonusScience: number
  dataDeliveredGb: number
  dataLostGb: number
  backlogGb: number
  opsWeeks: number
  safeWeeks: number
  decisions: { eventId: string; optionId: string; quality: Quality; role: Role; byBot: boolean }[]
  missedOpportunities: number
  pending: PendingDecision | null
  log: LogEntry[]
  series: SeriesPoint[]
}

const WEEKS_PER_YEAR = 52
const DIFFICULTY_EVENT_FACTOR: Record<Difficulty, number> = { beginner: 0.5, engineer: 1, expert: 1.3, sandbox: 1 }
const DIFFICULTY_LAUNCH_FACTOR: Record<Difficulty, number> = { beginner: 0.5, engineer: 1, expert: 1.2, sandbox: 1 }

/** Event base rates per year (scaled by difficulty for negative events). */
export const EVENT_RATES = {
  solar_flare: 1.0,
  battery_anomaly: 0.15,
  station_outage: 0.5,
  micrometeoroid: 0.12,
  debris_conjunction: 1.0,
  budget_cut: 0.2,
  science_opportunity: 0.8,
  lunar_eclipse: 2.0,
  chaotic_drift: 1.5,
}
type EventId = keyof typeof EVENT_RATES

function rand(s: MissionState): number {
  const [v, next] = rngNext(s.rng)
  s.rng = next
  return v
}

function log(s: MissionState, role: Role, severity: LogEntry['severity'], text: string) {
  s.log.push({ week: s.week, role, severity, text })
}

/** Create a mission: rolls the launch and pre-launch delay. Pure (returns a fresh state). */
export function createMission(design: Design, scenario: Scenario, seed: number, opts: { difficulty?: Difficulty } = {}): MissionState {
  const report = evaluateDesign(design, scenario)
  const orbit = getOrbit(design.orbitId)
  const launcher = getLauncher(design.launcherId)
  const designLife = Math.min(15, Math.max(0.5, design.designLifeYears))
  const s: MissionState = {
    seed: seed >>> 0,
    rng: mixSeed(seed),
    design: structuredClone(design),
    scenarioId: scenario.id,
    difficulty: opts.difficulty ?? scenario.difficulty,
    report,
    phase: 'transfer',
    week: 0,
    transferWeeks: Math.round((report.schedule.transferMonths * WEEKS_PER_YEAR) / 12),
    plannedOpsWeeks: Math.round(designLife * WEEKS_PER_YEAR),
    launchDelayMonths: 0,
    endReason: null,
    boosterLanded: null,
    tcmNeed: null,
    tcmReserve: report.schedule.tcmReserveDv,
    scienceFactor: 1,
    batteryWear: 0,
    batteryWearFactor: 1,
    panelFactor: 1,
    doseKrad: 0,
    dvRemaining: report.mass.ispS > 0 ? maintenanceDvPerYear(orbit, design.altitudeKm) * designLife + (orbit.drag ? COLLISION_AVOIDANCE_DV : 0) : 0,
    dutyFactor: 1,
    safeModeUntil: -1,
    stationsDown: [],
    removedStations: [],
    reserveM: Math.max(0, scenario.budgetM - report.cost.totalM) + report.cost.contingencyM,
    extraCostM: 0,
    science: 0,
    bonusScience: 0,
    dataDeliveredGb: 0,
    dataLostGb: 0,
    backlogGb: 0,
    opsWeeks: 0,
    safeWeeks: 0,
    decisions: [],
    missedOpportunities: 0,
    pending: null,
    log: [],
    series: [],
  }
  // Pre-launch delay (schedule pressure).
  if (rand(s) < 0.25) {
    s.launchDelayMonths = 1 + Math.floor(rand(s) * 3)
    log(s, 'lead', 'warn', `Launch slipped ${s.launchDelayMonths} month(s): the launcher had a ground-test anomaly.`)
  }
  // Launch roll.
  const pFail = (1 - launcher.reliability) * DIFFICULTY_LAUNCH_FACTOR[s.difficulty]
  if (rand(s) < pFail) {
    s.phase = 'ended'
    s.endReason = 'launch_failure'
    log(s, 'lead', 'bad', `Launch failure. The ${launcher.name} did not reach orbit (≈${Math.round(pFail * 100)}% chance with this rocket).`)
    return s
  }
  log(s, 'engineer', 'good', `Launch successful on the ${launcher.name}. Spacecraft separated and healthy.`)
  if (launcher.landing) {
    s.boosterLanded = rand(s) < launcher.landing.successP
    log(
      s,
      'engineer',
      s.boosterLanded ? 'good' : 'warn',
      s.boosterLanded
        ? 'The first-stage booster landed and can fly again.'
        : 'The booster missed its landing and was lost at sea (the mission is fine; the next flight costs more).',
    )
  }
  const route = getRoute(orbit.id, design.routeId)
  if (route && report.mass.ispS > 0) {
    // Chaos: the correction actually needed is only known in flight (0.5×–2× the expected value).
    s.tcmNeed = Math.round(route.tcmDv * (0.5 + 1.5 * rand(s)) * 10) / 10
    log(s, 'astrophysicist', 'info', `Route: ${route.name}. Correction reserve on board: ${Math.round(s.tcmReserve)} m/s.`)
  }
  if (s.transferWeeks > 0) log(s, 'astrophysicist', 'info', `Cruising to ${orbit.name}: ~${Math.round(s.transferWeeks / 4.345)} month(s) of transfer.`)
  else arrive(s)
  return s
}

/** Arrival: report how much trajectory correction chaos really demanded. */
function arrive(s: MissionState) {
  const orbit = getOrbit(s.design.orbitId)
  s.phase = 'operations'
  log(s, 'astrophysicist', 'good', `Arrived in ${orbit.name}. Science operations begin.`)
  if (s.tcmNeed === null) return
  if (s.tcmNeed <= s.tcmReserve) {
    const left = Math.round((s.tcmReserve - s.tcmNeed) * 10) / 10
    s.dvRemaining += left // what is left of the correction reserve is kept for station-keeping
    log(s, 'astrophysicist', 'good', `Course corrections used ${s.tcmNeed} of the ${Math.round(s.tcmReserve)} m/s reserve; ${left} m/s kept for station-keeping.`)
    return
  }
  const deficit = Math.round((s.tcmNeed - s.tcmReserve) * 10) / 10
  const enough = s.dvRemaining - deficit > 0.25 * (s.dvRemaining + 1)
  s.pending = {
    eventId: 'chaos_correction',
    week: s.week,
    role: 'astrophysicist',
    title: 'The trajectory drifted more than planned',
    text: `Tiny errors grew on the way (that is chaos): arriving needs ${s.tcmNeed} m/s of corrections, but the reserve was ${Math.round(s.tcmReserve)} m/s. Missing: ${deficit} m/s.`,
    options: [
      { id: 'borrow', label: `Use ${deficit} m/s of station-keeping propellant`, hint: enough ? 'The mission may end a little earlier.' : 'Most of the station-keeping budget: the mission will be short.', quality: enough ? 'good' : 'poor', safe: true },
      { id: 'loose', label: 'Accept a wider, less stable orbit', hint: 'Keeps propellant; science drops by 25%.', quality: 'ok', bold: true },
    ],
    meta: { deficit },
  }
}

function activeStations(s: MissionState): string[] {
  return s.design.stationIds.filter((id) => !s.removedStations.includes(id) && !s.stationsDown.some((d) => d.id === id && d.untilWeek > s.week))
}

/** Fraction of the designed downlink currently available. */
function downlinkFactor(s: MissionState): number {
  const orbit = getOrbit(s.design.orbitId)
  const all = s.design.stationIds.filter((id) => !s.removedStations.includes(id)).map(getStation)
  const up = activeStations(s).map(getStation)
  if (orbit.contact === 'continuous') return up.length > 0 ? (all.length > 0 ? 1 : 0) : 0
  const designed = s.design.stationIds.map(getStation).reduce((t, st) => t + stationContactMinutes(orbit, s.design.altitudeKm, st), 0)
  if (designed <= 0) return 0
  const now = up.reduce((t, st) => t + stationContactMinutes(orbit, s.design.altitudeKm, st), 0)
  return Math.min(1, now / designed)
}

function end(s: MissionState, reason: EndReason, role: Role, text: string) {
  s.phase = 'ended'
  s.endReason = reason
  s.pending = null
  log(s, role, reason === 'completed' ? 'good' : 'bad', text)
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

function eventAllowed(s: MissionState, id: EventId): boolean {
  const orbit = getOrbit(s.design.orbitId)
  switch (id) {
    case 'debris_conjunction':
      return orbit.drag
    case 'lunar_eclipse':
      return orbit.longEclipseH !== undefined
    case 'chaotic_drift':
      return orbit.id === 'em_l2_halo' && s.phase === 'operations' && s.dvRemaining > 0
    case 'station_outage':
      return activeStations(s).length > 0
    default:
      return true
  }
}

function maybeEvent(s: MissionState) {
  const f = DIFFICULTY_EVENT_FACTOR[s.difficulty]
  const orbit = getOrbit(s.design.orbitId)
  const ids = (Object.keys(EVENT_RATES) as EventId[]).filter((id) => eventAllowed(s, id))
  const rates = ids.map((id) => {
    let r = EVENT_RATES[id] / WEEKS_PER_YEAR
    if (id !== 'science_opportunity' && id !== 'lunar_eclipse') r *= f
    if (id === 'solar_flare' && orbit.radiationKradYr >= 5) r *= 1.5
    return r
  })
  const u = rand(s)
  let acc = 0
  for (let i = 0; i < ids.length; i++) {
    acc += rates[i]
    if (u < acc) return triggerEvent(s, ids[i])
  }
}

function triggerEvent(s: MissionState, id: EventId) {
  const obc = getObc(s.design.obcId)
  const r = s.report
  switch (id) {
    case 'solar_flare': {
      const hard = obc.radToleranceKrad >= 100
      s.pending = {
        eventId: id,
        week: s.week,
        role: 'astrophysicist',
        title: 'Solar flare detected',
        text: `A strong flare is heading our way. Your ${obc.name} ${hard ? 'is radiation-hardened' : 'is NOT radiation-hardened'}. Keep observing, or hide in safe mode for two weeks?`,
        options: [
          { id: 'safe', label: 'Safe mode for 2 weeks', hint: 'No science for 2 weeks; much less radiation damage.', quality: hard ? 'ok' : 'good', safe: true },
          { id: 'continue', label: 'Keep observing', hint: hard ? 'Your hardened computer should cope.' : 'Risk a computer reset and extra radiation damage.', quality: hard ? 'good' : 'poor', bold: true },
        ],
      }
      return
    }
    case 'battery_anomaly': {
      const high = (r.power.dodNominal * 1.25) / r.power.dodLimit > 1
      s.batteryWearFactor *= 1.25
      s.pending = {
        eventId: id,
        week: s.week,
        role: 'engineer',
        title: 'Battery cell failure',
        text: `One battery cell failed: capacity is down ~20%. Each eclipse now drains ${Math.round(r.power.dodNominal * 125)}% of the battery.`,
        options: [
          { id: 'reduce', label: 'Lower instrument duty cycles by 20%', hint: 'Less science, but the battery ages normally.', quality: high ? 'good' : 'ok', safe: true },
          { id: 'accept', label: 'Keep operating as planned', hint: high ? 'Battery will wear out much faster.' : 'Battery margin is still fine.', quality: high ? 'poor' : 'good', bold: true },
        ],
      }
      return
    }
    case 'station_outage': {
      const up = activeStations(s)
      const st = up[Math.floor(rand(s) * up.length)]
      const weeks = 2 + Math.floor(rand(s) * 5)
      s.stationsDown.push({ id: st, untilWeek: s.week + weeks })
      const bottleneck = r.data.generatedGbDay > r.data.downlinkGbDay * 0.8 || up.length === 1
      s.pending = {
        eventId: id,
        week: s.week,
        role: 'lead',
        title: 'Ground station offline',
        text: `${getStation(st).name} is down for ${weeks} weeks (power failure). Rent time on a commercial backup antenna?`,
        options: [
          { id: 'rent', label: `Rent backup ($${(0.15 * weeks).toFixed(1)} M)`, hint: 'No data loss; costs reserve money.', quality: bottleneck ? 'good' : 'ok', safe: true },
          { id: 'accept', label: 'Wait it out', hint: bottleneck ? 'Data will pile up and may be lost.' : 'Other stations can cover most of it.', quality: bottleneck ? 'poor' : 'good', bold: true },
        ],
      }
      s.pending.meta = { station: st, weeks }
      return
    }
    case 'micrometeoroid': {
      s.panelFactor *= 0.92
      log(s, 'engineer', 'warn', 'Micrometeoroid hit a solar array: −8% power.')
      return
    }
    case 'debris_conjunction': {
      const canMove = s.dvRemaining >= 0.5 && r.mass.ispS > 0
      s.pending = {
        eventId: id,
        week: s.week,
        role: 'astrophysicist',
        title: 'Space debris conjunction',
        text: canMove
          ? 'A dead satellite fragment will pass within 200 m in 36 hours (≈2% collision risk). Burn propellant to dodge?'
          : 'A debris fragment will pass within 200 m (≈2% collision risk). You have no propellant to dodge.',
        options: canMove
          ? [
              { id: 'maneuver', label: 'Avoidance burn (0.5 m/s)', hint: 'Uses a little propellant, removes the risk.', quality: 'good', safe: true },
              { id: 'accept', label: 'Accept the risk', hint: '2% chance of losing the spacecraft.', quality: 'poor', bold: true },
            ]
          : [{ id: 'accept', label: 'Hope for the best', hint: '2% chance of losing the spacecraft.', quality: 'ok', safe: true, bold: true }],
      }
      return
    }
    case 'budget_cut': {
      const cut = Math.round(0.1 * (r.cost.opsM + s.reserveM) * 10) / 10
      const multi = activeStations(s).length >= 2
      const covers = s.reserveM >= cut
      s.pending = {
        eventId: id,
        week: s.week,
        role: 'lead',
        title: 'Investors cut the budget',
        text: `Your funders are cutting $${cut.toFixed(1)} M from operations. Reserve available: $${s.reserveM.toFixed(1)} M.`,
        options: [
          { id: 'absorb', label: 'Absorb it from the reserve', hint: covers ? 'Reserve covers it.' : 'Reserve is too small: operations will stop early.', quality: covers ? 'good' : 'poor', safe: covers },
          ...(multi
            ? [{ id: 'drop_station', label: 'Cancel the most expensive ground station', hint: 'Saves money; less downlink.', quality: (covers ? 'ok' : 'good') as Quality, safe: !covers, bold: true }]
            : []),
        ],
      }
      if (!multi) s.pending.options[0].bold = true
      s.pending.meta = { cut }
      return
    }
    case 'science_opportunity': {
      const scenarioOpp = scenarioOpportunity(s)
      if (scenarioOpp.instrumentIds.length === 0) return
      const has = s.design.instruments.some((i) => scenarioOpp.instrumentIds.includes(i.id))
      if (!has) {
        s.missedOpportunities++
        const names = scenarioOpp.instrumentIds.map((i) => getInstrument(i).name).join(', ')
        log(s, 'astrobiologist', 'warn', `${scenarioOpp.title} — missed: no suitable instrument on board (${names}).`)
        return
      }
      const owner = getInstrument(s.design.instruments.find((i) => scenarioOpp.instrumentIds.includes(i.id))!.id).discipline
      s.pending = {
        eventId: id,
        week: s.week,
        role: owner,
        title: scenarioOpp.title,
        text: scenarioOpp.text,
        options: [
          { id: 'retarget', label: 'Retarget the instruments', hint: `+${scenarioOpp.bonusScience} science; doubles data for one week.`, quality: 'good', bold: true, safe: true },
          { id: 'ignore', label: 'Stay on the plan', hint: 'No risk, no bonus.', quality: 'ok' },
        ],
      }
      return
    }
    case 'chaotic_drift': {
      s.pending = {
        eventId: id,
        week: s.week,
        role: 'astrophysicist',
        title: 'Orbit drifting away from L2',
        text: 'Tracking shows the spacecraft slowly sliding off its halo orbit. In a chaotic orbit small deviations grow exponentially — correcting now is cheap, later it is not.',
        options: [
          { id: 'correct_now', label: 'Correct now (1.5 m/s)', hint: 'A small burn while the error is small.', quality: 'good', safe: true },
          { id: 'wait', label: 'Wait and see', hint: 'Saves propellant if the drift reverses… but it usually grows.', quality: 'poor', bold: true },
        ],
      }
      return
    }
    case 'lunar_eclipse': {
      const dod = r.power.longEclipseDod ?? 0
      if (dod <= 0.8) {
        log(s, 'engineer', 'good', `Lunar eclipse: ${getOrbit(s.design.orbitId).longEclipseH} h in Earth's shadow — the battery coped (${Math.round(dod * 100)}% used).`)
        return
      }
      s.pending = {
        eventId: id,
        week: s.week,
        role: 'engineer',
        title: 'Lunar eclipse ahead',
        text: `The Moon will pass through Earth's shadow for hours. In safe mode the spacecraft still needs ${Math.round(dod * 100)}% of its battery.`,
        options: [
          { id: 'precharge', label: 'Pre-charge and power down for a week', hint: 'Lose a week of science; best survival odds.', quality: 'good', safe: true },
          { id: 'ride', label: 'Ride it out', hint: dod > 1 ? 'Battery will run flat: spacecraft likely lost.' : 'Deep discharge will age the battery.', quality: 'poor', bold: true },
        ],
      }
      return
    }
  }
}

function scenarioOpportunity(s: MissionState) {
  return getScenario(s.scenarioId).opportunity
}

/** Apply a decision to the pending event. */
export function decide(s: MissionState, optionId: string, byBot = false) {
  const p = s.pending
  if (!p) return
  const opt = p.options.find((o) => o.id === optionId) ?? p.options[0]
  s.decisions.push({ eventId: p.eventId, optionId: opt.id, quality: opt.quality, role: p.role, byBot })
  const meta = p.meta ?? {}
  const obc = getObc(s.design.obcId)
  s.pending = null
  const who = byBot ? 'Bot' : 'You'
  switch (p.eventId as EventId | 'chaos_correction') {
    case 'solar_flare':
      if (opt.id === 'safe') {
        s.safeModeUntil = s.week + 2
        s.doseKrad += 0.5
        log(s, p.role, 'info', `${who}: safe mode during the flare. Radiation +0.5 krad.`)
      } else {
        const hard = obc.radToleranceKrad >= 100
        s.doseKrad += hard ? 1 : 3
        if (!hard && rand(s) < 0.3) {
          s.safeModeUntil = s.week + 3
          const lost = s.backlogGb
          s.dataLostGb += lost
          s.backlogGb = 0
          log(s, p.role, 'bad', `${who} kept observing: the computer rebooted. 3 weeks to recover, ${lost.toFixed(0)} GB of stored data lost.`)
        } else log(s, p.role, 'good', `${who} kept observing through the flare. Radiation +${hard ? 1 : 3} krad.`)
      }
      return
    case 'battery_anomaly':
      if (opt.id === 'reduce') {
        s.dutyFactor *= 0.8
        s.batteryWearFactor /= 1.25
        log(s, p.role, 'info', `${who}: duty cycles −20% to protect the battery.`)
      } else log(s, p.role, 'warn', `${who}: operating as planned with a weaker battery.`)
      return
    case 'station_outage':
      if (opt.id === 'rent') {
        const weeks = Number(meta.weeks ?? 2)
        s.stationsDown = s.stationsDown.filter((d) => d.id !== meta.station)
        s.reserveM -= 0.15 * weeks
        s.extraCostM += 0.15 * weeks
        log(s, p.role, 'info', `${who} rented a backup antenna ($${(0.15 * weeks).toFixed(1)} M).`)
      } else log(s, p.role, 'warn', `${who}: waiting for the station to come back.`)
      return
    case 'debris_conjunction':
      if (opt.id === 'maneuver') {
        s.dvRemaining -= 0.5
        log(s, p.role, 'good', `${who}: avoidance burn done. Debris passed safely.`)
      } else if (rand(s) < 0.02) {
        end(s, 'collision', p.role, 'Collision with space debris. The spacecraft is lost.')
      } else log(s, p.role, 'warn', `${who} accepted the risk. The debris missed by 150 m.`)
      return
    case 'budget_cut': {
      const cut = Number(meta.cut ?? 0)
      if (opt.id === 'drop_station') {
        const stations = activeStations(s).map(getStation).sort((a, b) => b.costPerMonthM - a.costPerMonthM)
        const drop = stations[0]
        s.removedStations.push(drop.id)
        const remainingYears = Math.max(0, (s.plannedOpsWeeks - s.opsWeeks) / WEEKS_PER_YEAR)
        const saved = drop.costPerMonthM * 12 * remainingYears
        s.reserveM += saved - cut
        log(s, p.role, 'info', `${who} cancelled ${drop.name}, saving ~$${saved.toFixed(1)} M.`)
      } else {
        s.reserveM -= cut
        log(s, p.role, s.reserveM >= 0 ? 'info' : 'warn', `${who} absorbed the $${cut.toFixed(1)} M cut from the reserve.`)
      }
      return
    }
    case 'science_opportunity':
      if (opt.id === 'retarget') {
        const bonus = scenarioOpportunity(s).bonusScience
        s.bonusScience += bonus
        s.science += bonus
        s.backlogGb += s.report.data.generatedGbDay * 7
        log(s, p.role, 'good', `${who} retargeted: +${bonus} science points.`)
      } else log(s, p.role, 'info', `${who} stayed on the plan.`)
      return
    case 'chaos_correction': {
      const deficit = Number(meta.deficit ?? 0)
      if (opt.id === 'borrow') {
        s.dvRemaining -= deficit
        log(s, p.role, 'info', `${who} used ${deficit} m/s of station-keeping propellant to reach the planned orbit.`)
      } else {
        s.scienceFactor *= 0.75
        log(s, p.role, 'warn', `${who} accepted a wider orbit: −25% science, propellant kept.`)
      }
      return
    }
    case 'chaotic_drift':
      if (opt.id === 'correct_now') {
        s.dvRemaining -= 1.5
        log(s, p.role, 'good', `${who}: correction burn done while the error was small (1.5 m/s).`)
      } else if (rand(s) < 0.7) {
        s.dvRemaining -= 6
        log(s, p.role, 'bad', `${who} waited: the drift grew exponentially and the correction cost 6 m/s.`)
      } else log(s, p.role, 'info', `${who} waited and the drift happened to reverse. Lucky this time.`)
      return
    case 'lunar_eclipse': {
      const dod = s.report.power.longEclipseDod ?? 0
      if (opt.id === 'precharge') {
        s.safeModeUntil = s.week + 1
        if (dod > 1) s.batteryWear += 0.15
        log(s, p.role, 'good', `${who}: pre-charged and powered down. Survived the eclipse.`)
      } else if (dod > 1) {
        end(s, 'eclipse', p.role, 'The battery ran flat in Earth’s shadow. The spacecraft froze and was lost.')
      } else {
        s.batteryWear += 0.2
        log(s, p.role, 'warn', `${who} rode it out. Deep discharge aged the battery.`)
      }
      return
    }
  }
}

/** Bot choice for a pending decision, by personality. Deterministic. */
export function botChoice(p: PendingDecision, personality: Personality): string {
  if (personality === 'prudent') return (p.options.find((o) => o.safe) ?? p.options[0]).id
  if (personality === 'bold') return (p.options.find((o) => o.bold) ?? p.options[0]).id
  const order: Quality[] = ['good', 'ok', 'poor']
  return [...p.options].sort((a, b) => order.indexOf(a.quality) - order.indexOf(b.quality))[0].id
}

// ---------------------------------------------------------------------------
// Weekly step
// ---------------------------------------------------------------------------

/** Advance one week. Mutates `s` (for performance); does nothing while a decision is pending or after the end. */
export function advanceWeek(s: MissionState) {
  if (s.phase === 'ended' || s.pending) return
  const r = s.report
  const orbit = getOrbit(s.design.orbitId)
  const obc = getObc(s.design.obcId)
  s.week++

  // Environment: radiation, panels, money.
  s.doseKrad += orbit.radiationKradYr / WEEKS_PER_YEAR
  const years = s.week / WEEKS_PER_YEAR
  const powerNow = r.power.avgGenBolW * s.panelFactor * (1 - orbit.panelDegradation) ** years
  const powerNeed = r.power.avgLoadW * (1 - r.power.eclipseFraction + r.power.eclipseFraction / 0.9)
  const powerRatio = powerNeed > 0 ? powerNow / powerNeed : 1

  if (s.doseKrad >= obc.radToleranceKrad) return end(s, 'radiation', 'engineer', `Radiation dose reached ${s.doseKrad.toFixed(1)} krad: the ${obc.name} failed.`)
  if (powerRatio < 0.6) return end(s, 'power', 'engineer', 'Solar arrays can no longer power the spacecraft. Mission over.')
  if (s.reserveM < -0.01) return end(s, 'funding', 'lead', 'The money ran out: investors stopped funding operations.')

  if (s.phase === 'transfer') {
    if (s.week >= s.transferWeeks) arrive(s)
    record(s, powerRatio)
    return
  }

  // Operations
  if (s.opsWeeks >= s.plannedOpsWeeks) {
    return end(s, 'completed', 'lead', `Mission complete: ${(s.opsWeeks / WEEKS_PER_YEAR).toFixed(1)} years of operations.`)
  }
  s.opsWeeks++
  const inSafe = s.week <= s.safeModeUntil
  if (inSafe) s.safeWeeks++

  // Battery wear from eclipse cycles.
  if (r.power.eclipseFraction > 0) {
    const cyclesPerWeek = MINUTES_PER_YEAR / r.power.periodMin / WEEKS_PER_YEAR
    const dod = Math.max(0.05, r.power.dodNominal * s.batteryWearFactor * (inSafe ? 0.6 : 1))
    s.batteryWear += (cyclesPerWeek / batteryCycleLife(dod)) * (dod > 1 ? 50 : 1)
  }
  s.batteryWear += 1 / (BATTERY_CALENDAR_LIFE_YEARS * WEEKS_PER_YEAR)
  if (s.batteryWear >= 1) return end(s, 'battery', 'engineer', 'The battery is worn out and can no longer survive eclipses.')

  // Orbit keeping.
  if (r.mass.ispS > 0) {
    s.dvRemaining -= maintenanceDvPerYear(orbit, s.design.altitudeKm) / WEEKS_PER_YEAR
    if (s.dvRemaining < -1) return end(s, 'orbit', 'astrophysicist', 'Out of propellant: the orbit can no longer be maintained.')
  } else if (years > noPropulsionOrbitLifeYears(orbit, s.design.altitudeKm)) {
    return end(s, 'orbit', 'astrophysicist', 'Without thrusters the orbit decayed. Mission over.')
  }

  // Data & science.
  const genWeek = inSafe ? 0 : r.data.generatedGbDay * 7 * s.dutyFactor
  const downWeek = r.data.downlinkGbDay * 7 * downlinkFactor(s)
  const available = genWeek + s.backlogGb
  const delivered = Math.min(downWeek, available)
  let backlog = available - delivered
  if (backlog > r.data.storageGb) {
    s.dataLostGb += backlog - r.data.storageGb
    backlog = r.data.storageGb
  }
  s.backlogGb = backlog
  s.dataDeliveredGb += delivered
  const designFactor = r.data.generatedGbDay > 0 ? r.data.deliveredGbDay / r.data.generatedGbDay : 1
  const rawPerYear = designFactor > 0 ? r.science.perYear / designFactor : 0
  const deliveredFraction = genWeek > 0 ? Math.min(1, delivered / genWeek) : 0
  const dutyScience = Math.sqrt(s.dutyFactor)
  s.science += (rawPerYear / WEEKS_PER_YEAR) * deliveredFraction * dutyScience * Math.min(1, powerRatio) * s.scienceFactor

  // Events, then end-of-plan check.
  maybeEvent(s)
  record(s, powerRatio)
  if (s.opsWeeks >= s.plannedOpsWeeks && !s.pending) {
    end(s, 'completed', 'lead', `Mission complete: ${(s.opsWeeks / WEEKS_PER_YEAR).toFixed(1)} years of operations.`)
  }
}

function record(s: MissionState, powerRatio: number) {
  s.series.push({
    week: s.week,
    science: Math.round(s.science * 10) / 10,
    battery: Math.round(Math.max(0, 1 - 0.3 * s.batteryWear) * 1000) / 10,
    power: Math.round(Math.min(2, powerRatio) * 1000) / 10,
    backlogGb: Math.round(s.backlogGb * 10) / 10,
    reserveM: Math.round(s.reserveM * 10) / 10,
    doseKrad: Math.round(s.doseKrad * 10) / 10,
  })
}

/** Run until the end, letting a bot answer every decision. */
export function runToEnd(s: MissionState, personality: Personality = 'balanced', maxWeeks = 20 * WEEKS_PER_YEAR) {
  let guard = 0
  while (s.phase !== 'ended' && guard++ < maxWeeks + 10) {
    if (s.pending) decide(s, botChoice(s.pending, personality), true)
    else advanceWeek(s)
  }
  return s
}

/** Convenience: full deterministic simulation with a bot making every decision. */
export function simulateMission(design: Design, scenario: Scenario, seed: number, personality: Personality = 'balanced'): MissionState {
  return runToEnd(createMission(design, scenario, seed), personality)
}

export const SIM_WEEKS_PER_YEAR = WEEKS_PER_YEAR
