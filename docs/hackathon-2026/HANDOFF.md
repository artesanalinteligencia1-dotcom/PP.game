# HANDOFF — Paulet Delta-V · NASA Space Apps Challenge 2026

> **Léelo primero.** Este archivo es la memoria compartida del proyecto. El dueño trabaja desde varias cuentas y sesiones de
> Claude que no comparten historial: todo lo que hay que saber está aquí. **Al terminar cada tarea:** pásala a "Hecho" con
> fecha, actualiza "Pendiente" y "Siguiente paso exacto", y haz commit.
> Explicaciones al dueño en español; código, textos del juego y entrega en inglés.

Última actualización: 2026-11-16 (limpieza final hecha: este archivo ya no está en el repo del concurso; vive aquí, en `PP.game/docs/hackathon-2026/`).

---

## 1. Qué es
- **Equipo:** Paulet Delta-V. **Reto:** [Space Mission Design Game](https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/)
  (dificultad Intermedia y Principiante/Juvenil, tema Juegos).
- **Qué piden:** un juego interactivo donde de 1 a 4 personas diseñan, gestionan y simulan una misión completa (objetivo,
  nave, instrumentos, lanzador, órbita, presupuesto, potencia, masa, comunicaciones, datos, vida útil), viendo cómo cada
  decisión afecta a las demás, con simulación, evaluación y explicación de por qué la misión funcionó o falló.
- **Nuestra propuesta:** una versión nueva para el concurso de *Paulet: Andes to Orbit*. Las ideas creativas son del dueño;
  se reutilizan el conocimiento y los recursos de la primera versión, declarados en Referencias.
- **Este repositorio** (`artesanalinteligencia1-dotcom/paulet-spaceapps-2026`, público desde el 2026-11-15) es el del concurso.
  Hacerlo público antes de entregar si el enlace del proyecto final apunta aquí.
- **Dónde vive hoy el código del juego (2026-11-14):** en `artesanalinteligencia1-dotcom/PP.game`, rama `cloud/fase-1`,
  clon `C:\PPgame\PP.game`, último commit `c58b78b`. **Ojo:** los 4 últimos commits (`b4a191d`, `1cf10ed`, `8937f2f`,
  `c58b78b`) están solo en la PC del dueño hasta que él haga `git push origin cloud/fase-1` desde su terminal.
  **Decidido el 2026-11-14: el código del concurso vive en este repo, en `game/`.** Se trajo ese estado (commit
  `c58b78b` de PP.game) como base declarada; todo lo nuevo del concurso se hace aquí. Cómo correrlo: `cd game`,
  `npm ci`, `npm run dev` (puerto 5173), `npm test`. El historial y los documentos técnicos de la base están en
  `game/PROGRESS.md`, `game/DECISIONS.md`, `game/docs/model.md` y `game/HANDOFF.md` (este último es el de la primera
  versión; para el concurso manda este archivo).

## 2. Fechas (hora del evento local del equipo)
| Cuándo | Qué |
|---|---|
| Sáb 14 nov 2026, 9:00 | Abre la entrega: aparece la pestaña "Project" en la página del equipo |
| Dom 15 nov 2026, 23:59 | **Cierre.** Lo no enviado con "Submit for Judging" no se evalúa |
| 3 dic 2026 | Nominados globales |
| 17 dic 2026 | Finalistas globales y menciones |
| 26 ene 2027 | Ganadores globales |

## 3. Reglas de la entrega (de las guías oficiales, leídas el 2026-11-14)
- Guías: [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/) ·
  [Judging & Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide/).
- Equipo de 1 a 6, todos inscritos y confirmados en el **mismo evento local** (no en lista de espera).
- Campos: nombre, resumen, **enlace a la demo**, **enlace al proyecto final** (público, sin contraseña ni registro),
  descripción detallada, uso de IA ("Super Intelligence"), **datos de NASA usados** (mínimo uno para premio global),
  otras referencias (todo código, texto, imagen o dato externo, aunque sea abierto).
- **Demo = diapositivas** (decidido): máximo **7**, contando título e intro, en inglés. Si se pasa, queda fuera de la evaluación global.
  Debe mostrar: nombre del equipo, integrantes, reto, imagen del proyecto, experiencia del usuario, cómo los datos de NASA lo hacen posible.
- Todo en inglés (página y materiales enlazados).
- **IA:** imágenes y videos generados llevan **marca de agua visible**; audio, código y datos generados se declaran en el texto
  y en los metadatos. La IA no debe usarse para concebir la idea de solución.
- **Nada de logos, banderas ni identificadores de misión de NASA** en contenido generado.
- **Nada de imágenes, video, audio ni semejanza de menores de 18** en la demo ni en el proyecto.
- Sin material con derechos de autor sin permiso. Imágenes subidas a la página: JPG/PNG/GIF hasta 10 MB; videos y documentos solo por enlace.
- Si el juego vive en un dominio nuevo, pedir la clasificación de FortiGuard (opcional) para que los filtros de los jueces no lo bloqueen.
- Se puede guardar y reenviar todas las veces que se quiera antes del cierre; vale el último envío.

## 4. Cómo juzgan (1 a 5 cada uno)
| Criterio | Qué premia | Nuestro ángulo |
|---|---|---|
| Impact | Tamaño del problema y alcance | Educación gratuita, offline, bilingüe, para escuelas con poca conexión |
| Creativity | Originalidad | Diseñar bajo trade-offs reales con historia, roles y música |
| Validity | Ciencia sólida, factible, usable | Fórmulas documentadas y probadas; un juez entiende y juega en 60 s |
| Relevance | Responde de lleno al reto; datos de NASA como núcleo | Recursos de NASA visibles dentro del juego (ver §6) |
| Presentation | Historia clara y atractiva (demo + proyecto) | Nuestro punto fuerte |

Premios con más afinidad: Best Storytelling, Art & Technology, Best Mission Concept, Most Inspirational, Local Impact.

## 5. El reto frente a la primera versión
| Lo que pide el reto | Primera versión (PP.game) | Estado |
|---|---|---|
| Objetivo y requisitos de misión | Briefing, pestaña Mission, contratos | hecho |
| Nave: estructura, energía, baterías, comms, computadora, actitud; simple/avanzado | Pestaña Spacecraft | hecho |
| Instrumentos con masa, potencia, costo, datos, valor científico | Catálogo de 12+ instrumentos | hecho |
| Órbitas explicadas; lanzador compatible con masa y órbita | Orbit & Launch + revisión bloqueante | hecho |
| Recursos visibles (masa, potencia, presupuesto, datos, comms, tiempo) | Panel en vivo con deltas | hecho |
| Hasta 4 personas con roles que negocian | Modo equipo: reparto del dinero por áreas, metas por rol y de grupo, revisión con voto y veto, Kuntur en asientos vacíos; 100 puntos de negociación | hecho (2026-11-14) |
| Simulación, puntuación, análisis post-misión | Simulación con semilla, 0–1000, 3 causas | hecho |
| Dificultades, escenarios, eventos, sandbox | Cadete/Investigador/Director, contratos, sandbox | hecho |
| Guardar, compartir, comparar; ranking | Guardado, enlaces, retos por enlace, trade study de dos opciones y ranking por misión (solo / equipo / nombres de la sala) | hecho (2026-11-14) |
| Enseñar el por qué | Revisión explicada, lecciones | hecho |

## 6. Recursos oficiales del reto (pestaña Resources, publicados) y cómo usarlos
| Recurso | Uso propuesto en el juego |
|---|---|
| Design and Develop Science Missions (segmentos: lanzamiento, espacio, tierra, usuario) | Organizar pestañas y roles por segmento y nombrarlos así |
| Concept Maturity Levels (JPL) | Barra de madurez: la misión sube de CML 1 a CML 4 al cerrar decisiones |
| Mission Design Lab (NASA MDL) | Fases de la partida en equipo; "trade study" que compara dos diseños |
| GMAT | Validar Δv de transferencias y L2 del motor; citar cifras comparadas |
| NASA Mission Viz | Referencia visual de la vista de órbita; enlace "ver una misión real" |
| A Learning Game About Telescopes | Al final, mostrar la misión real de NASA más parecida a tu diseño |
| CubeSat 101 | Escenario de inicio con CubeSat para el nivel Cadete |
| Visualize a Space Mission Using VR (reto 2023) | Inspiración para la línea de tiempo de la misión |
| CSA — Digital Games and Activities | Citar como dato de socio espacial |

Fuentes de NASA ya usadas en la primera versión: NASA Glenn *Beginner's Guide to Aeronautics* (ecuación del cohete, Isp,
etapas), JPL *Basics of Space Flight*, NASA Mars Fact Sheet (NSSDCA), páginas de Mars Reconnaissance Orbiter,
*NASA Systems Engineering Handbook*.

