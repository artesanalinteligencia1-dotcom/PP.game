# Video & game style guide (shared)

Videos must look like the game. Every token below is used by the game UI (`src/index.css`, Tailwind classes) and by the
video pipeline (`scripts/video/`).

## Palette
| Token | Hex | Used for |
|---|---|---|
| Space (background) | `#020617` | page and video background |
| Panel | `#0f172a` | cards, end card |
| Text | `#e2e8f0` | body text, subtitles |
| Muted | `#94a3b8` | secondary text, disclaimers |
| Sky (accent) | `#38bdf8` | links, selection, tagline |
| Launch orange | `#f97316` | launch button, highlighted subtitle word |
| Science violet | `#a78bfa` | science, astrophysics instruments |
| Life green | `#34d399` | success, astrobiology instruments |
| Warning amber | `#fbbf24` | warnings, sunlight, flames |
| Danger rose | `#f43f5e` | blocking errors, eclipse arc |
| Gold foil | `#d4a017` | spacecraft body |

## Typography
- **Space Grotesk** (700) for titles, numbers on end cards and the logo. **Inter** (400/700) for text and subtitles.
- Both OFL-1.1. Web: `@fontsource-variable/*`. Video: static TTFs in `scripts/video/fonts/` (with licences).

## Subtitles
- Inter Bold, 64 px at 1080p (scale with height), white with a 4 px dark outline, centred, lower third.
- Word-by-word: the current word in launch orange `#f97316`; max 4 words on screen; never cross a sentence.
- Always ship an `.srt`/`.vtt` too (accessibility).

## Rhythm and camera
- A new shot every 3–4 s; slow zoom/pan (≤ 10 % per shot); 0.6 s crossfades.
- Illustration style: flat/painterly 2D, muted blues/violets/oranges, dramatic light, original characters only.

## Formats to test (HANDOFF §19.5)
| Format | Size | Use | Safe area |
|---|---|---|---|
| 16:9 | 1920×1080 | Watch Intro in the game, jury demo | subtitles ≥ 90 px from bottom |
| 9:16 | 1080×1920 | social media | keep text inside the central 1080×1440 |
| 1:1 | 1080×1080 | feeds | subtitles ≥ 120 px from bottom |

## Continuity rules
- Every video ends on the real home screen of the game (or its end card: logo + "Design it. Launch it. Learn from it.").
- Show only what exists in the game (same spacecraft drawing, rockets, palette).
- Always state "Simplified educational model" and, when Pedro Goicochea appears, that he is a fictional character inspired by Pedro Paulet.
