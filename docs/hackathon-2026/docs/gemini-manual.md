# Imágenes y videos de los actos en Gemini, paso a paso (manual)

> Para continuar desde cualquier cuenta. **Prompts listos para pegar: [`docs/gemini-prompts.md`](gemini-prompts.md)**
> (guiones y subtítulos: [`docs/act-videos.md`](act-videos.md)).
> Se usa **Gemini Pro** del dueño (gemini.google.com): imágenes con Nano Banana Pro y videos con Veo.
> Higgsfield queda como alternativa si sus servidores responden (ver HANDOFF §10, punto 24).
> **Nada de modelos chinos** en la versión principal. Todos los personajes son **adultos**; sin texto, logos, insignias
> ni banderas en las imágenes.

---

## 0. Antes de empezar (5 min)
1. Abre https://gemini.google.com con la cuenta que tiene **Gemini Pro** (arriba a la izquierda debe decir Pro).
2. Abre `docs/act-videos.md` en GitHub, en otra pestaña:
   https://github.com/artesanalinteligencia1-dotcom/paulet-spaceapps-2026/blob/main/docs/act-videos.md
3. Las carpetas **ya están creadas** en la PC:
   ```
   C:\PPgame\paulet-spaceapps-2026\media\act-videos\main\           ← imágenes aprobadas (van al juego)
   C:\PPgame\paulet-spaceapps-2026\media\act-videos\main\veo\       ← clips de Veo aprobados
   C:\PPgame\paulet-spaceapps-2026\media\act-videos\rejected\       ← descartes (por si acaso)
   C:\PPgame\paulet-spaceapps-2026\media\act-videos\optional-cn\    ← solo modelos chinos; NO se publica
   ```
4. **Nombres de archivo:** `ref-characters.jpg` para la hoja de personajes; luego `prologue-01.png`, `act1-04.png`,
   `act3-05.mp4`… (acto y número de plano de las tablas, con dos cifras).

## 1. Hoja de personajes — HECHA (2026-11-15)
La hoja aprobada por el dueño ya está guardada como **`media/act-videos/main/ref-characters.jpg`** (copia en
`media\characters\character-sheet.jpg`): Goicochea con el cuaderno de cuero, Chicho con chaqueta manchada y llave,
Roberto con suéter, lentes y tableta, Franchesca con chaleco de muestras y chalina andina naranja, y Kuntur cóndor
geométrico crema y dorado. **No la vuelvas a generar**: súbela en cada chat como referencia.

