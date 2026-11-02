import { useState } from 'react'
import { useMusic } from '../../audio/audio'
import { PROTAGONIST } from '../../i18n/en'
import { useGame } from '../../store/game'
import { Disclaimer } from '../components'
import { ProfileDialog } from './ProfileDialog'

function Tile({ icon, title, text, onClick, accent }: { icon: string; title: string; text: string; onClick: () => void; accent?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
        accent ? 'border-orange-400/60 bg-orange-500/10 hover:border-orange-300' : 'border-slate-700 bg-slate-900/70 hover:border-sky-400'
      }`}
    >
      <div className="text-2xl" aria-hidden="true">
        {icon}
      </div>
      <div className="font-display mt-2 text-lg font-semibold">{title}</div>
      <div className="mt-1 text-sm text-slate-400">{text}</div>
    </button>
  )
}

export function HomeScreen() {
  const campaign = useGame((s) => s.campaign)
  const go = useGame((s) => s.go)
  const openLearn = useGame((s) => s.openLearn)
  const startCampaign = useGame((s) => s.startCampaign)
  const startScenario = useGame((s) => s.startScenario)
  const [newCareer, setNewCareer] = useState(false)
  useMusic('home')
  const who = campaign ? `${campaign.profile.title} ${campaign.profile.name}` : `${PROTAGONIST.title} ${PROTAGONIST.name}`

  return (
    <main className="relative mx-auto max-w-5xl px-4 py-10">
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-400">Space Mission Design</p>
        <h1 className="mt-2 text-5xl font-bold sm:text-6xl">PP.game</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          A scientist who wants to do science — and has to live with physics, money and investors. Design it. Launch it. Learn from it.
        </p>
      </header>
      <section className="mx-auto mt-8 flex max-w-2xl items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-orange-500 to-violet-600 font-display text-xl font-bold">
          {who
            .replace(/^(Dr\.|Eng\.)\s*/, '')
            .split(' ')
            .map((w) => w[0])
            .slice(0, 2)
            .join('')}
        </div>
        <div className="text-sm">
          <div className="font-display text-base font-semibold">{who}</div>
          <div className="text-slate-400">{PROTAGONIST.bio}</div>
          <div className="text-[11px] text-slate-500">Fictional character inspired by the story of Pedro Paulet (1874–1945).</div>
        </div>
      </section>
      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Tile
          icon="🚀"
          title={campaign ? 'Continue career' : 'New career'}
          text={campaign ? `Funds $${campaign.fundsM} M · Prestige ${campaign.prestige}` : 'Start with Paulet-1 and grow a space program, contract by contract.'}
          onClick={() => (campaign ? go('campaign') : setNewCareer(true))}
          accent
        />
        <Tile icon="🛰️" title="Free mission" text="Pick any mission and design freely — no career progress." onClick={() => go('free')} />
        <Tile icon="🎬" title="Watch intro" text="How Pedro Goicochea became a physicist (90 s story, test version)." onClick={() => go('intro')} />
        <Tile icon="📚" title="Learn" text="Orbits, the rocket equation and the budgets every mission juggles." onClick={() => openLearn('orbit')} />
        <Tile icon="🔥" title="Legacy: Paulet" text="The engineer from Arequipa and his liquid-fuel rocket claims — facts vs. legend." onClick={() => openLearn('paulet')} />
        <Tile icon="🧪" title="Sandbox" text="No budget, no deadline — just physics." onClick={() => startScenario('sandbox')} />
      </section>
      <footer className="mt-10 text-center">
        <Disclaimer />
      </footer>
      {newCareer && (
        <ProfileDialog
          title="New career"
          confirm="Start career"
          initial={{ name: PROTAGONIST.name, title: 'Dr.', level: 'cadet' }}
          onCancel={() => setNewCareer(false)}
          onConfirm={(p) => {
            setNewCareer(false)
            startCampaign(p)
          }}
        />
      )}
    </main>
  )
}
