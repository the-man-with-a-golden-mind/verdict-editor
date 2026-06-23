# Output system design — a styled, composable widget DSL

## Vision
Cell output should be a **composable tree of widgets in layouts**, authored as a DSL in
Verdict, **styled by the user with Tailwind**, with **fullscreen** and **export**. Widgets:
text, tables, sheets, charts (phase 1) — and later interactive ones (select, tabs, inputs).
Same code runs identically off-IDE: the program emits a Json description; the host renders it.

This builds on **`docs/output-renderer-design.md`** (the rendering engine: ps-spa keyed vdom
+ an out-of-band `ChartManager`). That redesign is the foundation; this doc is the widget /
DSL / styling / fullscreen / export layer on top. **Phase 1 delivers both** (the new widgets
need the new renderer).

The DSL already exists in embryo — `lib/verdict/Display.verdict` (`dText`, `dStack`, `dCol`,
`dRow`, `dChart*`, `dTable`) emitting `{ kind, ... }` Json. We formalize the schema, add
styling/fullscreen/export, and grow the widget + layout set. **Existing constructors keep
working** (additive, backward compatible — the finance notebook is untouched).

## Status — Phase 1 BUILT (branch `output-system`)
The renderer redesign + the styled widget DSL are implemented, PureScript-first, and
verified in-browser:
- `Notebook.Output` (ps-spa keyed vdom + mini-TEA) + `ChartManager` (Plotly + ResizeObserver)
  replace the JS renderer; the three interim patches are deleted (`3fec94c`).
- Widgets/layouts: `dText`, `dTable`, `dSheet` (CSV export), `dChart*`, `dStack`/`dCol`/`dRow`,
  `dGrid`, `dSection`, `dTabs`/`dTab`, `dFull`, and `dBox` styling (`cd331bd`, `b374fea`, `ba46b7a`).
- Tailwind safelist + cascade-layer precedence so user `dBox` classes resolve and override.
- Fullscreen + tabs are interactive via the per-host mini-TEA state.
- Gallery demo: `src/editor/templates/gallery.ts` (`galleryConfig()`).

Remaining: Phase 2 (interactive `dSelect`/`dInput`, reactive tabs via the `__widget__`
channel) and Phase 3 (more export formats, runtime-Tailwind opt-in, more widgets).

## The schema (contract between Verdict programs and the renderer)
Every node is `{ kind, ...fields }`. Two cross-cutting, optional concerns are handled by
**wrapper nodes** (Verdict has no record-update, so wrappers compose cleanly and the renderer
*merges* them onto the child rather than adding stray divs):

- `{ kind: "box", class: String, child: Node }` — apply Tailwind classes. The renderer renders
  `child` and **merges `class` into the child's root element** (no extra wrapper div → layout
  intact). This is the universal styling primitive.
- `{ kind: "full", child: Node }` — make `child` fullscreen-able (renderer adds a toggle).

### Layout nodes (containers, `items: [Node]`)
- `stack` — vertical (exists).
- `row` / `col` — flex row / column (exist; `col` has an optional `title`).
- `grid` — N responsive columns: `{ kind: "grid", cols: Int, items }`.
- `section` — a titled, collapsible, fullscreen-able panel: `{ kind: "section", title, items }`.
- `tabs` — `{ kind: "tabs", tabs: [{ label, content: Node }] }`. **Phase 1: presentational**
  (active tab is client state; no program feedback). Reactive tabs are phase 2.

### Widget leaves
- `text` — markdown (exists; HTML-escaped). `class` via `box`.
- `table` — read-only data grid: `{ kind: "table", rows: [..] }` (exists).
- `sheet` — the interactive spreadsheet (ps-spa component): scroll/select, **exportable**
  (CSV now; TSV/JSON later). `{ kind: "sheet", rows, columns?, export?: ["csv"] }`.
- `chart` — all current Plotly types (exists), managed by `ChartManager` (zoom-preserving,
  ResizeObserver-fitted).

