// src/editor/finvmSnapshot.ts
var FINVM_SNAPSHOT_KEY = "__finvm.snapshot";
var FINVM_DB_KEY = "__finvm.db";
var FINVM_SOURCE_SIG_KEY = "__finvm.sourceSig";
function sourceSignature(source) {
  let h = 5381;
  const s = String(source || "");
  for (let i = 0; i < s.length; i++) h = (h << 5) + h + s.charCodeAt(i) | 0;
  return `${s.length}:${h >>> 0}`;
}
function splitNotebookFinvmState(finvmState) {
  const {
    [FINVM_SNAPSHOT_KEY]: machineSnapshot,
    [FINVM_DB_KEY]: _db,
    [FINVM_SOURCE_SIG_KEY]: sourceSig,
    ...userState
  } = finvmState;
  return {
    userState,
    machineSnapshot: machineSnapshot ?? null,
    sourceSig: typeof sourceSig === "string" ? sourceSig : null
  };
}
function mergeNotebookFinvmState(parts) {
  const out = { ...parts.userState };
  if (parts.dbState) out[FINVM_DB_KEY] = parts.dbState;
  if (parts.machineSnapshot != null) out[FINVM_SNAPSHOT_KEY] = parts.machineSnapshot;
  if (parts.sourceSig) out[FINVM_SOURCE_SIG_KEY] = parts.sourceSig;
  return out;
}
function registerCountForFunction(programJson, fn = "main") {
  try {
    const p = JSON.parse(programJson);
    const rc = p.functions?.[fn]?.registerCount;
    return typeof rc === "number" && rc > 0 ? rc : 16;
  } catch {
    return 16;
  }
}
function rebootMainInSnapshot(snapshot, entryFunction = "main", registerCount = 16) {
  const snap = JSON.parse(JSON.stringify(snapshot));
  const others = (snap.processes ?? []).filter((p) => p.pid !== "main");
  snap.processes = [
    {
      pid: "main",
      status: { s: "ready" },
      function: entryFunction,
      frame: {
        function: entryFunction,
        pc: 0,
        registers: Array.from({ length: registerCount }, () => null),
        returnRegister: null,
        caller: null
      },
      callStack: [],
      mailbox: [],
      links: [],
      remoteLinks: [],
      monitors: [],
      parent: null,
      children: [],
      trapExit: false,
      name: "main",
      result: null,
      error: null,
      createdSequence: 0,
      stepsExecuted: 0
    },
    ...others
  ];
  snap.readyQueue = ["main"];
  snap.current = "main";
  return snap;
}
function countLiveProcesses(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return 0;
  const procs = snapshot.processes ?? [];
  return procs.filter((p) => {
    const status = p.status;
    const tag = status && typeof status === "object" ? status.s : void 0;
    return tag === "ready" || tag === "running" || tag === "waiting";
  }).length;
}
function findProcess(snapshot, pid) {
  if (!snapshot || typeof snapshot !== "object") return null;
  const procs = snapshot.processes ?? [];
  return procs.find((p) => p.pid === pid) ?? null;
}

