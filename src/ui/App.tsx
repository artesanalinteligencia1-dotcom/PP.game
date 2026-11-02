import { useGame } from '../store/game'
import { DesignScreen } from './DesignScreen'
import { ScenarioSelect } from './ScenarioSelect'

export function App() {
  const design = useGame((s) => s.design)
  return design ? <DesignScreen design={design} /> : <ScenarioSelect />
}
