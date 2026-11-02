# HANDOFF — Space Mission Design Game

> Documento para Claude Code (nube). Léelo completo antes de escribir código. Si algo es ambiguo, decide con el default indicado y regístralo en `DECISIONS.md`; no te detengas a preguntar salvo que algo bloquee la entrega.

---

## 1. Objetivo

Construir un **juego interactivo web** donde 1 a 4 jugadores diseñan, lanzan y simulan una misión espacial completa, tomando decisiones de ingeniería bajo restricciones reales de **masa, potencia, presupuesto, datos, comunicaciones y tiempo/vida útil**.

**Objetivo mayor:** ser una entrega ganadora de un reto con jurado. Se evaluará (supuesto) por: funcionalidad real, claridad de UI, trade-offs visibles, multijugador/roles, simulación + evaluación, valor educativo y creatividad. Optimiza para que **un juez abra el link y en 60 segundos entienda y juegue**.

**Regla de oro de diseño:** toda decisión tiene consecuencia visible en al menos 2 recursos. No hay solución única óptima; varias combinaciones deben poder cumplir el mismo objetivo.

---

## 2. Decisiones técnicas (defaults)

| Tema | Decisión | Por qué |
|---|---|---|
| Frontend | Vite + React + TypeScript + Tailwind | Rápido, desplegable estático |
| Estado | Zustand | Simple, serializable |
| Motor de simulación | Módulo TS **puro y determinista** (`/src/engine`), sin dependencias de UI, con PRNG con semilla | Testeable, reutilizable en cliente y servidor, permite compartir/reproducir misiones |
| Visualización | SVG/Canvas 2D para órbitas y spacecraft; gráficos con Recharts | Sin peso de 3D; legible en cualquier laptop |
| Tests | Vitest para el motor | Los números deben ser verificables |
| Persistencia | Guardar/compartir misión como JSON + URL (estado codificado en base64/hash) + localStorage | Cumple "guardar, compartir, comparar" sin backend |
| Multijugador | **Fase 1:** roles en un mismo dispositivo (pass-and-play / vista por rol). **Fase 2:** salas online con código de 4 letras vía servidor Node `ws` (carpeta `/server`), el servidor es autoridad del estado | Online real requiere servidor persistente; Vercel serverless no mantiene WebSockets |
| Despliegue | Frontend en Vercel (estático). Servidor WS en Render/Fly/Railway solo si se llega a Fase 2 | |
| Idioma UI | Inglés por defecto + español, vía diccionario i18n (`en.json`, `es.json`) | El reto está en inglés; el usuario trabaja en español |

**Riesgo conocido:** multijugador online es lo más costoso y frágil. No lo empieces hasta que Fases 1–3 estén completas y con tests verdes. Si no hay tiempo, entrega roles locales bien hechos; es mejor que online roto.

---

## 3. Arquitectura

```
/src
  /engine        # PURO: sin React, sin DOM
    types.ts
    catalog/     # JSON/TS de componentes, lanzadores, órbitas, escenarios
    budget.ts    # masa, potencia, costo, datos, comms (cálculos de diseño)
    orbit.ts     # periodo, eclipse, ventanas de contacto, vida útil
    launch.ts    # compatibilidad lanzador-órbita-masa, probabilidad de éxito
    simulate.ts  # simulación por pasos (día o semana de misión)
    events.ts    # eventos aleatorios con semilla
    score.ts     # puntuación y desglose
    report.ts    # post-mission analysis (causas de éxito/fallo)
    rng.ts       # PRNG con semilla (mulberry32)
  /ui            # pantallas y componentes
  /store         # zustand
  /i18n
/server          # Fase 2 (ws)
/tests
DECISIONS.md
README.md
```

El motor expone funciones puras: `evaluateDesign(design, scenario) -> DesignReport` (instantáneo, para el dashboard en vivo) y `simulateMission(design, scenario, seed) -> MissionResult` (con eventos, para el resultado final).

---

## 4. Flujo del juego

1. **Menú:** modo (Solo / Equipo local / Sala online*), dificultad (Beginner / Engineer / Expert), escenario, sandbox.
2. **Briefing:** objetivo científico, requisitos mínimos, presupuesto, fecha límite (meses de desarrollo).
3. **Diseño** (pestañas, con dashboard de recursos siempre visible):
   - Mission (requisitos y objetivo)
   - Payload (instrumentos)
   - Spacecraft (subsistemas)
   - Orbit & Launch
   - Ground & Comms
4. **Design Review:** checklist automático (verde/ámbar/rojo) con explicación del *por qué* de cada alerta. No permite lanzar con errores rojos bloqueantes (masa > capacidad del lanzador, potencia < carga mínima, etc.).
5. **Lanzamiento:** animación corta + tirada de éxito con semilla.
6. **Simulación de misión:** línea de tiempo acelerada, dashboard en vivo (potencia, batería, datos a bordo, datos descargados, ciencia acumulada, presupuesto operativo), eventos aleatorios con decisión del equipo.
7. **Reporte final:** puntuación, desglose, análisis post-misión ("por qué funcionó/falló"), comparación con otros diseños guardados, botón "rediseñar".

---

## 5. Recursos y modelo de cálculo

Valores simplificados pero coherentes. Documenta cada fórmula en `/docs/model.md` y cítala en tooltips educativos.