### Verdict DSL additions (`lib/verdict/Display.verdict`)
```
dBox     : String -> Json -> Json        -- styled wrapper:  dBox("text-red-500 text-2xl", dText("hi"))
dFull    : Json -> Json                  -- fullscreen-able: dFull(dChart(...))
dGrid    : Int -> List Json -> Json
dSection : String -> List Json -> Json
dTabs    : List Json -> Json             -- with dTab : String -> Json -> Json   (label, content)
dSheet   : List Json -> Json             -- exportable spreadsheet (vs read-only dTable)
```
All current constructors stay. Charts/text/tables unchanged on the wire.

## Styling (Tailwind) — the key decision
User-authored classes are typed at **runtime** (in Verdict source) but Tailwind purges unused
classes at **build time**. So a class the user writes only renders if it was pre-generated.
Two options:

- **(A) Generous safelist (recommended, phase 1).** Safelist the common utility families —
  colors (`text-/bg-/border-{color}-{50..950}`), spacing (`p/m/gap/space` scale), typography
  (`text-{xs..9xl}`, `font-{weight}`, `leading/tracking`), layout (`flex/grid/col/row`,
  `w/h` scale, `rounded`, `shadow`, `opacity`), via Tailwind v4 `@source inline(...)` /
  safelist patterns. Covers ~95% of real styling, **zero runtime cost**. Limitation:
  arbitrary bracket values (`text-[19px]`) are build-time only and won't work at runtime —
  documented as the supported vocabulary.
- **(B) Runtime Tailwind (opt-in, later).** A browser JIT scoped to the output area generates
  any class on demand (incl. arbitrary values). Full power, but adds a runtime CSS engine
  (bundle weight) + scoping. Offer as an embedder opt-in for power users.

Security: class strings are inert (no raw HTML/CSS injection); markdown already escapes HTML.
We never `innerHTML` user-supplied markup beyond the existing escaped-markdown path.

## Rendering (extends the renderer redesign)
- Structure (`stack/col/row/grid/section/tabs/text/table`) → **ps-spa keyed vdom**; `class`
  from `box` merged onto the keyed node. Diffing preserves scroll/focus/tab-state across live
  updates.
