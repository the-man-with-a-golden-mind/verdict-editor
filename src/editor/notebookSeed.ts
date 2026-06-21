// Shared notebook-seed helpers (extracted from VerdictEditor so the editor and
// the bundled templates build identical seeds). A "seed" is the initial `.vnb`
// document the notebook mounts when storage has nothing saved.

/** Bump when default notebook cells change so stale localStorage is not reused. */
export const VNB_FORMAT_VERSION = 3;

export type NotebookSeedCell = {
  source: string;
  kind?: 'code' | 'wysiwyg';
  role?: 'runnable' | 'module' | 'asset' | 'note';
  path?: string;
  moduleName?: string;
};

export type NotebookDoc = {
  formatVersion?: number;
  seedSig?: string;
  cells: Array<{
    id?: string;
    kind?: 'code' | 'wysiwyg';
    role?: 'runnable' | 'module' | 'asset' | 'note';
    path?: string;
    moduleName?: string | null;
    source: string;
  }>;
};

/** Build a `.vnb` document object (cells + content-hash seedSig) from cell specs. */
export function notebookDocFromCells(cells: Array<string | NotebookSeedCell>): NotebookDoc {
  const normalized = cells.map((cell) => (typeof cell === 'string' ? { source: cell } : cell));
  const joined = normalized.map((c) => c.source.trim()).filter(Boolean).join('\n\n');
  let h = 5381;
  for (let i = 0; i < joined.length; i++) h = ((h << 5) + h + joined.charCodeAt(i)) | 0;
  return {
    formatVersion: VNB_FORMAT_VERSION,
    seedSig: `${joined.length}:${h >>> 0}`,
    cells: normalized.map((cell) => ({
      kind: cell.kind ?? 'code',
      role: cell.role,
      path: cell.path,
      moduleName: cell.moduleName,
      source: cell.source,
    })),
  };
}

/** Same as {@link notebookDocFromCells} but serialized — what mountNotebook wants. */
export function notebookSeedFromCells(cells: Array<string | NotebookSeedCell>): string {
  return JSON.stringify(notebookDocFromCells(cells));
}

/** A minimal blank document — the zero-config default for a generic host. */
export function blankNotebookDoc(): NotebookDoc {
  return notebookDocFromCells([
    {
      source: 'module Main exposing (main)\n\nmain : String\nmain = "ready"',
      kind: 'code',
      role: 'runnable',
      path: 'Main.verdict',
      moduleName: 'Main',
    },
  ]);
}
