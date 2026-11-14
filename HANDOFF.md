# HANDOFF — Paulet: Andes to Orbit

Punto de entrada para cualquier sesión de Claude (o persona) que retome el proyecto. El dueño trabaja desde varias
cuentas que **no comparten historial**: lo único que pasa de una sesión a otra son los archivos de este repo.
**Al terminar cada tarea: mover la tarea a "Hecho", actualizar "Pendiente" y el siguiente paso, y hacer commit.**

Última actualización: 2026-11-14.

## Siguiente paso exacto
**Robot guía:** mostrar al dueño 3 variantes de su aspecto hechas en código (detrás de un parámetro en la URL), para
que elija una; después darle voz con textos en inglés y español. Punto de partida en `CLOUD_NEXT.md`, cola del juego
definitivo, punto 5, y en `docs/PLAYBOOK.md` §6c. Antes de empezar: estimar el consumo y proponerlo al dueño.

## Dónde está cada cosa
| Qué | Dónde |
|---|---|
| Repo | `artesanalinteligencia1-dotcom/PP.game`, rama de trabajo `cloud/fase-1`, clon local `C:\PPgame\PP.game` |
| Producción | https://paulet-andes-to-orbit.vercel.app/ (rama `main`; se actualiza con un PR desde `cloud/fase-1`) |
| Cómo se construyó y reglas aprendidas | `docs/PLAYBOOK.md` (leer primero) |
| Cola de trabajo y detalle del siguiente paso | `CLOUD_NEXT.md` |
| Qué se hizo, numerado y con detalle | `PROGRESS.md` |
| Decisiones (qué, alternativa, por qué) | `DECISIONS.md` |
| Cada fórmula y cada número del juego | `docs/model.md` |
| Especificación original y sus addenda (en español) | `docs/HANDOFF.md` |
| Tareas que necesitan al dueño o su PC | `LOCAL_TODO.md` |
| Medios (intro, tráiler, música) | `C:\PPgame\{intro-a,trailer-final,trailer-test,soundtrack,media_raw,tools}` |
| Servidor de desarrollo | configuración `paulet-dev` en `C:\PPgame\.claude\launch.json` (puerto 5173) |
| Pruebas | `npm test` dentro de `PP.game` (221 en verde al 2026-11-14) |

## Reglas vigentes
- Explicaciones al dueño en español; código, documentos técnicos y textos del juego en inglés. El juego se elige en
  inglés o español: todo texto nuevo va en `src/i18n/strings/en.json` y `es.json`, nunca escrito en el código.
- El motor (`src/engine`) es puro y determinista: todo azar pasa por `rng.ts` con semilla.
- Nada de gasto en generación (ElevenLabs, etc.) sin decir antes el costo y recibir aprobación. Video con IA: lo
  genera el dueño en Gemini a partir de nuestros prompts. Música: ACE-Step local.
- Los hechos sobre Paulet se presentan como "afirmados", no como probados. Sin logos de agencias ni de empresas; los
  cohetes y misiones reales se pueden nombrar como dato histórico.
- Antes de cada tarea grande: estimar el consumo y proponerla en entregas.
- `git push` solo desde la terminal del dueño, tras `git rebase origin/cloud/fase-1`. Nunca `--force`.
- Verificar en un navegador real (sin errores de consola, flujo completo) antes de dar algo por hecho.

## Hecho
| Fecha | Tarea |
|---|---|
| 2026-11-02 | Juego base, fases 0 a 4: motor, diseño, lanzamiento, vuelo con decisiones, informe; carrera del Acto 1; Acto 2 (Luna y L2 con tres cuerpos) |
| 2026-11-02 | Banda sonora, intro (31 s) y tráiler (54 s) |
| 2026-11-03 | Juego sin conexión: PWA instalable e instalador de Windows (Tauri); interfaz tipo HUD de agencia espacial |
| 2026-11-05 | Lanzamiento en 3D (Three.js) para todos los lanzadores y el prólogo Paulet-1. Fin del juego base |
| 2026-11-06 | Enlace público en Vercel |
| 2026-11-08 | Idiomas inglés y español en todo el juego |
| 2026-11-13 | Taller del Ingeniero de cohetes (4 entregas): piezas, masa / empuje / Δv en vivo, vista 3D, tu cohete en las misiones y la carrera |
| 2026-11-13 | Laboratorio del Astrobiólogo, con vista 3D del mundo |
| 2026-11-13 | Multijugador asíncrono: retos por enlace (mismo escenario y semilla) |
| 2026-11-13 | Marte, entrega a: motor (`src/engine/mars.ts`): ventanas cada 25,6 meses, viaje, retardo de radio, conjunción, aerofrenado |
| 2026-11-13 | Marte, entrega b: contrato "Red Horizon" (orbitador), primer contrato jugable del Acto 3 |
| 2026-11-14 | Marte, entrega c: entrada, descenso y aterrizaje (`src/engine/edl.ts`) y la misión "Stranded" (suministros a la superficie) |
| 2026-11-14 | Marte, entrega d: planta de oxígeno (`src/engine/isru.ts`) y la misión "Breathing Mars". El Acto 3 queda jugable completo |

## Pendiente (en orden)
1. **Robot guía**: compañero que explica lo difícil (pistas, "¿por qué falló?", tutoriales). Decidir su aspecto
   mostrando 3 variantes hechas en código (PLAYBOOK §6c).
2. **Un video animado por rol** (Ingeniero de cohetes, Astrobiólogo y los demás), presentado por el robot guía
   (HyperFrames, local).
3. **Más calidad de animación y diseño** (PLAYBOOK §6c).
4. **Multijugador**: marcador compartido y cooperativo en tiempo real de los 4 roles; ambos necesitan servidor.
5. **Acto 4**: terraformación como gran desafío (especulativo, etiquetado como tal). Hoy es una tarjeta de avance en
   la carrera (`mars_terraform`).
6. Ideas sueltas anotadas en `CLOUD_NEXT.md` (punto 5): lección sobre ventanas de lanzamiento, Marte en 3D en la
   vista de vuelo, sitio de aterrizaje elegible, comprobar que el aeroescudo cabe en la cofia, una fuente de energía
   nocturna para plantas de oxígeno grandes.
7. Del dueño (`LOCAL_TODO.md`): escuchar el audio nuevo, probar el instalador de Windows y la PWA sin conexión,
   publicar a producción con un PR de `cloud/fase-1` a `main` cuando quiera.
