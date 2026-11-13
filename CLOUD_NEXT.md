# CLOUD_NEXT — what the cloud session does next

Written by the local session (2026-11-02) after the user's playtest. Read this first, then PROGRESS.md / DECISIONS.md.
When an item is done, mark it here and move the details to PROGRESS.md. Items for the user/local chat stay in LOCAL_TODO.md.

## User feedback (playtest, in their words, translated)
- "The countdown is heard at random moments." → **fixed locally** (see below); the user still has to listen.
- "Songs overlap at times." → **fixed locally** (one track at a time, ducking under speech).
- "The interface could be more artistic; it still looks like a web page."
- "The goal is a game you can download and play offline, like an offline game — except multiplayer."
- "The launch pad still needs work; the rocket's motion on the pad can improve."
- "About your 3 variants: we could use all 3." → **done locally**: the launch window picks dawn / day / night.

## Done locally in this commit (do not redo)
- `src/audio/audio.ts` rewritten on the Web Audio clock: `audio.schedule(cues)` returns a cancel function; voice/SFX are
  decoded at the first gesture; late cues are dropped; music = one track + crossfade, ducked under speech.
  `LaunchSequence` and `SoundingSequence` schedule all their sounds once at the start (with `elapsed` offset) and cancel on
  skip/unmount. Keep this pattern for any new timed sound (flight alerts, lessons): **never fire sounds from animation frames.**
- `LaunchScenery.tsx`: three lights through `<SceneryLight style>` + `launchWindowStyle(target)`; `?pad=dawn|day|night` forces one.

## Local session status (2026-11-02, cloud chat out of credits — local does everything for now)
User's order: 1 soundtrack ✅ · 2 intro_paulet.mp4 in the game ✅ · 3 final trailer (HyperFrames) ✅ · 4 Three.js launch (item 3 below): all 3 deliveries ✅ (2026-11-05).
- ✅ Soundtrack: `MUSIC` = home "Beneath the Misti", launch "Paulet's Fire", results "Lagrange" (ACE-Step 1.5, −16 LUFS);
  design/flight loops unchanged. Any new screen picks music through `useMusic(stage)` only.
- ✅ Intro: final 31 s video (720p, 5 MB) without burned-in captions; the game draws them in the player's language. Rebuild from
  `C:\PPgame\intro-a` (`node build.mjs --no-captions`, then HyperFrames render) and re-encode to 720p if the narration changes.
- ✅ Trailer: `C:\PPgame\trailer_paulet.mp4` (54 s) from `C:\PPgame\trailer-final` (see its README). The rooftop ending with the animated
  satellite is approved and stays. Next for the trailer: the user's 7 Gemini first/last-frame clips (v1–v7, 8 s each) replace
  the stills; prompts in `C:\PPgame\trailer\PROMPTS_GEMINI.md`.
- ✅ `docs/PLAYBOOK.md`: read it first when the definitive game starts.
- ✅ Three.js delivery 2 (2026-11-03, this session): side boosters on heavy/reusable_heavy (drop at MECO−0.4 s), legs + grid fins on
  reusables (legs still stowed), solar panels on the stand-in spacecraft, all six launchers in `LAUNCHERS_3D`. Debug view without
  playing the game: `?scene3d=<launcherId>&pad=dawn|day|night&t=<seconds>`. Procedural spacecraft in 3D done too
  (`spacecraft3d.ts`, deploys in 3D). **Delivery 3 next:** booster landing on the drone ship in 3D (replaces the SVG inset), Earth
  limb at altitude, failure check, Paulet-1 prologue (`SoundingSequence`) in the same scene, polish.
- ✅ Three.js launch delivery 1: `src/ui/launch/three/` (scene + `ascent.ts`). Next: delivery 2 = side boosters (heavy,
  reusable_heavy → add them to `LAUNCHERS_3D`), legs + grid fins on reusables, the procedural spacecraft in 3D; delivery 3 =
  booster landing on the drone ship, Earth limb, Paulet-1 prologue (`SoundingSequence`) in the same scene, polish.

