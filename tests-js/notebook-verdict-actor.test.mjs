import test from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const runnerPromise = import(
  pathToFileURL(path.join(root, "tests-js/.notebook-eval-runner.mjs")).href
);

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
      materialize: (s) => s,
    },
    getState: () => state,
  };
}

function displayText(result) {
  return String(result?.display?.text ?? result?.json ?? "");
}

test("Verdict.Actor: library symbols are linked into notebook compile", async () => {
  const vlib = await import(pathToFileURL(path.join(root, "public/lib/verdict-notebook.mjs")).href);
  const sigs = vlib.signaturesJS(`module Main exposing (main)
main : Int
main = counterGet(spawnCounter(unit))
`);
  const names = new Set(sigs.map((s) => s.name));
  for (const n of ["spawnCounter", "counterGet", "spawnRegistry", "registryPut", "registryGetPid"]) {
    assert.ok(names.has(n), `expected Actor export ${n} in signatures`);
  }
});

test("Verdict.Actor: counter server add/get in one cell", async () => {
  const { evalNotebookCells, createEffectStorage, vlib, finvm } = await loadLibs();
  const { ctx } = makeCtx(vlib, finvm, createEffectStorage);

  const src = `module Main exposing (main)
main : Int
main =
  let cnt = spawnCounter(unit) in
  let _ = counterAdd(cnt, 10) in
  counterGet(cnt)
`;

  const out = await evalNotebookCells(ctx, src, ["main"]);
  assert.equal(out[0]?.ok, true);
  assert.match(displayText(out[0]), /10/);
});

test("Verdict.Actor: counter increments twice in one cell", async () => {
  const { evalNotebookCells, createEffectStorage, vlib, finvm } = await loadLibs();
  const { ctx } = makeCtx(vlib, finvm, createEffectStorage);

  const src = `module Main exposing (main)
main : Int
main =
  let cnt = spawnCounter(unit) in
  let _ = counterAdd(cnt, 5) in
  let _ = counterAdd(cnt, 3) in
  counterGet(cnt)
`;

  const out = await evalNotebookCells(ctx, src, ["main"]);
  assert.equal(out[0]?.ok, true);
  assert.match(displayText(out[0]), /8/);
});

test("Verdict.Actor: registry register and lookup in one cell", async () => {
  const { evalNotebookCells, createEffectStorage, vlib, finvm } = await loadLibs();
  const { ctx } = makeCtx(vlib, finvm, createEffectStorage);

  const src = `module Main exposing (main)
main : Int
main =
  let reg = spawnRegistry(unit) in
  let cnt = spawnCounter(unit) in
  let _ = registryPut(reg, "counter", actorPid(cnt)) in
  let _ = counterAdd(cnt, 4) in
  counterGet(MkActorRef(registryGetPid(reg, "counter")))
`;

  const out = await evalNotebookCells(ctx, src, ["main"]);
  assert.equal(out[0]?.ok, true);
  assert.match(displayText(out[0]), /4/);
});

test("Verdict.Actor: spawned actors survive into a later cell run", async () => {
  const { evalNotebookCells, createEffectStorage, vlib, finvm, findProcess, FINVM_SNAPSHOT_KEY, countLiveProcesses } =
    await loadLibs();
  const { ctx, getState } = makeCtx(vlib, finvm, createEffectStorage);

  const src = `module Main exposing (main, step2)

main : Int
main =
  let reg = spawnRegistry(unit) in
  let cnt = spawnCounter(unit) in
  let _ = registryPut(reg, "counter", actorPid(cnt)) in
  let _ = counterAdd(cnt, 5) in
  counterGet(cnt)

step2 : Int
step2 = 0
`;

  const out1 = await evalNotebookCells(ctx, src, ["main"]);
  assert.equal(out1[0]?.ok, true);
  assert.match(displayText(out1[0]), /5/);

  const snap1 = getState()[FINVM_SNAPSHOT_KEY];
  assert.ok(countLiveProcesses(snap1) >= 2, "registry and counter should stay alive");

  const out2 = await evalNotebookCells(ctx, src, ["step2"]);
  assert.equal(out2[0]?.ok, true);

  const snap2 = getState()[FINVM_SNAPSHOT_KEY];
  assert.ok(findProcess(snap2, "p0") || findProcess(snap2, "p1"), "background actors remain after cell 2");
  assert.ok(countLiveProcesses(snap2) >= 2);
});

test("Verdict.Actor: sequential cell runs keep actor snapshot without batch eval", async () => {
  const { evalNotebookCells, createEffectStorage, vlib, finvm, countLiveProcesses, FINVM_SNAPSHOT_KEY } =
    await loadLibs();
  const { ctx, getState } = makeCtx(vlib, finvm, createEffectStorage);

  const src = `module Main exposing (main, step2)

main : Int
main =
  let cnt = spawnCounter(unit) in
  let _ = counterAdd(cnt, 2) in
  counterGet(cnt)

step2 : Int
step2 = 0
`;

  const out1 = await evalNotebookCells(ctx, src, ["main"]);
  assert.equal(out1[0]?.ok, true);
  assert.match(displayText(out1[0]), /2/);
  assert.ok(countLiveProcesses(getState()[FINVM_SNAPSHOT_KEY]) >= 1);

  const out2 = await evalNotebookCells(ctx, src, ["step2"]);
  assert.equal(out2[0]?.ok, true);
  assert.ok(countLiveProcesses(getState()[FINVM_SNAPSHOT_KEY]) >= 1);
});

test("Verdict.Actor: compile diagnostics for unknown binding still work", async () => {
  const vlib = await import(pathToFileURL(path.join(root, "public/lib/verdict-notebook.mjs")).href);
  const diags = vlib.diagnosticsJS(`module Main exposing (main)
main : Int
main = unknownActorHelper(unit)
`);
  const errors = diags.filter((d) => d.severity === "error");
  assert.ok(errors.length >= 1);
  assert.match(errors[0].message, /unknown/i);
});
