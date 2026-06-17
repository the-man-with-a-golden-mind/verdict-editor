// Monaco optimization: use the lightweight editor API and import only the
// contributions we actively use. This trims bundle size versus `edcore.main`.
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/editor/contrib/hover/browser/hoverContribution.js';
import 'monaco-editor/esm/vs/editor/contrib/suggest/browser/suggest.js';
import 'monaco-editor/esm/vs/editor/contrib/bracketMatching/browser/bracketMatching.js';
import 'monaco-editor/esm/vs/editor/contrib/find/browser/findController.js';
import {
  createEffectStorage,
  createFinvmHandlers,
  effectDbTablesToFinvmState,
  runProgramWithEffects,
  type EffectStorage,
} from './editor/effectDriver';
import {
  escapeHtml,
  extractDbTables,
  formatVmValue,
  renderJsonForPanel,
  runDbQuery,
  toVerdictLiteral,
} from './editor/runtimeUtils';
import { installArrowOverlay } from './editor/vizArrows';
import { extractDocs, gasFromBytecode, renderCallGraph, type GasInfo } from './editor/vizGraph';

declare global {
  interface Window {
    TypeSigRenderer?: {
      renderSignature: (name: string, sig: string, ast: unknown, options?: { className?: string }) => SVGElement;
    };
  }
}

// Wire up Monaco's base editor worker via Vite's native `?worker` import.
// Without this, Monaco requests a worker from an undefined URL (the
// `:5173/undefined` error) and falls back to slow main-thread parsing.
//
// We deliberately do NOT load the JSON language-service worker: the bytecode
// panel is read-only and only needs syntax colours, not validation/IntelliSense.
// In dev that worker's module graph is ~210 unbundled ESM files (several seconds
// of round-trips on a cold load), so the bytecode panel uses a tiny custom
// Monarch tokenizer instead — zero workers. The `verdict` language is likewise
// custom and worker-free, so the base editor worker is all we need.
// @ts-ignore - Vite ?worker imports have no type declarations
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

(self as any).MonacoEnvironment = {
  getWorker() {
    return new EditorWorker();
  },
};

// Shared monospace stack for every Monaco surface in the app.
const FONT_MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

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

// The Verdict brand editor theme: a deep navy canvas with a violet accent,
// teal types, amber strings — tuned to read crisply against the slate chrome.
let themeDefined = false;
function defineVerdictTheme() {
  if (themeDefined) return;
  themeDefined = true;
  monaco.editor.defineTheme('verdict-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'a78bfa', fontStyle: 'bold' }, // violet-400
      { token: 'type.identifier', foreground: '5eead4' },            // teal-300
      { token: 'type', foreground: '5eead4' },
      { token: 'string', foreground: 'fcd34d' },                     // amber-300
      { token: 'string.quote', foreground: 'fcd34d' },
      { token: 'string.escape', foreground: 'fbbf24' },
      { token: 'number', foreground: 'f0abfc' },                     // fuchsia-300
      { token: 'number.float', foreground: 'f0abfc' },
      { token: 'comment', foreground: '7c8596' },
      { token: 'operator', foreground: '93c5fd' },                   // blue-300
      { token: 'delimiter', foreground: '94a3b8' },
      { token: 'identifier', foreground: 'e2e8f0' },
    ],
    colors: {
      'editor.background': '#0b0f1a',
      'editor.foreground': '#e2e8f0',
      'editorLineNumber.foreground': '#334155',
      'editorLineNumber.activeForeground': '#a78bfa',
      'editor.lineHighlightBackground': '#121829',
      'editor.lineHighlightBorder': '#00000000',
      'editor.selectionBackground': '#3730a3aa',
      'editorCursor.foreground': '#a78bfa',
      'editorIndentGuide.background1': '#1e293b',
      'editorIndentGuide.activeBackground1': '#334155',
      'editorWhitespace.foreground': '#1e293b',
      'editorGutter.background': '#0b0f1a',
      'editorError.foreground': '#fb7185',
      'editorBracketMatch.background': '#3730a366',
      'editorBracketMatch.border': '#a78bfa',
      'scrollbarSlider.background': '#1e293bcc',
      'scrollbarSlider.hoverBackground': '#334155',
    },
  });
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
      importPublicModule('/lib/finvm.mjs'),
    ]).then(([v, f]) => {
      vlib = v;
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

// A structured diagnostic from the Verdict compiler. Positions are 1-based,
// matching Monaco, so they map across directly.
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

function defineVerdict() {
  monaco.languages.register({ id: 'verdict' });

  monaco.languages.setMonarchTokensProvider('verdict', {
    keywords: [
      'module', 'exposing', 'if', 'then', 'else', 'let', 'in', 'switch', 'match', 'type', 'import'
    ],
    typeKeywords: [
      'Int', 'Fixed', 'Rational', 'Bool', 'String', 'Unit', 'Pid', 'Json', 'List', 'Option', 'Result', 'Decoder', 'Encoder', 'Some', 'None', 'Ok', 'Err'
    ],
    operators: [
      '+', '-', '*', '/', '==', '<', '>', '=', '->', '%'
    ],
    symbols: /[=><!~?:&|+\-*\/\^%]+/,
    escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
    tokenizer: {
      root: [
        [/[a-z_$][\w$]*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
        [/[A-Z][\w\$]*/, 'type.identifier'],
        { include: '@whitespace' },
        [/[{}()\[\]]/, '@brackets'],
        [/@symbols/, { cases: { '@operators': 'operator', '@default': '' } }],
        [/\d+\.\d+/, 'number.float'],
        [/\d+/, 'number'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }]
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/@escapes/, 'string.escape'],
        [/\\./, 'string.escape.invalid'],
        [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
      ],
      whitespace: [
        [/[ \t\r\n]+/, 'white'],
        [/--.*$/, 'comment'],
        [/\/\/.*$/, 'comment']
      ]
    }
  });

  monaco.languages.registerCompletionItemProvider('verdict', {
    provideCompletionItems: (model, position) => {
      const suggestions: monaco.languages.CompletionItem[] = [
        ...['module', 'exposing', 'if', 'then', 'else', 'let', 'in', 'switch', 'match', 'type', 'import'].map(k => ({
          label: k,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: k,
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: position.column - 1,
            endColumn: position.column
          }
        })),
        ...['Int', 'Fixed', 'Rational', 'Bool', 'String', 'Unit', 'Pid', 'Json', 'List', 'Option', 'Result', 'Decoder', 'Encoder'].map(t => ({
          label: t,
          kind: monaco.languages.CompletionItemKind.Struct,
          insertText: t,
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: position.column - 1,
            endColumn: position.column
          }
        })),
        ...[
          'mod', 'length', 'get', 'append', 'spawn', 'send', 'recv', 'yield', 'self',
          'and', 'or', 'not', 'modPow', 'modInv', 'max', 'min', 'abs', 'clamp', 'gcd', 'lcm', 'pow', 'sqrtFloor',
          'map', 'filter', 'foldl', 'isEmpty', 'range', 'reverse', 'concat', 'sum', 'product', 'contains', 'take', 'drop', 'all', 'any', 'count', 'find', 'flatMap', 'replicate', 'head', 'last',
          'mapOption', 'isNone', 'andThen', 'orElse', 'withDefault', 'isSome', 'isOk', 'okOr', 'mapResult',
          'strLength', 'strConcat', 'strSlice', 'indexOf', 'strContains', 'split', 'toUpper', 'toLower', 'trim', 'fromInt', 'replace', 'parseInt',
          'regexTest', 'regexFindAll', 'regexReplace', 'regexSplit',
          'httpGet', 'httpPost', 'sysLog', 'sysCwd', 'sysReadText', 'sysWriteText', 'sysEnv',
          'dbInsert', 'dbGet', 'dbGetOpt', 'dbUpdate', 'dbDelete', 'dbQuery', 'dbCreateIndex', 'dbHash',
          'cacheSet', 'cacheGet', 'cacheDelete',
          'sortInts', 'distinctInts', 'sumIntsFast', 'averageFloor', 'statsMin', 'statsMax', 'meanFloor', 'median', 'percentileNearest', 'varianceFloor', 'stddevFloor', 'describeInts', 'valueCountsInts', 'rollingSumInts'
        ].map(f => ({
          label: f,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: f + '($1)' ,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: position.column - 1,
            endColumn: position.column
          }
        }))
      ];
      return { suggestions };
    }
  });

  // A worker-free JSON highlighter for the read-only bytecode panel. Monaco's
  // built-in `json` language pulls in a heavy language-service worker we don't
  // need; this Monarch grammar gives the same colours with zero workers.
  monaco.languages.register({ id: 'finvm-bytecode' });
  monaco.languages.setMonarchTokensProvider('finvm-bytecode', {
    tokenizer: {
      root: [
        [/"(?:[^"\\]|\\.)*"(?=\s*:)/, 'type'],         // object keys
        [/"(?:[^"\\]|\\.)*"/, 'string'],               // string values
        [/\b(?:true|false|null)\b/, 'keyword'],
        [/-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/, 'number'],
        [/[{}[\]]/, '@brackets'],
        [/[,:]/, 'delimiter'],
      ],
    },
  });

  // Type-on-hover: show `name : Type` for the identifier under the cursor.
  // Signatures are recomputed from the live source on each hover (parse-only,
  // so it works even while the body has type errors). User definitions are
  // listed after the prelude, so a later entry wins and shadows built-ins.
  monaco.languages.registerHoverProvider('verdict', {
    provideHover: (model, position) => {
      const word = model.getWordAtPosition(position);
      if (!word || !vlib) return null;

      let signatures: VerdictSignature[];
      try {
        signatures = vlib.signaturesJS(model.getValue());
      } catch {
        return null;
      }

      let signature: string | null = null;
      for (const s of signatures) {
        if (s.name === word.word) signature = s.signature;
      }
      if (signature === null) return null;

      return {
        range: new monaco.Range(
          position.lineNumber, word.startColumn,
          position.lineNumber, word.endColumn
        ),
        contents: [
          { value: '```verdict\n' + word.word + ' : ' + signature + '\n```' },
        ],
      };
    }
  });
}

