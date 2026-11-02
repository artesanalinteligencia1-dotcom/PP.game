// Game catalog. Generic/fictional components; values are simplified game values, not official data.
// Every number here is documented in docs/model.md.
import type {
  Adcs,
  Antenna,
  Battery,
  Catalog,
  CommsBand,
  Compression,
  GroundStation,
  Instrument,
  Launcher,
  Obc,
  Orbit,
  Propulsion,
  SolarArray,
  Thermal,
} from '../types'

export const instruments: Instrument[] = [
  { id: 'pan_camera', discipline: 'astrophysicist', name: 'Panchromatic Camera', massKg: 25, powerW: 40, dataRateMbps: 80, costM: 8, science: 40, trl: 9, pointing: 'fine', defaultDuty: 0.05, description: 'Black-and-white imager. Cheap, proven, sharp shapes but no colour information.' },
  { id: 'multispectral', discipline: 'astrobiologist', name: 'Multispectral Imager', massKg: 40, powerW: 60, dataRateMbps: 120, costM: 15, science: 65, trl: 8, pointing: 'fine', defaultDuty: 0.05, description: 'Sees several colour bands (incl. near-infrared) — the workhorse for crops and forests.' },
  { id: 'sar', discipline: 'astrophysicist', name: 'Synthetic Aperture Radar', massKg: 120, powerW: 500, dataRateMbps: 400, costM: 45, science: 90, trl: 6, pointing: 'precise', defaultDuty: 0.03, description: 'Active radar that images through clouds and at night. Power and data hungry.' },
  { id: 'ir_spectrometer', discipline: 'astrobiologist', name: 'Infrared Spectrometer', massKg: 30, powerW: 35, dataRateMbps: 10, costM: 12, science: 55, trl: 7, pointing: 'fine', defaultDuty: 0.05, description: 'Splits infrared light to identify minerals, water and plant stress.' },
  { id: 'magnetometer', discipline: 'astrophysicist', name: 'Magnetometer', massKg: 3, powerW: 3, dataRateMbps: 0.05, costM: 2, science: 20, trl: 9, pointing: 'coarse', defaultDuty: 1, description: 'Measures magnetic fields. Tiny, cheap, always on.' },
  { id: 'laser_altimeter', discipline: 'astrophysicist', name: 'Laser Altimeter', massKg: 60, powerW: 90, dataRateMbps: 5, costM: 30, science: 75, trl: 6, pointing: 'fine', defaultDuty: 0.1, description: 'Fires laser pulses to map terrain height and shadowed craters.' },
  { id: 'particle_detector', discipline: 'astrophysicist', name: 'Particle Detector', massKg: 8, powerW: 10, dataRateMbps: 0.2, costM: 5, science: 30, trl: 8, pointing: 'coarse', defaultDuty: 1, description: 'Counts energetic particles: space weather and radiation environment.' },
  { id: 'hires_camera', discipline: 'astrophysicist', name: 'High-Resolution Camera', massKg: 80, powerW: 120, dataRateMbps: 300, costM: 35, science: 85, trl: 6, pointing: 'precise', defaultDuty: 0.02, description: 'Telescope-class camera. Needs very stable pointing and a fat downlink.' },
  { id: 'hyperspectral', discipline: 'astrobiologist', name: 'Hyperspectral Imager', massKg: 55, powerW: 80, dataRateMbps: 250, costM: 28, science: 80, trl: 7, pointing: 'fine', defaultDuty: 0.03, description: 'Hundreds of narrow colour bands: crop type, water quality, soil chemistry.' },
  { id: 'neutron_spectrometer', discipline: 'astrobiologist', name: 'Neutron Spectrometer', massKg: 15, powerW: 12, dataRateMbps: 0.1, costM: 10, science: 60, trl: 8, pointing: 'coarse', defaultDuty: 1, description: 'Detects hydrogen (a hint of water ice) from orbit by counting neutrons.' },
  { id: 'thermal_ir', discipline: 'astrobiologist', name: 'Thermal Infrared Camera', massKg: 35, powerW: 50, dataRateMbps: 40, costM: 14, science: 50, trl: 8, pointing: 'fine', defaultDuty: 0.1, description: 'Sees heat: fires, drought stress, cold traps.' },
  { id: 'mw_radiometer', discipline: 'astrophysicist', name: 'Microwave Radiometer', massKg: 70, powerW: 110, dataRateMbps: 2, costM: 25, science: 70, trl: 7, pointing: 'coarse', defaultDuty: 0.5, description: 'Measures soil moisture, rain and ice through clouds.' },
  { id: 'weather_imager', discipline: 'astrophysicist', name: 'Wide-Field Weather Imager', massKg: 90, powerW: 150, dataRateMbps: 60, costM: 40, science: 75, trl: 8, pointing: 'fine', defaultDuty: 0.3, description: 'Watches whole cloud systems evolve. Best from high orbits.' },
]

