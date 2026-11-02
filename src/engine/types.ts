// Pure engine types. No React, no DOM.

export type Difficulty = 'beginner' | 'engineer' | 'expert' | 'sandbox'
export type Trl = 6 | 7 | 8 | 9
export type PointingLevel = 'coarse' | 'fine' | 'precise'
export type CentralBody = 'earth' | 'moon' | 'sun'
export type LaunchTarget = 'leo' | 'sso' | 'gto' | 'tli'

export type Discipline = 'astrophysicist' | 'astrobiologist'

export interface Instrument {
  id: string
  /** Which scientist on the team owns this instrument. */
  discipline: Discipline
  name: string
  massKg: number
  powerW: number
  dataRateMbps: number
  costM: number
  science: number
  trl: Trl
  pointing: PointingLevel
  defaultDuty: number
  description: string
}

export interface Launcher {
  id: string
  name: string
  /** Payload capacity (kg) per launch target; 0 = not offered. */
  capacityKg: Record<LaunchTarget, number>
  costM: number
  reliability: number
}

export interface Orbit {
  id: string
  name: string
  body: CentralBody
  /** Altitude range in km above the central body surface (equal = fixed). */
  altitudeKm: [number, number]
  defaultAltitudeKm: number
  launchTarget: LaunchTarget
  /** Fraction of launcher capacity to that target usable here (escape trajectories < 1). */
  capacityFactor: number
  /** Δv the spacecraft itself must provide after separation (m/s). */
  insertionDv: number
  /** Δv to dispose of the spacecraft at end of life (m/s). */
  disposalDv: number
  /** Annual radiation dose behind standard shielding (krad/yr). */
  radiationKradYr: number
  /** Solar array degradation per year. */
  panelDegradation: number
  /** Comms distance factor applied to the link rate (1 = near-Earth LEO). */
  linkFactor: number
  /** Override eclipse fraction (e.g. dawn-dusk SSO = 0, interplanetary = 0). */
  eclipseOverride?: number
  /** Longest single eclipse the battery must survive in safe mode (hours), if any. */
  longEclipseH?: number
  /** Contact model for ground stations. */
  contact: 'pass' | 'continuous' | 'deep'
  /** Station-keeping Δv per year when there is no drag model (m/s/yr). */
  stationKeepingDv: number
  /** If true, drag model applies (Earth LEO/SSO). */
  drag: boolean
  /** If true, optical science is degraded (low sun angle). */
  lowSunAngle?: boolean
  /** Distance from the Sun in AU for solar flux (1 for Earth/Moon). */
  sunDistanceAu: number
  description: string
}

export interface SolarArray {
  id: string
  name: string
  efficiency: number
  cosFactor: number
  kgPerM2: number
  fixedMassKg: number
  costPerM2: number
  maxAreaM2: number
  description: string
}

export interface Battery {
  id: string
  name: string
  capacityWh: number
  massKg: number
  costM: number
}

export interface CommsBand {
  id: string
  name: string
  rateMbps: number
  massKg: number
  txPowerW: number
  costM: number
  /** Antenna ids this band can use. */
  antennas: string[]
}

export interface Antenna {
  id: string
  name: string
  gain: number
  massKg: number
  powerW: number
  costM: number
  pointing: PointingLevel
}

export interface Obc {
  id: string
  name: string
  massKg: number
  powerW: number
  costM: number
  storageGb: number
  radToleranceKrad: number
  trl: Trl
}

export interface Adcs {
  id: string
  name: string
  massKg: number
  powerW: number
  costM: number
  pointing: PointingLevel
}

export interface Propulsion {
  id: string
  name: string
  ispS: number
  massKg: number
  powerW: number
  costM: number
  /** Electric: Δv penalty factor for low-thrust spirals and transfer speed (m/s per month). */
  lowThrust?: { dvPenalty: number; dvPerMonth: number }
  description: string
}

export interface Thermal {
  id: string
  name: string
  massKg: number
  powerW: number
  costM: number
  /** Survives cold environments (long eclipses, deep space). */
  coldCapable: boolean
}

export interface Compression {
  id: string
  name: string
  ratio: number
  massKg: number
  powerW: number
  costM: number
  /** Multiplier on science value (lossy compression loses information). */
  scienceFactor: number
}

export interface GroundStation {
  id: string
  name: string
  latDeg: number
  deepSpace: boolean
  costPerMonthM: number
}

export interface Catalog {
  instruments: Instrument[]
  launchers: Launcher[]
  orbits: Orbit[]
  arrays: SolarArray[]
  batteries: Battery[]
  bands: CommsBand[]
  antennas: Antenna[]
  obcs: Obc[]
  adcs: Adcs[]
  propulsion: Propulsion[]
  thermal: Thermal[]
  compression: Compression[]
  stations: GroundStation[]
}

