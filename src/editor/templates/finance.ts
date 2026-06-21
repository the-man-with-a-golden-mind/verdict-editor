// The finance demo (Binance producer + incremental backtest + Telegram alerts)
// as a reusable EditorConfig template. This used to be hardcoded as the editor's
// only default; it's now one template a host can opt into. The standalone app
// still falls back to it (see VerdictEditor), and the bindings test imports the
// same cell sources directly.

import defaultMarketSource from '../../../lib/verdict/Market.verdict?raw';
import { DEFAULT_NOTEBOOK_DECISION_CELL_LINES } from '../defaultNotebookDecisionCell.mjs';
import { DEFAULT_NOTEBOOK_SIM_CELL_LINES } from '../defaultNotebookSimCell.mjs';
import type { EditorConfig, InputFieldSpec } from '../editorConfig';
import { notebookDocFromCells, type NotebookSeedCell } from '../notebookSeed';

export const FINANCE_INPUTS: InputFieldSpec[] = [
  { key: 'symbol', default: 'BTCUSD', title: 'Binance symbol' },
  { key: 'assetsCsv', default: 'BTCUSD,ETHUSD,ADAUSD', title: 'Comma-separated assets' },
  { key: 'signalThreshold', type: 'number', default: 2 },
  { key: 'positionBias', type: 'number', default: 0 },
  { key: 'loopIntervalMs', type: 'number', default: 5000 },
  { key: 'historyCap', type: 'number', default: 240, title: 'Rolling price history cap (points)' },
  {
    key: 'curveCap',
    type: 'number',
    default: 0,
    title: 'Backtest curve length: 0 keeps the full history (unbounded); N keeps the last N bars.',
  },
  { key: 'telegramBotToken', default: '', placeholder: '123456:ABC...' },
  { key: 'telegramChatId', default: '', placeholder: '-100123456789' },
];

export const FINANCE_CELLS: NotebookSeedCell[] = [
  { source: defaultMarketSource.trim(), kind: 'code', role: 'module', path: 'Market.verdict', moduleName: 'Market' },
  {
    source: DEFAULT_NOTEBOOK_DECISION_CELL_LINES.join('\n'),
    kind: 'code',
    role: 'runnable',
    path: 'Main.verdict',
    moduleName: 'Main',
  },
  {
    source: DEFAULT_NOTEBOOK_SIM_CELL_LINES.join('\n'),
    kind: 'code',
    role: 'runnable',
    path: 'Backtest.verdict',
    moduleName: 'Backtest',
  },
];

/** The finance template as a full EditorConfig (document + matching inputs). */
export function financeConfig(): EditorConfig {
  return {
    inputs: FINANCE_INPUTS,
    defaultDocument: notebookDocFromCells(FINANCE_CELLS),
  };
}
