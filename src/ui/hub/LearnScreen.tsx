import { useMemo, useState } from 'react'
import { useMusic } from '../../audio/audio'
import { G0, deltaV } from '../../engine/budget'
import { L2_LYAPUNOV, VU_KMS, butterfly } from '../../engine/threebody'
import { CR3BPView, VIEW_WIDE } from '../threebody/CR3BPView'
import { useGame } from '../../store/game'
import { Disclaimer, Slider } from '../components'
import { useT, type StringKey } from '../../i18n'

const TABS: { id: string; labelKey: StringKey }[] = [
  { id: 'orbit', labelKey: 'learn.tab.orbit' },
  { id: 'budgets', labelKey: 'learn.tab.budgets' },
  { id: 'rocket', labelKey: 'learn.tab.rocket' },
  { id: 'chaos', labelKey: 'learn.tab.chaos' },
  { id: 'paulet', labelKey: 'learn.tab.paulet' },
]

/** Newton's cannon: fire horizontally from 200 km up and integrate the two-body motion. */
function cannonPath(vKms: number) {
  const mu = 398600.4418
  const R = 6371
  let x = 0
  let y = R + 200
  let vx = vKms
  let vy = 0
  const pts: [number, number][] = [[x, y]]
  const dt = 5
  let outcome: 'falls' | 'orbit' | 'escape' = 'orbit'
  for (let i = 0; i < 2880; i++) {
    const r = Math.sqrt(x * x + y * y)
    const a = -mu / (r * r * r)
    vx += a * x * dt
    vy += a * y * dt
    x += vx * dt
    y += vy * dt
    if (i % 4 === 0) pts.push([x, y])
    const rr = Math.sqrt(x * x + y * y)
    if (rr < R) {
      outcome = 'falls'
      break
    }
    if (rr > 4 * R) {
      outcome = 'escape'
      break
    }
  }
  return { pts, outcome }
}

