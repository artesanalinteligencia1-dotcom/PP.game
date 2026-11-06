import { antennas, bands, getBand, getOrbit, stationContactMinutes, stations } from '../../engine'
import type { Design, DesignReport } from '../../engine/types'
import { fmt } from '../../i18n/en'
import { useGame } from '../../store/game'
import { Grid, OptionCard, Pill, Section } from '../components'

export function CommsTab({ design, report }: { design: Design; report: DesignReport }) {
  const update = useGame((s) => s.update)
  const setBand = useGame((s) => s.setBand)
  const toggleStation = useGame((s) => s.toggleStation)
  const band = getBand(design.bandId)
  const orbit = getOrbit(design.orbitId)
  return (
    <div>
      <Section
        title="Radio band"
        hint={`Higher bands carry more data but cost more power and money. Link rate here: ${fmt(report.data.linkRateMbps, 2)} Mbit/s (band × antenna gain × distance factor).`}
      >
        <Grid>
          {bands.map((b) => (
            <OptionCard
              key={b.id}
              selected={design.bandId === b.id}
              onClick={() => setBand(b.id)}
              title={b.name}
              stats={[`${b.rateMbps} Mbit/s near Earth`, `${b.txPowerW} W transmitting`, `${b.massKg} kg`, `$${b.costM} M`]}
            />
          ))}
        </Grid>
      </Section>
      <Section title="Antenna">
        <Grid>
          {antennas.map((a) => (
            <OptionCard
              key={a.id}
              selected={design.antennaId === a.id}
              disabled={!band.antennas.includes(a.id)}
              onClick={() => update({ antennaId: a.id })}
              title={a.name}
              stats={[`gain ×${a.gain}`, `${a.massKg} kg`, `$${a.costM} M`, a.pointing !== 'coarse' ? 'needs pointing' : undefined]}
            />
          ))}
        </Grid>
      </Section>
      <Section
        title="Ground stations"
        hint={`Contact: ${fmt(report.data.contactMinDay)} min/day → ${fmt(report.data.downlinkGbDay, 1)} GB/day. Each station adds a monthly fee. Polar orbits pass over high-latitude stations on almost every orbit.`}
      >
        <Grid>
          {stations.map((s) => {
            const min = stationContactMinutes(orbit, design.altitudeKm, s)
            return (
              <OptionCard
                key={s.id}
                selected={design.stationIds.includes(s.id)}
                onClick={() => toggleStation(s.id)}
                title={s.name}
                stats={[orbit.contact === 'continuous' ? 'continuous view' : `${fmt(min)} min/day`, `$${fmt(s.costPerMonthM * 12, 2)} M/yr`]}
                badge={s.deepSpace ? <Pill tone="violet">deep space</Pill> : undefined}
              />
            )
          })}
        </Grid>
        <p className="mt-3 text-xs text-slate-400">
          Storage on board: {report.data.storageGb} GB.{' '}
          {report.data.daysToFull !== null ? `At current rates it fills in ${fmt(report.data.daysToFull, 1)} days.` : 'Downlink keeps up with production.'}
        </p>
      </Section>
    </div>
  )
}
