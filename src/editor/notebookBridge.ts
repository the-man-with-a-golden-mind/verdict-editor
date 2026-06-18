import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export type CellOutput = {
  name: string;
  ok: boolean;
  display?: unknown;
  json?: unknown;
  typeSig: string;
  error: string;
};

export type NotebookCellInfo = {
  id: string;
  kind: 'code' | 'wysiwyg';
  source: string;
};

export type NotebookBridge = {
  compile: (source: string) => { ok: boolean; error?: string };
  evalCells: (source: string, names: string[]) => CellOutput[] | Promise<CellOutput[]>;
  onProgramChanged: (source: string) => void;
  materialize: (source: string) => string;
  monaco: typeof monaco;
  loadPlotly: () => Promise<unknown>;
  /** Toggle shell Monaco source view (true = show shell editor, hide notebook stack). */
  setSourceMode: (on: boolean) => void;
  isSourceMode: () => boolean;
  /** Map compiler diagnostics to per-cell line errors. */
  cellDiagnostics: (source: string, cells: NotebookCellInfo[]) => Record<string, Array<{ line: number; message: string }>>;
  /** Load / save `.vnb` document JSON. */
  loadDocument: () => { cells: NotebookCellInfo[] } | null;
  saveDocument: (doc: { cells: NotebookCellInfo[] }) => void;
};

export type NotebookApi = {
  notebookSource: () => string;
  /** Code cells plus WYSIWYG as `--` comments (Visual doc-hover). */
  notebookDocumentSource: () => string;
  setSource: (source: string) => void;
  getViewMode: () => string;
};

type VerdictLib = {
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

export function createNotebookBridge(deps: {
  vlib: VerdictLib | null;
  materialize: (source: string) => string;
  onProgramChanged: (source: string) => void;
  evalCells: (source: string, names: string[]) => CellOutput[] | Promise<CellOutput[]>;
  setSourceMode: (on: boolean) => void;
  isSourceMode: () => boolean;
  cellDiagnostics: NotebookBridge['cellDiagnostics'];
  loadDocument: NotebookBridge['loadDocument'];
  saveDocument: NotebookBridge['saveDocument'];
}): NotebookBridge {
  let plotlyPromise: Promise<unknown> | null = null;
  let sourceMode = false;

  return {
    compile(source: string) {
      if (!deps.vlib) return { ok: false, error: 'Compiler not loaded' };
      try {
        const diags = deps.vlib.diagnosticsJS(deps.materialize(source));
        const errors = diags.filter((d) => d.severity !== 'warning');
        if (errors.length > 0) {
          return { ok: false, error: errors[0]?.message ?? 'Diagnostics failed' };
        }
        return { ok: true };
      } catch (e) {
        return { ok: false, error: String(e) };
      }
    },

    evalCells: deps.evalCells,

    onProgramChanged: deps.onProgramChanged,
    materialize: deps.materialize,
    monaco,

    loadPlotly() {
      if (!plotlyPromise) {
        plotlyPromise = importPublicModule('/lib/plotly.chunk.mjs').then(
          (m) => (m as { default?: unknown }).default ?? m,
        );
      }
      return plotlyPromise;
    },

    setSourceMode(on: boolean) {
      sourceMode = on;
      deps.setSourceMode(on);
    },

    isSourceMode: () => sourceMode,

    cellDiagnostics: deps.cellDiagnostics,
    loadDocument: deps.loadDocument,
    saveDocument: deps.saveDocument,
  };
}

let notebookLibPromise: Promise<{
  mountNotebook: (sel: string, bridge: NotebookBridge, initial: string) => NotebookApi | null;
}> | null = null;

async function importPublicModule(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`failed to load ${url}: ${res.status}`);
  const blobUrl = URL.createObjectURL(new Blob([await res.text()], { type: 'text/javascript' }));
  try {
    return await import(/* @vite-ignore */ blobUrl);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

export async function loadNotebookLib() {
  if (!notebookLibPromise) {
    notebookLibPromise = importPublicModule('/lib/notebook.mjs').then((m) => ({
      mountNotebook: (sel: string, bridge: NotebookBridge, initial: string) => {
        const fn = m.mountNotebook;
        if (typeof fn !== 'function') return null;
        return fn(sel, bridge, initial) as NotebookApi | null;
      },
    }));
  }
  return notebookLibPromise;
}

const VNB_STORAGE_KEY = 'verdict-notebook.vnb';

export function loadVnbFromStorage(): { cells: NotebookCellInfo[] } | null {
  try {
    const raw = localStorage.getItem(VNB_STORAGE_KEY);
    if (!raw) return null;
    const doc = JSON.parse(raw) as { cells?: NotebookCellInfo[] };
    if (!doc?.cells?.length) return null;
    return { cells: doc.cells };
  } catch {
    return null;
  }
}

export function saveVnbToStorage(doc: { cells: NotebookCellInfo[] }): void {
  localStorage.setItem(VNB_STORAGE_KEY, JSON.stringify({ cells: doc.cells }));
}
