import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";
import { vmValueToDisplay } from "./notebook-helpers.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("integration: vmValueToDisplay table from List record typeSig", () => {
  const display = vmValueToDisplay(
    { list: [{ record: { name: { string: "a" }, n: { int: "1" } } }] },
    "List { name : String, n : Int }",
  );
  assert.equal(display.kind, "table");
  assert.equal(display.rows.length, 1);
  assert.equal(display.rows[0].name, "a");
});

test("integration: Display stack kind decodes", () => {
  const stack = {
    kind: "stack",
    items: [{ kind: "text", text: "hi" }, { kind: "table", rows: [{ a: 1 }] }],
  };
  assert.equal(stack.items.length, 2);
});

test("integration: notebook.mjs PS exports decode display kinds", async () => {
  const mod = await import(pathToFileURL(path.join(root, "public/lib/notebook.mjs")).href);
  const decode = mod.decodeDisplayKindExport;
  assert.equal(typeof decode, "function");
  assert.equal(decode({ kind: "chart" }), "chart");
  assert.equal(decode({ kind: "stack" }), "stack");
  assert.equal(decode({ kind: "row" }), "row");
  assert.equal(decode({ kind: "col" }), "col");
});

test("integration: notebook.mjs bindingNamesExport scans decl names", async () => {
  const mod = await import(pathToFileURL(path.join(root, "public/lib/notebook.mjs")).href);
  const names = mod.bindingNamesExport({
    id: "1",
    kind: "code",
    source: "module Main\n\nx : Int\nx = 1\n\nhelper y = y",
  });
  assert.deepEqual(names, ["x"]);
});

test("integration: notebook.mjs seedSignatureExport matches djb2", async () => {
  const mod = await import(pathToFileURL(path.join(root, "public/lib/notebook.mjs")).href);
  const sig = mod.seedSignatureExport("hello");
  assert.match(sig, /^5:\d+$/);
  assert.equal(sig, mod.seedSignatureExport("hello"));
});

test("integration: notebook.mjs extractVerdictDocsExport reads comments", async () => {
  const mod = await import(pathToFileURL(path.join(root, "public/lib/notebook.mjs")).href);
  const docs = mod.extractVerdictDocsExport("-- | Adds two numbers\nadd x y = x + y");
  assert.equal(docs.length, 1);
  assert.equal(docs[0].name, "add");
  assert.match(docs[0].doc, /Adds two numbers/);
});

test("integration: document source interleaves wysiwyg as comments", async () => {
  const mod = await import(pathToFileURL(path.join(root, "public/lib/notebook.mjs")).href);
  const cells = [
    { id: "1", kind: "code", source: "a = 1" },
    { id: "2", kind: "wysiwyg", source: "# Notes\nline2" },
    { id: "3", kind: "code", source: "b = 2" },
  ];
  const doc = mod.concatenateDocumentExport(cells);
  assert.match(doc, /-- # Notes/);
  assert.match(doc, /-- line2/);
  assert.match(doc, /a = 1/);
  assert.doesNotMatch(doc, /\n# Notes\n/);
});

test("integration: PureScript model update handles cell operations", async () => {
  const mod = await import(pathToFileURL(path.join(root, "public/lib/notebook.mjs")).href);
  const ui = mod.defaultCellUiExport(undefined);
  const cell = (id, kind = "code", source = "", cellUi = ui) => ({ id, kind, source, ui: cellUi });
  const msg = (patch) => ({
    tag: "",
    id: "",
    kind: "code",
    delta: 0,
    source: "",
    folded: false,
    height: 0,
    cell: cell(""),
    fallbackCell: cell("fallback"),
    cells: [],
    ...patch,
  });

  const initial = {
    cells: [cell("a", "code", "a = 1"), cell("b", "code", "b = 2")],
    focusedId: "a",
    maximizedId: null,
  };
  const inserted = mod.updateModelExport(initial, msg({ tag: "insertBelow", id: "a", cell: cell("c") }));
  assert.deepEqual(inserted.cells.map((c) => c.id), ["a", "c", "b"]);
  assert.equal(inserted.focusedId, "c");

  const moved = mod.updateModelExport(inserted, msg({ tag: "moveCell", id: "c", delta: 99 }));
  assert.deepEqual(moved.cells.map((c) => c.id), ["a", "b", "c"]);

  const folded = mod.updateModelExport(moved, msg({ tag: "toggleFold", id: "b" }));
  assert.equal(folded.cells.find((c) => c.id === "b")?.ui.folded, true);

  const deleted = mod.updateModelExport(
    { cells: [cell("only")], focusedId: "only", maximizedId: "only" },
    msg({ tag: "deleteCell", id: "only", fallbackCell: cell("fallback") }),
  );
  assert.deepEqual(deleted.cells.map((c) => c.id), ["fallback"]);
  assert.equal(deleted.focusedId, "fallback");
  assert.equal(deleted.maximizedId, null);

  const sourced = mod.updateModelExport(initial, msg({ tag: "setSource", id: "b", source: "b = 99" }));
  assert.equal(sourced.cells.find((c) => c.id === "b")?.source, "b = 99");
  assert.equal(sourced.focusedId, "a", "setSource must not steal focus");

  const maxed = mod.updateModelExport(initial, msg({ tag: "maximize", id: "b" }));
  assert.equal(maxed.maximizedId, "b");
  const unmaxed = mod.updateModelExport(maxed, msg({ tag: "maximize", id: "b" }));
  assert.equal(unmaxed.maximizedId, null);
  assert.equal(unmaxed.focusedId, "b");

  const resized = mod.updateModelExport(initial, msg({ tag: "setEditorHeight", id: "a", height: 12 }));
  const resizedUi = resized.cells.find((c) => c.id === "a")?.ui;
  assert.equal(resizedUi?.editorHeight, 48);
  assert.equal(resizedUi?.editorResized, true);

  const replacedEmpty = mod.updateModelExport(initial, msg({ tag: "replaceCells", cells: [] }));
  assert.equal(replacedEmpty.cells.length, 1, "replaceCells keeps at least one cell");
  assert.equal(replacedEmpty.cells[0].kind, "code");
});
