#!/usr/bin/env python3
"""Prepare launch voice lines and music loops downloaded from ElevenLabs for the game.

Usage:
  python3 scripts/audio/prepare_launch_audio.py --countdown countdown.mp3 --farewells farewells.mp3 \
      [--design-loop design.mp3] [--flight-loop flight.mp3]

Writes into src/assets/audio/{voice,music}/ (the game picks files up automatically):
  voice/count_10 … count_1, ignition, liftoff, farewell_1 … farewell_5   (split on silences)
  music/design-focus.mp3, music/flight-ambient.mp3
Countdown lines get a light "mission control radio" EQ; everything is loudness-normalised.
"""
import argparse
import os
import re
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VOICE = os.path.join(ROOT, "src", "assets", "audio", "voice")
MUSIC = os.path.join(ROOT, "src", "assets", "audio", "music")


def speech_segments(path: str, noise: str = "-35dB", min_silence: float = 0.3):
    out = subprocess.run(
        ["ffmpeg", "-v", "info", "-i", path, "-af", f"silencedetect=noise={noise}:d={min_silence}", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    dur = float(re.search(r"Duration: (\d+):(\d+):([\d.]+)", out).groups()[2]) + 60 * float(
        re.search(r"Duration: (\d+):(\d+):([\d.]+)", out).groups()[1])
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    segs, cur = [], 0.0
    for s, e in zip(starts, ends):
        if s - cur > 0.08:
            segs.append((max(0.0, cur - 0.03), s + 0.05))
        cur = e
    if dur - cur > 0.08:
        segs.append((max(0.0, cur - 0.03), dur))
    return segs


def cut(src, a, b, dst, radio=False):
    af = "highpass=f=250,lowpass=f=3800,acompressor=threshold=-18dB:ratio=3," if radio else ""
    af += "loudnorm=I=-16:TP=-1.5"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", src, "-af", af, "-b:a", "96k", dst], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--countdown")
    ap.add_argument("--farewells")
    ap.add_argument("--design-loop")
    ap.add_argument("--flight-loop")
    a = ap.parse_args()
    os.makedirs(VOICE, exist_ok=True)
    os.makedirs(MUSIC, exist_ok=True)
    if a.countdown:
        segs = speech_segments(a.countdown)
        if len(segs) < 12:
            raise SystemExit(f"expected ≥ 12 spoken segments in the countdown, found {len(segs)}; adjust --noise/min_silence")
        names = [f"count_{n}" for n in range(10, 0, -1)] + ["ignition"]
        for name, (s, e) in zip(names, segs[:11]):
            cut(a.countdown, s, e, os.path.join(VOICE, f"{name}.mp3"), radio=True)
        cut(a.countdown, segs[11][0], segs[-1][1], os.path.join(VOICE, "liftoff.mp3"), radio=True)
    if a.farewells:
        segs = speech_segments(a.farewells, min_silence=0.3)
        if len(segs) < 5:
            raise SystemExit(f"expected ≥ 5 farewell lines, found {len(segs)}")
        for i, (s, e) in enumerate(segs[:4], 1):
            cut(a.farewells, s, e, os.path.join(VOICE, f"farewell_{i}.mp3"))
        cut(a.farewells, segs[4][0], segs[-1][1], os.path.join(VOICE, "farewell_5.mp3"))
    for src, name in ((a.design_loop, "design-focus"), (a.flight_loop, "flight-ambient")):
        if src:
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af", "loudnorm=I=-20:TP=-1.5", "-b:a", "128k", os.path.join(MUSIC, f"{name}.mp3")], check=True)
    print("done:", sorted(os.listdir(VOICE)), sorted(os.listdir(MUSIC)))


if __name__ == "__main__":
    main()
