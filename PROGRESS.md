# PROGRESS

**Current phase:** Phase 3.5 Act 2 (Moon, Lagrange, three-body) — DONE (branch `cloud/fase-1`, 2026-11-02).
**Next:** Phase 3.6 / Act 3 planning (Mars: launch windows + entry-descent-landing), or polish after local tasks (launch-pad art).

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

- Phase 3 (part 1):
  - Procedural spacecraft drawing from the design, visible in the design sidebar, inside the fairing on the launch pad, at deployment and in flight (journey view: orbit, eclipse, transfer to the Moon with ion plume).
  - New launch pad: rocket per launcher (Heavy with boosters), countdown, liftoff smoke, Max-Q, staging, fairing separation, orbit insertion, array deployment, HUD telemetry (T+, altitude, velocity, Δv), educational captions, seed-dependent failure moment.
  - Audio: music per stage (A home, B launch), crossfade loops, mute toggle, unlock on first click; SFX hooks ready (files pending, LOCAL_TODO §5).
  - Typography: Space Grotesk + Inter in game and video script; `docs/video-style.md`; `CREDITS.md`; HANDOFF §19.
  - Tests: 46 passing (+ spacecraft visual mapping and launch timeline).

- Phase 3 (part 2 — Act 1 vertical slice):
  - Home hub (career, free mission, watch intro, learn, Paulet legacy, sandbox), profile (name, Dr./Eng., 3 levels), local save.
  - Prologue "First Light": Paulet-1 sounding rocket, suborbital flight animation, honest history card.
  - Career screen: contracts by act (Mars previews), investors with trust, funds/prestige, technology tree with real-world cards.
  - New launchers (Paulet-1, rideshare, R-2 reusable) with locks in the designer; booster-landing inset; rideshare neighbours.
  - New contracts: Andean Eye, Station Resupply (cargo), Storm Tracker (GEO); Sandbox.
  - Lessons: Newton's cannon (orbit), budgets, rocket equation (sliders), Pedro Paulet facts. Intro video (test) with captions.
  - Share link (design + seed). Tests: 66 passing. Browser: full career loop with no console errors; progress survives reload.

- Local session (2026-11-02): generated audio downloaded from ElevenLabs and added (LOCAL_TODO §5 done):
  voiced countdown (take B: `count_10…1`, `ignition`, `liftoff`), farewells (take B: `farewell_1…5`), music loops
  `design-focus` / `flight-ambient`, and the 10 SFX (loudness-normalised). Take B chosen because take A's countdown merges
  "one / ignition / liftoff" into one segment. `prepare_launch_audio.py`: farewell split uses 0.3 s pauses (0.6 s found none).
  Tests 66 passing; build passes once `intro.mp4` is present (see Open risks). Not listened to by a human yet.

- Cloud session (2026-11-02): `src/assets/video/intro.mp4` (720p, 30 s, 2.9 MB — the original encode) committed now that
  `.gitignore` allows `src/assets/video/*.mp4`; clean-checkout `npm ci && npm run build` verified.

- Audio pass (cloud): voiced countdown verified in Chromium (count_10…1 at 1 s steps, ignition at 10 s, liftoff + music B at 11.5 s,
  farewell, staging/fairing/deploy/orbit SFX, design/flight loops, alert SFX; no 404s). Fixed overlaps: "T-minus ten" fitted to 1 s,
  farewell after the liftoff call, clock T−0 = ignition.
- Phase 3.5 (Act 2):
  - Engine `threebody.ts`: CR3BP Earth–Moon, RK4 (deterministic arithmetic), Jacobi, L1/L2/L3, L2 Lyapunov orbit, butterfly experiment.
  - Routes (direct / flyby / low-energy) for lunar orbit and L2, correction reserve slider, chaos-dependent corrections in flight,
    halo drift events; new orbit "Earth–Moon L2 halo"; instruments IR telescope + low-frequency radio antennas.
  - Scenario + contract **Lagrange Observatory** (Act 2, after Lunar Pathfinder); **R-3 Reusable Heavy** tech.
  - UI: route cards + reserve slider + real L2 orbit view (Orbit tab), L2 journey view, **lesson 4 "Three bodies & chaos"**.
  - Tests: 77 passing (Lagrange points, Jacobi, periodicity, determinism snapshot 1e-12, butterfly, Lagrange designs/outcomes).
  - Browser: lesson 4 + full Lagrange mission (low-energy route, drift decisions) → 901/1 000, no console errors.

