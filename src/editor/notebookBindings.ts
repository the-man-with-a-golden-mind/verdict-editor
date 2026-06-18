import { buildCellLineMap, type NotebookCellRef } from './notebookEval';
import {
  bindingNamesFromSourceScan,
  bindingNamesInCellCore,
  filterRunnableBindingNames,
  mapBindingsFromAstCore,
} from './notebookBindingsCore.mjs';

export type AstLib = {
  astJS: (src: string) => { ok: boolean; ast: string; error: string };
};

export { bindingNamesFromSourceScan };

/** Map nullary top-level bindings to cells using astJS decl body line positions. */
export function mapBindingsFromAst(
  astLib: AstLib | null,
  materializedSource: string,
  cells: NotebookCellRef[],
): Map<string, string[]> | null {
  return mapBindingsFromAstCore(astLib, materializedSource, cells, buildCellLineMap(cells));
}

export function bindingNamesInCell(
  cellId: string,
  cells: NotebookCellRef[],
  materializedSource: string,
  astLib: AstLib | null,
): string[] {
  return bindingNamesInCellCore(cellId, cells, materializedSource, astLib, buildCellLineMap);
}

export function filterCellBindingNamesToRunnable(
  programJson: string,
  names: string[],
): string[] {
  return filterRunnableBindingNames(programJson, names);
}
