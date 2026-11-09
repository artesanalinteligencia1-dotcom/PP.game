import { audio, useMuted } from '../audio/audio'
import { useT } from '../i18n'

export function SoundToggle() {
  const muted = useMuted()
  const t = useT()
  return (
    <button
      type="button"
      onClick={() => audio.setMuted(!muted)}
      className="btn-secondary h-9 px-3 text-sm"
      aria-pressed={!muted}
      aria-label={muted ? t('sound.unmute') : t('sound.mute')}
      title={muted ? t('sound.off') : t('sound.on')}
    >
      {muted ? '🔇' : '🔊'} <span className="hidden sm:inline">{muted ? t('sound.off') : t('sound.on')}</span>
    </button>
  )
}
