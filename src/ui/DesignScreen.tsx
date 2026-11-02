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
  const scenario = getScenario(design.scenarioId)
  const designKey = JSON.stringify(design)
  const report = useMemo(() => evaluateDesign(design, scenario), [design, scenario])
  const blocking = report.review.filter((r) => r.blocking).length
  useMusic('design')

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
          <button type="button" onClick={exit} className="text-sm text-slate-400 hover:text-slate-100">
            ← Missions
          </button>
          <h1 className="text-lg font-semibold">
            {scenario.name} <span className="text-sm font-normal text-slate-400">· {scenario.tagline}</span>
          </h1>
          <button type="button" onClick={resetDesign} className="ml-auto text-xs text-slate-400 hover:text-slate-100">
            Reset design
          </button>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4" aria-label="Design steps">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm transition ${
                tab === t.id ? 'border-sky-400 text-sky-300' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
              {t.id === 'review' && blocking > 0 && (
                <span className="ml-1 rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{blocking}</span>
              )}
            </button>
          ))}
        </nav>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <aside className="order-first lg:order-last">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 lg:sticky lg:top-28">
            <div className="mb-3 flex items-center gap-3 border-b border-slate-800 pb-3">
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
