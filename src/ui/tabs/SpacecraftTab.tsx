import { adcs, arrays, batteries, compression, obcs, propulsion, sunlitPowerW, thermal, getArray, getOrbit } from '../../engine'
import type { Design, DesignReport, PointingLevel } from '../../engine/types'
import { fmt } from '../../i18n/en'
import { useGame } from '../../store/game'
import { PowerChart } from '../PowerChart'
import { Grid, OptionCard, Section, Slider } from '../components'
import { useT, useTx, type StringKey } from '../../i18n'

const ADCS_POINTING_KEY: Record<PointingLevel, StringKey> = {
  coarse: 'spacecraft.adcs.coarse',
  fine: 'spacecraft.adcs.fine',
  precise: 'spacecraft.adcs.precise',
}

export function SpacecraftTab({ design, report }: { design: Design; report: DesignReport }) {
  const update = useGame((s) => s.update)
  const t = useT()
  const tx = useTx()
  const array = getArray(design.arrayId)
  const orbit = getOrbit(design.orbitId)
  const wPerM2 = sunlitPowerW(1, array.efficiency, array.cosFactor, orbit.sunDistanceAu)
  return (
    <div>
      <Section
        title={t('spacecraft.arrays.title')}
        hint={t('spacecraft.arrays.hint')}
      >
        <Grid>
          {arrays.map((a) => (
            <OptionCard
              key={a.id}
              selected={design.arrayId === a.id}
              onClick={() => update({ arrayId: a.id, arrayAreaM2: Math.min(design.arrayAreaM2, a.maxAreaM2) })}
              title={tx(`component.${a.id}.name`, a.name)}
              stats={[
                `${fmt(sunlitPowerW(1, a.efficiency, a.cosFactor, orbit.sunDistanceAu))} W/m²`,
                `${a.kgPerM2} kg/m²`,
                `$${a.costPerM2} M/m²`,
                t('spacecraft.arrays.maxArea', { max: a.maxAreaM2 }),
              ]}
            >
              {tx(`component.${a.id}.description`, a.description)}
            </OptionCard>
          ))}
        </Grid>
        <div className="mt-3">
          <Slider
            label={t('spacecraft.arrays.area')}
            value={design.arrayAreaM2}
            min={0}
            max={array.maxAreaM2}
            step={0.1}
            onChange={(v) => update({ arrayAreaM2: v })}
            format={(v) => t('spacecraft.arrays.format', { area: fmt(v, 1), power: fmt(v * wPerM2) })}
          />
        </div>
      </Section>
      <Section title={t('spacecraft.battery.title')} hint={t('spacecraft.battery.hint')}>
        <Grid>
          {batteries.map((b) => (
            <OptionCard
              key={b.id}
              selected={design.batteryId === b.id}
              onClick={() => update({ batteryId: b.id })}
              title={tx(`component.${b.id}.name`, b.name)}
              stats={[
                `${b.massKg} kg`,
                `$${b.costM} M`,
                t('spacecraft.battery.dod', { dod: fmt((report.power.avgLoadW * report.power.eclipseMin) / 60 / b.capacityWh * 100) }),
              ]}
            />
          ))}
        </Grid>
        <div className="mt-3 rounded border border-slate-800 bg-slate-950/60 p-2">
          <div className="mb-1 flex flex-wrap justify-between gap-2 text-xs text-slate-400">
            <span>{t('spacecraft.battery.chartTitle', { min: fmt(report.power.periodMin) })}</span>
            <span>
              {t('spacecraft.battery.chartStats', { eclipse: fmt(report.power.eclipseMin), peak: fmt(report.power.peakLoadW) })}
            </span>
          </div>
          <PowerChart report={report} />
        </div>
      </Section>
      <Section title={t('spacecraft.adcs.title')} hint={t('spacecraft.adcs.hint')}>
        <Grid>
          {adcs.map((a) => (
            <OptionCard
              key={a.id}
              selected={design.adcsId === a.id}
              onClick={() => update({ adcsId: a.id })}
              title={tx(`component.${a.id}.name`, a.name)}
              stats={[t(ADCS_POINTING_KEY[a.pointing]), `${a.massKg} kg`, `${a.powerW} W`, `$${a.costM} M`]}
            />
          ))}
        </Grid>
      </Section>
      <Section title={t('spacecraft.obc.title')} hint={t('spacecraft.obc.hint')}>
        <Grid>
          {obcs.map((o) => (
            <OptionCard
              key={o.id}
              selected={design.obcId === o.id}
              onClick={() => update({ obcId: o.id })}
              title={tx(`component.${o.id}.name`, o.name)}
              stats={[`${o.storageGb} GB`, `${o.radToleranceKrad} krad`, `${o.massKg} kg`, `${o.powerW} W`, `$${o.costM} M`, t('spacecraft.trl', { trl: o.trl })]}
            />
          ))}
        </Grid>
      </Section>
      <Section title={t('spacecraft.compression.title')} hint={t('spacecraft.compression.hint')}>
        <Grid>
          {compression.map((c) => (
            <OptionCard
              key={c.id}
              selected={design.compressionId === c.id}
              onClick={() => update({ compressionId: c.id })}
              title={tx(`component.${c.id}.name`, c.name)}
              stats={[
                c.powerW ? `${c.powerW} W` : '0 W',
                c.costM ? `$${c.costM} M` : t('spacecraft.free'),
                c.scienceFactor < 1 ? t('spacecraft.compression.science', { factor: c.scienceFactor }) : undefined,
              ]}
            />
          ))}
        </Grid>
      </Section>
      <Section
        title={t('spacecraft.propulsion.title')}
        hint={t('spacecraft.propulsion.hint', {
          dv: fmt(report.mass.totalDv),
          prop: fmt(report.mass.propellantKg, 1),
        })}
      >
        <Grid>
          {propulsion.map((p) => (
            <OptionCard
              key={p.id}
              selected={design.propulsionId === p.id}
              onClick={() => update({ propulsionId: p.id })}
              title={tx(`component.${p.id}.name`, p.name)}
              stats={[p.ispS ? t('spacecraft.propulsion.isp', { isp: p.ispS }) : t('spacecraft.propulsion.noDv'), `${p.massKg} kg`, `$${p.costM} M`]}
            >
              {tx(`component.${p.id}.description`, p.description)}
            </OptionCard>
          ))}
        </Grid>
      </Section>
      <Section title={t('spacecraft.thermal.title')}>
        <Grid>
          {thermal.map((therm) => (
            <OptionCard
              key={therm.id}
              selected={design.thermalId === therm.id}
              onClick={() => update({ thermalId: therm.id })}
              title={tx(`component.${therm.id}.name`, therm.name)}
              stats={[
                `${therm.massKg} kg`,
                `${therm.powerW} W`,
                `$${therm.costM} M`,
                therm.coldCapable ? t('spacecraft.thermal.deepCold') : t('spacecraft.thermal.earthOnly'),
              ]}
            />
          ))}
        </Grid>
      </Section>
      <Section title={t('spacecraft.life.title')} hint={t('spacecraft.life.hint')}>
        <Slider
          label={t('spacecraft.life.planned')}
          value={design.designLifeYears}
          min={0.5}
          max={10}
          step={0.5}
          onChange={(v) => update({ designLifeYears: v })}
          format={(v) => t('spacecraft.life.years', { years: fmt(v, 1) })}
        />
      </Section>
    </div>
  )
}
