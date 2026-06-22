"use strict";

// FFI for Notebook.Output (the PureScript output renderer).
import { chartManagerFor } from "./ChartManager.js";
import { renderSpreadsheetTable } from "./Spreadsheet.js";
import { decodeDisplay, markdownToHtml } from "./Display.js";

// Render the ps-spa Document body into `host` via the in-place diffing reconcile
// (NO innerHTML wipe — that's what preserves DOM identity / scroll across updates).
export const renderStructure = (host) => (doc) => () => {
  if (!host) return;
  const paint = () => {
    if (!host.isConnected) {
      requestAnimationFrame(paint);
      return;
    }
    const render = globalThis.__psSpaRenderDocumentOn;
    if (render) render(host, doc);
  };
  paint();
};

const escAttr = (s) => String(s).replace(/["\\]/g, "\\$&");

// Walk the Display tree (same path keys as the PS view) and fill each leaf into
// its placeholder: markdown text, spreadsheet tables, and (batched) charts via the
// keyed ChartManager (react+uirevision keeps zoom; ResizeObserver keeps it fitted).
export const syncLeavesImpl = (host) => (raw) => (bridge) => () => {
  const charts = [];
  const walk = (node, key) => {
    const d = decodeDisplay(node);
    if (!d || !d.kind) return;
    if (d.kind === "text") {
      const el = host.querySelector(`[data-text-key="${escAttr(key)}"]`);
      if (el) el.innerHTML = markdownToHtml(d.text ?? "");
    } else if (d.kind === "chart") {
      charts.push({ key, spec: d });
    } else if (d.kind === "table") {
      const el = host.querySelector(`[data-table-key="${escAttr(key)}"]`);
      if (el) renderSpreadsheetTable(el, d.rows ?? []);
    } else if (d.kind === "stack" || d.kind === "col" || d.kind === "row") {
      (d.items ?? []).forEach((it, i) => walk(it, key + "/" + i));
    }
  };
  walk(raw, "r");
  if (charts.length) void chartManagerFor(host, bridge).sync(host, charts);
};

export const readKind = (f) => {
  const d = decodeDisplay(f);
  return (d && d.kind) || "";
};

export const readTitle = (f) => {
  const d = decodeDisplay(f);
  return (d && d.title) || "";
};

export const readItems = (f) => {
  const d = decodeDisplay(f);
  return (d && d.items) || [];
};
