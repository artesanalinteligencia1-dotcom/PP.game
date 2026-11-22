# Paulet video kit

Shared tools for every HyperFrames video in `media/mission-videos/<id>/` and `media/act-videos/<id>/`.

```
python media/video-kit/tools/fetch.py <project> <name.jpg> commons|nasa|url <ref> "<note>"   # real image + assets/SOURCES.md
C:/Paulet/tools/tts/.venv/Scripts/python.exe media/video-kit/tools/vo.py <project>           # Kokoro voices (one clip per caption)
python media/video-kit/tools/build.py <project>      # index.html, captions, compare/ending scenes, .en.vtt/.es.vtt, timing.txt
python media/video-kit/tools/check.py <project>      # npx hyperframes check, short summary
python media/video-kit/tools/shots.py <project> <out prefix> 3,9.5,17    # contact sheets of snapshots
cd <project> && npx hyperframes render -o <id>.mp4 --crf 20
ffmpeg -i <id>.mp4 -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart game/public/videos/<id>.mp4
```

- `video.json`: scenes in order; each line has `id`, `v` (nar, goi, chi, fra, rob), `en`, optional `tts` (numbers in words) and `es`.
  Scene length follows the voice; scenes overlap by 0.5 s for transitions (`K.enter` / `K.exit` in `kit.js`).
- Hand-written scenes live in `compositions/`; `K.cues("<scene>")` gives each line's start so animation lands on the voice.
- Voices: narrator `am_michael` 0.95, Goicochea `am_onyx` 0.9, Chicho `am_puck`, Franchesca `af_heart`, Roberto `am_eric`. Music at 0.18.
- Real images: public domain (NASA), no logos or insignia, on-screen credit, source logged in `assets/SOURCES.md`.
- AI images or clips (Gemini, Veo, character portraits) always carry a visible "AI-GENERATED" tag.

## Music
`assets/music/` holds **instrumental** versions of our ten ACE-Step songs (5 songs × takes A/B, `misti`, `fire`, `blueprints`,
`quiet-orbit`, `lagrange`), vocals removed locally with Demucs (htdemucs, MIT) and loudness-normalised. Use a different
track (or a different `musicStart` offset) for each video so they don't all sound the same. Assignment so far:
| Video | Music |
|---|---|
| earth_watch, andean_eye | home-beneath-the-misti (game mix) |
| station_resupply | flight-ambient (game mix) |
| storm_tracker | results-lagrange (game mix) |

## Publishing
`python media/video-kit/tools/publish.py <project>`: clean render (no burned captions), compressed copy in
`game/public/videos/` with `.en.vtt` / `.es.vtt` (the game player overlays the subtitles in the player's language), and a
review copy with Spanish burned in at `<project>/review/<id>.es-review.mp4`.

## Act videos (`media/act-videos/<prologue|act1..act4>/`)
The owner's Gemini images and Veo clips are **not** duplicated in git: copy them before building, e.g.
`cp media/act-videos/main/act2-0* media/act-videos/main/veo/act2-06.mp4 media/act-videos/act2/assets/`.
Voice clips (`assets/vo/*.wav`) are regenerated with `tools/vo.py` (cached by text and voice).
