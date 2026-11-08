// Loading screen → "Press any key". The key/click is also the gesture browsers require before playing audio.
// On the very first boot the player picks a language instead (English is the default); that click starts the game.
import { useEffect, useRef, useState } from 'react'
import { MenuBackdrop } from '../hub/HomeScreen'
import { GAME_NAME, GAME_SUBTITLE } from '../../brand'
import { LANGUAGES, translate, useT, type Lang } from '../../i18n'
import { useSettings } from '../../store/settings'

function LanguagePicker({ onPick }: { onPick: (lang: Lang, byKeyboard: boolean) => void }) {
  const lang = useSettings((s) => s.language)
  const firstRef = useRef<HTMLButtonElement>(null)
  useEffect(() => firstRef.current?.focus(), [])
  return (
    <div className="mt-10" role="group" aria-labelledby="lang-pick-title">
      <p id="lang-pick-title" className="font-display text-lg tracking-wide text-slate-100">
        {/* Both languages at once: the player cannot read the other one yet. */}
        {translate('en', 'lang.pick.title')} · {translate('es', 'lang.pick.title')}
      </p>
      <div className="mt-5 flex justify-center gap-4">
        {LANGUAGES.map((l, i) => (
          <button
            key={l}
            ref={i === 0 ? firstRef : undefined}
            type="button"
            data-lang={l}
            onClick={(e) => onPick(l, e.detail === 0)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault()
                const sib = (e.key === 'ArrowRight' ? e.currentTarget.nextElementSibling : e.currentTarget.previousElementSibling) as HTMLElement | null
                sib?.focus()
              }
            }}
            className={`w-44 px-5 py-3 text-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${l === lang ? 'btn-primary' : 'btn-secondary'}`}
          >
            {translate(l, `lang.${l}`)}
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-500">
        {translate('en', 'lang.pick.hint')} · {translate('es', 'lang.pick.hint')}
      </p>
    </div>
  )
}

export function BootScreen({ onStart }: { onStart: () => void }) {
  const t = useT()
  const languageChosen = useSettings((s) => s.languageChosen)
  const setSetting = useSettings((s) => s.set)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    const min = new Promise((r) => setTimeout(r, 700))
    Promise.all([document.fonts?.ready, min]).then(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [])
  useEffect(() => {
    if (!ready || !languageChosen) return
    const go = (e: Event) => {
      if (e instanceof KeyboardEvent && ['F11', 'F12', 'Tab'].includes(e.key)) return
      onStart()
    }
    // Start on release, so the same key/click cannot also press the first menu button that gets focus.
    window.addEventListener('keyup', go)
    window.addEventListener('pointerup', go)
    return () => {
      window.removeEventListener('keyup', go)
      window.removeEventListener('pointerup', go)
    }
  }, [ready, languageChosen, onStart])
  const pick = (l: Lang, byKeyboard: boolean) => {
    setSetting('language', l)
    setSetting('languageChosen', true)
    // Keyboard: the "press any key" listener (now active) starts on the key's release, so the same key cannot also
    // press the first menu button. Pointer: the release already happened, start now.
    if (!byKeyboard) onStart()
  }
  return (
    <main className="relative h-full overflow-hidden">
      <div className="absolute inset-0 opacity-60 blur-[2px]">
        <MenuBackdrop />
      </div>
      <div className="absolute inset-0 bg-slate-950/50" />
      <div className="relative grid h-full place-items-center text-center">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-sky-300">{t('boot.tagline')}</p>
          <h1 className="mt-2 text-8xl font-bold tracking-tight">{GAME_NAME}</h1>
          <p className="mt-3 text-xl uppercase tracking-[0.4em] text-orange-400">{GAME_SUBTITLE}</p>
          {ready && !languageChosen ? (
            <LanguagePicker onPick={pick} />
          ) : (
            <>
              <div className="mx-auto mt-10 h-1 w-64 overflow-hidden rounded bg-slate-800">
                <div className={`h-full bg-orange-500 transition-all duration-700 ${ready ? 'w-full' : 'w-1/3'}`} />
              </div>
              <p className={`mt-6 font-display text-lg tracking-wide ${ready ? 'boot-pulse text-slate-100' : 'text-slate-500'}`} aria-live="polite">
                {ready ? t('boot.pressKey') : t('boot.loading')}
              </p>
            </>
          )}
          <p className="mt-16 text-[11px] text-slate-500">{t('boot.disclaimer')}</p>
        </div>
      </div>
    </main>
  )
}
