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
  routeEvalResults,
  cellViewPlan,
} from "./NotebookPs.js";
import {
  buildNotebookProgramSource,
  buildRunnableCellSource,
  isModuleCell,
  isRunnableCell,
  normalizeCellMeta,
  projectCellLabel,
} from "./NotebookProject.js";

function makeBindingHelpers(bridge) {
  function bindingNamesForCellBridge(cell, allCells, getSource) {
    const cells = allCells.map((c) => ({
      id: c.id,
      kind: c.kind,
      role: c.role,
      path: c.path,
      moduleName: c.moduleName,
      source: c.source,
    }));
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
      role: c.role,
      path: c.path,
      moduleName: c.moduleName,
      name: c.name ?? "",
      source: c.source,
      ui: c.ui,
    })),
  });
}

// `onLive` runs on every drag step and must be CHEAP (DOM only — no model rebuild
// or persist). `onCommit` runs once on release with the final height (update the
// model + persist there). This avoids recreating the cell array / writing
// localStorage on every pixel, which scrambled the layout.
function installVerticalResize(handle, getHeight, onLive, { min = 72, max = 720, onCommit } = {}) {
  handle.addEventListener("mousedown", (event) => {
    event.preventDefault();
    const startY = event.clientY;
    const startH = getHeight();
    let lastH = startH;
    const onMove = (moveEvent) => {
      lastH = Math.min(max, Math.max(min, startH + (moveEvent.clientY - startY)));
      onLive(lastH);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.classList.remove("notebook-resize-active");
      if (onCommit) onCommit(lastH);
    };
    document.body.classList.add("notebook-resize-active");
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  });
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
          // Cells whose Run started an in-cell loop. The cell renders its output,
          // then the scheduler waits the cell's declared cadence (loopEvery/sleep
          // ms) before re-running it — so output is visible BEFORE the wait, not
          // after. Loops are PER CELL and independent; Stop clears them.
          cellLoops: new Set(),
          loopTimers: {},
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
          const meta = normalizeCellMeta(c);
          return {
            id: c.id || newId(),
            kind: meta.kind,
            role: meta.role,
            path: meta.path,
            moduleName: meta.moduleName,
            name: c.name ?? "",
            source: meta.source,
            ui: { ...defaultCellUi(), ...c.ui },
          };
        }

        function cellsFromSources(sources) {
          return sources.map((s) => ({
            id: newId(),
            ...normalizeCellMeta({ kind: "code", source: s }),
            ui: defaultCellUi(),
          }));
        }

        function modelSnapshot() {
          return {
            cells: state.cells.map((c) => ({
              id: c.id,
              kind: c.kind === "wysiwyg" ? "wysiwyg" : "code",
              role: c.role,
              path: c.path,
              moduleName: c.moduleName,
              name: c.name ?? "",
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
            // Fresh start: module/library cells begin FOLDED (they are reference,
            // not the thing you run), runnable cells stay open. User edits persist,
            // so this only applies to the initial seed.
            state.cells = seeded.cells.map((c) => ({
              ...c,
              ui: { ...c.ui, folded: isModuleCell(c) },
            }));
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

        // Output routing is decided in PureScript (Notebook.Run.routeEvalResults);
        // JS only applies the chosen targets to the outputs/errors maps and the
        // opaque output payloads.
        function applyEvalResults(outs, upToIdx, focusCellId) {
          const cellInfo = state.cells.map((c) => ({
            id: c.id,
            runnable: isRunnableCell(c),
            names: bindingNamesForRun(c),
          }));
          const { targetIds, fallbackName, fallbackCellId } = routeEvalResults(
            cellInfo,
            outs.map((o) => ({ name: o.name })),
            upToIdx,
            focusCellId,
          );
          for (let i = 0; i < outs.length; i++) {
            const targetId = targetIds[i];
            if (!targetId) continue;
            const o = outs[i];
            state.outputs[`${targetId}:${o.name}`] = o;
            state.errors[targetId] = o.ok ? "" : o.error || "";
          }
          if (fallbackCellId && fallbackName) {
            const errOut = outs.find((o) => o.name === fallbackName);
            if (errOut) {
              state.outputs[`${fallbackCellId}:${errOut.name}`] = errOut;
              state.errors[fallbackCellId] = errOut.error || "";
            }
          }
        }

        async function evalCellOutputs(cell, cellIdx, signal) {
          const cellNames = bindingNamesForRun(cell);
          const src = getBridgeSourceForCell(cell);
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
          return buildNotebookProgramSource(state.cells);
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

          const cells = state.cells.map((c) => ({
            id: c.id,
            kind: c.kind,
            role: c.role,
            path: c.path,
            moduleName: c.moduleName,
            source: c.source,
          }));
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
              cell: { id: newId(), ...normalizeCellMeta({ kind: "code", source: src || "" }), ui: defaultCellUi() },
            });
            publishSource();
            render();
          },
          getViewMode: () => (bridge.isSourceMode?.() ? "source" : "notebook"),
          runAll: () => runAll(),
          // Stop every in-flight cell run (used when the live loop is stopped).
          stopAll: () => {
            for (const c of state.cells) {
              if (state.running.has(c.id)) stopCell(c);
            }
          },
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
          deleteCellById: (id) => {
            const i = state.cells.findIndex((c) => c.id === id);
            if (i >= 0) deleteCellAt(i);
          },
          notebookCells: () =>
            state.cells.map((c) => ({
              id: c.id,
              kind: c.kind,
              role: c.role,
              path: c.path,
              moduleName: c.moduleName,
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
              role: c.role,
              path: c.path,
              moduleName: c.moduleName,
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

        function downloadCellFile(cell) {
          const meta = normalizeCellMeta(cell);
          const filename = meta.path || `${cell.id}.${cell.kind === "wysiwyg" ? "md" : "verdict"}`;
          const blob = new Blob([cell.source ?? ""], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename.split("/").filter(Boolean).pop() || "cell.verdict";
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
            cell: { id: newId(), ...normalizeCellMeta({ kind: "code", source: text, path: file.name }), ui: defaultCellUi() },
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

        function getBridgeSourceForCell(cell) {
          const src = buildRunnableCellSource(cell, state.cells);
          return bridge.materialize?.(src, { id: cell.id, index: state.cells.indexOf(cell) }) ?? src;
        }

        function bindingNamesForRun(cell) {
          if (!isRunnableCell(cell)) return [];
          const sourceForCell = () => buildRunnableCellSource(cell, state.cells);
          const fromBridge = bindingNamesForCell(cell, state.cells, sourceForCell);
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

        // A cell drives its own loop when its source uses the Loop library
        // (`loopEvery`/`sleep`). The cadence is the millisecond arg in the cell
        // source — nothing hidden, nothing global.
        function isLoopCell(cell) {
          return isRunnableCell(cell) && /\b(loopEvery|sleep)\b/.test(cell.source ?? "");
        }

        // The inter-iteration delay, read from the cell's `loopEvery(ms, …)` or
        // `sleep(ms)` call. The scheduler applies it between renders (see runCell).
        // Inputs are materialized first so `loopEvery(__INPUT_loopIntervalMs__, …)`
        // resolves to its numeric value.
        function loopCadenceMs(cell) {
          const src = bridge.materialize?.(cell.source ?? "") ?? cell.source ?? "";
          const m = String(src).match(/\b(?:loopEvery|sleep)\s*\(\s*(\d+)/);
          const ms = m ? parseInt(m[1], 10) : 1000;
          return Math.min(Math.max(ms, 250), 600000);
        }

        // Single source of truth for the 3-color status dot, shared by the
        // gutter and the Cells nav: orange while running/looping, red on the
        // last error, green when the last run produced output, else gray.
        function cellStatus(cell) {
          if (state.running.has(cell.id) || state.cellLoops.has(cell.id)) return "running";
          if (state.errors[cell.id]) return "error";
          if (cellHasOutput(cell)) return "ok";
          return "idle";
        }

        async function runCell(cell, cellIdx, opts = {}) {
          if (!isRunnableCell(cell)) return;
          // A loop re-runs the same cell, so allow the loop's own re-entry
          // (looping flag) past the in-flight guard.
          if (state.running.has(cell.id) && !opts.looping) return;
          // Starting Run on a loop cell registers the loop before the first run
          // so the status reflects "looping" immediately.
          if (!opts.looping && isLoopCell(cell)) state.cellLoops.add(cell.id);
          syncSharedEditorSource();
          const controller = new AbortController();
          state.runControllers[cell.id] = controller;
          state.running.add(cell.id);
          const ui = ensureUi(cell);
          updateNotebook({ tag: "setOutputFolded", id: cell.id, folded: false });
          refreshCellGutter(cell, cellIdx);
          schedulePublishPanel();
          let iterationErrored = false;
          try {
            const cellNames = bindingNamesForRun(cell);
            if (cellNames.length === 0) {
              state.errors[cell.id] = "";
              return;
            }
            const outs = await evalCellOutputs(cell, cellIdx, controller.signal);
            if (controller.signal.aborted) return;
            applyEvalResults(outs, cellIdx, cell.id);
            if (state.errors[cell.id]) iterationErrored = true;
          } catch (e) {
            if (!controller.signal.aborted) {
              state.errors[cell.id] = String(e);
              iterationErrored = true;
            }
          } finally {
            const aborted = controller.signal.aborted;
            if (!aborted) {
              state.executionSeq += 1;
              state.executionCounts[cell.id] = state.executionSeq;
            }
            state.running.delete(cell.id);
            delete state.runControllers[cell.id];
            // Keep the loop alive while it is still registered and healthy; an
            // error or Stop ends it (Stop already cleared cellLoops). The next
            // pass runs immediately — the cell's own `time.sleep` already
            // provided the inter-iteration delay during this run.
            const shouldLoop = !aborted && !iterationErrored && state.cellLoops.has(cell.id);
            if (iterationErrored) state.cellLoops.delete(cell.id);
            refreshCellGutter(cell, cellIdx);
            await refreshCellOutput(cell, cellIdx);
            schedulePublishPanel();
            // Output is now rendered. Wait the cell's declared cadence, THEN
            // re-run — the inter-iteration delay lives between renders, so the
            // user sees each result immediately instead of after the wait.
            if (shouldLoop) {
              const ms = loopCadenceMs(cell);
              state.loopTimers[cell.id] = window.setTimeout(() => {
                delete state.loopTimers[cell.id];
                if (!state.cellLoops.has(cell.id)) return;
                const nextIdx = state.cells.findIndex((c) => c.id === cell.id);
                if (nextIdx >= 0) void runCell(state.cells[nextIdx], nextIdx, { looping: true });
              }, ms);
            }
          }
        }

        function stopCell(cell) {
          state.cellLoops.delete(cell.id);
          if (state.loopTimers[cell.id]) {
            window.clearTimeout(state.loopTimers[cell.id]);
            delete state.loopTimers[cell.id];
          }
          const controller = state.runControllers[cell.id];
          if (controller) controller.abort();
          state.running.delete(cell.id);
          delete state.runControllers[cell.id];
          state.errors[cell.id] = "Stopped.";
          refreshCellGutterById(cell.id);
          schedulePublishPanel();
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
        // A cell's role is derived from its source header: `module Main exposing
        // (main)` is runnable; `module <Name> exposing (..)` (Name != Main) is a
        // shared module. These starter templates make that choice explicit when
        // inserting a cell — the header is fully visible/editable, nothing hidden.
        const RUNNABLE_TEMPLATE = "module Main exposing (main)\n\nmain =\n  \"edit me\"\n";
        const MODULE_TEMPLATE =
          "module NewModule exposing (..)\n\n" +
          "-- Shared helpers. Rename NewModule, then import from a runnable cell:\n" +
          "--   import NewModule exposing (..)\n" +
          "greeting : String\ngreeting = \"hello from NewModule\"\n";

        function addCellBelow(idx, kind, source = "") {
          const cell = { id: newId(), ...normalizeCellMeta({ kind: kind === "wysiwyg" ? "wysiwyg" : "code", source }), ui: defaultCellUi() };
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
            ...normalizeCellMeta(cell),
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
            fallbackCell: { id: newId(), ...normalizeCellMeta({ kind: "code", source: "" }), ui: defaultCellUi() },
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

        // Re-mount just this cell's gutter so the In [N]: execution count and the
        // run/stop button reflect the current run state (Jupyter-style), without
        // tearing down the editor/output. Used by run/stop and the live loop.
        function refreshCellGutter(cell, idx) {
          const gutter = stack.querySelector(`[data-cell-id="${cell.id}"] .notebook-cell-gutter`);
          if (!gutter) return;
          const ui = ensureUi(cell);
          const isMax = state.maximizedCellId === cell.id;
          appendCellGutterControls(gutter, cell, idx, ui, cell.kind === "code", isMax);
        }

        // Refresh gutter + output for a cell by id (used by Stop, which has no
        // index in scope), without re-rendering the whole stack.
        function refreshCellGutterById(cellId) {
          const idx = state.cells.findIndex((c) => c.id === cellId);
          if (idx < 0) return;
          const cell = state.cells[idx];
          refreshCellGutter(cell, idx);
          void refreshCellOutput(cell, idx);
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
              kind: cell.kind === "wysiwyg" ? "text" : isModuleCell(cell) ? "module" : "code",
              name: cell.name ?? "",
              preview: getCellPreviewLine(cell),
              // "running" for the nav includes a loop waiting between iterations,
              // so the Stop button + status dot stay visible during the cadence.
              running: state.running.has(cell.id) || state.cellLoops.has(cell.id),
              focused: state.focusedId === cell.id,
              hasOutput: allOutputs.length > 0 || Boolean(state.errors[cell.id]),
            });
          }
          await Promise.resolve(bridge.syncCellsNav?.(sections));
        }

        // Nav/preview line: a user-given cell name wins; otherwise the first code
        // line (PureScript Notebook.cellPreviewLine, single source of truth).
        const getCellPreviewLine = (cell) =>
          cell.name && cell.name.trim() ? cell.name.trim() : cellPreviewLine(cell);

        function cellHasOutput(cell) {
          return outputKeysForCell(cell).some((n) => state.outputs[`${cell.id}:${n}`]) || Boolean(state.errors[cell.id]);
        }

        // Build the "⋯" overflow menu item list as plain data; the PureScript
        // gutter component renders the native <details> wrapper + buttons.
        function buildCellMenuItems(cell, idx, ui, isCodeCell, isMax) {
          const items = [];
          const add = (label, onClick, opts = {}) =>
            items.push({ label, onClick, danger: !!opts.danger, sepBefore: !!opts.sepBefore });

          if (isRunnableCell(cell) && idx > 0) add("Run above", () => void runAbove(idx));
          add(cell.name ? "Rename cell" : "Name cell", () => {
            const next = prompt("Cell name (shown in the Cells panel):", cell.name ?? "");
            if (next === null) return;
            updateNotebook({ tag: "setName", id: cell.id, name: next.trim() });
            persist(state, bridge);
            schedulePublishPanel();
            void patchCellDom(cell.id);
          });
          if (isCodeCell) add("Save file", () => downloadCellFile(cell));
          add("Insert runnable below", () => addCellBelow(idx, "code", RUNNABLE_TEMPLATE), { sepBefore: true });
          add("Insert module below", () => addCellBelow(idx, "code", MODULE_TEMPLATE));
          add("Insert text below", () => addCellBelow(idx, "wysiwyg"));
          if (idx > 0) add("Move up", () => moveCellBy(idx, -1));
          if (idx < state.cells.length - 1) add("Move down", () => moveCellBy(idx, 1));
          add("Delete cell", () => deleteCellAt(idx), { sepBefore: true, danger: true });

          return items;
        }

        // Render the gutter via the PureScript ps-spa component. The Model owns
        // the fold/run/number state; JS supplies action thunks (Effect Unit).
        function appendCellGutterControls(gutter, cell, idx, ui, isCodeCell, isMax) {
          const mountGutter = globalThis.__notebookMountGutter;
          const executionCount = state.executionCounts[cell.id];
          const number = isRunnableCell(cell)
            ? `In [${executionCount ?? " "}]:`
            : `[${idx + 1}]`;

          const props = {
            number,
            isRunnable: isRunnableCell(cell),
            isRunning: state.running.has(cell.id),
            isCodeCell,
            folded: !!ui.folded,
            codeFolded: !!ui.codeFolded,
            outputFolded: !!ui.outputFolded,
            onRun: () => void runCell(cell, idx),
            onStop: () => stopCell(cell, idx),
            onToggleFold: () => {
              const willExpand = ui.folded;
              updateNotebook({ tag: "toggleFold", id: cell.id });
              if (willExpand && cell.kind === "code") {
                updateNotebook({ tag: "focus", id: cell.id });
              }
              void patchCellDom(cell.id);
            },
            onToggleCodeFold: () => {
              updateNotebook({ tag: "toggleCodeFold", id: cell.id });
              void patchCellDom(cell.id);
            },
            onToggleOutputFold: () => {
              updateNotebook({ tag: "toggleOutputFold", id: cell.id });
              void patchCellDom(cell.id);
            },
            menu: buildCellMenuItems(cell, idx, ui, isCodeCell, isMax),
          };

          if (mountGutter) mountGutter(gutter, props);
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
          body.appendChild(previewRow);
          globalThis.__notebookMountFoldedPreview?.(previewRow, {
            preview: getCellPreviewLine(cell),
            onExpand: () => {
              updateNotebook({ tag: "setFolded", id: cell.id, folded: false });
              if (cell.kind === "code") updateNotebook({ tag: "focus", id: cell.id });
              render();
            },
          });

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
          const focused = state.focusedId === cell.id;

          // Pure render decisions (fold visibility, wrap class, editor/output
          // sizing) live in PureScript (Notebook.CellView). JS reads the live-only
          // values (line count, window.innerHeight) and applies the returned plan.
          const lineCount = Math.max((cell.source || "").split("\n").length, 1);
          const plan = cellViewPlan({
            kind: cell.kind,
            focused,
            isMax,
            folded: Boolean(ui.folded),
            codeFolded: Boolean(ui.codeFolded),
            outputFolded: Boolean(ui.outputFolded),
            editorResized: Boolean(ui.editorResized),
            editorHeight: Math.round(ui.editorHeight),
            outputResized: Boolean(ui.outputResized),
            outputHeight: Math.round(ui.outputHeight),
            lineCount,
            viewportHeight: window.innerHeight || 900,
          });

          const wrap = document.createElement("div");
          wrap.className = plan.wrapClass;
          wrap.dataset.cellId = cell.id;
          wrap.dataset.cellFocused = focused ? "1" : "0";
          if (isMax) wrap.classList.add("notebook-cell--maximized");

          if (plan.showFolded) {
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

          // Cell header (title + kind label) rendered by the PureScript chrome
          // component, derived from the Model.
          const cellHead = document.createElement("div");
          body.appendChild(cellHead);
          globalThis.__notebookMountCellHead?.(cellHead, {
            preview: getCellPreviewLine(cell),
            label: projectCellLabel(cell),
            onFocus: () => focusCell(cell.id),
          });

          if (plan.showCodeFoldedBar) {
            const bar = document.createElement("div");
            body.appendChild(bar);
            globalThis.__notebookMountCodeFoldedBar?.(bar, () => {
              updateNotebook({ tag: "setCodeFolded", id: cell.id, folded: false });
              render();
            });
          } else {
          const editorSection = document.createElement("div");
          editorSection.className =
            "notebook-cell-editor-section relative flex flex-col min-h-0 overflow-hidden";

          // Editor height + max are decided in PureScript (Notebook.CellView): a
          // cell starts at its content height capped at ~1/3 of the viewport, and
          // the user can drag it taller (editorResized pins an explicit height up
          // to maxEditorHeightPx).
          const maxEditorH = plan.maxEditorHeightPx;
          // Unfocused code cells render a static preview — keep them compact (a
          // scannable minimap) so a long cell doesn't fill the screen with a slab
          // of clipped code. The focused (active) cell keeps the roomy ~1/3
          // viewport editor; a manually resized cell keeps its pinned height.
          let contentH = plan.editorHeightPx;
          if (cell.kind === "code" && !focused && !isMax && !ui.editorResized) {
            contentH = Math.min(contentH, 240);
          }
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
                editorHost.style.height = `${Math.round(height)}px`;
                if (state.sharedEditorCellId === cell.id) state.sharedEditor?.view?.requestMeasure?.();
              },
              {
                min: 48,
                max: maxEditorH,
                onCommit: (height) => {
                  updateNotebook({ tag: "setEditorHeight", id: cell.id, height: Math.round(height) });
                  persist(state, bridge);
                },
              },
            );
            body.appendChild(editorResizer);
          }
          }

          const diags = state.cellDiags[cell.id] ?? [];
          if (diags.length) {
            const diagHost = document.createElement("div");
            diagHost.className = "px-3 py-1";
            diagHost.dataset.cellDiagHost = "1";
            body.appendChild(diagHost);
            globalThis.__notebookMountDiagnostics?.(
              diagHost,
              diags.map((d) => ({ line: d.line, message: d.message })),
            );
          }

          if (plan.showOutput) {
            const outHost = document.createElement("div");
            outHost.className = "notebook-output border-t border-slate-800 px-3 py-2 overflow-auto";
            outHost.dataset.cellOutput = cell.id;
            // Output sizing mode is decided in PureScript (Notebook.CellView):
            //   "none"   -> maximized; no max-height cap
            //   "pinned" -> user dragged; explicit height (grow AND shrink)
            //   "capped" -> un-resized; max-height so short output stays small
            if (plan.outputMode === "none") {
              outHost.style.maxHeight = "none";
            } else if (plan.outputMode === "pinned") {
              outHost.style.height = `${plan.outputHeightPx}px`;
            } else {
              outHost.style.maxHeight = `${plan.outputHeightPx}px`;
            }
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
                  outHost.style.maxHeight = "none";
                  outHost.style.height = `${Math.round(height)}px`;
                },
                {
                  min: 96,
                  max: 1200,
                  onCommit: (height) => {
                    updateNotebook({ tag: "setOutputHeight", id: cell.id, height: Math.round(height) });
                    persist(state, bridge);
                  },
                },
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

        function appendCodeCell(source) {
          const cell = { id: newId(), ...normalizeCellMeta({ kind: "code", source }), ui: defaultCellUi() };
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
        }

        const onAddCode = () => appendCodeCell(RUNNABLE_TEMPLATE);
        const onAddModule = () => appendCodeCell(MODULE_TEMPLATE);

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
          if (isRunnableCell(cell)) void runCell(cell, idx);
        };

        const onStop = () => {
          const cell = state.cells[selectedIndex()];
          if (isRunnableCell(cell)) stopCell(cell);
        };

        const onRunAll = () => runAll();

        // Mount the PureScript ps-spa toolbar, wiring each button to its handler.
        const mountToolbar = globalThis.__notebookMountToolbar;
        if (mountToolbar) {
          mountToolbar(toolbarButtonHost, {
            onSave,
            onAddCode,
            onAddModule,
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
            if (isRunnableCell(focused)) void runCell(focused, idx >= 0 ? idx : 0);
          } else if (e.key === "Enter" && e.shiftKey) {
            e.preventDefault();
            const idx = state.cells.indexOf(focused);
            if (!isRunnableCell(focused)) return;
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
