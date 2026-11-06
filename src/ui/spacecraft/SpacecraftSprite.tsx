import { useMemo } from 'react'
import type { Design } from '../../engine/types'
import { spacecraftVisual, type InstrumentShape, type SpacecraftVisual } from './visual'

const C = {
  foil: '#d4a017',
  foilDark: '#a07612',
  cell: '#1e3a8a',
  cellLine: '#60a5fa',
  metal: '#cbd5e1',
  dark: '#334155',
  radiator: '#f8fafc',
  astrophysicist: '#a78bfa',
  astrobiologist: '#34d399',
  plume: '#38bdf8',
  flame: '#fbbf24',
}

function Instrument({ shape, x, y, color }: { shape: InstrumentShape; x: number; y: number; color: string }) {
  switch (shape) {
    case 'camera':
      return (
        <g>
          <rect x={x - 3} y={y} width={6} height={7} fill={C.dark} stroke={color} strokeWidth={0.8} />
          <circle cx={x} cy={y + 8} r={2.2} fill="#0f172a" stroke={color} strokeWidth={0.8} />
        </g>
      )
    case 'bigCamera':
      return (
        <g>
          <rect x={x - 4.5} y={y} width={9} height={11} fill={C.dark} stroke={color} strokeWidth={0.8} />
          <ellipse cx={x} cy={y + 11.5} rx={4} ry={1.6} fill="#0f172a" stroke={color} strokeWidth={0.8} />
        </g>
      )
    case 'radar':
      return <rect x={x - 14} y={y} width={28} height={3.5} fill="#475569" stroke={color} strokeWidth={0.8} />
    case 'spectrometer':
      return (
        <g>
          <rect x={x - 4} y={y} width={8} height={6} fill={C.metal} stroke={color} strokeWidth={0.8} />
          <rect x={x - 2.5} y={y + 5} width={5} height={1.2} fill="#0f172a" />
        </g>
      )
    case 'boom':
      return (
        <g>
          <line x1={x} y1={y} x2={x + 16} y2={y + 10} stroke={C.metal} strokeWidth={0.8} />
          <circle cx={x + 16} cy={y + 10} r={1.8} fill={color} />
        </g>
      )
    case 'detector':
      return <path d={`M${x - 3} ${y} L${x + 3} ${y} L${x + 1.5} ${y + 6} L${x - 1.5} ${y + 6} Z`} fill={C.metal} stroke={color} strokeWidth={0.8} />
    case 'laser':
      return (
        <g>
          <rect x={x - 3} y={y} width={6} height={5} fill={C.dark} stroke={color} strokeWidth={0.8} />
          <circle cx={x} cy={y + 6} r={1.4} fill="#ef4444" />
        </g>
      )
    case 'canister':
      return <rect x={x - 2.5} y={y} width={5} height={8} rx={2} fill={C.metal} stroke={color} strokeWidth={0.8} />
    case 'telescope':
      return (
        <g>
          <rect x={x - 5} y={y} width={10} height={14} fill="#e2e8f0" stroke={color} strokeWidth={0.8} />
          <path d={`M${x - 8} ${y + 14} L${x + 8} ${y + 14} L${x + 6} ${y + 18} L${x - 6} ${y + 18} Z`} fill="#94a3b8" />
          <circle cx={x} cy={y + 16} r={2.5} fill="#0f172a" />
        </g>
      )
    case 'dipoles':
      return (
        <g stroke={color} strokeWidth={0.8}>
          <line x1={x} y1={y} x2={x - 14} y2={y + 12} />
          <line x1={x} y1={y} x2={x + 14} y2={y + 12} />
          <line x1={x} y1={y} x2={x} y2={y + 15} />
        </g>
      )
    case 'dishDown':
      return <path d={`M${x - 5} ${y + 1} Q${x} ${y + 8} ${x + 5} ${y + 1} Z`} fill={C.metal} stroke={color} strokeWidth={0.8} />
  }
}

