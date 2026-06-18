import {
  createEffectStorage,
  createFinvmHandlers,
  effectDbTablesToFinvmState,
  runProgramWithEffects,
  valueToJs,
  type EffectStorage,
} from './effectDriver';
import type { CellOutput } from './notebookBridge';

type VerdictLib = {
  compileJS: (src: string) => { ok: boolean; output: string; error: string };
  compileBindingsJS?: (src: string) => { ok: boolean; output: string; error: string };
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
export function vmValueToDisplay(value: unknown, typeSig: string): unknown {
  const js = valueToJs(value);
  if (js && typeof js === 'object' && !Array.isArray(js)) {
    const o = js as Record<string, unknown>;
    if (typeof o.kind === 'string' && ['text', 'chart', 'table', 'stack'].includes(o.kind)) {
      return o;
    }
  }

  const isRecordList = /List\s*\{/.test(typeSig);

  if (Array.isArray(js)) {
    if (isRecordList) {
      return { kind: 'table', rows: js.map((item) => vmRecordToRow(item)) };
    }
    return { kind: 'text', text: js.map((x) => String(vmScalarToJson(x))).join(', ') };
  }

  if (js && typeof js === 'object' && 'list' in (js as object)) {
    const list = (js as { list: unknown[] }).list;
    if (isRecordList) {
      return { kind: 'table', rows: list.map((item) => vmRecordToRow(item)) };
    }
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
  let line = 1;
  const codeCells = cells.filter((c) => c.kind === 'code');
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

function compileNotebookProgram(
  vlib: VerdictLib,
  src: string,
): { ok: true; output: string } | { ok: false; error: string } {
  if (typeof vlib.compileBindingsJS === 'function') {
    const r = vlib.compileBindingsJS(src);
    return r.ok ? { ok: true, output: r.output } : { ok: false, error: r.error };
  }
  const r = vlib.compileJS(src);
  return r.ok ? { ok: true, output: r.output } : { ok: false, error: r.error };
}

async function runBindingOnFinvm(
  finvm: FinVmModule,
  programJson: string,
  bindingName: string,
  finvmState: Record<string, unknown>,
  effectStorage: EffectStorage,
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
    const vmOut = await runProgramWithEffects(finvm, JSON.stringify(program), {
      state: finvmState,
      handlers: createFinvmHandlers(effectStorage),
    });
    if (!vmOut.ok) return { ok: false, error: vmOut.error };
    const dbState = effectDbTablesToFinvmState(effectStorage.listDbTables());
    const nextState = {
      ...vmOut.state,
      '__finvm.db': dbState,
    };
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
  materialize: (source: string) => string;
};

export async function evalNotebookCells(
  ctx: NotebookEvalContext,
  source: string,
  names: string[],
): Promise<CellOutput[]> {
  const src = ctx.materialize(source);
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

  const outputs: CellOutput[] = [];
  const seen = new Set<string>();
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
  if (!notebookLib?.compileBindingsJS) return vlib;
  return { ...vlib, compileBindingsJS: notebookLib.compileBindingsJS.bind(notebookLib) };
}
