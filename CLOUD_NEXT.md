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
User's order: 1 soundtrack ✅ · 2 intro_paulet.mp4 in the game ✅ · 3 final trailer (HyperFrames) ✅ · 4 Three.js launch (item 3 below).
- ✅ Soundtrack: `MUSIC` = home "Beneath the Misti", launch "Paulet's Fire", results "Lagrange" (ACE-Step 1.5, −16 LUFS);
  design/flight loops unchanged. Any new screen picks music through `useMusic(stage)` only.
- ✅ Intro: final 31 s video (720p, 4.4 MB) with burned-in captions; never add a `<track>` to it. Rebuild from
  `C:\PPgame\intro-a` (`node build.mjs`, then HyperFrames render) and re-encode to 720p if the narration changes.
- ✅ Trailer: `C:\PPgame\trailer_paulet.mp4` (54 s) from `C:\PPgame\trailer-final` (see its README). The rooftop ending with the animated
  satellite is approved and stays. Next for the trailer: the user's 7 Gemini first/last-frame clips (v1–v7, 8 s each) replace
  the stills; prompts in `C:\PPgame\trailer\PROMPTS_GEMINI.md`.
- ✅ `docs/PLAYBOOK.md`: read it first when the definitive game starts.
- Next: item 3 below (Three.js launch) — the user wants a usage estimate before it starts.

## Next, in this order
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
