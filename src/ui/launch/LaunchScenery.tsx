import { useId } from 'react'

/**
 * Illustrated launch scenery (LOCAL_TODO §8): flat/painterly layers in the style of docs/video-style.md.
 * Everything is drawn in an 800×480 viewBox with the ground line at y = 430 and the launch pad at x = 400.
 * Pure presentation: no timing lives here, callers pass altitude / scroll values.
 */

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x))
function mix(a: number[], b: number[], k: number) {
  return `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * k)).join(',')})`
}
const SPACE = [2, 6, 23]

/** Dawn sky over the Andes that fades to black with altitude (`space` 0 → 1). */
export function SkyBackdrop({ space }: { space: number }) {
  const id = useId()
  const s = clamp(space)
  return (
    <g>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix([23, 37, 84], SPACE, s)} />
          <stop offset="0.45" stopColor={mix([67, 56, 128], SPACE, s)} />
          <stop offset="0.75" stopColor={mix([190, 110, 120], SPACE, clamp(s * 1.2))} />
          <stop offset="1" stopColor={mix([253, 186, 116], SPACE, clamp(s * 1.4))} />
        </linearGradient>
        <radialGradient id={`${id}sun`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff7ed" />
          <stop offset="0.12" stopColor="#fde68a" stopOpacity="0.9" />
          <stop offset="0.45" stopColor="#fb923c" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fb923c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="480" fill={`url(#${id}sky)`} />
      <circle cx="120" cy="372" r="190" fill={`url(#${id}sun)`} opacity={1 - clamp(s * 1.5)} />
    </g>
  )
}

export function Stars({ space, count = 90, height = 380 }: { space: number; count?: number; height?: number }) {
  return (
    <g opacity={clamp(space)}>
      {Array.from({ length: count }, (_, i) => (
        <circle key={i} cx={(i * 137) % 800} cy={(i * 131) % height} r={i % 7 === 0 ? 1.3 : i % 3 === 0 ? 0.9 : 0.6} fill="#e2e8f0" opacity={i % 5 === 0 ? 0.6 : 1} />
      ))}
    </g>
  )
}

