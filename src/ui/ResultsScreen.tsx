import { useMsg } from '../i18n'
import { useEffect, useMemo, useState } from 'react'
import { audio, useMusic } from '../audio/audio'
import { SpacecraftSprite } from './spacecraft/SpacecraftSprite'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getScenario } from '../engine/catalog'
import { analyseMission } from '../engine/report'
import { scoreMission, type Rank } from '../engine/score'
import { CAUSE_TEXT, END_REASON_LABEL, REQUIREMENT_LABEL, fmt, localName } from '../i18n/en'
import { useGame } from '../store/game'
import { shareUrl } from '../store/share'
import { Disclaimer, Pill } from './components'
import { useT, useTx, type StringKey } from '../i18n'

const RANK_STYLE: Record<Rank, string> = {
  Fail: 'text-rose-400 border-rose-500/50',
  Partial: 'text-amber-300 border-amber-400/50',
  Success: 'text-emerald-300 border-emerald-500/50',
  Outstanding: 'text-violet-300 border-violet-400/60',
}

interface BoardEntry {
  score: number
  rank: Rank
  seed: number
  date: string
  summary: string
}
const BOARD_KEY = 'ppgame.leaderboard.v1'

function loadBoard(): Record<string, BoardEntry[]> {
  try {
    return JSON.parse(localStorage.getItem(BOARD_KEY) ?? '{}') as Record<string, BoardEntry[]>
  } catch {
    return {}
  }
}

