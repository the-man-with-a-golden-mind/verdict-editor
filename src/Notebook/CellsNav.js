"use strict";

// Render the ps-spa Cells-nav Document into `host`, once connected so ps-spa can
// find it by id. Mirrors Gutter.js / Toolbar.js.
export function renderCellsNavPs(host) {
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
