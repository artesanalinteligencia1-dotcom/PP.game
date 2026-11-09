import { useCallback, useEffect, useState } from 'react'
import { toggleFullscreen } from '../platform/desktop'
import { useGame } from '../store/game'
import { useReducedMotion } from '../store/settings'
import { DesignScreen } from './DesignScreen'
import { FlightScreen } from './FlightScreen'
import { LaunchScreen } from './LaunchScreen'
import { ResultsScreen } from './ResultsScreen'
import { ScenarioSelect } from './ScenarioSelect'
import { SoundToggle } from './SoundToggle'
import { CampaignScreen } from './hub/CampaignScreen'
import { FirstLightScreen } from './hub/FirstLightScreen'
import { HomeScreen, MenuBackdrop } from './hub/HomeScreen'
import { IntroScreen } from './hub/IntroScreen'
import { LearnScreen } from './hub/LearnScreen'
import { MockScreen, mockFromUrl } from './mock/MockScreen'
import { useT } from '../i18n'
import { BootScreen } from './shell/BootScreen'
import { SettingsPanel } from './shell/SettingsPanel'
import { Stage } from './shell/Stage'

function CurrentScreen() {
  const design = useGame((s) => s.design)
  const screen = useGame((s) => s.screen)
  const mission = useGame((s) => s.mission)
  const campaign = useGame((s) => s.campaign)
  switch (screen) {
    case 'home':
      return <HomeScreen />
    case 'campaign':
      return campaign ? <CampaignScreen /> : <HomeScreen />
    case 'free':
      return <ScenarioSelect />
    case 'intro':
      return <IntroScreen />
    case 'learn':
      return <LearnScreen />
    case 'firstlight':
      return <FirstLightScreen />
    default:
      break
  }
  if (!design) return <HomeScreen />
  if (screen === 'launch') return <LaunchScreen />
  if (screen === 'flight' && mission) return <FlightScreen />
  if (screen === 'results' && mission) return <ResultsScreen />
  return <DesignScreen design={design} />
}

const MOCK = mockFromUrl()

export function App() {
  const t = useT()
  const screen = useGame((s) => s.screen)
  const settingsOpen = useGame((s) => s.settingsOpen)
  const openSettings = useGame((s) => s.openSettings)
  const reduce = useReducedMotion()
  const [booted, setBooted] = useState(false)
  const start = useCallback(() => setBooted(true), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault()
        void toggleFullscreen()
      } else if (e.key === 'Escape' && booted && !document.querySelector('[role="dialog"]:not(#settings-dialog)')) {
        openSettings(!useGame.getState().settingsOpen)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [booted, openSettings])

  if (MOCK) {
    return (
      <Stage>
        <MockScreen n={MOCK} />
      </Stage>
    )
  }

  return (
    <Stage>
      <div className={`hud relative h-full ${reduce ? 'reduce-motion' : ''}`}>
        {/* The launch site, blurred and darkened, sits behind every screen except the menu (which shows it sharp). */}
        {booted && screen !== 'home' && (
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute inset-0 scale-110 blur-md">
              <MenuBackdrop />
            </div>
            <div className="absolute inset-0 bg-slate-950/80" />
          </div>
        )}
        {!booted ? (
          <BootScreen onStart={start} />
        ) : (
          <>
            <div key={screen} className="stage-scroll screen-in relative h-full overflow-y-auto">
              <CurrentScreen />
            </div>
            <div className="absolute bottom-4 right-4 z-40 flex gap-2">
              <SoundToggle />
              <button
                type="button"
                onClick={() => openSettings(true)}
                className="btn-secondary h-9 w-9 text-sm"
                aria-label={t('settings.title')}
                title={t('settings.titleEsc')}
              >
                ⚙
              </button>
            </div>
            {settingsOpen && <SettingsPanel onClose={() => openSettings(false)} />}
          </>
        )}
      </div>
    </Stage>
  )
}