### 5.1 Masa
- `dry_mass = Σ(subsistemas) + Σ(instrumentos) + estructura`
- Estructura = 22 % de la suma de subsistemas + instrumentos (Beginner: automática; Expert: se elige).
- Margen de diseño obligatorio: **+20 %** sobre la masa seca (se muestra explícito).
- `wet_mass = dry_mass_con_margen + propelente`
- Ecuación del cohete: `Δv = Isp · g0 · ln(wet/dry)`. Propelente requerido = f(Δv de la misión + mantenimiento de órbita).
- Debe cumplirse `wet_mass ≤ capacidad(lanzador, órbita)`.

### 5.2 Potencia
- Generación (BOL): `P = A · η · 1361 W/m² · cos(θ) · fracción_en_sol`
- Degradación: −2 %/año LEO, −3 %/año alta radiación; EOL = BOL · (1−d)^años.
- Eclipse: LEO ~35 % del periodo; SSO terminador sin eclipse (variante), GEO ~1 % (estacional), órbita lunar según caso.
- Consumo = Σ(subsistemas en modo activo) + Σ(instrumentos encendidos). Modos: Safe / Nominal / Science / Downlink.
- Batería: capacidad Wh, profundidad de descarga máxima 30 % LEO (vida útil), 60 % otros. Batería insuficiente → pérdida de ciclos y vida reducida.
- Validar **balance de potencia en peor caso** (eclipse + todos los instrumentos + downlink).

### 5.3 Datos
- Cada instrumento: `data_rate` (Mbit/s en operación) × `duty_cycle`.
- `datos_generados_día = Σ(rate · tiempo_operación_día)`
- Almacenamiento a bordo (GB) con límite; si se llena, se pierden datos.
- Compresión opcional del OBC (ratio 1.5–3×, cuesta potencia y masa).

### 5.4 Comunicaciones
- Banda y antena determinan `downlink_rate` (UHF 0.01–0.1, S-band ~2, X-band ~100, Ka ~500 Mbit/s en valores de juego).
- Ventanas de contacto por día = f(órbita, número de estaciones terrestres, latitud). LEO: ~4–6 pasadas/día de ~8–10 min por estación; GEO: contacto continuo; Luna/Marte: retardo y ventanas largas.
- `datos_descargables_día = ventanas · duración · rate · eficiencia(0.7)`
- Si `datos_generados > datos_descargables + almacenamiento`, el juego **explica el cuello de botella** y sugiere 3 palancas (más estaciones, banda más alta, menos duty cycle).
- Estaciones terrestres: costo operativo mensual por estación.

### 5.5 Presupuesto
`coste_total = desarrollo (≈ f(masa, TRL, instrumentos)) + lanzador + operaciones (meses × coste_mensual) + estaciones + contingencia (15 % obligatorio, reducible solo en Expert)`
- Componentes de menor TRL: más baratos o más científicos, pero con mayor probabilidad de fallo/retraso.

### 5.6 Tiempo / vida útil
`vida_útil = min(vida_batería, vida_paneles, vida_propelente, vida_radiación, vida_órbita_por_arrastre)`
- Vida de misión requerida por el escenario; ciencia se acumula solo mientras la nave opera.
- Tiempo de desarrollo: instrumentos avanzados añaden meses; pasar la fecha límite penaliza.

### 5.7 Órbita
Catálogo (con explicación didáctica en cada una):
| Órbita | Altitud | Periodo aprox. | Notas |
|---|---|---|---|
| LEO | 400–600 km | ~92–96 min | Alta resolución, poco contacto, arrastre, eclipses frecuentes |
| SSO | 600–800 km | ~99 min | Iluminación constante, ideal observación terrestre |
| MEO | ~20 000 km | ~12 h | Navegación, radiación mayor |
| GEO | 35 786 km | 24 h | Cobertura fija de una región, requiere lanzador potente |
| Lunar polar | ~100 km | ~2 h | Δv alto, contacto intermitente |
| Heliocéntrica / flyby Marte | — | — | Δv muy alto, retardo de comms, mucho tiempo |

---

## 6. Catálogo inicial (datos de juego, ajustables)

**Importante:** usa lanzadores y componentes **genéricos/ficticios** (no marcas ni nombres reales de cohetes). Los valores son de juego, no oficiales; indícalo en un aviso en la UI.

### Lanzadores
| Nombre | LEO (kg) | SSO (kg) | GTO (kg) | Lunar TLI (kg) | Costo (M$) | Fiabilidad |
|---|---|---|---|---|---|---|
| Light (L-1) | 300 | 200 | — | — | 7 | 0.90 |
| Medium (M-2) | 3 000 | 2 000 | 1 000 | 400 | 45 | 0.94 |
| Heavy (H-3) | 15 000 | 10 000 | 6 000 | 3 500 | 130 | 0.96 |

