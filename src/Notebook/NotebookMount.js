"use strict";

import { mountWysiwyg } from "./WysiwygFFI.js";
import { decodeDisplay, renderDisplayInto } from "./Display.js";
import {
  createVerdictEditor,
  disposeVerdictEditor,
} from "./verdictCm/VerdictCmEditor.js";
import { highlightVerdictToHtml } from "./verdictCm/VerdictSyntax.js";
import {
  concatCode,
  concatDocument,
  seedSignature,
  extractVerdictDocs,
  docsToMap,
  scanBindingNames,
  defaultCellUi,
  bindingNamesForCell,
  cellPreviewLine,
  updateModel,
} from "./NotebookPs.js";

function makeBindingHelpers(bridge) {
  function bindingNamesForCellBridge(cell, allCells, getSource) {
    const cells = allCells.map((c) => ({ id: c.id, kind: c.kind, source: c.source }));
    if (bridge?.bindingNamesInCell) {
      return bridge.bindingNamesInCell(cell.id, cells, getSource());
    }
    return bindingNamesForCell(cell, allCells);
  }

  function isDefinitionOnlyCell(cell, allCells, getSource) {
    return bindingNamesForCellBridge(cell, allCells, getSource).length === 0;
  }

  return { bindingNamesForCell: bindingNamesForCellBridge, isDefinitionOnlyCell };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function ensureUi(cell) {
  if (!cell.ui) cell.ui = defaultCellUi();
  return cell.ui;
}

function persist(state, bridge) {
  bridge.saveDocument?.({
    seedSig: state.seedSig,
    cells: state.cells.map((c) => ({
      id: c.id,
      kind: c.kind,
      source: c.source,
      ui: c.ui,
    })),
  });
}

function mkGutterBtn(title, label, extraClass, dataAttr) {
  const b = document.createElement("button");
  b.type = "button";
  b.title = title;
  b.className =
    "notebook-gutter-btn flex h-7 w-7 shrink-0 items-center justify-center rounded border border-slate-700/80 bg-slate-900/80 text-[11px] font-bold text-slate-400 transition-colors hover:border-slate-500 hover:text-white " +
    (extraClass ?? "");
  b.textContent = label;
  if (dataAttr) b.dataset[dataAttr.key] = dataAttr.value;
  return b;
}

function installVerticalResize(handle, getHeight, setHeight, { min = 72, max = 720 } = {}) {
  handle.addEventListener("mousedown", (event) => {
    event.preventDefault();
    const startY = event.clientY;
    const startH = getHeight();
    const onMove = (moveEvent) => {
      const next = Math.min(max, Math.max(min, startH + (moveEvent.clientY - startY)));
      setHeight(next);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.classList.remove("notebook-resize-active");
    };
    document.body.classList.add("notebook-resize-active");
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  });
}

function mkGutterRunBtn(cell, idx, onRun, onStop, isRunning) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.dataset.runCell = "1";
  const base =
    "notebook-gutter-btn notebook-gutter-run flex h-8 w-8 shrink-0 items-center justify-center rounded border text-[14px] leading-none shadow-sm transition-colors ";
  if (isRunning) {
    btn.title = "Stop cell";
    btn.dataset.cellState = "running";
    btn.className = base + "border-rose-500/60 bg-rose-500/25 text-rose-200 hover:border-rose-400 hover:bg-rose-500/40";
    btn.textContent = "■";
    btn.onclick = () => onStop(cell, idx);
  } else {
    btn.title = "Run cell (⌘↵)";
    btn.className = base + "border-emerald-500/50 bg-emerald-500/20 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/35 hover:text-emerald-100";
    btn.textContent = "▶";
    btn.onclick = () => void onRun(cell, idx);
  }
  return btn;
}

async function renderOutputBlock(block, o, bridge) {
  if (!o.ok) {
    block.innerHTML = `<div class="text-xs text-rose-400">${escapeHtml(o.error ?? "Error")}</div>`;
    return;
  }
  await renderDisplayInto(block, o.display ?? o.json, bridge);
}

