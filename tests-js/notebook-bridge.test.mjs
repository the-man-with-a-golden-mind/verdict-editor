import test from "node:test";
import assert from "node:assert/strict";
import { concatenateCode, mapDiagnosticsToCells, buildCellLineMap } from "./notebook-helpers.mjs";

test("bridge: notebookSource reflects concatenation", () => {
  const cells = [
    { id: "1", kind: "code", source: "a = 1" },
    { id: "2", kind: "wysiwyg", source: "notes" },
    { id: "3", kind: "code", source: "b = 2" },
  ];
  assert.equal(concatenateCode(cells), "a = 1\n\nb = 2");
});

test("bridge: onProgramChanged receives concatenated code-only source", () => {
  const cells = [
    { id: "1", kind: "code", source: "x = 1" },
    { id: "2", kind: "wysiwyg", source: "hidden notes" },
  ];
  let seen = "";
  const onProgramChanged = (src) => {
    seen = src;
  };
  onProgramChanged(concatenateCode(cells));
  assert.equal(seen, "x = 1");
  assert.doesNotMatch(seen, /hidden notes/);
});

test("bridge: diagnostics map to cell + line", () => {
  const cells = [
    { id: "c1", kind: "code", source: "module M\n\nx = 1" },
    { id: "c2", kind: "code", source: "y = bad" },
  ];
  const span2 = buildCellLineMap(cells).get("c2");
  assert.ok(span2);
  const diags = mapDiagnosticsToCells(
    [{ line: span2.startLine, message: "type error", severity: "error" }],
    cells,
  );
  assert.equal(diags.c2?.[0]?.line, 1);
});
