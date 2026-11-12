// Main menu: the launch site at rest behind a vertical, keyboard-friendly menu.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useMusic } from '../../audio/audio'
import { GAME_NAME, GAME_SUBTITLE } from '../../brand'
import { getScenario } from '../../engine/catalog'
import { PROTAGONIST } from '../../i18n/en'
import { useT } from '../../i18n'
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

function MenuItem({ n, label, hint, onClick, primary }: { n: number; label: string; hint?: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-6 border-b border-white/15 py-3 text-left text-white/75 transition hover:text-white focus:outline-none focus-visible:text-white"
    >
      <span className="w-6 font-mono text-xs text-sky-300/80">{String(n).padStart(2, '0')}</span>
      <span className={`font-display text-2xl transition group-hover:translate-x-1 group-focus-visible:translate-x-1 ${primary ? 'font-semibold text-white' : 'font-light'}`}>{label}</span>
      {hint && <span className="ml-auto text-xs text-white/45 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">{hint}</span>}
      {primary && <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shadow-[0_0_10px_#fb923c]" />}
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
  const t = useT()
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

  let n = 0
  const item = (label: string, onClick: () => void, hint?: string, primary?: boolean) => <MenuItem key={label} n={++n} label={label} hint={hint} onClick={onClick} primary={primary} />

  return (
    <main className="relative h-full overflow-hidden text-white">
      <MenuBackdrop />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />
      <div className="absolute inset-x-12 top-8 flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-white/60">
        <span>{GAME_NAME} · {t('home.directorate')}</span>
        <span>{t('home.site')}</span>
      </div>
      <div className="absolute left-16 top-[130px] w-[520px]">
        <p className="hud-label text-sm">{t('home.tagline')}</p>
        <h1 className="mt-2 text-[104px] leading-none tracking-tight">
          {GAME_NAME}
        </h1>
        <p className="mt-2 text-2xl uppercase tracking-[0.35em] text-orange-400">{GAME_SUBTITLE}</p>
        <nav ref={navRef} onKeyDown={onKey} className="mt-10 border-t border-white/15" aria-label={t('home.menuLabel')}>
          {!extras ? (
            <>
              {campaign ? item(t('home.continue'), () => go('campaign'), `${campaign.profile.title} ${campaign.profile.name}`, true) : item(t('home.newCareer'), () => setNewCareer(true), t('home.newCareer.first'), true)}
              {campaign && item(t('home.newCareer'), () => setNewCareer(true), t('home.newCareer.replace'))}
              {item(t('home.free'), () => go('free'), t('home.free.hint'))}
              {item(t('home.learn'), () => openLearn('orbit'), t('home.learn.hint'))}
              {item(t('home.extras'), () => setExtras(true), t('home.extras.hint'))}
              {item(t('home.settings'), () => openSettings(true), t('home.settings.hint'))}
              {canQuit && item(t('home.quit'), () => void quitGame())}
            </>
          ) : (
            <>
              {item(t('home.rocket'), () => go('rocket'), t('home.rocket.hint'))}
              {item(t('home.intro'), () => go('intro'), t('home.intro.hint'))}
              {item(t('home.legacy'), () => openLearn('paulet'), t('home.legacy.hint'))}
              {item(t('home.sandbox'), () => startScenario('sandbox'), t('home.sandbox.hint'))}
              {item(t('home.back'), () => setExtras(false))}
            </>
          )}
        </nav>
      </div>
      <div className="hud-panel absolute bottom-20 right-12 w-[420px] p-5">
        <p className="hud-label mb-3">{campaign ? t('home.status') : t('home.yourProgram')}</p>
        {campaign ? (
          <div className="grid grid-cols-3 gap-4">
            {[
              [t('home.funds'), `$${campaign.fundsM} M`],
              [t('home.prestige'), String(campaign.prestige)],
              [t('home.contracts'), String(Object.keys(campaign.completed).length)],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[11px] uppercase tracking-widest text-white/50">{k}</p>
                <p className="font-display text-2xl tabular-nums">{v}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/75">{t('home.pitch')}</p>
        )}
        <p className="mt-4 text-xs text-white/60">{who} · {t('home.director')}</p>
        <p className="mt-1 text-[11px] text-white/40">{t('home.fictional')}</p>
      </div>
      <p className="absolute bottom-6 left-16 text-[11px] text-white/40">{t('home.disclaimer')}</p>
      {newCareer && (
        <ProfileDialog
          title={t('home.newCareer')}
          confirm={t('home.newCareer.confirm')}
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
