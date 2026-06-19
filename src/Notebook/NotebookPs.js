"use strict";

import { Code, Wysiwyg } from "../Cell/index.js";
import { defaultCellUi as psDefaultCellUi } from "../Cell/index.js";
import {
  concatenateCode,
  concatenateDocument,
  bindingNamesFromSource,
} from "../Notebook/index.js";
import { updateJsModel } from "../Notebook.Model/index.js";
import { seedSignature } from "../Seed/index.js";
import { extractVerdictDocs } from "../VerdictDocs/index.js";

/** Map JS notebook cell records to PureScript `Cell` values. */
export function toPsCell(c) {
  return {
    id: c.id ?? "",
    source: c.source ?? "",
    kind: c.kind === "wysiwyg" ? Wysiwyg.value : Code.value,
    ui: normalizeCellUi(c.ui),
  };
}

export function concatCode(cells) {
  return ensureModuleHeader(concatenateCode(cells.map(toPsCell)));
}

/**
 * A Verdict program must begin with a `module` declaration. Notebook cells are
 * concatenated in order, so this only holds if the first code cell carries the
 * header. Reordering, deleting, or inserting cells above it would otherwise make
 * the whole program fail to parse ("Expected module"). Prepend a canonical
 * header when the concatenated source does not already start with one.
 */
function ensureModuleHeader(src) {
  const s = String(src || "");
  if (s.trim() === "" || /^\s*module\b/.test(s)) return s;
  return "module Main exposing (..)\n\n" + s;
}

export function concatDocument(cells) {
  return concatenateDocument(cells.map(toPsCell));
}

export function bindingNamesForCell(cell) {
  return bindingNamesFromSource(cell?.source ?? "");
}

export function scanBindingNames(source) {
  return bindingNamesFromSource(source ?? "");
}

export { seedSignature, extractVerdictDocs };

export function docsToMap(entries) {
  const m = new Map();
  for (const e of entries ?? []) {
    if (e?.name) m.set(e.name, e.doc ?? "");
  }
  return m;
}

export function defaultCellUi() {
  const u = psDefaultCellUi;
  return normalizeCellUi(u);
}

export function normalizeCellUi(ui) {
  return {
    folded: Boolean(ui?.folded),
    codeFolded: Boolean(ui?.codeFolded),
    outputFolded: Boolean(ui?.outputFolded),
    editorHeight: Number.isFinite(ui?.editorHeight) ? Math.round(ui.editorHeight) : 160,
    editorResized: Boolean(ui?.editorResized),
    outputHeight: Number.isFinite(ui?.outputHeight) ? Math.round(ui.outputHeight) : 180,
  };
}

export function updateModel(model, msg) {
  return updateJsModel(completeMsg(msg))(completeModel(model));
}

function completeModel(model) {
  return {
    cells: (model?.cells ?? []).map(completeCell),
    focusedId: model?.focusedId ?? null,
    maximizedId: model?.maximizedId ?? null,
  };
}

function completeMsg(msg) {
  const empty = completeCell({});
  const base = msg ?? {};
  return {
    tag: "",
    id: "",
    kind: "code",
    delta: 0,
    source: "",
    folded: false,
    height: 0,
    ...base,
    cell: completeCell(base.cell ?? empty),
    fallbackCell: completeCell(base.fallbackCell ?? empty),
    cells: (base.cells ?? []).map(completeCell),
  };
}

function completeCell(cell) {
  return {
    id: cell?.id ?? "",
    kind: cell?.kind === "wysiwyg" ? "wysiwyg" : "code",
    source: cell?.source ?? "",
    ui: normalizeCellUi(cell?.ui),
  };
}
