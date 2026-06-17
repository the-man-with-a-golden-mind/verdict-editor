# Visual tab — design doc (code-as-nested-blocks)

Status: proposed · Scope: a non-editable **Visual** tab next to DB that renders
the user's **Verdict source** as nested, Blockly/Scratch-style blocks — a
structural "sketch" of the code, clean/flat aesthetic. Driven by the **AST**
(not bytecode, not regex).

Decisions locked: nested-block layout · clean/flat look · AST data source ·
render blocks in **HTML/CSS (TS)**, with `hylograph-vis` reserved for the
call-arrow overlay and future canvas/graph views (see §3.1).

---

## 1. Goal

Let a non-technical user read what the program *does* by seeing its structure as
labelled, nested blocks — `if` as a branch, `match` as labelled arms, `let` as
stacked steps, calls and effects as colored chips — instead of reading syntax.
Read-only; it tracks the editor but cannot edit.

## 2. Why the AST (and not bytecode or regex)

A code-shaped view must preserve source structure. Bytecode has already
destroyed it (`if`→`JUMP_IF_FALSE`, conditions/names gone). Regex over source
([verdictStoryModel.ts](../src/editor/verdictStoryModel.ts)) is brittle and
example-tuned. The parsed AST is the only faithful, generic source.

Good news from the AST ([AST.purs:113-167](../.verdict-repo/src/Verdict/Syntax/AST.purs#L113)):
it is small, fully algebraic, and **already carries source positions** via
`EAt SourcePos Expr` (`{line, column}`) — enabling click-a-block-to-highlight-source.

```
Decl { name, params, sig :: Maybe Ty, body :: Expr }
Expr = ELit | EVar | EBin op a b | ECmp op a b | EIf c t e | ELet n v b
     | ECall name args | EBuiltin name args | EList | ERecord fields
     | EField e n | ESwitch e arms | EMatch e arms | EAt pos e
Pattern = PCtor name vars | PWild ;  TypeDecl name params ctors
```

## 3. Architecture

```
source ──vlib.astJS──▶ AST JSON  ── NEW compiler export (§4)
                          │
                          ▼
                 buildBlockTree()  ── src/editor/blocks/fromAst.ts
                          │           (AST JSON → BlockNode tree + call edges)
                     BlockTree
                          │
                          ▼
                 renderBlocks()    ── src/editor/blocks/render.ts
                          │           (BlockNode → nested HTML/CSS, Tailwind)
                          ▼
                 Visual tab panel (this.vizPanel)
                          +
                 (Phase 2) SVG overlay: call-arrows between definition blocks
```

Layers, so the renderer never touches the compiler shape directly:

1. **AST export** (PureScript) — `astJS(src)` → JSON.
2. **Block model** (TS) — AST JSON → `BlockNode` tree (presentation-neutral).
3. **Render** (TS) — `BlockNode` → nested HTML.
4. **Overlay** (Phase 2) — arrows for cross-definition calls.

### 3.1 Rendering engine: HTML/CSS, not SVG — rationale

Nested blocks map 1:1 onto nested flex/grid `<div>`s; the browser performs the
recursive measure-and-place layout for free, and Tailwind (already in the
project) styles it. In SVG — how `hylograph-vis` renders — every block's
`x/y/width/height` must be computed by a hand-written recursive layout pass in
PureScript, and each tweak costs a spago rebuild (Node 24, per the build
toolchain note). For *this* paradigm HTML wins decisively on effort and
iteration speed.

`hylograph-vis` is **not discarded** — it is the right tool for the one thing
HTML can't do natively (curved arrows between blocks) as an absolutely-positioned
SVG overlay in Phase 2, and for an optional canvas/call-graph mode later. The
existing `VerdictStoryModel` narrative path is set aside for this feature.

### 3.2 Library choice: hand-roll Phase 1, add a lib only for arrows/graph

For the nested blocks themselves, **add no library — hand-roll the HTML/CSS.**
The hard part of blocks (recursive measure-and-place) is done for free by the
browser's flex layout, so the "engine" is a ~200-line recursive
`BlockNode → <div>` function. A library adds more integration friction than it
removes, and full control of the clean/flat aesthetic + source-line mapping is
easy in plain TS. A hidden constraint reinforces this: the editor is **Web
Components + vanilla TS, not React**, so React-bound diagram libs (React Flow,
Reaflow) would drag a framework in for one tab.

**Blockly** — the obvious nested-block candidate — is deliberately rejected: it
is an *editing* framework (define a block type per `Expr`, wire a
toolbox/workspace, translate the AST into its block model), renders its own SVG
with a fixed visual language that fights a custom theme, and is heavy
(hundreds of KB). Only revisit it if users should one day *edit* logic as blocks.

A library does earn its place later, where real graph layout is involved:

| Need (phase) | Pick | Why |
| --- | --- | --- |
| Arrows over the HTML blocks (P2) | [perfect-arrows](https://github.com/steveruizok/perfect-arrows) (geometry only; you draw the SVG), or hylograph-vis | Tiny, framework-free; keep HTML blocks, overlay paths |
| Hierarchical / orthogonal edge routing (P2/3) | [elkjs](https://github.com/kieler/elkjs) | Layout-only, vanilla; handles nested/compound nodes |
| Full call-graph mode (P3) | [Cytoscape.js](https://js.cytoscape.org/) | Vanilla, batteries-included rendering + layouts |

hylograph-vis remains viable for P2/P3 (in-repo, already ours), but for a generic
graph it means reimplementing layout that elk/Cytoscape provide for free.

## 4. Compiler work: `astJS` export

Add to the JS-export layer alongside `compileJS`/`diagnosticsJS`/`signaturesJS`
([Compiler.purs:123-238](../.verdict-repo/src/Verdict/Compiler.purs#L123)):

```purescript
astJS :: String -> { ok :: Boolean, ast :: Json, error :: String }
astJS src = case parseVerdict src of
  Left err -> { ok: false, ast: jsonNull, error: err }
  Right parsed -> { ok: true, ast: encodeModule parsed.mod, error: "" }
```

Write `EncodeJson`-style helpers for `Module / Decl / TypeDecl / Expr / Pattern /
Ty / Lit / BinOp / CmpOp`. These are mechanical tagged-object encoders, mirroring
the manual instances already in
[FinVM/Types.purs:113-150](../.verdict-repo/src/Verdict/FinVM/Types.purs#L113).
Convention: `{ "tag": "EIf", "cond": …, "then": …, "else": … }`, literals as
`{ "tag": "LInt", "value": "42" }`, and **preserve `EAt` spans** as a `pos`
field rather than stripping them (`{ "tag": "EAt", "pos": {line,column}, "expr": … }`,
or attach `pos` onto the wrapped node). Then rebuild `verdict.mjs` (Node 24 + spago)
and load it the same way the editor already does.

Effort: ~100–140 lines of PureScript + a rebuild. No changes to parser/typecheck.

Optional enrichment (Phase 2+): also surface inferred types per definition by
reusing what `signaturesJS` already computes, so block headers can show
`name : Type`.

## 5. Block model (`fromAst.ts`)

```ts
// src/editor/blocks/types.ts
export type BlockKind =
  | 'def' | 'let' | 'if' | 'match' | 'switch' | 'call' | 'builtin'
  | 'bin' | 'cmp' | 'record' | 'list' | 'field' | 'lit' | 'var';

export interface BlockNode {
  kind: BlockKind;
  label: string;                 // human header, e.g. "IF", "let trend", "BUY"
  cap?: Capability;              // for builtin: 'db'|'http'|'cache'|… → color/icon
  pos?: { line: number; column: number };  // from EAt, for source linking
  slots: { name?: string; children: BlockNode[] }[]; // labelled child lanes
  ref?: string;                  // for 'call': the called definition name
}

export interface BlockTree {
  defs: { name: string; params: string[]; sig?: string; body: BlockNode }[];
  callEdges: { from: string; to: string }[];   // for the Phase-2 overlay
  entrypoint: string;
}
```

AST → block mapping (the core of `fromAst.ts`):

| AST node | Block | Layout |
| --- | --- | --- |
| `Decl` | `def` | header (name · params · `sig` pill) over body block |
| `ELet n v b` (chained) | `let` stack | vertical rows `let n = ⟨v⟩`, final `⟨b⟩` below |
| `EIf c t e` | `if` | "IF" + condition lane; "THEN" / "ELSE" branch lanes (color bar) |
| `EMatch e arms` | `match` | "MATCH ⟨e⟩" + one labelled lane per `pattern → ⟨expr⟩` |
| `ESwitch e arms` | `switch` | like match; `Nothing` arm labelled "default" |
| `ECall name args` | `call` | pill `name(⟨args⟩)`; emits a `callEdge`, sets `ref` |
| `EBuiltin bid args` | `builtin` | pill colored by namespace (db/http/…) + icon |
| `EBin/ECmp` | `bin`/`cmp` | inline `⟨a⟩ op ⟨b⟩` |
| `ERecord fields` | `record` | small field table (name = ⟨value⟩ rows) |
| `EList xs` | `list` | horizontal/wrapping chip row |
| `EField e n` | `field` | `⟨e⟩.n` chip |
| `ELit`/`EVar` | `lit`/`var` | leaf chip |
| `EAt pos e` | (transparent) | unwrap, attach `pos` to child |

Capabilities surface **inline and in context** as colored `builtin` chips
(green db, blue http, purple notify, …) — no separate effect panel needed — plus
an optional per-`def` badge summarizing which it touches.

## 6. Render (`render.ts`)

Pure function `BlockNode → HTMLElement`, recursive, Tailwind classes, reusing the
existing palette (input=cyan, http/external=blue, db/storage=green, notify=purple
— as in [VerdictVis.purs:91-150](../vis/hylograph-vis/src/VerdictVis.purs#L91)).
Each block: rounded card, optional left color bar for branch lanes, header label,
nested children in flex column/row. `data-src-line` from `pos` enables Phase-2
click-to-highlight in Monaco. Definition blocks stack vertically, entrypoint
first (topological by `callEdges`); multi-column/masonry is a later polish.

## 7. UI wiring (carried over, unchanged in shape)

In [src/VerdictEditor.ts](../src/VerdictEditor.ts):

1. Widen the tab union `'editor'|'db'|'debug'` → add `'visual'`
   ([:338](../src/VerdictEditor.ts#L338), `mkMainTabBtn` id [:426](../src/VerdictEditor.ts#L426)).
2. `mainTabBar.appendChild(mkMainTabBtn('visual', 'Visual'))` after DB
   ([:435](../src/VerdictEditor.ts#L435)).
3. Add `private vizPanel` built like `dbPanel`
   ([:445-476](../src/VerdictEditor.ts#L445)); inner scroll container holds the
   rendered blocks.
4. `setActiveMainTab` ([:1107](../src/VerdictEditor.ts#L1107)) toggles
   `vizPanel.hidden` and flushes a pending render on activation.
5. Refresh hook: after a successful compile, also call `vlib.astJS(code)` and
   rebuild blocks. Natural spot is beside the existing compile at
   [:1281-1296](../src/VerdictEditor.ts#L1281) (reuse `this.materializeInputs`
   so inputs are substituted consistently). Note `astJS` only needs a successful
   **parse**, so it can render even when later compile stages error — a nice
   property for a live structural view.

New modules: `src/editor/blocks/{types.ts, fromAst.ts, render.ts}`.

## 8. Lifecycle & performance

- Render only when the Visual tab is visible; mark dirty on edit, flush on
  activation (avoids redrawing on every keystroke/live-tick on other tabs).
- Debounce off the existing diagnostics/parse cadence rather than per-keystroke.
- Empty/error states: parse failed → muted "Can't parse yet" placeholder
  (keep the last good render if you prefer continuity); empty module → hint.
- Pure DOM rebuild is cheap; if it ever isn't, diff at the `def` level (re-render
  only changed definitions, keyed by name + source hash).

## 9. Verification

- Unit: `fromAst` over fixtures — the demo strategy,
  [.verdict-repo/example.verdict](../.verdict-repo/example.verdict), and an actor
  example — assert block kinds, nesting, call edges, preserved `pos`.
- Snapshot: `render` HTML for those fixtures.
- Manual: build bundles (Node 24 + spago), open editor → Visual, edit source,
  confirm blocks track edits; confirm a non-strategy program renders structurally
  (no strategy-specific assumptions).

## 10. Risks & open questions

- **Renderer-engine decision** (§3.1–3.2): hand-rolled HTML/CSS over hylograph-SVG
  and over block libs (Blockly rejected) for nested blocks. If staying inside
  hylograph is a hard requirement, the cost is a hand-written recursive SVG layout
  pass in PureScript + per-tweak rebuilds — flag now, before building. Lib choices
  for the Phase-2 arrows / Phase-3 graph are settled in §3.2 (perfect-arrows /
  elkjs / Cytoscape).
- **Deeply nested / wide bodies** (long `let` chains, big records) need
  collapse/expand and horizontal scroll to stay legible — Phase 2.
- **`astJS` is a prerequisite** — nothing renders until the compiler export +
  rebuild land. It is the critical-path item.
- **Operator precedence / desugaring**: blocks reflect the parsed tree; confirm
  it reads naturally for users (e.g. nested `EBin`), or add light flattening.

## 11. Phasing

- **Phase 0 — `astJS` export + rebuild. ✅ DONE.** Added
  [`Verdict.Syntax.AstJson`](../.verdict-repo/src/Verdict/Syntax/AstJson.purs)
  (tagged-object encoders, `EAt` spans preserved) and `astJS` to
  [Compiler.purs](../.verdict-repo/src/Verdict/Compiler.purs); rebuilt and copied
  to [public/lib/verdict.mjs](../public/lib/verdict.mjs) (verified exported +
  returning correct JSON). Shape: `{ ok, ast: string (JSON), error }` where the
  AST is `{ name, types[], decls[] }`, each decl `{ name, params[], sig, sigText,
  body }`, each Expr a `{ tag, … }` node. **Caveat:** `sigText` uses the existing
  `Show Ty` instance which renders records awkwardly (`{[(Tuple "x" Int)]}`) — TS
  should render from the structured `sig` field, not `sigText`.
- **Phase 1 — block model + HTML render + Visual tab. ✅ DONE.** Implemented in
  **PureScript** (per project convention), emitting HTML/CSS via a thin DOM FFI:
  [`vis/hylograph-vis/src/BlockDom.purs`](../vis/hylograph-vis/src/BlockDom.purs)
  (+`.js`) and [`CodeBlocks.purs`](../vis/hylograph-vis/src/CodeBlocks.purs)
  (recursive AST→nested-div renderer, all Expr/Decl/Ty/Pattern cases, capability
  colour chips, `data-src-line` attrs). Exposed as `renderCode(selector, ast)`
  (an `EffectFn2`, so the JS host can call it directly) from
  [`Main.purs`](../vis/hylograph-vis/src/Main.purs); bundled to
  [public/lib/hylograph-vis.mjs](../public/lib/hylograph-vis.mjs) via esbuild
  `--format=esm` (NOT `spago bundle`, whose default app-mode drops ESM exports).
  TS shell wiring in [VerdictEditor.ts](../src/VerdictEditor.ts): `'visual'` tab +
  button, `vizPanel`/`#verdict-viz-root`, lazy `loadHyloLib`, `markVizDirty`
  (hooked into the debounced edit pass) + `refreshVisualization` (calls
  `vlib.astJS` → `renderCode`). Verified in a real browser (preview build): 44
  cards, 646 source-mapped nodes, no page errors.
  **Build note:** the vis project uses the NEW spago (`spago.yaml`); build with
  `editor/node_modules/.bin/spago` (the global `~/.npm-global` spago is legacy and
  only understands `.verdict-repo`'s `spago.dhall`). esbuild must be on PATH
  (`editor/node_modules/.bin`).
- **Phase 2 — interactions & arrows. ✅ DONE.** (browser-verified: 44 cards, 150
  calls, hover-arrows + outline, click-to-source line 12, collapse toggles, no
  errors.)
  - Renderer ([CodeBlocks.purs](../vis/hylograph-vis/src/CodeBlocks.purs)): def
    cards are now `<details>`/`<summary>` (free collapse) tagged `data-def`;
    `ECall` chips tagged `data-call` (builtins are not).
  - Host overlay [src/editor/vizArrows.ts](../src/editor/vizArrows.ts):
    hand-rolled SVG cubic-bezier arrows drawn **on hover** of a card (not all at
    once — 44 defs would be a hairball) from its `data-call` chips to the matching
    `data-def` card; inline-style outline highlight (NOT Tailwind classes —
    dynamically-added classes get purged). Chose hand-rolled over perfect-arrows
    to avoid a dependency, per the Phase-1 "no lib" stance.
  - [VerdictEditor.ts](../src/VerdictEditor.ts): `attachVizListeners` (delegated,
    once) — click any `[data-src-line]` → `jumpToSourceLine` (switches to Editor
    tab, `revealLineInCenter` + select); `toggle` captured (it doesn't bubble) to
    persist collapsed-card names in `collapsedDefs`, re-applied after each
    re-render. Overlay re-installed per render via `vizArrowCleanup`.
  - **Tailwind gotcha fixed:** the content globs in `tailwind.config.js` did NOT
    cover `vis/hylograph-vis/src/**/*.purs`, so renderer-only classes (call chips,
    branch lanes, IF/MATCH badges) were silently purged → unstyled blocks. Added
    the glob; classes now ship. Native `<details>` marker hidden via a rule in
    `src/styles/main.css`.
- **Phase 3 — "Map" mode (call graph). ✅ DONE.** A view switcher (Blocks | Map)
  in the Visual-tab header. The Map is host-rendered (HTML nodes + SVG edges) in
  [src/editor/vizGraph.ts](../src/editor/vizGraph.ts) — it needs measured layout
  and host-side bytecode data, so it stays TS (the detailed Blocks view stays
  PureScript). Nodes = user functions (AST decls), edges = `ECall` (AST), laid
  out in layers by shortest call-depth from the entry; hover spotlights incident
  edges + neighbours, click jumps to source. Verified: 44 nodes, 48 edges, no
  errors.
- **Phase 4 — gas + capabilities on the Map. ✅ DONE.** FinVM bills a uniform
  1 step/instruction (no per-opcode weights), so per-function **gas = static
  bytecode instruction count** from `vlib.compileJS` (a straight-line estimate;
  loops/recursion NOT multiplied out — labelled as such in the caption). Node
  tint ∝ gas, with a `≈ N gas` badge. Capability dots (db/http/cache/…) are
  computed **transitively** over the bytecode call graph (`gasFromBytecode`) —
  effects live in prelude wrappers user functions call, so a direct-only scan
  flags nothing. Verified: all 44 nodes gassed, 31 capability dots.
- **Docs on hover. ✅ DONE.** Verdict discards comments at lex time, so doc text
  never reaches the AST; `extractDocs` recovers the `--` comment block directly
  above each definition/signature from source. Shown as a native `title` tooltip
  on Blocks cards and Map nodes (Map nodes also get an ⓘ cue). Verified: 17
  documented functions surfaced in both views.

## 12. Out of scope

Editing/round-tripping blocks back to source; the narrative `VerdictStoryModel`
view; bytecode/VM-state visualization (that's the Debug tab).
