// Main-thread client for the FinVM eval worker. Mirrors the shape the notebook
// bridge expects (evalCells) but runs the work off the main thread so heavy
// actor ticks never freeze the UI. Emits stream back during the eval and are
// routed to the per-cell handler; the result carries a DB snapshot for the DB
// tab; the full VM snapshot is fetched on demand (Debug tab only).
import type { CellOutput } from './notebookEval';
import type { NotebookEvalCellOpts } from './notebookBridge';

type EvalResult = { outputs: CellOutput[]; dbTables?: unknown; error?: string };

export class FinvmWorkerClient {
  private worker: Worker;
  private counter = 0;
  private pending = new Map<string, (r: EvalResult) => void>();
  private emitHandlers = new Map<string, (cellId: string | undefined, value: unknown) => void>();
  private stateResolvers = new Map<string, (s: Record<string, unknown>) => void>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private programResolvers = new Map<string, (r: any) => void>();

  constructor() {
    this.worker = new Worker(new URL('./finvmWorker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (e: MessageEvent) => {
      const m = e.data;
      if (m?.type === 'emit') {
        this.emitHandlers.get(String(m.cellId ?? ''))?.(m.cellId, m.value);
      } else if (m?.type === 'result') {
        const resolve = this.pending.get(m.id);
        if (resolve) {
          this.pending.delete(m.id);
          resolve({ outputs: m.outputs ?? [], dbTables: m.dbTables, error: m.error });
        }
      } else if (m?.type === 'finvmState') {
        const r = this.stateResolvers.get(m.id);
        if (r) {
          this.stateResolvers.delete(m.id);
          r(m.state ?? {});
        }
      } else if (m?.type === 'program') {
        const r = this.programResolvers.get(m.id);
        if (r) {
          this.programResolvers.delete(m.id);
          r(m);
        }
      }
    };
  }

  async evalCells(
    source: string,
    names: string[],
    opts?: NotebookEvalCellOpts,
  ): Promise<{ outputs: CellOutput[]; dbTables?: unknown }> {
    const id = String(++this.counter);
    const cellKey = String(opts?.cellId ?? '');
    if (opts?.onEmit) this.emitHandlers.set(cellKey, opts.onEmit);
    const onAbort = () => this.worker.postMessage({ type: 'abort', id });
    opts?.signal?.addEventListener('abort', onAbort, { once: true });
    try {
      const result = await new Promise<EvalResult>((resolve) => {
        this.pending.set(id, resolve);
        this.worker.postMessage({
          type: 'eval',
          id,
          source,
          names,
          cell: { id: opts?.cellId, index: opts?.cellIndex },
        });
      });
      if (result.error) throw new Error(result.error);
      return { outputs: result.outputs, dbTables: result.dbTables };
    } finally {
      opts?.signal?.removeEventListener('abort', onAbort);
      this.emitHandlers.delete(cellKey);
    }
  }

  getFinvmState(): Promise<Record<string, unknown>> {
    const id = String(++this.counter);
    return new Promise((resolve) => {
      this.stateResolvers.set(id, resolve);
      this.worker.postMessage({ type: 'finvmState', id });
    });
  }

  runProgram(
    programJson: string,
    source: string,
    entry: string,
    persistState: boolean,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    const id = String(++this.counter);
    return new Promise((resolve) => {
      this.programResolvers.set(id, resolve);
      this.worker.postMessage({ type: 'runProgram', id, programJson, source, entry, persistState });
    });
  }
}
