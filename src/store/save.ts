// Save file format (versioned). The campaign lives in localStorage; players can also export it to a file and
// import it back (offline backups, moving between the web and desktop builds). Pure: no DOM, testable.
import { CONTRACTS, type CampaignState } from '../engine/campaign'
import { GAME_NAME } from '../brand'

export const SAVE_FORMAT = 'ppgame-save'
export const SAVE_VERSION = 1

export interface SaveFile {
  format: typeof SAVE_FORMAT
  saveVersion: number
  savedAt: string
  campaign: CampaignState
}

export function toSaveFile(c: CampaignState, now = new Date()): SaveFile {
  return { format: SAVE_FORMAT, saveVersion: SAVE_VERSION, savedAt: now.toISOString(), campaign: c }
}

export function saveFileName(c: CampaignState, now = new Date()) {
  const who = c.profile.name.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'player'
  return `ppgame-${who}-${now.toISOString().slice(0, 10)}.json`
}

const RANKS = ['Fail', 'Partial', 'Success', 'Outstanding']
const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v)
const KNOWN_CONTRACTS = new Set(CONTRACTS.map((c) => c.id))

/** Validates (and migrates, when the format grows) a campaign. Throws an Error with a player-readable message. */
export function validateCampaign(raw: unknown): CampaignState {
  const c = raw as CampaignState
  const fail = (why: string): never => {
    throw new Error(`This save file is damaged or from another game (${why}).`)
  }
  if (!c || typeof c !== 'object') fail('no campaign')
  if (c.version !== 1) fail(`unknown campaign version ${String(c.version)}`)
  const p = c.profile
  if (!p || typeof p.name !== 'string' || !['Dr.', 'Eng.'].includes(p.title) || !['cadet', 'researcher', 'director'].includes(p.level)) fail('profile')
  if (!num(c.fundsM) || !num(c.prestige) || !num(c.boostersLanded)) fail('numbers')
  if (!c.trust || !['agency', 'commercial', 'foundation'].every((k) => num(c.trust[k as keyof typeof c.trust]))) fail('investor trust')
  if (!c.completed || typeof c.completed !== 'object') fail('contracts')
  const completed: CampaignState['completed'] = {}
  for (const [id, r] of Object.entries(c.completed)) {
    if (!r || !num(r.best) || !num(r.seed) || !num(r.runs) || !RANKS.includes(r.rank)) fail(`contract ${id}`)
    if (KNOWN_CONTRACTS.has(id)) completed[id] = { best: r.best, rank: r.rank, seed: r.seed, runs: r.runs } // retired contracts are dropped
  }
  if (!Array.isArray(c.unlocked) || !c.unlocked.every((u) => typeof u === 'string')) fail('unlocked technology')
  if (!Array.isArray(c.history)) fail('history')
  return {
    version: 1,
    profile: { name: p.name.slice(0, 40), title: p.title, level: p.level },
    fundsM: c.fundsM,
    prestige: c.prestige,
    trust: { agency: c.trust.agency, commercial: c.trust.commercial, foundation: c.trust.foundation },
    completed,
    unlocked: c.unlocked,
    boostersLanded: c.boostersLanded,
    history: c.history,
  }
}

/** Parses an exported save file (or a bare campaign object from older builds). */
export function parseSaveFile(text: string): CampaignState {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`This is not a ${GAME_NAME} save file (not JSON).`)
  }
  const f = data as Partial<SaveFile>
  if (f && f.format === SAVE_FORMAT) {
    if (!num(f.saveVersion) || f.saveVersion! > SAVE_VERSION) throw new Error(`This save comes from a newer version of ${GAME_NAME}. Update the game first.`)
    return validateCampaign(f.campaign)
  }
  return validateCampaign(data)
}
