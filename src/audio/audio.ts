// Music per game stage, mission-control voice lines and sound effects, all on the Web Audio clock.
// Audio stays silent until the first user gesture (browser rule) and can be muted; the preference is a
// per-viewer convenience kept in localStorage.
//
// Why Web Audio: voice and SFX are decoded up front and *scheduled* at exact times (the countdown no longer
// depends on animation frames, so a stalled or hidden tab cannot make lines pile up), every scheduled cue can
// be cancelled (skip, leaving the screen), there is only ever one music track plus a short crossfade, and the
// music ducks while mission control speaks.
import { useEffect, useSyncExternalStore } from 'react'

export type MusicStage = 'home' | 'design' | 'launch' | 'flight' | 'results' | 'none'
export type Sfx = 'countdown' | 'liftoff' | 'staging' | 'fairing' | 'deploy' | 'orbit' | 'explosion' | 'alert' | 'success' | 'failure'

// Bundled audio files (hashed by Vite). Missing files are simply absent → no 404s.
const MUSIC_FILES = import.meta.glob('../assets/audio/music/*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const SFX_FILES = import.meta.glob('../assets/audio/sfx/*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const VOICE_FILES = import.meta.glob('../assets/audio/voice/*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const music = (name: string) => MUSIC_FILES[`../assets/audio/music/${name}.mp3`]
const voiceSrc = (name: string) => VOICE_FILES[`../assets/audio/voice/${name}.mp3`]
const sfxSrc = (name: Sfx) => SFX_FILES[`../assets/audio/sfx/${name}.mp3`]
/** True when a voice line (e.g. 'count_10', 'ignition', 'farewell_1') is bundled. */
export const hasVoice = (name: string) => Boolean(voiceSrc(name))
/** Sound effects present in the bundle (see LOCAL_TODO if some are missing). */
export const AVAILABLE_SFX = Object.keys(SFX_FILES).map((k) => k.split('/').pop()!.replace('.mp3', ''))

/**
 * Stage → music. See HANDOFF §19.4: A (Andean-electronic) = home; B (cinematic) = launch.
 * Design and flight use their own loops when bundled (design-focus.mp3, flight-ambient.mp3), otherwise A softly.
 */
export const MUSIC: Record<Exclude<MusicStage, 'none'>, { src: string; volume: number } | null> = {
  home: { src: music('home-andean-electronic'), volume: 0.55 },
  design: music('design-focus') ? { src: music('design-focus'), volume: 0.4 } : { src: music('home-andean-electronic'), volume: 0.22 },
  launch: { src: music('launch-cinematic'), volume: 0.6 },
  flight: music('flight-ambient') ? { src: music('flight-ambient'), volume: 0.4 } : { src: music('home-andean-electronic'), volume: 0.16 },
  results: null,
}

const SFX_VOLUME: Partial<Record<Sfx, number>> = { liftoff: 0.9, explosion: 0.8, alert: 0.5 }
const VOICE_VOLUME = 0.95

const MUTE_KEY = 'ppgame.muted'
const CROSSFADE = 1.6
/** Music level while mission control speaks. */
const DUCK = 0.35
/** A cue that would start more than this late (s) is dropped instead of being played out of time. */
const LATE = 0.3

/** One scheduled sound, `at` seconds from the moment `schedule` is called (negative = already past). */
export interface Cue {
  at: number
  voice?: string
  sfx?: Sfx
}

interface Track {
  src: string
  gain: GainNode
  sources: Set<AudioBufferSourceNode>
  timer: number
}

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

class AudioEngine {
  muted = typeof window !== 'undefined' ? readMuted() : true
  unlocked = false
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private musicBus: GainNode | null = null
  private fxBus: GainNode | null = null
  private buffers = new Map<string, Promise<AudioBuffer | null>>()
  private stage: MusicStage = 'none'
  private track: Track | null = null
  private listeners = new Set<() => void>()

  subscribe = (fn: () => void) => {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
  private emit() {
    this.listeners.forEach((fn) => fn())
  }

  /** Call from a user gesture. Creates the audio graph, decodes the short clips and starts the current music. */
  unlock() {
    if (typeof window === 'undefined') return
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => undefined)
      return
    }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    this.ctx = ctx
    this.master = ctx.createGain()
    this.master.gain.value = this.muted ? 0 : 1
    this.master.connect(ctx.destination)
    this.musicBus = ctx.createGain()
    this.musicBus.connect(this.master)
    this.fxBus = ctx.createGain()
    this.fxBus.connect(this.master)
    this.unlocked = true
    // Voice and SFX are small: decode them now so a countdown never waits for a file.
    ;[...Object.values(VOICE_FILES), ...Object.values(SFX_FILES)].forEach((src) => this.load(src))
    this.applyStage()
  }

  setMuted(m: boolean) {
    this.muted = m
    try {
      localStorage.setItem(MUTE_KEY, m ? '1' : '0')
    } catch {
      /* ignore */
    }
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.05)
    this.emit()
  }

  setStage(stage: MusicStage) {
    if (stage === this.stage) return
    this.stage = stage
    this.applyStage()
  }

  private load(src: string) {
    let p = this.buffers.get(src)
    if (!p) {
      const ctx = this.ctx!
      p = fetch(src)
        .then((r) => r.arrayBuffer())
        .then((b) => ctx.decodeAudioData(b))
        .catch(() => null)
      this.buffers.set(src, p)
    }
    return p
  }

  private applyStage() {
    const ctx = this.ctx
    if (!ctx) return
    const t = this.stage === 'none' ? null : MUSIC[this.stage]
    if (t && this.track?.src === t.src) {
      this.track.gain.gain.setTargetAtTime(t.volume, ctx.currentTime, CROSSFADE / 4)
      return
    }
    this.stopTrack()
    if (!t || !t.src) return
    const gain = ctx.createGain()
    gain.gain.value = 0
    gain.connect(this.musicBus!)
    const track: Track = { src: t.src, gain, sources: new Set(), timer: 0 }
    this.track = track
    this.load(t.src).then((buf) => {
      if (!buf || this.track !== track) return
      const now = ctx.currentTime
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(t.volume, now + CROSSFADE)
      this.loop(track, buf, now)
    })
  }

  /** Back-to-back copies with a short crossfade, so loops that were not cut to the sample still sound seamless. */
  private loop(track: Track, buf: AudioBuffer, when: number) {
    const ctx = this.ctx!
    const fade = Math.min(CROSSFADE, buf.duration / 4)
    const end = when + buf.duration
    const src = ctx.createBufferSource()
    src.buffer = buf
    const g = ctx.createGain()
    src.connect(g).connect(track.gain)
    const first = track.sources.size === 0
    g.gain.setValueAtTime(first ? 1 : 0, when)
    if (!first) g.gain.linearRampToValueAtTime(1, when + fade)
    g.gain.setValueAtTime(1, end - fade)
    g.gain.linearRampToValueAtTime(0, end)
    src.start(when)
    src.stop(end)
    track.sources.add(src)
    src.onended = () => {
      track.sources.delete(src)
      g.disconnect()
    }
    // Queue the next copy half-way through this one: plenty of slack even if timers are throttled.
    const queueIn = Math.max(0, when + buf.duration / 2 - ctx.currentTime)
    track.timer = window.setTimeout(() => {
      if (this.track === track) this.loop(track, buf, end - fade)
    }, queueIn * 1000)
  }

  private stopTrack() {
    const tr = this.track
    const ctx = this.ctx
    if (!tr || !ctx) return
    this.track = null
    window.clearTimeout(tr.timer)
    const now = ctx.currentTime
    tr.gain.gain.cancelScheduledValues(now)
    tr.gain.gain.setValueAtTime(tr.gain.gain.value, now)
    tr.gain.gain.linearRampToValueAtTime(0, now + CROSSFADE)
    tr.sources.forEach((s) => {
      try {
        s.stop(now + CROSSFADE)
      } catch {
        /* already stopped */
      }
    })
    window.setTimeout(() => tr.gain.disconnect(), (CROSSFADE + 0.2) * 1000)
    // The long loops decode to tens of MB: do not keep them once they stop.
    if (Object.values(MUSIC_FILES).includes(tr.src)) this.buffers.delete(tr.src)
  }

  /**
   * Schedule voice lines and SFX on the audio clock. Returns a cancel function that silences everything it
   * scheduled (playing or still to come) — call it on skip and on unmount. Cues already too late are dropped.
   */
  schedule(cues: Cue[]): () => void {
    const ctx = this.ctx
    if (!ctx) return () => undefined
    const t0 = ctx.currentTime
    const items = cues
      .map((c) => ({ c, src: c.voice ? voiceSrc(c.voice) : c.sfx ? sfxSrc(c.sfx) : undefined }))
      .filter((x): x is { c: Cue; src: string } => Boolean(x.src) && x.c.at >= -LATE)
    const live = new Set<AudioBufferSourceNode>()
    let cancelled = false
    let ducked = false
    Promise.all(items.map((x) => this.load(x.src))).then((bufs) => {
      if (cancelled) return
      const speech: [number, number][] = []
      items.forEach(({ c }, i) => {
        const buf = bufs[i]
        const when = t0 + c.at
        if (!buf || when < ctx.currentTime - LATE) return
        const s = ctx.createBufferSource()
        s.buffer = buf
        const g = ctx.createGain()
        g.gain.value = c.voice ? VOICE_VOLUME : (SFX_VOLUME[c.sfx!] ?? 0.7)
        s.connect(g).connect(this.fxBus!)
        s.start(Math.max(when, ctx.currentTime))
        live.add(s)
        s.onended = () => {
          live.delete(s)
          g.disconnect()
        }
        if (c.voice) speech.push([when, when + buf.duration])
      })
      ducked = this.duck(speech)
    })
    return () => {
      cancelled = true
      live.forEach((s) => {
        try {
          s.stop()
        } catch {
          /* not started */
        }
      })
      live.clear()
      if (ducked && this.musicBus) {
        this.musicBus.gain.cancelScheduledValues(ctx.currentTime)
        this.musicBus.gain.setTargetAtTime(1, ctx.currentTime, 0.2)
      }
    }
  }

  /** Lower the music under speech; nearby lines are merged so the music does not pump between words. */
  private duck(spans: [number, number][]) {
    const bus = this.musicBus
    if (!bus || spans.length === 0) return false
    spans.sort((a, b) => a[0] - b[0])
    const merged: [number, number][] = []
    for (const [a, b] of spans) {
      const last = merged[merged.length - 1]
      if (last && a - last[1] < 0.6) last[1] = Math.max(last[1], b)
      else merged.push([a, b])
    }
    for (const [a, b] of merged) {
      bus.gain.setTargetAtTime(DUCK, Math.max(a - 0.1, this.ctx!.currentTime), 0.06)
      bus.gain.setTargetAtTime(1, b + 0.15, 0.3)
    }
    return true
  }

  /** Speak a bundled voice line now (mission control). Missing lines are skipped silently. */
  say(name: string) {
    this.schedule([{ at: 0, voice: name }])
  }

  play(name: Sfx) {
    this.schedule([{ at: 0, sfx: name }])
  }
}

export const audio = new AudioEngine()

if (typeof window !== 'undefined') {
  // Not `once`: a later gesture also resumes a context the browser suspended.
  const unlock = () => audio.unlock()
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)
}

export function useMusic(stage: MusicStage) {
  useEffect(() => {
    audio.setStage(stage)
  }, [stage])
}

export function useMuted(): boolean {
  return useSyncExternalStore(audio.subscribe, () => audio.muted, () => true)
}
