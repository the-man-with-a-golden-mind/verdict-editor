# IDE + VerdictActor — cell telemetry & cross-cell UI

Status: proposed · Scope: notebook-wide **live feedback** from running cells
(progress lines, activity, structured logs) routed through **VerdictIDE +
VerdictActor**, rendered at the **bottom of each cell**, with a future
**searchable log stream** on the Debug tab.

Decisions locked so far:

- **Shared FinVM** across cells (DB, cache, actor snapshot) — unchanged.
- **Per-cell run** evaluates only that cell’s bindings — unchanged.
- **Inputs + DB** are notebook-wide; **Visual** stays per cell.
- **Host boundary = effects.** Actor mailboxes stay inside the VM; anything the
  editor must show live crosses the VM via a new `ide.*` effect family handled in
  `effectDriver.ts`.
- **VerdictIDE bootstraps VerdictActor** once per notebook session; user cells
  never need to call `bootGlobal` manually in the default path.

---

## 1. Goal

While a cell runs (or after, for durable logs), the user sees **what that cell is
doing** without waiting for the final binding `Display` result:

| Example in Verdict | User sees |
| --- | --- |
| `cellLogProgress("Fetching Binance klines…", 5000)` | Progress line under the cell for ~5s |
| `cellLogActivity("Scoring 3 assets")` | Single activity line (replaced on next activity) |
| `cellLog("saved signals#42")` | Durable line + entry in Debug log |
| Worker actor → IDE → `uiHost` | Cross-cell notification (“Cell 2 finished backtest”) |

Future: Debug tab becomes a **filterable, searchable** log of all `cellLog` /
`ide.emit` events across the session.

---

## 2. Why two layers (IDE actor + effects)

```
┌─ Cell A (FinVM process) ─────────────────────────────────────┐
│  cellLogProgress("…", 5000)                                   │
│       │ builtin / effect                                      │
│       ▼                                                       │
│  ide.progress@1  ────────────────────────────────┐           │
└──────────────────────────────────────────────────│───────────┘
                                                   │
┌─ Cell B (FinVM process) ─────────────────────────│───────────┐
│  ask(global, "uiHost", { kind = "route", … })  │           │
│       │ actor send                                │           │
│       ▼                                           │           │
│  uiHostLoop (VerdictActor) ──ide.emit@1──────────┤           │
└──────────────────────────────────────────────────│───────────┘
                                                   ▼
                              ┌─ Host (TS) effectDriver ─────────┐
                              │  CellTelemetryBus.append(entry)  │
                              │  NotebookMount.refreshCellUi()   │
                              │  DebugLogStore (ring buffer)     │
                              └──────────────────────────────────┘
```

**Actors** (`VerdictActor`, `IDE.ideGlobalLoop`) coordinate **between cells**
inside the VM: registry, routing, aggregation, rate limiting.

**Effects** (`ide.progress`, `ide.activity`, `ide.log`, `ide.emit`) cross to the
host **during** `runProgramWithEffects` so progress can update while HTTP/DB
effects are in flight.

`sysLog` today only hits `console.log` — it does not know `cellId` and does not
touch the notebook UI. New `ide.*` effects are cell-aware and structured.

---

## 3. Session bootstrap — IDE injects VerdictActor

Today users must call `bootGlobal` in a cell; `ensureGlobal` cross-cell is
fragile (ProcessRef JSON round-trip). **Notebook session init** fixes this in
the host, not in user source.

### 3.1 Implicit init (recommended)

On first notebook eval (or on mount after libs load), the host runs a **hidden
init program** once per session:

```verdict
-- lib/verdict/SessionInit.verdict (linked automatically in notebook mode)
module SessionInit exposing ()

sessionBoot : Unit
sessionBoot =
  let g = bootGlobal(unit) in
  let ui = spawnUiHost(unit) in
  let _ = registerWorker(g, "uiHost", "session", ui) in
  unit
```

- Compiled/evaluated via the same FinVM path as normal cells.
- `spawnUiHost` lives in new **`VerdictActor.verdict`** (UI-facing actor loop).
- PID persisted through existing `syncIdeGlobalProcCache` + snapshot merge.
- Subsequent cells use `ensureGlobal` / `globalRef` backed by cache populated by
  init (plus a host-side `ide.globalRef` effect fallback if cache miss — see §8).

