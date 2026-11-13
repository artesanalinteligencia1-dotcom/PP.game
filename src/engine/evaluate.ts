// evaluateDesign: instant, deterministic evaluation of a spacecraft design against a scenario.
// Pure: no React, no DOM, no randomness. Every formula is documented in docs/model.md.
import {
  BATTERY_CALENDAR_LIFE_YEARS,
  BUS_BASE_POWER_W,
  CONTINGENCY,
  LONG_ECLIPSE_MAX_DOD,
  MASS_MARGIN,
  STRUCTURE_FRACTION,
  batteryCycleLife,
  dataGbPerDay,
  degrade,
  downlinkGbPerDay,
  propellantForDv,
  requiredAveragePowerW,
  sunlitPowerW,
} from './budget'
import {
  ELECTRIC_THRUST_POWER_W,
  OPTICAL_INSTRUMENTS,
  getAdcs,
  getAntenna,
  getArray,
  getBand,
  getBattery,
  getCompression,
  getInstrument,
  getObc,
  getOrbit,
  getPropulsion,
  getStation,
  getThermal,
  launchers,
} from './catalog/components'
import { defaultTcmReserve, getRoute } from './catalog/routes'
import { TRL_COST_FACTOR, TRL_MONTHS, launchCapacityKg, resolveLauncher, successProbability } from './launch'
import {
  MINUTES_PER_DAY,
  MINUTES_PER_YEAR,
  clampAltitude,
  contactMinutesPerDay,
  eclipseFraction,
  maintenanceDvPerYear,
  noPropulsionOrbitLifeYears,
  orbitalPeriodMin,
} from './orbit'
import type {
  Design,
  DesignReport,
  LifeBreakdown,
  PointingLevel,
  RequirementResult,
  ResourceKey,
  ReviewItem,
  Role,
  Scenario,
  Severity,
  Trl,
} from './types'

const POINTING_RANK: Record<PointingLevel, number> = { coarse: 0, fine: 1, precise: 2 }

/** Monthly operations team cost by destination (M$/month). */
export const OPS_BASE_M_PER_MONTH = { earth: 0.25, moon: 0.4, sun: 0.5 } as const
/** Coast/transfer time for chemical propulsion (months), before science starts. */
const CHEMICAL_TRANSFER_MONTHS: Record<string, number> = { meo: 0.2, geo: 0.3, lunar_polar: 0.2, helio: 8 }
/** Δv reserved for debris-avoidance manoeuvres in Earth orbits with drag (m/s). */
export const COLLISION_AVOIDANCE_DV = 5
/** Integration, test and management: fixed + per kg of dry mass. */
export const INTEGRATION_FIXED_M = 6
export const INTEGRATION_M_PER_KG = 0.06
/** Development schedule model. */
export const DEV_BASE_MONTHS = 18
export const DEV_MONTHS_PER_EXTRA_INSTRUMENT = 1.5
export const DEV_MONTHS_PER_100KG = 1
export const DEV_MONTHS_ELECTRIC = 2

const ROLE_BY_RESOURCE: Record<ResourceKey, Role> = {
  mass: 'engineer',
  power: 'engineer',
  data: 'lead',
  cost: 'lead',
  schedule: 'lead',
  life: 'engineer',
  science: 'astrobiologist',
  risk: 'lead',
}

/** Who on the team raises each alert (overrides the per-resource default). */
const ROLE_BY_CODE: Record<string, Role> = {
  ANTENNA_INCOMPATIBLE: 'engineer',
  DISH_NEEDS_POINTING: 'engineer',
  MAGNETORQUERS_NO_FIELD: 'engineer',
  NO_PROPULSION_INSERTION: 'astrophysicist',
  DV_INFEASIBLE: 'astrophysicist',
  LOW_SUN_OPTICAL: 'astrophysicist',
  DEBRIS_NO_DISPOSAL: 'lead',
  LIFE_SHORT: 'lead',
  LAUNCHER_OVERSIZED: 'lead',
  LAUNCHER_NO_TARGET: 'lead',
  LAUNCHER_SUBORBITAL: 'lead',
  TCM_RESERVE_LOW: 'astrophysicist',
  RIDESHARE_ALTITUDE: 'astrophysicist',
  RIDESHARE_SCHEDULE: 'lead',
  NO_PAYLOAD: 'astrobiologist',
}

