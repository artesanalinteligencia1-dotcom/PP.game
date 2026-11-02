# DECISIONS (decision / alternative / reason)

- Tailwind 4 via `@tailwindcss/vite` / Tailwind 3 + PostCSS / no config file, simpler.
- Repo cloned to `C:\PPgame\PP.game` / inside Google Drive folder / avoids syncing `node_modules`.
- Tests in `/tests` (not co-located) / co-located / matches HANDOFF §3 layout.
- Latest majors (TS 7, Vite 8, Vitest 5) / pinned older / default; fall back if breakage.
