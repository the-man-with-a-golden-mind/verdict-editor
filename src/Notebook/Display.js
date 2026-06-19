"use strict";

import { renderChartImpl } from "./PlotlyFFI.js";
import { renderSpreadsheetTable } from "./Spreadsheet.js";

function markdownToHtml(md) {
  return String(md ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-slate-200 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold text-slate-100 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold text-white mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

export function decodeDisplayKindImpl(raw) {
  const d = decodeDisplay(raw);
  if (!d?.kind) return "unknown";
  return d.kind;
}

export function decodeDisplay(raw) {
  if (raw == null) return null;
  let d = raw;
  if (typeof raw === "string") {
    try {
      d = JSON.parse(raw);
    } catch {
      return { kind: "text", text: raw };
    }
  }
  if (typeof d !== "object") return { kind: "text", text: String(d) };
  if (d.kind) return d;
  if (d.display) return decodeDisplay(d.display);
  return { kind: "text", text: JSON.stringify(d) };
}

async function renderChart(host, spec, bridge) {
  host.innerHTML = "";
  await renderChartImpl(host)(spec)(bridge)();
}

async function renderLayout(host, d, bridge, layoutKind) {
  const layouts = {
    stack: { className: "flex flex-col gap-6 notebook-stack", dataset: "displayStack" },
    col: { className: "flex flex-col gap-6 notebook-display-col", dataset: "displayCol" },
    row: { className: "flex flex-row flex-wrap gap-5 notebook-display-row", dataset: "displayRow" },
  };
  const cfg = layouts[layoutKind];
  const layoutEl = document.createElement("div");
  layoutEl.className = cfg.className;
  layoutEl.dataset[cfg.dataset] = "1";
  if (d.title) {
    const heading = document.createElement("div");
    heading.className = "text-sm font-semibold text-slate-100 notebook-display-heading";
    heading.textContent = d.title;
    layoutEl.appendChild(heading);
  }
  for (const item of d.items ?? []) {
    const child = document.createElement("div");
    child.className =
      layoutKind === "row" ? "notebook-display-row__item min-w-[min(100%,380px)] flex-1" : "";
    layoutEl.appendChild(child);
    await renderDisplayInto(child, item, bridge);
  }
  host.appendChild(layoutEl);
}

export async function renderDisplayInto(host, raw, bridge) {
  host.innerHTML = "";
  const d = decodeDisplay(raw);
  if (!d) {
    host.innerHTML = '<div class="text-slate-500 italic text-xs">No output</div>';
    return;
  }
  if (d.kind === "text") {
    const el = document.createElement("div");
    el.className = "prose-invert text-sm text-slate-200 leading-relaxed notebook-text-output";
    el.innerHTML = markdownToHtml(d.text ?? "");
    host.appendChild(el);
    return;
  }
  if (d.kind === "chart") {
    const inRow = host.closest?.("[data-display-row]");
    const chartHost = document.createElement("div");
    chartHost.className = inRow ? "min-h-[300px] w-full notebook-chart--row" : "min-h-[320px] w-full";
    chartHost.dataset.plotlyChart = "1";
    if (inRow) chartHost.dataset.plotlyCompact = "1";
    host.appendChild(chartHost);
    await renderChart(chartHost, d, bridge);
    return;
  }
  if (d.kind === "table") {
    renderSpreadsheetTable(host, d.rows ?? []);
    return;
  }
  if (d.kind === "stack" || d.kind === "col" || d.kind === "row") {
    await renderLayout(host, d, bridge, d.kind);
  }
}

export function renderDisplayIntoImpl(host) {
  return function (raw) {
    return function (bridge) {
      return function () {
        if (!host || typeof host.appendChild !== "function") return;
        return renderDisplayInto(host, raw, bridge);
      };
    };
  };
}

export { decodeDisplay as decodeDisplayExport };