- Si una cara cambia mucho entre planos, genera además un **retrato** de esa persona (busto, fondo crema, "same person
  as figure N in the reference sheet") y guárdalo como `ref-goicochea.png`, `ref-chicho.png`, `ref-roberto.png`,
  `ref-franchesca.png` o `ref-kuntur.png` en la misma carpeta.

## 2. Cada plano (imágenes)
Hazlo **por acto, en un chat por acto** (así Gemini recuerda el estilo dentro del acto).
1. Chat nuevo → **Crear imágenes**.
2. Clip (📎) → **sube `ref-characters.jpg`** (y el retrato de quien aparezca, si lo tienes).
3. Abre **`docs/gemini-prompts.md`**: cada plano tiene su **prompt completo** (personajes, estilo y referencia
   ya incluidos). Copia el bloque entero y pégalo. No hay que añadir nada.
4. Sube la hoja con 📎 en cada mensaje.
5. **Revisa cada imagen** con esta lista antes de descargar:
   - [ ] todos adultos; caras parecidas a la hoja;
   - [ ] sin letras, logos, insignias, banderas ni marcas de autos/cohetes reales;
   - [ ] la composición deja aire arriba o abajo para los subtítulos;
   - [ ] nada que contradiga el guion (p. ej. Franchesca con su pañuelo andino, Chicho con overol/chaqueta de taller).
6. Si falla algo, pide el cambio en el mismo chat ("sin texto en la pantalla del fondo", "que se vea el Misti").
7. Descarga y guarda con el nombre del plano (`act1-04.png`) en `media\act-videos\main\`.
8. **Orden recomendado (planos clave primero):** Prólogo 3 y 5 · Acto 1: 4, 8 · Acto 2: 3, 6 · Acto 3: 2, 5 ·
   Acto 4: 4, 5. Después el resto de cada tabla.

## 3. Videos con Veo (solo los momentos clave)
No hace falta animar todo: **el resto lo anima Claude en código** (movimientos de cámara lentos, parallax, subtítulos).
Clips de Veo sugeridos, **uno o dos por acto**:
| Archivo | Plano | Movimiento |
|---|---|---|
| `prologue-03.mp4` | Bar de salsa en el Callao | travelling lento entre las mesas, luces cálidas, gente bailando al fondo |
| `prologue-05.mp4` | Azotea al amanecer con Kuntur | Kuntur despliega las alas; sol que sale detrás del Misti |
| `act1-04.mp4` | Explosión tras el despegue | cohete que sube, falla y estalla a lo lejos; el equipo detrás del vidrio |
| `act1-08.mp4` | Celebración en control de misión | abrazos, pantalla de telemetría en verde, Kuntur aletea |
| `act2-06.mp4` | Espejo dorado que se despliega | el espejo se abre por segmentos; estrellas que pasan despacio |
| `act3-05.mp4` | Paracaídas que se rompe | tela que se rasga en el túnel de viento; el equipo en silencio |
| `act4-04.mp4` | Motor de Paulet en órbita | el motor gira despacio sobre los Andes; reflejo del sol |

Pasos para cada clip:
1. Chat nuevo en Gemini → herramienta **"Video"** (Veo).
2. Clip (📎) → sube la **imagen aprobada del plano** (por ejemplo `act1-04.png`) como fotograma inicial.
3. Pega el prompt completo del clip, que está al final de **`docs/gemini-prompts.md`** (sección "Videos con Veo").
4. Espera (1–3 min). Si los rostros cambian o aparece texto, pulsa **Regenerar** o ajusta el prompt.
5. **Descargar** → guarda como `media\act-videos\main\veo\act1-04.mp4`.
6. Gemini Pro tiene un **límite diario de videos**: si se acaba, sigue al día siguiente o usa otra cuenta con Pro y
   anótalo en la tabla de avance (abajo).
7. Los videos de Veo llevan su marca de agua visible: **no la quites**. Además, Claude añadirá "AI-generated" en el montaje.

## 4. Versión opcional con modelos chinos (no se publica)
Solo si el dueño la quiere para consultarla con el asesor: los mismos prompts en Higgsfield con `seedream_v5_pro`
(imágenes) y `seedance_2_5` (video, imagen del plano como `start_image`, 5–8 s, sin audio). Guardar **solo** en
`media\act-videos\optional-cn\` (está en `.gitignore`, no sube a GitHub). No se usa en el juego ni en la entrega
mientras no haya aprobación escrita.

## 5. Entregar a Claude para el montaje
1. Comprueba que los archivos estén en `media\act-videos\main\` (y `veo\`) con los nombres correctos.
2. Actualiza la tabla de avance (abajo) y haz commit, o díselo a Claude con este mensaje:
   ```text
   Las imágenes y clips de los actos están en media/act-videos/main/ (ver docs/gemini-manual.md, tabla de avance).
   Arma los 5 videos de acto según docs/act-videos.md: movimientos de cámara lentos en las imágenes, los clips de Veo
   donde existan, subtítulos EN/ES, marca "AI-generated" en una esquina y la música del juego. 40–60 s cada uno,
   720p H.264 para el juego. Conéctalos con un botón "Watch" saltable al inicio de cada acto. Actualiza el HANDOFF.
   ```
3. Claude reduce las imágenes para el juego (peso total pequeño: el juego se guarda entero para jugar sin conexión).

## 6. Tabla de avance (marcar al terminar cada uno)
| Acto | Planos de imagen | Hechos | Clips Veo | Hechos |
|---|---|---|---|---|
| Hoja de personajes | ref-characters | [x] | — | — |
| Prólogo | 01–06 | [ ] | 03, 05 | [ ] |
| Acto 1 | 01–09 | [ ] | 04, 08 | [ ] |
| Acto 2 | 01–06 | [ ] | 06 | [ ] |
| Acto 3 | 01–07 | [ ] | 05 | [ ] |
| Acto 4 | 01–06 | [ ] | 04 | [ ] |

## 7. Recordatorios de la entrega
- Toda imagen o video generado lleva marca visible de IA; se declara en la página del proyecto ("Use of SI").
- Sin menores de 18, sin logos ni identificadores de NASA ni de empresas reales.
- Los planos "de archivo" (1957, 1969, 1976, 2018) son **ilustraciones**, no fotos reales: no usar fotos de terceros
  sin licencia. Si se usa una foto real de NASA, que sea de dominio público y citada en Referencias.

## 8. Lo que NO tienes que generar
- **Videos educativos al final de cada misión** (`docs/mission-videos.md`): los hace Claude en la PC con animación por
  código (HyperFrames), mapas y texturas de NASA y voces de ElevenLabs. Tú solo apruebas las voces y los guiones.
- Carpetas: `media\mission-videos\<misión>\` (una por misión de la campaña).
