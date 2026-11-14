import type { ReactNode } from 'react'
import { MARS, transferView } from '../../engine/mars'
import { useT } from '../../i18n'

const W = 320
const H = 220
const CX = 150
const CY = 112
/** Pixels per AU: Mars' orbit (1.52 AU) fills the height. */
const S = 62

const px = ([x, y]: [number, number]): [number, number] => [CX + x * S, CY - y * S]

/**
 * The trip seen from above the Sun, to scale: Earth's and Mars' orbits, the transfer path, and the three positions on
 * `day` (days after launch). Without `day` it is the planning view: launch day (solid) and arrival day (hollow).
 */
export function MarsTransferView({ cruiseDays, day, label, className = 'h-56 w-full', children }: { cruiseDays: number; day?: number; label: string; className?: string; children?: ReactNode }) {
  const t = useT()
  const path = Array.from({ length: 41 }, (_, i) => px(transferView((cruiseDays * i) / 40, cruiseDays).craft))
  const d = path.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const start = transferView(0, cruiseDays)
  const end = transferView(cruiseDays, cruiseDays)
  const now = day === undefined ? null : transferView(day, cruiseDays)
  const planet = (p: [number, number], color: string, r: number, hollow = false) => {
    const [x, y] = px(p)
    return <circle cx={x} cy={y} r={r} fill={hollow ? 'none' : color} stroke={color} strokeWidth={hollow ? 1.5 : 0} />
  }
  const text = (p: [number, number], s: string, dy = -9) => {
    const [x, y] = px(p)
    return (
      <text x={x} y={y + dy} textAnchor="middle" fill="#94a3b8" fontSize={10}>
        {s}
      </text>
    )
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={label}>
      <circle cx={CX} cy={CY} r={S} fill="none" stroke="#1e3a8a" strokeDasharray="2 3" />
      <circle cx={CX} cy={CY} r={S * MARS.orbitAu} fill="none" stroke="#7c2d12" strokeDasharray="2 3" />
      <circle cx={CX} cy={CY} r={7} fill="#fbbf24" />
      <text x={CX} y={CY + 19} textAnchor="middle" fill="#fbbf24" fontSize={9}>
        {t('journey.body.sun')}
      </text>
      <path d={d} fill="none" stroke="#38bdf8" strokeDasharray="4 4" opacity={now ? 0.6 : 1} />
      {now ? (
        <>
          <line x1={px(now.earth)[0]} y1={px(now.earth)[1]} x2={px(now.craft)[0]} y2={px(now.craft)[1]} stroke="#a78bfa" strokeWidth={0.8} strokeDasharray="1 3" />
          {planet(now.earth, '#3b82f6', 5)}
          {planet(now.mars, '#ea580c', 4)}
          {text(now.earth, t('journey.body.earth'))}
          {text(now.mars, t('journey.body.mars'))}
        </>
      ) : (
        <>
          {planet(start.earth, '#3b82f6', 5)}
          {planet(start.mars, '#ea580c', 4)}
          {planet(end.earth, '#3b82f6', 5, true)}
          {planet(end.mars, '#ea580c', 4, true)}
          {text(start.earth, t('journey.body.earth'), 16)}
          {text(start.mars, t('journey.body.mars'))}
        </>
      )}
      {children}
    </svg>
  )
}

/** Screen position of the spacecraft on `day`, for drawing it on top of the view. */
export function craftPx(day: number, cruiseDays: number): [number, number] {
  return px(transferView(day, cruiseDays).craft)
}
