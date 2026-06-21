/**
 * Minimal FinVM effect driver for the browser editor.
 * Performs http/db/cache effects requested by compiled Verdict programs.
 * Market logic stays in Verdict source; this only fulfils VM effect intents.
 */

import {
  rebootMainInSnapshot,
  registerCountForFunction,
} from './finvmSnapshot';

type FinVmTagless = Record<string, unknown>;

export interface EffectStorage {
  dbInsert(table: string, record: unknown): string;
  dbGet(table: string, id: string): unknown | null;
  dbQuery(table: string, filter: Record<string, unknown>): unknown[];
  dbUpdate(table: string, id: string, record: unknown): boolean;
  dbDelete(table: string, id: string): boolean;
  cacheSet(ns: string, key: string, value: unknown): boolean;
  cacheGet(ns: string, key: string): unknown | null;
  cacheDelete(ns: string, key: string): boolean;
  listDbTables(): Record<string, Array<{ id: string; value: unknown }>>;
}

export function createEffectStorage(): EffectStorage {
  const tables = new Map<string, Map<string, unknown>>();
  const cache = new Map<string, unknown>();
  let seq = 0;
  const tbl = (t: string) => {
    if (!tables.has(t)) tables.set(t, new Map());
    return tables.get(t)!;
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
      const out: unknown[] = [];
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
      cache.set(`${ns}\u0000${key}`, value);
      return true;
    },
    cacheGet(ns, key) {
      const k = `${ns}\u0000${key}`;
      return cache.has(k) ? cache.get(k)! : null;
    },
    cacheDelete(ns, key) {
      return cache.delete(`${ns}\u0000${key}`);
    },
    listDbTables() {
      const out: Record<string, Array<{ id: string; value: unknown }>> = {};
      for (const [table, rows] of tables) {
        out[table] = Array.from(rows.entries()).map(([id, value]) => ({ id, value }));
      }
      return out;
    },
  };
}

export function effectDbTablesToFinvmState(
  tables: Record<string, Array<{ id: string; value: unknown }>>,
): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  for (const [name, rows] of Object.entries(tables)) {
    const rowsRecord: Record<string, unknown> = {};
    for (const row of rows) {
      rowsRecord[row.id] = row.value;
    }
    record[name] = {
      record: {
        nextId: { int: String(rows.length) },
        rows: { record: rowsRecord },
        indexes: { record: {} },
        dirtyHash: { bool: true },
      },
    };
  }
  return { record };
}

export function jsToValue(x: unknown): FinVmTagless | null {
  if (x === null || x === undefined) return null;
  if (typeof x === 'boolean') return { bool: x };
  if (typeof x === 'bigint') return { int: x.toString() };
  if (typeof x === 'number') return Number.isInteger(x) ? { int: String(x) } : { string: String(x) };
  if (typeof x === 'string') return { string: x };
  if (Array.isArray(x)) return { list: x.map((v) => jsToValue(v)) };
  if (typeof x === 'object') {
    const obj = x as Record<string, unknown>;
    if ('tag' in obj && 'payload' in obj) {
      return { variant: { tag: obj.tag, payload: jsToValue(obj.payload) } };
    }
    if (typeof obj.proc === 'string') {
      return { proc: { string: obj.proc } };
    }
    if (obj.proc && typeof obj.proc === 'object' && 'string' in obj.proc) {
      return obj as FinVmTagless;
    }
    if (typeof obj.process === 'string') {
      return { proc: { string: obj.process } };
    }
    const rec: Record<string, FinVmTagless | null> = {};
    for (const [k, v] of Object.entries(obj)) rec[k] = jsToValue(v);
    return { record: rec };
  }
  return { string: String(x) };
}

export function valueToJs(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (typeof v !== 'object') return v;
  const obj = v as Record<string, unknown>;
  if ('bool' in obj) return obj.bool;
  if ('int' in obj) {
    const n = Number(obj.int);
    return Number.isSafeInteger(n) ? n : BigInt(String(obj.int));
  }
  if ('string' in obj) return obj.string;
  if ('symbol' in obj) return obj.symbol;
  if ('proc' in obj && obj.proc && typeof obj.proc === 'object' && 'string' in obj.proc) {
    return obj as FinVmTagless;
  }
  if ('process' in obj && typeof obj.process === 'string') {
    return { proc: obj.process };
  }
  if ('list' in obj && Array.isArray(obj.list)) return obj.list.map(valueToJs);
  if ('record' in obj && obj.record && typeof obj.record === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(obj.record as Record<string, unknown>)) {
      out[k] = valueToJs(val);
    }
    return out;
  }
  if ('variant' in obj && obj.variant && typeof obj.variant === 'object') {
    const variant = obj.variant as { tag?: unknown; payload?: unknown };
    return { tag: variant.tag, payload: valueToJs(variant.payload) };
  }
  return v;
}

