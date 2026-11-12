import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { getLauncher, getOrbit } from '../../engine/catalog'
import type { Design } from '../../engine/types'
import { audio, hasVoice, type Cue } from '../../audio/audio'
import { useRocket } from '../../store/rocket'
import { useReducedMotion } from '../../store/settings'
import { SpacecraftDrawing } from '../spacecraft/SpacecraftSprite'
import { spacecraftVisual } from '../spacecraft/visual'
import { AndesBackdrop, CloudDeck, EarthLimb, HighClouds, LaunchPad, OceanWithShip, SceneryLight, SkyBackdrop, Stars, launchWindowStyle, useSceneryStyle } from './LaunchScenery'
import { LANDING_TOUCH, LAUNCHERS_3D, boosterLandingAt } from './three/ascent'
import { webglAvailable } from './three/support'
import { useT, useTx, t, type StringKey } from '../../i18n'

// The Three.js scene is a separate chunk; the SVG scene below stays as the fallback (reduced motion, no WebGL,
// and the side-booster rockets until they are modelled in 3D).
const LaunchScene3D = lazy(() => import('./three/LaunchScene3D'))

/** Timeline in seconds after pressing Launch. `count` = seconds of countdown before ignition (10 with the voice, 3 without). */
export function makeTimeline(count: number) {
  const ignition = count
  const liftoff = count + 1.5
  return {
    count,
    ignition,
    liftoff,
    farewell: liftoff + 2.7, // after the 2.5 s "Liftoff! We have liftoff!" line
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
export const FAREWELLS: StringKey[] = [
  'launch.farewell.0',
  'launch.farewell.1',
  'launch.farewell.2',
  'launch.farewell.3',
  'launch.farewell.4',
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
  /** Reusable launchers: whether the booster lands (from the mission roll). */
  boosterLanded?: boolean | null
  seed: number
  onDone: (o: LaunchOutcome) => void
  skipTo?: boolean
}

function clamp(x: number, a = 0, b = 1) {
  return Math.max(a, Math.min(b, x))
}

export function failureTime(seed: number, T: Timeline): { at: number; text: string } {
  const k = seed % 3
  if (k === 0) return { at: T.liftoff + 1.9, text: t('launch.fail.engineAnomaly') }
  if (k === 1) return { at: T.meco, text: t('launch.fail.stageSeparation') }
  return { at: T.liftoff + 6.3, text: t('launch.fail.secoEarly') }
}

export const rocketHeight = (id: string) => (id === 'light' ? 150 : id === 'heavy' ? 230 : 200)

export function Rocket({ launcherId, t, failAt, v, T }: { launcherId: string; t: number; failAt: number | null; v: ReturnType<typeof spacecraftVisual>; T: Timeline }) {
  const H = rocketHeight(launcherId)
  const w = launcherId === 'light' ? 16 : launcherId === 'heavy' ? 24 : 22
  const reusable = launcherId === 'reusable_medium'
  const rideshare = launcherId === 'rideshare'
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
        {reusable && (
          <g>
            <rect x={-w / 2 - 5} y={-h1 + 4} width={5} height={5} fill="#475569" />
            <rect x={w / 2} y={-h1 + 4} width={5} height={5} fill="#475569" />
            <line x1={-w / 2} y1={-18} x2={-w / 2 + 2} y2={-2} stroke="#1f2937" strokeWidth={2} />
            <line x1={w / 2} y1={-18} x2={w / 2 - 2} y2={-2} stroke="#1f2937" strokeWidth={2} />
            <rect x={-w / 2} y={-h1 * 0.8} width={w} height={h1 * 0.25} fill="#e2e8f0" opacity={0.5} />
          </g>
        )}
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
          {rideshare &&
            [-1, 1, 0].map((k, i) => <rect key={i} x={50 + k * 30 - 6} y={i === 2 ? 74 : 60} width={12} height={12} fill="#64748b" stroke="#cbd5e1" strokeWidth={1} />)}
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

export function LaunchSequence({ design, running, failed, seed, onDone, skipTo, boosterLanded }: Props) {
  const tText = useT()
  const tx = useTx()
  const launcher = getLauncher(design.launcherId)
  const launcherName = tx(`component.${launcher.id}.name`, launcher.name)
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
  const reduced = useReducedMotion()
  const light = useSceneryStyle(launchWindowStyle(orbit.launchTarget))
  // the player's own rocket (launcher id `custom`, see rocketToLauncher) is drawn from its parts
  const workbenchRocket = useRocket((s) => s.design)
  const ownRocket = launcher.id === 'custom' ? workbenchRocket : undefined
  const use3D = !reduced && (LAUNCHERS_3D.has(launcher.id) || !!ownRocket) && webglAvailable()
  const tRef = useRef(0)
  tRef.current = t

  const parking = orbit.body === 'earth' && orbit.launchTarget !== 'gto' ? Math.min(orbit.defaultAltitudeKm, design.altitudeKm) : 200
  const vOrbit = Math.sqrt(MU / (RE + parking))

  // Animation clock and sound. Voice and SFX are scheduled once on the audio clock from the same start instant,
  // so they stay in time even when frames stall or the tab is hidden; skipping or leaving cancels them.
  useEffect(() => {
    if (!running) return
    if (skipTo) {
      setT(fail ? fail.at + 1.5 : T.end)
      return
    }
    if (start.current === null) start.current = performance.now()
    const t0 = start.current
    const elapsed = (performance.now() - t0) / 1000
    const cues: Cue[] = []
    if (voice) {
      for (let k = 0; k < T.count; k++) cues.push({ at: k, voice: `count_${T.count - k}` })
      cues.push({ at: T.ignition, voice: 'ignition' }, { at: T.liftoff, voice: 'liftoff' }, { at: T.farewell, voice: `farewell_${farewellIndex(seed) + 1}` })
    } else cues.push({ at: Math.max(0, T.count - 3), sfx: 'countdown' })
    cues.push({ at: T.ignition, sfx: 'liftoff' })
    if (design.launcherId === 'heavy') cues.push({ at: T.boosterSep, sfx: 'staging' })
    cues.push({ at: T.meco, sfx: 'staging' }, { at: T.fairing, sfx: 'fairing' }, { at: T.deploy, sfx: 'deploy' }, { at: T.end, sfx: 'orbit' })
    const kept = fail ? [...cues.filter((c) => c.at <= fail.at), { at: fail.at, sfx: 'explosion' as const }] : cues
    const cancel = audio.schedule(kept.map((c) => ({ ...c, at: c.at - elapsed })))
    let raf = 0
    const tick = (now: number) => {
      const tt = (now - t0) / 1000
      setT(tt)
      if (tt < (fail ? fail.at + 2 : T.end + 0.2)) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      cancel()
    }
  }, [running, skipTo, fail, T, voice, seed, design.launcherId])

  // Music changes and completion.
  useEffect(() => {
    if (!running) return
    if (t >= T.liftoff && !fired.current.has('music') && (!fail || T.liftoff <= fail.at)) {
      fired.current.add('music')
      audio.setStage('launch')
    }
    if (fail && t >= fail.at && !fired.current.has('boom')) {
      fired.current.add('boom')
      audio.setStage('none')
    }
    if (!done.current && ((fail && t >= fail.at + 1.4) || (!fail && t >= T.end))) {
      done.current = true
      onDone(fail ? 'failure' : 'success')
    }
  }, [t, running, fail, onDone, T])

  const p = clamp((t - T.liftoff) / (T.seco - T.liftoff))
  const flying = t >= T.liftoff
  const altKm = flying ? parking * p ** 1.3 : 0
  const velKms = flying ? vOrbit * p ** 1.8 : 0
  const dvSpent = flying ? velKms + 1.5 * clamp(p * 1.4) : 0
  // Before liftoff the clock follows the voiced countdown (T−0 = ignition); after liftoff it shows compressed mission time.
  const met = flying ? (t - T.liftoff) * MET_FACTOR : t - T.ignition
  const rise = flying ? Math.min(170, 1400 * p * p) : 0
  const worldShift = flying ? Math.max(0, 1400 * p * p - 170) : 0
  // Sky darkening follows the camera (ground leaving the frame), not the HUD altitude, so the dawn sky lasts while the Andes are visible.
  const space = clamp((worldShift - 150) / 600)
  const H = rocketHeight(launcher.id)
  const follow = H * 0.55 * clamp((t - T.meco - 0.3) / 1.5)
  const rocketY = 430 - rise + follow
  const scTopY = rocketY - H * 0.9
  const deployK = clamp((t - T.deploy) / 1.2)
  const exploded = fail !== null && t >= fail.at
  const stage = t < T.liftoff
    ? tText('launch.stage.preLaunch')
    : t < T.meco
      ? tText('launch.stage.stage1')
      : t < T.seco
        ? tText('launch.stage.stage2')
        : tText('launch.stage.orbit')

  const caption = (() => {
    if (exploded) return fail!.text
    if (t < Math.min(4, T.ignition)) return T.count > 3 ? tText('launch.caption.go') : tText('launch.caption.countdownAllGo')
    if (t < T.ignition) return tText('launch.caption.countdown')
    if (t < T.liftoff) return tText('launch.caption.ignition')
    if (t < T.maxQ) return tText('launch.caption.liftoff')
    if (t < (design.launcherId === 'heavy' ? T.boosterSep : T.meco))
      return tText('launch.caption.maxQ')
    if (design.launcherId === 'heavy' && t < T.meco) return tText('launch.caption.boosters')
    if (t < T.fairing) return tText('launch.caption.meco')
    if (launcher.landing && t < T.meco + 4.5) return tText('launch.caption.landingSep')
    if (t < T.seco)
      return launcher.rideshare
        ? tText('launch.caption.fairingRideshare')
        : tText('launch.caption.fairingStandard')
    if (t < T.deploy) {
      if (orbit.launchTarget === 'tli') return tText('launch.caption.tli', { parking: String(Math.round(parking)) })
      if (orbit.launchTarget === 'gto') return tText('launch.caption.gto', { parking: String(Math.round(parking)) })
      return tText('launch.caption.orbitInsertion', { parking: String(Math.round(parking)), speed: vOrbit.toFixed(1) })
    }
    return tText('launch.caption.separation')
  })()

  const fmtMet = (s: number) => {
    const sign = s < 0 ? '−' : '+'
    const a = Math.abs(Math.round(s))
    return `T${sign}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`
  }

  return (
    <div className="relative h-[480px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      {use3D && (
        <Suspense fallback={null}>
          <LaunchScene3D launcherId={launcher.id} light={light} T={T} tRef={tRef} failAt={fail?.at ?? null} visual={v} landed={boosterLanded !== false} rocket={ownRocket} />
        </Suspense>
      )}
      <svg viewBox="0 0 800 480" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" role="img" aria-label={tText('launch.aria', { launcher: launcherName })}>
        {!use3D && (
        <>
        <SceneryLight style={launchWindowStyle(orbit.launchTarget)}>
        <SkyBackdrop space={space} />
        <Stars space={space} />
        {/* Earth limb appears high up */}
        <EarthLimb k={clamp((altKm - 40) / 300)} />
        {space < 0.6 && (
          <g opacity={1 - space / 0.6}>
            <HighClouds t={t} />
          </g>
        )}
        {/* Andes (parallax) and launch complex move away as the rocket climbs */}
        {worldShift < 900 && <AndesBackdrop shift={worldShift} />}
        <g transform={`translate(0 ${worldShift})`}>
          {/* cloud layer just above the frame: the rocket climbs through it as the camera follows */}
          {worldShift < 700 && (
            <g opacity={1 - space * 0.6}>
              <CloudDeck y={-30} />
            </g>
          )}
          {worldShift < 480 && <LaunchPad towerHeight={launcher.id === 'light' ? 160 : launcher.id === 'medium' ? 210 : 240} t={t} />}
          {t >= T.ignition && t < T.liftoff + 2.5 && (
            <g opacity={t < T.liftoff ? 1 : clamp(1 - (t - T.liftoff) / 2.5)}>
              <circle cx="370" cy="428" r={20 + (t - T.ignition) * 22} fill="#cbd5e1" opacity={0.35} />
              <circle cx="430" cy="428" r={18 + (t - T.ignition) * 20} fill="#e2e8f0" opacity={0.3} />
            </g>
          )}
        </g>
        </SceneryLight>
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
        </>
        )}
        {/* deployed spacecraft (the 3D scene deploys its own) */}
        {!use3D && !exploded && t >= T.deploy && (
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
            {tText('launch.ignition')}
          </text>
        )}
      </svg>
      {launcher.landing && running && !exploded && t >= T.meco + 0.4 && t < T.meco + 6.5 && (
        use3D ? (
          <BoosterLandingLabels t={t - T.meco - 0.4} landed={boosterLanded !== false} />
        ) : (
          <BoosterLanding t={t - T.meco - 0.4} landed={boosterLanded !== false} />
        )
      )}
      {/* HUD */}
      <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-slate-950/70 px-3 py-2 font-mono text-[11px] leading-5 text-slate-200 backdrop-blur">
        <div className="font-display text-xs font-semibold text-sky-300">{launcherName}</div>
        <div>{running ? fmtMet(met) : fmtMet(-T.ignition)}</div>
        <div>{tText('launch.hud.alt', { alt: altKm.toFixed(0) })}</div>
        <div>{tText('launch.hud.vel', { vel: velKms.toFixed(2) })}</div>
        <div>{tText('launch.hud.dv', { dv: dvSpent.toFixed(2) })}</div>
        <div className="text-slate-400">{stage}</div>
      </div>
      {running && !exploded && t >= T.farewell && t < T.farewell + 3.2 && (
        <div className="absolute inset-x-0 top-20 text-center" aria-live="polite">
          <span className="rounded-lg bg-slate-950/70 px-4 py-2 font-display text-xl font-semibold text-amber-200 shadow-lg">“{tText(farewell)}”</span>
          <div className="mt-1 text-xs text-slate-300">{tText('launch.hud.missionControl')}</div>
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

/** Labels over the 3D booster-recovery inset (the scene draws it in the same box: LANDING_INSET in LaunchScene3D). */
function BoosterLandingLabels({ t, landed }: { t: number; landed: boolean }) {
  const tText = useT()
  const st = boosterLandingAt(t, landed)
  const done = t >= LANDING_TOUCH
  return (
    <div className="pointer-events-none absolute bottom-16 right-3 flex w-[26%] flex-col justify-between rounded-lg border border-slate-600/80 p-1.5 text-[10px] text-slate-100" style={{ aspectRatio: '1 / 0.6' }}>
      <span className="self-start rounded bg-slate-950/70 px-1.5 font-semibold text-sky-300">{tText('launch.booster.title')}</span>
      <span className="self-start rounded bg-slate-950/70 px-1.5">{!done ? (st.burning ? tText('launch.booster.burning') : tText('launch.booster.falling')) : landed ? tText('launch.booster.landed') : tText('launch.booster.crashed')}</span>
    </div>
  )
}

/** Inset: the reusable first stage returning to a drone ship (outcome from the mission's seeded roll). */
function BoosterLanding({ t, landed }: { t: number; landed: boolean }) {
  const tText = useT()
  const touch = 3.2
  const k = Math.min(1, t / touch)
  const y = 20 + 78 * (1 - (1 - k) ** 2)
  const burning = t > 1.6 && t < touch
  const crashed = !landed && t >= touch
  return (
    <div className="absolute bottom-16 right-3 w-44 overflow-hidden rounded-lg border border-slate-700 bg-slate-950/85 p-1 text-[10px] text-slate-300">
      <div className="px-1 font-semibold text-sky-300">{tText('launch.booster.title')}</div>
      <svg viewBox="0 0 160 120" className="h-28 w-full">
        <OceanWithShip />
        {!crashed && (
          <g transform={`translate(80 ${y})`}>
            <rect x="-4" y="-34" width="8" height="34" fill="#f1f5f9" />
            {t > 2.4 && (
              <g>
                <line x1="-4" y1="-6" x2="-10" y2="2" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="4" y1="-6" x2="10" y2="2" stroke="#cbd5e1" strokeWidth="1.5" />
              </g>
            )}
            {burning && <path d="M-3 0 Q0 16 3 0 Z" fill="#fbbf24" />}
          </g>
        )}
        {crashed && <circle cx="80" cy="98" r={6 + (t - touch) * 14} fill="#f97316" opacity={Math.max(0, 1 - (t - touch) / 1.5)} />}
      </svg>
      <div className="px-1 pb-1">{t < touch ? tText('launch.booster.burning') : landed ? tText('launch.booster.landed') : tText('launch.booster.crashed')}</div>
    </div>
  )
}
