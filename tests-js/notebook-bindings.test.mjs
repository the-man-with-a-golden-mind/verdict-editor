import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
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

import { DEFAULT_NOTEBOOK_DECISION_CELL_LINES } from "../src/editor/defaultNotebookDecisionCell.mjs";
import { DEFAULT_NOTEBOOK_SIM_CELL_LINES } from "../src/editor/defaultNotebookSimCell.mjs";
import { buildNotebookProgramSource } from "../src/editor/notebookProject.mjs";

function defaultExampleProgramFromEditor() {
  const market = fs.readFileSync(path.join(root, "lib/verdict/Market.verdict"), "utf8");
  return buildNotebookProgramSource([
    { id: "market", kind: "code", role: "module", moduleName: "Market", path: "Market.verdict", source: market },
    { id: "main", kind: "code", role: "runnable", moduleName: "Main", path: "Main.verdict", source: DEFAULT_NOTEBOOK_DECISION_CELL_LINES.join("\n") },
    { id: "sim", kind: "code", role: "runnable", moduleName: "Backtest", path: "Backtest.verdict", source: DEFAULT_NOTEBOOK_SIM_CELL_LINES.join("\n") },
  ]);
}

function materializeDefaultInputs(source) {
  let code = source;
  const inputs = {
    assetsCsv: "BTCUSD,ETHUSD,ADAUSD",
    signalThreshold: 2,
    positionBias: 0,
    telegramBotToken: "",
    telegramChatId: "",
  };
  for (const [key, value] of Object.entries(inputs)) {
    const lit = typeof value === "number" ? String(value) : JSON.stringify(value);
    code = code.replaceAll(`__INPUT_${key}__`, lit);
  }
  return code.replace(/__INPUT_[A-Za-z0-9_]+__/g, "0");
}

test("bindings: default example program parses and exposes main + simulate", async () => {
  const v = await import(pathToFileURL(path.join(root, "public/lib/verdict-notebook.mjs")).href);
  const raw = defaultExampleProgramFromEditor();
  const src = materializeDefaultInputs(raw);
  const errs = v.diagnosticsJS(src).filter((d) => d.severity !== "warning");
  assert.equal(errs.length, 0, errs.map((e) => `L${e.line}: ${e.message}`).join("; "));
  assert.deepEqual(v.nullaryBindingsJS(src).sort(), ["main", "simulate"]);
  for (const name of ["main", "simulate"]) {
    const c = v.compileBindingEntryJS(src, name);
    assert.equal(c.ok, true, c.error ?? name);
  }
});
