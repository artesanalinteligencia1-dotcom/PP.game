import { useEffect, useRef, useState } from 'react'
import { PixiLaunch } from './PixiLaunch'
import { ThreeLaunch } from './ThreeLaunch'
import { PROTO, protoCaption, type ProtoLight } from './launchScript'

/** Renderer comparison page: `?proto=pixi` or `?proto=three` (optionally `&light=dawn|day|night`). Not part of the game flow. */
export default function ProtoScreen({ kind }: { kind: 'pixi' | 'three' }) {
  const params = new URLSearchParams(window.location.search)
  const [light, setLight] = useState<ProtoLight>((['dawn', 'day', 'night'] as const).find((l) => l === params.get('light')) ?? 'dawn')
  const t = useRef(0)
  const [shown, setShown] = useState(0)
  const [paused, setPaused] = useState(params.has('t'))
  useEffect(() => {
    if (params.has('t')) t.current = Number(params.get('t'))
    let raf = 0
    let prev = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000)
      prev = now
      if (!paused) t.current = t.current + dt > PROTO.end + 1 ? 0 : t.current + dt
      setShown(Math.floor(t.current * 10) / 10)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused])
  const Scene = kind === 'pixi' ? PixiLaunch : ThreeLaunch
  const met = shown - PROTO.release
  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-2">
      <div className="relative aspect-video w-full max-w-[1600px] overflow-hidden rounded-lg">
        <Scene key={light} light={light} t={t} />
        <div className="pointer-events-none absolute left-3 top-3 rounded bg-slate-950/70 px-3 py-2 font-mono text-xs text-slate-200">
          <div className="font-display text-sm font-semibold text-sky-300">{kind === 'pixi' ? 'PixiJS 2.5D prototype' : 'Three.js 3D prototype'}</div>
          <div>T{met < 0 ? '−' : '+'}{Math.abs(met).toFixed(1)} s</div>
        </div>
        <div className="absolute right-3 top-3 flex gap-1 text-xs">
          {(['dawn', 'day', 'night'] as const).map((l) => (
            <button key={l} type="button" onClick={() => setLight(l)} className={`rounded px-2 py-1 ${l === light ? 'bg-sky-500 text-slate-950' : 'bg-slate-900/80 text-slate-200'}`}>
              {l}
            </button>
          ))}
          <button type="button" onClick={() => { t.current = 0 }} className="rounded bg-slate-900/80 px-2 py-1 text-slate-200">Replay</button>
          <button type="button" onClick={() => setPaused((p) => !p)} className="rounded bg-slate-900/80 px-2 py-1 text-slate-200">{paused ? 'Play' : 'Pause'}</button>
        </div>
        <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded bg-slate-950/75 px-3 py-2 text-sm text-slate-100">{protoCaption(shown)}</div>
      </div>
    </main>
  )
}