- Local session (2026-11-02, after the user's playtest): audio engine on the Web Audio clock (scheduled, cancellable
  cues; one music track; ducking) fixing the "countdown at random moments" and overlapping songs; the three launch lights
  (dawn/day/night) chosen by the launch window. Tests 78 passing; browser: cue times checked (one count per second,
  ignition/liftoff/farewell on time), full launch with no new console errors. Not listened to by a human yet.
  Next steps for the cloud: `CLOUD_NEXT.md`.

## Project log for the final storytelling (HANDOFF §19.7)
1. Handoff written by the user; local session did Phase 0 (scaffold, CI).
2. Cloud session: analysis of the handoff → decisions (branch, defaults) → Phase 1 engine + design UI (evaluateDesign, Design Review).
3. Player-experience storytelling → user's vision (scientist vs society/economy, investors, roles, NASA data, music) → Pedro Goicochea, 4 roles, 3 difficulty levels.
4. Media tests with ElevenLabs (music A/B, 30 s intro) → Phase 2 (seeded simulation, events, bots, score, report).
5. User feedback (launch pad basic, typography, videos per format) → HANDOFF §19 → visual identity, spacecraft everywhere, new launch pad, per-stage audio.
6. Movie-style voiced countdown with ignition phase and varying farewell line; design/flight music loops generated; evaluation of rockets (reusables), Mars projects and the rest of Phase 3.
7. Paulet-1 as the starting rocket (the user's idea), rockets progression up to reusables, Act 1 career with investors, hub, lessons, share links; Mars planned for Acts 3–4.
8. Audio landed from the local session; voiced-countdown pass; Act 2: real three-body physics, routes, chaos lesson, Lagrange Observatory.
9. The local session delivered the illustrated launch scenery (dawn sky, Andes with the Misti, lattice tower, drone ship); the cloud
   session merged it with Act 2 and checked it against the voiced countdown in the browser (no overlaps, no errors).
10. Offline build (user's goal: "a game you download and play offline"): installable PWA that stores the whole game (code,
    fonts, audio, intro video — 10 MB) on the first visit and was tested with the network cut; Tauri 2 desktop wrapper and a
    GitHub Actions workflow (`Desktop build`) that produces the Windows installer (.exe/.msi, unsigned) as a downloadable
    artifact; versioned save files with export/import (Settings → Career save).
11. Game shell: fixed 16:9 stage (1440×810, zoomed to the window, letterboxed, no page scroll), "Press any key" boot screen
    (also the audio unlock gesture), main menu over the launch site with arrow-key navigation, Settings (Esc) with volumes
    per bus (music / effects / mission control), interface sounds, fullscreen (F11), launch light Auto/Dawn/Day/Night,
    motion, save export/import and offline install; screen transitions. Three art-direction mock-ups (`?mock=1|2|3`) wait
    for the user's choice.

## How to run
```
npm install
npm run dev
npm test
npm run build
```

## Deploy
Postponed by the user (LOCAL_TODO §1).

## Open risks
- Balance is first-pass: reference designs score ~850–950; human players will likely score lower. Retune after playtests.
- Recharts bundle ~570 kB (warning only).
- ElevenLabs licence for public/commercial use not verified (LOCAL_TODO).
- Vercel deploy postponed by the user.

## Next exact step
The user picks an art direction from `?mock=1|2|3` (notebook / retro console / modern HUD); then restyle every screen in
it. In parallel the local chat downloads the Windows installer from GitHub Actions (Desktop build → Artifacts) and tests it.
Launch-motion improvements (CLOUD_NEXT item 3) can start in SVG meanwhile.