## 7. Global Offers (página leída con sesión el 2026-11-14)
| Oferta | Qué da | Cómo | ¿Pide tarjeta? | Para nosotros |
|---|---|---|---|---|
| Miro Board Templates | Hackathon Template Board y Project Coach Board | "Use Template" e iniciar sesión | No | **Pedir ya**: tablero del equipo |
| Miro Education | Gratis 2 años (estudiantes), siempre (educadores) | "Apply as student/educator" | No | Pedir si aplica |
| Miro Business | 14 días gratis | Desde la página de precios | **Sí**; cancelar antes del día 14 | No hace falta |
| GitHub Copilot Free | 2000 completados/mes + chat limitado | Iniciar sesión en GitHub, plan Free | No | Pedir: respaldo de código |
| Microsoft Copilot | Asistente de IA gratis | copilot.com | No | Opcional |
| Microsoft Teams Free | Reuniones de 60 min hasta 100 personas | Cuenta Microsoft | No | Si el equipo lo usa |
| Planetary Computer | Catálogo de datos ambientales y API STAC | Sin cuenta | No | Solo si usamos datos de Tierra |
| Microsoft Azure | USD 200 por 30 días (cuentas nuevas) | "Try Azure for Free" | **Sí**, verificación | Solo si hace falta servidor |
| Google Cloud | USD 300 por 90 días; Firebase, Maps | "Get started for free" | **Sí**, verificación; sin cobro automático | **Útil**: Firebase para ranking o multijugador en tiempo real |
| Meteomatics | 1000 consultas/día de clima, durante el hackathon | Formulario | No | No aplica al reto |
| Dominio + hosting (GoDaddy Registry, vía Porkbun) | Dominio no premium + 1 año de hosting + SSL | Buscar dominio, datos de contacto, código por correo | No | Opcional: dominio propio para el enlace |

La tarjeta, si se usa, la ingresa el dueño en la página del proveedor; nunca Claude.

## 8. Decisiones tomadas
| Fecha | Decisión | Por qué |
|---|---|---|
| 2026-11-14 | Reto: Space Mission Design Game | Encaja punto por punto con la primera versión |
| 2026-11-14 | Demo en diapositivas (7 máx.); el video vive dentro del juego | El video de 30 s es muy corto para mostrar el juego |
| 2026-11-14 | Repositorio nuevo para el concurso, reutilizando la primera versión con referencias declaradas | Originalidad y orden; la primera versión sigue aparte |
| 2026-11-14 | Nueva toma de la intro sin Goicochea niño | Regla de menores de 18 |
| 2026-11-14 | Marca "AI-generated" visible en imágenes y video; declaración de IA en texto y metadatos | Regla de la entrega |
| 2026-11-14 | Reparto: el dueño hace la parte creativa; Claude código, datos y página de entrega en inglés | Pedido del dueño |
| 2026-11-14 | **El código del concurso vive en este repo**, en `game/`: se trae el estado actual de *Paulet: Andes to Orbit* (PP.game, commit `c58b78b`) como base declarada y lo nuevo del concurso se hace aquí; despliegue aparte en Vercel | Respuesta del dueño; originalidad y orden |
| 2026-11-14 | **Equipo de 4: se combinan los tres mecanismos.** (1) Votación con veto en las decisiones grandes y en la revisión antes de lanzar; (2) el dinero se reparte por áreas según lo que más importa en cada misión (cambia de misión a misión); (3) cada rol tiene metas propias y además hay una meta de grupo | Respuesta del dueño; hueco más grande frente al reto, pesa en Creativity |
| 2026-11-14 | **Si juega una sola persona:** puede llevar varios roles, o Kuntur lleva uno o varios | Respuesta del dueño (ya estaba en la idea original) |
| 2026-11-14 | **Arco de una partida corta (5–10 min): "Una promesa a Paulet".** Goicochea adulto recibe en Arequipa un contrato que termina lo que Paulet empezó; diseñas, lanzas y el informe final se lee como una carta o bitácora | Respuesta del dueño; Presentation y Best Storytelling |
| 2026-11-14 | **Legado: "Valores de Goicochea".** Tres valores (rigor, audacia, servicio a la gente); cada decisión inclina uno, y el informe dice qué Goicochea fuiste y qué habría pensado Paulet (sus hechos siempre como "afirmados") | Respuesta del dueño; Creativity y Validity |
| 2026-11-14 | **Roles en la ficción: "El equipo de Goicochea".** Cada rol es un personaje del instituto de Goicochea en Arequipa, con una línea de motivación que explica su meta propia; Kuntur ocupa los asientos vacíos | Respuesta del dueño; Creativity y Best Storytelling |
| 2026-11-14 | **Informe final: "Carta a Paulet".** Goicochea escribe a la memoria de Paulet qué salió bien, qué falló y por qué, firmada con el valor que dominó (rigor, audacia o servicio); los números van debajo | Respuesta del dueño; el reto pide explicar el porqué (Validity, Presentation) |
| 2026-11-14 | **Nueva intro: "Goicochea y el cuaderno".** Amanecer en una azotea de Arequipa con el Misti detrás; Goicochea adulto abre el cuaderno de Paulet, Kuntur despliega sus alas y le pasa la misión al jugador. Sin menores; marca "AI-generated" si hay imagen o video generado | Respuesta del dueño; regla de menores de 18 |
| 2026-11-14 | **Diapositiva 2 (gancho): "Una promesa de 130 años".** Paulet afirmó en 1895 haber probado un motor de combustible líquido (siempre "afirmado"): ¿qué haría falta para terminar hoy lo que empezó? El juego es la respuesta | Respuesta del dueño; Presentation |
| 2026-11-14 | **Multijugador en línea con Firebase** (Realtime Database, plan gratis Spark, proyecto creado por el dueño): uno crea la sala e invita con un enlace; cada uno pone su nombre y elige su perfil (rol); juegan juntos. Se mantiene también el modo de un solo dispositivo | Pedido del dueño; hueco más grande frente al reto |
| 2026-11-14 | **Personajes del equipo de Goicochea:** Goicochea (Director de misión), **Chicho** (Ingeniero de la nave), **Roberto** (Astrofísico), **Franchesca** (Astrobióloga). Todos adultos y ficticios | Respuesta del dueño |
| 2026-11-14 | **Ranking:** comparación lado a lado de dos diseños ("trade study", como el Mission Design Lab de NASA) + ranking por misión en el dispositivo, compartible con los retos por enlace; sin servidor | Respuesta del dueño; Relevance |
| 2026-11-14 | **Valores de Goicochea visibles:** tres barras en vivo en el panel del diseño (rigor, audacia, servicio) y la carta a Paulet firmada con el valor que dominó | Respuesta del dueño; Creativity |
| 2026-11-14 | **Diapositivas:** 1 título, equipo, integrantes y reto · 2 "Una promesa de 130 años" · 3 el juego en una imagen · 4 cómo negocia un equipo de 4 · 5 datos y recursos de NASA dentro del juego · 6 impacto (gratis, sin conexión, bilingüe) · 7 equipo, enlace y QR | Respuesta del dueño; Presentation |
| 2026-11-14 | **Dirección visual: mezcla A + B.** "Mission control" (oscuro sobrio, cifras grandes, una acento naranja, etiquetas monoespaciadas) en el taller de diseño; "Paulet's notebook" (papel, tinta, serifa Fraunces, notas a mano, franja textil andina) en los momentos de historia: tutorial, sesión informativa y Carta a Paulet | Elegida por el dueño entre 3 prototipos (`game/proto-directions.html`); pedido 14 |
| 2026-11-14 | **Kuntur: cóndor geométrico andino** (líneas planas y escalonadas inspiradas en el arte textil y de piedra andino), animado con GSAP | Respuesta del dueño |
| 2026-11-14 | **Diapositiva 3: escena del equipo** (Goicochea, Chicho, Roberto y Franchesca, adultos, alrededor de la mesa con el juego), imagen con Gemini del dueño y marca "AI-generated" | Respuesta del dueño |
| 2026-11-14 | **Tono de la Carta a Paulet: personal y luego técnica**: dos líneas emotivas de Goicochea y después el porqué técnico del resultado | Respuesta del dueño |
| 2026-11-15 | **Estilo de consola de control** (imagen de referencia del dueño): paneles grafito con franja de título, crema y dorado, naranja para rutas y botones, magenta solo para alarmas, Barlow Condensed y el logo PAULET (E de tres barras). Reemplaza la mezcla A + B | Pedido del dueño: "que el videojuego se vea como la imagen de la izquierda" |
| 2026-11-15 | **Adiós a las hojas blancas:** los momentos de historia (tutorial, sesión informativa, intro y, cuando exista, la carta) son "transmisiones" del mismo estilo de consola | El dueño: "no tienen nada que ver con el diseño del juego" |
| 2026-11-15 | **Cabina de vuelo** en el lanzamiento real, con vuelo 4 veces más largo tras el despegue (ritmo 4), velocidades 1×/2×/4× y saltar | Pedido del dueño: ver todo el recorrido con varias cámaras |
| 2026-11-15 | **Realismo 3D separado como tarea para Fable** (sesión aparte que comparte la carpeta; solo toca `game/src/ui/launch/three/*`) | Pedido del dueño: "lo que necesites a Fable sepáralo como tarea" |
| 2026-11-15 | **Sin superposiciones:** cuadrícula fija para 1440×810, modales con fondo atenuado y una auditoría automática (`__overlapAudit()` en desarrollo) | Pedido del dueño: "revisa que no sobretoquen los objetos" |
| 2026-11-15 | **Carta a Paulet como transmisión de consola:** se escribe en vivo con el estilo nuevo, firmada con el valor dominante y con los números debajo (sin voz, sin costo) | Respuesta del dueño |
| 2026-11-15 | **Diapositiva 5: la vista Mapa del vuelo real** (Tierra Blue Marble/Black Marble, ruta desde Arequipa, órbita) con 3–4 etiquetas que señalan cada dato de NASA | Respuesta del dueño; Relevance |
| 2026-11-15 | **Si la misión falla: carta + reintento.** Goicochea escribe igual a Paulet (qué aprendió) y Kuntur ofrece reintentar con la misma semilla cambiando lo que falló | Respuesta del dueño; Storytelling y Validity |
| 2026-11-15 | ~~Nombre del proyecto en la entrega: "Paulet: A 130-Year Promise"~~ | Reemplazado esa misma noche (fila siguiente) |
| 2026-11-15 (noche) | **Nombre del proyecto en la entrega: "Paulet: Andes to Orbit"**. "Paulet: A 130-Year Promise" es la versión que se desarrollará después de la hackathon. "Una promesa de 130 años" sigue solo como frase de la historia (gancho, narración del Prólogo, intro) | Pedido del dueño |
| 2026-11-15 | **Repo del concurso público** (pedido del dueño). La configuración web de Firebase es pública por diseño; la base sigue en modo de prueba | Enlace al código en la entrega |
| 2026-11-15 | **Historia de los videos de acto** (`docs/act-videos.md`): los cuatro aparecen en el Prólogo (el Acto 1 ya necesita a la astrobióloga); Goicochea, Chicho y Roberto son compañeros de universidad en Arequipa; Franchesca, peruano-estadounidense, busca vida en los Andes y vuelve a sus raíces; se conocen en un bar de salsa del Callao | Respuestas del dueño |
| 2026-11-15 | **Un hito real por acto**: Paulet (afirmado), primer satélite y el cohete privado que falló 3 veces y llegó a órbita en el 4.º intento (2008), Apollo y L2, Viking y MOXIE, el auto lanzado en 2018 | Respuesta del dueño |
| 2026-11-15 | **Dilema "¿son capaces?"**: dinero contra ciencia con los cuatro personajes; tres fallos y éxito al cuarto en el Acto 1; noticiero, redes con referencias a la cultura peruana, reunión con inversores y un fallo real | Respuesta del dueño |
| 2026-11-15 | **Final del Acto 4**: el **Paulet 1** (reconstrucción del Avión-Torpedo de Paulet, 1902) en órbita, como homenaje al auto de 2018 + última carta a Paulet | Respuesta del dueño |
| 2026-11-15 | **Videos de acto en ilustración animada**, imágenes con IA no china (Nano Banana, GPT Image, Veo). **Además** una versión con modelos chinos en `media/act-videos/optional-cn/` (fuera del repo), solo para publicar si un asesor lo permite | Respuesta del dueño |
| 2026-11-15 | **Equipo Paulet Delta-V, evento local Trujillo (Perú). Integrantes: Cristhian Ramos Goicochea (fundador), Rooney Ramos Goicochea, Diana Namoc Portilla.** Ya están en la diapositiva 1 y en `docs/SUBMISSION.md` | Respuesta del dueño |
| 2026-11-15 | **Hoja de personajes aprobada** (imagen del dueño): `media/act-videos/main/ref-characters.jpg` (copia en `media/characters/`). Se sube como referencia en cada chat de Gemini; no se vuelve a generar | Respuesta del dueño |
| 2026-11-15 | **Herramientas chinas: el organizador local dice que se pueden usar**; lo único prohibido es poner a una IA china como colaboradora en la página del proyecto. Se mantiene la versión principal sin modelos chinos y `optional-cn/` aparte | Respuesta del organizador local por WhatsApp |
| 2026-11-15 | **Video educativo al final de cada misión** sobre el contexto real que la inspiró (`docs/mission-videos.md`): animación por código en la PC (HyperFrames), voces ElevenLabs (narrador + una línea de personaje), subtítulos EN/ES | Pedido del dueño |

