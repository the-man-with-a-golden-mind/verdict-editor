/**
 * Minimal FinVM effect driver for the browser editor.
 * Performs http/db/cache effects requested by compiled Verdict programs.
 * Market logic stays in Verdict source; this only fulfils VM effect intents.
 */

type FinVmTagless = Record<string, unknown>;

export interface EffectStorage {
  dbInsert(table: string, record: unknown): string;
  dbGet(table: string, id: string): unknown | null;
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

// Handlers return plain JS; runProgramWithEffects applies jsToValue once on
// delivery. Returning tagless values here would double-encode the result.
export function createFinvmHandlers(
  storage: EffectStorage,
  fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis),
) {
  return {
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
    'db.update': async (p: { table?: string; id?: string; record?: unknown }) => {
      return storage.dbUpdate(String(p.table ?? ''), String(p.id ?? ''), p.record ?? {});
    },
    'db.delete': async (p: { table?: string; id?: string }) => {
      return storage.dbDelete(String(p.table ?? ''), String(p.id ?? ''));
    },
    'cache.set': async (p: { ns?: string; cacheKey?: string; key2?: string; value?: unknown }) => {
      const key = String(p.cacheKey ?? p.key2 ?? '');
      return storage.cacheSet(String(p.ns ?? ''), key, p.value ?? null);
    },
    'cache.get': async (p: { ns?: string; cacheKey?: string; key2?: string }) => {
      const key = String(p.cacheKey ?? p.key2 ?? '');
      return storage.cacheGet(String(p.ns ?? ''), key);
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
  steps: number;
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
    handlers: Record<string, (payload: Record<string, unknown>) => Promise<unknown>>;
  },
): Promise<RunWithEffectsResult | RunWithEffectsError> {
  try {
    const overrides = JSON.stringify({ input: {}, state: opts.state ?? {} });
    let out = parseVmOutput(finvm.runEffectStart(programJson)(overrides));

    for (let iter = 0; iter < MAX_ITERS; iter++) {
      if (out.status === 'completed') {
        const state = Object.fromEntries(
          Object.entries(out.state ?? {}).map(([k, v]) => [k, valueToJs(v)]),
        );
        return {
          ok: true,
          result: valueToJs(out.result),
          state,
          steps: typeof out.steps === 'number' ? out.steps : 0,
        };
      }
      if (out.status !== 'suspended') {
        return { ok: false, error: `VM ${out.status}: expected suspended/completed` };
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
