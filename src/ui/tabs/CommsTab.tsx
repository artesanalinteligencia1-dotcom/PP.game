import { antennas, bands, getBand, getOrbit, stationContactMinutes, stations } from '../../engine'
import type { Design, DesignReport } from '../../engine/types'
import { fmt } from '../../i18n/en'
import { useGame } from '../../store/game'
import { Grid, OptionCard, Pill, Section } from '../components'
import { useT, useTx } from '../../i18n'

export function CommsTab({ design, report }: { design: Design; report: DesignReport }) {
  const update = useGame((s) => s.update)
  const setBand = useGame((s) => s.setBand)
  const toggleStation = useGame((s) => s.toggleStation)
  const t = useT()
  const tx = useTx()
  const band = getBand(design.bandId)
  const orbit = getOrbit(design.orbitId)
  return (
    <div>
      <Section
        title={t('comms.band')}
        hint={t('comms.band.hint', { rate: fmt(report.data.linkRateMbps, 2) })}
      >
        <Grid>
          {bands.map((b) => (
            <OptionCard
              key={b.id}
              selected={design.bandId === b.id}
              onClick={() => setBand(b.id)}
              title={tx(`component.${b.id}.name`, b.name)}
              stats={[
                t('comms.band.rateNearEarth', { rate: b.rateMbps }),
                t('comms.band.txPower', { power: b.txPowerW }),
                `${b.massKg} kg`,
                `$${b.costM} M`,
              ]}
            />
          ))}
        </Grid>
      </Section>
      <Section title={t('comms.antenna')}>
        <Grid>
          {antennas.map((a) => (
            <OptionCard
              key={a.id}
              selected={design.antennaId === a.id}
              disabled={!band.antennas.includes(a.id)}
              onClick={() => update({ antennaId: a.id })}
              title={tx(`component.${a.id}.name`, a.name)}
              stats={[
                t('comms.antenna.gain', { gain: a.gain }),
                `${a.massKg} kg`,
                `$${a.costM} M`,
                a.pointing !== 'coarse' ? t('comms.antenna.needsPointing') : undefined,
              ]}
            />
          ))}
        </Grid>
      </Section>
      <Section
        title={t('comms.stations')}
        hint={t('comms.stations.hint', {
          contact: fmt(report.data.contactMinDay),
          downlink: fmt(report.data.downlinkGbDay, 1),
        })}
      >
        <Grid>
          {stations.map((s) => {
            const min = stationContactMinutes(orbit, design.altitudeKm, s)
            return (
              <OptionCard
                key={s.id}
                selected={design.stationIds.includes(s.id)}
                onClick={() => toggleStation(s.id)}
                title={tx(`component.${s.id}.name`, s.name)}
                stats={[
                  orbit.contact === 'continuous' ? t('comms.stations.continuous') : t('comms.stations.contact', { min: fmt(min) }),
                  t('comms.stations.costYear', { cost: fmt(s.costPerMonthM * 12, 2) }),
                ]}
                badge={s.deepSpace ? <Pill tone="violet">{t('comms.stations.deepSpace')}</Pill> : undefined}
              />
            )
          })}
        </Grid>
        <p className="mt-3 text-xs text-slate-400">
          {t('comms.storage', { storage: report.data.storageGb })}{' '}
          {report.data.daysToFull !== null
            ? t('comms.storage.fillsIn', { days: fmt(report.data.daysToFull, 1) })
            : t('comms.storage.keepsUp')}
        </p>
      </Section>
    </div>
  )
}
