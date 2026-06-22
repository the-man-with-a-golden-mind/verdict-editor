# Codebase cleanup plan (post-release, new branch)

## Context
After the embeddable-editor release the tree *feels* messy — mixed `.js`/`.ts`/`.purs`,
empty folders, hacks. This plan separates perception from reality and sequences the
real fixes. Do it on a branch off `master` **after** the release is pushed/deployed, in
small reviewable PRs, each gated by `build:all` + `test:notebook` (84) staying green.

## Reality check (measured, not guessed)
Most of the "mess" is **gitignored local clutter, not tracked** — each has 0 files in git:
`.spago/`, `output/`, `src/Notebook/output/`, `.upstream/`, `.verdict-repo/`,
`.ps-spa-repo/`, `.tmp-minard/`, `.home/`, `.local/`, `.cache/`, `.wrangler/`, `grenimpl/`,
and the empty dirs (`src/lib`, `src/Notebook/Notebook`). The repo is cleaner than the
working tree looks; a `git clean` would erase the visual noise.

The **actually tracked** state:
- 39 first-party `.purs` (notebook UI), 27 `src` `.js` (15 are PS-FFI with a sibling `.purs`
  — must stay `.js`; 12 standalone), 22 `.ts`, 5 `.mjs`.
- Stray tracked files: `nb2.mjs` (scratch puppeteer script), maybe `Jupiter.md`.
- Committed build artifacts: `public/app.js`, `public/lib/*.mjs` (8).
- **No `tsconfig.json`** → the 22 `.ts` files are never type-checked (esbuild strips types).
- Two **identical** copies of `verdictCm/` (`src/editor` + `src/Notebook`), kept in sync by hand.
- No eslint/prettier/CI.

So the language mix is mostly principled (`.purs` UI + `.js` FFI + `.ts` shell); the genuine
problems are: no typecheck, hand-synced duplication, a few hacks, committed artifacts, and
local clutter that keeps regenerating.

## Phases (ordered by value ÷ risk)

### A. Local hygiene + stop the bleed (no code change)
- `git clean -ndx` to preview, then remove the regen-able clutter. Confirm `.gitignore`
  already covers it (it does).
- **Root cause of `.home/.local/.cache`:** a spago/build step runs with `HOME` redirected
  into the repo, dumping caches here. Fix the script(s) so caches use the real `HOME` (or a
  single ignored dir) — otherwise they reappear after every build.
- **Vendored repos** (`.upstream/finvm`, `.upstream/verdict`, `.verdict-repo`,
  `.ps-spa-repo`): these are ad-hoc local clones the patch/link scripts read. Document them
  in a `scripts/setup.sh` (or convert to git submodules / npm deps) so they're reproducible,
  not mystery directories.

### B. Remove tracked cruft
- Delete `nb2.mjs`; sweep for other root scratch scripts. Decide `Jupiter.md`'s fate
  (move to `docs/` or delete).
- Remove the empty first-party dirs (`grenimpl`, `src/lib`, `src/Notebook/Notebook`).

### C. TypeScript type-checking (highest quality win)
- Add a `tsconfig.json` (strict where feasible) covering `src/**/*.ts`, plus a
  `typecheck` script (`tsc --noEmit`). Today nothing checks types — that's how the
  `loadDocument` shape mismatch slipped through as a cast. Wire it into CI/pre-commit.

### D. De-duplicate / kill the sync hacks
- The two identical `verdictCm/` copies → one source of truth: make `src/Notebook/verdictCm`
  re-export from `src/editor/verdictCm` (or a shared `src/shared/`), or a build step copies
  it. Remove the "edit both, keep in sync" footgun.
- The two `importPublicModule` copies (`VerdictEditor.ts` + `notebookBridge.ts`) → one shared
  util (co-locate with `libBase.ts`).

### E. Codify the language boundary
Write it down and enforce it: **`.purs` = notebook UI components**, **`.js` = PS FFI only**
(the 15 with sibling `.purs`), **`.ts` = editor shell/runtime**. Then:
- Convert the 12 standalone `src` `.js` + the data-only `.mjs` (`defaultNotebook*Cell.mjs`,
  `notebookProject.mjs`, `notebookBindingsCore.mjs`) to `.ts` where they aren't part of the
  esbuild notebook bundle. Leave `bundle-entry.mjs` + true FFI as-is.
- The esbuild notebook build already accepts `.ts`, so `Display.js`/`PlotlyFFI.js`/
  `Spreadsheet.js` can become typed `.ts` if desired (lower priority).

### F. Committed-artifact policy
`public/app.js` + `public/lib/*.mjs` are committed so the app runs without a PS build (which
needs Node 24). Keep that pragmatism, but add a `verify:bundles` check (rebuild → assert no
git diff) to catch staleness — exactly the kind of drift that caused a flaky test during the
release. Document *why* they're committed.

### G. Lint / format / CI
- Add eslint + prettier configs and a `.github/workflows` running `build:all` +
  `test:notebook` + `typecheck` on PRs. This is what prevents the mess from creeping back.

### I. Output-rendering redesign (the right fix for a whole bug class) — HIGH PRIORITY
The cell-output renderer (`src/Notebook/Display.js` + the emit path in
`NotebookMount.js`) is hand-rolled imperative DOM: `innerHTML` wipes, a bolted-on
`reconcileDisplayInto`, manual scroll/height preservation, and Plotly sized
imperatively. A run of bugs — view jumping to the top on live updates, chart
zoom/pan reset every tick, charts rendering at Plotly's 700px default and
overlapping their neighbour / covering text — are **all symptoms of having no real
rendering model**. Each was patched individually; that doesn't converge.

Redesign so update correctness is *structural*, not re-derived per bug:
- Render the Display tree (text/layout/table) through **ps-spa's virtual DOM**
  (already in the stack, Elm-style). Diffing preserves DOM identity → scroll,
  focus, and selection survive updates for free; no `innerHTML` wipes.
- Treat **charts as managed leaf components** with an explicit lifecycle: mount
  (`Plotly.newPlot`), update (`Plotly.react` + `uirevision`), and **resize via a
  `ResizeObserver`** on the container. That kills both the detached-default-size
  overlap and the "never re-fits after reflow" classes of bug at the source.
- **One render path** for initial render and live emits — delete the separate
  `reconcileDisplayInto`, the height-freeze, and the scroll-restore patches; they
  become unnecessary.
- The spreadsheet (already ps-spa) joins the same model, so its interactive state
  (scroll/selection/edit) is preserved too — closing the gap noted earlier.

This single redesign subsumes the scroll-jump, chart-zoom, chart-overlap, and
spreadsheet-state fixes. The interim patches shipped for the release should be
removed as part of it. **Detailed design: `docs/output-renderer-design.md`.**

### H. The big strangler (separate, ongoing)
Continue `NotebookMount.js` (~1600-line blob) → PureScript per the existing
`docs/notebook-purescript-refactor-plan.md`. This is the largest "hack" but it's already a
tracked, incremental effort — keep it as its own stream, not part of the housekeeping above.

## Sequencing & safety
A → B → C are quick wins with near-zero risk (do first). D → E are mechanical but touch many
imports — one PR each, typecheck + tests green. F → G are additive. H is long-haul.
Every PR: `build:all` + `npm run test:notebook` (84) green, and a puppeteer smoke on the
standalone app + the embed (`dist/embed`) before merge.
