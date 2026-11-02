# Game model (Phase 1 — design evaluation)

> **Simplified educational model. Game values, not real engineering data.** Numbers are chosen to be coherent and to create
> trade-offs, not to match any real spacecraft. Code: `src/engine/` (pure TypeScript, no UI). Every constant below lives in
> `src/engine/budget.ts`, `orbit.ts`, `launch.ts`, `evaluate.ts` or `catalog/`.

`evaluateDesign(design, scenario) → DesignReport` is instant and deterministic (no randomness). The random mission
simulation (`simulateMission`, seeded) arrives in Phase 2.

## 1. Orbit

| Quantity | Formula | Notes |
|---|---|---|
| Period | `T = 2π·√(a³/μ)`, `a = R + h` | μ_Earth = 398 600.4 km³/s², R_Earth = 6 371 km; μ_Moon = 4 902.8, R_Moon = 1 737.4 |
| Eclipse fraction (worst case, β = 0) | `e = asin(R/(R+h)) / π` | LEO 500 km ≈ 38 %, GEO ≈ 4.8 % (≈ 1 % yearly average), dawn-dusk SSO = 0, heliocentric = 0 |
| Drag station-keeping | `Δv/yr = 25 · exp(−(h−400)/60)` m/s | 400 km ≈ 25 m/s/yr, 700 km ≈ 0.2 |
| Drag lifetime without thrusters | `exp((h−400)/60)` years | 400 km ≈ 1 yr, 500 km ≈ 5 yr |
| Other station-keeping | MEO 5, GEO 50, lunar 150, heliocentric 10 m/s/yr | lunar: lumpy gravity (mascons) |
| No-propulsion orbit life | lunar 0.3 yr (crashes), GEO 0.5 yr (leaves its slot) | |

Catalog orbits (`catalog/components.ts`): insertion Δv the spacecraft must add after separation (LEO/SSO 0,
MEO 1 200 m/s, GEO 1 500 m/s from GTO, lunar 850 m/s from TLI, heliocentric 300 m/s), disposal Δv (LEO 30, SSO 120,
MEO 50, GEO 11), radiation dose (LEO 1, SSO 1.5, MEO 30, GEO 5, lunar 10, deep space 8 krad/yr) and panel degradation
(2 %/yr LEO/SSO, 2.5 % GEO, 3 % lunar/deep, 3.5 % MEO).

## 2. Launch

- Capacity = launcher capacity to the orbit's launch target (LEO / SSO / GTO / TLI) × capacity factor (1, or 0.6 for
  heliocentric escape). Launchers: Light 300/200/–/– kg, $7 M, 90 %; Medium 3 000/2 000/1 000/400 kg, $45 M, 94 %;
  Heavy 15 000/10 000/6 000/3 500 kg, $130 M, 96 %.
- Blocking: `wet mass > capacity`, or capacity = 0 for that target.
- Warning when another launcher is cheaper and would still have ≥ 10 % spare capacity.

## 3. Mass

```
components = Σ instruments + Σ subsystems (array area·kg/m² + fixed, battery, radio, antenna, OBC, ADCS, propulsion, thermal, compression)
structure  = 22 % · components
margin     = 20 % · (components + structure)          ← mandatory design margin, shown explicitly
dry        = components + structure + margin
Δv_total   = insertion·k + station-keeping/yr · design life + disposal      (k = 1.3 for electric, low-thrust spiral)
R          = exp(Δv / (Isp · g0)),  g0 = 9.80665 m/s²
propellant = dry · (R − 1) / (1 − 0.1·(R − 1))        ← tanks weigh 10 % of the propellant they hold
wet        = dry + tanks + propellant
```

This satisfies the rocket equation exactly: `Δv = Isp·g0·ln(wet / (dry + tanks))` (tested). If the denominator is ≤ 0
the Δv is impossible with that engine (blocking). Isp: cold gas 65 s, hydrazine 220 s, electric 1 500 s.

## 4. Power

```
P_sunlit   = A · η · (1361 W/m² / d²) · cosθ           d = distance to Sun in AU (1, or 1.5 for the Mars flyby)
P_avg,BOL  = P_sunlit · (1 − e)
P_avg,EOL  = P_avg,BOL · (1 − deg)^(design life + transfer)
need       = L_avg · ((1 − e) + e / 0.9)               battery round-trip efficiency 90 %
margin_EOL = P_avg,EOL / need − 1
```

