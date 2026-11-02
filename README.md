# PP.game — Space Mission Design

Design, launch and fly a space mission under real engineering trade-offs: **mass, power, data, budget, schedule and
lifetime**. Every choice moves at least two of them, and there is never a single right answer.
Inspired by the engineering spirit of Pedro Paulet and by chaos in orbital mechanics (coming in later phases).

> Simplified educational model — game values, not real engineering data.

![Payload tab with live resource dashboard](docs/screenshots/phase1-payload.png)

## Status
| Phase | What | State |
|---|---|---|
| 0 | Scaffold, CI | ✅ |
| 1 | Engine (`evaluateDesign`), live dashboard, Design Review, Earth Watch + Lunar Pathfinder | ✅ (branch `cloud/fase-1`) |
| 2 | Launch, seeded mission simulation, events, score, post-mission analysis | next |
| 3+ | Hub, team roles, save/share, lessons, 3-body module, Paulet mode, polish, videos | planned |

Live demo: _pending deploy_.

## How to play
1. Pick a mission (Earth Watch is the beginner one).
2. **Payload:** add instruments and set their duty cycle — watch the meters on the right react (with +/− deltas).
3. **Spacecraft / Orbit & Launch / Ground & Comms:** size arrays and battery, pick pointing, propulsion, orbit, launcher, radio and ground stations.
4. **Review:** red items block launch, amber ones are risky or wasteful; each explains *why* and *what to change*.

## Run locally
```bash
npm install
npm run dev
npm test
```

## Design decisions
- The simulation engine (`src/engine/`) is pure, deterministic TypeScript with no UI dependency — testable and reusable.
- All formulas and constants: [`docs/model.md`](docs/model.md). Decisions and assumptions: [`DECISIONS.md`](DECISIONS.md).
- Components and launchers are generic and fictional on purpose.

## Known limitations
- Two-body circular orbits, daily-average data and power; no real link-budget or thermal analysis.
- Launch and mission simulation not yet playable (Phase 2).

## License
MIT — see [LICENSE](LICENSE).
