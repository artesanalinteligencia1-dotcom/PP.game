// Main menu: the launch site at rest behind a vertical, keyboard-friendly menu.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useMusic } from '../../audio/audio'
import { getScenario } from '../../engine/catalog'
import { PROTAGONIST } from '../../i18n/en'
import { canQuit, quitGame } from '../../platform/desktop'
import { useGame } from '../../store/game'
import { AndesBackdrop, LaunchPad, SceneryLight, SkyBackdrop, Stars } from '../launch/LaunchScenery'
import { Rocket, makeTimeline } from '../launch/LaunchSequence'
import { spacecraftVisual } from '../spacecraft/visual'
import { ProfileDialog } from './ProfileDialog'

export function MenuBackdrop() {
  const v = useMemo(() => spacecraftVisual(getScenario('earth_watch').baseDesign), [])
  const T = useMemo(() => makeTimeline(10), [])
  return (
    <svg viewBox="0 0 800 480" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <SceneryLight style="dawn">
        <SkyBackdrop space={0} />
        <Stars space={0.25} />
        <AndesBackdrop />
        <g transform="translate(140 0)">
          <LaunchPad towerHeight={170} />
        </g>
      </SceneryLight>
      <g transform="translate(540 430)">
        <Rocket launcherId="light" t={0} failAt={null} v={v} T={T} />
      </g>
    </svg>
  )
}

function MenuItem({ label, hint, onClick, primary }: { label: string; hint?: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-baseline gap-3 rounded-lg px-4 py-2.5 text-left transition focus:outline-none ${
        primary ? 'bg-orange-500/15 text-white' : 'text-slate-200'
      } hover:bg-white/10 focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-sky-400`}
    >
      <span className="w-3 text-sky-400 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true">
        ›
      </span>
      <span className="font-display text-2xl font-semibold tracking-tight">{label}</span>
      {hint && <span className="ml-auto text-xs text-slate-400">{hint}</span>}
    </button>
  )
}

export function HomeScreen() {
  const campaign = useGame((s) => s.campaign)
  const go = useGame((s) => s.go)
  const openLearn = useGame((s) => s.openLearn)
  const startCampaign = useGame((s) => s.startCampaign)
  const startScenario = useGame((s) => s.startScenario)
  const openSettings = useGame((s) => s.openSettings)
  const [newCareer, setNewCareer] = useState(false)
  const [extras, setExtras] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  useMusic('home')
  const who = campaign ? `${campaign.profile.title} ${campaign.profile.name}` : `${PROTAGONIST.title} ${PROTAGONIST.name}`

  useEffect(() => {
    navRef.current?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true })
  }, [extras])

  // Up/down arrows move between menu items (keyboard and gamepad-mapped keys).
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const items = [...(navRef.current?.querySelectorAll<HTMLElement>('button') ?? [])]
    const i = items.indexOf(document.activeElement as HTMLElement)
    const next = items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length]
    next?.focus()
    e.preventDefault()
  }

  return (
    <main className="relative h-full overflow-hidden">
      <MenuBackdrop />
      <div className="absolute inset-y-0 left-0 w-[620px] bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-transparent" />
      <div className="relative flex h-full w-[520px] flex-col px-14 py-12">
        <p className="text-xs uppercase tracking-[0.35em] text-sky-300">Space Mission Design</p>
        <h1 className="mt-1 text-7xl font-bold tracking-tight">PP.game</h1>
        <p className="mt-2 max-w-sm text-sm text-slate-300">Design it. Launch it. Learn from it.</p>

        <nav ref={navRef} onKeyDown={onKey} className="mt-10 space-y-1" aria-label="Main menu">
          {!extras ? (
            <>
              {campaign ? (
                <MenuItem primary label="Continue" hint={`$${campaign.fundsM} M · ★ ${campaign.prestige}`} onClick={() => go('campaign')} />
              ) : (
                <MenuItem primary label="New career" hint="Start with Paulet-1" onClick={() => setNewCareer(true)} />
              )}
              {campaign && <MenuItem label="New career" onClick={() => setNewCareer(true)} />}
              <MenuItem label="Free mission" hint="No career progress" onClick={() => go('free')} />
              <MenuItem label="Learn" hint="Orbits, rockets, chaos" onClick={() => openLearn('orbit')} />
              <MenuItem label="Extras" hint="Intro, Paulet, sandbox" onClick={() => setExtras(true)} />
              <MenuItem label="Settings" onClick={() => openSettings(true)} />
              {canQuit && <MenuItem label="Quit" onClick={() => void quitGame()} />}
            </>
          ) : (
            <>
              <MenuItem label="Watch intro" hint="90 s story" onClick={() => go('intro')} />
              <MenuItem label="Legacy: Paulet" hint="Facts vs. legend" onClick={() => openLearn('paulet')} />
              <MenuItem label="Sandbox" hint="Just physics" onClick={() => startScenario('sandbox')} />
              <MenuItem label="← Back" onClick={() => setExtras(false)} />
            </>
          )}
        </nav>

        <div className="mt-auto flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-orange-500 to-violet-600 font-display font-bold">
            {who
              .replace(/^(Dr\.|Eng\.)\s*/, '')
              .split(' ')
              .map((w) => w[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div className="text-xs">
            <div className="font-display text-sm font-semibold">{who}</div>
            <div className="text-slate-400">Fictional character inspired by Pedro Paulet (1874–1945).</div>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-slate-500">Simplified educational model — game values, not real engineering data.</p>
      </div>
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
