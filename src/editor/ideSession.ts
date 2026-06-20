import type { EffectStorage } from './effectDriver';
import { splitNotebookFinvmState } from './finvmSnapshot';

export const IDE_GLOBAL_FN = 'ideGlobalLoop';
export const IDE_GLOBAL_CACHE_KEY = 'global';

type MachineSnapshot = {
  processes?: Array<{ pid?: string; function?: string }>;
};

/** Find the notebook session IDE global actor pid in a FinVM snapshot. */
export function findIdeGlobalPid(snapshot: unknown): string | null {
  if (!snapshot || typeof snapshot !== 'object') return null;
  for (const p of (snapshot as MachineSnapshot).processes ?? []) {
    if (p.function === IDE_GLOBAL_FN && typeof p.pid === 'string') return p.pid;
  }
  return null;
}

/** Persist IDE global ProcessRef in effect cache so later cells can MkActorRef(cacheGet(...)). */
export function syncIdeGlobalProcCache(
  finvmState: Record<string, unknown>,
  storage: EffectStorage,
): void {
  const { machineSnapshot } = splitNotebookFinvmState(finvmState);
  const pid = findIdeGlobalPid(machineSnapshot);
  if (!pid) return;
  storage.cacheSet('ide', IDE_GLOBAL_CACHE_KEY, { proc: pid });
}

export function usesIdeLibrary(source: string): boolean {
  return /\b(ensureGlobal|bootGlobal|registerWorker|ask\b|idePut|ideGet)\b/.test(source);
}

/** Host substitutes __IDE_CELL_ID__ / __IDE_CELL_INDEX__ when a cell runs. */
export function materializeIdeCellPlaceholders(
  source: string,
  cell?: { id?: string; index?: number },
  _finvmState?: Record<string, unknown>,
): string {
  const cellId = cell?.id ?? '';
  const cellIndex = cell?.index ?? 0;
  const esc = cellId.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return source
    .replaceAll('__IDE_CELL_ID__', `"${esc}"`)
    .replaceAll('__IDE_CELL_INDEX__', String(cellIndex));
}