export function ResultsScreen() {
  const mission = useGame((s) => s.mission)!
  const backToDesign = useGame((s) => s.backToDesign)
  const flyAgain = useGame((s) => s.flyAgain)
  const mode = useGame((s) => s.mode)
  const collectReward = useGame((s) => s.collectReward)
  const [copied, setCopied] = useState(false)
  const t = useT()
  const msg = useMsg()
  const tx = useTx()
  const scenario = getScenario(mission.scenarioId)
  const score = useMemo(() => scoreMission(mission, scenario), [mission, scenario])
  const analysis = useMemo(() => analyseMission(mission, score, scenario), [mission, score, scenario])
  const [board, setBoard] = useState<BoardEntry[]>([])
  useMusic('results')
  const good = score.rank === 'Success' || score.rank === 'Outstanding'
  useEffect(() => {
    audio.play(good ? 'success' : 'failure')
  }, [good])

  useEffect(() => {
    const all = loadBoard()
    const summary = mission.design.instruments.map((i) => i.id).join('+') + ` · ${mission.design.orbitId} · ${mission.design.launcherId}`
    const entry: BoardEntry = { score: score.total, rank: score.rank, seed: mission.seed, date: new Date().toISOString().slice(0, 10), summary }
    const list = [...(all[scenario.id] ?? []).filter((e) => !(e.seed === entry.seed && e.summary === entry.summary && e.score === entry.score)), entry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
    all[scenario.id] = list
    try {
      localStorage.setItem(BOARD_KEY, JSON.stringify(all))
    } catch {
      /* storage unavailable: keep in memory only */
    }
    setBoard(list)
  }, [mission, score, scenario])

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">
          {t('results.title', { name: tx(`scenario.${scenario.id}.name`, scenario.name) })}
        </h1>
        <Pill tone="slate">{t('results.seed', { seed: mission.seed })}</Pill>
        <Pill tone={mission.endReason === 'completed' ? 'emerald' : 'rose'}>{END_REASON_LABEL[mission.endReason ?? 'completed']}</Pill>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className={`rounded-2xl border-2 bg-slate-900/70 p-6 text-center ${RANK_STYLE[score.rank]}`}>
          <div className="mx-auto mb-2 w-fit rounded-lg bg-slate-950/70 p-1">
            <SpacecraftSprite design={mission.design} size={84} />
          </div>
          <div className="font-display text-6xl font-black">{score.total}</div>
          <div className="text-sm text-slate-400">{t('results.ofPoints')}</div>
          <div className="mt-2 text-2xl font-bold">{t(`results.rank.${score.rank}` as StringKey)}</div>
          <ul className="mt-5 space-y-2 text-left text-xs">
            {score.lines.map((l) => (
              <li key={l.key}>
                <div className="flex justify-between">
                  <span className="text-slate-300">{msg(l.labelMsg)}</span>
                  <span className="font-mono text-slate-100">
                    {fmt(l.points)} / {fmt(l.max)}
                  </span>
                </div>
                <div className="mt-0.5 h-1.5 overflow-hidden rounded bg-slate-800">
                  <div className="h-full bg-sky-500" style={{ width: `${(l.points / l.max) * 100}%` }} />
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">{msg(l.detail)}</div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-slate-500">{t('results.soloHint')}</p>
        </section>

        <section className="min-w-0 space-y-5">
          <div>
            <h2 className="hud-label">{t('results.whyTitle')}</h2>
            <ol className="mt-2 space-y-2">
              {analysis.causes.map((c) => {
                const m = CAUSE_TEXT[c.code]?.(c.params) ?? { title: c.code, why: '' }
                return (
                  <li key={c.code} className={`rounded-lg border p-3 ${c.impact >= 0 ? 'border-emerald-500/40' : 'border-rose-500/40'}`}>
                    <div className="flex items-center gap-2">
                      <span className={c.impact >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{c.impact >= 0 ? '▲' : '▼'}</span>
                      <span className="font-medium">{m.title}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-300">{m.why}</p>
                    {m.change && <p className="mt-1 text-xs text-sky-300">{t('results.whatChange', { change: m.change })}</p>}
                  </li>
                )
              })}
            </ol>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="mb-1 text-xs text-slate-400">{t('results.chartLegend')}</div>
            <div className="h-48">
              <ResponsiveContainer>
                <LineChart data={mission.series.slice()} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
                  <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 12 }} labelFormatter={(w) => t('results.chartWeek', { week: String(w) })} />
                  <Line isAnimationActive={false} type="monotone" dataKey="science" stroke="#a78bfa" dot={false} strokeWidth={2} />
                  <Line isAnimationActive={false} type="monotone" dataKey="battery" stroke="#38bdf8" dot={false} />
                  <Line isAnimationActive={false} type="monotone" dataKey="backlogGb" stroke="#f472b6" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h2 className="hud-label">{t('results.requirements')}</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {score.requirements.map((q) => (
                <li key={q.id} className="flex gap-2">
                  <span className={q.met ? 'text-emerald-400' : q.optional ? 'text-slate-500' : 'text-rose-400'}>{q.met ? '✔' : q.optional ? '○' : '✘'}</span>
                  <span>
                    {q.optional && <Pill tone="violet">{t('mission.bonus')}</Pill>} {REQUIREMENT_LABEL[q.kind]}{' '}
                    {typeof q.target === 'number' ? fmt(q.target, 1) : localName(String(q.target))}
                    {typeof q.actual === 'number' && <span className="text-slate-500">{t('results.gotActual', { actual: fmt(q.actual, 1) })}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            {mode === 'campaign' && (
              <button type="button" onClick={collectReward} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500">
                {t('results.reportToInvestors')}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const url = shareUrl(mission.design, mission.seed)
                navigator.clipboard?.writeText(url).then(
                  () => setCopied(true),
                  () => window.prompt(t('results.copyPrompt'), url),
                )
              }}
              className="rounded-lg border border-slate-600 px-4 py-2 hover:border-slate-300"
            >
              🔗 {copied ? t('results.copied') : t('results.share')}
            </button>
            <button type="button" onClick={backToDesign} className="btn-primary px-4 py-2 ">
              {t('results.redesign')}
            </button>
            <button type="button" onClick={() => flyAgain(true)} className="rounded-lg border border-slate-600 px-4 py-2 hover:border-slate-300">
              {t('results.flyAgain')}
            </button>
            <button type="button" onClick={() => flyAgain(false)} className="rounded-lg border border-slate-600 px-4 py-2 hover:border-slate-300">
              {t('results.newSeed')}
            </button>
          </div>

          <div>
            <h2 className="hud-label">
              {t('results.bestMissions', { name: tx(`scenario.${scenario.id}.name`, scenario.name) })}
            </h2>
            <ol className="mt-2 space-y-1 text-xs">
              {board.map((e, i) => (
                <li key={`${e.seed}-${e.score}-${i}`} className="flex flex-wrap gap-x-3 text-slate-300">
                  <span className="font-mono text-slate-100">{e.score}</span>
                  <span>{t(`results.rank.${e.rank}` as StringKey)}</span>
                  <span className="text-slate-500">{t('results.seed', { seed: e.seed })}</span>
                  <span className="text-slate-500">{e.summary}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
      <div className="mt-8">
        <Disclaimer />
      </div>
    </main>
  )
}