/** Earth seen from orbit: ocean, a continent, cloud bands and the thin blue atmosphere. `k` 0 → 1 rises it into view. */
export function EarthLimb({ k }: { k: number }) {
  const id = useId()
  const cy = 1000 - 110 * clamp(k)
  return (
    <g opacity={clamp(k * 4)}>
      <defs>
        <radialGradient id={`${id}sea`} cx="0.42" cy="0.08" r="0.7">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="0.6" stopColor="#1e3a8a" />
          <stop offset="1" stopColor="#0b1440" />
        </radialGradient>
        <clipPath id={`${id}clip`}>
          <ellipse cx="400" cy={cy + 6} rx="900" ry="520" />
        </clipPath>
      </defs>
      <ellipse cx="400" cy={cy - 10} rx="912" ry="532" fill="#7dd3fc" opacity={0.16} />
      <ellipse cx="400" cy={cy - 2} rx="904" ry="524" fill="#38bdf8" opacity={0.35} />
      <ellipse cx="400" cy={cy + 6} rx="900" ry="520" fill={`url(#${id}sea)`} />
      <g clipPath={`url(#${id}clip)`}>
        {/* a continent with an Andean spine, then cloud bands */}
        <path
          d={`M90 ${cy - 528} C150 ${cy - 536} 230 ${cy - 530} 280 ${cy - 522} C320 ${cy - 516} 330 ${cy - 500} 380 ${cy - 496} C440 ${cy - 492} 470 ${cy - 470} 540 ${cy - 466} L540 ${cy - 420} L90 ${cy - 420} Z`}
          fill="#4d6b3c"
          opacity={0.55}
        />
        <path d={`M120 ${cy - 528} C200 ${cy - 532} 260 ${cy - 524} 300 ${cy - 514}`} stroke="#a16207" strokeWidth="2.5" fill="none" opacity={0.45} />
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M${-50 + i * 230} ${cy - 505 + i * 9} c40 -10 90 -6 130 4 c30 8 60 4 90 -4`}
            stroke="#f8fafc"
            strokeWidth={7 - i}
            strokeLinecap="round"
            fill="none"
            opacity={0.55}
          />
        ))}
      </g>
    </g>
  )
}

/** Andes range with the Misti volcano, in three parallax layers. `shift` is the world scroll in px (0 on the ground). */
export function AndesBackdrop({ shift = 0 }: { shift?: number }) {
  const id = useId()
  return (
    <g>
      <defs>
        <linearGradient id={`${id}haze`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8b7fb8" />
          <stop offset="1" stopColor="#b58aa0" />
        </linearGradient>
        <linearGradient id={`${id}plain`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b4636" />
          <stop offset="1" stopColor="#1c1917" />
        </linearGradient>
      </defs>
      {/* far range (Chachani side), hazy */}
      <g transform={`translate(0 ${shift * 0.55})`}>
        <path
          d="M0 318 L40 300 L78 309 L120 276 L150 290 L178 268 L214 296 L520 302 L560 280 L598 296 L640 262 L676 288 L720 274 L760 292 L800 284 L800 400 L0 400 Z"
          fill={`url(#${id}haze)`}
          opacity={0.75}
        />
        <path d="M120 276 L131 284 L140 280 L150 290 L158 284 L178 268 L170 282 L150 292 Z M640 262 L652 276 L664 272 L676 288 L640 276 Z" fill="#ede9fe" opacity={0.7} />
      </g>
      {/* Misti: lit flank towards the sun, shadow flank, snow cap with a flat crater rim */}
      <g transform={`translate(0 ${shift * 0.75})`}>
        {/* Pichu Pichu ridge to the right */}
        <path d="M430 372 L500 318 L530 334 L556 304 L590 326 L640 296 L700 344 L760 330 L800 350 L800 380 L430 380 Z" fill="#3f3466" />
        {/* the cone sits left of the pad but inside the central crop, so it shows on phones too */}
        <g transform="translate(90 0)">
          <path d="M206 214 L214 214 L380 372 L40 372 Z" fill="#4c3f75" />
          <path d="M206 214 L210 214 L214 372 L40 372 Z" fill="#6b5a9a" />
          <path d="M206 214 L214 214 L238 238 L228 236 L222 246 L214 238 L206 250 L198 238 L190 244 L184 237 Z" fill="#f5f3ff" />
          <path d="M184 237 L190 244 L198 238 L206 250 L206 214 Z" fill="#ffffff" />
          <path d="M206 214 L214 214 L238 238 L228 236 L222 246 L214 238 Z" fill="#c4b5fd" opacity={0.6} />
        </g>
      </g>
      {/* near foothills and the high-desert plain */}
      <g transform={`translate(0 ${shift})`}>
        <path d="M0 398 C80 374 140 390 220 378 C300 366 350 392 450 386 C540 380 620 394 700 382 C750 374 780 384 800 380 L800 440 L0 440 Z" fill="#2a2350" />
        <rect x="0" y="420" width="800" height="70" fill={`url(#${id}plain)`} />
        <path d="M0 424 C120 420 260 426 400 422 C540 418 680 425 800 421" stroke="#78583f" strokeWidth="1.5" fill="none" opacity={0.6} />
      </g>
    </g>
  )
}

/** Launch complex: pad, flame trench, lattice tower with service arms, beacon, lightning masts and water tower. */
export function LaunchPad({ towerHeight, t = 0 }: { towerHeight: number; t?: number }) {
  const top = 430 - towerHeight
  const rungs = Math.floor(towerHeight / 14)
  const blink = Math.floor(t * 1.5) % 2 === 0
  return (
    <g>
      {/* lightning masts with catenary wire */}
      {[300, 520].map((x) => (
        <g key={x}>
          <line x1={x} y1={430} x2={x} y2={top - 20} stroke="#57534e" strokeWidth="2.5" />
          <circle cx={x} cy={top - 20} r="2" fill={blink ? '#f87171' : '#7f1d1d'} />
        </g>
      ))}
      <path d={`M300 ${top - 18} Q410 ${top + 30} 520 ${top - 18}`} stroke="#57534e" strokeWidth="0.8" fill="none" opacity={0.7} />
      {/* water tower */}
      <g transform="translate(600 430)">
        {[-12, 12].map((x) => (
          <line key={x} x1={x} y1={0} x2={x * 0.6} y2={-48} stroke="#44403c" strokeWidth="2" />
        ))}
        <line x1="-10" y1="-18" x2="10" y2="-30" stroke="#44403c" strokeWidth="1" />
        <line x1="10" y1="-18" x2="-10" y2="-30" stroke="#44403c" strokeWidth="1" />
        <rect x="-15" y="-70" width="30" height="24" rx="4" fill="#78716c" />
        <rect x="-15" y="-70" width="10" height="24" rx="3" fill="#a8a29e" opacity={0.6} />
      </g>
      {/* pad deck and flame trench */}
      <path d="M330 432 L346 418 L454 418 L470 432 Z" fill="#57534e" />
      <rect x="346" y="418" width="108" height="3" fill="#a8a29e" />
      <rect x="383" y="421" width="34" height="11" fill="#0c0a09" />
      {/* lattice tower */}
      <g>
        <line x1="436" y1="430" x2="436" y2={top} stroke="#64748b" strokeWidth="2" />
        <line x1="450" y1="430" x2="450" y2={top} stroke="#475569" strokeWidth="2" />
        {Array.from({ length: rungs }, (_, i) => {
          const y = 430 - i * 14
          return (
            <g key={i} stroke="#64748b" strokeWidth="0.9">
              <line x1="436" y1={y} x2="450" y2={y} />
              <line x1="436" y1={y} x2="450" y2={y - 14} />
              <line x1="450" y1={y} x2="436" y2={y - 14} opacity={0.5} />
            </g>
          )
        })}
        <rect x="433" y={top - 6} width="20" height="6" fill="#334155" />
        <circle cx="443" cy={top - 9} r="2.6" fill={blink ? '#ef4444' : '#7f1d1d'} />
        {/* service arms reaching to the rocket */}
        {[0.35, 0.62, 0.86].map((f) => {
          const y = 430 - towerHeight * f
          return <path key={f} d={`M436 ${y} L414 ${y} L414 ${y + 3} L436 ${y + 5} Z`} fill="#94a3b8" />
        })}
        {/* floodlight */}
        <path d={`M452 ${top + 24} L520 ${top + 70} L520 ${top + 90} Z`} fill="#fef3c7" opacity={0.08} />
      </g>
    </g>
  )
}

/** One puffy cloud; light from the lower left (dawn sun). */
export function Cloud({ x, y, s = 1, opacity = 0.9 }: { x: number; y: number; s?: number; opacity?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
      <ellipse cx="0" cy="8" rx="70" ry="13" fill="#a78bba" />
      <circle cx="-34" cy="0" r="20" fill="#f3e8ff" />
      <circle cx="-6" cy="-12" r="26" fill="#faf5ff" />
      <circle cx="26" cy="-4" r="20" fill="#f3e8ff" />
      <circle cx="48" cy="4" r="13" fill="#e9d5ff" />
      <ellipse cx="0" cy="10" rx="62" ry="8" fill="#d8b4fe" opacity={0.55} />
    </g>
  )
}

/** Cloud deck the rocket climbs through; the caller moves `y` from above the frame (< 0) to below it (> 480). */
export function CloudDeck({ y }: { y: number }) {
  return (
    <g>
      <rect x="0" y={y - 10} width="800" height="36" fill="#ede9fe" opacity={0.18} />
      <Cloud x={90} y={y} s={1.3} />
      <Cloud x={300} y={y + 14} s={1.1} opacity={0.8} />
      <Cloud x={540} y={y - 6} s={1.5} />
      <Cloud x={760} y={y + 10} s={1.2} opacity={0.85} />
      <Cloud x={420} y={y - 40} s={0.8} opacity={0.6} />
    </g>
  )
}

/** Distant high clouds visible from the ground (drift slowly). */
export function HighClouds({ t = 0 }: { t?: number }) {
  const drift = (t * 3) % 900
  return (
    <g opacity={0.55}>
      <Cloud x={((620 + drift) % 900) - 50} y={120} s={0.55} />
      <Cloud x={((300 + drift * 0.7) % 900) - 50} y={78} s={0.4} opacity={0.7} />
      <Cloud x={((80 + drift * 0.85) % 900) - 50} y={150} s={0.45} opacity={0.8} />
    </g>
  )
}

/** Ocean with a drone ship for the booster-landing inset (160×120 viewBox). */
export function OceanWithShip() {
  const id = useId()
  return (
    <g>
      <defs>
        <linearGradient id={`${id}dusk`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#312e81" />
          <stop offset="1" stopColor="#c2758a" />
        </linearGradient>
        <linearGradient id={`${id}sea`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1e40af" />
          <stop offset="1" stopColor="#0b1440" />
        </linearGradient>
      </defs>
      <rect width="160" height="104" fill={`url(#${id}dusk)`} />
      <rect y="100" width="160" height="20" fill={`url(#${id}sea)`} />
      {[106, 112, 117].map((y, i) => (
        <path key={y} d={`M${i * 7} ${y} q6 -2 12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0`} stroke="#93c5fd" strokeWidth="0.6" fill="none" opacity={0.5} />
      ))}
      {/* drone ship: hull, deck with landing X, side blast walls */}
      <path d="M38 101 L122 101 L116 108 L44 108 Z" fill="#1f2937" />
      <rect x="40" y="98" width="80" height="4" fill="#64748b" />
      <path d="M72 98.5 L88 101.5 M88 98.5 L72 101.5" stroke="#f8fafc" strokeWidth="0.8" />
      <rect x="40" y="94" width="3" height="5" fill="#475569" />
      <rect x="117" y="94" width="3" height="5" fill="#475569" />
    </g>
  )
}
