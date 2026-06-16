export interface RunJsonProgramResult {
  status?: string;
  steps?: number;
  result?: unknown;
  state?: unknown;
  error?: unknown;
  [k: string]: unknown;
}

export function parseRunJsonProgram(raw: string): RunJsonProgramResult | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function renderJsonForPanel(value: unknown): string {
  return escapeHtml(JSON.stringify(value, null, 2));
}

export function formatVmValue(value: unknown): string {
  if (value === null || value === undefined) return String(value);
  if (typeof value !== 'object') return String(value);
  const v = value as Record<string, unknown>;
  if (typeof v.string === 'string') return v.string;
  if (typeof v.int === 'string') return v.int;
  if (typeof v.bool === 'boolean') return String(v.bool);
  return JSON.stringify(value);
}

export function toVerdictLiteral(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  if (typeof value === 'boolean') {
    return value ? 'True' : 'False';
  }
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => toVerdictLiteral(v)).join(', ')}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k} = ${toVerdictLiteral(v)}`);
    return `{ ${entries.join(', ')} }`;
  }
  return '0';
}

type DbRow = { id: string; value: unknown };
type DbTables = Record<string, DbRow[]>;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function resolveFinvmState(input: unknown): Record<string, unknown> {
  const top = asRecord(input);
  if ('__finvm.db' in top) return top;
  const nestedState = asRecord(top.state);
  if ('__finvm.db' in nestedState) return nestedState;
  const vm = asRecord(top.vm);
  const vmState = asRecord(vm.state);
  if ('__finvm.db' in vmState) return vmState;
  return top;
}

export function extractDbTables(input: unknown): DbTables {
  const state = resolveFinvmState(input);
  const root = state['__finvm.db'];
  if (!root || typeof root !== 'object') return {};
  const tablesRecord = ((root as Record<string, unknown>).record ?? {}) as Record<string, unknown>;
  const out: DbTables = {};
  for (const [tableName, tableValue] of Object.entries(tablesRecord)) {
    if (!tableValue || typeof tableValue !== 'object') continue;
    const tableRec = ((tableValue as Record<string, unknown>).record ?? {}) as Record<string, unknown>;
    const rowsRec = ((tableRec.rows as Record<string, unknown> | undefined)?.record ?? {}) as Record<string, unknown>;
    out[tableName] = Object.entries(rowsRec).map(([id, value]) => ({ id, value }));
  }
  return out;
}

export function runDbQuery(query: string, tables: DbTables): unknown {
  const q = query.trim();
  if (q === '' || q === 'tables') {
    return {
      tables: Object.keys(tables).map((name) => ({ name, rows: tables[name].length })),
    };
  }
  const parts = q.split(/\s+/);
  if (parts[0] === 'table' && parts[1]) {
    return {
      table: parts[1],
      rows: tables[parts[1]] ?? [],
    };
  }
  if (parts[0] === 'get' && parts[1] && parts[2]) {
    const rows = tables[parts[1]] ?? [];
    return rows.find((r) => r.id === parts[2]) ?? null;
  }
  if (parts[0] === 'find' && parts[1] && parts.length >= 3) {
    const rows = tables[parts[1]] ?? [];
    const needle = parts.slice(2).join(' ').toLowerCase();
    return rows.filter((r) => JSON.stringify(r.value).toLowerCase().includes(needle));
  }
  return {
    error: 'Unknown query',
    hint: 'Use: tables | table <name> | get <name> <id> | find <name> <text>',
  };
}