## 9. Hecho
- [x] 2026-11-14 · Lectura de las guías de entrega y jurado, del reto, sus recursos y las Global Offers.
- [x] 2026-11-14 · Manual técnico de la primera versión (historia, herramientas, física, método con IA, reglas del concurso):
      `C:\PPgame\MANUAL_TECNICO_PAULET.html`, publicado en https://claude.ai/artifact/F6c9mVkKBPLeQ24E2UaK3d (privado).
- [x] 2026-11-14 · Repositorio del concurso creado (privado) con este HANDOFF.
- [x] 2026-11-13 · (en `PP.game`, rama `cloud/fase-1`) Taller del Ingeniero de cohetes: piezas, masa / empuje / Δv en vivo, vista 3D, tu cohete en misiones y carrera.
- [x] 2026-11-13 · (en `PP.game`) Laboratorio del Astrobiólogo con vista 3D de seis mundos.
- [x] 2026-11-13 · (en `PP.game`) Multijugador asíncrono: "retos por enlace" (mismo escenario y semilla, gana el mejor puntaje).
- [x] 2026-11-13/14 · (en `PP.game`) Acto 3, Marte, jugable completo: ventanas de lanzamiento cada 25,6 meses, retardo de radio,
      conjunción, aerofrenado; misiones "Red Horizon" (orbitador), "Stranded" (aterrizaje con escudo, paracaídas y
      retrocohetes) y "Breathing Mars" (planta de oxígeno del CO₂, referencia MOXIE). Fórmulas en `PP.game/docs/model.md` §22–24.
- [x] 2026-11-14 · (en `PP.game`) Robot guía **Kuntur** (elegido por el dueño entre tres): pistas en el diseño, explicación
      del resultado tras cada misión y tutorial de la primera misión, en inglés y español.
- [x] 2026-11-14 · `PP.game`: 229 pruebas en verde; build de producción correcto.
- [x] 2026-11-14 · Código traído a este repo en `game/` (base declarada: PP.game `c58b78b`); 229 pruebas en verde aquí.
- [x] 2026-11-14 · **Modo equipo de hasta 4** (`game/src/engine/team.ts`, `game/src/store/team.ts`, `game/src/ui/team/`):
      en la pestaña Mission se elige 1–4 jugadores y quién lleva cada rol (o Kuntur); el dinero se reparte por áreas según
      las prioridades de la misión (se puede renegociar con deslizadores); cada rol ve su meta en privado ("show my goal",
      se pasa el dispositivo) y hay una meta de grupo; antes de lanzar, revisión de diseño con aprobar / rechazar / vetar
      (3 de 4 y sin veto). El informe suma "Team negotiation" (0–100) y muestra la tabla del equipo. Fórmulas en
      `game/docs/model.md` §25. Probado en el navegador de punta a punta (2 jugadores + Kuntur: 3 de 4 aprobaron, misión
      completa, 73/100 de negociación). Capturas: `docs/screenshots/team-panel.jpg`, `docs/screenshots/team-design-review.jpg`.
      239 pruebas en verde.
- [x] 2026-11-14 · Entrevista creativa, tres rondas (decisiones en §8).
- [x] 2026-11-14 · **Multijugador en línea** (`game/src/online/`, `game/src/store/online.ts`, `game/src/ui/online/`): crear sala,
      enlace `?room=CODE`, unirse con nombre, tomar un rol (personajes Goicochea, Chicho, Roberto y Franchesca, con su frase),
      diseño y reparto compartidos en vivo, metas privadas por jugador, votación en línea (cada uno vota sus roles) y
      "Launch together": todos vuelan la misma misión. Probado con dos pestañas (backend local): misma semilla, mismo
      puntaje (866) y 83/100 de negociación. **Falta solo conectar Firebase** (configuración del dueño). Reglas en
      `game/database.rules.json`, plantilla en `game/.env.example`. 244 pruebas en verde.
- [x] 2026-11-14 · **Firebase conectado** (proyecto `paulet-spaceapps`, plan Spark gratis, Realtime Database en us-central1,
      `https://paulet-spaceapps-default-rtdb.firebaseio.com`). La configuración está en `game/.env.local` (no se sube; no es
      secreta). Probado con dos pestañas sobre Firebase real: unirse por enlace, tomar roles, diseño compartido, votación
      3 de 4 y "Launch together"; los dos vieron la misma misión (semilla 766479, 807 puntos). El dueño publicó las reglas.
