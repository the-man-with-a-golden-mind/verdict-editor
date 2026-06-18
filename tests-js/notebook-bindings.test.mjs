import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";
import { buildCellLineMap } from "./notebook-helpers.mjs";
import {
  bindingNamesFromSourceScan,
  bindingNamesInCellCore,
  filterRunnableBindingNames,
  mapBindingsFromAstCore,
} from "../src/editor/notebookBindingsCore.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function mapBindingsFromAst(astLib, materializedSource, cells) {
  return mapBindingsFromAstCore(astLib, materializedSource, cells, buildCellLineMap(cells));
}

function bindingNamesInCell(cellId, cells, materializedSource, astLib) {
  return bindingNamesInCellCore(cellId, cells, materializedSource, astLib, buildCellLineMap);
}

test("bindings: astJS maps nullary decls to cells by line", async () => {
  const astLib = await import(pathToFileURL(path.join(root, "public/lib/verdict-ast.mjs")).href);
  const cells = [
    { id: "c1", kind: "code", source: "module Main exposing (x)\n\nx : Int\nx = 1" },
    { id: "c2", kind: "code", source: "y = 2" },
  ];
  const full = cells.map((c) => c.source.trim()).join("\n\n");
  const map = mapBindingsFromAst(astLib, full, cells);
  assert.ok(map);
  assert.deepEqual(map.get("c1"), ["x"]);
  assert.deepEqual(map.get("c2"), ["y"]);
});

test("bindings: map skips decls with parameters", () => {
  const astLib = {
    astJS: () => ({
      ok: true,
      ast: JSON.stringify({
        decls: [
          { name: "f", params: ["n"], body: { pos: { line: 3 } } },
          { name: "x", params: [], body: { pos: { line: 5 } } },
        ],
      }),
    }),
  };
  const cells = [{ id: "c1", kind: "code", source: "module Main exposing (x)\n\nf n = n\n\nx = 1" }];
  const map = mapBindingsFromAst(astLib, cells[0].source, cells);
  assert.ok(map);
  assert.deepEqual(map.get("c1"), ["x"]);
});

test("bindings: record literal lines are not treated as top-level bindings", () => {
  const recordCell = `    mean = mean, stddev = sd, zscore = z, emaFast = emaFast, emaSlow = emaSlow,
    slope = slope, rangePos = rangePos, momentum = mom, samples = length(window) }`;
  assert.deepEqual(bindingNamesFromSourceScan(recordCell), []);
});

test("bindings: ast empty cell does not fall back to record-field scan", async () => {
  const astLib = await import(pathToFileURL(path.join(root, "public/lib/verdict-ast.mjs")).href);
  const cells = [
    { id: "c1", kind: "code", source: "module Main exposing (main)\n\nmain : String\nmain = \"ok\"" },
    {
      id: "c2",
      kind: "code",
      source: `    mean = mean, stddev = sd,
    slope = slope, samples = length(window) }`,
    },
  ];
  const full = cells.map((c) => c.source.trim()).join("\n\n");
  assert.deepEqual(bindingNamesInCell("c2", cells, full, astLib), []);
});

test("bindings: compileBindingEntryJS runs each nullary binding", async () => {
  const v = await import(pathToFileURL(path.join(root, "public/lib/verdict-notebook.mjs")).href);
  const src = "module Main exposing (x, y)\n\nx : Int\nx = 1\n\ny : Int\ny = 2\n";
  const out = v.evalBindingsJsonJS(src, ["x", "y"]);
  assert.equal(out.length, 2);
  assert.equal(out[0]?.name, "x");
  assert.equal(out[0]?.ok, true);
  assert.equal(out[1]?.name, "y");
  assert.equal(out[1]?.ok, true);
  assert.equal(out[1]?.json?.int, "2");
});

test("bindings: filterRunnableBindingNames drops ghost names", async () => {
  const v = await import(pathToFileURL(path.join(root, "public/lib/verdict-notebook.mjs")).href);
  const src = "module Main exposing (x)\n\nx : Int\nx = 1\n";
  const compiled = v.compileBindingsJS(src);
  assert.equal(compiled.ok, true);
  assert.deepEqual(filterRunnableBindingNames(compiled.output, ["x", "mean", "slope"]), ["x"]);
});

test("verdict-notebook: evalBindingsJsonJS returns structured json", async () => {
  const v = await import(pathToFileURL(path.join(root, "public/lib/verdict-notebook.mjs")).href);
  assert.equal(typeof v.evalBindingsJsonJS, "function");
  const src = "module Main exposing (n)\n\nn : Int\nn = 42\n";
  const out = v.evalBindingsJsonJS(src, ["n"]);
  assert.equal(out.length, 1);
  assert.equal(out[0].name, "n");
  assert.equal(out[0].ok, true);
  assert.equal(out[0].typeSig, "Int");
  assert.equal(out[0].json?.int, "42");
});
