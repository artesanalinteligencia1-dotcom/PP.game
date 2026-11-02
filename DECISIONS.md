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
