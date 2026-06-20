import test from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const runnerPromise = import(
  pathToFileURL(path.join(root, "tests-js/.notebook-eval-runner.mjs")).href
);

function materializeIde(source, cell) {
  const cellId = cell?.id ?? "";
  const cellIndex = cell?.index ?? 0;
  const esc = cellId.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return source
    .replaceAll("__IDE_CELL_ID__", `"${esc}"`)
    .replaceAll("__IDE_CELL_INDEX__", String(cellIndex));
}

async function loadLibs() {
  const runner = await runnerPromise;
  const vlib = await import(pathToFileURL(path.join(root, "public/lib/verdict-notebook.mjs")).href);
  const finvmMod = await import(pathToFileURL(path.join(root, "public/lib/finvm.mjs")).href);
  return {
    ...runner,
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
      materialize: materializeIde,
    },
    getState: () => state,
    getStorage: () => storage,
  };
}

function displayText(result) {
  return String(result?.display?.text ?? result?.json ?? "");
}

test("CellBus: library links when busPost is used", async () => {
  const vlib = await import(pathToFileURL(path.join(root, "public/lib/verdict-notebook.mjs")).href);
  const diags = vlib.diagnosticsJS(`module Main exposing (main)
main : String
main = busPost("inbox", { n = 1 })
`);
  const errors = diags.filter((d) => d.severity === "error");
  assert.equal(errors.length, 0, errors[0]?.message ?? "compile failed");
});

test("CellBus: producer cell posts, consumer cell reads by id", async () => {
  const { evalNotebookCells, createEffectStorage, vlib, finvm } = await loadLibs();
  const { ctx, getStorage } = makeCtx(vlib, finvm, createEffectStorage);

  const src = `module Main exposing (produce, consume)

produce : String
produce = busPost("handoff", { task = "calc-risk", symbol = "BTCUSD" })

consume : String
consume =
  let row = busRead("handoff", "rec0") in
  row.symbol
`;

  const out1 = await evalNotebookCells(ctx, src, ["produce"], { cell: { id: "c-produce", index: 0 } });
  assert.equal(out1[0]?.ok, true, out1[0]?.error);
  assert.match(displayText(out1[0]), /rec0/);

  const out2 = await evalNotebookCells(ctx, src, ["consume"], { cell: { id: "c-consume", index: 1 } });
  assert.equal(out2[0]?.ok, true, out2[0]?.error);
  assert.match(displayText(out2[0]), /BTCUSD/);
  assert.equal(getStorage().listDbTables().handoff?.length, 1);
});

test("CellBus: queue enqueue in one cell, takeFirst in another", async () => {
  const { evalNotebookCells, createEffectStorage, vlib, finvm } = await loadLibs();
  const { ctx } = makeCtx(vlib, finvm, createEffectStorage);

  const src = `module Main exposing (enqueue, dequeue)

enqueue : String
enqueue = busQueue("jobs", { kind = "risk", level = 7 })

dequeue : Int
dequeue =
  let msg = busTakeFirst("jobs") in
  msg.level
`;

  const out1 = await evalNotebookCells(ctx, src, ["enqueue"], { cell: { id: "c-enq", index: 0 } });
  assert.equal(out1[0]?.ok, true, out1[0]?.error);

  const out2 = await evalNotebookCells(ctx, src, ["dequeue"], { cell: { id: "c-deq", index: 1 } });
  assert.equal(out2[0]?.ok, true, out2[0]?.error);
  assert.match(displayText(out2[0]), /7/);
});

test("CellBus: raw dbInsert/dbGet works across separate cell runs", async () => {
  const { evalNotebookCells, createEffectStorage, vlib, finvm } = await loadLibs();
  const { ctx } = makeCtx(vlib, finvm, createEffectStorage);

  const src = `module Main exposing (put, getRow)

put : String
put = dbInsert("signals", { price = 42000 })

getRow : Int
getRow =
  let row = dbGet("signals", "rec0") in
  row.price
`;

  await evalNotebookCells(ctx, src, ["put"]);
  const out = await evalNotebookCells(ctx, src, ["getRow"]);
  assert.equal(out[0]?.ok, true, out[0]?.error);
  assert.match(displayText(out[0]), /42000/);
});
