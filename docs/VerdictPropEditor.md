# Verdict Prop Editor — design doc (lightweight notebook cell editor)

Status: proposed · Scope: replace **Monaco in notebook code cells** with a
**fast, PureScript-first per-cell editor** (“Prop Editor”), while **keeping
Monaco for Source mode** and other shell surfaces that need full IDE features.

Related: [notebook-redesign-plan.md](./notebook-redesign-plan.md) (architecture),
[visualization-tab-design.md](./visualization-tab-design.md) (doc style).

---

## 1. Problem

Notebook cell interaction (focus change, fold, run, gutter click) feels slow.
Profiling and code review show **three stacked costs**:

| Layer | What happens today | Cost |
| --- | --- | --- |
| **Render model** | `render()` clears `stack.innerHTML`, rebuilds every cell, re-renders Plotly outputs | DOM + layout + chart re-init |
| **Monaco lifecycle** | `destroyCellMonaco()` on every render; recreate on focus | Heavy create/dispose + worker |
| **Monaco colorize** | Unfocused cells call `monaco.colorize()` on every full render | N × async highlight per interaction |
| **Compiler** | `updateCellDiagnostics()` → full-program `diagnosticsJS` on many renders; run does prefix eval + per-binding compile | CPU, blocks UI thread |

Monaco is **not the only culprit**, but it is a **bad fit for Jupyter-style
cells**: one heavy editor instance that is constantly destroyed, plus worker-based
colorize for all siblings.

**Goal:** Prop Editor = editor that is cheap enough to keep mounted (or cheap
enough to swap on focus) without full notebook re-render.

---

## 2. Locked decisions

- **Split editors by mode**
  - **Notebook code cells** → Prop Editor (new, light).
  - **Source mode** (whole program in shell) → **keep Monaco** unchanged for now.
  - **Bytecode / Debug read-only panels** → keep Monaco (or existing static highlighter).
- **PureScript-first**: ps-spa owns cell model, focus, diagnostics display, and
  render strategy; JS is FFI-thin (CodeMirror 6 or equivalent).
- **No feature parity with Monaco in v1** — ship fast editing + syntax + cell
  diagnostics first; add completions/hover in v2 if needed.
- **Incremental DOM** is mandatory — Prop Editor does not fix slowness if we still
  nuke the stack on every click.

---

## 3. Architecture

### 3.1 Where Prop Editor lives

```
┌─ ps-spa Notebook (PureScript) ──────────────────────────────┐
│  Cell stack (PS state: cells, focus, outputs, running)       │
│  CodeCell                                                    │
│    ├─ PropEditor (FFI) — one instance per cell OR pooled     │
│    ├─ static preview when folded                             │
│    └─ output region (Display PS renderer, unchanged)         │
│  WysiwygCell → WysiwygFFI (unchanged)                        │
│  concatenate(source) → bridge.onProgramChanged               │
└───────────────┬─────────────────────────────────────────────┘
                │ bridge (unchanged contract)
┌───────────────▼─────────────────────────────────────────────┐
│ Host shell (`VerdictEditor.ts`)                              │
│  Source mode → Monaco (full IDE)                             │
│  evalCells / diagnostics / FinVM — unchanged                 │
└─────────────────────────────────────────────────────────────┘
```

Today `NotebookMount.js` is the mounted bundle; target is to **move render logic
into PureScript** (`src/Notebook/src/`) and shrink `NotebookMount.js` to mount +
bridge only — same trajectory as the original notebook plan.

### 3.2 Module layout (PureScript)

| Module | Responsibility |
| --- | --- |
| `Cell.purs` | `Cell`, `CellKind` (exists) |
| `Notebook.purs` | concatenate, binding names (exists) |
| **`PropEditor.purs`** | PS types for editor handle, events (`OnChange`, `OnFocus`, `OnBlur`) |
| **`PropEditorFFI.purs` / `.js`** | create, destroy, setValue, getValue, setReadOnly, focus, layout |
| **`VerdictSyntax.purs`** | Token rules / theme colors as data (port from Monarch tokenizer) |
| **`NotebookRender.purs`** | Incremental cell DOM: patch focus, fold, output; no full stack clear |
| **`NotebookDiagnostics.purs`** | Debounced per-cell diag mapping; cache by source hash |