- [x] 2026-11-14 (noche) · **Más contexto y un Kuntur que responde** (pedidos 15, 16 y 19, primera parte):
      tutorial de 11 pasos (cómo llegó Pedro, su equipo Chicho/Roberto/Franchesca, quién paga y qué son los
      inversionistas, qué son las estrellas) con botón **Atrás**; **sesión informativa por misión** la primera vez que se
      abre cada una (de qué trata en palabras simples, qué hay que entregar, por dónde empezar; textos `brief.<misión>`);
      **preguntas a Kuntur** en cada pestaña con respuestas calculadas del diseño, sin internet ("¿De qué trata esta
      misión?", "¿Qué hago ahora?", "¿Qué son las estrellas?", "¿Qué instrumento necesito?", "¿Tengo suficiente
      energía?", "¿Bajan suficientes datos?"…); **franja de contexto** arriba de cada pestaña: qué decides aquí, por qué
      importa y qué pide esta misión en esa pestaña (✔/○). Archivos: `game/src/ui/guide/lines.ts`, `GuideDock.tsx`,
      `game/src/ui/tabs/TabContext.tsx`. Probado en el navegador con Vigía de la Tierra. 247 pruebas en verde.
      **Falta que el dueño lo valide** jugando Vigía de la Tierra.
- [x] 2026-11-14 · **Trade study y ranking** (`game/src/engine/trade.ts`, `game/src/ui/tabs/TradeStudy.tsx`,
      `game/src/store/leaderboard.ts`): en Review se guarda el diseño como opción A o B y se comparan con el actual en 9
      métricas (requisitos, costo, margen del lanzador, margen de energía, datos, mes de lanzamiento, vida, ciencia,
      probabilidad de éxito), con el mejor en verde y "mejor en n". Ranking de los 5 mejores vuelos por misión en el
      dispositivo, visible en la pestaña Mission y en resultados, con quién voló (solo, equipo de n o los nombres de la
      sala). 247 pruebas en verde.
- [x] 2026-11-14 (noche) · **"Play online" desde el menú principal** (pedido 17): ventana con nombre, **crear sala eligiendo
      cualquiera de las 10 misiones** (entra directo al diseño compartido) o **unirse con el código de 6 letras** (también
      acepta pegar el enlace). `OnlineLobby` en `game/src/ui/online/OnlinePanel.tsx`, `parseRoomCode` en
      `game/src/online/room.ts`, prueba `game/tests/onlineLobby.test.ts`. Probado en el navegador sobre Firebase real con
      dos pestañas: sala de Storm Tracker creada desde el menú y segunda pestaña unida por código. 250 pruebas en verde.
- [x] 2026-11-14 (noche) · **Nuevo aspecto visual, mezcla A + B** (pedidos 14 y 18b, primera parte). A "Mission control" en
      todo el taller: fondo grafito con retícula, tarjetas de 16 px por cada sección (`Section` → `.mc-card`), etiquetas
      monoespaciadas naranjas, encabezado con el nombre grande y pasos numerados 01–06, texto más grande en las pestañas,
      barras redondeadas y cifras grandes (ciencia, probabilidad de éxito). B "Paulet's notebook" (`.paper`: papel, serifa
      Fraunces, franja textil andina) en el globo de Kuntur durante el tutorial y la sesión informativa de cada misión.
      **Kuntur redibujado como cóndor geométrico andino** (alas escalonadas, collar en zigzag, cresta escalonada) con GSAP:
      planea en reposo, aletea al cambiar de ánimo y asiente al hablar. **Coreografía GSAP** (`game/src/ui/motion.ts`):
      las tarjetas suben en cascada al cambiar de pestaña; en el informe, la tarjeta del puntaje entra, el puntaje cuenta
      hacia arriba, las barras se llenan y las causas aparecen en orden. Todo se apaga con "movimiento reducido".
      Fuentes nuevas (OFL): Fraunces, JetBrains Mono y Caveat cargadas en `main.tsx`. Revisado en el navegador (Earth
      Watch); el informe animado no se revisó a ojo todavía. 250 pruebas en verde.
- [x] 2026-11-14 (noche) · **Intro sin Goicochea niño** (punto 4): se quitó `game/src/assets/video/intro.mp4` del repo del
      concurso y "Watch intro" ahora es una escena hecha en código, "Goicochea y el cuaderno": amanecer en Arequipa, 5
      páginas del cuaderno de Paulet (estilo B) con GSAP, Kuntur entra volando al final. Sin personas en pantalla. Textos
      `intro.scene.*` e `intro.hand.*` (inglés y español). **Ojo:** el video viejo sigue en el historial de git; si el repo se
      hace público, decidir si se limpia el historial o se entrega otro enlace.
- [x] 2026-11-14 (noche) · **Prototipo del nuevo HUD de vuelo** (pedido 20), `?proto=flight` (`game/src/ui/proto/FlightHud.tsx`,
      `flightTelemetry.ts`, logo `game/src/ui/brand/PauletLogo.tsx`): marco grafito con el logo PAULET (E de tres barras),
      MET y fase, pausa/velocidad; paneles "Orbital telemetry" (con globo), "Ascent loads" (barras de calor), gráficas en
      vivo, "Propulsion & staging" (medidores Δv por etapa y propelente), registro de eventos; actitud con escalera de
      cabeceo y cintas de velocidad/altitud; **cámaras en vivo** Ground (teleobjetivo que sigue al cohete), Chase, Onboard
      (cámara en la etapa superior mirando hacia abajo) y Map (globo con trayectoria desde Arequipa y órbitas), más un
      **visor pequeño con una segunda cámara** (`LaunchScene3D` acepta `views`). Telemetría con cifras realistas de un
      ascenso a ~200 km (solo para mostrar). Probado en el navegador en las cuatro vistas. **Falta la aprobación del dueño**
      para integrarlo al juego. **Tutoriales de medios** en `docs/tutoriales/` (imágenes con Gemini, video con Veo, texturas
      de NASA Blue/Black Marble, montaje con HyperFrames).
- [x] 2026-11-15 · **Texturas reales de NASA** (descargadas con permiso del dueño): Blue Marble NG julio 2004 y Black Marble
      2016, reducidas en `game/src/assets/textures/` (1,5 MB; fuentes en `SOURCES.md`), en el caché sin conexión.
- [x] 2026-11-15 · **Cabina de vuelo en el lanzamiento real** (`game/src/ui/flight/`): telemetría hacia la órbita de cada
      misión (altitud, velocidad orbital √(μ/r), inclinación y rumbo desde Arequipa por trigonometría esférica), cargas
      del ascenso, gráficas, propulsión y etapas, eventos (con aterrizaje del propulsor y fallas), cintas de actitud,
      cámaras Ground/Chase/Onboard/Map (teclas 1–4) con interferencia al cambiar, segundo visor en vivo (ahí se ve el
      aterrizaje del propulsor), mapa del recorrido sobre la Tierra de NASA (día/noche, terminador del amanecer) y
      tarjetas de preparación y de resultado. Vuelo con ritmo 4 y velocidades 1×/2×/4× que reprograman los sonidos.
      Probado de punta a punta con Earth Watch: llega a 700 km y 7 508 m/s.
- [x] 2026-11-15 · **Estilo de consola en todo el juego** (logo PAULET en inicio y menú, paneles con franja de título,
      Barlow Condensed), **tarjetas de transmisión** en vez de papel, **intro sobre la plataforma 3D real** con texto que
      se decodifica y despegue final, **transiciones** entre pantallas (Motion) y modales.
- [x] 2026-11-15 · **Auditoría de superposiciones** (`game/src/ui/dev/overlapAudit.ts`): menú, taller (6 pestañas × 4
      posiciones de scroll), lanzamiento (antes, durante y al final), intro, learn, rocket, astro y sala en línea: 0
      superposiciones y 0 textos desbordados. Corregido además un desplazamiento de toda la pantalla (fondo al 110 %).
- [x] 2026-11-15 · **Sesión aparte para Fable** ("Fable: realistic 3D launch scene and orbit view"): Tierra con texturas
      NASA en 3D, vista que se aleja hasta la órbita, llama y humo realistas, luz y cámaras. Comparte la carpeta; hace
      commits solo de `game/src/ui/launch/three/*` y no hace push (lo hace la sesión principal).
- [x] 2026-11-15 · **Resumen de storytelling** en `docs/storytelling.md`.
- [x] 2026-11-15 · **Recursos de NASA dentro del juego** (punto 6): pantalla "NASA data" (menú principal y pestaña en
      Aprender) con 19 fuentes en cuatro grupos (datos, métodos, recursos del reto que usa el juego, lecturas), qué toma el
      juego de cada una y dónde aparece; todas las URL verificadas el 2026-11-15 (`game/src/engine/nasaSources.ts`). Notas
      "Source: NASA …" bajo cada pestaña del diseño, cada lección y el mapa de la cabina (`game/src/ui/SourceNote.tsx`).
- [x] 2026-11-15 · **Valores de Goicochea** (`game/src/engine/values.ts`, 3 pruebas): rigor, audacia y servicio con medidas
      simples y visibles, en barras en vivo en el panel del diseño.
- [x] 2026-11-15 · **Carta a Paulet** en el informe (`game/src/ui/results/LetterToPaulet.tsx`): transmisión de consola,
      dos líneas personales según el resultado (éxito, parcial o falla) y el valor dominante, las causas reales de la
      misión, lo aprendido, firma con el valor y reintento con la misma semilla. Probado con falla y con parcial.
- [x] 2026-11-15 · Pedidos reenviados por la sesión 3D: **"Muéstramelo"** abre la pestaña y hace pulsar la sección exacta
      (y las pistas muestran los dos caminos); **gráficas legibles** ("backlogGb" → "Datos esperando a bordo (GB)").
- [x] 2026-11-15 · Panel lateral del diseño compacto (no se sale del escenario ni choca con los botones). Auditoría limpia.
- [x] 2026-11-15 · PR #1 (`fable-3d-wip`) fusionado en GitHub por el dueño; integrado en `main` sin tocar la carpeta de la
      sesión 3D, que sigue trabajando (en Opus).
- [x] 2026-11-15 noche · **Modo en línea corregido y probado con 2 pestañas** (`?roomBackend=local`, commit `1383a2d`), ver
      punto 31 de Pendiente.
- [x] 2026-11-15 noche · **Pedidos del dueño tras jugar con 3 personas** (commit `3e35943`), ver punto 33.
- [x] 2026-11-15 noche · **Nombre "Paulet: Andes to Orbit" en todo lo de la hackathon:** demo `/deck/` (título, portada y
      pie de la diapositiva 2), `docs/SUBMISSION.md` (nombre y resumen, ahora 1443 caracteres), `docs/storytelling.md` y la
      tarjeta final de las películas del Prólogo y del Acto 4 (re-renderizadas con `media/video-kit/tools/publish.py`).
      El juego ya decía "Andes to Orbit".
- [x] 2026-11-15 noche · **Demo `/deck/` centrada en cualquier pantalla:** en ventanas de menos de 1920×1080 (laptops
      de 1366×768, teléfonos) la diapositiva quedaba corrida y cortada; ahora se centra con `translate(-50%,-50%) scale()`.
- [x] 2026-11-16 · **Celular y tableta en horizontal** (commit `3ee3281`): en vertical aparece "Gira tu dispositivo";
      al primer toque, pantalla completa y bloqueo horizontal donde el navegador lo permite (Android Chrome; en iPhone
      queda el aviso); el escenario se ajusta al área visible real (`visualViewport`); sin zoom por doble toque ni
      recarga al deslizar; "Toca la pantalla para empezar" en pantallas táctiles. `game/src/ui/shell/Stage.tsx`.
- [x] 2026-11-15 noche · **Revisión general final** (navegador, 1024×768): menú, Extras (7 elementos), elegir misión,
      taller (6 pestañas), plataforma, lanzamiento, vuelo con decisión, informe, Aprender, Datos de NASA, Legado,
      Banco de cohetes, Laboratorio, Intro, Caja de arena, Ajustes, Nueva carrera y Campaña, en español y en inglés:
      `__overlapAudit()` 0 superposiciones y 0 desbordes (la tarjeta de Kuntur sobre el informe es flotante a propósito).
      Música por momento verificada. tsc, 262 pruebas y build OK. El error de consola "createRoot() … already passed"
      solo aparece en desarrollo con recarga en caliente.

## 10. Pendiente (en orden)
1. [ ] Confirmar el evento local, que todos estén inscritos ahí (no en espera) y la hora exacta de cierre.
2. [ ] Pedir ofertas: Miro Templates, GitHub Copilot Free; Google Cloud si haremos ranking o tiempo real.
3. [x] (2026-11-15 04:15) **Enlace público en Vercel:** https://paulet-spaceapps-2026.vercel.app (proyecto `paulet-spaceapps-2026`,
   Root Directory `game`, despliega solo con cada push a `main`). Responde 200 sin inicio de sesión, carga sin errores de
   consola y lleva la configuración de Firebase. **Falta:** probar una sala en línea con dos dispositivos y en el teléfono.
