import test from "node:test";
import assert from "node:assert/strict";

function concatenateCode(cells) {
  return cells
    .filter((c) => c.kind === "code")
    .map((c) => (c.source ?? "").trim())
    .filter(Boolean)
    .join("\n\n");
}

function escapeField(s) {
  const needsQuote = /[",\n\r]/.test(s);
  if (needsQuote) return `"${String(s).replace(/"/g, '""')}"`;
  return String(s);
}

function rowsToCsv(rows) {
  return rows.map((r) => r.map(escapeField).join(",")).join("\n");
}

function decodeDisplay(raw) {
  if (raw == null) return null;
  let d = raw;
  if (typeof raw === "string") {
    try {
      d = JSON.parse(raw);
    } catch {
      return { kind: "text", text: raw };
    }
  }
  if (typeof d !== "object") return { kind: "text", text: String(d) };
  return d;
}

function renderTree(display) {
  if (!display) return { type: "empty" };
  if (display.kind === "text") return { type: "text", text: display.text };
  if (display.kind === "chart") return { type: "chart", traces: (display.traces ?? []).length };
  if (display.kind === "table") return { type: "table", rows: (display.rows ?? []).length };
  if (display.kind === "stack" || display.kind === "row" || display.kind === "col") {
    return { type: display.kind, items: (display.items ?? []).map(renderTree) };
  }
  return { type: "unknown" };
}

test("concatenateCode joins code cells in order, excludes wysiwyg", () => {
  const cells = [
    { kind: "code", source: "a = 1" },
    { kind: "wysiwyg", source: "# Notes" },
    { kind: "code", source: "b = 2" },
  ];
  assert.equal(concatenateCode(cells), "a = 1\n\nb = 2");
});

test("Display decode renders every kind including nested stack", () => {
  const stack = {
    kind: "stack",
    items: [
      { kind: "text", text: "hello" },
      {
        kind: "chart",
        title: "T",
        traces: [{ name: "s", kind: "line", x: [1], y: [2] }],
        xaxis: { title: "" },
        yaxis: { title: "" },
      },
      { kind: "table", rows: [{ a: 1 }] },
    ],
  };
  const tree = renderTree(decodeDisplay(stack));
  assert.equal(tree.type, "stack");
  assert.equal(tree.items.length, 3);
  assert.equal(tree.items[0].type, "text");
  assert.equal(tree.items[1].type, "chart");
  assert.equal(tree.items[2].type, "table");
});

test("CSV serialization escapes commas quotes newlines", () => {
  const csv = rowsToCsv([
    ["col", "val"],
    ["a", 'say "hi", friend'],
    ["b", "line1\nline2"],
  ]);
  assert.match(csv, /"say ""hi"", friend"/);
  assert.match(csv, /"line1\nline2"/);
});

test("binding name scan by decl name", () => {
  const source = "module Main\n\nx : Int\nx = 1\n\nhelper y = y";
  const names = [];
  for (const line of source.split("\n")) {
    const t = line.trim();
    const eq = t.indexOf(" =");
    if (eq > 0 && !t.startsWith("--")) {
      const name = t.slice(0, eq).trim();
      if (/^[a-z][a-zA-Z0-9_]*$/.test(name)) names.push(name);
    }
  }
  assert.deepEqual(names, ["x"]);
});