- Teaser (2nd trailer, 23 s): `C:\PPgame\teaser_paulet.mp4` from `C:\PPgame\trailer-test`. Owner's wishes for the definitive
  game (language choice, Rocket Engineer pad, Astrobiologist pad): `docs/PLAYBOOK.md` §6b.

- ✅ Three.js delivery 3 (2026-11-05): 3D booster landing inset, Earth's curve, failure freeze, Paulet-1 prologue in 3D
  (`SoundingScene3D`). The base game is complete; next is the definitive game (PLAYBOOK §6 and §6b).

## Definitive game — owner's queue (2026-11-06)
1. ✅ Public link: https://paulet-andes-to-orbit.vercel.app/ (production = `main`; merge `cloud/fase-1` by PR to update it)
2. ✅ Language choice EN/ES (2026-11-08): the whole game is in `src/i18n/strings/{en,es}.json` (1 187 keys each). English is the
   default; first-boot picker and Settings switch. The engine emits messages (`src/engine/text.ts`: key + params, rendered by
   `useMsg()`), so new event sentences go in en.json + es.json, never inline. Catalog English stays in the engine and a test keeps
   it identical to en.json. Intro: caption-free video, captions drawn by the game per language (`src/i18n/introCaptions.ts`).
   Adding a language: `node scripts/i18n/export.mjs <lang>`, translate with `docs/i18n/PROMPT_TRANSLATE.md`, `import.mjs`.