4. [x] (2026-11-14, ver §9; queda decidir el historial de git) **Intro actual con Goicochea niño: no puede ir en la entrega** (regla de menores de 18). Hasta tener la nueva toma, quitarla o saltarla en la versión del concurso.
5. [x] (2026-11-15) Historia en el juego: barras de valores, carta a Paulet en el informe, intro nueva.
6. [x] (2026-11-15, ver §9) **Recursos de NASA referenciados DENTRO del juego** (pedido del dueño, 2026-11-14; criterio Relevance):
   - Una pantalla o tarjeta "NASA resources" (desde el menú y desde Learn) que cite cada fuente con enlace y diga qué
     parte del juego se apoya en ella: NASA Glenn *Beginner's Guide to Rockets* (ecuación del cohete, Isp, etapas),
     JPL *Basics of Space Flight* (órbitas, ventanas a Marte), NSSDCA *Mars Fact Sheet*, *NASA Systems Engineering
     Handbook* (márgenes, revisiones), páginas de Mars Reconnaissance Orbiter (aerofrenado), Curiosity/Perseverance y
     Phoenix (aterrizaje), MOXIE (oxígeno), JPL Concept Maturity Levels, *Design and Develop Science Missions*
     (segmentos), Mission Design Lab (trade study), GMAT, CubeSat 101, NASA Mission Viz.
   - Citas en contexto: un "Source: NASA …" pequeño en cada panel que use esos números (Orbit & Launch, ruta a Marte,
     aterrizaje, planta de oxígeno, lecciones, trade study, revisión de diseño).
   - Lo que ya estaba previsto: barra de madurez CML 1–4 (JPL), los cuatro segmentos de una misión, "la misión real de
     NASA más parecida a tu diseño" en el informe, escenario CubeSat para Cadete, validar Δv con GMAT.
   - Sin logos ni insignias de NASA (solo texto y enlaces).
7. [ ] Nueva toma de la intro sin el niño; marca "AI-generated" en imágenes y videos generados.
8. [ ] Quitar cualquier logo o identificador de NASA de los recursos reutilizados.
9. [x] (2026-11-15 06:15) **Diapositivas (7) en inglés, públicas:** https://paulet-spaceapps-2026.vercel.app/deck/ (archivo `game/public/deck/index.html`, capturas reales del juego en `deck/img/`; flechas o clic para avanzar, "All slides" para verlas juntas; fuera de la caché offline). **Falta: escribir los nombres del equipo** en la constante `MEMBERS` del archivo (hoy dice "Team members listed on the project page"). Opcional: cambiar la imagen de la diapositiva 3 por la escena del equipo hecha con Gemini (con marca "AI-generated").
10. [x] (2026-11-15) Página del proyecto en inglés lista para pegar campo por campo: `docs/SUBMISSION.md` (enlaces de demo, juego y código completos). Falta solo pegarla y revisar nombres.
11. [ ] **TRABAJO MANUAL DEL DUEÑO: pegar `docs/SUBMISSION.md` en la pestaña Project, aceptar las dos casillas y pulsar "Submit for Judging" lo antes posible** (cierre hoy 23:59 hora del evento local); reenviar si mejora.
12. [~] Repo público desde el 2026-11-15. Falta: descargar el certificado de participación después de enviar.

### Pedidos del dueño tras probar el juego (2026-11-14, noche) — en sus palabras, resumidos
14. [~] (2026-11-15: estilo de consola aplicado a inicio, menú, taller, lanzamiento, intro y Kuntur; falta revisar a ojo informe, campaña y lista de misiones) **Más atractivo visualmente:** "el juego parece aún muy años 2000". Rediseño visual (decidir mostrando 2–3 variantes, PLAYBOOK regla 3.3).
15. [~] (hecho en parte: franja de contexto, sesión por misión y preguntas; validar con el dueño) **Más contexto al elegir (de Carga útil a Revisión), sobre todo en la primera misión importante (Vigía de la Tierra / Earth Watch):** no quitar lo técnico, pero explicar qué elegir y para qué. El dueño no terminó Earth Watch porque no entendía de qué trataba y tuvo que probar hasta cumplir los requisitos.
16. [~] (hecho sin IA: botón Atrás y preguntas; la IA queda como propuesta, ver Investigación) **Kuntur:** poder volver atrás en los pasos de la guía y poder preguntarle (hoy solo muestra mensajes). Propuesta del dueño (opcional): usar la API de una IA para que ayude en el juego. **Nada de proveedores chinos** (p. ej. DeepSeek): el concurso lo prohíbe.
17. [x] (2026-11-14) **Multijugador también desde el inicio**, para jugar cualquier misión → hecho, ver §9.
18. [x] Investigado (ver "Investigación: animación" abajo). Falta **aplicarlo** (punto 14 y 18b).
18b. [~] (hecho: GSAP en pestañas, informe y Kuntur; falta: escenas 3D con mejor luz) Aplicar la investigación: coreografía con GSAP en briefing, informe y transiciones; Kuntur animado con GSAP; escenas 3D con mejor luz e ilustración.
19. [~] (hecho en texto: tutorial con historia + sesión por misión; faltan imágenes o video con Gemini) **Tutorial al comienzo de cada misión** (o al menos la primera): cómo funciona el juego, qué son los inversionistas, cómo llegó Pedro ahí, quiénes son sus amigos, qué son las estrellas. Se pueden usar imágenes o videos con IA: el dueño tiene **Gemini Pro** (marca "AI-generated" visible).

20. [~] (integrado al juego el 2026-11-15, ver §9; el realismo 3D lo hace la sesión de Fable) **Reestructuración del vuelo con referencias del dueño (2026-11-14):** HUD como su imagen 1 (logo
    PAULET, telemetría, propulsión) con los visores laterales de su imagen 2 (gráficas, barras de calor, alertas); abajo a
    la izquierda y el centro, rediseñados; recorrido completo del cohete con cámaras en vivo (suelo, seguimiento, a bordo,
    mapa) y visor pequeño. Mantener original: instrumentos aeroespaciales reales, sin copiar la interfaz de otro juego.

21. [ ] Traducir al español las etiquetas fijas de la cabina (hoy en inglés técnico: "Orbital telemetry", etc.).
22. [ ] Revisar a ojo el informe animado y la pantalla de operaciones de vuelo (`FlightScreen`) con el nuevo estilo.

