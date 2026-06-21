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
  role?: 'runnable' | 'module' | 'asset' | 'note';
  path?: string;
  moduleName?: string | null;
  source: string;
};

export type CellsNavSection = {
  cellIndex: number;
  cellId: string;
  kind?: 'code' | 'text' | 'module' | 'asset';
  /** User-assigned cell name (shown in the nav instead of the source preview). */
  name?: string;
  preview?: string;
  running?: boolean;
  focused?: boolean;
  hasOutput?: boolean;
};

/** @deprecated use CellsNavSection */
export type GlobalOutputSection = CellsNavSection;

export type NotebookEvalCellOpts = {
  signal?: AbortSignal;
  cellId?: string;
  cellIndex?: number;
  /** Live output: called when the running cell emits a Display value to render now. */
  onEmit?: (cellId: string | undefined, value: unknown) => void;
};

export type NotebookBridge = {
  compile: (source: string) => { ok: boolean; error?: string };
  /** Per-binding compile check (matches eval path; diagnostics alone can miss reorder bugs). */
  compileCellBindings: (source: string, names: string[]) => { ok: boolean; error?: string };
  evalCells: (
    source: string,
    names: string[],
    opts?: NotebookEvalCellOpts,
  ) => CellOutput[] | Promise<CellOutput[]>;
  onProgramChanged: (source: string) => void;
  /** Substitute notebook-wide `__INPUT_*` placeholders (shared across all cells). */
  materialize: (source: string, cell?: { id?: string; index?: number }) => string;
  loadPlotly: () => Promise<unknown>;
  /** Publish cell navigation metadata for the right-side Cells panel. */
  syncCellsNav: (sections: CellsNavSection[]) => void | Promise<void>;
  /** Toggle shell source view (true = show whole-program editor, hide notebook stack). */
  setSourceMode: (on: boolean) => void;
  isSourceMode: () => boolean;
  /** Map compiler diagnostics to per-cell line errors. */
  cellDiagnostics: (source: string, cells: NotebookCellInfo[]) => Record<string, Array<{ line: number; message: string }>>;
  /** Parse-only type signatures for hover (whole program). */
  signatures: (source: string) => Array<{ name: string; signature: string }>;
  /** Eval nullary bindings for inline results (whole program). */
  evalBindings: (source: string) => Array<{ name: string; ok: boolean; value: string; error: string }>;
  /** Load / save `.vnb` document JSON. */
  loadDocument: () => { cells: NotebookCellInfo[]; seedSig?: string } | null;
  saveDocument: (doc: { cells: NotebookCellInfo[]; seedSig?: string }) => void;
  /** Binding names in a cell (astJS when available, else line scan). */
  bindingNamesInCell: (
    cellId: string,
    cells: NotebookCellInfo[],
    fullSource: string,
  ) => string[];
};

export type NotebookApi = {
  notebookSource: () => string;
  /** Code cells plus WYSIWYG as `--` comments (Visual doc-hover). */
  notebookDocumentSource: () => string;
  setSource: (source: string) => void;
  getViewMode: () => string;
  /** Re-run every code cell once (top to bottom). */
  runAll?: () => void | Promise<void>;
  /** Stop every in-flight cell run (used when the live loop is stopped). */
  stopAll?: () => void;
  /** Run / stop / focus a cell by id — driven from the merged Cells panel. */
  runCellById?: (id: string) => void | Promise<void>;
  stopCellById?: (id: string) => void;
  focusCellById?: (id: string) => void;
  deleteCellById?: (id: string) => void;
  /** Cells for per-cell Visual tab rendering. */
  notebookCells?: () => NotebookCellInfo[];
};

type VerdictLib = {
  diagnosticsJS: (src: string) => Array<{ line: number; column: number; message: string; severity: string }>;
  compileBindingEntryJS?: (
    src: string,
    entryName: string,
  ) => { ok: boolean; output: string; error: string };
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

export async function loadNotebookDisplayRenderer(): Promise<
  (host: HTMLElement, raw: unknown, bridge: NotebookBridge) => Promise<void>
> {
  const m = await importPublicModule('/lib/notebook.mjs');
  const fn = (m as { renderDisplayInto?: unknown }).renderDisplayInto;
  if (typeof fn !== 'function') {
    throw new Error('notebook.mjs missing renderDisplayInto');
  }
  return fn as (host: HTMLElement, raw: unknown, bridge: NotebookBridge) => Promise<void>;
}

export function createNotebookBridge(deps: {
  vlib: VerdictLib | null;
  materialize: (source: string, cell?: { id?: string; index?: number }) => string;
  onProgramChanged: (source: string) => void;
  evalCells: (
    source: string,
    names: string[],
    opts?: NotebookEvalCellOpts,
  ) => CellOutput[] | Promise<CellOutput[]>;
  syncCellsNav: NotebookBridge['syncCellsNav'];
  setSourceMode: (on: boolean) => void;
  isSourceMode: () => boolean;
  cellDiagnostics: NotebookBridge['cellDiagnostics'];
  loadDocument: NotebookBridge['loadDocument'];
  saveDocument: NotebookBridge['saveDocument'];
  bindingNamesInCell: NotebookBridge['bindingNamesInCell'];
}): NotebookBridge {
  let plotlyPromise: Promise<unknown> | null = null;
  let sourceMode = false;

  function compileSource(source: string): { ok: boolean; error?: string } {
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
  }

  return {
    compile: compileSource,

    compileCellBindings(source: string, names: string[]) {
      if (!deps.vlib) return { ok: false, error: 'Compiler not loaded' };
      const src = deps.materialize(source);
      const compileEntry = deps.vlib.compileBindingEntryJS;
      if (typeof compileEntry !== 'function' || names.length === 0) {
        return compileSource(source);
      }
      try {
        for (const name of names) {
          const r = compileEntry(src, name);
          if (!r.ok) return { ok: false, error: r.error || `Compile failed: ${name}` };
        }
        return { ok: true };
      } catch (e) {
        return { ok: false, error: String(e) };
      }
    },

    evalCells: deps.evalCells,
    syncCellsNav: deps.syncCellsNav,

    onProgramChanged: deps.onProgramChanged,
    materialize: deps.materialize,

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
    bindingNamesInCell: deps.bindingNamesInCell,

    signatures(source: string) {
      if (!deps.vlib) return [];
      try {
        return deps.vlib.signaturesJS(deps.materialize(source));
      } catch {
        return [];
      }
    },

    evalBindings(source: string) {
      if (!deps.vlib) return [];
      try {
        return deps.vlib.evalBindingsJS(deps.materialize(source));
      } catch {
        return [];
      }
    },
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
const VNB_FORMAT_VERSION = 3;

export function loadVnbFromStorage(): { cells: NotebookCellInfo[]; seedSig?: string; formatVersion?: number } | null {
  try {
    const raw = localStorage.getItem(VNB_STORAGE_KEY);
    if (!raw) return null;
    const doc = JSON.parse(raw) as { cells?: NotebookCellInfo[]; seedSig?: string; formatVersion?: number };
    if (!doc?.cells?.length) return null;
    return { cells: doc.cells, seedSig: doc.seedSig, formatVersion: doc.formatVersion };
  } catch {
    return null;
  }
}

export function saveVnbToStorage(doc: { cells: NotebookCellInfo[]; seedSig?: string; formatVersion?: number }): void {
  localStorage.setItem(
    VNB_STORAGE_KEY,
    JSON.stringify({ formatVersion: VNB_FORMAT_VERSION, cells: doc.cells, seedSig: doc.seedSig }),
  );
}
