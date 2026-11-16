# Educational videos at the end of each mission ("The real story behind it")

> Pedido del dueño (2026-11-15): al terminar cada misión, un video animado y educativo sobre el contexto **real** que
> inspiró esa misión. Animación detallada hecha por código en la PC (HyperFrames: HTML + GSAP + Three.js, render local
> a MP4), sin modelos chinos. Texto y narración en inglés; subtítulos EN/ES (`.vtt`). Ver el plan de producción al final.

## Common rules
- **Length:** 60–90 s. Shown after the Letter to Paulet, with *Skip* and *Replay* buttons; also listed in the NASA data screen.
- **Structure (5 beats):** 1) hook question tied to what the player just did · 2) the real history · 3) the science in one
  animated diagram · 4) "your mission vs. the real one" (the player's numbers next to the real mission's) · 5) one line
  from a character + where to learn more (NASA source on screen).
- **Voices:** one narrator (ElevenLabs library voice) + one short line from Goicochea, Chicho, Roberto or Franchesca
  (designed voices, pending owner approval). Kuntur speaks only as on-screen text.
- **Look:** the game's console style (graphite panels, cream and gold, orange for paths, Barlow Condensed). NASA Blue
  Marble / Black Marble textures for Earth, NASA public-domain Moon and Mars maps for the Moon and Mars. Real missions are
  named in text only, never with logos or insignia. Paulet's 1890s tests are always "claimed".
- **AI disclosure:** narration is AI voice → "AI voice" note in the end card, in the credits and in the file metadata.
  Animation is code, not generated imagery.
- **Facts:** every number below has a source in the last column of its table; re-check before rendering.

---

## 0 · First Light → "From a notebook to the edge of space" (sounding rocket)
| t (s) | Animation | Narration (EN) |
|---|---|---|
| 0–8 | Player's rocket apogee freezes; a dashed line at 100 km glows: KÁRMÁN LINE | "You just crossed the line where space begins. How did humans first get here?" |
| 8–24 | Ink-sketch notebook pages flip (1895, Lima / Paris); a small engine sketch ignites with a cautious "CLAIMED" stamp. Cut to a frost-covered field: a 3 m frame, a 2.5 s flight, altitude counter stops at 12.5 m (1926) | "Peruvian engineer Pedro Paulet claimed he tested a liquid-fuel engine in the 1890s. The first documented liquid-fuel rocket flight came in 1926: two and a half seconds, twelve and a half metres." |
| 24–48 | Animated parabola: thrust phase (orange), coast (cream), apogee, fall; a side gauge shows weightless minutes; Earth curvature appears as altitude grows | "A sounding rocket doesn't go into orbit. It climbs, coasts, and falls, giving experiments a few minutes of weightlessness and a look at the upper atmosphere." |
| 48–66 | Split screen: YOUR FLIGHT (apogee, max speed, minutes of microgravity from the run) vs. a typical science sounding rocket | "NASA has flown sounding rockets for science for decades. Yours just joined that tradition." |
| 66–80 | Goicochea closes the notebook (character card) · source card | **Goicochea:** "Twelve metres in 1926. A hundred kilometres today. Paulet would want us to keep going." |
Sources: NASA Goddard history (1926 flight); NASA Sounding Rockets Program Office (Wallops); Pedro Paulet, claims as reported.

## 1 · Earth Watch → "Fifty years of watching Earth" (Landsat)
| t | Animation | Narration |
|---|---|---|
| 0–8 | Player's satellite ground track paints stripes over a rotating Blue Marble globe | "Your satellite will pass over the same place at the same local time, every time. Why does that matter?" |
| 8–26 | Timeline 1972 → today; each Landsat generation slides in as a silhouette; a mosaic of the Amazon fills in, swath by swath | "In 1972 the first Landsat satellite began photographing the whole planet. The record is now more than fifty years long, the longest of its kind." |
| 26–50 | Sun-synchronous orbit diagram: orbit plane slowly precessing with the Sun (≈1° per day); light angle stays fixed. Then spectral bands as bars: red vs. near-infrared → NDVI colour map of healthy vs. cut forest | "A sun-synchronous orbit keeps the lighting the same, so changes on the ground are real. Healthy leaves reflect near-infrared strongly, which lets us measure forest health from space." |
| 50–68 | YOUR MISSION vs. LANDSAT: altitude, revisit, GB/day | "Your design delivered {gbDay} gigabytes a day. Every pixel is part of a story about forests and farms." |
| 68–80 | Franchesca card | **Franchesca:** "Life leaves fingerprints in colour. From orbit, the planet is a living map." |
Sources: NASA/USGS Landsat Science; NASA Earth Observatory (NDVI).

