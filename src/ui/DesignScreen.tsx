import { useMemo } from 'react'
import { useMusic } from '../audio/audio'
import { SpacecraftSprite } from './spacecraft/SpacecraftSprite'
import { evaluateDesign } from '../engine/evaluate'
import { getScenario } from '../engine/catalog'
import type { Design } from '../engine/types'
import { useGame, type TabId } from '../store/game'
import { Dashboard } from './Dashboard'
import { Disclaimer } from './components'
import { CommsTab } from './tabs/CommsTab'
import { MissionTab } from './tabs/MissionTab'
import { OrbitTab } from './tabs/OrbitTab'
import { PayloadTab } from './tabs/PayloadTab'
import { ReviewTab } from './tabs/ReviewTab'
import { SpacecraftTab } from './tabs/SpacecraftTab'

const TABS: { id: TabId; label: string }[] = [
  { id: 'mission', label: 'Mission' },
  { id: 'payload', label: 'Payload' },
  { id: 'spacecraft', label: 'Spacecraft' },
  { id: 'orbit', label: 'Orbit & Launch' },
  { id: 'comms', label: 'Ground & Comms' },
  { id: 'review', label: 'Review' },
]

export function DesignScreen({ design }: { design: Design }) {
  const tab = useGame((s) => s.tab)
  const setTab = useGame((s) => s.setTab)
  const exit = useGame((s) => s.exit)
  const resetDesign = useGame((s) => s.resetDesign)
  const mode = useGame((s) => s.mode)
  const scenario = getScenario(design.scenarioId)
  const designKey = JSON.stringify(design)
  const report = useMemo(() => evaluateDesign(design, scenario), [design, scenario])
  const blocking = report.review.filter((r) => r.blocking).length
  useMusic('design')

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 bg-slate-950/40 backdrop-blur-md">
        <div className="mx-10 flex items-end gap-6 border-b border-white/15 pb-3 pt-5">
          <div className="min-w-0">
            <button type="button" data-sound="back" onClick={exit} className="hud-label hover:text-white">
              ← {mode === 'campaign' ? 'Career' : 'Missions'}
              {mode === 'campaign' && <span className="ml-3 text-orange-300">· Contract</span>}
            </button>
            <h1 className="mt-1 truncate font-display text-3xl">
              {scenario.name} <span className="text-base text-white/50">· {scenario.tagline}</span>
            </h1>
          </div>
          <nav className="ml-auto flex shrink-0 gap-5" aria-label="Design steps">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className={`whitespace-nowrap border-b-2 pb-1 text-sm transition focus:outline-none focus-visible:text-white ${
                  tab === t.id ? 'border-orange-400 text-white' : 'border-transparent text-white/55 hover:text-white'
                }`}
              >
                {t.label}
                {t.id === 'review' && blocking > 0 && <span className="ml-1 rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{blocking}</span>}
              </button>
            ))}
            <button type="button" onClick={resetDesign} className="pb-1 text-xs text-white/40 hover:text-white">
              Reset
            </button>
          </nav>
        </div>
      </header>
      <div className="mx-10 grid gap-8 py-6 grid-cols-[minmax(0,1fr)_380px]">
        <aside className="order-last">
          <div className="hud-panel sticky top-28 p-5">
            <p className="hud-label mb-3">Spacecraft &amp; budgets</p>
            <div className="mb-3 flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="rounded-lg bg-slate-950/80 p-1" title="Your spacecraft: every part you choose appears here, on the launch pad and in flight.">
                <SpacecraftSprite design={design} size={92} />
              </div>
              <div className="text-xs text-slate-400">
                <div className="font-display text-sm font-semibold text-slate-200">Your spacecraft</div>
                Built from your choices: arrays, antenna, instruments (green = astrobiology, violet = astrophysics), thrusters and radiators.
              </div>
            </div>
            <Dashboard report={report} designKey={designKey} />
          </div>
        </aside>
        <main className="min-w-0">
          {tab === 'mission' && <MissionTab scenario={scenario} report={report} />}
          {tab === 'payload' && <PayloadTab design={design} scenario={scenario} />}
          {tab === 'spacecraft' && <SpacecraftTab design={design} report={report} />}
          {tab === 'orbit' && <OrbitTab design={design} report={report} />}
          {tab === 'comms' && <CommsTab design={design} report={report} />}
          {tab === 'review' && <ReviewTab report={report} />}
          <div className="mt-8 border-t border-slate-800 pt-3">
            <Disclaimer />
          </div>
        </main>
      </div>
    </div>
  )
}
