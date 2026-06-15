// Monaco optimization: use the lightweight editor API and import only the
// contributions we actively use. This trims bundle size versus `edcore.main`.
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/editor/contrib/hover/browser/hoverContribution.js';
import 'monaco-editor/esm/vs/editor/contrib/suggest/browser/suggest.js';
import 'monaco-editor/esm/vs/editor/contrib/bracketMatching/browser/bracketMatching.js';
import 'monaco-editor/esm/vs/editor/contrib/find/browser/findController.js';
import {
  escapeHtml,
  extractDbTables,
  formatVmValue,
  parseRunJsonProgram,
  renderJsonForPanel,
  runDbQuery,
  toVerdictLiteral,
  type RunJsonProgramResult,
} from './editor/runtimeUtils';

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
  private activeMainTab: 'editor' | 'db' | 'debug' = 'editor';
  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private bytecodeEditor: monaco.editor.IStandaloneCodeEditor | null = null;
  private container!: HTMLDivElement;
  private outputPanel!: HTMLDivElement;
  private inputsPanel: HTMLDivElement | null = null;
  private dbPanel: HTMLDivElement | null = null;
  private debugPanel: HTMLDivElement | null = null;
  private debugVizPanel: HTMLDivElement | null = null;
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
  private runToggleBtn: HTMLButtonElement | null = null;
  private diagnosticsTimer: number | null = null;
  private pollTimer: number | null = null;
  private tickInFlight = false;
  private liveRunning = false;
  private liveTickCount = 0;
  private busyCount = 0;
  private finvmState: Record<string, unknown> = {};
  private marketHistoryCents: number[] = [];
  private latestPriceCents = 0;
  private latestMovingAverageCents = 0;
  private resultDecorations: monaco.editor.IEditorDecorationsCollection | null = null;
  private latestCompiledProgram: unknown = null;
  private latestVmSnapshot: unknown = null;
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
    const mkMainTabBtn = (id: 'editor' | 'db' | 'debug', label: string) => {
      const btn = document.createElement('button');
      btn.dataset.mainTabId = id;
      btn.className = 'rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider';
      btn.textContent = label;
      btn.onclick = () => this.setActiveMainTab(id);
      return btn;
    };
    mainTabBar.appendChild(mkMainTabBtn('editor', 'Editor'));
    mainTabBar.appendChild(mkMainTabBtn('db', 'DB'));
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
    debugHint.textContent = 'Minard-style VM introspection views from compiled bytecode and runtime state.';
    const bytecodeHeader = sectionHeader('FinVM Bytecode', 'JSON');
    const bytecodeContainer = document.createElement('div');
    bytecodeContainer.className = 'h-[220px] shrink-0 rounded border border-slate-800 overflow-hidden';
    const vmHeader = sectionHeader('VM State Snapshot', 'runJsonProgram');
    this.vmStatePanel = document.createElement('div');
    this.vmStatePanel.className = 'h-[220px] shrink-0 overflow-auto rounded border border-slate-800 bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-300';
    this.vmStatePanel.innerHTML = '<div class="text-slate-600 italic">Run program to inspect state.</div>';
    const vizHeader = sectionHeader('Minard Views', 'Structure / Flow / Density');
    this.debugVizPanel = document.createElement('div');
    this.debugVizPanel.className = 'min-h-[220px] flex-1 overflow-auto rounded border border-slate-800 bg-slate-950 p-3';
    this.debugVizPanel.innerHTML = '<div class="text-slate-600 italic text-xs">Compile and run to render visualizations.</div>';
    debugWrap.appendChild(debugHint);
    debugWrap.appendChild(bytecodeHeader);
    debugWrap.appendChild(bytecodeContainer);
    debugWrap.appendChild(vmHeader);
    debugWrap.appendChild(this.vmStatePanel);
    debugWrap.appendChild(vizHeader);
    debugWrap.appendChild(this.debugVizPanel);
    this.debugPanel.appendChild(debugWrap);
    leftPane.appendChild(this.debugPanel);
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
    fixedInputs.appendChild(mkLabel('symbol'));
    fixedInputs.appendChild(this.symbolInput);
    fixedInputs.appendChild(mkLabel('intervalSec'));
    fixedInputs.appendChild(this.intervalInput);

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
        '-- Host loop fills these with live Binance data every tick.',
        '-- Press Start to poll, Stop to halt, or Run for one local pass.',
        'livePrice : Int',
        'livePrice = __LIVE_PRICE__',
        '',
        'movingAverage : Int',
        'movingAverage = __LIVE_MA__',
        '',
        '-- Optional input token from Inputs tab JSON.',
        'signalBias : Int',
        'signalBias = __INPUT_signalBias__',
        '',
        '-- Price values are integer cents.',
        '-- We persist each tick to FinVM DB and return a compact decision string.',
        'signalFor : Int -> Int -> String',
        'signalFor price avg =',
        '  if price > avg + signalBias then "BUY"',
        '  else if price < avg - signalBias then "SELL"',
        '  else "HOLD"',
        '',
        'main : String',
        'main =',
        '  let tickId = dbInsert("ticks", livePrice) in',
        '  let signal = signalFor(livePrice, movingAverage) in',
        '  strConcat("tick=", strConcat(tickId, strConcat(" priceCents=", strConcat(fromInt(livePrice), strConcat(" maCents=", strConcat(fromInt(movingAverage), strConcat(" signal=", signal)))))))'
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
    this.addInputField('signalBias', '0');
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

  private setActiveMainTab(tab: 'editor' | 'db' | 'debug') {
    this.activeMainTab = tab;
    this.container.classList.toggle('hidden', tab !== 'editor');
    if (this.dbPanel) {
      this.dbPanel.classList.toggle('hidden', tab !== 'db');
    }
    if (this.debugPanel) {
      this.debugPanel.classList.toggle('hidden', tab !== 'debug');
    }
    const tabButtons = this.mainContainer.querySelectorAll<HTMLButtonElement>('[data-main-tab-id]');
    tabButtons.forEach((btn) => {
      const selected = btn.dataset.mainTabId === tab;
      btn.className = selected
        ? 'rounded bg-indigo-600/30 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-200 ring-1 ring-inset ring-indigo-400/40'
        : 'rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white';
    });
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
      diagnostics = vlib.diagnosticsJS(this.materializeLiveCode(model.getValue(), this.latestPriceCents, this.latestMovingAverageCents));
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
      results = vlib.evalBindingsJS(this.materializeLiveCode(model.getValue(), this.latestPriceCents, this.latestMovingAverageCents));
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
    this.beginBusy('Compiling and running...');
    const code = this.materializeLiveCode(this.editor.getValue(), this.latestPriceCents, this.latestMovingAverageCents);
    this.renderOutput('Compiling', 'info');
    
    // Make sure the squiggles reflect exactly what we're about to compile,
    // then let the live-diagnostics markers be the source of truth for errors.
    this.runDiagnostics();

    if (!vlib) {
      this.renderOutput('Still loading the compiler… try again in a moment.', 'error');
      return;
    }
    if (!finvmLib) {
      this.renderOutput('Still loading FinVM… try again in a moment.', 'error');
      return;
    }
    try {
      // Compile for the bytecode panel (this is the FinVM target the program
      // lowers to)...
      const compilation = vlib.compileJS(code);
      if (!compilation.ok) {
        this.bytecodeEditor?.setValue('');
        this.latestCompiledProgram = null;
        if (this.vmStatePanel) {
          this.vmStatePanel.innerHTML = '<div class="text-slate-600 italic">Compilation failed, VM state unavailable.</div>';
        }
        this.renderDebugVisualizations();
        this.renderOutput(`Compilation Error: ${compilation.error}`, 'error');
        return;
      }
      this.bytecodeEditor?.setValue(compilation.output);
      try {
        this.latestCompiledProgram = JSON.parse(compilation.output);
      } catch {
        this.latestCompiledProgram = null;
      }
      this.renderDebugVisualizations();
      const vmOut = this.runFinvmProgram(compilation.output, true);
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
    this.renderDebugVisualizations();
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

  private runFinvmProgram(programJson: string, persistState: boolean): { ok: true; resultText: string; steps: number } | { ok: false; error: string } {
    const finvm = finvmLib as FinVmModule;
    try {
      const program = JSON.parse(programJson);
      if (persistState) {
        program.state = this.finvmState;
      }
      const raw = finvm.runJsonProgram(JSON.stringify(program));
      const parsed = parseRunJsonProgram(raw);
      if (!parsed) {
        return { ok: false, error: raw };
      }
      if (this.vmStatePanel) {
        this.renderVmState(parsed);
      }
      if (parsed.status !== 'completed') {
        return { ok: false, error: String(parsed.error ?? 'execution failed') };
      }
      if (persistState && parsed.state && typeof parsed.state === 'object') {
        this.finvmState = parsed.state as Record<string, unknown>;
        this.refreshDbQueryOutput();
      }
      return {
        ok: true,
        resultText: formatVmValue(parsed.result),
        steps: typeof parsed.steps === 'number' ? parsed.steps : 0,
      };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }

  private materializeLiveCode(code: string, latestPriceCents: number, movingAverageCents: number): string {
    let materialized = code
      .replaceAll('__LIVE_PRICE__', String(latestPriceCents))
      .replaceAll('__LIVE_MA__', String(movingAverageCents));
    const runtimeInputs = this.readRuntimeInputs();
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
      symbol: this.currentSymbol(),
      binanceSymbol: this.symbolForBinance(this.currentSymbol()),
      intervalSec,
      latestPriceCents: this.latestPriceCents,
      latestMovingAverageCents: this.latestMovingAverageCents,
      sampleCount: this.marketHistoryCents.length,
      tickCount: this.liveTickCount,
      userInputs,
      placeholders: [
        '__LIVE_PRICE__',
        '__LIVE_MA__',
        ...Object.keys(userInputs).map((k) => `__INPUT_${k}__`),
      ],
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

  private symbolForBinance(rawSymbol: string): string {
    // UX-friendly alias: users often type BTCUSD, Binance spot uses BTCUSDT.
    if (rawSymbol === 'BTCUSD') return 'BTCUSDT';
    return rawSymbol;
  }

  private async fetchBinancePriceCents(symbol: string): Promise<number> {
    const resolved = this.symbolForBinance(symbol);
    const url = `https://api.binance.com/api/v3/ticker/price?symbol=${encodeURIComponent(resolved)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Binance HTTP ${res.status}`);
    const body = await res.json() as { price?: string };
    const price = Number(body.price);
    if (!Number.isFinite(price)) throw new Error('Binance payload missing numeric price');
    return Math.round(price * 100);
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
    this.beginBusy('Fetching market data...');
    try {
      const symbol = this.currentSymbol();
      const priceCents = await this.fetchBinancePriceCents(symbol);
      this.liveTickCount += 1;
      this.latestPriceCents = priceCents;
      this.marketHistoryCents.push(priceCents);
      const sum = this.marketHistoryCents.reduce((a, b) => a + b, 0);
      this.latestMovingAverageCents = this.marketHistoryCents.length === 0 ? 0 : Math.floor(sum / this.marketHistoryCents.length);
      this.refreshInputsPreview();

      const source = this.materializeLiveCode(this.editor.getValue(), this.latestPriceCents, this.latestMovingAverageCents);
      const compilation = vlib.compileJS(source);
      if (!compilation.ok) {
        this.latestCompiledProgram = null;
        this.renderDebugVisualizations();
        this.renderOutput(`Compilation Error: ${compilation.error}`, 'error');
        return;
      }
      this.bytecodeEditor?.setValue(compilation.output);
      try {
        this.latestCompiledProgram = JSON.parse(compilation.output);
      } catch {
        this.latestCompiledProgram = null;
      }
      this.renderDebugVisualizations();
      const vmOut = this.runFinvmProgram(compilation.output, true);
      if (!vmOut.ok) {
        this.renderOutput(`Runtime Error: ${vmOut.error}`, 'error');
        return;
      }

      const priceText = (this.latestPriceCents / 100).toFixed(2);
      const maText = (this.latestMovingAverageCents / 100).toFixed(2);
      this.renderOutput(
        `Live Tick #${this.liveTickCount} (${symbol})\nprice=${priceText} ma=${maText} samples=${this.marketHistoryCents.length}\nresult=${vmOut.resultText}\nsteps=${vmOut.steps}`,
        'ok',
      );
    } catch (e) {
      this.renderOutput(`Live Tick Error: ${String(e)}`, 'error');
    } finally {
      this.tickInFlight = false;
      this.endBusy();
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
    this.marketHistoryCents = [];
    this.latestPriceCents = 0;
    this.latestMovingAverageCents = 0;
    this.updateLiveButtonState();
    this.refreshDbQueryOutput();
    this.renderOutput('Live loop started… waiting for first tick.', 'info');
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
  runJsonProgram: (programJson: string) => string;
}

customElements.define('verdict-editor', VerdictEditorElement);
customElements.define('verdict-editor-debug', VerdictEditorDebugElement);