### Instrumentos (ejemplos; crear ≥ 12)
| Instrumento | Masa kg | Potencia W | Datos Mbit/s | Costo M$ | Valor científico | TRL |
|---|---|---|---|---|---|---|
| Cámara óptica pancromática | 25 | 40 | 80 | 8 | 40 | 9 |
| Multiespectral | 40 | 60 | 120 | 15 | 65 | 8 |
| Radar SAR | 120 | 500 | 400 | 45 | 90 | 6 |
| Espectrómetro IR | 30 | 35 | 10 | 12 | 55 | 7 |
| Magnetómetro | 3 | 3 | 0.05 | 2 | 20 | 9 |
| Altímetro láser | 60 | 90 | 5 | 30 | 75 | 6 |
| Detector de partículas | 8 | 10 | 0.2 | 5 | 30 | 8 |
| Cámara de alta resolución (HiRes) | 80 | 120 | 300 | 35 | 85 | 6 |

### Subsistemas (ejemplos; incluir variantes Simple/Avanzado)
- **Potencia:** paneles fijos / desplegables / con seguimiento solar; baterías Li-ion de 100/500/2 000 Wh.
- **Comms:** UHF (omni), S-band, X-band, Ka-band; antena patch / helicoidal / parabólica dirigible.
- **OBC:** básico / radiation-hardened (más caro, tolera radiación) / alto rendimiento (más datos on-board).
- **ADCS:** magnetorquers (barato, impreciso) / ruedas de reacción / star tracker + ruedas (preciso, necesario para HiRes y SAR).
- **Propulsión:** ninguna / gas frío / hidracina monopropelente / eléctrica (alto Isp, baja empuje, necesita potencia).
- **Térmica:** pasiva / activa (calentadores, radiadores).

---

## 7. Escenarios (mínimo 4)

1. **Earth Watch (Beginner):** observación de cobertura forestal/agrícola. SSO, cámara multiespectral, 2 años. Presupuesto ~$120 M.
2. **Storm Tracker (Engineer):** monitoreo de clima/huracanes. Requiere revisita alta o GEO; trade-off resolución vs cobertura.
3. **Lunar Pathfinder (Expert):** mapear polo lunar en busca de hielo. Δv alto, comms intermitentes, eclipses largos.
4. **Deep Space Flyby (Expert):** sobrevuelo de asteroide/Marte. Retardo de comms, presupuesto de datos muy limitado, vida larga.
5. **Sandbox:** sin restricciones predefinidas; presupuesto/masa libres, muestra solo los efectos.

Cada escenario define: objetivo, requisitos mínimos (pass/fail), objetivos opcionales (bonus), presupuesto, meses de desarrollo, vida requerida, eventos posibles.

---

## 8. Roles (modo equipo, hasta 4)

| Rol | Controla | Métricas que vigila | Conflicto típico |
|---|---|---|---|
| **Mission Lead** | Objetivo, requisitos, aprobación final, orbita | Score global, riesgo | Equilibrar ciencia vs costo |
| **Science Lead** | Instrumentos | Valor científico, datos generados | Pide más instrumentos → sube masa/potencia/datos |
| **Spacecraft Engineer** | Subsistemas, masa, potencia | Balance masa/potencia | Limita al científico |
| **Comms & Ops / Budget** | Comms, estaciones, lanzador, presupuesto | Datos descargables, costo | Frena gasto, pero necesita ancho de banda |

Mecánica de colaboración:
- Cada rol tiene **presupuesto asignado** de masa/potencia/costo (una "asignación" que se renegocia).
- **Negociación:** un jugador propone un cambio que afecta a otro; el afectado acepta / contrapropone / rechaza. Aprobación final requiere la firma del Mission Lead.
- **Cuando es 1 jugador:** puede ver todos los roles; el juego muestra alertas "como si" hablaran los demás roles (consejeros) para enseñar el conflicto.
- Score de colaboración: bonus por decisiones consensuadas sin bloqueos y por usar bien las asignaciones.

---

## 9. Eventos aleatorios (con semilla, reproducibles)

Ejemplos: llamarada solar (radiación, riesgo para OBC no endurecido), anomalía de batería, pérdida de una estación terrestre, micrometeoroide, retraso del lanzador (+1 mes), recorte de presupuesto (-10 %), oportunidad científica inesperada (bonus si hay el instrumento adecuado).
- Algunos eventos piden **decisión** (p. ej. "gastar propelente para evitar basura espacial" vs "aceptar riesgo").
- Probabilidad ajustada por dificultad. La semilla se muestra para repetir/comparar misiones.

---

## 10. Puntuación (0–1000)

| Componente | Peso | Cómo |
|---|---|---|
| Éxito de misión (requisitos mínimos) | 300 | Pass/fail escalonado |
| Valor científico logrado | 250 | Σ(ciencia × tiempo operativo × datos descargados efectivamente) |
| Eficiencia de recursos | 150 | Uso de masa/potencia/presupuesto sin sobredimensionar (premia margen ≈ 15–25 %) |
| Calidad de decisión de ingeniería | 100 | Sin errores críticos, márgenes sanos, buena respuesta a eventos |
| Cumplimiento de calendario | 50 | Entrega a tiempo |
| Colaboración (solo equipo) | 100 | Consenso, uso de roles |
| Bonus: objetivos opcionales | hasta +50 | |

Rangos: Fail / Partial / Success / Outstanding. Leaderboard local (localStorage) por escenario y dificultad, filtrable por semilla.

---

## 11. Valor educativo (no negociable)

