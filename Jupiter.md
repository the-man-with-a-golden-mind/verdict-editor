# Notebook redesign — plan (v2, decisions locked)

Status: done (branch `feat/notebook`). P0 Verdict `Display`/`evalBindingsJsonJS` stubbed in `verdict-notebook.mjs`; editor uses FinVM-backed per-cell eval + PureScript Display renderer under `src/Notebook/`. Turn the editor into an **advanced Jupyter-style notebook**:
outputs** — text, charts, spreadsheets, or combinations. Built **PureScript-first
on ps-spa**; JS libraries only for Monaco (code), Plotly (charts), and a WYSIWYG
editor. **Existing behaviour is preserved**: the notebook is a layer over a
*single* Verdict module — code cells concatenate, in order, into the same source
today's Run / DB / Debug / Visual pipeline already consumes. One program, one VM,
shared state.

## Locked decisions
- Jupyter-style **cell editors** (a vertical cell stack), not one big editor.
- **Spreadsheet**: reuse the **pure-PureScript** ps-spa grid (`examples/excel/src/Pages/Spreadsheet.purs`), with a **"Copy to CSV"** action.
- **Charts**: **Plotly.js** (JS lib, FFI-wrapped, lazy-loaded).
- **WYSIWYG** cells: a JS WYSIWYG lib that **serialises to Markdown**; the **user never sees Markdown** — Markdown is only the stored form.
- **As much PureScript as possible**: ps-spa drives the notebook, cells, Display rendering, spreadsheet, composition; JS libs (Monaco/Plotly/WYSIWYG) are thin FFI.
- **Verdict gains a `Display` library** so a binding can return a rich, composite output we can render directly.

## 1. Feasibility with Verdict

| Need | Status |
| --- | --- |
| Per-cell execution | ✅ `evalBindingsJS` evaluates each top-level binding independently against the whole module (in current Verdict and `@v_m_v/verdict@1.1.0`). |
| Shared VM / state across cells | ✅ Editor already persists `effectStorage` + `finvmState` across runs. |
| Rich composite output | ⚠️ Needs a Verdict **`Display`** type + builders **and** a structured eval that returns it as JSON (§7). |
| Language change | ✅ None to the core; `Display` is just a prelude type, normal data. |

## 2. Architecture (PureScript-first)

```
┌─ ps-spa Notebook (PureScript) ─────────────────────────────┐
│  cell stack: [ CodeCell | WysiwygCell ]                    │
│  CodeCell  → Monaco (FFI)   · Run button · Output          │
│  WysiwygCell → WYSIWYG (FFI) → Markdown (stored, hidden)   │
│  Output renderer (PS): decode Display JSON →               │
│     DText  → formatted text                                 │
│     DChart → Plotly figure (FFI: Plotly.react)             │
│     DTable → ps-spa Spreadsheet + Copy-to-CSV              │
│     DStack → render children in order                       │
│  concatenated source ⟶ host                                │
└───────────────┬────────────────────────────────────────────┘
                │ source string  /  run requests  (bridge)
┌───────────────▼────────────────────────────────────────────┐
│ Host shell (current TS `<verdict-editor>`): tabs, whole-    │
│ program Run, DB, Debug, Visual — UNCHANGED, consume the     │
│ concatenated program exactly as today.                      │
└─────────────────────────────────────────────────────────────┘
```

The notebook is a **ps-spa component mounted where Monaco currently lives** (the
"Editor" tab body). The **only coupling** to the existing TS shell is a thin
bridge: the notebook publishes the concatenated source + per-cell run requests;
the shell compiles/evals and returns results. DB/Debug/Visual/whole-Run stay in
the shell, untouched.

**JS libs are FFI-thin:** PureScript owns all logic/state; Monaco draws code,
Plotly draws charts, the WYSIWYG edits prose. PureScript builds the Plotly figure
JSON and the spreadsheet; JS just renders.

## 3. Document model

