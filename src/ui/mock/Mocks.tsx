// The three art directions. Each has a main menu and a design screen built from the same real data.
import '@fontsource/caveat/500.css'
import '@fontsource/caveat/700.css'
import '@fontsource-variable/jetbrains-mono'
import type { CSSProperties, ReactNode } from 'react'
import { MenuBackdrop } from '../hub/HomeScreen'
import { SpacecraftSprite } from '../spacecraft/SpacecraftSprite'
import { mockData } from './data'
import type { MockId } from './MockScreen'

const D = mockData()
const pct = (b: (typeof D.budgets)[number]) => Math.min(1, b.value / b.max)
const MENU = ['Continue career', 'New career', 'Free mission', 'Learn', 'Extras', 'Settings', 'Quit']

export default function Mocks({ n, view }: { n: MockId; view: 'menu' | 'design' }) {
  if (n === 1) return view === 'menu' ? <NotebookMenu /> : <NotebookDesign />
  if (n === 2) return view === 'menu' ? <ConsoleMenu /> : <ConsoleDesign />
  return view === 'menu' ? <HudMenu /> : <HudDesign />
}

/* =====================================================================================================
 * 1 · Paulet's notebook — paper, blueprint ink, handwriting. (Launch and flight would switch to a console.)
 * ===================================================================================================== */
const INK = '#1e3a8a'
const RED = '#b42318'
const hand: CSSProperties = { fontFamily: '"Caveat", cursive' }
const paper: CSSProperties = {
  backgroundColor: '#f1e8d2',
  backgroundImage:
    'linear-gradient(rgba(30,58,138,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(30,58,138,0.10) 1px, transparent 1px), radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.5), transparent 60%), radial-gradient(ellipse at 80% 90%, rgba(120,90,40,0.18), transparent 55%)',
  backgroundSize: '24px 24px, 24px 24px, 100% 100%, 100% 100%',
}

function RoughFilter() {
  return (
    <svg width="0" height="0" className="absolute">
      <filter id="rough">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" />
        <feDisplacementMap in="SourceGraphic" scale="2.6" />
      </filter>
    </svg>
  )
}

function Tape({ style }: { style: CSSProperties }) {
  return <div className="absolute h-7 w-24 bg-amber-100/70 shadow-sm" style={{ ...style, mixBlendMode: 'multiply' }} />
}

function PauletSketch() {
  return (
    <svg viewBox="0 0 300 420" className="h-full w-full" style={{ filter: 'url(#rough)' }} fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round">
      {/* rocket outline */}
      <path d="M150 30 C170 60 176 100 176 140 L176 300 L124 300 L124 140 C124 100 130 60 150 30 Z" />
      <path d="M124 250 L96 320 L124 300 M176 250 L204 320 L176 300" />
      <path d="M134 300 L140 330 L160 330 L166 300" />
      <circle cx="150" cy="120" r="12" />
      <path d="M124 190 H176 M124 196 H176" strokeWidth="1" />
      {/* tanks (dashed) */}
      <rect x="132" y="150" width="36" height="34" rx="6" strokeDasharray="4 3" strokeWidth="1" />
      <rect x="132" y="204" width="36" height="40" rx="6" strokeDasharray="4 3" strokeWidth="1" />
      {/* exhaust hatching */}
      {Array.from({ length: 7 }, (_, i) => (
        <path key={i} d={`M${140 + i * 3.5} 334 L${136 + i * 4.5} ${370 + (i % 3) * 8}`} stroke={RED} strokeWidth="1.1" />
      ))}
      {/* dimension line */}
      <path d="M230 30 V300 M224 30 H236 M224 300 H236" strokeWidth="1" />
      <text x="240" y="170" fill={INK} stroke="none" style={{ ...hand, fontSize: 22 }} transform="rotate(90 240 170)">
        2.4 m
      </text>
      {/* annotations */}
      <path d="M168 168 C200 160 210 140 236 132" strokeWidth="1" />
      <path d="M168 224 C196 230 214 250 60 262" strokeWidth="1" opacity="0" />
      <text x="20" y="168" fill={INK} stroke="none" style={{ ...hand, fontSize: 21 }}>
        fuel
      </text>
      <path d="M50 162 C80 162 110 166 130 166" strokeWidth="1" />
      <text x="10" y="228" fill={INK} stroke="none" style={{ ...hand, fontSize: 21 }}>
        oxidiser
      </text>
      <path d="M72 222 C96 222 112 224 130 224" strokeWidth="1" />
      <text x="40" y="400" fill={RED} stroke="none" style={{ ...hand, fontSize: 22 }}>
        Paulet-1 · apogee 110 km?
      </text>
    </svg>
  )
}