/** Instruments that rely on sunlight reflected from the ground. */
export const OPTICAL_INSTRUMENTS = ['pan_camera', 'multispectral', 'hires_camera', 'hyperspectral']

export const launchers: Launcher[] = [
  {
    id: 'paulet', name: 'Paulet-1 (sounding rocket)', kind: 'sounding', capacityKg: { leo: 0, sso: 0, gto: 0, tli: 0 }, costM: 1.5, reliability: 0.8,
    suborbital: { apogeeKm: 110, payloadKg: 8 },
    realWorld: 'Built by Pedro Goicochea from Pedro Paulet’s notebooks (fiction). Paulet claimed in a 1927 letter to have tested a liquid-propellant engine in Paris in the 1890s — not independently verified. The first verified liquid-fuel rocket flight was Robert Goddard’s, in 1926.',
  },
  {
    id: 'light', name: 'Light (L-1)', kind: 'expendable', capacityKg: { leo: 300, sso: 200, gto: 0, tli: 0 }, costM: 7, reliability: 0.9,
    realWorld: 'Small dedicated launchers (a few hundred kg to low orbit) appeared in the late 2010s for small satellites.',
  },
  {
    id: 'rideshare', name: 'Rideshare (shared ride to SSO)', kind: 'rideshare', capacityKg: { leo: 0, sso: 150, gto: 0, tli: 0 }, costM: 0.5, costPerKgM: 0.015, reliability: 0.95,
    rideshare: { maxAltitudeKm: 620, everyMonths: 6 },
    realWorld: 'Dedicated rideshare flights carry dozens of small satellites at once to sun-synchronous orbit: cheap per kg, but you go when and where the rocket goes.',
  },
  {
    id: 'medium', name: 'Medium (M-2)', kind: 'expendable', capacityKg: { leo: 3000, sso: 2000, gto: 1000, tli: 400 }, costM: 45, reliability: 0.94,
    realWorld: 'Classic medium launchers, thrown away after each flight, flew most satellites of the last decades.',
  },
  {
    id: 'reusable_medium', name: 'R-2 Reusable Medium', kind: 'reusable', capacityKg: { leo: 2100, sso: 1400, gto: 700, tli: 280 }, costM: 27, reliability: 0.95,
    landing: { successP: 0.9 },
    realWorld: 'In December 2015 an orbital rocket’s first stage (Falcon 9) landed back for the first time; boosters have been re-flown since 2017. Landing needs propellant, so a reusable rocket lifts less than the same rocket thrown away — but each flight costs much less.',
  },
  {
    id: 'heavy', name: 'Heavy (H-3)', kind: 'expendable', capacityKg: { leo: 15000, sso: 10000, gto: 6000, tli: 3500 }, costM: 130, reliability: 0.96,
    realWorld: 'Heavy expendable launchers send big satellites to geostationary orbit and probes to the Moon and planets.',
  },
]

