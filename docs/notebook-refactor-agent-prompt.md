# Agent prompt — migrate the notebook UI to clean PureScript (incremental strangler)

You are working in `/Users/michalmajchrzak/Projects/fin/editor`, a Vite + TypeScript +
PureScript app. A Verdict (Elm-like finance language) → FinVM toolchain powers a
Jupyter-style notebook editor. Your mission: **migrate the notebook UI from a 1,452-line
imperative vanilla-JS file into a clean PureScript Elm-architecture component**, in small
strangler steps, keeping the app working and tests green at every step. Do NOT do a
big-bang rewrite. Do NOT regress existing behavior.

---

## 0. Ground rules (read first)

- **Node 24 is mandatory** (v22 lacks `node:sqlite`). Prefix every command:
  `export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"`.
- **After every step the following MUST pass:**
  - `npm run build:notebook`  (spago compiles `src/Notebook/*.purs` + esbuild bundles
    `NotebookMount.js` & FFI → `public/lib/notebook.mjs`)
  - `npm run build`           (Vite builds the editor)
  - `npm run test:notebook`   (66+ node tests; keep them all green)
  - A browser smoke check (see §5). If a step can't be made green, STOP and report;
    do not pile on.
- If you change `src/editor/notebookEval.ts`, also run `node scripts/build-test-eval.mjs`
  (regenerates `tests-js/.notebook-eval-runner.mjs`, the compiled copy the tests import).
- If you change `lib/verdict/*.verdict` or `scripts/patch-verdict-bindings.mjs`, run
  `npm run build:verdict-notebook` (regenerates `public/lib/verdict-notebook.mjs`).
- Commit/PR only when asked. Work on a branch.
- Keep each step SMALL and SHIPPABLE. Prefer extending PureScript over adding to the JS blob.

---

## 1. Repo orientation

