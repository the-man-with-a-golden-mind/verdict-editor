# Feature: per-cell loops + Run/Stop + 3-color status

Repo: /Users/michalmajchrzak/Projects/fin/editor — on branch `notebook-ps-refactor`
(green: `build:notebook` + `build` + `test:notebook` = 74). Node 24 required
(`export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"`). Keep green + commit each
step; browser-verify with puppeteer on http://localhost:4173/editor; don't push/PR.

## Goal
Move the loop cadence from the environment (the global "run every X seconds" toggle) INTO
the cell, give every cell its own Run + Stop, and a 3-color status light — on BOTH the cell
gutter and the right-side Cells navigation panel.

## 1. In-cell loops ("the delay is in the cell, not the environment")
Each cell controls its own cadence. Two acceptable implementations — prefer (A); do (B) only
if (A) is clean:

**(A) Real actor loop via a new `timer.sleep` effect (preferred — matches "actor loops").**
- Add a `timer.sleep` effect handler in `src/editor/effectDriver.ts` `createFinvmHandlers`:
  `'timer.sleep': async (p) => { await new Promise(r => setTimeout(r, Math.max(0, p.ms|0))); return null; }`
  (also wire an AbortSignal so Stop rejects/cancels the pending sleep).
- Add a `sleep`/`loop` helper to a Verdict library (e.g. extend `lib/verdict/IDE.verdict` or a
  new `lib/verdict/Loop.verdict`) that emits that effect, mirroring how `httpGet` emits
  `http.get` in the prelude (read the prelude's effect-emitting form first — find how
  `http.get@1` is produced and copy it for `timer.sleep@1`). Link it via
  `scripts/patch-verdict-bindings.mjs` like Display, then `npm run build:verdict-notebook`.
- A cell then writes a real loop, e.g. `main = loopEvery(2000, step)` where `step` does work
  + `idePut`/`busPost` to shared state and the actor sleeps 2000ms between iterations. The
  notebook keeps the effect-resume loop alive while the actor lives; Stop aborts it.
- Verify the runtime FinVM actually treats `timer.sleep@1` as an effect (EFFECT_AWAIT), not a
  missing builtin. If it does NOT (UnknownBuiltin), fall back to (B) and note it.

**(B) Fallback — per-cell JS-driven loop with a cadence directive.**
- A cell declares its interval with a comment directive, e.g. `-- @loop 2000` (ms) or
  `-- @every 2s`. Parse it in NotebookMount.js (and surface it; nothing hidden).
- Run on a loop cell starts a per-cell `setInterval(() => runCell(cell), ms)` (run once
  immediately, then every ms); Stop clears that cell's interval AND aborts any in-flight run.
- `state.cellLoops = { [cellId]: intervalId }`. Clean teardown on stop / delete / disconnect.

Either way: loops are PER CELL and independent (cell A at 2s, cell B at 5s). The existing
global Run-every-X-sec toggle may stay as a convenience but is no longer the only path.

## 2. Run + Stop buttons — both, per cell, in BOTH places
- Cell GUTTER (`src/Notebook/Gutter.purs` — it already has `isRunning`, `onRun`, `onStop`):
  show a **Run ▶** and a **Stop ■** button (both visible), not a single toggle. Disable/dim
  Stop when the cell is neither running nor looping; disable Run while looping (or let Run
  restart). Keep them as ps-spa buttons with the `Effect Unit` thunks.
- Cells NAV panel (`renderCellsNav` in `src/VerdictEditor.ts`, fed by `CellsNavSection` in
  `src/editor/notebookBridge.ts`, published by `publishPanel` in NotebookMount.js): add a
  **Run** and **Stop** button per cell card (call `notebookApi.runCellById` / `stopCellById`).

## 3. Three-color status dot (green / orange / red), gutter + nav
Per-cell status, shown as a single dot in BOTH the gutter and the nav card:
- **orange** = running or looping (in flight).
- **red** = last run errored / stopped with error.
- **green** = last run ok (has output, no error).
- (idle/never-run = dim gray is fine as a 4th resting state.)
Compute it in one place (e.g. a `cellStatus(cell)` helper in NotebookMount.js returning
"running"|"error"|"ok"|"idle"), thread it to the gutter via a new `status :: String`
GutterProp and to the nav via a `status` field on `CellsNavSection`. Use Tailwind:
green `text-emerald-400`, orange `text-amber-400`, red `text-rose-400`, idle `text-slate-700`.

## Constraints
- Keep everything PureScript-first where it already is (gutter is `Gutter.purs`; status is a
  prop, not ad-hoc DOM). Nothing hardcoded, nothing hidden (the loop cadence is visible in the
  cell source). FFI boundary types stay JS-shaped.
- After each step: `build:notebook && build && test:notebook` green + a puppeteer smoke check
  asserting: per-cell Run starts a loop (status goes orange, execution count advances over
  time), Stop ends it (status returns to green), both buttons present in gutter AND nav,
  3-color dot reflects state, default example still renders ~9 charts, no page errors.
- Commit each step (conventional commits, `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`).

## Report
Which approach (A or B) you used and why, the commits, and a note if the FinVM lacked the
timer effect.
