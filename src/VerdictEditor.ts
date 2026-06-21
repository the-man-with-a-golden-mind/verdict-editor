import { createVerdictEditor } from './editor/verdictCm/VerdictCmEditor.js';
import { extractVerdictDocs } from './editor/verdictCm/VerdictLanguageService.js';
import {
  mergeNotebookFinvmState,
  sourceSignature,
  splitNotebookFinvmState,
} from './editor/finvmSnapshot';
import {
  createEffectStorage,
  createFinvmHandlers,
  effectDbTablesToFinvmState,
  runProgramWithEffects,
  type EffectStorage,
} from './editor/effectDriver';
import { FinvmWorkerClient } from './editor/finvmClient';
import {
  escapeHtml,
  extractDbTables,
  formatVmValue,
  renderJsonForPanel,
  runDbQuery,
  toVerdictLiteral,
} from './editor/runtimeUtils';
import { installArrowOverlay } from './editor/vizArrows';
import {
  createNotebookBridge,
  loadNotebookDisplayRenderer,
  loadNotebookLib,
  loadVnbFromStorage,
  saveVnbToStorage,
  type CellsNavSection,
  type NotebookApi,
  type NotebookBridge,
} from './editor/notebookBridge';
import {
  evalNotebookCells,
  mapDiagnosticsToCells,
  wrapVerdictLibForNotebook,
} from './editor/notebookEval';
import { bindingNamesInCell as resolveNotebookBindingNames } from './editor/notebookBindings';
import { materializeIdeCellPlaceholders } from './editor/ideSession';
import { DEFAULT_NOTEBOOK_DECISION_CELL_LINES } from './editor/defaultNotebookDecisionCell.mjs';
import { DEFAULT_NOTEBOOK_SIM_CELL_LINES } from './editor/defaultNotebookSimCell.mjs';
import defaultMarketSource from '../lib/verdict/Market.verdict?raw';
import { extractDocs, gasFromBytecode, renderCallGraph, type GasInfo } from './editor/vizGraph';
import {
  collapsedDefKey,
  mappedCellForLine,
  notebookCellsToVizModules,
  type VizNotebookCell,
} from './editor/vizCells';

declare global {
  interface Window {
    TypeSigRenderer?: {
      renderSignature: (name: string, sig: string, ast: unknown, options?: { className?: string }) => SVGElement;
    };
  }
}

// Shared monospace stack for every editor surface in the app.
const FONT_MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

/** Bump when default notebook cells change so stale localStorage is not reused. */
const VNB_FORMAT_VERSION = 3;

type NotebookSeedCell = {
  source: string;
  kind?: 'code' | 'wysiwyg';
  role?: 'runnable' | 'module' | 'asset' | 'note';
  path?: string;
  moduleName?: string;
};

function notebookSeedFromCells(cells: Array<string | NotebookSeedCell>): string {
  const normalized = cells.map((cell) => typeof cell === 'string' ? { source: cell } : cell);
  const joined = normalized.map((c) => c.source.trim()).filter(Boolean).join('\n\n');
  let h = 5381;
  for (let i = 0; i < joined.length; i++) h = ((h << 5) + h + joined.charCodeAt(i)) | 0;
  return JSON.stringify({
    formatVersion: VNB_FORMAT_VERSION,
    seedSig: `${joined.length}:${h >>> 0}`,
    cells: normalized.map((cell) => ({
      kind: cell.kind ?? 'code',
      role: cell.role,
      path: cell.path,
      moduleName: cell.moduleName,
      source: cell.source,
    })),
  });
}

// Base classes for the editor status bar; setStatus appends the state colour.
const STATUS_BASE = 'flex h-7 shrink-0 items-center gap-1.5 px-4 text-xs font-mono bg-slate-950 border-t border-slate-800';

// A consistent panel-section header: a tracked uppercase eyebrow on the left and
// an optional muted hint on the right. Used for the editor and bytecode panes.
function sectionHeader(label: string, hint?: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'flex items-center justify-between px-4 py-1.5 bg-slate-950 border-y border-slate-800';
  const l = document.createElement('span');
  l.className = 'text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500';
  l.textContent = label;
  el.appendChild(l);
  if (hint) {
    const h = document.createElement('span');
    h.className = 'text-[10px] font-mono text-slate-600';
    h.textContent = hint;
    el.appendChild(h);
  }
  return el;
}

// The Verdict compiler/runtime (verdict.mjs) plus the FinVM browser runtime
// (finvm.mjs) are prebuilt, minified
// PureScript bundle served verbatim from /public/lib. We load it at runtime as a
// raw asset rather than `import`ing it as source, because Vite's dev transform
// appends a multi-megabyte inline sourcemap to every served source module — for
// this blob that map is ~4.4MB of useless base64 (it maps into generated JS, not
// Verdict code). Served raw from /public there is no transform and no sourcemap;
// it also stays out of the editor JS chunk.
//
// verdict.mjs covers everything the editor needs: compile, diagnostics,
// signatures, per-binding eval, and run-with-logs (on the reference VM, which —
// unlike the FinVM bytecode VM in finvm.mjs — implements sysLog/http/db/etc.).
let vlib: any = null;
let finvmLib: any = null;
let libsPromise: Promise<void> | null = null;

