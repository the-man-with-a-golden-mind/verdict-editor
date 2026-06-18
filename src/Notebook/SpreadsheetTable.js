"use strict";

export function csvEscape(s) {
  const t = String(s ?? "");
  if (/[",\n\r]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

export function rowsToCsv(rows, cols) {
  const header = cols.map(csvEscape).join(",");
  const body = rows.map((r) => cols.map((k) => csvEscape(r[k])).join(",")).join("\n");
  return body ? `${header}\n${body}` : header;
}
