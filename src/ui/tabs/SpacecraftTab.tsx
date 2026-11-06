import { adcs, arrays, batteries, compression, obcs, propulsion, sunlitPowerW, thermal, getArray, getOrbit } from '../../engine'
import type { Design, DesignReport } from '../../engine/types'
import { fmt } from '../../i18n/en'
import { useGame } from '../../store/game'
import { PowerChart } from '../PowerChart'
import { Grid, OptionCard, Section, Slider } from '../components'

export function SpacecraftTab({ design, report }: { design: Design; report: DesignReport }) {
  const update = useGame((s) => s.update)
  const array = getArray(design.arrayId)
  const orbit = getOrbit(design.orbitId)
  const wPerM2 = sunlitPowerW(1, array.efficiency, array.cosFactor, orbit.sunDistanceAu)
  return (
    <div>
      <Section
        title="Power — solar arrays"
        hint="Generation: P = area × efficiency × 1361 W/m² × cos(angle to Sun), only while in sunlight. Panels lose a few % per year."
      >
        <Grid>
          {arrays.map((a) => (
            <OptionCard
              key={a.id}
              selected={design.arrayId === a.id}
              onClick={() => update({ arrayId: a.id, arrayAreaM2: Math.min(design.arrayAreaM2, a.maxAreaM2) })}
              title={a.name}
              stats={[`${fmt(sunlitPowerW(1, a.efficiency, a.cosFactor, orbit.sunDistanceAu))} W/m²`, `${a.kgPerM2} kg/m²`, `$${a.costPerM2} M/m²`, `max ${a.maxAreaM2} m²`]}
            >
              {a.description}
            </OptionCard>
          ))}
        </Grid>
        <div className="mt-3">
          <Slider
            label="Array area"
            value={design.arrayAreaM2}
            min={0}
            max={array.maxAreaM2}
            step={0.1}
            onChange={(v) => update({ arrayAreaM2: v })}
            format={(v) => `${fmt(v, 1)} m² → ${fmt(v * wPerM2)} W in sunlight`}
          />
        </div>
      </Section>
      <Section title="Power — battery" hint="Carries the spacecraft through eclipses. Using a big share of it every orbit wears it out.">
        <Grid>
          {batteries.map((b) => (
            <OptionCard
              key={b.id}
              selected={design.batteryId === b.id}
              onClick={() => update({ batteryId: b.id })}
              title={b.name}
              stats={[`${b.massKg} kg`, `$${b.costM} M`, `DoD ${fmt((report.power.avgLoadW * report.power.eclipseMin) / 60 / b.capacityWh * 100)}%`]}
            />
          ))}
        </Grid>
        <div className="mt-3 rounded border border-slate-800 bg-slate-950/60 p-2">
          <div className="mb-1 flex flex-wrap justify-between gap-2 text-xs text-slate-400">
            <span>One orbit ({fmt(report.power.periodMin)} min): solar vs load and battery charge</span>
            <span>
              eclipse {fmt(report.power.eclipseMin)} min · peak load {fmt(report.power.peakLoadW)} W
            </span>
          </div>
          <PowerChart report={report} />
        </div>
      </Section>
      <Section title="Attitude control (ADCS)" hint="How precisely the spacecraft can point. Sharp cameras and dishes need better pointing.">
        <Grid>
          {adcs.map((a) => (
            <OptionCard
              key={a.id}
              selected={design.adcsId === a.id}
              onClick={() => update({ adcsId: a.id })}
              title={a.name}
              stats={[`${a.pointing}`, `${a.massKg} kg`, `${a.powerW} W`, `$${a.costM} M`]}
            />
          ))}
        </Grid>
      </Section>
      <Section title="On-board computer" hint="Stores data between ground passes. Radiation slowly damages ordinary electronics.">
        <Grid>
          {obcs.map((o) => (
            <OptionCard
              key={o.id}
              selected={design.obcId === o.id}
              onClick={() => update({ obcId: o.id })}
              title={o.name}
              stats={[`${o.storageGb} GB`, `${o.radToleranceKrad} krad`, `${o.massKg} kg`, `${o.powerW} W`, `$${o.costM} M`, `TRL ${o.trl}`]}
            />
          ))}
        </Grid>
      </Section>
      <Section title="Data compression" hint="Squeezes data before download. Lossy compression throws away some detail.">
        <Grid>
          {compression.map((c) => (
            <OptionCard
              key={c.id}
              selected={design.compressionId === c.id}
              onClick={() => update({ compressionId: c.id })}
              title={c.name}
              stats={[c.powerW ? `${c.powerW} W` : '0 W', c.costM ? `$${c.costM} M` : 'free', c.scienceFactor < 1 ? `science ×${c.scienceFactor}` : undefined]}
            />
          ))}
        </Grid>
      </Section>
      <Section
        title="Propulsion"
        hint={`Rocket equation: Δv = Isp × g₀ × ln(wet/dry). This mission needs ${fmt(report.mass.totalDv)} m/s → ${fmt(report.mass.propellantKg, 1)} kg of propellant.`}
      >
        <Grid>
          {propulsion.map((p) => (
            <OptionCard
              key={p.id}
              selected={design.propulsionId === p.id}
              onClick={() => update({ propulsionId: p.id })}
              title={p.name}
              stats={[p.ispS ? `Isp ${p.ispS} s` : 'no Δv', `${p.massKg} kg`, `$${p.costM} M`]}
            >
              {p.description}
            </OptionCard>
          ))}
        </Grid>
      </Section>
      <Section title="Thermal control">
        <Grid>
          {thermal.map((t) => (
            <OptionCard
              key={t.id}
              selected={design.thermalId === t.id}
              onClick={() => update({ thermalId: t.id })}
              title={t.name}
              stats={[`${t.massKg} kg`, `${t.powerW} W`, `$${t.costM} M`, t.coldCapable ? 'survives deep cold' : 'Earth orbits only']}
            />
          ))}
        </Grid>
      </Section>
      <Section title="Design life" hint="Propellant and operations are sized for this. Longer life = more propellant, more operations cost, more science.">
        <Slider
          label="Planned mission life"
          value={design.designLifeYears}
          min={0.5}
          max={10}
          step={0.5}
          onChange={(v) => update({ designLifeYears: v })}
          format={(v) => `${fmt(v, 1)} years`}
        />
      </Section>
    </div>
  )
}