The notebook (everything you're refactoring):
- `src/Notebook/NotebookMount.js` — **THE TARGET. 1,452 lines of imperative JS.** Owns
  state, render, cell ops (insert/delete/move/fold), run/stop, navigation, diagnostics,
  output routing, and a single shared CodeMirror instance moved between focused cells.
- `src/Notebook/*.purs` — already clean PureScript, thin: `Cell.purs` (Cell/CellUi types),
  `Notebook.purs` (concatenate, binding-name scan), `Main.purs` (FFI exports to JS),
  `Display.purs`, `Spreadsheet.purs`, `Csv.purs`, `Seed.purs`, `VerdictDocs.purs`.
- `src/Notebook/verdictCm/VerdictCmEditor.js` — CodeMirror 6 editor (FFI; KEEP as FFI).
- `src/Notebook/verdictCm/VerdictLanguageService.js`, `VerdictSyntax.js` — lint/hover/
  completion/highlight (FFI; KEEP).
- `src/Notebook/Display.js` + `src/Notebook/PlotlyFFI.js` — generic display renderer
  (text/chart/table/stack/row/col via Plotly). KEEP as FFI; it draws whatever Json a cell
  emits. Do NOT hardcode chart shapes here.
- `src/Notebook/NotebookPs.js` — JS glue calling the PureScript exports (`concatCode`,
  `ensureModuleHeader`, etc.).

The shell + eval + bridge (TypeScript, NOT the target but you'll touch the bridge):
- `src/VerdictEditor.ts` — the `<verdict-editor>` web component (tabs, side panels,
  Cells/Inputs/Output, live loop). Loads `public/lib/*.mjs` at runtime via fetch+blob.
- `src/editor/notebookBridge.ts` — the `NotebookBridge`/`NotebookApi` contract between the
  JS notebook and the TS shell (compile, evalCells, syncCellsNav, diagnostics, storage).
- `src/editor/notebookEval.ts` — per-cell compile + FinVM run, display mapping, line map.

The runtime / Elm architecture to reuse for the PS view:
- `src/App/Runtime.purs` and `src/Generated/App.purs` — the existing Elm-style runtime used
  elsewhere in the app. Study it; the notebook view should be built the same way.

Verdict libraries + compiler patch (don't break these):
- `lib/verdict/{Actor,IDE,CellBus,Display}.verdict` — libraries linked into notebook compile.
- `scripts/patch-verdict-bindings.mjs` — patches `public/lib/verdict.mjs` →
  `verdict-notebook.mjs`, adding `compileBindingEntryJS`, library linking (merge-then-link),
  and signature prettifying. Read it before touching anything compiler-adjacent.

Current notebook state shape (in NotebookMount.js, to model in PS):
```
state = { cells: [{id, kind:'code'|'wysiwyg', source, ui:{folded,codeFolded,outputFolded,
          editorHeight,outputHeight}}], outputs:{}, focusedId, errors:{}, cellDiags:{},
          maximizedCellId, running:Set, runControllers:{}, executionCounts:{}, executionSeq,
          sharedEditor, sharedEditorCellId, ... }
```

---

## 2. Known bugs to fix along the way (verify each is gone)

1. **Cell navigation unreliable.** Two nav code paths coexist: a dead inline rail
   (`buildNav` in NotebookMount.js) and the panel path
   (`publishPanel` → `bridge.syncCellsNav` → shell `renderCellsNav`). Delete the dead one;
   make nav derive from a single source of truth (the Model in Step 1/2). Clicking a nav
   entry must focus + scroll to the cell.
2. **`unknown name 'binanceSymbol'` etc.** Cells share one namespace via source
   concatenation; stale saved notebooks drift from helper changes. Structural fix is the
   per-cell-module architecture (§4), not part of the UI strangler — but don't make it worse.
3. **Wrong error highlight (~2 lines off).** Caused by `ensureModuleHeader` prepending a
   2-line header without the line-map (`buildCellLineMap` in notebookEval.ts) accounting
   for it. Already patched (line-map starts at 3 when header injected) — keep it correct as
   you move diagnostics into PS.
4. **Can't scroll between cells.** A fixed editor-height cap + internal CodeMirror scroll
   trapped the wheel. Cells should show full content so the PAGE scrolls between them.
5. **No cell resize.** Restore a drag-resize affordance (at least for output).
6. **Slow / clunky.** Diagnostics recompile the full concatenated source per keystroke;
   cells re-render by rebuilding DOM; the editor feels laggy. The PS view (keyed,
   diff-based) should reduce this; also debounce/throttle diagnostics and avoid recompiling
   when source is unchanged.
7. **Debug tab broken.** `setActiveMainTab('debug')` shows `debugPanel`, but it doesn't
   populate / update for notebook cells (it was wired for whole-program runs). It must show
   live VM state/metrics for the notebook session and update as cells run.
8. **Visual tab broken.** `setActiveMainTab('visual')` calls `refreshVisualization()`,
   which fails or shows nothing in notebook mode. It must visualize the current notebook
   source (per the existing AST block/map view).
9. **Cell resize broken.** There is an output resizer
   (`notebook-cell-output-resizer` + `installVerticalResize`) but it doesn't actually
   resize; editor resize is gone. Both editor and output must be drag-resizable, and the
   size must persist in `CellUi` ({editorHeight, outputHeight}).

---

## 3. The strangler steps (do them in order; each ends green)

**Step 0 — Stabilize + single nav path.**
- Delete the dead `buildNav` and any unused inline-nav DOM. Cell navigation must be ONE
  path. Verify clicking a Cells-tab entry focuses + scrolls the cell.
- Confirm bugs (3) and (4) are fixed in the browser. Restore an output resize handle.
- DoD: builds + tests green; browser shows the default 2-cell example, charts render,
  scrolling moves between cells, nav works, highlights land on the right line.

**Step 1 — Model + update in PureScript.**
- New module `Notebook.Model` (or extend `Notebook.purs`):
  - `Cell` extended with `ui :: CellUi` (CellUi already in `Cell.purs`).
  - `Model = { cells :: Array Cell, focusedId :: Maybe String, maximizedId :: Maybe String }`.
  - `data Msg = Focus String | ToggleFold String | ToggleCodeFold String
              | ToggleOutputFold String | Maximize String | InsertBelow String CellKind
              | DeleteCell String | MoveCell String Int | SetSource String String | ...`
  - `update :: Msg -> Model -> Model` (pure; ensure ≥1 cell after delete; clamp moves).
- Export via FFI from `Main.purs` (follow the existing `EffectFn`/`mkEffectFn` +
  `foreignToCell` pattern). **Keep boundary types JS-shaped**: `kind :: String`,
  `Nullable String` not `Maybe`, plain records — to minimize marshalling friction.
- In NotebookMount.js, replace the inline array splicing (addCellBelow/deleteCellAt/
  moveCellBy/fold toggles/focus) with calls into the PS `update`. Leave imperative bits
  (running Set, AbortControllers, sharedEditor, outputs/errors maps, timers) in JS for now.
- DoD: builds + tests green; all cell ops behave identically in the browser.

**Step 2 — View in PureScript.**
- Render the cell list / gutter / fold state / layout via the Elm runtime
  (`App/Runtime.purs`), keyed by cell id (diff-based, no full DOM teardown).
- JS shrinks to FFI *mount points* the view requests: `mountEditor :: Element -> CellId ->
  Effect Unit` (mounts/moves the shared CodeMirror), `mountOutput :: Element -> Json ->
  Effect Unit` (calls Display.js). Diagnostics, nav, fold all derive from `Model` (fixes
  bug 1 for good).
- DoD: identical UI; charts still render; scrolling/nav/fold all work; no per-keystroke
  full re-render.

**Step 3 — Run/eval orchestration in PureScript.**
- Move run/stop/queue, execution counts, and output routing into the update loop using the
  runtime's command/effect type. JS keeps only `evalCells` (the compiler+VM call) behind FFI.
- Preserve: shared FinVM state across cells, AbortController-based stop, the live loop
  driving `runAll`.
- DoD: run a cell, run all, stop — all work; outputs/charts render; tests green.

**Step 4 — Reduce JS to FFI shims.**
- What may remain in `.js`: `verdictCm/*` (CodeMirror), `Display.js`/`PlotlyFFI.js`
  (render), localStorage `.vnb` load/save, tiny bootstrap. `NotebookMount.js` should end up
  a ~50-line mount shim.
- DoD: `NotebookMount.js` < ~80 lines; everything else PureScript; full example works.

---

## 4. Core architecture — each cell is a separate program (REQUIRED)
This is a hard product requirement, not optional. Do it as its own track, interleaved with
the UI strangler.

Guiding principles (apply everywhere):
- **Nothing hardcoded.** No chart shapes, asset lists, or strategy logic baked into JS/TS.
  The host is generic; everything the user sees comes from Verdict the user can read/edit.
- **Nothing hidden.** The user can put *whatever they want* in a cell. The full Verdict
  source of every cell is visible and editable; no magic prefix/suffix the user can't see.
  (If the host must inject anything — e.g. a module header — it must be visible or avoided.)

Each cell becomes its own self-contained program:
- Each cell = `module Main exposing (main)` that `import`s the packages it needs
  (`import Display exposing (..)`, `import IDE exposing (..)`, `import Market exposing (..)`).
  Verdict already parses `import X exposing (..)`.
- **Compile and run each cell STANDALONE** (do not concatenate cells into one namespace).
  This removes the cross-cell `unknown name` class of errors entirely.
- Move shared market/strategy helpers (`binanceSymbol`, indicators, `scoreOf`,
  `decisionFromScore`, …) OUT of the cells into a new `lib/verdict/Market.verdict`, linked
  like Display (add a `usesMarketLibrary` detector + merge in
  `scripts/patch-verdict-bindings.mjs`; rebuild with `npm run build:verdict-notebook`).
- Cross-cell data flows through the shared FinVM session — the **IDE actor / DB**
  (`idePut`/`ideGet`, `busPost`/`busPending`, cache). Cell A writes state; cell B reads it.
- Rewrite the default example (`src/editor/defaultNotebookSimCell.mjs` + cell 1 in
  `src/VerdictEditor.ts`) as two self-contained `module Main` programs that import packages.

### 4a. Live loop — cells run continuously every X seconds (REQUIRED)
- The notebook has a live mode (the shell's Run toggle → `runLiveTick`). In it, **every
  cell runs every X seconds** (X is the existing interval input; default 5s, user-editable),
  re-reading shared state and re-rendering its output.
- For the default example: cell 1 constantly fetches data + runs the strategy and writes the
  result to shared state (DB/cache/IDE); cell 2 constantly reads that state and re-simulates
  $1000, updating its charts. They must keep updating without user interaction while live.
- Because cells are separate programs sharing the FinVM session, the loop runs each cell in
  sequence per tick against the persisted shared state. Make stop/start clean (no leaks,
  AbortController per in-flight run).

---

## 5. Verification protocol (run after every step)
```
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
npm run build:notebook && npm run build && npm run test:notebook
# browser smoke check:
npm run preview &           # serves dist on http://localhost:4173
# puppeteer (project has it): load http://localhost:4173/editor, wait for
# [data-notebook-root]; assert: 2 cells, clicking a cell's [data-run-cell] renders
# .js-plotly-plot charts, no pageerror, cell nav focuses cells, diagnostics land on the
# right lines, wheel scrolls between cells.
```
Gotchas: the editor only loads on the `/editor` route; `verdict-editor` is light-DOM (no
shadow root); Plotly (~4.6MB) and CodeMirror (~371KB) load lazily on first use; the runtime
`finvm` lacks `json.*` builtins (Display uses record literals that coerce to `Json`, not
`jsonObject`); `Date.now`/`Math.random` are fine in app code but NOT in workflow scripts.

## 6. Definition of done (whole project)
- `NotebookMount.js` is a thin FFI bootstrap; notebook state/update/view/run are PureScript.
- **All 9 bugs in §2 are gone** — including Debug tab, Visual tab, and cell resize working,
  and the editor no longer clunky/laggy.
- **Each cell is a standalone `module Main` program** that imports its packages; cells
  compile/run independently; no cross-cell namespace errors.
- **Live loop works**: with live mode on, every cell re-runs every X seconds and its output
  updates on its own; the default example streams (cell 1 fetches+strategizes, cell 2
  re-simulates) without user interaction.
- **Nothing hardcoded, nothing hidden**: all visible behavior comes from user-readable,
  user-editable Verdict; a user can put arbitrary Verdict in any cell and it just runs.
- `build:notebook && build && test:notebook` green; browser smoke check passes; cell nav,
  scroll, resize, fold, run/stop all work.
