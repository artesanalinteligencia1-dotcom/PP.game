"""Download a public-domain image into a project and log its source.
  python fetch.py <project> <name.jpg> commons "File:Title.jpg" [note]
  python fetch.py <project> <name.jpg> nasa <nasa_id> [note]
  python fetch.py <project> <name.jpg> url <https://...> "<credit / source page>"
"""
import sys, json, os, re, urllib.request, urllib.parse
UA = {"User-Agent": "video-research-script/1.0 (educational)"}
def get(u): return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60)
proj, name, kind, ref = sys.argv[1:5]; note = sys.argv[5] if len(sys.argv) > 5 else ""
os.makedirs(os.path.join(proj, "assets"), exist_ok=True)
if kind == "commons":
    u = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({"action": "query", "format": "json", "titles": ref, "prop": "imageinfo", "iiprop": "url|extmetadata", "iiurlwidth": 1920})
    p = list(json.load(get(u))["query"]["pages"].values())[0]["imageinfo"][0]; em = p.get("extmetadata", {})
    g = lambda k: re.sub(r"\s+", " ", re.sub("<[^>]+>", "", em.get(k, {}).get("value", ""))).strip()
    src = p.get("thumburl") or p["url"]; page = p["descriptionurl"]
    line = f"| `{name}` | {g('ObjectName') or ref} | {g('Credit')[:160]} | {g('LicenseShortName')} | {page} | {note} |"
elif kind == "nasa":
    files = json.load(get("https://images-api.nasa.gov/asset/" + urllib.parse.quote(ref)))["collection"]["items"]
    hrefs = [f["href"] for f in files]
    pick = next((h for k in ("~large.jpg", "~medium.jpg", "~orig.jpg") for h in hrefs if h.endswith(k)), hrefs[0])
    meta = json.load(get("https://images-api.nasa.gov/search?nasa_id=" + urllib.parse.quote(ref)))["collection"]["items"][0]["data"][0]
    src = pick.replace(" ", "%20"); line = f"| `{name}` | {meta['title']} | NASA ({meta.get('center','')}), {meta.get('date_created','')[:10]} | Public domain (NASA) | https://images.nasa.gov/details/{ref} | {note} |"
else:
    src = ref; line = f"| `{name}` | {note} | see source | Public domain (NASA) | {ref} | |"
data = get(src).read(); open(os.path.join(proj, "assets", name), "wb").write(data)
sp = os.path.join(proj, "assets", "SOURCES.md")
if not os.path.exists(sp): open(sp, "w", encoding="utf-8").write("# Image sources\n\nReal images are public domain unless noted; shown with an on-screen credit and without agency logos or insignia.\n\n| File | Title | Credit | License | Source | Note |\n|---|---|---|---|---|---|\n")
open(sp, "a", encoding="utf-8").write(line + "\n"); print(name, len(data) // 1024, "KB", src[:110])
