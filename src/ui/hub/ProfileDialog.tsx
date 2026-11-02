import { useState } from 'react'
import type { Level, Profile } from '../../engine/campaign'

const LEVELS: { id: Level; name: string; text: string }[] = [
  { id: 'cadet', name: 'Cadet', text: 'Gentle events, more hints. Learn the ropes.' },
  { id: 'researcher', name: 'Researcher', text: 'Normal events and investor pressure.' },
  { id: 'director', name: 'Program Director', text: 'Frequent events, tougher launches. For experts.' },
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
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4" role="dialog" aria-modal="true" aria-labelledby="profile-title">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
        <h2 id="profile-title" className="text-xl font-semibold">
          {title}
        </h2>
        <p className="mt-1 text-xs text-slate-400">You play the director of a small space institute. Default: Dr. Pedro Goicochea (fictional).</p>
        <label className="mt-4 block text-sm">
          <span className="text-slate-300">Your name</span>
          <input
            value={p.name}
            onChange={(e) => setP({ ...p, name: e.target.value.slice(0, 40) })}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5"
          />
        </label>
        <div className="mt-3 flex gap-2 text-sm">
          {(['Dr.', 'Eng.'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setP({ ...p, title: t })}
              className={`rounded-lg border px-3 py-1.5 ${p.title === t ? 'border-sky-400 bg-sky-500/10' : 'border-slate-700'}`}
            >
              {t === 'Dr.' ? 'Dr. (scientist)' : 'Eng. (engineer)'}
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
              <div className="font-medium">{l.name}</div>
              <div className="text-xs text-slate-400">{l.text}</div>
            </button>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-slate-100">
            Cancel
          </button>
          <button
            type="button"
            disabled={!p.name.trim()}
            onClick={() => onConfirm({ ...p, name: p.name.trim() })}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-40"
          >
            {confirm}
          </button>
        </div>
      </div>
    </div>
  )
}
