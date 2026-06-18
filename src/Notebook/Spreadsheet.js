"use strict";

import { rowsToCsv, csvEscape } from "./SpreadsheetTable.js";

const columnNames = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  "AA", "AB", "AC", "AD", "AE", "AF", "AG", "AH", "AI", "AJ", "AK", "AL", "AM",
  "AN", "AO", "AP", "AQ", "AR", "AS", "AT", "AU", "AV", "AW", "AX", "AY", "AZ",
];

function columnName(col) {
  return columnNames[col] ?? `C${col + 1}`;
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

/** ps-spa excel-inspired read-only grid for notebook table output. */
export function renderSpreadsheetTable(host, rows) {
  host.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "flex flex-col gap-2 notebook-spreadsheet-wrap";

  const cols = tableColumns(rows);
  const grid = document.createElement("div");
  grid.className = "overflow-auto rounded border border-slate-800 max-h-[320px]";

  const table = document.createElement("table");
  table.className = "w-full border-collapse text-xs font-mono text-slate-200 notebook-spreadsheet";
  table.dataset.notebookTable = "1";

  const thead = document.createElement("thead");
  const hr = document.createElement("tr");
  hr.className = "bg-slate-900 sticky top-0 z-10";
  const corner = document.createElement("th");
  corner.className = "border border-slate-800 px-2 py-1 text-left text-slate-500 w-12";
  corner.textContent = "#";
  hr.appendChild(corner);
  for (let ci = 0; ci < cols.length; ci++) {
    const th = document.createElement("th");
    th.className = "border border-slate-800 px-2 py-1 text-left text-slate-400 min-w-[120px]";
    th.innerHTML = `<span class="font-semibold text-slate-300">${cols[ci]}</span> <span class="text-[10px] text-slate-500">${columnName(ci)}</span>`;
    hr.appendChild(th);
  }
  thead.appendChild(hr);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  rows.forEach((row, ri) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-900/50";
    const rowNum = document.createElement("td");
    rowNum.className = "border border-slate-800 px-2 py-1 text-slate-500 tabular-nums";
    rowNum.textContent = String(ri + 1);
    tr.appendChild(rowNum);
    for (const c of cols) {
      const td = document.createElement("td");
      td.className = "border border-slate-800 px-2 py-1 tabular-nums";
      const v = row[c];
      td.textContent = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  grid.appendChild(table);
  wrap.appendChild(grid);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className =
    "self-end rounded border border-indigo-500/40 bg-indigo-500/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-200";
  btn.textContent = "Copy to CSV";
  btn.dataset.copyCsv = "1";
  btn.onclick = () => navigator.clipboard.writeText(rowsToCsv(rows, cols));
  wrap.appendChild(btn);

  host.appendChild(wrap);
}

export { csvEscape, rowsToCsv };
