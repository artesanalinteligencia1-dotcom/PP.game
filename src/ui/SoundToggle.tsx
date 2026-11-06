import { audio, useMuted } from '../audio/audio'

export function SoundToggle() {
  const muted = useMuted()
  return (
    <button
      type="button"
      onClick={() => audio.setMuted(!muted)}
      className="btn-secondary h-9 px-3 text-sm"
      aria-pressed={!muted}
      aria-label={muted ? 'Turn sound on' : 'Mute sound'}
      title={muted ? 'Sound off' : 'Sound on'}
    >
      {muted ? '🔇' : '🔊'} <span className="hidden sm:inline">{muted ? 'Sound off' : 'Sound on'}</span>
    </button>
  )
}
