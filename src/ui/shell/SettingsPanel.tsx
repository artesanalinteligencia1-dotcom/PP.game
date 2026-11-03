import { useEffect, useRef, useState, type ReactNode } from 'react'
import { audio, useMuted, useVolumes, type Bus } from '../../audio/audio'
import { isFullscreen, toggleFullscreen } from '../../platform/desktop'
import { isDesktop, useOffline } from '../../platform/offline'
import { useGame } from '../../store/game'
import { parseSaveFile, saveFileName, toSaveFile } from '../../store/save'
import { useSettings, type MotionPref, type PadLight } from '../../store/settings'

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

const BUS_LABEL: Record<Bus, [string, string]> = {
  music: ['Music', 'Soundtrack for each stage of the game'],
  fx: ['Effects', 'Engines, alerts and interface sounds'],
  voice: ['Mission control', 'Countdown and flight calls'],
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const s = useSettings()
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
    setSaveMsg(`Saved ${a.download}`)
  }
  const importSave = async (file: File) => {
    try {
      const c = parseSaveFile(await file.text())
      if (campaign && !window.confirm(`Replace the current career of ${campaign.profile.title} ${campaign.profile.name} with ${c.profile.title} ${c.profile.name}'s?`)) return
      loadCampaignState(c)
      setSaveMsg(`Loaded the career of ${c.profile.title} ${c.profile.name}.`)
    } catch (e) {
      setSaveMsg((e as Error).message)
    }
  }

  return (
    <div id="settings-dialog" className="absolute inset-0 z-[60] grid place-items-center bg-slate-950/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div ref={panelRef} className="max-h-[760px] w-[720px] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center">
          <h2 id="settings-title" className="text-2xl font-bold">
            Settings
          </h2>
          <button type="button" data-sound="back" onClick={onClose} className="ml-auto rounded-lg border border-slate-700 px-3 py-1 text-sm hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
            Close <kbd className="ml-1 text-xs text-slate-500">Esc</kbd>
          </button>
        </div>

        <h3 className="mt-5 text-xs uppercase tracking-widest text-sky-400">Sound</h3>
        <Row label="Sound">
          <Segmented label="Sound" value={muted ? 'off' : 'on'} options={[['on', 'On'], ['off', 'Off']]} onChange={(v) => audio.setMuted(v === 'off')} />
        </Row>
        {(Object.keys(BUS_LABEL) as Bus[]).map((bus) => (
          <Row key={bus} label={BUS_LABEL[bus][0]} hint={BUS_LABEL[bus][1]}>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(volumes[bus] * 100)}
                onChange={(e) => audio.setBusVolume(bus, Number(e.target.value) / 100)}
                onPointerUp={() => bus !== 'music' && audio.ui('click')}
                aria-label={`${BUS_LABEL[bus][0]} volume`}
                className="w-72 accent-sky-500"
                disabled={muted}
              />
              <span className="w-10 text-right font-mono text-sm text-slate-400">{Math.round(volumes[bus] * 100)}</span>
            </div>
          </Row>
        ))}
        <Row label="Interface sounds" hint="Soft clicks on menus and buttons">
          <Segmented label="Interface sounds" value={s.uiSounds ? 'on' : 'off'} options={[['on', 'On'], ['off', 'Off']]} onChange={(v) => s.set('uiSounds', v === 'on')} />
        </Row>

        <h3 className="mt-5 text-xs uppercase tracking-widest text-sky-400">Display</h3>
        <Row label="Fullscreen" hint="Also F11">
          <Segmented label="Fullscreen" value={full ? 'on' : 'off'} options={[['on', 'On'], ['off', 'Off']]} onChange={() => toggleFullscreen().then(setFull)} />
        </Row>
        <Row label="Launch light" hint="Auto: the launch window sets dawn, day or night">
          <Segmented<PadLight> label="Launch light" value={s.padLight} options={[['auto', 'Auto'], ['dawn', 'Dawn'], ['day', 'Day'], ['night', 'Night']]} onChange={(v) => s.set('padLight', v)} />
        </Row>
        <Row label="Motion" hint="Reduced: launches start at the report, fewer animations">
          <Segmented<MotionPref> label="Motion" value={s.motion} options={[['system', 'System'], ['full', 'Full'], ['reduced', 'Reduced']]} onChange={(v) => s.set('motion', v)} />
        </Row>
        <Row label="Language" hint="Spanish is planned">
          <Segmented label="Language" value={s.language} options={[['en', 'English']]} onChange={() => undefined} />
        </Row>

        <h3 className="mt-5 text-xs uppercase tracking-widest text-sky-400">Save &amp; offline</h3>
        <Row label="Career save" hint="Back up your career to a file, or load one">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={exportSave} disabled={!campaign} className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
              Export save
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
              Import save…
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
          <Row label="Play offline" hint={offline.offlineReady ? 'Ready: the whole game is stored on this device' : 'The game stores itself for offline play after loading'}>
            {offline.canInstall ? (
              <button type="button" onClick={offline.install} className="rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
                Install PP.game
              </button>
            ) : (
              <span className="text-sm text-slate-400">{offline.offlineReady ? '✓ Available offline' : 'Use your browser menu → Install app'}</span>
            )}
          </Row>
        )}
      </div>
    </div>
  )
}
