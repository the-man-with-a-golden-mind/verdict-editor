#!/usr/bin/env node
import esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

await esbuild.build({
  entryPoints: [path.join(root, "tests-js/notebook-eval-runner.entry.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: path.join(root, "tests-js/.notebook-eval-runner.mjs"),
});

console.log("Built tests-js/.notebook-eval-runner.mjs");
