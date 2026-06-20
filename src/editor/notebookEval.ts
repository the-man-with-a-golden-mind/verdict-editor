import {
  createEffectStorage,
  createFinvmHandlers,
  effectDbTablesToFinvmState,
  runProgramWithEffects,
  valueToJs,
  type EffectStorage,
} from './effectDriver';
import {
  mergeNotebookFinvmState,
  sourceSignature,
  splitNotebookFinvmState,
} from './finvmSnapshot';
import { materializeIdeCellPlaceholders, syncIdeGlobalProcCache } from './ideSession';
import type { CellOutput } from './notebookBridge';
import { filterCellBindingNamesToRunnable } from './notebookBindings';

type VerdictLib = {
  compileJS: (src: string) => { ok: boolean; output: string; error: string };
  compileBindingsJS?: (src: string) => { ok: boolean; output: string; error: string };
  compileBindingEntryJS?: (
    src: string,
    entryName: string,
  ) => { ok: boolean; output: string; error: string };
  nullaryBindingsJS?: (src: string) => string[];
  diagnosticsJS: (src: string) => Array<{ line: number; column: number; message: string; severity: string }>;
  evalBindingsJS: (src: string) => Array<{ name: string; ok: boolean; value: string; error: string }>;
  evalBindingsJsonJS?: (src: string, names?: string[]) => Array<{
    name: string;
    ok: boolean;
    json: unknown;
    typeSig: string;
    error: string;
  }>;
  signaturesJS: (src: string) => Array<{ name: string; signature: string }>;
};

type FinVmModule = {
  runEffectStart: (programJson: string) => (overridesJson: string) => string;
  runEffectResume: (programJson: string) => (snapshotJson: string) => (deliveriesJson: string) => string;
};

export type NotebookCellRef = {
  id: string;
  kind: 'code' | 'wysiwyg';
  source: string;
  startLine: number;
};

function isDisplayJson(json: unknown): json is { kind: string } {
  if (!json || typeof json !== 'object') return false;
  const k = (json as { kind?: string }).kind;
  return k === 'text' || k === 'chart' || k === 'table' || k === 'stack';
}

function vmScalarToJson(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (typeof v !== 'object') return v;
  const o = v as Record<string, unknown>;
  if ('string' in o) return o.string;
  if ('int' in o) return Number(o.int);
  if ('bool' in o) return o.bool;
  if ('fixed' in o && o.fixed && typeof o.fixed === 'object') {
    const f = o.fixed as { value?: unknown };
    return f.value ?? o.fixed;
  }
  return v;
}

function vmRecordToRow(rec: unknown): Record<string, unknown> {
  if (!rec || typeof rec !== 'object') return {};
  const r = rec as Record<string, unknown>;
  if ('record' in r && r.record && typeof r.record === 'object') {
    return vmRecordToRow(r.record);
  }
  const inner = ('record' in r ? r.record : r) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(inner)) {
    out[k] = vmScalarToJson(v);
  }
  return out;
}

/** Map a FinVM / Verdict JSON value to the Display schema (or plain JSON). */
// A bare numeric series (e.g. a $1000 equity curve) is far more useful as a line
// chart than comma-joined text. This lets Verdict cells produce charts today
// without the (not-yet-landed) Display chart builder — they just return a numeric
// List and the host charts it.
function numericLineChart(values: unknown[], name = 'series'): unknown {
  const y = values
    .map((v) => Number(vmScalarToJson(v) as unknown))
    .filter((n) => Number.isFinite(n));
  return {
    kind: 'chart',
    title: '',
    traces: [{ name, kind: 'line', x: y.map((_, i) => i), y }],
    xaxis: { title: '' },
    yaxis: { title: '' },
  };
}