export const orbits: Orbit[] = [
  {
    id: 'leo', name: 'Low Earth Orbit (51.6°)', body: 'earth', altitudeKm: [400, 600], defaultAltitudeKm: 500,
    launchTarget: 'leo', capacityFactor: 1, insertionDv: 0, disposalDv: 30, radiationKradYr: 1, panelDegradation: 0.02,
    linkFactor: 1, contact: 'pass', stationKeepingDv: 0, drag: true, sunDistanceAu: 1,
    description: 'Close to Earth: sharp images and cheap launches, but air drag, frequent eclipses and short ground passes. Does not fly over the poles.',
  },
  {
    id: 'sso', name: 'Sun-Synchronous Orbit (10:30)', body: 'earth', altitudeKm: [600, 800], defaultAltitudeKm: 700,
    launchTarget: 'sso', capacityFactor: 1, insertionDv: 0, disposalDv: 120, radiationKradYr: 1.5, panelDegradation: 0.02,
    linkFactor: 1, contact: 'pass', stationKeepingDv: 0, drag: true, sunDistanceAu: 1,
    description: 'Polar orbit that crosses each place at the same local time (mid-morning): consistent lighting, ideal for Earth observation. Eclipses every orbit.',
  },
  {
    id: 'sso_dd', name: 'Dawn-Dusk Sun-Synchronous', body: 'earth', altitudeKm: [600, 800], defaultAltitudeKm: 700,
    launchTarget: 'sso', capacityFactor: 1, insertionDv: 0, disposalDv: 120, radiationKradYr: 1.5, panelDegradation: 0.02,
    linkFactor: 1, contact: 'pass', stationKeepingDv: 0, drag: true, sunDistanceAu: 1, eclipseOverride: 0, lowSunAngle: true,
    description: 'Rides the day/night line: almost permanent sunlight (small battery!), but the ground below is at sunrise/sunset, so optical cameras see long shadows.',
  },
  {
    id: 'meo', name: 'Medium Earth Orbit', body: 'earth', altitudeKm: [20000, 20000], defaultAltitudeKm: 20000,
    launchTarget: 'gto', capacityFactor: 1, insertionDv: 1200, disposalDv: 50, radiationKradYr: 30, panelDegradation: 0.035,
    linkFactor: 0.3, contact: 'pass', stationKeepingDv: 5, drag: false, sunDistanceAu: 1,
    description: 'Navigation-satellite altitude: ~12 h period and long passes, but inside the radiation belts.',
  },
  {
    id: 'geo', name: 'Geostationary Orbit', body: 'earth', altitudeKm: [35786, 35786], defaultAltitudeKm: 35786,
    launchTarget: 'gto', capacityFactor: 1, insertionDv: 1500, disposalDv: 11, radiationKradYr: 5, panelDegradation: 0.025,
    linkFactor: 0.2, contact: 'continuous', stationKeepingDv: 50, drag: false, sunDistanceAu: 1,
    description: 'Hovers over one spot on the equator: permanent contact and continuous view of a hemisphere, but far away and costly to reach.',
  },
  {
    id: 'lunar_polar', name: 'Low Lunar Polar Orbit', body: 'moon', altitudeKm: [50, 150], defaultAltitudeKm: 100,
    launchTarget: 'tli', capacityFactor: 1, insertionDv: 850, disposalDv: 0, radiationKradYr: 10, panelDegradation: 0.03,
    linkFactor: 0.01, contact: 'deep', stationKeepingDv: 150, drag: false, sunDistanceAu: 1, longEclipseH: 2.5,
    description: 'Passes over both lunar poles every ~2 h. Needs a braking burn to be captured, regular corrections (lumpy gravity), and deep-space antennas on Earth.',
  },
  {
    id: 'helio', name: 'Heliocentric (Mars flyby)', body: 'sun', altitudeKm: [0, 0], defaultAltitudeKm: 0,
    launchTarget: 'tli', capacityFactor: 0.6, insertionDv: 300, disposalDv: 0, radiationKradYr: 8, panelDegradation: 0.03,
    linkFactor: 0.0005, contact: 'deep', stationKeepingDv: 10, drag: false, sunDistanceAu: 1.5, eclipseOverride: 0,
    description: 'Leaves Earth for good. Weaker sunlight, tiny data rates, minutes of signal delay, years of cruise.',
  },
]