- `chart` → **`ChartManager`** managed leaf (newPlot/react+uirevision/purge + ResizeObserver).
- `sheet` → the existing ps-spa spreadsheet as a managed leaf (its state preserved by vdom
  identity once it's in the same tree).
- Client state (active tab, fullscreen, collapsed section) lives in the output component's
  ps-spa model — updated by widget events, re-rendered by diff.

## Fullscreen
`dFull(child)` (or a section's toggle) renders a button; on toggle, client state flips the
node to a `fixed inset-0 z-50` overlay (with a backdrop + close/esc). Charts re-fit via their
ResizeObserver automatically. Also a per-cell "fullscreen this output" affordance.

## Export (sheets)
Each `sheet` gets a small toolbar with an export menu. CSV first (reuse
`rowsToCsv`/`csvEscape` from `SpreadsheetTable.js`, download via a `Blob` + `<a download>`).
Pluggable formatters (`csv` → later `tsv`, `json`, `xlsx`). Charts get the Plotly "download
PNG" modebar button (already available).

## Interactivity (phase 2 — designed now, not built)
The crux for `select`/`input` is a **feedback channel**: an output widget produces a value
that flows back into the program. It maps cleanly onto the existing architecture:
- A widget has an `id` + initial value. On change it writes to a reserved **input channel**
  in the shared cache (mirror of the output-only `__display__` channel — e.g. `__widget__`).
- The cell reads it via a `widgetValue(id)` effect (a `cache.get` on that channel). A looping
  (actor) cell picks it up on its next `renderEvery` tick; a one-shot cell re-runs on change
  (like `__INPUT_*__`, but sourced from the output).
- This makes output **bidirectional** (à la ipywidgets / Streamlit) without new machinery —
  it reuses the cache + actor model already present. Tabs become reactive by emitting their
  active index on the same channel.

Phase 1 leaves widgets non-interactive; the schema reserves `id` and the channel name so
phase 2 is additive.

## Implementation: PureScript-first
The whole output renderer is **PureScript** (`Notebook.Output`): the Display ADT + decode,
the widget/layout view, styling merge, tabs/fullscreen/collapse state, and the update loop.
This also advances the strangler (it moves output rendering off `Display.js`).

ps-spa's `Runtime.start` is page/route-scoped, and the existing PS mounts (gutter/nav/sheet)
are stateless one-shot renders — neither fits a stateful component mounted into one cell's
output element. So `Notebook.Output` is a **mini-TEA driver in PureScript**:
- `Model = { display :: Display, ui :: UiState }` held in a `Ref`; `Msg` = tab/fullscreen/
  collapse events; `view :: (Msg -> Effect Unit) -> Model -> Array (Html Msg)`.
- On each `Msg` (from `H.OnClick`) or external `setDisplay json`, update the `Ref` and
  re-render via ps-spa's **in-place diffing reconcile** (`Browser.reconcileChildren`, confirmed
  to diff positionally, not wipe) → DOM identity preserved → scroll/focus/zoom survive.
- `mountOutputExport :: EffectFn1 Foreign OutputHandle` returns `{ setDisplay, destroy }`,
  registered as `__notebookMountOutput` in `bundle-entry.mjs`. `renderDisplayInto` becomes a
  thin shim that get-or-creates the handle per host and calls `setDisplay`.

**Thin FFI boundary** — only genuinely JS-only APIs, each a few lines:
- `ChartManager` (Plotly + `ResizeObserver`): `syncCharts(host, specsByKey)` / `destroy`.
- element-render binding (`reconcileChildren(host, htmlArray)`) if ps-spa doesn't already
  export an element-targeted render.
- CSV download (`Blob` + `<a download>`).
Everything else — decode, layout, styling, state, events — is PureScript.

## Phasing
- **Phase 1 (this):** renderer redesign (per `output-renderer-design.md`) **+** the styled
  widget DSL: `dBox`/`dFull`, `dGrid`/`dSection`/`dTabs` (presentational), `dSheet`
  (exportable), Tailwind safelist, fullscreen, CSV export. Non-interactive. Backward
  compatible.
- **Phase 2:** interactive widgets (`dSelect`/`dInput`, reactive `dTabs`) + the `__widget__`
  feedback channel + the `widgetValue` effect.
- **Phase 3:** more export formats, runtime-Tailwind opt-in, more widgets (image, metric/KPI,
  progress, badge), theming hooks.

## Migration / compatibility
- The new renderer must render today's schema unchanged (`text/chart/table/stack/col/row`) —
  pinned by `tests-js/notebook-display.test.mjs`.
- New fields (`class` via `box`, `id`) and kinds are additive; old programs render identically.
- The `Display.verdict` exposing list grows; the patch/link script
  (`scripts/patch-verdict-bindings.mjs`, `usesDisplayLibrary`) gains the new names.

## Build steps (Phase 1)
1. **Renderer foundation** — implement `docs/output-renderer-design.md` (ps-spa `Notebook.Output`
   + `ChartManager`), behind the existing `renderDisplayInto` signature; delete the three interim
   patches. Tests green.
2. **Schema + DSL** — extend `lib/verdict/Display.verdict` (`dBox/dFull/dGrid/dSection/dTabs/dSheet`);
   update the renderer to handle `box/full/grid/section/tabs/sheet`; update `usesDisplayLibrary`.
3. **Tailwind safelist** — add the safelist to `tailwind.config.js` / CSS; verify user classes apply.
4. **Fullscreen + export** — fullscreen toggle (section/`dFull`); sheet CSV export toolbar.
5. **Docs + examples** — a gallery cell showing every widget + styling; update embedding docs.

## Verification
- `tests-js/notebook-display.test.mjs` extended to pin the new schema; all `test:notebook` green.
- Puppeteer: user Tailwind class applied to text; fullscreen toggles to an overlay and back;
  a sheet exports a CSV (download fires); tabs switch; grid wraps responsively; charts fit
  their column and keep zoom; the three regression bugs (scroll, zoom, overlap) stay fixed; and
  a new check: drag-resize the panel → charts re-fit (ResizeObserver).