```ts
Cell = { id, kind: 'code' | 'wysiwyg', source }   // wysiwyg source = Markdown
Notebook = { cells: Cell[] }
```
- **Compiled program = code cells joined in order.** WYSIWYG cells aren't compiled
  (optionally emitted as `-- ` comments to round-trip + feed Visual doc-hover).
- Persisted as a notebook doc (`.vnb` JSON). Plain `.verdict` loads as one code cell.
- Cell ↔ binding mapping by top-level decl name (decl spans from `astJS` once re-added, else a light scan).

## 4. Per-cell execution (same VM)

- "Run cell" evaluates that cell's binding(s) against the **full concatenated
  module**, reusing the persistent `effectStorage`/`finvmState` → genuinely the
  same VM; later cells see earlier cells' DB writes. Add **Run all / Run above**.
- Per-cell errors from `diagnosticsJS` (concatenated-source positions mapped back
  to cell + line). Definition-only cells (types/helpers) show no Run button.

## 5. Output rendering (PureScript renderer)

A runnable binding returns a **`Display`** (or a plain value → sensible default).
`evalBindingsJsonJS` hands back its JSON; the ps-spa renderer pattern-matches:
- **DText** → formatted text (Markdown→HTML).
- **DChart** → PureScript assembles a Plotly figure (traces+layout) from the typed
  `ChartSpec`; FFI `Plotly.react(node, data, layout)`. Lazy-load Plotly (~3 MB).
- **DTable** → the ps-spa **Spreadsheet** component renders the rows; a **Copy to
  CSV** button serialises the grid to CSV → clipboard.
- **DStack [..]** → render children top-to-bottom (this is "text + chart",
  "chart + spreadsheet", etc.).

## 6. What stays vs new

**Unchanged:** VM; whole-program Run; DB tab; Debug tab; Visual tab (Blocks/Map);
compile/diagnostics pipeline; persisted state.
**New:** ps-spa notebook component (cells, run, output); Monaco/Plotly/WYSIWYG FFI;
ps-spa Display renderer; ps-spa Spreadsheet (ported from excel example) + CSV;
Verdict `Display` lib + `evalBindingsJsonJS`.

## 7. Verdict changes (the only language-side work)

