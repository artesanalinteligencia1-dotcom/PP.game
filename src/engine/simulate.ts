// Seeded, weekly mission simulation. Deterministic: same design + same seed + same decisions = same result.
// Documented in docs/model.md §11–13.
import { M, ref, type Msg } from './text'
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
  label: Msg
  hint: Msg
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
  title: Msg
  text: Msg
  options: DecisionOption[]
  /** Event-specific data needed to apply the decision. */
  meta?: Record<string, number | string>
}

export interface LogEntry {
  week: number
  role: Role
  severity: 'info' | 'good' | 'warn' | 'bad'
  msg: Msg
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

function log(s: MissionState, role: Role, severity: LogEntry['severity'], msg: Msg) {
  s.log.push({ week: s.week, role, severity, msg })
}

/** A catalog item's name as a translatable param. */
const name = (c: { id: string; name: string }) => ref(`component.${c.id}.name`, c.name)

const oppRef = (s: MissionState, field: 'title' | 'text') => ref(`scenario.${s.scenarioId}.opportunity.${field}`, scenarioOpportunity(s)[field])

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
    log(s, 'lead', 'warn', M(s.launchDelayMonths === 1 ? 'sim.slip.one' : 'sim.slip.other', { months: s.launchDelayMonths }))
  }
  // Launch roll.
  const pFail = (1 - launcher.reliability) * DIFFICULTY_LAUNCH_FACTOR[s.difficulty]
  if (rand(s) < pFail) {
    s.phase = 'ended'
    s.endReason = 'launch_failure'
    log(s, 'lead', 'bad', M('sim.launch.fail', { launcher: name(launcher), pct: Math.round(pFail * 100) }))
    return s
  }
  log(s, 'engineer', 'good', M('sim.launch.ok', { launcher: name(launcher) }))
  if (launcher.landing) {
    s.boosterLanded = rand(s) < launcher.landing.successP
    log(
      s,
      'engineer',
      s.boosterLanded ? 'good' : 'warn',
      s.boosterLanded
        ? M('sim.booster.landed')
        : M('sim.booster.lost'),
    )
  }
  const route = getRoute(orbit.id, design.routeId)
  if (route && report.mass.ispS > 0) {
    // Chaos: the correction actually needed is only known in flight (0.5×–2× the expected value).
    s.tcmNeed = Math.round(route.tcmDv * (0.5 + 1.5 * rand(s)) * 10) / 10
    log(s, 'astrophysicist', 'info', M('sim.route', { route: ref(`route.${orbit.id}.${route.id}.name`, route.name), reserve: Math.round(s.tcmReserve) }))
  }
  if (s.transferWeeks > 0) log(s, 'astrophysicist', 'info', M(Math.round(s.transferWeeks / 4.345) === 1 ? 'sim.cruise.one' : 'sim.cruise.other', { orbit: name(orbit), months: Math.round(s.transferWeeks / 4.345) }))
  else arrive(s)
  return s
}

