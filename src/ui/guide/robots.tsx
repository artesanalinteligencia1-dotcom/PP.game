// The robot guide, Kuntur: an SVG drawn in code (no image files) with five expressions. Chosen by the owner on
// 2026-11-14 over two other looks (a sphere with an orbit halo, a CubeSat). Our own design: inspired by the idea of
// a helpful mission robot, not by any existing character.
import type { CSSProperties, ReactNode } from 'react'

export type GuideMood = 'idle' | 'happy' | 'thinking' | 'worried' | 'explaining'
export const GUIDE_MOODS: GuideMood[] = ['idle', 'happy', 'thinking', 'worried', 'explaining']

export interface RobotProps {
  mood: GuideMood
  /** The mouth moves while a line is being said. */
  talking?: boolean
  size?: number
  /** Still picture (reduced motion, small icons). */
  still?: boolean
  title?: string
}

/** Rotation about a hinge point, in the SVG's own units, eased when the mood changes. */
const hinge = (x: number, y: number, deg: number): CSSProperties => ({
  transformOrigin: `${x}px ${y}px`,
  transform: `rotate(${deg}deg)`,
  transition: 'transform 0.45s cubic-bezier(.3,1.4,.5,1)',
})

/** Two eyes and a mouth, shared by the three robots so the expressions read the same whichever look is chosen. */
function Face({ mood, talking, x1, x2, y, r, color, still, mouthY }: { mood: GuideMood; talking?: boolean; x1: number; x2: number; y: number; r: number; color: string; still?: boolean; mouthY: number }) {
  const worried = mood === 'worried'
  const eyeColor = worried ? '#fbbf24' : color
  const blink = still ? undefined : 'guide-blink'
  const eye = (x: number, i: number) => {
    if (mood === 'happy') return <path key={i} d={`M${x - r} ${y + r * 0.4} Q${x} ${y - r * 1.3} ${x + r} ${y + r * 0.4}`} fill="none" stroke={eyeColor} strokeWidth={r * 0.55} strokeLinecap="round" />
    if (worried) return <circle key={i} cx={x} cy={y} r={r * 1.15} fill={eyeColor} className={blink} />
    if (mood === 'thinking') {
      const h = i === 0 ? r * 1.2 : r * 2
      return <rect key={i} x={x - r + r * 0.5} y={y - h / 2 - r * 0.5} width={r * 2} height={h} rx={r} fill={eyeColor} className={blink} />
    }
    return <rect key={i} x={x - r} y={y - r * 1.2} width={r * 2} height={r * 2.4} rx={r} fill={eyeColor} className={blink} />
  }
  const w = (x2 - x1) * 0.42
  const cx = (x1 + x2) / 2
  let mouth: ReactNode
  if (talking) mouth = <rect x={cx - w / 2} y={mouthY - 1.5} width={w} height={3} rx={1.5} fill={eyeColor} className={still ? undefined : 'guide-talk'} />
  else if (mood === 'happy') mouth = <path d={`M${cx - w / 2} ${mouthY - 2} Q${cx} ${mouthY + 5} ${cx + w / 2} ${mouthY - 2}`} fill="none" stroke={eyeColor} strokeWidth={2.4} strokeLinecap="round" />
  else if (worried) mouth = <ellipse cx={cx} cy={mouthY} rx={w * 0.16} ry={3.2} fill="none" stroke={eyeColor} strokeWidth={2} />
  else if (mood === 'thinking') mouth = <rect x={cx} y={mouthY - 1} width={w * 0.45} height={2.4} rx={1.2} fill={eyeColor} opacity={0.8} />
  else mouth = <rect x={cx - w * 0.3} y={mouthY - 1} width={w * 0.6} height={2.4} rx={1.2} fill={eyeColor} opacity={0.8} />
  return (
    <g>
      {[x1, x2].map(eye)}
      {mouth}
    </g>
  )
}