class VerdictEditorElement extends HTMLElement {
  private activeSideTab: 'output' | 'inputs' = 'output';
  private activeMainTab: 'editor' | 'db' | 'debug' | 'visual' = 'editor';
  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private bytecodeEditor: monaco.editor.IStandaloneCodeEditor | null = null;
  private container!: HTMLDivElement;
  private outputPanel!: HTMLDivElement;
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
  private resizeCleanup: (() => void) | null = null;
  private statusBar!: HTMLDivElement;
  private intervalInput: HTMLInputElement | null = null;
  private symbolInput: HTMLInputElement | null = null;
  private assetsCsvInput: HTMLInputElement | null = null;
  private signalThresholdInput: HTMLInputElement | null = null;
  private positionBiasInput: HTMLInputElement | null = null;
  private telegramBotTokenInput: HTMLInputElement | null = null;
  private telegramChatIdInput: HTMLInputElement | null = null;
  private runToggleBtn: HTMLButtonElement | null = null;
  private diagnosticsTimer: number | null = null;
  private pollTimer: number | null = null;
  private tickInFlight = false;
  private liveRunning = false;
  private liveTickCount = 0;
  private busyCount = 0;
  private finvmState: Record<string, unknown> = {};
  private effectStorage: EffectStorage | null = null;
  private resultDecorations: monaco.editor.IEditorDecorationsCollection | null = null;
  private latestCompiledProgram: unknown = null;
  private latestVmSnapshot: unknown = null;
  private lastVmSteps = 0;
  private vmMetricsHistory: Array<{ memoryBytes: number; load: number; tables: number; rows: number; regs: number; threshold: number }> = [];
  private minardLoaded = false;
  private minardLoading: Promise<boolean> | null = null;
  private built = false;

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
    // with building the DOM and Monaco editor.
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

    // A small editor-pane header and main tabs (Editor / DB).
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
    mainTabBar.appendChild(mkMainTabBtn('editor', 'Editor'));
    mainTabBar.appendChild(mkMainTabBtn('db', 'DB'));
    mainTabBar.appendChild(mkMainTabBtn('visual', 'Visual'));
    mainTabBar.appendChild(mkMainTabBtn('debug', 'Debug'));

    this.statusBar = document.createElement('div');
    this.statusBar.className = STATUS_BASE + ' text-slate-500';
    this.statusBar.textContent = 'Ready';

