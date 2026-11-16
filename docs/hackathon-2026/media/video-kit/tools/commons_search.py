import sys, json, urllib.request, urllib.parse, re
UA = {"User-Agent": "video-research-script/1.0 (educational; contact via repo)"}
for q in sys.argv[1:]:
    u = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({"action": "query", "format": "json", "generator": "search", "gsrsearch": q + " filetype:bitmap", "gsrnamespace": 6, "gsrlimit": 7, "prop": "imageinfo", "iiprop": "url|size|extmetadata", "iiurlwidth": 1920})
    try: d = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30))
    except Exception as e: print("##", q, "ERR", e); continue
    print("##", q)
    for p in sorted(d.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 0)):
        ii = p["imageinfo"][0]; em = ii.get("extmetadata", {})
        g = lambda k: re.sub("<[^>]+>", "", em.get(k, {}).get("value", ""))[:60]
        print("  ", p["title"], "|", ii["width"], "x", ii["height"], "|", g("LicenseShortName"), "|", g("Credit"), "|", g("DateTimeOriginal")[:20])
