"use strict";

import { mountWysiwyg } from "./WysiwygFFI.js";
import { decodeDisplay, renderDisplayInto } from "./Display.js";
import { colorizeImpl, createEditorImpl, disposeEditorImpl } from "./MonacoFFI.js";

function bindingNames(source) {
  const names = [];
  for (const line of source.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("--")) continue;
    const eq = t.indexOf(" =");
    if (eq > 0) {
      const name = t.slice(0, eq).trim();
      if (/^[a-z][a-zA-Z0-9_]*$/.test(name)) names.push(name);
    }
  }
  return names;
}

function makeBindingHelpers(bridge) {
  function bindingNamesForCell(cell, allCells, getSource) {
    const cells = allCells.map((c) => ({ id: c.id, kind: c.kind, source: c.source }));
    if (bridge?.bindingNamesInCell) {
      return bridge.bindingNamesInCell(cell.id, cells, getSource());
    }
    return bindingNames(cell.source);
  }

  function isDefinitionOnlyCell(cell, allCells, getSource) {
    return bindingNamesForCell(cell, allCells, getSource).length === 0;
  }

  return { bindingNamesForCell, isDefinitionOnlyCell };
}

let cellMonaco = null;

async function colorize(code, bridge) {
  return colorizeImpl(code)(bridge)();
}

