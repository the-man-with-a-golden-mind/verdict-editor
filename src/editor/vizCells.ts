/** Notebook cell metadata for the Visual tab (one AST render per cell). */
export type VizNotebookCell = {
  id: string;
  kind: 'code' | 'wysiwyg';
  role?: 'runnable' | 'module' | 'asset' | 'note';
  path?: string;
  moduleName?: string | null;
  source: string;
  index: number;
};

export type VizLineMapping = {
  sourceLine: number;
  cellId: string;
  cellLine: number;
};

export type VizModuleSection = {
  id: string;
  label: string;
  kind: 'module' | 'runnable' | 'text';
  preview: string;
  primaryCellId: string;
  cells: VizNotebookCell[];
  source: string;
  lineMap: VizLineMapping[];
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

const MODULE_RE = /^\s*module\s+([A-Z][A-Za-z0-9_.]*)\s+exposing\s*\([^)]*\)/m;
const IMPORT_RE = /^\s*import\s+[A-Z][A-Za-z0-9_.]*\b.*$/;

export function moduleNameFromSource(source: string): string | null {
  return source.match(MODULE_RE)?.[1] ?? null;
}

function cellModuleName(cell: VizNotebookCell): string {
  return cell.moduleName || moduleNameFromSource(cell.source) || 'Main';
}

function cellRole(cell: VizNotebookCell): 'module' | 'runnable' | 'asset' | 'note' {
  if (cell.role === 'module' || cell.role === 'runnable' || cell.role === 'asset' || cell.role === 'note') {
    return cell.role;
  }
  if (cell.kind === 'wysiwyg') return 'note';
  return cellModuleName(cell) === 'Main' ? 'runnable' : 'module';
}

function stripModuleLine(lines: string[]): Array<{ text: string; originalLine: number }> {
  return lines
    .map((text, index) => ({ text, originalLine: index + 1 }))
    .filter((line) => !/^\s*module\s+[A-Z][A-Za-z0-9_.]*\s+exposing\s*\([^)]*\)/.test(line.text));
}

function splitImports(lines: Array<{ text: string; originalLine: number }>): {
  imports: string[];
  body: Array<{ text: string; originalLine: number }>;
} {
  const imports: string[] = [];
  const body: Array<{ text: string; originalLine: number }> = [];
  for (const line of lines) {
    if (IMPORT_RE.test(line.text)) imports.push(line.text.trim());
    else body.push(line);
  }
  return { imports, body };
}

function moduleHeader(name: string): string {
  return `module ${name} exposing (..)`;
}

function buildModuleSource(moduleName: string, cells: VizNotebookCell[]): { source: string; lineMap: VizLineMapping[] } {
  const imports: string[] = [];
  const seenImports = new Set<string>();
  const bodies: Array<{ cell: VizNotebookCell; lines: Array<{ text: string; originalLine: number }> }> = [];

  for (const cell of cells.filter((c) => c.kind === 'code')) {
    const rawLines = (cell.source || '').trimEnd().split('\n');
    const stripped = stripModuleLine(rawLines);
    const parts = splitImports(stripped);
    for (const imp of parts.imports) {
      if (!seenImports.has(imp)) {
        seenImports.add(imp);
        imports.push(imp);
      }
    }
    bodies.push({ cell, lines: parts.body });
  }

  const output: string[] = [moduleHeader(moduleName), ...imports];
  const lineMap: VizLineMapping[] = [];
  if (output.length > 0) output.push('');

  for (const block of bodies) {
    while (block.lines.length && block.lines[0].text.trim() === '') block.lines.shift();
    while (block.lines.length && block.lines[block.lines.length - 1].text.trim() === '') block.lines.pop();
    if (!block.lines.length) continue;
    if (output[output.length - 1] !== '') output.push('');
    for (const line of block.lines) {
      output.push(line.text);
      lineMap.push({
        sourceLine: output.length,
        cellId: block.cell.id,
        cellLine: line.originalLine,
      });
    }
    output.push('');
  }

  return { source: output.join('\n').trimEnd() + '\n', lineMap };
}

export function notebookCellsToVizModules(cells: VizNotebookCell[]): VizModuleSection[] {
  const modules: VizModuleSection[] = [];
  const byName = new Map<string, VizModuleSection>();
  const textCells: VizNotebookCell[] = [];

  for (const cell of cells) {
    if (cell.kind === 'wysiwyg') {
      textCells.push(cell);
      continue;
    }
    const name = cellModuleName(cell);
    let section = byName.get(name);
    if (!section) {
      section = {
        id: `module:${name}`,
        label: cell.path || `${name}.verdict`,
        kind: cellRole(cell) === 'module' ? 'module' : 'runnable',
        preview: name,
        primaryCellId: cell.id,
        cells: [],
        source: '',
        lineMap: [],
      };
      byName.set(name, section);
      modules.push(section);
    }
    section.cells.push(cell);
    if (section.kind !== 'runnable' && cellRole(cell) === 'runnable') section.kind = 'runnable';
  }

  for (const section of modules) {
    const name = section.preview;
    const built = buildModuleSource(name, section.cells);
    section.source = built.source;
    section.lineMap = built.lineMap;
    section.preview = section.cells.map(cellVizPreview).find(Boolean) || name;
  }

  for (const cell of textCells) {
    modules.push({
      id: `text:${cell.id}`,
      label: cell.path || `Cell ${cell.index + 1}`,
      kind: 'text',
      preview: cellVizPreview(cell),
      primaryCellId: cell.id,
      cells: [cell],
      source: cell.source,
      lineMap: [],
    });
  }

  return modules;
}

export function mappedCellForLine(section: VizModuleSection, line: number): { cellId: string; line: number } {
  const mapped = section.lineMap.find((m) => m.sourceLine === line);
  return mapped ? { cellId: mapped.cellId, line: mapped.cellLine } : { cellId: section.primaryCellId, line };
}