function NotebookMenu() {
  return (
    <div className="relative h-full overflow-hidden" style={{ ...paper, color: INK }}>
      <RoughFilter />
      {/* red margin + spiral */}
      <div className="absolute inset-y-0 left-[92px] w-px bg-red-400/70" />
      <div className="absolute inset-y-0 left-6 flex flex-col justify-around">
        {Array.from({ length: 14 }, (_, i) => (
          <div key={i} className="h-5 w-5 rounded-full border-2 border-stone-500/60 bg-stone-800/20 shadow-inner" />
        ))}
      </div>
      <div className="absolute inset-y-0 left-1/2 w-px bg-stone-400/40 shadow-[0_0_24px_rgba(0,0,0,0.25)]" />

      <div className="absolute left-[130px] top-14 w-[520px]">
        <p style={{ ...hand, fontSize: 26 }} className="text-stone-600">
          Mission notebook — Dr. Pedro Goicochea
        </p>
        <h1 style={{ ...hand, fontSize: 120, lineHeight: 1 }} className="mt-1 font-bold">
          Paulet
        </h1>
        <svg viewBox="0 0 400 20" className="-mt-2 w-[380px]" style={{ filter: 'url(#rough)' }}>
          <path d="M5 12 C100 4 220 18 395 8" stroke={RED} strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
        <ol className="mt-8 space-y-1.5">
          {MENU.map((m, i) => (
            <li key={m} className="group flex cursor-pointer items-baseline gap-4" style={{ ...hand, fontSize: i === 0 ? 46 : 38 }}>
              <span className="w-8 text-right text-stone-500" style={{ fontSize: 28 }}>
                {i + 1}.
              </span>
              <span className={`relative ${i === 0 ? 'font-bold' : ''}`}>
                {m}
                {i === 0 && (
                  <svg viewBox="0 0 300 60" className="pointer-events-none absolute -inset-x-4 -inset-y-2 h-[calc(100%+16px)] w-[calc(100%+32px)]" style={{ filter: 'url(#rough)' }} preserveAspectRatio="none">
                    <ellipse cx="150" cy="30" rx="145" ry="26" stroke={RED} strokeWidth="2.5" fill="none" />
                  </svg>
                )}
              </span>
              {i === 0 && (
                <span className="text-stone-500" style={{ fontSize: 24 }}>
                  — $48 M · ★ 410
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* right page: blueprint sketch + taped photo */}
      <div className="absolute right-[80px] top-12 h-[440px] w-[300px]">
        <PauletSketch />
      </div>
      <div className="absolute bottom-16 right-[380px] h-[200px] w-[300px] rotate-[-4deg] bg-white p-2.5 pb-8 shadow-xl">
        <div className="relative h-full w-full overflow-hidden" style={{ filter: 'sepia(0.55) contrast(1.05) saturate(0.8)' }}>
          <MenuBackdrop />
        </div>
        <p className="absolute bottom-1 left-3 text-stone-600" style={{ ...hand, fontSize: 20 }}>
          Launch site, dawn — the Misti behind
        </p>
        <Tape style={{ top: -12, left: 110, transform: 'rotate(3deg)' }} />
      </div>
      <p className="absolute bottom-6 right-16 w-[280px] text-right text-stone-500" style={{ ...hand, fontSize: 20 }}>
        After Paulet's own descriptions (claimed, not proven). Launch &amp; flight screens switch to a mission-control console.
      </p>
    </div>
  )
}

function HandBar({ b }: { b: (typeof D.budgets)[number] }) {
  const p = pct(b)
  const over = !b.higherIsBetter && b.value > b.max
  return (
    <div className="flex items-center gap-3">
      <span className="w-24" style={{ ...hand, fontSize: 28 }}>
        {b.label}
      </span>
      <svg viewBox="0 0 300 30" className="h-8 w-[230px]" preserveAspectRatio="none" style={{ filter: 'url(#rough)' }}>
        <defs>
          <pattern id={`hatch-${b.id}`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="7" stroke={over ? RED : INK} strokeWidth="2.4" />
          </pattern>
        </defs>
        <rect x="3" y="5" width={294 * p} height="20" fill={`url(#hatch-${b.id})`} />
        <rect x="3" y="5" width="294" height="20" fill="none" stroke={INK} strokeWidth="1.8" />
      </svg>
      <span style={{ ...hand, fontSize: 26 }} className={over ? 'text-red-700' : ''}>
        {b.fmt(b.value)} / {b.fmt(b.max)} {b.unit}
      </span>
    </div>
  )
}

function NotebookDesign() {
  const colors = ['#fca5a5', '#fcd34d', '#86efac', '#93c5fd', '#c4b5fd', '#fdba74']
  return (
    <div className="relative h-full overflow-hidden" style={{ ...paper, color: INK }}>
      <RoughFilter />
      {/* index tabs */}
      <div className="absolute left-16 top-0 flex gap-1">
        {D.tabs.map((t, i) => (
          <div key={t} className={`rounded-b-lg px-4 pb-1 pt-3 shadow ${i === 2 ? 'pt-5' : ''}`} style={{ background: colors[i], ...hand, fontSize: 24, color: '#1f2937' }}>
            {t}
          </div>
        ))}
      </div>
      <div className="absolute left-16 top-20">
        <h1 style={{ ...hand, fontSize: 64, lineHeight: 1 }} className="font-bold">
          {D.scenario.name}
        </h1>
        <p style={{ ...hand, fontSize: 26 }} className="text-stone-600">
          {D.scenario.tagline}
        </p>
      </div>

      {/* blueprint card with the real spacecraft */}
      <div className="absolute left-16 top-[200px] h-[420px] w-[520px] rotate-[-1.2deg] p-4 shadow-xl" style={{ background: '#1e3a8a', backgroundImage: 'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        <div className="grid h-full place-items-center">
          <SpacecraftSprite design={D.design} size={330} />
        </div>
        <p className="absolute bottom-2 left-4 text-white/80" style={{ ...hand, fontSize: 22 }}>
          Dry mass {D.report.mass.dryKg.toFixed(0)} kg · Δv {D.report.mass.totalDv.toFixed(0)} m/s
        </p>
        <Tape style={{ top: -12, left: 40, transform: 'rotate(-6deg)' }} />
        <Tape style={{ top: -10, right: 30, transform: 'rotate(5deg)' }} />
      </div>

      {/* budgets */}
      <div className="absolute left-[640px] top-[200px] space-y-2">
        <p style={{ ...hand, fontSize: 30 }} className="font-bold text-stone-700 underline decoration-red-600 decoration-2 underline-offset-4">
          Budgets
        </p>
        {D.budgets.map((b) => (
          <HandBar key={b.id} b={b} />
        ))}
        <p style={{ ...hand, fontSize: 30 }} className="pt-4 font-bold text-stone-700 underline decoration-red-600 decoration-2 underline-offset-4">
          Payload
        </p>
        {D.instruments.map((i) => (
          <p key={i.id} style={{ ...hand, fontSize: 28 }}>
            ☑ {i.name} <span className="text-stone-500">— {i.massKg} kg, {i.powerW} W</span>
          </p>
        ))}
      </div>

      {/* sticky note: advisor */}
      <div className="absolute right-10 top-[505px] w-[270px] rotate-[2.5deg] bg-yellow-200 p-4 shadow-lg" style={{ ...hand, fontSize: 24, color: '#3f3f46' }}>
        <p className="font-bold">{D.advisor.role}:</p>
        <p className="leading-tight">{D.advisor.text}</p>
      </div>

      {/* stamp */}
      <div className="absolute bottom-24 left-[640px] rotate-[-6deg] rounded-md border-4 px-5 py-2 text-center" style={{ borderColor: RED, color: RED, filter: 'url(#rough)' }}>
        <div className="font-mono text-xs tracking-[0.3em]">REVIEWED</div>
        <div style={{ ...hand, fontSize: 40, lineHeight: 1 }} className="font-bold">
          To the launch pad →
        </div>
      </div>
    </div>
  )
}

/* =====================================================================================================
 * 2 · Retro-futurist console — CRT phosphor, hardware keys, LED bar graphs.
 * ===================================================================================================== */
const AMBER = '#ffb347'
const GREEN = '#5dff8a'
const mono: CSSProperties = { fontFamily: '"JetBrains Mono Variable", ui-monospace, monospace' }
const glow = (c: string): CSSProperties => ({ color: c, textShadow: `0 0 6px ${c}aa, 0 0 18px ${c}55` })

function Scanlines() {
  return <div className="pointer-events-none absolute inset-0 z-30" style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0 1px, transparent 1px 3px)', mixBlendMode: 'multiply' }} />
}

function Panel({ title, children, className = '', style }: { title: string; children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`rounded-md border-2 border-[#2b302b] bg-[#0d110d] p-3 shadow-[inset_0_0_30px_rgba(0,0,0,0.9),0_2px_0_#3a403a] ${className}`} style={style}>
      <div className="absolute -top-2.5 left-3 bg-[#161a16] px-2 text-[10px] tracking-[0.25em]" style={{ ...mono, color: '#9ca39c' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Lamps({ n, on }: { n: number; on: number[] }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="h-3 w-3 rounded-full border border-black" style={{ background: on.includes(i) ? (i % 3 === 0 ? '#ff4d4d' : GREEN) : '#1f241f', boxShadow: on.includes(i) ? `0 0 8px ${i % 3 === 0 ? '#ff4d4d' : GREEN}` : undefined }} />
      ))}
    </div>
  )
}

function ConsoleFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-full overflow-hidden" style={{ ...mono, background: 'radial-gradient(ellipse at 50% 40%, #1c211c, #070907 75%)' }}>
      {children}
      <Scanlines />
      <div className="pointer-events-none absolute inset-0 z-40 shadow-[inset_0_0_160px_rgba(0,0,0,0.85)]" />
    </div>
  )
}

function ConsoleMenu() {
  return (
    <ConsoleFrame>
      <div className="absolute inset-x-10 top-10 flex items-center justify-between text-xs" style={glow(GREEN)}>
        <span>PP-MCC TERMINAL 7 · AREQUIPA</span>
        <span>LINK: OFFLINE OK · UTC 14:22:07</span>
      </div>
      <Panel title="MAIN DISPLAY" className="absolute left-10 top-20 h-[600px] w-[620px]">
        <div className="mt-2 space-y-1 text-sm" style={glow(GREEN)}>
          <p>&gt; BOOT SEQUENCE ............ OK</p>
          <p>&gt; ORBITAL MECHANICS LIB .... OK</p>
          <p>&gt; THREE-BODY SOLVER (RK4) .. OK</p>
          <p>&gt; INVESTOR RELATIONS ....... NERVOUS</p>
        </div>
        <h1 className="mt-8 text-[88px] font-extrabold leading-none tracking-tight" style={glow(AMBER)}>
          PP.GAME
        </h1>
        <p className="text-sm tracking-[0.3em]" style={glow(AMBER)}>
          SPACE MISSION DESIGN
        </p>
        <div className="mt-8 space-y-1">
          {MENU.map((m, i) => (
            <div key={m} className={`flex items-center gap-3 px-2 py-1 text-xl uppercase ${i === 0 ? 'bg-[#ffb347] text-black' : ''}`} style={i === 0 ? { boxShadow: `0 0 16px ${AMBER}` } : glow(AMBER)}>
              <span className="w-6">{i === 0 ? '▶' : ''}</span>
              <span>{m}</span>
              <span className="ml-auto text-xs opacity-70">[F{i + 1}]</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm" style={glow(AMBER)}>
          SELECT_<span className="animate-pulse">█</span>
        </p>
      </Panel>

      {/* monitor with the launch site */}
      <Panel title="PAD CAMERA 2" className="absolute right-10 top-20 h-[330px] w-[680px]">
        <div className="relative h-full overflow-hidden rounded-[18px] border-4 border-black" style={{ filter: 'saturate(0.7) contrast(1.15) brightness(0.9)' }}>
          <MenuBackdrop />
          <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0 2px, transparent 2px 4px)' }} />
          <div className="absolute left-3 top-2 text-xs" style={glow(GREEN)}>
            ● REC · PAULET-1 ON PAD
          </div>
        </div>
      </Panel>
      <Panel title="STATUS" className="absolute bottom-10 right-10 h-[230px] w-[330px]">
        <div className="mt-2 space-y-2 text-sm" style={glow(GREEN)}>
          <p>FUNDS ........ $48 M</p>
          <p>PRESTIGE ..... 410</p>
          <p>NEXT WINDOW .. T−3 D</p>
          <p>PERSONNEL .... DR. GOICOCHEA</p>
        </div>
        <div className="mt-4">
          <Lamps n={10} on={[1, 2, 4, 5, 7, 9]} />
        </div>
      </Panel>
      <Panel title="RADAR" className="absolute bottom-10 right-[360px] h-[230px] w-[340px]">
        <svg viewBox="0 0 200 120" className="h-full w-full">
          {[20, 40, 56].map((r) => (
            <circle key={r} cx="100" cy="62" r={r} fill="none" stroke={GREEN} strokeOpacity="0.35" />
          ))}
          <path d="M100 62 L156 40 A56 56 0 0 0 100 6 Z" fill={GREEN} opacity="0.18" />
          <line x1="100" y1="62" x2="156" y2="40" stroke={GREEN} />
          <circle cx="128" cy="34" r="2.5" fill={GREEN} />
          <circle cx="70" cy="80" r="2" fill={AMBER} />
        </svg>
      </Panel>
    </ConsoleFrame>
  )
}

function LedBar({ b }: { b: (typeof D.budgets)[number] }) {
  const lit = Math.round(pct(b) * 24)
  return (
    <div>
      <div className="flex justify-between text-xs" style={glow(AMBER)}>
        <span>{b.label.toUpperCase()}</span>
        <span>
          {b.fmt(b.value)}/{b.fmt(b.max)} {b.unit.toUpperCase()}
        </span>
      </div>
      <div className="mt-1 flex gap-[3px]">
        {Array.from({ length: 24 }, (_, i) => {
          const on = i < lit
          const c = i >= 21 ? '#ff4d4d' : i >= 17 ? AMBER : GREEN
          return <div key={i} className="h-4 flex-1 rounded-[1px]" style={{ background: on ? c : '#1a1f1a', boxShadow: on ? `0 0 6px ${c}` : undefined }} />
        })}
      </div>
    </div>
  )
}

function ConsoleDesign() {
  return (
    <ConsoleFrame>
      <div className="absolute inset-x-10 top-8 flex items-end justify-between">
        <div>
          <p className="text-xs tracking-[0.3em]" style={glow(GREEN)}>
            CONTRACT · {D.scenario.name.toUpperCase()}
          </p>
          <p className="text-sm" style={glow(AMBER)}>
            {D.scenario.tagline.toUpperCase()}
          </p>
        </div>
        <div className="flex gap-2">
          {D.tabs.map((t, i) => (
            <div key={t} className={`rounded border-b-4 px-3 py-2 text-xs uppercase ${i === 2 ? 'border-[#b37a2a] bg-[#ffb347] text-black' : 'border-black bg-[#2a2f2a] text-[#c9cfc9]'}`}>
              {t}
            </div>
          ))}
        </div>
      </div>
      <Panel title="SPACECRAFT · CAMERA 1" className="absolute left-10 top-28 h-[440px] w-[560px]">
        <div className="relative grid h-full place-items-center rounded-[16px] border-4 border-black bg-[#050805]">
          <SpacecraftSprite design={D.design} size={320} />
          <div className="absolute left-3 top-2 text-xs" style={glow(GREEN)}>
            DRY {D.report.mass.dryKg.toFixed(0)} KG · ΔV {D.report.mass.totalDv.toFixed(0)} M/S
          </div>
          <div className="absolute inset-0 rounded-[12px]" style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0 2px, transparent 2px 4px)' }} />
        </div>
      </Panel>
      <Panel title="BUDGETS" className="absolute right-10 top-28 h-[440px] w-[700px]">
        <div className="mt-3 space-y-5">
          {D.budgets.map((b) => (
            <LedBar key={b.id} b={b} />
          ))}
        </div>
      </Panel>
      <Panel title="TELETYPE · ADVISOR" className="absolute bottom-10 left-10 h-[180px] w-[860px]">
        <p className="mt-2 text-sm leading-relaxed" style={glow(GREEN)}>
          &gt; {D.advisor.role.toUpperCase()}: {D.advisor.text.toUpperCase()}
        </p>
        <p className="mt-2 text-sm" style={glow(GREEN)}>
          &gt; PAYLOAD: {D.instruments.map((i) => i.name.toUpperCase()).join(' + ')}
        </p>
      </Panel>
      <Panel title="LAUNCH PAD" className="absolute bottom-10 right-10 h-[180px] w-[400px]">
        <div className="flex h-full items-center justify-center gap-6">
          <div className="relative h-24 w-24 rounded-md border-4 border-[#3a0d0d] bg-[#8a1010] shadow-[0_0_24px_#ff4d4d88]">
            <div className="absolute -top-3 left-1/2 h-24 w-28 -translate-x-1/2 -rotate-12 rounded-md border-2 border-yellow-300/60 bg-yellow-300/10" />
          </div>
          <div className="text-sm" style={glow(AMBER)}>
            <p>LIFT GUARD</p>
            <p>PRESS TO ROLL OUT</p>
            <Lamps n={4} on={[1, 2, 3]} />
          </div>
        </div>
      </Panel>
    </ConsoleFrame>
  )
}

/* =====================================================================================================
 * 3 · Modern space-agency HUD — full-bleed scenery, glass panels, thin lines, corner brackets.
 * ===================================================================================================== */
function Brackets({ className = '' }: { className?: string }) {
  const c = 'absolute h-3 w-3 border-sky-300/80'
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`}>
      <div className={`${c} left-0 top-0 border-l border-t`} />
      <div className={`${c} right-0 top-0 border-r border-t`} />
      <div className={`${c} bottom-0 left-0 border-b border-l`} />
      <div className={`${c} bottom-0 right-0 border-b border-r`} />
    </div>
  )
}

function Glass({ children, className = '', title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <div className={`border border-white/10 bg-slate-950/45 p-5 backdrop-blur-md ${className}`}>
      <Brackets />
      {title && <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-sky-300">{title}</p>}
      {children}
    </div>
  )
}

function HudMenu() {
  return (
    <div className="relative h-full overflow-hidden text-white">
      <MenuBackdrop />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />
      <div className="absolute inset-x-12 top-8 flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-white/60">
        <span>Paulet · Mission Directorate</span>
        <span>Arequipa launch site · 16.4° S · dawn</span>
      </div>
      <div className="absolute left-16 top-[150px] w-[520px]">
        <p className="text-sm uppercase tracking-[0.4em] text-sky-300">Space mission design</p>
        <h1 className="mt-2 text-[104px] font-light leading-none tracking-tight">
          Paulet
        </h1>
        <div className="mt-10 border-t border-white/15">
          {MENU.map((m, i) => (
            <div key={m} className={`flex items-center gap-6 border-b border-white/15 py-3 ${i === 0 ? 'text-white' : 'text-white/75'}`}>
              <span className="font-mono text-xs text-sky-300/80">{String(i + 1).padStart(2, '0')}</span>
              <span className={`font-display text-2xl ${i === 0 ? 'font-semibold' : 'font-light'}`}>{m}</span>
              {i === 0 && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-orange-400 shadow-[0_0_10px_#fb923c]" />}
            </div>
          ))}
        </div>
      </div>
      <Glass className="absolute bottom-12 right-12 w-[420px]" title="Program status">
        <div className="grid grid-cols-3 gap-4">
          {[
            ['Funds', '$48 M'],
            ['Prestige', '410'],
            ['Next window', 'T−3 d'],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-[11px] uppercase tracking-widest text-white/50">{k}</p>
              <p className="font-display text-2xl tabular-nums">{v}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-white/60">Dr. Pedro Goicochea · Mission Director</p>
      </Glass>
    </div>
  )
}

function Ring({ b }: { b: (typeof D.budgets)[number] }) {
  const p = pct(b)
  const C = 2 * Math.PI * 34
  const color = !b.higherIsBetter && p > 0.95 ? '#fb923c' : '#38bdf8'
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
        <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
        <circle cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${C * p} ${C}`} strokeLinecap="round" />
      </svg>
      <p className="-mt-[62px] font-display text-lg tabular-nums">{Math.round(p * 100)}%</p>
      <p className="mt-7 text-[11px] uppercase tracking-widest text-white/60">{b.label}</p>
      <p className="text-xs tabular-nums text-white/80">
        {b.fmt(b.value)} / {b.fmt(b.max)} {b.unit}
      </p>
    </div>
  )
}

function HudDesign() {
  return (
    <div className="relative h-full overflow-hidden text-white">
      <div className="absolute inset-0 scale-110 blur-md">
        <MenuBackdrop />
      </div>
      <div className="absolute inset-0 bg-slate-950/75" />
      <div className="absolute inset-x-10 top-6 flex items-end justify-between border-b border-white/15 pb-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-sky-300">Contract · Act 2</p>
          <h1 className="font-display text-3xl font-light">{D.scenario.name}</h1>
        </div>
        <div className="flex gap-6 text-sm">
          {D.tabs.map((t, i) => (
            <span key={t} className={`pb-1 ${i === 2 ? 'border-b-2 border-orange-400 text-white' : 'text-white/55'}`}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* spacecraft with callouts */}
      <div className="absolute left-10 top-[110px] h-[520px] w-[760px]">
        <div className="absolute inset-0 grid place-items-center">
          <SpacecraftSprite design={D.design} size={420} />
        </div>
        {[
          ['Infrared telescope', '150 kg · 120 W', 'left-[40px] top-[60px]'],
          ['Hydrazine thrusters', 'corrections & station-keeping', 'right-[30px] top-[90px]'],
          ['Deployable arrays', `${D.design.arrayAreaM2} m²`, 'left-[20px] bottom-[120px]'],
          ['X-band dish', 'deep-space link', 'right-[40px] bottom-[90px]'],
        ].map(([t, s, pos]) => (
          <div key={t} className={`absolute ${pos} border-l border-sky-300/70 pl-3`}>
            <p className="text-sm">{t}</p>
            <p className="text-xs text-white/55">{s}</p>
          </div>
        ))}
      </div>

      <Glass className="absolute right-10 top-[110px] w-[560px]" title="Budgets">
        <div className="grid grid-cols-5 gap-2">
          {D.budgets.map((b) => (
            <Ring key={b.id} b={b} />
          ))}
        </div>
      </Glass>
      <Glass className="absolute right-10 top-[380px] w-[560px]" title="Advisor">
        <div className="flex gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-violet-500/30 font-display text-sm ring-1 ring-violet-300/60">AP</div>
          <div>
            <p className="text-sm text-violet-200">{D.advisor.role}</p>
            <p className="mt-1 text-sm leading-relaxed text-white/85">{D.advisor.text}</p>
          </div>
        </div>
      </Glass>
      <div className="absolute inset-x-10 bottom-8 flex items-center justify-between border-t border-white/15 pt-4">
        <p className="text-sm text-white/60">
          Dry {D.report.mass.dryKg.toFixed(0)} kg · Δv {D.report.mass.totalDv.toFixed(0)} m/s · Success {Math.round(D.report.risk.successProbability * 100)}%
        </p>
        <div className="flex items-center gap-3 bg-orange-500 px-6 py-3 font-display font-semibold tracking-wide text-white shadow-[0_0_30px_rgba(249,115,22,0.45)]">
          Review → Launch pad
        </div>
      </div>
    </div>
  )
}