Replace `MonacoFFI.purs` with `PropEditorFFI` in the notebook bundle only.
**Do not remove** Monaco from `VerdictEditor.ts` or `notebookBridge.ts` until
Source mode is explicitly migrated (out of scope v1).

### 3.3 Editor engine choice

**Recommended: CodeMirror 6** via minimal FFI.

| Option | Verdict |
| --- | --- |
| **CodeMirror 6** | Best balance: small per-instance cost, multiple editors OK, keymaps, gutters, extensions API |
| textarea + overlay | Smallest; acceptable for spike; poor UX (indent, multiline selection) |
| Keep Monaco per cell | Only viable with incremental render + instance pooling; still heavier than CM6 |

Spike in `PropEditorFFI.js` with CM6 + `@codemirror/lang-javascript` custom
Verdict grammar (or legacy mode ported from Monarch rules in `VerdictEditor.ts`).

---

## 4. Monaco features — inventory and Prop Editor plan

### 4.1 Source mode (Monaco — **keep**, not Prop Editor)

| Feature | Used for | Prop Editor v1 |
| --- | --- | --- |
| Verdict Monarch tokenizer | Syntax colors | **Port** same rules to CM6 Lezer or legacy mode |
| Completion (keywords, types, prelude fns) | Tab completion | **Defer** — optional v2 |
| Hover (`signaturesJS`) | `name : Type` | **Defer** — optional v2 (cheap: query on Ctrl+hover) |
| Error squiggles (`setModelMarkers`) | Whole-program diagnostics | **Cell-scoped** text under editor (already in notebook) |
| Inline binding results (ghost text) | Source mode only | **N/A** in cells |
| Bracket matching, find, minimap | Power editing | **Defer** / partial (CM6 bracket extension) |
| `Ctrl+Enter` run | Shell shortcut | **Keep in shell**; cell run via gutter / ps-spa keymap |

### 4.2 Notebook cells (Monaco today — **replace**)

| Feature today | Implementation | Prop Editor v1 |
| --- | --- | --- |
| Edit focused cell | `monaco.editor.create` single `cellMonaco` | CM6 instance **stays mounted** on focus; or one shared editor moved between hosts |
| Unfocused preview | `monaco.colorize` → static HTML | **CM6 `EditorView` in `editable=false`** OR cached HTML highlight (invalidate on source change only) |
| Auto-height | `getContentHeight` + layout | CM6 `heightForContent` extension or CSS `field-sizing: content` + max-height scroll |
| Sync `cell.source` | `onDidChangeModelContent` | CM6 `updateListener` → PS `OnChange` |
| Focus on click preview | click → `render()` full rebuild | **`focusCell id`** → patch classes + focus editor (no full render) |
| Theme `verdict-dark` | Monaco theme | Shared CSS variables from `main.css` / token map in `VerdictSyntax.purs` |

### 4.3 Minimum viable editing (v1)

1. Monospace, line numbers (optional v1.1), Verdict syntax highlighting  
2. Standard typing: insert, delete, newline, indent (Tab → spaces), undo/redo (CM6 built-in)  
3. Copy/paste  
4. Focus ring / active cell border  
5. Debounced `onChange` → update `cell.source` → `publishSource` (debounced, not per keystroke full diag)  
6. Cell diagnostics as text lines under editor (existing pattern)  
7. Keyboard: **Shift+Enter** run cell, **Ctrl/Cmd+Enter** run (match Jupyter where possible)

### 4.4 Nice-to-have (v2)

- Completions from static keyword/prelude list (no Monaco dependency)
- Hover via `bridge.signaturesJS(cellSource)` or concatenated module
- Jump to error line from diag click
- Vim mode (CM6 extension) — only if requested

---

## 5. Making it fast

### 5.1 Render strategy (required — independent of editor choice)

Replace “full rebuild” with **patching**:

