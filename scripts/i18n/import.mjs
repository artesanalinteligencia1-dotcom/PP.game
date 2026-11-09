// Merge translated chunks back into src/i18n/strings/<lang>.json, checking them first.
//   node scripts/i18n/import.mjs es docs/i18n/done/es-01.json [more files…]
// Refuses the whole file if a key is unknown or a {placeholder} differs; keys are written in English-table order.
import fs from 'node:fs'

const [lang, ...files] = process.argv.slice(2)
if (!lang || !files.length) throw new Error('usage: node scripts/i18n/import.mjs <lang> <file.json>…')
const enPath = 'src/i18n/strings/en.json'
const outPath = `src/i18n/strings/${lang}.json`
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'))
const target = JSON.parse(fs.readFileSync(outPath, 'utf8'))
const ph = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join()

let added = 0
for (const file of files) {
  // Chats often wrap JSON in ``` fences; strip them.
  const raw = fs.readFileSync(file, 'utf8').replace(/^﻿/, '').replace(/^```(?:json)?\s*|\s*```\s*$/g, '')
  const chunk = JSON.parse(raw)
  const errors = []
  for (const [k, v] of Object.entries(chunk)) {
    if (!(k in en)) errors.push(`unknown key ${k}`)
    else if (typeof v !== 'string' || !v.trim()) errors.push(`empty ${k}`)
    else if (ph(v) !== ph(en[k])) errors.push(`placeholders differ in ${k}: "${v}"`)
  }
  if (errors.length) {
    console.error(`${file}: NOT imported\n  ${errors.join('\n  ')}`)
    process.exitCode = 1
    continue
  }
  for (const [k, v] of Object.entries(chunk)) {
    if (!(k in target)) added++
    target[k] = v
  }
  console.log(`${file}: ok (${Object.keys(chunk).length} strings)`)
}
const ordered = Object.fromEntries(Object.keys(en).filter((k) => k in target).map((k) => [k, target[k]]))
fs.writeFileSync(outPath, JSON.stringify(ordered, null, 2) + '\n')
console.log(`${added} new strings; ${Object.keys(en).length - Object.keys(ordered).length} still missing in ${lang}`)