- **Modo Beginner:** subsistemas básicos preseleccionados; tutorial guiado de 5 pasos; tooltips con ejemplos cotidianos ("la potencia es como el presupuesto de una batería de celular").
- **Cada alerta explica el porqué**, no solo "mal". Ej.: *"Tus instrumentos generan 38 GB/día pero solo puedes descargar 9 GB/día. Los datos extra se pierden. Opciones: X-band, 2.ª estación, reducir duty cycle."*
- **Glosario** accesible (altitud, payload capacity, delta-v, duty cycle, eclipse, link budget).
- **Post-mission analysis:** lista de las 3 causas principales del resultado, con gráfico de recursos en el tiempo y "qué cambiarías".
- Panel "Why this matters": 1–2 líneas conectando el concepto con misiones reales (sin afirmar datos exactos que no estés seguro).

---

## 12. Fases de entrega y criterios de aceptación

**Fase 0 — Scaffold (≤ 1 h):** repo, Vite+TS+Tailwind, CI de tests, deploy a Vercel con pantalla "hola".

**Fase 1 — Motor + diseño solo (núcleo):**
- Catálogo, `evaluateDesign`, dashboard de recursos en vivo, Design Review con alertas explicativas, escenarios 1 y 3.
- ✅ Aceptación: tests unitarios del motor pasan; un usuario puede armar una misión y ver que cambiar un instrumento mueve masa, potencia, datos y costo al instante.

**Fase 2 — Lanzamiento + simulación + reporte:**
- `simulateMission`, eventos con semilla, resultados, puntuación, post-mission analysis.
- ✅ Aceptación: misma semilla + mismo diseño = mismo resultado; ≥ 2 diseños distintos pueden ganar el mismo escenario.

**Fase 3 — Roles locales + guardado/compartir + tutorial + 4 escenarios + sandbox + i18n EN/ES.**
- ✅ Aceptación: partida de 4 roles en un mismo navegador con negociación; exportar/importar misión por link.

**Fase 4 — Visualizaciones y pulido:** diagrama animado de órbita y de la nave (módulos que aparecen al añadirlos), animación de lanzamiento, sonido opcional, accesibilidad (contraste, teclado), responsive.

**Fase 5 (opcional) — Sala online:** servidor `ws`, código de sala, sincronización de roles, servidor autoritativo.
- ✅ Aceptación: 4 pestañas distintas controlan 4 roles sobre la misma misión sin desincronizarse; reconexión básica.

Después de cada fase: commit, deploy, y actualizar `README.md` con captura y link.

---

## 13. Calidad (verifica antes de dar por terminado)

- [ ] El motor tiene tests con casos conocidos (ej. Δv de ecuación del cohete, balance de potencia, descarga de datos).
- [ ] Ninguna decisión de UI cambia un recurso sin que el usuario lo vea reflejado.
- [ ] No hay números "mágicos" sin documentar en `/docs/model.md`.
- [ ] Probado a mano: un Beginner completa Earth Watch en < 10 min sin leer nada externo.
- [ ] Probado a mano: un diseño absurdo (instrumento de 500 kg en lanzador Light) da un mensaje claro, no un crash.
- [ ] Se abre bien en móvil/tablet para espectadores del jurado.
- [ ] README con: qué es, cómo jugar, cómo correr local, decisiones de diseño y limitaciones conocidas.
- [ ] Aviso visible: valores simplificados con fines educativos.

---

## 14. Qué NO hacer

- No usar marcas/logos ni nombres de cohetes/misiones reales como componentes jugables (puedes citar misiones reales solo como referencia educativa breve).
- No meter 3D pesado ni dependencias grandes si no aportan al aprendizaje.
- No dejar el motor acoplado a React.
- No empezar multijugador online antes de tener Fases 1–3 verdes.
- No inventar datos reales "exactos"; si citas una cifra real, márcala como aproximada.
- No sobreconstruir menús: prioriza que el loop *diseñar → evaluar → simular → aprender → rediseñar* se sienta bien.

---

## 15. Cómo trabajar (instrucciones para Claude Code)

1. Crea una lista de tareas por fase y trabaja una fase a la vez.
2. Haz commits pequeños y descriptivos; despliega al terminar cada fase.
3. Registra en `DECISIONS.md` cada supuesto que tomes (formato: decisión / alternativa / motivo).
4. Al terminar cada fase, entrega: link de deploy, qué quedó hecho, qué quedó pendiente, riesgos.
5. Si una fase se está atrasando, **recorta alcance** (menos escenarios, menos instrumentos) antes que recortar tests o claridad de UI.

---

## 16. ADDENDUM v2 — requisitos confirmados por el usuario (PREVALECEN sobre secciones anteriores si hay conflicto)

**Resuelto:** no hay fecha límite que considerar (no preguntar). Idioma del jurado: inglés. Entrega: repositorio público + video demo.

### 16.1 Idioma y repo público
- UI y contenido del juego en **inglés** (i18n ES opcional, no prioritario). `README.md` en inglés + `README.es.md`. Identificadores de código en inglés. Las explicaciones al usuario durante el trabajo, en español.
- Repo **público** en GitHub: licencia MIT, `.env.example`, **cero secretos/keys** en el historial, créditos de assets en `CREDITS.md` (solo assets propios o de dominio público/licencia libre), CI con tests, deploy en Vercel con link en el README.

