import { useGame } from '../store/game'
import { DesignScreen } from './DesignScreen'
import { FlightScreen } from './FlightScreen'
import { LaunchScreen } from './LaunchScreen'
import { ResultsScreen } from './ResultsScreen'
import { ScenarioSelect } from './ScenarioSelect'
import { SoundToggle } from './SoundToggle'
import { CampaignScreen } from './hub/CampaignScreen'
import { FirstLightScreen } from './hub/FirstLightScreen'
import { HomeScreen } from './hub/HomeScreen'
import { IntroScreen } from './hub/IntroScreen'
import { LearnScreen } from './hub/LearnScreen'

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

export function App() {
  return (
    <>
      <CurrentScreen />
      <SoundToggle />
    </>
  )
}