23. [x] (2026-11-15) **Música y la regla sobre China — revisada en los Términos y Condiciones 2026.** La regla limita la
    participación por *afiliación* con China o con entidades de propiedad china (gobierno, empresas, universidades) y prohíbe
    *participar, colaborar o coordinar* con ellas en relación con el concurso; aclara que no depende de la nacionalidad.
    Usar un modelo abierto descargado y ejecutado en local (ACE-Step 1.5, licencia MIT) no es afiliación ni colaboración:
    **se mantiene la música y se declara en Referencias.** Por prudencia, evitar servicios en la nube o de pago de empresas
    chinas (Kling, Seedance, Hailuo, Wan, DeepSeek…). Si se quiere certeza, preguntar al Local Lead.
24. [!] (2026-11-15 05:00: la cuenta conectada por el conector MCP está en plan free con 0,95 créditos y **sin** generaciones ilimitadas activas; una imagen de Nano Banana Pro cuesta 2 créditos. La prueba de la captura parece estar en otra cuenta de Higgsfield: reconectar el conector con esa cuenta. En la prueba, los únicos modelos de video ilimitados son Seedance, que es chino) **Higgsfield:** el dueño activó la prueba "Unlimited MCP" de 3 días (captura del 2026-11-15): generaciones ilimitadas
    solo desde Claude o ChatGPT vía el conector MCP de Higgsfield, no en higgsfield.ai. **Termina el 18-nov-2026 y se cobra
    USD 79 si no se cancela la renovación automática** (el dueño debe cancelarla en su cuenta). Usar solo modelos no chinos
    (Nano Banana Pro, GPT Image, Veo, Sora si aparecen); marca "AI-generated" visible. El conector no estaba conectado en la
    sesión que escribió esto: reconectarlo en Conectores antes de generar.
25. [~] (guiones y prompts en `docs/act-videos.md`; **pasos manuales en Gemini en `docs/gemini-manual.md`**; falta generar imágenes y animar) **Videos de introducción por acto** (pedido del dueño): Prólogo (cuadernos de Paulet), Acto 1 Órbita terrestre, Acto 2
    Luna, Acto 3 Marte, Acto 4 Más allá. Propuesta: hechos en código como la intro (transmisión sobre escena 3D/2D) o en
    HyperFrames; guiones por escribir.
26. [ ] **Animaciones durante la misión** (pedido del dueño): visores en la pantalla de operaciones con "lo que ve el
    satélite" (Tierra de NASA pasando bajo la nave con la franja del instrumento), reutilizando `earth3d.ts`/`orbitView.ts`.

27. [x] (2026-11-15: gráficos en vivo y eventos de vuelo ya caben en sus paneles; la etiqueta PITCH no pisa la escala; `__overlapAudit()` sin superposiciones en cabina y operaciones. Queda: la burbuja de Kuntur en el informe tapa parte de la tarjeta de puntaje hasta cerrarla) **Sin superposiciones en el despegue y el vuelo** (pedido del dueño, 2026-11-15, con captura): en la escena 3D,
    al separarse la cofia, las piezas naranjas y la torre se cruzan con el cohete. Pasar `__overlapAudit()` y revisar a ojo
    cada cámara (suelo, seguimiento, a bordo, mapa) y el visor pequeño, en el lanzamiento real y en `?scene3d=`.
28. [x] (2026-11-15: concha con bisagra en la base, se abre a los lados de la cámara —eje de separación girado 90°—, cargas en las costuras, luego se suelta y cae detrás; `LaunchScene3D.tsx`. Probado en `?scene3d=medium&pace=4&t=31.6&view=chase`) **Separación de la cofia ("cabeza del cohete") mejor hecha** (pedido del dueño): hoy se ve mal. Las dos mitades
    deben abrirse como conchas desde la base (bisagra abajo), girar hacia afuera y alejarse con un leve empuje y giro,
    dejando ver la nave con los paneles plegados; humo/destellos de los separadores; cámara a bordo que lo muestre de cerca.
    Código: `game/src/ui/launch/three/LaunchScene3D.tsx` (mitades de la cofia, ~línea 170-200).
29. [~] (2026-11-15, `game/src/ui/flight/OpsPanels.tsx`: hecho cámara desde la nave sobre Blue Marble/Black Marble con franja del instrumento, día/eclipse y tormentas en Storm Tracker; tarjeta por instrumento con qué mide, ciclo, GB/día y % de ciencia; datos producidos vs enviados con explicación; "Pregúntale a Kuntur" con 4 preguntas EN/ES. **Falta:** decisiones del jugador que cambien recursos (apagar/apuntar instrumento, pase extra) registradas con la semilla, y más gráficos por pase de estación) **Pantalla de operaciones de vuelo más educativa e interactiva** (`game/src/ui/FlightScreen.tsx`; pedido del
    dueño con captura de "Rastreador de Tormentas: control de misión"): hoy hay un diagrama de órbita plano, un gráfico de
    tres líneas y la bitácora. Agregar:
    - **Cámara desde la nave**: lo que ve el instrumento (Tierra Blue Marble / Black Marble pasando bajo la nave con la
      franja que barre el instrumento; nubes y tormentas para Storm Tracker), reutilizando `earth3d.ts` y `orbitView.ts`.
    - **Visores por instrumento**: una tarjeta por instrumento con su estado (encendido, ciclo, datos generados), una
      vista previa simulada de su producto (imagen de cultivos, mapa de humedad, nube de tormenta) y "qué mide y para qué".
    - **Más gráficos**: datos generados frente a descargados por pase de estación, contactos con tierra en una línea de
      tiempo, eclipse y carga de batería por órbita.
    - **Ciencia que se entiende**: cada punto de ciencia con un hecho concreto ("detectaste 3 frentes de tormenta"), y
      preguntas cortas de Kuntur ("¿por qué la batería baja en el eclipse?") con respuesta.
    - **Interacción**: el jugador puede apuntar o apagar un instrumento, cambiar el modo de enlace o pedir un pase extra
      y ver el efecto en los recursos (sin romper el determinismo: decisiones registradas con la semilla).
    - Mantener las notas "Source: NASA …" y el estilo de consola; cuadrícula fija 1440×810 sin superposiciones.

### Investigación: animación y aspecto visual (2026-11-14)
- **Mantener Three.js + postprocessing** para las escenas 3D (ya instalados). Mejorar luz, materiales e ilustración antes
  que cambiar de motor. React Three Fiber solo si se reescriben las escenas (no antes del cierre).
- **GSAP** (gratis con todos sus plugins, incluidos SplitText, MorphSVG, MotionPath y Flip, también para uso comercial
  desde el 30-abr-2025; ya instalado): herramienta principal para coreografías de interfaz, cinemáticas del briefing,
  números que cuentan, trayectorias SVG y animar el SVG de Kuntur.
- **Motion** (MIT, ya instalado): transiciones entre pantallas y animaciones de layout en React.
- **Rive**: lo mejor para una mascota interactiva con máquinas de estado, pero exportar al juego requiere plan pago
  (Cadet, unos USD 9/mes según su documentación) → solo con aprobación del dueño; si no, Kuntur con GSAP.
- **Lottie / dotLottie** (MIT; renderizado WebGL/WebGPU desde mayo de 2026): iconos y microanimaciones; revisar la
  licencia de cada animación de LottieFiles.
- **Theatre.js**: mantenimiento incierto (repo público lento, editor AGPL) → no usar antes del cierre.
- **Spline**: marca de agua en el plan gratis → no.
- **Video y cinemáticas:** HyperFrames (local, gratis) + Gemini Pro del dueño (imágenes y Veo) con marca "AI-generated".
- "Años 2000" es sobre todo **diseño de interfaz** (tipografía, jerarquía, espacio, ilustración, profundidad): proponer
  2–3 direcciones visuales hechas en código y que el dueño elija (PLAYBOOK regla 3.3).
- **IA para Kuntur (propuesta del dueño, opcional):** proveedores no chinos: Gemini API (Google AI Studio, tiene nivel
  gratis), Claude API (Anthropic) u OpenAI. La clave nunca va en el navegador: haría falta una función de Vercel que la
  guarde y llame al modelo, con las preguntas sin internet como respaldo. Declarar el uso de IA en la entrega.