### 16.2 Pantalla de inicio (hub)
Botones: **Play** (modos) · **Watch Intro** (explicador ~90 s) · **Learn** (lecciones/videos educativos) · **Legacy: Paulet** · **Sandbox**.
- Los "videos" educativos son **lecciones animadas dentro de la app** (Canvas/SVG manejado por el mismo motor, 60–90 s, con subtítulos), sin depender de YouTube. Lecciones mínimas: (1) qué es una órbita, (2) masa/potencia/datos, (3) ecuación del cohete, (4) problema de los 3 cuerpos, (5) Pedro Paulet y los motores de propelente líquido.
- Modos de juego: Solo · Team (4 roles, local) · Online room* (Fase 5) · Scenario Campaign · Sandbox · Deep Space.

### 16.3 Módulo "Deep Space Dynamics" — problema de los 3 cuerpos (teoría del caos)
Opcional en el menú y obligatorio en el escenario *Lagrange Observatory*. Se usa cuando la misión es larga o hay más de un cuerpo grande influyendo.
- **Modelo:** problema restringido circular de 3 cuerpos (Tierra–Luna + nave de masa despreciable), unidades normalizadas, integrador **RK4 de paso fijo**. El resto del juego sigue con el modelo simplificado de dos cuerpos.
- **Lección interactiva "Butterfly":** el jugador lanza una trayectoria, mueve la velocidad inicial 0.01 % y ve cómo las dos trayectorias divergen (sensibilidad a condiciones iniciales). Mostrar un indicador simple de divergencia en el tiempo.
- **Escenarios:** (a) *Lagrange Observatory*: telescopio en L2/halo, con corrección de estación (costo de propelente); (b) *Free-return Moon*: sobrevuelo lunar con retorno; (c) *Low-energy transfer*: llegar más lento pero con menos Δv, con trade-off tiempo-de-vuelo vs propelente vs vida útil de comms/baterías; (d) opción de **asistencia gravitatoria** en misiones de espacio profundo.
- **Puntuación:** premiar ahorro de Δv, estabilidad de la órbita y respuesta a la deriva caótica; penalizar tiempo excesivo.
- **DETERMINISMO (crítico):** en sistemas caóticos, diferencias mínimas de punto flotante entre navegadores cambian el resultado y rompen "misma semilla = mismo resultado". Usar paso fijo, solo `+ − × ÷ √` dentro del integrador (sin `Math.sin/cos/pow` ahí), y un test de snapshot con tolerancia documentada. Si aun así hay deriva entre navegadores, precomputar trayectorias de referencia.
- Aviso en UI: modelo educativo simplificado, no apto para planeamiento real.

### 16.4 Modo "Legacy: Paulet" (vínculo con Pedro Paulet)
Pedro Paulet (Arequipa 1874 – Buenos Aires 1945), ingeniero peruano. **Tratamiento de los hechos (obligatorio):** su afirmación de haber probado un motor cohete de propelente líquido en París (1895–1900) se conoce sobre todo por su propia carta publicada en *El Comercio* en 1927; **no fue verificada de forma independiente** (el análisis de F. Ordway para la IAA, 1969, concluyó que no podía probarse). Citas atribuidas a von Braun se presentan como "atribuidas", no como hecho. Redactar siempre como *"claimed / reportedly / according to his own account"*. No afirmar que fue "el padre de la astronáutica" como hecho.
- **Tech tree de propulsión:** Solid → **Liquid bipropellant ("Paulet engine")** → Electric. Es una mecánica real: desbloquear el motor líquido mejora Isp y permite reencendido/maniobras, a costa de masa de tanques, complejidad y riesgo.
- **Mini-desafío histórico:** diseñar un motor de ~100 kgf de empuje con propelentes de época (p. ej. tetróxido de nitrógeno + gasolina, según su relato), ver masa de tanques, relación de mezcla y tiempo de combustión. Valores simplificados.
- **Lanzador ligero** de la familia "Paulet" (nombre tributo; resto de lanzadores genéricos). Escenario peruano opcional: *Andean Eye* (observación de glaciares andinos y Amazonía).
- **Lección "Paulet":** 60–90 s, línea de tiempo con lo documentado vs. lo discutido.

### 16.5 Video demo (entregable)
- Claude Code escribe `docs/demo-script.md` (guion + storyboard, 2:30–3:00): hook 10 s → problema → loop diseñar/evaluar/simular → trade-off en vivo → equipo de 4 roles → módulo 3 cuerpos → Paulet → cierre con link y repo.
- La **grabación la hace el usuario** (OBS o grabación de pantalla) con voz propia; opcional: narración/subtítulos con herramientas de IA aparte. Claude Code no puede grabar pantalla del navegador del usuario.
- El README enlaza el video y el deploy.

### 16.6 Fases ajustadas
- Fases 0–2 igual.
- **Fase 3:** + hub de inicio, lecciones animadas 1–3, roles locales, guardar/compartir, 4 escenarios base.
- **Fase 3.5 (nueva):** módulo Deep Space (3 cuerpos) + lecciones 4 y tests de determinismo.
- **Fase 3.6 (nueva):** modo Legacy Paulet + lección 5.
- Fase 4 pulido, Fase 5 online, Fase 6: video demo + README final.
- Regla de recorte: si falta tiempo, recortar Fase 5 y escenarios extra **antes** que Deep Space y Paulet, porque son los diferenciadores pedidos explícitamente; nunca recortar tests ni claridad de UI.

