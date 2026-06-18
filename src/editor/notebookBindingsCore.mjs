/** @typedef {{ id: string, kind: string, source: string, startLine?: number }} NotebookCellRef */

/**
 * Fallback scan for top-level bindings when astJS is unavailable.
 * Ignores indented lines (record fields, let bodies) and record-field shorthands.
 */
export function bindingNamesFromSourceScan(source) {
  const names = [];
  for (const line of String(source ?? '').split('\n')) {
    if (line.startsWith(' ') || line.startsWith('\t')) continue;
    const t = line.trim();
    if (!t || t.startsWith('--')) continue;
    if (t.startsWith('let ')) continue;
    const eq = t.indexOf(' =');
    if (eq <= 0) continue;
    const name = t.slice(0, eq).trim();
    if (!/^[a-z][a-zA-Z0-9_]*$/.test(name)) continue;
    const rhs = t.slice(eq + 2).trim();
    if (rhs === name || rhs.startsWith(`${name},`) || rhs.startsWith(`${name} }`)) continue;
    names.push(name);
  }
  return names;
}

/** @param {Map<string, { startLine: number, endLine: number }>} lineMap */
export function mapBindingsFromAstCore(astLib, materializedSource, cells, lineMap) {
  if (!astLib?.astJS) return null;
  const res = astLib.astJS(materializedSource);
  if (!res.ok || !res.ast) return null;
  let mod;
  try {
    mod = JSON.parse(res.ast);
  } catch {
    return null;
  }

  const codeCells = cells.filter((c) => c.kind === 'code');
  /** @type {Map<string, string[]>} */
  const out = new Map();
  for (const cell of codeCells) out.set(cell.id, []);

  for (const decl of mod.decls ?? []) {
    const name = decl.name;
    const line = decl.body?.pos?.line;
    if (!name || !line || (decl.params?.length ?? 0) > 0) continue;
    for (const cell of codeCells) {
      const span = lineMap.get(cell.id);
      if (!span || line < span.startLine || line > span.endLine) continue;
      out.get(cell.id)?.push(name);
      break;
    }
  }

  return out;
}

/**
 * @param {string} cellId
 * @param {NotebookCellRef[]} cells
 * @param {string} materializedSource
 * @param {import('./notebookBindingsCore.mjs').AstLib | null} astLib
 * @param {(cells: NotebookCellRef[]) => Map<string, { startLine: number, endLine: number }>} buildLineMap
 */
export function bindingNamesInCellCore(cellId, cells, materializedSource, astLib, buildLineMap) {
  const astMap = mapBindingsFromAstCore(astLib, materializedSource, cells, buildLineMap(cells));
  if (astMap) {
    return astMap.get(cellId) ?? [];
  }
  const cell = cells.find((c) => c.id === cellId);
  return cell?.kind === 'code' ? bindingNamesFromSourceScan(cell.source) : [];
}

/** @param {string} programJson */
export function filterRunnableBindingNames(programJson, names) {
  try {
    const program = JSON.parse(programJson);
    const fns = program?.functions;
    if (!fns || typeof fns !== 'object') return names;
    return names.filter((n) => Object.prototype.hasOwnProperty.call(fns, n));
  } catch {
    return names;
  }
}
