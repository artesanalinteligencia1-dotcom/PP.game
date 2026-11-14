// The robot guide: three candidate looks, each an SVG drawn in code (no image files), with the same five expressions.
// Own designs: inspired by the idea of a helpful mission robot, not by any existing character.
import type { CSSProperties, ReactNode } from 'react'

export type GuideMood = 'idle' | 'happy' | 'thinking' | 'worried' | 'explaining'
export const GUIDE_MOODS: GuideMood[] = ['idle', 'happy', 'thinking', 'worried', 'explaining']
export type GuideVariant = 'kuntur' | 'inti' | 'chaska'
export const GUIDE_VARIANTS: GuideVariant[] = ['kuntur', 'inti', 'chaska']

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

/** Inti: a floating sphere with an orbit for a halo, a warm face screen and its own little moon. */
export function Inti({ mood, talking, size = 200, still, title }: RobotProps) {
  const tilt = { idle: -12, happy: -4, thinking: -26, worried: -12, explaining: -10 }[mood]
  const antenna = mood === 'worried' ? '#ef4444' : '#f97316'
  return (
    <Svg size={size} title={title} still={still} mood={mood}>
      <defs>
        <radialGradient id="inti-shell" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#334155" />
          <stop offset="0.6" stopColor="#111c36" />
          <stop offset="1" stopColor="#050a18" />
        </radialGradient>
        <radialGradient id="inti-glow">
          <stop offset="0" stopColor="#fb923c" stopOpacity="0.55" />
          <stop offset="1" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={100} cy={102} r={86} fill="url(#inti-glow)" className={still ? undefined : 'guide-glow'} />
      {/* back half of the orbit, behind the sphere */}
      <g style={hinge(100, 108, tilt)}>
        <path d="M18 108 A82 22 0 0 1 182 108" fill="none" stroke="#f97316" strokeWidth={3} opacity={0.45} />
      </g>
      <line x1={100} y1={46} x2={100} y2={26} stroke="#94a3b8" strokeWidth={3} strokeLinecap="round" />
      <circle cx={100} cy={22} r={6} fill={antenna} className={still ? undefined : 'guide-pulse'} />
      <circle cx={100} cy={104} r={58} fill="url(#inti-shell)" stroke="#fb923c" strokeOpacity={0.5} strokeWidth={1.5} />
      <path d="M62 76 A50 50 0 0 1 104 52" fill="none" stroke="#e2e8f0" strokeOpacity={0.35} strokeWidth={4} strokeLinecap="round" />
      <circle cx={44} cy={104} r={5} fill="#1e293b" stroke="#fb923c" strokeWidth={1.5} />
      <circle cx={156} cy={104} r={5} fill="#1e293b" stroke="#fb923c" strokeWidth={1.5} />
      <rect x={60} y={86} width={80} height={36} rx={18} fill="#020617" stroke="#fb923c" strokeOpacity={0.6} strokeWidth={1.5} />
      <Face mood={mood} talking={talking} x1={86} x2={114} y={101} r={5} color="#fdba74" still={still} mouthY={114} />
      {/* front half of the orbit and the little moon riding it */}
      <g style={hinge(100, 108, tilt)}>
        <path d="M18 108 A82 22 0 0 0 182 108" fill="none" stroke="#f97316" strokeWidth={3} />
        <g className={still ? undefined : 'guide-moon'} style={{ transformOrigin: '100px 108px' }}>
          <circle cx={182} cy={108} r={6} fill="#e2e8f0" stroke="#f97316" strokeWidth={1.5} />
        </g>
      </g>
      <Thought mood={mood} x={150} y={40} color="#fdba74" still={still} />
    </Svg>
  )
}

