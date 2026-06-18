#!/usr/bin/env node
import { spawnSync } from "child_process";
import esbuild from "esbuild";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nbDir = path.join(root, "src/Notebook");
const spagoSrc = path.join(nbDir, "src");
const spago = path.join(root, "node_modules/.bin/spago");

function ensureSpagoSrc() {
  fs.mkdirSync(spagoSrc, { recursive: true });
  for (const name of fs.readdirSync(nbDir)) {
    if (!name.endsWith(".purs") && !name.endsWith(".js")) continue;
    if (name === "NotebookMount.js" || name === "SpreadsheetTable.js") continue;
    const target = path.join(spagoSrc, name);
    if (fs.existsSync(target)) fs.unlinkSync(target);
    fs.symlinkSync(path.join(nbDir, name), target);
  }
}

ensureSpagoSrc();

const jsCopies = [
  "Main.js",
  "NotebookMount.js",
  "Notebook.js",
  "WysiwygFFI.js",
  "Display.js",
  "Spreadsheet.js",
  "SpreadsheetTable.js",
  "MonacoFFI.js",
  "PlotlyFFI.js",
];

console.log("Building notebook PureScript…");
const build = spawnSync(spago, ["build"], { cwd: nbDir, stdio: "inherit", env: process.env });
if (build.status !== 0) process.exit(build.status ?? 1);

const entry = path.join(nbDir, "bundle-entry.mjs");
if (!fs.existsSync(entry)) {
  console.error("Missing", entry);
  process.exit(1);
}

console.log("Bundling notebook.mjs…");
const outRoot = path.join(nbDir, "output");
for (const dir of fs.readdirSync(outRoot)) {
  const full = path.join(outRoot, dir);
  if (!fs.statSync(full).isDirectory()) continue;
  for (const js of jsCopies) {
    const src = path.join(nbDir, js);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(full, js));
  }
}
const outMain = path.join(nbDir, "output/Main");
await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  minify: true,
  format: "esm",
  outfile: path.join(root, "public/lib/notebook.mjs"),
  platform: "browser",
  external: [],
});

console.log("Bundling plotly.chunk.mjs…");
await esbuild.build({
  entryPoints: [path.join(root, "node_modules/plotly.js-dist-min/plotly.min.js")],
  bundle: true,
  minify: true,
  format: "esm",
  outfile: path.join(root, "public/lib/plotly.chunk.mjs"),
  platform: "browser",
});

console.log("Done.");