export function vmValueToDisplay(value: unknown, typeSig: string): unknown {
  const js = valueToJs(value);
  if (js && typeof js === 'object' && !Array.isArray(js)) {
    const o = js as Record<string, unknown>;
    if (typeof o.kind === 'string' && ['text', 'chart', 'table', 'stack', 'row', 'col'].includes(o.kind)) {
      return o;
    }
  }

  const isRecordList = /List\s*\{/.test(typeSig);
  const isNumericList = /List\s+(Int|Fixed|Rational|Number)\b/.test(typeSig);

  if (Array.isArray(js)) {
    if (isRecordList) {
      return { kind: 'table', rows: js.map((item) => vmRecordToRow(item)) };
    }
    if (isNumericList) return numericLineChart(js);
    return { kind: 'text', text: js.map((x) => String(vmScalarToJson(x))).join(', ') };
  }

  if (js && typeof js === 'object' && 'list' in (js as object)) {
    const list = (js as { list: unknown[] }).list;
    if (isRecordList) {
      return { kind: 'table', rows: list.map((item) => vmRecordToRow(item)) };
    }
    if (isNumericList) return numericLineChart(list);
    if (typeSig.includes('List')) {
      return { kind: 'text', text: list.map((x) => String(vmScalarToJson(x))).join(', ') };
    }
  }

  if (typeof js === 'string' || typeof js === 'number' || typeof js === 'boolean') {
    return { kind: 'text', text: String(js) };
  }

  if (js && typeof js === 'object' && !Array.isArray(js)) {
    return { kind: 'text', text: JSON.stringify(js, null, 2) };
  }

  return { kind: 'text', text: String(js ?? '') };
}

export function buildCellLineMap(cells: NotebookCellRef[]): Map<string, { startLine: number; endLine: number }> {
  const map = new Map<string, { startLine: number; endLine: number }>();
  const codeCells = cells.filter((c) => c.kind === 'code');
  // concatCode prepends `module Main exposing (..)\n\n` (2 lines) when the first
  // code cell does not already start with a `module` header. Diagnostics run on
  // that prepended source, so shift cell spans down to keep highlights aligned.
  let line = codeCells.length && !/^\s*module\b/.test(codeCells[0].source) ? 3 : 1;
  for (let i = 0; i < codeCells.length; i++) {
    const cell = codeCells[i];
    const startLine = line;
    const parts = cell.source.split('\n');
    line += parts.length;
    map.set(cell.id, { startLine, endLine: line - 1 });
    if (i < codeCells.length - 1) line += 1; // blank line from `\n\n` join
  }
  return map;
}

export function mapDiagnosticsToCells(
  diagnostics: Array<{ line: number; message: string; severity: string }>,
  cells: NotebookCellRef[],
): Record<string, Array<{ line: number; message: string }>> {
  const lineMap = buildCellLineMap(cells);
  const out: Record<string, Array<{ line: number; message: string }>> = {};
  for (const d of diagnostics) {
    if (d.severity === 'warning') continue;
    for (const cell of cells) {
      if (cell.kind !== 'code') continue;
      const span = lineMap.get(cell.id);
      if (!span || d.line < span.startLine || d.line > span.endLine) continue;
      if (!out[cell.id]) out[cell.id] = [];
      out[cell.id].push({ line: d.line - span.startLine + 1, message: d.message });
    }
  }
  return out;
}

/**
 * Wrap a target binding so it is compiled as the program's `main`.
 *
 * The Verdict compiler lowers the entry declaration specially (effect
 * continuations only resume correctly for the function named `main`). A binding
 * compiled as its own standalone entry that transitively performs an effect
 * (e.g. reading shared history via `cache.get`) returns the raw effect value
 * instead of the post-effect computation — the continuation is dropped. Routing
 * the value through a synthetic `main = <binding>` makes `main` the real entry,
 * so the effectful chain runs under the entry process and resumes correctly.
 *
 * We promote the target binding to be `main` by renaming it (carrying its own
 * type annotation) rather than synthesising `main : <sig>`, because the
 * compiler's signature output is an internal, non-surface representation that
 * is not valid as a type annotation (notably for record types).
 */
function wrapBindingAsMain(src: string, bindingName: string): string {
  // Move any existing user `main` out of the way, then rename the target binding
  // (definition, signature, and references) to `main`.
  const escaped = bindingName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return src
    .replace(/\bmain\b/g, '__nbUserMain__')
    .replace(new RegExp(`\\b${escaped}\\b`, 'g'), 'main');
}

// Compiled programs are pure functions of (source, bindingName). The notebook
// re-evaluates the same cell repeatedly (manual re-runs, loops) with unchanged
// source, so cache the compiled output and skip recompilation until the source
// actually changes. Keyed by the fully materialized source (inputs included),
// so any edit or input change is a cache miss. Bounded LRU to cap memory.
const compileCache = new Map<
  string,
  { ok: true; output: string; entry: string } | { ok: false; error: string }
>();
const COMPILE_CACHE_MAX = 48;

function compileNotebookProgram(
  vlib: VerdictLib,
  src: string,
  bindingName?: string,
): { ok: true; output: string; entry: string } | { ok: false; error: string } {
  const key = `${bindingName ?? ''} ${src}`;
  const hit = compileCache.get(key);
  if (hit) {
    compileCache.delete(key);
    compileCache.set(key, hit); // LRU bump
    return hit;
  }
  const result = compileNotebookProgramUncached(vlib, src, bindingName);
  // Cache successes always; cache failures too (a broken cell stays broken until
  // edited, and recompiling it every tick to re-derive the same error is wasteful).
  compileCache.set(key, result);
  if (compileCache.size > COMPILE_CACHE_MAX) {
    const oldest = compileCache.keys().next().value;
    if (oldest !== undefined) compileCache.delete(oldest);
  }
  return result;
}

function compileNotebookProgramUncached(
  vlib: VerdictLib,
  src: string,
  bindingName?: string,
): { ok: true; output: string; entry: string } | { ok: false; error: string } {
  if (bindingName && typeof vlib.compileBindingEntryJS === 'function') {
    // Non-`main` bindings: promote the target to `main` so effect continuations
    // resume correctly (see wrapBindingAsMain).
    if (bindingName !== 'main') {
      const wrapped = wrapBindingAsMain(src, bindingName);
      const rw = vlib.compileBindingEntryJS(wrapped, 'main');
      if (rw.ok) return { ok: true, output: rw.output, entry: 'main' };
      // Fall through to the standalone compile if promotion failed to compile.
    }
    const r = vlib.compileBindingEntryJS(src, bindingName);
    return r.ok ? { ok: true, output: r.output, entry: bindingName } : { ok: false, error: r.error };
  }
  if (typeof vlib.compileBindingsJS === 'function') {
    const r = vlib.compileBindingsJS(src);
    return r.ok ? { ok: true, output: r.output, entry: 'main' } : { ok: false, error: r.error };
  }
  const r = vlib.compileJS(src);
  return r.ok ? { ok: true, output: r.output, entry: 'main' } : { ok: false, error: r.error };
}

async function runBindingOnFinvm(
  finvm: FinVmModule,
  programJson: string,
  bindingName: string,
  finvmState: Record<string, unknown>,
  effectStorage: EffectStorage,
  sourceSig: string,
  signal?: AbortSignal,
): Promise<{ ok: true; result: unknown; finvmState: Record<string, unknown> } | { ok: false; error: string }> {
  try {
    const program = JSON.parse(programJson) as {
      entrypoint?: string;
      functions?: Record<string, unknown>;
    };
    if (!program.functions) return { ok: false, error: 'Invalid compiled program' };
    if (!(bindingName in program.functions)) {
      return { ok: false, error: `Binding not runnable: ${bindingName}` };
    }
    program.entrypoint = bindingName;
    const { userState, machineSnapshot, sourceSig: savedSig } = splitNotebookFinvmState(finvmState);
    const snapshot =
      machineSnapshot != null && savedSig === sourceSig ? machineSnapshot : undefined;
    const vmOut = await runProgramWithEffects(finvm, JSON.stringify(program), {
      state: userState,
      machineSnapshot: snapshot,
      entryFunction: bindingName,
      handlers: createFinvmHandlers(effectStorage, undefined, signal),
    });
    if (!vmOut.ok) return { ok: false, error: vmOut.error };
    const dbState = effectDbTablesToFinvmState(effectStorage.listDbTables());
    const nextState = mergeNotebookFinvmState({
      userState: vmOut.state,
      machineSnapshot: vmOut.snapshot,
      sourceSig,
      dbState,
    });
    return { ok: true, result: vmOut.result, finvmState: nextState };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export type NotebookEvalContext = {
  vlib: VerdictLib;
  finvm: FinVmModule;
  getFinvmState: () => Record<string, unknown>;
  setFinvmState: (s: Record<string, unknown>) => void;
  getEffectStorage: () => EffectStorage;
  setEffectStorage: (s: EffectStorage) => void;
  materialize: (source: string, cell?: { id?: string; index?: number }) => string;
};

export type NotebookEvalOptions = {
  cell?: { id?: string; index?: number };
  /** Aborts the run (rejects any pending `time.sleep`); set by Stop. */
  signal?: AbortSignal;
};

export async function evalNotebookCells(
  ctx: NotebookEvalContext,
  source: string,
  names: string[],
  opts?: NotebookEvalOptions,
): Promise<CellOutput[]> {
  const src = ctx.materialize(source, opts?.cell);
  const sigs = ctx.vlib.signaturesJS(src);
  const sigOf = (n: string) => sigs.find((s) => s.name === n)?.signature ?? '';

  // FinVM preserves shared effectStorage/finvmState (Jupiter §4). Skip evalBindingsJsonJS until P0 integrates FinVM.
  const useEvalBindingsJson = false;
  if (useEvalBindingsJson && typeof ctx.vlib.evalBindingsJsonJS === 'function') {
    const all = ctx.vlib.evalBindingsJsonJS(src, names);
    return all
      .filter((r) => names.length === 0 || names.includes(r.name))
      .map((r) => ({
        name: r.name,
        ok: r.ok,
        typeSig: r.typeSig,
        error: r.error,
        display: isDisplayJson(r.json) ? r.json : vmValueToDisplay(r.json, r.typeSig),
        json: r.json,
      }));
  }

  const compilation = compileNotebookProgram(ctx.vlib, src);
  if (!compilation.ok) {
    return names.map((name) => ({
      name,
      ok: false,
      typeSig: sigOf(name),
      error: compilation.error,
    }));
  }

  let storage = ctx.getEffectStorage() ?? createEffectStorage();
  ctx.setEffectStorage(storage);
  let state = { ...ctx.getFinvmState() };
  const srcSig = sourceSignature(src);

  const outputs: CellOutput[] = [];
  const seen = new Set<string>();
  const orderedNames = names.filter((n) => {
    if (seen.has(n)) return false;
    seen.add(n);
    return true;
  });
  const userNullary = ctx.vlib.nullaryBindingsJS?.(src) ?? null;
  const usePerBindingCompile = typeof ctx.vlib.compileBindingEntryJS === 'function';
  const runnableNames = usePerBindingCompile
    ? orderedNames.filter((n) => !userNullary || userNullary.includes(n))
    : filterCellBindingNamesToRunnable(compilation.output, orderedNames);

  for (const name of runnableNames) {
    const bindingCompile = usePerBindingCompile
      ? compileNotebookProgram(ctx.vlib, src, name)
      : compilation;
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
      error: '',
      display,
      json: display,
    });
  }

  return outputs;
}

/** Wrap a frozen verdict module with compileBindingsJS from verdict-notebook.mjs. */
export function wrapVerdictLibForNotebook(
  vlib: VerdictLib,
  notebookLib: VerdictLib | null,
): VerdictLib {
  if (!notebookLib) return vlib;
  return {
    ...vlib,
    ...(notebookLib.compileBindingsJS
      ? { compileBindingsJS: notebookLib.compileBindingsJS.bind(notebookLib) }
      : {}),
    ...(notebookLib.compileBindingEntryJS
      ? { compileBindingEntryJS: notebookLib.compileBindingEntryJS.bind(notebookLib) }
      : {}),
    ...(notebookLib.nullaryBindingsJS
      ? { nullaryBindingsJS: notebookLib.nullaryBindingsJS.bind(notebookLib) }
      : {}),
    ...(notebookLib.evalBindingsJsonJS
      ? { evalBindingsJsonJS: notebookLib.evalBindingsJsonJS.bind(notebookLib) }
      : {}),
    // Diagnostics must use the notebook lib's compiler too: it links the Verdict
    // libraries (CellBus, Loop, Display, Actor, IDE) the same way the run path
    // does. The base verdict.mjs diagnosticsJS does not, so cells importing those
    // libraries (e.g. busQueue/loopEvery) would show false "unknown name" errors.
    ...(notebookLib.diagnosticsJS
      ? { diagnosticsJS: notebookLib.diagnosticsJS.bind(notebookLib) }
      : {}),
  };
}
