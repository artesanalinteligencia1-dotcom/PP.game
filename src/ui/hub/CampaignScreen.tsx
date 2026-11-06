import { useState } from 'react'
import { useMusic } from '../../audio/audio'
import { CONTRACTS, INVESTORS, TECH, availableLaunchers, canBuyTech, contractStatus, trustMultiplier, type InvestorId } from '../../engine/campaign'
import { getLauncher } from '../../engine/catalog'
import { fmt } from '../../i18n/en'
import { useGame } from '../../store/game'
import { Disclaimer, Pill } from '../components'
import { ProfileDialog } from './ProfileDialog'

const ACT_TITLE: Record<number, string> = {
  0: 'Prologue — Paulet’s notebooks',
  1: 'Act 1 — Earth orbit (today’s technology)',
  2: 'Act 2 — The Moon',
  3: 'Act 3 — Mars (near future)',
  4: 'Act 4 — Beyond (speculative)',
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
  useMusic('design')
  const launchersNow = availableLaunchers(c)

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <header className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => go('home')} className="text-sm text-slate-400 hover:text-slate-100">
          ← Home
        </button>
        <h1 className="text-2xl font-semibold">
          {c.profile.title} {c.profile.name}’s space institute
        </h1>
        <Pill tone="sky">{c.profile.level}</Pill>
        <button type="button" onClick={() => setEditing(true)} className="text-xs text-slate-400 hover:text-slate-100">
          Edit profile
        </button>
        <div className="ml-auto flex gap-4 font-display text-lg">
          <span title="Funds: money for technology and to absorb losses">💰 ${fmt(c.fundsM, 1)} M</span>
          <span title="Prestige: reputation that unlocks bigger contracts and technology">⭐ {c.prestige}</span>
        </div>
      </header>

      {lastReward && (
        <section className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
          <span className="font-semibold">{lastReward.contractTitle}:</span> {lastReward.fundsM >= 0 ? '+' : '−'}${fmt(Math.abs(lastReward.fundsM), 1)} M ·{' '}
          +{lastReward.prestige} prestige
          {lastReward.notes.map((n) => (
            <span key={n} className="ml-2 text-slate-300">
              · {n}
            </span>
          ))}
        </section>
      )}

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        {(Object.keys(INVESTORS) as InvestorId[]).map((id) => (
          <div key={id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold">
                {CLIENT_ICON[id]} {INVESTORS[id].name}
              </span>
              <span className="font-mono text-xs text-slate-400">pays ×{trustMultiplier(c.trust[id]).toFixed(2)}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded bg-slate-800" title={`Trust ${c.trust[id]}/100`}>
              <div className="h-full bg-violet-400" style={{ width: `${c.trust[id]}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-400">{INVESTORS[id].wants}</p>
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
                <h2 className="hud-label">{ACT_TITLE[act]}</h2>
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
                          <span className="font-display text-lg font-semibold">{k.title}</span>
                          <span title={k.client === 'self' ? 'Your own project' : INVESTORS[k.client].name}>{CLIENT_ICON[k.client]}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">{k.blurb}</p>
                        {k.note && <p className="mt-1 text-xs italic text-slate-500">{k.note}</p>}
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          {k.paymentM > 0 && <Pill>pays ${k.paymentM} M</Pill>}
                          {rec && <Pill tone="emerald">best {rec.best} · {rec.rank}</Pill>}
                          {status === 'locked' && (
                            <Pill tone="rose">
                              {k.kind === 'preview'
                                ? 'coming later'
                                : k.requires.prestige && c.prestige < k.requires.prestige
                                  ? `needs ${k.requires.prestige} prestige`
                                  : k.requires.act1Completed
                                    ? `complete ${k.requires.act1Completed} Act 1 contracts`
                                    : 'complete the previous contract'}
                            </Pill>
                          )}
                        </div>
                        {status !== 'locked' && (
                          <button
                            type="button"
                            onClick={() => startContract(k.id)}
                            className="mt-3 btn-primary px-3 py-1.5 text-sm "
                          >
                            {status === 'completed' ? 'Fly again' : 'Accept contract'}
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
            <h2 className="hud-label">Technology</h2>
            <p className="mt-1 text-xs text-slate-400">Money buys capabilities — never a bigger contract budget.</p>
            <ul className="mt-3 space-y-3">
              {TECH.map((t) => {
                const owned = c.unlocked.includes(t.id)
                const check = canBuyTech(c, t)
                const real = t.launcherId ? getLauncher(t.launcherId).realWorld : null
                return (
                  <li key={t.id} className={`rounded-lg border p-3 text-sm ${owned ? 'border-emerald-500/40' : t.available ? 'border-slate-700' : 'border-slate-800 opacity-60'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium">{t.name}</span>
                      {owned ? <Pill tone="emerald">owned</Pill> : <Pill>Act {t.act}</Pill>}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{t.description}</p>
                    {real && <p className="mt-1 text-[11px] text-sky-300/80">In the real world: {real}</p>}
                    {!owned && (
                      <button
                        type="button"
                        disabled={!check.ok}
                        onClick={() => buyTech(t.id)}
                        className="mt-2 rounded bg-orange-500 px-2 py-1 text-xs font-semibold text-white hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                        title={check.why}
                      >
                        {check.ok ? `Unlock for $${t.costM} M` : check.why}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
            <h2 className="hud-label">Your launchers</h2>
            <ul className="mt-2 space-y-1 text-xs text-slate-300">
              {launchersNow.map((id) => (
                <li key={id}>• {getLauncher(id).name}</li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Delete this career and start over?')) resetCampaign()
            }}
            className="text-xs text-slate-500 hover:text-rose-300"
          >
            Reset career
          </button>
        </aside>
      </div>
      <div className="mt-8">
        <Disclaimer />
      </div>
      {editing && (
        <ProfileDialog
          title="Edit profile"
          confirm="Save"
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
