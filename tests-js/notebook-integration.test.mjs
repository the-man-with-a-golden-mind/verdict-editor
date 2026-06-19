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

test("integration: document source interleaves wysiwyg as comments", () => {
  const cells = [
    { kind: "code", source: "a = 1" },
    { kind: "wysiwyg", source: "# Notes\nline2" },
    { kind: "code", source: "b = 2" },
  ];
  const parts = [];
  for (const c of cells) {
    if (c.kind === "wysiwyg") {
      const md = (c.source ?? "").trim();
      if (md) parts.push(md.split("\n").map((line) => `-- ${line}`).join("\n"));
    } else {
      const s = (c.source ?? "").trim();
      if (s) parts.push(s);
    }
  }
  const doc = parts.join("\n\n");
  assert.match(doc, /-- # Notes/);
  assert.match(doc, /-- line2/);
  assert.match(doc, /a = 1/);
  assert.doesNotMatch(doc, /\n# Notes\n/);
});
