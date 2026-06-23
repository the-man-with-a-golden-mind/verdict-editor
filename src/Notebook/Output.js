"use strict";

// FFI for Notebook.Output (the PureScript output renderer).
import { chartManagerFor } from "./ChartManager.js";
import { renderSpreadsheetTable } from "./Spreadsheet.js";
import { decodeDisplay, markdownToHtml } from "./Display.js";
import { tableHeadersFromRowsImpl, tableBodyFromRowsImpl, csvEscape } from "./Spreadsheet.js";

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

// Per-host state so UI events (tab switch, fullscreen) can re-render, and so UI
// state survives live emits.
export const storeState = (host) => (raw) => (bridge) => () => {
  host.__out = { raw, bridge };
  if (!host.__ui) host.__ui = {};
};
export const readRaw = (host) => (host.__out ? host.__out.raw : {});
export const readBridge = (host) => (host.__out ? host.__out.bridge : {});
export const getUiInt = (host) => (key) => (def) => {
  const v = host.__ui && host.__ui[key];
  return Number.isInteger(v) ? v : def;
};
export const setUiInt = (host) => (key) => (val) => () => {
  if (!host.__ui) host.__ui = {};
  host.__ui[key] = val;
};
export const getUiBool = (host) => (key) => (def) => {
  const v = host.__ui && host.__ui[key];
  return typeof v === "boolean" ? v : def;
};
export const setUiBool = (host) => (key) => (val) => () => {
  if (!host.__ui) host.__ui = {};
  host.__ui[key] = val;
};

const escAttr = (s) => String(s).replace(/["\\]/g, "\\$&");

// Walk the Display tree (same path keys as the PS view) and fill each leaf into
// its placeholder. box merges onto its child (same key); full renders its child;
// tabs only fills the ACTIVE tab (from host.__ui); layouts recurse by index.
export const syncLeavesImpl = (host) => (raw) => (bridge) => () => {
  const charts = [];
  const walk = (node, key) => {
    const d = decodeDisplay(node);
    if (!d || !d.kind) return;
    switch (d.kind) {
      case "box":
        walk(d.child, key);
        break;
      case "full":
        walk(d.child, key + "/0");
        break;
      case "tabs": {
        const tabs = d.tabs ?? [];
        const ui = host.__ui && host.__ui[key + ":tab"];
        const active = Number.isInteger(ui) ? ui : 0;
        if (tabs[active] && tabs[active].content) walk(tabs[active].content, key + "/" + active);
        break;
      }
      case "text": {
        const el = host.querySelector(`[data-text-key="${escAttr(key)}"]`);
        if (el) el.innerHTML = markdownToHtml(d.text ?? "");
        break;
      }
      case "chart":
        charts.push({ key, spec: d });
        break;
      case "table": {
        const el = host.querySelector(`[data-table-key="${escAttr(key)}"]`);
        if (el) renderSpreadsheetTable(el, d.rows ?? []);
        break;
      }
      case "sheet": {
        const el = host.querySelector(`[data-sheet-key="${escAttr(key)}"]`);
        if (el) renderSpreadsheetTable(el, d.rows ?? []);
        break;
      }
      case "stack":
      case "col":
      case "row":
      case "grid":
      case "section":
        (d.items ?? []).forEach((it, i) => walk(it, key + "/" + i));
        break;
    }
  };
  walk(raw, "r");
  if (charts.length) void chartManagerFor(host, bridge).sync(host, charts);
};

// Download a sheet's rows as a CSV file.
export const exportSheetCsv = (node) => () => {
  const d = decodeDisplay(node);
  const rows = (d && d.rows) || [];
  const headers = tableHeadersFromRowsImpl(rows);
  const body = tableBodyFromRowsImpl(rows);
  const lines = [headers.map(csvEscape).join(","), ...body.map((r) => r.map(csvEscape).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sheet.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Plain object access (parse a JSON string, unwrap a `display` envelope) WITHOUT
// the kind-wrapping decodeDisplay does — so we can read fields off nodes that have
// no `kind` (e.g. a tab's { label, content }).
const asObj = (f) => {
  if (f == null) return {};
  if (typeof f === "string") {
    try {
      return JSON.parse(f);
    } catch {
      return {};
    }
  }
  if (typeof f === "object") return f.display != null ? asObj(f.display) : f;
  return {};
};

export const readKind = (f) => {
  const d = asObj(f);
  return typeof d.kind === "string" ? d.kind : "";
};

export const readStr = (f) => (field) => {
  const d = asObj(f);
  return d[field] != null ? String(d[field]) : "";
};

export const readArr = (f) => (field) => {
  const d = asObj(f);
  return Array.isArray(d[field]) ? d[field] : [];
};

export const readField = (f) => (field) => {
  const d = asObj(f);
  return d[field] != null ? d[field] : {};
};

export const readIntField = (f) => (field) => (def) => {
  const d = asObj(f);
  const n = Number(d[field]);
  return Number.isFinite(n) ? Math.trunc(n) : def;
};
