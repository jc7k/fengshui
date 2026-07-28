# Handoff — Feng Shui app build (UR-001)

**As of 2026-07-27.** Written so a cleared session can pick this up cold.

## Where the queue stands

5 of 19 REQs done, one commit each, all gates green.

| REQ | What | Route | Commit |
| --- | --- | --- | --- |
| REQ-001 | Expo SDK 57 scaffold | B | `a950f74` |
| REQ-004 | RISK GATE: Skia on web — **PASS** | B | `402791a` |
| REQ-005 | `core/` data model + geometry | C | `cf4ea89` |
| REQ-006 | Room setup + to-scale canvas | B | `ed01879` |
| REQ-007 | Doors and windows on walls | B | `082aa22` |

`do-work/working/` is empty — nothing half-done. `.claude/scripts/verify.sh` →
`PASS typecheck` / `PASS test` (137 tests) / `PASS local` / **`VERDICT: PASS`**.

Each archived REQ in `do-work/archive/` carries its own full record: triage,
exploration, what was built, and what the verification actually measured.

## Two loose ends in the repo

1. **6 commits are unpushed** (`main` is ahead of `origin/main`). REQ-002 needs
   them on GitHub before Vercel can build anything.
2. **The `verify.sh` fix is uncommitted.** `.claude/` is untracked in this repo,
   so the one-line fix to its `pkg_has` helper — it double-quoted its argument,
   which left every npm-script branch dead, including the Vitest gate REQ-005
   required — exists on disk but in no commit. Committing one file out of an
   untracked directory seemed worse than leaving it; your call.

## What's blocked, and exactly what it needs

**REQ-002 (Vercel) and REQ-003 (Supabase + Google OAuth) need accounts.** Four
REQs sit behind them: REQ-010 (persistence), REQ-013 (analytics), REQ-017 (zone
tables), REQ-019 (Stripe).

### Never send these

- Supabase **`service_role`** key — not needed for any of this work.
- Google OAuth **client secret** — it goes into the Supabase dashboard directly,
  and nowhere near this repo.
- Any Stripe secret key (REQ-019, much later).

### REQ-002 — Vercel

Steps only you can do:

1. Push `main` to `github.com/jc7k/fengshui`.
2. Import the repo at vercel.com. Framework preset **Other**, build command
   `npm run build`, output directory `dist`. (`npm run build` already exists and
   produces `dist/index.html`.)
3. Confirm preview deploys are on for non-`main` branches.

What to hand back: the **production URL** and one **preview URL**. Both go into
`docs/deploy.md`, and REQ-003 needs them for OAuth redirect URIs.

I can write `vercel.json` (the SPA rewrites — without them the export 404s on
hard refresh at a client-side route, expo#32139) before you do any of this.

### REQ-003 — Supabase + Google OAuth

Two Supabase projects, dev and prod, so test data never reaches production.

Steps only you can do:

1. Create both projects at supabase.com.
2. Google Cloud Console → OAuth 2.0 client (Web application). Authorized redirect
   URIs must include, **exactly**:
   - `https://<dev-project-ref>.supabase.co/auth/v1/callback`
   - `https://<prod-project-ref>.supabase.co/auth/v1/callback`
3. Paste the Google client ID + secret into each Supabase project's Google auth
   provider.
4. In each Supabase project, set **Site URL** and **Additional Redirect URLs** to
   include `http://localhost:8081` and the Vercel URLs from REQ-002.
5. Add the env vars to Vercel, different values for Preview and Production.

What to hand back, per project (dev and prod):

- Project URL — `https://<ref>.supabase.co`
- **anon / publishable** key

Both are safe to share: they are designed to ship inside the client bundle and
are protected by RLS, which REQ-003 turns on. Put them in a local `.env`
(gitignored; I'll add `.env.example` with placeholders) or paste them — your
preference.

**REQ-003 is not done until a real browser round trip works.** There is a known
failure where the provider handshake completes and then hangs at
`supabase.auth.setSession` (supabase-js#1429), and it is caused by redirect URLs
not matching exactly across Google Console, Supabase and Vercel. Code that looks
right is not evidence here.

## Ready to run with no accounts

**REQ-008** (furniture library + manipulation), **REQ-009** (undo/redo),
**REQ-011** (rule engine + 7 rules), **REQ-012** (feedback UI), **REQ-014**
(landing page), **REQ-016** (bagua overlay).

REQ-008 is the natural next one and is large — drag, resize, rotate, snap, label,
delete.

## Things a fresh session must know before touching the canvas

All of this is already in the code and `docs/decisions/0001-skia-on-web.md`, but
it is the expensive-to-rediscover part:

- **Never import a Skia module statically on web.** Skia builds its API from
  `global.CanvasKit` at import time; import it before the WASM lands and the
  canvas mounts at the right size and paints nothing, with no useful error.
- **No canvas during the static pre-render.** `web.output: "static"` runs every
  route in Node, where CanvasKit calls `abort()` and takes down `expo start` —
  not just the page. Hence the hydration gate in `room-canvas.web.tsx`.
- **Check the bundle after any canvas change.** Twice now, a change that worked
  perfectly on screen silently doubled the entry bundle the landing page
  downloads — once with Skia, once with gesture-handler. `grep -c JsiSkPaint`
  and `grep -c PanGestureHandler` against `dist/_expo/static/js/web/entry-*.js`;
  both must be 0. This matters because of the number below.
- **The editor costs 23.4s to interactive on Fast 3G**, 74% of it `canvaskit.wasm`.
  A CDN does not help — measured, 18.96s vs 19.26s local. Mitigations worth doing
  are written up for REQ-015 in the decision doc.
- **`core/` must stay free of UI and platform imports.** `npm test` fails the
  build if that slips; the check is `tools/check-core-purity.mjs`.
