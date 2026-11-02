import { useEffect, useMemo, useRef, useState } from 'react'
import { getLauncher, getOrbit } from '../../engine/catalog'
import type { Design } from '../../engine/types'
import { audio, hasVoice, type Sfx } from '../../audio/audio'
import { SpacecraftDrawing } from '../spacecraft/SpacecraftSprite'
import { spacecraftVisual } from '../spacecraft/visual'

/** Timeline in seconds after pressing Launch. `count` = seconds of countdown before ignition (10 with the voice, 3 without). */
export function makeTimeline(count: number) {
  const ignition = count
  const liftoff = count + 1.5
  return {
    count,
    ignition,
    liftoff,
    farewell: liftoff + 1.8,
    maxQ: liftoff + 1.6,
    boosterSep: liftoff + 2.4,
    meco: liftoff + 3.6,
    fairing: liftoff + 5.2,
    seco: liftoff + 7.6,
    deploy: liftoff + 8.6,
    end: liftoff + 10.2,
  }
}
export type Timeline = ReturnType<typeof makeTimeline>

/** Farewell lines from mission control (English); one is chosen per mission from the seed. */
export const FAREWELLS = [
  'Good luck, traveler.',
  'Godspeed, explorer.',
  'Fly safe, and bring us back some science.',
  'The sky is not the limit anymore.',
  'Good luck out there. We are with you.',
]
export const farewellIndex = (seed: number) => (seed >>> 0) % FAREWELLS.length
const MET_FACTOR = 60 // 1 s of animation ≈ 1 min of real ascent
const MU = 398600.4418
const RE = 6371

export type LaunchOutcome = 'success' | 'failure'

interface Props {
  design: Design
  running: boolean
  failed: boolean
  seed: number
  onDone: (o: LaunchOutcome) => void
  skipTo?: boolean
}

function clamp(x: number, a = 0, b = 1) {
  return Math.max(a, Math.min(b, x))
}
function mix(a: number[], b: number[], k: number) {
  return a.map((x, i) => Math.round(x + (b[i] - x) * k))
}
const hex = (c: number[]) => `rgb(${c[0]},${c[1]},${c[2]})`

export function failureTime(seed: number, T: Timeline): { at: number; text: string } {
  const k = seed % 3
  if (k === 0) return { at: T.liftoff + 1.9, text: 'Engine anomaly on the first stage. The flight termination system was triggered.' }
  if (k === 1) return { at: T.meco, text: 'Stage separation failed: the stages collided.' }
  return { at: T.liftoff + 6.3, text: 'The upper-stage engine shut down early. The spacecraft never reached orbital speed.' }
}

