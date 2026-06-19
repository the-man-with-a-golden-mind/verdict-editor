/** Notebook cell metadata for the Visual tab (one AST render per cell). */
export type VizNotebookCell = {
  id: string;
  kind: 'code' | 'wysiwyg';
  source: string;
  index: number;
};

/** Wrap a cell fragment as a standalone module for `astJS` / compile. */
export function wrapCellModule(source: string): { text: string; lineOffset: number } {
  const body = source.trimEnd();
  if (!body) return { text: 'module Main exposing ()\n', lineOffset: 0 };
  if (/^\s*module\s+/m.test(body)) return { text: body, lineOffset: 0 };
  const text = `module Main exposing ()\n\n${body}\n`;
  // `module` line + blank line before the cell body.
  return { text, lineOffset: 2 };
}

export function cellVizPreview(cell: VizNotebookCell): string {
  if (cell.kind === 'wysiwyg') {
    const line = (cell.source || 'Text cell').split('\n')[0].trim();
    return line || 'Text cell';
  }
  const line = (cell.source || '').split('\n').find((l) => l.trim() && !l.trim().startsWith('--'));
  return (line ?? cell.source ?? '').trim() || 'Empty code cell';
}

export function collapsedDefKey(cellId: string, defName: string): string {
  return `${cellId}:${defName}`;
}
