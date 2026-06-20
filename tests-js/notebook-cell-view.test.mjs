import test from "node:test";
import assert from "node:assert/strict";
import { cellViewPlan } from "../public/lib/notebook.mjs";

// Base input: an unfolded, focused, non-maximized runnable code cell.
function input(overrides = {}) {
  return {
    kind: "code",
    focused: false,
    isMax: false,
    folded: false,
    codeFolded: false,
    outputFolded: false,
    editorResized: false,
    editorHeight: 160,
    outputResized: false,
    outputHeight: 180,
    lineCount: 1,
    viewportHeight: 900,
    ...overrides,
  };
}

test("cell view: folded module cell -> showFolded true", () => {
  const plan = cellViewPlan(input({ kind: "code", folded: true }));
  assert.equal(plan.showFolded, true);
});

test("cell view: maximized never folds inline", () => {
  const plan = cellViewPlan(input({ folded: true, isMax: true }));
  assert.equal(plan.showFolded, false);
});

test("cell view: unfolded runnable cell with many lines caps at viewport/3", () => {
  // lineCount 200 -> autoH huge; capped to round(900/3) = 300.
  const plan = cellViewPlan(input({ lineCount: 200, viewportHeight: 900 }));
  assert.equal(plan.editorHeightPx, 300);
});

test("cell view: resized cell pins clamped editor height", () => {
  const plan = cellViewPlan(input({ editorResized: true, editorHeight: 520 }));
  assert.equal(plan.editorHeightPx, 520);
});

test("cell view: resized cell clamps to maxEditorHeightPx", () => {
  const plan = cellViewPlan(input({ editorResized: true, editorHeight: 9000 }));
  assert.equal(plan.maxEditorHeightPx, 1600);
  assert.equal(plan.editorHeightPx, 1600);
});

test("cell view: wrap class reflects focus", () => {
  const focused = cellViewPlan(input({ focused: true }));
  const blurred = cellViewPlan(input({ focused: false }));
  assert.ok(focused.wrapClass.includes("border-indigo-400/70"));
  assert.ok(blurred.wrapClass.includes("border-slate-800"));
});

test("cell view: code-folded code cell shows the bar, not the editor", () => {
  const plan = cellViewPlan(input({ codeFolded: true }));
  assert.equal(plan.showCodeFoldedBar, true);
  assert.equal(plan.showEditorSection, false);
});

test("cell view: output sizing modes", () => {
  assert.equal(cellViewPlan(input({ isMax: true })).outputMode, "none");
  assert.equal(cellViewPlan(input({ outputResized: true })).outputMode, "pinned");
  assert.equal(cellViewPlan(input()).outputMode, "capped");
  assert.equal(cellViewPlan(input({ outputHeight: 50 })).outputHeightPx, 96);
});
