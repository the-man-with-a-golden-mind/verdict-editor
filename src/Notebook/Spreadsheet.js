"use strict";

import { rowsToCsv, csvEscape } from "./SpreadsheetTable.js";

export { csvEscape, rowsToCsv };

export function registerPsMountTable(fn) {
  globalThis.__notebookMountSpreadsheet = fn;
}

function getPsMountTable() {
  return globalThis.__notebookMountSpreadsheet ?? null;
}

export function tableColumns(rows) {
  const cols = [];
  const seen = new Set();
  for (const r of rows) {
    for (const k of Object.keys(r ?? {})) {
      if (!seen.has(k)) {
        seen.add(k);
        cols.push(k);
      }
    }
  }
  return cols;
}

export function tableHeadersFromRowsImpl(rows) {
  return tableColumns(rows);
}

export function tableBodyFromRowsImpl(rows) {
  const cols = tableColumns(rows);
  return rows.map((r) => cols.map((c) => {
    const v = r[c];
    if (v == null) return "";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  }));
}

export function renderSpreadsheetPs(host) {
  return function (doc) {
    return function () {
      if (!host || typeof host.appendChild !== "function") return;
      const paint = () => {
        if (!host.isConnected) {
          requestAnimationFrame(paint);
          return;
        }
        host.innerHTML = "";
        const render = globalThis.__psSpaRenderDocumentOn;
        if (render) render(host, doc);
        else host.innerHTML = '<div class="text-xs text-rose-400">Spreadsheet renderer not ready</div>';
      };
      paint();
    };
  };
}

export function copyCsvToClipboard(headers) {
  return function (rows) {
    return function () {
      const headerLine = headers.map(csvEscape).join(",");
      const body = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
      const text = body ? `${headerLine}\n${body}` : headerLine;
      return navigator.clipboard.writeText(text);
    };
  };
}

/** Fallback until ps-spa mount registers; used by Display.js for table output. */
export function renderSpreadsheetTable(host, rows) {
  const psMountTable = getPsMountTable();
  if (psMountTable) {
    psMountTable(host, rows);
    return;
  }
  host.innerHTML = '<div class="text-xs text-rose-400">Spreadsheet renderer not ready</div>';
}