## 2 · Andean Eye → "The glaciers of the Andes are telling us something"
| t | Animation | Narration |
|---|---|---|
| 0–10 | 3D Andes relief (elevation-shaded), camera flies south along the Cordillera Blanca | "Peru holds most of the world's tropical glaciers. Your satellite was built to watch them." |
| 10–34 | Glacier outline animates shrinking across decades (illustrative overlay on a Landsat-style base), with a melt-water river feeding towns and farms | "Satellite records show Andean glaciers have lost a large share of their area since the 1970s. Their meltwater feeds rivers that millions of people depend on in the dry season." |
| 34–54 | Instrument lens: optical (blocked by clouds) → thermal infrared (heat) → radar (sees through clouds, day and night) | "Clouds often cover the mountains, so scientists combine optical, thermal and radar data. A NASA–ISRO radar satellite, NISAR, now maps ice and ground motion through clouds." |
| 54–70 | YOUR MISSION vs. reality: cost, lifetime, data | "You did it on a foundation budget. Small missions can still watch big changes." |
| 70–80 | Chicho card | **Chicho:** "My father herded alpacas under that ice. Now we measure it from space." |
Sources: NASA Earth Observatory (Andean glacier retreat, Quelccaya); NASA JPL NISAR.

## 3 · Station Resupply → "Groceries to orbit" (commercial resupply)
| t | Animation | Narration |
|---|---|---|
| 0–8 | Station in orbit at ~400 km, a cargo capsule approaches in V-bar | "A station with people on board needs food, water, air and spare parts, all the time." |
| 8–28 | Timeline: crews continuously aboard since November 2000; first commercial cargo capsule berthed in 2012; first orbital booster landing in 2015 (animated booster flip and landing) | "People have lived aboard the International Space Station without a break since November 2000. Since 2012, private companies carry much of its cargo, and some boosters now fly back and land." |
| 28–50 | Physics: thin air at 400 km slows the station (drag arrow), altitude graph decays, a reboost burn restores it; the rendezvous "catch-up" from a lower, faster orbit | "Even up there, a trace of air drags the station down, so it must be pushed back up. To meet it, cargo ships start lower and faster, then catch up." |
| 50–68 | YOUR MISSION vs. reality: cargo kg, cost per kg | "You carried {cargoKg} kilograms. Cheaper launches mean more science per dollar." |
| 68–80 | Chicho card | **Chicho:** "Reusing a rocket is like reusing a truck. Nobody throws away a truck after one trip." |
Sources: NASA ISS Facts and Figures; NASA Commercial Resupply Services.

## 4 · Storm Tracker → "The satellites that see hurricanes coming"
| t | Animation | Narration |
|---|---|---|
| 0–8 | Black Marble Earth at night; a hurricane spiral forms over the Atlantic in time-lapse | "Before weather satellites, a hurricane could arrive with almost no warning." |
| 8–26 | 1960: first weather satellite, a grainy cloud image; zoom out to a geostationary ring at 35,786 km | "The first weather satellite sent its first cloud pictures in 1960. Today, satellites in geostationary orbit hover over the same spot and watch storms grow minute by minute." |
| 26–50 | Orbit comparison: LEO period ~95 min vs. GEO 24 h synced with Earth's spin; then the Van Allen belts glow around the planet, with a radiation dose meter | "At 35,786 kilometres a satellite circles once a day, exactly as Earth turns. The price: a long, costly climb, and more radiation than in low orbit." |
| 50–68 | YOUR MISSION vs. GOES: imaging rate, lifetime | "Your design delivered {gbDay} gigabytes a day for forecasters." |
| 68–80 | Roberto card | **Roberto:** "Thirty-six thousand kilometres away, and it still saves lives every season." |
Sources: NASA TIROS-1 history; NASA/NOAA GOES-R series.

## 5 · Lunar Pathfinder → "Water on the Moon"
| t | Animation | Narration |
|---|---|---|
| 0–10 | Moon south pole from above (NASA LRO-style relief), low Sun casting long moving shadows; craters never lit stay black | "Near the Moon's poles, some crater floors have not seen sunlight in billions of years." |
| 10–30 | 2009: an impactor drops into a shadowed crater; plume rises; a spectrum line shows a water dip | "In 2009, NASA's LCROSS mission crashed a rocket stage into one of those craters and found water in the plume." |
| 30–52 | How to find ice without landing: laser altimeter pulses map height; neutrons from the surface dip where hydrogen is; infrared spectrometer | "Orbiters map the poles with lasers, count neutrons that reveal hydrogen, and read light that ice absorbs." |
| 52–68 | YOUR MISSION vs. LRO: polar orbit, data | "Water there means drinking water, air and rocket fuel for future explorers." |
| 68–80 | Franchesca card | **Franchesca:** "Where there is water, there are questions. Maybe even answers." |
Sources: NASA LCROSS; NASA Lunar Reconnaissance Orbiter (LOLA, LEND).

