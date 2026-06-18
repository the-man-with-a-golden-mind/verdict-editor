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

let liveMonaco = null;

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
    outputFolded: false,
    outputTarget: "inline",
    editorHeight: 160,
    outputHeight: 180,
  };
}

function ensureUi(cell) {
  if (!cell.ui) cell.ui = defaultCellUi();
  return cell.ui;
}

function persist(state, bridge) {
  bridge.saveDocument?.({
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
        };

        let seq = 0;
        const newId = () => `cell-${++seq}-${Math.random().toString(36).slice(2, 6)}`;

        function mapLoadedCell(c) {
          return {
            id: c.id || newId(),
            kind: c.kind === "wysiwyg" ? "wysiwyg" : "code",
            source: c.source ?? "",
            ui: c.ui ? { ...defaultCellUi(), ...c.ui } : defaultCellUi(),
          };
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

        // A `-- %% ... %%` comment line marks a cell boundary in seed source, so a
        // single default program can seed as several cells. It is a valid Verdict
        // comment, so Source mode still compiles the whole thing.
        function splitSeedCells(src) {
          const parts = String(src || "")
            .split(/\n--\s*%%[^\n]*%%[^\n]*\n/)
            .map((s) => s.trim())
            .filter(Boolean);
          const sources = parts.length ? parts : [src || ""];
          return sources.map((s) => ({ id: newId(), kind: "code", source: s, ui: defaultCellUi() }));
        }

        function initFromSource(src) {
          const saved = bridge.loadDocument?.();
          if (saved?.cells?.length) {
            state.cells = saved.cells.map(mapLoadedCell);
          } else {
            state.cells = splitSeedCells(src);
          }
          publishSource();
        }

        initFromSource(initialSource || "");

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
        };

        const root = document.createElement("div");
        root.className = "flex h-full min-h-0 flex-col bg-[#0b0f1a]";
        root.dataset.notebookRoot = "1";

        const toolbar = document.createElement("div");
        toolbar.className =
          "notebook-toolbar flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-950 px-3 py-2";

        const mkBtn = (label, extra) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className =
            "rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-300 hover:border-indigo-400/50 hover:text-white " +
            (extra ?? "");
          b.textContent = label;
          return b;
        };

        const addCodeBtn = mkBtn("+ Code", "");
        const addTextBtn = mkBtn("+ Text", "");
        const runAllBtn = mkBtn("Run all", "border-emerald-500/40 text-emerald-200");
        const openVerdictBtn = mkBtn("Open .verdict", "");
        const saveVnbBtn = mkBtn("Save .vnb", "border-slate-600");

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

        toolbar.appendChild(addCodeBtn);
        toolbar.appendChild(addTextBtn);
        toolbar.appendChild(runAllBtn);
        toolbar.appendChild(openVerdictBtn);
        toolbar.appendChild(saveVnbBtn);
        toolbar.appendChild(fileInput);

        openVerdictBtn.onclick = () => fileInput.click();
        saveVnbBtn.onclick = () => downloadVnb();

        const bodyWrap = document.createElement("div");
        bodyWrap.className = "flex min-h-0 flex-1 flex-row";

        const stack = document.createElement("div");
        stack.className = "notebook-stack-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-3 flex flex-col gap-3";
        stack.dataset.notebookStack = "1";

        // Right-side cell navigator (PowerPoint-style page strip).
        const nav = document.createElement("div");
        nav.className = "notebook-nav hidden w-44 shrink-0 flex-col gap-1.5 overflow-y-auto border-l border-slate-800 bg-slate-950/70 p-2 lg:flex";
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
          await render(); // reflect running state (Run → Stop)
          const cellNames = bindingNamesForRun(cell);
          const src = getBridgeSource();
          try {
            const chk = bridge.compile?.(src);
            if (chk && !chk.ok) {
              state.errors[cell.id] = chk.error ?? "Compile failed";
              return;
            }
            const prefixNames = [];
            for (let i = 0; i <= cellIdx; i++) {
              const c = state.cells[i];
              if (c.kind === "code") prefixNames.push(...bindingNamesForRun(c));
            }
            const names = [...new Set(prefixNames.length ? prefixNames : cellNames)];
            if (names.length === 0) {
              state.errors[cell.id] = "";
              return;
            }
            const outs = await Promise.resolve(bridge.evalCells?.(src, names, controller.signal) ?? []);
            if (controller.signal.aborted) return;
            let matchedCurrent = false;
            for (const o of outs) {
              for (let i = 0; i <= cellIdx; i++) {
                const c = state.cells[i];
                if (c.kind !== "code") continue;
                if (!bindingNamesForRun(c).includes(o.name)) continue;
                state.outputs[`${c.id}:${o.name}`] = o;
                state.errors[c.id] = o.ok ? "" : o.error || "";
                if (c.id === cell.id) matchedCurrent = true;
                break;
              }
            }
            if (cellNames.length > 0 && !matchedCurrent) {
              const errOut = outs.find((o) => cellNames.includes(o.name));
              if (errOut) {
                state.outputs[`${cell.id}:${errOut.name}`] = errOut;
                state.errors[cell.id] = errOut.error || "";
              } else {
                state.errors[cell.id] = "";
              }
            } else if (cellNames.length === 0) {
              state.errors[cell.id] = "";
            }
          } catch (e) {
            if (!controller.signal.aborted) state.errors[cell.id] = String(e);
          } finally {
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

        function destroyLiveMonaco() {
          if (liveMonaco) {
            disposeEditorImpl(liveMonaco)();
            liveMonaco = null;
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

        async function refreshGlobalOutputPanel() {
          const sections = [];
          for (let i = 0; i < state.cells.length; i++) {
            const cell = state.cells[i];
            const ui = ensureUi(cell);
            if (ui.outputTarget !== "global") continue;
            const names = bindingNamesForRun(cell);
            const outputs = names
              .map((n) => state.outputs[`${cell.id}:${n}`])
              .filter(Boolean);
            const hasOutputs = outputs.length > 0 || state.errors[cell.id];
            if (!hasOutputs) continue;
            sections.push({
              cellIndex: i,
              cellId: cell.id,
              outputs,
              error: state.errors[cell.id] || undefined,
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

          item(ui.folded ? "Expand cell" : "Fold cell", () => {
            ui.folded = !ui.folded;
            render();
          });
          if (isCodeCell && idx > 0) item("Run above", () => void runAbove(idx));
          item(ui.outputTarget === "inline" ? "Send output to panel" : "Show output inline", () => {
            ui.outputTarget = ui.outputTarget === "inline" ? "global" : "inline";
            render();
          });
          if (isCodeCell && ui.outputTarget === "inline" && !ui.folded)
            item(ui.outputFolded ? "Show output" : "Hide output", () => {
              ui.outputFolded = !ui.outputFolded;
              render();
            });
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
          num.className = "text-[10px] font-mono text-slate-500";
          num.textContent = String(idx + 1);
          gutter.appendChild(num);

          if (isCodeCell)
            gutter.appendChild(mkGutterRunBtn(cell, idx, runCell, stopCell, state.running.has(cell.id)));
          gutter.appendChild(buildCellMenu(cell, idx, ui, isCodeCell, isMax));
        }

        async function renderFoldedCell(wrap, cell, idx, ui, isCodeCell, isMax) {
          wrap.classList.add("notebook-cell--folded");

          const row = document.createElement("div");
          row.className = "flex min-h-0 items-start";

          const gutter = document.createElement("div");
          gutter.className =
            "notebook-cell-gutter notebook-cell-gutter--folded flex shrink-0 flex-row flex-wrap items-center content-start gap-1 self-start border-r border-slate-800 bg-slate-950 px-1.5 py-1 w-[4.5rem]";
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

          const hasOut = cellHasOutput(cell);
          if (ui.outputTarget === "global" && hasOut) {
            const hint = document.createElement("div");
            hint.className =
              "truncate border-t border-slate-800/60 px-2 py-1 text-[10px] italic text-slate-500";
            hint.textContent = "Output in Output panel ⇱";
            body.appendChild(hint);
          } else if (ui.outputTarget === "inline" && hasOut) {
            const outHost = document.createElement("div");
            outHost.className =
              "notebook-output notebook-output--folded border-t border-slate-800/80 px-2 py-1 overflow-auto max-h-32 text-xs";
            outHost.dataset.cellOutput = cell.id;
            await fillOutputHost(outHost, cell, idx);
            body.appendChild(outHost);
          }

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
          wrap.className = "notebook-cell rounded-lg border border-slate-800 bg-slate-950/60 overflow-hidden";
          wrap.dataset.cellId = cell.id;
          if (isMax) wrap.classList.add("notebook-cell--maximized");

          if (ui.folded && !isMax) {
            await renderFoldedCell(wrap, cell, idx, ui, isCodeCell, isMax);
            return wrap;
          }

          const row = document.createElement("div");
          row.className = "flex min-h-0";

          const gutter = document.createElement("div");
          gutter.className =
            "notebook-cell-gutter flex w-12 shrink-0 flex-col items-center gap-1.5 border-r border-slate-800 bg-slate-950 py-2";
          appendCellGutterControls(gutter, cell, idx, ui, isCodeCell, isMax);

          const body = document.createElement("div");
          body.className = "flex min-w-0 flex-1 flex-col min-h-0";

          const editorSection = document.createElement("div");
          editorSection.className = "notebook-cell-editor-section relative flex flex-col min-h-0";

          const editorHost = document.createElement("div");
          editorHost.className = "notebook-cell-editor font-mono text-xs overflow-hidden";
          editorHost.style.height = `${editorH}px`;
          editorHost.style.minHeight = "72px";

          const monacoEditor = getMonacoEditor(bridge);

          if (cell.kind === "wysiwyg") {
            mountWysiwyg(editorHost, cell.source, (md) => {
              cell.source = md;
              persist(state, bridge);
            });
          } else if (state.focusedId === cell.id && !bridge.isSourceMode?.() && monacoEditor?.create) {
            destroyLiveMonaco();
            liveMonaco = createEditorImpl(editorHost)(cell.source)(bridge)();
            if (liveMonaco?.onDidChangeModelContent) {
              liveMonaco.onDidChangeModelContent(() => {
                cell.source = liveMonaco.getValue();
                publishSource();
              });
            }
            liveMonaco?.layout?.();
            liveMonaco?.focus?.();
          } else if (cell.kind === "code") {
            const pre = document.createElement("div");
            pre.className = "cursor-text h-full overflow-auto px-3 py-2 text-slate-200";
            pre.dataset.staticCode = "1";
            pre.onclick = () => {
              state.focusedId = cell.id;
              render();
            };
            pre.innerHTML = await colorize(cell.source || "", bridge);
            editorHost.appendChild(pre);
          }

          editorSection.appendChild(editorHost);

          const editorResize = document.createElement("div");
          editorResize.className = "notebook-cell-editor-resizer";
          editorResize.title = "Drag to resize editor";
          editorSection.appendChild(editorResize);
          installVerticalResize(
            editorResize,
            () => ui.editorHeight,
            (h) => {
              ui.editorHeight = h;
              editorHost.style.height = `${h}px`;
              liveMonaco?.layout?.();
            },
            { min: 72, max: isMax ? 900 : 640 },
          );

          body.appendChild(editorSection);

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

          const outHost = document.createElement("div");
          outHost.className = "notebook-output border-t border-slate-800 px-3 py-2 overflow-auto";
          outHost.dataset.cellOutput = cell.id;

          if (ui.outputTarget === "global") {
            const hint = document.createElement("div");
            hint.className =
              "border-t border-slate-800/60 px-3 py-1.5 text-[10px] italic text-slate-600 notebook-output-routed-global";
            hint.textContent = "Output routed to Output panel on the right ⇱";
            body.appendChild(hint);
          } else {
            if (ui.outputFolded) {
              outHost.classList.add("hidden");
            } else {
              outHost.style.maxHeight = `${ui.outputHeight}px`;
              await fillOutputHost(outHost, cell, idx);
            }

            const outputSection = document.createElement("div");
            outputSection.className = "notebook-cell-output-section relative flex flex-col min-h-0";
            outputSection.appendChild(outHost);

            if (!ui.outputFolded) {
              const outputResize = document.createElement("div");
              outputResize.className = "notebook-cell-output-resizer";
              outputResize.title = "Drag to resize output";
              outputSection.appendChild(outputResize);
              installVerticalResize(
                outputResize,
                () => ui.outputHeight,
                (h) => {
                  ui.outputHeight = h;
                  outHost.style.maxHeight = `${h}px`;
                },
                { min: 48, max: 480 },
              );
            }

            body.appendChild(outputSection);
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
            destroyLiveMonaco();
            return;
          }

          const maximized = state.maximizedCellId;
          toolbar.classList.toggle("hidden", !!maximized);

          destroyLiveMonaco();
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

          await refreshGlobalOutputPanel();
          await buildNav();
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
