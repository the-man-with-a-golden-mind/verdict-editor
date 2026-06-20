"use strict";

const MODULE_RE = /^\s*module\s+([A-Z][A-Za-z0-9_.]*)\s+exposing\s*\([^)]*\)/m;
const IMPORT_RE = /^\s*import\s+([A-Z][A-Za-z0-9_.]*)\b.*$/gm;

export function cellModuleName(source) {
  return String(source ?? "").match(MODULE_RE)?.[1] ?? null;
}

export function importModuleNames(source) {
  const out = [];
  const seen = new Set();
  const text = String(source ?? "");
  for (const m of text.matchAll(IMPORT_RE)) {
    const name = m[1];
    if (!seen.has(name)) {
      seen.add(name);
      out.push(name);
    }
  }
  return out;
}

export function inferCellRole(cell) {
  if (cell?.role === "module" || cell?.role === "runnable" || cell?.role === "asset" || cell?.role === "note") {
    return cell.role;
  }
  if (cell?.kind === "wysiwyg") return "note";
  const moduleName = cellModuleName(cell?.source);
  return moduleName && moduleName !== "Main" ? "module" : "runnable";
}

export function isModuleCell(cell) {
  return cell?.kind === "code" && inferCellRole(cell) === "module";
}

export function isRunnableCell(cell) {
  return cell?.kind === "code" && inferCellRole(cell) !== "module" && inferCellRole(cell) !== "asset";
}

export function normalizeCellMeta(cell) {
  const kind = cell?.kind === "wysiwyg" ? "wysiwyg" : "code";
  const source = String(cell?.source ?? "");
  const moduleName = cell?.moduleName || cellModuleName(source) || (kind === "code" ? "Main" : null);
  const role = inferCellRole({ ...cell, kind, source, moduleName });
  const path = cell?.path || (moduleName ? `${moduleName.replace(/\./g, "/")}.verdict` : undefined);
  return { kind, source, role, moduleName, path };
}

function stripModuleHeader(source) {
  return String(source ?? "").replace(MODULE_RE, "").trim();
}

function stripImports(source) {
  return String(source ?? "")
    .split("\n")
    .filter((line) => !/^\s*import\s+[A-Z][A-Za-z0-9_.]*\b/.test(line))
    .join("\n")
    .trim();
}

function sourceBody(source) {
  return stripImports(stripModuleHeader(source));
}

function moduleHeaderFor(cell) {
  const moduleName = cellModuleName(cell?.source) || cell?.moduleName || "Main";
  return `module ${moduleName} exposing (..)`;
}

function visibleModuleMap(cells) {
  const map = new Map();
  for (const cell of cells ?? []) {
    if (!isModuleCell(cell)) continue;
    const moduleName = cell.moduleName || cellModuleName(cell.source);
    if (moduleName) map.set(moduleName, cell);
  }
  return map;
}

function collectDeps(target, moduleMap) {
  const out = [];
  const seen = new Set();
  const visit = (moduleName) => {
    if (seen.has(moduleName)) return;
    seen.add(moduleName);
    const dep = moduleMap.get(moduleName);
    if (!dep) return;
    for (const child of importModuleNames(dep.source)) visit(child);
    out.push(dep);
  };
  for (const moduleName of importModuleNames(target?.source)) visit(moduleName);
  return out;
}

export function buildRunnableCellSource(target, cells) {
  if (!isRunnableCell(target)) return String(target?.source ?? "");
  const deps = collectDeps(target, visibleModuleMap(cells));
  const chunks = [
    moduleHeaderFor(target),
    ...deps.map((cell) => sourceBody(cell.source)),
    sourceBody(target.source),
  ].map((chunk) => chunk.trim()).filter(Boolean);
  return chunks.join("\n\n") + "\n";
}

export function buildNotebookProgramSource(cells) {
  const codeCells = (cells ?? []).filter((cell) => cell?.kind === "code");
  const chunks = [
    "module Main exposing (..)",
    ...codeCells.map((cell) => sourceBody(cell.source)),
  ].map((chunk) => chunk.trim()).filter(Boolean);
  return chunks.join("\n\n") + "\n";
}

export function projectCellLabel(cell) {
  const role = inferCellRole(cell);
  if (role === "module") return "Module";
  if (role === "asset") return "Asset";
  if (role === "note") return "Markdown";
  return "Runnable";
}
