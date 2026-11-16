"""Snapshot a project at given times and tile them into contact sheets (6 per sheet, 3x2 at 640x360).
  python shots.py <project> <out prefix> t1,t2,..."""
import sys, os, subprocess, glob, shutil
proj, out, times = sys.argv[1], sys.argv[2], sys.argv[3]
d = out + "_frames"; shutil.rmtree(d, ignore_errors=True)
subprocess.run(f'npx hyperframes snapshot --at {times} --no-end -o "{d}"', cwd=proj, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
fs = sorted(glob.glob(os.path.join(d, "*.png")), key=os.path.getmtime)
fs = [f for f in fs if "sheet" not in os.path.basename(f).lower() and "contact" not in os.path.basename(f).lower()]
print(len(fs), "frames", [os.path.basename(f) for f in fs])
for k in range(0, len(fs), 6):
    grp = fs[k:k + 6]; ins = " ".join(f'-i "{f}"' for f in grp); n = len(grp)
    filt = "".join(f"[{i}]scale=640:360[s{i}];" for i in range(n)) + "".join(f"[s{i}]" for i in range(n)) + f"xstack=inputs={n}:layout=" + "|".join(f"{(i % 3) * 640}_{(i // 3) * 360}" for i in range(n)) + ":fill=black"
    if n == 1: filt = "[0]scale=640:360"
    subprocess.run(f'ffmpeg -v error -y {ins} -filter_complex "{filt}" -q:v 3 "{out}_{k // 6 + 1}.jpg"', shell=True)
    print(f"{out}_{k // 6 + 1}.jpg")
