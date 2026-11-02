import { audio, useMuted } from '../audio/audio'

export function SoundToggle() {
  const muted = useMuted()
  return (
    <button
      type="button"
      onClick={() => audio.setMuted(!muted)}
      className="fixed bottom-4 right-4 z-40 rounded-full border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-slate-200 shadow-lg hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      aria-pressed={!muted}
      aria-label={muted ? 'Turn sound on' : 'Mute sound'}
      title={muted ? 'Sound off' : 'Sound on'}
    >
      {muted ? '🔇' : '🔊'} <span className="hidden sm:inline">{muted ? 'Sound off' : 'Sound on'}</span>
    </button>
  )
}
