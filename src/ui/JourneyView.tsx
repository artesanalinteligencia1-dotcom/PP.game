import { useMemo } from 'react'
import { getOrbit } from '../engine/catalog'
import type { MissionState } from '../engine/simulate'
import { SpacecraftDrawing } from './spacecraft/SpacecraftSprite'
import { spacecraftVisual } from './spacecraft/visual'

/** Live view of the journey: the player's own spacecraft (same drawing as in design/launch) orbiting or in transfer. */
export function JourneyView({ mission, playing }: { mission: MissionState; playing: boolean }) {
  const orbit = getOrbit(mission.design.orbitId)
  const v = useMemo(() => spacecraftVisual(mission.design), [mission.design])
  const W = 320
  const H = 220
  const ended = mission.phase === 'ended'
  const lost = ended && mission.endReason !== 'completed'
  const inTransfer = mission.phase === 'transfer'
  const electric = mission.design.propulsionId === 'electric'
  const progress = mission.transferWeeks > 0 ? Math.min(1, mission.week / mission.transferWeeks) : 1
  const spin = { animation: `orbit-spin ${orbit.id === 'geo' ? 14 : orbit.body === 'moon' ? 7 : 6}s linear infinite`, animationPlayState: playing && !ended ? 'running' : 'paused' }
  const bodyColor = orbit.body === 'moon' ? '#9ca3af' : orbit.body === 'sun' ? '#fbbf24' : '#1d4ed8'
  const sc = 0.55

  // Transfer to the Moon / interplanetary: show the path.
  if (inTransfer && (orbit.body === 'moon' || orbit.body === 'sun')) {
    const a = { x: 50, y: 150 }
    const b = { x: 270, y: 70 }
    const c = { x: 140, y: 10 }
    const tt = progress
    const x = (1 - tt) ** 2 * a.x + 2 * (1 - tt) * tt * c.x + tt ** 2 * b.x
    const y = (1 - tt) ** 2 * a.y + 2 * (1 - tt) * tt * c.y + tt ** 2 * b.y
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full" role="img" aria-label="Transfer trajectory">
        <circle cx={a.x} cy={a.y} r={22} fill="#1d4ed8" />
        <text x={a.x} y={a.y + 38} textAnchor="middle" fill="#94a3b8" fontSize={10}>
          Earth
        </text>
        <circle cx={b.x} cy={b.y} r={orbit.body === 'moon' ? 9 : 12} fill={orbit.body === 'moon' ? '#9ca3af' : '#f97316'} />
        <text x={b.x} y={b.y + 24} textAnchor="middle" fill="#94a3b8" fontSize={10}>
          {orbit.body === 'moon' ? 'Moon' : 'Mars'}
        </text>
        <path d={`M${a.x} ${a.y} Q${c.x} ${c.y} ${b.x} ${b.y}`} fill="none" stroke="#38bdf8" strokeDasharray="4 4" />
        <g transform={`translate(${x} ${y}) scale(${sc}) translate(-50 -50)`}>
          <SpacecraftDrawing v={v} thrusting={electric} />
        </g>
        <text x={8} y={16} fill="#cbd5e1" fontSize={11}>
          Transfer {Math.round(progress * 100)}% {electric ? '· ion engine thrusting' : '· coasting'}
        </text>
      </svg>
    )
  }

  const cx = 130
  const cy = 112
  const R = orbit.body === 'moon' ? 34 : orbit.body === 'sun' ? 18 : 42
  const ring = orbit.id === 'geo' ? 96 : orbit.id === 'meo' ? 80 : orbit.body === 'sun' ? 86 : R + 22
  const eclipse = (orbit.eclipseOverride ?? 1) > 0 && orbit.body !== 'sun'
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full" role="img" aria-label={`Your spacecraft in ${orbit.name}`}>
      <defs>
        <linearGradient id="sunlight" x1="1" x2="0">
          <stop offset="0" stopColor="#fbbf24" stopOpacity="0.18" />
          <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={cx} y={0} width={W - cx} height={H} fill="url(#sunlight)" />
      <text x={W - 44} y={14} fill="#fbbf24" fontSize={10}>
        Sun →
      </text>
      {eclipse && <rect x={0} y={cy - R} width={cx} height={R * 2} fill="#020617" opacity={0.75} />}
      <circle cx={cx} cy={cy} r={ring} fill="none" stroke="#334155" strokeDasharray="3 3" />
      <circle cx={cx} cy={cy} r={R} fill={bodyColor} />
      {orbit.body === 'earth' && <circle cx={cx} cy={cy} r={R} fill="none" stroke="#60a5fa" strokeOpacity={0.4} strokeWidth={3} />}
      <g style={{ ...spin, transformOrigin: `${cx}px ${cy}px` }}>
        <g transform={`translate(${cx} ${cy - ring}) scale(${sc}) translate(-50 -50)`}>
          <SpacecraftDrawing v={v} grey={lost} />
        </g>
      </g>
      <text x={8} y={16} fill="#cbd5e1" fontSize={11}>
        {ended ? (lost ? 'Signal lost' : 'Mission complete — still orbiting') : `${orbit.name}`}
      </text>
      <text x={8} y={H - 8} fill="#64748b" fontSize={9}>
        Instruments point down at the {orbit.body === 'moon' ? 'Moon' : orbit.body === 'sun' ? 'stars' : 'Earth'} (nadir); arrays face the Sun.
      </text>
    </svg>
  )
}
