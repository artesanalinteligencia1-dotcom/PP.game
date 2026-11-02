import { useEffect, useMemo, useRef, useState } from 'react'
import { audio, hasVoice } from '../../audio/audio'
import { SPACE_LINE_KM, type SoundingResult } from '../../engine/sounding'

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x))

/** Paulet-1: countdown → ignition → powered ascent → coast to apogee → fall → parachute. */
export function SoundingSequence({ result, running, onDone }: { result: SoundingResult; running: boolean; onDone: () => void }) {
  const voice = hasVoice('count_10') && hasVoice('ignition')
  const count = voice ? 10 : 3
  const T = useMemo(() => {
    const ignition = count
    const liftoff = count + 1.2
    return { ignition, liftoff, burnout: liftoff + 2.2, apogee: liftoff + 5.5, chute: liftoff + 8.5, end: liftoff + 10.5, fail: liftoff + 1.6 }
  }, [count])
  const [t, setT] = useState(0)
  const start = useRef<number | null>(null)
  const fired = useRef(new Set<string>())
  const done = useRef(false)

  useEffect(() => {
    if (!running) return
    let raf = 0
    const tick = (now: number) => {
      if (start.current === null) start.current = now
      const tt = (now - start.current) / 1000
      setT(tt)
      if (tt < T.end + 0.3) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running, T])

  useEffect(() => {
    if (!running) return
    const once = (k: string, at: number, fn: () => void) => {
      if (t >= at && !fired.current.has(k)) {
        fired.current.add(k)
        fn()
      }
    }
    if (voice) for (let k = 0; k < count; k++) once(`c${k}`, k, () => audio.say(`count_${count - k}`))
    else once('beep', 0, () => audio.play('countdown'))
    once('ign', T.ignition, () => (voice ? audio.say('ignition') : undefined))
    once('roar', T.ignition, () => audio.play('liftoff'))
    if (result.failed) once('boom', T.fail, () => audio.play('explosion'))
    else once('top', T.apogee, () => audio.play('orbit'))
    if (!done.current && t >= (result.failed ? T.fail + 1.5 : T.end)) {
      done.current = true
      onDone()
    }
  }, [t, running, voice, count, T, result.failed, onDone])

  // Altitude profile (km): powered ease-in, ballistic coast, fall, parachute.
  const ap = result.apogeeKm
  let alt = 0
  if (t >= T.liftoff && t < T.burnout) alt = ap * 0.3 * ((t - T.liftoff) / (T.burnout - T.liftoff)) ** 2
  else if (t >= T.burnout && t < T.apogee) {
    const u = (t - T.burnout) / (T.apogee - T.burnout)
    alt = ap * (0.3 + 0.7 * (1 - (1 - u) ** 2))
  } else if (t >= T.apogee && t < T.chute) {
    const u = (t - T.apogee) / (T.chute - T.apogee)
    alt = ap * (1 - 0.95 * u * u)
  } else if (t >= T.chute) alt = ap * 0.05 * clamp(1 - (t - T.chute) / (T.end - T.chute))
  const exploded = result.failed && t >= T.fail
  if (result.failed && t >= T.fail) alt = ap * 0.3 * ((T.fail - T.liftoff) / (T.burnout - T.liftoff)) ** 2
  const scaleMax = Math.max(130, ap * 1.1)
  const y = (km: number) => 430 - (km / scaleMax) * 360
  const space = clamp(alt / 100)
  const sky = `rgb(${Math.round(29 - 27 * space)},${Math.round(78 - 72 * space)},${Math.round(216 - 193 * space)})`
  const burning = t >= T.ignition && t < T.burnout && !exploded
  const chute = t >= T.chute && !result.failed
  const descending = t >= T.apogee
  const flicker = 0.85 + 0.3 * Math.abs(Math.sin(t * 40))
  const speed = exploded
    ? 0
    : t < T.burnout
      ? result.burnoutKms * clamp((t - T.liftoff) / (T.burnout - T.liftoff))
      : t < T.apogee
        ? result.burnoutKms * (1 - (t - T.burnout) / (T.apogee - T.burnout))
        : t < T.chute
          ? result.burnoutKms * 0.8 * ((t - T.apogee) / (T.chute - T.apogee))
          : 0.01

  const caption = exploded
    ? 'Engine failure: Paulet-1 broke apart. Early rockets failed often — every failure taught engineers something.'
    : t < T.ignition
      ? 'Paulet-1 on its rail: a liquid-propellant rocket built from Pedro Paulet’s notebooks.'
      : t < T.liftoff
        ? 'Ignition! Liquid propellants burn in the chamber — the idea Paulet said he tested in Paris in the 1890s.'
        : t < T.burnout
          ? 'Powered flight: the engine burns for about a minute, then the tanks are empty.'
          : t < T.apogee
            ? `Coasting upwards. Burnout speed ≈ ${result.burnoutKms.toFixed(1)} km/s.`
            : t < T.chute
              ? result.reachedSpace
                ? `Apogee ${ap.toFixed(0)} km — above the 100 km line: space, for ${Math.round(result.secondsInSpace)} seconds!`
                : `Apogee ${ap.toFixed(0)} km — below the 100 km line.`
              : 'Parachute open. It falls back because orbit needs ~7.8 km/s sideways, not 1.5 km/s straight up.'

  return (
    <div className="relative h-[480px] overflow-hidden rounded-xl border border-slate-800">
      <svg viewBox="0 0 800 480" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Paulet-1 sounding flight">
        <rect width="800" height="480" fill={sky} />
        <g opacity={space}>
          {Array.from({ length: 70 }, (_, i) => (
            <circle key={i} cx={(i * 137) % 800} cy={(i * 97) % 300} r={0.8} fill="#e2e8f0" />
          ))}
        </g>
        {/* altitude ladder */}
        {[0, 50, SPACE_LINE_KM].map((km) => (
          <g key={km}>
            <line x1="60" x2="740" y1={y(km)} y2={y(km)} stroke={km === SPACE_LINE_KM ? '#fbbf24' : '#94a3b8'} strokeDasharray="6 6" opacity={km === 0 ? 0 : 0.6} />
            {km > 0 && (
              <text x="742" y={y(km) + 4} fill={km === SPACE_LINE_KM ? '#fbbf24' : '#cbd5e1'} fontSize="12">
                {km === SPACE_LINE_KM ? '100 km — space' : `${km} km`}
              </text>
            )}
          </g>
        ))}
        <path d="M0 400 L90 350 L170 380 L260 320 L330 360 L420 310 L500 350 L590 300 L680 345 L800 320 L800 440 L0 440 Z" fill="#1e1b4b" opacity={0.9} />
        <rect x="0" y="430" width="800" height="50" fill="#0f172a" />
        <rect x="380" y="360" width="5" height="70" fill="#78716c" />
        {/* rocket */}
        {!exploded && (
          <g transform={`translate(400 ${y(alt)}) rotate(${descending && !chute ? 180 : 0})`}>
            <path d="M0 -62 C-7 -52 -8 -44 -8 -36 L8 -36 C8 -44 7 -52 0 -62 Z" fill="#b45309" />
            <rect x="-8" y="-36" width="16" height="36" fill="#d97706" />
            <rect x="-8" y="-24" width="16" height="3" fill="#78350f" />
            <path d="M-8 -6 L-15 4 L-8 0 Z M8 -6 L15 4 L8 0 Z" fill="#92400e" />
            {burning && (
              <g transform={`scale(1 ${flicker})`}>
                <path d="M-6 0 Q0 48 6 0 Z" fill="#fbbf24" />
                <path d="M-3 0 Q0 26 3 0 Z" fill="#fff7ed" />
              </g>
            )}
          </g>
        )}
        {chute && (
          <g transform={`translate(400 ${y(alt) - 70})`}>
            <path d="M-26 0 Q0 -30 26 0 Z" fill="#f97316" />
            <line x1="-26" y1="0" x2="0" y2="40" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="26" y1="0" x2="0" y2="40" stroke="#e2e8f0" strokeWidth="0.8" />
          </g>
        )}
        {exploded && (
          <g transform={`translate(400 ${y(alt) - 30})`}>
            <circle r={14 + (t - T.fail) * 50} fill="#f97316" opacity={clamp(1 - (t - T.fail) / 1.4)} />
            <circle r={8 + (t - T.fail) * 30} fill="#fde68a" opacity={clamp(1 - (t - T.fail))} />
          </g>
        )}
        {running && t < T.ignition && (
          <text x="400" y="200" textAnchor="middle" fontSize="110" fontWeight="800" fill="#fff" style={{ fontFamily: 'var(--font-display)' }}>
            {Math.max(1, Math.ceil(T.ignition - t))}
          </text>
        )}
        {running && t >= T.ignition && t < T.liftoff && (
          <text x="400" y="200" textAnchor="middle" fontSize="64" fontWeight="800" fill="#fbbf24" letterSpacing="6" style={{ fontFamily: 'var(--font-display)' }}>
            IGNITION
          </text>
        )}
      </svg>
      <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-slate-950/70 px-3 py-2 font-mono text-[11px] leading-5 text-slate-200">
        <div className="font-display text-xs font-semibold text-amber-300">Paulet-1</div>
        <div>ALT {alt.toFixed(0)} km</div>
        <div>VEL {speed.toFixed(2)} km/s</div>
        <div className="text-slate-400">orbit needs 7.8 km/s</div>
      </div>
      {running && (
        <div className="absolute inset-x-3 bottom-3 rounded-lg bg-slate-950/75 px-3 py-2 text-sm text-slate-100" aria-live="polite">
          {caption}
        </div>
      )}
    </div>
  )
}
