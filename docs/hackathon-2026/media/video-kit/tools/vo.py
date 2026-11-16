"""Kokoro voice-over: one clip per caption line. Run with C:/PPgame/tools/tts/.venv/Scripts/python.exe tools/vo.py <project dir>
Reads <project>/video.json, writes assets/vo/<id>.wav and assets/vo/durations.json (cached by text+voice)."""
import sys, json, os, hashlib
import numpy as np, soundfile as sf
VOICES = {"nar": ("am_michael", 0.95), "goi": ("am_onyx", 0.9), "chi": ("am_puck", 1.0), "fra": ("af_heart", 1.0), "rob": ("am_eric", 1.0)}
pipe = None
for proj in sys.argv[1:]:
    cfg = json.load(open(os.path.join(proj, "video.json"), encoding="utf-8"))
    out = os.path.join(proj, "assets", "vo"); os.makedirs(out, exist_ok=True)
    dpath = os.path.join(out, "durations.json")
    dur = json.load(open(dpath)) if os.path.exists(dpath) else {}
    for sc in cfg["scenes"]:
        for ln in sc.get("lines", []):
            if not ln.get("v"): continue
            text = ln.get("tts") or ln["en"]; voice, speed = VOICES[ln["v"]]
            h = hashlib.md5((voice + str(speed) + text).encode()).hexdigest()[:10]
            wav = os.path.join(out, ln["id"] + ".wav")
            if dur.get(ln["id"], {}).get("h") == h and os.path.exists(wav): continue
            if pipe is None:
                from kokoro import KPipeline
                pipe = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")
            a = np.concatenate([x for _, _, x in pipe(text, voice=voice, speed=speed)])
            # trim trailing silence, keep 0.12 s
            nz = np.where(np.abs(a) > 0.004)[0]
            if len(nz): a = a[: min(len(a), nz[-1] + int(0.12 * 24000))]
            sf.write(wav, a, 24000); dur[ln["id"]] = {"h": h, "d": round(len(a) / 24000, 2)}
            print(proj, ln["id"], dur[ln["id"]]["d"])
    json.dump(dur, open(dpath, "w"), indent=1)
