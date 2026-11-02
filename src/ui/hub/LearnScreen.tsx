import { useMemo, useState } from 'react'
import { useMusic } from '../../audio/audio'
import { G0, deltaV } from '../../engine/budget'
import { L2_LYAPUNOV, VU_KMS, butterfly } from '../../engine/threebody'
import { CR3BPView, VIEW_WIDE } from '../threebody/CR3BPView'
import { getLauncher } from '../../engine/catalog'
import { useGame } from '../../store/game'
import { Disclaimer, Slider } from '../components'

const TABS = [
  { id: 'orbit', label: '1 · What is an orbit?' },
  { id: 'budgets', label: '2 · Mass, power, data' },
  { id: 'rocket', label: '3 · The rocket equation' },
  { id: 'chaos', label: '4 · Three bodies & chaos' },
  { id: 'paulet', label: '5 · Pedro Paulet' },
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
  const [v, setV] = useState(7.8)
  const { pts, outcome } = useMemo(() => cannonPath(v), [v])
  const s = 170 / (6371 * 2.2)
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${(200 + x * s).toFixed(1)} ${(210 - y * s).toFixed(1)}`).join(' ')
  const text =
    outcome === 'falls'
      ? 'Too slow: the ground curves away less than you fall, so you hit the Earth.'
      : outcome === 'escape'
        ? 'Faster than ~11.2 km/s: you escape Earth’s gravity for good.'
        : v < 8.2
          ? 'About 7.8 km/s: you fall around the Earth forever — that is an orbit!'
          : 'Between orbital and escape speed: a stretched orbit (an ellipse).'
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
      <svg viewBox="0 0 400 420" className="w-full rounded-xl border border-slate-800 bg-slate-950" role="img" aria-label="Newton's cannon">
        <circle cx="200" cy="210" r={6371 * s} fill="#1d4ed8" />
        <path d={d} fill="none" stroke="#fbbf24" strokeWidth="2" />
        <circle cx="200" cy={210 - (6371 + 200) * s} r="4" fill="#f97316" />
        <text x="12" y="20" fill="#94a3b8" fontSize="12">
          Newton’s cannon (to scale): fired sideways from 200 km
        </text>
      </svg>
      <div className="space-y-3 text-sm">
        <Slider label="Sideways speed" value={v} min={2} max={12} step={0.1} onChange={setV} format={(x) => `${x.toFixed(1)} km/s`} />
        <p className="text-slate-200">{text}</p>
        <p className="text-slate-400">
          An orbit is not “floating”: the spacecraft is always falling, but moving sideways so fast that the Earth curves away beneath it. Lower orbits are
          faster (~7.7 km/s at 400 km); geostationary satellites move at ~3.1 km/s and take 24 h per lap.
        </p>
      </div>
    </div>
  )
}

function RocketLesson() {
  const [isp, setIsp] = useState(300)
  const [ratio, setRatio] = useState(8)
  const dv = deltaV(isp, ratio, 1) / 1000
  const marks = [
    { label: 'Paulet-1 to 110 km', kms: 1.5 },
    { label: 'Low Earth orbit (incl. ~1.5 km/s gravity & drag losses)', kms: 9.4 },
    { label: 'LEO → Moon transfer (approx.)', kms: 9.4 + 3.2 },
    { label: 'LEO → Mars transfer (approx.)', kms: 9.4 + 3.6 },
  ]
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="font-display text-3xl">
          Δv = Isp · g₀ · ln(m<sub>full</sub>/m<sub>empty</sub>) = <span className="text-amber-300">{dv.toFixed(2)} km/s</span>
        </div>
        <div className="text-xs text-slate-400">
          = {isp} s × {G0} m/s² × ln({ratio.toFixed(1)})
        </div>
        <ul className="mt-2 space-y-1 text-sm">
          {marks.map((m) => (
            <li key={m.label} className={dv >= m.kms ? 'text-emerald-300' : 'text-slate-500'}>
              {dv >= m.kms ? '✔' : '○'} {m.label}: {m.kms.toFixed(1)} km/s
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-3 text-sm">
        <Slider label="Engine efficiency (Isp)" value={isp} min={60} max={1500} step={10} onChange={setIsp} format={(x) => `${x} s`} />
        <Slider label="Full mass ÷ empty mass" value={ratio} min={1.1} max={20} step={0.1} onChange={setRatio} format={(x) => `${x.toFixed(1)}×`} />
        <p className="text-slate-400">
          Δv grows only with the <i>logarithm</i> of the mass ratio: doubling the propellant does not double your speed. That is why rockets drop empty
          stages (staging), why efficient engines matter, and why landing a booster for reuse costs payload — the landing propellant is mass you could have
          used to go faster.
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
        <span className="text-slate-300">Change in the starting speed of the second spacecraft:</span>
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
      <Slider label="Days simulated" value={days} min={10} max={60} step={5} onChange={setDays} format={(v) => `${v} days`} />
      <div className="overflow-hidden rounded-xl border border-slate-800">
        <CR3BPView vp={VIEW_WIDE} className="h-64 w-full" label="Two almost identical spacecraft near L2">
          {({ path }) => (
            <g>
              <path d={path(b.a.states)} fill="none" stroke="#fbbf24" strokeWidth={1.6} />
              <path d={path(b.b.states)} fill="none" stroke="#f97316" strokeWidth={1.2} strokeDasharray="4 3" />
            </g>
          )}
        </CR3BPView>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
        <div className="mb-1 text-xs text-slate-400">Distance between the two spacecraft (log scale: 1 km → 1 000 000 km)</div>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-36 w-full" role="img" aria-label="Divergence over time">
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
          ? `After ${Math.round(b.daysTo1000km)} days the two spacecraft are already 1 000 km apart — although their speeds differed by about ${cmPerS < 1 ? cmPerS.toFixed(2) : cmPerS.toFixed(1)} cm/s at the start.`
          : 'In this time they stay close… try more days or a bigger change.'}
      </p>
      <div className="space-y-2 text-sm text-slate-400">
        <p>
          <b className="text-slate-200">This is chaos.</b> The motion is perfectly deterministic — the same starting numbers give exactly the same path, every
          time, in every browser (the game guarantees it). But near the Lagrange points tiny differences grow exponentially, so any small navigation error
          soon becomes a big one. Henri Poincaré found this behaviour while studying the three-body problem around 1890. Look at the yellow
          “perfect” orbit too: after a few loops even it slides away — the orbit is unstable, and the tiniest rounding error is enough.
        </p>
        <p>
          <b className="text-slate-200">Why it matters:</b> spacecraft on halo orbits make small, regular correction burns — cheap if done early, expensive if
          you wait. The same chaos is also a gift: low-energy routes use it to reach the Moon or L2 with very little propellant.
        </p>
        <p className="text-xs">
          In the game: Cadets watch this lesson, Researchers choose between precomputed routes, Program Directors also size the correction reserve and decide
          when to correct.
        </p>
      </div>
    </div>
  )
}

function BudgetsLesson() {
  const cards = [
    {
      t: 'Mass',
      d: 'Every kilogram must be lifted. Parts + ~22% structure + a 20% safety margin + propellant from the rocket equation must fit the launcher.',
    },
    { t: 'Power', d: 'Solar panels only work in sunlight. During eclipses the battery carries the load — and every deep discharge ages it.' },
    { t: 'Data', d: 'Instruments produce more data than radios can send. Ground passes last minutes; more stations or faster bands open the bottleneck.' },
    { t: 'Money & time', d: 'Immature (low-TRL) technology costs more and takes longer. Investors fund results, not dreams.' },
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
        In the game, change any part and watch all four budgets move at once — that coupling is what spacecraft engineers call a trade-off.
      </p>
    </div>
  )
}

function PauletLesson() {
  const go = useGame((s) => s.go)
  const campaign = useGame((s) => s.campaign)
  const facts: [string, string][] = [
    ['Documented', 'Pedro Paulet was born in Arequipa, Peru, in 1874 and died in Buenos Aires in 1945. He studied in Paris and worked as an engineer.'],
    ['His own account', 'In a letter published in the Lima newspaper El Comercio in 1927, he said that around 1895–1897 in Paris he had tested a rocket engine burning liquid propellants.'],
    ['Disputed', 'No independent record of those tests has been found; later historians could not verify them. Treat them as his claim, not established fact.'],
    ['For comparison', 'The first verified flight of a liquid-propellant rocket was Robert Goddard’s, in Massachusetts, in 1926.'],
    ['In this game', `${campaign ? `${campaign.profile.title} ${campaign.profile.name}` : 'Dr. Pedro Goicochea'} (fictional) builds Paulet-1 from those ideas. ${getLauncher('paulet').suborbital ? 'It reaches space but cannot reach orbit.' : ''}`],
  ]
  return (
    <div className="space-y-3">
      <ol className="space-y-2">
        {facts.map(([tag, text]) => (
          <li key={tag} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm">
            <span className={`mr-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${tag === 'Disputed' ? 'bg-rose-500/20 text-rose-300' : tag === 'His own account' ? 'bg-amber-500/20 text-amber-300' : 'bg-sky-500/20 text-sky-300'}`}>
              {tag}
            </span>
            {text}
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => go('firstlight')} className="rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-400">
        🔥 Fly Paulet-1 ({campaign ? 'from your career' : 'practice flight'})
      </button>
    </div>
  )
}

export function LearnScreen() {
  const go = useGame((s) => s.go)
  const tab = useGame((s) => s.learnTab)
  const openLearn = useGame((s) => s.openLearn)
  useMusic('design')
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <button type="button" onClick={() => go('home')} className="text-sm text-slate-400 hover:text-slate-100">
        ← Home
      </button>
      <h1 className="mt-2 text-2xl font-semibold">Learn</h1>
      <nav className="mt-3 flex flex-wrap gap-1" aria-label="Lessons">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => openLearn(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm ${tab === t.id ? 'bg-sky-500/20 text-sky-200' : 'text-slate-400 hover:text-slate-100'}`}
          >
            {t.label}
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
      <p className="mt-6 text-xs text-slate-500">Numbers are rounded, educational values.</p>
      <div className="mt-2">
        <Disclaimer />
      </div>
    </main>
  )
}
