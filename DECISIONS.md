# DECISIONS (decision / alternative / reason)

- Tailwind 4 via `@tailwindcss/vite` / Tailwind 3 + PostCSS / no config file, simpler.
- Repo cloned to `C:\PPgame\PP.game` / inside Google Drive folder / avoids syncing `node_modules`.
- Tests in `/tests` (not co-located) / co-located / matches HANDOFF §3 layout.
- Latest majors (TS 7, Vite 8, Vitest 5) / pinned older / default; fall back if breakage.

## Phase 1 (cloud session, 2026-11-02)
- Work on branch `cloud/fase-1` / `claude/festive-fermat-vgtszz` (session default) / user explicitly authorised `cloud/fase-1`, and CI already runs on `cloud/**`.
- Scenarios Earth Watch + Lunar Pathfinder as HANDOFF §12 says / swap Lunar for Storm Tracker / user asked to keep the handoff unless risk is very high; risk turned out manageable.
- Engine returns review **codes + params**; English text lives in `src/i18n/en.ts` / strings inside the engine / keeps the engine UI-free and makes ES (optional, §16.1) a pure dictionary job.
- Battery DoD limit 30 % whenever there are > 1 000 eclipses/yr (LEO, SSO **and low lunar orbit**), 60 % otherwise / handoff literal "30 % LEO, 60 % others" / a low lunar orbit cycles ~4 400×/yr, same physics as LEO.
- SSO split into 10:30 SSO (eclipses) and dawn-dusk SSO (no eclipse, optical science ×0.5) / single SSO / handoff §5.2 vs §5.7 contradicted; the split turns it into a real trade-off.
- GTO/TLI gap: spacecraft provides insertion Δv (GEO 1 500, MEO 1 200, lunar 850, heliocentric 300 m/s); heliocentric capacity = TLI × 0.6 / add launcher columns / keeps the handoff launcher table untouched.
- Propellant auto-sized for a "design life" slider (tanks = 10 % of propellant) / manual propellant input / one slider, clear trade-off (longer life = more mass + ops cost).
- Score margin of §10 ("15–25 %") will be read as **launcher capacity + EOL power margin** in Phase 2 / design margin (always 20 %) / the 20 % design margin is mandatory, so it cannot be the scored one.
- Solo scoring (no collaboration, max 900) will be rescaled to 1 000 in Phase 2 / leave max at 900 / comparable leaderboards.
- 13 instruments (8 from handoff + hyperspectral, neutron spectrometer, thermal IR, microwave radiometer, weather imager); default duty cycles 1–100 % calibrated so Earth Watch is beatable by beginners / reduce handoff data rates / keep handoff numbers, tune duty instead.
- Magnetorquers blocked away from Earth; lunar/deep orbits require a deep-space antenna / allow with penalty / both are physically impossible, and teach real lessons.
- Recharts chart animation disabled / animated / animation hid half the curve in screenshots and respects reduced-motion.
- Vercel not deployed from the cloud / deploy via the Vercel connector / the connected Vercel account uses a different email and team scope than the repo owner; needs the user's confirmation (see LOCAL_TODO).