Arrays (effective η / cosθ / kg per m² / $M per m² / max m²): body-mounted 0.20 / 0.45 / 3 / 0.25 / 2; deployable
0.22 / 0.70 / 4 (+2 kg) / 0.40 / 12; Sun-tracking 0.24 / 0.97 / 5 (+8 kg) / 0.60 / 40.

Loads: bus base 10 W + OBC + ADCS + antenna + thermal + propulsion heaters + compression, + instruments × duty cycle,
+ transmitter × (contact minutes / 1 440). Peak = bus + all instruments + transmitter. Safe mode = 10 W + OBC + 40 % ADCS +
thermal + propulsion heaters. Electric thrusting needs safe load + 600 W of sunlit power (blocking otherwise).

Battery: depth of discharge per eclipse `DoD = L_avg · t_eclipse / capacity`. Limit 30 % when there are > 1 000
eclipses per year (LEO, SSO, low lunar orbit), 60 % otherwise (GEO, MEO). Cycle life `20 000 · (0.3 / DoD)²`, calendar
cap 15 years. Worst case (all instruments + radio through a full eclipse) > 100 % → warning (operations must schedule
instruments). Lunar orbits must also ride out a 2.5 h Earth-shadow eclipse in safe mode with ≤ 80 % DoD.

Checks: BOL generation < need → blocking; EOL < need → warning; EOL margin < 10 % → warning; > 100 % → warning (oversized,
except with electric propulsion, which uses the spare power). Nominal DoD > 100 % → blocking.

## 5. Data and communications

```
generated/day (GB) = Σ rate(Mbit/s) · duty · 86 400 / 8 / 1 000 / compression ratio
link rate          = band rate · antenna gain · distance factor  (× 0.3 if a dish lacks pointing)
downlink/day (GB)  = contact minutes · 60 · link rate · 0.7 / 8 / 1 000
delivered          = min(generated, downlink);  storage fills in storage / (generated − downlink) days
```

- Bands (near-Earth rate): UHF 0.05, S 2, X 100, Ka 500 Mbit/s. Antenna gain: omni/patch ×1, helical ×1.6, steerable dish ×4.
- Distance factor: LEO/SSO 1, MEO 0.3, GEO 0.2, lunar 0.01, heliocentric 0.0005.
- Contact per station per day: LEO 5 passes × 8 min (×0.2 if |lat| > 60°); SSO 5 × 10 min × (1 + 1.6·(|lat|/90)²)
  (high-latitude stations see polar orbits on almost every orbit); pass length × √(h / reference altitude); MEO 2 × 240 min;
  GEO continuous; lunar 290 min and heliocentric 480 min per **deep-space** antenna only. Total capped at 1 440 min.
- Compression: lossless 1.5× (+8 W), lossy 3× (+15 W, science × 0.85).

## 6. Cost (M$)

```
instruments = Σ cost · TRL factor   (TRL 9: 1.0, 8: 1.1, 7: 1.25, 6: 1.5)
bus         = Σ subsystem costs (+ array area · $/m²)
integration = 6 + 0.06 · (dry + tanks)
launch      = launcher price
operations  = design life · 12 · (team + Σ stations)  + transfer months · team
              team: Earth 0.25, Moon 0.40, deep space 0.50 M$/month; stations 0.07–0.12, deep-space 0.30 M$/month
contingency = 15 % of all of the above   (mandatory)
```
Over budget → blocking; > 95 % of budget → warning.

## 7. Schedule

`dev months = 18 + max(TRL months over instruments and OBC) + 1.5 · (instruments − 1) + dry/100 + 2 (electric)`, with
TRL months 9: 0, 8: 2, 7: 5, 6: 9. Later than the scenario deadline → warning (and the bonus objective is lost).
Transfer time: chemical lunar 0.2, GEO 0.3, MEO 0.2, heliocentric 8 months; electric = insertion Δv · 1.3 / 150 m/s per month.

## 8. Lifetime

