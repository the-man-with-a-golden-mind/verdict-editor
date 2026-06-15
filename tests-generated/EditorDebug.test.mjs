import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pageFile = path.join(root, "src/Pages/Editor/Debug.purs");
const generatedRouteFile = path.join(root, "src", "Generated", "Route.purs");
const generatedPagesFile = path.join(root, "src", "Generated", "Pages.purs");

test("EditorDebug page file exists", () => {
  assert.ok(fs.existsSync(pageFile));
});

test("EditorDebug route is registered", () => {
  const routeSource = fs.readFileSync(generatedRouteFile, "utf8");
  assert.match(routeSource, new RegExp("EditorDebug"));
  assert.match(routeSource, new RegExp("/editor/debug"));
});

test("EditorDebug page loader is registered", () => {
  const pagesSource = fs.readFileSync(generatedPagesFile, "utf8");
  assert.match(pagesSource, new RegExp("Pages\\.Editor\\.Debug"));
  assert.match(pagesSource, new RegExp("EditorDebug"));
});
