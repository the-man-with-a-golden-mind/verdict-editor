import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";

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
    getStorage: () => storage,
  };
}

const ACTOR_MODULE = `module Main exposing (main, worker, step2)

worker : Int
worker =
  let msg = recv() in
  99

main : Int
main =
  let pid = spawn(worker) in
  1

step2 : Int
step2 = 2
`;

const ACTOR_MODULE_V2 = ACTOR_MODULE.replace("step2 = 2", "step2 = 3");

test("finvmSnapshot: rebootMainInSnapshot keeps non-main processes", async () => {
  const { rebootMainInSnapshot } = await runnerPromise;
  const snap = {
    processes: [
      { pid: "main", status: { s: "completed", value: { int: "1" } }, function: "main" },
      { pid: "p0", status: { s: "waiting", cond: { w: "message" } }, function: "worker" },
    ],
    readyQueue: [],
    current: "p0",
  };
  const next = rebootMainInSnapshot(snap, "main", 4);
  assert.equal(next.processes.length, 2);
  assert.equal(next.processes[0].pid, "main");
  assert.equal(next.processes[0].status.s, "ready");
  assert.equal(next.processes[0].frame.pc, 0);
  assert.equal(next.processes[1].pid, "p0");
  assert.equal(next.readyQueue[0], "main");
});

test("finvmSnapshot: split/merge round-trips snapshot and source sig", async () => {
  const { mergeNotebookFinvmState, splitNotebookFinvmState, FINVM_DB_KEY, FINVM_SNAPSHOT_KEY } =
    await runnerPromise;
  const snap = { processes: [{ pid: "p0" }] };
  const merged = mergeNotebookFinvmState({
    userState: { counter: 1 },
    machineSnapshot: snap,
    sourceSig: "abc",
    dbState: { record: {} },
  });
  const split = splitNotebookFinvmState(merged);
  assert.deepEqual(split.userState, { counter: 1 });
  assert.deepEqual(split.machineSnapshot, snap);
  assert.equal(split.sourceSig, "abc");
  assert.ok(merged[FINVM_DB_KEY]);
  assert.ok(merged[FINVM_SNAPSHOT_KEY]);
});

test("FinVM actors: spawned worker survives into a later cell run", async () => {
  const {
    evalNotebookCells,
    createEffectStorage,
    vlib,
    finvm,
    findProcess,
    FINVM_SNAPSHOT_KEY,
  } = await loadLibs();
  const { ctx, getState } = makeCtx(vlib, finvm, createEffectStorage);

  const out1 = await evalNotebookCells(ctx, ACTOR_MODULE, ["main"]);
  assert.equal(out1[0]?.ok, true);
  assert.match(String(out1[0]?.display?.text ?? out1[0]?.json), /1/);

  const snap1 = getState()[FINVM_SNAPSHOT_KEY];
  assert.ok(snap1, "cell 1 should persist a machine snapshot");
  const worker1 = findProcess(snap1, "p0");
  assert.ok(worker1, "worker p0 should exist after cell 1");
  assert.equal(worker1.status?.s, "waiting");

  const out2 = await evalNotebookCells(ctx, ACTOR_MODULE, ["step2"]);
  assert.equal(out2[0]?.ok, true);
  assert.match(String(out2[0]?.display?.text ?? out2[0]?.json), /2/);

  const snap2 = getState()[FINVM_SNAPSHOT_KEY];
  const worker2 = findProcess(snap2, "p0");
  assert.ok(worker2, "worker p0 should still exist after cell 2");
  assert.equal(worker2.status?.s, "waiting");
  assert.equal(worker2.function, "worker");
});

