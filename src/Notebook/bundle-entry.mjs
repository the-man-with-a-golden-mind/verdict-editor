export {
  mountNotebook,
  concatenateCodeExport,
  concatenateDocumentExport,
  bindingNamesExport,
  bindingNamesFromSourceExport,
  cellPreviewLineExport,
  seedSignatureExport,
  extractVerdictDocsExport,
  defaultCellUiExport,
  updateModelExport,
  escapeFieldExport,
  rowsToCsvExport,
  decodeDisplayKindExport,
  spreadsheetCsvExport,
  renderDisplayIntoExport,
  mountSpreadsheetViewExport,
  mountToolbarExport,
  mountGutterExport,
} from "./output/Main/index.js";

export { decodeDisplay, renderDisplayInto } from "./Display.js";

import { registerPsMountTable } from "./Spreadsheet.js";
import {
  mountSpreadsheetViewExport,
  mountToolbarExport as psMountToolbar,
  mountGutterExport as psMountGutter,
} from "./output/Main/index.js";
import * as PsSpaBrowser from "./output/PsSpa.Browser/foreign.js";

globalThis.__psSpaRenderDocumentOn = (host, documentConfig) => {
  if (!host) return;
  const rootId = "nb-ss-" + Math.random().toString(36).slice(2, 10);
  host.id = rootId;
  PsSpaBrowser.renderDocument({ rootId, document: documentConfig })();
};

globalThis.__notebookMountSpreadsheet = mountSpreadsheetViewExport;
registerPsMountTable(mountSpreadsheetViewExport);

// Mount the PureScript ps-spa toolbar into `host`, wiring each button to the
// supplied JS callback thunks (Effect Unit across FFI).
globalThis.__notebookMountToolbar = (host, props) => psMountToolbar(host, props);

// Mount the PureScript ps-spa cell gutter into `host` (the gutter container).
// Props carry fold/run state from the Model + JS action thunks (Effect Unit).
globalThis.__notebookMountGutter = (host, props) => psMountGutter(host, props);
