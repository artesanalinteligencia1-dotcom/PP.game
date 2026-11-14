// Kuntur in the corner of the screen: closed, a small robot whose face tells how the design is doing; open, a speech
// bubble with what the current screen wants to say. Text is typed out on screen (no voice).
import { useEffect, useState } from 'react'
import { useT } from '../../i18n'
import { useGuide } from '../../store/guide'
import { useReducedMotion, useSettings } from '../../store/settings'
import { GUIDE_ACCENT, Kuntur } from './robots'

const CHARS_PER_SECOND = 55

/** A line typed out at speaking pace; `typing` stays true until it is done. Reduced motion shows it whole. */
export function useTyped(text: string, instant: boolean): [string, boolean] {
  const [n, setN] = useState(instant ? text.length : 0)
  useEffect(() => {
    if (instant) {
      setN(text.length)
      return
    }
    setN(0)
    const started = performance.now()
    const id = window.setInterval(() => {
      const k = Math.min(text.length, Math.floor(((performance.now() - started) / 1000) * CHARS_PER_SECOND))
      setN(k)
      if (k >= text.length) window.clearInterval(id)
    }, 30)
    return () => window.clearInterval(id)
  }, [text, instant])
  return [text.slice(0, n), n < text.length]
}

export function GuideDock() {
  const t = useT()
  const on = useSettings((s) => s.guide)
  const reduce = useReducedMotion()
  const { content, open, index, setOpen, setIndex } = useGuide()
  const line = open && content ? content.lines[index] : undefined
  const [shown, typing] = useTyped(line?.text ?? '', reduce)
  if (!on || !content) return null
  const name = t('guide.kuntur.name')
  const mood = line?.mood ?? content.mood
  const count = content.lines.length
  const badge = content.badge ?? 0
  return (
    <div className="pointer-events-none absolute bottom-3 left-9 z-40 flex items-end gap-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? t('guide.dock.close') : t('guide.dock.open', { name })}
        title={open ? t('guide.dock.close') : t('guide.dock.open', { name })}
        className="pointer-events-auto relative shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        <Kuntur mood={mood} talking={typing} size={open ? 124 : 88} still={reduce} />
        {!open && badge > 0 && (
          <span className="absolute right-1 top-3 rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white" aria-hidden="true">
            {badge}
          </span>
        )}
      </button>
      {open && line && (
        <div
          role="dialog"
          aria-label={name}
          className="pointer-events-auto relative mb-6 w-[460px] rounded-md border bg-slate-950/95 p-3 text-sm leading-snug text-slate-100 shadow-2xl backdrop-blur"
          style={{ borderColor: GUIDE_ACCENT }}
        >
          <span className="absolute -left-[7px] bottom-8 h-3 w-3 rotate-45 border-b border-l bg-slate-950" style={{ borderColor: GUIDE_ACCENT }} aria-hidden="true" />
          <div className="mb-1 flex items-center gap-2">
            <span className="hud-label" style={{ color: GUIDE_ACCENT }}>
              {name}
            </span>
            {(content.progress || count > 1) && <span className="text-[11px] text-slate-500">{content.progress ?? t('guide.dock.count', { i: index + 1, n: count })}</span>}
            <button type="button" onClick={() => setOpen(false)} className="ml-auto px-1 text-slate-400 hover:text-white" aria-label={t('guide.dock.close')}>
              ×
            </button>
          </div>
          {line.title && <div className="mb-1 font-semibold text-white">{line.title}</div>}
          <p aria-live="polite" className="min-h-[3.75rem]">
            {shown}
            {typing && <span className="ml-0.5 inline-block w-2 animate-pulse text-sky-300">▍</span>}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {content.primary ? (
              <>
                <button type="button" className="btn-primary px-3 py-1 text-xs" onClick={content.primary.run}>
                  {content.primary.label}
                </button>
                {content.secondary && (
                  <button type="button" className="px-2 py-1 text-xs text-slate-400 hover:text-white" onClick={content.secondary.run}>
                    {content.secondary.label}
                  </button>
                )}
              </>
            ) : (
              <>
                {line.action && (
                  <button type="button" className="btn-secondary px-3 py-1 text-xs" onClick={line.action.run}>
                    {line.action.label}
                  </button>
                )}
                {count > 1 && (
                  <div className="ml-auto flex gap-1">
                    <button type="button" className="btn-secondary h-7 w-7 text-xs" disabled={index === 0} onClick={() => setIndex(index - 1)} aria-label={t('guide.dock.prev')}>
                      ‹
                    </button>
                    <button type="button" className="btn-secondary h-7 w-7 text-xs" disabled={index >= count - 1} onClick={() => setIndex(index + 1)} aria-label={t('guide.dock.next')}>
                      ›
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
