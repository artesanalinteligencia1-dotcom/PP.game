#!/usr/bin/env python3
"""Build the 30 s "Watch Intro" test video (16:9) from generated assets.

Pipeline (option C of HANDOFF §17.3): still illustrations + slow camera moves (ffmpeg zoompan) +
narration + music bed with ducking + word-by-word burned subtitles (ASS) + an .srt for accessibility.

Usage:
  python3 scripts/video/build_intro_test.py ASSET_DIR OUT_DIR

ASSET_DIR must contain: s1.png s2.png s3.png narration.mp3 music.mp3
Generated media are NOT committed (third-party generated assets; see docs/video-pipeline notes).
"""
import os
import subprocess
import sys

FPS = 30
W, H = 1920, 1080
NARRATION_DELAY = 0.5
XF = 0.6  # crossfade seconds

# Speech segments (seconds, from ffmpeg silencedetect on the narration) and their text.
SEGMENTS = [
    (0.05, 1.085, "Arequipa, Peru."),
    (1.688, 3.667, "On a rooftop beneath the Misti volcano,"),
    (4.039, 6.040, "a kid kept asking the same question:"),
    (6.611, 7.700, "how do you get up there?"),
    (8.239, 10.362, "The first answer came from this same land."),
    (10.816, 13.991, "Pedro Paulet, an engineer who, according to his own account,"),
    (14.392, 17.756, "tested a liquid-fuel rocket engine in Paris in the 1890s."),
    (18.326, 20.004, "That kid grew up to be a physicist."),
    (20.439, 20.857, "His name:"),
    (21.338, 22.283, "Pedro Goicochea."),
    (22.756, 23.392, "And his mission..."),
    (23.958, 25.500, "is about to become yours."),
]
# Scene boundaries on the final timeline (seconds).
SCENES = [("s1.png", 0.0, 8.5, "in-up"), ("s2.png", 8.5, 18.6, "in"), ("s3.png", 18.6, 26.3, "out")]
END_CARD = (26.3, 30.0)
TOTAL = 30.0


