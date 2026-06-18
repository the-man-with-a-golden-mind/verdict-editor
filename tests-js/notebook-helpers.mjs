/** @typedef {{ id: string, kind: string, source: string }} Cell */

export function concatenateCode(cells) {
  return cells
    .filter((c) => c.kind === "code")
    .map((c) => (c.source ?? "").trim())
    .filter(Boolean)
    .join("\n\n");
}

export function buildCellLineMap(cells) {
  const map = new Map();
  let line = 1;
  const codeCells = cells.filter((c) => c.kind === "code");
  for (let i = 0; i < codeCells.length; i++) {
    const cell = codeCells[i];
    const startLine = line;
    line += cell.source.split("\n").length;
    map.set(cell.id, { startLine, endLine: line - 1 });
    if (i < codeCells.length - 1) line += 1;
  }
  return map;
}

export function mapDiagnosticsToCells(diagnostics, cells) {
  const lineMap = buildCellLineMap(cells);
  const out = {};
  for (const d of diagnostics) {
    if (d.severity === "warning") continue;
    for (const cell of cells) {
      if (cell.kind !== "code") continue;
      const span = lineMap.get(cell.id);
      if (!span || d.line < span.startLine || d.line > span.endLine) continue;
      if (!out[cell.id]) out[cell.id] = [];
      out[cell.id].push({ line: d.line - span.startLine + 1, message: d.message });
    }
  }
  return out;
}

export function vmValueToDisplay(value, typeSig) {
  if (value && typeof value === "object" && typeof value.kind === "string") {
    return value;
  }
  const isRecordList = /List\s*\{/.test(typeSig);
  if (Array.isArray(value)) {
    if (isRecordList) {
      const rows = value.map((item) => {
        const rec = item?.record ?? item ?? {};
        const row = {};
        for (const [k, v] of Object.entries(rec)) row[k] = scalar(v);
        return row;
      });
      return { kind: "table", rows };
    }
    return { kind: "text", text: value.map(scalar).join(", ") };
  }
  if (value && typeof value === "object" && "list" in value && Array.isArray(value.list)) {
    if (isRecordList) {
      const rows = value.list.map((item) => {
        const rec = item?.record ?? item ?? {};
        const row = {};
        for (const [k, v] of Object.entries(rec)) row[k] = scalar(v);
        return row;
      });
      return { kind: "table", rows };
    }
    return { kind: "text", text: value.list.map(scalar).join(", ") };
  }
  if (value && typeof value === "object" && "string" in value) {
    return { kind: "text", text: String(value.string) };
  }
  if (value && typeof value === "object" && "int" in value) {
    return { kind: "text", text: String(value.int) };
  }
  return { kind: "text", text: JSON.stringify(value) };
}

function scalar(v) {
  if (v == null) return "";
  if (typeof v === "object") {
    if ("string" in v) return String(v.string);
    if ("int" in v) return String(v.int);
    if ("bool" in v) return String(v.bool);
  }
  return String(v);
}