// Fetch a /public ESM file as text and import it via a blob URL. This sidesteps
// Vite's module pipeline completely (a plain `fetch` is not a module-graph
// import, so Vite neither transforms it nor appends the inline dev sourcemap),
// while still giving us the module's named exports. The blob is self-contained
// (no bare imports), so a blob-URL import resolves with nothing else to fetch.
async function importPublicModule(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`failed to load ${url}: ${res.status}`);
  const blobUrl = URL.createObjectURL(
    new Blob([await res.text()], { type: 'text/javascript' }),
  );
  try {
    return await import(/* @vite-ignore */ blobUrl);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

function loadVerdictLibs(): Promise<void> {
  if (!libsPromise) {
    libsPromise = Promise.all([
      importPublicModule('/lib/verdict.mjs'),
      importPublicModule('/lib/verdict-notebook.mjs'),
      importPublicModule('/lib/finvm.mjs'),
    ]).then(([v, vn, f]) => {
      vlib = wrapVerdictLibForNotebook(v, vn);
      finvmLib = f;
    });
  }
  return libsPromise;
}

// The code-block visualizer (hylograph-vis.mjs) exposes `renderCode(selector,
// ast)` which builds nested HTML blocks from the compiler's `astJS` output.
// Loaded lazily the first time the Visual tab is opened, same raw-asset path as
// the compiler/VM blobs above.
let hyloLib: any = null;
let hyloPromise: Promise<void> | null = null;

function loadHyloLib(): Promise<void> {
  if (!hyloPromise) {
    hyloPromise = importPublicModule('/lib/hylograph-vis.mjs').then((m) => {
      hyloLib = m;
    });
  }
  return hyloPromise;
}

// Separate "analysis" compiler bundle for the Visual tab only. It carries the
// `astJS` export (structure for the block view) and is decoupled from the run
// bundle (verdict.mjs) on purpose: the run bundle is the effect-based generation
// that matches finvm.mjs/effectDriver, while this one is rebuilt from current
// source. astJS only PARSES (no bytecode/IO), so the effect-vs-builtin split is
// irrelevant to it — keeping run and visualization on their respective bundles.
let astLib: any = null;
let astLibPromise: Promise<void> | null = null;

function loadAstLib(): Promise<void> {
  if (!astLibPromise) {
    astLibPromise = importPublicModule('/lib/verdict-ast.mjs').then((m) => {
      astLib = m;
    });
  }
  return astLibPromise;
}

// Compiler diagnostics use 1-based line/column positions.
interface VerdictDiagnostic {
  line: number;
  column: number;
  severity: string;
  message: string;
}

// A top-level binding's name and rendered type signature, for hover.
interface VerdictSignature {
  name: string;
  signature: string;
}

// The evaluated value of one nullary top-level binding (the notebook seed).
interface VerdictBindingResult {
  name: string;
  ok: boolean;
  value: string;
  error: string;
}

type VerdictCmHandle = {
  destroy(): void;
  getValue(): string;
  setValue(text: string): void;
  focus(): void;
  layout(): void;
  refreshLanguageService(): void;
  revealLine(line: number): void;
};

class VerdictEditorElement extends HTMLElement {
  private activeSideTab: 'cells' | 'inputs' = 'cells';
  private activeMainTab: 'editor' | 'db' | 'debug' | 'visual' = 'editor';
  private editor: VerdictCmHandle | null = null;
  private bytecodeEditor: VerdictCmHandle | null = null;
  private container!: HTMLDivElement;
  /** Source-mode run results (below the shell editor — not a side tab). */
  private programOutputHost!: HTMLDivElement;
  private cellsPanel: HTMLDivElement | null = null;
  private cellsNavHost: HTMLDivElement | null = null;
  private notebookBridgeRef: NotebookBridge | null = null;
  private renderNotebookDisplay:
    | ((host: HTMLElement, raw: unknown, bridge: NotebookBridge) => Promise<void>)
    | null = null;
  private inputsPanel: HTMLDivElement | null = null;
  private dbPanel: HTMLDivElement | null = null;
  private debugPanel: HTMLDivElement | null = null;
  private debugVizPanel: HTMLDivElement | null = null;
  private vmObserverPanel: HTMLDivElement | null = null;
  private vmDbPanel: HTMLDivElement | null = null;
  private codeVisPanel: HTMLDivElement | null = null;
  private vizPanel: HTMLDivElement | null = null;
  private vizRoot: HTMLDivElement | null = null;
  private vizDirty = true;
  private vizListenersAttached = false;
  private vizCleanup: (() => void) | null = null;
  private collapsedDefs = new Set<string>();
  private collapsedVizModules = new Set<string>();
  private vizMode: 'blocks' | 'map' = 'blocks';
  private inputsPreview: HTMLDivElement | null = null;
  private inputsList: HTMLDivElement | null = null;
  private dbQueryInput: HTMLInputElement | null = null;
  private dbQueryOutput: HTMLDivElement | null = null;
  private vmStatePanel: HTMLDivElement | null = null;
  private loadingWrap: HTMLDivElement | null = null;
  private loadingLabel: HTMLDivElement | null = null;
  private mainContainer!: HTMLDivElement;
  private leftPane: HTMLDivElement | null = null;
  private rightPane: HTMLDivElement | null = null;
  private sourceToggleBtn: HTMLButtonElement | null = null;
  private resizeCleanup: (() => void) | null = null;
  private statusBar!: HTMLDivElement;
  private symbolInput: HTMLInputElement | null = null;
  private assetsCsvInput: HTMLInputElement | null = null;
  private signalThresholdInput: HTMLInputElement | null = null;
  private positionBiasInput: HTMLInputElement | null = null;
  private loopIntervalInput: HTMLInputElement | null = null;
  private historyCapInput: HTMLInputElement | null = null;
  private telegramBotTokenInput: HTMLInputElement | null = null;
  private telegramChatIdInput: HTMLInputElement | null = null;
  private runToggleBtn: HTMLButtonElement | null = null;
  private liveIntervalInput: HTMLInputElement | null = null;
  // Live loop: when active, re-run every cell every `liveIntervalMs`. Each tick
  // runs runProgram() (-> notebookApi.runAll()), which executes every cell
  // against the shared FinVM session, so cell 1 fetches+strategizes and cell 2
  // re-simulates on its own. `liveTimer` is the scheduled next tick; `liveBusy`
  // guards against overlapping ticks when a run takes longer than the interval.
  private liveTimer: number | null = null;
  private liveActive = false;
  private liveBusy = false;
  private liveIntervalMs = 5000;
  private diagnosticsTimer: number | null = null;
  private busyCount = 0;
  private finvmState: Record<string, unknown> = {};
  private effectStorage: EffectStorage | null = null;
  private finvmWorker: FinvmWorkerClient | null = null;
  private finvmWorkerFailed = false;
  private languageAnalysisSig = '';
  private languageAnalysis = {
    diagnostics: [] as VerdictDiagnostic[],
    signatures: [] as VerdictSignature[],
    evalBindings: [] as VerdictBindingResult[],
    docs: new Map<string, string>(),
  };
  private latestCompiledProgram: unknown = null;
  private latestVmSnapshot: unknown = null;
  private lastVmSteps = 0;
  private vmMetricsHistory: Array<{ memoryBytes: number; load: number; tables: number; rows: number; regs: number; threshold: number }> = [];
  private minardLoaded = false;
  private minardLoading: Promise<boolean> | null = null;
  private built = false;
  private notebookHost: HTMLDivElement | null = null;
  private notebookApi: NotebookApi | null = null;
  private defaultNotebookSeed = '';
  private syncingNotebook = false;
  private notebookSourceMode = false;

  protected isDebugView(): boolean {
    return false;
  }

  // NOTE: a custom element's constructor must NOT add attributes or children
  // (the spec forbids it, and `document.createElement` enforces it — ps-spa's
  // vdom calls that, so violating it crashes the whole render). All DOM and
  // editor setup therefore lives in connectedCallback, guarded to run once.

  connectedCallback() {
    if (this.built) return;
    this.built = true;
    // Start fetching the compiler/VM blobs as early as possible, in parallel
    // with building the DOM and CodeMirror editors.
    loadVerdictLibs();
    this.build();
  }

  private async build() {
    this.style.display = 'block';
    this.style.width = '100%';
    this.style.height = '100%';

    this.mainContainer = document.createElement('div');
    this.mainContainer.className = 'flex h-full w-full overflow-hidden bg-[#0b0f1a] text-slate-200';

    // Left pane: editor on top, a thin diagnostics status bar underneath.
    const leftPane = document.createElement('div');
    leftPane.className = 'flex flex-col border-r border-slate-800 min-w-0 grow';
    leftPane.style.flexBasis = '72%';
    this.leftPane = leftPane;

    this.container = document.createElement('div');
    this.container.className = 'flex-1 min-h-0';

    // A small editor-pane header and main tabs (Notebook / DB / Visual / Debug).
    const editorHeader = sectionHeader('Workspace', 'Main.verdict');
    const mainTabBar = document.createElement('div');
    mainTabBar.className = 'flex items-center gap-1 border-b border-slate-800 bg-slate-950 px-2 py-1.5';
    const mkMainTabBtn = (id: 'editor' | 'db' | 'debug' | 'visual', label: string) => {
      const btn = document.createElement('button');
      btn.dataset.mainTabId = id;
      btn.className = 'rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider';
      btn.textContent = label;
      btn.onclick = () => this.setActiveMainTab(id);
      return btn;
    };
    mainTabBar.appendChild(mkMainTabBtn('editor', 'Notebook'));
    mainTabBar.appendChild(mkMainTabBtn('db', 'DB'));
    mainTabBar.appendChild(mkMainTabBtn('visual', 'Visual'));
    mainTabBar.appendChild(mkMainTabBtn('debug', 'Debug'));
    const sourceSpacer = document.createElement('div');
    sourceSpacer.className = 'flex-1';
    mainTabBar.appendChild(sourceSpacer);
    this.sourceToggleBtn = document.createElement('button');
    this.sourceToggleBtn.type = 'button';
    this.sourceToggleBtn.dataset.sourceToggle = '1';
    this.sourceToggleBtn.className =
      'rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:border-indigo-400/50 hover:text-white';
    this.sourceToggleBtn.textContent = 'Source';
    this.sourceToggleBtn.onclick = () => {
      this.notebookBridgeRef?.setSourceMode(!this.notebookSourceMode);
    };
    mainTabBar.appendChild(this.sourceToggleBtn);

    this.statusBar = document.createElement('div');
    this.statusBar.className = STATUS_BASE + ' text-slate-500';
    this.statusBar.textContent = 'Ready';

    leftPane.appendChild(editorHeader);
    leftPane.appendChild(mainTabBar);
    this.notebookHost = document.createElement('div');
    this.notebookHost.id = 'verdict-notebook-host';
    this.notebookHost.className = 'flex-1 min-h-0 overflow-hidden';
    leftPane.appendChild(this.notebookHost);
    leftPane.appendChild(this.container);
    this.container.classList.add('hidden');

    this.programOutputHost = document.createElement('div');
    this.programOutputHost.dataset.programOutput = '1';
    this.programOutputHost.className =
      'hidden shrink-0 max-h-44 overflow-auto border-t border-slate-800/80 bg-slate-950 px-4 py-3 font-mono text-sm leading-relaxed';
    this.programOutputHost.innerHTML =
      '<div class="text-slate-600 italic">Press Run to compile and execute the whole program.</div>';
    leftPane.appendChild(this.programOutputHost);

    this.dbPanel = document.createElement('div');
    this.dbPanel.className = 'hidden flex-1 min-h-0 overflow-auto bg-[#0b0f1a] p-3';
    const dbWrap = document.createElement('div');
    dbWrap.className = 'flex h-full flex-col gap-2';
    const dbHint = document.createElement('div');
    dbHint.className = 'text-[11px] text-slate-400';
    dbHint.textContent = 'Query syntax: tables | table <name> | get <name> <id> | find <name> <text>';
    const dbQueryRow = document.createElement('div');
    dbQueryRow.className = 'flex items-center gap-2';
    this.dbQueryInput = document.createElement('input');
    this.dbQueryInput.className = 'flex-1 rounded border border-slate-800 bg-slate-950 px-2 py-1.5 font-mono text-xs text-slate-200 outline-none focus:border-indigo-400';
    this.dbQueryInput.placeholder = 'tables';
    this.dbQueryInput.value = 'tables';
    const dbRunBtn = document.createElement('button');
    dbRunBtn.className = 'rounded border border-indigo-500/40 bg-indigo-500/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-200';
    dbRunBtn.textContent = 'Run Query';
    dbRunBtn.onclick = () => this.refreshDbQueryOutput();
    this.dbQueryInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.refreshDbQueryOutput();
      }
    };
    dbQueryRow.appendChild(this.dbQueryInput);
    dbQueryRow.appendChild(dbRunBtn);
    this.dbQueryOutput = document.createElement('div');
    this.dbQueryOutput.className = 'flex-1 overflow-auto rounded border border-slate-800 bg-slate-950 p-2 font-mono text-xs text-slate-300';
    dbWrap.appendChild(dbHint);
    dbWrap.appendChild(dbQueryRow);
    dbWrap.appendChild(this.dbQueryOutput);
    this.dbPanel.appendChild(dbWrap);
    leftPane.appendChild(this.dbPanel);

    this.debugPanel = document.createElement('div');
    this.debugPanel.className = 'hidden flex-1 min-h-0 overflow-auto bg-[#0b0f1a] p-3';
    const debugWrap = document.createElement('div');
    debugWrap.className = 'flex h-full min-h-0 flex-col gap-2';
    const debugHint = document.createElement('div');
    debugHint.className = 'text-[11px] text-slate-400';
    debugHint.textContent = 'VM debug data only (state, bytecode, and DB). Visualizations removed.';
    const bytecodeContainer = document.createElement('div');
    bytecodeContainer.className = 'h-[220px] min-h-[220px] rounded border border-slate-800 overflow-hidden';
    this.vmStatePanel = document.createElement('div');
    this.vmStatePanel.className = 'h-[220px] min-h-[220px] overflow-auto rounded border border-slate-800 bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-300';
    this.vmStatePanel.innerHTML = '<div class="text-slate-600 italic">Run program to inspect state.</div>';
    this.vmDbPanel = document.createElement('div');
    this.vmDbPanel.className = 'h-[180px] min-h-[180px] overflow-auto rounded border border-slate-800 bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-300';
    this.vmDbPanel.innerHTML = '<div class="text-slate-600 italic">Run program to inspect VM DB tables.</div>';
    this.vmObserverPanel = null;
    this.debugVizPanel = null;

    const mkAccordion = (title: string, subtitle: string, body: HTMLElement, open = false) => {
      const details = document.createElement('details');
      details.className = 'rounded border border-slate-800 bg-slate-950/50';
      details.open = open;
      const summary = document.createElement('summary');
      summary.className = 'cursor-pointer list-none select-none px-3 py-2';
      summary.innerHTML = `<div class="flex items-center justify-between"><span class="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">${escapeHtml(title)}</span><span class="text-[10px] font-mono text-slate-600">${escapeHtml(subtitle)}</span></div>`;
      details.appendChild(summary);
      const bodyWrap = document.createElement('div');
      bodyWrap.className = 'px-3 pb-3';
      bodyWrap.appendChild(body);
      details.appendChild(bodyWrap);
      return details;
    };

    debugWrap.appendChild(debugHint);
    debugWrap.appendChild(mkAccordion('FinVM Bytecode', 'JSON', bytecodeContainer, true));
    debugWrap.appendChild(mkAccordion('VM State Snapshot', 'runJsonProgram', this.vmStatePanel, true));
    debugWrap.appendChild(mkAccordion('VM DB', 'tables / rows', this.vmDbPanel, false));
    this.debugPanel.appendChild(debugWrap);
    leftPane.appendChild(this.debugPanel);
    this.codeVisPanel = null;

    // Visual tab: a non-editable view of the user's code. Two modes — "Blocks"
    // (nested-block sketch, rendered by the PureScript renderer from the AST) and
    // "Map" (the call graph with per-function gas, host-rendered).
    this.vizPanel = document.createElement('div');
    this.vizPanel.className = 'hidden flex-1 min-h-0 flex flex-col bg-[#0b0f1a]';

    const vizHeader = document.createElement('div');
    vizHeader.className = 'flex items-center gap-1 border-b border-slate-800 bg-slate-950 px-2 py-1.5';
    const mkVizModeBtn = (mode: 'blocks' | 'map', label: string) => {
      const btn = document.createElement('button');
      btn.dataset.vizMode = mode;
      btn.textContent = label;
      btn.onclick = () => this.setVizMode(mode);
      return btn;
    };
    vizHeader.appendChild(mkVizModeBtn('blocks', 'Blocks'));
    vizHeader.appendChild(mkVizModeBtn('map', 'Map'));

    const vizScroll = document.createElement('div');
    vizScroll.className = 'flex-1 min-h-0 overflow-auto';
    const vizRoot = document.createElement('div');
    vizRoot.id = 'verdict-viz-root';
    vizRoot.className = 'min-h-full';
    vizRoot.innerHTML = '<div class="p-4 text-slate-500 italic">Open this tab to see your code.</div>';
    vizScroll.appendChild(vizRoot);
    this.vizRoot = vizRoot;

    this.vizPanel.appendChild(vizHeader);
    this.vizPanel.appendChild(vizScroll);
    leftPane.appendChild(this.vizPanel);
    this.updateVizModeButtons();

    leftPane.appendChild(this.statusBar);

    const rightPanel = document.createElement('div');
    rightPanel.className = 'flex flex-col min-w-0 shrink-0 bg-slate-900/60';
    rightPanel.style.flexBasis = '28%';
    this.rightPane = rightPanel;

    // Toolbar: run actions and output mode.
    const toolbar = document.createElement('div');
    toolbar.className = 'flex items-center justify-between gap-2 px-3 py-2 bg-slate-950 border-b border-slate-800';

    const toolbarLabel = document.createElement('span');
    toolbarLabel.className = 'text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500';
    toolbarLabel.textContent = this.isDebugView() ? 'Debug Runtime' : 'Runtime';

    const toolbarActions = document.createElement('div');
    toolbarActions.className = 'flex items-center gap-2';

    toolbar.appendChild(toolbarLabel);
    toolbar.appendChild(toolbarActions);

    // Runtime busy/progress strip is debug-only. Main editor should stay clean.
    if (this.isDebugView()) {
      this.loadingWrap = document.createElement('div');
      this.loadingWrap.className = 'hidden border-b border-slate-800 bg-slate-950/70 px-3 py-1.5';
      this.loadingLabel = document.createElement('div');
      this.loadingLabel.className = 'mb-1 text-[10px] font-mono text-slate-400';
      this.loadingLabel.textContent = 'Loading...';
      const loadingTrack = document.createElement('div');
      loadingTrack.className = 'h-1.5 w-full overflow-hidden rounded bg-slate-800';
      const loadingFill = document.createElement('div');
      loadingFill.className = 'h-full w-full animate-pulse bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-500';
      loadingTrack.appendChild(loadingFill);
      this.loadingWrap.appendChild(this.loadingLabel);
      this.loadingWrap.appendChild(loadingTrack);
    } else {
      this.loadingWrap = null;
      this.loadingLabel = null;
    }

    const startStopRow = document.createElement('div');
    startStopRow.className = 'flex items-center gap-2 px-3 py-2 border-b border-slate-800 bg-slate-950/70';
    this.runToggleBtn = document.createElement('button');
    this.runToggleBtn.className =
      'inline-flex items-center rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200 transition-colors hover:bg-emerald-500/25';
    this.runToggleBtn.textContent = 'Run';
    this.runToggleBtn.onclick = () => {
      this.toggleLiveLoop();
    };
    startStopRow.appendChild(this.runToggleBtn);

    // Live-loop interval (seconds): every tick re-runs all cells. Default 5s.
    const everyLabel = document.createElement('span');
    everyLabel.className = 'text-[10px] font-bold uppercase tracking-wider text-slate-500';
    everyLabel.textContent = 'every';
    this.liveIntervalInput = document.createElement('input');
    this.liveIntervalInput.type = 'number';
    this.liveIntervalInput.min = '1';
    this.liveIntervalInput.value = '5';
    this.liveIntervalInput.setAttribute('aria-label', 'Live re-run interval in seconds');
    this.liveIntervalInput.className =
      'w-12 rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-[10px] font-mono text-slate-300 outline-none focus:border-indigo-400';
    this.liveIntervalInput.oninput = () => this.onLiveIntervalChanged();
    const secLabel = document.createElement('span');
    secLabel.className = 'text-[10px] font-bold uppercase tracking-wider text-slate-500';
    secLabel.textContent = 's';
    startStopRow.appendChild(everyLabel);
    startStopRow.appendChild(this.liveIntervalInput);
    startStopRow.appendChild(secLabel);

    const tabBar = document.createElement('div');
    tabBar.className = 'flex items-center gap-1 border-b border-slate-800 bg-slate-950 px-2 py-1.5';
    const mkTabBtn = (id: 'cells' | 'inputs', label: string) => {
      const btn = document.createElement('button');
      btn.className = 'rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider';
      btn.textContent = label;
      btn.dataset.tabId = id;
      btn.onclick = () => this.setActiveSideTab(id);
      return btn;
    };
    tabBar.appendChild(mkTabBtn('cells', 'Cells'));
    tabBar.appendChild(mkTabBtn('inputs', 'Inputs'));

    this.cellsPanel = document.createElement('div');
    this.cellsPanel.className = 'flex flex-1 min-h-0 overflow-auto bg-[#0b0f1a] p-3';
    this.cellsNavHost = document.createElement('div');
    this.cellsNavHost.dataset.cellsNav = '1';
    this.cellsNavHost.className = 'flex flex-col gap-1.5';
    this.cellsNavHost.innerHTML =
      '<div class="text-xs italic text-slate-600">Per-cell navigation. Inputs and DB are shared across the notebook.</div>';
    this.cellsPanel.appendChild(this.cellsNavHost);

    this.inputsPanel = document.createElement('div');
    this.inputsPanel.className = 'hidden flex-1 min-h-0 overflow-auto bg-[#0b0f1a] p-3';
    const inputsWrap = document.createElement('div');
    inputsWrap.className = 'flex h-full flex-col gap-2';
    const inputsHint = document.createElement('div');
    inputsHint.className = 'text-[11px] text-slate-400';
    inputsHint.textContent =
      'Notebook-wide inputs — every cell sees the same __INPUT_key__ values when you run. Like DB, inputs are shared; Visual is per cell.';
    const fixedInputs = document.createElement('div');
    fixedInputs.className = 'grid grid-cols-[auto,1fr] gap-x-2 gap-y-2 rounded border border-slate-800 bg-slate-950 p-2';
    const mkLabel = (text: string) => {
      const l = document.createElement('label');
      l.className = 'self-center text-[11px] font-mono text-slate-400';
      l.textContent = text;
      return l;
    };
    this.symbolInput = document.createElement('input');
    this.symbolInput.className = 'w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-mono text-slate-300 outline-none focus:border-indigo-400';
    this.symbolInput.value = 'BTCUSD';
    this.symbolInput.setAttribute('aria-label', 'Binance symbol');
    this.symbolInput.oninput = () => this.onRuntimeInputsChanged();
    this.assetsCsvInput = document.createElement('input');
    this.assetsCsvInput.className = 'w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-mono text-slate-300 outline-none focus:border-indigo-400';
    this.assetsCsvInput.value = 'BTCUSD,ETHUSD,ADAUSD';
    this.assetsCsvInput.setAttribute('aria-label', 'Assets CSV');
    this.assetsCsvInput.oninput = () => this.onRuntimeInputsChanged();
    this.signalThresholdInput = document.createElement('input');
    this.signalThresholdInput.type = 'number';
    this.signalThresholdInput.className = 'w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-mono text-slate-300 outline-none focus:border-indigo-400';
    this.signalThresholdInput.value = '2';
    this.signalThresholdInput.setAttribute('aria-label', 'Signal threshold');
    this.signalThresholdInput.oninput = () => this.onRuntimeInputsChanged();
    this.positionBiasInput = document.createElement('input');
    this.positionBiasInput.type = 'number';
    this.positionBiasInput.className = 'w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-mono text-slate-300 outline-none focus:border-indigo-400';
    this.positionBiasInput.value = '0';
    this.positionBiasInput.setAttribute('aria-label', 'Position bias');
    this.positionBiasInput.oninput = () => this.onRuntimeInputsChanged();
    this.loopIntervalInput = document.createElement('input');
    this.loopIntervalInput.type = 'number';
    this.loopIntervalInput.className = 'w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-mono text-slate-300 outline-none focus:border-indigo-400';
    this.loopIntervalInput.value = '5000';
    this.loopIntervalInput.setAttribute('aria-label', 'Loop interval (ms)');
    this.loopIntervalInput.oninput = () => this.onRuntimeInputsChanged();
    this.historyCapInput = document.createElement('input');
    this.historyCapInput.type = 'number';
    this.historyCapInput.className = 'w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-mono text-slate-300 outline-none focus:border-indigo-400';
    this.historyCapInput.value = '240';
    this.historyCapInput.setAttribute('aria-label', 'History cap (points)');
    this.historyCapInput.oninput = () => this.onRuntimeInputsChanged();
    this.telegramBotTokenInput = document.createElement('input');
    this.telegramBotTokenInput.className = 'w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-mono text-slate-300 outline-none focus:border-indigo-400';
    this.telegramBotTokenInput.value = '';
    this.telegramBotTokenInput.placeholder = '123456:ABC...';
    this.telegramBotTokenInput.setAttribute('aria-label', 'Telegram bot token');
    this.telegramBotTokenInput.oninput = () => this.onRuntimeInputsChanged();
    this.telegramChatIdInput = document.createElement('input');
    this.telegramChatIdInput.className = 'w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-mono text-slate-300 outline-none focus:border-indigo-400';
    this.telegramChatIdInput.value = '';
    this.telegramChatIdInput.placeholder = '-100123456789';
    this.telegramChatIdInput.setAttribute('aria-label', 'Telegram chat id');
    this.telegramChatIdInput.oninput = () => this.onRuntimeInputsChanged();
    fixedInputs.appendChild(mkLabel('symbol'));
    fixedInputs.appendChild(this.symbolInput);
    fixedInputs.appendChild(mkLabel('assetsCsv'));
    fixedInputs.appendChild(this.assetsCsvInput);
    fixedInputs.appendChild(mkLabel('signalThreshold'));
    fixedInputs.appendChild(this.signalThresholdInput);
    fixedInputs.appendChild(mkLabel('positionBias'));
    fixedInputs.appendChild(this.positionBiasInput);
    fixedInputs.appendChild(mkLabel('loopIntervalMs'));
    fixedInputs.appendChild(this.loopIntervalInput);
    fixedInputs.appendChild(mkLabel('historyCap'));
    fixedInputs.appendChild(this.historyCapInput);
    fixedInputs.appendChild(mkLabel('telegramBotToken'));
    fixedInputs.appendChild(this.telegramBotTokenInput);
    fixedInputs.appendChild(mkLabel('telegramChatId'));
    fixedInputs.appendChild(this.telegramChatIdInput);

    const dynamicInputs = document.createElement('div');
    dynamicInputs.className = 'rounded border border-slate-800 bg-slate-950 p-2';
    const dynamicHeader = document.createElement('div');
    dynamicHeader.className = 'mb-2 flex items-center justify-between';
    const dynamicTitle = document.createElement('span');
    dynamicTitle.className = 'text-[11px] font-mono text-slate-400';
    dynamicTitle.textContent = 'Custom inputs';
    const addInputBtn = document.createElement('button');
    addInputBtn.className = 'rounded border border-indigo-500/40 bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-200';
    addInputBtn.textContent = '+';
    addInputBtn.onclick = () => {
      this.addInputField('', '');
      this.refreshInputsPreview();
    };
    dynamicHeader.appendChild(dynamicTitle);
    dynamicHeader.appendChild(addInputBtn);
    this.inputsList = document.createElement('div');
    this.inputsList.className = 'flex flex-col gap-1.5';
    dynamicInputs.appendChild(dynamicHeader);
    dynamicInputs.appendChild(this.inputsList);
    this.inputsPreview = document.createElement('div');
    this.inputsPreview.className = 'flex-1 overflow-auto rounded border border-slate-800 bg-slate-950 p-2 font-mono text-xs text-slate-300';
    inputsWrap.appendChild(inputsHint);
    inputsWrap.appendChild(fixedInputs);
    inputsWrap.appendChild(dynamicInputs);
    inputsWrap.appendChild(this.inputsPreview);
    this.inputsPanel.appendChild(inputsWrap);

    rightPanel.appendChild(toolbar);
    if (this.loadingWrap) {
      rightPanel.appendChild(this.loadingWrap);
    }
    rightPanel.appendChild(startStopRow);
    rightPanel.appendChild(tabBar);
    rightPanel.appendChild(this.cellsPanel);
    rightPanel.appendChild(this.inputsPanel);
    this.setActiveSideTab('cells');

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'w-1.5 shrink-0 cursor-col-resize bg-slate-900/70 hover:bg-indigo-500/60 transition-colors';
    this.installResizeHandle(resizeHandle);

    this.mainContainer.appendChild(leftPane);
    this.mainContainer.appendChild(resizeHandle);
    this.mainContainer.appendChild(rightPanel);

    this.appendChild(this.mainContainer);

    this.container.classList.add('verdict-cm-shell-wrap', 'min-h-0', 'flex-1');

    this.bytecodeEditor = createVerdictEditor(bytecodeContainer, {
      variant: 'bytecode',
      value: '',
      editable: false,
      fontSize: 12,
    });

    const DEFAULT_NOTEBOOK_CELL_2 = DEFAULT_NOTEBOOK_SIM_CELL_LINES;
    const defaultNotebookCells = [
      {
        source: defaultMarketSource.trim(),
        kind: 'code' as const,
        role: 'module' as const,
        path: 'Market.verdict',
        moduleName: 'Market',
      },
      {
        source: DEFAULT_NOTEBOOK_DECISION_CELL_LINES.join('\n'),
        kind: 'code' as const,
        role: 'runnable' as const,
        path: 'Main.verdict',
        moduleName: 'Main',
      },
      {
        source: DEFAULT_NOTEBOOK_CELL_2.join('\n'),
        kind: 'code' as const,
        role: 'runnable' as const,
        path: 'Backtest.verdict',
        moduleName: 'Backtest',
      },
    ];
    this.defaultNotebookSeed = notebookSeedFromCells(defaultNotebookCells);

    this.editor = createVerdictEditor(this.container, {
      variant: 'program',
      value: defaultNotebookCells.map((cell) => cell.source).join('\n\n'),
      languageService: this.programLanguageService(),
      onRun: () => this.run(),
      onChange: () => this.scheduleUpdate(),
    });

    // The first diagnostics/results pass needs the compiler — wait for it, then
    // run. (runDiagnostics/runInlineResults no-op until vlib is set anyway.)
    this.statusBar.textContent = 'Loading compiler…';
    this.beginBusy('Loading compiler and VM...');
    try {
      await loadVerdictLibs();
    } finally {
      this.endBusy();
    }
    this.refreshInputsPreview();
    this.refreshDbQueryOutput();
    this.setActiveMainTab(this.isDebugView() ? 'debug' : 'editor');
    await this.initNotebook();
    this.updateWorkspaceChrome();
    this.runDiagnostics();
    this.runInlineResults();
  }

  private getProgramSource(): string {
    if (this.notebookSourceMode && this.editor) {
      return this.editor.getValue();
    }
    if (this.notebookApi) return this.notebookApi.notebookSource();
    return this.editor?.getValue() ?? '';
  }

  private onNotebookProgramChanged(source: string) {
    if (this.notebookApi?.getViewMode?.() === 'notebook') {
      this.markVizDirty();
      return;
    }
    if (this.editor && !this.syncingNotebook) {
      this.syncingNotebook = true;
      try {
        if (this.editor.getValue() !== source) this.editor.setValue(source);
      } finally {
        this.syncingNotebook = false;
      }
    }
    this.scheduleUpdate();
    this.markVizDirty();
  }

  private async initNotebook() {
    if (this.isDebugView() || !this.notebookHost) return;
    try {
      await loadAstLib();
      this.renderNotebookDisplay = await loadNotebookDisplayRenderer();
      const bridge = createNotebookBridge({
        vlib,
        materialize: (source) => this.materializeInputs(source),
        onProgramChanged: (source) => this.onNotebookProgramChanged(source),
        syncCellsNav: (sections) => this.syncNotebookCellsNav(sections),
        evalCells: async (source, names, opts) => {
          if (!vlib || !finvmLib) return [];
          // Run the (CPU-bound) cell eval on a worker so heavy actor ticks don't
          // freeze the UI. Materialize on the main thread first (DOM inputs + cell
          // placeholders); the worker treats the source as final.
          const worker = this.ensureFinvmWorker();
          if (worker) {
            const matSrc = materializeIdeCellPlaceholders(
              this.materializeInputs(source),
              { id: opts?.cellId, index: opts?.cellIndex },
              this.finvmState,
            );
            try {
              const { outputs, dbTables } = await worker.evalCells(matSrc, names, opts);
              // Keep the DB tab's source current from the worker's snapshot; fetch
              // the full VM snapshot only when the Debug tab is actually open.
              if (dbTables) this.finvmState = { ...this.finvmState, '__finvm.db': dbTables };
              if (this.activeMainTab === 'db') this.refreshDbQueryOutput();
              if (this.activeMainTab === 'debug') {
                this.finvmState = await worker.getFinvmState();
                this.renderVmState(this.finvmState);
              }
              return outputs;
            } catch {
              this.finvmWorkerFailed = true;
              this.finvmWorker = null;
              // fall through to the main-thread path
            }
          }
          const outs = await evalNotebookCells(
            {
              vlib,
              finvm: finvmLib as FinVmModule,
              getFinvmState: () => this.finvmState,
              setFinvmState: (s) => {
                this.finvmState = s;
              },
              getEffectStorage: () => this.effectStorage ?? createEffectStorage(),
              setEffectStorage: (s) => {
                this.effectStorage = s;
              },
              materialize: (s, cell) =>
                materializeIdeCellPlaceholders(this.materializeInputs(s), cell, this.finvmState),
              onEmit: (cellId, value) => opts?.onEmit?.(cellId, value),
            },
            source,
            names,
            opts?.cellId != null || opts?.cellIndex != null || opts?.signal
              ? { cell: { id: opts?.cellId, index: opts?.cellIndex }, signal: opts?.signal }
              : undefined,
          );
          // Notebook cells run on the shared FinVM session; reflect it in Debug/DB
          // (only when those tabs are open, to avoid serializing state every tick).
          if (this.activeMainTab === 'debug') this.renderVmState(this.finvmState);
          if (this.activeMainTab === 'db') this.refreshDbQueryOutput();
          return outs;
        },
        setSourceMode: (on) => {
          this.notebookSourceMode = on;
          if (!this.notebookHost || !this.container) return;
          this.notebookHost.classList.toggle('hidden', on);
          this.container.classList.toggle('hidden', !on);
          this.programOutputHost.classList.toggle('hidden', !on);
          if (on) {
            this.editor?.setValue(this.getProgramSource());
            this.editor?.layout();
          } else {
            const src = this.editor?.getValue() ?? '';
            this.notebookApi?.setSource(src);
          }
          this.updateWorkspaceChrome();
        },
        isSourceMode: () => this.notebookSourceMode,
        cellDiagnostics: (source, cells) => {
          if (!vlib) return {};
          const src = this.materializeInputs(source);
          const diags = vlib.diagnosticsJS(src);
          const refs = cells.map((c, i) => ({
            id: c.id,
            kind: c.kind,
            source: c.source,
            startLine: 0,
          }));
          return mapDiagnosticsToCells(diags, refs);
        },
        loadDocument: () => loadVnbFromStorage(),
        saveDocument: (doc) => saveVnbToStorage(doc),
        bindingNamesInCell: (cellId, cells, source) =>
          resolveNotebookBindingNames(
            cellId,
            cells.map((c) => ({ id: c.id, kind: c.kind, source: c.source, startLine: 0 })),
            this.materializeInputs(source),
            astLib,
          ),
      });
      this.notebookBridgeRef = bridge;
      const lib = await loadNotebookLib();
      this.notebookApi = lib.mountNotebook(
        '#verdict-notebook-host',
        bridge,
        this.defaultNotebookSeed,
      );
      this.updateWorkspaceChrome();
    } catch (e) {
      console.error('Notebook failed to load:', e);
      this.notebookHost.innerHTML =
        `<div class="p-4 text-rose-400 text-sm">Notebook failed to load: ${escapeHtml(String(e))}</div>`;
      this.container.classList.remove('hidden');
      if (this.notebookHost) this.notebookHost.classList.add('hidden');
    }
  }

  /** Notebook cell navigation minimap (right panel). Output renders under each cell. */
  private syncNotebookCellsNav(sections: CellsNavSection[]) {
    this.renderCellsNav(sections);
  }

  /** Cells tab: navigation minimap — number, preview, run/stop, status. */
  private renderCellsNav(sections: CellsNavSection[]) {
    const host = this.cellsNavHost;
    if (!host) return;
    host.innerHTML = '';
    if (sections.length === 0) {
      host.innerHTML = '<div class="text-xs italic text-slate-600">No cells yet.</div>';
      return;
    }
    for (const sec of sections) {
      const isText = sec.kind === 'text';
      const isRunnable = sec.kind === 'code';
      const card = document.createElement('div');
      card.dataset.navCell = sec.cellId;
      card.className =
        'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ' +
        (sec.focused ? 'border-indigo-400/60 bg-indigo-500/10' : 'border-slate-800/80 bg-slate-900/40');
      card.oncontextmenu = (e) => {
        e.preventDefault();
        this.openCellNavMenu(e.clientX, e.clientY, sec.cellId, sec.cellIndex);
      };

      const navBtn = document.createElement('button');
      navBtn.type = 'button';
      navBtn.className = 'flex min-w-0 flex-1 flex-col gap-0.5 text-left';
      navBtn.title = 'Jump to this cell';
      navBtn.onclick = () => {
        if (this.activeMainTab === 'visual' && this.revealVisualCell(sec.cellId)) return;
        this.notebookApi?.focusCellById?.(sec.cellId);
      };
      const meta = document.createElement('div');
      meta.className = 'flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500';
      const num = document.createElement('span');
      const label = sec.kind === 'module' ? 'Module' : isText ? 'Text' : sec.kind === 'asset' ? 'Asset' : 'Runnable';
      num.textContent = `${sec.cellIndex + 1} · ${label}`;
      meta.appendChild(num);
      navBtn.appendChild(meta);
      // Only show a second line when the user has named the cell — never the raw
      // source first line (it overflows the nav). Truncates to fit the panel.
      const cellName = (sec.name ?? '').trim();
      if (cellName) {
        const nameEl = document.createElement('div');
        nameEl.className = 'truncate font-mono text-[11px] text-slate-300';
        nameEl.textContent = cellName;
        navBtn.appendChild(nameEl);
      }
      card.appendChild(navBtn);

      if (isRunnable) {
        const runBtn = document.createElement('button');
        runBtn.type = 'button';
        runBtn.dataset.runCell = sec.cellId;
        if (sec.running) {
          runBtn.dataset.cellState = 'running';
          runBtn.className =
            'shrink-0 rounded border border-rose-500/50 bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-200 hover:bg-rose-500/25';
          runBtn.textContent = '■ Stop';
          runBtn.onclick = () => this.notebookApi?.stopCellById?.(sec.cellId);
        } else {
          runBtn.className =
            'shrink-0 rounded border border-emerald-500/50 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-200 hover:bg-emerald-500/25';
          runBtn.textContent = '▶ Run';
          runBtn.onclick = () => this.notebookApi?.runCellById?.(sec.cellId);
        }
        card.appendChild(runBtn);
      }

      const dot = document.createElement('span');
      dot.className =
        'shrink-0 text-[12px] ' +
        (sec.running ? 'text-rose-300' : sec.hasOutput ? 'text-emerald-400/80' : 'text-slate-700');
      dot.textContent = sec.running ? '●' : sec.hasOutput ? '●' : '○';
      card.appendChild(dot);
      host.appendChild(card);
    }
  }

  /** Right-click menu on a cell-nav card: run / focus / remove the cell. */
  private openCellNavMenu(x: number, y: number, cellId: string, cellIndex: number) {
    document.querySelector('.notebook-nav-context-menu')?.remove();
    const menu = document.createElement('div');
    menu.className =
      'notebook-nav-context-menu fixed z-50 min-w-[150px] rounded-md border border-slate-700 bg-slate-900 py-1 text-xs text-slate-200 shadow-xl';
    menu.style.left = `${Math.min(x, window.innerWidth - 170)}px`;
    menu.style.top = `${Math.min(y, window.innerHeight - 120)}px`;
    const item = (label: string, danger: boolean, onClick: () => void) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className =
        'block w-full px-3 py-1.5 text-left hover:bg-slate-800 ' + (danger ? 'text-rose-300 hover:text-rose-200' : '');
      b.textContent = label;
      b.onclick = () => {
        menu.remove();
        onClick();
      };
      menu.appendChild(b);
    };
    item('Run', false, () => void this.notebookApi?.runCellById?.(cellId));
    item('Focus', false, () => this.notebookApi?.focusCellById?.(cellId));
    item(`Remove cell ${cellIndex + 1}`, true, () => this.notebookApi?.deleteCellById?.(cellId));
    document.body.appendChild(menu);
    const dismiss = (ev: MouseEvent) => {
      if (!menu.contains(ev.target as Node)) {
        menu.remove();
        document.removeEventListener('mousedown', dismiss);
      }
    };
    setTimeout(() => document.addEventListener('mousedown', dismiss), 0);
  }

  private setActiveSideTab(tab: 'cells' | 'inputs') {
    this.activeSideTab = tab;
    const panels: Array<[HTMLDivElement | null, 'cells' | 'inputs']> = [
      [this.cellsPanel, 'cells'],
      [this.inputsPanel, 'inputs'],
    ];
    for (const [panel, id] of panels) {
      if (!panel) continue;
      panel.classList.toggle('hidden', id !== tab);
    }
    const tabButtons = this.mainContainer.querySelectorAll<HTMLButtonElement>('[data-tab-id]');
    tabButtons.forEach((btn) => {
      const selected = btn.dataset.tabId === tab;
      btn.className = selected
        ? 'rounded bg-indigo-600/30 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-200 ring-1 ring-inset ring-indigo-400/40'
        : 'rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white';
    });
  }

  private setActiveMainTab(tab: 'editor' | 'db' | 'debug' | 'visual') {
    this.activeMainTab = tab;
    const editorVisible = tab === 'editor';
    if (this.notebookSourceMode && editorVisible) {
      this.container.classList.remove('hidden');
      if (this.notebookHost) this.notebookHost.classList.add('hidden');
    } else {
      this.container.classList.toggle('hidden', true);
      if (this.notebookHost) {
        this.notebookHost.classList.toggle('hidden', !editorVisible);
      }
    }
    if (this.dbPanel) {
      this.dbPanel.classList.toggle('hidden', tab !== 'db');
    }
    if (this.debugPanel) {
      this.debugPanel.classList.toggle('hidden', tab !== 'debug');
    }
    if (this.vizPanel) {
      this.vizPanel.classList.toggle('hidden', tab !== 'visual');
    }
    if (tab === 'visual') {
      // Opening the tab always re-renders, even if the source hasn't changed since.
      this.vizDirty = true;
      void this.refreshVisualization();
    }
    if (tab === 'debug' && this.finvmState && Object.keys(this.finvmState).length > 0) {
      // Show the current shared FinVM session (populated by notebook cell runs).
      this.renderVmState(this.finvmState);
    }
    this.updateWorkspaceChrome();
    const tabButtons = this.mainContainer.querySelectorAll<HTMLButtonElement>('[data-main-tab-id]');
    tabButtons.forEach((btn) => {
      const selected = btn.dataset.mainTabId === tab;
      btn.className = selected
        ? 'rounded bg-indigo-600/30 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-200 ring-1 ring-inset ring-indigo-400/40'
        : 'rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white';
    });
  }

  private updateWorkspaceChrome() {
    if (this.leftPane) {
      this.leftPane.style.flexBasis = '72%';
    }
    if (this.sourceToggleBtn) {
      this.sourceToggleBtn.textContent = this.notebookSourceMode ? 'Notebook' : 'Source';
      this.sourceToggleBtn.classList.toggle('hidden', this.activeMainTab !== 'editor' || !this.notebookBridgeRef);
    }
  }

  // The source changed; the block view is stale. Re-render only if it's the
  // visible tab (rendering into a hidden panel would waste work each keystroke).
  private markVizDirty() {
    this.vizDirty = true;
    if (this.activeMainTab === 'visual') {
      void this.refreshVisualization();
    }
  }

  // In notebook mode each code cell is visualized separately. DB and __INPUT_*
  // substitution stay shared at the session level. Source mode = whole program.
  private async refreshVisualization() {
    if (!this.vizRoot || !this.vizDirty) return;
    try {
      if (!hyloLib) await loadHyloLib();
      if (!astLib) await loadAstLib();
      if (!astLib || !hyloLib) return;
      if (typeof astLib.astJS !== 'function') {
        this.vizRoot.innerHTML =
          '<div class="p-4 text-slate-500 italic">Code view unavailable: <code>/lib/verdict-ast.mjs</code> has no <code>astJS</code> export. See docs/visualization-tab-design.md.</div>';
        return;
      }

      this.vizCleanup?.();
      this.vizCleanup = null;

      const notebookCells = this.getNotebookCellsForViz();
      if (notebookCells) {
        await this.renderNotebookCellVisualizations(notebookCells);
        this.vizDirty = false;
        return;
      }

      if (!this.editor) return;
      const source = this.materializeInputs(this.getProgramSource());
      const cleanups: Array<() => void> = [];
      await this.renderSingleSourceVisualization(this.vizRoot, source, {
        onJump: (line) => this.jumpToSourceLine(line),
        collapseKey: (def) => def,
        onCleanup: (fn) => cleanups.push(fn),
      });
      this.attachVizListeners();
      this.vizCleanup = () => {
        for (const fn of cleanups) fn();
      };
      this.vizDirty = false;
    } catch (e) {
      this.vizRoot.innerHTML = `<div class="p-4 text-rose-400">Visualization error: ${escapeHtml(String(e))}</div>`;
    }
  }

  private getNotebookCellsForViz(): VizNotebookCell[] | null {
    if (this.notebookSourceMode || !this.notebookApi?.notebookCells) return null;
    if (this.notebookApi.getViewMode?.() === 'source') return null;
    return this.notebookApi.notebookCells().map((c, index) => ({
      id: c.id,
      kind: c.kind,
      role: c.role,
      path: c.path,
      moduleName: c.moduleName,
      source: c.source,
      index,
    }));
  }

  private async renderNotebookCellVisualizations(cells: VizNotebookCell[]) {
    if (!this.vizRoot) return;
    if (cells.length === 0) {
      this.vizRoot.innerHTML =
        '<div class="p-4 text-slate-500 italic">Add a module or runnable cell to see its structure here.</div>';
      return;
    }

    const modules = notebookCellsToVizModules(cells);
    const cleanups: Array<() => void> = [];
    this.vizRoot.innerHTML = '';
    this.vizRoot.className = 'min-h-full flex flex-col gap-4 p-3';

    for (const moduleSection of modules) {
      const section = document.createElement('details');
      section.open = !this.collapsedVizModules.has(moduleSection.id);
      section.dataset.vizModule = moduleSection.id;
      section.dataset.vizCell = moduleSection.primaryCellId;
      section.dataset.vizCellIds = moduleSection.cells.map((cell) => cell.id).join(' ');
      section.className =
        'notebook-viz-cell rounded-lg border border-slate-800 bg-slate-950/40 overflow-hidden';

      const header = document.createElement('summary');
      header.className =
        'flex w-full cursor-pointer list-none items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-900/60 px-3 py-2 text-left hover:bg-slate-900';
      const kindLabel =
        moduleSection.kind === 'text' ? 'Text' : moduleSection.kind === 'module' ? 'Module' : 'Runnable Module';
      const cellCount = moduleSection.cells.length > 1 ? ` · ${moduleSection.cells.length} cells` : '';
      header.innerHTML = `<span class="shrink-0 font-mono text-[12px] text-slate-500" data-viz-module-marker="${escapeHtml(moduleSection.id)}">${section.open ? '▾' : '▸'}</span><span class="text-[10px] font-bold uppercase tracking-wider text-indigo-300/90">${kindLabel}${cellCount}</span><span class="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-300">${escapeHtml(moduleSection.label)}</span><span class="hidden truncate text-[11px] text-slate-500 md:inline">${escapeHtml(moduleSection.preview)}</span>`;
      section.appendChild(header);

      const body = document.createElement('div');
      body.dataset.vizCellBody = moduleSection.id;
      body.className = 'min-h-[48px]';
      section.appendChild(body);
      this.vizRoot.appendChild(section);

      if (moduleSection.kind === 'text') {
        body.innerHTML =
          '<div class="p-3 text-xs italic text-slate-500">Text cells are not compiled — visualization applies to code cells only.</div>';
      } else {
        const src = this.materializeInputs(moduleSection.source);
        await this.renderSingleSourceVisualization(body, src, {
          cellId: moduleSection.primaryCellId,
          onJump: (line) => {
            const mapped = mappedCellForLine(moduleSection, line);
            this.jumpToSourceLine(mapped.line, mapped.cellId);
          },
          collapseKey: (def) => collapsedDefKey(moduleSection.id, def),
          lineToCell: (line) => mappedCellForLine(moduleSection, line),
          onCleanup: (fn) => cleanups.push(fn),
        });
      }
    }

    this.attachVizListeners();
    this.vizCleanup = () => {
      for (const fn of cleanups) fn();
    };
  }

  private async renderSingleSourceVisualization(
    host: HTMLElement,
    source: string,
    opts: {
      cellId?: string;
      lineOffset?: number;
      onJump: (line: number) => void;
      collapseKey: (defName: string) => string;
      lineToCell?: (line: number) => { cellId: string; line: number };
      onCleanup?: (fn: () => void) => void;
    },
  ) {
    host.innerHTML = '';
    const inner = document.createElement('div');
    inner.className = 'notebook-viz-cell-inner p-2';
    if (opts.cellId) inner.dataset.vizCell = opts.cellId;
    host.appendChild(inner);

    const trimmed = source.trim();
    if (!trimmed || trimmed === 'module Main exposing ()') {
      inner.innerHTML = '<div class="p-2 text-xs italic text-slate-500">Empty cell.</div>';
      return;
    }

    const res = astLib!.astJS(source);
    if (!res?.ok) {
      inner.innerHTML = `<div class="p-2 text-xs text-slate-500 italic">Can't parse this cell — ${escapeHtml(res?.error ?? 'parse error')}.</div>`;
      return;
    }

    const ast = JSON.parse(res.ast);
    const docs = extractDocs(source);
    const rootId = opts.cellId ? `viz-cell-${opts.cellId}` : this.vizRoot!.id;
    inner.id = rootId;

    if (this.vizMode === 'map') {
      const gas = this.computeGasInfo(source);
      const cleanup = renderCallGraph(inner, ast, gas, docs, opts.onJump);
      opts.onCleanup?.(cleanup);
      return;
    }

    hyloLib!.renderCode(`#${rootId}`, ast);
    if (opts.lineToCell) {
      inner.querySelectorAll<HTMLElement>('[data-src-line]').forEach((el) => {
        const line = Number(el.dataset.srcLine ?? 0);
        if (!Number.isFinite(line) || line <= 0) return;
        const mapped = opts.lineToCell?.(line);
        if (!mapped) return;
        el.dataset.vizJumpCell = mapped.cellId;
        el.dataset.vizJumpLine = String(mapped.line);
      });
    }
    inner.querySelectorAll<HTMLDetailsElement>('details[data-def]').forEach((d) => {
      const def = d.dataset.def;
      if (def && this.collapsedDefs.has(opts.collapseKey(def))) d.removeAttribute('open');
      const doc = def ? docs.get(def) : undefined;
      if (doc) d.title = doc;
    });
    const content = inner.firstElementChild as HTMLElement | null;
    if (content) {
      const cleanup = installArrowOverlay(content);
      opts.onCleanup?.(cleanup);
    }
  }

  // Per-function gas (static bytecode instruction count) + capabilities, for the
  // Map view. Needs a successful compile; returns empty if the program only
  // parses (the map still draws, just without gas numbers).
  private computeGasInfo(source: string): Map<string, GasInfo> {
    try {
      // Use the analysis bundle (matches astJS) for gas counting; it's never run,
      // only its instruction counts/builtins are read.
      const c = astLib.compileJS(source);
      if (!c?.ok) return new Map();
      return gasFromBytecode(JSON.parse(c.output));
    } catch {
      return new Map();
    }
  }

  private setVizMode(mode: 'blocks' | 'map') {
    if (this.vizMode === mode) return;
    this.vizMode = mode;
    this.updateVizModeButtons();
    this.vizDirty = true;
    void this.refreshVisualization();
  }

  private updateVizModeButtons() {
    this.vizPanel?.querySelectorAll<HTMLButtonElement>('[data-viz-mode]').forEach((btn) => {
      const on = btn.dataset.vizMode === this.vizMode;
      btn.className = on
        ? 'rounded bg-indigo-600/30 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-200 ring-1 ring-inset ring-indigo-400/40'
        : 'rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white';
    });
  }

  private revealVisualCell(cellId: string): boolean {
    if (!this.vizRoot) return false;
    const sections = [...this.vizRoot.querySelectorAll<HTMLDetailsElement>('[data-viz-module]')];
    const target = sections.find((section) =>
      (section.dataset.vizCellIds ?? '').split(' ').filter(Boolean).includes(cellId),
    );
    if (!target) return false;
    target.open = true;
    if (target.dataset.vizModule) this.collapsedVizModules.delete(target.dataset.vizModule);
    target.scrollIntoView({ block: 'start', behavior: 'smooth' });
    this.notebookApi?.focusCellById?.(cellId);
    return true;
  }

  // One-time delegated listeners on the viz container: click-a-block→source, and
  // collapse-state tracking.
  private attachVizListeners() {
    if (this.vizListenersAttached || !this.vizRoot) return;
    this.vizListenersAttached = true;
    this.vizRoot.addEventListener('click', (e) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-src-line]');
      if (!el) return;
      const line = Number(el.dataset.srcLine);
      const section = el.closest<HTMLElement>('[data-viz-cell]');
      const cellId = el.dataset.vizJumpCell || section?.dataset.vizCell;
      const mappedLine = Number(el.dataset.vizJumpLine ?? line);
      const offset = Number(section?.dataset.vizLineOffset ?? 0);
      if (Number.isFinite(line)) this.jumpToSourceLine(Number.isFinite(mappedLine) ? mappedLine : line, cellId, offset);
    });
    // `toggle` doesn't bubble, so capture it on the way down.
    this.vizRoot.addEventListener(
      'toggle',
      (e) => {
        const d = e.target as HTMLDetailsElement;
        if (!(d instanceof HTMLDetailsElement)) return;
        if (d.dataset.vizModule) {
          if (d.open) this.collapsedVizModules.delete(d.dataset.vizModule);
          else this.collapsedVizModules.add(d.dataset.vizModule);
          const marker = d.querySelector<HTMLElement>('[data-viz-module-marker]');
          if (marker) marker.textContent = d.open ? '▾' : '▸';
          return;
        }
        if (!d.dataset.def) return;
        const cellId = d.closest<HTMLElement>('[data-viz-cell]')?.dataset.vizCell;
        const key = cellId ? collapsedDefKey(cellId, d.dataset.def) : d.dataset.def;
        if (d.open) this.collapsedDefs.delete(key);
        else this.collapsedDefs.add(key);
      },
      true,
    );
  }

  // Reveal a source line in the editor (notebook cell or whole-program source).
  private jumpToSourceLine(line: number, cellId?: string, lineOffset = 0) {
    if (!Number.isFinite(line)) return;
    const cellLine = Math.max(1, line - lineOffset);
    if (cellId && this.notebookApi?.focusCellById && !this.notebookSourceMode) {
      this.setActiveMainTab('editor');
      this.notebookApi.focusCellById(cellId);
      return;
    }
    if (!this.editor) return;
    this.setActiveMainTab('editor');
    this.editor.revealLine(cellLine);
  }

  private beginBusy(message: string) {
    this.busyCount += 1;
    if (this.loadingLabel) {
      this.loadingLabel.textContent = message;
    }
    if (this.loadingWrap) {
      this.loadingWrap.classList.remove('hidden');
    }
  }

  private endBusy() {
    this.busyCount = Math.max(0, this.busyCount - 1);
    if (this.busyCount === 0 && this.loadingWrap) {
      this.loadingWrap.classList.add('hidden');
    }
  }

  private programLanguageService() {
    const self = this;
    return {
      getProgramDiagnostics: () => self.languageAnalysis.diagnostics,
      getSignatures: () => self.languageAnalysis.signatures,
      getEvalBindings: () => self.languageAnalysis.evalBindings,
      getDocs: () => self.languageAnalysis.docs,
      getCellSource: () => self.getProgramSource(),
      getBindingNames: () => null as null,
    };
  }

  private refreshLanguageAnalysis() {
    if (!this.editor || !vlib) return;
    const src = this.materializeInputs(this.getProgramSource());
    let h = 5381;
    for (let i = 0; i < src.length; i++) h = ((h << 5) + h + src.charCodeAt(i)) | 0;
    const sig = `${src.length}:${h >>> 0}`;
    if (this.languageAnalysisSig === sig) return;
    this.languageAnalysisSig = sig;

    try {
      this.languageAnalysis.diagnostics = vlib.diagnosticsJS(src);
    } catch {
      return;
    }

    const errors = this.languageAnalysis.diagnostics.filter(
      (d: VerdictDiagnostic) => d.severity !== 'warning',
    );
    this.setStatus(errors.length);

    try {
      this.languageAnalysis.signatures = vlib.signaturesJS(src);
    } catch {
      this.languageAnalysis.signatures = [];
    }
    this.languageAnalysis.docs = extractVerdictDocs(src);

    if (errors.length > 0) {
      this.languageAnalysis.evalBindings = [];
    } else {
      try {
        this.languageAnalysis.evalBindings = vlib.evalBindingsJS(src);
      } catch {
        this.languageAnalysis.evalBindings = [];
      }
    }

    this.editor.refreshLanguageService();
  }

  // Debounce edits into a single background pass ~250ms after typing stops.
  private scheduleUpdate() {
    if (this.diagnosticsTimer !== null) {
      window.clearTimeout(this.diagnosticsTimer);
    }
    this.diagnosticsTimer = window.setTimeout(() => {
      this.diagnosticsTimer = null;
      this.runDiagnostics();
      this.runInlineResults();
      this.markVizDirty();
    }, 250);
  }

  // Parse + typecheck the current source and paint error squiggles + inline results.
  private runDiagnostics() {
    this.refreshLanguageAnalysis();
  }

  private setStatus(errorCount: number) {
    if (errorCount === 0) {
      this.statusBar.className = STATUS_BASE + ' text-emerald-400';
      this.statusBar.textContent = '✓ No errors';
    } else {
      this.statusBar.className = STATUS_BASE + ' text-rose-400';
      this.statusBar.textContent = `✗ ${errorCount} error${errorCount === 1 ? '' : 's'}`;
    }
  }

  // Inline binding results are rendered by the CM6 language service.
  private runInlineResults() {
    /* Inline results are updated by refreshLanguageAnalysis (CM6 widgets). */
  }

  run() {
    if (!this.editor) return;
    void this.runProgram();
  }

  private onLiveIntervalChanged() {
    const secs = Number(this.liveIntervalInput?.value);
    if (Number.isFinite(secs) && secs >= 1) {
      this.liveIntervalMs = Math.round(secs * 1000);
    }
  }

  // Start/Stop the live loop. While active, every cell re-runs every
  // `liveIntervalMs` against the shared FinVM session: the strategy cell keeps
  // fetching + writing shared state, downstream cells re-read it and re-render
  // their charts, all without user interaction.
  private toggleLiveLoop() {
    if (this.liveActive) this.stopLiveLoop();
    else void this.startLiveLoop();
  }

  private async startLiveLoop() {
    if (this.liveActive) return;
    this.liveActive = true;
    this.updateRunToggleUi();
    // Run an immediate first tick, then schedule subsequent ones.
    await this.liveTick();
  }

  private stopLiveLoop() {
    this.liveActive = false;
    if (this.liveTimer !== null) {
      window.clearTimeout(this.liveTimer);
      this.liveTimer = null;
    }
    this.notebookApi?.stopAll?.();
    this.updateRunToggleUi();
  }

  private async liveTick() {
    if (!this.liveActive) return;
    if (!this.liveBusy) {
      this.liveBusy = true;
      try {
        await this.runProgram();
      } catch {
        /* keep the loop alive across transient run errors */
      } finally {
        this.liveBusy = false;
      }
    }
    if (!this.liveActive) return;
    this.liveTimer = window.setTimeout(() => {
      this.liveTimer = null;
      void this.liveTick();
    }, this.liveIntervalMs);
  }

  private updateRunToggleUi() {
    if (!this.runToggleBtn) return;
    if (this.liveActive) {
      this.runToggleBtn.textContent = 'Stop';
      this.runToggleBtn.className =
        'inline-flex items-center rounded-md border border-rose-500/40 bg-rose-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-200 transition-colors hover:bg-rose-500/25';
    } else {
      this.runToggleBtn.textContent = 'Run';
      this.runToggleBtn.className =
        'inline-flex items-center rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200 transition-colors hover:bg-emerald-500/25';
    }
  }

  private async runProgram() {
    if (!this.editor) return;
    if (
      this.notebookApi?.runAll &&
      this.activeMainTab === 'editor' &&
      this.notebookApi.getViewMode?.() === 'notebook'
    ) {
      await this.notebookApi.runAll();
      return;
    }
    void this.executeProgram(false);
  }

  private async executeProgram(persistState: boolean) {
    if (!this.editor) return;
    this.beginBusy(persistState ? 'Running strategy...' : 'Compiling and running...');
    const code = this.materializeInputs(this.getProgramSource());
    if (!persistState) {
      this.renderOutput('Compiling', 'info');
    }
    this.runDiagnostics();

    if (!vlib) {
      this.renderOutput('Still loading the compiler… try again in a moment.', 'error');
      this.endBusy();
      return;
    }
    if (!finvmLib) {
      this.renderOutput('Still loading FinVM… try again in a moment.', 'error');
      this.endBusy();
      return;
    }
    try {
      const compilation = vlib.compileJS(code);
      if (!compilation.ok) {
        this.bytecodeEditor?.setValue('');
        this.latestCompiledProgram = null;
        if (this.vmStatePanel) {
          this.vmStatePanel.innerHTML = '<div class="text-slate-600 italic">Compilation failed, VM state unavailable.</div>';
        }
        if (this.vmDbPanel) {
          this.vmDbPanel.innerHTML = '<div class="text-slate-600 italic">Compilation failed, VM DB unavailable.</div>';
        }
        this.renderOutput(`Compilation Error: ${compilation.error}`, 'error');
        return;
      }
      this.bytecodeEditor?.setValue(compilation.output);
      try {
        this.latestCompiledProgram = JSON.parse(compilation.output);
      } catch {
        this.latestCompiledProgram = null;
      }
      const vmOut = await this.runFinvmProgram(compilation.output, persistState);
      if (vmOut.ok) {
        this.renderOutput(vmOut.resultText, 'ok');
      } else {
        this.renderOutput(`Runtime Error: ${vmOut.error}`, 'error');
      }
    } catch (e) {
      this.renderOutput(`Internal Error: ${String(e)}`, 'error');
    } finally {
      this.endBusy();
    }
  }

  private renderOutput(text: string, tone: 'ok' | 'error' | 'info') {
    if (!this.notebookSourceMode) return;
    const color =
      tone === 'ok' ? 'text-emerald-300' : tone === 'error' ? 'text-rose-200' : 'text-indigo-300';
    this.programOutputHost.classList.remove('hidden');
    this.programOutputHost.innerHTML = `<div class="${color} font-mono text-sm whitespace-pre-wrap break-words">${escapeHtml(text)}</div>`;
  }

  private installResizeHandle(handle: HTMLDivElement) {
    const onMouseDown = (event: MouseEvent) => {
      event.preventDefault();
      const onMove = (moveEvent: MouseEvent) => {
        if (!this.mainContainer || !this.leftPane || !this.rightPane) return;
        const rect = this.mainContainer.getBoundingClientRect();
        const rawPct = ((moveEvent.clientX - rect.left) / rect.width) * 100;
        const clamped = Math.min(88, Math.max(55, rawPct));
        this.leftPane.style.flexBasis = `${clamped}%`;
        this.rightPane.style.flexBasis = `${100 - clamped}%`;
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };
    handle.addEventListener('mousedown', onMouseDown);
    this.resizeCleanup = () => {
      handle.removeEventListener('mousedown', onMouseDown);
    };
  }

  private renderVmState(snapshot: unknown) {
    if (!this.vmStatePanel) return;
    this.vmStatePanel.innerHTML = `<pre class="whitespace-pre-wrap break-words text-slate-300">${renderJsonForPanel(snapshot)}</pre>`;
    this.latestVmSnapshot = snapshot;
    // DB rows live in finvmState's __finvm.db (host effect storage), not the VM
    // snapshot, so render the panel from finvmState rather than the raw snapshot.
    this.renderVmDb(this.finvmState);
  }

  private renderVmDb(snapshot: unknown) {
    if (!this.vmDbPanel) return;
    const tables = extractDbTables(
      snapshot && typeof snapshot === 'object' ? (snapshot as Record<string, unknown>) : {},
    );
    const names = Object.keys(tables);
    if (names.length === 0) {
      this.vmDbPanel.innerHTML = '<div class="text-slate-600 italic">No DB tables found in current VM state.</div>';
      return;
    }
    const sections = names
      .sort((a, b) => (tables[b]?.length ?? 0) - (tables[a]?.length ?? 0))
      .map((name) => {
        const rows = tables[name] ?? [];
        const sample = rows.slice(0, 5).map((r) => ({ id: r.id, value: r.value }));
        return `
          <div class="mb-3 rounded border border-slate-800 bg-slate-900/40 p-2">
            <div class="mb-1 flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-200">${escapeHtml(name)}</span>
              <span class="text-[10px] font-mono text-emerald-300">${rows.length} rows</span>
            </div>
            <pre class="whitespace-pre-wrap break-words text-[11px] text-slate-400">${renderJsonForPanel(sample)}</pre>
          </div>
        `;
      })
      .join('');
    this.vmDbPanel.innerHTML = sections;
  }

  private renderVmObserver(snapshot: unknown) {
    if (!this.vmObserverPanel) return;
    const top = snapshot && typeof snapshot === 'object' ? (snapshot as Record<string, unknown>) : {};
    const stateRoot = top.state && typeof top.state === 'object' ? (top.state as Record<string, unknown>) : top;
    const tables = extractDbTables(snapshot);
    const tableNames = Object.keys(tables);
    const tableCount = tableNames.length;
    const rowCount = tableNames.reduce((acc, name) => acc + (tables[name]?.length ?? 0), 0);
    const threshold = Number(this.signalThresholdInput?.value ?? '0');
    const memoryBytes = (() => {
      try {
        return JSON.stringify(stateRoot).length;
      } catch {
        return 0;
      }
    })();
    const registerCount = (() => {
      const regLikeKeys = Object.keys(stateRoot).filter((k) => /reg|registry|register/i.test(k));
      if (regLikeKeys.length > 0) {
        return regLikeKeys.reduce((acc, k) => {
          const v = stateRoot[k];
          if (v && typeof v === 'object') return acc + Object.keys(v as Record<string, unknown>).length;
          return acc + 1;
        }, 0);
      }
      return Object.keys(stateRoot).length;
    })();
    const load = this.lastVmSteps;
    const point = {
      memoryBytes,
      load,
      tables: tableCount,
      rows: rowCount,
      regs: registerCount,
      threshold: Number.isFinite(threshold) ? threshold : 0,
    };
    this.vmMetricsHistory = [...this.vmMetricsHistory, point].slice(-120);

    const mkSparkline = (points: number[], color: string) => {
      const w = 250;
      const h = 56;
      if (points.length === 0) {
        return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><rect x="0" y="0" width="${w}" height="${h}" fill="#020617"/></svg>`;
      }
      const max = Math.max(1, ...points);
      const min = Math.min(...points);
      const span = Math.max(1, max - min);
      const coords = points
        .map((v, i) => {
          const x = (i / Math.max(1, points.length - 1)) * (w - 6) + 3;
          const y = h - 4 - ((v - min) / span) * (h - 10);
          return `${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(' ');
      return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
        <rect x="0" y="0" width="${w}" height="${h}" fill="#020617" rx="6"/>
        <polyline points="${coords}" fill="none" stroke="${color}" stroke-width="2"/>
      </svg>`;
    };

    const memTrend = this.vmMetricsHistory.map((m) => m.memoryBytes);
    const loadTrend = this.vmMetricsHistory.map((m) => m.load);
    const regsTrend = this.vmMetricsHistory.map((m) => m.regs);
    const rowsTrend = this.vmMetricsHistory.map((m) => m.rows);
    const leakWindow = memTrend.slice(-20);
    const leakDelta = leakWindow.length >= 2 ? leakWindow[leakWindow.length - 1] - leakWindow[0] : 0;
    const leakRisk = leakDelta > 0 ? Math.round((leakDelta / Math.max(1, leakWindow[0])) * 100) : 0;
    const leakLabel = leakRisk > 15 ? 'high' : leakRisk > 5 ? 'medium' : 'low';
    const loadPct = Math.min(100, Math.round((load / 1200) * 100));

    this.vmObserverPanel.innerHTML = `
      <div class="grid grid-cols-1 gap-2 xl:grid-cols-4">
        <div class="rounded border border-slate-800 bg-slate-900/60 p-2">
          <div class="text-[10px] uppercase tracking-[0.14em] text-slate-500">Memory</div>
          <div class="mt-1 text-lg font-bold text-indigo-200">${Math.round(memoryBytes / 1024)} KB</div>
          <div class="text-[10px] text-slate-500">VM state serialized size</div>
        </div>
        <div class="rounded border border-slate-800 bg-slate-900/60 p-2">
          <div class="text-[10px] uppercase tracking-[0.14em] text-slate-500">Load</div>
          <div class="mt-1 text-lg font-bold text-sky-200">${load}</div>
          <div class="mt-2 h-1.5 rounded bg-slate-800"><div class="h-full rounded bg-sky-400" style="width:${loadPct}%"></div></div>
        </div>
        <div class="rounded border border-slate-800 bg-slate-900/60 p-2">
          <div class="text-[10px] uppercase tracking-[0.14em] text-slate-500">Threshold</div>
          <div class="mt-1 text-lg font-bold text-amber-200">${point.threshold}</div>
          <div class="text-[10px] text-slate-500">from Inputs.signalThreshold</div>
        </div>
        <div class="rounded border border-slate-800 bg-slate-900/60 p-2">
          <div class="text-[10px] uppercase tracking-[0.14em] text-slate-500">Registries</div>
          <div class="mt-1 text-lg font-bold text-emerald-200">${registerCount}</div>
          <div class="text-[10px] text-slate-500">state keys / register-like buckets</div>
        </div>
      </div>
      <div class="mt-3 grid grid-cols-1 gap-2 xl:grid-cols-2">
        <div class="rounded border border-slate-800 bg-slate-900/60 p-2">
          <div class="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-slate-500">
            <span>Memory Trend</span><span class="text-[10px] normal-case text-rose-300">leak risk: ${leakLabel} (${leakRisk}%)</span>
          </div>
          ${mkSparkline(memTrend, '#f472b6')}
        </div>
        <div class="rounded border border-slate-800 bg-slate-900/60 p-2">
          <div class="mb-1 text-[10px] uppercase tracking-[0.14em] text-slate-500">Load Trend (VM steps)</div>
          ${mkSparkline(loadTrend, '#38bdf8')}
        </div>
        <div class="rounded border border-slate-800 bg-slate-900/60 p-2">
          <div class="mb-1 text-[10px] uppercase tracking-[0.14em] text-slate-500">Registers Trend</div>
          ${mkSparkline(regsTrend, '#34d399')}
        </div>
        <div class="rounded border border-slate-800 bg-slate-900/60 p-2">
          <div class="mb-1 text-[10px] uppercase tracking-[0.14em] text-slate-500">DB Rows Trend</div>
          ${mkSparkline(rowsTrend, '#f59e0b')}
        </div>
      </div>
      <div class="mt-2 rounded border border-slate-800 bg-slate-900/60 p-2 text-[11px] text-slate-300">
        <div class="flex items-center justify-between"><span>DB tables</span><span class="font-mono text-emerald-300">${tableCount}</span></div>
        <div class="flex items-center justify-between"><span>DB rows</span><span class="font-mono text-emerald-300">${rowCount}</span></div>
      </div>
    `;
  }

  private renderDebugVisualizations() {
    if (!this.debugVizPanel) return;
    const program = this.latestCompiledProgram;
    const snapshot = this.latestVmSnapshot;
    if (!program && !snapshot) {
      this.debugVizPanel.innerHTML = '<div class="text-slate-600 italic text-xs">Compile and run to render visualizations.</div>';
      return;
    }

    const kindCounts = new Map<string, number>();
    const depthCounts: number[] = [];
    const walk = (value: unknown, depth: number) => {
      depthCounts[depth] = (depthCounts[depth] ?? 0) + 1;
      if (value === null) {
        kindCounts.set('null', (kindCounts.get('null') ?? 0) + 1);
        return;
      }
      if (Array.isArray(value)) {
        kindCounts.set('array', (kindCounts.get('array') ?? 0) + 1);
        for (const v of value) walk(v, depth + 1);
        return;
      }
      if (typeof value === 'object') {
        const rec = value as Record<string, unknown>;
        const typeLabel =
          (typeof rec.op === 'string' && rec.op) ||
          (typeof rec.tag === 'string' && rec.tag) ||
          (typeof rec.kind === 'string' && rec.kind) ||
          'object';
        kindCounts.set(typeLabel, (kindCounts.get(typeLabel) ?? 0) + 1);
        for (const v of Object.values(rec)) walk(v, depth + 1);
        return;
      }
      kindCounts.set(typeof value, (kindCounts.get(typeof value) ?? 0) + 1);
    };

    if (program) walk(program, 0);
    if (snapshot) walk(snapshot, 0);

    const topKinds = [...kindCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const maxKind = Math.max(1, ...topKinds.map(([, n]) => n));
    const maxDepth = Math.max(1, ...depthCounts);

    const kindRows = topKinds
      .map(([label, count]) => {
        const pct = Math.max(3, Math.round((count / maxKind) * 100));
        return `
          <div class="mb-1.5">
            <div class="mb-0.5 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>${escapeHtml(label)}</span><span>${count}</span>
            </div>
            <div class="h-2 rounded bg-slate-800"><div class="h-full rounded bg-indigo-400/80" style="width:${pct}%"></div></div>
          </div>
        `;
      })
      .join('');

    const depthBars = depthCounts
      .slice(0, 18)
      .map((count, idx) => {
        const h = Math.max(8, Math.round((count / maxDepth) * 88));
        return `<div class="flex w-5 flex-col items-center gap-1"><div class="w-4 rounded-t bg-sky-400/80" style="height:${h}px"></div><div class="text-[9px] text-slate-500">${idx}</div></div>`;
      })
      .join('');

    const tables = extractDbTables(
      snapshot && typeof snapshot === 'object' ? (snapshot as Record<string, unknown>) : {},
    );
    const tableRows = Object.entries(tables)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 8)
      .map(([name, rows]) => `<div class="flex items-center justify-between border-b border-slate-800/70 py-1 text-xs"><span class="text-slate-300">${escapeHtml(name)}</span><span class="font-mono text-emerald-300">${rows.length}</span></div>`)
      .join('');

    this.debugVizPanel.innerHTML = `
      <div class="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div class="rounded border border-slate-800 bg-slate-900/60 p-2">
          <div class="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Minard View: Opcode / Node Mix</div>
          ${kindRows || '<div class="text-xs text-slate-500">No nodes</div>'}
        </div>
        <div class="rounded border border-slate-800 bg-slate-900/60 p-2">
          <div class="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Minard View: Layer Depth Profile</div>
          <div class="flex items-end gap-1 overflow-x-auto pb-1" style="min-height:110px">${depthBars || '<div class="text-xs text-slate-500">No depth data</div>'}</div>
        </div>
        <div class="rounded border border-slate-800 bg-slate-900/60 p-2">
          <div class="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Minard View: DB Density</div>
          ${tableRows || '<div class="text-xs text-slate-500">No DB tables in VM state</div>'}
        </div>
      </div>
    `;
  }

  private renderCodeVis() {
    if (!this.codeVisPanel || !this.editor) return;
    const source = this.editor.getValue();
    const lines = source.split('\n');
    const signatures = new Map<string, string>();
    const definitions: Array<{ name: string; line: number; body: string }> = [];

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const sig = line.match(/^([a-z][A-Za-z0-9_]*)\s*:\s*(.+)$/);
      if (sig) {
        signatures.set(sig[1], sig[2].trim());
        continue;
      }
      const def = line.match(/^([a-z][A-Za-z0-9_]*)(?:\s+[A-Za-z0-9_]+)*\s*=\s*(.*)$/);
      if (def) {
        const name = def[1];
        let j = i + 1;
        const bodyLines: string[] = [def[2] ?? ''];
        while (j < lines.length) {
          const n = lines[j];
          if (/^[a-z][A-Za-z0-9_]*(?:\s+[A-Za-z0-9_]+)*\s*=/.test(n) || /^[a-z][A-Za-z0-9_]*\s*:/.test(n)) break;
          bodyLines.push(n);
          j += 1;
        }
        definitions.push({ name, line: i + 1, body: bodyLines.join('\n') });
      }
    }

    const names = new Set(definitions.map((d) => d.name));
    const edges: Array<{ from: string; to: string }> = [];
    for (const def of definitions) {
      for (const name of names) {
        if (name === def.name) continue;
        if (new RegExp(`\\b${name}\\s*\\(`).test(def.body) || new RegExp(`\\b${name}\\b`).test(def.body)) {
          edges.push({ from: def.name, to: name });
        }
      }
    }

    const runtimeFns = ['dbInsert', 'dbGet', 'dbQuery', 'httpGet', 'httpPost', 'sysLog', 'cacheSet', 'cacheGet'];
    const runtimeHits = runtimeFns.filter((fn) => source.includes(fn));

    this.codeVisPanel.innerHTML = `
      <div class="mt-3 rounded border border-slate-800 bg-slate-950 p-2">
        <div class="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Function Interaction Maps</div>
        <div data-minard-signatures class="grid grid-cols-1 gap-2"></div>
      </div>
    `;

    void this.renderMinardSignatures(definitions, signatures, edges, runtimeHits);
  }

  private async ensureMinardRenderer(): Promise<boolean> {
    if (this.minardLoaded && window.TypeSigRenderer) return true;
    if (this.minardLoading) return this.minardLoading;
    this.minardLoading = (async () => {
      try {
        const url = 'https://cdn.jsdelivr.net/gh/afcondon/minard@main/type-sig-viz/public/renderer.js';
        const src = await fetch(url).then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))));
        // Renderer defines `TypeSigRenderer` in global scope.
        // eslint-disable-next-line no-new-func
        new Function(`${src}\n;window.TypeSigRenderer = typeof TypeSigRenderer !== 'undefined' ? TypeSigRenderer : window.TypeSigRenderer;`)();
        this.minardLoaded = !!window.TypeSigRenderer;
      } catch {
        this.minardLoaded = false;
      } finally {
        this.minardLoading = null;
      }
      return this.minardLoaded;
    })();
    return this.minardLoading;
  }

  private parseSignatureAst(sig: string): unknown {
    // Minimal parser for Minard renderer input shape.
    let s = sig.trim();
    const forallMatch = s.match(/^forall\s+([a-zA-Z0-9_\s]+)\.\s*(.+)$/);
    if (forallMatch) {
      const vars = forallMatch[1].trim().split(/\s+/).filter(Boolean);
      return { tag: 'forall', vars, body: this.parseSignatureAst(forallMatch[2]) };
    }
    if (s.includes('=>')) {
      const parts = s.split('=>').map((x) => x.trim()).filter(Boolean);
      const body = parts.pop() ?? 'Unit';
      const constraints = parts.map((c) => {
        const cParts = c.split(/\s+/).filter(Boolean);
        return {
          tag: 'constraint',
          name: cParts[0] ?? 'Constraint',
          args: cParts.slice(1).map((a) => this.parseSignatureAst(a)),
        };
      });
      return { tag: 'constrained', constraints, body: this.parseSignatureAst(body) };
    }
    const arrows = s.split(/\s*->\s*/).map((x) => x.trim()).filter(Boolean);
    if (arrows.length > 1) {
      return {
        tag: 'function',
        params: arrows.slice(0, -1).map((p) => this.parseSignatureAst(p)),
        returnType: this.parseSignatureAst(arrows[arrows.length - 1]),
      };
    }
    if (s.startsWith('(') && s.endsWith(')')) {
      return { tag: 'parens', inner: this.parseSignatureAst(s.slice(1, -1)) };
    }
    const tokens = s.split(/\s+/).filter(Boolean);
    if (tokens.length <= 1) {
      const t = tokens[0] ?? 'Unit';
      return /^[a-z]/.test(t) ? { tag: 'typevar', name: t } : { tag: 'constructor', name: t };
    }
    const head = tokens[0];
    return {
      tag: 'applied',
      constructor: /^[a-z]/.test(head) ? { tag: 'typevar', name: head } : { tag: 'constructor', name: head },
      args: tokens.slice(1).map((t) => (/^[a-z]/.test(t) ? { tag: 'typevar', name: t } : { tag: 'constructor', name: t })),
    };
  }

  private async renderMinardSignatures(
    definitions: Array<{ name: string; line: number; body: string }>,
    signatures: Map<string, string>,
    edges: Array<{ from: string; to: string }>,
    runtimeHits: string[],
  ) {
    if (!this.codeVisPanel) return;
    const host = this.codeVisPanel.querySelector<HTMLElement>('[data-minard-signatures]');
    if (!host) return;
    host.innerHTML = '<div class="text-xs text-slate-500">Loading Minard renderer…</div>';
    const ok = await this.ensureMinardRenderer();
    if (!ok || !window.TypeSigRenderer) {
      host.innerHTML = '<div class="text-xs text-amber-300">Minard renderer unavailable. Check network access.</div>';
      return;
    }
    host.innerHTML = '';

    const umlWrap = document.createElement('div');
    umlWrap.className = 'mb-2 rounded border border-slate-800 bg-slate-900/40 p-2 overflow-auto';
    umlWrap.appendChild(this.renderUmlDiagram(definitions, signatures, edges, runtimeHits));
    host.appendChild(umlWrap);

    for (const def of definitions.slice(0, 8)) {
      const sig = signatures.get(def.name);
      if (!sig) continue;
      const card = document.createElement('div');
      card.className = 'rounded border border-slate-800 bg-slate-900/40 p-2 overflow-auto';
      try {
        const ast = this.parseSignatureAst(sig);
        const svg = window.TypeSigRenderer.renderSignature(def.name, sig, ast, {});
        if (svg) {
          svg.setAttribute('width', '100%');
          card.appendChild(svg);
        }
      } catch {
        const fallback = document.createElement('div');
        fallback.className = 'text-xs text-slate-400 font-mono';
        fallback.textContent = `${def.name} : ${sig}`;
        card.appendChild(fallback);
      }
      host.appendChild(card);
    }
    if (!host.hasChildNodes()) {
      host.innerHTML = '<div class="text-xs text-slate-500">No typed top-level bindings found.</div>';
    }
  }

  private renderUmlDiagram(
    definitions: Array<{ name: string; line: number; body: string }>,
    signatures: Map<string, string>,
    edges: Array<{ from: string; to: string }>,
    runtimeHits: string[],
  ): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex flex-col gap-3';

    let compiledProgram: { functions?: Record<string, { instructions?: unknown[] }> } | null = null;
    if (this.editor && vlib) {
      try {
        const source = this.materializeInputs(this.getProgramSource());
        const compilation = vlib.compileJS(source);
        if (compilation?.ok) {
          compiledProgram = JSON.parse(compilation.output) as { functions?: Record<string, { instructions?: unknown[] }> };
        }
      } catch {
        compiledProgram = null;
      }
    }

    const mkPanZoom = (svg: SVGElement) => {
      const frame = document.createElement('div');
      frame.className = 'rounded border border-slate-800 bg-slate-900/40 p-2';
      const controls = document.createElement('div');
      controls.className = 'mb-2 flex items-center gap-2 text-[10px] text-slate-300';
      controls.innerHTML = '<button data-reset class="rounded border border-slate-600 px-2 py-0.5 hover:bg-slate-800">Reset View</button>';
      const viewport = document.createElement('div');
      viewport.className = 'overflow-auto rounded border border-slate-800 bg-[#020617]';
      viewport.style.height = '420px';
      viewport.style.cursor = 'grab';
      const inner = document.createElement('div');
      inner.style.transformOrigin = '0 0';
      inner.style.willChange = 'transform';
      inner.appendChild(svg);
      viewport.appendChild(inner);
      frame.appendChild(controls);
      frame.appendChild(viewport);

      let scale = 1.25;
      let tx = 0;
      let ty = 0;
      const apply = () => {
        inner.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      };
      apply();
      let dragging = false;
      let sx = 0;
      let sy = 0;
      viewport.addEventListener('mousedown', (e) => {
        dragging = true;
        sx = e.clientX - tx;
        sy = e.clientY - ty;
        viewport.style.cursor = 'grabbing';
      });
      window.addEventListener('mouseup', () => {
        dragging = false;
        viewport.style.cursor = 'grab';
      });
      window.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        tx = e.clientX - sx;
        ty = e.clientY - sy;
        apply();
      });
      viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        const next = Math.max(0.55, Math.min(2.6, scale * (e.deltaY > 0 ? 0.92 : 1.08)));
        scale = next;
        apply();
      }, { passive: false });
      const reset = controls.querySelector<HTMLButtonElement>('[data-reset]');
      reset?.addEventListener('click', () => {
        scale = 1.25;
        tx = 0;
        ty = 0;
        apply();
      });

      return frame;
    };

    const fnEntries = Object.entries(compiledProgram?.functions ?? {}).map(([name, fn]) => {
      const ins = Array.isArray(fn.instructions) ? fn.instructions : [];
      let jumps = 0;
      let builtins = 0;
      const callees: string[] = [];
      for (const row of ins) {
        if (!Array.isArray(row) || row.length === 0) continue;
        const op = String(row[0]);
        if (op === 'JUMP' || op === 'JUMP_IF_FALSE' || op === 'JUMP_IF_TRUE') jumps += 1;
        if (op === 'CALL_BUILTIN') builtins += 1;
        if (op === 'CALL' && typeof row[2] === 'string') callees.push(String(row[2]));
      }
      return { name, insCount: ins.length, jumps, builtins, callees };
    });
    const topFns = [...fnEntries].sort((a, b) => b.insCount - a.insCount).slice(0, 12);
    const maxIns = Math.max(1, ...topFns.map((f) => f.insCount));

    const mkGraph = (w: number, h: number, title: string) => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.setAttribute('width', String(w));
      svg.setAttribute('height', String(h));
      svg.setAttribute('style', 'background:#071026;border-radius:8px;');
      const mk = (tag: string, attrs: Record<string, string>) => {
        const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
        return el;
      };
      const txt = (x: number, y: number, t: string, fill: string, size = 11, weight = '500') => {
        const el = mk('text', { x: String(x), y: String(y), fill, 'font-size': String(size), 'font-family': 'ui-monospace, SFMono-Regular, Menlo, monospace', 'font-weight': weight });
        el.textContent = t;
        return el;
      };
      svg.appendChild(txt(16, 22, title, '#cbd5e1', 14, '700'));
      return { svg, mk, txt };
    };

    // 1) Performance heaviness graph
    const perf = mkGraph(1250, Math.max(280, 72 + topFns.length * 34), 'Compiled Function Heaviness');
    topFns.forEach((f, i) => {
      const y = 56 + i * 34;
      const barW = Math.max(20, Math.floor((f.insCount / maxIns) * 620));
      const c = f.jumps > 0 ? '#f59e0b' : '#60a5fa';
      perf.svg.appendChild(perf.mk('rect', { x: '255', y: String(y - 16), width: String(barW), height: '20', rx: '6', fill: c, opacity: '0.9' }));
      perf.svg.appendChild(perf.txt(18, y - 2, f.name, '#e2e8f0', 11, '700'));
      perf.svg.appendChild(perf.txt(264 + barW, y - 2, `ins:${f.insCount}  branches:${f.jumps}  builtins:${f.builtins}`, '#cbd5e1', 10, '600'));
    });
    wrapper.appendChild(mkPanZoom(perf.svg));

    // 2) Decision graph
    const decisionFns = topFns.filter((f) => f.jumps > 0).slice(0, 4);
    decisionFns.forEach((f) => {
      const d = mkGraph(1200, Math.max(320, 170 + f.jumps * 120), `Decision Graph: ${f.name}`);
      const cx = 600;
      let y = 74;
      d.svg.appendChild(d.mk('circle', { cx: String(cx), cy: String(y), r: '10', fill: '#22c55e' }));
      for (let i = 0; i < f.jumps; i += 1) {
        const ny = y + 104;
        const pts = `${cx},${ny - 30} ${cx + 120},${ny} ${cx},${ny + 30} ${cx - 120},${ny}`;
        d.svg.appendChild(d.mk('line', { x1: String(cx), y1: String(y + 10), x2: String(cx), y2: String(ny - 30), stroke: '#94a3b8', 'stroke-width': '2' }));
        d.svg.appendChild(d.mk('polygon', { points: pts, fill: '#1f2937', stroke: '#f59e0b', 'stroke-width': '2' }));
        d.svg.appendChild(d.txt(cx - 76, ny + 4, `branch ${i + 1}`, '#fde68a', 11, '700'));
        d.svg.appendChild(d.mk('line', { x1: String(cx - 120), y1: String(ny), x2: String(cx - 240), y2: String(ny + 48), stroke: '#60a5fa', 'stroke-width': '2' }));
        d.svg.appendChild(d.mk('line', { x1: String(cx + 120), y1: String(ny), x2: String(cx + 240), y2: String(ny + 48), stroke: '#34d399', 'stroke-width': '2' }));
        y = ny;
      }
      const ey = y + 92;
      d.svg.appendChild(d.mk('line', { x1: String(cx), y1: String(y + 10), x2: String(cx), y2: String(ey - 16), stroke: '#94a3b8', 'stroke-width': '2' }));
      d.svg.appendChild(d.mk('circle', { cx: String(cx), cy: String(ey), r: '12', fill: '#0f172a', stroke: '#22c55e', 'stroke-width': '3' }));
      d.svg.appendChild(d.mk('circle', { cx: String(cx), cy: String(ey), r: '5', fill: '#22c55e' }));
      wrapper.appendChild(mkPanZoom(d.svg));
    });

    // 3) Call graph
    const cg = mkGraph(1250, 720, 'Compiled Call Graph');
    const nodes = topFns.map((f, idx) => {
      const a = (Math.PI * 2 * idx) / Math.max(1, topFns.length);
      const x = 625 + Math.cos(a) * 260;
      const y = 360 + Math.sin(a) * 220;
      const r = 22 + Math.round((f.insCount / maxIns) * 18);
      return { name: f.name, x, y, r };
    });
    const nodeMap = new Map(nodes.map((n) => [n.name, n]));
    topFns.forEach((f) => {
      for (const c of f.callees) {
        const a = nodeMap.get(f.name);
        const b = nodeMap.get(c);
        if (!a || !b) continue;
        cg.svg.appendChild(cg.mk('line', { x1: String(a.x), y1: String(a.y), x2: String(b.x), y2: String(b.y), stroke: '#60a5fa', 'stroke-width': '1.8', opacity: '0.85' }));
      }
    });
    nodes.forEach((n) => {
      cg.svg.appendChild(cg.mk('circle', { cx: String(n.x), cy: String(n.y), r: String(n.r), fill: '#1e293b', stroke: '#818cf8', 'stroke-width': '2' }));
      cg.svg.appendChild(cg.txt(n.x - n.r + 6, n.y + 4, n.name, '#e2e8f0', 10, '700'));
    });
    wrapper.appendChild(mkPanZoom(cg.svg));

    const sigNote = document.createElement('div');
    sigNote.className = 'rounded border border-slate-800 bg-slate-900/40 p-2 text-[11px] text-slate-400';
    sigNote.innerHTML = topFns
      .slice(0, 8)
      .map((f) => `<div><span class="text-slate-200">Function ${escapeHtml(f.name)}</span> : ${escapeHtml(signatures.get(f.name) ?? '(inferred)')}</div>`)
      .join('');
    wrapper.appendChild(sigNote);

    return wrapper;
  }

  /** Lazily create the FinVM worker; null (→ main-thread fallback) if it can't. */
  private ensureFinvmWorker(): FinvmWorkerClient | null {
    if (this.finvmWorker) return this.finvmWorker;
    if (this.finvmWorkerFailed) return null;
    try {
      this.finvmWorker = new FinvmWorkerClient();
      return this.finvmWorker;
    } catch {
      this.finvmWorkerFailed = true;
      return null;
    }
  }

  private async runFinvmProgram(programJson: string, persistState: boolean): Promise<{ ok: true; resultText: string; steps: number } | { ok: false; error: string }> {
    const finvm = finvmLib as FinVmModule;
    try {
      const program = JSON.parse(programJson);
      const source = this.materializeInputs(this.getProgramSource());
      const srcSig = sourceSignature(source);
      const { userState, machineSnapshot, sourceSig: savedSig } = persistState
        ? splitNotebookFinvmState(this.finvmState)
        : { userState: {}, machineSnapshot: null, sourceSig: null };
      const snapshot =
        persistState && machineSnapshot != null && savedSig === srcSig ? machineSnapshot : undefined;
      const storage = this.effectStorage ?? createEffectStorage();
      this.effectStorage = storage;
      const entry = typeof program.entrypoint === 'string' ? program.entrypoint : 'main';
      const vmOut = await runProgramWithEffects(finvm, JSON.stringify(program), {
        state: userState,
        machineSnapshot: snapshot,
        entryFunction: entry,
        handlers: createFinvmHandlers(storage),
      });
      if (!vmOut.ok) {
        return { ok: false, error: vmOut.error };
      }
      this.lastVmSteps = vmOut.steps;
      const dbState = effectDbTablesToFinvmState(storage.listDbTables());
      if (persistState) {
        this.finvmState = mergeNotebookFinvmState({
          userState: vmOut.state,
          machineSnapshot: vmOut.snapshot,
          sourceSig: srcSig,
          dbState,
        });
      } else {
        this.finvmState = {
          ...this.finvmState,
          '__finvm.db': dbState,
        };
      }
      if (this.vmStatePanel) {
        this.renderVmState({
          status: vmOut.vmStatus,
          steps: vmOut.steps,
          result: vmOut.result,
          state: vmOut.state,
        });
      }
      this.refreshDbQueryOutput();
      return {
        ok: true,
        resultText: formatVmValue(vmOut.result),
        steps: vmOut.steps,
      };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }

  private onRuntimeInputsChanged() {
    this.refreshInputsPreview();
    this.runDiagnostics();
    this.runInlineResults();
    this.markVizDirty();
  }

  private materializeInputs(code: string): string {
    const runtimeInputs = this.readRuntimeInputs();
    let materialized = code;
    for (const [key, value] of Object.entries(runtimeInputs)) {
      materialized = materialized.replaceAll(`__INPUT_${key}__`, toVerdictLiteral(value));
    }
    // Any unresolved input token defaults to 0 so the program still compiles.
    materialized = materialized.replace(/__INPUT_[A-Za-z0-9_]+__/g, '0');
    return materialized;
  }

  private readRuntimeInputs(): Record<string, unknown> {
    const out: Record<string, unknown> = {
      symbol: this.currentSymbol(),
      assetsCsv: this.assetsCsvInput?.value ?? 'BTCUSD,ETHUSD,ADAUSD',
      signalThreshold: Number(this.signalThresholdInput?.value ?? '2'),
      positionBias: Number(this.positionBiasInput?.value ?? '0'),
      loopIntervalMs: Number(this.loopIntervalInput?.value ?? '5000'),
      historyCap: Number(this.historyCapInput?.value ?? '240'),
      telegramBotToken: this.telegramBotTokenInput?.value ?? '',
      telegramChatId: this.telegramChatIdInput?.value ?? '',
    };
    if (this.inputsList) {
      const rows = this.inputsList.querySelectorAll<HTMLDivElement>('[data-input-row]');
      rows.forEach((row) => {
        const keyInput = row.querySelector<HTMLInputElement>('[data-input-key]');
        const valueInput = row.querySelector<HTMLInputElement>('[data-input-value]');
        const key = (keyInput?.value ?? '').trim();
        if (key === '') return;
        const raw = (valueInput?.value ?? '').trim();
        if (/^-?\d+$/.test(raw)) {
          out[key] = Number(raw);
        } else {
          out[key] = raw;
        }
      });
    }
    return out;
  }


  private addInputField(key: string, value: string) {
    if (!this.inputsList) return;
    const row = document.createElement('div');
    row.dataset.inputRow = '1';
    row.className = 'grid grid-cols-[1fr_1fr_auto] gap-1.5';
    const keyInput = document.createElement('input');
    keyInput.dataset.inputKey = '1';
    keyInput.className = 'rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-mono text-slate-300 outline-none focus:border-indigo-400';
    keyInput.placeholder = 'key';
    keyInput.value = key;
    const valueInput = document.createElement('input');
    valueInput.dataset.inputValue = '1';
    valueInput.className = 'rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-mono text-slate-300 outline-none focus:border-indigo-400';
    valueInput.placeholder = 'value';
    valueInput.value = value;
    const removeBtn = document.createElement('button');
    removeBtn.className = 'rounded border border-rose-500/40 bg-rose-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-200';
    removeBtn.textContent = 'x';
    removeBtn.onclick = () => {
      row.remove();
      this.onRuntimeInputsChanged();
    };
    keyInput.oninput = () => this.onRuntimeInputsChanged();
    valueInput.oninput = () => this.onRuntimeInputsChanged();
    row.appendChild(keyInput);
    row.appendChild(valueInput);
    row.appendChild(removeBtn);
    this.inputsList.appendChild(row);
  }

  private refreshInputsPreview() {
    if (!this.inputsPreview) return;
    const userInputs = this.readRuntimeInputs();
    const preview = {
      mode: this.notebookApi?.getViewMode?.() === 'notebook' ? 'notebook' : 'program',
      userInputs,
      placeholders: Object.keys(userInputs).map((k) => `__INPUT_${k}__`),
      note: 'Shared across all cells. __INPUT_* placeholders are substituted before compile/eval. Market data is fetched in Verdict (httpGet).',
    };
    const json = JSON.stringify(preview, null, 2);
    this.inputsPreview.innerHTML = `<pre class="whitespace-pre-wrap break-words">${escapeHtml(json)}</pre>`;
  }

  private refreshDbQueryOutput() {
    if (!this.dbQueryOutput) return;
    const query = (this.dbQueryInput?.value ?? 'tables').trim();
    const tables = extractDbTables(this.finvmState);
    const result = runDbQuery(query, tables);
    this.dbQueryOutput.innerHTML = `<pre class="whitespace-pre-wrap break-words">${escapeHtml(JSON.stringify(result, null, 2))}</pre>`;
  }

  private currentSymbol(): string {
    const raw = (this.symbolInput?.value ?? 'BTCUSD').trim().toUpperCase();
    return raw === '' ? 'BTCUSD' : raw;
  }

  disconnectedCallback() {
    this.stopLiveLoop();
    if (this.diagnosticsTimer !== null) {
      window.clearTimeout(this.diagnosticsTimer);
      this.diagnosticsTimer = null;
    }
    this.resizeCleanup?.();
    this.resizeCleanup = null;
    this.editor?.destroy();
    this.bytecodeEditor?.destroy();
    this.editor = null;
    this.bytecodeEditor = null;
    this.vmStatePanel = null;
    this.vmObserverPanel = null;
    this.vmDbPanel = null;
    // Reset so a reconnect (e.g. SPA route re-entry) rebuilds from scratch
    // rather than leaving disposed editors behind.
    this.innerHTML = '';
    this.built = false;
  }
}

class VerdictEditorDebugElement extends VerdictEditorElement {
  protected isDebugView(): boolean {
    return true;
  }
}

interface FinVmModule {
  runEffectStart: (programJson: string) => (overridesJson: string) => string;
  runEffectResume: (programJson: string) => (snapshotJson: string) => (deliveriesJson: string) => string;
}

customElements.define('verdict-editor', VerdictEditorElement);
customElements.define('verdict-editor-debug', VerdictEditorDebugElement);
