# Prompt for translating a chunk in a chat (Gemini, etc.)

Paste everything below the line into the chat, then attach (or paste) **one** file from `docs/i18n/todo/`
and the glossary `docs/i18n/GLOSSARY.md`. Save the answer as `docs/i18n/done/<same file name>`.

---

You are translating the user interface of "Paulet: Andes to Orbit", an educational space-mission design game, from
English to Spanish (neutral Latin American, addressing the player as "tú"). Players are teenagers and adults; the
tone is clear, warm and precise, like a good science museum.

Input: a JSON object `{ "key": "English text" }`. Output: **only** the same JSON object with the same keys in the same
order and the values translated. No comments, no explanations, no code fences.

Rules:
1. Keep every `{placeholder}` exactly as written (same name, same braces). You may move it inside the sentence.
2. Follow the attached glossary for every term in it. Keep Δv, TRL, LEO, GTO, SSO, L1, L2, units (m/s, kg, W, km, Mbps),
   the game name and rocket names unchanged.
3. Keys hint at where the text appears: `*.hint` = short helper line, `*.title` = heading, `*.label` = button/field.
   Keep buttons and labels as short as the English (the layout is fixed); headings without a final period.
4. Facts about Pedro Paulet are what he *claimed*: keep that nuance ("según su relato", "afirmó"); never state them as proven.
5. Keep symbols, arrows, dashes and line breaks (`\n`) as they are. Use ¿? and ¡! properly.
6. Do not translate text inside `[[double brackets]]` if any appears.