export interface EvaluateOptions {
  /** Launchers the player may buy (campaign); others are never suggested. */
  availableLaunchers?: string[]
}

const clamp = (x: number, lo: number, hi: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : lo)

export function evaluateDesign(design: Design, scenario: Scenario, opts: EvaluateOptions = {}): DesignReport {
  const review: ReviewItem[] = []
  const add = (
    code: string,
    severity: Severity,
    resource: ResourceKey,
    params: ReviewItem['params'] = {},
    blocking = severity === 'error',
    role: Role = ROLE_BY_CODE[code] ?? ROLE_BY_RESOURCE[resource],
  ) => review.push({ code, severity, resource, role, blocking, params })

  // ---------- Resolve and sanitise inputs ----------
  const orbit = getOrbit(design.orbitId)
  const alt = clampAltitude(orbit, design.altitudeKm)
  const launcher = resolveLauncher(design)
  const array = getArray(design.arrayId)
  const area = clamp(design.arrayAreaM2, 0, array.maxAreaM2)
  const battery = getBattery(design.batteryId)
  const obc = getObc(design.obcId)
  const adcs = getAdcs(design.adcsId)
  const prop = getPropulsion(design.propulsionId)
  const thermal = getThermal(design.thermalId)
  const comp = getCompression(design.compressionId)
  const band = getBand(design.bandId)
  const antenna = getAntenna(design.antennaId)
  const stations = [...new Set(design.stationIds)].map(getStation)
  const designLife = clamp(design.designLifeYears, 0.5, 15)
  const cargoKg = clamp(design.cargoKg ?? 0, 0, 20000)
  const seen = new Set<string>()
  const payload = design.instruments
    .filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)))
    .map((i) => ({ inst: getInstrument(i.id), duty: clamp(i.duty, 0, 1) }))

  // ---------- Orbit ----------
  const periodMin = orbitalPeriodMin(orbit, alt)
  const ecl = eclipseFraction(orbit, alt)
  const eclipseMin = periodMin * ecl
  const eclipseH = eclipseMin / 60
  const contactMin = contactMinutesPerDay(orbit, alt, stations)

  const lowThrust = prop.lowThrust
  // Three-body destinations: the chosen route sets arrival Δv, travel time and expected corrections.
  const route = getRoute(orbit.id, design.routeId)
  const baseInsertionDv = route ? route.insertionDv : orbit.insertionDv
  const tcmReserveDv = route ? clamp(design.tcmReserveDv ?? defaultTcmReserve(route), 0, 500) : 0
  const transferMonths =
    baseInsertionDv > 0 && lowThrust
      ? Math.max(route?.transferMonths ?? 0, (baseInsertionDv * lowThrust.dvPenalty) / lowThrust.dvPerMonth)
      : (route?.transferMonths ?? CHEMICAL_TRANSFER_MONTHS[orbit.id] ?? 0)
  const transferYears = transferMonths / 12

  // ---------- Pointing ----------
  let pointingRank = POINTING_RANK[adcs.pointing]
  if (adcs.id === 'magnetorquers' && orbit.body !== 'earth') {
    add('MAGNETORQUERS_NO_FIELD', 'error', 'science', { body: orbit.body })
    pointingRank = -1
  }
  const antennaPointingOk = pointingRank >= POINTING_RANK[antenna.pointing]

  // ---------- Data & comms ----------
  const antennaOk = band.antennas.includes(antenna.id)
  if (!antennaOk) add('ANTENNA_INCOMPATIBLE', 'error', 'data', { band: band.name, antenna: antenna.name })
  if (!antennaPointingOk) add('DISH_NEEDS_POINTING', 'warn', 'data', { adcs: adcs.name })
  const linkRateMbps = antennaOk ? band.rateMbps * antenna.gain * orbit.linkFactor * (antennaPointingOk ? 1 : 0.3) : 0
  const rawGbDay = payload.reduce((s, p) => s + dataGbPerDay(p.inst.dataRateMbps, p.duty), 0)
  const generatedGbDay = rawGbDay / comp.ratio
  const downlinkGbDay = downlinkGbPerDay(contactMin, linkRateMbps)
  const deliveredGbDay = Math.min(generatedGbDay, downlinkGbDay)
  const lostFraction = generatedGbDay > 0 ? 1 - deliveredGbDay / generatedGbDay : 0
  const daysToFull = generatedGbDay > downlinkGbDay ? obc.storageGb / (generatedGbDay - downlinkGbDay) : null

  if (stations.length === 0) add('NO_STATIONS', 'error', 'data')
  else if (orbit.contact === 'deep' && !stations.some((s) => s.deepSpace)) add('NO_DEEP_STATION', 'error', 'data', { orbit: orbit.name })
  if (generatedGbDay > downlinkGbDay && downlinkGbDay > 0) {
    add('DATA_BOTTLENECK', 'warn', 'data', {
      generated: generatedGbDay,
      downlink: downlinkGbDay,
      lostPct: lostFraction * 100,
      daysToFull: daysToFull ?? 0,
      storage: obc.storageGb,
    })
  }

  // ---------- Power ----------
  const instAvgW = payload.reduce((s, p) => s + p.inst.powerW * p.duty, 0)
  const instPeakW = payload.reduce((s, p) => s + p.inst.powerW, 0)
  const busW = BUS_BASE_POWER_W + obc.powerW + adcs.powerW + antenna.powerW + thermal.powerW + prop.powerW + comp.powerW
  const txAvgW = band.txPowerW * (contactMin / MINUTES_PER_DAY)
  const avgLoadW = busW + instAvgW + txAvgW
  const peakLoadW = busW + instPeakW + band.txPowerW
  const safeLoadW = BUS_BASE_POWER_W + obc.powerW + 0.4 * adcs.powerW + thermal.powerW + prop.powerW
  const sunlitGenBolW = sunlitPowerW(area, array.efficiency, array.cosFactor, orbit.sunDistanceAu)
  const avgGenBolW = sunlitGenBolW * (1 - ecl)
  const requiredW = requiredAveragePowerW(avgLoadW, ecl)
  const avgGenEolW = degrade(avgGenBolW, orbit.panelDegradation, designLife + transferYears)
  const marginBol = avgGenBolW / requiredW - 1
  const marginEol = avgGenEolW / requiredW - 1
  const cyclesPerYear = ecl > 0 ? MINUTES_PER_YEAR / periodMin : 0
  const dodLimit = cyclesPerYear > 1000 ? 0.3 : 0.6
  const dodNominal = (avgLoadW * eclipseH) / battery.capacityWh
  const dodWorst = (peakLoadW * eclipseH) / battery.capacityWh
  const longEclipseDod = orbit.longEclipseH ? (safeLoadW * orbit.longEclipseH) / battery.capacityWh : undefined

  if (marginBol < 0) add('POWER_NEGATIVE', 'error', 'power', { gen: avgGenBolW, need: requiredW })
  else if (marginEol < 0) add('POWER_EOL_NEGATIVE', 'warn', 'power', { gen: avgGenEolW, need: requiredW, years: designLife })
  else if (marginEol < 0.1) add('POWER_MARGIN_LOW', 'warn', 'power', { marginPct: marginEol * 100 })
  else if (marginEol > 1 && !lowThrust) add('POWER_OVERSIZED', 'warn', 'power', { marginPct: marginEol * 100 })
  if (dodNominal > 1) add('BATTERY_DEPLETED', 'error', 'power', { need: avgLoadW * eclipseH, have: battery.capacityWh, eclipseMin })
  else if (dodNominal > dodLimit) add('BATTERY_DOD_HIGH', 'warn', 'power', { dodPct: dodNominal * 100, limitPct: dodLimit * 100, cycles: cyclesPerYear })
  if (dodNominal <= 1 && dodWorst > 1) add('BATTERY_WORST_CASE', 'warn', 'power', { peak: peakLoadW, eclipseMin, have: battery.capacityWh })
  if (longEclipseDod !== undefined && longEclipseDod > LONG_ECLIPSE_MAX_DOD)
    add('LONG_ECLIPSE_RISK', 'warn', 'power', { hours: orbit.longEclipseH ?? 0, need: safeLoadW * (orbit.longEclipseH ?? 0), have: battery.capacityWh })
  if (lowThrust && sunlitGenBolW < safeLoadW + ELECTRIC_THRUST_POWER_W)
    add('ELECTRIC_UNDERPOWERED', 'error', 'power', { have: sunlitGenBolW, need: safeLoadW + ELECTRIC_THRUST_POWER_W })

  // ---------- Mass & propulsion ----------
  type MassItem = DesignReport['mass']['items'][number]
  const items: MassItem[] = (
    [
    ...payload.map((p): MassItem => ({ label: p.inst.name, kg: p.inst.massKg, group: 'payload' })),
    { label: 'Cargo', kg: cargoKg, group: 'payload' },
    { label: `Solar array (${area.toFixed(1)} m²)`, kg: area > 0 ? area * array.kgPerM2 + array.fixedMassKg : 0, group: 'bus' },
    { label: battery.name, kg: battery.massKg, group: 'bus' },
    { label: `${band.name} radio`, kg: band.massKg, group: 'bus' },
    { label: `${antenna.name} antenna`, kg: antenna.massKg, group: 'bus' },
    { label: obc.name, kg: obc.massKg, group: 'bus' },
    { label: adcs.name, kg: adcs.massKg, group: 'bus' },
    { label: `${prop.name} propulsion`, kg: prop.massKg, group: 'bus' },
    { label: thermal.name, kg: thermal.massKg, group: 'bus' },
    { label: comp.name, kg: comp.massKg, group: 'bus' },
    ] satisfies MassItem[]
  ).filter((i) => i.kg > 0)
  const instrumentsKg = payload.reduce((s, p) => s + p.inst.massKg, 0) + cargoKg
  const subsystemsKg = items.filter((i) => i.group === 'bus').reduce((s, i) => s + i.kg, 0)
  const structureKg = STRUCTURE_FRACTION * (instrumentsKg + subsystemsKg)
  const marginKg = MASS_MARGIN * (instrumentsKg + subsystemsKg + structureKg)
  const dryKg = instrumentsKg + subsystemsKg + structureKg + marginKg

  const maintDv = maintenanceDvPerYear(orbit, alt)
  const hasProp = prop.ispS > 0
  const insertionDv = baseInsertionDv * (lowThrust ? lowThrust.dvPenalty : 1)
  const totalDv = hasProp
    ? insertionDv + maintDv * designLife + orbit.disposalDv + (orbit.drag ? COLLISION_AVOIDANCE_DV : 0) + tcmReserveDv
    : 0
  const { propellantKg, tankKg } = propellantForDv(dryKg, totalDv, prop.ispS)
  const wetKg = dryKg + tankKg + propellantKg
  const capacityKg = launchCapacityKg(launcher, orbit)

  if (!hasProp && baseInsertionDv > 0) add('NO_PROPULSION_INSERTION', 'error', 'mass', { dv: baseInsertionDv, orbit: orbit.name })
  if (route && hasProp && tcmReserveDv < route.tcmDv)
    add('TCM_RESERVE_LOW', 'warn', 'mass', { reserve: tcmReserveDv, need: route.tcmDv, route: route.name })
  if (!Number.isFinite(propellantKg)) add('DV_INFEASIBLE', 'error', 'mass', { dv: totalDv, isp: prop.ispS })
  if (!hasProp && orbit.disposalDv > 0) add('DEBRIS_NO_DISPOSAL', 'warn', 'life', { dv: orbit.disposalDv })
  if (launcher.suborbital) add('LAUNCHER_SUBORBITAL', 'error', 'mass', { launcher: launcher.name, apogee: launcher.suborbital.apogeeKm })
  else if (capacityKg <= 0) add('LAUNCHER_NO_TARGET', 'error', 'mass', { launcher: launcher.name, orbit: orbit.name })
  else if (Number.isFinite(wetKg)) {
    if (wetKg > capacityKg) add('MASS_OVER_CAPACITY', 'error', 'mass', { wet: wetKg, capacity: capacityKg, launcher: launcher.name })
    else if (wetKg > 0.9 * capacityKg) add('MASS_MARGIN_LOW', 'warn', 'mass', { wet: wetKg, capacity: capacityKg })
    else {
      const priceOf = (l: typeof launcher) => l.costM + (l.costPerKgM ?? 0) * wetKg
      const cheaper = launchers
        .filter((l) => !opts.availableLaunchers || opts.availableLaunchers.includes(l.id))
        .filter((l) => !l.rideshare || alt <= l.rideshare.maxAltitudeKm)
        .filter((l) => priceOf(l) < priceOf(launcher) && launchCapacityKg(l, orbit) * 0.9 >= wetKg)
        .sort((a, b) => priceOf(a) - priceOf(b))[0]
      if (cheaper) add('LAUNCHER_OVERSIZED', 'warn', 'cost', { launcher: launcher.name, cheaper: cheaper.name, saving: priceOf(launcher) - priceOf(cheaper) })
    }
  }

  if (launcher.rideshare && capacityKg > 0 && alt > launcher.rideshare.maxAltitudeKm)
    add('RIDESHARE_ALTITUDE', 'error', 'mass', { max: launcher.rideshare.maxAltitudeKm, alt })

  // ---------- Pointing vs instruments, environment ----------
  const scienceItems = payload.map(({ inst, duty }) => {
    const need = POINTING_RANK[inst.pointing]
    let pointingFactor = 1
    if (pointingRank < need) {
      if (inst.pointing === 'precise') {
        pointingFactor = 0
        add('POINTING_INSUFFICIENT', 'error', 'science', { instrument: inst.name, need: inst.pointing, have: adcs.name }, true, inst.discipline)
      } else {
        pointingFactor = 0.5
        add('POINTING_DEGRADED', 'warn', 'science', { instrument: inst.name, need: inst.pointing, have: adcs.name }, false, inst.discipline)
      }
    }
    const lowSun = orbit.lowSunAngle && OPTICAL_INSTRUMENTS.includes(inst.id) ? 0.5 : 1
    const relevance = scenario.relevance[inst.id] ?? 0.2
    const dutyFactor = inst.defaultDuty > 0 ? Math.min(2, Math.sqrt(duty / inst.defaultDuty)) : 1
    return { id: inst.id, base: inst.science * relevance * dutyFactor * pointingFactor * lowSun * comp.scienceFactor }
  })
  if (orbit.lowSunAngle && payload.some((p) => OPTICAL_INSTRUMENTS.includes(p.inst.id))) add('LOW_SUN_OPTICAL', 'warn', 'science')
  if (payload.length === 0 && cargoKg <= 0) add('NO_PAYLOAD', 'error', 'science')
  const coldEnv = orbit.body !== 'earth'
  if (coldEnv && !thermal.coldCapable) add('COLD_RISK', 'warn', 'life', { orbit: orbit.name })

  // ---------- Life ----------
  const panelsLife = (() => {
    if (requiredW >= avgGenBolW) return 0
    if (orbit.panelDegradation <= 0) return 30
    return Math.min(30, Math.log(requiredW / avgGenBolW) / Math.log(1 - orbit.panelDegradation))
  })()
  const batteryLife =
    dodNominal > 1 ? 0 : cyclesPerYear > 0 ? Math.min(BATTERY_CALENDAR_LIFE_YEARS, batteryCycleLife(dodNominal) / cyclesPerYear) : BATTERY_CALENDAR_LIFE_YEARS
  const radiationLife = obc.radToleranceKrad / orbit.radiationKradYr
  const orbitLife = hasProp ? Infinity : noPropulsionOrbitLifeYears(orbit, alt)
  const limits: LifeBreakdown['limits'] = {
    battery: Math.max(0, batteryLife - transferYears),
    panels: Math.max(0, panelsLife - transferYears),
    propellant: designLife,
    radiation: Math.max(0, radiationLife - transferYears),
    orbit: orbitLife,
  }
  const limitingFactor = (Object.keys(limits) as (keyof typeof limits)[]).reduce((a, b) => (limits[b] < limits[a] ? b : a))
  const lifeYears = limits[limitingFactor]
  if (lifeYears < scenario.requiredLifeYears)
    add('LIFE_SHORT', 'warn', 'life', { life: lifeYears, required: scenario.requiredLifeYears, factor: limitingFactor })
  if (radiationLife - transferYears < designLife) add('RADIATION', 'warn', 'life', { years: radiationLife, dose: orbit.radiationKradYr, obc: obc.name })

  // ---------- Cost ----------
  const instrumentsM = payload.reduce((s, p) => s + p.inst.costM * TRL_COST_FACTOR[p.inst.trl], 0)
  const busM =
    area * array.costPerM2 + battery.costM + band.costM + antenna.costM + obc.costM + adcs.costM + prop.costM + thermal.costM + comp.costM
  // Cargo (with its racks and margin) is not spacecraft to integrate.
  const cargoShareKg = cargoKg * (1 + STRUCTURE_FRACTION) * (1 + MASS_MARGIN)
  const integrationM =
    INTEGRATION_FIXED_M + INTEGRATION_M_PER_KG * Math.max(0, (Number.isFinite(tankKg) ? dryKg + tankKg : dryKg) - cargoShareKg)
  const launchM = launcher.costM + (launcher.costPerKgM ?? 0) * (Number.isFinite(wetKg) ? wetKg : 0)
  const opsBase = OPS_BASE_M_PER_MONTH[orbit.body]
  const stationM = stations.reduce((s, st) => s + st.costPerMonthM, 0)
  const opsM = designLife * 12 * (opsBase + stationM) + transferMonths * opsBase
  const contingencyM = CONTINGENCY * (instrumentsM + busM + integrationM + launchM + opsM)
  const totalM = instrumentsM + busM + integrationM + launchM + opsM + contingencyM
  const sandbox = scenario.difficulty === 'sandbox'
  if (!sandbox && totalM > scenario.budgetM) add('OVER_BUDGET', 'error', 'cost', { total: totalM, budget: scenario.budgetM })
  else if (!sandbox && totalM > 0.95 * scenario.budgetM) add('BUDGET_TIGHT', 'warn', 'cost', { total: totalM, budget: scenario.budgetM })

  // ---------- Schedule ----------
  const trlMonths = Math.max(0, ...payload.map((p) => TRL_MONTHS[p.inst.trl]), TRL_MONTHS[obc.trl])
  const buildMonths =
    DEV_BASE_MONTHS +
    trlMonths +
    DEV_MONTHS_PER_EXTRA_INSTRUMENT * Math.max(0, payload.length - 1) +
    (DEV_MONTHS_PER_100KG * Math.max(0, dryKg - cargoShareKg)) / 100 +
    (lowThrust ? DEV_MONTHS_ELECTRIC : 0)
  // A rideshare leaves on a fixed calendar: wait for the next flight.
  const devMonths = launcher.rideshare ? Math.ceil(buildMonths / launcher.rideshare.everyMonths) * launcher.rideshare.everyMonths : buildMonths
  if (devMonths - buildMonths > 0.05) add('RIDESHARE_SCHEDULE', 'warn', 'schedule', { wait: devMonths - buildMonths, every: launcher.rideshare?.everyMonths ?? 0 })
  if (devMonths > scenario.devMonths) add('LATE', 'warn', 'schedule', { months: devMonths, deadline: scenario.devMonths })

  // ---------- Science ----------
  const dataFactor = generatedGbDay > 0 ? deliveredGbDay / generatedGbDay : payload.length > 0 ? 1 : 0
  const byInstrument = scienceItems.map((s) => ({ id: s.id, value: s.base * dataFactor }))
  const sciencePerYear = byInstrument.reduce((s, x) => s + x.value, 0)

  // ---------- Risk ----------
  const riskFactors: number[] = []
  if (coldEnv && !thermal.coldCapable) riskFactors.push(0.95)
  if (radiationLife - transferYears < designLife) riskFactors.push(0.9)
  if (longEclipseDod !== undefined && longEclipseDod > LONG_ECLIPSE_MAX_DOD) riskFactors.push(0.85)
  const trls: Trl[] = [...payload.map((p) => p.inst.trl), obc.trl]
  const successP = successProbability(launcher.reliability, trls, riskFactors)

  // ---------- Requirements ----------
  const requirements: RequirementResult[] = scenario.requirements.map((r) => {
    const base = { id: r.id, kind: r.kind, optional: !!r.optional }
    switch (r.kind) {
      case 'instrumentAny': {
        const have = payload.find((p) => r.instrumentIds?.includes(p.inst.id))
        return { ...base, met: !!have, actual: have?.inst.name ?? '—', target: (r.instrumentIds ?? []).map((id) => getInstrument(id).name).join(' / ') }
      }
      case 'orbitIn':
        return { ...base, met: !!r.orbitIds?.includes(orbit.id), actual: orbit.name, target: (r.orbitIds ?? []).map((id) => getOrbit(id).name).join(' / ') }
      case 'lifeYears':
        return { ...base, met: lifeYears >= (r.value ?? 0), actual: lifeYears, target: r.value ?? 0 }
      case 'dataDeliveredGbDay':
        return { ...base, met: deliveredGbDay >= (r.value ?? 0), actual: deliveredGbDay, target: r.value ?? 0 }
      case 'withinBudget':
        return { ...base, met: sandbox || totalM <= scenario.budgetM, actual: totalM, target: scenario.budgetM }
      case 'onSchedule':
        return { ...base, met: devMonths <= scenario.devMonths, actual: devMonths, target: scenario.devMonths }
      case 'scienceAtLeast':
        return { ...base, met: sciencePerYear >= (r.value ?? 0), actual: sciencePerYear, target: r.value ?? 0 }
      case 'cargoAtLeast':
        return { ...base, met: cargoKg >= (r.value ?? 0), actual: cargoKg, target: r.value ?? 0 }
      case 'altitudeAtMost':
        return { ...base, met: alt <= (r.value ?? Infinity), actual: alt, target: r.value ?? 0 }
      case 'propulsionAny':
        return { ...base, met: !!r.propulsionIds?.includes(prop.id), actual: prop.name, target: 'thrusters for rendezvous' }
      case 'costAtMost':
        return { ...base, met: totalM <= (r.value ?? Infinity), actual: totalM, target: r.value ?? 0 }
      case 'dvAtMost':
        return { ...base, met: hasProp && totalDv <= (r.value ?? Infinity), actual: totalDv, target: r.value ?? 0 }
      case 'arrivalByMonth':
        return { ...base, met: devMonths + transferMonths <= (r.value ?? Infinity), actual: devMonths + transferMonths, target: r.value ?? 0 }
    }
  })

  // ---------- Green lights for resources with no issues ----------
  const okCodes: [ResourceKey, string][] = [
    ['mass', 'MASS_OK'],
    ['power', 'POWER_OK'],
    ['data', 'DATA_OK'],
    ['cost', 'COST_OK'],
    ['schedule', 'SCHEDULE_OK'],
    ['life', 'LIFE_OK'],
    ['science', 'SCIENCE_OK'],
  ]
  for (const [res, code] of okCodes) if (!review.some((r) => r.resource === res)) add(code, 'ok', res)

  const order: Record<Severity, number> = { error: 0, warn: 1, ok: 2 }
  review.sort((a, b) => order[a.severity] - order[b.severity])

  return {
    mass: {
      instrumentsKg,
      subsystemsKg,
      structureKg,
      marginKg,
      dryKg,
      propellantKg,
      tankKg,
      wetKg,
      capacityKg,
      totalDv,
      ispS: prop.ispS,
      items,
    },
    power: {
      sunlitGenBolW,
      avgGenBolW,
      avgGenEolW,
      avgLoadW,
      peakLoadW,
      safeLoadW,
      marginEol,
      eclipseFraction: ecl,
      eclipseMin,
      periodMin,
      batteryWh: battery.capacityWh,
      dodNominal,
      dodWorst,
      dodLimit,
      longEclipseDod,
    },
    data: {
      generatedGbDay,
      rawGbDay,
      downlinkGbDay,
      deliveredGbDay,
      lostFraction,
      storageGb: obc.storageGb,
      daysToFull,
      linkRateMbps,
      contactMinDay: contactMin,
    },
    cost: { instrumentsM, busM, integrationM, launchM, opsM, contingencyM, totalM, budgetM: scenario.budgetM },
    schedule: { devMonths, deadlineMonths: scenario.devMonths, transferMonths, routeId: route?.id ?? null, tcmReserveDv },
    life: { lifeYears, requiredYears: scenario.requiredLifeYears, limits, limitingFactor },
    science: { perYear: sciencePerYear, total: sciencePerYear * lifeYears, byInstrument },
    risk: { successProbability: successP, launchReliability: launcher.reliability },
    review,
    requirements,
    canLaunch: !review.some((r) => r.blocking),
  }
}
