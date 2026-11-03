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
3. **Launch scene and rocket motion — ON HOLD, do not rework the SVG launch.** The local chat built two renderer prototypes
   with the same choreography (`src/ui/proto/launchScript.ts`): `?proto=pixi` (PixiJS 2.5D: painted parallax + particle
   smoke/flame) and `?proto=three` (Three.js 3D: lattice tower, shadows, following camera), each with `&light=dawn|day|night`
   and `&t=<s>` to freeze a moment. They load lazily and are not in the game flow. The user is comparing them; once chosen,
   the winner replaces the launch scene and the motion list below moves into it: ignition shake, hold-down release, arms swing
   away, slow first metres (T/W ≈ 1.3), gravity turn, flame lighting the pad, particle smoke, plume widening, Max-Q vapour,
   staging flash. Keep `makeTimeline`, the captions and the telemetry unchanged (tests).
   Until then work on §1 (offline build) and §2 (game shell).
4. **Multiplayer (later, online only)**: the engine is deterministic, so start asynchronous — same seed + same scenario,
   compare scores/leaderboard; real-time co-op (4 roles) needs a server and comes after.

## Rules that still apply
No secrets in the repo; no paid generation (ElevenLabs etc.) without the user's explicit approval; no real brands;
Paulet facts as "claimed"; UI/code in English, explanations to the user in Spanish; commit/push to `cloud/fase-1`, never force-push.