| Event | Today | Target |
| --- | --- | --- |
| Focus cell | `render()` all cells | Toggle `data-cell-focused`, focus Prop Editor, scroll into view |
| Fold / unfold | full `render()` | Toggle class on one cell; skip output/editor rebuild if unchanged |
| Run cell | `render()` ×2 | Update running spinner + output host for **that cell only** |
| Add/delete cell | full `render()` | Splice one DOM node; update nav panel |
| Typing in cell | `publishSource` → diag + sometimes render | Debounce 300ms diag; **never** re-render stack on keystroke |

Keep a `renderVersion` per cell; only re-mount Prop Editor when `cell.id` or
`cell.source` external set (paste, load doc) forces it.

### 5.2 Compiler / bridge

| Call | Target |
| --- | --- |
| `diagnosticsJS` | Debounced 300–500ms after last edit; skip if source hash unchanged |
| `bridge.compile` before run | Keep for run path only; not on focus |
| Prefix eval (cells 0..N) | Keep correctness; optimize later with snapshot signature / dirty prefix |
| `colorize` / static highlight | Cache by `(cellId, sourceHash)`; drop Monaco colorize entirely |

### 5.3 Prop Editor instance policy

**Option A (recommended):** one CM6 `EditorView` per code cell, always mounted,
`editable` toggled by focus. Cost is ~linear in cells but no destroy/recreate churn.

**Option B:** single floating editor reparented into focused cell’s host (JupyterLab-style). Fewer instances; more reparent logic.

Spike both with 20-cell notebook; pick by measured focus latency.

### 5.4 Output region

Plotly outputs: **do not** destroy on unrelated cell focus. Mount output blocks
once per `(cellId, bindingName, outputHash)`; update in place when eval result changes.

---

## 6. PureScript + ps-spa implementation plan

### Phase 0 — Spike (1–2 days)

- [ ] `PropEditorFFI.js`: CM6 + Verdict highlighting on one div
- [ ] Measure: focus switch ms, memory with 10/30 cells
- [ ] Document chosen instance policy (A vs B)

### Phase 1 — FFI + types

- [ ] `PropEditor.purs` / `PropEditorFFI.purs` with create, dispose, setValue, getValue, focus, setEditable
- [ ] Port Monarch tokenizer rules from `VerdictEditor.ts` → `VerdictSyntax` (JS object or PS record → CM6)
- [ ] Wire into one cell in `NotebookMount.js` behind feature flag `usePropEditor`

### Phase 2 — Incremental render

- [ ] Extract render from `NotebookMount.js` → `NotebookRender.purs` (or incremental JS module called from PS)
- [ ] Remove `stack.innerHTML = ""` from focus path
- [ ] Remove `destroyCellMonaco` / `monaco.colorize` from notebook bundle
- [ ] Debounced diagnostics module

### Phase 3 — Polish + remove notebook Monaco

- [ ] Delete `MonacoFFI.purs` from notebook spago bundle
- [ ] Update [notebook-redesign-plan.md](./notebook-redesign-plan.md) diagram (CodeCell → Prop Editor)
- [ ] Keyboard shortcuts, auto-height, folded preview

### Phase 4 (optional) — Completions / hover in cells

- [ ] Static completion source
- [ ] Hover via `signaturesJS` on demand

**Host shell:** Monaco remains for Source mode until a separate “whole-file Prop
Editor” project justifies migration.

---

## 7. Testing

### 7.1 Unit (PureScript / Node)

| Test | Assert |
| --- | --- |
| `concatenateCode` / binding names | unchanged |
| Source hash / debounce helper | diag not fired twice for same hash |
| Diag line mapping | concatenated line → cell line (reuse `notebookBindingsCore`) |

### 7.2 Browser / integration (existing `tests-js/` + new)

| Test | Assert |
| --- | --- |
| Notebook shell smoke | mount, add cell, type, run — still pass |
| **Focus latency** (new) | programmatic focus A→B→A; p95 < 50ms DOM patch (no full render flag) |
| **No Monaco in notebook bundle** (new) | grep bundle / assert `createEditorImpl` absent after migration |
| Eval / FinVM | existing 51 notebook tests unchanged |
| Prop Editor FFI | jsdom or playwright: create editor, setValue, getValue, onChange fires |

### 7.3 Manual QA checklist

