# Handoff — Rocket Engineer pad, delivery 3 (3D assembly)

Para una sesión nueva (el dueño la abre con Fable). Leer esto primero; no hace falta releer el resto del repo.
Reglas de siempre: explicaciones en español, código y textos del juego en inglés + es.json; lógica pura con pruebas;
verificar en Chrome sin interfaz (puppeteer-core del caché de npx, ver abajo); después de la tarea actualizar PROGRESS.md y
CLOUD_NEXT.md, commit (con `Co-Authored-By`) y push desde una pestaña de terminal tras `git rebase origin/cloud/fase-1`.
Nunca force-push. Antes de una tarea grande, estimar el consumo y proponerla en entregas.

> **Entregas 3 y 4 hechas (2026-11-12 y 13).** Detalle en PROGRESS.md puntos 18 y 19. El pad del Ingeniero de cohetes está
> completo; sigue el pad del Astrobiólogo (CLOUD_NEXT punto 4).
> Pendiente de realismo, sin empezar: texturas PBR en el fuselaje, humo con partículas en GPU, cámaras con Theatre.js,
> modelos glTF para torre y barco, física de las piezas que caen, audio espacial.

## Estado (2026-11-12, rama `cloud/fase-1`, commit b16f9d4, 125 pruebas)
- Idiomas EN/ES terminados (`src/i18n`, `useT/useTx/useMsg`, 1 300 claves; test de paridad en `tests/i18n.test.ts`).
- **Entrega 1 ✅** motor puro `src/engine/rocket.ts` + `src/engine/catalog/rocketParts.ts` (docs/model.md §20):
  `analyzeRocket(design, payloadKg)` → etapas (masa, Δv, encendido, TWR, `lengthM`, `diameterM`), capacidad por destino,
  precio, fiabilidad, `heightM`, issues tipados `ROCKET_ISSUE_CODES`; `rocketToLauncher()` da un `Launcher` con id `custom`.
  Tanques: `lengthM`/`diameterM` por combustible y tamaño; colores por combustible en el SVG (queroseno #cbd5e1,
  metano #94a3b8, hidrógeno #f97316). Propulsores: `srb_s`/`srb_l` con `lengthM`. Cofia: largo = 2.5 × diámetro.
- **Entrega 2 ✅** pantalla `src/ui/rocket/RocketScreen.tsx` (Inicio → Extras → Banco de cohetes), store `src/store/rocket.ts`
  (`useRocket`: `design`, `payloadKg`, guardado en localStorage `ppgame.rocket.v1`). Tiene una vista lateral SVG a escala
  (`RocketDrawing`) que la entrega 3 complementa.

## Entrega 3 — qué hacer
1. **Modelo 3D desde el diseño:** función pura o casi pura que convierta un `RocketDesign` en geometría Three.js:
   cilindros por etapa (largo = tanques × `lengthM` + 2.5 m de motores, diámetro del tanque), toberas por motor (hasta 9, en
   anillo), propulsores en pares alrededor de la etapa 1, cofia ojival, patas y aletas de rejilla si están. Mismas
   proporciones que `RocketDrawing` y que `analyzeRocket().heightM` (probarlo).
2. **Vista 3D en el banco:** visor girable (arrastrar para rotar) junto o en lugar del SVG; se reconstruye al cambiar piezas.
3. **Lanzamiento con el cohete propio:** la escena `src/ui/launch/three/LaunchScene3D.tsx` hoy recibe `launcherId` y saca la
   forma de `ascent.ts` (`rocketMetres`, `hasSideBoosters`, `isReusableLauncher`). Hacer que acepte un `RocketDesign`
   (o el id `custom` leyendo `useRocket`) y use el modelo del punto 1: separación de propulsores y etapas en el orden del
   diseño, cofia que se abre, aterrizaje de la primera etapa si es reutilizable. Sin tocar tiempos, audio ni subtítulos de
   la secuencia (`LaunchSequence.tsx`, sus pruebas en `tests/ascent.test.ts`, `tests/visual.test.ts`, `tests/delivery3.test.ts`).
4. Vista de depuración: `?scene3d=<launcher>` (ver `SceneDebug.tsx`); agregar `?scene3d=custom`.
5. Textos nuevos en en.json y es.json; pruebas; verificación en Chrome (WebGL: `--use-gl=swiftshader --enable-webgl
   --ignore-gpu-blocklist`).

**No es de esta entrega (es la 4):** elegir el cohete propio como lanzador en las misiones y la carrera, piezas desbloqueadas
por tecnología, calibrar precios (el cohete armado cuesta solo piezas: el mediano 23 M frente a 45 M del catálogo), lección
sobre etapas.

## Herramientas
- Servidor: `preview_start "paulet-dev"` (config en `C:\PPgame\.claude\launch.json`). Si tras editar, `import('/src/store/…')`
  en puppeteer da una instancia distinta del store, reiniciar el servidor (HMR con `?t=`).
- Puppeteer: `require('C:/Users/roone/AppData/Local/npm-cache/_npx/6f2bfc0a09035133/node_modules/puppeteer-core')`,
  Chrome en `C:/Program Files/Google/Chrome/Application/chrome.exe`. Script de ejemplo del banco:
  `%TEMP%\claude\…\scratchpad\check_rocket.cjs` (puede no existir en otra sesión; es corto de rehacer).
- Ajustes del juego para pruebas: localStorage `ppgame.settings.v1` = `{"language":"es","languageChosen":true,"motion":"reduced",...}`.
- `gh` ya tiene sesión (el dueño puede pedir PR `cloud/fase-1 → main` para publicar; producción = `main` en Vercel).

## Después
Cola del dueño: entrega 4 del pad → 4 pad del Astrobiólogo → 5 Marte y multijugador asíncrono (misma semilla). Extras:
robot guía (3 variantes en código), un video animado por rol, librerías de animación ya instaladas (postprocessing, GSAP,
Motion, Theatre.js, Rive). Detalle en CLOUD_NEXT.md y docs/PLAYBOOK.md §6b–6c.