export const arrays: SolarArray[] = [
  { id: 'body', name: 'Body-mounted panels', efficiency: 0.2, cosFactor: 0.45, kgPerM2: 3, fixedMassKg: 0, costPerM2: 0.25, maxAreaM2: 2, description: 'Cells glued to the spacecraft body. Simple and light, but rarely face the Sun squarely.' },
  { id: 'deployable', name: 'Deployable fixed wings', efficiency: 0.22, cosFactor: 0.7, kgPerM2: 4, fixedMassKg: 2, costPerM2: 0.4, maxAreaM2: 12, description: 'Wings that unfold after launch. More area, better angle.' },
  { id: 'tracking', name: 'Sun-tracking wings', efficiency: 0.24, cosFactor: 0.97, kgPerM2: 5, fixedMassKg: 8, costPerM2: 0.6, maxAreaM2: 40, description: 'Motorised wings that follow the Sun. Most power per m², heavier and pricier.' },
]

export const batteries: Battery[] = [
  { id: 'b100', name: 'Li-ion 100 Wh', capacityWh: 100, massKg: 1, costM: 0.1 },
  { id: 'b500', name: 'Li-ion 500 Wh', capacityWh: 500, massKg: 4.5, costM: 0.4 },
  { id: 'b1000', name: 'Li-ion 1 000 Wh', capacityWh: 1000, massKg: 9, costM: 0.7 },
  { id: 'b2000', name: 'Li-ion 2 000 Wh', capacityWh: 2000, massKg: 17, costM: 1.2 },
  { id: 'b4000', name: 'Li-ion 4 000 Wh', capacityWh: 4000, massKg: 33, costM: 2.2 },
]

export const bands: CommsBand[] = [
  { id: 'uhf', name: 'UHF', rateMbps: 0.05, massKg: 1, txPowerW: 5, costM: 0.3, antennas: ['omni'] },
  { id: 'sband', name: 'S-band', rateMbps: 2, massKg: 2.5, txPowerW: 15, costM: 1.5, antennas: ['patch', 'helical', 'dish'] },
  { id: 'xband', name: 'X-band', rateMbps: 100, massKg: 4, txPowerW: 35, costM: 4, antennas: ['patch', 'helical', 'dish'] },
  { id: 'kaband', name: 'Ka-band', rateMbps: 500, massKg: 5, txPowerW: 60, costM: 9, antennas: ['dish'] },
]

export const antennas: Antenna[] = [
  { id: 'omni', name: 'Omni whip', gain: 1, massKg: 0.2, powerW: 0, costM: 0.05, pointing: 'coarse' },
  { id: 'patch', name: 'Patch', gain: 1, massKg: 0.5, powerW: 0, costM: 0.2, pointing: 'coarse' },
  { id: 'helical', name: 'Helical', gain: 1.6, massKg: 2, powerW: 0, costM: 0.5, pointing: 'coarse' },
  { id: 'dish', name: 'Steerable dish', gain: 4, massKg: 12, powerW: 10, costM: 3, pointing: 'fine' },
]

export const obcs: Obc[] = [
  { id: 'basic', name: 'Basic computer', massKg: 2, powerW: 8, costM: 0.5, storageGb: 32, radToleranceKrad: 10, trl: 9 },
  { id: 'radhard', name: 'Radiation-hardened computer', massKg: 4, powerW: 12, costM: 3, storageGb: 16, radToleranceKrad: 100, trl: 9 },
  { id: 'highperf', name: 'High-performance computer', massKg: 3, powerW: 20, costM: 1.5, storageGb: 256, radToleranceKrad: 15, trl: 8 },
]

export const adcs: Adcs[] = [
  { id: 'magnetorquers', name: 'Magnetorquers', massKg: 2, powerW: 3, costM: 0.3, pointing: 'coarse' },
  { id: 'wheels', name: 'Reaction wheels', massKg: 10, powerW: 25, costM: 2, pointing: 'fine' },
  { id: 'startracker', name: 'Star tracker + wheels', massKg: 14, powerW: 35, costM: 4.5, pointing: 'precise' },
]

