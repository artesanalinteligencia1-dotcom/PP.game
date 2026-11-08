// List likely player-visible English text that is still hard-coded (not going through t()).
//   node scripts/i18n/find-hardcoded.mjs            → count per file
//   node scripts/i18n/find-hardcoded.mjs src/ui/X.tsx → every hit in that file
// Heuristic: JSX text nodes, and quoted strings that start with a capital letter and contain a space.
// It has false positives (class names, comments, ids); it is a progress meter, not a test.
import fs from 'node:fs'
import path from 'node:path'

const SKIP = ['src/i18n', 'src/ui/proto', 'src/ui/mock', 'src/ui/launch/three/SceneDebug.tsx']
const files = []
const walk = (d) => {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f).replaceAll('\\', '/')
    if (SKIP.some((s) => p.startsWith(s))) continue
    if (fs.statSync(p).isDirectory()) walk(p)
    else if (/\.(ts|tsx)$/.test(p)) files.push(p)
  }
}
const only = process.argv[2]?.replaceAll('\\', '/')
if (only) files.push(only)
else walk('src')

const JSX_TEXT = />\s*([A-Za-z][^<>{}]*[A-Za-z.!?…])\s*</g
const QUOTED = /(['"`])([A-Z][^'"`\n]*\s[^'"`\n]*)\1/g
let total = 0
for (const f of files) {
  const lines = fs.readFileSync(f, 'utf8').split('\n')
  const hits = []
  lines.forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, '')
    if (/^\s*(\*|\/\*|import )/.test(code) || code.includes('className=')) {
      for (const m of code.matchAll(JSX_TEXT)) hits.push([i + 1, m[1]])
      return
    }
    for (const m of code.matchAll(JSX_TEXT)) hits.push([i + 1, m[1]])
    for (const m of code.matchAll(QUOTED)) hits.push([i + 1, m[2]])
  })
  if (!hits.length) continue
  total += hits.length
  if (only) for (const [n, s] of hits) console.log(`${f}:${n}  ${s}`)
  else console.log(String(hits.length).padStart(4), f)
}
console.log(`${total} candidate strings`)
