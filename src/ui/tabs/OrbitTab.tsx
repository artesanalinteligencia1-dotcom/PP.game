import { useMemo } from 'react'
import { defaultTcmReserve, getOrbit, getRoute, launchCapacityKg, launchers, maintenanceDvPerYear, orbits, resolveLauncher, routesFor } from '../../engine'
import { CUSTOM_LAUNCHER_ID, analyzeRocket, rocketToLauncher } from '../../engine/rocket'
import { useRocket } from '../../store/rocket'
import { CR3BPView, L2_ORBIT, routeSchematic } from '../threebody/CR3BPView'
import type { Design, DesignReport } from '../../engine/types'
import { fmt } from '../../i18n/en'
import { useGame } from '../../store/game'
import { OrbitDiagram } from '../OrbitDiagram'
import { Grid, OptionCard, Pill, Section, Slider } from '../components'
import { useT, useTx } from '../../i18n'

export function OrbitTab({ design, report }: { design: Design; report: DesignReport }) {
  const update = useGame((s) => s.update)
  const launcherAllowed = useGame((s) => s.launcherAllowed)
  const setOrbit = useGame((s) => s.setOrbit)
  const go = useGame((s) => s.go)
  // Your own rocket: the card shows the copy inside this design once chosen, the workbench's rocket before that
  const workbench = useRocket((s) => s.design)
  const usingOwn = design.launcherId === CUSTOM_LAUNCHER_ID
  const ownDesign = usingOwn && design.customRocket ? design.customRocket : workbench
  const own = useMemo(() => ({ launcher: rocketToLauncher(ownDesign), report: analyzeRocket(ownDesign) }), [ownDesign])
  const ownStale = usingOwn && JSON.stringify(design.customRocket) !== JSON.stringify(workbench)
  const t = useT()
  const tx = useTx()
  const orbit = getOrbit(design.orbitId)
  const [lo, hi] = orbit.altitudeKm
  return (
    <div>
      <Section title={t('orbit.title')} hint={t('orbit.hint')}>
        <Grid>
          {orbits.map((o) => (
            <OptionCard
              key={o.id}
              selected={design.orbitId === o.id}
              onClick={() => setOrbit(o.id)}
              title={tx(`component.${o.id}.name`, o.name)}
              stats={[
                o.altitudeKm[0] === o.altitudeKm[1] ? (o.body === 'sun' ? t('orbit.interplanetary') : `${fmt(o.altitudeKm[0])} km`) : `${o.altitudeKm[0]}–${o.altitudeKm[1]} km`,
                o.insertionDv ? t('orbit.insertionDv', { dv: o.insertionDv }) : t('orbit.directInsertion'),
              ]}
            >
              {tx(`component.${o.id}.description`, o.description)}
            </OptionCard>
          ))}
        </Grid>
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <OrbitDiagram orbit={orbit} altitudeKm={design.altitudeKm} eclipseFraction={report.power.eclipseFraction} />
          <div className="w-full flex-1 space-y-3 text-sm">
            {lo !== hi && (
              <Slider
                label={t('orbit.altitude')}
                value={design.altitudeKm}
                min={lo}
                max={hi}
                step={10}
                onChange={(v) => update({ altitudeKm: v })}
                format={(v) => `${fmt(v)} km`}
              />
            )}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <dt className="text-slate-400">{t('orbit.period')}</dt>
              <dd className="font-mono">{orbit.body === 'sun' ? '—' : `${fmt(report.power.periodMin)} min`}</dd>
              <dt className="text-slate-400">{t('orbit.eclipse')}</dt>
              <dd className="font-mono">
                {fmt(report.power.eclipseMin)} min ({fmt(report.power.eclipseFraction * 100)}%)
              </dd>
              <dt className="text-slate-400">{t('orbit.stationKeeping')}</dt>
              <dd className="font-mono">{t('orbit.dvPerYear', { dv: fmt(maintenanceDvPerYear(orbit, design.altitudeKm), 1) })}</dd>
              <dt className="text-slate-400">{t('orbit.radiation')}</dt>
              <dd className="font-mono">{t('orbit.kradPerYear', { rad: orbit.radiationKradYr })}</dd>
              <dt className="text-slate-400">{t('orbit.totalDv')}</dt>
              <dd className="font-mono">{t('orbit.dvMs', { dv: fmt(report.mass.totalDv) })}</dd>
              {report.schedule.transferMonths > 0 && (
                <>
                  <dt className="text-slate-400">{t('orbit.transferTime')}</dt>
                  <dd className="font-mono">{t('orbit.transferMonths', { months: fmt(report.schedule.transferMonths, 1) })}</dd>
                </>
              )}
            </dl>
            {orbit.drag && (
              <p className="text-xs text-slate-400">
                {t('orbit.dragHint')}
              </p>
            )}
          </div>
        </div>
      </Section>
      {routesFor(orbit.id).length > 0 && (
        <Section
          title={t('orbit.route.title')}
          hint={t('orbit.route.hint')}
        >
          <Grid>
            {routesFor(orbit.id).map((r) => (
              <OptionCard
                key={r.id}
                selected={getRoute(orbit.id, design.routeId)?.id === r.id}
                onClick={() => update({ routeId: r.id, tcmReserveDv: undefined })}
                title={tx(`route.${orbit.id}.${r.id}.name`, r.name)}
                stats={[
                  t('orbit.route.arrivalBurn', { dv: r.insertionDv }),
                  t('orbit.route.months', { months: fmt(r.transferMonths, 1) }),
                  t('orbit.route.corrections', { dv: r.tcmDv }),
                ]}
              >
                {tx(`route.${orbit.id}.${r.id}.description`, r.description)}
              </OptionCard>
            ))}
          </Grid>
          {(() => {
            const route = getRoute(orbit.id, design.routeId)!
            const reserve = design.tcmReserveDv ?? defaultTcmReserve(route)
            return (
              <div className="mt-3 space-y-3">
                <Slider
                  label={t('orbit.route.tcmReserve')}
                  value={reserve}
                  min={0}
                  max={150}
                  step={5}
                  onChange={(v) => update({ tcmReserveDv: v })}
                  format={(v) => t('orbit.route.tcmFormat', { val: fmt(v), need: route.tcmDv })}
                />
                <p className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-3 text-xs text-slate-300">
                  <span className="font-semibold text-sky-300">{t('orbit.realWorld')}</span>
                  {tx(`route.${orbit.id}.${route.id}.realWorld`, route.realWorld)}
                </p>
                {orbit.id === 'em_l2_halo' && (
                  <div className="overflow-hidden rounded-xl border border-slate-800">
                    <CR3BPView label={t('orbit.cr3bp.label')}>
                      {({ path, px }) => (
                        <g>
                          <path d={routeSchematic(route.id, px)} fill="none" stroke="#38bdf8" strokeDasharray="5 5" />
                          <path d={path(L2_ORBIT)} fill="none" stroke="#fbbf24" strokeWidth={2} />
                          <text x={px(1.19, 0.12)[0]} y={px(1.19, 0.12)[1]} fill="#fbbf24" fontSize="11" textAnchor="middle">
                            {t('orbit.cr3bp.loop')}
                          </text>
                        </g>
                      )}
                    </CR3BPView>
                    <p className="px-3 py-2 text-[11px] text-slate-500">{t('orbit.cr3bp.legend')}</p>
                  </div>
                )}
              </div>
            )
          })()}
        </Section>
      )}
      <Section title={t('orbit.launcher.title')} hint={t('orbit.launcher.hint')}>
        <Grid>
          {[...launchers, own.launcher].map((l) => {
            const isOwn = l.id === CUSTOM_LAUNCHER_ID
            const cap = launchCapacityKg(l, orbit)
            const fits = cap >= report.mass.wetKg
            const allowed = launcherAllowed(l.id)
            const priceM = l.costM + (l.costPerKgM ?? 0) * (Number.isFinite(report.mass.wetKg) ? report.mass.wetKg : 0)
            return (
              <OptionCard
                key={l.id}
                selected={design.launcherId === l.id}
                disabled={!allowed}
                onClick={() => update({ launcherId: l.id, ...(isOwn ? { customRocket: ownDesign } : {}), ...(l.rideshare && design.altitudeKm > l.rideshare.maxAltitudeKm ? { altitudeKm: l.rideshare.maxAltitudeKm } : {}) })}
                title={tx(`component.${l.id}.name`, l.name)}
                stats={[
                  l.suborbital
                    ? t('orbit.launcher.suborbital', { apogee: l.suborbital.apogeeKm, payload: l.suborbital.payloadKg })
                    : cap > 0
                    ? t('orbit.launcher.capToOrbit', { cap: fmt(cap) })
                    : t('orbit.launcher.cannotReach'),
                  `$${fmt(priceM, 1)} M${l.costPerKgM ? t('orbit.launcher.perKg') : ''}`,
                  t('orbit.launcher.reliable', { pct: fmt(l.reliability * 100) }),
                  l.kind === 'reusable' ? t('orbit.launcher.boosterLands') : undefined,
                  isOwn ? t('orbit.launcher.own.stats', { height: fmt(own.report.heightM, 1), stages: own.report.stages.length }) : undefined,
                ]}
                badge={
                  !allowed ? (
                    <Pill tone="slate">{t('orbit.launcher.locked')}</Pill>
                  ) : cap > 0 ? (
                    <Pill tone={fits ? 'emerald' : 'rose'}>{fits ? t('orbit.launcher.fits') : t('orbit.launcher.tooHeavy')}</Pill>
                  ) : (
                    <Pill tone="rose">{t('orbit.launcher.no')}</Pill>
                  )
                }
              >
                {!allowed ? t(isOwn ? 'orbit.launcher.own.locked' : 'orbit.launcher.unlockHint') : isOwn && own.report.issues.some((i) => i.severity === 'error') ? t('orbit.launcher.own.broken') : null}
              </OptionCard>
            )
          })}
        </Grid>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <span>{t('orbit.launcher.own.hint')}</span>
          <button type="button" className="btn-secondary px-3 py-1" onClick={() => go('rocket')}>
            {t('orbit.launcher.own.edit')}
          </button>
          {ownStale && (
            <button type="button" className="btn-secondary border-amber-400/60 px-3 py-1 text-amber-200" onClick={() => update({ customRocket: workbench })}>
              {t('orbit.launcher.own.refresh')}
            </button>
          )}
        </div>
        <p className="mt-3 rounded-lg border border-sky-500/30 bg-sky-500/5 p-3 text-xs text-slate-300">
          <span className="font-semibold text-sky-300">{t('orbit.realWorld')}</span>
          {tx(`component.${design.launcherId}.realWorld`, resolveLauncher(design).realWorld)}
        </p>
      </Section>
    </div>
  )
}