/** Chaska: a CubeSat that came back to help — a small cube with a screen face, whisker antennas and panels for arms. */
export function Chaska({ mood, talking, size = 200, still, title }: RobotProps) {
  const left = { idle: 30, happy: -40, thinking: 35, worried: -5, explaining: 25 }[mood]
  const right = { idle: -30, happy: 40, thinking: -95, worried: 5, explaining: -20 }[mood]
  const arm = (side: 1 | -1, deg: number) => {
    const hx = side === 1 ? 140 : 60
    const x = side === 1 ? 142 : 8
    return (
      <g style={hinge(hx, 98, deg)}>
        <g className={still || mood !== 'explaining' || side === -1 ? undefined : 'guide-wave'} style={{ transformOrigin: `${hx}px 98px` }}>
          <rect x={side === 1 ? 138 : 58} y={95} width={4} height={6} fill="#94a3b8" />
          <rect x={x} y={86} width={50} height={24} rx={2} fill="#1e3a8a" stroke="#cbd5e1" strokeWidth={1.5} />
          {[1, 2, 3, 4].map((i) => (
            <line key={i} x1={x + i * 10} y1={86} x2={x + i * 10} y2={110} stroke="#60a5fa" strokeWidth={1} opacity={0.7} />
          ))}
          <line x1={x} y1={98} x2={x + 50} y2={98} stroke="#60a5fa" strokeWidth={1} opacity={0.7} />
        </g>
      </g>
    )
  }
  return (
    <Svg size={size} title={title} still={still} mood={mood}>
      <defs>
        <linearGradient id="chaska-foil" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="0.5" stopColor="#d97706" />
          <stop offset="1" stopColor="#fbbf24" />
        </linearGradient>
        <radialGradient id="chaska-jet">
          <stop offset="0" stopColor="#5eead4" stopOpacity="0.7" />
          <stop offset="1" stopColor="#14b8a6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={100} cy={160} rx={26} ry={10} fill="url(#chaska-jet)" className={still ? undefined : 'guide-glow'} />
      {/* tape-measure antennas, like whiskers */}
      <path d="M66 62 Q50 40 38 30" fill="none" stroke="#cbd5e1" strokeWidth={2} strokeLinecap="round" />
      <path d="M134 62 Q150 40 162 30" fill="none" stroke="#cbd5e1" strokeWidth={2} strokeLinecap="round" />
      <circle cx={38} cy={30} r={3} fill="#5eead4" className={still ? undefined : 'guide-pulse'} />
      <circle cx={162} cy={30} r={3} fill="#5eead4" className={still ? undefined : 'guide-pulse'} />
      {arm(-1, left)}
      {arm(1, right)}
      <rect x={60} y={60} width={80} height={86} rx={6} fill="url(#chaska-foil)" stroke="#e2e8f0" strokeWidth={2} />
      {/* the aluminium rails of a CubeSat frame */}
      {[60, 134].map((x) => (
        <rect key={x} x={x} y={58} width={6} height={90} rx={2} fill="#cbd5e1" />
      ))}
      <rect x={70} y={70} width={60} height={46} rx={6} fill="#020617" stroke="#5eead4" strokeOpacity={0.6} strokeWidth={1.5} />
      <Face mood={mood} talking={talking} x1={88} x2={112} y={88} r={5} color="#5eead4" still={still} mouthY={104} />
      <rect x={72} y={122} width={56} height={16} rx={2} fill="#1e3a8a" stroke="#475569" />
      {[1, 2, 3].map((i) => (
        <line key={i} x1={72 + i * 14} y1={122} x2={72 + i * 14} y2={138} stroke="#60a5fa" strokeWidth={1} opacity={0.7} />
      ))}
      <Thought mood={mood} x={146} y={50} color="#5eead4" still={still} />
    </Svg>
  )
}

export const ROBOTS: Record<GuideVariant, (p: RobotProps) => ReactNode> = { kuntur: Kuntur, inti: Inti, chaska: Chaska }
/** Each look's accent colour, for its speech bubble and its card. */
export const GUIDE_ACCENT: Record<GuideVariant, string> = { kuntur: '#7dd3fc', inti: '#fb923c', chaska: '#5eead4' }