def ts(t: float) -> str:
    h, rem = divmod(t, 3600)
    m, s = divmod(rem, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def srt_ts(t: float) -> str:
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def word_timings():
    """Distribute each segment's duration over its words, proportionally to word length."""
    out = []
    for a, b, text in SEGMENTS:
        words = text.split()
        weights = [len(w.strip(",.:?")) + 2 for w in words]
        total = sum(weights)
        t = a
        for w, k in zip(words, weights):
            d = (b - a) * k / total
            out.append((t + NARRATION_DELAY, t + d + NARRATION_DELAY, w))
            t += d
    return out


def write_ass(path: str):
    words = word_timings()
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,DejaVu Sans,64,&H00FFFFFF,&H00FFFFFF,&H00101010,&H64000000,1,0,0,0,100,100,0,0,1,4,2,2,80,80,90,1
Style: Title,DejaVu Sans,120,&H00FFFFFF,&H00FFFFFF,&H00101010,&H00000000,1,0,0,0,100,100,4,0,1,0,0,5,80,80,0,1
Style: Tag,DejaVu Sans,44,&H00F5B90B,&H00FFFFFF,&H00101010,&H00000000,1,0,0,0,100,100,2,0,1,0,0,5,80,80,0,1
Style: Note,DejaVu Sans,30,&H00B8A394,&H00FFFFFF,&H00101010,&H00000000,0,0,0,0,100,100,0,0,1,0,0,2,120,120,60,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = []
    # Group words into chunks of up to 4 words that never cross a segment.
    seg_ends = [b + NARRATION_DELAY for _, b, _ in SEGMENTS]
    chunks, cur = [], []
    for w in words:
        cur.append(w)
        at_seg_end = any(abs(w[1] - e) < 1e-6 for e in seg_ends)
        if len(cur) == 4 or at_seg_end:
            chunks.append(cur)
            cur = []
    if cur:
        chunks.append(cur)
    orange = r"{\c&H0B9EF5&}"
    white = r"{\c&HFFFFFF&}"
    for chunk in chunks:
        for i, (a, b, _) in enumerate(chunk):
            end = chunk[i + 1][0] if i + 1 < len(chunk) else b + 0.15
            text = " ".join((orange + w + white) if j == i else w for j, (_, _, w) in enumerate(chunk))
            lines.append(f"Dialogue: 0,{ts(a)},{ts(end)},Sub,,0,0,0,,{text}")
    a, b = END_CARD
    lines.append(f"Dialogue: 0,{ts(a + 0.3)},{ts(b)},Title,,0,0,0,,{{\\fad(400,0)}}PP.game")
    lines.append(f"Dialogue: 0,{ts(a + 0.8)},{ts(b)},Tag,,0,0,0,,{{\\fad(400,0)\\pos({W // 2},{H // 2 + 110})}}DESIGN IT. LAUNCH IT. LEARN FROM IT.")
    lines.append(
        f"Dialogue: 0,{ts(a + 0.8)},{ts(b)},Note,,0,0,0,,{{\\fad(400,0)}}Pedro Goicochea is a fictional character inspired by Pedro Paulet (1874–1945). "
        "Simplified educational model."
    )
    with open(path, "w", encoding="utf-8") as f:
        f.write(header + "\n".join(lines) + "\n")


def write_srt(path: str):
    with open(path, "w", encoding="utf-8") as f:
        for i, (a, b, text) in enumerate(SEGMENTS, 1):
            f.write(f"{i}\n{srt_ts(a + NARRATION_DELAY)} --> {srt_ts(b + NARRATION_DELAY)}\n{text}\n\n")


def zoom_expr(kind: str, frames: int) -> str:
    step = 0.10 / frames
    if kind == "out":
        z = f"if(eq(on,0),1.10,max(1.0,zoom-{step:.6f}))"
    else:
        z = f"min(zoom+{step:.6f},1.10)"
    y = "ih/2-(ih/zoom/2)" if kind != "in-up" else "max(0,ih/2-(ih/zoom/2)-on*0.6)"
    return f"zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='{y}':d={frames}:s={W}x{H}:fps={FPS}"


def main():
    src, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    ass = os.path.join(out, "intro_test.ass")
    srt = os.path.join(out, "intro_test.en.srt")
    write_ass(ass)
    write_srt(srt)

    inputs, filters = [], []
    lengths = []
    for i, (img, a, b, kind) in enumerate(SCENES):
        dur = (b - a) + (XF / 2 if i == 0 else XF)
        lengths.append(dur)
        frames = int(round(dur * FPS))
        inputs += ["-loop", "1", "-t", f"{dur:.3f}", "-i", os.path.join(src, img)]
        filters.append(f"[{i}:v]scale=3840:-1,{zoom_expr(kind, frames)},format=yuv420p,setsar=1[v{i}]")
    end_dur = END_CARD[1] - END_CARD[0] + XF / 2
    lengths.append(end_dur)
    n = len(SCENES)
    inputs += ["-f", "lavfi", "-t", f"{end_dur:.3f}", "-i", f"color=c=0x0b1020:s={W}x{H}:r={FPS}"]
    filters.append(f"[{n}:v]format=yuv420p,setsar=1[v{n}]")
    # Chain crossfades.
    prev, offset = "v0", 0.0
    for i in range(1, n + 1):
        offset += lengths[i - 1] - XF
        filters.append(f"[{prev}][v{i}]xfade=transition=fade:duration={XF}:offset={offset:.3f}[x{i}]")
        prev = f"x{i}"
    filters.append(f"[{prev}]trim=duration={TOTAL},ass={ass}[vout]")
    # Audio: narration delayed, music ducked under it.
    na, mu = n + 1, n + 2
    inputs += ["-i", os.path.join(src, "narration.mp3"), "-i", os.path.join(src, "music.mp3")]
    d = int(NARRATION_DELAY * 1000)
    filters.append(f"[{na}:a]adelay={d}|{d},apad,atrim=duration={TOTAL},asplit=2[voice][key]")
    filters.append(f"[{mu}:a]atrim=duration={TOTAL},volume=0.55,afade=t=out:st={TOTAL - 2}:d=2[bed]")
    filters.append("[bed][key]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[ducked]")
    filters.append("[voice][ducked]amix=inputs=2:normalize=0,alimiter=limit=0.95[aout]")
    cmd = (
        ["ffmpeg", "-y", "-v", "error"]
        + inputs
        + ["-filter_complex", ";".join(filters), "-map", "[vout]", "-map", "[aout]"]
        + ["-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k"]
        + ["-movflags", "+faststart", "-t", f"{TOTAL}", os.path.join(out, "intro_test_16x9.mp4")]
    )
    subprocess.run(cmd, check=True)
    print("wrote", os.path.join(out, "intro_test_16x9.mp4"), srt)


if __name__ == "__main__":
    main()
