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
function createFinvmHandlers(storage, fetchImpl = globalThis.fetch.bind(globalThis)) {
  return {
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
    "db.update": async (p) => {
      return storage.dbUpdate(String(p.table ?? ""), String(p.id ?? ""), p.record ?? {});
    },
    "db.delete": async (p) => {
      return storage.dbDelete(String(p.table ?? ""), String(p.id ?? ""));
    },
    "cache.set": async (p) => {
      const key = String(p.cacheKey ?? p.key2 ?? "");
      return storage.cacheSet(String(p.ns ?? ""), key, p.value ?? null);
    },
    "cache.get": async (p) => {
      const key = String(p.cacheKey ?? p.key2 ?? "");
      return storage.cacheGet(String(p.ns ?? ""), key);
    },
    "cache.delete": async (p) => {
      const key = String(p.cacheKey ?? p.key2 ?? "");
      return storage.cacheDelete(String(p.ns ?? ""), key);
    }
  };
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
    let out = parseVmOutput(finvm.runEffectStart(programJson)(overrides));
    for (let iter = 0; iter < MAX_ITERS; iter++) {
      if (out.status === "completed") {
        const state = Object.fromEntries(
          Object.entries(out.state ?? {}).map(([k, v]) => [k, valueToJs(v)])
        );
        return {
          ok: true,
          result: valueToJs(out.result),
          state,
          steps: typeof out.steps === "number" ? out.steps : 0
        };
      }
      if (out.status !== "suspended") {
        return { ok: false, error: `VM ${out.status}: expected suspended/completed` };
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
function vmValueToDisplay(value, typeSig) {
  const js = valueToJs(value);
  if (js && typeof js === "object" && !Array.isArray(js)) {
    const o = js;
    if (typeof o.kind === "string" && ["text", "chart", "table", "stack"].includes(o.kind)) {
      return o;
    }
  }
  const isRecordList = /List\s*\{/.test(typeSig);
  if (Array.isArray(js)) {
    if (isRecordList) {
      return { kind: "table", rows: js.map((item) => vmRecordToRow(item)) };
    }
    return { kind: "text", text: js.map((x) => String(vmScalarToJson(x))).join(", ") };
  }
  if (js && typeof js === "object" && "list" in js) {
    const list = js.list;
    if (isRecordList) {
      return { kind: "table", rows: list.map((item) => vmRecordToRow(item)) };
    }
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
  let line = 1;
  const codeCells = cells.filter((c) => c.kind === "code");
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
function compileNotebookProgram(vlib, src) {
  if (typeof vlib.compileBindingsJS === "function") {
    const r2 = vlib.compileBindingsJS(src);
    return r2.ok ? { ok: true, output: r2.output } : { ok: false, error: r2.error };
  }
  const r = vlib.compileJS(src);
  return r.ok ? { ok: true, output: r.output } : { ok: false, error: r.error };
}
async function runBindingOnFinvm(finvm, programJson, bindingName, finvmState, effectStorage) {
  try {
    const program = JSON.parse(programJson);
    if (!program.functions) return { ok: false, error: "Invalid compiled program" };
    if (!(bindingName in program.functions)) {
      return { ok: false, error: `Binding not runnable: ${bindingName}` };
    }
    program.entrypoint = bindingName;
    const vmOut = await runProgramWithEffects(finvm, JSON.stringify(program), {
      state: finvmState,
      handlers: createFinvmHandlers(effectStorage)
    });
    if (!vmOut.ok) return { ok: false, error: vmOut.error };
    const dbState = effectDbTablesToFinvmState(effectStorage.listDbTables());
    const nextState = {
      ...vmOut.state,
      "__finvm.db": dbState
    };
    return { ok: true, result: vmOut.result, finvmState: nextState };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
async function evalNotebookCells(ctx, source, names) {
  const src = ctx.materialize(source);
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
  const outputs = [];
  const seen = /* @__PURE__ */ new Set();
  const orderedNames = names.filter((n) => {
    if (seen.has(n)) return false;
    seen.add(n);
    return true;
  });
  for (const name of orderedNames) {
    const run = await runBindingOnFinvm(ctx.finvm, compilation.output, name, state, storage);
    if (!run.ok) {
      outputs.push({ name, ok: false, typeSig: sigOf(name), error: run.error });
      continue;
    }
    state = run.finvmState;
    ctx.setFinvmState(state);
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
  if (!notebookLib?.compileBindingsJS) return vlib;
  return { ...vlib, compileBindingsJS: notebookLib.compileBindingsJS.bind(notebookLib) };
}
export {
  buildCellLineMap,
  createEffectStorage,
  evalNotebookCells,
  mapDiagnosticsToCells,
  vmValueToDisplay,
  wrapVerdictLibForNotebook
};
