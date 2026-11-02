import { useMemo, useState } from 'react'
import { useMusic } from '../../audio/audio'
import { G0, deltaV } from '../../engine/budget'
import { getLauncher } from '../../engine/catalog'
import { useGame } from '../../store/game'
import { Disclaimer, Slider } from '../components'

const TABS = [
  { id: 'orbit', label: '1 · What is an orbit?' },
  { id: 'budgets', label: '2 · Mass, power, data' },
  { id: 'rocket', label: '3 · The rocket equation' },
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
        {tab === 'paulet' && <PauletLesson />}
      </div>
      <p className="mt-6 text-xs text-slate-500">Lesson 4 (the three-body problem and chaos) arrives with Act 2. Numbers are rounded, educational values.</p>
      <div className="mt-2">
        <Disclaimer />
      </div>
    </main>
  )
}