User cells **do not** need `bootGlobal` unless they opt out of notebook mode.

### 3.2 Library linking

Extend `scripts/patch-verdict-bindings.mjs`:

| Library | When linked |
| --- | --- |
| `IDE.verdict` | `usesIdeLibrary` (existing) |
| `VerdictActor.verdict` | `usesVerdictActorLibrary` — `cellLog*`, `spawnUiHost`, `uiHost*` |
| `SessionInit.verdict` | always in notebook mode (prelude side-link) |

---

## 4. Verdict surface API

### 4.1 Cell-scoped helpers (auto `cellId`)

Host substitutes `__IDE_CELL_ID__` / `__IDE_CELL_INDEX__` (already in
`ideSession.ts`) before compile. APIs take explicit strings where needed but
default to placeholders in the library:

```verdict
module VerdictActor exposing (
  cellLogProgress, cellLogActivity, cellLog,
  spawnUiHost, uiHostLoop,
  ideEmit, ideRouteUi
)

-- Ephemeral: host hides after ttlMs (default 3000)
cellLogProgress : String -> Int -> Unit
cellLogProgress text ttlMs =
  builtin("ide.progress@1", { cellId = __IDE_CELL_ID__, text = text, ttlMs = ttlMs })

-- Replaced on next activity in same cell
cellLogActivity : String -> Unit
cellLogActivity text =
  builtin("ide.activity@1", { cellId = __IDE_CELL_ID__, text = text })

-- Durable: stays in cell footer until next run + appended to Debug log
cellLog : String -> Unit
cellLog text =
  builtin("ide.log@1", { cellId = __IDE_CELL_ID__, level = "info", text = text })

cellLogWarn : String -> Unit
cellLogError : String -> Unit
-- same, level = warn | error
```

Optional structured payload:

```verdict
cellLogJson : String -> Json -> Unit
-- ide.log@1 with meta json (chart sparkline, counts, etc.)
```

### 4.2 Cross-cell via IDE actor

```verdict
type UiHostMsg =
  MkUiEmit({ cellId : String, kind : String, text : String, ttlMs : Int, meta : Json })
  | MkUiBroadcast({ kind : String, text : String, meta : Json })

uiHostLoop : Unit -> Unit
uiHostLoop _ = actorLoop(uiHostHandle, unit)

-- Called from any cell/worker: route through global IDE to uiHost role
ideRouteUi : ActorRef IdeMsg -> String -> Json -> Unit
ideRouteUi global kind meta =
  let _ = ask(global, "uiHost", { kind = kind, meta = meta }) in
  unit
```

Use cases:

- Background worker in cell 1 reports progress; `uiHost` rewrites `cellId` from
  registration metadata (`registerWorker` already stores `sourceCell`).
- One cell broadcasts “pipeline step 2/5” to all cells’ activity strips (optional
  `targetCellId` in meta).

### 4.3 Relation to existing IDE/CellBus

| Mechanism | Purpose |
| --- | --- |
| `idePut` / `ideGet` | Shared JSON cache (config, handoff blobs) |
| `CellBus` (`busPost`, `busTakeFirst`) | Durable queue via DB |
| **VerdictActor + `ide.*` effects** | **Live UI + debug log stream** |
| `ask` / `registerWorker` | Route to per-role workers including `uiHost` |

Keep queues in DB; keep **ephemeral UI** in effects + in-memory host bus.

---

## 5. Host protocol (`ide.*` effects)

All payloads are JSON-friendly records. Common fields:

```typescript
type IdeTelemetryEntry = {
  ts: number;              // Date.now() at host receipt
  cellId: string;
  cellIndex?: number;
  binding?: string;        // entry function name when known
  kind: 'progress' | 'activity' | 'log' | 'metric' | 'status';
  level?: 'debug' | 'info' | 'warn' | 'error';
  text: string;
  ttlMs?: number;          // progress / transient status
  meta?: Record<string, unknown>;
};
```