### 16.7 Online
- El juego **se publica online** (URL pública en Vercel) desde la Fase 0. El multijugador online en tiempo real (Fase 5) requiere un servidor WebSocket persistente: necesita una cuenta de hosting (Render/Fly/Railway, plan gratuito basta pero "duerme" y el primer ingreso tarda) que **el usuario debe crear**. Alternativa sin servidor propio: servicio de tiempo real gestionado (p. ej. Supabase Realtime); decidir al llegar a Fase 5 y registrar en `DECISIONS.md`.

---

## 17. ADDENDUM v3 — Videos divulgativos (Watch Intro, lecciones, video demo)

Esta sección **amplía 16.2 y 16.5**. Si hay conflicto, prevalece esta.

### 17.1 Estilo objetivo (referencia visual)
El usuario compartió un video de referencia (TikTok de una cuenta de divulgación científica; ~3 min). Características a imitar **como estilo**, no como contenido:
- Formato **vertical 9:16** (1080×1920). Para el demo del reto, exportar también **16:9**.
- Ilustración **plana 2D**, paleta apagada (azules, violetas, naranjas), luz dramática, siluetas, planos cercanos de personajes.
- Cambio de escena cada **3–4 s**, con movimiento de cámara (zoom lento, paralaje, paneo).
- **Subtítulos palabra por palabra** en negrita, centrados, sincronizados con la voz.
- Narración en off, tono divulgativo.

**Restricciones (obligatorias):**
- Personajes, escenas y arte **originales**: no copiar animales, composiciones ni marca de agua del video de referencia.
- El archivo de referencia **no se sube al repo público** (es contenido de terceros). Guardarlo en una carpeta local ignorada por git (p. ej. `refs/`, en `.gitignore`) o solo describir el estilo en `docs/video-style.md`.
- Personajes visuales propios para el juego: astronauta/ingeniero genérico, naves, planetas, trayectorias, esquemas (no usar personajes ni marcas protegidas).

### 17.2 NO se exige ElevenLabs
El usuario tiene **herramientas propias en su PC**. ElevenLabs es solo una opción más y **no debe usarse sin aprobación del usuario** (gasta créditos). Claude Code **evalúa y decide** el pipeline.

### 17.3 Tarea de evaluación (hacer al inicio de la Fase 6, registrar en `DECISIONS.md`)
1. **Inventario de herramientas.** Revisar qué hay disponible:
   - En el contenedor de la nube: `ffmpeg`, Python, Node, Chromium/Playwright (suelen estar).
   - En la PC del usuario: **solo si la sesión está vinculada a su computadora** vía la app de escritorio. Si no lo está, **no asumir** que se pueden usar sus programas; pedirle una lista corta de lo que tiene (editor de video, TTS, generador de imágenes, etc.) y qué pasos prefiere hacer él manualmente.
2. **Comparar opciones** en una tabla (costo en dinero/créditos, calidad, tiempo, reproducibilidad, riesgo):

| Opción | Cómo | Pros | Contras |
|---|---|---|---|
| A. Lecciones del propio juego grabadas | Playwright graba la app (Canvas/SVG) → mp4 | Cero costo, reproducible, 100 % original, coherente con el juego | Estilo "motion graphics", menos "cuento ilustrado" |
| B. Remotion / motion graphics por código | React → mp4 con subtítulos palabra por palabra | Reproducible, versionable, estilo controlable | Curva de aprendizaje; ilustraciones hay que dibujarlas (SVG) |
| C. Imágenes fijas + animación con ffmpeg | Ilustraciones + zoom/paralaje + voz + subtítulos | Barato, rápido, imita bien el estilo de referencia | Imágenes requieren generador o arte propio |
| D. Herramientas locales del usuario | Editor/IA que ya tenga en su PC | Sin créditos nuevos, calidad alta | Claude Code en la nube no las alcanza salvo PC vinculada; parte manual |
| E. ElevenLabs (voz/imagen/video) | Solo con aprobación | Calidad y rapidez | Gasta créditos; consistencia de estilo entre escenas es difícil |

3. **Recomendación por defecto** (si el usuario no decide otra cosa): **A + C**. Lecciones y demo con la app grabada (A); la intro ilustrada tipo divulgación con imágenes animadas (C); voz con la herramienta que el usuario ya tenga o su propia voz. Registrar la decisión y por qué.
4. **Antes de gastar créditos o tiempo largo**, producir una **prueba de 20–30 s** (p. ej. la lección de Paulet o la intro) y mostrársela al usuario para validar estilo y costo.

### 17.4 Entregables de video
- `docs/video-style.md` (guía de estilo: paleta con códigos hex, tipografía de subtítulos, ritmo de cortes, reglas de cámara).
- `docs/video-pipeline.md` (cómo se genera cada video, paso a paso y reproducible; qué es automático y qué es manual).
- Guiones y storyboards por video en `docs/scripts/`: **Watch Intro (~90 s)**, **5 lecciones (60–90 s)**, **demo del reto (2:30–3:00)**.
- Subtítulos en archivo `.srt` o `.vtt` además de quemados, para accesibilidad.
- Claridad científica: cada video declara en pantalla "simplified educational model". Datos de Paulet y de los 3 cuerpos siguen las reglas de 16.3 y 16.4 (hechos vs. discutido).