function OrbitLesson() {
  const t = useT()
  const [v, setV] = useState(7.8)
  const { pts, outcome } = useMemo(() => cannonPath(v), [v])
  const s = 170 / (6371 * 2.2)
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${(200 + x * s).toFixed(1)} ${(210 - y * s).toFixed(1)}`).join(' ')
  const text =
    outcome === 'falls'
      ? t('learn.orbit.falls')
      : outcome === 'escape'
        ? t('learn.orbit.escape')
        : v < 8.2
          ? t('learn.orbit.orbit')
          : t('learn.orbit.stretched')
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
      <svg viewBox="0 0 400 420" className="w-full rounded-xl border border-slate-800 bg-slate-950" role="img" aria-label={t('learn.orbit.aria')}>
        <circle cx="200" cy="210" r={6371 * s} fill="#1d4ed8" />
        <path d={d} fill="none" stroke="#fbbf24" strokeWidth="2" />
        <circle cx="200" cy={210 - (6371 + 200) * s} r="4" fill="#f97316" />
        <text x="12" y="20" fill="#94a3b8" fontSize="12">
          {t('learn.orbit.diagram')}
        </text>
      </svg>
      <div className="space-y-3 text-sm">
        <Slider label={t('learn.orbit.speed')} value={v} min={2} max={12} step={0.1} onChange={setV} format={(x) => `${x.toFixed(1)} km/s`} />
        <p className="text-slate-200">{text}</p>
        <p className="text-slate-400">
          {t('learn.orbit.explanation')}
        </p>
      </div>
    </div>
  )
}

function RocketLesson() {
  const t = useT()
  const [isp, setIsp] = useState(300)
  const [ratio, setRatio] = useState(8)
  const dv = deltaV(isp, ratio, 1) / 1000
  const marks = [
    { label: t('learn.rocket.mark.paulet'), kms: 1.5 },
    { label: t('learn.rocket.mark.leo'), kms: 9.4 },
    { label: t('learn.rocket.mark.moon'), kms: 9.4 + 3.2 },
    { label: t('learn.rocket.mark.mars'), kms: 9.4 + 3.6 },
  ]
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="font-display text-3xl">
          Δv = Isp · g₀ · ln(m<sub>{t('learn.rocket.subFull')}</sub>/m<sub>{t('learn.rocket.subEmpty')}</sub>) = <span className="text-amber-300">{dv.toFixed(2)} km/s</span>
        </div>
        <div className="text-xs text-slate-400">
          = {isp} s × {G0} m/s² × ln({ratio.toFixed(1)})
        </div>
        <ul className="mt-2 space-y-1 text-sm">
          {marks.map((m) => (
            <li key={m.kms} className={dv >= m.kms ? 'text-emerald-300' : 'text-slate-500'}>
              {dv >= m.kms ? '✔' : '○'} {m.label}: {m.kms.toFixed(1)} km/s
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-3 text-sm">
        <Slider label={t('learn.rocket.isp')} value={isp} min={60} max={1500} step={10} onChange={setIsp} format={(x) => `${x} s`} />
        <Slider label={t('learn.rocket.ratio')} value={ratio} min={1.1} max={20} step={0.1} onChange={setRatio} format={(x) => `${x.toFixed(1)}×`} />
        <p className="text-slate-400">
          {t('learn.rocket.explanation')}
        </p>
      </div>
    </div>
  )
}

const PERTURBATIONS: [number, string][] = [
  [1e-6, '0.0001 %'],
  [1e-5, '0.001 %'],
  [1e-4, '0.01 %'],
  [1e-3, '0.1 %'],
]

function ChaosLesson() {
  const t = useT()
  const [rel, setRel] = useState(1e-4)
  const [days, setDays] = useState(40)
  const b = useMemo(() => butterfly(rel, days), [rel, days])
  const cmPerS = Math.abs(L2_LYAPUNOV.vy0) * VU_KMS * rel * 1e5
  // divergence chart, log scale 1 km … 1 000 000 km
  const W = 600
  const H = 160
  const pts = b.divergence.map((d, i) => {
    const x = (b.dayOf(i) / days) * W
    const y = H - (Math.log10(Math.max(1, d)) / 6) * H
    return `${i ? 'L' : 'M'}${x.toFixed(1)} ${Math.max(0, y).toFixed(1)}`
  })
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-300">{t('learn.chaos.changeSpeed')}</span>
        {PERTURBATIONS.map(([v, l]) => (
          <button
            key={l}
            type="button"
            onClick={() => setRel(v)}
            className={`rounded-lg border px-2 py-1 ${rel === v ? 'border-orange-400 bg-orange-500/10 text-orange-200' : 'border-slate-700 text-slate-300'}`}
          >
            {l}
          </button>
        ))}
        <span className="text-xs text-slate-400">≈ {cmPerS < 1 ? cmPerS.toFixed(2) : cmPerS.toFixed(1)} cm/s</span>
      </div>
      <Slider label={t('learn.chaos.daysSim')} value={days} min={10} max={60} step={5} onChange={setDays} format={(v) => t('learn.chaos.daysFormat', { days: String(v) })} />
      <div className="overflow-hidden rounded-xl border border-slate-800">
        <CR3BPView vp={VIEW_WIDE} className="h-64 w-full" label={t('learn.chaos.viewLabel')}>
          {({ path }) => (
            <g>
              <path d={path(b.a.states)} fill="none" stroke="#fbbf24" strokeWidth={1.6} />
              <path d={path(b.b.states)} fill="none" stroke="#f97316" strokeWidth={1.2} strokeDasharray="4 3" />
            </g>
          )}
        </CR3BPView>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
        <div className="mb-1 text-xs text-slate-400">{t('learn.chaos.distTitle')}</div>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-36 w-full" role="img" aria-label={t('learn.chaos.divergenceAria')}>
          {[0, 1, 2, 3, 4, 5, 6].map((k) => (
            <g key={k}>
              <line x1="0" x2={W} y1={H - (k / 6) * H} y2={H - (k / 6) * H} stroke="#1e293b" />
              <text x="4" y={H - (k / 6) * H - 2} fill="#64748b" fontSize="10">
                {k === 0 ? '1 km' : k === 3 ? '1 000 km' : k === 6 ? '1 000 000 km' : ''}
              </text>
            </g>
          ))}
          <path d={pts.join(' ')} fill="none" stroke="#f97316" strokeWidth={2} />
        </svg>
      </div>
      <p className="text-sm text-slate-200">
        {b.daysTo1000km !== null
          ? t('learn.chaos.diverged', { days: String(Math.round(b.daysTo1000km)), diff: cmPerS < 1 ? cmPerS.toFixed(2) : cmPerS.toFixed(1) })
          : t('learn.chaos.stayClose')}
      </p>
      <div className="space-y-2 text-sm text-slate-400">
        <p>
          <b className="text-slate-200">{t('learn.chaos.p1.title')}</b>{' '}
          {t('learn.chaos.p1.body')}
        </p>
        <p>
          <b className="text-slate-200">{t('learn.chaos.p2.title')}</b>{' '}
          {t('learn.chaos.p2.body')}
        </p>
        <p className="text-xs">
          {t('learn.chaos.p3')}
        </p>
      </div>
    </div>
  )
}

function BudgetsLesson() {
  const t = useT()
  const cards = [
    {
      t: t('learn.budgets.mass.title'),
      d: t('learn.budgets.mass.desc'),
    },
    { t: t('learn.budgets.power.title'), d: t('learn.budgets.power.desc') },
    { t: t('learn.budgets.data.title'), d: t('learn.budgets.data.desc') },
    { t: t('learn.budgets.money.title'), d: t('learn.budgets.money.desc') },
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map((c) => (
        <div key={c.t} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="font-display text-lg font-semibold">{c.t}</div>
          <p className="mt-1 text-sm text-slate-300">{c.d}</p>
        </div>
      ))}
      <p className="text-sm text-slate-400 sm:col-span-2">
        {t('learn.budgets.tradeoff')}
      </p>
    </div>
  )
}

function PauletLesson() {
  const t = useT()
  const go = useGame((s) => s.go)
  const campaign = useGame((s) => s.campaign)
  const director = campaign ? `${campaign.profile.title} ${campaign.profile.name}` : t('firstLight.defaultDirector')
  const facts: [string, string][] = [
    [t('learn.paulet.tag.documented'), t('learn.paulet.fact.documented')],
    [t('learn.paulet.tag.account'), t('learn.paulet.fact.account')],
    [t('learn.paulet.tag.disputed'), t('learn.paulet.fact.disputed')],
    [t('learn.paulet.tag.comparison'), t('learn.paulet.fact.comparison')],
    [t('learn.paulet.tag.inGame'), t('learn.paulet.fact.inGame', { director })],
  ]
  return (
    <div className="space-y-3">
      <ol className="space-y-2">
        {facts.map(([tag, text]) => (
          <li key={tag} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm">
            <span className={`mr-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${tag === t('learn.paulet.tag.disputed') ? 'bg-rose-500/20 text-rose-300' : tag === t('learn.paulet.tag.account') ? 'bg-amber-500/20 text-amber-300' : 'bg-sky-500/20 text-sky-300'}`}>
              {tag}
            </span>
            {text}
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => go('firstlight')} className="btn-primary px-4 py-2 ">
        {campaign ? t('learn.paulet.flyCareer') : t('learn.paulet.flyPractice')}
      </button>
    </div>
  )
}

export function LearnScreen() {
  const t = useT()
  const go = useGame((s) => s.go)
  const tab = useGame((s) => s.learnTab)
  const openLearn = useGame((s) => s.openLearn)
  useMusic('design')
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <button type="button" onClick={() => go('home')} className="text-sm text-slate-400 hover:text-slate-100">
        {t('learn.back')}
      </button>
      <h1 className="mt-2 text-2xl font-semibold">{t('learn.title')}</h1>
      <nav className="mt-3 flex flex-wrap gap-1" aria-label={t('learn.lessons')}>
        {TABS.map((tabItem) => (
          <button
            key={tabItem.id}
            type="button"
            onClick={() => openLearn(tabItem.id)}
            aria-current={tab === tabItem.id ? 'page' : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm ${tab === tabItem.id ? 'bg-sky-500/20 text-sky-200' : 'text-slate-400 hover:text-slate-100'}`}
          >
            {t(tabItem.labelKey)}
          </button>
        ))}
      </nav>
      <div className="mt-5">
        {tab === 'orbit' && <OrbitLesson />}
        {tab === 'budgets' && <BudgetsLesson />}
        {tab === 'rocket' && <RocketLesson />}
        {tab === 'chaos' && <ChaosLesson />}
        {tab === 'paulet' && <PauletLesson />}
      </div>
      <p className="mt-6 text-xs text-slate-500">{t('learn.educational')}</p>
      <div className="mt-2">
        <Disclaimer />
      </div>
    </main>
  )
}
