# GEMINI.md — handoff for the i18n extraction (Antigravity / Gemini CLI)

You are helping on "Paulet: Andes to Orbit" (React 19 + Vite + TypeScript, Vitest). Read this whole file first.
Talk to the owner in **Spanish**; write code, comments and English game text in **English**.

## Your job
Move every player-visible English string out of the code into `src/i18n/strings/en.json` and make the code read it
with `t()`. **Do not translate**: Spanish is done separately (a chat model translates chunks; see "After you").

## Ground rules
- Work on branch **`gemini/i18n`** created from `cloud/fase-1`. Commit file by file with clear messages.
  Never push to `main` or `cloud/fase-1`, never force-push. The owner opens the PR `gemini/i18n → cloud/fase-1`;
  Claude reviews it.
- **Do not change behaviour, layout, numbers or game logic.** Only text plumbing.
- **Do not touch:** `src/engine/simulate.ts`, `src/engine/campaign.ts`, `src/engine/score.ts`, `src/engine/report.ts`,
  `src/engine/evaluate.ts`, `src/audio/`, `src/ui/proto/`, `src/ui/mock/`, any test except adding keys, video/audio files.
  (The engine's event sentences need a code + params refactor; Claude does that.)
- Never call `t()` inside `src/engine/` — the engine is pure and has no React or store imports.
- Keep `GAME_NAME` / `GAME_SUBTITLE` from `src/brand.ts`; never write the game name by hand.
- After each file: `npm run typecheck` and `npm test` must pass, **except** the test
  "es has every English key" in `tests/i18n.test.ts`, which is expected to fail until the Spanish chunks are imported.

## The API (`src/i18n/index.ts`)
```tsx
import { useT, useTx, t } from '../i18n'      // adjust the relative path

function Panel() {
  const t = useT()                               // components: re-renders when the language changes
  return <h2>{t('design.title')}</h2>
}
t('settings.saved', { file: name })            // placeholders: "Saved {file}" in en.json
const tx = useTx()                             // data ids → keys, English fallback from the engine catalog
tx(`component.${inst.id}.name`, inst.name)
```
- Outside components (event handlers, helpers) import the plain `t` from `src/i18n`.
- Module-level constants with text (e.g. `const LABELS = { a: 'Mass' }`) become maps to **keys**
  (`{ a: 'resource.mass' }`) that are passed through `t()` at render time. See `BUS_LABEL` in
  `src/ui/shell/SettingsPanel.tsx` — it is the reference example; `HomeScreen.tsx` and `BootScreen.tsx` are done too.
- Template literals become placeholders: `` `Arrived in ${orbit}` `` → key `"…": "Arrived in {orbit}"`,
  `t('…', { orbit })`. Never build sentences by concatenating translated fragments (word order differs in Spanish).
- Plurals: use two keys (`*.one`, `*.other`) and pick in code.
- `fmt()` in `src/i18n/en.ts` already formats numbers for the current language — keep using it.

## Keys
- Dotted, lowercase, grouped by screen: `design.*`, `flight.*`, `results.*`, `learn.*`, `campaign.*`, `launch.*`,
  `review.*`, `orbit.*`, `component.<id>.name|description`, `scenario.<id>.*`, `route.<id>.*`.
- Reuse an existing key only when the meaning is the same in every context.
- Catalog data (`src/engine/catalog/*.ts`): **leave the English in the engine** (tests rely on it) and add the same text
  to en.json under `component.<id>.name` etc.; the UI shows it with `tx(key, fallback)`. The en.json value must be
  identical to the engine's English.

## Order of work (stop and report to the owner after each step)
1. Small UI files first: `SoundToggle`, `IntroScreen`, `ProfileDialog`, `ScenarioSelect`, `DesignScreen`, tabs
   (`MissionTab`, `PayloadTab`, `CommsTab`, `ReviewTab`, `OrbitTab`, `SpacecraftTab`), `Dashboard`, `ResultsScreen`,
   `JourneyView`, `OrbitDiagram`, `CR3BPView`, `LaunchScreen`, `FlightScreen`, `CampaignScreen`, `FirstLightScreen`.
2. `LaunchSequence.tsx`, `SoundingSequence.tsx`, `LaunchScenery.tsx` (captions and HUD labels; do not change timings or audio).
3. `LearnScreen.tsx` (long lesson texts: one key per paragraph).
4. `src/i18n/en.ts`: move its tables (`ROLE_LABEL`, `ROLE_BLURB`, `RESOURCE_LABEL`, `MESSAGES`, `REQUIREMENT_LABEL`,
   `GLOSSARY`, `CAUSE_TEXT`, `END_REASON_LABEL`) into en.json keys with placeholders, keeping the functions' signatures
   so callers do not change (the functions call `t()` inside).
5. Catalog keys (`component.*`, `scenario.*`, `route.*`) and the UI that shows them.

Progress meter: `node scripts/i18n/find-hardcoded.mjs` (count per file) and
`node scripts/i18n/find-hardcoded.mjs src/ui/X.tsx` (every hit). It has false positives; aim for zero real ones.

## After you (the owner does this with a chat model)
1. `node scripts/i18n/export.mjs es` → chunks in `docs/i18n/todo/es-01.json…`
2. The owner pastes `docs/i18n/PROMPT_TRANSLATE.md` + one chunk + `docs/i18n/GLOSSARY.md` into the chat, and saves the
   answer as `docs/i18n/done/es-01.json` (you may save it for them if they paste it to you).
3. `node scripts/i18n/import.mjs es docs/i18n/done/es-01.json` — it refuses chunks with unknown keys or broken
   placeholders. When all chunks are in, `npm test` must be fully green.
4. Check the game in Spanish: Settings → Language → Español; play the Paulet-1 prologue and one mission.

## Project rules that also apply to you
No real brands or agency logos; facts about Pedro Paulet are "claimed", never proven; no paid generation (images,
voice, video) of any kind; no secrets in the repo. Longer background: `docs/PLAYBOOK.md`.