    leftPane.appendChild(editorHeader);
    leftPane.appendChild(mainTabBar);
    leftPane.appendChild(this.container);
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
      if (this.liveRunning) {
        this.stopLiveLoop();
      } else {
        void this.startLiveLoop();
      }
    };
    startStopRow.appendChild(this.runToggleBtn);

    const tabBar = document.createElement('div');
    tabBar.className = 'flex items-center gap-1 border-b border-slate-800 bg-slate-950 px-2 py-1.5';
    const mkTabBtn = (id: 'output' | 'inputs', label: string) => {
      const btn = document.createElement('button');
      btn.className = 'rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider';
      btn.textContent = label;
      btn.onclick = () => this.setActiveSideTab(id);
      return btn;
    };
    const outputTabBtn = mkTabBtn('output', 'Output');
    const inputsTabBtn = mkTabBtn('inputs', 'Inputs');
    outputTabBtn.dataset.tabId = 'output';
    inputsTabBtn.dataset.tabId = 'inputs';
    tabBar.appendChild(outputTabBtn);
    tabBar.appendChild(inputsTabBtn);

    this.outputPanel = document.createElement('div');
    this.outputPanel.className = 'flex-1 min-h-0 overflow-auto p-4 font-mono text-sm leading-relaxed bg-[#0b0f1a] text-emerald-300';
    this.outputPanel.innerHTML = '<div class="text-slate-600 italic">Press Run to compile and execute → results appear here.</div>';

    this.inputsPanel = document.createElement('div');
    this.inputsPanel.className = 'hidden flex-1 min-h-0 overflow-auto bg-[#0b0f1a] p-3';
    const inputsWrap = document.createElement('div');
    inputsWrap.className = 'flex h-full flex-col gap-2';
    const inputsHint = document.createElement('div');
    inputsHint.className = 'text-[11px] text-slate-400';
    inputsHint.textContent = 'Use placeholders in code: __INPUT_key__. Values come from fields below.';
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
    this.symbolInput.oninput = () => {
      this.refreshInputsPreview();
      this.runDiagnostics();
      this.runInlineResults();
    };
    this.intervalInput = document.createElement('input');
    this.intervalInput.type = 'number';
    this.intervalInput.min = '1';
    this.intervalInput.step = '1';
    this.intervalInput.className = 'w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-mono text-slate-300 outline-none focus:border-indigo-400';
    this.intervalInput.value = '5';
    this.intervalInput.setAttribute('aria-label', 'Polling interval seconds');
    this.intervalInput.oninput = () => {
      this.refreshInputsPreview();
      this.runDiagnostics();
      this.runInlineResults();
    };
    this.assetsCsvInput = document.createElement('input');
    this.assetsCsvInput.className = 'w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-mono text-slate-300 outline-none focus:border-indigo-400';
    this.assetsCsvInput.value = 'BTCUSD,ETHUSD,ADAUSD';
    this.assetsCsvInput.setAttribute('aria-label', 'Assets CSV');
    this.assetsCsvInput.oninput = () => {
      this.refreshInputsPreview();
      this.runDiagnostics();
      this.runInlineResults();
    };
    this.signalThresholdInput = document.createElement('input');
    this.signalThresholdInput.type = 'number';
    this.signalThresholdInput.className = 'w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-mono text-slate-300 outline-none focus:border-indigo-400';
    this.signalThresholdInput.value = '2';
    this.signalThresholdInput.setAttribute('aria-label', 'Signal threshold');
    this.signalThresholdInput.oninput = this.assetsCsvInput.oninput;
    this.positionBiasInput = document.createElement('input');
    this.positionBiasInput.type = 'number';
    this.positionBiasInput.className = 'w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-mono text-slate-300 outline-none focus:border-indigo-400';
    this.positionBiasInput.value = '0';
    this.positionBiasInput.setAttribute('aria-label', 'Position bias');
    this.positionBiasInput.oninput = this.assetsCsvInput.oninput;
    this.telegramBotTokenInput = document.createElement('input');
    this.telegramBotTokenInput.className = 'w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-mono text-slate-300 outline-none focus:border-indigo-400';
    this.telegramBotTokenInput.value = '';
    this.telegramBotTokenInput.placeholder = '123456:ABC...';
    this.telegramBotTokenInput.setAttribute('aria-label', 'Telegram bot token');
    this.telegramBotTokenInput.oninput = this.assetsCsvInput.oninput;
    this.telegramChatIdInput = document.createElement('input');
    this.telegramChatIdInput.className = 'w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-mono text-slate-300 outline-none focus:border-indigo-400';
    this.telegramChatIdInput.value = '';
    this.telegramChatIdInput.placeholder = '-100123456789';
    this.telegramChatIdInput.setAttribute('aria-label', 'Telegram chat id');
    this.telegramChatIdInput.oninput = this.assetsCsvInput.oninput;
    fixedInputs.appendChild(mkLabel('symbol'));
    fixedInputs.appendChild(this.symbolInput);
    fixedInputs.appendChild(mkLabel('intervalSec'));
    fixedInputs.appendChild(this.intervalInput);
    fixedInputs.appendChild(mkLabel('assetsCsv'));
    fixedInputs.appendChild(this.assetsCsvInput);
    fixedInputs.appendChild(mkLabel('signalThreshold'));
    fixedInputs.appendChild(this.signalThresholdInput);
    fixedInputs.appendChild(mkLabel('positionBias'));
    fixedInputs.appendChild(this.positionBiasInput);
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
    rightPanel.appendChild(this.outputPanel);
    rightPanel.appendChild(this.inputsPanel);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'w-1.5 shrink-0 cursor-col-resize bg-slate-900/70 hover:bg-indigo-500/60 transition-colors';
    this.installResizeHandle(resizeHandle);

    this.mainContainer.appendChild(leftPane);
    this.mainContainer.appendChild(resizeHandle);
    this.mainContainer.appendChild(rightPanel);

    this.appendChild(this.mainContainer);

    if (!monaco.languages.getLanguages().some(l => l.id === 'verdict')) {
      defineVerdict();
    }
    defineVerdictTheme();

    this.bytecodeEditor = monaco.editor.create(bytecodeContainer, {
      value: '',
      language: 'finvm-bytecode',
      theme: 'verdict-dark',
      readOnly: true,
      minimap: { enabled: false },
      automaticLayout: true,
      fontSize: 12,
      fontFamily: FONT_MONO,
      lineNumbers: 'off',
      scrollBeyondLastLine: false,
      renderLineHighlight: 'none',
    });

    this.editor = monaco.editor.create(this.container, {
      value: [
        'module Main exposing (main)',
        '',
        '-- Market data: fetched from Binance in THIS code via httpGet.',
        '-- The editor only runs the VM and fulfils http/db/cache effects.',
        '-- All statistics below are computed in pure Verdict (the bundled runtime',
        '-- ships str/logic/bigint builtins; the rich stats/series builtins in the',
        '-- prelude are not linked into this VM, so we derive them from first',
        '-- principles with foldl + integer math).',
        '',
        'binanceSymbol : String -> String',
        'binanceSymbol sym =',
        '  if sym == "BTCUSD" then "BTCUSDT"',
        '  else if sym == "ETHUSD" then "ETHUSDT"',
        '  else if sym == "ADAUSD" then "ADAUSDT"',
        '  else sym',
        '',
        'binancePriceUrl : String -> String',
        'binancePriceUrl sym =',
        '  strConcat("https://api.binance.com/api/v3/ticker/price?symbol=", binanceSymbol(sym))',
        '',
        'dollarsToCents : String -> Int',
        'dollarsToCents px =',
        '  let parts = split(px, ".") in',
        '  let whole = withDefault(0, parseInt(withDefault("0", head(parts)))) in',
        '  let fracRaw = withDefault("0", head(drop(1, parts))) in',
        '  let frac = strSlice(fracRaw, 0, 2) in',
        '  let fracPad = if strLength(frac) < 2 then strConcat(frac, "0") else frac in',
        '  whole * 100 + withDefault(0, parseInt(fracPad))',
        '',
        '-- FinVM ships str.* builtins but no json.* builtins, so we pull the quoted',
        '-- "price" field out of the flat JSON body with string ops.',
        'jsonStringField : String -> String -> String',
        'jsonStringField key body =',
        '  let marker = strConcat("\\"", strConcat(key, "\\":\\"")) in',
        '  let afterKey = split(body, marker) in',
        '  if length(afterKey) < 2 then ""',
        '  else',
        '    let rest = withDefault("", head(drop(1, afterKey))) in',
        '    withDefault("", head(split(rest, "\\"")))',
        '',
        'priceCentsFromBody : String -> Int',
        'priceCentsFromBody body = dollarsToCents(jsonStringField("price", body))',
        '',
        'fetchPriceCents : String -> Int',
        'fetchPriceCents sym =',
        '  let res = httpGet(binancePriceUrl(sym)) in',
        '  if res.ok then priceCentsFromBody(res.body) else 0',
        '',
        'histKey : String -> String',
        'histKey sym = strConcat("hist:", sym)',
        '',
        '-- cacheGet returns unit on a miss; the stored value is the raw CSV string.',
        'histCsvOrEmpty : String -> String',
        'histCsvOrEmpty sym =',
        '  let raw = cacheGet("market", histKey(sym)) in',
        '  if raw == unit then "" else raw',
        '',
        'appendHistCsv : String -> Int -> String',
        'appendHistCsv csv px =',
        '  if strLength(csv) == 0 then fromInt(px)',
        '  else strConcat(csv, strConcat(",", fromInt(px)))',
        '',
        'saveHistCsv : String -> String -> Bool',
        'saveHistCsv sym csv = cacheSet("market", histKey(sym), csv)',
        '',
        '-- ── Series parsing & windowing ──────────────────────────────────────────────',
        'pushParsed : List Int -> String -> List Int',
        'pushParsed acc s = append(acc, withDefault(0, parseInt(trim(s))))',
        '',
        'parseCsvInts : String -> List Int',
        'parseCsvInts csv = foldl(pushParsed, [], split(csv, ","))',
        '',
        'lastN : Int -> List Int -> List Int',
        'lastN n xs =',
        '  let len = length(xs) in',
        '  let dropN = if len > n then len - n else 0 in',
        '  drop(dropN, xs)',
        '',
        'lastInt : List Int -> Int',
        'lastInt xs = withDefault(0, last(xs))',
        '',
        'listMin : List Int -> Int',
        'listMin xs = foldl(min, withDefault(0, head(xs)), xs)',
        '',
        'listMax : List Int -> Int',
        'listMax xs = foldl(max, withDefault(0, head(xs)), xs)',
        '',
        '-- ── Integer square root (Newton\'s method, pure Verdict) ─────────────────────',
        'isqrtGo : Int -> Int -> Int',
        'isqrtGo n x =',
        '  let y = (x + n / x) / 2 in',
        '  if y < x then isqrtGo(n, y) else x',
        '',
        'isqrt : Int -> Int',
        'isqrt n =',
        '  if n < 2 then (if n < 0 then 0 else n)',
        '  else isqrtGo(n, n / 2)',
        '',
        '-- ── Mean / variance / standard deviation (single-pass accumulator) ──────────',
        'accStat : { n : Int, s : Int, ss : Int } -> Int -> { n : Int, s : Int, ss : Int }',
        'accStat a x = { n = a.n + 1, s = a.s + x, ss = a.ss + x * x }',
        '',
        'statsOf : List Int -> { n : Int, s : Int, ss : Int }',
        'statsOf xs = foldl(accStat, { n = 0, s = 0, ss = 0 }, xs)',
        '',
        'meanOf : List Int -> Int',
        'meanOf xs =',
        '  let st = statsOf(xs) in',
        '  if st.n == 0 then 0 else st.s / st.n',
        '',
        '-- Population variance: E[x^2] - E[x]^2, clamped at 0 against rounding.',
        'varianceOf : List Int -> Int',
        'varianceOf xs =',
        '  let st = statsOf(xs) in',
        '  if st.n == 0 then 0',
        '  else',
        '    let m = st.s / st.n in',
        '    let v = st.ss / st.n - m * m in',
        '    if v < 0 then 0 else v',
        '',
        'stddevOf : List Int -> Int',
        'stddevOf xs = isqrt(varianceOf(xs))',
        '',
        '-- z-score in centi-sigma: (price - mean) * 100 / stddev',
        'zScoreOf : List Int -> Int',
        'zScoreOf xs =',
        '  let sd = stddevOf(xs) in',
        '  if sd == 0 then 0',
        '  else (lastInt(xs) - meanOf(xs)) * 100 / sd',
        '',
        '-- ── Exponential moving average (alpha = 2 / (period + 1)) ───────────────────',
        'emaAcc : { p : Int, e : Int, seen : Int } -> Int -> { p : Int, e : Int, seen : Int }',
        'emaAcc a x =',
        '  if a.seen == 0 then { p = a.p, e = x, seen = 1 }',
        '  else { p = a.p, e = (x * 2 + a.e * (a.p - 1)) / (a.p + 1), seen = a.seen + 1 }',
        '',
        'emaOf : Int -> List Int -> Int',
        'emaOf period xs =',
        '  let r = foldl(emaAcc, { p = period, e = 0, seen = 0 }, xs) in',
        '  r.e',
        '',
        '-- ── Linear-regression slope over the window (least squares, cents/step) ─────',
        'regAcc : { i : Int, sx : Int, sy : Int, sxy : Int, sxx : Int } -> Int -> { i : Int, sx : Int, sy : Int, sxy : Int, sxx : Int }',
        'regAcc a y =',
        '  { i = a.i + 1, sx = a.sx + a.i, sy = a.sy + y, sxy = a.sxy + a.i * y, sxx = a.sxx + a.i * a.i }',
        '',
        'slopeOf : List Int -> Int',
        'slopeOf xs =',
        '  let n = length(xs) in',
        '  if n < 2 then 0',
        '  else',
        '    let r = foldl(regAcc, { i = 0, sx = 0, sy = 0, sxy = 0, sxx = 0 }, xs) in',
        '    let denom = n * r.sxx - r.sx * r.sx in',
        '    if denom == 0 then 0 else (n * r.sxy - r.sx * r.sy) / denom',
        '',
        '-- range position: where the last price sits within [min,max], as percent 0..100',
        'rangePosOf : List Int -> Int',
        'rangePosOf xs =',
        '  let lo = listMin(xs) in',
        '  let hi = listMax(xs) in',
        '  if hi == lo then 50 else (lastInt(xs) - lo) * 100 / (hi - lo)',
        '',
        'momentumOf : List Int -> Int',
        'momentumOf xs =',
        '  let n = length(xs) in',
        '  if n < 2 then 0 else lastInt(xs) - xs[n - 2]',
        '',
        '-- ── Reporting helpers (str.* only; no json.*) ───────────────────────────────',
        'appendStr : String -> String -> String',
        'appendStr acc s = strConcat(acc, s)',
        '',
        'joinStr : List String -> String',
        'joinStr parts = foldl(appendStr, "", parts)',
        '',
        '-- Render integer cents as a human dollars string, e.g. 1234567 -> 12345.67',
        'centsToUsd : Int -> String',
        'centsToUsd c =',
        '  let whole = c / 100 in',
        '  let frac = c - whole * 100 in',
        '  let fracStr = if frac < 10 then strConcat("0", fromInt(frac)) else fromInt(frac) in',
        '  strConcat(fromInt(whole), strConcat(".", fracStr))',
        '',
        '-- Render a signed hundredths value (z-score sigma) like -1.50 / 2.30',
        'signedCentis : Int -> String',
        'signedCentis c =',
        '  if c < 0 then strConcat("-", centsToUsd(0 - c)) else centsToUsd(c)',
        '',
        '-- ── Signal scoring: blends trend, mean-reversion and momentum ───────────────',
        'scoreOf : Int -> Int -> Int -> Int -> Int -> Int -> Int',
        'scoreOf z emaFast emaSlow slope mom bias =',
        '  let cross = emaFast - emaSlow in',
        '  let trend = if cross > 0 then 2 else if cross < 0 then (0 - 2) else 0 in',
        '  let slopeSig = if slope > 0 then 1 else if slope < 0 then (0 - 1) else 0 in',
        '  let revert = if z < (0 - 150) then 2 else if z > 150 then (0 - 2) else 0 in',
        '  let accel = if mom > 0 then 1 else if mom < 0 then (0 - 1) else 0 in',
        '  trend + slopeSig + revert + accel + bias',
        '',
        'decisionFromScore : Int -> Int -> String',
        'decisionFromScore s threshold =',
        '  if s > threshold then "BUY"',
        '  else if s == threshold then "BUY"',
        '  else if s < (0 - threshold) then "SELL"',
        '  else if s == (0 - threshold) then "SELL"',
        '  else "HOLD"',
        '',
        'notifyTelegram : String -> String -> String -> String',
        'notifyTelegram token chatId text =',
        '  if strLength(token) < 10 then "telegram:skip(no token)"',
        '  else if strLength(chatId) < 3 then "telegram:skip(no chat)"',
        '  else httpPost(',
        '    strConcat("https://api.telegram.org/bot", strConcat(token, "/sendMessage")),',
        '    text',
        '  ).body',
        '',
        '-- Compute every statistic for one asset window and fold into a decision row.',
        'decisionForAsset : Int -> Int -> String -> List Int -> Json',
        'decisionForAsset threshold bias sym window =',
        '  let px = lastInt(window) in',
        '  let mean = meanOf(window) in',
        '  let sd = stddevOf(window) in',
        '  let z = zScoreOf(window) in',
        '  let emaFast = emaOf(5, window) in',
        '  let emaSlow = emaOf(20, window) in',
        '  let slope = slopeOf(window) in',
        '  let rangePos = rangePosOf(window) in',
        '  let mom = momentumOf(window) in',
        '  let sc = scoreOf(z, emaFast, emaSlow, slope, mom, bias) in',
        '  let d = decisionFromScore(sc, threshold) in',
        '  { symbol = sym, decision = d, score = sc, priceCents = px,',
        '    mean = mean, stddev = sd, zscore = z, emaFast = emaFast, emaSlow = emaSlow,',
        '    slope = slope, rangePos = rangePos, momentum = mom, samples = length(window) }',
        '',
        '-- Human-readable justification for a decision, comparing score vs threshold.',
        'explainDecision : Int -> Int -> String -> String',
        'explainDecision s threshold d =',
        '  if d == "BUY" then joinStr(["score ", fromInt(s), " >= threshold ", fromInt(threshold), " => BUY"])',
        '  else if d == "SELL" then joinStr(["score ", fromInt(s), " <= -threshold ", fromInt(threshold), " => SELL"])',
        '  else joinStr(["score ", fromInt(s), " within +/-", fromInt(threshold), " => HOLD"])',
        '',
        '-- Build the multi-line detail block shown in Output, one per asset. The editor',
        '-- only prints whatever this returns; all reasoning lives here.',
        'assetDetail : Json -> Int -> String -> String -> String',
        'assetDetail row threshold savedId alertStatus =',
        '  joinStr([',
        '    "* ", row.symbol, "  ", row.decision,',
        '    "\\n    price      $", centsToUsd(row.priceCents),',
        '    "\\n    samples    ", fromInt(row.samples),',
        '    "\\n    mean       $", centsToUsd(row.mean),',
        '    "\\n    std dev    $", centsToUsd(row.stddev),',
        '    "\\n    z-score    ", signedCentis(row.zscore), " sigma",',
        '    "\\n    EMA(5)     $", centsToUsd(row.emaFast),',
        '    "\\n    EMA(20)    $", centsToUsd(row.emaSlow),',
        '    "\\n    slope      ", fromInt(row.slope), " cents/step",',
        '    "\\n    range pos  ", fromInt(row.rangePos), "% of [lo,hi]",',
        '    "\\n    momentum   ", fromInt(row.momentum), " cents",',
        '    "\\n    score      ", fromInt(row.score), "  (threshold ", fromInt(threshold), ")",',
        '    "\\n    decision   ", row.decision, "  =>  ", explainDecision(row.score, threshold, row.decision),',
        '    "\\n    saved      signals#", savedId,',
        '    "\\n    alert      ", alertStatus',
        '  ])',
        '',
        'persistSignal : Json -> String',
        'persistSignal row = dbInsert("signals", row)',
        '',
        'isActionable : Json -> Bool',
        'isActionable row =',
        '  if row.decision == "BUY" then True',
        '  else if row.decision == "SELL" then True',
        '  else False',
        '',
        'tickOneAsset : String -> String -> String',
        'tickOneAsset acc sym =',
        '  let trimmed = trim(sym) in',
        '  if strLength(trimmed) == 0 then acc',
        '  else',
        '    let prevCsv = histCsvOrEmpty(trimmed) in',
        '    let px = fetchPriceCents(trimmed) in',
        '    let csv = appendHistCsv(prevCsv, px) in',
        '    let _save = saveHistCsv(trimmed, csv) in',
        '    let window = lastN(20, parseCsvInts(csv)) in',
        '    let threshold = __INPUT_signalThreshold__ in',
        '    let bias = __INPUT_positionBias__ in',
        '    let bot = __INPUT_telegramBotToken__ in',
        '    let chat = __INPUT_telegramChatId__ in',
        '    let row = decisionForAsset(threshold, bias, trimmed, window) in',
        '    let savedId = persistSignal(row) in',
        '    let shouldNotify = isActionable(row) in',
        '    let alertText = joinStr([trimmed, " ", row.decision, " @ $", centsToUsd(px)]) in',
        '    let alertStatus =',
        '      if shouldNotify then strConcat("sent -> ", notifyTelegram(bot, chat, alertText))',
        '      else "skipped (HOLD, not actionable)" in',
        '    let detail = assetDetail(row, threshold, savedId, alertStatus) in',
        '    if strLength(acc) == 0 then detail else strConcat(acc, strConcat("\\n\\n", detail))',
        '',
        'main : String',
        'main =',
        '  let assets = split(__INPUT_assetsCsv__, ",") in',
        '  let body = foldl(tickOneAsset, "", assets) in',
        '  if strLength(body) == 0 then "No assets to evaluate."',
        '  else strConcat("=== Verdict tick: statistical multi-asset decisions ===\\n\\n", body)',
      ].join('\n'),
      language: 'verdict',
      theme: 'verdict-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 14,
      fontFamily: FONT_MONO,
      fontLigatures: true,
      lineHeight: 22,
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      roundedSelection: true,
      padding: { top: 18, bottom: 18 },
      scrollBeyondLastLine: false,
      scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
    });

    // One-shot run on Cmd/Ctrl+Enter.
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => this.run());

    this.resultDecorations = this.editor.createDecorationsCollection();

    // Live feedback: re-check + re-evaluate on every edit, debounced so we don't
    // compile on each keystroke, plus one immediate pass for the starting program.
    this.editor.onDidChangeModelContent(() => this.scheduleUpdate());

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
    this.setActiveSideTab('output');
    this.runDiagnostics();
    this.runInlineResults();
  }

  private setActiveSideTab(tab: 'output' | 'inputs') {
    this.activeSideTab = tab;
    const panels: Array<[HTMLDivElement | null, 'output' | 'inputs']> = [
      [this.outputPanel, 'output'],
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
    this.container.classList.toggle('hidden', tab !== 'editor');
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
      void this.refreshVisualization();
    }
    const tabButtons = this.mainContainer.querySelectorAll<HTMLButtonElement>('[data-main-tab-id]');
    tabButtons.forEach((btn) => {
      const selected = btn.dataset.mainTabId === tab;
      btn.className = selected
        ? 'rounded bg-indigo-600/30 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-200 ring-1 ring-inset ring-indigo-400/40'
        : 'rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white';
    });
  }

  // The source changed; the block view is stale. Re-render only if it's the
  // visible tab (rendering into a hidden panel would waste work each keystroke).
  private markVizDirty() {
    this.vizDirty = true;
    if (this.activeMainTab === 'visual') {
      void this.refreshVisualization();
    }
  }

  // Parse the current source via the compiler's `astJS` and render it as nested
  // code blocks. Parse-only, so it shows structure even when later compile
  // stages have errors.
  private async refreshVisualization() {
    if (!this.vizRoot || !this.vizDirty) return;
    try {
      if (!hyloLib) await loadHyloLib();
      if (!astLib) await loadAstLib();
      if (!astLib || !hyloLib || !this.editor) return;
      if (typeof astLib.astJS !== 'function') {
        this.vizRoot.innerHTML =
          '<div class="p-4 text-slate-500 italic">Code view unavailable: <code>/lib/verdict-ast.mjs</code> has no <code>astJS</code> export. See docs/visualization-tab-design.md.</div>';
        return;
      }
      const source = this.materializeInputs(this.editor.getValue());
      const res = astLib.astJS(source);
      this.vizCleanup?.();
      this.vizCleanup = null;
      if (!res?.ok) {
        this.vizRoot.innerHTML = `<div class="p-4 text-slate-500 italic">Can't show the code — ${escapeHtml(res?.error ?? 'parse error')}.</div>`;
        return;
      }
      const ast = JSON.parse(res.ast);
      const docs = extractDocs(source);
      if (this.vizMode === 'map') {
        const gas = this.computeGasInfo(source);
        this.vizCleanup = renderCallGraph(this.vizRoot, ast, gas, docs, (line) => this.jumpToSourceLine(line));
      } else {
        hyloLib.renderCode(`#${this.vizRoot.id}`, ast);
        this.attachVizListeners();
        // The renderer emits every card open; restore the user's collapsed ones,
        // and surface each function's doc comment on hover.
        this.vizRoot.querySelectorAll<HTMLDetailsElement>('details[data-def]').forEach((d) => {
          if (d.dataset.def && this.collapsedDefs.has(d.dataset.def)) d.removeAttribute('open');
          const doc = d.dataset.def ? docs.get(d.dataset.def) : undefined;
          if (doc) d.title = doc;
        });
        const content = this.vizRoot.firstElementChild as HTMLElement | null;
        if (content) this.vizCleanup = installArrowOverlay(content);
      }
      this.vizDirty = false;
    } catch (e) {
      this.vizRoot.innerHTML = `<div class="p-4 text-rose-400">Visualization error: ${escapeHtml(String(e))}</div>`;
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

  // One-time delegated listeners on the viz container: click-a-block→source, and
  // collapse-state tracking.
  private attachVizListeners() {
    if (this.vizListenersAttached || !this.vizRoot) return;
    this.vizListenersAttached = true;
    this.vizRoot.addEventListener('click', (e) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-src-line]');
      if (!el) return;
      const line = Number(el.dataset.srcLine);
      if (Number.isFinite(line)) this.jumpToSourceLine(line);
    });
    // `toggle` doesn't bubble, so capture it on the way down.
    this.vizRoot.addEventListener(
      'toggle',
      (e) => {
        const d = e.target as HTMLDetailsElement;
        if (!(d instanceof HTMLDetailsElement) || !d.dataset.def) return;
        if (d.open) this.collapsedDefs.delete(d.dataset.def);
        else this.collapsedDefs.add(d.dataset.def);
      },
      true,
    );
  }

  // Reveal a source line in the editor (switching to the Editor tab, since the
  // Monaco view is hidden while the Visual tab is open).
  private jumpToSourceLine(line: number) {
    if (!this.editor || !Number.isFinite(line)) return;
    this.setActiveMainTab('editor');
    this.editor.revealLineInCenter(line);
    this.editor.setSelection(new monaco.Range(line, 1, line, Number.MAX_SAFE_INTEGER));
    this.editor.focus();
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

  // Parse + typecheck the current source and paint Monaco markers. No bytecode
  // is generated and nothing runs — this is the always-on "is my code valid?"
  // feedback loop, independent of the Run button.
  private runDiagnostics() {
    if (!this.editor) return;
    const model = this.editor.getModel();
    if (!model) return;

    if (!vlib) return;
    let diagnostics: VerdictDiagnostic[];
    try {
      diagnostics = vlib.diagnosticsJS(this.materializeInputs(model.getValue()));
    } catch {
      // A compiler crash shouldn't wipe the editor; just skip this pass.
      return;
    }

    const markers: monaco.editor.IMarkerData[] = diagnostics.map((d) => {
      // The compiler gives a point; widen the squiggle to the word under it so
      // the marker is grabbable, falling back to a single char at line end.
      const word = model.getWordAtPosition({ lineNumber: d.line, column: d.column });
      const startColumn = word ? word.startColumn : d.column;
      const endColumn = word
        ? word.endColumn
        : Math.max(d.column + 1, model.getLineMaxColumn(Math.min(d.line, model.getLineCount())));
      return {
        startLineNumber: d.line,
        startColumn,
        endLineNumber: d.line,
        endColumn,
        message: d.message,
        severity: d.severity === 'warning'
          ? monaco.MarkerSeverity.Warning
          : monaco.MarkerSeverity.Error,
      };
    });

    monaco.editor.setModelMarkers(model, 'verdict', markers);
    this.setStatus(markers.length);
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

  // Notebook seed: evaluate every nullary top-level binding and show its value
  // as ghost text at the end of that binding's definition line. Returns [] (and
  // so clears all results) whenever the program doesn't parse or typecheck.
  private runInlineResults() {
    if (!this.editor || !this.resultDecorations) return;
    const model = this.editor.getModel();
    if (!model) return;

    if (!vlib) return;
    let results: VerdictBindingResult[];
    try {
      results = vlib.evalBindingsJS(this.materializeInputs(model.getValue()));
    } catch {
      this.resultDecorations.clear();
      return;
    }

    const decorations: monaco.editor.IModelDeltaDecoration[] = [];
    for (const r of results) {
      const line = this.findDefinitionLine(model, r.name);
      if (line === null) continue;
      const endColumn = model.getLineMaxColumn(line);
      const text = r.ok ? `⟹ ${r.value}` : `⚠ ${r.error}`;
      decorations.push({
        range: new monaco.Range(line, endColumn, line, endColumn),
        options: {
          after: {
            content: '   ' + text,
            inlineClassName: r.ok ? 'verdict-result' : 'verdict-result-error',
          },
          showIfCollapsed: true,
        },
      });
    }
    this.resultDecorations.set(decorations);
  }

  // Find the line where a top-level binding is *defined* (`name = ...` or
  // `name ... =`), as opposed to its signature line (`name : ...`). Top-level
  // declarations start at column 1, so we anchor the name there.
  private findDefinitionLine(model: monaco.editor.ITextModel, name: string): number | null {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // name at column 1, not immediately followed by `:` (that's the signature).
    const re = new RegExp('^' + escaped + '\\b(?!\\s*:)');
    const total = model.getLineCount();
    for (let line = 1; line <= total; line++) {
      if (re.test(model.getLineContent(line))) return line;
    }
    return null;
  }

  run() {
    if (!this.editor) return;
    void this.executeProgram(false);
  }

  private async executeProgram(persistState: boolean) {
    if (!this.editor) return;
    this.beginBusy(persistState ? 'Running strategy...' : 'Compiling and running...');
    const code = this.materializeInputs(this.editor.getValue());
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
        const prefix = this.liveRunning ? `Live Tick #${this.liveTickCount}\n` : '';
        this.renderOutput(`${prefix}${vmOut.resultText}`, 'ok');
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
    const color =
      tone === 'ok' ? 'text-emerald-300' : tone === 'error' ? 'text-rose-200' : 'text-indigo-300';
    this.outputPanel.innerHTML = `<div class="${color} font-mono text-sm whitespace-pre-wrap break-words">${escapeHtml(text)}</div>`;
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
        const source = this.materializeInputs(this.editor.getValue());
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

  private async runFinvmProgram(programJson: string, persistState: boolean): Promise<{ ok: true; resultText: string; steps: number } | { ok: false; error: string }> {
    const finvm = finvmLib as FinVmModule;
    try {
      const program = JSON.parse(programJson);
      const state = persistState ? this.finvmState : {};
      const storage = this.effectStorage ?? createEffectStorage();
      this.effectStorage = storage;
      const vmOut = await runProgramWithEffects(finvm, JSON.stringify(program), {
        state,
        handlers: createFinvmHandlers(storage),
      });
      if (!vmOut.ok) {
        return { ok: false, error: vmOut.error };
      }
      this.lastVmSteps = vmOut.steps;
      // db.* effects are fulfilled host-side in the effect storage, so DB rows
      // never appear in the VM's returned state. Surface the host db snapshot
      // under __finvm.db so the Debug "VM DB" panel and the DB tab can read it.
      const dbState = effectDbTablesToFinvmState(storage.listDbTables());
      this.finvmState = {
        ...(persistState ? vmOut.state : this.finvmState),
        '__finvm.db': dbState,
      };
      if (this.vmStatePanel) {
        this.renderVmState({
          status: 'completed',
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
      intervalSec: Math.floor(this.currentIntervalMs() / 1000),
      assetsCsv: this.assetsCsvInput?.value ?? 'BTCUSD,ETHUSD,ADAUSD',
      signalThreshold: Number(this.signalThresholdInput?.value ?? '2'),
      positionBias: Number(this.positionBiasInput?.value ?? '0'),
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
      this.refreshInputsPreview();
      this.runDiagnostics();
      this.runInlineResults();
    };
    keyInput.oninput = () => {
      this.refreshInputsPreview();
      this.runDiagnostics();
      this.runInlineResults();
    };
    valueInput.oninput = keyInput.oninput;
    row.appendChild(keyInput);
    row.appendChild(valueInput);
    row.appendChild(removeBtn);
    this.inputsList.appendChild(row);
  }

  private refreshInputsPreview() {
    if (!this.inputsPreview) return;
    const userInputs = this.readRuntimeInputs();
    const intervalSec = Math.floor(this.currentIntervalMs() / 1000);
    const preview = {
      running: this.liveRunning,
      intervalSec,
      tickCount: this.liveTickCount,
      userInputs,
      placeholders: Object.keys(userInputs).map((k) => `__INPUT_${k}__`),
      note: 'Market data is fetched inside your Verdict code (httpGet). The editor only substitutes __INPUT_* values and runs the VM.',
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

  private currentIntervalMs(): number {
    const v = Number(this.intervalInput?.value ?? '5');
    const seconds = Number.isFinite(v) ? Math.max(1, Math.floor(v)) : 5;
    return seconds * 1000;
  }

  private currentSymbol(): string {
    const raw = (this.symbolInput?.value ?? 'BTCUSD').trim().toUpperCase();
    return raw === '' ? 'BTCUSD' : raw;
  }

  private updateLiveButtonState() {
    if (this.runToggleBtn) {
      if (this.liveRunning) {
        this.runToggleBtn.textContent = 'Stop';
        this.runToggleBtn.className =
          'inline-flex items-center rounded-md border border-rose-500/40 bg-rose-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-200 transition-colors hover:bg-rose-500/25';
      } else {
        this.runToggleBtn.textContent = 'Run';
        this.runToggleBtn.className =
          'inline-flex items-center rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200 transition-colors hover:bg-emerald-500/25';
      }
    }
    this.refreshInputsPreview();
  }

  private async runLiveTick() {
    if (this.tickInFlight || !this.editor) return;
    this.tickInFlight = true;
    this.liveTickCount += 1;
    try {
      await this.executeProgram(true);
    } finally {
      this.tickInFlight = false;
    }
  }

  private async startLiveLoop() {
    if (this.liveRunning || !this.editor) return;
    if (!vlib || !finvmLib) {
      this.renderOutput('Compiler/VM still loading… try again in a moment.', 'error');
      return;
    }
    this.liveRunning = true;
    this.liveTickCount = 0;
    this.finvmState = {};
    this.effectStorage = createEffectStorage();
    this.lastVmSteps = 0;
    this.vmMetricsHistory = [];
    this.updateLiveButtonState();
    this.refreshDbQueryOutput();
    this.renderOutput('Live loop started… running your Verdict strategy on each tick.', 'info');
    await this.runLiveTick();
    const intervalMs = this.currentIntervalMs();
    this.pollTimer = window.setInterval(() => {
      void this.runLiveTick();
    }, intervalMs);
  }

  private stopLiveLoop() {
    this.liveRunning = false;
    if (this.pollTimer !== null) {
      window.clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.updateLiveButtonState();
    this.renderOutput('Live loop stopped.', 'info');
  }

  disconnectedCallback() {
    if (this.diagnosticsTimer !== null) {
      window.clearTimeout(this.diagnosticsTimer);
      this.diagnosticsTimer = null;
    }
    this.stopLiveLoop();
    this.resizeCleanup?.();
    this.resizeCleanup = null;
    this.editor?.dispose();
    this.bytecodeEditor?.dispose();
    this.editor = null;
    this.bytecodeEditor = null;
    this.vmStatePanel = null;
    this.vmObserverPanel = null;
    this.vmDbPanel = null;
    this.resultDecorations = null;
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