- [ ] 20+ cell notebook: focus switching feels instant
- [ ] Run cell 10: only expected prefix eval delay (not UI freeze)
- [ ] Fold/unfold code and output without losing cursor
- [ ] Source mode still uses Monaco with completions + hover
- [ ] WYSIWYG cells unchanged
- [ ] Plotly chart not flickering on unrelated focus change
- [ ] Mobile/narrow width: editor scrolls inside cell max-height

### 7.4 Performance budgets (definition of done)

| Metric | Budget |
| --- | --- |
| Cell focus change (UI patch only) | p95 < **50ms** (no compile, no full stack rebuild) |
| Keystroke → visible character | p95 < **16ms** (one frame) |
| Debounced diagnostics after edit | fires ≤1× per 300ms pause; never on focus-only |
| Memory (30 code cells, empty source) | < **2×** current notebook mount (measure before/after) |

Record before/after in PR description using Chrome Performance panel or
`performance.mark` around focus handler.

---

## 8. Definition of done

**Prop Editor v1 is done when:**

1. **No Monaco in notebook code path** — notebook bundle does not import
   `MonacoFFI`; unfocused cells do not call `monaco.colorize`.
2. **Source mode Monaco unchanged** — completions, hover, inline results, diagnostics markers still work in Source tab.
3. **Incremental render** — focus, fold, and gutter actions do not call
   `stack.innerHTML = ""` or rebuild unrelated cells’ outputs.
4. **Editing works** — type, paste, undo, auto-height (or fixed max + scroll), focus ring, debounced source sync to host.
5. **Run pipeline unchanged** — `evalCells`, prefix eval, FinVM snapshot, Display output render correctly (all existing notebook tests green).
6. **Performance budgets met** — focus p95 < 50ms; no `diagnosticsJS` on focus-only events.
7. **Docs updated** — this file status → **implemented**; notebook-redesign-plan Monaco line updated.
8. **QA checklist** signed off (manual section 7.3).

**Explicitly out of scope for v1:**

- Replacing Monaco in Source mode
- Cell-level completions/hover (v2)
- Collaborative editing / CRDT
- LSP-level features

---

## 9. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| CM6 bundle size | Lazy-load CM6 chunk with notebook bundle (same pattern as Plotly) |
| Verdict grammar drift vs Monaco | Single source of truth: export token rules from one JSON/PS module consumed by both until Source migrates |
| Incremental render bugs (stale outputs) | Per-cell `renderGeneration`; integration tests for run-then-focus-then-run |
| ps-spa migration stall | Phase 1 can ship incremental JS render + CM6 FFI before full PS port |

---

## 10. Open questions

1. **One editor per cell vs reparenting** — resolve in Phase 0 spike.
2. **Line numbers in cells** — Jupyter shows `In [n]:` in gutter only; CM6 line numbers optional?
3. **Feature flag** — `localStorage.usePropEditor` for rollback during rollout?
4. **Accessibility** — CM6 contenteditable vs textarea; screen reader requirements?

---

## Appendix A — Monaco tokenizer reference (port to CM6)

Source of truth today: `defineVerdict()` in
[`src/VerdictEditor.ts`](../src/VerdictEditor.ts) (`keywords`, `typeKeywords`,
`tokenizer.root|string|whitespace`). Prop Editor should reuse the same keyword
lists and comment rules (`--`, `//`).

## Appendix B — Files to touch

| File | Change |
| --- | --- |
| `src/Notebook/NotebookMount.js` | Incremental render; swap Monaco → PropEditor FFI |
| `src/Notebook/src/PropEditor.purs` | **new** |
| `src/Notebook/src/PropEditorFFI.js` | **new** |
| `src/Notebook/src/VerdictSyntax.purs` | **new** (optional) |
| `src/Notebook/MonacoFFI.*` | **remove** from notebook bundle |
| `src/VerdictEditor.ts` | **keep** Monaco for Source mode |
| `src/editor/notebookBridge.ts` | keep `monaco` export for shell; notebook stops using it |
| `tests-js/notebook-shell.test.mjs` | extend focus/latency assertions |
| `docs/notebook-redesign-plan.md` | CodeCell line: Prop Editor not Monaco |