### 17.5 Reparto de trabajo
- **Claude Code (nube):** guiones, storyboards, subtítulos, grabación de la app, montaje automatizable, docs.
- **Usuario (PC):** voz final si usa herramientas propias o su voz, grabación de pantalla que Claude Code no pueda hacer, revisión y subida del video, aprobación de cualquier gasto de créditos.
- Claude Code **no puede grabar la pantalla del navegador del usuario**; sí puede grabar la app desplegada con Playwright desde el contenedor.

### 17.6 Ajuste de fases
- Fase 6 se divide: **6.0** evaluación de herramientas + prueba de 20–30 s → **aprobación del usuario** → **6.1** videos (intro, lecciones, demo) → **6.2** README final con enlaces.
- Regla de recorte: si falta tiempo, priorizar **demo del reto** y **Watch Intro**; las lecciones en video pueden quedar como animaciones dentro de la app (16.2).

---

## 18. ADDENDUM v4 — Reparto Claude Code LOCAL ↔ NUBE (PREVALECE sobre todo lo anterior)

**Contexto:** el usuario tiene tokens limitados en Claude Code **local** y quiere reservarlos. Orden de uso: (1) arrancar en un chat **local** solo con lo mínimo, (2) pasar a un chat en la **nube** que avanza con todo lo que pueda, (3) volver al **local** únicamente para lo que la nube no pueda hacer.

### 18.1 Sesión LOCAL inicial (corta; no gastar más de lo necesario)
Hacer **solo** esto y terminar:
1. Clonar el repo público (ya creado por el usuario en GitHub con MIT y README) y copiar este documento a `docs/HANDOFF.md` (para que ambas sesiones lo lean del mismo sitio).
2. **Fase 0 (scaffold):** Vite + React + TypeScript + Tailwind + Vitest, CI de tests, estructura de carpetas de la sección 3.
3. **`.gitignore` tipo Node** (si el repo no lo tiene) que además ignore: `.env`, `.env.*` (salvo `.env.example`), `node_modules/`, `dist/`, `refs/` (material de referencia de terceros), `*.mp4`/`*.mov` de trabajo grandes, y cualquier carpeta de credenciales.
4. Crear `PROGRESS.md` y `LOCAL_TODO.md` (formato en 18.3) y `DECISIONS.md`.
5. Commit + **push** a `main` (o rama `dev`). Confirmar que el repo queda accesible para la sesión en la nube.
6. Despliegue en Vercel con pantalla "hola" **solo si** requiere autenticación que la nube no puede hacer; si no, dejarlo como tarea de la nube.
7. Terminar con un resumen de 5 líneas. **No** empezar la Fase 1 en local.

### 18.2 Sesión en la NUBE (el grueso del trabajo)
Avanza con **todo lo que pueda hacer sin la PC del usuario**, en este orden y respetando las fases y criterios de aceptación de la sección 12 y los addendums:
- Fases 1, 2, 3, 3.5, 3.6 (motor, simulación, escenarios, roles locales, 3 cuerpos, Paulet, hub, lecciones animadas **dentro de la app**), tests, documentación (`/docs/model.md`, `video-style.md`, guiones), subtítulos, README.
- Fase 4 (pulido) y, si el usuario ya creó la cuenta de hosting, Fase 5 (online).
- Videos que se puedan hacer en la nube (opción A/C de 17.3: grabación de la app con Playwright, montaje con ffmpeg, subtítulos).
- Trabajar en **ramas** (`cloud/fase-N`), commits pequeños, **push** frecuente. No hacer force-push. No tocar lo que esté marcado como "LOCAL" en `LOCAL_TODO.md`.
- **Cuando algo requiera la PC o decisión del usuario, no detenerse:** anotarlo en `LOCAL_TODO.md`, dejar un stub o alternativa funcional, y seguir con el resto.
- No gastar créditos externos (ElevenLabs u otros) sin aprobación explícita.

### 18.3 Contrato de traspaso entre sesiones (archivos en el repo)
La sesión que termina **debe actualizar estos archivos antes de cerrar**, porque la siguiente no recuerda nada:
- **`PROGRESS.md`**: fase actual, qué está hecho (con enlace al commit), qué falta, cómo correr/probar, link de deploy, riesgos abiertos, siguiente paso exacto.
- **`LOCAL_TODO.md`**: tareas que **solo** puede hacer Claude Code local o el usuario, cada una con: qué hacer, por qué la nube no pudo, archivos relacionados, criterio de "hecho".
- **`DECISIONS.md`**: supuestos y decisiones (decisión / alternativa / motivo).
Al arrancar, cada sesión lee `docs/HANDOFF.md`, `PROGRESS.md` y `LOCAL_TODO.md` **antes** de escribir código, y hace `git pull`.

### 18.4 Qué queda para Claude Code LOCAL (solo lo que la nube no pueda)
- Usar **herramientas instaladas en la PC** del usuario (editor de video, TTS local, generador de imágenes local, etc.) para producir o pulir los videos (17.3 opción D).
- **Grabación de pantalla** del navegador del usuario y revisión visual en su equipo.
- Autenticaciones o configuraciones que requieran su PC o sus cuentas (login de Vercel/hosting, secretos en variables de entorno **sin** subirlos al repo).
- QA manual final (probar en su navegador/móvil), ajustes que dependan de su hardware.
- Cualquier decisión que el usuario deba tomar con sus archivos locales.

