// A gallery notebook that exercises every output widget — text + dBox styling,
// grid/section layout, charts, tabs, a fullscreen-able chart, and an exportable
// sheet. Useful as a live demo and as the manual surface for the output system.
// Mount it with mountVerdictEditor(host, galleryConfig()).

import type { EditorConfig } from '../editorConfig';
import { notebookDocFromCells, type NotebookSeedCell } from '../notebookSeed';

const GALLERY_SOURCE = [
  'module Main exposing (gallery)',
  'import Display exposing (..)',
  '',
  'gallery : Json',
  'gallery = dStack([',
  '  dBox("text-2xl font-bold text-indigo-300", dText("Widget gallery")),',
  '',
  '  dSection("Text and styling", [',
  '    dText("Plain markdown with **bold** and *italic*."),',
  '    dBox("text-xl text-amber-300", dText("Amber text via dBox")),',
  '    dBox("bg-slate-800 p-4 rounded-lg border border-slate-700 text-slate-200", dText("A boxed panel"))',
  '  ]),',
  '',
  '  dSection("Charts in a grid", [',
  '    dGrid(2, [',
  '      dChartY("Line", [dLine("a", [0,1,2,3,4], [10,40,30,60,50], "#34d399")], "x", "y"),',
  '      dChartY("Bars", [dBar("b", [0,1,2,3], [5,9,3,7], "#60a5fa")], "x", "y")',
  '    ])',
  '  ]),',
  '',
  '  dSection("Tabs", [',
  '    dTabs([',
  '      dTab("Overview", dText("The first tab holds plain text.")),',
  '      dTab("Chart", dChartY("Area", [dArea("c", [0,1,2,3,4], [2,5,3,8,6], "#fbbf24")], "x", "y")),',
  '      dTab("Data", dSheet([{ name = "A", value = 1 }, { name = "B", value = 2 }]))',
  '    ])',
  '  ]),',
  '',
  '  dSection("Fullscreen and sheet", [',
  '    dFull(dChartY("Fullscreen me", [dLine("d", [0,1,2,3], [1,3,2,4], "#a78bfa")], "x", "y")),',
  '    dSheet([{ symbol = "BTC", price = 64000 }, { symbol = "ETH", price = 3200 }])',
  '  ])',
  '])',
].join('\n');

export const GALLERY_CELLS: NotebookSeedCell[] = [
  { source: GALLERY_SOURCE, kind: 'code', role: 'runnable', path: 'Main.verdict', moduleName: 'Main' },
];

/** The gallery as a full EditorConfig (no inputs, the gallery document). */
export function galleryConfig(): EditorConfig {
  return { inputs: [], defaultDocument: notebookDocFromCells(GALLERY_CELLS) };
}
