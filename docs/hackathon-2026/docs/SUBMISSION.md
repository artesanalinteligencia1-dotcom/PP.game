# Project page — NASA Space Apps Challenge 2026 (draft to paste)

> Borrador listo para copiar campo por campo en la pestaña **Project** del equipo. Todo en inglés (regla de la entrega).
> Enlaces y nombres ya completos (los nombres también están en `game/public/deck/index.html`, constante MEMBERS).

**Team:** Paulet Delta-V · **Local event:** Trujillo, Peru · **Members:** Cristhian Ramos Goicochea (founder), Rooney Ramos Goicochea, Diana Namoc Portilla

---

## Project Name
Paulet: Andes to Orbit

## High-Level Project Summary
<!-- 1443 characters, limit 1500 (2026-11-15) -->
I grew up in Peru reading about Pedro Paulet, the Arequipa engineer who claimed to fire a liquid-fuel rocket engine in the 1890s, and like many kids I dreamed of NASA: of being an astronaut, or the engineer behind the launch. Paulet: Andes to Orbit is the game I wish I had then. You are Dr. Pedro Goicochea, a fictional Peruvian physicist who swears to finish what Paulet began, and his letters to Paulet tell the story in first person. The fiction stands on real history (Paulet's Avión-Torpedo, Goddard, Apollo, Mars Reconnaissance Orbiter, Perseverance, all cited in the game) and feels like home: a launch base under the Misti volcano, Kuntur, a condor robot named in Quechua, and quena and charango over space synths.

Under the story is a real mission design game for one to four players, online or on one screen. The team designs a whole mission (objective, spacecraft, instruments, orbit, launcher), negotiates a shared budget, votes, launches in a 3D flight deck and flies a seeded simulation where each player decides their own role's events. Every choice moves at least two resources (mass, power, data, budget, schedule, lifetime), and the report explains why the mission worked or failed.

Everything was made for this game: story, characters, code and even the songs, with lyrics we wrote (the AI tools we used are disclosed below). It runs in the browser, offline after the first visit, in English and Spanish, with no account.

## Link to Project Demo
https://paulet-spaceapps-2026.vercel.app/deck/  (7 slides; arrow keys or click to advance, "All slides" to see them together)

## Link to Final Project
https://paulet-spaceapps-2026.vercel.app/
Source code: https://github.com/artesanalinteligencia1-dotcom/paulet-spaceapps-2026

## Detailed Project Description

### What it does
1. **Define the mission.** Each scenario starts with a client and a goal (for example *Earth Watch*: monitor forests and
   crops from orbit), minimum requirements, a budget and a deadline. A short briefing explains what to deliver and why.
2. **Design the spacecraft.** Tabs for payload, spacecraft, orbit & launch, and ground & comms. Instruments have mass,
   power, cost, data rate and science value; subsystems come in simple and advanced versions. A live dashboard shows every
   resource with +/− changes as you click.
3. **Review.** An automatic design review marks each issue green, amber or red and explains the cause and what to change
   (for example: the spacecraft is heavier than the launcher can lift to that orbit; the downlink cannot carry the data).
   Red items block the launch.
4. **Play as a team of four.** Mission Director (Dr. Goicochea), Spacecraft Engineer (Chicho), Astrophysicist (Roberto)
   and Astrobiologist (Franchesca). The budget is split by area according to what matters most in each mission, each role
   has its own goal plus a group goal, and big decisions and the final review go to a vote with veto. Play on one device
   or online in a shared room joined by link; Kuntur, an Andean condor robot guide, takes any empty seat and answers
   questions.
5. **Launch.** A mission-control flight deck with telemetry for the chosen orbit and live cameras (ground, chase, onboard
   and a map of the ascent over NASA Blue Marble and Black Marble imagery).
6. **Fly and evaluate.** A week-by-week seeded simulation with random events (solar storms, failures, slips) that the team
   answers together. Score 0–1000 with the three main reasons for the result.
7. **Letter to Paulet.** The report arrives as a console transmission: two personal lines from Goicochea, then the
   technical "why", signed with the value that guided the team (rigor, boldness or service). A failed mission still gets
   its letter and a retry with the same seed.
8. **Compare and share.** A side-by-side trade study of two designs (as in NASA's Mission Design Lab), a per-mission
   ranking, and challenge links that send friends the same mission and the same random events.

### How it works
- A pure, deterministic TypeScript engine (no user-interface code) computes every budget: orbit period and eclipse,
  launcher capacity per orbit, mass with margins, power from solar arrays and batteries, data volume against downlink,
  cost and schedule. A seeded random generator makes every mission reproducible, which enables replays, challenge links
  and fair team comparisons. 250+ automated tests check the formulas.
- The physics is real and simplified on purpose: the rocket equation per stage, Hohmann transfers and launch windows to
  Mars, and the Earth–Moon three-body problem for the chaos lesson. Every formula and constant is documented with its
  NASA source.
- Scenarios progress from a sounding rocket to Earth orbit, the Moon and Mars, with three difficulty levels (Cadet,
  Researcher, Program Director).

### Benefits
- Students see the whole system at once instead of one topic at a time, and learn *why* a design works, not only whether
  it is correct.
- Collaboration is built into the rules: roles must negotiate budget and priorities, as real mission teams do.
- Free, installable, offline after the first visit, bilingual (English/Spanish) and light enough for school laptops, so
  it can reach classrooms with poor connectivity.

### What we hope to achieve
A classroom-ready mission design game that a teacher can open in one minute, and that shows students in Latin America and
beyond that space engineering is a path open to them, starting from a story that begins in Arequipa, Peru.

### Tools, languages and software
TypeScript, React 19, Vite, Tailwind CSS, Zustand (state), Three.js and postprocessing (3D flight deck), GSAP and Motion
(animation), Recharts (charts), Firebase Realtime Database (online rooms), vite-plugin-pwa (offline play), Vitest
(tests), GitHub Actions (continuous integration) and Vercel (hosting). Fonts under the SIL Open Font License.

## Use of Super Intelligence (SI)
Yes. The idea, story, characters, game design and every creative decision come from our team; SI tools were used to
accelerate production:
- **Code:** written with Claude Code (Anthropic) following the team's design documents; reviewed and tested by the team.
  Disclosed in the repository (commit co-author lines and README).
- **Images and video:** illustrations generated with Google Gemini; every generated image or video carries a visible
  "AI-generated" mark.
- **Audio:** soundtrack generated locally with the open-source ACE-Step 1.5 model from lyrics and prompts written by the
  team; voice lines, music loops and sound effects generated with ElevenLabs. Disclosed in the credits screen and in the
  audio files' metadata.
- No SI-generated content uses NASA logos, agency insignia or mission identifiers.
- SI tools are listed as tools only; no SI is named as a team member or collaborator.

## NASA Data
NASA data and resources are part of the gameplay and are listed in the in-game **NASA data** screen, with a "Source: NASA"
note on each panel that uses them:
- **NASA Earth Observatory — Blue Marble: Next Generation and Black Marble 2016:** the Earth textures of the launch map
  and orbit views.
- **NSSDCA Earth and Mars Fact Sheets:** planetary constants (radius, gravity parameter, orbit, day length) used by the
  orbit and Mars engines.
- **NASA Glenn Research Center, Beginner's Guide to Aeronautics** (Ideal Rocket Equation, Specific Impulse, Multistage
  Rockets): the rocket workbench and the staging lesson.
- **NASA Science, Basics of Space Flight:** orbits, launch windows and interplanetary transfers.
- **Mars Reconnaissance Orbiter, Mars 2020 Perseverance, Curiosity, Phoenix and Pathfinder, MOXIE:** capture and
  aerobraking, landing budgets and in-situ oxygen production in the Mars act.
- **NASA Systems Engineering Handbook:** mass and power margins and the design review.
- **Challenge resources:** Design and Develop Science Missions (the four mission segments), JPL Concept Maturity Levels,
  Goddard Mission Design Lab (the trade study), GMAT (to check transfer delta-v), NASA Mission Viz, CubeSat 101 and
  A Learning Game About Telescopes.

## Space Agency Partner Data and Other References
- **CSA (Canadian Space Agency):** Digital Games and Activities, reviewed as a reference for educational game design.
- **Base work:** this entry extends our own open-source game *Paulet: Andes to Orbit* (MIT licence,
  github.com/artesanalinteligencia1-dotcom/PP.game), started before the hackathon; its engine, catalog and media are
  reused and declared here. Everything new for the challenge (team-of-four negotiation, online rooms, flight deck, NASA
  data screen, Goicochea's values, Letter to Paulet, trade study and ranking) was built during the hackathon.
- **Libraries (open source):** React, Vite, TypeScript, Tailwind CSS, Zustand, Three.js, postprocessing, GSAP, Motion,
  Recharts, Firebase JS SDK, vite-plugin-pwa, Vitest.
- **Fonts (SIL Open Font License):** Inter, Space Grotesk, JetBrains Mono, Barlow Condensed, Fraunces.
- **Audio:** ACE-Step 1.5 (open-source model, run locally; licence places no restriction on generated audio);
  ElevenLabs (voice, music loops and sound effects, under the team's plan).
- **History:** Pedro Paulet (1874–1945) — his liquid-fuel engine tests in the 1890s are presented in the game as his
  own claims, not as proven facts.
- All component, launcher and mission values are simplified game values documented in `docs/model.md`; real rockets and
  missions are named only as historical references, without logos.