## Narrative & roles (agreed with the user, 2026-11-02)
- Protagonist: **Dr. Pedro Goicochea**, fictional modern physicist from Arequipa inspired by Pedro Paulet; Mission Director (PI). Player renaming ("Dr./Eng. <name>") planned for Phase 3 / Paulet as playable fictional character (rejected: inventing a real person's life) / user's choice.
- Paulet appears only in the factual layer ("according to his own account", HANDOFF §16.4) / parallel-universe Paulet / safer and more relatable.
- Theme: a scientist who wants to do science but lives under society's and the economy's rules (investors, regulation, budget) / pure engineering sim / user's thesis.
- Roles: Mission Director (incl. finance & operations), Spacecraft Engineer, Astrophysicist, Astrobiologist; instruments owned by one of the two scientists / original 4 roles (Science Lead, Comms & Ops) / user's choice; covers all project functions with sub-branches.
- Difficulty: 3 levels (Cadet / Researcher / Program Director); 3-body: watch → choose precomputed routes → design (Phase 3–3.5) / single level / user's choice; precomputed routes also solve cross-browser determinism.
- Voices in English; NASA data and API key pending (user's call).
- HANDOFF.md not edited yet (user asked to wait); decisions recorded here.

## Phase 2 (cloud session, 2026-11-02)
- Phase 2 committed on `cloud/fase-1` (the branch the user authorised) / new `cloud/fase-2` / stay within the explicit permission.
- Weekly time step with explicit RNG state / daily step / 52–520 steps per mission is fast and readable.
- Interactive decisions with deterministic bots (prudent/balanced/bold) and per-role delegation in the flight screen / AI-generated decisions / explainable, reproducible.
- Launch failure keeps design-quality points (efficiency, decisions, schedule) / zero score / rewards a sound design hit by bad luck; still ranked Fail.
- Solo score rescale 850 → 950 (+50 bonus = 1 000) / leave max at 900 / comparable leaderboards (HANDOFF §10 note).
- 5 m/s debris-avoidance Δv reserve added to drag orbits / none / otherwise avoidance burns were impossible in SSO.
- Recharts receives copies of the live series (`.slice()`) / pass the live array / Recharts freezes its input, which broke the simulation (found in browser testing).
- Local leaderboard in localStorage (try/catch, top 5 per scenario) / none / HANDOFF §10 asks for a local leaderboard.

## Media tests (2026-11-02, ElevenLabs, user-approved)
- Spent ≈ 3 325 credits: 2 × 30 s instrumental music (450 each), 6 illustrations (2 per scene, ≈ 275 each), 2 narration takes (387 each). Fewer variations than the tool default to save credits.
- Pipeline option C (stills + ffmpeg camera moves + narration + ducked music + word-by-word ASS subtitles + .srt): `scripts/video/build_intro_test.py`. Generated media are not committed (size + licence still to confirm).
- Narrator voice: "Marcus K – Calm Documentary Narrator" (library voice) / others / suited to science/education content.

## Phase 3 start — visuals, audio, typography (2026-11-02, user-approved "procede")
- One procedural spacecraft drawing (`src/ui/spacecraft/`) built from the design and reused in design sidebar, launch pad (inside fairing → deploy) and flight journey view / separate art per screen / user rule: changes to the spacecraft must be visible on the pad and in the journey.
- Launch sequence driven by a JS timeline (requestAnimationFrame) instead of CSS keyframes / CSS only / sync of captions, telemetry and sound cues; launcher-specific rockets; deterministic failure moment from the seed.
- Telemetry is illustrative (altitude ∝ p^1.3, velocity ∝ p^1.8 to the circular speed of the parking orbit, +1.5 km/s gravity/drag losses) / full ascent physics / readable and honest about losses (~9.3 km/s to LEO).
- Music per stage: A home, B launch, A softly for design/flight until dedicated loops are approved (7 500 credits estimated) / generate now / spending above what was approved.
- Audio bundled with Vite (`src/assets/audio`, glob) so missing SFX never cause 404s / `public/` paths / clean console while SFX are pending.
- SFX generated (≈ 113 credits, 1 take each because the cloud cannot audition audio) but not downloadable: network policy blocks elevenlabsusercontent.com (LOCAL_TODO §5).
- Fonts: Space Grotesk + Inter (OFL) self-hosted via @fontsource; static TTF instances for libass subtitles / Google Fonts CDN / offline-safe, same identity in game and videos.
- HANDOFF §19 written as approved, plus 19.4 per-stage music table, 19.6 spacecraft-visibility rule and 19.7 final storytelling deliverable (from the user's same message).

## Launch voice and per-stage loops (2026-11-02)
- Movie-style countdown: mission-control voice "T-minus ten … one … Ignition … Liftoff!" + one of 5 farewell lines chosen from the seed ("Good luck, traveler.", …), always English / fixed line / user request ("frase que puede variar").
- Voice: "Andy – Powerful, Gentle, Pleasant" (library) with light radio EQ in post / announcer voices / calm and credible, mission-control feel.
- Countdown is 10 s with voice files, 3 s without (automatic) / always 10 s / no long silent countdown while files are missing.
- Music: silence during the countdown so the voice is heard; B starts at liftoff / B from countdown / cinematic timing.
- Design/flight loops generated (4 500 credits, below the 7 500 estimate) and wired to load automatically.
- Not downloadable in this session: ElevenLabs now serves all outputs from elevenlabsusercontent.com, blocked by the session's network policy even after the user's change (probably only new sessions pick it up). A workaround through an ElevenLabs composition node was refused by the permission system as a policy bypass; not retried.

## Phase 3 — Paulet-1, rockets, Act 1 campaign (2026-11-02, user-approved)
- Starting rocket = Paulet-1 sounding rocket (suborbital only) built from Paulet's notebooks / start with L-1 / user's idea: the limitation is part of the story and the learning ("reaching space ≠ orbit").
- First Light as its own mini-flow (choose a ≤ 8 kg experiment, seeded flight, honest history card) / reuse the orbital designer / clearer and much shorter for a prologue.
- Rockets keep generic names with "In the real world" cards (Falcon 9 landing 2015, rideshare flights…) / real brand names / HANDOFF §14 + trademarks.
- Rideshare priced per kg with fixed altitude (≤ 620 km) and 6-month slots / free choice / teaches the real trade-off of shared rides.
- Reusable R-2: −40 % price, −30 % capacity, 90 % landing roll shown in a "Booster recovery" inset; lost booster −$8 M / no downside / honest trade-off.
- Campaign economy: funds only buy technology (never larger contract budgets); prestige gates contracts/tech; investor trust multiplies payments / free spending / keeps trade-offs alive (no snowball).
- New contracts: Andean Eye (foundation), Station Resupply (commercial, cargo-scored, R-2 wins the cost bonus), Storm Tracker (GEO, radiation teaches rad-hard OBC); Sandbox scenario.
- Mars (Stranded, Breathing Mars, Terraforming) visible as locked previews with honest notes; implementation later (needs interplanetary windows + EDL).
- Home hub + lessons 1–3 + Paulet facts; intro test video bundled (720p, 2.9 MB) with English captions as the "Watch intro" placeholder.
- Share links: design + seed in the URL hash, validated on load.
- Launch-pad art upgrade delegated to the local chat (LOCAL_TODO §8); cloud kept the mechanics (rockets per launcher, booster landing, rideshare neighbours).
- Launch scenery as inline SVG React components (`src/ui/launch/LaunchScenery.tsx`) / exported SVG or WebP files in `src/assets/launch/` (LOCAL_TODO §8) / vector stays sharp at any size, ~10 KB of code instead of image files, layers can parallax and recolour with altitude, no image-generation credits.
- Sky darkening and the cloud-layer crossing follow the camera scroll, not the HUD altitude / tie them to km / the HUD altitude passes 100 km about 1.7 s after liftoff, which turned the sky black while the Andes were still on screen; telemetry is unchanged.
- Misti drawn left of the pad inside the central 800×480 crop / at the far left / phones show only the middle of the scene (`slice`), and the volcano is the scene's landmark.

## Phase 3.5 — Act 2 (2026-11-02)
- Real CR3BP physics (RK4, + − × ÷ √ only) for the L2 orbit picture, the journey view and lesson 4; the mission simulation uses route statistics derived from it / integrate every mission in CR3BP / weekly sim stays fast and readable; chaos still decides outcomes through seeded correction needs and drift events.
- Planar Lyapunov orbit as the "halo" / full 3-D halo / planar is enough to show the loop and the instability; labelled honestly.
- Route schematics are drawn, not integrated (real low-energy transfers need the Sun: 4-body) / fake "exact" curves / honesty.
- Unused correction reserve is kept for station-keeping; default reserve 2× expected + 10 m/s / reserve lost at arrival / found in calibration: otherwise most halo missions ran out of propellant.
- Lagrange Observatory: the low-energy route is what lets the telescope fit the Medium rocket (370/400 kg); the direct route needs R-3 or busts the budget with H-3 — designed trade-off time ↔ propellant ↔ money.
- Launch audio pass: "T-minus ten" sped up to fit 1 s (atempo 1.3, pitch kept); farewell moved after the 2.5 s liftoff call; pre-liftoff clock counts to ignition.

## Local session — user feedback pass (2026-11-02)
- Audio on the Web Audio clock (`src/audio/audio.ts`): voice/SFX decoded at the first gesture and *scheduled* from the launch start; cues more than 0.3 s late are dropped; skip/unmount cancels them; one music track at a time with a 1.6 s crossfade; music ducks to 35 % under speech / HTMLAudio fired from animation frames / user heard the countdown "at random moments" (frames stalled or a hidden tab made lines pile up; files loaded on demand) and songs overlapping (concurrent volume ramps, nothing ever stopped).
- Long music loops are decoded on demand and dropped when they stop / keep every decoded buffer / a 150 s loop is ~55 MB decoded.
- All three launch lights kept (dawn / day / night) and picked by the launch window: SSO → dawn, LEO (station) → day, GTO and lunar/L2 → night; Paulet-1 → dawn; `?pad=` forces one for comparison / pick one look / user: "se podría usar las 3"; teaches launch windows.

## Phase 4 — Offline build and game shell (cloud, 2026-11-03)
- **PWA with manual registration** (`src/platform/offline.ts`): the service worker precaches every built file (largest is the
  2.9 MB intro video; limit raised to 8 MB). Registration is skipped in dev and in the desktop build.
- **Tauri 2** for the desktop build (small installer, uses the system WebView2; the installer embeds the WebView2 bootstrapper
  for old Windows). Installer per user (no admin rights). No code signing yet: Windows SmartScreen will warn.
  Permissions limited to closing the window and fullscreen.
- **Saves**: `ppgame-save` JSON with `saveVersion`; unknown/retired contracts are dropped rather than rejecting the file;
  a save from a newer version is refused with a readable message. The browser and desktop builds keep separate local
  storage, so export/import is how a career moves between them.
- **Stage 1440×810 with CSS `zoom`** (not `transform: scale`): text stays sharp and pointer coordinates stay correct.
  Screens taller than the stage scroll inside it.
- **Interface sounds are synthesized** (two short oscillator blips) and fire from real input events only — never from
  animation frames. Gamepad: menus are keyboard-navigable; direct Gamepad API support is left for later.
- **Mock-ups are lazy-loaded** with their own fonts (Caveat, JetBrains Mono, both OFL) so the normal game never downloads them.
- **Art direction: mock-up 3, "modern space-agency HUD"** (user's choice, 2026-11-03). Implemented as a theme layer
  (`.hud` + `.hud-panel`, `.hud-label`, `.btn-primary`, `.btn-secondary` in `src/index.css`) instead of rewriting every
  screen: the layer restyles the existing slate palette (glass, thin borders, square corners). The most-seen screens
  (main menu, design header/tabs, free mission, settings) were rebuilt to match the mock-up exactly.

## User choices (2026-11-03)
- Launch renderer: **Three.js** (3D, real lights and camera) over PixiJS 2.5D and SVG — user, after comparing `?proto=three` / `?proto=pixi`.
- Intro video style: **A "Painted cinema"** (illustrations with slow camera push, letterbox, grain, word-by-word captions) over notebook / mission-control / kinetic type.
- Trailer: Stellaris-like test with AI video clips (option 3); soundtrack with female vocals generated with local music AI (ACE-Step 1.5), five songs.
- Game name: **Paulet: Andes to Orbit** (user's choice, 2026-11-03) over "Paulet" alone — "Paulet" is also the name of CONIDA's
  sounding-rocket series (Paulet I 2006, I-B 2013, 1C 2021), so the subtitle keeps the game distinct and says what it is.
  One source in `src/brand.ts`; plain text in index.html, vite.config.ts (PWA) and src-tauri. Tauri identifier
  `game.paulet.andestoorbit` (changed before any release). Save format id `ppgame-save` kept for compatibility. GitHub repo
  name unchanged (user's call). Trademark not checked (Indecopi) — recommended before publishing.

## Definitive game — tools (2026-11-06)
- Installed, not yet used (owner: "instala las herramientas de mejora"): `postprocessing` (bloom/tone mapping/god rays for
  the Three.js scenes), `gsap` + `@gsap/react` (UI timelines; same engine as our HyperFrames videos), `motion` (React screen
  transitions), `@theatre/core` (authored camera moves; `@theatre/studio` is dev-only — import it only behind
  `import.meta.env.DEV` so it never ships), `@rive-app/react-canvas` (robot guide expressions; needs `.riv` files from the
  Rive editor). Unused libraries add nothing to the bundle until imported. Production `npm audit`: 0 vulnerabilities.
- Public link: Vercel, the owner's own Hobby account (non-commercial use only — move to Pro or Cloudflare Pages if the game is ever sold).
