import { useEffect, useMemo, useRef } from 'react'
import { getScenario } from '../../../engine/catalog'
import { spacecraftVisual } from '../../spacecraft/visual'
import { makeTimeline } from '../LaunchSequence'
import type { SceneryStyle } from '../LaunchScenery'
import LaunchScene3D from './LaunchScene3D'

/**
 * Developer view of the 3D launch: `?scene3d=heavy&pad=night&t=6` plays the launch from t seconds (loops at the end).
 * `&mission=<scenarioId>&inst=<id,id>&array=deployable&area=6` sets the spacecraft in the fairing (default: Lagrange Observatory with an IR telescope
 * and radio antennas).
 */
export default function SceneDebug({ launcherId }: { launcherId: string }) {
  const params = new URLSearchParams(window.location.search)
  const light = (['dawn', 'day', 'night'].includes(params.get('pad') ?? '') ? params.get('pad') : 'day') as SceneryStyle
  const start = Number(params.get('t') ?? 0)
  const T = useMemo(() => makeTimeline(10), [])
  const visual = useMemo(() => {
    const base = getScenario(params.get('mission') ?? 'lagrange_observatory').baseDesign
    const ids = (params.get('inst') ?? 'ir_telescope,radio_array').split(',').filter(Boolean)
    const array = params.get('array') // body | deployable | tracking, with `&area=` m²
    const arrays = array ? { arrayId: array, arrayAreaM2: Number(params.get('area') ?? 6) } : {}
    return spacecraftVisual({ ...base, ...arrays, instruments: ids.map((id) => ({ id, duty: 0.1 })) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const tRef = useRef(start)
  useEffect(() => {
    let prev = performance.now()
    let raf = 0
    const tick = (now: number) => {
      tRef.current += (now - prev) / 1000
      prev = now
      if (tRef.current > T.seco + 6) tRef.current = start
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [T, start])
  return (
    <div className="fixed inset-0 bg-black">
      <LaunchScene3D launcherId={launcherId} light={light} T={T} tRef={tRef} failAt={null} visual={visual} />
    </div>
  )
}