export interface DesignInstrument {
  id: string
  /** 0..1 fraction of the day the instrument operates. */
  duty: number
}

export interface Design {
  scenarioId: string
  instruments: DesignInstrument[]
  orbitId: string
  altitudeKm: number
  launcherId: string
  arrayId: string
  arrayAreaM2: number
  batteryId: string
  obcId: string
  adcsId: string
  propulsionId: string
  thermalId: string
  compressionId: string
  bandId: string
  antennaId: string
  stationIds: string[]
  /** Planned design life in years (propellant and operations are sized for it). */
  designLifeYears: number
}

export interface Requirement {
  id: string
  /** Kind of check; params interpreted by the engine. */
  kind:
    | 'instrumentAny'
    | 'orbitIn'
    | 'lifeYears'
    | 'dataDeliveredGbDay'
    | 'withinBudget'
    | 'onSchedule'
    | 'scienceAtLeast'
  instrumentIds?: string[]
  orbitIds?: string[]
  value?: number
  optional?: boolean
  bonus?: number
}

export interface Scenario {
  id: string
  name: string
  difficulty: Difficulty
  tagline: string
  objective: string
  whyItMatters: string
  budgetM: number
  devMonths: number
  requiredLifeYears: number
  /** Relevance (0..1) of each instrument to this scenario's science goal. Missing = 0.2. */
  relevance: Record<string, number>
  requirements: Requirement[]
  baseDesign: Design
  /** Science points that earn the full science score over the required life. */
  scienceTarget: number
  /** Scenario-specific science opportunity event. */
  opportunity: { title: string; text: string; instrumentIds: string[]; bonusScience: number }
}

export type Severity = 'ok' | 'warn' | 'error'
/** Team roles: Mission Director (PI, incl. finance & operations), Spacecraft Engineer, Astrophysicist, Astrobiologist. */
export type Role = 'lead' | 'engineer' | 'astrophysicist' | 'astrobiologist'
export type ResourceKey = 'mass' | 'power' | 'data' | 'cost' | 'schedule' | 'life' | 'science' | 'risk'

export interface ReviewItem {
  code: string
  severity: Severity
  resource: ResourceKey
  role: Role
  /** Blocking errors prevent launch. */
  blocking: boolean
  params: Record<string, number | string>
}

export interface RequirementResult {
  id: string
  kind: Requirement['kind']
  optional: boolean
  met: boolean
  actual: number | string
  target: number | string
}

export interface MassBreakdown {
  instrumentsKg: number
  subsystemsKg: number
  structureKg: number
  marginKg: number
  dryKg: number
  propellantKg: number
  tankKg: number
  wetKg: number
  capacityKg: number
  totalDv: number
  ispS: number
  items: { label: string; kg: number; group: 'payload' | 'bus' }[]
}

export interface PowerBreakdown {
  sunlitGenBolW: number
  avgGenBolW: number
  avgGenEolW: number
  avgLoadW: number
  peakLoadW: number
  safeLoadW: number
  /** Orbit-average power margin (EOL) = gen / required − 1. */
  marginEol: number
  eclipseFraction: number
  eclipseMin: number
  periodMin: number
  batteryWh: number
  dodNominal: number
  dodWorst: number
  dodLimit: number
  longEclipseDod?: number
}

export interface DataBreakdown {
  generatedGbDay: number
  rawGbDay: number
  downlinkGbDay: number
  deliveredGbDay: number
  lostFraction: number
  storageGb: number
  daysToFull: number | null
  linkRateMbps: number
  contactMinDay: number
}

export interface CostBreakdown {
  instrumentsM: number
  busM: number
  integrationM: number
  launchM: number
  opsM: number
  contingencyM: number
  totalM: number
  budgetM: number
}

export interface ScheduleBreakdown {
  devMonths: number
  deadlineMonths: number
  transferMonths: number
}

export interface LifeBreakdown {
  lifeYears: number
  requiredYears: number
  limits: { battery: number; panels: number; propellant: number; radiation: number; orbit: number }
  limitingFactor: 'battery' | 'panels' | 'propellant' | 'radiation' | 'orbit'
}

export interface DesignReport {
  mass: MassBreakdown
  power: PowerBreakdown
  data: DataBreakdown
  cost: CostBreakdown
  schedule: ScheduleBreakdown
  life: LifeBreakdown
  science: { perYear: number; total: number; byInstrument: { id: string; value: number }[] }
  risk: { successProbability: number; launchReliability: number }
  review: ReviewItem[]
  requirements: RequirementResult[]
  canLaunch: boolean
}
