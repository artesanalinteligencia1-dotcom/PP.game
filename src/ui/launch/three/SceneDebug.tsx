import { useEffect, useMemo, useRef } from 'react'
import { getScenario } from '../../../engine/catalog'
import { flySounding } from '../../../engine/sounding'
import { soundingTimeline } from '../../hub/soundingProfile'
import { spacecraftVisual } from '../../spacecraft/visual'
import { makeTimeline } from '../LaunchSequence'
import type { SceneryStyle } from '../LaunchScenery'
import LaunchScene3D from './LaunchScene3D'
import SoundingScene3D from './SoundingScene3D'

/**
 * Developer view of the 3D launch: `?scene3d=heavy&pad=night&t=6` plays the launch from t seconds (loops at the end).
 * `&fail=<seconds>` explodes the rocket then; `&landed=0` loses the booster at sea.
 * `&mission=<scenarioId>&inst=<id,id>&array=deployable&area=6` sets the spacecraft in the fairing (default: Lagrange Observatory with an IR telescope
 * and radio antennas). `?scene3d=paulet&t=12` shows the Paulet-1 prologue instead (`&fail=1` for a failed flight).
 */
export default function SceneDebug({ launcherId }: { launcherId: string }) {
  const params = new URLSearchParams(window.location.search)
  const light = (['dawn', 'day', 'night'].includes(params.get('pad') ?? '') ? params.get('pad') : 'day') as SceneryStyle
  const start = Number(params.get('t') ?? 0)
  const T = useMemo(() => makeTimeline(10), [])
  const ST = useMemo(() => soundingTimeline(10), [])
  const sounding = useMemo(() => ({ ...flySounding(['magnetometer'], 3), failed: params.has('fail') }), [])
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
      if (tRef.current > (launcherId === 'paulet' ? ST.end + 2 : T.seco + 6)) tRef.current = start
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [T, ST, start, launcherId])
  return (
    <div className="fixed inset-0 bg-black">
      {launcherId === 'paulet' ? <SoundingScene3D T={ST} tRef={tRef} result={sounding} /> : <LaunchScene3D launcherId={launcherId} light={light} T={T} tRef={tRef} failAt={params.has('fail') ? Number(params.get('fail')) : null} visual={visual} landed={params.get('landed') !== '0'} />}
    </div>
  )
}