export const propulsion: Propulsion[] = [
  { id: 'none', name: 'None', ispS: 0, massKg: 0, powerW: 0, costM: 0, description: 'No thrusters: lighter and cheaper, but you cannot change or keep your orbit.' },
  { id: 'coldgas', name: 'Cold gas', ispS: 65, massKg: 4, powerW: 5, costM: 0.5, description: 'Compressed gas through a nozzle. Simple and safe, very inefficient.' },
  { id: 'hydrazine', name: 'Hydrazine monopropellant', ispS: 220, massKg: 12, powerW: 20, costM: 3, description: 'The classic satellite thruster: decent efficiency, toxic fuel, needs heaters.' },
  { id: 'electric', name: 'Electric (ion/Hall)', ispS: 1500, massKg: 25, powerW: 10, costM: 8, lowThrust: { dvPenalty: 1.3, dvPerMonth: 150 }, description: 'Extremely efficient but gentle: needs ~600 W while thrusting and months to change orbit.' },
]

/** Power (W) an electric thruster draws while thrusting (in addition to the safe-mode bus). */
export const ELECTRIC_THRUST_POWER_W = 600

export const thermal: Thermal[] = [
  { id: 'passive', name: 'Passive (paint, blankets)', massKg: 3, powerW: 0, costM: 0.3, coldCapable: false },
  { id: 'active', name: 'Active (heaters, radiators)', massKg: 8, powerW: 30, costM: 1.5, coldCapable: true },
]

export const compression: Compression[] = [
  { id: 'none', name: 'No compression', ratio: 1, massKg: 0, powerW: 0, costM: 0, scienceFactor: 1 },
  { id: 'lossless', name: 'Lossless (1.5×)', ratio: 1.5, massKg: 1, powerW: 8, costM: 0.4, scienceFactor: 1 },
  { id: 'lossy', name: 'Lossy (3×)', ratio: 3, massKg: 1.5, powerW: 15, costM: 0.6, scienceFactor: 0.85 },
]

export const stations: GroundStation[] = [
  { id: 'arctic', name: 'Arctic Station (78°N)', latDeg: 78, deepSpace: false, costPerMonthM: 0.12 },
  { id: 'mid_north', name: 'Mid-latitude Station (40°N)', latDeg: 40, deepSpace: false, costPerMonthM: 0.08 },
  { id: 'equatorial', name: 'Equatorial Station (5°S)', latDeg: -5, deepSpace: false, costPerMonthM: 0.08 },
  { id: 'andes', name: 'Andean Station (16°S)', latDeg: -16, deepSpace: false, costPerMonthM: 0.07 },
  { id: 'south', name: 'Southern Station (34°S)', latDeg: -34, deepSpace: false, costPerMonthM: 0.08 },
  { id: 'deep_west', name: 'Deep Space Antenna West (35°N)', latDeg: 35, deepSpace: true, costPerMonthM: 0.3 },
  { id: 'deep_south', name: 'Deep Space Antenna South (35°S)', latDeg: -35, deepSpace: true, costPerMonthM: 0.3 },
  { id: 'deep_east', name: 'Deep Space Antenna East (40°N)', latDeg: 40, deepSpace: true, costPerMonthM: 0.3 },
]

export const catalog: Catalog = {
  instruments,
  launchers,
  orbits,
  arrays,
  batteries,
  bands,
  antennas,
  obcs,
  adcs,
  propulsion,
  thermal,
  compression,
  stations,
}

function finder<T extends { id: string }>(list: T[], kind: string) {
  const map = new Map(list.map((x) => [x.id, x]))
  return (id: string): T => {
    const v = map.get(id)
    if (!v) throw new Error(`Unknown ${kind}: ${id}`)
    return v
  }
}

export const getInstrument = finder(instruments, 'instrument')
export const getLauncher = finder(launchers, 'launcher')
export const getOrbit = finder(orbits, 'orbit')
export const getArray = finder(arrays, 'solar array')
export const getBattery = finder(batteries, 'battery')
export const getBand = finder(bands, 'comms band')
export const getAntenna = finder(antennas, 'antenna')
export const getObc = finder(obcs, 'OBC')
export const getAdcs = finder(adcs, 'ADCS')
export const getPropulsion = finder(propulsion, 'propulsion')
export const getThermal = finder(thermal, 'thermal')
export const getCompression = finder(compression, 'compression')
export const getStation = finder(stations, 'ground station')