`life = min(battery, panels, propellant/plan, radiation, orbit)`, physical limits reduced by the transfer time.
- battery: cycle life / eclipses per year (≤ 15 yr); panels: years until `P_avg,EOL < need`:
  `ln(need / P_avg,BOL) / ln(1 − deg)`; propellant/plan: the design life (propellant and operations are sized for it);
  radiation: OBC tolerance (basic 10, high-performance 15, rad-hard 100 krad) / annual dose; orbit: see §1.

## 9. Pointing, environment and risk

- ADCS: magnetorquers = coarse (and useless away from Earth: blocking), reaction wheels = fine, star tracker = precise.
  Instrument needs precise but has less → blocking; needs fine but has coarse → science × 0.5.
- Dawn-dusk SSO: optical instruments (panchromatic, multispectral, hi-res, hyperspectral) science × 0.5.
- Away from Earth without active thermal control → warning, risk × 0.95.
- Success probability = launcher reliability × bus 0.98 × Π TRL reliability (9: 0.995, 8: 0.985, 7: 0.965, 6: 0.94)
  × environmental risk factors (cold 0.95, radiation life short 0.9, long-eclipse 0.85).

## 10. Science (design estimate)

Per instrument: `science value × scenario relevance × min(2, √(duty / default duty)) × pointing × lighting × compression`,
then × the delivered/generated data fraction. Science/yr is a design estimate; Phase 2 turns it into the 0–1 000 score.

---

# Phase 2 — launch, mission simulation and score

`createMission(design, scenario, seed)` → `advanceWeek(state)` / `decide(state, option)` → `scoreMission` → `analyseMission`.
`simulateMission(design, scenario, seed, personality)` runs it all with a bot answering every decision.
**Determinism:** all randomness comes from `mulberry32` with an explicit state (`rngNext`), seeded with `mixSeed(seed)`
(murmur3 finaliser). Same design + same seed + same decisions ⇒ identical log, series and score (tested).

## 11. Launch
- Pre-launch: 25 % chance of a 1–3 month delay (counts against the schedule).
- Failure probability = (1 − launcher reliability) × difficulty factor (beginner 0.5, engineer 1.0, expert 1.2).

