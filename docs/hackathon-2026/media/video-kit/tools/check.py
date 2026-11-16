"""Run `npx hyperframes check` in a project and print a short summary of errors and warnings.
  python check.py <project dir> [--last]   (--last: just summarize the last saved report)"""
import sys, json, os, glob, subprocess
proj = sys.argv[1]
if "--last" not in sys.argv:
    subprocess.run("npx hyperframes check --json", cwd=proj, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
f = max(glob.glob(os.path.join(proj, ".hyperframes", "artifacts", "checks", "*.json")), key=os.path.getmtime)
d = json.load(open(f, encoding="utf-8"))
print("ok:", d["ok"])
for sec in ("lint", "runtime", "layout", "motion", "contrast", "craft", "audio"):
    s = d.get(sec) or {}
    print(f"[{sec}] errors {s.get('errorCount')} warnings {s.get('warningCount')}")
    for x in s.get("findings", []):
        if x.get("severity") in ("error", "warning"):
            print("   ", x["severity"], x.get("code"), "| t=", x.get("time"), "|", x.get("selector"), "|", (x.get("message") or "")[:260], "|", (x.get("text") or "")[:40])
