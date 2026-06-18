export {
  mountNotebook,
  concatenateCodeExport,
  bindingNamesExport,
  escapeFieldExport,
  rowsToCsvExport,
  decodeDisplayKindExport,
  spreadsheetCsvExport,
  renderDisplayIntoExport,
  mountSpreadsheetViewExport,
} from "./output/Main/index.js";

export { decodeDisplay, renderDisplayInto } from "./Display.js";

import { registerPsMountTable } from "./Spreadsheet.js";
import { mountSpreadsheetViewExport } from "./output/Main/index.js";
import * as PsSpaBrowser from "./output/PsSpa.Browser/foreign.js";

globalThis.__psSpaRenderDocumentOn = (host, documentConfig) => {
  if (!host) return;
  const rootId = "nb-ss-" + Math.random().toString(36).slice(2, 10);
  host.id = rootId;
  PsSpaBrowser.renderDocument({ rootId, document: documentConfig })();
};

globalThis.__notebookMountSpreadsheet = mountSpreadsheetViewExport;
registerPsMountTable(mountSpreadsheetViewExport);
