import type { Orbit } from '../engine/types'
import { BODY } from '../engine/orbit'
import { useT, useTx } from '../i18n'

/** Static schematic: central body, orbit ring (log-scaled), Sun direction and eclipse shadow. */
export function OrbitDiagram({ orbit, altitudeKm, eclipseFraction }: { orbit: Orbit; altitudeKm: number; eclipseFraction: number }) {
  const t = useT()
  const tx = useTx()
  const size = 220
  const c = size / 2
  if (orbit.body === 'sun') {
    return (
      <svg viewBox={`0 0 ${size} ${size}`} className="h-52 w-52" role="img" aria-label={t('orbitDiagram.heliocentric')}>
        <circle cx={c} cy={c} r={14} fill="#fbbf24" />
        <circle cx={c} cy={c} r={50} fill="none" stroke="#38bdf8" strokeDasharray="3 3" />
        <circle cx={c} cy={c} r={80} fill="none" stroke="#f97316" strokeDasharray="3 3" />
        <circle cx={c + 50} cy={c} r={5} fill="#38bdf8" />
        <circle cx={c - 56} cy={c - 56} r={4} fill="#f97316" />
        <path d={`M ${c + 50} ${c} Q ${c + 40} ${c - 90} ${c - 56} ${c - 56}`} fill="none" stroke="#e2e8f0" strokeWidth={1.5} />
        <text x={c + 56} y={c + 16} fill="#94a3b8" fontSize={10}>{t('journey.body.earth')}</text>
        <text x={c - 80} y={c - 64} fill="#94a3b8" fontSize={10}>{t('journey.body.mars')}</text>
      </svg>
    )
  }
  const R = BODY[orbit.body].radiusKm
  const bodyR = 40
  // log scaling so LEO and GEO both fit
  const ringR = bodyR + Math.min(62, 14 * Math.log2(1 + altitudeKm / (R * 0.05)))
  const half = Math.PI * eclipseFraction // half-angle of the shadowed arc (centred opposite the Sun)
  const a0 = Math.PI - half
  const a1 = Math.PI + half
  const p = (a: number) => `${c + ringR * Math.cos(a)} ${c + ringR * Math.sin(a)}`
  const bodyColor = orbit.body === 'earth' ? '#1d4ed8' : '#9ca3af'
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-52 w-52" role="img" aria-label={t('orbitDiagram.schematic', { name: tx(`component.${orbit.id}.name`, orbit.name) })}>
      <defs>
        <linearGradient id="sun" x1="1" x2="0">
          <stop offset="0" stopColor="#fbbf24" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={c} y={0} width={c} height={size} fill="url(#sun)" />
      <text x={size - 30} y={14} fill="#fbbf24" fontSize={10}>{t('journey.sun')}</text>
      {eclipseFraction > 0 && <rect x={0} y={c - bodyR} width={c} height={bodyR * 2} fill="#020617" opacity={0.85} />}
      <circle cx={c} cy={c} r={ringR} fill="none" stroke="#38bdf8" strokeWidth={1.5} />
      {eclipseFraction > 0 && (
        <path d={`M ${p(a0)} A ${ringR} ${ringR} 0 0 1 ${p(a1)}`} fill="none" stroke="#f43f5e" strokeWidth={4} />
      )}
      <circle cx={c} cy={c} r={bodyR} fill={bodyColor} />
      <circle cx={c + ringR} cy={c} r={4} fill="#e2e8f0" />
      <text x={6} y={size - 8} fill="#94a3b8" fontSize={10}>
        {eclipseFraction > 0 ? t('orbitDiagram.eclipse') : t('orbitDiagram.noEclipse')}
      </text>
    </svg>
  )
}
