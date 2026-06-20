# Notebook → clean PureScript refactor — plan & bug inventory

## Why
`src/Notebook/NotebookMount.js` is **1,452 lines of imperative vanilla JS** that owns
the entire notebook: state, rendering, cell ops, run/stop, navigation, diagnostics,
output routing, the shared editor instance. Every fix mutates that blob, so changes
in one area (auto-height, module header, nav) break another. The rest of the app is
already PureScript + an Elm-architecture runtime (`src/App/Runtime.purs`); the notebook
is the outlier. Goal: a clean PureScript Elm-architecture component with thin FFI only
for genuinely-foreign bits (CodeMirror, Plotly, localStorage).

Approach (chosen): **incremental strangler** — move pieces into PureScript one at a
time, keeping the notebook working and tests green at every step.

---

## What is NOT working (current bug inventory)

1. **Cell navigation (Cells tab).** Two competing paths exist: a dead pre-migration
   inline rail (`buildNav`, NotebookMount.js:646) and the panel path
   `publishPanel` → `bridge.syncCellsNav` → shell `renderCellsNav`. Click → focus →
   scroll is unreliable after the shared-editor / auto-height changes. The dead
   `buildNav` should be deleted; nav should have ONE source of truth.

2. **`unknown name 'binanceSymbol'` (cells fail to run/diagnose).** Cell 2 uses cell 1's
   helper functions; cells share one namespace via source concatenation. When the saved
   notebook drifts from the current default (stale localStorage, manual edits), cell 1
   no longer defines what cell 2 calls → compile error. Workaround: the **Reset** button.
   Real fix: the architecture below (each cell = `module Main` importing packages).

3. **Wrong error highlight (off by ~2 lines).** `ensureModuleHeader` prepends
   `module Main exposing (..)\n\n` (2 lines) when the first cell lacks a header, but the
   diagnostics line-map (`buildCellLineMap`) didn't account for it. **Fixed this pass**
   (line-map now starts at line 3 when a header was injected) — needs browser re-verify.

4. **Can't scroll between cells.** Editor host was capped at 560px with `overflow:hidden`
   + CodeMirror internal scroll → the wheel got trapped in a per-cell scrollbar.
   **Fixed this pass** (cap raised to 1600/2400 so cells show full content and the page
   scrolls) — needs browser re-verify.

5. **Can't resize cells.** The editor/output drag-resize handles were removed during the
   auto-height work and not restored.

6. **Slow loading / sluggish.** Likely causes: diagnostics recompile the FULL concatenated
   source on every keystroke (debounced but heavy); compile-on-render; the lazy bundles
   (Plotly ~4.6MB, CodeMirror ~371KB) load on first use; per-cell re-render rebuilds DOM.

7. **Stale-state recurrence.** The saved `.vnb` only re-seeds when the default's
   `seedSignature` changes; manual edits persist and silently drift from helper changes,
   producing (2). Needs a clearer “reset / sync” story.

8. **Debug tab broken.** Doesn't populate/update for notebook cells (was wired for
   whole-program runs). Must show live VM state/metrics for the notebook session.

9. **Visual tab broken.** `refreshVisualization()` fails / shows nothing in notebook mode.
   Must render the AST block/map view of the current notebook source.

10. **Cell resize broken.** Output resizer present but inert; editor resize gone. Both must
    drag-resize and persist in `CellUi`.

---

## Target architecture — each cell is a separate program (REQUIRED, not optional)
Guiding principles: **nothing hardcoded** (no chart shapes / asset lists / strategy in
JS-TS; all visible behavior comes from user-editable Verdict) and **nothing hidden** (the
user can put whatever they want in a cell; full source visible, no magic prefix/suffix).

- Each cell = `module Main exposing (main)` that `import`s packages
  (`import Display exposing (..)`, `import IDE exposing (..)`, `import Market exposing (..)`).
- Shared market/strategy helpers (`binanceSymbol`, indicators, `scoreOf`, …) move OUT of
  cell 1 into a Verdict library (`Market.verdict`) linked like `Display`/`CellBus`.
- **Compile + run each cell STANDALONE** (no concatenation). Cross-cell data flows through
  the IDE actor / DB (`idePut`/`ideGet`, `busPost`/…). Kills bug 2 structurally.
- **Live loop (required):** with live mode on, every cell re-runs every X seconds (existing
  interval input, default 5s) and its output updates on its own. The default example
  streams — cell 1 fetches+strategizes → shared state; cell 2 reads it and re-simulates.

Verdict already parses `import X exposing (..)` and links libraries on use, so the work is:
(a) author `Market.verdict`, (b) rewrite the two default cells as self-contained modules,
(c) compile each cell standalone, (d) drive each cell from the per-X-second live loop.

---

## Incremental strangler steps (each ends green: build + test:notebook + browser)

**Step 0 — Stabilize (baseline).**
Verify the two fixes from this pass (highlight alignment, scroll). Delete dead `buildNav`.
Make cell navigation a single path. Restore a resize handle (output at least).
Outcome: a known-good baseline to refactor from.

**Step 1 — Model + update in PureScript.** `Notebook.Model`:
- `Cell` (extend with `ui :: CellUi`), `Model { cells, focusedId, maximizedId }`.
- `Msg` (Focus, Fold/CodeFold/OutputFold, Maximize, InsertBelow, Delete, Move, SetSource)
  and pure `update :: Msg -> Model -> Model`.
- FFI export; NotebookMount.js calls these instead of inline array splicing.
The imperative bits (running set, AbortControllers, sharedEditor, outputs/errors maps,
timers) stay in JS for now.

**Step 2 — View in PureScript.** Render the cell list / gutter / layout via the Elm
runtime (`App/Runtime.purs`), keyed by cell id. JS shrinks to FFI *mount points* that the
view asks for: `mountEditor host cellId`, `mountOutput host display`. Diagnostics, fold
state, nav all derive from `Model` (one source of truth → fixes bug 1).

**Step 3 — Run/eval orchestration in PureScript.** Move run/stop/queue, execution counts,
and output routing into the update loop (effectful via the runtime's command type). JS
keeps only `evalCells` (the compiler/VM call) behind FFI.

**Step 4 — Reduce JS to FFI shims.** What remains in `.js`:
- `verdictCm/VerdictCmEditor.js` (CodeMirror)
- `PlotlyFFI.js` / `Display.js` (chart/table render)
- localStorage `.vnb` load/save
Everything else is PureScript. `NotebookMount.js` becomes a ~50-line bootstrap.

---

## Risks / notes
- FFI marshalling (Maybe ↔ Nullable, records, CellKind) is the fiddly part — keep the
  boundary types JS-shaped (`kind :: String`) to minimize friction.
- The shared single CodeMirror instance (moved between cells) is stateful; in the PS view
  it becomes a managed FFI resource keyed by focused cell.
- Each step must keep `npm run build:notebook && npm run build && npm run test:notebook`
  green and the browser example rendering its charts.