/** Three dots over the head while thinking; an exclamation mark when worried. */
function Thought({ mood, x, y, color, still }: { mood: GuideMood; x: number; y: number; color: string; still?: boolean }) {
  if (mood === 'thinking')
    return (
      <g fill={color}>
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={x + i * 9} cy={y - i * 4} r={2.6 + i * 0.6} className={still ? undefined : 'guide-dot'} style={{ animationDelay: `${i * 0.18}s` }} />
        ))}
      </g>
    )
  if (mood === 'worried')
    return (
      <g fill="#fbbf24">
        <rect x={x + 6} y={y - 18} width={5} height={14} rx={2.5} />
        <circle cx={x + 8.5} cy={y + 2} r={3} />
      </g>
    )
  return null
}

function Svg({ size, title, still, mood, children }: { size: number; title?: string; still?: boolean; mood: GuideMood; children: ReactNode }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={title} className="overflow-visible">
      {title && <title>{title}</title>}
      <g className={still ? undefined : mood === 'worried' ? 'guide-shake' : 'guide-bob'}>{children}</g>
    </svg>
  )
}

/** Kuntur: a small flying drone shaped after the Andean condor, with solar-panel wings and the bird's white collar. */
export function Kuntur({ mood, talking, size = 200, still, title }: RobotProps) {
  const wing = { idle: 0, happy: -24, thinking: 22, worried: -36, explaining: -8 }[mood]
  const panel = (side: 1 | -1) => {
    const sx = 100 + side * 30
    const tip = 100 + side * 92
    return (
      <g style={hinge(sx, 108, side * wing)}>
        <g className={still || mood !== 'explaining' ? undefined : side === 1 ? 'guide-flap-r' : 'guide-flap-l'} style={{ transformOrigin: `${sx}px 108px` }}>
          <path d={`M${sx} 100 L${tip} 92 L${tip - side * 6} 118 L${sx} 122 Z`} fill="#1e3a8a" stroke="#7dd3fc" strokeWidth={1.5} />
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={sx + (tip - sx) * f} y1={100 - 8 * f} x2={sx + (tip - side * 6 - sx) * f} y2={122 - 4 * f} stroke="#60a5fa" strokeWidth={1} opacity={0.7} />
          ))}
          <line x1={sx} y1={111} x2={tip - side * 3} y2={105} stroke="#60a5fa" strokeWidth={1} opacity={0.7} />
          {/* the condor's "fingers": primary feathers as three thin panel tips */}
          {[0, 1, 2].map((i) => (
            <rect key={i} x={side === 1 ? tip - 4 + i * 5 : tip - 6 - i * 5} y={90 + i * 7} width={10} height={4} rx={2} fill="#334155" stroke="#7dd3fc" strokeWidth={0.8} transform={`rotate(${side * (8 + i * 10)} ${tip} ${96 + i * 7})`} />
          ))}
        </g>
      </g>
    )
  }
  return (
    <Svg size={size} title={title} still={still} mood={mood}>
      <defs>
        <radialGradient id="kuntur-jet">
          <stop offset="0" stopColor="#fdba74" stopOpacity="0.9" />
          <stop offset="1" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={100} cy={162} rx={20} ry={14} fill="url(#kuntur-jet)" className={still ? undefined : 'guide-glow'} />
      {panel(-1)}
      {panel(1)}
      <path d="M78 112 Q100 168 122 112 Z" fill="#111827" stroke="#7dd3fc" strokeWidth={1.5} />
      <path d="M92 148 L100 160 L108 148 Z" fill="#334155" />
      <ellipse cx={100} cy={100} rx={30} ry={10} fill="#e5e7eb" />
      <ellipse cx={100} cy={98} rx={30} ry={6} fill="#f8fafc" />
      {/* crest: the condor's comb, as an orange sensor */}
      <path d="M92 46 Q100 32 108 46 Z" fill="#f97316" />
      <rect x={70} y={44} width={60} height={50} rx={22} fill="#0f172a" stroke="#7dd3fc" strokeWidth={2} />
      <rect x={77} y={54} width={46} height={30} rx={13} fill="#020617" />
      <Face mood={mood} talking={talking} x1={89} x2={111} y={66} r={4.5} color="#7dd3fc" still={still} mouthY={78} />
      <Thought mood={mood} x={134} y={44} color="#7dd3fc" still={still} />
    </Svg>
  )
}

/** Kuntur's colour, for its speech bubble. */
export const GUIDE_ACCENT = '#7dd3fc'