**(a) `Display` library (prelude).** A typed, composable rich-output type:
```purescript
data Axis  = Axis { title :: String }
data Trace = Trace { name :: String, kind :: String   -- "line"|"bar"|"scatter"
                   , x :: List Fixed, y :: List Fixed }
type ChartSpec = { title :: String, traces :: List Trace, xaxis :: Axis, yaxis :: Axis }

data Display
  = DText String                 -- formatted text / markdown
  | DChart ChartSpec             -- → Plotly
  | DTable (List Json-ish row)   -- → ps-spa spreadsheet  (rows = records)
  | DStack (List Display)        -- compose text + chart + spreadsheet

-- builders: text, lineChart, barChart, table, stack
```
`ChartSpec` is intentionally a small, typed, Plotly-friendly shape the editor maps
to Plotly traces. (Exact row typing for `DTable` follows Verdict's record model.)

**(b) `evalBindingsJsonJS`** — like `evalBindingsJS` but returns the **encoded
value** (reusing `assembleWithEntry` + `encodeValueJson`) plus the binding's
`typeSig`:
```purescript
evalBindingsJsonJS :: String -> Array
  { name :: String, ok :: Boolean, json :: Json, typeSig :: String, error :: String }
```
If `json` is a tagged `Display`, render richly; otherwise default by `typeSig`
(`List {record}` → table, `List Int/Fixed` → text, scalar → text). Additive, no
semantic change. Must land in whichever Verdict build the editor runs.

## 8. Phasing

- **P0 — Verdict**: `Display` prelude lib + `evalBindingsJsonJS`; rebuild/publish.
- **P1 — ps-spa notebook shell**: cell-stack, code cells (Monaco FFI), WYSIWYG
  cells (FFI→Markdown), Notebook⇄Source toggle, concatenation + bridge to the TS
  shell. *(No behaviour change; same program, new surface.)*
- **P2 — per-cell Run + Display renderer**: text first, shared-state wiring,
  Run-all/above, error mapping.
- **P3 — rich outputs**: port ps-spa Spreadsheet + Copy-to-CSV; Plotly charts;
  DStack composition.
- **P4 — polish**: WYSIWYG UX, persistence (`.vnb`), keyboard flow, theming.

## 8a. Thin bridge (LOCKED)

The notebook is ps-spa; the shell stays TS. They meet at a **small typed
interface** — no shell rewrite. ps-spa is expected to grow into other parts of the
app later, but this feature ships behind the thin bridge.

```
// TS shell exposes to the ps-spa notebook (window/FFI handle):
compile(source: string)            -> { ok, error }            // diagnosticsJS
evalCells(source, names: string[]) -> CellOutput[]             // evalBindingsJsonJS, shared VM/state
notebookSource(): string           // notebook publishes concatenated code cells
onProgramChanged(source)           // shell re-feeds Run/DB/Debug/Visual
```
The notebook owns the document + cells + outputs (PureScript); the shell owns
compile/eval/run + DB/Debug/Visual (unchanged). Only `source` strings, cell-run
requests, and `CellOutput` JSON cross the boundary.

## 9. Risks / things to confirm

1. **PS↔TS bridge** — LOCKED to the thin interface above.
2. **Multiple Monaco instances**: cell stack ⇒ many editors. Mitigate with
   "one live Monaco + unfocused cells as `monaco.editor.colorize` static HTML."
3. **Plotly weight (~3 MB)**: lazy-load only when a `DChart` first renders.
4. **WYSIWYG lib choice** (must be framework-agnostic — editor isn't React):
   ProseMirror/TipTap or Milkdown (Markdown-native). Serialises to Markdown.
5. **Spreadsheet reuse**: the excel example is a full ps-spa *page*; extract its
   grid into a reusable component for cell output.
6. **Display ↔ Plotly mapping** lives in the editor (PS): keep `ChartSpec` small
   and stable so Verdict authors get a clean typed chart API.
7. **Eval seam** (`evalBindingsJsonJS`) couples to the pending new-package
   integration (A) — coordinate.

## 10. Out of scope
Multi-file notebooks; realtime collaboration; non-Verdict kernels; changing
VM/Debug/Visual; the E2EE track.

---

# Implementation brief — for the coding agent

You are implementing the notebook surface described in the plan above. Read the
plan first; this brief is the build contract.

## 0. Mission
Add a Jupyter-style notebook editing surface to the editor — cells (code +
WYSIWYG), per-cell run, rich outputs (text / Plotly chart / spreadsheet /
composite) — **without changing any existing editor behaviour**. PureScript-first
on **ps-spa**; JS libs only for **Monaco** (code), **Plotly** (charts), and a
**WYSIWYG** editor whose stored form is Markdown (the user never sees Markdown).

## 1. Branch & workflow
- Branch from `master`: `git checkout -b feat/notebook`. **Never commit to master.**
- Small commits per phase; open a PR when the Definition of Done is met, with
  screenshots/gifs of each output type.
- End commit messages with the repo's `Co-Authored-By` trailer.

## 2. Hard constraints (do not break)
- **Existing tabs (Editor / DB / Debug / Visual) and whole-program Run behave
  identically.** Add a regression e2e proving it.
- **Thin bridge** only (see §6) — do **not** rewrite the TS shell
  (`src/VerdictEditor.ts`). The notebook is a new ps-spa component mounted in the
  Editor-tab body; a `Notebook ⇄ Source` toggle shows the existing Monaco.
- **One Verdict module**: code cells concatenate, in order, into the exact source
  string the existing pipeline compiles. Markdown/WYSIWYG cells are not compiled.
- **Same VM/state across cells**: reuse the shell's persistent
  `effectStorage`/`finvmState`, so a DB write in one cell is visible to later cells.
- **Build under Node 24** (v22 lacks `node:sqlite`):
  `export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"`. PureScript via
  `node_modules/.bin/spago` (the yaml-aware spago); bundle PS with
  `esbuild output/<Module>/index.js --bundle --minify --format=esm` (NOT
  `spago bundle`). Editor via `npm run build` (vite).
- **Tailwind**: any new `.purs`/`.ts` that emits utility classes must be covered
  by `tailwind.config.js` `content` globs (add the new dir, or its classes get
  purged → unstyled UI).

## 3. Architecture & file layout
- New PureScript notebook modules (suggested): `src/Notebook/Notebook.purs`
  (cell stack + state), `Cell.purs` (code/wysiwyg cell), `Display.purs` (decode +
  render the Display JSON), `Spreadsheet.purs` (ported from
  `.ps-spa-repo/examples/excel/src/Pages/Spreadsheet.purs`), and FFI modules
  `MonacoFFI`, `PlotlyFFI`, `WysiwygFFI` (`.purs` + `.js`).
- Mount: the ps-spa notebook renders into the Editor-tab body where Monaco lives
  today. `Source` mode reveals the current single Monaco unchanged.
- Bundle the notebook PS to `public/lib/notebook.mjs` (esbuild ESM) and load it
  the same way the editor loads other `/lib/*.mjs` (fetch+blob `importPublicModule`).

## 4. How it must look (Jupyter, dark theme = existing slate palette)
- Vertical **cell stack**. Top toolbar: `+ Code`, `+ Text`, `Run all`,
  `Notebook ⇄ Source`.
- **Code cell**: left gutter with a **Run ▶** button + cell number; focused cell =
  live Monaco (Verdict language + `verdict-dark` theme already configured);
  unfocused cells render as static syntax-highlighted HTML via
  `monaco.editor.colorize` (avoid N live Monacos). Output area below.
- **WYSIWYG cell**: rich-text editing; **no raw Markdown ever shown**.
- **Output area** renders the Display:
  - `text` → formatted text (Markdown→HTML),
  - `chart` → Plotly figure,
  - `table` → the ps-spa spreadsheet grid + a **Copy to CSV** button,
  - `stack` → children stacked in order (text+chart+spreadsheet).
- Empty/error states styled; per-cell error shown under that cell.

## 5. Phases (ship incrementally; each builds green)
- **P1** — cell stack + document model + thin bridge + concatenation. *No
  behaviour change yet — same program, new surface.*
- **P2** — per-cell Run + Display renderer (text), shared-VM wiring, Run-all,
  error → cell+line mapping.
- **P3** — Spreadsheet (port excel grid) + Copy-to-CSV; Plotly charts
  (lazy-loaded); `DStack` composition.
- **P4** — WYSIWYG cells (Markdown-serialising lib); persistence (`.vnb` JSON);
  keyboard flow; theming polish.

## 6. Thin-bridge contract (TS shell ⇄ ps-spa notebook)
TS shell exposes (window handle / FFI); notebook consumes:
```
compile(source: string): { ok: boolean; error?: string }      // diagnosticsJS
evalCells(source: string, names: string[]): CellOutput[]       // evalBindingsJsonJS, shared VM/state
onProgramChanged(source: string): void                         // re-feed Run/DB/Debug/Visual
```
Notebook exposes: `notebookSource(): string` (concatenated code cells). Only
`source` strings, run requests, and `CellOutput` JSON cross the boundary.
`CellOutput = { name, ok, display, typeSig, error }` where `display` is the
Display JSON below.

## 7. Display JSON contract (the renderer must match exactly)
From the Verdict `Display` lib (P0):
```json
{ "kind":"text",  "text":"..." }
{ "kind":"chart", "title":"...", "traces":[{"name","kind":"line|bar|scatter","x":[..],"y":[..]}],
                  "xaxis":{"title":""}, "yaxis":{"title":""} }
{ "kind":"table", "rows":[ {"col":<v>, ...}, ... ] }
{ "kind":"stack", "items":[ <display>, ... ] }
```
Map `chart` → Plotly traces; `table.rows` → spreadsheet (columns from keys);
non-`Display` values render by `typeSig` (`List {record}`→table, scalar→text).
**If a field changes, stop and coordinate — this is a shared contract.**

## 8. Dependencies
- **Plotly.js**: npm dep, **dynamic import on first `chart` render** (it's ~3 MB —
  must not enter the main chunk). Assert it's a separate chunk.
- **WYSIWYG**: a framework-agnostic, Markdown-serialising editor (ProseMirror/
  TipTap or Milkdown — NOT React-bound; the app isn't React). Thin FFI.
- **Spreadsheet**: extract the grid from the ps-spa excel example into a reusable
  component; add Copy-to-CSV.
- **Verdict `evalBindingsJsonJS`** (P0) is a dependency. If it isn't in the
  editor's Verdict build yet, implement against a stub that adapts
  `evalBindingsJS` string values, and gate rich rendering behind feature
  detection — do not block.

## 9. Build / run / verify
- `export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"` for all builds.
- Editor: `npm run build`; dev `npm run dev`; preview `npm run preview` (:4173).
  **Test on BOTH dev and preview** (custom-element/worker timing differs).
- Drive with **puppeteer** (devDependency); assert on DOM. `monaco` is NOT a
  window global — interact via the editor DOM and assert on rendered nodes.

## 10. Tests (required)
- **Unit**: cell→program concatenation (order, markdown excluded); Display JSON
  decode → render tree for every `kind` incl. nested `stack`; cell↔binding
  mapping by decl name; CSV serialization (commas/quotes/newlines escaped).
- **Integration**: per-cell run shares VM state (cell A writes DB → cell B reads
  it); an error in one cell maps to that cell+line, others still run.
- **Bridge**: `notebookSource()` reflects edits; `onProgramChanged` makes the
  shell's Run/DB/Debug/Visual see the updated program.
- **E2E (puppeteer, dev + preview)**: cell stack renders; add a code cell, Run ▶
  shows text output; a `chart` cell renders a Plotly node; a `table` cell renders
  the grid and **Copy to CSV** puts CSV on the clipboard; WYSIWYG edits with no
  raw Markdown visible; `Notebook ⇄ Source` round-trips (Source == concatenation).
- **Regression e2e**: Editor/DB/Debug/Visual tabs and whole-program Run still work;
  **zero console errors**.

## 11. Definition of Done
- [x] All output types work (text, chart, spreadsheet+CSV, composite `stack`),
      plus code cells, WYSIWYG cells, per-cell Run, Run-all, Notebook⇄Source.
- [x] Existing behaviour unchanged — regression e2e green (tabs, Run, DB, Debug,
      Visual); no console errors in dev or preview.
- [x] Same VM/state across cells verified by an integration test.
- [x] All unit/integration/bridge/e2e tests pass on **both** dev and preview.
- [x] Clean build under Node 24 (editor + notebook PS bundle); no TS/PS errors.
- [x] New PS/TS classes present in the built CSS (Tailwind globs updated).
- [x] Plotly is lazy-loaded in its own chunk (verified), not in the main bundle.
- [x] Display-JSON and bridge contracts honoured exactly (or coordinated).
- [x] Work on `feat/notebook`; PR opened with summary + screenshots/gifs; master
      untouched. Update this file's status to "in progress / done".

## 12. Out of scope / coordination
- Verdict P0 (`Display` + `evalBindingsJsonJS`) is a separate task — depend on it,
  stub if absent.
- E2EE/new-package integration and the Visual-tab `astJS` re-add are separate
  tracks; do not entangle them with this branch.

---

# Verdict brief — for the Verdict dev (P0)

The notebook's rich outputs need a language-side foundation. This is **additive**:
a new prelude type + builders and one new JS export. No lexer/typechecker/semantic
changes. This is the **only** Verdict work the notebook requires.

## Context (files)
- Prelude: `src/Verdict/Std/Prelude.purs` — where `Display` and its builders live
  (pure Verdict data; **no new builtins**).
- Eval/JSON: `src/Verdict/Compiler.purs` already has `evalBindingsJS`
  (`BindingResult { name, ok, value:String(show), error }`), `runToJson` /
  `encodeValueJson` (structured value → `Json`), `assembleWithEntry` (compile any
  binding as entry), `signaturesJS` (rendered type per binding). Build on these.
- Published `@v_m_v/verdict@1.1.0` exports `compileJS, diagnosticsJS,
  evalBindingsJS, runWithLogsJS, signaturesJS` — add to this set.

## Part A — `Display` type + builders (Prelude)
A typed, composable rich-output type (pure Verdict data; users construct it):
```purescript
type Axis  = { title : String }
type Trace = { name : String, kind : String   -- "line" | "bar" | "scatter"
             , x : List Fixed, y : List Fixed }
type ChartSpec = { title : String, traces : List Trace, xaxis : Axis, yaxis : Axis }

data Display
  = DText String              -- formatted text / markdown
  | DChart ChartSpec          -- -> Plotly
  | DTable (List <row>)        -- rows are records (same fields) -> spreadsheet columns
  | DStack (List Display)      -- compose: text + chart + spreadsheet, in order

-- ergonomic builders:
text      : String -> Display
lineChart : String -> List Trace -> Display   -- title, traces
barChart  : String -> List Trace -> Display
table     : forall r. List r -> Display       -- r : a record type
stack     : List Display -> Display
```
- `ChartSpec` is intentionally small and Plotly-friendly; keep it stable. `Fixed`
  is the numeric type for chart series.
- `DTable` row typing follows Verdict's record model; the editor derives columns
  from record fields. If fully-polymorphic `List r` is awkward in the type system,
  expose `table` as the practical constructor and let `DTable` carry encoded rows.

## Part B — canonical Display JSON (the contract the editor reads)
A `Display` value **must serialize to exactly this shape** (via a dedicated
`displayToJson` or by making `encodeValueJson` emit it). The editor's PureScript
renderer matches on `kind`:
```json
{ "kind":"text",  "text":"..." }
{ "kind":"chart", "title":"...", "traces":[{"name","kind","x":[..],"y":[..]}],
                  "xaxis":{"title":""}, "yaxis":{"title":""} }
{ "kind":"table", "rows":[ {"col":<value>, ...}, ... ] }
{ "kind":"stack", "items":[ <display>, ... ] }
```
State whether numbers are JSON numbers or decimal strings; the editor will match.
**Shared contract — don't change field names/shape without coordinating.**

## Part C — `evalBindingsJsonJS` export
Like `evalBindingsJS` but returns the **structured value**, reusing
`assembleWithEntry` + `encodeValueJson`, plus the binding's type:
```purescript
evalBindingsJsonJS :: String -> Array
  { name :: String, ok :: Boolean, json :: Json, typeSig :: String, error :: String }
```
- One entry per evaluable (nullary) top-level binding, evaluated against the whole
  module (same set `evalBindingsJS` covers).
- `json` = the value's encoded JSON; if the value is a `Display`, it's the
  canonical schema (Part B), else the value's natural JSON.
- `typeSig` = rendered type (as `signaturesJS` produces) — the editor's default
  render hint for non-`Display` values (`List {record}`->table, scalar->text).
- Keep `evalBindingsJS` (string `show`) unchanged for back-compat.

## Acceptance / DoD
- `text/lineChart/barChart/table/stack` compile and type-check; `DStack` nests.
- A `Display`-returning binding serializes via `evalBindingsJsonJS` **exactly** to
  the Part-B schema (round-trip test per `kind`, incl. nested `stack`).
- Plain-value bindings (Int, `List Int`, `List {record}`) return natural `json` +
  correct `typeSig`.
- `evalBindingsJsonJS` covers the same bindings as `evalBindingsJS`; per-binding
  errors surface (`ok:false`, `error`). No change to existing exports/semantics.
- Published in the next `@v_m_v/verdict` version, on its own branch with a PR.

## Out of scope
Rendering (editor), Plotly/CSV specifics, input params, encryption.
