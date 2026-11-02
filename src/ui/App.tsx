import { useGame } from '../store/game'
import { DesignScreen } from './DesignScreen'
import { FlightScreen } from './FlightScreen'
import { LaunchScreen } from './LaunchScreen'
import { ResultsScreen } from './ResultsScreen'
import { ScenarioSelect } from './ScenarioSelect'

export function App() {
  const design = useGame((s) => s.design)
  const screen = useGame((s) => s.screen)
  const mission = useGame((s) => s.mission)
  if (!design) return <ScenarioSelect />
  if (screen === 'launch') return <LaunchScreen />
  if (screen === 'flight' && mission) return <FlightScreen />
  if (screen === 'results' && mission) return <ResultsScreen />
  return <DesignScreen design={design} />
}
