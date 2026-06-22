# Output renderer redesign

## Problem
Cell output is drawn by a hand-rolled imperative renderer (`src/Notebook/Display.js`
+ the emit path in `src/Notebook/NotebookMount.js`). It has no update model, so every
live update re-derives correctness by hand — and a different corner breaks each time:

| symptom | interim patch (to be removed by this design) |
|---|---|
| view jumps to top on each live emit | save/restore inner+outer scroll, freeze box height |
| chart zoom/pan resets every tick | `uirevision` + a bolted-on `reconcileDisplayInto` |
| charts render at Plotly's 700px default, overlap neighbour / cover text | attach layout + slots before rendering content |

All three are the same root cause: imperative DOM (`innerHTML` wipes) + Plotly sized
imperatively, with no stable node identity and no chart lifecycle. We keep patching
symptoms. This redesign makes update correctness **structural**.

## Goals / non-goals
- Goals: one render path for first-render and live updates; stable DOM identity
  (scroll/focus/selection preserved for free); charts that keep zoom and always fit
  their container; delete the three patches; fold the spreadsheet in.
- Non-goals: changing the Display **Json contract** (Verdict's `Display` lib output is
  unchanged); changing call sites (`renderDisplayInto(host, raw, bridge)` stays).

## The model
Decode the Display Json (today's `decodeDisplay`) into a PureScript ADT:
```
data Display
  = Text String
  | Chart ChartSpec           -- opaque spec passed straight to the Plotly FFI
  | Table (Array Row)
  | Layout LayoutKind (Maybe String) (Array Display)   -- stack | col | row, optional heading
```
Kinds and fields mirror `Display.js` exactly so there's behavioural parity.

## Architecture — the key decision
ps-spa's `Html` is `Text | Element | Keyed` only — **no ref/hook/lifecycle node**. So
imperative Plotly cannot live inside the vdom. Split responsibilities:

1. **Structure → ps-spa vdom** (PureScript, Elm-style). `Notebook.Output` renders the
   Display tree to `Html`, using **`keyed`** containers so the diff preserves DOM
   identity across updates. Charts become **stable keyed placeholders**:
   `H.keyed "div" [...] [ Tuple chartKey (H.node "div" [ dataAttr "chart-key" k, ... ] []) ]`.
   Text/Table/Layout are pure nodes (Table delegates to the existing ps-spa spreadsheet).
   Because ps-spa diffs by key, no `innerHTML` wipe → **scroll/focus/selection survive**.

2. **Charts → an out-of-band manager** (JS FFI; Plotly is JS). A `ChartManager` keyed
   by `chart-key` owns the Plotly instances. After each render it `sync(rootEl, specs)`:
   - new key → `Plotly.newPlot(el, ...)` and attach a **`ResizeObserver`** (debounced via
     rAF → `Plotly.Plots.resize`),
   - existing key → `Plotly.react(el, ..., { uirevision })` (keeps zoom/pan),
   - removed key → `Plotly.purge(el)`, disconnect its observer.
   The ResizeObserver is what makes a chart always fit its column regardless of when it
   mounts or how the flex layout later reflows — killing the overlap class at the source.

3. **Chart key = tree-position path** (e.g. `0/1/2`), stable across "same shape, new
   data" loops (the common case), so `react`+`uirevision` reuses the instance and keeps
   zoom. A structural change yields new keys → clean mount/purge.

## Update path (one path, replaces three patches)
`setDisplay(json)`: decode → set model → ps-spa renders/diffs → schedule
`requestAnimationFrame(() => chartManager.sync(rootEl, specsByKey))` (DOM is patched by
then; charts always sync against attached, flex-sized containers). That single flow:
- preserves scroll/focus (vdom keeps nodes) → **delete** the height-freeze + scroll-restore,
- preserves chart zoom (`react`+`uirevision` on the kept instance) → **delete** `reconcileDisplayInto`,
- sizes charts correctly on mount and every reflow (attached + ResizeObserver) → **delete**
  the attach-before-render patch,
- preserves spreadsheet state (same vdom tree, not wiped).

## Interfaces
- PureScript `Notebook.Output`:
  `mountOutputExport :: EffectFn1 Foreign OutputHandle` where
  `OutputHandle = { setDisplay :: EffectFn1 Json Unit, destroy :: Effect Unit }`.
  Registered as `globalThis.__notebookMountOutput` in `src/Notebook/bundle-entry.mjs`
  (same pattern as the gutter/cells-nav/spreadsheet mounts).
- JS `ChartManager` (FFI used by the component): `create()`, `sync(rootEl, Array {key, spec})`,
  `destroy()`. Wraps `renderChartImpl` / `Plotly.{newPlot,react,purge,Plots.resize}` from
  `PlotlyFFI.js`; owns `Map key -> { el, observer }`.
- Compatibility shim: `renderDisplayInto(host, raw, bridge)` keeps its signature. Internally
  it gets-or-creates the `__notebookMountOutput` handle for `host` (cached on the element)
  and calls `setDisplay(raw)`. So `NotebookMount` and `VerdictEditor` call sites don't change;
  `renderEmitToCell` collapses to `getHandle(host).setDisplay(value)` and loses its scroll
  bookkeeping.

## Migration (strangler, incremental — each step green)
1. Add `Notebook.Output` + `ChartManager` + the `__notebookMountOutput` registration; build
   notebook.mjs. No call-site change yet.
2. Switch `renderDisplayInto` to the shim (handle cache on the host). Keep `Display.js`'s
   pure helpers (`decodeDisplay`, `markdownToHtml`) reused by the PS decoder/FFI.
3. Collapse `renderEmitToCell` to `setDisplay`; delete the height-freeze, scroll-restore,
   and `reconcileDisplayInto`. Delete the renderLayout attach-before-render patch.
4. Route Table through the same vdom (it already mounts the ps-spa spreadsheet).
5. Remove the now-dead `Display.js` imperative paths.

## Risks / open questions
- **Post-render timing**: rAF-after-`setDisplay` assumes ps-spa has patched the DOM by the
  next frame. If ps-spa exposes a render-complete command/subscription, prefer that; else a
  `MutationObserver` on the root is the fallback. (Verify against `PsSpa.Runtime`.)
- **Chart key stability**: position-path keys reset zoom when the tree shape changes — that's
  correct, but confirm the common loop keeps shape stable (the finance sim does).
- **Cleanup**: `destroy()` must `Plotly.purge` every instance and disconnect every observer
  (cell removed / notebook reset) — no leaks.
- **Parity**: the `notebook-display` tests (`tests-js/notebook-display.test.mjs`) must pass
  unchanged; they pin the Display→DOM contract.

## Verification
- `npm run test:notebook` (notebook-display + all 84) green at every migration step.
- Puppeteer regression of the exact three bugs: (a) stack scroll holds across emits,
  (b) a zoomed chart keeps its range across emits, (c) charts fit their column (Plotly
  width == container) with no overlap — plus a new check: drag-resize the output panel and
  confirm charts re-fit (ResizeObserver), which the current code does not do.
