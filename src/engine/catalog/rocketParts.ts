// Parts for the Rocket Engineer pad. Generic, fictional parts with simplified game values (rounded, in the range of real
// engines and stages of each family); documented in docs/model.md §20.
import type { Fairing, PropellantFuel, RocketDesign, RocketEngine, RocketTank, SolidBooster } from '../rocket'

export const ROCKET_ENGINES: RocketEngine[] = [
  { id: 'k_small', name: 'Small kerosene engine (K-1)', fuel: 'kerosene', thrustSlKN: 25, thrustVacKN: 28, ispSl: 300, ispVac: 320, massKg: 50, costM: 0.4, reliability: 0.997, restartable: false, description: 'A small pump-fed engine. Nine of them lift a light rocket.' },
  { id: 'k_small_vac', name: 'Small vacuum kerosene engine (K-1V)', fuel: 'kerosene', thrustSlKN: 0, thrustVacKN: 26, ispSl: 0, ispVac: 340, massKg: 60, costM: 0.5, reliability: 0.997, restartable: true, description: 'A long nozzle for space: more efficient, but it cannot fire at sea level.' },
  { id: 'k_med', name: 'Kerosene engine (K-8)', fuel: 'kerosene', thrustSlKN: 850, thrustVacKN: 950, ispSl: 282, ispVac: 311, massKg: 900, costM: 3.5, reliability: 0.997, restartable: true, description: 'The workhorse of medium rockets. It can relight to land a booster.' },
  { id: 'k_med_vac', name: 'Vacuum kerosene engine (K-8V)', fuel: 'kerosene', thrustSlKN: 0, thrustVacKN: 900, ispSl: 0, ispVac: 345, massKg: 600, costM: 4, reliability: 0.997, restartable: true, description: 'Upper-stage version with a large nozzle for the vacuum of space.' },
  { id: 'm_big', name: 'Methane engine (M-20)', fuel: 'methane', thrustSlKN: 2200, thrustVacKN: 2400, ispSl: 330, ispVac: 355, massKg: 1600, costM: 5, reliability: 0.996, restartable: true, description: 'Burns methane and oxygen: clean, efficient and made to fly again and again.' },
  { id: 'm_vac', name: 'Vacuum methane engine (M-20V)', fuel: 'methane', thrustSlKN: 0, thrustVacKN: 2500, ispSl: 0, ispVac: 375, massKg: 1900, costM: 6, reliability: 0.996, restartable: true, description: 'Methane engine with a vacuum nozzle for upper stages.' },
  { id: 'h_main', name: 'Hydrogen main engine (H-200)', fuel: 'hydrogen', thrustSlKN: 1800, thrustVacKN: 2200, ispSl: 366, ispVac: 452, massKg: 3500, costM: 25, reliability: 0.998, restartable: false, description: 'Liquid hydrogen gives the best efficiency of any chemical engine, but the fuel is bulky and the engine expensive.' },
  { id: 'h_upper', name: 'Hydrogen upper engine (H-10)', fuel: 'hydrogen', thrustSlKN: 0, thrustVacKN: 110, ispSl: 0, ispVac: 455, massKg: 300, costM: 8, reliability: 0.998, restartable: true, description: 'Small, very efficient upper-stage engine: the classic choice to reach high orbits and the Moon.' },
]

/** Bulk density of each propellant mix (kg/m³) and tank dry mass as a share of the propellant it holds. */
const FUEL: Record<PropellantFuel, { density: number; dryShare: number; costShare: number; label: string }> = {
  kerosene: { density: 1030, dryShare: 0.06, costShare: 1, label: 'Kerosene' },
  methane: { density: 830, dryShare: 0.07, costShare: 1.1, label: 'Methane' },
  hydrogen: { density: 360, dryShare: 0.12, costShare: 1.6, label: 'Hydrogen' },
}
const SIZES = [
  { id: 'xs', label: 'XS', propellantKg: 1000, diameterM: 1.2, costM: 0.1 },
  { id: 's', label: 'S', propellantKg: 5000, diameterM: 1.8, costM: 0.3 },
  { id: 'm', label: 'M', propellantKg: 30000, diameterM: 3.7, costM: 1.2 },
  { id: 'l', label: 'L', propellantKg: 120000, diameterM: 5.2, costM: 3.5 },
] as const

