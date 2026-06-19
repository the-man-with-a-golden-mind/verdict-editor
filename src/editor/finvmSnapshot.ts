/** Reserved keys in the notebook/editor FinVM session blob. */
export const FINVM_SNAPSHOT_KEY = '__finvm.snapshot';
export const FINVM_DB_KEY = '__finvm.db';
export const FINVM_SOURCE_SIG_KEY = '__finvm.sourceSig';

type MachineSnapshot = {
  processes?: Array<{ pid?: string }>;
  readyQueue?: string[];
  current?: string | null;
  [key: string]: unknown;
};

export function sourceSignature(source: string): string {
  let h = 5381;
  const s = String(source || '');
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `${s.length}:${h >>> 0}`;
}

export function splitNotebookFinvmState(finvmState: Record<string, unknown>): {
  userState: Record<string, unknown>;
  machineSnapshot: unknown | null;
  sourceSig: string | null;
} {
  const {
    [FINVM_SNAPSHOT_KEY]: machineSnapshot,
    [FINVM_DB_KEY]: _db,
    [FINVM_SOURCE_SIG_KEY]: sourceSig,
    ...userState
  } = finvmState;
  return {
    userState,
    machineSnapshot: machineSnapshot ?? null,
    sourceSig: typeof sourceSig === 'string' ? sourceSig : null,
  };
}

export function mergeNotebookFinvmState(parts: {
  userState: Record<string, unknown>;
  machineSnapshot?: unknown | null;
  sourceSig?: string | null;
  dbState?: Record<string, unknown>;
}): Record<string, unknown> {
  const out: Record<string, unknown> = { ...parts.userState };
  if (parts.dbState) out[FINVM_DB_KEY] = parts.dbState;
  if (parts.machineSnapshot != null) out[FINVM_SNAPSHOT_KEY] = parts.machineSnapshot;
  if (parts.sourceSig) out[FINVM_SOURCE_SIG_KEY] = parts.sourceSig;
  return out;
}

export function registerCountForFunction(programJson: string, fn = 'main'): number {
  try {
    const p = JSON.parse(programJson) as { functions?: Record<string, { registerCount?: number }> };
    const rc = p.functions?.[fn]?.registerCount;
    return typeof rc === 'number' && rc > 0 ? rc : 16;
  } catch {
    return 16;
  }
}

/** Replace the `main` process so a new cell binding can run without resetting other actors. */
export function rebootMainInSnapshot(
  snapshot: unknown,
  entryFunction = 'main',
  registerCount = 16,
): unknown {
  const snap = JSON.parse(JSON.stringify(snapshot)) as MachineSnapshot;
  const others = (snap.processes ?? []).filter((p) => p.pid !== 'main');
  snap.processes = [
    {
      pid: 'main',
      status: { s: 'ready' },
      function: entryFunction,
      frame: {
        function: entryFunction,
        pc: 0,
        registers: Array.from({ length: registerCount }, () => null),
        returnRegister: null,
        caller: null,
      },
      callStack: [],
      mailbox: [],
      links: [],
      remoteLinks: [],
      monitors: [],
      parent: null,
      children: [],
      trapExit: false,
      name: 'main',
      result: null,
      error: null,
      createdSequence: 0,
      stepsExecuted: 0,
    },
    ...others,
  ];
  snap.readyQueue = ['main'];
  snap.current = 'main';
  return snap;
}

export function countLiveProcesses(snapshot: unknown): number {
  if (!snapshot || typeof snapshot !== 'object') return 0;
  const procs = (snapshot as MachineSnapshot).processes ?? [];
  return procs.filter((p) => {
    const status = (p as { status?: { s?: string } }).status;
    const tag = status && typeof status === 'object' ? status.s : undefined;
    return tag === 'ready' || tag === 'running' || tag === 'waiting';
  }).length;
}

export function findProcess(snapshot: unknown, pid: string): { status?: unknown; function?: string } | null {
  if (!snapshot || typeof snapshot !== 'object') return null;
  const procs = (snapshot as MachineSnapshot).processes ?? [];
  return (procs.find((p) => p.pid === pid) as { status?: unknown; function?: string }) ?? null;
}