## 6 · Lagrange Observatory → "Parking where gravity balances"
| t | Animation | Narration |
|---|---|---|
| 0–10 | Earth–Moon system rotating frame; five glowing points L1–L5 appear with their contour lines | "Between Earth and Moon there are five places where a spacecraft can almost stand still." |
| 10–30 | 1772 page (Lagrange) → three-body problem: two nearly identical trajectories diverge wildly (chaos demo, the game's own engine) | "Joseph-Louis Lagrange found them in 1772. But the three-body problem is chaotic: tiny errors grow fast, so spacecraft must make small corrections." |
| 30–52 | Halo orbit drawn around L2, small station-keeping burns flash; 2010: first spacecraft to orbit an Earth–Moon Lagrange point; 2021: a large space telescope travels to Sun–Earth L2 | "In 2010, two NASA probes were the first to orbit Earth–Moon Lagrange points. In 2021, the James Webb Space Telescope travelled to a Lagrange point of the Sun and Earth." |
| 52–68 | YOUR MISSION: delta-v used, months to arrive | "You spent {dv} metres per second. Less fuel, longer life." |
| 68–80 | Roberto card | **Roberto:** "Chaos is not the enemy. It is the rule we play by." |
Sources: NASA Science (Lagrange points); NASA THEMIS/ARTEMIS; NASA JWST.

## 7 · Red Horizon → "Every 26 months, a door opens to Mars"
| t | Animation | Narration |
|---|---|---|
| 0–10 | Top-down solar system; Earth and Mars on their orbits; a clock spins; alignment marker | "You can't leave for Mars whenever you want." |
| 10–30 | Hohmann transfer ellipse drawn tangent to both orbits; window opens every ~26 months; ~7 month cruise | "The cheapest path is an ellipse that touches both orbits. The planets line up for it about every twenty-six months, and the trip takes around seven months." |
| 30–52 | History cards: 1965 first close-up photos of Mars from a flyby; 1971 first spacecraft to orbit another planet; 1999 an orbiter lost because one team used pound-force and another newtons (units flip animation); 2006 aerobraking dips through the upper atmosphere (orbit shrinks pass by pass) | "In 1971, Mariner 9 became the first spacecraft to orbit another planet. In 1999, Mars Climate Orbiter was lost to a mix-up between imperial and metric units. Later orbiters saved fuel by skimming the thin Martian air to tighten their orbits." |
| 52–68 | YOUR MISSION vs. MRO | "Your orbiter arrived after {cruiseMonths} months. Check your units, always." |
| 68–80 | Goicochea card | **Goicochea:** "Paulet dreamed of rockets. We are reading the weather on another planet." |
Sources: NASA Science, Basics of Space Flight; NASA Mariner 4 / Mariner 9; NASA Mars Climate Orbiter Mishap Investigation Board; NASA MRO.

## 8 · Stranded → "Seven minutes to land, one orbiter to talk"
| t | Animation | Narration |
|---|---|---|
| 0–10 | Entry capsule glowing in Mars' atmosphere; a 7:00 countdown | "Landing on Mars takes about seven minutes, and nobody on Earth can help in real time." |
| 10–34 | Signal light-time animation (4–24 min one way) between Earth and Mars; sequence: heat shield → parachute → retro-rockets; 1997 airbag bounce; 2012 sky crane lowering a rover | "Radio signals take minutes to cross between the planets, so landers fly themselves: heat shield, parachute, rockets. Some bounced on airbags; one rover was lowered on cables by a flying crane in 2012." |
| 34–54 | Relay network: orbiters pass overhead, collect rover data, beam it home; data flow bar | "Most data from the surface travels home through orbiters overhead, acting as radio relays." |
| 54–68 | YOUR MISSION: landing accuracy, relay passes | "Your orbiter carried the call for help. In the real program, relays do this every day." |
| 68–80 | Chicho card | **Chicho:** "Nobody gets left behind. Not on Mars, not anywhere." |
Sources: NASA Mars Pathfinder; NASA Curiosity EDL; NASA Mars Relay Network.

## 9 · Breathing Mars → "Making oxygen from Martian air" (MOXIE)
| t | Animation | Narration |
|---|---|---|
| 0–10 | Martian air as particles (≈95% CO₂); a toaster-sized box on a rover | "Martian air is mostly carbon dioxide. A small box on a rover proved we can pull oxygen out of it." |
| 10–34 | Cutaway: compressor → hot (~800 °C) solid-oxide cell splits CO₂ → O₂ out, CO back to the air; molecules animate | "Between 2021 and 2023, MOXIE on the Perseverance rover ran 16 times and made 122 grams of oxygen, up to 12 grams an hour, at high purity." |
| 34–54 | Scale-up: a person breathes under a kilogram a day; a rocket to leave Mars needs tens of tonnes of oxygen → bar grows | "A person breathes under a kilogram of oxygen a day. A rocket leaving Mars needs tens of tonnes. Making it there means not carrying it from Earth." |
| 54–68 | YOUR MISSION: kg/day produced | "Your plant made {o2} kilograms a day." |
| 68–80 | Franchesca card | **Franchesca:** "We used to ask if Mars could hold life. Now we ask if it can help us live." |
Sources: NASA JPL MOXIE (final results, 2023).

## 10 · Terraforming → "Can we give Mars back its sky?"
| t | Animation | Narration |
|---|---|---|
| 0–12 | Ancient Mars with lakes (Jezero delta) fades to today's dry planet | "Billions of years ago, Mars had rivers and lakes. What happened?" |
| 12–34 | Solar wind particles stripping the upper atmosphere into space; a magnetic shield missing | "NASA's MAVEN orbiter measured how the solar wind strips gas from Mars' upper atmosphere, a major reason the planet dried out." |
| 34–54 | Inventory bars: all accessible CO₂ released → pressure gauge rises only a little | "A 2018 NASA-supported study found that releasing all the carbon dioxide we could reach would not warm Mars enough to make it Earth-like. Terraforming remains beyond today's technology." |
| 54–68 | The four characters' cards together | "Some dreams take more than one lifetime." |
| 68–80 | Goicochea closes the notebook; Kuntur text: "Keep the promise." | **Goicochea:** "Paulet started with an engine. We will leave the next chapter to you." |
Sources: NASA MAVEN; NASA (2018) "Mars terraforming not possible using present-day technology".

---

## Production plan (Claude, in the PC)
1. Scripts approved by the owner (this file).
2. **Voices** (pending owner approval of cost, ElevenLabs Starter: 40,000 characters/month, 0 used on 2026-11-15):
   - Narration ≈ 600–900 characters per video × 11 ≈ 9,000 characters (one take each).
   - 4 library voices proposed for the narrators/characters + designed voices for the four characters (each design
     costs one preview line). Total under 15,000 characters.
   **CHOSEN (owner, 2026-11-15): Kokoro local voices for everything** — narrator `am_michael`, Goicochea `am_onyx`,
   Chicho `am_puck`, Franchesca `af_heart`, Roberto `am_eric` (k05). Parler sounded like noise: discarded. ElevenLabs not used.
   Script per video: `C:/PPgame/tools/tts/first_light_vo.py` (one clip per caption, placed at the caption start).

   ~~Proposed cast (pending owner approval, listen to the previews in ElevenLabs before choosing):**
   | Role | ElevenLabs library voice | Why |
   |---|---|---|
   | Narrator | Quentin – Narrator and Educator (deep, calm American) | Clear documentary narration |
   | Goicochea | Gabriel – Warm & Charismatic Latin Voice (Peruvian accent) | Mature, warm, Peruvian |
   | Chicho | Alejandro – Warm Latin Storyteller (Peruvian roots) | Relaxed, friendly engineer |
   | Franchesca | Lilith – Cinematic Storyteller (Latina accent) | Bright, emotional scientist |
   | Roberto | **Designed voice** (made here from a description: Peruvian man in his late 40s, calm, precise, soft-spoken) | No library voice fits; needs the owner's test line |~~
   **Local voices (free, on the PC, non-Chinese models):** Kokoro-82M (Apache 2.0) and Parler-TTS large v1 (Hugging Face,
   Apache 2.0), installed in `C:/PPgame/tools/tts\.venv` (reuses ACE-Step's CUDA torch; scripts `kokoro_test.py`,
   `parler_test.py`, lines in `lines.py`). Test takes: `media/voices/test/local/` (k = Kokoro, p = Parler). ElevenLabs
   takes: `media/voices/test/`. The owner picks per role.
3. **Animation**: one HyperFrames project per video in `media/mission-videos/<mission>/`, rendered at 1920×1080, 30 fps,
   to `<mission>.mp4` + `<mission>.en.vtt` / `<mission>.es.vtt`. Numbers in braces come from the player's run (the game
   overlays them live on the "your mission" beat; the MP4 leaves that panel blank).
4. **In the game**: a "The real story" button on the report screen and in the NASA data screen. Lazy-loaded (not
   precached) so the offline install stays small.
