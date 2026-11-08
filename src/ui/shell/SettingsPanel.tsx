import { useEffect, useRef, useState, type ReactNode } from 'react'
import { audio, useMuted, useVolumes, type Bus } from '../../audio/audio'
import { GAME_NAME } from '../../brand'
import { isFullscreen, toggleFullscreen } from '../../platform/desktop'
import { isDesktop, useOffline } from '../../platform/offline'
import { useGame } from '../../store/game'
import { parseSaveFile, saveFileName, toSaveFile } from '../../store/save'
import { useSettings, type MotionPref, type PadLight } from '../../store/settings'
import { LANGUAGES, translate, useT, type Lang, type StringKey } from '../../i18n'

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[200px_1fr] items-center gap-4 py-2">
      <div>
        <div className="text-sm text-slate-200">{label}</div>
        {hint && <div className="text-xs text-slate-500">{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-slate-700 p-0.5">
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`rounded-md px-3 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${value === v ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white'}`}
        >
          {text}
        </button>
      ))}
    </div>
  )
}

const BUS_LABEL: Record<Bus, [StringKey, StringKey]> = {
  music: ['settings.bus.music', 'settings.bus.music.hint'],
  fx: ['settings.bus.fx', 'settings.bus.fx.hint'],
  voice: ['settings.bus.voice', 'settings.bus.voice.hint'],
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const s = useSettings()
  const t = useT()
  const onOff: ['on' | 'off', string][] = [['on', t('settings.on')], ['off', t('settings.off')]]
  const volumes = useVolumes()
  const muted = useMuted()
  const campaign = useGame((g) => g.campaign)
  const loadCampaignState = useGame((g) => g.loadCampaignState)
  const offline = useOffline()
  const [full, setFull] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    isFullscreen().then(setFull)
    panelRef.current?.querySelector<HTMLElement>('button, input')?.focus()
  }, [])

  const exportSave = () => {
    if (!campaign) return
    const blob = new Blob([JSON.stringify(toSaveFile(campaign), null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = saveFileName(campaign)
    a.click()
    URL.revokeObjectURL(a.href)
    setSaveMsg(t('settings.saved', { file: a.download }))
  }
  const importSave = async (file: File) => {
    try {
      const c = parseSaveFile(await file.text())
      if (campaign && !window.confirm(t('settings.replaceConfirm', { current: `${campaign.profile.title} ${campaign.profile.name}`, incoming: `${c.profile.title} ${c.profile.name}` }))) return
      loadCampaignState(c)
      setSaveMsg(t('settings.loaded', { name: `${c.profile.title} ${c.profile.name}` }))
    } catch (e) {
      setSaveMsg((e as Error).message)
    }
  }

  return (
    <div id="settings-dialog" className="absolute inset-0 z-[60] grid place-items-center bg-slate-950/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div ref={panelRef} className="hud-panel max-h-[760px] w-[720px] overflow-y-auto p-6 shadow-2xl">
        <div className="flex items-center">
          <h2 id="settings-title" className="text-2xl font-bold">
            {t('settings.title')}
          </h2>
          <button type="button" data-sound="back" onClick={onClose} className="ml-auto rounded-lg border border-slate-700 px-3 py-1 text-sm hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
            {t('settings.close')} <kbd className="ml-1 text-xs text-slate-500">Esc</kbd>
          </button>
        </div>

        <h3 className="hud-label mt-5">{t('settings.sound')}</h3>
        <Row label={t('settings.sound')}>
          <Segmented label={t('settings.sound')} value={muted ? 'off' : 'on'} options={onOff} onChange={(v) => audio.setMuted(v === 'off')} />
        </Row>
        {(Object.keys(BUS_LABEL) as Bus[]).map((bus) => (
          <Row key={bus} label={t(BUS_LABEL[bus][0])} hint={t(BUS_LABEL[bus][1])}>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(volumes[bus] * 100)}
                onChange={(e) => audio.setBusVolume(bus, Number(e.target.value) / 100)}
                onPointerUp={() => bus !== 'music' && audio.ui('click')}
                aria-label={t('settings.volume', { bus: t(BUS_LABEL[bus][0]) })}
                className="w-72 accent-sky-500"
                disabled={muted}
              />
              <span className="w-10 text-right font-mono text-sm text-slate-400">{Math.round(volumes[bus] * 100)}</span>
            </div>
          </Row>
        ))}
        <Row label={t('settings.uiSounds')} hint={t('settings.uiSounds.hint')}>
          <Segmented label={t('settings.uiSounds')} value={s.uiSounds ? 'on' : 'off'} options={onOff} onChange={(v) => s.set('uiSounds', v === 'on')} />
        </Row>

        <h3 className="hud-label mt-5">{t('settings.display')}</h3>
        <Row label={t('settings.fullscreen')} hint={t('settings.fullscreen.hint')}>
          <Segmented label={t('settings.fullscreen')} value={full ? 'on' : 'off'} options={onOff} onChange={() => toggleFullscreen().then(setFull)} />
        </Row>
        <Row label={t('settings.launchLight')} hint={t('settings.launchLight.hint')}>
          <Segmented<PadLight> label={t('settings.launchLight')} value={s.padLight} options={(['auto', 'dawn', 'day', 'night'] as const).map((v) => [v, t(`settings.light.${v}`)])} onChange={(v) => s.set('padLight', v)} />
        </Row>
        <Row label={t('settings.motion')} hint={t('settings.motion.hint')}>
          <Segmented<MotionPref> label={t('settings.motion')} value={s.motion} options={(['system', 'full', 'reduced'] as const).map((v) => [v, t(`settings.motion.${v}`)])} onChange={(v) => s.set('motion', v)} />
        </Row>
        <Row label={t('settings.language')} hint={t('settings.language.hint')}>
          {/* Each language is written in itself, so a player can always find their own. */}
          <Segmented<Lang> label={t('settings.language')} value={s.language} options={LANGUAGES.map((l) => [l, translate(l, `lang.${l}`)])} onChange={(v) => s.set('language', v)} />
        </Row>

        <h3 className="hud-label mt-5">{t('settings.saveOffline')}</h3>
        <Row label={t('settings.careerSave')} hint={t('settings.careerSave.hint')}>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={exportSave} disabled={!campaign} className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
              {t('settings.export')}
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
              {t('settings.import')}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) importSave(f)
                e.target.value = ''
              }}
            />
          </div>
          {saveMsg && <p className="mt-1 text-xs text-slate-400" role="status">{saveMsg}</p>}
        </Row>
        {!isDesktop && (
          <Row label={t('settings.offline')} hint={offline.offlineReady ? t('settings.offline.ready') : t('settings.offline.pending')}>
            {offline.canInstall ? (
              <button type="button" onClick={offline.install} className="btn-primary px-3 py-1.5 text-sm  focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
                {t('settings.install', { game: GAME_NAME })}
              </button>
            ) : (
              <span className="text-sm text-slate-400">{offline.offlineReady ? t('settings.offline.available') : t('settings.offline.browser')}</span>
            )}
          </Row>
        )}
      </div>
    </div>
  )
}
