# PROGRESS

**Current phase:** Phase 1 (engine + solo design) — DONE on branch `cloud/fase-1` (cloud session, 2026-11-02).
**Next:** Phase 2 (launch + `simulateMission` + seeded events + score + post-mission report).

## Done
- Phase 0 (local, `a995015`): scaffold Vite 8 + React 19 + TS + Tailwind 4 + Zustand + Recharts + Vitest, CI, handoff docs.
- Phase 1 (cloud, branch `cloud/fase-1`):
  - `src/engine/`: types, catalog (13 instruments, 3 launchers, 7 orbits, all subsystems, 8 ground stations),
    `orbit.ts`, `launch.ts`, `budget.ts`, `evaluate.ts` (`evaluateDesign`), scenarios Earth Watch + Lunar Pathfinder.
  - Design Review: red/amber/green with *why* + levers, per role (`src/i18n/en.ts`).
  - UI: mission picker → tabs Mission / Payload / Spacecraft / Orbit & Launch / Ground & Comms / Review, live resource
    dashboard with change deltas, one-orbit power chart, orbit schematic, solo "advisors" (4 roles talk).
  - `docs/model.md` documents every formula and constant. Screenshots in `docs/screenshots/`.
  - Tests: 27 passing (`tests/engine.test.ts`, `tests/evaluate.test.ts`), incl. known values (Kepler, eclipse, rocket
    equation, link budget), acceptance (instrument moves mass/power/data/cost), absurd designs, and 2 winning designs per scenario.
  - Verified in Chromium (Playwright): desktop + 390 px mobile, no console errors, no horizontal scroll.

## How to run
```
npm install
npm run dev        # local dev
npm test           # vitest
npm run build      # typecheck + production build
```

## Deploy
Not deployed yet — see LOCAL_TODO.md §1 (Vercel account mismatch).

## Open risks
- Recharts makes the bundle ~560 kB (warning only). Lazy-load charts in Phase 4 if load time matters.
- Balancing is first-pass; Phase 2 simulation may require retuning (log changes in DECISIONS.md).
- Videos (Phase 6) and in-app animated lessons (Phase 3) not started, by design (one phase at a time).

## Next exact step
Phase 2: `src/engine/simulate.ts` (weekly steps, seeded `mulberry32`), `events.ts`, `score.ts` (0–1 000, solo rescaled),
`report.ts` (top-3 causes), launch screen + mission timeline + results screen; tests "same seed + same design = same result".
