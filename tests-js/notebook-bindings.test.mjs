import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";
import { buildCellLineMap } from "./notebook-helpers.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function mapBindingsFromAst(astLib, materializedSource, cells) {
  if (!astLib?.astJS) return null;
  const res = astLib.astJS(materializedSource);
  if (!res.ok || !res.ast) return null;
  const mod = JSON.parse(res.ast);
  const codeCells = cells.filter((c) => c.kind === "code");
  const lineMap = buildCellLineMap(codeCells);
  const out = new Map();
  for (const cell of codeCells) out.set(cell.id, []);
  for (const decl of mod.decls ?? []) {
    const line = decl.body?.pos?.line;
    if (!decl.name || !line || (decl.params?.length ?? 0) > 0) continue;
    for (const cell of codeCells) {
      const span = lineMap.get(cell.id);
      if (!span || line < span.startLine || line > span.endLine) continue;
      out.get(cell.id).push(decl.name);
      break;
    }
  }
  return out;
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