| Effect | Handler behaviour |
| --- | --- |
| `ide.progress@1` | Push to cell ephemeral strip; schedule clear at `ts + ttlMs` |
| `ide.activity@1` | Replace cell activity line (one line per cell) |
| `ide.log@1` | Append to cell log stack + **DebugLogStore** |
| `ide.emit@1` | Generic superset (UiHost uses this internally) |
| `ide.metric@1` | Optional numeric sample (future sparkline / Debug charts) |
| `ide.status@1` | `{ phase: "running" \| "idle" \| "error", detail?: string }` |

Implementation sketch in `effectDriver.ts`:

```typescript
'ide.progress': async (p) => {
  cellTelemetryBus.push(normalizeEntry(p));
  return true;
},
```

`runProgramWithEffects` already interleaves effect handlers — progress updates
arrive while `httpGet` is outstanding.

---

## 6. Cell UI — three bands at the bottom

Current cell footer: **binding `Display` output** + **error string**. Add a
**telemetry band** above output (does not replace Display):

```
┌─ Code editor ─────────────────────────────┐
│ … Verdict source …                        │
├─ Telemetry (new) ─────────────────────────┤  ← progress / activity / log lines
│ ◔ Fetching Binance klines…                │     (ephemeral + durable cellLog)
├─ Output (existing) ───────────────────────┤  ← Display JSON after run completes
│ table / chart / text                      │
├─ Error (existing) ────────────────────────┤
└───────────────────────────────────────────┘
```

DOM: `[data-cell-telemetry="${cellId}"]` sibling to `[data-cell-output]`.

Rendering rules:

| kind | Behaviour |
| --- | --- |
| `progress` | Muted italic line + optional spinner; auto-remove after TTL; stack max 2 |
| `activity` | One line, bold prefix “▸ ”; replaced on next activity |
| `log` | Smaller monospace rows, cap 5 visible; full history in Debug |
| `error` level | Rose text, same band |

On **Run** start: clear ephemeral progress/activity for that cell; keep prior
`cellLog` lines until user toggles “clear logs” (or next run clears — pick one in
P0: clear ephemeral only).

While **running**: host sets `ide.status` → gutter/spinner already exists;
activity line can mirror `binding` name (“Running `main`…”).

---

## 7. Debug tab — searchable logs (future-facing)

Design the event shape now so Debug UI is a thin viewer.

### 7.1 `DebugLogStore` (host)

```typescript
type DebugLogStore = {
  entries: IdeTelemetryEntry[];   // ring buffer, e.g. 10_000
  append(e: IdeTelemetryEntry): void;
  query(q: {
    text?: string;
    cellId?: string;
    kind?: string;
    level?: string;
    since?: number;
  }): IdeTelemetryEntry[];
};
```

Persist optionally to `sessionStorage` key `verdict-debug-log` (not `.vnb`).

### 7.2 Debug tab UI (phase 2)

Replace static hint with:

- Search input (substring + regex toggle)
- Filters: cell, level, kind, time range
- Virtualized list (monospace, ts + cell badge + message)
- Click row → `focusCellById` + optional source line from `meta.line`

Same store feeds telemetry band (per-cell filter: `entries where cellId = X`).

---

## 8. Open issue: `ensureGlobal` / ProcessRef

`IDE.globalRef` reads `{ proc: pid }` from cache; Json snapshot may not restore
pids across cells reliably.

**P0 host workaround** (parallel to actor init):

- Effect `ide.globalRef@1` → host returns current global pid from live snapshot.
- Verdict wrapper `ensureGlobal` tries cache, falls back to effect.

**P1**: FinVM snapshot stores actor graph in restorable form (already partially
done via `syncIdeGlobalProcCache`).

Session init (§3) makes the common path “global already running”.

---

## 9. Extended use cases (same pipeline)

| Use case | Verdict | kind |
| --- | --- | --- |
| HTTP download progress | `cellLogProgress("GET " ++ url, 0)` + update in loop | `progress` |
| Multi-step pipeline | `cellLogActivity("Step " ++ fromInt i ++ "/" ++ fromInt n)` | `activity` |
| Worker completion | worker → `ask(global, "uiHost", …)` | `log` |
| Cross-cell handoff | `idePut` + `cellLog("queued for cell 2")` | `log` + DB |
| Rate-limited spam | `uiHost` dedupe by `(cellId, text)` within 500ms | host |
| Run cancellation | host emits `{ kind: "status", phase: "idle" }` on abort | `status` |
| Debug trace | `cellLogDebug` → level `debug`, hidden in cell unless “verbose” | `log` |
| Metrics | `cellMetric("equity", finalEq)` | `metric` |