export function mountNotebookImpl(selector) {
  return function (bridge) {
    return function (initialSource) {
      return function () {
        const host = document.querySelector(selector);
        if (!host || !bridge) return null;

        const { bindingNamesForCell, isDefinitionOnlyCell } = makeBindingHelpers(bridge);

        const state = {
          cells: [],
          outputs: {},
          focusedId: null,
          errors: {},
          cellDiags: {},
          analysisSig: null,
          cachedSignatures: [],
          cachedEvalBindings: [],
          cachedDocs: new Map(),
          maximizedCellId: null,
          running: new Set(),
          runControllers: {},
          executionCounts: {},
          executionSeq: 0,
          clipboardCell: null,
          /** One CM6 instance moved between cells — unfocused cells use static preview. */
          sharedEditor: null,
          sharedEditorCellId: null,
        };

        let seq = 0;
        let diagTimer = null;
        let panelTimer = null;
        const newId = () => `cell-${++seq}-${Math.random().toString(36).slice(2, 6)}`;

        function mapLoadedCell(c) {
          return {
            id: c.id || newId(),
            kind: c.kind === "wysiwyg" ? "wysiwyg" : "code",
            source: c.source ?? "",
            ui: { ...defaultCellUi(), ...c.ui },
          };
        }

        function cellsFromSources(sources) {
          return sources.map((s) => ({
            id: newId(),
            kind: "code",
            source: s,
            ui: defaultCellUi(),
          }));
        }

        function modelSnapshot() {
          return {
            cells: state.cells.map((c) => ({
              id: c.id,
              kind: c.kind === "wysiwyg" ? "wysiwyg" : "code",
              source: c.source ?? "",
              ui: { ...defaultCellUi(), ...c.ui },
            })),
            focusedId: state.focusedId ?? null,
            maximizedId: state.maximizedCellId ?? null,
          };
        }

        function applyModel(next) {
          state.cells = (next.cells ?? []).map(mapLoadedCell);
          state.focusedId = next.focusedId ?? null;
          state.maximizedCellId = next.maximizedId ?? null;
        }

        function updateNotebook(msg) {
          const next = updateModel(modelSnapshot(), msg);
          applyModel(next);
          return next;
        }

        /** JSON `{ seedSig, cells: [{ source }] }` or legacy single source string. */
        function parseInitialSeed(initial) {
          const text = String(initial || "");
          if (text.startsWith("{")) {
            try {
              const doc = JSON.parse(text);
              if (doc?.cells?.length) {
                const joined = doc.cells
                  .map((c) => String(c.source ?? "").trim())
                  .filter(Boolean)
                  .join("\n\n");
                return {
                  formatVersion: doc.formatVersion ?? 1,
                  seedSig: doc.seedSig ?? seedSignature(joined),
                  cells: doc.cells.map((c) => mapLoadedCell(c)),
                };
              }
            } catch {
              /* fall through */
            }
          }
          const trimmed = text.trim();
          const sources = trimmed ? [trimmed] : [""];
          return {
            formatVersion: 1,
            seedSig: seedSignature(trimmed),
            cells: cellsFromSources(sources),
          };
        }

        function initFromSeed(initial) {
          const seeded = parseInitialSeed(initial);
          state.seedSig = seeded.seedSig;
          const saved = bridge.loadDocument?.();
          if (
            saved?.cells?.length &&
            saved.seedSig === seeded.seedSig &&
            (saved.formatVersion ?? 1) === (seeded.formatVersion ?? 1) &&
            saved.cells.length === seeded.cells.length
          ) {
            state.cells = saved.cells.map(mapLoadedCell);
          } else {
            state.cells = seeded.cells;
            persist(state, bridge);
          }
          publishSource();
        }

        initFromSeed(initialSource || "");

        if (!state.focusedId) {
          const firstCode = state.cells.find((c) => c.kind === "code");
          if (firstCode) state.focusedId = firstCode.id;
        }

        const defaultSeed = parseInitialSeed(initialSource || "");

        function applyEvalResults(outs, upToIdx, focusCellId) {
          const focusCell = state.cells[upToIdx];
          const focusNames = focusCell ? bindingNamesForRun(focusCell) : [];
          let matchedCurrent = false;
          for (const o of outs) {
            for (let i = 0; i <= upToIdx; i++) {
              const c = state.cells[i];
              if (c.kind !== "code") continue;
              if (!bindingNamesForRun(c).includes(o.name)) continue;
              state.outputs[`${c.id}:${o.name}`] = o;
              state.errors[c.id] = o.ok ? "" : o.error || "";
              if (c.id === focusCellId) matchedCurrent = true;
              break;
            }
          }
          if (focusNames.length > 0 && !matchedCurrent) {
            const errOut = outs.find((o) => focusNames.includes(o.name));
            if (errOut && focusCell) {
              state.outputs[`${focusCell.id}:${errOut.name}`] = errOut;
              state.errors[focusCell.id] = errOut.error || "";
            }
          }
        }

        async function evalCellOutputs(cell, cellIdx, signal) {
          const cellNames = bindingNamesForRun(cell);
          const src = getBridgeSource();
          const chk = bridge.compileCellBindings?.(src, cellNames) ?? bridge.compile?.(src);
          if (chk && !chk.ok) {
            throw new Error(chk.error ?? "Compile failed");
          }
          if (cellNames.length === 0) return [];
          // Each cell is its own runtime entity: run only this cell's bindings.
          // Cross-cell state lives in the shared FinVM snapshot + IDE actor/cache layer.
          return await Promise.resolve(
            bridge.evalCells?.(src, cellNames, { signal, cellId: cell.id, cellIndex: cellIdx }) ?? [],
          );
        }

        function concatenate() {
          return concatCode(state.cells);
        }

        function concatenateDocument() {
          return concatDocument(state.cells);
        }

        function publishSource() {
          const src = concatenate();
          bridge.onProgramChanged?.(src);
          scheduleDiagnostics();
          persist(state, bridge);
        }

        let bridgeSyncTimer = null;
        let persistTimer = null;

        /** Typing path — debounce shell sync + localStorage on every keystroke. */
        function onCellSourceEdit() {
          scheduleSourceSync();
          scheduleDiagnostics();
        }

        function scheduleSourceSync() {
          if (bridgeSyncTimer !== null) window.clearTimeout(bridgeSyncTimer);
          bridgeSyncTimer = window.setTimeout(() => {
            bridgeSyncTimer = null;
            bridge.onProgramChanged?.(concatenate());
          }, 600);
          if (persistTimer !== null) window.clearTimeout(persistTimer);
          persistTimer = window.setTimeout(() => {
            persistTimer = null;
            persist(state, bridge);
          }, 1200);
        }

        function scheduleDiagnostics() {
          if (diagTimer !== null) window.clearTimeout(diagTimer);
          diagTimer = window.setTimeout(() => {
            diagTimer = null;
            updateCellDiagnostics();
          }, 500);
        }

        function updateCellDiagnostics() {
          const src = concatenate();
          const sig = seedSignature(src);
          if (state.analysisSig === sig) return;
          state.analysisSig = sig;

          const cells = state.cells.map((c) => ({ id: c.id, kind: c.kind, source: c.source }));
          state.cellDiags = bridge.cellDiagnostics?.(src, cells) ?? {};

          try {
            state.cachedSignatures = bridge.signatures?.(src) ?? [];
          } catch {
            state.cachedSignatures = [];
          }

          const hasErrors = Object.values(state.cellDiags).some((arr) => arr.length > 0);
          if (hasErrors) {
            state.cachedEvalBindings = [];
          } else {
            try {
              state.cachedEvalBindings = bridge.evalBindings?.(src) ?? [];
            } catch {
              state.cachedEvalBindings = [];
            }
          }

          state.cachedDocs = docsToMap(extractVerdictDocs(src));
          refreshFocusedPropEditorLanguageService();
          refreshCellDiagTexts();
        }

        function refreshFocusedPropEditorLanguageService() {
          if (state.sharedEditorCellId === state.focusedId) {
            state.sharedEditor?.refreshLanguageService?.();
          }
        }

        function refreshPropEditorLanguageService() {
          refreshFocusedPropEditorLanguageService();
        }

        function refreshCellDiagTexts() {
          for (const cell of state.cells) {
            if (cell.kind !== "code") continue;
            const wrap = stack.querySelector(`[data-cell-id="${cell.id}"]`);
            if (!wrap) continue;
            const diags = state.cellDiags[cell.id] ?? [];
            let host = wrap.querySelector("[data-cell-diag-host]");
            if (!diags.length) {
              host?.remove();
              continue;
            }
            if (!host) {
              host = document.createElement("div");
              host.className = "px-3 py-1";
              host.dataset.cellDiagHost = "1";
              const body = wrap.querySelector(".notebook-cell-body");
              const out = wrap.querySelector("[data-cell-output]");
              if (body) {
                if (out) body.insertBefore(host, out);
                else body.appendChild(host);
              }
            }
            host.replaceChildren();
            for (const d of diags) {
              const el = document.createElement("div");
              el.className = "text-xs text-rose-400 font-mono";
              el.dataset.cellDiag = "1";
              el.textContent = `Line ${d.line}: ${d.message}`;
              host.appendChild(el);
            }
          }
        }

        function activeEditorCellId() {
          return state.sharedEditorCellId ?? state.focusedId;
        }

        function buildNotebookLanguageService() {
          let namesCache = null;
          let namesSig = "";
          return {
            getCellDiags: () => {
              const id = activeEditorCellId();
              return id ? (state.cellDiags[id] ?? []) : [];
            },
            getCellSource: () => {
              const cell = state.cells.find((c) => c.id === activeEditorCellId());
              return cell?.source ?? state.sharedEditor?.getValue?.() ?? "";
            },
            getSignatures: () => state.cachedSignatures,
            getEvalBindings: () => state.cachedEvalBindings,
            getDocs: () => state.cachedDocs,
            getBindingNames: () => {
              const cell = state.cells.find((c) => c.id === activeEditorCellId());
              if (!cell) return [];
              const cs = cell.source ?? "";
              const sig = seedSignature(cs);
              if (namesSig !== sig) {
                namesSig = sig;
                namesCache = bindingNamesForCell(cell, state.cells, concatenate);
              }
              return namesCache ?? [];
            },
          };
        }

        const api = {
          notebookSource: () => concatenate(),
          notebookDocumentSource: () => concatenateDocument(),
          setSource: (src) => {
            updateNotebook({
              tag: "replaceOne",
              cell: { id: newId(), kind: "code", source: src || "", ui: defaultCellUi() },
            });
            publishSource();
            render();
          },
          getViewMode: () => (bridge.isSourceMode?.() ? "source" : "notebook"),
          runAll: () => runAll(),
          // Driven from the merged Cells panel in the editor shell.
          runCellById: (id) => {
            const i = state.cells.findIndex((c) => c.id === id);
            if (i >= 0) return runCell(state.cells[i], i);
          },
          stopCellById: (id) => {
            const c = state.cells.find((c) => c.id === id);
            if (c) stopCell(c);
          },
          focusCellById: (id) => {
            focusCell(id);
          },
          notebookCells: () =>
            state.cells.map((c) => ({
              id: c.id,
              kind: c.kind,
              source: c.source ?? "",
            })),
        };

        const root = document.createElement("div");
        root.className = "flex h-full min-h-0 flex-col bg-[#0b0f1a]";
        root.dataset.notebookRoot = "1";

        // Toolbar is a PureScript ps-spa component (Notebook.Toolbar). It renders
        // into this host; button handlers are passed as JS thunks (see toolbarProps
        // below). The host keeps the toolbar's outer chrome (border/background) so
        // the PS component only owns the buttons.
        const toolbar = document.createElement("div");
        toolbar.className =
          "notebook-toolbar-host flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-950 px-3 py-2";

        // Re-seed from the default program, discarding any saved notebook. Escapes
        // stale `.vnb` state from older layouts.
        const onReset = () => {
          if (!confirm("Reset the notebook to the default example? This discards your current cells.")) return;
          updateNotebook({
            tag: "replaceCells",
            cells: defaultSeed.cells.map((c) => ({
              ...c,
              id: newId(),
              ui: { ...defaultCellUi(), ...c.ui },
            })),
          });
          state.seedSig = defaultSeed.seedSig;
          state.outputs = {};
          state.errors = {};
          state.running = new Set();
          state.runControllers = {};
          persist(state, bridge);
          publishSource();
          render();
        };

        function downloadVnb() {
          const doc = {
            cells: state.cells.map((c) => ({
              id: c.id,
              kind: c.kind,
              source: c.source,
              ui: c.ui,
            })),
          };
          const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "notebook.vnb";
          a.click();
          URL.revokeObjectURL(url);
        }

        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".verdict,.vnb,.txt";
        fileInput.className = "hidden";
        fileInput.dataset.notebookFileInput = "1";
        fileInput.onchange = async () => {
          const file = fileInput.files?.[0];
          fileInput.value = "";
          if (!file) return;
          const text = await file.text();
          if (file.name.endsWith(".vnb")) {
            try {
              const doc = JSON.parse(text);
              if (doc?.cells?.length) {
                updateNotebook({ tag: "replaceCells", cells: doc.cells.map(mapLoadedCell) });
                publishSource();
                render();
                return;
              }
            } catch {
              /* fall through as plain source */
            }
          }
          updateNotebook({
            tag: "replaceOne",
            cell: { id: newId(), kind: "code", source: text, ui: defaultCellUi() },
          });
          publishSource();
          render();
        };

        // The buttons themselves are rendered by the PureScript ps-spa toolbar
        // (mounted below). Only the hidden file input stays as plain DOM since
        // <input type=file> needs a real element to drive the OS picker.
        const toolbarButtonHost = document.createElement("div");
        toolbarButtonHost.className = "contents";
        toolbar.appendChild(toolbarButtonHost);
        toolbar.appendChild(fileInput);

        const onOpen = () => fileInput.click();
        const onSave = () => downloadVnb();
        const onSource = () => bridge.setSourceMode?.(true);

        const bodyWrap = document.createElement("div");
        bodyWrap.className = "flex min-h-0 flex-1 flex-row";

        const stack = document.createElement("div");
        stack.className = "notebook-stack-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-3 flex flex-col gap-3";
        stack.dataset.notebookStack = "1";

        bodyWrap.appendChild(stack);

        function getBridgeSource() {
          return bridge.materialize?.(concatenate()) ?? concatenate();
        }

        function bindingNamesForRun(cell) {
          const fromBridge = bindingNamesForCell(cell, state.cells, concatenate);
          if (fromBridge.length > 0) return fromBridge;
          return scanBindingNames(cell.source);
        }

        function outputKeysForCell(cell) {
          const names = new Set(bindingNamesForRun(cell));
          for (const key of Object.keys(state.outputs)) {
            if (key.startsWith(`${cell.id}:`)) names.add(key.slice(cell.id.length + 1));
          }
          return [...names];
        }

        async function runCell(cell, cellIdx) {
          if (cell.kind !== "code") return;
          if (state.running.has(cell.id)) return;
          syncSharedEditorSource();
          const controller = new AbortController();
          state.runControllers[cell.id] = controller;
          state.running.add(cell.id);
          const ui = ensureUi(cell);
          updateNotebook({ tag: "setOutputFolded", id: cell.id, folded: false });
          schedulePublishPanel();
          try {
            const cellNames = bindingNamesForRun(cell);
            if (cellNames.length === 0) {
              state.errors[cell.id] = "";
              return;
            }
            const outs = await evalCellOutputs(cell, cellIdx, controller.signal);
            if (controller.signal.aborted) return;
            applyEvalResults(outs, cellIdx, cell.id);
          } catch (e) {
            if (!controller.signal.aborted) state.errors[cell.id] = String(e);
          } finally {
            if (!controller.signal.aborted) {
              state.executionSeq += 1;
              state.executionCounts[cell.id] = state.executionSeq;
            }
            state.running.delete(cell.id);
            delete state.runControllers[cell.id];
            await refreshCellOutput(cell, cellIdx);
            schedulePublishPanel();
          }
        }

        function stopCell(cell) {
          const controller = state.runControllers[cell.id];
          if (controller) controller.abort();
          state.running.delete(cell.id);
          delete state.runControllers[cell.id];
          state.errors[cell.id] = "Stopped.";
          render();
        }

        async function runAll() {
          for (let i = 0; i < state.cells.length; i++) {
            await runCell(state.cells[i], i);
          }
        }

        async function runAbove(cellIdx) {
          for (let i = 0; i <= cellIdx; i++) {
            await runCell(state.cells[i], i);
          }
        }

        // --- Cell management (operate on whole cell objects so `ui` is preserved) ---
        function addCellBelow(idx, kind) {
          const cell = { id: newId(), kind: kind === "wysiwyg" ? "wysiwyg" : "code", source: "", ui: defaultCellUi() };
          const anchor = state.cells[idx];
          updateNotebook({ tag: "insertBelow", id: anchor?.id ?? "", cell });
          publishSource();
          if (canIncrementalDom()) {
            void insertCellDom(idx + 1).then(() => {
              if (cell.kind === "code") focusCell(cell.id);
              schedulePublishPanel();
            });
          } else {
            render();
          }
        }

        function selectedIndex() {
          const i = state.cells.findIndex((c) => c.id === state.focusedId);
          return i >= 0 ? i : 0;
        }

        function cloneCellForPaste(cell) {
          return {
            id: newId(),
            kind: cell.kind === "wysiwyg" ? "wysiwyg" : "code",
            source: cell.source ?? "",
            ui: cell.ui ? { ...defaultCellUi(), ...cell.ui } : defaultCellUi(),
          };
        }

        function deleteCellAt(idx) {
          const cell = state.cells[idx];
          if (!cell) return;
          const removedId = cell.id;
          disposePropEditorForCell(removedId);
          for (const k of Object.keys(state.outputs)) {
            if (k.startsWith(`${removedId}:`)) delete state.outputs[k];
          }
          delete state.errors[removedId];
          updateNotebook({
            tag: "deleteCell",
            id: removedId,
            fallbackCell: { id: newId(), kind: "code", source: "", ui: defaultCellUi() },
          });
          publishSource();
          if (canIncrementalDom()) {
            removeCellDom(removedId);
            if (!state.focusedId) {
              const next = state.cells.find((c) => c.kind === "code");
              if (next) focusCell(next.id);
            }
            schedulePublishPanel();
          } else {
            render();
          }
        }

        function moveCellBy(idx, delta) {
          const cell = state.cells[idx];
          if (!cell) return;
          updateNotebook({ tag: "moveCell", id: cell.id, delta });
          publishSource();
          render();
        }

        function disposeSharedEditor() {
          if (state.sharedEditor) {
            disposeVerdictEditor(state.sharedEditor);
            state.sharedEditor = null;
            state.sharedEditorCellId = null;
          }
        }

        function syncSharedEditorSource() {
          if (!state.sharedEditor || !state.sharedEditorCellId) return;
          const cell = state.cells.find((c) => c.id === state.sharedEditorCellId);
          if (cell) cell.source = state.sharedEditor.getValue();
        }

        function renderCodeCellPreview(host, cell) {
          host.innerHTML = "";
          host.classList.remove("verdict-cm-host");
          host.classList.add("notebook-cell-editor", "notebook-cell-editor--preview");
          const pre = document.createElement("pre");
          pre.className =
            "notebook-cell-source-preview m-0 min-h-[2rem] cursor-text overflow-auto px-3 py-2 font-mono text-xs leading-relaxed text-slate-200";
          pre.innerHTML = highlightVerdictToHtml(cell.source ?? "");
          pre.tabIndex = 0;
          pre.onmousedown = (e) => {
            e.preventDefault();
            focusCell(cell.id);
          };
          host.appendChild(pre);
        }

        // Grow the active cell's host to fit the editor content (Jupyter-style),
        // capped so very long cells scroll instead of taking over the viewport.
        function fitActiveHost() {
          const ed = state.sharedEditor;
          if (!ed || !state.sharedEditorCellId) return;
          const cell = state.cells.find((c) => c.id === state.sharedEditorCellId);
          if (cell?.ui?.editorResized) return; // user pinned this cell's height
          const host = stack.querySelector(`[data-cell-editor-host="${state.sharedEditorCellId}"]`);
          if (!host) return;
          const content = ed.view?.contentHeight ?? 0;
          host.style.height = `${Math.min(Math.max(content + 14, 48), 1600)}px`;
        }

        function attachSharedEditorToCell(cellId) {
          const cell = state.cells.find((c) => c.id === cellId);
          const host = stack.querySelector(`[data-cell-editor-host="${cellId}"]`);
          if (!cell || cell.kind !== "code" || !host) return;

          host.classList.remove("notebook-cell-editor--preview");
          host.style.overflow = "hidden";

          if (!state.sharedEditor) {
            state.sharedEditor = createVerdictEditor(host, {
              variant: "cell",
              value: cell.source ?? "",
              editable: true,
              languageService: buildNotebookLanguageService(),
              onChange: (v) => {
                const activeCell =
                  state.cells.find((c) => c.id === state.sharedEditorCellId) ?? cell;
                updateNotebook({ tag: "setSource", id: activeCell.id, source: v });
                fitActiveHost();
                onCellSourceEdit();
              },
              onFocus: () => {
                const activeId = state.sharedEditorCellId ?? cellId;
                if (state.focusedId !== activeId) focusCell(activeId);
              },
            });
            state.sharedEditorCellId = cellId;
            state.sharedEditor.focus();
            requestAnimationFrame(fitActiveHost);
            return;
          }

          const ed = state.sharedEditor;
          if (ed.view.dom.parentElement !== host) {
            host.innerHTML = "";
            host.appendChild(ed.view.dom);
          }
          if (state.sharedEditorCellId !== cellId) {
            syncSharedEditorSource();
            state.sharedEditorCellId = cellId;
            ed.setValue(cell.source ?? "");
          }
          ed.setEditable(true);
          ed.refreshLanguageService();
          ed.focus();
          requestAnimationFrame(fitActiveHost);
        }

        function disposePropEditorForCell(cellId) {
          if (state.sharedEditorCellId !== cellId || !state.sharedEditor) return;
          syncSharedEditorSource();
          const host = stack.querySelector(`[data-cell-editor-host="${cellId}"]`);
          if (host?.contains(state.sharedEditor.view.dom)) {
            host.removeChild(state.sharedEditor.view.dom);
          }
          state.sharedEditorCellId = null;
        }

        function disposeAllPropEditors() {
          disposeSharedEditor();
        }

        function applyFocusPatch() {
          for (const el of stack.querySelectorAll("[data-cell-id]")) {
            const cid = el.dataset.cellId;
            const focused = state.focusedId === cid;
            el.classList.toggle("border-indigo-400/70", focused);
            el.classList.toggle("border-slate-800", !focused);
            el.dataset.cellFocused = focused ? "1" : "0";
          }
        }

        function swapEditorForFocus(prevId, nextId) {
          syncSharedEditorSource();
          if (prevId && prevId !== nextId) {
            const prevCell = state.cells.find((c) => c.id === prevId);
            const prevHost = stack.querySelector(`[data-cell-editor-host="${prevId}"]`);
            if (prevCell?.kind === "code" && prevHost) {
              if (state.sharedEditor?.view.dom.parentElement === prevHost) {
                prevHost.removeChild(state.sharedEditor.view.dom);
              }
              renderCodeCellPreview(prevHost, prevCell);
            }
          }
          if (nextId) attachSharedEditorToCell(nextId);
        }

        function scrollCellIntoView(id) {
          stack.querySelector(`[data-cell-id="${id}"]`)?.scrollIntoView({ block: "nearest" });
        }

        function focusCell(id) {
          if (state.focusedId === id) {
            if (!bridge.isSourceMode?.() && stack.querySelector(`[data-cell-id="${id}"]`)) {
              applyFocusPatch();
              if (state.sharedEditorCellId !== id) {
                swapEditorForFocus(state.sharedEditorCellId, id);
              }
              schedulePublishPanel();
            }
            scrollCellIntoView(id);
            return;
          }
          const prevId = state.focusedId;
          updateNotebook({ tag: "focus", id });
          if (!bridge.isSourceMode?.() && stack.querySelector(`[data-cell-id="${id}"]`)) {
            applyFocusPatch();
            swapEditorForFocus(prevId, id);
            scrollCellIntoView(id);
            schedulePublishPanel();
            return;
          }
          void render();
        }

        function schedulePublishPanel() {
          if (panelTimer !== null) window.clearTimeout(panelTimer);
          panelTimer = window.setTimeout(() => {
            panelTimer = null;
            void publishPanel();
          }, 80);
        }

        async function refreshCellOutput(cell, idx) {
          const outHost = stack.querySelector(`[data-cell-output="${cell.id}"]`);
          if (!outHost) {
            await render();
            return;
          }
          outHost.innerHTML = "";
          await fillOutputHost(outHost, cell, idx);
        }

        async function fillOutputHost(hostEl, cell, idx) {
          hostEl.innerHTML = "";
          const names = outputKeysForCell(cell);
          let hasContent = false;
          for (const n of names) {
            const key = `${cell.id}:${n}`;
            if (!state.outputs[key]) continue;
            hasContent = true;
            const o = state.outputs[key];
            const block = document.createElement("div");
            block.className = "mb-2";
            block.dataset.cellOutputBinding = n;
            hostEl.appendChild(block);
            await renderOutputBlock(block, o, bridge);
          }
          if (state.errors[cell.id]) {
            hasContent = true;
            const err = document.createElement("div");
            err.className = "text-xs text-rose-400";
            err.textContent = state.errors[cell.id];
            hostEl.appendChild(err);
          }
          return hasContent;
        }

        // Publish one section per cell (navigation + run state + output) to the
        // editor's right-side panel, where the merged Cells view renders them.
        async function publishPanel() {
          const sections = [];
          for (let i = 0; i < state.cells.length; i++) {
            const cell = state.cells[i];
            const ui = ensureUi(cell);
            const names = bindingNamesForRun(cell);
            const allOutputs = names
              .map((n) => state.outputs[`${cell.id}:${n}`])
              .filter(Boolean);
            sections.push({
              cellIndex: i,
              cellId: cell.id,
              kind: cell.kind === "wysiwyg" ? "text" : "code",
              preview: getCellPreviewLine(cell),
              running: state.running.has(cell.id),
              focused: state.focusedId === cell.id,
              hasOutput: allOutputs.length > 0 || Boolean(state.errors[cell.id]),
            });
          }
          await Promise.resolve(bridge.syncCellsNav?.(sections));
        }

        // Nav/preview line is computed in PureScript (Notebook.cellPreviewLine)
        // so navigation has a single source of truth.
        const getCellPreviewLine = (cell) => cellPreviewLine(cell);

        function cellHasOutput(cell) {
          return outputKeysForCell(cell).some((n) => state.outputs[`${cell.id}:${n}`]) || Boolean(state.errors[cell.id]);
        }

        // A single "⋯" overflow menu holds every secondary action, so the gutter
        // stays just [number] [Run]. Native <details> = no click-outside JS.
        function buildCellMenu(cell, idx, ui, isCodeCell, isMax) {
          const details = document.createElement("details");
          details.className = "notebook-cell-menu relative";
          const summary = document.createElement("summary");
          summary.dataset.cellMenu = "1";
          summary.title = "Cell actions";
          summary.className =
            "notebook-gutter-btn flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded border border-slate-700/80 bg-slate-900/80 text-[13px] font-bold text-slate-400 hover:border-slate-500 hover:text-white";
          summary.textContent = "⋯";
          details.appendChild(summary);

          const menu = document.createElement("div");
          menu.dataset.cellActions = "1";
          menu.className =
            "notebook-cell-actions absolute left-9 top-0 z-30 flex w-44 flex-col rounded border border-slate-700 bg-slate-900 p-1 text-left shadow-xl";

          const item = (label, fn, extra) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "rounded px-2 py-1 text-left text-xs text-slate-300 hover:bg-slate-800 " + (extra ?? "");
            b.textContent = label;
            b.onclick = () => {
              details.open = false;
              fn();
            };
            menu.appendChild(b);
            return b;
          };
          const sep = () => {
            const d = document.createElement("div");
            d.className = "my-1 border-t border-slate-800";
            menu.appendChild(d);
          };

          // Fold and Hide-output are gutter icons (see appendCellGutterControls).
          if (isCodeCell && idx > 0) item("Run above", () => void runAbove(idx));
          item(isMax ? "Minimize" : "Maximize", () => {
            updateNotebook({ tag: "maximize", id: cell.id });
            render();
          });
          sep();
          item("Insert code below", () => addCellBelow(idx, "code"));
          item("Insert text below", () => addCellBelow(idx, "wysiwyg"));
          if (idx > 0) item("Move up", () => moveCellBy(idx, -1));
          if (idx < state.cells.length - 1) item("Move down", () => moveCellBy(idx, 1));
          sep();
          item("Delete cell", () => deleteCellAt(idx), "text-rose-300 hover:bg-rose-500/10");

          details.appendChild(menu);
          return details;
        }

        function appendCellGutterControls(gutter, cell, idx, ui, isCodeCell, isMax) {
          const num = document.createElement("span");
          num.className = "whitespace-nowrap text-[10px] font-mono text-slate-500";
          const executionCount = state.executionCounts[cell.id];
          num.textContent = isCodeCell ? `In [${executionCount ?? " "}]:` : `[${idx + 1}]`;
          gutter.appendChild(num);

          if (isCodeCell)
            gutter.appendChild(
              mkGutterRunBtn(cell, idx, runCell, stopCell, state.running.has(cell.id)),
            );

          const activeClass = "border-indigo-400/60 bg-indigo-500/10 text-indigo-200";

          // Fold ALL (code + output) — collapse the cell to its preview line.
          const foldBtn = mkGutterBtn(
            ui.folded ? "Expand cell" : "Fold all (code + output)",
            ui.folded ? "▸" : "▾",
            ui.folded ? activeClass : "",
            { key: "foldCell", value: cell.id },
          );
          foldBtn.onclick = () => {
            const willExpand = ui.folded;
            updateNotebook({ tag: "toggleFold", id: cell.id });
            if (willExpand && cell.kind === "code") {
              updateNotebook({ tag: "focus", id: cell.id });
            }
            void patchCellDom(cell.id);
          };
          gutter.appendChild(foldBtn);

          if (isCodeCell && !ui.folded) {
            // Fold just the CODE (keep output visible).
            const codeBtn = mkGutterBtn(
              ui.codeFolded ? "Show code" : "Fold code",
              "{}",
              ui.codeFolded ? activeClass : "",
              { key: "codeToggle", value: cell.id },
            );
            codeBtn.onclick = () => {
              updateNotebook({ tag: "toggleCodeFold", id: cell.id });
              void patchCellDom(cell.id);
            };
            gutter.appendChild(codeBtn);

            // Fold just the OUTPUT (keep code visible).
            const outBtn = mkGutterBtn(
              ui.outputFolded ? "Show output" : "Fold output",
              ui.outputFolded ? "▢" : "▣",
              ui.outputFolded ? activeClass : "",
              { key: "outputToggle", value: cell.id },
            );
            outBtn.onclick = () => {
              updateNotebook({ tag: "toggleOutputFold", id: cell.id });
              void patchCellDom(cell.id);
            };
            gutter.appendChild(outBtn);
          }

          gutter.appendChild(buildCellMenu(cell, idx, ui, isCodeCell, isMax));
        }

        async function renderFoldedCell(wrap, cell, idx, ui, isCodeCell, isMax) {
          wrap.classList.add("notebook-cell--folded");

          const row = document.createElement("div");
          row.className = "flex min-h-0 items-start";

          const gutter = document.createElement("div");
          gutter.className =
            "notebook-cell-gutter notebook-cell-gutter--folded flex w-24 shrink-0 flex-row flex-wrap items-center content-start gap-1 self-start border-r border-slate-800 bg-slate-950 px-1.5 py-1";
          appendCellGutterControls(gutter, cell, idx, ui, isCodeCell, isMax, { compact: true });

          const body = document.createElement("div");
          body.className = "notebook-cell-body flex min-w-0 flex-1 flex-col min-h-0";

          const previewRow = document.createElement("div");
          previewRow.className = "notebook-cell-folded-head flex min-h-[2rem] min-w-0 items-center px-2 py-1";
          const preview = document.createElement("div");
          preview.className =
            "min-w-0 flex-1 truncate font-mono text-xs text-slate-400 cursor-pointer hover:text-slate-200";
          preview.title = "Click to expand cell";
          preview.textContent = getCellPreviewLine(cell);
          preview.onclick = () => {
            updateNotebook({ tag: "setFolded", id: cell.id, folded: false });
            if (cell.kind === "code") updateNotebook({ tag: "focus", id: cell.id });
            render();
          };
          previewRow.appendChild(preview);
          body.appendChild(previewRow);

          // A folded cell collapses to just its preview line — no output shown.

          row.appendChild(gutter);
          row.appendChild(body);
          wrap.appendChild(row);
        }

        async function renderCell(cell, idx, maximized = false) {
          const ui = ensureUi(cell);
          const isMax = maximized || state.maximizedCellId === cell.id;
          const editorH = isMax ? Math.max(ui.editorHeight, 320) : ui.editorHeight;
          const isCodeCell = cell.kind === "code";

          const wrap = document.createElement("div");
          // shrink-0 so cells keep their height and the stack scrolls (Jupyter-style)
          // instead of compressing every cell to fit the viewport.
          const focused = state.focusedId === cell.id;
          wrap.className =
            "notebook-cell shrink-0 rounded-md border bg-slate-950/60 overflow-hidden " +
            (focused ? "border-indigo-400/70" : "border-slate-800");
          wrap.dataset.cellId = cell.id;
          wrap.dataset.cellFocused = focused ? "1" : "0";
          if (isMax) wrap.classList.add("notebook-cell--maximized");

          if (ui.folded && !isMax) {
            await renderFoldedCell(wrap, cell, idx, ui, isCodeCell, isMax);
            return wrap;
          }

          const row = document.createElement("div");
          row.className = "flex min-h-0";

          const gutter = document.createElement("div");
          gutter.className =
            "notebook-cell-gutter flex w-20 shrink-0 flex-col items-center gap-1.5 border-r border-slate-800 bg-slate-950 py-2";
          appendCellGutterControls(gutter, cell, idx, ui, isCodeCell, isMax);

          const body = document.createElement("div");
          body.className = "notebook-cell-body flex min-w-0 flex-1 flex-col min-h-0";

          const cellHead = document.createElement("div");
          cellHead.className =
            "flex min-h-[2rem] items-center justify-between border-b border-slate-800/70 px-3 py-1";
          const cellTitle = document.createElement("button");
          cellTitle.type = "button";
          cellTitle.className = "min-w-0 truncate text-left font-mono text-[11px] text-slate-400 hover:text-slate-200";
          cellTitle.textContent = getCellPreviewLine(cell);
          cellTitle.onclick = () => focusCell(cell.id);
          const cellKind = document.createElement("span");
          cellKind.className =
            "ml-3 shrink-0 rounded border border-slate-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500";
          cellKind.textContent = cell.kind === "wysiwyg" ? "Markdown" : "Code";
          cellHead.appendChild(cellTitle);
          cellHead.appendChild(cellKind);
          body.appendChild(cellHead);

          if (ui.codeFolded && cell.kind === "code") {
            const bar = document.createElement("div");
            bar.className =
              "flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[11px] italic text-slate-500 hover:text-slate-300";
            bar.textContent = "⟨ code hidden — click to show ⟩";
            bar.onclick = () => {
              updateNotebook({ tag: "setCodeFolded", id: cell.id, folded: false });
              render();
            };
            body.appendChild(bar);
          } else {
          const editorSection = document.createElement("div");
          editorSection.className =
            "notebook-cell-editor-section relative flex flex-col min-h-0 overflow-hidden";

          // Jupyter-style: the editor shows its FULL content so the wheel scrolls
          // the page between cells instead of getting trapped in a per-cell
          // scrollbar. A manual drag (editorResized) pins an explicit height.
          const maxEditorH = isMax ? 2400 : 1600;
          const lineCount = Math.max((cell.source || "").split("\n").length, 1);
          const autoH = Math.min(Math.max(lineCount * 18 + 18, 48), maxEditorH);
          const contentH = ui.editorResized ? Math.min(Math.max(ui.editorHeight, 48), maxEditorH) : autoH;
          const editorHost = document.createElement("div");
          editorHost.className = "notebook-cell-editor font-mono text-xs verdict-cm-host";
          editorHost.dataset.cellEditorHost = cell.id;
          editorHost.style.height = `${contentH}px`;
          editorHost.style.overflow = "hidden";

          if (cell.kind === "wysiwyg") {
            editorHost.style.height = "auto";
            mountWysiwyg(editorHost, cell.source, (md) => {
              updateNotebook({ tag: "setSource", id: cell.id, source: md });
              persist(state, bridge);
            });
          } else if (cell.kind === "code" && !bridge.isSourceMode?.()) {
            if (focused) {
              editorHost.dataset.cellEditorActive = "1";
            } else {
              renderCodeCellPreview(editorHost, cell);
            }
          }

          editorSection.appendChild(editorHost);
          body.appendChild(editorSection);

          // Drag handle to pin the editor height (overrides auto-fit).
          if (cell.kind === "code" && !isMax) {
            const editorResizer = document.createElement("div");
            editorResizer.className = "notebook-cell-editor-resizer";
            editorResizer.title = "Resize editor";
            installVerticalResize(
              editorResizer,
              () => parseInt(editorHost.style.height, 10) || contentH,
              (height) => {
                const next = Math.round(height);
                editorHost.style.height = `${next}px`;
                if (state.sharedEditorCellId === cell.id) state.sharedEditor?.view?.requestMeasure?.();
                updateNotebook({ tag: "setEditorHeight", id: cell.id, height: next });
                persist(state, bridge);
              },
              { min: 48, max: maxEditorH },
            );
            body.appendChild(editorResizer);
          }
          }

          const diagHost = document.createElement("div");
          diagHost.className = "px-3 py-1";
          diagHost.dataset.cellDiagHost = "1";
          const diags = state.cellDiags[cell.id] ?? [];
          for (const d of diags) {
            const el = document.createElement("div");
            el.className = "text-xs text-rose-400 font-mono";
            el.dataset.cellDiag = "1";
            el.textContent = `Line ${d.line}: ${d.message}`;
            diagHost.appendChild(el);
          }
          if (diags.length) body.appendChild(diagHost);

          if (!ui.outputFolded) {
            const outHost = document.createElement("div");
            outHost.className = "notebook-output border-t border-slate-800 px-3 py-2 overflow-auto";
            outHost.dataset.cellOutput = cell.id;
            outHost.style.maxHeight = isMax ? "none" : `${Math.max(ui.outputHeight, 96)}px`;
            await fillOutputHost(outHost, cell, idx);
            body.appendChild(outHost);
            if (!isMax) {
              const outputResizer = document.createElement("div");
              outputResizer.className = "notebook-cell-output-resizer";
              outputResizer.title = "Resize output";
              installVerticalResize(
                outputResizer,
                () => Math.max(ui.outputHeight, 96),
                (height) => {
                  const nextHeight = Math.round(height);
                  updateNotebook({ tag: "setOutputHeight", id: cell.id, height: nextHeight });
                  outHost.style.maxHeight = `${nextHeight}px`;
                  persist(state, bridge);
                },
                { min: 96, max: 1200 },
              );
              body.appendChild(outputResizer);
            }
          }

          row.appendChild(gutter);
          row.appendChild(body);
          wrap.appendChild(row);
          return wrap;
        }

        function canIncrementalDom() {
          return !state.maximizedCellId && !bridge.isSourceMode?.();
        }

        async function replaceCellDom(cellId) {
          const idx = state.cells.findIndex((c) => c.id === cellId);
          if (idx < 0) return;
          disposePropEditorForCell(cellId);
          const old = stack.querySelector(`[data-cell-id="${cellId}"]`);
          const next = await renderCell(state.cells[idx], idx);
          if (old) old.replaceWith(next);
          else stack.appendChild(next);
          if (state.focusedId === cellId) attachSharedEditorToCell(cellId);
        }

        async function insertCellDom(cellIdx) {
          const cell = state.cells[cellIdx];
          if (!cell) return;
          const el = await renderCell(cell, cellIdx);
          const ref = stack.children[cellIdx] ?? null;
          if (ref) stack.insertBefore(el, ref);
          else stack.appendChild(el);
          if (state.focusedId === cell.id && cell.kind === "code") {
            attachSharedEditorToCell(cell.id);
          }
        }

        function removeCellDom(cellId) {
          disposePropEditorForCell(cellId);
          stack.querySelector(`[data-cell-id="${cellId}"]`)?.remove();
        }

        async function patchCellDom(cellId) {
          if (!canIncrementalDom()) {
            await renderFull();
            return;
          }
          await replaceCellDom(cellId);
          schedulePublishPanel();
        }

        async function renderFull() {
          const sourceMode = bridge.isSourceMode?.();
          bodyWrap.classList.toggle("hidden", !!sourceMode);
          if (sourceMode) {
            disposeAllPropEditors();
            return;
          }

          const maximized = state.maximizedCellId;
          toolbar.classList.toggle("hidden", !!maximized);

          syncSharedEditorSource();
          if (state.sharedEditor?.view.dom.parentElement) {
            state.sharedEditor.view.dom.parentElement.removeChild(state.sharedEditor.view.dom);
          }
          state.sharedEditorCellId = null;

          stack.innerHTML = "";
          stack.classList.toggle("notebook-stack--maximized", !!maximized);

          if (maximized) {
            const idx = state.cells.findIndex((c) => c.id === maximized);
            if (idx >= 0) {
              stack.appendChild(await renderCell(state.cells[idx], idx, true));
            } else {
              state.maximizedCellId = null;
            }
          }

          if (!maximized) {
            for (let i = 0; i < state.cells.length; i++) {
              stack.appendChild(await renderCell(state.cells[i], i));
            }
          }

          const focused = state.cells.find((c) => c.id === state.focusedId);
          if (focused?.kind === "code") attachSharedEditorToCell(focused.id);

          await publishPanel();
        }

        async function render() {
          await renderFull();
        }

        const onAddCode = () => {
          const cell = { id: newId(), kind: "code", source: "", ui: defaultCellUi() };
          updateNotebook({ tag: "appendCell", cell });
          publishSource();
          if (canIncrementalDom()) {
            void insertCellDom(state.cells.length - 1).then(() => {
              focusCell(cell.id);
              schedulePublishPanel();
            });
          } else {
            render();
          }
        };

        const onAddText = () => {
          updateNotebook({
            tag: "appendCell",
            cell: { id: newId(), kind: "wysiwyg", source: "", ui: defaultCellUi() },
          });
          persist(state, bridge);
          render();
        };

        const onCut = () => {
          const idx = selectedIndex();
          const cell = state.cells[idx];
          if (!cell) return;
          state.clipboardCell = cloneCellForPaste(cell);
          deleteCellAt(idx);
        };

        const onCopy = () => {
          const cell = state.cells[selectedIndex()];
          if (!cell) return;
          state.clipboardCell = cloneCellForPaste(cell);
        };

        const onPaste = () => {
          if (!state.clipboardCell) return;
          const idx = selectedIndex();
          const pasted = cloneCellForPaste(state.clipboardCell);
          const anchor = state.cells[idx];
          updateNotebook({ tag: "insertBelow", id: anchor?.id ?? "", cell: pasted });
          publishSource();
          if (canIncrementalDom()) {
            void insertCellDom(idx + 1).then(() => {
              focusCell(pasted.id);
              schedulePublishPanel();
            });
          } else {
            render();
          }
        };

        const onRun = () => {
          const idx = selectedIndex();
          const cell = state.cells[idx];
          if (cell?.kind === "code") void runCell(cell, idx);
        };

        const onStop = () => {
          const cell = state.cells[selectedIndex()];
          if (cell?.kind === "code") stopCell(cell);
        };

        const onRunAll = () => runAll();

        // Mount the PureScript ps-spa toolbar, wiring each button to its handler.
        const mountToolbar = globalThis.__notebookMountToolbar;
        if (mountToolbar) {
          mountToolbar(toolbarButtonHost, {
            onSave,
            onAddCode,
            onAddText,
            onCut,
            onCopy,
            onPaste,
            onRun,
            onStop,
            onRunAll,
            onSource,
            onOpen,
            onReset,
          });
        }

        root.appendChild(toolbar);
        root.appendChild(bodyWrap);
        host.innerHTML = "";
        host.appendChild(root);

        root.tabIndex = 0;
        root.onkeydown = (e) => {
          if (bridge.isSourceMode?.()) return;
          const focused = state.cells.find((c) => c.id === state.focusedId);
          if (!focused || focused.kind !== "code") return;
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            const idx = state.cells.indexOf(focused);
            void runCell(focused, idx >= 0 ? idx : 0);
          } else if (e.key === "Enter" && e.shiftKey) {
            e.preventDefault();
            const idx = state.cells.indexOf(focused);
            void runCell(focused, idx >= 0 ? idx : 0).then(() => {
              const nextIdx = state.cells.indexOf(focused);
              if (nextIdx >= 0 && nextIdx < state.cells.length - 1) {
                focusCell(state.cells[nextIdx + 1].id);
              }
            });
          } else if (e.key === "Escape" && state.maximizedCellId) {
            updateNotebook({ tag: "clearMaximize" });
            render();
          }
        };

        render();
        return api;
      };
    };
  };
}

export { concatCode as concatenateCodeImpl } from "./NotebookPs.js";

export { decodeDisplay, renderDisplayInto } from "./Display.js";
export { rowsToCsv, csvEscape } from "./SpreadsheetTable.js";
