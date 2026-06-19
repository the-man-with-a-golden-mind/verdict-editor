import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "url";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { decodeDisplay } from "../src/Notebook/Display.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("display: decodeDisplay handles all kinds", () => {
  const stack = {
    kind: "stack",
    items: [
      { kind: "text", text: "hello" },
      {
        kind: "row",
        items: [
          {
            kind: "chart",
            title: "Demo",
            traces: [{ name: "s", kind: "line", x: [1, 2], y: [3, 4] }],
            xaxis: { title: "x" },
            yaxis: { title: "y" },
          },
        ],
      },
      { kind: "col", items: [{ kind: "table", rows: [{ a: 1 }] }] },
    ],
  };
  const d = decodeDisplay(stack);
  assert.equal(d.kind, "stack");
  assert.equal(d.items.length, 3);
  assert.equal(d.items[1].kind, "row");
  assert.equal(d.items[2].kind, "col");
});

test("display: spreadsheetCsvExport from PS", async () => {
  const mod = await import(pathToFileURL(path.join(root, "public/lib/notebook.mjs")).href);
  const csv = mod.spreadsheetCsvExport({
    headers: ["col", "val"],
    rows: [
      ["a", 'say "hi"'],
      ["b", "x"],
    ],
  });
  assert.match(csv, /col,val/);
  assert.match(csv, /"say ""hi"""/);
});

test("build: plotly is not bundled inside notebook.mjs", () => {
  const nb = fs.readFileSync(path.join(root, "public/lib/notebook.mjs"), "utf8");
  assert.doesNotMatch(nb, /plotly\.js-dist-min/);
  assert.ok(fs.existsSync(path.join(root, "public/lib/plotly.chunk.mjs")));
  const plotly = fs.statSync(path.join(root, "public/lib/plotly.chunk.mjs"));
  assert.ok(plotly.size > 500_000);
});

test("build: main vite bundle does not include plotly", () => {
  const dist = path.join(root, "dist/assets");
  if (!fs.existsSync(dist)) return;
  const files = fs.readdirSync(dist).filter((f) => f.endsWith(".js"));
  for (const f of files) {
    const txt = fs.readFileSync(path.join(dist, f), "utf8");
    assert.doesNotMatch(txt, /plotly\.js-dist-min/);
  }
});
