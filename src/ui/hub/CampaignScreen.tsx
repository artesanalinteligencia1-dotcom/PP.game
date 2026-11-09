import { useMsg } from '../../i18n'
import { useState } from 'react'
import { useMusic } from '../../audio/audio'
import { CONTRACTS, INVESTORS, TECH, availableLaunchers, canBuyTech, contractStatus, trustMultiplier, type InvestorId } from '../../engine/campaign'
import { getLauncher } from '../../engine/catalog'
import { fmt } from '../../i18n/en'
import { useGame } from '../../store/game'
import { Disclaimer, Pill } from '../components'
import { ProfileDialog } from './ProfileDialog'
import { useT, useTx, type StringKey } from '../../i18n'

const ACT_KEY: Record<number, StringKey> = {
  0: 'campaign.act.0',
  1: 'campaign.act.1',
  2: 'campaign.act.2',
  3: 'campaign.act.3',
  4: 'campaign.act.4',
}
const CLIENT_ICON: Record<string, string> = { agency: '🏛️', commercial: '💼', foundation: '🌱', self: '🔧' }

export function CampaignScreen() {
  const c = useGame((s) => s.campaign)!
  const go = useGame((s) => s.go)
  const startContract = useGame((s) => s.startContract)
  const buyTech = useGame((s) => s.buyTech)
  const setProfile = useGame((s) => s.setProfile)
  const resetCampaign = useGame((s) => s.resetCampaign)
  const lastReward = useGame((s) => s.lastReward)
  const [editing, setEditing] = useState(false)
  const t = useT()
  const msg = useMsg()
  const tx = useTx()
  useMusic('design')
  const launchersNow = availableLaunchers(c)

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <header className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => go('home')} className="text-sm text-slate-400 hover:text-slate-100">
          {t('campaign.back')}
        </button>
        <h1 className="text-2xl font-semibold">
          {t('campaign.institute', { title: c.profile.title, name: c.profile.name })}
        </h1>
        <Pill tone="sky">{t(`profile.level.${c.profile.level}` as StringKey)}</Pill>
        <button type="button" onClick={() => setEditing(true)} className="text-xs text-slate-400 hover:text-slate-100">
          {t('campaign.editProfile')}
        </button>
        <div className="ml-auto flex gap-4 font-display text-lg">
          <span title={t('campaign.funds.tip')}>{t('campaign.funds.val', { funds: fmt(c.fundsM, 1) })}</span>
          <span title={t('campaign.prestige.tip')}>{t('campaign.prestige.val', { prestige: c.prestige })}</span>
        </div>
      </header>

      {lastReward && (
        <section className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
          <span className="font-semibold">{tx(`contract.${lastReward.contractId}.title`, lastReward.contractTitle)}:</span> {lastReward.fundsM >= 0 ? '+' : '−'}${fmt(Math.abs(lastReward.fundsM), 1)} M ·{' '}
          {t('campaign.reward.prestige', { prestige: lastReward.prestige })}
          {lastReward.notes.map((n) => (
            <span key={typeof n === 'string' ? n : n.key} className="ml-2 text-slate-300">
              · {msg(n)}
            </span>
          ))}
        </section>
      )}

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        {(Object.keys(INVESTORS) as InvestorId[]).map((id) => (
          <div key={id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold">
                {CLIENT_ICON[id]} {tx(`investor.${id}.name`, INVESTORS[id].name)}
              </span>
              <span className="font-mono text-xs text-slate-400">
                {t('campaign.investor.pays', { mult: trustMultiplier(c.trust[id]).toFixed(2) })}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded bg-slate-800" title={t('campaign.investor.trust', { trust: c.trust[id] })}>
              <div className="h-full bg-violet-400" style={{ width: `${c.trust[id]}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-400">{tx(`investor.${id}.wants`, INVESTORS[id].wants)}</p>
          </div>
        ))}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-6">
          {[0, 1, 2, 3, 4].map((act) => {
            const list = CONTRACTS.filter((k) => k.act === act)
            if (!list.length) return null
            return (
              <div key={act}>
                <h2 className="hud-label">{t(ACT_KEY[act])}</h2>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {list.map((k) => {
                    const status = contractStatus(c, k)
                    const rec = c.completed[k.id]
                    return (
                      <div
                        key={k.id}
                        className={`rounded-xl border p-4 ${status === 'locked' ? 'border-slate-800 bg-slate-950/40 opacity-70' : status === 'completed' ? 'border-emerald-500/40 bg-slate-900/70' : 'border-sky-500/50 bg-slate-900/70'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-display text-lg font-semibold">{tx(`contract.${k.id}.title`, k.title)}</span>
                          <span title={k.client === 'self' ? t('campaign.contract.ownProject') : tx(`investor.${k.client}.name`, INVESTORS[k.client].name)}>{CLIENT_ICON[k.client]}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">{tx(`contract.${k.id}.blurb`, k.blurb)}</p>
                        {k.note && <p className="mt-1 text-xs italic text-slate-500">{tx(`contract.${k.id}.note`, k.note)}</p>}
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          {k.paymentM > 0 && <Pill>{t('campaign.contract.pays', { payment: k.paymentM })}</Pill>}
                          {rec && <Pill tone="emerald">{t('campaign.contract.best', { best: rec.best, rank: t(`results.rank.${rec.rank}` as StringKey) })}</Pill>}
                          {status === 'locked' && (
                            <Pill tone="rose">
                              {k.kind === 'preview'
                                ? t('campaign.contract.comingLater')
                                : k.requires.prestige && c.prestige < k.requires.prestige
                                  ? t('campaign.contract.needsPrestige', { prestige: k.requires.prestige })
                                  : k.requires.act1Completed
                                    ? t('campaign.contract.completeAct1', { count: k.requires.act1Completed })
                                    : t('campaign.contract.completePrevious')}
                            </Pill>
                          )}
                        </div>
                        {status !== 'locked' && (
                          <button
                            type="button"
                            onClick={() => startContract(k.id)}
                            className="mt-3 btn-primary px-3 py-1.5 text-sm "
                          >
                            {status === 'completed' ? t('campaign.contract.flyAgain') : t('campaign.contract.accept')}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <h2 className="hud-label">{t('campaign.tech.title')}</h2>
            <p className="mt-1 text-xs text-slate-400">{t('campaign.tech.hint')}</p>
            <ul className="mt-3 space-y-3">
              {TECH.map((techItem) => {
                const owned = c.unlocked.includes(techItem.id)
                const check = canBuyTech(c, techItem)
                const real = techItem.launcherId ? getLauncher(techItem.launcherId).realWorld : null
                return (
                  <li key={techItem.id} className={`rounded-lg border p-3 text-sm ${owned ? 'border-emerald-500/40' : techItem.available ? 'border-slate-700' : 'border-slate-800 opacity-60'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium">{tx(`tech.${techItem.id}.name`, techItem.name)}</span>
                      {owned ? <Pill tone="emerald">{t('campaign.tech.owned')}</Pill> : <Pill>{t('campaign.tech.act', { act: techItem.act })}</Pill>}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{tx(`tech.${techItem.id}.description`, techItem.description)}</p>
                    {real && <p className="mt-1 text-[11px] text-sky-300/80">{t('campaign.realWorld', { real: tx(`component.${techItem.launcherId}.realWorld`, real) })}</p>}
                    {!owned && (
                      <button
                        type="button"
                        disabled={!check.ok}
                        onClick={() => buyTech(techItem.id)}
                        className="mt-2 rounded bg-orange-500 px-2 py-1 text-xs font-semibold text-white hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                        title={check.why && msg(check.why)}
                      >
                        {check.ok ? t('campaign.tech.unlockFor', { cost: techItem.costM }) : check.why && msg(check.why)}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
            <h2 className="hud-label">{t('campaign.launchers.title')}</h2>
            <ul className="mt-2 space-y-1 text-xs text-slate-300">
              {launchersNow.map((id) => (
                <li key={id}>• {tx(`component.${id}.name`, getLauncher(id).name)}</li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(t('campaign.resetConfirm'))) resetCampaign()
            }}
            className="text-xs text-slate-500 hover:text-rose-300"
          >
            {t('campaign.resetBtn')}
          </button>
        </aside>
      </div>
      <div className="mt-8">
        <Disclaimer />
      </div>
      {editing && (
        <ProfileDialog
          title={t('campaign.editProfile')}
          confirm={t('campaign.save')}
          initial={c.profile}
          onCancel={() => setEditing(false)}
          onConfirm={(p) => {
            setProfile(p)
            setEditing(false)
          }}
        />
      )}
    </main>
  )
}
