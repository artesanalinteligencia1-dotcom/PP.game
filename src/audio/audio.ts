// Music per game stage + sound effects. Audio stays silent until the first user gesture (browser rule)
// and can be muted; the preference is a per-viewer convenience kept in localStorage.
import { useEffect, useSyncExternalStore } from 'react'

export type MusicStage = 'home' | 'design' | 'launch' | 'flight' | 'results' | 'none'
export type Sfx = 'countdown' | 'liftoff' | 'staging' | 'fairing' | 'deploy' | 'orbit' | 'explosion' | 'alert' | 'success' | 'failure'

// Bundled audio files (hashed by Vite). Missing files are simply absent → no 404s.
const MUSIC_FILES = import.meta.glob('../assets/audio/music/*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const SFX_FILES = import.meta.glob('../assets/audio/sfx/*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const music = (name: string) => MUSIC_FILES[`../assets/audio/music/${name}.mp3`]
/** Sound effects present in the bundle (see LOCAL_TODO if some are missing). */
export const AVAILABLE_SFX = Object.keys(SFX_FILES).map((k) => k.split('/').pop()!.replace('.mp3', ''))

/**
 * Stage → music. See HANDOFF §19.4: A (Andean-electronic) = home; B (cinematic) = launch.
 * Design and flight reuse A softly until dedicated loops are produced.
 */
export const MUSIC: Record<Exclude<MusicStage, 'none'>, { src: string; volume: number } | null> = {
  home: { src: music('home-andean-electronic'), volume: 0.55 },
  design: { src: music('home-andean-electronic'), volume: 0.22 },
  launch: { src: music('launch-cinematic'), volume: 0.6 },
  flight: { src: music('home-andean-electronic'), volume: 0.16 },
  results: null,
}

const SFX_VOLUME: Partial<Record<Sfx, number>> = { liftoff: 0.9, explosion: 0.8, alert: 0.5 }

const MUTE_KEY = 'ppgame.muted'
const CROSSFADE = 1.6

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
  private stage: MusicStage = 'none'
  private players: HTMLAudioElement[] = []
  private active = 0
  private target = 0
  private timer: number | null = null
  private listeners = new Set<() => void>()

  subscribe = (fn: () => void) => {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
  private emit() {
    this.listeners.forEach((fn) => fn())
  }

  unlock() {
    if (this.unlocked) return
    this.unlocked = true
    this.applyStage(true)
  }

  setMuted(m: boolean) {
    this.muted = m
    try {
      localStorage.setItem(MUTE_KEY, m ? '1' : '0')
    } catch {
      /* ignore */
    }
    if (m) this.players.forEach((p) => p.pause())
    else this.applyStage(true)
    this.emit()
  }

  setStage(stage: MusicStage) {
    if (stage === this.stage) return
    this.stage = stage
    this.applyStage(false)
  }

  private applyStage(force: boolean) {
    if (typeof window === 'undefined') return
    const t = this.stage === 'none' ? null : MUSIC[this.stage]
    const track = t && t.src ? t : null
    const current = this.players[this.active]
    if (!track || this.muted || !this.unlocked) {
      if (!track || this.muted) this.fadeOutAll()
      return
    }
    if (!force && current && current.dataset.src === track.src && !current.paused) {
      this.target = track.volume
      this.rampTo(current, track.volume)
      return
    }
    this.fadeOutAll()
    const p = this.makePlayer(track.src)
    this.players.push(p)
    this.active = this.players.length - 1
    this.target = track.volume
    p.volume = 0
    p.play().then(() => this.rampTo(p, track.volume)).catch(() => undefined)
    this.watchLoop()
  }

  private makePlayer(src: string) {
    const p = new Audio(src)
    p.dataset.src = src
    p.preload = 'auto'
    return p
  }

  /** Seamless-ish loop: start a second copy before the end and crossfade. */
  private watchLoop() {
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = window.setInterval(() => {
      const p = this.players[this.active]
      if (!p || p.paused || !Number.isFinite(p.duration)) return
      if (p.duration - p.currentTime < CROSSFADE && !p.dataset.handoff) {
        p.dataset.handoff = '1'
        const next = this.makePlayer(p.dataset.src!)
        next.volume = 0
        this.players.push(next)
        this.active = this.players.length - 1
        next.play().then(() => this.rampTo(next, this.target)).catch(() => undefined)
        this.rampTo(p, 0, true)
      }
    }, 200)
  }

  private fadeOutAll() {
    this.players.forEach((p) => this.rampTo(p, 0, true))
  }

  private rampTo(p: HTMLAudioElement, to: number, thenStop = false) {
    const from = p.volume
    const steps = 16
    let i = 0
    const id = window.setInterval(() => {
      i++
      p.volume = Math.max(0, Math.min(1, from + ((to - from) * i) / steps))
      if (i >= steps) {
        window.clearInterval(id)
        if (thenStop) {
          p.pause()
          this.players = this.players.filter((x) => x !== p)
          this.active = Math.max(0, this.players.length - 1)
        }
      }
    }, (CROSSFADE * 1000) / steps)
  }

  play(name: Sfx) {
    if (this.muted || !this.unlocked || typeof window === 'undefined') return
    const src = SFX_FILES[`../assets/audio/sfx/${name}.mp3`]
    if (!src) return
    const a = new Audio(src)
    a.volume = SFX_VOLUME[name] ?? 0.7
    a.play().catch(() => undefined) // missing file or blocked: stay silent
  }
}

export const audio = new AudioEngine()

if (typeof window !== 'undefined') {
  const unlock = () => audio.unlock()
  window.addEventListener('pointerdown', unlock, { once: true })
  window.addEventListener('keydown', unlock, { once: true })
}

export function useMusic(stage: MusicStage) {
  useEffect(() => {
    audio.setStage(stage)
  }, [stage])
}

export function useMuted(): boolean {
  return useSyncExternalStore(audio.subscribe, () => audio.muted, () => true)
}
