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

- Local session (2026-11-02, cloud out of credits — the local chat does everything for now): **soundtrack in the game.**
  The user's favourite ACE-Step 1.5 songs (version A), loudness-normalised to −16 LUFS: "Beneath the Misti" → menu/home,
  "Paulet's Fire" → launch, "Lagrange" → results (it had no music). Design and flight keep their loops. Old ElevenLabs
  home/launch tests removed. `MUSIC` map only (engine logic untouched); CREDITS.md entry (ACE-Step 1.5 MIT, AI disclosed).
  Tests 83 passing, build passes; browser: all five stage tracks load (200). Not listened to by a human yet.

- Local session (2026-11-02): **final intro in the game.** `src/assets/video/intro.mp4` = `C:\PPgame\intro_paulet.mp4`
  (style A "Painted cinema", HyperFrames source `C:\PPgame\intro-a`) re-encoded to 720p H.264 CRF 27 (4.4 MB, SSIM 0.965
  vs the 1080p master). Its captions are burned in, so the `<track>` and `intro.en.vtt` were removed (no double captions).
  Tests 83 passing, build passes; browser: Extras → Watch intro plays 1280×720, 31 s, no text tracks.

- Local session (2026-11-02): **final trailer + manuals.** Trailer (54 s, style A) built in HyperFrames at
  `C:\PPgame\trailer-final` (`build.mjs`: one scene per shot, camera moves, titles, satellite crossing): the user's 8 Gemini
  stills in STORYBOARD order (upscaled ×4 with Real-ESRGAN), music "Beneath the Misti" cut to the song (first cut on the drum
  entry at 10.85 s, bar-aligned jump to the song's real ending), launch SFX, logo "Paulet — Andes to Orbit". Output
  `C:\PPgame\trailer_paulet.mp4` (1080p, −14 LUFS) + 720p. The rooftop ending (shot2 + animated satellite) was approved by the user and stays;
  Gemini first/last-frame clips (v1–v7) will replace the stills later.
  `docs/PLAYBOOK.md` written for the definitive game (stack, hard-won rules, media pipeline, NASA sources, order of work).
  Also outside the repo: a Spanish learning manual for the owner (artifact) and `MEJORAS_DESDE_PAULET.md` for Goicochea Studio.

- Local session (2026-11-03): **Three.js launch, delivery 1** (CLOUD_NEXT §3). `src/ui/launch/three/LaunchScene3D.tsx`
  (lazy chunk, precached offline) driven by the game timeline through `ascent.ts` (pure, 8 tests): pad, lattice tower with
  service arms, Andes + Misti on the horizon, cloud deck at ~650 m, stars, the three lights (dawn/day/night, same Settings
  choice as the SVG), a two-stage rocket sized per launcher with flame, smoke, Max-Q vapour, stage separation, fairing halves,
  failure explosion; the camera follows the rocket's framing and closes in on the upper stage after MECO. HUD, captions,
  countdown digits, deployed spacecraft (2D), booster-landing inset and every sound stay in LaunchSequence. SVG scene kept
  for reduced motion, no WebGL and the side-booster rockets (heavy, reusable_heavy). Checked in headless Chrome (real UI flow,
  Earth Watch on L-1): 61–121 fps, no console errors. Tests 91 passing.
  Trailer fixed after the owner's review: Gemini's end-of-clip jumps (v2, v4, v5) cut and cross-faded; music jump moved into
  the song's quiet breath (40 s → 127.2 s, same passage) and ends on the song's own ending; 56 s.

- Local session (2026-11-03): **Three.js launch, delivery 2 done.** All six launchers in 3D: side boosters on heavy and
  reusable_heavy (drop just before MECO), legs + grid fins on reusables, and the player's **procedural spacecraft in 3D**
  (`src/ui/launch/three/spacecraft3d.ts`, built from the same `spacecraftVisual(design)` as the 2D drawing: bus, body/deployable/
  tracking arrays, antenna, radiator, thruster, every instrument shape). It rides in the fairing, pushes off at deployment and
  unfolds its arrays while the camera closes in; above the atmosphere the Sun lights it from the camera side. The 2D spacecraft
  overlay now only appears on the SVG fallback. Debug view: `?scene3d=<launcher>&pad=&t=&mission=&inst=&array=&area=`.
  Checked in headless Chrome (debug views + the real Earth Watch flow): 121 fps, no console errors. Tests 91 passing.

- Local session (2026-11-05): **Three.js launch, delivery 3 done — the 3D launch is complete.**
  - Booster recovery in 3D: a second small scene (ocean, drone ship, returning booster with legs, grid fins and landing burn)
    drawn in an inset with scissor; landed or lost at sea from the mission roll (`boosterLandingAt`, tested); HTML labels
    over the same box. The SVG inset stays for the fallback.
  - The curved Earth above the atmosphere (`makeEarth` in `three/common.ts`: textured sphere + thin atmosphere, rotated so the
    equator faces up); the flat ground and the Andes hide when it appears; the camera looks slightly down in space.
  - Failure: the scene freezes where the rocket broke up (the camera no longer keeps climbing); smaller blast in close-ups.
  - Paulet-1 prologue in 3D (`three/SoundingScene3D.tsx`, lazy): brass-and-copper rocket on an 1890s rail with a blockhouse,
    smoke, gold 100 km ring, Earth's curve above 60 km, nose-down fall and parachute. Flight profile moved to
    `src/ui/hub/soundingProfile.ts` (pure, tested) and shared with the SVG fallback.
  - Shared 3D helpers in `three/common.ts`; WebGL check in `three/support.ts` (no three.js import, keeps the main bundle small).
  - Checked in headless Chrome: debug views (`?scene3d=reusable_medium|reusable_heavy&landed=0|medium&fail=…|paulet[&fail=1]`)
    and the real game (Earth Watch on L-1 and on R-2 with the landing inset, and with reduced motion → SVG): 119–121 fps,
    no console errors. Tests 98 passing.

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
12. The user chose mock-up 3, "modern space-agency HUD". Applied to the whole game: the launch site blurred behind every
    screen, glass panels with corner brackets, light titles, sky-blue labels, one orange call to action; main menu, design,
    free-mission and settings rebuilt as in the mock-up, the rest restyled through a theme layer (`.hud` in `src/index.css`).

## How to run
```
npm install
npm run dev
npm test
npm run build
```

## Deploy
Public link (2026-11-06): https://paulet-andes-to-orbit.vercel.app/ — Vercel, owner's Hobby account, project
`paulet-andes-to-orbit`, production branch `main` (PR #1 merged `cloud/fase-1`). Checked in headless Chrome: HTTP 200, no console
errors, service worker active, 87 files precached, reload with the network cut still works. Pushes to `cloud/fase-1` only make
preview deployments; the public link updates when `cloud/fase-1` is merged into `main` (PR).

## Open risks
- Balance is first-pass: reference designs score ~850–950; human players will likely score lower. Retune after playtests.
- Recharts bundle ~570 kB (warning only).
- ElevenLabs licence for public/commercial use not verified (LOCAL_TODO) — now only design/flight loops, voice and SFX; the songs are ACE-Step (MIT).

## Definitive game
13. Public link on Vercel (2026-11-06), animation libraries installed (postprocessing, GSAP, Motion, Theatre.js, Rive).
14. Languages, delivery 1 (2026-11-08): English is the default; the first boot asks English / Español (both written in
    themselves; keyboard and mouse), Settings switches it live, `<html lang>` follows. Boot, main menu and Settings are
    translated; the rest of the game moves to the tables in delivery 2 (586 candidate strings left, see
    `node scripts/i18n/find-hardcoded.mjs`). Checked in headless Chrome: picker → Spanish menu → Settings in Spanish →
    back to English, no picker on the next boot, no console errors. 102 tests pass.

15. Languages finished (2026-11-08): every screen, lesson, review message, catalog item, flight event and report line in Spanish
    (Gemini extracted the UI; Claude moved the engine sentences to key + params, translated all 1 187 strings and fixed two
    Gemini bugs: route ids and the id `none` collided between categories). Intro re-rendered without burned-in captions; the
    game draws them word by word per language. Checked in headless Chrome, both languages: menu, free mission, 5 lessons, intro
    captions, career, prologue, all design tabs of two scenarios, launch pad, launch captions, flight decisions and report: no
    console errors, no raw keys, no horizontal scroll. 106 tests pass.
16. Rocket Engineer pad, delivery 1 (2026-11-11): pure rocket engine and parts catalog. Presets match the catalog launchers'
    LEO capacity (light 320 vs 300 kg, medium 2 500 vs 3 000, reusable 2 040 vs 2 100, heavy 15 660 vs 15 000). 121 tests pass.
17. Rocket Engineer pad, delivery 2 (2026-11-12): the workbench screen. Editing helpers keep each tank on its engine's fuel;
    review codes are typed (`ROCKET_ISSUE_CODES`) and a test checks every code has EN/ES text. Checked in headless Chrome in
    English and Spanish: opens from the menu, presets, a broken design (vacuum engine on stage 1), legs without fins; no
    console errors, no raw keys, no overflow. 125 tests pass.
18. Rocket Engineer pad, delivery 3 (2026-11-12): the rocket in 3D. `src/engine/rocketLayout.ts` is the pure blueprint in
    metres (same height as `analyzeRocket().heightM`); `src/ui/launch/three/rocket3d.ts` builds the Three.js model from it
    (one group per stage with its interstage, nozzles in a ring up to 9, boosters in pairs, ogive fairing in two halves, legs,
    grid fins). Workbench: 3D viewer (`RocketViewer3D`, drag or arrow keys, a 1.8 m figure for scale) with the side view as a
    tab and as the fallback without WebGL. Launch: `LaunchScene3D` takes `rocket` (a `RocketDesign`) and flies it on the same
    timeline: boosters drop at MECO - 0.4 s, stage 1 at MECO, a middle stage halfway to SECO (`stagingTimes`), fairing opens,
    reusable first stages land in the inset. The rocket is scaled to the pad (34 to 62 m, `launchDisplayScale`). Debug:
    `?scene3d=custom` (workbench rocket) and `&preset=heavy`. `LaunchSequence` already passes the workbench rocket when the
    launcher id is `custom` (nothing selects it yet: delivery 4). Realism pass on every 3D launch: bloom + vignette + filmic
    tone mapping through `postprocessing`, an environment map made from the pad's own sky (`makeEnvironment`), softer flame
    core. Checked in headless Chrome: workbench with the four presets, drag, a third stage, side-view tab; launches of
    reusable_heavy (before/after), custom heavy (day), reusable medium (dawn) and a 3-stage rocket with 4 boosters (night);
    no console errors. 145 tests pass (`tests/rocket3d.test.ts` is new).
19. Rocket Engineer pad, delivery 4 (2026-11-13): the pad joins the missions and the career.
    - **Your rocket as a launcher:** `Design.customRocket` (a copy of the workbench rocket, taken when it is chosen) and
      `resolveLauncher(design)` in `src/engine/launch.ts`; the review, the simulation, the launch pad and the launch
      sequence use it instead of `getLauncher(design.launcherId)`. Orbit tab: a "Your rocket" card after the catalog
      launchers, a button to open the workbench (its back button returns to the mission) and one to take the latest
      workbench version. A rocket with a design error has zero capacity (`LAUNCHER_NO_TARGET`). A `custom` design without a
      readable rocket falls back to the medium launcher.
    - **Career:** open once `commercial_launchers` is unlocked (`customRocketAllowed`). Parts need technology
      (`rocketPartTech`, `missingRocketTech` in `campaign.ts`): legs and grid fins = `reusable_medium`; hydrogen engines and
      tanks, the large booster and the 5.2 m fairing = new tech `hydrogen_stages` (20 M, 80 prestige); methane engines and
      tanks = new tech `methane_engines` (30 M, 150 prestige). Kerosene parts are free. The workbench marks locked parts
      with a padlock and says what is missing; the lock is enforced in the Orbit tab. Free play has no locks.
    - **Calibration:** K-8 engine 3.5 -> 8 M, M tanks 1.2 -> 3 M (x fuel share), reused first stage 30 % -> 50 % of a new
      one, and a new design is 3 % less reliable than its parts (`NEW_DESIGN_RELIABILITY`). The four presets now cost
      within 15 % of their catalog launchers and are within 0.04 of their reliability (tested).
    - **Lesson 4, "Why rockets have stages":** `stagedDvMs()` splits the same propellant into 1 to 4 stages against the
      9.4 km/s of low Earth orbit; lessons on chaos and Paulet are now 5 and 6.
    Checked in the browser: card chosen in a free mission, launch pad and 3D launch with "Your rocket"; lesson; in headless
    Chrome (Spanish) the two new technologies on the career screen and the workbench notice for medium / heavy / reusable;
    no console errors. 160 tests pass (`tests/customLauncher.test.ts` is new).
20. Astrobiologist pad (2026-11-13): the astrobiology lab, Home → Extras, also opened from a mission's Payload tab (it can
    send its instruments back to the mission). Pure engine `src/engine/astrobio.ts` (docs/model.md §21): six worlds with
    what is expected there, nine lines of evidence, an instrument × evidence sensitivity table over the existing instrument
    catalog, observing time with diminishing returns, a downlink budget (data that does not fit is lost), three questions
    in order (water → habitability → biosignatures) and typed review codes `ASTRO_*`. Screen
    `src/ui/astro/AstroScreen.tsx`, store `src/store/astro.ts` (`ppgame.astro.v1`). Texts live only in en.json / es.json
    (`astro.*`, 100 keys; a test checks every world, line, instrument and code has its text). No 3D view in this pad.
    Checked in headless Chrome in Spanish and English: opens from the menu, world change, instruments on and off, a
    data-hungry imager on Europa's thin link; no console errors, no raw keys, no overflow. 169 tests pass.
21. Astrobiology lab in 3D (2026-11-13): `src/ui/astro/WorldViewer3D.tsx` (lazy, WebGL only): a procedural globe per world
    (canvas texture from a seeded RNG, no image files), atmosphere for Earth / Mars / Titan, the spacecraft on a polar orbit,
    Enceladus' plume, and "Look inside" for worlds with a hidden ocean (thin crust, blue ocean, rocky core). Checked in
    headless Chrome: Europa inside, Enceladus; the button only shows where an ocean is expected.
22. Asynchronous multiplayer, first step (2026-11-13): challenge links, no server. `src/store/share.ts`:
    `encodeChallenge` / `decodeChallenge` / `challengeUrl` (`#c=`: scenario, seed, score to beat, name) and
    `challengeVerdict` (a flight only counts with the same scenario and seed). Results screen: "Challenge a friend" copies
    the link. Opening it starts that scenario with a fresh design and the challenger's seed; banners on the briefing and
    the launch pad, win / tie / lose on the results. Changing the seed or flying a random one drops out of the challenge.
    Checked in the browser: the link opens the scenario with its banner. The results banner was not flown end to end
    (its verdict is unit-tested). 173 tests pass (`tests/challenge.test.ts` is new).

## Next exact step
The user compares the launch-renderer prototypes (`?proto=pixi` vs `?proto=three`, built by the local chat); the winner
replaces the SVG launch scene with the motion list in CLOUD_NEXT item 3 (restyled in the HUD direction). The local chat
tests the Windows installer from GitHub Actions (Desktop build → Artifacts).
