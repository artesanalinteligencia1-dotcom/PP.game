// Transfer routes for destinations where the three-body problem matters (Moon, Earth–Moon L2).
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