export function SpacecraftDrawing({
  v,
  deployed = true,
  thrusting = false,
  grey = false,
}: {
  v: SpacecraftVisual
  deployed?: boolean
  thrusting?: boolean
  grey?: boolean
}) {
  const b = v.bus
  const x0 = 50 - b / 2
  const y0 = 50 - b / 2
  const n = v.instruments.length
  return (
    <g style={grey ? { filter: 'grayscale(1) brightness(0.6)' } : undefined}>
      {/* Solar arrays */}
      {v.arrays.kind === 'deployable' || v.arrays.kind === 'tracking' ? (
        deployed ? (
          [-1, 1].map((side) => {
            const w = v.arrays.wing
            const yoke = v.arrays.kind === 'tracking' ? 4 : 1.5
            const xs = side < 0 ? x0 - yoke - w : x0 + b + yoke
            return (
              <g key={side}>
                <line x1={side < 0 ? x0 : x0 + b} y1={50} x2={side < 0 ? x0 - yoke : x0 + b + yoke} y2={50} stroke={C.metal} strokeWidth={1.2} />
                {v.arrays.kind === 'tracking' && <circle cx={side < 0 ? x0 - yoke / 2 : x0 + b + yoke / 2} cy={50} r={1.6} fill={C.dark} />}
                <rect x={xs} y={50 - 7} width={w} height={14} fill={C.cell} stroke={C.cellLine} strokeWidth={0.6} />
                {Array.from({ length: Math.max(1, Math.floor(w / 6)) }, (_, i) => (
                  <line key={i} x1={xs + (i + 1) * (w / Math.max(1, Math.floor(w / 6)))} y1={43} x2={xs + (i + 1) * (w / Math.max(1, Math.floor(w / 6)))} y2={57} stroke={C.cellLine} strokeWidth={0.3} />
                ))}
                <line x1={xs} y1={50} x2={xs + w} y2={50} stroke={C.cellLine} strokeWidth={0.3} />
              </g>
            )
          })
        ) : (
          [-1, 1].map((side) => (
            <rect key={side} x={side < 0 ? x0 - 3 : x0 + b} y={y0 + 2} width={3} height={b - 4} fill={C.cell} stroke={C.cellLine} strokeWidth={0.5} />
          ))
        )
      ) : null}
      {/* Radiators (active thermal) */}
      {v.activeThermal && <rect x={x0 + b * 0.15} y={y0 - 5} width={b * 0.7} height={4} fill={C.radiator} stroke="#94a3b8" strokeWidth={0.4} />}
      {/* Bus */}
      <rect x={x0} y={y0} width={b} height={b} fill={C.foil} stroke={C.foilDark} strokeWidth={0.8} />
      <path d={`M${x0} ${y0 + b * 0.33} H${x0 + b} M${x0} ${y0 + b * 0.66} H${x0 + b}`} stroke={C.foilDark} strokeWidth={0.4} />
      {v.arrays.kind === 'body' && (
        <rect x={x0 + 2} y={y0 + 2} width={b - 4} height={b - 4} fill={C.cell} stroke={C.cellLine} strokeWidth={0.5} opacity={0.95} />
      )}
      {/* Antenna (top) */}
      {v.antenna === 'omni' && <line x1={50} y1={y0} x2={50} y2={y0 - 14} stroke={C.metal} strokeWidth={0.8} />}
      {v.antenna === 'patch' && <rect x={46} y={y0 - 2.5} width={8} height={2.5} fill={C.metal} stroke={C.dark} strokeWidth={0.4} />}
      {v.antenna === 'helical' && (
        <polyline points={`48,${y0} 52,${y0 - 2} 48,${y0 - 4} 52,${y0 - 6} 48,${y0 - 8} 52,${y0 - 10} 48,${y0 - 12}`} fill="none" stroke={C.metal} strokeWidth={0.8} />
      )}
      {v.antenna === 'dish' && (
        <g>
          <line x1={x0 + b * 0.8} y1={y0} x2={x0 + b * 0.8 + 6} y2={y0 - 8} stroke={C.metal} strokeWidth={0.8} />
          <path d={`M${x0 + b * 0.8 - 2} ${y0 - 16} Q${x0 + b * 0.8 + 12} ${y0 - 12} ${x0 + b * 0.8 + 10} ${y0 - 2} Z`} fill={C.metal} stroke={C.dark} strokeWidth={0.5} />
        </g>
      )}
      {/* Propulsion (left face, anti-velocity) */}
      {v.propulsion === 'coldgas' && <rect x={x0 - 2} y={48} width={2} height={4} fill={C.dark} />}
      {v.propulsion === 'hydrazine' && <path d={`M${x0} 47 L${x0 - 5} 45 L${x0 - 5} 55 L${x0} 53 Z`} fill={C.dark} />}
      {v.propulsion === 'electric' && (
        <g>
          <rect x={x0 - 4} y={46} width={4} height={8} fill={C.dark} />
          {thrusting && <path d={`M${x0 - 4} 47 L${x0 - 26} 50 L${x0 - 4} 53 Z`} fill={C.plume} opacity={0.7} />}
        </g>
      )}
      {thrusting && v.propulsion !== 'electric' && v.propulsion !== 'none' && (
        <path d={`M${x0 - 5} 47 L${x0 - 16} 50 L${x0 - 5} 53 Z`} fill={C.flame} opacity={0.8} />
      )}
      {/* Instruments (bottom face, looking down at the planet) */}
      {v.instruments.map((inst, i) => {
        const x = x0 + ((i + 1) * b) / (n + 1)
        return <Instrument key={inst.id} shape={inst.shape} x={x} y={y0 + b} color={C[inst.discipline]} />
      })}
    </g>
  )
}

/** Standalone SVG of the spacecraft built from the current design. */
export function SpacecraftSprite({
  design,
  size = 160,
  deployed = true,
  thrusting = false,
  className,
}: {
  design: Design
  size?: number
  deployed?: boolean
  thrusting?: boolean
  className?: string
}) {
  const v = useMemo(() => spacecraftVisual(design), [design])
  // Frame the drawing tightly so small spacecraft are not lost in empty space.
  const halfW = v.bus / 2 + (v.arrays.kind === 'deployable' || v.arrays.kind === 'tracking' ? (deployed ? v.arrays.wing + 6 : 5) : 6) + (thrusting ? 24 : 6)
  const halfH = v.bus / 2 + 19
  const half = Math.min(50, Math.max(halfW, halfH, 22))
  return (
    <svg viewBox={`${50 - half} ${50 - half} ${2 * half} ${2 * half}`} width={size} height={size} className={className} role="img" aria-label="Your spacecraft">
      <SpacecraftDrawing v={v} deployed={deployed} thrusting={thrusting} />
    </svg>
  )
}
