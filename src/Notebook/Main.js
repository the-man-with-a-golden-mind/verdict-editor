"use strict";

export { mountNotebookImpl } from "./NotebookMount.js";
import { tableHeadersFromRowsImpl, tableBodyFromRowsImpl } from "./Spreadsheet.js";

export function unsafeReadString(o) {
  return function (k) {
    if (o == null || typeof o !== "object") return "";
    const v = o[k];
    return v == null ? "" : String(v);
  };
}

export function unsafeReadCellUi(o) {
  return normalizeCellUi(o?.ui);
}

function normalizeCellUi(ui) {
  return {
    folded: Boolean(ui?.folded),
    codeFolded: Boolean(ui?.codeFolded),
    outputFolded: Boolean(ui?.outputFolded),
    editorHeight: Number.isFinite(ui?.editorHeight) ? Math.round(ui.editorHeight) : 160,
    outputHeight: Number.isFinite(ui?.outputHeight) ? Math.round(ui.outputHeight) : 180,
  };
}

export function unsafeToRows(foreign) {
  if (!Array.isArray(foreign)) return [];
  return foreign.map((row) => (Array.isArray(row) ? row.map(String) : []));
}

export function tableHeaders(raw) {
  if (raw?.headers && Array.isArray(raw.headers)) {
    return raw.headers.map(String);
  }
  const rows = extractTableRows(raw);
  return tableHeadersFromRowsImpl(rows);
}

export function tableBody(raw) {
  if (raw?.headers && Array.isArray(raw.rows) && raw.rows.every(Array.isArray)) {
    return raw.rows.map((row) => row.map(String));
  }
  const rows = extractTableRows(raw);
  return tableBodyFromRowsImpl(rows);
}

function extractTableRows(raw) {
  if (!raw || typeof raw !== "object") return [];
  if (Array.isArray(raw.rows)) return raw.rows;
  if (Array.isArray(raw)) return raw;
  return [];
}

export { decodeDisplay, renderDisplayInto } from "./Display.js";
