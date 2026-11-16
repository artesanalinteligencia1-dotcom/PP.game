import sys, json, urllib.request, urllib.parse
for q in sys.argv[1:]:
    u = "https://images-api.nasa.gov/search?" + urllib.parse.urlencode({"q": q, "media_type": "image", "page_size": 8})
    try:
        d = json.load(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "curl/8"}), timeout=30))
    except Exception as e:
        print("##", q, "ERR", e); continue
    print("##", q, d["collection"]["metadata"]["total_hits"])
    for it in d["collection"]["items"][:8]:
        m = it["data"][0]
        print("  ", m["nasa_id"], "|", m.get("date_created", "")[:10], "|", m.get("center", ""), "|", m["title"][:90])