function recordMatchesFilter(record: unknown, filter: Record<string, unknown>): boolean {
  if (!filter || Object.keys(filter).length === 0) {
    return record != null && typeof record === 'object';
  }
  if (!record || typeof record !== 'object') return false;
  const row = record as Record<string, unknown>;
  for (const [key, expected] of Object.entries(filter)) {
    if (!shallowEqualJsonField(row[key], expected)) return false;
  }
  return true;
}

function shallowEqualJsonField(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a === 'object' && typeof b === 'object') {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  return String(a) === String(b);
}

// Handlers return plain JS; runProgramWithEffects applies jsToValue once on
// delivery. Returning tagless values here would double-encode the result.
export function createFinvmHandlers(
  storage: EffectStorage,
  fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis),
  signal?: AbortSignal,
  // Live output channel: a cell (actor) emits a Display value by writing to the
  // reserved `__display__` cache namespace; the host renders it to the running
  // cell's output immediately instead of waiting for the eval's return value.
  onEmit?: (value: unknown) => void,
) {
  return {
    // Real `time.sleep@1` effect (EFFECT_AWAIT). A cell's `sleep`/`loopEvery`
    // helper emits this so the loop cadence lives in the cell source. The
    // generic effect payload passes the single arg through as `args`, so the
    // ms count arrives as `p.args` (number) rather than a named field. Stop
    // aborts the run controller, which rejects the pending sleep so the VM run
    // unwinds promptly instead of waiting out the full delay.
    'time.sleep': async (p: { args?: unknown; ms?: unknown }) => {
      const raw = p.ms ?? p.args ?? 0;
      const ms = Math.max(0, Math.min(60000, Math.trunc(Number(raw) || 0)));
      if (signal?.aborted) throw new Error('sleep aborted');
      await new Promise<void>((resolve, reject) => {
        const onAbort = () => {
          clearTimeout(timer);
          reject(new Error('sleep aborted'));
        };
        const timer = setTimeout(() => {
          signal?.removeEventListener('abort', onAbort);
          resolve();
        }, ms);
        signal?.addEventListener('abort', onAbort, { once: true });
      });
      return null;
    },
    'http.get': async (p: { url?: string }) => {
      const url = String(p.url ?? '');
      const res = await fetchImpl(url, { method: 'GET' });
      const body = await res.text();
      return { status: res.status, ok: res.ok, body };
    },
    'http.post': async (p: { url?: string; body?: string }) => {
      const url = String(p.url ?? '');
      const res = await fetchImpl(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: p.body ?? '',
      });
      const body = await res.text();
      return { status: res.status, ok: res.ok, body };
    },
    'sys.log': async (p: { message?: string }) => {
      console.log(p.message ?? '');
      return true;
    },
    'db.insert': async (p: { table?: string; record?: unknown }) => {
      return storage.dbInsert(String(p.table ?? ''), p.record ?? {});
    },
    'db.get': async (p: { table?: string; id?: string }) => {
      return storage.dbGet(String(p.table ?? ''), String(p.id ?? ''));
    },
    'db.query': async (p: { table?: string; query?: Record<string, unknown>; filter?: Record<string, unknown> }) => {
      const filter = (p.query ?? p.filter ?? {}) as Record<string, unknown>;
      return storage.dbQuery(String(p.table ?? ''), filter);
    },
    'db.update': async (p: { table?: string; id?: string; record?: unknown }) => {
      return storage.dbUpdate(String(p.table ?? ''), String(p.id ?? ''), p.record ?? {});
    },
    'db.delete': async (p: { table?: string; id?: string }) => {
      return storage.dbDelete(String(p.table ?? ''), String(p.id ?? ''));
    },
    'cache.set': async (p: { ns?: string; cacheKey?: string; key2?: string; value?: unknown }) => {
      const ns = String(p.ns ?? '');
      // Reserved emit channel: render to the running cell's output, don't store.
      if (ns === '__display__') {
        onEmit?.(p.value ?? null);
        return true;
      }
      const key = String(p.cacheKey ?? p.key2 ?? '');
      return storage.cacheSet(ns, key, p.value ?? null);
    },
    'cache.get': async (p: { ns?: string; cacheKey?: string; key2?: string }) => {
      const key = String(p.cacheKey ?? p.key2 ?? '');
      const v = storage.cacheGet(String(p.ns ?? ''), key);
      if (v && typeof v === 'object' && v !== null && 'proc' in v && typeof (v as { proc: unknown }).proc === 'string') {
        return { proc: { string: String((v as { proc: string }).proc) } };
      }
      return v;
    },
    'cache.delete': async (p: { ns?: string; cacheKey?: string; key2?: string }) => {
      const key = String(p.cacheKey ?? p.key2 ?? '');
      return storage.cacheDelete(String(p.ns ?? ''), key);
    },
  } as Record<string, (payload: Record<string, unknown>) => Promise<unknown>>;
}

