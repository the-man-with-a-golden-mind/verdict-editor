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

test("VerdictIDE: library symbols are linked into notebook compile", async () => {
  const vlib = await import(pathToFileURL(path.join(root, "public/lib/verdict-notebook.mjs")).href);
  const sigs = vlib.signaturesJS(`module Main exposing (main)
main : Unit
main = let _ = bootGlobal(unit) in unit
`);
  const names = new Set(sigs.map((s) => s.name));
  for (const n of ["bootGlobal", "ensureGlobal", "idePut", "ideGet", "registerWorker", "ask"]) {
    assert.ok(names.has(n), `expected IDE export ${n} in signatures`);
  }
});

test("VerdictIDE: idePut / ideGet share data across cells", async () => {
  const { evalNotebookCells, createEffectStorage, vlib, finvm } = await loadLibs();
  const { ctx } = makeCtx(vlib, finvm, createEffectStorage);

  const src = `module Main exposing (main, step2)

main : Unit
main =
  let _ = idePut("demo", "x", { n = 42 }) in
  unit

step2 : Int
step2 =
  let v = ideGet("demo", "x") in
  v.n
`;

  const out1 = await evalNotebookCells(ctx, src, ["main"], { cell: { id: "c1", index: 0 } });
  assert.equal(out1[0]?.ok, true, out1[0]?.error);

  const out2 = await evalNotebookCells(ctx, src, ["step2"], { cell: { id: "c2", index: 1 } });
  assert.equal(out2[0]?.ok, true, out2[0]?.error);
  assert.match(displayText(out2[0]), /42/);
});

test("VerdictIDE: bootGlobal actor survives into a later cell", async () => {
  const { evalNotebookCells, createEffectStorage, vlib, finvm, findProcess, FINVM_SNAPSHOT_KEY, countLiveProcesses } =
    await loadLibs();
  const { ctx, getState } = makeCtx(vlib, finvm, createEffectStorage);

  const src = `module Main exposing (boot, step2)

boot : Unit
boot = let _ = bootGlobal(unit) in unit

step2 : Int
step2 = 1
`;

  const out1 = await evalNotebookCells(ctx, src, ["boot"], { cell: { id: "boot", index: 0 } });
  assert.equal(out1[0]?.ok, true, out1[0]?.error);

  const snap1 = getState()[FINVM_SNAPSHOT_KEY];
  assert.ok(findProcess(snap1, "p0") || countLiveProcesses(snap1) >= 1, "IDE global actor should stay alive");

  const out2 = await evalNotebookCells(ctx, src, ["step2"], { cell: { id: "step2", index: 1 } });
  assert.equal(out2[0]?.ok, true, out2[0]?.error);
  assert.match(displayText(out2[0]), /1/);

  const snap2 = getState()[FINVM_SNAPSHOT_KEY];
  assert.ok(countLiveProcesses(snap2) >= 1, "background IDE actor remains after cell 2");
});

test("VerdictIDE: registerWorker and ask in one cell", async () => {
  const { evalNotebookCells, createEffectStorage, vlib, finvm } = await loadLibs();
  const { ctx } = makeCtx(vlib, finvm, createEffectStorage);

  const src = `module Main exposing (main)

main : Int
main =
  let g = bootGlobal(unit) in
  let _ = registerWorker(g, "noop", "main", MkActorRef(self())) in
  let _ = ask(g, "noop", { ping = unit }) in
  1
`;

  const out = await evalNotebookCells(ctx, src, ["main"], { cell: { id: "main", index: 0 } });
  assert.equal(out[0]?.ok, true, out[0]?.error);
  assert.match(displayText(out[0]), /1/);
});
