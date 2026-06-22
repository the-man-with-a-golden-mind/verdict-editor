"use strict";

import { renderChartImpl } from "./PlotlyFFI.js";
import { renderSpreadsheetTable } from "./Spreadsheet.js";

export function markdownToHtml(md) {
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
  // Attach the layout AND every item slot to the live DOM BEFORE rendering their
  // content. Charts must measure their final flex width when they render —
  // otherwise Plotly can't size to a detached node and falls back to its 700px
  // default, overflowing its column (covering the neighbour) and the text below.
  host.appendChild(layoutEl);
  const slots = (d.items ?? []).map((item) => {
    const child = document.createElement("div");
    child.className =
      layoutKind === "row" ? "notebook-display-row__item min-w-[min(100%,380px)] flex-1" : "";
    layoutEl.appendChild(child);
    return [child, item];
  });
  for (const [child, item] of slots) {
    await renderDisplayInto(child, item, bridge);
  }
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

// Which Display kind currently occupies `host` (read back from the DOM that
// renderDisplayInto produced), so a live update can tell whether the shape is
// unchanged and reuse the existing nodes instead of rebuilding.
function existingDisplayKind(host) {
  const w = host.firstElementChild;
  if (!w) return null;
  if (w.dataset?.plotlyChart) return "chart";
  if (w.dataset?.displayStack) return "stack";
  if (w.dataset?.displayCol) return "col";
  if (w.dataset?.displayRow) return "row";
  if (w.classList?.contains("notebook-text-output")) return "text";
  return "other";
}

/**
 * Update `host` to show `raw`, reusing existing DOM when the Display tree shape
 * is unchanged. This is what lets a live (looping) cell refresh without throwing
 * away the viewer's chart zoom/pan: charts are updated in place via Plotly.react
 * (which, with the layout's stable uirevision, preserves the current axis range),
 * text is patched, and only a genuine structural change falls back to a full
 * rebuild. Mirrors renderDisplayInto's structure exactly.
 */
export async function reconcileDisplayInto(host, raw, bridge) {
  const d = decodeDisplay(raw);
  if (!d) return renderDisplayInto(host, raw, bridge);
  const reconcilable =
    existingDisplayKind(host) === d.kind &&
    (d.kind === "text" || d.kind === "chart" || d.kind === "stack" || d.kind === "col" || d.kind === "row");
  if (!reconcilable) return renderDisplayInto(host, raw, bridge);

  const w = host.firstElementChild;
  if (d.kind === "text") {
    w.innerHTML = markdownToHtml(d.text ?? "");
    return;
  }
  if (d.kind === "chart") {
    // Re-react the EXISTING plot element (do NOT clear it first): Plotly.react
    // diffs the new data against the live plot and keeps zoom/pan via uirevision.
    await renderChartImpl(w)(d)(bridge)();
    return;
  }
  // Layout (stack/col/row): reuse the wrapper if heading-presence and child count
  // match, then reconcile each child; otherwise rebuild this subtree.
  const items = d.items ?? [];
  const hasHeading = !!w.firstElementChild?.classList?.contains("notebook-display-heading");
  if (!!d.title !== hasHeading) return renderDisplayInto(host, raw, bridge);
  let childEls = Array.from(w.children);
  if (hasHeading) {
    if (childEls[0].textContent !== d.title) childEls[0].textContent = d.title ?? "";
    childEls = childEls.slice(1);
  }
  if (childEls.length !== items.length) return renderDisplayInto(host, raw, bridge);
  for (let i = 0; i < items.length; i++) {
    await reconcileDisplayInto(childEls[i], items[i], bridge);
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