3. Rocket Engineer pad (parts, live mass / TWR / Δv, 3D view), in 4 deliveries:
   **1 ✅ engine (2026-11-11):** `src/engine/rocket.ts` + `catalog/rocketParts.ts` (staged rocket equation, boosters, fairing,
   liftoff TWR, capacity per target, reuse, price, reliability, review codes `ROCKET_*`; `rocketToLauncher()`), 17 tests,
   docs/model.md §20. **2 ✅ workbench (2026-11-12):** Home → Extras → Rocket workbench (`src/ui/rocket/RocketScreen.tsx`,
   store `src/store/rocket.ts`, saved per device): stages, engines, tanks, boosters, fairing, legs/fins, presets, side view to
   scale, live mass / TWR / Δv / capacity / price / reliability, stage table, review in EN/ES (`rocket.*`, `rocketPart.*`).
   **3 ✅ 3D (2026-11-12):** `src/engine/rocketLayout.ts` (pure blueprint) + `src/ui/launch/three/rocket3d.ts` (model),
   viewer on the workbench (`src/ui/rocket/RocketViewer3D.tsx`), `LaunchScene3D` flies a `RocketDesign` (`rocket` prop,
   `?scene3d=custom[&preset=heavy]`), bloom / vignette / environment map on all 3D launches. **4 ✅ missions and career (2026-11-13):** `Design.customRocket` +
   `resolveLauncher()`, "Your rocket" card in the Orbit tab, parts locked by technology in the career (`rocketPartTech`,
   new techs `hydrogen_stages` and `methane_engines`), prices and reliability calibrated to the catalog, lesson 4 on staging.
   Ideas left: let the campaign save the rocket per career instead of per device, a 2D fallback drawing of the player's
   rocket for reduced motion (today it shows the medium launcher's SVG), flight history that raises reliability.
4. Astrobiologist pad ✅ (2026-11-13): `src/engine/astrobio.ts`, `src/ui/astro/AstroScreen.tsx`, PROGRESS item 20. Ideas
   left: tie the lab's evidence score to the science of career contracts, lock worlds by act, a 3D view of the world,
   a lesson on biosignatures and false positives.
5. Mars acts; asynchronous multiplayer (same seed)
Also wanted (PLAYBOOK §6c): robot guide, one animated video per role, richer animation/design (postprocessing, GSAP, Motion,
Theatre.js, Rive). Before each big task: quote the expected usage and propose it in deliveries.

## Next, in this order (base game — all done)
1. ✅ **DONE (cloud, 2026-11-03) — Offline build (the user's goal).** See PROGRESS step 10.
   - PWA: `vite-plugin-pwa`, precache everything (audio, video, fonts are already local — no external URLs in `src/`),
     manifest + icons, "installable" prompt. Done when the built game works with the network off after one visit.
   - Desktop: Tauri 2 wrapper (Windows first; macOS/Linux free), GitHub Actions workflow that builds the Windows installer
     as an artifact on tags/branch pushes. No code signing yet (needs the user). The local chat will install and test the .exe.
   - Saves already use localStorage; keep a versioned save format and add export/import of the save file (offline backups).
2. ✅ **DONE (cloud, 2026-11-03) — Game shell.** The user chose mock-up 3 (modern space-agency HUD); every screen is restyled
   (PROGRESS step 12). Mock-ups stay at `?mock=1|2|3` for reference.
   - Fixed 16:9 stage scaled to the window (letterbox), no page scroll, fullscreen toggle (F11 / button), keyboard + gamepad-friendly focus.
   - Main menu with title, Continue / New / Free mission / Learn / Settings / Quit (Tauri), loading screen, screen transitions,
     UI sounds (hover/click — reuse the SFX bus via `audio.play`).
   - Settings: volumes per bus (add `setBusVolume('music'|'fx', v)` to the engine, persisted), launch light Auto/Dawn/Day/Night
     (replaces `?pad=`), reduced motion, language placeholder.
   - **Art direction is the user's decision**: build 3 coded mock-ups of the main menu + design screen behind `?mock=1|2|3`
     and stop for the user to choose: (1) "Paulet's notebook" — paper, blueprint ink, hand-drawn icons for design screens +
     mission-control console for launch/flight; (2) retro-futurist console everywhere; (3) clean modern space-agency HUD.
     Use `docs/video-style.md` fonts/palette as the base.
3. **Launch scene in Three.js — USER CHOSE THREE.JS (2026-11-03). Go.** Start from `src/ui/proto/ThreeLaunch.tsx` +
   `launchScript.ts` (`?proto=three`) and replace the SVG launch scene in `LaunchSequence`:
   - Drive it from the game's `makeTimeline` (countdown, ignition, liftoff, max-Q, booster sep, MECO, fairing, SECO, deploy),
     the seeded failure moment and the booster landing; keep the captions, HUD telemetry and the audio cues as they are (tests).
   - One rocket model per launcher (Paulet-1 brass/copper sounding rocket, L-1, M-2, H-3 with side boosters, R-2/R-3 with
     legs + grid fins), the procedural spacecraft inside the fairing (port `SpacecraftDrawing` to a simple 3D or billboard).
   - The three lights stay (dawn/day/night from `launchWindowStyle`); add the Andes + Misti on the horizon (it is off-frame in the
     prototype), Earth limb at altitude, cloud layer crossing, booster landing on the drone ship.
   - Lazy-load three (separate chunk); keep a lightweight fallback (the current SVG) for reduced motion / no WebGL.
   - Use the same Three.js scene for the Paulet-1 prologue (`SoundingSequence`).
   PixiJS prototype can be deleted once the Three.js scene ships.
   **Intro video:** the user chose style A "Painted cinema" (local chat builds it in HyperFrames; nothing to do in the cloud).
4. **Multiplayer (later, online only)**: the engine is deterministic, so start asynchronous — same seed + same scenario,
   compare scores/leaderboard; real-time co-op (4 roles) needs a server and comes after.

## Game name (2026-11-03)
**Paulet: Andes to Orbit.** Use `GAME_NAME` / `GAME_SUBTITLE` / `GAME_TITLE` from `src/brand.ts` for any new text; never hard-code
the name. The local chat already renamed the boot screen, main menu, settings, save messages, PWA manifest and Tauri config.

## Rules that still apply
No secrets in the repo; no paid generation (ElevenLabs etc.) without the user's explicit approval; no real brands;
Paulet facts as "claimed"; UI/code in English, explanations to the user in Spanish; commit/push to `cloud/fase-1`, never force-push.