interface VmStepOutput {
  status: string;
  error?: string;
  snapshot?: unknown;
  pending?: Array<Record<string, unknown>>;
  result?: unknown;
  state?: Record<string, FinVmTagless | null>;
  steps?: number;
}

function vmRunFinished(out: VmStepOutput): boolean {
  return out.status === 'completed' || out.status === 'deadlock';
}

function parseVmOutput(raw: string): VmStepOutput {
  const out = JSON.parse(raw) as VmStepOutput;
  if (!out || typeof out.status !== 'string') {
    throw new Error('invalid VM output shape');
  }
  if (out.status === 'error' || out.status === 'failed') {
    throw new Error(`VM ${out.status}: ${out.error ?? 'unknown'}`);
  }
  return out;
}

const MAX_ITERS = 10000;

export interface RunWithEffectsResult {
  ok: true;
  result: unknown;
  state: Record<string, unknown>;
  /** Full FinVM machine snapshot (scheduler + processes + mailboxes). */
  snapshot: unknown;
  steps: number;
  /** FinVM quiescence status (`completed` or `deadlock` when background actors remain). */
  vmStatus: string;
}

export interface RunWithEffectsError {
  ok: false;
  error: string;
}

export async function runProgramWithEffects(
  finvm: {
    runEffectStart: (program: string) => (overrides: string) => string;
    runEffectResume: (program: string) => (snapshot: string) => (deliveries: string) => string;
  },
  programJson: string,
  opts: {
    state?: Record<string, unknown>;
    /** Prior full machine snapshot (processes/mailboxes survive across notebook cells). */
    machineSnapshot?: unknown;
    /** VM function name for the cell entry (`main` after wrapBindingAsMain). */
    entryFunction?: string;
    handlers: Record<string, (payload: Record<string, unknown>) => Promise<unknown>>;
  },
): Promise<RunWithEffectsResult | RunWithEffectsError> {
  try {
    const overrides = JSON.stringify({ input: {}, state: opts.state ?? {} });
    let out: VmStepOutput;
    if (opts.machineSnapshot != null) {
      const entry = opts.entryFunction ?? 'main';
      const regCount = registerCountForFunction(programJson, entry);
      const patched = rebootMainInSnapshot(opts.machineSnapshot, entry, regCount);
      out = parseVmOutput(
        finvm.runEffectResume(programJson)(JSON.stringify(patched))(JSON.stringify([])),
      );
    } else {
      out = parseVmOutput(finvm.runEffectStart(programJson)(overrides));
    }

    for (let iter = 0; iter < MAX_ITERS; iter++) {
      if (vmRunFinished(out)) {
        const state = Object.fromEntries(
          Object.entries(out.state ?? {}).map(([k, v]) => [k, valueToJs(v)]),
        );
        return {
          ok: true,
          result: valueToJs(out.result),
          state,
          snapshot: out.snapshot ?? null,
          steps: typeof out.steps === 'number' ? out.steps : 0,
          vmStatus: out.status,
        };
      }
      if (out.status !== 'suspended') {
        return { ok: false, error: `VM ${out.status}: expected suspended/completed/deadlock` };
      }

      const pending = Array.isArray(out.pending) ? out.pending : [];
      if (pending.length === 0) {
        return { ok: false, error: "VM suspended with no pending effects" };
      }

      const results = await Promise.all(
        pending.map(async (entry) => {
          const type_ = String(entry.type_ ?? '');
          const handler = opts.handlers[type_];
          if (!handler) throw new Error(`No handler for effect type: ${type_}`);
          const payloadJs = valueToJs(entry.payload) as Record<string, unknown>;
          const key = typeof entry.key === 'string' ? entry.key : undefined;
          const payload =
            payloadJs && typeof payloadJs === 'object' && !Array.isArray(payloadJs)
              ? { ...payloadJs, ...(key ? { key } : {}) }
              : payloadJs;
          return handler(payload as Record<string, unknown>);
        }),
      );

      const deliveries = pending.map((entry, idx) => {
        const pid = typeof entry.pid === 'string' && entry.pid.length > 0 ? entry.pid : 'main';
        const key = typeof entry.key === 'string' ? entry.key : '';
        const kind = typeof entry.kind === 'string' ? entry.kind : (key ? 'await_reply' : 'transport');
        if (kind === 'transport') return null;
        return { pid, key, result: jsToValue(results[idx]) };
      }).filter((d): d is { pid: string; key: string; result: FinVmTagless | null } => d !== null);

      out = parseVmOutput(
        finvm.runEffectResume(programJson)(JSON.stringify(out.snapshot))(JSON.stringify(deliveries)),
      );
    }
    return { ok: false, error: 'effect driver exceeded MAX_ITERS' };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
