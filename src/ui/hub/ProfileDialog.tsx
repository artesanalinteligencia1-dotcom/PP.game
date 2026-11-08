import { useState } from 'react'
import type { Level, Profile } from '../../engine/campaign'
import { useT, type StringKey } from '../../i18n'

const LEVELS: { id: Level; name: StringKey; text: StringKey }[] = [
  { id: 'cadet', name: 'profile.level.cadet', text: 'profile.level.cadet.hint' },
  { id: 'researcher', name: 'profile.level.researcher', text: 'profile.level.researcher.hint' },
  { id: 'director', name: 'profile.level.director', text: 'profile.level.director.hint' },
]

export function ProfileDialog({
  initial,
  title,
  confirm,
  onConfirm,
  onCancel,
}: {
  initial: Profile
  title: string
  confirm: string
  onConfirm: (p: Profile) => void
  onCancel: () => void
}) {
  const [p, setP] = useState<Profile>(initial)
  const t = useT()
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4" role="dialog" aria-modal="true" aria-labelledby="profile-title">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
        <h2 id="profile-title" className="text-xl font-semibold">
          {title}
        </h2>
        <p className="mt-1 text-xs text-slate-400">{t('profile.subtitle')}</p>
        <label className="mt-4 block text-sm">
          <span className="text-slate-300">{t('profile.name')}</span>
          <input
            value={p.name}
            onChange={(e) => setP({ ...p, name: e.target.value.slice(0, 40) })}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5"
          />
        </label>
        <div className="mt-3 flex gap-2 text-sm">
          {(['Dr.', 'Eng.'] as const).map((titleKey) => (
            <button
              key={titleKey}
              type="button"
              onClick={() => setP({ ...p, title: titleKey })}
              className={`rounded-lg border px-3 py-1.5 ${p.title === titleKey ? 'border-sky-400 bg-sky-500/10' : 'border-slate-700'}`}
            >
              {titleKey === 'Dr.' ? t('profile.title.dr') : t('profile.title.eng')}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setP({ ...p, level: l.id })}
              className={`w-full rounded-lg border p-2 text-left ${p.level === l.id ? 'border-sky-400 bg-sky-500/10' : 'border-slate-700'}`}
            >
              <div className="font-medium">{t(l.name)}</div>
              <div className="text-xs text-slate-400">{t(l.text)}</div>
            </button>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-slate-100">
            {t('profile.cancel')}
          </button>
          <button
            type="button"
            disabled={!p.name.trim()}
            onClick={() => onConfirm({ ...p, name: p.name.trim() })}
            className="btn-primary px-4 py-2 text-sm  disabled:opacity-40"
          >
            {confirm}
          </button>
        </div>
      </div>
    </div>
  )
}
