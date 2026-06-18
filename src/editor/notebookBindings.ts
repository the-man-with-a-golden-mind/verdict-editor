import { buildCellLineMap, type NotebookCellRef } from './notebookEval';

type AstDecl = {
  name?: string;
  params?: unknown[];
  body?: { pos?: { line?: number } };
};

type AstModule = {
  decls?: AstDecl[];
};

export type AstLib = {
  astJS: (src: string) => { ok: boolean; ast: string; error: string };
};

export function bindingNamesFromSourceScan(source: string): string[] {
  const names: string[] = [];
  for (const line of String(source ?? '').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('--')) continue;
    const eq = t.indexOf(' =');
    if (eq > 0) {
      const name = t.slice(0, eq).trim();
      if (/^[a-z][a-zA-Z0-9_]*$/.test(name)) names.push(name);
    }
  }
  return names;
}

/** Map nullary top-level bindings to cells using astJS decl body line positions. */
export function mapBindingsFromAst(
  astLib: AstLib | null,
  materializedSource: string,
  cells: NotebookCellRef[],
): Map<string, string[]> | null {
  if (!astLib?.astJS) return null;
  const res = astLib.astJS(materializedSource);
  if (!res.ok || !res.ast) return null;
  let mod: AstModule;
  try {
    mod = JSON.parse(res.ast) as AstModule;
  } catch {
    return null;
  }

  const codeCells = cells.filter((c) => c.kind === 'code');
  const lineMap = buildCellLineMap(codeCells);
  const out = new Map<string, string[]>();
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

export function bindingNamesInCell(
  cellId: string,
  cells: NotebookCellRef[],
  materializedSource: string,
  astLib: AstLib | null,
): string[] {
  const astMap = mapBindingsFromAst(astLib, materializedSource, cells);
  if (astMap) {
    const fromAst = astMap.get(cellId);
    if (fromAst && fromAst.length > 0) return fromAst;
  }
  const cell = cells.find((c) => c.id === cellId);
  return cell?.kind === 'code' ? bindingNamesFromSourceScan(cell.source) : [];
}
