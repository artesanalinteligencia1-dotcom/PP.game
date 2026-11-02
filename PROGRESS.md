# PROGRESS

**Current phase:** Phase 2 (launch + simulation + score + report) — DONE on branch `cloud/fase-1` (cloud session, 2026-11-02).
**Next:** Phase 3 — campaign ("career"), player name, 3 difficulty levels, team roles/bots polish, save/share by link, hub, in-app lessons 1–3.

## Done
- Phase 0 (local): scaffold, CI.
- Phase 1: pure design engine (`evaluateDesign`), live dashboard, Design Review, Earth Watch + Lunar Pathfinder, `docs/model.md`.
- Phase 2:
  - Engine: `simulate.ts` (weekly, seeded, events with role-owned decisions, bots), `score.ts` (0–1 000 + rank), `report.ts` (top-3 causes).
  - UI: launch pad (seed, CSS/SVG launch animation with staging/explosion, skip, reduced-motion), mission control (play/speed,
    live gauges, chart, log, decision dialog, per-role You/Bot delegation + bot personality), mission report (score breakdown,
    causes + "what would you change", actual requirements, chart, redesign / fly again / new seed, local leaderboard).
  - Roles renamed to Mission Director / Spacecraft Engineer / Astrophysicist / Astrobiologist; protagonist Dr. Pedro Goicochea in the briefing.
  - Tests: 41 passing (determinism, replay with same decisions, 2 winning designs per scenario, launch failure, radiation death, bots, analysis).
  - Verified in Chromium: full flow design → launch → 9 human decisions → report (983/1 000), no console errors; mobile 390 px no horizontal scroll.
- Media tests (not in repo): 30 s intro test video (16:9, EN narration, word-by-word subtitles + .srt), 2 music tests. Script: `scripts/video/build_intro_test.py`.

## How to run
```
npm install
npm run dev
npm test
npm run build
```

## Deploy
Vercel project being linked from the cloud session (see README for the URL once live).

## Open risks
- Balance is first-pass: reference designs score ~850–950; human players will likely score lower. Retune after playtests.
- Recharts bundle ~570 kB (warning only).
- ElevenLabs licence for public/commercial use not verified (LOCAL_TODO).

## Next exact step
Phase 3: campaign map (contracts, investors, Funds + Prestige), player name, difficulty levels, save/share link, hub with Watch Intro.
