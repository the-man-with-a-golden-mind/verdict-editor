"use strict";

// Render a ps-spa Document into `host` via the global registered in
// bundle-entry.mjs. Mirrors Toolbar.js's renderToolbarPs: paint once the host
// is connected so ps-spa can find it by id. The gutter is mounted as the only
// child of the gutter container; we wrap it so the container's own flex layout
// classes still apply to the rendered controls.
export function renderGutterPs(host) {
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
