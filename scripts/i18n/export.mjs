// Export the English strings that a language still lacks, in chunks, for translation in a chat (Gemini, etc.).
//   node scripts/i18n/export.mjs es [chunkSize]
// Writes docs/i18n/todo/es-01.json, es-02.json… Each file is a flat { key: English text } object.
import fs from 'node:fs'
import path from 'node:path'

const lang = process.argv[2]
const size = Number(process.argv[3] ?? 150)
if (!lang) throw new Error('usage: node scripts/i18n/export.mjs <lang> [chunkSize]')
const en = JSON.parse(fs.readFileSync('src/i18n/strings/en.json', 'utf8'))
const target = JSON.parse(fs.readFileSync(`src/i18n/strings/${lang}.json`, 'utf8'))
const missing = Object.entries(en).filter(([k]) => !(k in target))
const dir = 'docs/i18n/todo'
fs.mkdirSync(dir, { recursive: true })
for (const f of fs.readdirSync(dir)) if (f.startsWith(`${lang}-`)) fs.unlinkSync(path.join(dir, f))
for (let i = 0; i < missing.length; i += size) {
  const file = path.join(dir, `${lang}-${String(i / size + 1).padStart(2, '0')}.json`)
  fs.writeFileSync(file, JSON.stringify(Object.fromEntries(missing.slice(i, i + size)), null, 2) + '\n')
  console.log(file)
}
console.log(`${missing.length} strings missing in ${lang}`)