---

## 10. Architecture diagram (end-to-end)

```
NotebookMount.runCell(cell)
    │
    ├─ materializeInputs + materializeIdeCellPlaceholders
    ├─ ensureSessionBoot()  ── once ──► SessionInit.sessionBoot
    │
    └─ evalNotebookCells(names, { cellId, cellIndex })
            │
            └─ runProgramWithEffects
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
    httpGet      ide.progress   actor send
        │           │           │
        └───────────┴───────────┘
                    │
                    ▼
           effectDriver ide.* handlers
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
 CellTelemetryBus         DebugLogStore
        │                       │
        ▼                       ▼
 refreshCellTelemetry()    Debug tab (phase 2)
```

---

## 11. Phased delivery

### P0 — MVP (progress + activity + cell logs)

1. `VerdictActor.verdict` with `cellLogProgress`, `cellLogActivity`, `cellLog`
2. `ide.progress`, `ide.activity`, `ide.log` in `effectDriver.ts`
3. `CellTelemetryBus` + telemetry DOM band in `NotebookMount.js`
4. Session init links IDE + uiHost on first eval
5. Tests: effect handler unit test + notebook integration (mock slow HTTP, assert
   telemetry text appears)

### P1 — Cross-cell + IDE routing

1. `uiHostLoop`, `registerWorker(..., "uiHost", …)`
2. `ide.emit` generic handler
3. Activity attribution from `registerWorker` `sourceCell`
4. Fix/globalRef effect fallback

### P2 — Debug searchable logs

1. `DebugLogStore` ring buffer + export
2. Debug tab search UI
3. `cellLogDebug`, level filters, click-to-focus-cell

### P3 — Polish

1. Metric/sparkline strip
2. Broadcast / multi-cell progress aggregation
3. Optional persist log to `.vnb` metadata

---

## 12. Example — default notebook cell

```verdict
fetchPriceCents sym =
  let _ = cellLogProgress(strConcat("Price fetch: ", sym), 4000) in
  let res = httpGet(binancePriceUrl(sym)) in
  let _ = cellLogActivity(strConcat("Got ", sym)) in
  if res.ok then priceCentsFromBody(res.body) else 0
```

User sees “Price fetch: BTCUSD” under the cell while `httpGet` suspends; line
fades after 4s; “Got BTCUSD” remains until the next activity.

---

## 13. Non-goals (this design)

- Replacing `Display` for final results (charts/tables stay as today)
- Streaming partial `Display` updates (telemetry is text/status only in P0)
- WebSocket transport (single-browser FinVM; effects are enough)
- User-authored actor supervision trees (advanced; document patterns only)

---

## 14. Files to touch (implementation checklist)

| Area | Files |
| --- | --- |
| Verdict libs | `lib/verdict/VerdictActor.verdict`, `lib/verdict/SessionInit.verdict` |
| Link patch | `scripts/patch-verdict-bindings.mjs` |
| Effects | `src/editor/effectDriver.ts` |
| Telemetry bus | `src/editor/cellTelemetry.ts` (new) |
| Debug log | `src/editor/debugLogStore.ts` (new) |
| Notebook UI | `src/Notebook/NotebookMount.js`, `src/styles/main.css` |
| Session boot | `src/editor/ideSession.ts`, `src/editor/notebookEval.ts` |
| Tests | `tests-js/notebook-cell-telemetry.test.mjs` |
| IDE placeholders | already `__IDE_CELL_ID__`, `__IDE_CELL_INDEX__` |

---

## 15. Summary

**VerdictIDE** owns the global registry and routes messages between cells.
**VerdictActor** provides the `uiHost` worker and cell-scoped helpers.
**Host `ide.*` effects** are the only path from VM to live UI. Cell footers gain
a telemetry band for ephemeral progress; durable logs feed a future searchable
Debug stream — one protocol, two views (per-cell + global).
