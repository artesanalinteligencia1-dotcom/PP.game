import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceArea } from 'recharts'
import type { DesignReport } from '../engine/types'
import { fmt } from '../i18n/en'

/** One orbit of power: sunlight then eclipse. Battery state of charge in steady state. */
export function PowerChart({ report }: { report: DesignReport }) {
  const p = report.power
  const T = p.periodMin
  const sunEnd = T * (1 - p.eclipseFraction)
  const steps = 48
  const startSoc = Math.max(0, 1 - p.dodNominal)
  const data = []
  let soc = startSoc
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * T
    const inSun = t <= sunEnd
    const gen = inSun ? p.sunlitGenBolW : 0
    const dt = (T / steps) / 60
    if (i > 0) {
      const net = gen - p.avgLoadW
      const dWh = net > 0 ? net * dt * 0.9 : net * dt
      soc = Math.min(1, Math.max(0, soc + dWh / p.batteryWh))
    }
    data.push({ t: Math.round(t * 10) / 10, gen: Math.round(gen), load: Math.round(p.avgLoadW), soc: Math.round(soc * 100) })
  }
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          {p.eclipseFraction > 0 && <ReferenceArea x1={Math.round(sunEnd)} x2={Math.round(T)} yAxisId="w" fill="#64748b" fillOpacity={0.18} label={{ value: 'eclipse', fill: '#94a3b8', fontSize: 10 }} />}
          <XAxis dataKey="t" type="number" domain={[0, Math.round(T)]} tick={{ fill: '#94a3b8', fontSize: 10 }} unit=" min" />
          <YAxis yAxisId="w" tick={{ fill: '#94a3b8', fontSize: 10 }} unit=" W" />
          <YAxis yAxisId="soc" orientation="right" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} unit="%" />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 12 }}
            formatter={(v, name) => [name === 'Battery' ? `${v}%` : `${fmt(Number(v))} W`, name]}
            labelFormatter={(l) => `t = ${l} min`}
          />
          <Area isAnimationActive={false} yAxisId="w" type="stepAfter" dataKey="gen" name="Solar" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.15} />
          <Line isAnimationActive={false} yAxisId="w" type="monotone" dataKey="load" name="Load" stroke="#f472b6" dot={false} />
          <Line isAnimationActive={false} yAxisId="soc" type="monotone" dataKey="soc" name="Battery" stroke="#38bdf8" dot={false} strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
