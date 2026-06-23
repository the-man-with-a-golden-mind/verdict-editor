# Task prompt — Phase 2 of the Verdict notebook output system (interactive widgets)

You are a coding agent picking up a multi-phase feature. Phase 1 is built and
merged; your job is **Phase 2: make output interactive** (widgets the user
manipulates feed values back into the Verdict program). Work incrementally on a
branch, keeping every build and test green.

## Repo + how to orient (read these FIRST)
- Repo: `/Users/michalmajchrzak/Projects/fin/editor` — the Verdict notebook editor
  (a `<verdict-editor>` web component; Verdict programs compile to FinVM bytecode and
  run with host-serviced effects).
- **Read before coding**: `docs/output-system-design.md` (the design; Phase 1 marked
  BUILT, Phase 2 specified under "Interactivity"), `docs/output-renderer-design.md`
  (the rendering engine), and the auto-memory at
  `~/.claude/projects/-Users-michalmajchrzak-Projects-fin-editor/memory/` (esp.
  `verdict-language-gotchas.md`, `embeddable-editor.md`, `notebook-ps-refactor.md`,
  `build-toolchain.md`).
- The whole stack is **PureScript-first** (the user insists): logic in PureScript,
  thin JS FFI only for genuinely-JS-only APIs (Plotly, ResizeObserver, DOM, cache).
- Start: `git checkout master && git pull` (Phase 1 is there), then branch:
  `git checkout -b output-phase2`.

## What Phase 1 gives you (the foundation you build on)
The output renderer is a **PureScript mini-TEA** in `src/Notebook/Output.purs`
(+ FFI `src/Notebook/Output.js`):
- `renderOutputInto :: EffectFn3 host raw bridge` stores `{raw, bridge}` + a UI-state
  bag on the host (`host.__out`, `host.__ui`), then `renderNow host`.
- `renderNow` reads the stored raw + ui, renders the Display tree to ps-spa `Html`
  via the **diffing** element-render (`__psSpaRenderDocumentOn`, no innerHTML wipe →
  scroll/zoom survive), then `syncLeavesImpl` fills leaf widgets keyed by tree path.
- Interactivity already works for `dFull`/`dTabs`: handlers are `Effect Unit` thunks
  (`H.OnClick`) that call `setUiInt`/`setUiBool` (writes `host.__ui[key]`) then
  `renderNow host`. **This is the pattern to extend.**
- The Display DSL is `lib/verdict/Display.verdict` (`dText`/`dChart*`/`dStack`/`dCol`/
  `dRow`/`dGrid`/`dSection`/`dTabs`/`dTab`/`dFull`/`dBox`/`dTable`/`dSheet`). Each
  constructor returns a `{ kind = "...", ... }` record (Json). The renderer dispatches
  on `kind`.
- Effects: a cell performs `cache.set/get`, `httpGet`, `db.*`, `time.sleep` which the
  host services. Output is emitted via the reserved `__display__` cache namespace
  (`cache.set("__display__", ...)` → the host renders it live). **Phase 2 mirrors this
  with an INPUT channel.**

## Phase 2 goal + the designed mechanism
Add interactive widgets and a feedback channel (see `docs/output-system-design.md`
"Interactivity"):
- **New widgets**: `dSelect(id, options, default)`, `dInput(id, default)`. Make `dTabs`
  optionally reactive (emit the active tab index).
- **The `__widget__` channel** (mirror of the output-only `__display__`): each widget
  has a stable `id`. When the user changes it, the HOST writes the value into the
  cell's effect storage under the reserved cache namespace `__widget__`, keyed by id.
- **The program reads it** via a small library helper `widgetValue(id)` (add to
  `lib/verdict/Display.verdict` or `IDE.verdict`) that is `cache.get("__widget__", id)`.
- **Propagation**:
  - An **actor / looping cell** (`renderEvery(ms, step)`) reads the new value on its
    next tick automatically — no re-run needed. **Start here** (simplest, validates the
    channel end-to-end).
  - A **one-shot cell** must be **re-run** by the host on change (like the existing
    `__INPUT_*__` flow). Add this second.

## Code map — how render ↔ eval ↔ effects connect (where to wire the channel)
- `src/Notebook/NotebookMount.js`: calls `__notebookRenderOutput(host, value, bridge)`
  (set in `src/Notebook/bundle-entry.mjs`) to render output; owns `runCell(cell)`,
  `state.cells`, and the per-cell output host (`[data-cell-output=<cellId>]`). It also
  calls `bridge.evalCells(...)`. **This is where a widget change must turn into "set
  `__widget__` value + re-run the owning cell".** The renderer currently has no
  "re-run my cell" callback — you'll thread one (e.g. extend the bridge or pass a
  per-host `onWidgetChange(widgetId, value)` callback through `renderOutputInto`).
- `src/editor/notebookEval.ts`: `vmValueToDisplay` has a **kind allowlist** (~line 106)
  — add `select`, `input` so those values pass through to the renderer instead of being
  stringified. `evalNotebookCells` is the eval entry; effect storage is `getEffectStorage`.
