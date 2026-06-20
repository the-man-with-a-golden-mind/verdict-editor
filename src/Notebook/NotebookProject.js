"use strict";

// Thin marshalling adapter: the cell-project logic (role classification, labels,
// program-source assembly) lives in PureScript `Notebook.Project`. This module
// just shapes JS cell records into the JS-string boundary the PS expects and
// converts results back. Keep it dumb — put logic in Project.purs, not here.
import {
  cellModuleNameJs,
  importModuleNames as psImportModuleNames,
  inferCellRole as psInferCellRole,
  isModuleCell as psIsModuleCell,
  isRunnableCell as psIsRunnableCell,
  projectCellLabel as psProjectCellLabel,
  buildRunnableCellSource as psBuildRunnableCellSource,
  buildNotebookProgramSource as psBuildNotebookProgramSource,
  normalizeCellMeta as psNormalizeCellMeta,
} from "../Notebook.Project/index.js";

/** Shape a loose JS cell into the all-strings record PureScript expects. */
function toProj(cell) {
  return {
    kind: cell?.kind === "wysiwyg" ? "wysiwyg" : "code",
    source: String(cell?.source ?? ""),
    role: typeof cell?.role === "string" ? cell.role : "",
    moduleName: String(cell?.moduleName ?? ""),
    path: String(cell?.path ?? ""),
  };
}

export function cellModuleName(source) {
  const name = cellModuleNameJs(String(source ?? ""));
  return name === "" ? null : name;
}

export function importModuleNames(source) {
  return psImportModuleNames(String(source ?? ""));
}

export function inferCellRole(cell) {
  return psInferCellRole(toProj(cell));
}

export function isModuleCell(cell) {
  return psIsModuleCell(toProj(cell));
}

export function isRunnableCell(cell) {
  return psIsRunnableCell(toProj(cell));
}

export function projectCellLabel(cell) {
  return psProjectCellLabel(toProj(cell));
}

export function buildRunnableCellSource(target, cells) {
  return psBuildRunnableCellSource(toProj(target))((cells ?? []).map(toProj));
}

export function buildNotebookProgramSource(cells) {
  return psBuildNotebookProgramSource((cells ?? []).map(toProj));
}

export function normalizeCellMeta(cell) {
  return psNormalizeCellMeta(toProj(cell));
}
