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
