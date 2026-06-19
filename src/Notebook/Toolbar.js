"use strict";

// Render a ps-spa Document into `host` via the global registered in
// bundle-entry.mjs. Mirrors Spreadsheet.js's renderSpreadsheetPs: wait until the
// host is connected to the document before painting so ps-spa can find it by id.
export function renderToolbarPs(host) {
  return function (doc) {
    return function () {
      if (!host || typeof host.appendChild !== "function") return;
      const paint = () => {
        if (!host.isConnected) {
          requestAnimationFrame(paint);
          return;
        }
        host.innerHTML = "";
        const render = globalThis.__psSpaRenderDocumentOn;
        if (render) render(host, doc);
        else host.innerHTML = '<div class="text-xs text-rose-400">Toolbar renderer not ready</div>';
      };
      paint();
    };
  };
}
