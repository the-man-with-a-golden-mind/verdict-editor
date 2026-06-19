import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadLibs() {
  const runner = await import(pathToFileURL(path.join(root, "tests-js/.notebook-eval-runner.mjs")).href);
  const vlib = await import(pathToFileURL(path.join(root, "public/lib/verdict-notebook.mjs")).href);
  const finvmMod = await import(pathToFileURL(path.join(root, "public/lib/finvm.mjs")).href);
  return {
    evalNotebookCells: runner.evalNotebookCells,
    createEffectStorage: runner.createEffectStorage,
    wrapVerdictLibForNotebook: runner.wrapVerdictLibForNotebook,
    vlib: runner.wrapVerdictLibForNotebook(vlib.default ?? vlib, vlib.default ?? vlib),
    finvm: finvmMod.default ?? finvmMod,
  };
}

function makeCtx(vlib, finvm, createEffectStorage) {
  let storage = createEffectStorage();
  let state = {};
  return {
    ctx: {
      vlib,
      finvm,
      getFinvmState: () => state,
      setFinvmState: (s) => {
        state = s;
      },
      getEffectStorage: () => storage,
      setEffectStorage: (s) => {
        storage = s;
      },
      materialize: (s) => s,
    },
    getStorage: () => storage,
  };
}

test("FinVM: scalar binding renders text display", async () => {
  const { evalNotebookCells, createEffectStorage, vlib, finvm } = await loadLibs();
  const { ctx } = makeCtx(vlib, finvm, createEffectStorage);
  const src = `module Main exposing (n)

n : Int
n = 42
`;
  const out = await evalNotebookCells(ctx, src, ["n"]);
  assert.equal(out[0]?.ok, true);
  assert.equal(out[0]?.display?.kind, "text");
  assert.match(String(out[0]?.display?.text), /42/);
});

test("FinVM: List record binding renders table display", async () => {
  const { evalNotebookCells, createEffectStorage, vlib, finvm } = await loadLibs();
  const { ctx } = makeCtx(vlib, finvm, createEffectStorage);
  const src = `module Main exposing (rows)

rows : List { val : String }
rows = [{ val = "a" }, { val = "b,b" }]
`;
  const out = await evalNotebookCells(ctx, src, ["rows"]);
  assert.equal(out[0]?.ok, true);
  assert.equal(out[0]?.display?.kind, "table");
  assert.equal(out[0]?.display?.rows?.length, 2);
  assert.equal(out[0]?.display?.rows?.[0]?.val, "a");
});

test("FinVM: db.insert persists across eval calls on shared storage", async () => {
  const { evalNotebookCells, createEffectStorage, vlib, finvm } = await loadLibs();
  const { ctx, getStorage } = makeCtx(vlib, finvm, createEffectStorage);
  const src = `module Main exposing (seed)

seed : String
seed = dbInsert("items", { val = "hello" })
`;
  const out = await evalNotebookCells(ctx, src, ["seed"]);
  assert.equal(out[0]?.ok, true);
  const tables = getStorage().listDbTables();
  assert.ok(tables.items?.length >= 1);
  assert.equal(tables.items[0].value?.val, "hello");

  const out2 = await evalNotebookCells(ctx, src, ["seed"]);
  assert.equal(out2[0]?.ok, true);
  assert.ok(getStorage().listDbTables().items.length >= 2);
});

test("FinVM: compile error maps to failed cell output", async () => {
  const { evalNotebookCells, createEffectStorage, vlib, finvm } = await loadLibs();
  const { ctx } = makeCtx(vlib, finvm, createEffectStorage);
  const src = `module Main exposing (bad)

bad = not_a_binding
`;
  const out = await evalNotebookCells(ctx, src, ["bad"]);
  assert.equal(out[0]?.ok, false);
  assert.ok(out[0]?.error);
});

test("FinVM: record-fragment cell names do not produce binding not runnable errors", async () => {
  const { evalNotebookCells, createEffectStorage, vlib, finvm } = await loadLibs();
  const { ctx } = makeCtx(vlib, finvm, createEffectStorage);
  const src = `module Main exposing (main)

main : String
main = "ok"
`;
  const out = await evalNotebookCells(ctx, src, ["mean", "slope", "main"]);
  const byName = Object.fromEntries(out.map((o) => [o.name, o]));
  assert.equal(byName.main?.ok, true);
  assert.equal(byName.mean, undefined);
  assert.equal(byName.slope, undefined);
});

test("FinVM: multi-binding module runs each cell binding", async () => {
  const { evalNotebookCells, createEffectStorage, vlib, finvm } = await loadLibs();
  const { ctx } = makeCtx(vlib, finvm, createEffectStorage);
  const src = `module Main exposing (x, y)

x : Int
x = 1

y : Int
y = 2
`;
  const out = await evalNotebookCells(ctx, src, ["x", "y"]);
  assert.equal(out.length, 2);
  assert.equal(out[0]?.name, "x");
  assert.equal(out[0]?.ok, true);
  assert.equal(out[1]?.name, "y");
  assert.equal(out[1]?.ok, true);
  assert.match(String(out[1]?.display?.text ?? out[1]?.json), /2/);
});

test("FinVM: sequential cell runs share db state without prefix re-eval", async () => {
  const { evalNotebookCells, createEffectStorage, vlib, finvm } = await loadLibs();
  const { ctx, getStorage } = makeCtx(vlib, finvm, createEffectStorage);
  const cell1 = `module Main exposing (seed)

seed : String
seed = dbInsert("items", { val = "hello" })
`;
  await evalNotebookCells(ctx, cell1, ["seed"]);
  const full = cell1 + `\n\ncount : Int\ncount = 1\n`;
  const out = await evalNotebookCells(ctx, full, ["count"]);
  assert.equal(out.length, 1);
  assert.equal(out[0]?.name, "count");
  assert.equal(out[0]?.ok, true);
  assert.ok(getStorage().listDbTables().items.length >= 1);
});