### 18.5 Ahorro de tokens (aplica a ambas sesiones)
- Leer solo los archivos necesarios; no volver a leer el handoff completo en cada paso (usar `PROGRESS.md`).
- Respuestas finales cortas; sin recapitular lo hecho paso a paso.
- Ejecutar tests con salida resumida; no pegar logs largos.
- Una fase a la vez; no empezar fases futuras "por adelantado".

### 18.6 Criterio de cierre de cada sesión
Terminar con: (a) todo commiteado y pusheado, (b) `PROGRESS.md` y `LOCAL_TODO.md` actualizados, (c) un resumen de máximo 8 líneas con el link de deploy, lo hecho y lo pendiente para la siguiente sesión.

---

## 19. ADDENDUM v5 — Narrativa, roles, música y formatos de video (aprobado por el usuario el 2026-11-02; PREVALECE si hay conflicto)

### 19.1 Narrativa
- Tesis: un científico que quiere hacer ciencia y vive con las reglas de la economía y la sociedad (inversores, presupuesto, regulación).
- Protagonista: **Dr. Pedro Goicochea**, físico ficticio de Arequipa inspirado por la historia de Pedro Paulet; Director de Misión (PI). El jugador podrá poner su nombre (el juego lo llama "Dr./Ing. <nombre>").
- Paulet solo en la capa histórica real (reglas de §16.4).
- Campaña con contratos e inversores; dos monedas (Fondos y Prestigio); tecnología especulativa solo en los actos finales y etiquetada.

### 19.2 Roles (reemplaza §8)
Director/a de Misión (incluye finanzas y operaciones) · Ingeniero/a de Nave · Astrofísico/a · Astrobiólogo/a; cada instrumento pertenece a uno de los dos científicos. Solo: 1–4 roles, el resto bots (prudente / equilibrado / audaz); consejeros siempre disponibles.

### 19.3 Dificultad
Tres niveles: Cadete / Investigador / Director de Programa. Tres cuerpos: verlo (Cadete) → elegir rutas precalculadas (Investigador) → diseñarlo (Director).

### 19.4 Música y audio — la música va acorde a la etapa del juego
| Etapa | Música | Estado |
|---|---|---|
| Pantalla de inicio / hub | **A** (andina-electrónica) | ✅ en el juego |
| Briefing y diseño | loop tranquilo para concentrarse (charango + pads) | generado (aprobado); falta descargar; mientras tanto A suave |
| Lanzamiento | **B** (cinematográfica: crece hasta el clímax) | ✅ en el juego |
| Vuelo / control de misión | loop ambiental espacial con tensión sutil | generado (aprobado); falta descargar; mientras tanto A muy suave |
| Cuenta regresiva | voz de control de misión "T-minus ten… Ignition… Liftoff!" + frase de despedida variable (inglés); sin música hasta el despegue | generado; falta descargar |
| Eventos / decisiones | efecto corto de alerta (no cambia la música) | generado, falta descargar |
| Reporte | "sting" de éxito o de fracaso (sin música de fondo) | generado, falta descargar |
- Versiones finales largas y en loop (crossfade); audio apagado hasta el primer clic; botón de silencio; voces en inglés con subtítulos.
- Confirmar la licencia de ElevenLabs antes de una publicación comercial (LOCAL_TODO).

### 19.5 Videos: probar distintos formatos sin alejarse del juego
- Comparar el mismo guion de 20–30 s en formatos **16:9** (intro dentro del juego y demo del jurado), **9:16** (redes) y **1:1**; y en estilos: (a) ilustración + movimientos de cámara (prueba actual), (b) animación 2.5D por capas/parallax, (c) clips animados con IA a partir de las ilustraciones, (d) captura real del juego + ilustración (demo).
- Regla de coherencia: misma paleta, tipografía e iconos que el juego (`docs/video-style.md`); cada video termina en la pantalla de inicio real del juego; nada que el juego no tenga.
- La **intro animada la hace el chat LOCAL** con recursos de la PC; la nube deja guiones, assets de referencia y scripts reproducibles (`scripts/video/`).

### 19.6 Diseño visual del juego
- **La nave que diseña el jugador se ve igual en todo el juego:** en el diseño (vista previa), en el launch pad (dentro de la cofia, se revela al separarse y despliega paneles) y durante el viaje (orbita con sus paneles, antena, instrumentos y propulsión).
- Launch pad mejorado: cohete según lanzador (Light / Medium / Heavy con boosters), telemetría (T+, altitud, velocidad, Δv), fases reales explicadas (Max-Q, separación de etapa, cofia, inserción orbital), música B y efectos.
- Tipografía compartida juego/videos: Space Grotesk (títulos) + Inter (texto), licencia OFL, empaquetadas en el proyecto.

### 19.7 Entregable final pedido por el usuario
Al terminar el proyecto: un **texto detallado tipo storytelling** de todos los pasos seguidos, explicando términos y procesos (qué se hizo, por qué y cómo). Registrar los hitos en PROGRESS.md para poder escribirlo.
