# LOCAL_TODO (tasks only the user / local Claude Code can do)

## 1. Vercel deploy — needs the user
- **What:** import `artesanalinteligencia1-dotcom/PP.game` in Vercel (framework Vite, build `npm run build`, output `dist`),
  production branch `main` (merge `cloud/fase-1` first, or use the branch preview URL). Put the URL in README.
- **Why cloud can't:** the Vercel connector in the cloud session is logged into a **different account**
  (another email, team scope `cristhian-goicochea`) and asks for extra team authorisation. The cloud did not deploy
  there without confirmation. Either confirm that account is yours (then the cloud can deploy), or import from your own Vercel login.
- **Done when:** public URL shows the mission picker.

## 2. Merge Phase 1
- **What:** review and merge `cloud/fase-1` into `main` (PR on GitHub).
- **Why cloud can't:** merging is the user's decision.
- **Done when:** `main` contains the Phase 1 commits and CI is green.