30. [x] (2026-11-15) **Terminar TODOS los videos (actos + misiones) con voz, imágenes reales y animación de primera** (pedido del dueño, 2026-11-15).
   - **Qué hay:** guiones de actos en `docs/act-videos.md` (imágenes del dueño en `media/act-videos/main/`: Prólogo y
     Actos 1–3 hechos; Acto 4 pendiente del dueño). Guiones de misión en `docs/mission-videos.md`. **Modelo a seguir:**
     `media/mission-videos/first_light/` (HyperFrames, 5 escenas, subtítulos, música, voz Kokoro; aprobado por el dueño).
   - **Voces: solo Kokoro local** (decisión del dueño): narrador `am_michael` (speed 0.95), Goicochea `am_onyx` (0.9),
     Chicho `am_puck`, Franchesca `af_heart`, Roberto `am_eric`. Entorno `C:/PPgame/tools/tts/.venv`; copiar
     `first_light_vo.py`: **un clip por subtítulo**, colocado en el `data-start` del subtítulo y ajustando la duración del
     subtítulo a la del clip (+0.4 s). Números escritos en palabras para que los pronuncie bien ("nineteen twenty-six").
     Música del juego a volumen 0.18 bajo la voz. Parler descartado; ElevenLabs no se usa.
   - **Imágenes reales de NASA (dominio público, sin logos ni insignias):** buscar en images.nasa.gov / NASA Science /
     Earth Observatory / NSSDCA la foto real de cada hito (p. ej. Goddard 1926, Landsat, GOES, LCROSS, LRO, Mariner 9,
     MRO, Curiosity sky crane, MOXIE, MAVEN, JWST). Guardar en `assets/` de cada video con su fuente en `assets/SOURCES.md`;
     crédito "Image: NASA" en pantalla. Recortar si la foto trae el logo de NASA.
   - **Pedro Paulet:** buscar una **foto histórica de Paulet de dominio público** (Wikimedia Commons u otro archivo; anotar
     licencia y fuente) para el Prólogo, First Light y el Acto 4; y usar el dibujo del **Avión-Torpedo (1902)** en
     `media/act-videos/main/ref-avion-torpedo.jpg`. Sus pruebas de 1895 siempre como "claimed".
   - **Animación y transiciones excelentes:** buscar primero en el registro de HyperFrames (`/hyperframes-registry`:
     transiciones, títulos, mapas, cámara) en vez de hacerlas a mano; Ken Burns y parallax por capas en las imágenes de
     los actos (separar fondo/figuras con `/media-use` si hace falta), transiciones con intención (match cut, whip,
     wipe de consola), diagramas que crecen paso a paso (ver `hyperframes` → `references/types/explainer.md`).
     Marca **"AI-generated"** visible sobre toda imagen o clip de Gemini/Veo. `npx hyperframes check` sin errores y
     `snapshot` revisado antes de cada render.
   - **Salida:** `media/act-videos/<prologue|act1..act4>.mp4` y `media/mission-videos/<misión>/<misión>.mp4`, con
     `.en.vtt` y `.es.vtt`; luego integrarlos al juego (botón "The real story" en el informe y en la pantalla de datos
     NASA; carga diferida, sin precache).
   - **Orden sugerido:** Prólogo → Acto 1 → misiones del Acto 1 (earth_watch, andean_eye, station_resupply,
     storm_tracker) → Actos 2–3 y sus misiones → Acto 4 cuando el dueño entregue sus imágenes.

   - **PROGRESO (actualizado 2026-11-15, noche):**
     - **Kit** `media/video-kit/` (ver `README.md`). Proceso por video: `video.json` + `compositions/*.html` →
       `vo.py` (Kokoro) → `build.py` → `check.py` (sin errores) → `shots.py` (revisar capturas) →
       **`tools/publish.py <proyecto>`** (render limpio sin subtítulos grabados → `game/public/videos/<id>.mp4` +
       `.en.vtt` + `.es.vtt`, y copia de revisión con español grabado en `<proyecto>/review/`).
     - **Subtítulos ES/EN:** el reproductor del juego (`game/src/ui/video/RealStory.tsx`) muestra el `.vtt` del idioma
       elegido encima del video (botones ES / EN / NO). Al publicar un video nuevo, **agregar su id a `READY`** en ese archivo.
     - **Música:** versiones instrumentales de nuestras 10 canciones ACE-Step (voz quitada con Demucs) en
       `media/video-kit/assets/music/`; variar pista o `musicStart` en cada video.
     - **Botones en el juego:** "The real story" en el informe y en el primer vuelo; ▶ por acto en la campaña; galería en Learn → NASA data.
     - [x] **TODOS publicados (16)**: prologue, act1–act4 y las 11 misiones (first_light, earth_watch, andean_eye,
       station_resupply, storm_tracker, lunar_pathfinder, lagrange_observatory, mars_orbiter, mars_stranded, mars_oxygen,
       mars_terraform), con subtítulos EN/ES. `READY` ya incluye todos. Vercel despliega OK (verificado).
     - [ ] Opcional: que el video de cada acto se abra solo la primera vez que se desbloquea el acto (hoy es un botón ▶).

31. [x] (2026-11-15 noche) **Bugs del modo en línea reportados por el dueño** (jugó con 2 dispositivos):
   (a) el despegue en la plataforma solo arrancaba en el dispositivo que lo pulsaba; (b) el otro tuvo que pulsar y se
   desconectó del grupo; (c) al terminar, los demás perfiles aparecían como bots (en línea Kuntur decidía TODOS los roles).
   **Arreglado en código (sin probar con 2 dispositivos):** solo el **Director de misión** despega (o el anfitrión si Kuntur
   es director: `launcherOf` en `game/src/online/room.ts`); su botón en la plataforma y en la revisión llama a
   `launchTogether` y todos despegan juntos; los demás ven "Esperando que el Director… despegue". Las decisiones en vuelo:
   cada jugador decide las de su rol y se comparten por la sala (`launch/decisions`, `applyRoomDecision` en
   `game/src/store/online.ts`); Kuntur solo decide por roles sin jugador; los otros ven "Esperando que X decida".
   **Segunda ronda (2026-11-15 noche, commit `1383a2d`), probada con 2 pestañas (Ana Directora, Beto Ingeniero):**
   - El botón de la revisión ya **no** arranca la cuenta regresiva (de ahí el "T minus 10" sin pulsar despegue): ahora dice
     "Llevar al equipo a la plataforma" (`padTogether`, campo `pad` de la sala) y todos van a la plataforma en espera.
     Solo el Director ve "🚀 Lanzar"; los demás ven "Esperando que el Director… despegue" y la semilla bloqueada.
   - **Iniciar misión espera a todos** (`launch/ready` en la sala, `readyToStart`): quien ya pulsó ve "Listo ✓ · Esperando
     que X pulse…"; a quien falta le sale una alerta arriba con sonido y el botón parpadea. El vuelo arranca en todos a la vez.
   - En vuelo, el panel del equipo muestra el nombre de cada jugador (o Kuntur) y no se puede cambiar; el registro dice
     "Beto bajó…" en vez de "Tú". Probado con la semilla 4 (evento del Ingeniero y dos del Director): cada uno decidió lo
     suyo, el otro vio "Esperando que X decida", y las dos pestañas terminaron con los mismos datos y decisiones.
   - El informe muestra "Director de Misión · Ana", "Ingeniero · Beto" y Kuntur solo en los roles sin jugador.
   - **Jugar de nuevo juntos / Otra misión juntos** (en el informe, y el reintento de la carta): cualquiera propone; a los
     demás les sale "¿Jugar de nuevo juntos?" con Aceptar o "No, salir". Quien rechaza sale de la sala (sus roles pasan a
     Kuntur; si era anfitrión, hereda el siguiente) y los que aceptan vuelven a la mesa de diseño (misma misión u otra).
     Componentes: `game/src/ui/online/NextProposal.tsx`; lógica: `notReady`, `nextAccepted`, `nextPatch`, `leavePatch` en
     `game/src/online/room.ts` (7 pruebas en `game/tests/onlineLaunch.test.ts`).
   - Quien entra o vuelve a la sala no repite despegues ni llamadas anteriores.
   **Falta:** que el dueño lo pruebe con 2 dispositivos reales en https://paulet-spaceapps-2026.vercel.app (Firebase).

