import { useEffect, useMemo, useRef } from 'react'
import { makeTimeline } from '../LaunchSequence'
import type { SceneryStyle } from '../LaunchScenery'
import LaunchScene3D from './LaunchScene3D'

/** Developer view of the 3D launch: `?scene3d=heavy&pad=night&t=6` plays the launch from t seconds (loops at the end). */
export default function SceneDebug({ launcherId }: { launcherId: string }) {
  const params = new URLSearchParams(window.location.search)
  const light = (['dawn', 'day', 'night'].includes(params.get('pad') ?? '') ? params.get('pad') : 'day') as SceneryStyle
  const start = Number(params.get('t') ?? 0)
  const T = useMemo(() => makeTimeline(10), [])
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
      <LaunchScene3D launcherId={launcherId} light={light} T={T} tRef={tRef} failAt={null} />
    </div>
  )
}
