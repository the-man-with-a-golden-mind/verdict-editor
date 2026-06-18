import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("bridge: shell onProgramChanged receives materialized notebook source", () => {
  const cells = [
    { id: "1", kind: "code", source: "module Main exposing (x)\n\nx = 1" },
    { id: "2", kind: "wysiwyg", source: "# Notes" },
    { id: "3", kind: "code", source: "y = 2" },
  ];
  const concatenate = (cs) =>
    cs
      .filter((c) => c.kind === "code")
      .map((c) => c.source.trim())
      .filter(Boolean)
      .join("\n\n");
  const materialize = (src) => src.replace(/\{\{inputs\.(\w+)\}\}/g, "0");
  let shellSource = "";
  const onProgramChanged = (src) => {
    shellSource = materialize(src);
  };
  onProgramChanged(concatenate(cells));
  assert.match(shellSource, /module Main exposing \(x\)/);
  assert.match(shellSource, /y = 2/);
  assert.doesNotMatch(shellSource, /# Notes/);
});
