// Captions of the intro video. The video has none burned in: the game draws them, so each language gets its own.
// Timings are the speech segments of the narration (same table as C:\PPgame\intro-a\build.mjs). The voice stays English.

/** The narration starts this far into the video. */
export const INTRO_DELAY_S = 0.5

/** [start, end, index of the `intro.caption.N` string], in seconds of narration. */
export const INTRO_SEGMENTS: readonly (readonly [number, number])[] = [
  [0.05, 1.085],
  [1.688, 3.667],
  [4.039, 6.04],
  [6.611, 7.7],
  [8.239, 10.362],
  [10.816, 13.991],
  [14.392, 17.756],
  [18.326, 20.004],
  [20.439, 20.857],
  [21.338, 22.283],
  [22.756, 23.392],
  [23.958, 25.5],
]

export interface CaptionWord {
  word: string
  /** When the word is spoken (seconds of video). */
  at: number
}

export interface CaptionCue {
  start: number
  end: number
  words: CaptionWord[]
}

/** Words share a segment's time by length; cues are at most `maxWords` long and never cross a segment. */
export function buildCues(texts: readonly string[], maxWords = 4): CaptionCue[] {
  const cues: CaptionCue[] = []
  INTRO_SEGMENTS.forEach(([a, b], s) => {
    const words = texts[s].split(' ').filter(Boolean)
    const weights = words.map((w) => w.replace(/[,.:?¿¡!…]/g, '').length + 2)
    const total = weights.reduce((p, c) => p + c, 0)
    let t = a
    const timed = words.map((word, i) => {
      const entry = { word, at: t + INTRO_DELAY_S }
      t += ((b - a) * weights[i]) / total
      return entry
    })
    for (let i = 0; i < timed.length; i += maxWords) {
      cues.push({ start: timed[i].at, end: b + INTRO_DELAY_S + 0.45, words: timed.slice(i, i + maxWords) })
    }
  })
  // A cue ends when the next one starts, if that comes first.
  cues.forEach((c, i) => {
    const next = cues[i + 1]
    if (next) c.end = Math.min(c.end, next.start)
  })
  return cues
}

export function cueAt(cues: readonly CaptionCue[], t: number): CaptionCue | null {
  return cues.find((c) => t >= c.start && t < c.end) ?? null
}
