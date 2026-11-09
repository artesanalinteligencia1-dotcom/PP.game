import { useEffect, useMemo, useRef, useState } from 'react'
import introUrl from '../../assets/video/intro.mp4'
import { useMusic } from '../../audio/audio'
import { useGame } from '../../store/game'
import { Disclaimer } from '../components'
import { useT, type StringKey } from '../../i18n'
import { INTRO_SEGMENTS, buildCues, cueAt } from '../../i18n/introCaptions'

export function IntroScreen() {
  const go = useGame((s) => s.go)
  const t = useT()
  useMusic('none')
  const frame = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const [now, setNow] = useState(0)

  const texts = INTRO_SEGMENTS.map((_, i) => t(`intro.caption.${i}` as StringKey))
  const key = texts.join('|')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cues = useMemo(() => buildCues(texts), [key])
  const cue = cueAt(cues, now)

  // timeupdate fires only ~4 times a second: too coarse for the spoken-word highlight.
  useEffect(() => {
    let raf = 0
    const tick = () => {
      if (video.current) setNow(video.current.currentTime)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void frame.current?.requestFullscreen()
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <button type="button" onClick={() => go('home')} className="text-sm text-slate-400 hover:text-slate-100">
        {t('intro.back')}
      </button>
      <h1 className="mt-2 text-2xl font-semibold">{t('intro.title')}</h1>
      {/* Fullscreen goes on the frame, not the video element, so the captions stay on top of it. */}
      <div ref={frame} className="relative mt-4 flex items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-black" style={{ containerType: 'inline-size' }}>
        <video ref={video} className="w-full" controls controlsList="nofullscreen" preload="metadata" src={introUrl} />
        {cue && (
          <p
            data-testid="intro-caption"
            className="pointer-events-none absolute inset-x-0 bottom-[16%] m-0 px-[4%] text-center font-bold text-white"
            style={{ fontSize: '3cqw', textShadow: '0 0 4px #020617, 0 0 4px #020617, 0 3px 12px rgba(2,6,23,0.9)' }}
          >
            {cue.words.map((w, i) => (
              <span key={i} className="mx-[0.12em] inline-block" style={{ color: now >= w.at && now < w.at + 0.35 ? '#f97316' : undefined }}>
                {w.word}
              </span>
            ))}
          </p>
        )}
        <button type="button" onClick={toggleFullscreen} className="absolute right-2 top-2 rounded bg-slate-950/60 px-2 py-1 text-xs text-slate-200 hover:bg-slate-950/90" aria-label={t('settings.fullscreen')} title={t('settings.fullscreen')}>
          ⛶
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">{t('intro.duration')}</p>
      <p className="mt-3 text-xs text-slate-500">
        {t('intro.credits')}
      </p>
      <div className="mt-6 flex gap-2">
        <button type="button" onClick={() => go('home')} className="btn-primary px-4 py-2 ">
          {t('intro.start')}
        </button>
      </div>
      <div className="mt-6">
        <Disclaimer />
      </div>
    </main>
  )
}