function getMonacoEditor(bridge) {
  return bridge?.monaco?.editor ?? null;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function defaultCellUi() {
  return {
    folded: false,
    codeFolded: false,
    outputFolded: false,
    // Jupyter model: output renders LOCALLY under the cell by default. A cell can
    // opt in to GLOBAL output (the shared right-side Output panel) with the
    // cell ⋯ menu (output routing is editor UI only, not source directives).
    outputTarget: "inline",
    editorHeight: 160,
    outputHeight: 180,
  };
}

function ensureUi(cell) {
  if (!cell.ui) cell.ui = defaultCellUi();
  return cell.ui;
}

// Stable signature of the seed source. Persisted with the document so a changed
// default program re-seeds instead of being permanently shadowed by an old save.
function seedSignature(src) {
  let h = 5381;
  const s = String(src || "");
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `${s.length}:${h >>> 0}`;
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

function scanCellBindingNames(source) {
  const names = [];
  for (const line of String(source ?? "").split("\n")) {
    if (line.startsWith(" ") || line.startsWith("\t")) continue;
    const t = line.trim();
    if (!t || t.startsWith("--")) continue;
    if (t.startsWith("let ")) continue;
    const eq = t.indexOf(" =");
    if (eq <= 0) continue;
    const name = t.slice(0, eq).trim();
    if (!/^[a-z][a-zA-Z0-9_]*$/.test(name)) continue;
    const rhs = t.slice(eq + 2).trim();
    if (rhs === name || rhs.startsWith(`${name},`) || rhs.startsWith(`${name} }`)) continue;
    names.push(name);
  }
  return names;
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
          maximizedCellId: null,
          running: new Set(),
          runControllers: {},
          executionCounts: {},
          executionSeq: 0,
          clipboardCell: null,
        };

        let seq = 0;
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
            seedSig: seedSignature(trimmed),
            cells: cellsFromSources(sources),
          };
        }

        function initFromSeed(initial) {
          const seeded = parseInitialSeed(initial);
          state.seedSig = seeded.seedSig;
          const saved = bridge.loadDocument?.();
          if (saved?.cells?.length && saved.seedSig === seeded.seedSig && saved.cells.length === seeded.cells.length) {
            state.cells = saved.cells.map(mapLoadedCell);
          } else {
            state.cells = seeded.cells;
            persist(state, bridge);
          }
          publishSource();
        }

        initFromSeed(initialSource || "");

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
          const chk = bridge.compile?.(src);
          if (chk && !chk.ok) {
            throw new Error(chk.error ?? "Compile failed");
          }
          const prefixNames = [];
          for (let i = 0; i <= cellIdx; i++) {
            const c = state.cells[i];
            if (c.kind === "code") prefixNames.push(...bindingNamesForRun(c));
          }
          const names = [...new Set(prefixNames.length ? prefixNames : cellNames)];
          if (names.length === 0) return [];
          return await Promise.resolve(
            bridge.evalCells?.(src, names, { signal, cellId: cell.id, cellIndex: cellIdx }) ?? [],
          );
        }

        function concatenate() {
          return state.cells
            .filter((c) => c.kind === "code")
            .map((c) => c.source.trim())
            .filter(Boolean)
            .join("\n\n");
        }

        function concatenateDocument() {
          const parts = [];
          for (const c of state.cells) {
            if (c.kind === "wysiwyg") {
              const md = (c.source ?? "").trim();
              if (!md) continue;
              parts.push(md.split("\n").map((line) => `-- ${line}`).join("\n"));
            } else {
              const s = (c.source ?? "").trim();
              if (s) parts.push(s);
            }
          }
          return parts.join("\n\n");
        }

        function publishSource() {
          const src = concatenate();
          bridge.onProgramChanged?.(src);
          updateCellDiagnostics();
          persist(state, bridge);
        }

        function updateCellDiagnostics() {
          const src = concatenate();
          const cells = state.cells.map((c) => ({ id: c.id, kind: c.kind, source: c.source }));
          state.cellDiags = bridge.cellDiagnostics?.(src, cells) ?? {};
        }

        const api = {
          notebookSource: () => concatenate(),
          notebookDocumentSource: () => concatenateDocument(),
          setSource: (src) => {
            state.cells = [{ id: newId(), kind: "code", source: src || "", ui: defaultCellUi() }];
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
            state.focusedId = id;
            void render().then(() => {
              stack
                .querySelector(`[data-cell-id="${id}"]`)
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            });
          },
        };

        const root = document.createElement("div");
        root.className = "flex h-full min-h-0 flex-col bg-[#0b0f1a]";
        root.dataset.notebookRoot = "1";

        const toolbar = document.createElement("div");
        toolbar.className =
          "notebook-toolbar flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-950 px-3 py-2";

        const mkBtn = (label, extra, title) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className =
            "rounded border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-300 hover:border-indigo-400/50 hover:text-white " +
            (extra ?? "");
          b.textContent = label;
          if (title) b.title = title;
          return b;
        };

        const saveVnbBtn = mkBtn("Save", "border-slate-600", "Save notebook as .vnb");
        const addCodeBtn = mkBtn("+ Code", "", "Insert a code cell");
        const addTextBtn = mkBtn("+ Text", "", "Insert a text cell");
        const cutBtn = mkBtn("Cut", "", "Cut selected cell");
        const copyBtn = mkBtn("Copy", "", "Copy selected cell");
        const pasteBtn = mkBtn("Paste", "", "Paste copied cell below selected cell");
        const runBtn = mkBtn("Run", "border-emerald-500/40 text-emerald-200", "Run selected cell");
        const stopBtn = mkBtn("Stop", "border-rose-500/40 text-rose-200", "Stop selected cell");
        const runAllBtn = mkBtn("Run all", "border-emerald-500/40 text-emerald-200", "Run every code cell once");
        const sourceBtn = mkBtn("Source", "", "Open the concatenated Verdict source");
        const openVerdictBtn = mkBtn("Open", "", "Open .verdict or .vnb");
        const resetBtn = mkBtn("Reset", "border-rose-500/40 text-rose-200", "Reset to default example");

        // Re-seed from the default program, discarding any saved notebook. Escapes
        // stale `.vnb` state from older layouts.
        resetBtn.onclick = () => {
          if (!confirm("Reset the notebook to the default example? This discards your current cells.")) return;
          state.cells = defaultSeed.cells.map((c) => ({
            ...c,
            id: newId(),
            ui: { ...defaultCellUi(), ...c.ui },
          }));
          state.seedSig = defaultSeed.seedSig;
          state.focusedId = state.cells[0] ? state.cells[0].id : null;
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
                state.cells = doc.cells.map(mapLoadedCell);
                publishSource();
                render();
                return;
              }
            } catch {
              /* fall through as plain source */
            }
          }
          state.cells = [{ id: newId(), kind: "code", source: text, ui: defaultCellUi() }];
          state.focusedId = state.cells[0].id;
          publishSource();
          render();
        };

        toolbar.appendChild(saveVnbBtn);
        toolbar.appendChild(addCodeBtn);
        toolbar.appendChild(addTextBtn);
        toolbar.appendChild(cutBtn);
        toolbar.appendChild(copyBtn);
        toolbar.appendChild(pasteBtn);
        toolbar.appendChild(runBtn);
        toolbar.appendChild(stopBtn);
        toolbar.appendChild(runAllBtn);
        toolbar.appendChild(sourceBtn);
        toolbar.appendChild(openVerdictBtn);
        toolbar.appendChild(resetBtn);
        toolbar.appendChild(fileInput);

        openVerdictBtn.onclick = () => fileInput.click();
        saveVnbBtn.onclick = () => downloadVnb();
        sourceBtn.onclick = () => bridge.setSourceMode?.(true);

        const bodyWrap = document.createElement("div");
        bodyWrap.className = "flex min-h-0 flex-1 flex-row";

        const stack = document.createElement("div");
        stack.className = "notebook-stack-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-3 flex flex-col gap-3";
        stack.dataset.notebookStack = "1";

        // Cell navigation now lives in the editor's right-side panel (merged with
        // output + run). This inline rail is kept hidden for backward compatibility.
        const nav = document.createElement("div");
        nav.className = "notebook-nav hidden";
        nav.dataset.notebookNav = "1";

        bodyWrap.appendChild(stack);
        bodyWrap.appendChild(nav);

        function getBridgeSource() {
          return bridge.materialize?.(concatenate()) ?? concatenate();
        }

        function bindingNamesForRun(cell) {
          const fromBridge = bindingNamesForCell(cell, state.cells, concatenate);
          if (fromBridge.length > 0) return fromBridge;
          return scanCellBindingNames(cell.source);
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
          const controller = new AbortController();
          state.runControllers[cell.id] = controller;
          state.running.add(cell.id);
          const ui = ensureUi(cell);
          ui.outputFolded = false;
          await render();
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
            await render();
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

        async function buildNav() {
          nav.innerHTML = "";
          const title = document.createElement("div");
          title.className = "px-1 pb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500";
          title.textContent = `Cells · ${state.cells.length}`;
          nav.appendChild(title);
          for (let i = 0; i < state.cells.length; i++) {
            const cell = state.cells[i];
            const active = state.focusedId === cell.id;
            const card = document.createElement("button");
            card.type = "button";
            card.dataset.navCell = cell.id;
            card.className =
              "notebook-nav-card flex flex-col gap-0.5 rounded border px-2 py-1.5 text-left transition-colors " +
              (active
                ? "border-indigo-400/60 bg-indigo-500/10"
                : "border-slate-800 bg-slate-900/60 hover:border-slate-600");
            const head = document.createElement("div");
            head.className = "flex items-center justify-between text-[10px] text-slate-500";
            const label = document.createElement("span");
            label.textContent = `${i + 1} · ${cell.kind === "wysiwyg" ? "Text" : "Code"}`;
            head.appendChild(label);
            if (state.running.has(cell.id)) {
              const r = document.createElement("span");
              r.className = "text-rose-300";
              r.textContent = "● run";
              head.appendChild(r);
            } else if (cellHasOutput(cell)) {
              const d = document.createElement("span");
              d.className = "text-emerald-400/80";
              d.textContent = "●";
              head.appendChild(d);
            }
            const prev = document.createElement("div");
            prev.className = "truncate font-mono text-[11px] text-slate-300";
            prev.textContent = await getCellPreviewLine(cell);
            card.appendChild(head);
            card.appendChild(prev);
            card.onclick = async () => {
              state.focusedId = cell.id;
              await render();
              stack
                .querySelector(`[data-cell-id="${cell.id}"]`)
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            };
            nav.appendChild(card);
          }
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
          state.cells.splice(idx + 1, 0, cell);
          if (cell.kind === "code") state.focusedId = cell.id;
          publishSource();
          render();
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
          for (const k of Object.keys(state.outputs)) {
            if (k.startsWith(`${cell.id}:`)) delete state.outputs[k];
          }
          delete state.errors[cell.id];
          state.cells.splice(idx, 1);
          if (state.focusedId === cell.id) state.focusedId = null;
          if (state.maximizedCellId === cell.id) state.maximizedCellId = null;
          if (state.cells.length === 0) {
            state.cells.push({ id: newId(), kind: "code", source: "", ui: defaultCellUi() });
          }
          publishSource();
          render();
        }

        function moveCellBy(idx, delta) {
          const j = Math.max(0, Math.min(state.cells.length - 1, idx + delta));
          if (j === idx) return;
          const [cell] = state.cells.splice(idx, 1);
          state.cells.splice(j, 0, cell);
          publishSource();
          render();
        }

        function destroyCellMonaco() {
          if (cellMonaco) {
            disposeEditorImpl(cellMonaco)();
            cellMonaco = null;
          }
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
            const local = ui.outputTarget !== "global";
            const names = bindingNamesForRun(cell);
            const allOutputs = names
              .map((n) => state.outputs[`${cell.id}:${n}`])
              .filter(Boolean);
            sections.push({
              cellIndex: i,
              cellId: cell.id,
              kind: cell.kind === "wysiwyg" ? "text" : "code",
              preview: await getCellPreviewLine(cell),
              running: state.running.has(cell.id),
              focused: state.focusedId === cell.id,
              hasOutput: allOutputs.length > 0 || Boolean(state.errors[cell.id]),
              // Inline cells render output in the body; the panel only shows their
              // nav + run controls (no duplicated output).
              local,
              outputs: local ? [] : allOutputs,
              error: local ? undefined : state.errors[cell.id] || undefined,
            });
          }
          await Promise.resolve(bridge.syncGlobalOutput?.(sections));
        }

        async function getCellPreviewLine(cell) {
          if (cell.kind === "wysiwyg") {
            const line = (cell.source || "Text cell").split("\n")[0].trim();
            return line || "Text cell";
          }
          const line = (cell.source || "").split("\n").find((l) => l.trim() && !l.trim().startsWith("--"));
          return (line ?? cell.source ?? "").trim() || "Empty code cell";
        }

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
            state.maximizedCellId = isMax ? null : cell.id;
            if (isMax) state.focusedId = cell.id;
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
            ui.folded = !ui.folded;
            if (!ui.folded && cell.kind === "code") state.focusedId = cell.id;
            render();
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
              ui.codeFolded = !ui.codeFolded;
              render();
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
              ui.outputFolded = !ui.outputFolded;
              render();
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
          body.className = "flex min-w-0 flex-1 flex-col min-h-0";

          const previewRow = document.createElement("div");
          previewRow.className = "notebook-cell-folded-head flex min-h-[2rem] min-w-0 items-center px-2 py-1";
          const preview = document.createElement("div");
          preview.className =
            "min-w-0 flex-1 truncate font-mono text-xs text-slate-400 cursor-pointer hover:text-slate-200";
          preview.title = "Click to expand cell";
          preview.textContent = await getCellPreviewLine(cell);
          preview.onclick = () => {
            ui.folded = false;
            if (cell.kind === "code") state.focusedId = cell.id;
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
          body.className = "flex min-w-0 flex-1 flex-col min-h-0";

          const cellHead = document.createElement("div");
          cellHead.className =
            "flex min-h-[2rem] items-center justify-between border-b border-slate-800/70 px-3 py-1";
          const cellTitle = document.createElement("button");
          cellTitle.type = "button";
          cellTitle.className = "min-w-0 truncate text-left font-mono text-[11px] text-slate-400 hover:text-slate-200";
          cellTitle.textContent = await getCellPreviewLine(cell);
          cellTitle.onclick = () => {
            state.focusedId = cell.id;
            render();
          };
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
              ui.codeFolded = false;
              render();
            };
            body.appendChild(bar);
          } else {
          const editorSection = document.createElement("div");
          editorSection.className = "notebook-cell-editor-section relative flex flex-col min-h-0";

          // Jupyter-style: the editor sizes to its content (no fixed-height box),
          // growing with line count up to a cap, then scrolling.
          const lineCount = Math.max((cell.source || "").split("\n").length, 1);
          const lineH = 19;
          const maxEditorH = isMax ? 900 : 560;
          const contentEditorH = Math.min(Math.max(lineCount * lineH + 20, 48), maxEditorH);

          const editorHost = document.createElement("div");
          editorHost.className = "notebook-cell-editor font-mono text-xs";
          editorHost.style.height = `${contentEditorH}px`;

          const monacoEditor = getMonacoEditor(bridge);

          if (cell.kind === "wysiwyg") {
            editorHost.style.height = "auto";
            mountWysiwyg(editorHost, cell.source, (md) => {
              cell.source = md;
              persist(state, bridge);
            });
          } else if (state.focusedId === cell.id && !bridge.isSourceMode?.() && monacoEditor?.create) {
            destroyCellMonaco();
            cellMonaco = createEditorImpl(editorHost)(cell.source)(bridge)();
            // Grow/shrink the editor to fit its content as the user types.
            const fitMonaco = () => {
              if (!cellMonaco?.getContentHeight) return;
              const h = Math.min(Math.max(cellMonaco.getContentHeight(), 48), maxEditorH);
              editorHost.style.height = `${h}px`;
              cellMonaco.layout?.();
            };
            if (cellMonaco?.onDidChangeModelContent) {
              cellMonaco.onDidChangeModelContent(() => {
                cell.source = cellMonaco.getValue();
                fitMonaco();
                publishSource();
              });
            }
            if (cellMonaco?.onDidContentSizeChange) cellMonaco.onDidContentSizeChange(fitMonaco);
            cellMonaco?.layout?.();
            fitMonaco();
            cellMonaco?.focus?.();
          } else if (cell.kind === "code") {
            editorHost.style.height = "auto";
            editorHost.style.maxHeight = isMax ? "none" : `${maxEditorH}px`;
            editorHost.style.overflowY = "auto";
            const pre = document.createElement("div");
            pre.className = "cursor-text px-3 py-2 text-slate-200";
            pre.dataset.staticCode = "1";
            pre.onclick = () => {
              state.focusedId = cell.id;
              render();
            };
            pre.innerHTML = await colorize(cell.source || "", bridge);
            editorHost.appendChild(pre);
          }

          editorSection.appendChild(editorHost);

          // No manual editor resize handle — the editor auto-fits its content.

          body.appendChild(editorSection);
          }

          const diagHost = document.createElement("div");
          diagHost.className = "px-3 py-1";
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
            outHost.style.maxHeight = isMax ? "none" : "600px";
            await fillOutputHost(outHost, cell, idx);
            body.appendChild(outHost);
          }

          row.appendChild(gutter);
          row.appendChild(body);
          wrap.appendChild(row);
          return wrap;
        }

        async function render() {
          const sourceMode = bridge.isSourceMode?.();
          bodyWrap.classList.toggle("hidden", !!sourceMode);
          if (sourceMode) {
            destroyCellMonaco();
            return;
          }

          const maximized = state.maximizedCellId;
          toolbar.classList.toggle("hidden", !!maximized);

          destroyCellMonaco();
          stack.innerHTML = "";
          stack.classList.toggle("notebook-stack--maximized", !!maximized);
          updateCellDiagnostics();

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

          await publishPanel();
        }

        addCodeBtn.onclick = () => {
          state.cells.push({ id: newId(), kind: "code", source: "", ui: defaultCellUi() });
          state.focusedId = state.cells[state.cells.length - 1].id;
          publishSource();
          render();
        };

        addTextBtn.onclick = () => {
          state.cells.push({ id: newId(), kind: "wysiwyg", source: "", ui: defaultCellUi() });
          persist(state, bridge);
          render();
        };

        cutBtn.onclick = () => {
          const idx = selectedIndex();
          const cell = state.cells[idx];
          if (!cell) return;
          state.clipboardCell = cloneCellForPaste(cell);
          deleteCellAt(idx);
        };

        copyBtn.onclick = () => {
          const cell = state.cells[selectedIndex()];
          if (!cell) return;
          state.clipboardCell = cloneCellForPaste(cell);
        };

        pasteBtn.onclick = () => {
          if (!state.clipboardCell) return;
          const idx = selectedIndex();
          const pasted = cloneCellForPaste(state.clipboardCell);
          state.cells.splice(idx + 1, 0, pasted);
          state.focusedId = pasted.id;
          publishSource();
          render();
        };

        runBtn.onclick = () => {
          const idx = selectedIndex();
          const cell = state.cells[idx];
          if (cell?.kind === "code") void runCell(cell, idx);
        };

        stopBtn.onclick = () => {
          const cell = state.cells[selectedIndex()];
          if (cell?.kind === "code") stopCell(cell);
        };

        runAllBtn.onclick = () => runAll();

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
                state.focusedId = state.cells[nextIdx + 1].id;
                render();
              }
            });
          } else if (e.key === "Escape" && state.maximizedCellId) {
            state.maximizedCellId = null;
            render();
          }
        };

        render();
        return api;
      };
    };
  };
}

export function concatenateCodeImpl(cells) {
  return cells
    .filter((c) => c.kind === "code")
    .map((c) => (c.source ?? "").trim())
    .filter(Boolean)
    .join("\n\n");
}

export { decodeDisplay, renderDisplayInto } from "./Display.js";
export { rowsToCsv, csvEscape } from "./SpreadsheetTable.js";
