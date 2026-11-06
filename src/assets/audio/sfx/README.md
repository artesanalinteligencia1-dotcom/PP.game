# Sound effects (ElevenLabs, generated 2026-11-02)

The game loads any of these files automatically if present (`src/audio/audio.ts`):

countdown.mp3 · liftoff.mp3 · staging.mp3 · fairing.mp3 · deploy.mp3 · orbit.mp3 · explosion.mp3 · alert.mp3 · success.mp3 · failure.mp3

They were generated in the ElevenLabs flow "PP.game — media tests" (flow id 0LCbZREUNFxbn2azaj88, nodes "SFX …"),
but the cloud session could not download them (network policy blocks elevenlabsusercontent.com). See LOCAL_TODO.md.
Normalise with: `ffmpeg -i in.mp3 -af loudnorm=I=-18:TP=-1.5 -b:a 96k out.mp3`.
