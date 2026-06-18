"use strict";

import { mountWysiwyg } from "./WysiwygFFI.js";
import { decodeDisplay, renderDisplayInto } from "./Display.js";

function getMonacoEditor(bridge) {
  return bridge?.monaco?.editor ?? null;
}

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

function isDefinitionOnly(source) {
  return bindingNames(source).length === 0;
}

let liveMonaco = null;

async function colorize(code, bridge) {
  const monacoEditor = getMonacoEditor(bridge);
  if (monacoEditor?.colorize) return monacoEditor.colorize(code, "verdict", { theme: "verdict-dark" });
  return escapeHtml(code);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function persist(state, bridge) {
  bridge.saveDocument?.({ cells: state.cells.map((c) => ({ id: c.id, kind: c.kind, source: c.source })) });
}

export function mountNotebookImpl(selector) {
  return function (bridge) {
    return function (initialSource) {
      return function () {
        const host = document.querySelector(selector);
        if (!host || !bridge) return null;

        const state = {
          cells: [],
          outputs: {},
          focusedId: null,
          errors: {},
          cellDiags: {},
        };

        let seq = 0;
        const newId = () => `cell-${++seq}-${Math.random().toString(36).slice(2, 6)}`;

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

        function initFromSource(src) {
          const saved = bridge.loadDocument?.();
          if (saved?.cells?.length) {
            state.cells = saved.cells.map((c) => ({
              id: c.id || newId(),
              kind: c.kind === "wysiwyg" ? "wysiwyg" : "code",
              source: c.source ?? "",
            }));
          } else {
            state.cells = [{ id: newId(), kind: "code", source: src || "" }];
          }
          publishSource();
        }

        initFromSource(initialSource || "");

        const api = {
          notebookSource: () => concatenate(),
          notebookDocumentSource: () => concatenateDocument(),
          setSource: (src) => {
            state.cells = [{ id: newId(), kind: "code", source: src || "" }];
            publishSource();
            render();
          },
          getViewMode: () => (bridge.isSourceMode?.() ? "source" : "notebook"),
        };

        const root = document.createElement("div");
        root.className = "flex h-full min-h-0 flex-col bg-[#0b0f1a]";
        root.dataset.notebookRoot = "1";

        const toolbar = document.createElement("div");
        toolbar.className = "flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-950 px-3 py-2";

        const mkBtn = (label, extra) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className =
            "rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-300 hover:border-indigo-400/50 hover:text-white " +
            (extra ?? "");
          b.textContent = label;
          return b;
        };

        const toggleBtn = mkBtn("Notebook ⇄ Source", "border-indigo-500/40 text-indigo-200");
        const addCodeBtn = mkBtn("+ Code", "");
        const addTextBtn = mkBtn("+ Text", "");
        const runAllBtn = mkBtn("Run all", "border-emerald-500/40 text-emerald-200");
        const openVerdictBtn = mkBtn("Open .verdict", "");
        const saveVnbBtn = mkBtn("Save .vnb", "border-slate-600");

        function downloadVnb() {
          const doc = { cells: state.cells.map((c) => ({ id: c.id, kind: c.kind, source: c.source })) };
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
                state.cells = doc.cells.map((c) => ({
                  id: c.id || newId(),
                  kind: c.kind === "wysiwyg" ? "wysiwyg" : "code",
                  source: c.source ?? "",
                }));
                publishSource();
                render();
                return;
              }
            } catch {
              /* fall through as plain source */
            }
          }
          state.cells = [{ id: newId(), kind: "code", source: text }];
          state.focusedId = state.cells[0].id;
          publishSource();
          render();
        };

        toolbar.appendChild(addCodeBtn);
        toolbar.appendChild(addTextBtn);
        toolbar.appendChild(runAllBtn);
        toolbar.appendChild(openVerdictBtn);
        toolbar.appendChild(saveVnbBtn);
        toolbar.appendChild(toggleBtn);
        toolbar.appendChild(fileInput);

        openVerdictBtn.onclick = () => fileInput.click();
        saveVnbBtn.onclick = () => downloadVnb();

        const stack = document.createElement("div");
        stack.className = "flex-1 min-h-0 overflow-auto px-3 py-3 flex flex-col gap-3";
        stack.dataset.notebookStack = "1";

        function getBridgeSource() {
          return bridge.materialize?.(concatenate()) ?? concatenate();
        }

        async function runCell(cell, cellIdx) {
          if (cell.kind !== "code" || isDefinitionOnly(cell.source)) return;
          const cellNames = bindingNames(cell.source);
          const prefixNames = [];
          for (let i = 0; i <= cellIdx; i++) {
            const c = state.cells[i];
            if (c.kind === "code") prefixNames.push(...bindingNames(c.source));
          }
          const names = prefixNames.length ? prefixNames : cellNames;
          const src = getBridgeSource();
          const chk = bridge.compile?.(src);
          if (chk && !chk.ok) {
            state.errors[cell.id] = chk.error ?? "Compile failed";
            render();
            return;
          }
          const outs = await Promise.resolve(bridge.evalCells?.(src, names) ?? []);
          for (const o of outs) {
            if (!cellNames.includes(o.name)) continue;
            state.outputs[`${cell.id}:${o.name}`] = o;
            state.errors[cell.id] = o.ok ? "" : o.error || "";
          }
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

        function destroyLiveMonaco() {
          if (liveMonaco) {
            liveMonaco.dispose();
            liveMonaco = null;
          }
        }

        async function renderCell(cell, idx) {
          const wrap = document.createElement("div");
          wrap.className = "rounded-lg border border-slate-800 bg-slate-950/60 overflow-hidden";
          wrap.dataset.cellId = cell.id;

          const row = document.createElement("div");
          row.className = "flex min-h-0";

          const gutter = document.createElement("div");
          gutter.className = "flex w-12 shrink-0 flex-col items-center gap-2 border-r border-slate-800 bg-slate-950 py-3";
          const num = document.createElement("span");
          num.className = "text-[10px] font-mono text-slate-500";
          num.textContent = String(idx + 1);
          gutter.appendChild(num);

          if (cell.kind === "code" && !isDefinitionOnly(cell.source)) {
            const runBtn = document.createElement("button");
            runBtn.type = "button";
            runBtn.className =
              "rounded-full border border-emerald-500/40 bg-emerald-500/15 p-1 text-emerald-300 hover:bg-emerald-500/30";
            runBtn.title = "Run cell";
            runBtn.dataset.runCell = "1";
            runBtn.innerHTML = "▶";
            runBtn.onclick = () => runCell(cell, idx);
            gutter.appendChild(runBtn);

            if (idx > 0) {
              const aboveBtn = document.createElement("button");
              aboveBtn.type = "button";
              aboveBtn.className =
                "rounded border border-slate-700 px-1 py-0.5 text-[8px] font-bold uppercase text-slate-400 hover:text-white";
              aboveBtn.title = "Run above";
              aboveBtn.dataset.runAbove = "1";
              aboveBtn.textContent = "↑";
              aboveBtn.onclick = () => runAbove(idx);
              gutter.appendChild(aboveBtn);
            }
          }

          const body = document.createElement("div");
          body.className = "flex min-w-0 flex-1 flex-col";

          const editorHost = document.createElement("div");
          editorHost.className = "min-h-[72px] font-mono text-xs";

          const monacoEditor = getMonacoEditor(bridge);

          if (cell.kind === "wysiwyg") {
            mountWysiwyg(editorHost, cell.source, (md) => {
              cell.source = md;
              persist(state, bridge);
            });
          } else if (state.focusedId === cell.id && !bridge.isSourceMode?.() && monacoEditor?.create) {
            destroyLiveMonaco();
            editorHost.className = "min-h-[120px] h-[180px]";
            liveMonaco = monacoEditor.create(editorHost, {
              value: cell.source,
              language: "verdict",
              theme: "verdict-dark",
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
            });
            liveMonaco.onDidChangeModelContent(() => {
              cell.source = liveMonaco.getValue();
              publishSource();
            });
            liveMonaco.focus();
          } else if (cell.kind === "code") {
            const pre = document.createElement("div");
            pre.className = "cursor-text overflow-auto px-3 py-2 text-slate-200";
            pre.dataset.staticCode = "1";
            pre.onclick = () => {
              state.focusedId = cell.id;
              render();
            };
            pre.innerHTML = await colorize(cell.source || "", bridge);
            editorHost.appendChild(pre);
          }

          body.appendChild(editorHost);

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
          outHost.className = "border-t border-slate-800 px-3 py-2 notebook-output";
          outHost.dataset.cellOutput = cell.id;
          for (const n of bindingNames(cell.source)) {
            const key = `${cell.id}:${n}`;
            if (state.outputs[key]) {
              const o = state.outputs[key];
              const block = document.createElement("div");
              block.className = "mb-2";
              if (!o.ok) {
                block.innerHTML = `<div class="text-xs text-rose-400">${escapeHtml(o.error ?? "Error")}</div>`;
              } else {
                await renderDisplayInto(block, o.display ?? o.json, bridge);
              }
              outHost.appendChild(block);
            }
          }
          if (state.errors[cell.id]) {
            const err = document.createElement("div");
            err.className = "text-xs text-rose-400";
            err.textContent = state.errors[cell.id];
            outHost.appendChild(err);
          }
          body.appendChild(outHost);

          row.appendChild(gutter);
          row.appendChild(body);
          wrap.appendChild(row);
          return wrap;
        }

        async function render() {
          if (bridge.isSourceMode?.()) {
            stack.classList.add("hidden");
            return;
          }
          stack.classList.remove("hidden");
          destroyLiveMonaco();
          stack.innerHTML = "";
          updateCellDiagnostics();
          for (let i = 0; i < state.cells.length; i++) {
            stack.appendChild(await renderCell(state.cells[i], i));
          }
        }

        addCodeBtn.onclick = () => {
          state.cells.push({ id: newId(), kind: "code", source: "" });
          state.focusedId = state.cells[state.cells.length - 1].id;
          publishSource();
          render();
        };

        addTextBtn.onclick = () => {
          state.cells.push({ id: newId(), kind: "wysiwyg", source: "" });
          persist(state, bridge);
          render();
        };

        runAllBtn.onclick = () => runAll();

        toggleBtn.onclick = () => {
          const on = !bridge.isSourceMode?.();
          bridge.setSourceMode?.(on);
          if (!on) {
            publishSource();
          }
          render();
        };

        root.appendChild(toolbar);
        root.appendChild(stack);
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
              const idx = state.cells.indexOf(focused);
              if (idx >= 0 && idx < state.cells.length - 1) {
                state.focusedId = state.cells[idx + 1].id;
                render();
              }
            });
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
