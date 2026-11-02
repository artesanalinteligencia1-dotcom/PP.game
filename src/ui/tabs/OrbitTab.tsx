import { getOrbit, launchCapacityKg, launchers, maintenanceDvPerYear, orbits } from '../../engine'
import type { Design, DesignReport } from '../../engine/types'
import { fmt } from '../../i18n/en'
import { useGame } from '../../store/game'
import { OrbitDiagram } from '../OrbitDiagram'
import { Grid, OptionCard, Pill, Section, Slider } from '../components'

export function OrbitTab({ design, report }: { design: Design; report: DesignReport }) {
  const update = useGame((s) => s.update)
  const setOrbit = useGame((s) => s.setOrbit)
  const orbit = getOrbit(design.orbitId)
  const [lo, hi] = orbit.altitudeKm
  return (
    <div>
      <Section title="Orbit" hint="Where you fly decides eclipses, contact time, radiation, how much the launcher can carry and how much Δv you must bring.">
        <Grid>
          {orbits.map((o) => (
            <OptionCard
              key={o.id}
              selected={design.orbitId === o.id}
              onClick={() => setOrbit(o.id)}
              title={o.name}
              stats={[
                o.altitudeKm[0] === o.altitudeKm[1] ? (o.body === 'sun' ? 'interplanetary' : `${fmt(o.altitudeKm[0])} km`) : `${o.altitudeKm[0]}–${o.altitudeKm[1]} km`,
                o.insertionDv ? `+${o.insertionDv} m/s to arrive` : 'direct insertion',
              ]}
            >
              {o.description}
            </OptionCard>
          ))}
        </Grid>
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <OrbitDiagram orbit={orbit} altitudeKm={design.altitudeKm} eclipseFraction={report.power.eclipseFraction} />
          <div className="w-full flex-1 space-y-3 text-sm">
            {lo !== hi && (
              <Slider
                label="Altitude"
                value={design.altitudeKm}
                min={lo}
                max={hi}
                step={10}
                onChange={(v) => update({ altitudeKm: v })}
                format={(v) => `${fmt(v)} km`}
              />
            )}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <dt className="text-slate-400">Period (Kepler)</dt>
              <dd className="font-mono">{orbit.body === 'sun' ? '—' : `${fmt(report.power.periodMin)} min`}</dd>
              <dt className="text-slate-400">Eclipse per orbit</dt>
              <dd className="font-mono">
                {fmt(report.power.eclipseMin)} min ({fmt(report.power.eclipseFraction * 100)}%)
              </dd>
              <dt className="text-slate-400">Orbit keeping</dt>
              <dd className="font-mono">{fmt(maintenanceDvPerYear(orbit, design.altitudeKm), 1)} m/s per year</dd>
              <dt className="text-slate-400">Radiation</dt>
              <dd className="font-mono">{orbit.radiationKradYr} krad/yr</dd>
              <dt className="text-slate-400">Total Δv needed</dt>
              <dd className="font-mono">{fmt(report.mass.totalDv)} m/s</dd>
              {report.schedule.transferMonths > 0 && (
                <>
                  <dt className="text-slate-400">Transfer time</dt>
                  <dd className="font-mono">{fmt(report.schedule.transferMonths, 1)} months</dd>
                </>
              )}
            </dl>
            {orbit.drag && (
              <p className="text-xs text-slate-400">
                Lower altitude = sharper images and shorter passes, but more air drag (more propellant to stay up).
              </p>
            )}
          </div>
        </div>
      </Section>
      <Section title="Launcher" hint="Capacity shown for your chosen orbit. Your fully fuelled spacecraft must fit.">
        <Grid>
          {launchers.map((l) => {
            const cap = launchCapacityKg(l, orbit)
            const fits = cap >= report.mass.wetKg
            return (
              <OptionCard
                key={l.id}
                selected={design.launcherId === l.id}
                onClick={() => update({ launcherId: l.id })}
                title={l.name}
                stats={[cap > 0 ? `${fmt(cap)} kg to this orbit` : 'cannot reach this orbit', `$${l.costM} M`, `${fmt(l.reliability * 100)}% reliable`]}
                badge={cap > 0 ? <Pill tone={fits ? 'emerald' : 'rose'}>{fits ? 'fits' : 'too heavy'}</Pill> : <Pill tone="rose">no</Pill>}
              />
            )
          })}
        </Grid>
      </Section>
    </div>
  )
}
