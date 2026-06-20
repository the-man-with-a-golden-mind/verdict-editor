import test from "node:test";
import assert from "node:assert/strict";
import {
  buildNotebookProgramSource,
  buildRunnableCellSource,
  importModuleNames,
  inferCellRole,
  normalizeCellMeta,
} from "../src/editor/notebookProject.mjs";

test("project cells: normalize visible module metadata", () => {
  const cell = normalizeCellMeta({
    kind: "code",
    source: "module Market exposing (price)\n\nprice = 1",
  });
  assert.equal(cell.role, "module");
  assert.equal(cell.moduleName, "Market");
  assert.equal(cell.path, "Market.verdict");
});

test("project cells: runnable source merges only imported visible modules", () => {
  const market = {
    id: "market",
    kind: "code",
    role: "module",
    moduleName: "Market",
    source: "module Market exposing (price)\n\nprice : Int\nprice = 41",
  };
  const unused = {
    id: "unused",
    kind: "code",
    role: "module",
    moduleName: "Unused",
    source: "module Unused exposing (hidden)\n\nhidden : Int\nhidden = 0",
  };
  const main = {
    id: "main",
    kind: "code",
    role: "runnable",
    source: "module Main exposing (main)\nimport Market exposing (..)\n\nmain : Int\nmain = price + 1",
  };
  const src = buildRunnableCellSource(main, [market, unused, main]);
  assert.match(src, /^module Main exposing \(\.\.\)/);
  assert.match(src, /price : Int\nprice = 41/);
  assert.match(src, /main : Int\nmain = price \+ 1/);
  assert.doesNotMatch(src, /import Market/);
  assert.doesNotMatch(src, /hidden : Int/);
});

test("project cells: flattened notebook source strips file headers/imports", () => {
  const src = buildNotebookProgramSource([
    { kind: "code", role: "module", source: "module Market exposing (price)\n\nprice = 1" },
    { kind: "code", role: "runnable", source: "module Main exposing (main)\nimport Market exposing (..)\n\nmain = price" },
  ]);
  assert.equal((src.match(/^module /gm) ?? []).length, 1);
  assert.equal((src.match(/^import /gm) ?? []).length, 0);
  assert.match(src, /price = 1/);
  assert.match(src, /main = price/);
});

test("project cells: role and imports are inferred conservatively", () => {
  assert.equal(inferCellRole({ kind: "wysiwyg", source: "# note" }), "note");
  assert.equal(inferCellRole({ kind: "code", source: "module Main exposing (main)\n\nmain = 1" }), "runnable");
  assert.deepEqual(importModuleNames("import Market exposing (..)\nimport Display exposing (dText)"), ["Market", "Display"]);
});