export const ROCKET_TANKS: RocketTank[] = (Object.keys(FUEL) as PropellantFuel[]).flatMap((fuel) =>
  SIZES.map((size) => {
    const f = FUEL[fuel]
    const volume = size.propellantKg / f.density
    return {
      id: `${fuel}_${size.id}`,
      name: `${f.label} tank ${size.label}`,
      fuel,
      propellantKg: size.propellantKg,
      dryKg: Math.round(size.propellantKg * f.dryShare),
      diameterM: size.diameterM,
      lengthM: Math.round((volume / (Math.PI * (size.diameterM / 2) ** 2)) * 10) / 10,
      costM: Math.round(size.costM * f.costShare * 100) / 100,
    }
  }),
)

export const BOOSTERS: SolidBooster[] = [
  { id: 'srb_s', name: 'Small solid booster (S-20)', propellantKg: 20000, dryKg: 3000, thrustSlKN: 600, thrustVacKN: 650, ispSl: 245, ispVac: 270, lengthM: 12, costM: 4, reliability: 0.995, description: 'Strap-on solid motor: lots of thrust at liftoff, cannot be switched off.' },
  { id: 'srb_l', name: 'Large solid booster (S-150)', propellantKg: 150000, dryKg: 20000, thrustSlKN: 4500, thrustVacKN: 4900, ispSl: 250, ispVac: 275, lengthM: 30, costM: 18, reliability: 0.995, description: 'A big solid motor for heavy rockets: it does the hardest part of the climb.' },
]

export const FAIRINGS: Fairing[] = [
  { id: 'fairing_xs', name: 'Fairing XS (1.2 m)', massKg: 50, diameterM: 1.2, maxPayloadKg: 500, costM: 0.2 },
  { id: 'fairing_s', name: 'Fairing S (2 m)', massKg: 300, diameterM: 2, maxPayloadKg: 2500, costM: 0.8 },
  { id: 'fairing_m', name: 'Fairing M (4 m)', massKg: 1500, diameterM: 4, maxPayloadKg: 12000, costM: 3 },
  { id: 'fairing_l', name: 'Fairing L (5.2 m)', massKg: 2500, diameterM: 5.2, maxPayloadKg: 30000, costM: 5 },
]

/** Starting designs: one per catalog launcher, so a player can open a known rocket and change it. */
export const ROCKET_PRESETS: Record<'light' | 'medium' | 'reusable_medium' | 'heavy', RocketDesign> = {
  light: {
    stages: [
      { engineId: 'k_small', engines: 9, tankId: 'kerosene_s', tanks: 2 },
      { engineId: 'k_small_vac', engines: 1, tankId: 'kerosene_xs', tanks: 2 },
    ],
    boosters: 0,
    fairingId: 'fairing_xs',
    legs: false,
    fins: false,
  },
  medium: {
    stages: [
      { engineId: 'k_med', engines: 3, tankId: 'kerosene_m', tanks: 3 },
      { engineId: 'k_small_vac', engines: 6, tankId: 'kerosene_s', tanks: 4 },
    ],
    boosters: 0,
    fairingId: 'fairing_s',
    legs: false,
    fins: false,
  },
  reusable_medium: {
    stages: [
      { engineId: 'k_med', engines: 3, tankId: 'kerosene_m', tanks: 3 },
      { engineId: 'k_small_vac', engines: 6, tankId: 'kerosene_s', tanks: 4 },
    ],
    boosters: 0,
    fairingId: 'fairing_s',
    legs: true,
    fins: true,
  },
  heavy: {
    stages: [
      { engineId: 'h_main', engines: 2, tankId: 'hydrogen_l', tanks: 1 },
      { engineId: 'h_upper', engines: 2, tankId: 'hydrogen_m', tanks: 1 },
    ],
    boosterId: 'srb_l',
    boosters: 2,
    fairingId: 'fairing_l',
    legs: false,
    fins: false,
  },
}