- `src/editor/effectDriver.ts`: `createFinvmHandlers` defines `cache.set`/`cache.get`
  (note the `__display__` special-case in `cache.set` → `onEmit`). `EffectStorage`
  (`cacheSet/cacheGet`) is the store the cell reads. The host writes `__widget__` values
  here (main-thread path), or via the worker.
- **Worker boundary (important)**: in the default `sandbox` effect mode the storage
  lives in the FinVM **Web Worker** (`src/editor/finvmWorker.ts` / `finvmClient.ts`), so
  the host can't write its cache directly. Two options: (a) add a `setCache` message to
  the worker protocol, or (b) **simplest**: when a notebook uses interactive widgets,
  route its eval through the existing **main-thread custom-effect path** (see
  `EffectBackendConfig` `kind:'custom'` in `src/editor/editorConfig.ts` + the eval-path
  selection in `VerdictEditor.ts`), where the host owns the `EffectStorage` and can write
  `__widget__` synchronously before re-running. Recommend (b) for the MVP.
- `src/Notebook/Output.purs` / `Output.js`: add `dSelect`/`dInput` cases to
  `viewDisplay` rendering real `<select>`/`<input>` with the current value (read from
  the `__widget__` value or `host.__ui`), and an onChange handler that (1) records the
  value, (2) invokes the host callback to set `__widget__` + re-run. Use the existing
  `getUi*`/`setUi*` + `renderNow` pattern for local echo. Field reads must use the
  direct `asObj`-based readers (NOT `decodeDisplay`, which wraps non-`kind` objects as
  text — that bug bit Phase 1; see `readStr`/`readField` in `Output.js`).
- `scripts/patch-verdict-bindings.mjs`: add `dSelect|dInput|widgetValue` to the
  `usesDisplayLibrary` regex so cells using them link the lib.

## Constraints / Verdict gotchas (will save you hours)
- Verdict has **no `<=`/`>=`** (use `< 1` etc.), **no record-type alias** (repeat inline
  record types), **type signatures required** on every binding, **nullary bindings =
  cell outputs** (helpers must take `Unit`), and `class` is a **reserved field name**
  (Phase 1 used `cls`). Keep `lib/verdict/*.verdict` **ASCII only** — a stray em-dash
  desynced the parser on rebuild.
- Builds need **Node 24**: `export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"`.
  - `npm run build:verdict-notebook` — re-embed the libs (after editing `Display.verdict`
    or the patch script).
  - `npm run build:notebook` — rebuild the notebook bundle (after editing
    `Output.purs`/`.js`, `bundle-entry.mjs`, `NotebookMount.js`). New helper `.js` files
    must be added to the `jsCopies` list in `scripts/build-notebook.mjs`.
  - `npm run build` — vite (after editing `src/editor/*.ts`, CSS).
  - `npm run build:all` runs the three in order.
- `decodeDisplay`/`vmValueToDisplay` kind handling lives in BOTH the eval (TS) and the
  renderer (JS) — keep them in sync when adding kinds.

## Suggested path (each step builds + tests green)
1. **Channel end-to-end on an actor cell.** Add `widgetValue(id)` (cache.get
   `__widget__`) + `dSelect`. Render a `<select>`; onChange writes the value to the
   cell's `EffectStorage` under `__widget__` (main-thread path) — an actor cell's next
   `renderEvery` tick reads it and re-renders. Verify a select changes what the loop draws.
2. **`dInput`** (text/number) the same way (debounced onChange).
3. **One-shot re-run**: for non-looping cells, a widget change re-runs the owning cell
   (`runCell`) after setting `__widget__`. Thread the cell id to the renderer.
4. **Reactive `dTabs`** (optional): emit active index to `__widget__` so a program can
   react to tab changes.
5. Extend the gallery (`src/editor/templates/gallery.ts`) + the e2e regression
   (`tests-js/output-regression-e2e.test.mjs`) with a select/input that changes output.

## Done =
- `dSelect`/`dInput` (+ `widgetValue`) work end-to-end: changing a widget changes what
  the program produces (verified for an actor cell and a one-shot cell).
- ps-spa diffing still preserves chart zoom / scroll across widget-driven re-renders.
- `npm run build:all` + `npm run test:notebook` (84) + `node
  tests-js/output-regression-e2e.test.mjs` all green, plus a new e2e check for a
  widget-driven update. No console errors.
- DSL constructors documented in `Display.verdict`; `docs/output-system-design.md`
  updated to mark Phase 2 built.

## Verify in-browser (pattern used throughout this project)
Puppeteer against `npm run preview` (`/editor`). Inject a notebook via
`window.__verdictEditorConfig.default.defaultDocument` (see
`tests-js/output-regression-e2e.test.mjs` for the exact harness), Run-all, interact
with the widget, assert the output changed. Headless, `--no-sandbox`.
