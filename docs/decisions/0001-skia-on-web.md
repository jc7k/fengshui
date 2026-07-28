# 0001 — Skia on web: risk gate result

**Status:** PASS, with a load-time condition
**Date:** 2026-07-27
**REQ:** REQ-004 (risk gate for REQ-006 – REQ-009)
**Decides:** whether the editor is built once on `@shopify/react-native-skia`, or
forks into a Skia native path and an SVG/DOM web path.

## Verdict

**PASS. Build the editor once on Skia.** Rendering and gestures both work on web,
in the dev server *and* in the static export, on the exact stack this repo pins
(Expo SDK 57.0.8, RN 0.86.0, React 19.2.3, `@shopify/react-native-skia` 2.6.2,
gesture-handler 2.32, reanimated 4.5, worklets 0.10).

The PASS is conditional on one number: **the editor route takes 23.4 s to become
interactive on a cold Fast 3G load.** That is survivable against the PRD §7
five-minute metric but it is the single largest fixed cost in the product, and it
does not shrink on its own. Conditions are in [Load budget](#load-budget) below.

## What was proven

Spike at `app/spike-skia.tsx` + `components/spike/skia-spike.tsx` — a blue rect
and a red circle on a 320×320 Skia canvas, with the rect draggable via a
gesture-handler `Pan` writing to reanimated shared values.

| Check | Result |
| --- | --- |
| Shapes render under `expo start --web` | ✓ |
| Shapes render in the **static export**, served from `dist/` | ✓ |
| Rect drags with a real mouse gesture (dev) | ✓ `40,40` → `175,148` for a `+150,+120` pointer move |
| Rect drags with a real mouse gesture (**export**) | ✓ `40,40` → `166,103` for a `+144,+72` pointer move |
| `npx tsc --noEmit` | ✓ clean |
| Export bundles without error | ✓ 4 static routes, no Metro failure |

The drag lands slightly short of the pointer delta because gesture-handler
discards movement before the pan activation threshold. Expected, not a defect.

![Skia rendering on web](./assets/skia-web-render.png)
![The rect after being dragged in the static export](./assets/skia-web-export-dragged.png)

## Load budget

Measured against the static export served from `dist/`, Chrome, cache disabled,
CDP `Network.emulateNetworkConditions` at the Chrome DevTools **Fast 3G** preset
(188,744 B/s down, 562.5 ms RTT).

| Metric | Editor route (`/spike-skia`) | Landing (`/`) |
| --- | --- | --- |
| First contentful paint | 1.30 s | — (pre-rendered HTML) |
| DOM content loaded | 3.18 s | — |
| **Interactive canvas** | **23.40 s** | 0.72 s* |

\* The landing number is time-to-visible-text, not time-to-hydrated. Static
rendering emits the copy into `index.html`, so it paints before the JS lands.
Honest comparison: the landing page's *content* is nearly free; only the editor
pays the Skia cost.

Where the 23.4 s goes:

| Resource | Transfer | Time |
| --- | --- | --- |
| `canvaskit.wasm` | 3.02 MB gzipped (7.70 MB raw) | **17.36 s** |
| `entry-*.js` | 326 KB gzipped (1.3 MB raw) | 2.35 s |
| `skia-spike-*.js` | 295 KB gzipped (1.5 MB raw) | 2.17 s |
| `web-*.css` | 1.9 KB | 0.59 s |

**CanvasKit is 74% of the cold load.** The REQ's estimate of ~2.9 MB gzipped was
close; actual is 3.02 MB.

### The CDN option is dead — measured, not assumed

The REQ left open whether to serve CanvasKit from the public folder or a CDN.
Same throttle, same cache-disabled conditions, fetching the identical artifact:

| Origin | Time |
| --- | --- |
| Local (`/canvaskit.wasm` from `dist/`) | 19.26 s |
| `unpkg.com/canvaskit-wasm@0.39.1` | 18.96 s |

A 1.5% difference — noise. The cost is **bandwidth, not origin distance**, so an
edge CDN cannot fix it, and modern browsers partition their HTTP cache per-site
so the old "someone else already downloaded it" argument no longer holds either.
**Keep it local.** A CDN would add a third-party runtime dependency and buy 0.3 s.

### What would actually move the number

Not done here — this is a gate, not an optimization pass. Recorded for whoever
picks up the perf work in REQ-015:

1. **Start the WASM fetch before the user reaches the editor.** The landing page
   is idle for however long the user reads it; a `<link rel="prefetch">` for
   `canvaskit.wasm` converts most of the 17 s into time the user was spending
   anyway. Cheapest large win, no code restructuring.
2. **Ship the reduced CanvasKit build.** The `full` build carries paragraph/font
   shaping this editor never uses. The core build is materially smaller.
3. **Serve it with `Content-Encoding: br`.** Brotli typically beats gzip by
   15–20% on WASM. Vercel does this automatically for static assets; the local
   `serve` used for this measurement only did gzip, so the deployed number should
   already be better than 23.4 s.

## Two failures found on the way, and their fixes

Both are load-bearing for REQ-006+. They are in the spike code as comments, but
they belong in the decision record because they will re-appear the moment anyone
writes a second Skia route.

### 1. A static import of any Skia module breaks web

`@shopify/react-native-skia` builds its API object from `global.CanvasKit` **at
module evaluation time**. `WithSkiaWeb` loads the WASM lazily — so if any module
in the route's static import graph pulls in Skia, the API object is constructed
against an `undefined` CanvasKit and every draw dies with:

```
TypeError: Cannot read properties of undefined (reading 'PictureRecorder')
```

The canvas mounts, sized correctly, and paints nothing. First run of this spike
hit exactly that, from a single innocuous `import SkiaSpike from '...'` at the
top of the route (present only to serve the native branch).

**Rule for REQ-006+: Skia components are reached through `WithSkiaWeb`'s
`getComponent` (web) or a render-time `require` (native). Never a top-level
import.**

### 2. `web.output: "static"` pre-renders the route in Node, where CanvasKit cannot load

Static rendering executes every route in Node during dev *and* export. CanvasKit
resolves its `.wasm` relative to the router-server bundle, fails, and calls
Emscripten's `abort()` — which takes the whole dev server down:

```
failed to asynchronously prepare wasm: ENOENT ... /@expo/router-server/node/canvaskit.wasm
RuntimeError: Aborted(...)
```

Not a crash of the page — a crash of `expo start`. **Fix: gate the canvas behind
a hydration flag** so the server render emits only the fallback. `useHydrated()`
in `app/spike-skia.tsx` is that gate.

Note this is not the same thing as react-native-skia#1774, which the REQ flagged;
the export itself bundles fine on this stack. This is a static-rendering problem,
and it will hit every route that mounts a canvas.

### Also worth knowing

- Metro's incremental graph got wedged (`Error: Got unexpected undefined`) after
  editing the route's import structure while the dev server was hot. `expo start
  --clear` fixed it. Expect this whenever Skia imports move.
- `npx setup-skia-web public` is wired as a `postinstall` in `package.json`, so
  `canvaskit.wasm` is re-copied on every install and on every Skia upgrade. It
  lands in `public/`, and Expo copies `public/` into `dist/` — verified, and the
  served file carries `Content-Type: application/wasm`.
- `public/canvaskit.wasm` is 7.7 MB and **is not gitignored**. It is a build
  artifact of `postinstall`; consider ignoring it before it bloats the history.

## If this had failed

`core/` (REQ-005) is renderer-agnostic by design, so a FAIL would have forked
only the view layer. It did not fail; that property is still worth preserving.

## Spike cleanup

`app/spike-skia.tsx` and `components/spike/` are throwaway. Delete them when
REQ-006 lands a real canvas — but port the two rules above into it first.