// src/editor/effectDriver.ts
function createEffectStorage() {
  const tables = /* @__PURE__ */ new Map();
  const cache = /* @__PURE__ */ new Map();
  let seq = 0;
  const tbl = (t) => {
    if (!tables.has(t)) tables.set(t, /* @__PURE__ */ new Map());
    return tables.get(t);
  };
  return {
    dbInsert(table, record) {
      const id = `rec${seq++}`;
      tbl(table).set(id, record);
      return id;
    },
    dbGet(table, id) {
      return tbl(table).get(id) ?? null;
    },
    dbQuery(table, filter) {
      const rows = tbl(table);
      const out = [];
      for (const [, value] of rows) {
        if (recordMatchesFilter(value, filter)) out.push(value);
      }
      return out;
    },
    dbUpdate(table, id, record) {
      if (!tbl(table).has(id)) return false;
      tbl(table).set(id, record);
      return true;
    },
    dbDelete(table, id) {
      return tbl(table).delete(id);
    },
    cacheSet(ns, key, value) {
      cache.set(`${ns}\0${key}`, value);
      return true;
    },
    cacheGet(ns, key) {
      const k = `${ns}\0${key}`;
      return cache.has(k) ? cache.get(k) : null;
    },
    cacheDelete(ns, key) {
      return cache.delete(`${ns}\0${key}`);
    },
    listDbTables() {
      const out = {};
      for (const [table, rows] of tables) {
        out[table] = Array.from(rows.entries()).map(([id, value]) => ({ id, value }));
      }
      return out;
    }
  };
}
function effectDbTablesToFinvmState(tables) {
  const record = {};
  for (const [name, rows] of Object.entries(tables)) {
    const rowsRecord = {};
    for (const row of rows) {
      rowsRecord[row.id] = row.value;
    }
    record[name] = {
      record: {
        nextId: { int: String(rows.length) },
        rows: { record: rowsRecord },
        indexes: { record: {} },
        dirtyHash: { bool: true }
      }
    };
  }
  return { record };
}
function jsToValue(x) {
  if (x === null || x === void 0) return null;
  if (typeof x === "boolean") return { bool: x };
  if (typeof x === "bigint") return { int: x.toString() };
  if (typeof x === "number") return Number.isInteger(x) ? { int: String(x) } : { string: String(x) };
  if (typeof x === "string") return { string: x };
  if (Array.isArray(x)) return { list: x.map((v) => jsToValue(v)) };
  if (typeof x === "object") {
    const obj = x;
    if ("tag" in obj && "payload" in obj) {
      return { variant: { tag: obj.tag, payload: jsToValue(obj.payload) } };
    }
    if (typeof obj.proc === "string") {
      return { proc: { string: obj.proc } };
    }
    if (obj.proc && typeof obj.proc === "object" && "string" in obj.proc) {
      return obj;
    }
    if (typeof obj.process === "string") {
      return { proc: { string: obj.process } };
    }
    const rec = {};
    for (const [k, v] of Object.entries(obj)) rec[k] = jsToValue(v);
    return { record: rec };
  }
  return { string: String(x) };
}
function valueToJs(v) {
  if (v === null || v === void 0) return null;
  if (typeof v !== "object") return v;
  const obj = v;
  if ("bool" in obj) return obj.bool;
  if ("int" in obj) {
    const n = Number(obj.int);
    return Number.isSafeInteger(n) ? n : BigInt(String(obj.int));
  }
  if ("string" in obj) return obj.string;
  if ("symbol" in obj) return obj.symbol;
  if ("proc" in obj && obj.proc && typeof obj.proc === "object" && "string" in obj.proc) {
    return obj;
  }
  if ("process" in obj && typeof obj.process === "string") {
    return { proc: obj.process };
  }
  if ("list" in obj && Array.isArray(obj.list)) return obj.list.map(valueToJs);
  if ("record" in obj && obj.record && typeof obj.record === "object") {
    const out = {};
    for (const [k, val] of Object.entries(obj.record)) {
      out[k] = valueToJs(val);
    }
    return out;
  }
  if ("variant" in obj && obj.variant && typeof obj.variant === "object") {
    const variant = obj.variant;
    return { tag: variant.tag, payload: valueToJs(variant.payload) };
  }
  return v;
}
function recordMatchesFilter(record, filter) {
  if (!filter || Object.keys(filter).length === 0) {
    return record != null && typeof record === "object";
  }
  if (!record || typeof record !== "object") return false;
  const row = record;
  for (const [key, expected] of Object.entries(filter)) {
    if (!shallowEqualJsonField(row[key], expected)) return false;
  }
  return true;
}
function shallowEqualJsonField(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a === "object" && typeof b === "object") {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  return String(a) === String(b);
}
function createFinvmHandlers(storage, fetchImpl = globalThis.fetch.bind(globalThis), signal, onEmit) {
  return {
    // Real `time.sleep@1` effect (EFFECT_AWAIT). A cell's `sleep`/`loopEvery`
    // helper emits this so the loop cadence lives in the cell source. The
    // generic effect payload passes the single arg through as `args`, so the
    // ms count arrives as `p.args` (number) rather than a named field. Stop
    // aborts the run controller, which rejects the pending sleep so the VM run
    // unwinds promptly instead of waiting out the full delay.
    "time.sleep": async (p) => {
      const raw = p.ms ?? p.args ?? 0;
      const ms = Math.max(0, Math.min(6e4, Math.trunc(Number(raw) || 0)));
      if (signal?.aborted) throw new Error("sleep aborted");
      await new Promise((resolve, reject) => {
        const onAbort = () => {
          clearTimeout(timer);
          reject(new Error("sleep aborted"));
        };
        const timer = setTimeout(() => {
          signal?.removeEventListener("abort", onAbort);
          resolve();
        }, ms);
        signal?.addEventListener("abort", onAbort, { once: true });
      });
      return null;
    },
    "http.get": async (p) => {
      const url = String(p.url ?? "");
      const res = await fetchImpl(url, { method: "GET" });
      const body = await res.text();
      return { status: res.status, ok: res.ok, body };
    },
    "http.post": async (p) => {
      const url = String(p.url ?? "");
      const res = await fetchImpl(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: p.body ?? ""
      });
      const body = await res.text();
      return { status: res.status, ok: res.ok, body };
    },
    "sys.log": async (p) => {
      console.log(p.message ?? "");
      return true;
    },
    "db.insert": async (p) => {
      return storage.dbInsert(String(p.table ?? ""), p.record ?? {});
    },
    "db.get": async (p) => {
      return storage.dbGet(String(p.table ?? ""), String(p.id ?? ""));
    },
    "db.query": async (p) => {
      const filter = p.query ?? p.filter ?? {};
      return storage.dbQuery(String(p.table ?? ""), filter);
    },
    "db.update": async (p) => {
      return storage.dbUpdate(String(p.table ?? ""), String(p.id ?? ""), p.record ?? {});
    },
    "db.delete": async (p) => {
      return storage.dbDelete(String(p.table ?? ""), String(p.id ?? ""));
    },
    "cache.set": async (p) => {
      const ns = String(p.ns ?? "");
      if (ns === "__display__") {
        onEmit?.(p.value ?? null);
        return true;
      }
      const key = String(p.cacheKey ?? p.key2 ?? "");
      return storage.cacheSet(ns, key, p.value ?? null);
    },
    "cache.get": async (p) => {
      const key = String(p.cacheKey ?? p.key2 ?? "");
      const v = storage.cacheGet(String(p.ns ?? ""), key);
      if (v && typeof v === "object" && v !== null && "proc" in v && typeof v.proc === "string") {
        return { proc: { string: String(v.proc) } };
      }
      return v;
    },
    "cache.delete": async (p) => {
      const key = String(p.cacheKey ?? p.key2 ?? "");
      return storage.cacheDelete(String(p.ns ?? ""), key);
    }
  };
}
function vmRunFinished(out) {
  return out.status === "completed" || out.status === "deadlock";
}
function parseVmOutput(raw) {
  const out = JSON.parse(raw);
  if (!out || typeof out.status !== "string") {
    throw new Error("invalid VM output shape");
  }
  if (out.status === "error" || out.status === "failed") {
    throw new Error(`VM ${out.status}: ${out.error ?? "unknown"}`);
  }
  return out;
}
var MAX_ITERS = 1e4;
async function runProgramWithEffects(finvm, programJson, opts) {
  try {
    const overrides = JSON.stringify({ input: {}, state: opts.state ?? {} });
    let out;
    if (opts.machineSnapshot != null) {
      const entry = opts.entryFunction ?? "main";
      const regCount = registerCountForFunction(programJson, entry);
      const patched = rebootMainInSnapshot(opts.machineSnapshot, entry, regCount);
      out = parseVmOutput(
        finvm.runEffectResume(programJson)(JSON.stringify(patched))(JSON.stringify([]))
      );
    } else {
      out = parseVmOutput(finvm.runEffectStart(programJson)(overrides));
    }
    for (let iter = 0; iter < MAX_ITERS; iter++) {
      if (vmRunFinished(out)) {
        const state = Object.fromEntries(
          Object.entries(out.state ?? {}).map(([k, v]) => [k, valueToJs(v)])
        );
        return {
          ok: true,
          result: valueToJs(out.result),
          state,
          snapshot: out.snapshot ?? null,
          steps: typeof out.steps === "number" ? out.steps : 0,
          vmStatus: out.status
        };
      }
      if (out.status !== "suspended") {
        return { ok: false, error: `VM ${out.status}: expected suspended/completed/deadlock` };
      }
      const pending = Array.isArray(out.pending) ? out.pending : [];
      if (pending.length === 0) {
        return { ok: false, error: "VM suspended with no pending effects" };
      }
      const results = await Promise.all(
        pending.map(async (entry) => {
          const type_ = String(entry.type_ ?? "");
          const handler = opts.handlers[type_];
          if (!handler) throw new Error(`No handler for effect type: ${type_}`);
          const payloadJs = valueToJs(entry.payload);
          const key = typeof entry.key === "string" ? entry.key : void 0;
          const payload = payloadJs && typeof payloadJs === "object" && !Array.isArray(payloadJs) ? { ...payloadJs, ...key ? { key } : {} } : payloadJs;
          return handler(payload);
        })
      );
      const deliveries = pending.map((entry, idx) => {
        const pid = typeof entry.pid === "string" && entry.pid.length > 0 ? entry.pid : "main";
        const key = typeof entry.key === "string" ? entry.key : "";
        const kind = typeof entry.kind === "string" ? entry.kind : key ? "await_reply" : "transport";
        if (kind === "transport") return null;
        return { pid, key, result: jsToValue(results[idx]) };
      }).filter((d) => d !== null);
      out = parseVmOutput(
        finvm.runEffectResume(programJson)(JSON.stringify(out.snapshot))(JSON.stringify(deliveries))
      );
    }
    return { ok: false, error: "effect driver exceeded MAX_ITERS" };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// src/editor/ideSession.ts
var IDE_GLOBAL_FN = "ideGlobalLoop";
var IDE_GLOBAL_CACHE_KEY = "global";
function findIdeGlobalPid(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return null;
  for (const p of snapshot.processes ?? []) {
    if (p.function === IDE_GLOBAL_FN && typeof p.pid === "string") return p.pid;
  }
  return null;
}
function syncIdeGlobalProcCache(finvmState, storage) {
  const { machineSnapshot } = splitNotebookFinvmState(finvmState);
  const pid = findIdeGlobalPid(machineSnapshot);
  if (!pid) return;
  storage.cacheSet("ide", IDE_GLOBAL_CACHE_KEY, { proc: pid });
}

// src/editor/notebookBindingsCore.mjs
function filterRunnableBindingNames(programJson, names) {
  try {
    const program = JSON.parse(programJson);
    const fns = program?.functions;
    if (!fns || typeof fns !== "object") return names;
    return names.filter((n) => Object.prototype.hasOwnProperty.call(fns, n));
  } catch {
    return names;
  }
}

// src/editor/notebookBindings.ts
function filterCellBindingNamesToRunnable(programJson, names) {
  return filterRunnableBindingNames(programJson, names);
}

// src/editor/notebookEval.ts
function isDisplayJson(json) {
  if (!json || typeof json !== "object") return false;
  const k = json.kind;
  return k === "text" || k === "chart" || k === "table" || k === "stack";
}
function vmScalarToJson(v) {
  if (v === null || v === void 0) return null;
  if (typeof v !== "object") return v;
  const o = v;
  if ("string" in o) return o.string;
  if ("int" in o) return Number(o.int);
  if ("bool" in o) return o.bool;
  if ("fixed" in o && o.fixed && typeof o.fixed === "object") {
    const f = o.fixed;
    return f.value ?? o.fixed;
  }
  return v;
}
function vmRecordToRow(rec) {
  if (!rec || typeof rec !== "object") return {};
  const r = rec;
  if ("record" in r && r.record && typeof r.record === "object") {
    return vmRecordToRow(r.record);
  }
  const inner = "record" in r ? r.record : r;
  const out = {};
  for (const [k, v] of Object.entries(inner)) {
    out[k] = vmScalarToJson(v);
  }
  return out;
}
function numericLineChart(values, name = "series") {
  const y = values.map((v) => Number(vmScalarToJson(v))).filter((n) => Number.isFinite(n));
  return {
    kind: "chart",
    title: "",
    traces: [{ name, kind: "line", x: y.map((_, i) => i), y }],
    xaxis: { title: "" },
    yaxis: { title: "" }
  };
}
function vmValueToDisplay(value, typeSig) {
  const js = valueToJs(value);
  if (js && typeof js === "object" && !Array.isArray(js)) {
    const o = js;
    if (typeof o.kind === "string" && ["text", "chart", "table", "stack", "row", "col"].includes(o.kind)) {
      return o;
    }
  }
  const isRecordList = /List\s*\{/.test(typeSig);
  const isNumericList = /List\s+(Int|Fixed|Rational|Number)\b/.test(typeSig);
  if (Array.isArray(js)) {
    if (isRecordList) {
      return { kind: "table", rows: js.map((item) => vmRecordToRow(item)) };
    }
    if (isNumericList) return numericLineChart(js);
    return { kind: "text", text: js.map((x) => String(vmScalarToJson(x))).join(", ") };
  }
  if (js && typeof js === "object" && "list" in js) {
    const list = js.list;
    if (isRecordList) {
      return { kind: "table", rows: list.map((item) => vmRecordToRow(item)) };
    }
    if (isNumericList) return numericLineChart(list);
    if (typeSig.includes("List")) {
      return { kind: "text", text: list.map((x) => String(vmScalarToJson(x))).join(", ") };
    }
  }
  if (typeof js === "string" || typeof js === "number" || typeof js === "boolean") {
    return { kind: "text", text: String(js) };
  }
  if (js && typeof js === "object" && !Array.isArray(js)) {
    return { kind: "text", text: JSON.stringify(js, null, 2) };
  }
  return { kind: "text", text: String(js ?? "") };
}
function buildCellLineMap(cells) {
  const map = /* @__PURE__ */ new Map();
  const codeCells = cells.filter((c) => c.kind === "code");
  let line = codeCells.length && !/^\s*module\b/.test(codeCells[0].source) ? 3 : 1;
  for (let i = 0; i < codeCells.length; i++) {
    const cell = codeCells[i];
    const startLine = line;
    const parts = cell.source.split("\n");
    line += parts.length;
    map.set(cell.id, { startLine, endLine: line - 1 });
    if (i < codeCells.length - 1) line += 1;
  }
  return map;
}
function mapDiagnosticsToCells(diagnostics, cells) {
  const lineMap = buildCellLineMap(cells);
  const out = {};
  for (const d of diagnostics) {
    if (d.severity === "warning") continue;
    for (const cell of cells) {
      if (cell.kind !== "code") continue;
      const span = lineMap.get(cell.id);
      if (!span || d.line < span.startLine || d.line > span.endLine) continue;
      if (!out[cell.id]) out[cell.id] = [];
      out[cell.id].push({ line: d.line - span.startLine + 1, message: d.message });
    }
  }
  return out;
}
function wrapBindingAsMain(src, bindingName) {
  const escaped = bindingName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return src.replace(/\bmain\b/g, "__nbUserMain__").replace(new RegExp(`\\b${escaped}\\b`, "g"), "main");
}
var compileCache = /* @__PURE__ */ new Map();
var COMPILE_CACHE_MAX = 48;
function compileNotebookProgram(vlib, src, bindingName) {
  const key = `${bindingName ?? ""}\0${src}`;
  const hit = compileCache.get(key);
  if (hit) {
    compileCache.delete(key);
    compileCache.set(key, hit);
    return hit;
  }
  const result = compileNotebookProgramUncached(vlib, src, bindingName);
  compileCache.set(key, result);
  if (compileCache.size > COMPILE_CACHE_MAX) {
    const oldest = compileCache.keys().next().value;
    if (oldest !== void 0) compileCache.delete(oldest);
  }
  return result;
}
function compileNotebookProgramUncached(vlib, src, bindingName) {
  if (bindingName && typeof vlib.compileBindingEntryJS === "function") {
    if (bindingName !== "main") {
      const wrapped = wrapBindingAsMain(src, bindingName);
      const rw = vlib.compileBindingEntryJS(wrapped, "main");
      if (rw.ok) return { ok: true, output: rw.output, entry: "main" };
    }
    const r2 = vlib.compileBindingEntryJS(src, bindingName);
    return r2.ok ? { ok: true, output: r2.output, entry: bindingName } : { ok: false, error: r2.error };
  }
  if (typeof vlib.compileBindingsJS === "function") {
    const r2 = vlib.compileBindingsJS(src);
    return r2.ok ? { ok: true, output: r2.output, entry: "main" } : { ok: false, error: r2.error };
  }
  const r = vlib.compileJS(src);
  return r.ok ? { ok: true, output: r.output, entry: "main" } : { ok: false, error: r.error };
}
async function runBindingOnFinvm(finvm, programJson, bindingName, finvmState, effectStorage, sourceSig, signal, onEmit) {
  try {
    const program = JSON.parse(programJson);
    if (!program.functions) return { ok: false, error: "Invalid compiled program" };
    if (!(bindingName in program.functions)) {
      return { ok: false, error: `Binding not runnable: ${bindingName}` };
    }
    program.entrypoint = bindingName;
    const { userState, machineSnapshot, sourceSig: savedSig } = splitNotebookFinvmState(finvmState);
    const snapshot = machineSnapshot != null && savedSig === sourceSig ? machineSnapshot : void 0;
    const vmOut = await runProgramWithEffects(finvm, JSON.stringify(program), {
      state: userState,
      machineSnapshot: snapshot,
      entryFunction: bindingName,
      handlers: createFinvmHandlers(effectStorage, void 0, signal, onEmit)
    });
    if (!vmOut.ok) return { ok: false, error: vmOut.error };
    const dbState = effectDbTablesToFinvmState(effectStorage.listDbTables());
    const nextState = mergeNotebookFinvmState({
      userState: vmOut.state,
      machineSnapshot: vmOut.snapshot,
      sourceSig,
      dbState
    });
    return { ok: true, result: vmOut.result, finvmState: nextState };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
async function evalNotebookCells(ctx, source, names, opts) {
  const src = ctx.materialize(source, opts?.cell);
  const sigs = ctx.vlib.signaturesJS(src);
  const sigOf = (n) => sigs.find((s) => s.name === n)?.signature ?? "";
  const useEvalBindingsJson = false;
  if (useEvalBindingsJson && typeof ctx.vlib.evalBindingsJsonJS === "function") {
    const all = ctx.vlib.evalBindingsJsonJS(src, names);
    return all.filter((r) => names.length === 0 || names.includes(r.name)).map((r) => ({
      name: r.name,
      ok: r.ok,
      typeSig: r.typeSig,
      error: r.error,
      display: isDisplayJson(r.json) ? r.json : vmValueToDisplay(r.json, r.typeSig),
      json: r.json
    }));
  }
  const compilation = compileNotebookProgram(ctx.vlib, src);
  if (!compilation.ok) {
    return names.map((name) => ({
      name,
      ok: false,
      typeSig: sigOf(name),
      error: compilation.error
    }));
  }
  let storage = ctx.getEffectStorage() ?? createEffectStorage();
  ctx.setEffectStorage(storage);
  let state = { ...ctx.getFinvmState() };
  const srcSig = sourceSignature(src);
  const outputs = [];
  const seen = /* @__PURE__ */ new Set();
  const orderedNames = names.filter((n) => {
    if (seen.has(n)) return false;
    seen.add(n);
    return true;
  });
  const userNullary = ctx.vlib.nullaryBindingsJS?.(src) ?? null;
  const usePerBindingCompile = typeof ctx.vlib.compileBindingEntryJS === "function";
  const runnableNames = usePerBindingCompile ? orderedNames.filter((n) => !userNullary || userNullary.includes(n)) : filterCellBindingNamesToRunnable(compilation.output, orderedNames);
  for (const name of runnableNames) {
    const bindingCompile = usePerBindingCompile ? compileNotebookProgram(ctx.vlib, src, name) : compilation;
    if (!bindingCompile.ok) {
      outputs.push({ name, ok: false, typeSig: sigOf(name), error: bindingCompile.error });
      continue;
    }
    const entry = usePerBindingCompile ? bindingCompile.entry : name;
    const run = await runBindingOnFinvm(
      ctx.finvm,
      bindingCompile.output,
      entry,
      state,
      storage,
      srcSig,
      opts?.signal,
      ctx.onEmit ? (value) => ctx.onEmit(opts?.cell?.id, value) : void 0
    );
    if (!run.ok) {
      outputs.push({ name, ok: false, typeSig: sigOf(name), error: run.error });
      continue;
    }
    state = run.finvmState;
    ctx.setFinvmState(state);
    syncIdeGlobalProcCache(state, storage);
    const display = vmValueToDisplay(run.result, sigOf(name));
    outputs.push({
      name,
      ok: true,
      typeSig: sigOf(name),
      error: "",
      display,
      json: display
    });
  }
  return outputs;
}
function wrapVerdictLibForNotebook(vlib, notebookLib) {
  if (!notebookLib) return vlib;
  return {
    ...vlib,
    ...notebookLib.compileBindingsJS ? { compileBindingsJS: notebookLib.compileBindingsJS.bind(notebookLib) } : {},
    ...notebookLib.compileBindingEntryJS ? { compileBindingEntryJS: notebookLib.compileBindingEntryJS.bind(notebookLib) } : {},
    ...notebookLib.nullaryBindingsJS ? { nullaryBindingsJS: notebookLib.nullaryBindingsJS.bind(notebookLib) } : {},
    ...notebookLib.evalBindingsJsonJS ? { evalBindingsJsonJS: notebookLib.evalBindingsJsonJS.bind(notebookLib) } : {},
    // Diagnostics must use the notebook lib's compiler too: it links the Verdict
    // libraries (CellBus, Loop, Display, Actor, IDE) the same way the run path
    // does. The base verdict.mjs diagnosticsJS does not, so cells importing those
    // libraries (e.g. busQueue/loopEvery) would show false "unknown name" errors.
    ...notebookLib.diagnosticsJS ? { diagnosticsJS: notebookLib.diagnosticsJS.bind(notebookLib) } : {}
  };
}
export {
  FINVM_DB_KEY,
  FINVM_SNAPSHOT_KEY,
  FINVM_SOURCE_SIG_KEY,
  buildCellLineMap,
  countLiveProcesses,
  createEffectStorage,
  evalNotebookCells,
  findProcess,
  mapDiagnosticsToCells,
  mergeNotebookFinvmState,
  rebootMainInSnapshot,
  runProgramWithEffects,
  sourceSignature,
  splitNotebookFinvmState,
  vmValueToDisplay,
  wrapVerdictLibForNotebook
};
