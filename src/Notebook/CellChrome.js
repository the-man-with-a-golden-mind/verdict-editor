"use strict";

// Render a ps-spa Document into `host` once it's connected (mirrors
// Gutter.js / Toolbar.js). Used for the cell chrome pieces (head, diagnostics,
// code-folded bar, folded preview) that derive purely from the Model.
export function renderChromePs(host) {
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
      };
      paint();
    };
  };
}
