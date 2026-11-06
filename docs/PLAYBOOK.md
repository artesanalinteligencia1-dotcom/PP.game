# PLAYBOOK — how to build "Paulet" again, without walking the whole road

Written 2026-11-02 by the local Claude session, at the end of the "base game" (Phases 0–4 + soundtrack, intro, trailer).
**Audience:** the session that builds the definitive game. Read this first; read HANDOFF/PROGRESS/DECISIONS only for details.
Explanations to the owner are in Spanish; code, docs and in-game text in English.

---

## 1. The project in ten lines
- **What it is:** an educational space-mission design game. You design a spacecraft (mass, power, Δv, instruments, budget),
  pick a launcher, launch it, fly the mission with decisions shared by four roles, and get a report that explains *why*.
- **Story:** Dr. Pedro Goicochea (fictional), a kid from Arequipa who grew up asking "how do you get up there?", inspired by
  Pedro Paulet (1874–1945), the Peruvian engineer who *claimed* a liquid-fuel engine test in Paris in the 1890s.
- **Acts:** prologue Paulet-1 sounding rocket → Act 1 Earth orbit career (investors, tech tree) → Act 2 Moon / L2 / three-body
  chaos → Acts 3–4 Mars (planned, locked).
- **Goal of the owner:** a game you **download and play offline**, later **multiplayer**; this repo is the *base*.
- **Name:** "Paulet: Andes to Orbit" — always from `src/brand.ts` (`GAME_NAME`, `GAME_SUBTITLE`, `GAME_TITLE`).

