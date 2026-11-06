import type { ReactNode } from 'react'
import { L2_LYAPUNOV, L2_LYAPUNOV_STATE, MU_EM, lagrangeX, propagate, type State } from '../../engine/threebody'

export interface Viewport {
  xMin: number
  xMax: number
  yMax: number
}
export const VIEW_L2: Viewport = { xMin: -0.15, xMax: 1.35, yMax: 0.32 }
export const VIEW_WIDE: Viewport = { xMin: -0.6, xMax: 1.6, yMax: 0.65 }

const L1 = lagrangeX(1)
const L2 = lagrangeX(2)

/** The L2 Lyapunov orbit, computed once with the engine's RK4 (one period). */
export const L2_ORBIT: State[] = propagate(L2_LYAPUNOV_STATE, 0.002, Math.round(L2_LYAPUNOV.period / 0.002), 4).states

export function toPath(states: readonly State[], vp: Viewport, W: number, H: number) {
  const sx = W / (vp.xMax - vp.xMin)
  const sy = H / (2 * vp.yMax)
  return states.map((s, i) => `${i ? 'L' : 'M'}${((s[0] - vp.xMin) * sx).toFixed(1)} ${(H / 2 - s[1] * sy).toFixed(1)}`).join(' ')
}

/** Earth–Moon system in the rotating frame: Earth, Moon, L1/L2 markers, plus any trajectories passed as children paths. */
export function CR3BPView({
  vp = VIEW_L2,
  children,
  label,
  className = 'h-56 w-full',
}: {
  vp?: Viewport
  children?: (helpers: { path: (s: readonly State[]) => string; px: (x: number, y: number) => [number, number] }) => ReactNode
  label?: string
  className?: string
}) {
  const W = 600
  const H = Math.round((W * 2 * vp.yMax) / (vp.xMax - vp.xMin))
  const sx = W / (vp.xMax - vp.xMin)
  const sy = H / (2 * vp.yMax)
  const px = (x: number, y: number): [number, number] => [(x - vp.xMin) * sx, H / 2 - y * sy]
  const [ex, ey] = px(-MU_EM, 0)
  const [mx, my] = px(1 - MU_EM, 0)
  const [l1x] = px(L1, 0)
  const [l2x] = px(L2, 0)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={label ?? 'Earth–Moon system, rotating frame'}>
      <rect width={W} height={H} fill="#020617" />
      {Array.from({ length: 40 }, (_, i) => (
        <circle key={i} cx={(i * 151) % W} cy={(i * 89) % H} r={0.7} fill="#334155" />
      ))}
      <circle cx={ex} cy={ey} r={9} fill="#1d4ed8" />
      <text x={ex} y={ey + 22} textAnchor="middle" fill="#94a3b8" fontSize="11">
        Earth
      </text>
      <circle cx={mx} cy={my} r={4.5} fill="#9ca3af" />
      <text x={mx} y={my + 18} textAnchor="middle" fill="#94a3b8" fontSize="11">
        Moon
      </text>
      {[
        [l1x, 'L1'],
        [l2x, 'L2'],
      ].map(([x, t]) => (
        <g key={t as string}>
          <line x1={x as number} x2={x as number} y1={ey - 5} y2={ey + 5} stroke="#fbbf24" />
          <line x1={(x as number) - 5} x2={(x as number) + 5} y1={ey} y2={ey} stroke="#fbbf24" />
          <text x={x as number} y={ey - 9} textAnchor="middle" fill="#fbbf24" fontSize="10">
            {t}
          </text>
        </g>
      ))}
      {children?.({ path: (s) => toPath(s, vp, W, H), px })}
      <text x={8} y={H - 8} fill="#64748b" fontSize="10">
        Rotating frame (Earth and Moon fixed) · physics: circular restricted three-body problem, RK4
      </text>
    </svg>
  )
}

/** Schematic transfer path from Earth towards L2 for a route (not a precise trajectory). */
export function routeSchematic(routeId: string, px: (x: number, y: number) => [number, number]) {
  const [ex, ey] = px(0.02, 0)
  const [lx, ly] = px(1.19, 0)
  const [mx, my] = px(1 - MU_EM, 0)
  if (routeId === 'flyby') return `M${ex} ${ey} Q ${(ex + mx) / 2} ${ey - 90} ${mx - 6} ${my + 8} Q ${mx + 20} ${my + 30} ${lx} ${ly}`
  if (routeId === 'low_energy') return `M${ex} ${ey} C ${ex + 120} ${ey - 160}, ${lx + 140} ${ly - 170}, ${lx + 60} ${ly - 20} S ${lx + 30} ${ly + 40}, ${lx} ${ly}`
  return `M${ex} ${ey} Q ${(ex + lx) / 2} ${ey - 60} ${lx} ${ly}`
}