function Rocket({ launcherId, t, failAt, v, T }: { launcherId: string; t: number; failAt: number | null; v: ReturnType<typeof spacecraftVisual>; T: Timeline }) {
  const H = launcherId === 'light' ? 150 : launcherId === 'medium' ? 200 : 230
  const w = launcherId === 'light' ? 16 : launcherId === 'medium' ? 22 : 24
  const h1 = H * 0.55
  const h2 = H * 0.25
  const hf = H * 0.2
  const heavy = launcherId === 'heavy'
  const burning1 = t >= T.ignition && t < T.meco
  const burning2 = t >= T.meco + 0.3 && t < T.seco
  const sep1 = t >= T.meco
  const boostersGone = heavy && t >= T.boosterSep
  const fairingOpen = t >= T.fairing
  const fall1 = sep1 ? (t - T.meco) ** 2 * 70 : 0
  const fallB = boostersGone ? (t - T.boosterSep) ** 2 * 70 : 0
  const fo = fairingOpen ? clamp((t - T.fairing) / 1.2) : 0
  const flicker = 0.85 + 0.3 * Math.abs(Math.sin(t * 40))
  const exploded = failAt !== null && t >= failAt
  if (exploded) return null
  const scScale = (w * 0.9) / Math.max(30, v.bus + 8)
  return (
    <g>
      {/* first stage */}
      <g transform={`translate(0 ${fall1}) rotate(${sep1 ? Math.min(25, (t - T.meco) * 12) : 0} 0 ${-h1 / 2})`} opacity={sep1 ? clamp(1 - (t - T.meco) / 2.5) : 1}>
        <rect x={-w / 2} y={-h1} width={w} height={h1} fill="#f1f5f9" />
        <rect x={-w / 2} y={-h1 * 0.55} width={w} height={4} fill="#f97316" />
        <path d={`M${-w / 2} -6 L${-w / 2 - 7} 4 L${-w / 2} 0 Z M${w / 2} -6 L${w / 2 + 7} 4 L${w / 2} 0 Z`} fill="#94a3b8" />
        {burning1 && (
          <g transform={`scale(1 ${flicker})`}>
            <path d={`M${-w / 2 + 2} 0 Q0 ${H * 0.45} ${w / 2 - 2} 0 Z`} fill="#fbbf24" />
            <path d={`M${-w / 4} 0 Q0 ${H * 0.25} ${w / 4} 0 Z`} fill="#fff7ed" />
          </g>
        )}
      </g>
      {heavy &&
        [-1, 1].map((s) => (
          <g
            key={s}
            transform={`translate(${s * (w / 2 + 6) + (boostersGone ? s * (t - T.boosterSep) * 12 : 0)} ${fallB}) rotate(${boostersGone ? s * Math.min(30, (t - T.boosterSep) * 20) : 0})`}
            opacity={boostersGone ? clamp(1 - (t - T.boosterSep) / 2) : 1}
          >
            <rect x={-6} y={-H * 0.5} width={12} height={H * 0.5} fill="#e2e8f0" />
            <path d={`M-6 ${-H * 0.5} Q0 ${-H * 0.5 - 16} 6 ${-H * 0.5} Z`} fill="#e2e8f0" />
            {burning1 && !boostersGone && <path d={`M-5 0 Q0 ${H * 0.35 * flicker} 5 0 Z`} fill="#fbbf24" />}
          </g>
        ))}
      {/* second stage + payload */}
      <g>
        <rect x={-w / 2} y={-h1 - h2} width={w} height={h2} fill="#e2e8f0" />
        <rect x={-w / 2} y={-h1 - 3} width={w} height={3} fill="#334155" />
        {burning2 && (
          <g transform={`translate(0 ${-h1}) scale(1 ${flicker})`}>
            <path d={`M${-w / 3} 0 Q0 ${H * 0.3} ${w / 3} 0 Z`} fill="#93c5fd" opacity={0.9} />
          </g>
        )}
        {/* spacecraft inside the fairing (leaves at separation) */}
        {t < T.deploy && <g transform={`translate(0 ${-h1 - h2 - hf * 0.45}) scale(${scScale}) translate(-50 -50)`}>
          <SpacecraftDrawing v={v} deployed={false} />
        </g>}
        {/* fairing halves */}
        {[-1, 1].map((s) => (
          <path
            key={s}
            d={s < 0 ? `M0 ${-h1 - h2 - hf} Q${-w / 2} ${-h1 - h2 - hf * 0.6} ${-w / 2} ${-h1 - h2} L0 ${-h1 - h2} Z` : `M0 ${-h1 - h2 - hf} Q${w / 2} ${-h1 - h2 - hf * 0.6} ${w / 2} ${-h1 - h2} L0 ${-h1 - h2} Z`}
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth={0.5}
            transform={`translate(${s * fo * 40} ${fo * 30}) rotate(${s * fo * 35} 0 ${-h1 - h2})`}
            opacity={1 - fo}
          />
        ))}
      </g>
    </g>
  )
}