/** Arrival: report how much trajectory correction chaos really demanded. */
function arrive(s: MissionState) {
  const orbit = getOrbit(s.design.orbitId)
  s.phase = 'operations'
  log(s, 'astrophysicist', 'good', M('sim.arrived', { orbit: name(orbit) }))
  if (s.tcmNeed === null) return
  if (s.tcmNeed <= s.tcmReserve) {
    const left = Math.round((s.tcmReserve - s.tcmNeed) * 10) / 10
    s.dvRemaining += left // what is left of the correction reserve is kept for station-keeping
    log(s, 'astrophysicist', 'good', M('sim.tcm.ok', { need: s.tcmNeed, reserve: Math.round(s.tcmReserve), left }))
    return
  }
  const deficit = Math.round((s.tcmNeed - s.tcmReserve) * 10) / 10
  const enough = s.dvRemaining - deficit > 0.25 * (s.dvRemaining + 1)
  s.pending = {
    eventId: 'chaos_correction',
    week: s.week,
    role: 'astrophysicist',
    title: M('sim.chaos.title'),
    text: M('sim.chaos.text', { need: s.tcmNeed, reserve: Math.round(s.tcmReserve), deficit }),
    options: [
      { id: 'borrow', label: M('sim.chaos.borrow', { deficit }), hint: enough ? M('sim.chaos.borrow.hintOk') : M('sim.chaos.borrow.hintLow'), quality: enough ? 'good' : 'poor', safe: true },
      { id: 'loose', label: M('sim.chaos.loose'), hint: M('sim.chaos.loose.hint'), quality: 'ok', bold: true },
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

function end(s: MissionState, reason: EndReason, role: Role, msg: Msg) {
  s.phase = 'ended'
  s.endReason = reason
  s.pending = null
  log(s, role, reason === 'completed' ? 'good' : 'bad', msg)
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
        title: M('sim.flare.title'),
        text: M(hard ? 'sim.flare.text.hard' : 'sim.flare.text.soft', { obc: name(obc) }),
        options: [
          { id: 'safe', label: M('sim.flare.safe'), hint: M('sim.flare.safe.hint'), quality: hard ? 'ok' : 'good', safe: true },
          { id: 'continue', label: M('sim.flare.continue'), hint: hard ? M('sim.flare.continue.hintHard') : M('sim.flare.continue.hintSoft'), quality: hard ? 'good' : 'poor', bold: true },
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
        title: M('sim.battery.title'),
        text: M('sim.battery.text', { pct: Math.round(r.power.dodNominal * 125) }),
        options: [
          { id: 'reduce', label: M('sim.battery.reduce'), hint: M('sim.battery.reduce.hint'), quality: high ? 'good' : 'ok', safe: true },
          { id: 'accept', label: M('sim.battery.accept'), hint: high ? M('sim.battery.accept.hintHigh') : M('sim.battery.accept.hintOk'), quality: high ? 'poor' : 'good', bold: true },
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
        title: M('sim.station.title'),
        text: M('sim.station.text', { station: name(getStation(st)), weeks }),
        options: [
          { id: 'rent', label: M('sim.station.rent', { cost: (0.15 * weeks).toFixed(1) }), hint: M('sim.station.rent.hint'), quality: bottleneck ? 'good' : 'ok', safe: true },
          { id: 'accept', label: M('sim.station.wait'), hint: bottleneck ? M('sim.station.wait.hintBad') : M('sim.station.wait.hintOk'), quality: bottleneck ? 'poor' : 'good', bold: true },
        ],
      }
      s.pending.meta = { station: st, weeks }
      return
    }
    case 'micrometeoroid': {
      s.panelFactor *= 0.92
      log(s, 'engineer', 'warn', M('sim.micrometeoroid'))
      return
    }
    case 'debris_conjunction': {
      const canMove = s.dvRemaining >= 0.5 && r.mass.ispS > 0
      s.pending = {
        eventId: id,
        week: s.week,
        role: 'astrophysicist',
        title: M('sim.debris.title'),
        text: canMove
          ? M('sim.debris.text.can')
          : M('sim.debris.text.cannot'),
        options: canMove
          ? [
              { id: 'maneuver', label: M('sim.debris.burn'), hint: M('sim.debris.burn.hint'), quality: 'good', safe: true },
              { id: 'accept', label: M('sim.debris.accept'), hint: M('sim.debris.risk.hint'), quality: 'poor', bold: true },
            ]
          : [{ id: 'accept', label: M('sim.debris.hope'), hint: M('sim.debris.risk.hint'), quality: 'ok', safe: true, bold: true }],
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
        title: M('sim.budget.title'),
        text: M('sim.budget.text', { cut: cut.toFixed(1), reserve: s.reserveM.toFixed(1) }),
        options: [
          { id: 'absorb', label: M('sim.budget.absorb'), hint: covers ? M('sim.budget.absorb.hintOk') : M('sim.budget.absorb.hintLow'), quality: covers ? 'good' : 'poor', safe: covers },
          ...(multi
            ? [{ id: 'drop_station', label: M('sim.budget.drop'), hint: M('sim.budget.drop.hint'), quality: (covers ? 'ok' : 'good') as Quality, safe: !covers, bold: true }]
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
        const names = scenarioOpp.instrumentIds.map((i) => name(getInstrument(i)))
        log(s, 'astrobiologist', 'warn', M('sim.opp.missed', { title: oppRef(s, 'title'), names }))
        return
      }
      const owner = getInstrument(s.design.instruments.find((i) => scenarioOpp.instrumentIds.includes(i.id))!.id).discipline
      s.pending = {
        eventId: id,
        week: s.week,
        role: owner,
        title: M('sim.opp.title', { title: oppRef(s, 'title') }),
        text: M('sim.opp.text', { text: oppRef(s, 'text') }),
        options: [
          { id: 'retarget', label: M('sim.opp.retarget'), hint: M('sim.opp.retarget.hint', { science: scenarioOpp.bonusScience }), quality: 'good', bold: true, safe: true },
          { id: 'ignore', label: M('sim.opp.ignore'), hint: M('sim.opp.ignore.hint'), quality: 'ok' },
        ],
      }
      return
    }
    case 'chaotic_drift': {
      s.pending = {
        eventId: id,
        week: s.week,
        role: 'astrophysicist',
        title: M('sim.drift.title'),
        text: M('sim.drift.text'),
        options: [
          { id: 'correct_now', label: M('sim.drift.correct'), hint: M('sim.drift.correct.hint'), quality: 'good', safe: true },
          { id: 'wait', label: M('sim.drift.wait'), hint: M('sim.drift.wait.hint'), quality: 'poor', bold: true },
        ],
      }
      return
    }
    case 'lunar_eclipse': {
      const dod = r.power.longEclipseDod ?? 0
      if (dod <= 0.8) {
        log(s, 'engineer', 'good', M('sim.eclipse.coped', { hours: getOrbit(s.design.orbitId).longEclipseH ?? 0, pct: Math.round(dod * 100) }))
        return
      }
      s.pending = {
        eventId: id,
        week: s.week,
        role: 'engineer',
        title: M('sim.eclipse.title'),
        text: M('sim.eclipse.text', { pct: Math.round(dod * 100) }),
        options: [
          { id: 'precharge', label: M('sim.eclipse.precharge'), hint: M('sim.eclipse.precharge.hint'), quality: 'good', safe: true },
          { id: 'ride', label: M('sim.eclipse.ride'), hint: dod > 1 ? M('sim.eclipse.ride.hintFlat') : M('sim.eclipse.ride.hintDeep'), quality: 'poor', bold: true },
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
  const who = byBot ? ref('sim.who.bot', 'Bot') : ref('sim.who.you', 'You')
  switch (p.eventId as EventId | 'chaos_correction') {
    case 'solar_flare':
      if (opt.id === 'safe') {
        s.safeModeUntil = s.week + 2
        s.doseKrad += 0.5
        log(s, p.role, 'info', M('sim.do.flare.safe', { who }))
      } else {
        const hard = obc.radToleranceKrad >= 100
        s.doseKrad += hard ? 1 : 3
        if (!hard && rand(s) < 0.3) {
          s.safeModeUntil = s.week + 3
          const lost = s.backlogGb
          s.dataLostGb += lost
          s.backlogGb = 0
          log(s, p.role, 'bad', M('sim.do.flare.reboot', { who, lost: lost.toFixed(0) }))
        } else log(s, p.role, 'good', M('sim.do.flare.kept', { who, krad: hard ? 1 : 3 }))
      }
      return
    case 'battery_anomaly':
      if (opt.id === 'reduce') {
        s.dutyFactor *= 0.8
        s.batteryWearFactor /= 1.25
        log(s, p.role, 'info', M('sim.do.battery.reduce', { who }))
      } else log(s, p.role, 'warn', M('sim.do.battery.accept', { who }))
      return
    case 'station_outage':
      if (opt.id === 'rent') {
        const weeks = Number(meta.weeks ?? 2)
        s.stationsDown = s.stationsDown.filter((d) => d.id !== meta.station)
        s.reserveM -= 0.15 * weeks
        s.extraCostM += 0.15 * weeks
        log(s, p.role, 'info', M('sim.do.station.rent', { who, cost: (0.15 * weeks).toFixed(1) }))
      } else log(s, p.role, 'warn', M('sim.do.station.wait', { who }))
      return
    case 'debris_conjunction':
      if (opt.id === 'maneuver') {
        s.dvRemaining -= 0.5
        log(s, p.role, 'good', M('sim.do.debris.burn', { who }))
      } else if (rand(s) < 0.02) {
        end(s, 'collision', p.role, M('sim.end.collision'))
      } else log(s, p.role, 'warn', M('sim.do.debris.accept', { who }))
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
        log(s, p.role, 'info', M('sim.do.budget.drop', { who, station: name(drop), saved: saved.toFixed(1) }))
      } else {
        s.reserveM -= cut
        log(s, p.role, s.reserveM >= 0 ? 'info' : 'warn', M('sim.do.budget.absorb', { who, cut: cut.toFixed(1) }))
      }
      return
    }
    case 'science_opportunity':
      if (opt.id === 'retarget') {
        const bonus = scenarioOpportunity(s).bonusScience
        s.bonusScience += bonus
        s.science += bonus
        s.backlogGb += s.report.data.generatedGbDay * 7
        log(s, p.role, 'good', M('sim.do.opp.retarget', { who, bonus }))
      } else log(s, p.role, 'info', M('sim.do.opp.ignore', { who }))
      return
    case 'chaos_correction': {
      const deficit = Number(meta.deficit ?? 0)
      if (opt.id === 'borrow') {
        s.dvRemaining -= deficit
        log(s, p.role, 'info', M('sim.do.chaos.borrow', { who, deficit }))
      } else {
        s.scienceFactor *= 0.75
        log(s, p.role, 'warn', M('sim.do.chaos.loose', { who }))
      }
      return
    }
    case 'chaotic_drift':
      if (opt.id === 'correct_now') {
        s.dvRemaining -= 1.5
        log(s, p.role, 'good', M('sim.do.drift.correct', { who }))
      } else if (rand(s) < 0.7) {
        s.dvRemaining -= 6
        log(s, p.role, 'bad', M('sim.do.drift.grew', { who }))
      } else log(s, p.role, 'info', M('sim.do.drift.lucky', { who }))
      return
    case 'lunar_eclipse': {
      const dod = s.report.power.longEclipseDod ?? 0
      if (opt.id === 'precharge') {
        s.safeModeUntil = s.week + 1
        if (dod > 1) s.batteryWear += 0.15
        log(s, p.role, 'good', M('sim.do.eclipse.precharge', { who }))
      } else if (dod > 1) {
        end(s, 'eclipse', p.role, M('sim.end.eclipse'))
      } else {
        s.batteryWear += 0.2
        log(s, p.role, 'warn', M('sim.do.eclipse.ride', { who }))
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

  if (s.doseKrad >= obc.radToleranceKrad) return end(s, 'radiation', 'engineer', M('sim.end.radiation', { dose: s.doseKrad.toFixed(1), obc: name(obc) }))
  if (powerRatio < 0.6) return end(s, 'power', 'engineer', M('sim.end.power'))
  if (s.reserveM < -0.01) return end(s, 'funding', 'lead', M('sim.end.funding'))

  if (s.phase === 'transfer') {
    if (s.week >= s.transferWeeks) arrive(s)
    record(s, powerRatio)
    return
  }

  // Operations
  if (s.opsWeeks >= s.plannedOpsWeeks) {
    return end(s, 'completed', 'lead', M('sim.end.completed', { years: (s.opsWeeks / WEEKS_PER_YEAR).toFixed(1) }))
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
  if (s.batteryWear >= 1) return end(s, 'battery', 'engineer', M('sim.end.battery'))

  // Orbit keeping.
  if (r.mass.ispS > 0) {
    s.dvRemaining -= maintenanceDvPerYear(orbit, s.design.altitudeKm) / WEEKS_PER_YEAR
    if (s.dvRemaining < -1) return end(s, 'orbit', 'astrophysicist', M('sim.end.propellant'))
  } else if (years > noPropulsionOrbitLifeYears(orbit, s.design.altitudeKm)) {
    return end(s, 'orbit', 'astrophysicist', M('sim.end.decayed'))
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
    end(s, 'completed', 'lead', M('sim.end.completed', { years: (s.opsWeeks / WEEKS_PER_YEAR).toFixed(1) }))
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
