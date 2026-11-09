import type { ReactNode } from 'react'
import type { Severity } from '../engine/types'
import { useT } from '../i18n'

export const SEV_TEXT: Record<Severity, string> = { ok: 'text-emerald-400', warn: 'text-amber-400', error: 'text-rose-400' }
export const SEV_BG: Record<Severity, string> = { ok: 'bg-emerald-500', warn: 'bg-amber-400', error: 'bg-rose-500' }
export const SEV_BORDER: Record<Severity, string> = {
  ok: 'border-emerald-500/40',
  warn: 'border-amber-400/50',
  error: 'border-rose-500/60',
}

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="hud-label">{title}</h3>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

export function OptionCard({
  selected,
  onClick,
  title,
  stats,
  children,
  disabled,
  badge,
}: {
  selected: boolean
  onClick: () => void
  title: string
  stats?: (string | false | undefined)[]
  children?: ReactNode
  disabled?: boolean
  badge?: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`w-full rounded-lg border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
        selected ? 'border-sky-400 bg-sky-500/10' : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
      } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-slate-100">{title}</span>
        {badge}
      </div>
      {stats && (
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400">
          {stats.filter(Boolean).map((s) => (
            <span key={s as string}>{s}</span>
          ))}
        </div>
      )}
      {children && <div className="mt-2 text-xs text-slate-400">{children}</div>}
    </button>
  )
}

export function Grid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format: (v: number) => string
}) {
  return (
    <label className="block">
      <div className="flex justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span className="font-mono text-sky-300">{format(value)}</span>
      </div>
      <input
        type="range"
        className="mt-1 w-full accent-sky-400"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

export function Pill({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'sky' | 'amber' | 'rose' | 'emerald' | 'violet' }) {
  const tones = {
    slate: 'bg-slate-700/60 text-slate-200',
    sky: 'bg-sky-500/20 text-sky-300',
    amber: 'bg-amber-500/20 text-amber-300',
    rose: 'bg-rose-500/20 text-rose-300',
    emerald: 'bg-emerald-500/20 text-emerald-300',
    violet: 'bg-violet-500/20 text-violet-300',
  }
  return <span className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${tones[tone]}`}>{children}</span>
}

export function Disclaimer() {
  const t = useT()
  return (
    <p className="text-[11px] text-slate-500">
      {t('home.disclaimer')}
    </p>
  )
}