test("FinVM actors: runAll-style sequential cells keep worker without prefix batch", async () => {
  const { evalNotebookCells, createEffectStorage, vlib, finvm, findProcess, FINVM_SNAPSHOT_KEY } =
    await loadLibs();
  const { ctx, getState } = makeCtx(vlib, finvm, createEffectStorage);

  const out1 = await evalNotebookCells(ctx, ACTOR_MODULE, ["main"]);
  assert.equal(out1[0]?.ok, true);
  const out2 = await evalNotebookCells(ctx, ACTOR_MODULE, ["step2"]);
  assert.equal(out2[0]?.ok, true);

  const snap = getState()[FINVM_SNAPSHOT_KEY];
  const worker = findProcess(snap, "p0");
  assert.ok(worker);
  assert.equal(worker.status?.s, "waiting");
});

test("FinVM actors: changed source invalidates snapshot (fresh scheduler)", async () => {
  const {
    evalNotebookCells,
    createEffectStorage,
    vlib,
    finvm,
    findProcess,
    FINVM_SNAPSHOT_KEY,
    countLiveProcesses,
  } = await loadLibs();
  const { ctx, getState } = makeCtx(vlib, finvm, createEffectStorage);

  await evalNotebookCells(ctx, ACTOR_MODULE, ["main"]);
  assert.ok(findProcess(getState()[FINVM_SNAPSHOT_KEY], "p0"));

  const out = await evalNotebookCells(ctx, ACTOR_MODULE_V2, ["step2"]);
  assert.equal(out[0]?.ok, true);
  assert.match(String(out[0]?.display?.text ?? out[0]?.json), /3/);

  const snap = getState()[FINVM_SNAPSHOT_KEY];
  assert.equal(findProcess(snap, "p0"), null, "stale worker should not survive source change");
  assert.ok(countLiveProcesses(snap) <= 1);
});

test("FinVM actors: cell2-only run works without prior snapshot", async () => {
  const { evalNotebookCells, createEffectStorage, vlib, finvm, FINVM_SNAPSHOT_KEY } = await loadLibs();
  const { ctx, getState } = makeCtx(vlib, finvm, createEffectStorage);

  const out = await evalNotebookCells(ctx, ACTOR_MODULE, ["step2"]);
  assert.equal(out[0]?.ok, true);
  assert.match(String(out[0]?.display?.text ?? out[0]?.json), /2/);
  assert.ok(getState()[FINVM_SNAPSHOT_KEY], "first run still stores snapshot");
});

test("FinVM actors: cache + db effects still persist alongside snapshot", async () => {
  const { evalNotebookCells, createEffectStorage, vlib, finvm } = await loadLibs();
  const { ctx, getStorage } = makeCtx(vlib, finvm, createEffectStorage);

  const src = `module Main exposing (seed, worker, followup)

worker : Int
worker = let msg = recv() in 0

seed : String
seed =
  let _ = spawn(worker) in
  let _ = cacheSet("ns", "k", "v") in
  dbInsert("t", { val = "x" })

followup : String
followup =
  let c = cacheGet("ns", "k") in
  if c == unit then "miss" else "hit"
`;

  await evalNotebookCells(ctx, src, ["seed"]);
  assert.equal(getStorage().cacheGet("ns", "k"), "v");
  assert.ok(getStorage().listDbTables().t?.length >= 1);

  const out2 = await evalNotebookCells(ctx, src, ["followup"]);
  assert.equal(out2[0]?.ok, true);
  assert.match(String(out2[0]?.display?.text ?? ""), /hit/);
});

test("FinVM actors: three sequential single-cell runs keep background worker", async () => {
  const { evalNotebookCells, createEffectStorage, vlib, finvm, findProcess, FINVM_SNAPSHOT_KEY } =
    await loadLibs();
  const { ctx, getState } = makeCtx(vlib, finvm, createEffectStorage);

  await evalNotebookCells(ctx, ACTOR_MODULE, ["main"]);
  await evalNotebookCells(ctx, ACTOR_MODULE, ["step2"]);
  const out3 = await evalNotebookCells(ctx, ACTOR_MODULE, ["main"]);
  assert.equal(out3[0]?.ok, true);

  const worker = findProcess(getState()[FINVM_SNAPSHOT_KEY], "p0");
  assert.ok(worker);
  assert.equal(worker.status?.s, "waiting");
});