export function LaunchSequence({ design, running, failed, seed, onDone, skipTo }: Props) {
  const launcher = getLauncher(design.launcherId)
  const orbit = getOrbit(design.orbitId)
  const v = useMemo(() => spacecraftVisual(design), [design])
  const [t, setT] = useState(0)
  const start = useRef<number | null>(null)
  const fired = useRef<Set<string>>(new Set())
  const done = useRef(false)
  const voice = hasVoice('count_10') && hasVoice('ignition')
  const T = useMemo(() => makeTimeline(voice ? 10 : 3), [voice])
  const fail = useMemo(() => (failed ? failureTime(seed, T) : null), [failed, seed, T])
  const farewell = FAREWELLS[farewellIndex(seed)]

  const parking = orbit.body === 'earth' && orbit.launchTarget !== 'gto' ? Math.min(orbit.defaultAltitudeKm, design.altitudeKm) : 200
  const vOrbit = Math.sqrt(MU / (RE + parking))

  useEffect(() => {
    if (!running) return
    if (skipTo) {
      setT(fail ? fail.at + 1.5 : T.end)
      return
    }
    let raf = 0
    const tick = (now: number) => {
      if (start.current === null) start.current = now
      const tt = (now - start.current) / 1000
      setT(tt)
      if (tt < (fail ? fail.at + 2 : T.end + 0.2)) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running, skipTo, fail, T])

  // Sound cues and completion.
  useEffect(() => {
    if (!running) return
    const cue = (key: string, at: number, sfx: Sfx) => {
      if (t >= at && !fired.current.has(key) && (!fail || at <= fail.at)) {
        fired.current.add(key)
        if (!skipTo) audio.play(sfx)
      }
    }
    const say = (key: string, at: number, line: string) => {
      if (t >= at && !fired.current.has(key) && (!fail || at <= fail.at)) {
        fired.current.add(key)
        if (!skipTo) audio.say(line)
      }
    }
    if (voice) {
      for (let k = 0; k < T.count; k++) say(`c${k}`, k, `count_${T.count - k}`)
      say('ign', T.ignition, 'ignition')
      say('lift', T.liftoff, 'liftoff')
      say('bye', T.farewell, `farewell_${farewellIndex(seed) + 1}`)
    } else cue('count', Math.max(0, T.count - 3), 'countdown')
    cue('liftoff', T.ignition, 'liftoff')
    if (t >= T.liftoff && !fired.current.has('music') && (!fail || T.liftoff <= fail.at)) {
      fired.current.add('music')
      audio.setStage('launch')
    }
    if (design.launcherId === 'heavy') cue('boost', T.boosterSep, 'staging')
    cue('meco', T.meco, 'staging')
    cue('fairing', T.fairing, 'fairing')
    cue('deploy', T.deploy, 'deploy')
    if (fail && t >= fail.at && !fired.current.has('boom')) {
      fired.current.add('boom')
      if (!skipTo) audio.play('explosion')
      audio.setStage('none')
    }
    if (!done.current && ((fail && t >= fail.at + 1.4) || (!fail && t >= T.end))) {
      done.current = true
      if (!fail && !skipTo) audio.play('orbit')
      onDone(fail ? 'failure' : 'success')
    }
  }, [t, running, fail, onDone, skipTo, design.launcherId, T, voice, seed])

  const p = clamp((t - T.liftoff) / (T.seco - T.liftoff))
  const flying = t >= T.liftoff
  const altKm = flying ? parking * p ** 1.3 : 0
  const velKms = flying ? vOrbit * p ** 1.8 : 0
  const dvSpent = flying ? velKms + 1.5 * clamp(p * 1.4) : 0
  const met = flying ? (t - T.liftoff) * MET_FACTOR : (t - T.liftoff) * 1
  const space = clamp(altKm / 120)
  const skyTop = hex(mix([29, 78, 216], [2, 6, 23], space))
  const skyBottom = hex(mix([251, 146, 60], [2, 6, 23], clamp(space * 1.3)))
  const rise = flying ? Math.min(170, 1400 * p * p) : 0
  const worldShift = flying ? Math.max(0, 1400 * p * p - 170) : 0
  const H = launcher.id === 'light' ? 150 : launcher.id === 'medium' ? 200 : 230
  const follow = H * 0.55 * clamp((t - T.meco - 0.3) / 1.5)
  const rocketY = 430 - rise + follow
  const scTopY = rocketY - H * 0.9
  const deployK = clamp((t - T.deploy) / 1.2)
  const exploded = fail !== null && t >= fail.at
  const stage = t < T.liftoff ? 'Pre-launch' : t < T.meco ? 'Stage 1' : t < T.seco ? 'Stage 2' : 'Orbit'

  const caption = (() => {
    if (exploded) return fail!.text
    if (t < Math.min(4, T.ignition)) return T.count > 3 ? 'Launch director: all stations report GO for launch.' : 'Final countdown. All systems go.'
    if (t < T.ignition) return 'Final countdown.'
    if (t < T.liftoff) return 'Ignition! The engines build up to full thrust while clamps hold the rocket down.'
    if (t < T.maxQ) return 'Liftoff! Thrust must be greater than the rocket’s weight.'
    if (t < (design.launcherId === 'heavy' ? T.boosterSep : T.meco))
      return 'Max-Q: maximum aerodynamic pressure. The engines throttle down so the air does not crush the rocket.'
    if (design.launcherId === 'heavy' && t < T.meco) return 'Side boosters separate: dropping empty tanks saves mass (rocket equation).'
    if (t < T.fairing) return 'Main engine cut-off and stage separation: the empty first stage falls away.'
    if (t < T.seco) return 'Fairing separation: above the atmosphere the nose cover is dead weight. Meet your spacecraft!'
    if (t < T.deploy) {
      if (orbit.launchTarget === 'tli') return `Parking orbit at ${Math.round(parking)} km. Next: the burn that sends you away from Earth.`
      if (orbit.launchTarget === 'gto') return `Parking orbit at ${Math.round(parking)} km. Next: the transfer burn towards the high orbit.`
      return `Orbit insertion: ${Math.round(parking)} km at ${vOrbit.toFixed(1)} km/s — fast enough to keep falling around Earth.`
    }
    return 'Spacecraft separation and solar-array deployment. Hello, space!'
  })()

  const fmtMet = (s: number) => {
    const sign = s < 0 ? '−' : '+'
    const a = Math.abs(Math.round(s))
    return `T${sign}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`
  }

  return (
    <div className="relative h-[480px] overflow-hidden rounded-xl border border-slate-800">
      <svg viewBox="0 0 800 480" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Launch of the ${launcher.name}`}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={skyTop} />
            <stop offset="1" stopColor={skyBottom} />
          </linearGradient>
        </defs>
        <rect width="800" height="480" fill="url(#sky)" />
        {/* stars */}
        <g opacity={space}>
          {Array.from({ length: 90 }, (_, i) => (
            <circle key={i} cx={(i * 137) % 800} cy={(i * 131) % 380} r={i % 7 === 0 ? 1.2 : 0.7} fill="#e2e8f0" />
          ))}
        </g>
        {/* Earth limb appears high up */}
        <g opacity={clamp((altKm - 40) / 80)}>
          <ellipse cx="400" cy={1000 - 110 * clamp((altKm - 40) / 300)} rx="900" ry="520" fill="#38bdf8" opacity={0.35} />
          <ellipse cx="400" cy={1006 - 110 * clamp((altKm - 40) / 300)} rx="900" ry="520" fill="#1d4ed8" />
        </g>
        {/* ground, mountains (Andes silhouette) and tower move away */}
        <g transform={`translate(0 ${worldShift})`}>
          <path d="M0 380 L80 335 L150 362 L230 300 L300 345 L380 305 L450 350 L520 296 L600 342 L680 310 L740 348 L800 322 L800 440 L0 440 Z" fill="#1e1b4b" opacity={0.85} />
          <rect x="0" y="430" width="800" height="60" fill="#0f172a" />
          <rect x="350" y="420" width="100" height="12" fill="#334155" />
          <rect x="432" y={430 - (launcher.id === 'light' ? 160 : launcher.id === 'medium' ? 210 : 240)} width="7" height={launcher.id === 'light' ? 160 : launcher.id === 'medium' ? 210 : 240} fill="#475569" />
          {t >= T.ignition && t < T.liftoff + 2.5 && (
            <g opacity={t < T.liftoff ? 1 : clamp(1 - (t - T.liftoff) / 2.5)}>
              <circle cx="370" cy="428" r={20 + (t - T.ignition) * 22} fill="#cbd5e1" opacity={0.35} />
              <circle cx="430" cy="428" r={18 + (t - T.ignition) * 20} fill="#e2e8f0" opacity={0.3} />
            </g>
          )}
        </g>
        {/* rocket */}
        <g transform={`translate(400 ${rocketY})`}>
          <Rocket launcherId={launcher.id} t={t} failAt={fail?.at ?? null} v={v} T={T} />
        </g>
        {exploded && (
          <g transform={`translate(400 ${rocketY - H * 0.6})`}>
            <circle r={18 + (t - fail!.at) * 60} fill="#f97316" opacity={clamp(1 - (t - fail!.at) / 1.6)} />
            <circle r={10 + (t - fail!.at) * 35} fill="#fde68a" opacity={clamp(1 - (t - fail!.at) / 1.2)} />
          </g>
        )}
        {/* deployed spacecraft */}
        {!exploded && t >= T.deploy && (
          <g transform={`translate(${400 + deployK * 110} ${scTopY - deployK * 70}) scale(${0.45 + deployK * 1.6}) translate(-50 -50)`}>
            <SpacecraftDrawing v={v} deployed={t >= T.deploy + 0.5} />
          </g>
        )}
        {/* countdown digit */}
        {running && t < T.ignition && (
          <text x="400" y="200" textAnchor="middle" fontSize="110" fontWeight="800" fill="#fff" style={{ fontFamily: 'var(--font-display)' }}>
            {Math.max(1, Math.ceil(T.ignition - t))}
          </text>
        )}
        {running && t >= T.ignition && t < T.liftoff && (
          <text x="400" y="190" textAnchor="middle" fontSize="64" fontWeight="800" fill="#fbbf24" letterSpacing="6" style={{ fontFamily: 'var(--font-display)' }}>
            IGNITION
          </text>
        )}
      </svg>
      {/* HUD */}
      <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-slate-950/70 px-3 py-2 font-mono text-[11px] leading-5 text-slate-200 backdrop-blur">
        <div className="font-display text-xs font-semibold text-sky-300">{launcher.name}</div>
        <div>{running ? fmtMet(met) : fmtMet(-T.liftoff)}</div>
        <div>ALT {altKm.toFixed(0)} km</div>
        <div>VEL {velKms.toFixed(2)} km/s</div>
        <div>Δv {dvSpent.toFixed(2)} km/s</div>
        <div className="text-slate-400">{stage}</div>
      </div>
      {running && !exploded && t >= T.farewell && t < T.farewell + 3.2 && (
        <div className="absolute inset-x-0 top-20 text-center" aria-live="polite">
          <span className="rounded-lg bg-slate-950/70 px-4 py-2 font-display text-xl font-semibold text-amber-200 shadow-lg">“{farewell}”</span>
          <div className="mt-1 text-xs text-slate-300">— Mission Control</div>
        </div>
      )}
      {running && (
        <div className="absolute inset-x-3 bottom-3 rounded-lg bg-slate-950/75 px-3 py-2 text-sm text-slate-100 backdrop-blur" aria-live="polite">
          {caption}
        </div>
      )}
    </div>
  )
}
