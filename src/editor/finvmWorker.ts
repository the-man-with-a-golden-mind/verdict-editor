/// <reference lib="webworker" />
// FinVM eval worker. The notebook's cell evaluation (compile + bytecode run +
// effects) is CPU-bound and was blocking the main thread on every actor tick.
// Running it here keeps the UI responsive: the worker owns the effect storage
// and the FinVM snapshot, runs evalNotebookCells, posts live `emit` values back
// for the host to render, and ships a DB-tables snapshot with each result so the
// main thread's DB tab stays current without a per-tick full-state sync.
import { evalNotebookCells, wrapVerdictLibForNotebook } from './notebookEval';
import type { NotebookEvalContext } from './notebookEval';
import { createEffectStorage, effectDbTablesToFinvmState } from './effectDriver';
import type { EffectStorage } from './effectDriver';

type EvalMsg = {
  type: 'eval';
  id: string;
  source: string;
  names: string[];
  cell?: { id?: string; index?: number };
};
type AbortMsg = { type: 'abort'; id: string };
type StateMsg = { type: 'finvmState'; id: string };
type InMsg = EvalMsg | AbortMsg | StateMsg;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let vlib: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let finvm: any = null;
let storage: EffectStorage = createEffectStorage();
let finvmState: Record<string, unknown> = {};
const controllers = new Map<string, AbortController>();

async function importPublic(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`failed to load ${url}: ${res.status}`);
  const blobUrl = URL.createObjectURL(new Blob([await res.text()], { type: 'text/javascript' }));
  try {
    return await import(/* @vite-ignore */ blobUrl);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

async function loadLibs(): Promise<void> {
  if (vlib && finvm) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [v, vn, f] = (await Promise.all([
    importPublic('/lib/verdict.mjs'),
    importPublic('/lib/verdict-notebook.mjs'),
    importPublic('/lib/finvm.mjs'),
  ])) as any[];
  vlib = wrapVerdictLibForNotebook(v.default ?? v, vn.default ?? vn);
  finvm = f.default ?? f;
}

const post = (m: unknown) => (self as unknown as Worker).postMessage(m);

self.onmessage = async (e: MessageEvent<InMsg>) => {
  const msg = e.data;
  if (msg.type === 'abort') {
    controllers.get(msg.id)?.abort();
    return;
  }
  if (msg.type === 'finvmState') {
    post({ type: 'finvmState', id: msg.id, state: finvmState });
    return;
  }
  if (msg.type === 'eval') {
    try {
      await loadLibs();
    } catch (err) {
      post({ type: 'result', id: msg.id, outputs: [], error: String(err) });
      return;
    }
    const ac = new AbortController();
    controllers.set(msg.id, ac);
    const ctx: NotebookEvalContext = {
      vlib,
      finvm,
      getFinvmState: () => finvmState,
      setFinvmState: (s) => {
        finvmState = s;
      },
      getEffectStorage: () => storage,
      setEffectStorage: (s) => {
        storage = s;
      },
      // Source arrives already materialized from the main thread (DOM inputs +
      // cell placeholders), so this is identity.
      materialize: (s) => s,
      onEmit: (cellId, value) => post({ type: 'emit', cellId, value }),
    };
    try {
      const outputs = await evalNotebookCells(ctx, msg.source, msg.names, {
        cell: msg.cell,
        signal: ac.signal,
      });
      post({
        type: 'result',
        id: msg.id,
        outputs,
        dbTables: effectDbTablesToFinvmState(storage.listDbTables()),
      });
    } catch (err) {
      post({ type: 'result', id: msg.id, outputs: [], error: String(err) });
    } finally {
      controllers.delete(msg.id);
    }
  }
};