## 2. Stack that worked (keep it)
| Layer | Choice | Why it stayed |
|---|---|---|
| App | React 19 + Vite + TypeScript + Tailwind 4 + zustand | fast iteration, tests in Vitest |
| Engine | pure TS in `src/engine/` (`evaluate`, `simulate`, `score`, `report`, `threebody`, `rng`) | deterministic (seeded RNG) → replays, share links, async multiplayer later |
| Physics | simplified budgets + rocket equation; CR3BP with RK4 for Act 2 | real lessons, small code, unit-testable (Jacobi constant, L-points) |
| Audio | Web Audio clock (`src/audio/audio.ts`): `audio.schedule(cues)` + one music track with crossfade and ducking | the only thing that fixed "countdown at random moments" and songs overlapping |
| Offline | `vite-plugin-pwa` (precache everything) + **Tauri 2** Windows installer from GitHub Actions | the owner's main goal; tested with the network off |
| Shell | fixed 1440×810 stage with CSS `zoom`, boot screen = audio unlock gesture, Settings (Esc) | feels like a game, not a web page |
| Art | **mock-up 3 "space-agency HUD"** (glass panels, sky-blue labels, one orange action) | owner's choice among 3 coded mock-ups |
| Launch scene | **Three.js** (owner's choice over PixiJS), prototype `src/ui/proto/ThreeLaunch.tsx` | real 3D camera, lights dawn/day/night |
| Video | **HyperFrames** (HTML + GSAP → MP4) for intro and trailer | editable, deterministic, cheap |

## 3. Rules learned the hard way
1. **Never fire sounds from animation frames.** Schedule them on the audio clock at the start, cancel on skip/unmount.
   Drop cues more than 0.3 s late. One music track at a time.
2. **Determinism first.** Every random thing goes through `rng.ts` with a seed; tests snapshot results (1e-12 for three-body).
3. **Decide by showing.** The owner chooses fast between *built* options (3 mock-ups, Pixi vs Three, 4 intro styles), not
   from descriptions. Build small variants behind `?mock=` / `?proto=` flags, then delete the losers.
4. **Money:** never spend generation credits without saying the cost first (`estimate_only` exists in the ElevenLabs tools).
   Video AI = the owner generates in **Gemini/Veo** from our prompts; ElevenLabs = voice and images only. Music = local
   **ACE-Step 1.5** (free, MIT). One past mistake: ~15 300 credits spent on Kling video inside ElevenLabs without approval.
5. **Facts about Paulet are "claimed"**, never stated as proven. No real brands or agency logos (NASA insignia is not free to use).
6. **Burned-in captions ⇒ no `<track>`** on that video (double captions).
7. **Push** only from the owner's terminal tab (Git Credential Manager), after `git rebase origin/cloud/fase-1`. Never force-push.
8. **Dev server fails?** An old vite may hold `localhost:5173`; it is often this same project (`vite --host --force`) and can be reused.
9. **Loudness:** songs −16 LUFS (two-pass `loudnorm`), loops ≈ −20 LUFS, SFX normalised; mix levels live in the `MUSIC` map only.
10. **Big media:** 720p H.264 CRF ~27 for in-game video (SSIM ≥ 0.96 vs master); everything is precached offline, so size matters.

## 4. Workflow that worked
- **Two sessions:** a cloud session for mechanics, a local session for media, installers and anything needing the owner's PC.
  They talk through files: `CLOUD_NEXT.md` (local → cloud), `LOCAL_TODO.md` (cloud → owner/local), `PROGRESS.md`, `DECISIONS.md`
  (decision / alternative / reason). After every task: update PROGRESS + CLOUD_NEXT, commit, push.
- **Phases with a "done when"** line each; verify in a real browser (no console errors, full flow) before calling it done.
- **Owner feedback is quoted** (translated) in CLOUD_NEXT before acting on it.

## 5. Media pipeline (what each tool did)
| Asset | Tool | Where |
|---|---|---|
| Voiced countdown, farewells, SFX, early music tests, intro illustrations | ElevenLabs (credits, approved) | `src/assets/audio/`, `scripts/audio/prepare_launch_audio.py` |
| Soundtrack (5 songs, female vocals; 1, 2, 5 in game) | ACE-Step 1.5 local, RTX 5060 Ti | `C:\PPgame\soundtrack`, `SONGS.md` (captions + lyrics) |
| Intro (style A "Painted cinema", 31 s) | HyperFrames, `C:\PPgame\intro-a\build.mjs` (captions from narration timings) | `src/assets/video/intro.mp4` |
| Trailer stills | owner, Gemini, from `C:\PPgame\trailer\PROMPTS_GEMINI.md` | `C:\PPgame\trailer\gemini` |
| Trailer (54 s) | HyperFrames, `C:\PPgame\trailer-final\build.mjs` (one scene per shot, camera moves, titles, satellite) | `C:\PPgame\trailer_paulet.mp4` |
| Teaser (23 s, second trailer) | HyperFrames `C:\PPgame\trailer-test` (3 Kling clips, style A titles, logo) | `C:\PPgame\teaser_paulet.mp4` (+ 720p) |
| Upscaling stills ×4 | Real-ESRGAN (`pienza_studio\tools\realesrgan`) | before camera moves, so zooms stay sharp |

## 6. Start the definitive game here (recommended order)
1. **Keep the engine, rewrite the presentation.** `src/engine` + its tests are the asset; the UI can be rebuilt around the HUD direction.
2. **Ground it in official sources** (cite them in-game, "Learn" cards):
   - Rockets & flight basics: NASA Glenn *Beginner's Guide to Rockets*; JPL *Basics of Space Flight*.
   - Mission design process: *NASA Systems Engineering Handbook* (SP-2016-6105) — phases A–F, reviews, mass/power margins.
   - Trajectories: NASA **GMAT** (open source) to validate transfer Δv and L2 orbits; **JPL Horizons** for ephemerides.
   - Data/imagery: api.nasa.gov, images.nasa.gov, NASA SVS (Earth textures), NASA 3D Resources (glTF models; check each licence).
   - Mars acts: launch windows (porkchop plots from Horizons ephemerides), EDL budgets from mission fact sheets.
   - Usage rule: most NASA media is public domain, **but not the logo/insignia** and not third-party content inside it.
3. **Three.js launch** per CLOUD_NEXT §3 (one model per launcher, failure moment, booster landing, Andes + Misti, SVG fallback).
4. **Multiplayer:** start asynchronous (same seed + scenario, compare scores), then real-time co-op of the 4 roles with a server.
5. **Media:** music = ACE-Step (write `SONGS.md` first), stills = Gemini, animation = HyperFrames; voice = ElevenLabs only with a quoted cost.

## 6b. Owner's wishes for the definitive game (2026-11-03)
- **Language choice in the game** (Settings already has a language placeholder; `src/i18n` exists): at least English and
  Spanish, every in-game string through the i18n table, voice/captions per language.
- **Rocket Engineer pad:** a hands-on workbench for the rocket itself: its parts (stages, engines, tanks, fairing, boosters,
  legs/grid fins), materials and layout, with live mass / thrust-to-weight / Δv feedback. This is what the engineer role
  manipulates (today the game only lets you pick a launcher).
- **Astrobiologist pad:** a separate workbench for the science side: instruments, targets (biosignatures, water, habitability),
  observation plans and data budgets.
- Both pads reuse the 3D scene (`src/ui/launch/three/`) and the engine's pure evaluation functions, so every change is testable.

## 6c. More owner's wishes (2026-11-06)
- **Robot guide:** a companion robot (inspired by the *idea* of a helpful mission robot, but its own design — not a copy of
  any film robot) that explains whatever is hard to understand: contextual hints, "why did this fail?", first-time tutorials.
  Decide its look by showing 3 coded variants (rule 3.3). Its lines go through i18n (EN/ES) like everything else.
- **Role sessions:** one short animated video per role (Rocket Engineer, Astrobiologist, and the other roles) explaining what
  that profile does in a real mission and in the game, hosted by the robot guide. Made in HyperFrames (local, free); voice =
  ElevenLabs only with a quoted cost; AI video clips, if any, generated by the owner in Gemini from our prompts.
- **Higher animation/design quality:** the owner wants the game to feel like a richer, more complex game. Candidate tools
  (all free/MIT unless noted): `postprocessing` (pmndrs) for bloom/tone mapping/god rays in the Three.js scenes, GSAP (now
  free incl. plugins) for UI timelines, Motion for React screen transitions, Theatre.js for authored camera moves, Rive
  (free tier, web editor) for the robot's expressions, Figma (connected) for screen design before code.

## 7. Where things are
- Repo `artesanalinteligencia1-dotcom/PP.game`, branch `cloud/fase-1`, local clone `C:\PPgame\PP.game`.
- Media workspaces: `C:\PPgame\{intro-a,intro-styles,trailer,trailer-final,trailer-test,soundtrack,media_raw,tools}`.
- Owner's video compositor "Goicochea Studio": `G:\Mi unidad\MI\Trabajo\pienza mas\pienza_studio` (has Real-ESRGAN, RIFE, RVM, SAM2…).