## 12. Weekly simulation
| Quantity | Rule |
|---|---|
| Transfer | chemical/electric transfer months from §7; no science, radiation still accumulates |
| Radiation | dose += orbit dose / 52 per week (+ flares). Dose ≥ OBC tolerance → computer fails, mission ends |
| Power | P(t) = P_avg,BOL · panel damage · (1 − deg)^t. P/need < 0.6 → mission ends |
| Battery | wear += eclipses per week / cycle life(DoD·anomaly factor) + calendar 1/(15·52). Wear ≥ 1 → mission ends |
| Orbit keeping | Δv budget = station-keeping/yr × design life (+ 5 m/s debris-avoidance reserve in drag orbits). Exhausted → orbit lost. No propulsion → orbit life from §1 |
| Data | generated/week = GB/day·7·duty factor (0 in safe mode); downlink/week = GB/day·7·(available stations' contact share); backlog beyond storage is lost |
| Science | (science/yr ÷ design delivered fraction) / 52 × delivered fraction this week × √duty factor × min(1, power ratio) |
| Money | reserve = contingency + unspent budget. Cuts and rentals come out of it; below 0 → investors stop operations |

## 13. Events (per year, × difficulty factor for negative ones)
| Event | Rate | Role | Choice |
|---|---|---|---|
| Solar flare | 1.0 (×1.5 if dose ≥ 5 krad/yr) | Astrophysicist | safe mode 2 wk (+0.5 krad) vs keep observing (+1/+3 krad; non-hardened OBC: 30 % reboot, 3 wk lost, backlog lost) |
| Battery cell failure | 0.15 | Engineer | duty −20 % vs accept 25 % faster wear |
| Ground station outage (2–6 wk) | 0.5 | Director | rent backup ($0.15 M/wk) vs wait |
| Micrometeoroid | 0.12 | Engineer | none: −8 % array power |
| Debris conjunction (LEO/SSO) | 1.0 | Astrophysicist | 0.5 m/s burn vs 2 % loss risk |
| Budget cut (−10 % of ops + reserve) | 0.2 | Director | absorb from reserve vs cancel the most expensive station |
| Science opportunity (scenario-specific) | 0.8 | owner of a matching instrument | retarget (+15 science, a week of extra data) vs ignore; missed if no matching instrument |
| Lunar eclipse (lunar orbits) | 2.0 | Engineer | only if safe-mode DoD > 80 %: power down 1 wk vs ride it out (DoD > 100 % ⇒ lost) |

Each option carries a quality (good / ok / poor) that depends on the situation (e.g. safe mode is "good" with an ordinary
computer and only "ok" with a hardened one). Bots: *prudent* picks the safest option, *balanced* the best-quality one,
*bold* the high-science/high-risk one.

## 14. Score (0–1 000)
| Component | Max | Rule |
|---|---|---|
| Mission success | 300 | share of mandatory requirements met, using **actual** life, delivered GB/day, cost and schedule |
| Science | 250 | min(1, science / scenario target) — Earth Watch 160, Lunar Pathfinder 150 |
| Resource efficiency | 150 | 50 each: launcher margin (ideal 15–35 %), EOL power margin (ideal 15–50 %), budget used (≤ 90 % full marks, 0 if over) |
| Engineering decisions | 100 | 50 − 10 per design warning at launch, + 50 × average quality of flight decisions (good 1, ok 0.6, poor 0.2) |
| Schedule | 50 | −10 per month late (development + launch delay) |
| Collaboration | 100 | team play only (Phase 3). **Solo:** the 850 base points are rescaled to 950 |
| Bonus objectives | +50 | scenario optional requirements |

Rank: launch failure or < 50 % of requirements → **Fail**; some requirement missed → **Partial**; all met → **Success**;
all met and ≥ 800 → **Outstanding**. Post-mission analysis ranks the causes by approximate point impact and shows the top 3.

---

# Phase 3 — launchers, First Light and the campaign

## 15. Launchers (game values)
| Launcher | Capacity LEO / SSO / GTO / TLI (kg) | Price | Reliability | Notes |
|---|---|---|---|---|
| Paulet-1 (sounding) | suborbital only: ~110 km, 8 kg | $1.5 M | 80 % | cannot reach orbit (blocking error `LAUNCHER_SUBORBITAL`) |
| L-1 Light | 300 / 200 / – / – | $7 M | 90 % | |
| Rideshare | – / 150 / – / – | $0.5 M + $0.015 M per kg | 95 % | SSO ≤ 620 km only; flies every 6 months → dev time rounded up to the next slot |
| M-2 Medium | 3 000 / 2 000 / 1 000 / 400 | $45 M | 94 % | |
| R-2 Reusable Medium | 2 100 / 1 400 / 700 / 280 (−30 %) | $27 M (−40 %) | 95 % | booster landing roll 90 %; lost booster = −$8 M in the campaign |
| H-3 Heavy | 15 000 / 10 000 / 6 000 / 3 500 | $130 M | 96 % | |

## 16. First Light (sounding flight)
Vertical shot without drag: apogee `h = v²/2g` ⇒ burnout speed `v = √(2gh)` (≈ 1.47 km/s for 110 km). Apogee = 110 km + 3 km per kg below the
8 kg limit ± 3 km; 20 % failure (apogee 8–38 km); time above 100 km = `2·√(2(h − 100 km)/g)`; parachute recovery 90 %.
Science = Σ instrument science × 0.3 × (1 if above 100 km else 0.2) × (1 if recovered else 0.6).

## 17. Campaign economy
- Start: $20 M funds, 0 prestige, trust 50 with each investor.
- Payment = contract payment × rank factor (Fail 0, Partial 0.4, Success/Outstanding 0.7 + 0.3·score/1000) × trust multiplier (0.8 + trust/250);
  repeats pay 25 %. Prestige: Partial 10, Success 30, Outstanding 50, +20 first success, +30 first booster landing.
- Trust: client +10 on success / −12 on failure; other investors ±2–3.
- First Light reaching space: +$10 M, +25 prestige, unlocks commercial launchers; every Paulet-1 flight costs $1.5 M.
- Technology: rideshare ($3 M, 40 prestige), R-2 ($35 M, 120 prestige, after Earth Watch); later acts shown but locked.
- Cargo contracts score "cargo delivered / required" instead of science; cargo is excluded from integration cost and development time.
