// Transfer routes for destinations where the three-body problem matters (Moon, Earth–Moon L2), and the ways to reach Mars.
// Game values; real-world references are approximate.

export interface Route {
  id: string
  name: string
  /** Δv the spacecraft must provide after the launcher's trans-lunar injection (m/s). */
  insertionDv: number
  /** Months from launch to arrival (chemical propulsion). */
  transferMonths: number
  /** Expected trajectory-correction need (m/s). Real needs vary: small errors grow in chaotic regions. */
  tcmDv: number
  /** Landing sites: speed at the top of the atmosphere (km/s). */
  entryKms?: number
  description: string
  realWorld: string
}

export const ROUTES: Record<string, Route[]> = {
  lunar_polar: [
    {
      id: 'direct',
      name: 'Direct transfer (~5 days)',
      insertionDv: 850,
      transferMonths: 0.2,
      tcmDv: 10,
      description: 'Fast and well understood, but you arrive fast too: a big braking burn to be captured.',
      realWorld: 'Most lunar orbiters and all Apollo missions took a few days on a direct trajectory.',
    },
    {
      id: 'low_energy',
      name: 'Low-energy transfer (~3.5 months)',
      insertionDv: 650,
      transferMonths: 3.5,
      tcmDv: 25,
      description: 'A long loop far beyond the Moon where the Sun’s and Earth’s pull do part of the braking for you. Saves propellant, costs months and needs careful corrections.',
      realWorld: 'NASA’s GRAIL twins (2011) reached the Moon after a low-energy transfer of about three and a half months.',
    },
  ],
  em_l2_halo: [
    {
      id: 'direct',
      name: 'Direct transfer (~1 week)',
      insertionDv: 450,
      transferMonths: 0.25,
      tcmDv: 15,
      description: 'Shortest trip, highest arrival burn.',
      realWorld: 'Direct transfers to lunar halo orbits take about a week but need a large insertion burn.',
    },
    {
      id: 'flyby',
      name: 'Lunar flyby assist (~3 weeks)',
      insertionDv: 300,
      transferMonths: 0.75,
      tcmDv: 20,
      description: 'Swing past the Moon so its gravity bends and slows your path — a gravity assist.',
      realWorld: 'Gravity assists let probes change speed and direction without propellant (e.g. lunar swing-bys of several missions).',
    },
    {
      id: 'low_energy',
      name: 'Ballistic low-energy transfer (~4 months)',
      insertionDv: 120,
      transferMonths: 4,
      tcmDv: 35,
      description: 'Ride the gravitational “highways” of the Sun–Earth–Moon system. Very little propellant, but four months of travel through chaotic territory.',
      realWorld: 'The CAPSTONE cubesat (2022) took about four months on a ballistic lunar transfer to reach its near-rectilinear halo orbit.',
    },
  ],
}

const MARS_HOHMANN_REAL = 'Minimum-energy trips to Mars take seven to nine months; that is how most Mars missions have flown since the 1960s.'
const MARS_FAST_REAL = 'Faster trajectories reach Mars in about seven months; the spacecraft arrives faster and must brake harder.'

ROUTES.mars_low = [
  {
    id: 'hohmann',
    name: 'Minimum-energy transfer (~8.5 months)',
    insertionDv: 2100,
    transferMonths: 8.5,
    tcmDv: 30,
    description: 'Half an ellipse around the Sun that just touches Mars’ orbit. The cheapest trip, but you must brake all the way into a low orbit with your own engine.',
    realWorld: MARS_HOHMANN_REAL,
  },
  {
    id: 'aerobrake',
    name: 'Capture, then aerobraking (~13.5 months)',
    insertionDv: 1000,
    transferMonths: 13.5,
    tcmDv: 45,
    description: 'Brake just enough to be caught in a long ellipse, then dip into the top of the atmosphere hundreds of times: the air does the rest of the braking. Half the propellant, five more months, and every pass must be watched.',
    realWorld: 'Mars Reconnaissance Orbiter (2006) braked about 1 km/s with its engines, then used some 400 passes through the upper atmosphere over five months to shrink its orbit.',
  },
  {
    id: 'fast',
    name: 'Fast transfer (~7 months)',
    insertionDv: 2550,
    transferMonths: 7,
    tcmDv: 30,
    description: 'A shorter arc that arrives faster, so the braking burn is bigger. Two months less of cruise for a lot more propellant.',
    realWorld: MARS_FAST_REAL,
  },
]
ROUTES.mars_areo = [
  {
    id: 'hohmann',
    name: 'Minimum-energy transfer (~8.5 months)',
    insertionDv: 1750,
    transferMonths: 8.5,
    tcmDv: 30,
    description: 'Brake close to Mars into a long ellipse, then a second burn at the top makes the orbit circular at 17 030 km.',
    realWorld: MARS_HOHMANN_REAL,
  },
  {
    id: 'fast',
    name: 'Fast transfer (~7 months)',
    insertionDv: 2200,
    transferMonths: 7,
    tcmDv: 30,
    description: 'Two months less of cruise, a harder braking burn on arrival.',
    realWorld: MARS_FAST_REAL,
  },
]

ROUTES.mars_surface = [
  {
    id: 'hohmann',
    name: 'Minimum-energy transfer (~8.5 months)',
    insertionDv: 0,
    transferMonths: 8.5,
    tcmDv: 20,
    entryKms: 5.7,
    description: 'The cheapest trip, and the slowest arrival: the capsule meets the air at 5.7 km/s and goes straight in, with no orbit first.',
    realWorld: 'Mars landers usually enter directly from their interplanetary trajectory at 5 to 6 km/s, as Curiosity (2012) and Perseverance (2021) did.',
  },
  {
    id: 'fast',
    name: 'Fast transfer (~7 months)',
    insertionDv: 0,
    transferMonths: 7,
    tcmDv: 20,
    entryKms: 6.1,
    description: 'Six weeks sooner on the ground. The capsule enters faster, so the heat shield must be thicker and heavier.',
    realWorld: 'Heat on the shield grows steeply with entry speed: a faster arrival means a thicker heat shield.',
  },
]

/** Days of interplanetary cruise of a Mars route (aerobraking adds months at Mars after an ordinary cruise). */
export const AEROBRAKE_MONTHS = 5
export function marsCruiseDays(route: Route): number {
  return (route.id === 'aerobrake' ? route.transferMonths - AEROBRAKE_MONTHS : route.transferMonths) * (365.25 / 12)
}

export function routesFor(orbitId: string): Route[] {
  return ROUTES[orbitId] ?? []
}

export function getRoute(orbitId: string, routeId?: string): Route | null {
  const list = routesFor(orbitId)
  if (!list.length) return null
  return list.find((r) => r.id === routeId) ?? list[0]
}

/** Default trajectory-correction reserve: twice the expected need + 10 m/s (what is left after arrival funds station-keeping). */
export const defaultTcmReserve = (r: Route) => 2 * r.tcmDv + 10
