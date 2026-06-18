"use strict";

import { registerPsMountTable } from "./Spreadsheet.js";

/** Keep in sync with src/editor/notebookBindingsCore.mjs */
export function bindingNamesFromSource(source) {
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

export function initNotebookPsImpl() {
  return function () {
    if (globalThis.__notebookMountSpreadsheet) {
      registerPsMountTable(globalThis.__notebookMountSpreadsheet);
    }
  };
}
