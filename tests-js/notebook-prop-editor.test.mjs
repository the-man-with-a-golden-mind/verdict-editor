import test from "node:test";
import assert from "node:assert/strict";
import path from "path";
import fs from "fs";
import { fileURLToPath, pathToFileURL } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("PropEditor: VERDICT_COLORS match Monaco verdict-dark palette", async () => {
  const mod = await import(
    pathToFileURL(path.join(root, "src/Notebook/VerdictSyntax.js")).href,
  );
  assert.equal(mod.VERDICT_COLORS.keyword, "#a78bfa");
  assert.equal(mod.VERDICT_COLORS.type, "#5eead4");
  assert.equal(mod.VERDICT_COLORS.string, "#fcd34d");
  assert.equal(mod.VERDICT_COLORS.number, "#f0abfc");
  assert.equal(mod.VERDICT_COLORS.lineHighlight, "#121829");
});

test("PropEditor: highlightVerdictToHtml marks types", async () => {
  const mod = await import(
    pathToFileURL(path.join(root, "src/Notebook/VerdictSyntax.js")).href,
  );
  const html = mod.highlightVerdictToHtml("x : Int\n");
  assert.match(html, /verdict-hl-type/);
});

test("PropEditor: highlightVerdictToHtml marks keywords and comments", async () => {
  const mod = await import(
    pathToFileURL(path.join(root, "src/Notebook/VerdictSyntax.js")).href,
  );
  const html = mod.highlightVerdictToHtml('let x = 1\n-- note\n');
  assert.match(html, /verdict-hl-line/);
  assert.match(html, /verdict-hl-keyword/);
  assert.match(html, /verdict-hl-comment/);
  assert.match(html, /verdict-hl-number/);
  assert.equal((html.match(/verdict-hl-line/g) ?? []).length, 3);
});

test("PropEditor: extractVerdictDocs reads -- blocks above bindings", async () => {
  const mod = await import(
    pathToFileURL(path.join(root, "src/Notebook/VerdictLanguageService.js")).href,
  );
  const src = "-- Computes sum\n-- | second line\nfoo x = x + 1\n";
  const docs = mod.extractVerdictDocs(src);
  assert.equal(docs.get("foo"), "Computes sum\nsecond line");
  assert.equal(mod.findDefinitionLine("foo x = 1\nbar y = 2\n", "bar"), 2);
});

test("PropEditor: verdictPrelude lists match keyword count", async () => {
  const mod = await import(pathToFileURL(path.join(root, "src/Notebook/VerdictSyntax.js")).href);
  assert.ok(mod.VERDICT_KEYWORDS.includes("let"));
  assert.ok(mod.VERDICT_PRELUDE_FUNCTIONS.includes("foldl"));
});

test("build: notebook.mjs has no Monaco", () => {
  const nb = fs.readFileSync(path.join(root, "public/lib/notebook.mjs"), "utf8");
  assert.doesNotMatch(nb, /MonacoFFI/);
  assert.doesNotMatch(nb, /monaco-editor/);
});

test("build: main vite bundle has no monaco-editor", () => {
  const dist = path.join(root, "dist/assets");
  if (!fs.existsSync(dist)) return;
  const files = fs.readdirSync(dist).filter((f) => f.endsWith(".js"));
  for (const f of files) {
    const txt = fs.readFileSync(path.join(dist, f), "utf8");
    assert.doesNotMatch(txt, /monaco-editor/);
  }
});

test("CM6: highlightVerdictToHtml works without Monaco", async () => {
  const mod = await import(
    pathToFileURL(path.join(root, "src/Notebook/VerdictSyntax.js")).href,
  );
  const html = mod.highlightVerdictToHtml("module Main exposing (main)");
  assert.match(html, /verdict-hl-keyword/);
  assert.doesNotMatch(html, /monaco/i);
});
