"""Build clean (no burned captions), render, compress for the game and make a review copy with Spanish subtitles burned in.
  python media/video-kit/tools/publish.py <project> [<project> ...]
Outputs:
  game/public/videos/<id>.mp4 + <id>.en.vtt + <id>.es.vtt   (the game overlays the .vtt in the player's language)
  <project>/<id>.mp4                                         (master, local only)
  <project>/review/<id>.es-review.mp4                        (Spanish subtitles burned in, for the owner's review, local only)"""
import sys, os, subprocess, shutil

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
KIT = os.path.join(ROOT, "media", "video-kit")
GAME = os.path.join(ROOT, "game", "public", "videos")
FONTS = os.path.join(KIT, "assets", "fonts")


def run(cmd, cwd=None):
    print("  $", cmd if isinstance(cmd, str) else " ".join(cmd), flush=True)
    r = subprocess.run(cmd, cwd=cwd, shell=isinstance(cmd, str))
    if r.returncode: sys.exit(f"failed: {cmd}")


ENCODE_ONLY = "--encode-only" in sys.argv  # reuse the existing master render
for proj in [a for a in sys.argv[1:] if not a.startswith("--")]:
    proj = os.path.abspath(proj); vid = os.path.basename(proj)
    print(f"== {vid}", flush=True)
    if not ENCODE_ONLY:
        run([sys.executable, "-X", "utf8", os.path.join(KIT, "tools", "build.py"), proj])
        run(f"npx --yes hyperframes@0.9.54 render -o {vid}.mp4 --crf 18 --quiet", cwd=proj)
    os.makedirs(GAME, exist_ok=True)
    run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(proj, vid + ".mp4"), "-c:v", "libx264", "-crf", "24", "-maxrate", "2800k", "-bufsize", "5600k", "-preset", "slow",
         "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", os.path.join(GAME, vid + ".mp4")])
    for lang in ("en", "es"):
        shutil.copy(os.path.join(proj, f"{vid}.{lang}.vtt"), os.path.join(GAME, f"{vid}.{lang}.vtt"))
    # review copy: Spanish burned in with the console caption look (Barlow Condensed, dark box)
    os.makedirs(os.path.join(proj, "review"), exist_ok=True)
    shutil.copy(os.path.join(proj, f"{vid}.es.vtt"), os.path.join(proj, "review", "es.vtt"))
    os.makedirs(os.path.join(proj, "review", "fonts"), exist_ok=True)
    for f in [x for x in os.listdir(FONTS) if x.endswith(".ttf")]: shutil.copy(os.path.join(FONTS, f), os.path.join(proj, "review", "fonts", f))
    style = "FontName=Barlow Condensed Medium,FontSize=15,PrimaryColour=&H00E2EFF4,BackColour=&H30100D0B,BorderStyle=3,Outline=5,Shadow=0,MarginV=26"
    run(["ffmpeg", "-v", "error", "-y", "-i", f"../{vid}.mp4", "-vf", f"subtitles=es.vtt:fontsdir=fonts:force_style='{style}'",
         "-c:v", "libx264", "-crf", "26", "-preset", "medium", "-c:a", "copy", f"{vid}.es-review.mp4"], cwd=os.path.join(proj, "review"))
    sz = os.path.getsize(os.path.join(GAME, vid + ".mp4")) / 1e6
    print(f"   -> game/public/videos/{vid}.mp4 ({sz:.1f} MB) + vtt en/es · review/{vid}.es-review.mp4", flush=True)
