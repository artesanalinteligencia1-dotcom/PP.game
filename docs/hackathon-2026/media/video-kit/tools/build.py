"""Assemble a HyperFrames video project from <project>/video.json.
  python tools/build.py <project dir> [...]
Lays the scenes out on the voice (assets/vo/durations.json from vo.py), then writes index.html, compositions/captions.html,
generated scenes (compare, ending), <id>.en.vtt / <id>.es.vtt and timing.txt. Hand-written scenes in compositions/ are kept."""
import sys, json, os, shutil, html
KIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAME_AUDIO = os.path.join(KIT, "..", "..", "game", "src", "assets", "audio")
OVERLAP = 0.5
WHO = {"goi": ("DR. PEDRO GOICOCHEA", "MISSION DIRECTOR", "goicochea", "GOICOCHEA"), "chi": ("CHICHO", "SPACECRAFT ENGINEER", "chicho", "CHICHO"),
       "rob": ("ROBERTO", "ASTROPHYSICIST", "roberto", "ROBERTO"), "fra": ("FRANCHESCA", "ASTROBIOLOGIST", "franchesca", "FRANCHESCA")}
Q = chr(34)


def E(s):
    return html.escape(s, quote=False)


def ts(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}"


def copy(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if not os.path.exists(dst) or os.path.getmtime(src) > os.path.getmtime(dst):
        shutil.copy2(src, dst)


def gen_compare(sc, c):
    p = sc["id"]; rows = sc["rows"]; ph = sc.get("photo")
    first = sc["lines"][0]["id"]; last = sc["lines"][-1]["id"]
    rh = ""
    for i, r in enumerate(rows):
        top = 262 + i * 166
        rh += f'''      <div class="k-abs" id="{p}-row{i}" style="left:940px; top:{top}px; width:840px; height:150px">
        <div class="k-label gold" style="left:0; top:0">{E(r["label"])}</div>
        <div class="k-num" id="{p}-val{i}" style="left:0; top:38px; font-size:88px">{E(r["value"])}</div>
        <div class="k-label" style="right:0; top:86px; font-size:28px">{E(r.get("note", ""))}</div>
        <div class="k-abs" style="left:0; top:138px; width:840px; height:4px; background:#252a31"></div>
        <div class="k-abs" id="{p}-bar{i}" style="left:0; top:138px; width:{int(840 * r.get("frac", 1))}px; height:4px; background:{r.get("color", "#f08a3c")}"></div>
      </div>\n'''
    chips = "".join(f'<div class="k-chip" style="position:relative; display:inline-block; margin-right:18px; border-color:#36d1ff; color:#36d1ff">{E(x)}</div>' for x in sc["yours"])
    photo = ""
    if ph:
        tag = f'<div class="k-ai">{E(ph["tag"])}</div>' if ph.get("tag") else ""
        photo = f'''      <div class="k-photo" id="{p}-photo" style="left:140px; top:262px; width:720px; height:478px">
        <img id="{p}-img" src="assets/{ph["src"]}" alt="" style="object-position:{ph.get("pos", "50% 50%")}">
        <div class="k-credit">{E(ph.get("credit", "Image: NASA"))}</div>{tag}
      </div>\n'''
    js_rows = "".join(f'    K.fade(tl, "#{p}-row{i}", t0 + {i} * step, 0.5, 0, 30); K.grow(tl, "#{p}-bar{i}", t0 + {i} * step + 0.15, 1.2);\n' for i in range(len(rows)))
    js_photo = f'K.photo(tl, "#{p}-photo", 0.7); K.kb(tl, "#{p}-img", 0.7, c.dur, {{ s: 1.0 }}, {{ s: 1.14, x: -14 }});' if ph else ""
    return f'''<template>
  <div id="root" data-composition-id="{p}" data-width="1920" data-height="1080" data-layout-allow-overlap style="position:absolute; inset:0; overflow:hidden">
    <div id="{p}-stage" class="k-stage">
      <div class="k-grid"></div>
      <div class="k-kicker" id="{p}-kicker" style="left:140px; top:92px">{E(sc.get("kicker", "YOUR MISSION VS. THE REAL ONE"))}</div>
      <div class="k-h2" id="{p}-title" style="left:140px; top:136px">{E(sc["title"])}</div>
{photo}{rh}      <div class="k-panel" id="{p}-yours" style="left:140px; top:772px; width:1640px; height:104px; border-color:#36d1ff">
        <div class="k-label cyan" style="left:24px; top:8px; font-size:28px">YOUR DESIGN · COMPARE WITH YOUR MISSION REPORT</div>
        <div class="k-abs" style="left:24px; top:48px; white-space:nowrap">{chips}</div>
      </div>
    </div>
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }}); const c = K.cues("{p}");
    K.enter(tl, "#{p}-stage", "{sc.get("enter", "whip")}");
    K.fade(tl, "#{p}-kicker", 0.35); K.fade(tl, "#{p}-title", 0.5, 0.6, 24);
    {js_photo}
    const t0 = c("{first}", 0.3), step = Math.max(1.1, (c.end("{first}") - c("{first}") - 0.8) / {max(1, len(rows))});
{js_rows}    K.fade(tl, "#{p}-yours", c("{last}", -0.2), 0.6, 30);
    tl.fromTo("#{p}-yours .k-chip", {{ opacity: 0, y: 14 }}, {{ opacity: 1, y: 0, duration: 0.4, stagger: 0.18, ease: "back.out(2)" }}, c("{last}", 0.3));
    K.exit(tl, "#{p}-stage", "{sc.get("exit", "zoom")}", c.dur);
    window.__timelines["{p}"] = tl;
  </script>
</template>
'''


def gen_ending(sc, c):
    p = sc["id"]; name, role, img, _ = WHO[sc["who"]]; ln = sc["lines"][0]["id"]
    return f'''<template>
  <div id="root" data-composition-id="{p}" data-width="1920" data-height="1080" data-layout-allow-overlap style="position:absolute; inset:0; overflow:hidden">
    <div id="{p}-stage" class="k-stage">
      <div class="k-grid"></div>
      <div class="k-panel" id="{p}-card" style="left:200px; top:120px; width:1520px; height:470px">
        <div class="k-head">TRANSMISSION · {E(name)}</div>
        <div class="k-photo" id="{p}-photo" style="left:40px; top:92px; width:300px; height:334px; box-shadow:none"><img src="assets/kit/portraits/{img}.jpg" alt=""><div class="k-credit">AI-GENERATED</div></div>
        <div class="k-label orange" id="{p}-role" style="left:390px; top:92px; font-weight:600">{E(role)}</div>
        <div class="k-abs" id="{p}-quote" style="left:390px; top:142px; width:1080px; font-size:{sc.get("size", 60)}px; line-height:1.15; font-weight:600">“{E(sc["quote"])}”</div>
      </div>
      <div class="k-abs" id="{p}-src" style="left:200px; top:624px; width:1520px; font-size:30px; line-height:1.45; color:#8a8f98; letter-spacing:.04em"><b style="color:#d9b46a; letter-spacing:.14em; font-weight:600">LEARN MORE</b><br>{E(sc["learn"])}</div>
      <div class="k-abs" id="{p}-credit" style="left:200px; top:780px; width:1520px; font-size:28px; line-height:1.35; color:#8a8f98; letter-spacing:.06em">{E(sc.get("images", "Real images: NASA, public domain"))} · Animation: Paulet Delta-V · Narration: AI voice (Kokoro, open model, run locally) · Music: generated locally with ACE-Step 1.5 · Characters: AI-generated illustration</div>
    </div>
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }}); const c = K.cues("{p}");
    K.enter(tl, "#{p}-stage", "{sc.get("enter", "zoom")}");
    K.fade(tl, "#{p}-card", 0.2, 0.7, 30);
    tl.fromTo("#{p}-photo img", {{ scale: 1.12 }}, {{ scale: 1, duration: 1.2, ease: "power2.out" }}, 0.4);
    K.fade(tl, "#{p}-role", 0.6, 0.4, 0);
    tl.fromTo("#{p}-quote", {{ clipPath: "inset(0 100% 0 0)" }}, {{ clipPath: "inset(0 0% 0 0)", duration: Math.max(1.5, (c.end("{ln}") - c("{ln}")) * 0.7), ease: "none" }}, c("{ln}"));
    K.fade(tl, "#{p}-src", c("{ln}", 0.8), 0.6);
    K.fade(tl, "#{p}-credit", c("{ln}", 1.6), 0.6, 0);
    tl.fromTo("#{p}-card", {{ scale: 1 }}, {{ scale: 1.03, duration: c.dur, ease: "none" }}, 0.9);
    tl.to("#{p}-stage", {{ opacity: 0, duration: 1.0, ease: "power2.in" }}, c.dur - 1.05);
    window.__timelines["{p}"] = tl;
  </script>
</template>
'''


def build(proj):
    cfg = json.load(open(os.path.join(proj, "video.json"), encoding="utf-8")); vid = cfg["id"]
    dp = os.path.join(proj, "assets", "vo", "durations.json"); vd = json.load(open(dp)) if os.path.exists(dp) else {}
    A = os.path.join(proj, "assets", "kit")
    for f in os.listdir(os.path.join(KIT, "assets", "fonts")):
        copy(os.path.join(KIT, "assets", "fonts", f), os.path.join(proj, "assets", "fonts", f))
    for f in os.listdir(os.path.join(KIT, "assets", "portraits")):
        copy(os.path.join(KIT, "assets", "portraits", f), os.path.join(A, "portraits", f))
    if cfg.get("earth", True):
        for f in ("earth-day.jpg", "earth-night.jpg"):
            copy(os.path.join(KIT, "assets", f), os.path.join(A, f))
    music = cfg.get("music", "misti-a.mp3")
    kit_music = os.path.join(KIT, "assets", "music", music)  # instrumental versions of our ACE-Step songs (vocals removed with Demucs)
    copy(kit_music if os.path.exists(kit_music) else os.path.join(GAME_AUDIO, "music", music), os.path.join(A, music))
    for s in cfg.get("sfx", []):
        if os.path.exists(os.path.join(proj, "assets", s["src"])): s["_own"] = True  # project's own sound (e.g. a synthesised beep)
        else: copy(os.path.join(GAME_AUDIO, "sfx", s["src"]), os.path.join(A, s["src"]))
    t = 0.0; scenes = []; caps = []; audio = []; cues = {}
    for sc in cfg["scenes"]:
        start = t; lt = sc.get("lead", 0.8); lines = {}
        for k, ln in enumerate(sc.get("lines", [])):
            if "at" in ln: lt = ln["at"]
            elif k: lt += ln.get("gap", 0.45)
            d = vd.get(ln["id"], {}).get("d") if ln.get("v") else None
            if d is None: d = ln.get("dur", round(len(ln["en"].split()) * 0.42 + 0.8, 2))
            lines[ln["id"]] = [round(lt, 2), round(lt + d, 2)]
            caps.append([round(start + lt, 2), d, ln])
            if ln.get("v") and ln["id"] in vd: audio.append((ln["id"], round(start + lt, 2), d))
            lt += d
        sd = sc["dur"] if "dur" in sc else max(sc.get("min", 0), lt + sc.get("tail", 0.9))
        sd = round(sd, 2); cues[sc["id"]] = {"dur": sd, "lines": lines}; scenes.append((sc, round(start, 2), sd)); t = start + sd
    total = round(t, 2)
    for i, c in enumerate(caps):
        nxt = caps[i + 1][0] if i + 1 < len(caps) else total
        c.append(round(max(0.5, min(c[1] + 0.4, nxt - c[0] - 0.04)), 2))
    os.makedirs(os.path.join(proj, "compositions"), exist_ok=True)
    hosts = ""
    for i, (sc, st, sd) in enumerate(scenes):
        last = i == len(scenes) - 1
        hosts += f'      <div id="{sc["id"]}" data-composition-id="{sc["id"]}" data-composition-src="compositions/{sc["id"]}.html" data-start="{st}" data-duration="{round(sd + (0 if last else OVERLAP), 2)}" data-track-index="{1 + i % 2}" data-track-kind="graphics" data-width="1920" data-height="1080" style="z-index:{i + 1}"></div>\n'
        gen = {"compare": gen_compare, "ending": gen_ending}.get(sc.get("gen"))
        if gen:
            open(os.path.join(proj, "compositions", sc["id"] + ".html"), "w", encoding="utf-8").write(gen(sc, cues[sc["id"]]))
        elif not os.path.exists(os.path.join(proj, "compositions", sc["id"] + ".html")):
            print("  !! missing scene", sc["id"])
    hid = ' data-hidden="true"' if CAP == "none" else ""
    hosts += f'      <div id="captions" data-composition-id="captions" data-composition-src="compositions/captions.html" data-start="0" data-duration="{total}" data-track-index="3" data-track-kind="captions" data-width="1920" data-height="1080" style="z-index:60"{hid}></div>\n'
    for (i, st, d) in audio:
        hosts += f'      <audio id="a-{i}" src="assets/vo/{i}.wav" data-start="{st}" data-duration="{d}" data-track-index="4" data-volume="1"></audio>\n'
    ms = f' data-media-start={Q}{cfg["musicStart"]}{Q}' if cfg.get("musicStart") else ""
    hosts += f'      <audio id="music" src="assets/kit/{music}" data-start="0" data-duration="{total}" data-track-index="5" data-volume="{cfg.get("musicVol", 0.18)}" data-fade-in="2" data-fade-out="4"{ms}></audio>\n'
    for k, s in enumerate(cfg.get("sfx", [])):
        base = next(st for (sc, st, sd) in scenes if sc["id"] == s["scene"]); cu = cues[s["scene"]]["lines"]
        at = base + (cu[s["cue"]][0] + s.get("off", 0) if "cue" in s else s["at"])
        hosts += f'      <audio id="sfx{k}" src="assets/{"" if s.get("_own") else "kit/"}{s["src"]}" data-start="{round(at, 2)}" data-duration="{s.get("dur", 3)}" data-track-index="{6 + k % 2}" data-volume="{s.get("vol", 0.45)}" data-fade-out="{s.get("fade", 0.8)}"></audio>\n'
    css = open(os.path.join(KIT, "kit.css"), encoding="utf-8").read(); js = open(os.path.join(KIT, "kit.js"), encoding="utf-8").read()
    three = '    <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>\n' if cfg.get("three", True) else ""
    open(os.path.join(proj, "index.html"), "w", encoding="utf-8").write(f'''<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <title>{E(cfg["title"])}</title>
    <!-- Generated by media/video-kit/tools/build.py from video.json: edit video.json, kit.css, kit.js or compositions/*.html, not this file. -->
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
{three}    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: 1920px; height: 1080px; overflow: hidden; background: #0b0d10; }}
      #root {{ position: relative; width: 100%; height: 100%; background: #0b0d10; }}
{css}
    </style>
    <script>window.CUES = {json.dumps(cues)};</script>
    <script>
{js}
    </script>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{total}" data-width="1920" data-height="1080">
{hosts}    </div>
    <script>
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
''')
    ch = ""
    for (st, d, ln, cd) in caps:
        if ln.get("cap") is False or not ln.get("en"): continue
        txt = ln.get("es") if CAP == "es" else ln["en"]
        who = f' who" data-who="{WHO[ln["v"]][3]}:' if ln.get("v") in WHO else ""
        ch += f'    <div id="cap-{ln["id"]}" class="k-cap clip{who}" data-start="{st}" data-duration="{cd}">{E(txt)}</div>\n'
    open(os.path.join(proj, "compositions", "captions.html"), "w", encoding="utf-8").write(f'''<template>
  <div id="root" data-composition-id="captions" data-width="1920" data-height="1080" data-layout-allow-overlap style="position:absolute; inset:0; pointer-events:none">
{ch}  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    window.__timelines["captions"] = tl;
  </script>
</template>
''')
    for lang in ("en", "es"):
        v = "WEBVTT\n\n"
        for (st, d, ln, cd) in caps:
            txt = ln.get(lang) or ln.get("en")
            if not txt: continue
            if ln.get("v") in WHO: txt = f"<v {WHO[ln['v']][3].title()}>{txt}"
            v += f"{ts(st)} --> {ts(st + cd)}\n{txt}\n\n"
        open(os.path.join(proj, f"{vid}.{lang}.vtt"), "w", encoding="utf-8").write(v)
    tt = f"{vid}  total {total}s\n"
    for (sc, st, sd) in scenes:
        tt += f"\n[{sc['id']}] start {st}  dur {sd}\n"
        for k, (a, b) in cues[sc["id"]]["lines"].items():
            tt += f"   {k:6s} {a:6.2f} -> {b:6.2f}   {next(l['en'] for l in sc['lines'] if l['id'] == k)[:80]}\n"
    open(os.path.join(proj, "timing.txt"), "w", encoding="utf-8").write(tt); print(tt)
    defaults = {
        "hyperframes.json": json.dumps({"$schema": "https://hyperframes.heygen.com/schema/hyperframes.json", "registry": "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry", "paths": {"blocks": "compositions", "components": "compositions/components", "assets": "assets"}, "media": {"autoProxy": True}, "authoringSkill": "hyperframes"}, indent=2),
        "meta.json": json.dumps({"id": vid, "name": vid}, indent=2),
        "package.json": json.dumps({"name": vid, "private": True, "type": "module", "scripts": {"dev": "npx --yes hyperframes@0.9.54 preview", "check": "npx --yes hyperframes@0.9.54 check", "render": "npx --yes hyperframes@0.9.54 render"}}, indent=2),
    }
    for f, body in defaults.items():
        if not os.path.exists(os.path.join(proj, f)): open(os.path.join(proj, f), "w").write(body)


# --cap none (default: clean video, the game overlays the .vtt in the player's language) | en | es (burned in, for review)
CAP = "none"
args = sys.argv[1:]
if "--cap" in args:
    i = args.index("--cap"); CAP = args[i + 1]; del args[i:i + 2]
for p in args:
    build(p)