33. [~] (2026-11-15 noche) **Pedidos del dueño tras jugar con 3 personas:**
   - [x] **Aviso "La misión termina muy pronto"**: ya no dice "1.0 años, pero se requieren 1.0" (si redondea igual muestra
     2 decimales: 0.98 frente a 1.00) y el consejo es concreto según el factor limitante (radiación → Computadora
     endurecida en Nave; batería, paneles, propelente, órbita → su control). La barra dice "Vida útil (factor limitante: …)".
     Código: `LIFE_SHORT` en `game/src/i18n/en.ts`.
   - [x] **Metas de rol explicadas**: debajo de cada meta hay "¿Qué significa y cómo lo mejoro?" (p. ej. margen del
     lanzador = 1 − masa de la nave ÷ capacidad; se sube con un lanzador más grande o una nave más liviana). Claves
     `team.goalHow.*`, componente `GoalLine` en `game/src/ui/team/TeamPanel.tsx`.
   - [x] **Salir del informe**: en línea "🚪 Salir de la partida" (deja la sala, los demás siguen); solo "← Menú principal".
   - [x] **Retraso de un jugador (con 3)**: cada dispositivo llevaba su propio reloj y velocidad. Ahora en línea la pausa y la
     velocidad son compartidas (`launch/clock`), cada dispositivo informa su semana (`launch/weeks`, ~1 vez por segundo) y
     el que va 2+ semanas atrás acelera hasta alcanzar. Probado: la pestaña más cargada iba atrás y alcanzó; quedaron a ≤1
     reporte de distancia y con el mismo resultado. Si un jugador sale en pleno vuelo, Kuntur toma su rol.
     También: "Iniciar misión" se vuelve a comprobar al terminar el ascenso (un dispositivo lento ya no se queda en la plataforma).
   - [x] **Soundtrack, dónde suena cada pista** (`MUSIC` en `game/src/audio/audio.ts`): menú, intro y elegir misión →
     *Beneath the Misti*; diseño, campaña, aprender, cohete y plataforma en espera → *Blueprints* (`design-focus`); cuenta
     regresiva → silencio (se oye la voz); despegue y órbita alcanzada → *Paulet's Fire*; vuelo → *Quiet Orbit*
     (`flight-ambient`); informe → *Lagrange* (también cuando la misión falla).
   - [x] **5 canciones nuevas para elegir** (ACE-Step 1.5 local, mismo estilo; letras y estilos en
     `C:\PPgame\soundtrack\SONGS2.md`, dos tomas cada una en `C:\PPgame\soundtrack\final2\`): 06 *T-Minus* (plataforma en
     espera), 07 *Mission Control* (decisiones en vuelo), 08 *Red Horizon* (misiones a Marte), 09 *Cuatro Voces* (sala en
     línea, en español), 10 *Fallen Star* (informe cuando falla). **Elegidas por el dueño y ya en el juego** (96 kbps,
     −16 LUFS; T-Minus −18): T-Minus B → plataforma antes de la cuenta (`pad`); Mission Control B → mientras una persona
     decide en vuelo (`decision`); Cuatro Voces B → mesa de diseño de una sala en línea (`team`); Fallen Star A y B →
     informe de misión fallida, una al azar (`failure`). Red Horizon y las demás tomas no se usan. Caché sin conexión: 26,5 MB.
   - [x] **Las películas pausan la música del juego** mientras se ven y la reanudan al cerrar (antes sonaban encima).
   - [x] **Teaser en Extras** ("Ver el teaser"): `game/public/videos/teaser.mp4` (23 s, 720p, copia de
     `C:\PPgame\teaser_paulet_720p.mp4`, revisado: sin menores), textos en inglés dentro del video y subtítulos solo en español.
   - [x] **Resumen del proyecto nuevo** (1447 de 1500 caracteres, primera persona, con el toque creativo y lo técnico) en
     `docs/SUBMISSION.md` → High-Level Project Summary. **El dueño debe pegarlo** en la página del proyecto.

32. [x] (2026-11-16) **Hecha.** Commit `5f864d0` en el repo del concurso (queda solo `README.md`, `.gitignore` y
   `game/`); los 510 archivos internos se copiaron aquí (`docs/hackathon-2026/`, commit `12415cf` en `cloud/fase-1`, que
   subió también los 4 commits locales pendientes del dueño). README público nuevo (qué es, cómo jugar, enlaces, fuentes
   de NASA, créditos y uso de IA), `game/README.md` y `game/CREDITS.md` actualizados. Las copias locales de `media/` y
   `docs/` siguen en el disco del dueño, ignoradas por git. Comprobado: tsc, 262 pruebas, build, y en Vercel el menú,
   una misión, la demo `/deck/` y un video con subtítulos, sin errores de consola.
   **Pendiente (paso 5): el dueño decide si se borran también del historial de git** (reescribir historial y force push).
   Hoy los archivos borrados aún se ven en commits anteriores del repo público.
   Texto original del punto: **LIMPIEZA FINAL DEL REPO (hacer al final, después de las últimas modificaciones y de comprobar que el juego corre bien)** (pedido del dueño, 2026-11-15).
   **PREGUNTAR AL DUEÑO ANTES DE EMPEZAR** (dicho por él el 2026-11-15 noche: es lo último de la hackathon y no se hace
   sin su visto bueno):
   - Este repo es público y debe quedar **solo con lo del juego**. `HANDOFF.md`, partes del `README.md` y otros archivos
     contienen nuestras indicaciones, bitácora, comunicaciones y datos sensibles que no le sirven al juego.
   - **Paso 1 · inventario:** listar los archivos que no son del juego, por ejemplo `HANDOFF.md`, `docs/gemini-manual.md`,
     `docs/gemini-prompts.md`, `docs/tutoriales/`, `docs/storytelling.md`, `docs/act-videos.md`, `docs/mission-videos.md`,
     `docs/SUBMISSION.md`, `docs/screenshots/`, `media/` (proyectos de video, voces de prueba, `media/act-videos/main/`),
     `media/video-kit/` y las secciones internas del `README.md`. Buscar además nombres, correos, ids de proyecto y
     notas internas con `git grep`.
   - **Paso 2 · copia a la bitácora:** copiarlos al repo del juego principal `artesanalinteligencia1-dotcom/PP.game`
     (clon `C:\PPgame\PP.game`) en una carpeta nueva, por ejemplo `docs/hackathon-2026/`, como bitácora y explicación de
     lo que se hizo en la hackathon. Commit y push allí.
   - **Paso 3 · limpieza:** borrar esos archivos de este repo y dejar un `README.md` público y breve: qué es el juego,
     cómo jugar, enlaces, créditos y declaración de IA, y fuentes de NASA.
   - **Paso 4 · que nada se rompa:** comprobar que el juego **no depende** de lo borrado. Los videos que usa están en
     `game/public/videos/` y no se tocan; tampoco se tocan las texturas, el audio de `game/src/assets` ni la demo
     `game/public/deck/`. Correr `npx tsc --noEmit`, `npx vitest run` y `npm run build` en `game/`, abrir el enlace de
     Vercel y probar el menú, una misión, la demo `/deck/` y un video con subtítulos.
   - **Paso 5 · decidir con el dueño:** si también hay que borrar esos archivos del **historial de git** (eso exige reescribir
     el historial y un force push), o si basta con quitarlos de la última versión. No hacerlo sin su aprobación explícita.

## 11. Siguiente paso exacto
**Trabajo manual del dueño (hoy, antes de las 23:59 hora del evento local, Trujillo):**
1) ~~Nombres del equipo~~ — hecho por Claude (diapositiva 1 y `docs/SUBMISSION.md`).
2) En spaceappschallenge.org → My Team → Project → Edit: pegar campo por campo `docs/SUBMISSION.md`; demo =
   https://paulet-spaceapps-2026.vercel.app/deck/ ; proyecto = https://paulet-spaceapps-2026.vercel.app/ ; marcar las dos
   casillas (términos y trabajo original) y **Submit for Judging**. Reenviar si se mejora algo.
3) **Probar una sala en línea con dos dispositivos reales** en https://paulet-spaceapps-2026.vercel.app (punto 31): crear
   sala, unirse, Director + otro rol, votar, "Llevar al equipo a la plataforma", Lanzar, Iniciar misión en los dos, decidir
   en vuelo, informe y "Jugar de nuevo juntos". Ya funciona con 2 pestañas; falta confirmarlo con Firebase.
4) Imágenes y videos de los actos en Gemini: **prompts completos listos para pegar en `docs/gemini-prompts.md`** (manual: `docs/gemini-manual.md`) (la hoja de personajes ya está; empezar por el
   Prólogo). No bloquea la entrega.
5) ~~Elegir voces~~ — **hecho: Kokoro local para todo** (narrador Michael, Goicochea Onyx, Chicho Puck, Franchesca Heart, Roberto Eric). First Light ya tiene voz.
   Imágenes de los actos: el dueño hizo Prólogo, Actos 1–3 (en `media/act-videos/main/`); falta el Acto 4 (prompts corregidos: el Paulet 1 = Avión-Torpedo de 1902, no un auto).
6) **Cancelar la renovación automática de Higgsfield antes del 18-nov-2026** (si no, cobra USD 79).

**Para Claude (cualquier cuenta), en orden:** si el dueño reporta fallos de su prueba con 2 dispositivos, corregirlos (punto 31);
agregar la canción que elija el dueño (punto 33);
**al final de todo, punto 32 (limpieza del repo), solo después de preguntarle al dueño**; **punto 30 (terminar todos los videos)**; videos por misión (`docs/mission-videos.md`: animación HyperFrames en
`media/mission-videos/<misión>/`, primero `first_light`); completar el punto 29 (decisiones del jugador en operaciones);
montar los videos de acto cuando estén las imágenes (punto 25); cámara de la nave en Luna y Marte; traducir las
etiquetas de la cabina (punto 21).

## 12. Dónde está cada cosa
- Primera versión: repo `artesanalinteligencia1-dotcom/PP.game` (rama `cloud/fase-1`), clon `C:\PPgame\PP.game`,
  demo https://paulet-andes-to-orbit.vercel.app/. Su contexto: `docs/PLAYBOOK.md`, `docs/HANDOFF.md`, `docs/model.md`
  (todas las fórmulas), `PROGRESS.md`, `DECISIONS.md`.
- Medios: `C:\PPgame\{intro-a, trailer, trailer-final, trailer-test, soundtrack, media_raw}`.
- Repo antiguo del grupo: `artesanalinteligencia1-dotcom/NASA-Hackathon` (privado, solo README del 2026-11-01).
- Este repo: `C:\PPgame\paulet-spaceapps-2026` (público). Juego: https://paulet-spaceapps-2026.vercel.app/ · Demo (7 diapositivas): https://paulet-spaceapps-2026.vercel.app/deck/
- Memoria de Claude Code (solo en esta PC): `C:\Users\roone\.claude\projects\C--PPgame\memory\`.
- **Firebase (multijugador en línea), pasos para el dueño:** console.firebase.google.com → Crear proyecto `paulet-spaceapps`
  (sin Analytics) → Compilación → Realtime Database → Crear base de datos (Estados Unidos, modo de prueba) → Configuración
  del proyecto → Tus apps → Web `</>` → apodo `paulet-game`, Registrar → copiar `firebaseConfig` y pasarlo a Claude.
  Va como variables `VITE_FIREBASE_*` en `game/.env.local` y en Vercel (no es un secreto: lo protegen las reglas).
