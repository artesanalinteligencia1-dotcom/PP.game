# PROGRESS

**Current phase:** Phase 0 (scaffold) — DONE (local session, 2026-11-01). Next: Phase 1 (cloud).

## Done
- Repo cloned, `docs/HANDOFF.md` added (single source of truth for both sessions).
- Vite 8 + React 19 + TypeScript + Tailwind 4 + Zustand + Recharts + Vitest.
- Folder layout per HANDOFF §3 (`src/engine`, `ui`, `store`, `i18n`, `server`, `tests`).
- Seed engine: `rng.ts` (mulberry32), `budget.ts` (`deltaV`); 4 passing tests.
- CI: `.github/workflows/ci.yml` (typecheck, test, build).
- `.gitignore` extended (env, node_modules, dist, refs/, videos).

## How to run
```
npm install
npm run dev        # local dev
npm test           # vitest
npm run build      # typecheck + production build
```

## Deploy
Not yet deployed. See LOCAL_TODO.md (Vercel login/import).

## Open risks
- TypeScript 7 and Vite 8 are very new; if tooling breaks, pin to previous majors and log in DECISIONS.md.

## Next exact step
Cloud session: `git pull`, read `docs/HANDOFF.md` + this file, branch `cloud/fase-1`, start Phase 1
(catalog, `evaluateDesign`, resource dashboard, Design Review, scenarios 1 and 3).
