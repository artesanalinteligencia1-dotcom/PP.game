// ?guide=1 — the owner chooses the robot guide's look by trying the three candidates side by side (PLAYBOOK rule 3.3).
import { useEffect, useState } from 'react'
import { useT, type StringKey } from '../../i18n'
import { useReducedMotion, useSettings } from '../../store/settings'
import { GUIDE_ACCENT, GUIDE_MOODS, GUIDE_VARIANTS, ROBOTS, type GuideMood, type GuideVariant } from './robots'

type Sample = 'welcome' | 'hint' | 'why'
const SAMPLES: Sample[] = ['welcome', 'hint', 'why']
/** The face each sample line is said with. */
const SAMPLE_MOOD: Record<Sample, GuideMood> = { welcome: 'happy', hint: 'explaining', why: 'worried' }
const CHARS_PER_SECOND = 45

/** A line typed out at speaking pace; the robot's mouth moves until it is done. Reduced motion shows it whole. */
function useTyped(text: string, replay: number, instant: boolean): [string, boolean] {
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
  }, [text, replay, instant])
  return [text.slice(0, n), n < text.length]
}

function Candidate({ variant, replay }: { variant: GuideVariant; replay: number }) {
  const t = useT()
  const reduce = useReducedMotion()
  const [sample, setSample] = useState<Sample>('welcome')
  const [mood, setMood] = useState<GuideMood | null>(null)
  const name = t(`guide.${variant}.name` as StringKey)
  const line = t(`guide.line.${sample}` as StringKey, { name })
  const [shown, talking] = useTyped(line, replay, reduce)
  const Robot = ROBOTS[variant]
  const accent = GUIDE_ACCENT[variant]
  const face = mood ?? SAMPLE_MOOD[sample]
  return (
    <section className="hud-panel flex flex-col gap-3 p-5" style={{ borderColor: `${accent}55` }} aria-label={name}>
      <div className="flex flex-col items-center">
        <Robot mood={face} talking={talking} size={190} still={reduce} title={name} />
        <div className="relative mt-2 min-h-[104px] w-full rounded-md border bg-slate-950/80 p-3 text-sm leading-snug text-slate-100" style={{ borderColor: accent }} aria-live="polite">
          <span className="absolute -top-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t bg-slate-950" style={{ borderColor: accent }} aria-hidden="true" />
          <div className="hud-label mb-1" style={{ color: accent }}>
            {name}
          </div>
          {shown}
          {talking && <span className="ml-0.5 inline-block w-2 animate-pulse" style={{ color: accent }}>▍</span>}
        </div>
      </div>
      <div>
        <h2 className="font-display text-2xl" style={{ color: accent }}>
          {name} <span className="text-sm font-normal text-slate-400">· {t(`guide.${variant}.meaning` as StringKey)}</span>
        </h2>
        <p className="mt-1 text-sm text-slate-300">{t(`guide.${variant}.concept` as StringKey)}</p>
      </div>
      <div>
        <div className="hud-label">{t('guide.preview.lines')}</div>
        <div className="mt-1 flex flex-wrap gap-1">
          {SAMPLES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={s === sample}
              onClick={() => {
                setSample(s)
                setMood(null)
              }}
              className={`rounded border px-2.5 py-1 text-xs ${s === sample ? 'text-slate-950' : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}
              style={s === sample ? { background: accent, borderColor: accent } : undefined}
            >
              {t(`guide.sample.${s}` as StringKey)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="hud-label">{t('guide.preview.moods')}</div>
        <div className="mt-1 grid grid-cols-5 gap-1">
          {GUIDE_MOODS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={m === face}
              onClick={() => setMood(m)}
              className={`flex flex-col items-center rounded border py-1 text-[11px] ${m === face ? 'bg-white/5 text-slate-100' : 'border-slate-800 text-slate-400 hover:border-slate-600'}`}
              style={m === face ? { borderColor: accent } : undefined}
            >
              <Robot mood={m} size={52} still />
              {t(`guide.mood.${m}` as StringKey)}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export function GuidePreview() {
  const t = useT()
  const reduce = useReducedMotion()
  const language = useSettings((s) => s.language)
  const setSetting = useSettings((s) => s.set)
  const [replay, setReplay] = useState(0)
  return (
    <div className={`hud relative h-full overflow-hidden bg-[radial-gradient(ellipse_at_top,#0f1d3d,#020617_70%)] px-8 py-6 text-slate-100 ${reduce ? 'reduce-motion' : ''}`}>
      <header className="mb-4 flex items-end gap-6">
        <div className="flex-1">
          <div className="hud-label">{t('guide.preview.kicker')}</div>
          <h1 className="mt-1 text-4xl">{t('guide.preview.title')}</h1>
          <p className="mt-2 max-w-4xl text-sm text-slate-300">{t('guide.preview.intro')}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hud-label">{t('guide.preview.language')}</span>
          {(['en', 'es'] as const).map((l) => (
            <button key={l} type="button" aria-pressed={language === l} onClick={() => setSetting('language', l)} className={language === l ? 'btn-primary px-3 py-1 text-xs' : 'btn-secondary px-3 py-1 text-xs'}>
              {l.toUpperCase()}
            </button>
          ))}
          <button type="button" className="btn-secondary ml-2 px-3 py-1 text-xs" onClick={() => setReplay((n) => n + 1)}>
            ↻ {t('guide.preview.replay')}
          </button>
        </div>
      </header>
      <div className="grid grid-cols-3 gap-5">
        {GUIDE_VARIANTS.map((v) => (
          <Candidate key={`${v}-${language}`} variant={v} replay={replay} />
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-500">{t('guide.preview.note')}</p>
    </div>
  )
}

export default GuidePreview
