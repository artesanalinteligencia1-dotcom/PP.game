# LOCAL_TODO (tasks only the user / local Claude Code can do)

## 1. Vercel deploy — needs the user
- **What:** import `artesanalinteligencia1-dotcom/PP.game` in Vercel (framework Vite, build `npm run build`, output `dist`),
  production branch `main` (merge `cloud/fase-1` first, or use the branch preview URL). Put the URL in README.
- **Why cloud can't:** the Vercel connector in the cloud session is logged into a **different account**
  (another email, team scope `cristhian-goicochea`) and asks for extra team authorisation. The cloud did not deploy
  there without confirmation. Either confirm that account is yours (then the cloud can deploy), or import from your own Vercel login.
- **Done when:** public URL shows the mission picker.

## 2. Merge Phase 1
- **What:** review and merge `cloud/fase-1` into `main` (PR on GitHub).
- **Why cloud can't:** merging is the user's decision.
- **Done when:** `main` contains the Phase 1 commits and CI is green.

## 3. Confirm ElevenLabs licence for public use
- **What:** check your ElevenLabs plan allows publishing generated music/voice/images in a public repo and a public game.
- **Why cloud can't:** depends on your account plan and terms.
- **Done when:** confirmed in DECISIONS.md; then generated media can go into `public/` with CREDITS.md entries.

## 4. NASA API key (later, user decision)
- **What:** create a free key at api.nasa.gov and store it as a GitHub secret (never in the repo) for the daily data snapshot.
- **Why cloud can't:** needs your account.

## 5. ✅ DONE (local, 2026-11-02) — Download the generated audio
Voice (take B), music loops and the 10 SFX are in `src/assets/audio/`. Remaining: the user listens once in the game.
All of it is already generated and paid for in the ElevenLabs flow "PP.game — media tests" (id `0LCbZREUNFxbn2azaj88`):
- `PLAN — Design focus loop (150 s)` and `PLAN — Flight ambient loop (150 s)` (music, approved, 4 500 credits)
- `VOICE — launch countdown` and `VOICE — farewell lines` (2 takes each; pick the cleaner one)
- the 10 `SFX …` nodes (below)
Then run: `python3 scripts/audio/prepare_launch_audio.py --countdown countdown.mp3 --farewells farewells.mp3 --design-loop design.mp3 --flight-loop flight.mp3`
(splits the voice into `count_10…1`, `ignition`, `liftoff`, `farewell_1…5`; the game switches to the 10-second voiced countdown automatically).

### 5b. Sound effects
- **What:** in ElevenLabs open the flow "PP.game — media tests" (id `0LCbZREUNFxbn2azaj88`), download the nodes "SFX …" and save them as
  `src/assets/audio/sfx/{countdown,liftoff,staging,fairing,deploy,orbit,explosion,alert,success,failure}.mp3`
  (normalise: `ffmpeg -i in.mp3 -af loudnorm=I=-18:TP=-1.5 -b:a 96k out.mp3`). The game picks them up automatically.
- **Why cloud can't:** the cloud environment's network policy blocks `elevenlabsusercontent.com`. Alternative: add that domain under
  Network access → Allowed domains in the cloud environment settings, then the cloud can do it.
- **Done when:** sounds play on the launch pad, in flight alerts and on the report.

## 6. Animated intro + video format tests (LOCAL, uses your PC)
- **What:** turn the 30 s intro test into an animated version and compare formats/styles as in HANDOFF §19.5
  (16:9 / 9:16 / 1:1; stills+camera vs 2.5D layers vs AI-animated clips vs game capture). Keep `docs/video-style.md`
  (palette, Inter/Space Grotesk, subtitle style) and end on the game's home screen.
- **Assets:** ElevenLabs flow "PP.game — media tests": scene illustrations S1–S3 (chosen: S1 left/1st, S2 2nd, S3 2nd), narration
  (voice "Marcus K – Calm Documentary Narrator"), music A (home) and B (launch). Script: `scripts/video/build_intro_test.py`
  (fonts in `scripts/video/fonts/`). Text and timings are inside the script.
- **Why cloud can't:** heavier animation tools and local AI on your PC; you asked to do it locally.
- **Done when:** one approved animated intro (16:9) + a short comparison of formats; chosen files listed in CREDITS.md.

## 7. Approve credits for the per-stage music loops (decision)
- **What:** two 150 s loops for "design" and "flight" (ElevenLabs estimate: 7 500 credits for both). Until then the game uses music A softly.
- **Done when:** approved and generated, or replaced by local AI music.

## 8. ✅ DONE (local, 2026-11-02) — Launch-pad art upgrade
Scenery layers live in `src/ui/launch/LaunchScenery.tsx` (inline SVG, see DECISIONS.md). Not done: per-launcher rocket sprites (optional);
the booster-landing inset was type-checked but not watched in the browser. Remaining: the user looks at it once.

Original task:
- **What:** replace the flat shapes of the launch scene with illustrated layers in the intro's style (docs/video-style.md):
  sky gradient by altitude, Andes range with the Misti volcano, launch pad + tower, clouds for the cloud-layer crossing, ocean + drone ship for
  the booster landing, Earth limb from orbit. Optional: rocket sprites per launcher (Paulet-1 brass/copper, L-1, M-2, R-2 with legs/grid fins, H-3 with
  boosters). Export as SVG or WebP layers (≤ 300 KB each) into `src/assets/launch/` and swap them into `src/ui/launch/LaunchSequence.tsx`
  and `src/ui/hub/SoundingSequence.tsx` (keep the timeline, captions and telemetry as they are).
- **Why local:** you can use the image tools on your PC at no credit cost; the cloud keeps the mechanics.
- **Done when:** the scene reads as "illustrated" at 1280×720 and on a phone, with no change to the timing or the tests.

## 10. Listen to the new audio engine (user)
- **What:** play one launch (any mission) and the Paulet-1 prologue: the countdown should be one number per second, no lines
  piling up, music never doubled, music lower while mission control speaks. Also try switching windows mid-countdown.
- **Done when:** the user confirms, or reports what still sounds wrong.

## 11. Test the offline builds (local, after CLOUD_NEXT §1)
- **What:** install the Windows build from GitHub Actions and the PWA; play with the network off.
- **Why local:** needs your PC (installer, SmartScreen warning for unsigned builds).

## 12. Art direction and renderer (user decisions, then local assets)
- **What:** pick one of the 3 coded mock-ups (CLOUD_NEXT §2) and the renderer for scenes (PixiJS 2.5D recommended).
  Painted layers / textures can then be made locally with image tools (credits only with explicit approval).

## 9. Opening a cloud session that can download from ElevenLabs
- In claude.ai/code: environment menu (session title bar) → Edit → Network access → add `elevenlabsusercontent.com` under Allowed domains
  (keep "allow package managers" ticked). Then start a **new** session in that environment on this repo (branch `cloud/fase-1`).
- Or do it from the local chat: your PC is not subject to the cloud network policy.
