# Tutorial 1 — Imágenes con Gemini

**Para qué:** la diapositiva 3 ("el juego en una imagen": el equipo de Goicochea alrededor de la mesa), retratos de los
cuatro personajes para el panel del equipo y un fondo de Arequipa al amanecer.
**Tiempo:** 20–30 minutos. **Costo:** incluido en tu Gemini Pro.

## Pasos
1. Abre https://gemini.google.com con tu cuenta Pro. Elige el modelo con generación de imágenes (el que diga "imagen"
   o el modelo por defecto de Gemini Pro; si te pregunta, elige la mejor calidad).
2. **Primero fija el estilo** con la imagen de referencia de estilo (prompt A). Cuando te guste una, úsala como
   referencia en las siguientes: súbela con el botón "+" y escribe "Use the same art style as this image".
3. Pega cada prompt tal cual. Si sale algo raro (manos, texto ilegible, logos), pide: *"Same image, but remove any text
   and logos, and fix the hands."*
4. Descarga en la máxima resolución (botón de descarga) y renombra según la tabla.
5. Revisa con esta lista antes de guardar: ¿todos se ven adultos? ¿no hay logos ni banderas? ¿no hay texto inventado?

## Prompts

**A · Referencia de estilo** → `style-ref.png`
> Cinematic digital painting, warm dawn light, Arequipa (Peru) rooftop with the snow-capped Misti volcano in the
> background, white volcanic sillar stone walls, a small engineering workshop with a wooden table, sketches of rockets
> and satellites pinned on a board, an old leather notebook open on the table. Muted graphite and cream palette with
> orange and gold accents. Semi-realistic, clean shapes, no text, no logos, no flags. 16:9.

**B · Diapositiva 3, escena del equipo** → `slide3-team.png` (16:9)
> Same art style. Four adult scientists (late 30s to late 40s) gathered around a wooden table on an Arequipa
> rooftop at dawn, the Misti volcano behind them. They look at a laptop showing a dark spacecraft-design interface with
> orange and gold charts. Dr. Pedro Goicochea, a Peruvian man in his late 40s with short greying hair, light stubble and
> a rolled-up white shirt, holding an old leather notebook, points at the screen; Chicho, a stocky, cheerful Peruvian
> man in his late 40s in a grease-stained olive work jacket with a wrench in the chest pocket; Roberto, a slim Peruvian
> man in his late 40s with glasses, a dark cable-knit sweater and a tablet with plots; Franchesca, a Peruvian-American
> woman in her late 30s with curly dark hair tied up, an olive field vest with sample tubes and an orange Andean
> textile scarf. An open old notebook with rocket sketches lies on the table. Kuntur, a small geometric robot
> condor with flat stepped shapes, cream and gold, with glowing amber eyes, perches on the table edge. Match every
> character exactly to the attached reference sheet (`ref-characters.jpg`). Warm, hopeful, cinematic. No text, no logos, no
> flags, no agency insignia.

**C · Retratos (uno por personaje, cuadrados 1:1)** → `portrait-goicochea.png`, `portrait-chicho.png`,
`portrait-roberto.png`, `portrait-franchesca.png`
> Same art style. Bust portrait of {DESCRIPCIÓN DEL PERSONAJE DEL PROMPT B}, three-quarter view, soft dawn rim light,
> plain dark graphite background, friendly confident expression. Adult. No text, no logos. Square 1:1.

**D · Fondo del menú (opcional)** → `bg-arequipa-dawn.png` (16:9, sin personas)
> Same art style. Wide view of Arequipa at dawn from a rooftop, the Misti volcano centered, a small launch tower far
> away on the high plain, first sunlight on the snow, deep blue to orange sky. No people, no text, no logos. 16:9.

## Qué hago yo (Claude) después
- Pongo la marca "AI-generated" visible en la esquina, recorto y optimizo (WebP) para el juego y las diapositivas.
- Declaro las imágenes y sus prompts en la sección de IA de la página del proyecto.
