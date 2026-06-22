/// <reference lib="webworker" />
// FinVM eval worker. The notebook's cell evaluation (compile + bytecode run +
// effects) is CPU-bound and was blocking the main thread on every actor tick.
// Running it here keeps the UI responsive: the worker owns the effect storage
// and the FinVM snapshot, runs evalNotebookCells, posts live `emit` values back
// for the host to render, and ships a DB-tables snapshot with each result so the
// main thread's DB tab stays current without a per-tick full-state sync.
import { evalNotebookCells, wrapVerdictLibForNotebook } from './notebookEval';
import type { NotebookEvalContext } from './notebookEval';
import {
  createEffectStorage,
  createFinvmHandlers,
  effectDbTablesToFinvmState,
  runProgramWithEffects,
} from './effectDriver';
import type { EffectStorage } from './effectDriver';
import {
  mergeNotebookFinvmState,
  sourceSignature,
  splitNotebookFinvmState,
} from './finvmSnapshot';

type EvalMsg = {
  type: 'eval';
  id: string;
  source: string;
  names: string[];
  cell?: { id?: string; index?: number };
};
type AbortMsg = { type: 'abort'; id: string };
type StateMsg = { type: 'finvmState'; id: string };
type RunProgramMsg = {
  type: 'runProgram';
  id: string;
  programJson: string;
  source: string;
  entry: string;
  persistState: boolean;
};
type InMsg = EvalMsg | AbortMsg | StateMsg | RunProgramMsg;

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
    // Merge the LIVE DB tables: a looping (endless) cell never returns, so the
    // snapshot's persisted state is stale, but the effect storage is written on
    // every tick. The DB/Debug tabs query this to see current data mid-run.
    post({
      type: 'finvmState',
      id: msg.id,
      state: { ...finvmState, '__finvm.db': effectDbTablesToFinvmState(storage.listDbTables()) },
    });
    return;
  }
  if (msg.type === 'runProgram') {
    try {
      await loadLibs();
    } catch (err) {
      post({ type: 'program', id: msg.id, ok: false, error: String(err) });
      return;
    }
    const srcSig = sourceSignature(msg.source);
    const split = msg.persistState
      ? splitNotebookFinvmState(finvmState)
      : { userState: {}, machineSnapshot: null, sourceSig: null };
    const snapshot =
      msg.persistState && split.machineSnapshot != null && split.sourceSig === srcSig
        ? split.machineSnapshot
        : undefined;
    const vmOut = await runProgramWithEffects(finvm, msg.programJson, {
      state: split.userState,
      machineSnapshot: snapshot,
      entryFunction: msg.entry,
      handlers: createFinvmHandlers(storage),
    });
    if (!vmOut.ok) {
      post({ type: 'program', id: msg.id, ok: false, error: vmOut.error });
      return;
    }
    const dbState = effectDbTablesToFinvmState(storage.listDbTables());
    finvmState = msg.persistState
      ? mergeNotebookFinvmState({
          userState: vmOut.state,
          machineSnapshot: vmOut.snapshot,
          sourceSig: srcSig,
          dbState,
        })
      : { ...finvmState, '__finvm.db': dbState };
    post({
      type: 'program',
      id: msg.id,
      ok: true,
      result: vmOut.result,
      steps: vmOut.steps,
      vmStatus: vmOut.vmStatus,
      snapshot: vmOut.snapshot,
      state: vmOut.state,
      finvmState,
    });
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
