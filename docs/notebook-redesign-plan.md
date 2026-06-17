# Notebook redesign — plan (v2, decisions locked)

Status: proposed. Turn the editor into an **advanced Jupyter-style notebook**:
ordered cells (code or WYSIWYG), each code cell runnable, with **rich composite
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
