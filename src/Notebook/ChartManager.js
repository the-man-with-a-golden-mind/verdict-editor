"use strict";

// Out-of-band manager for the imperative chart leaves of the PureScript output
// renderer (Notebook.Output). The renderer emits stable keyed placeholder nodes
// (`<div data-chart-key=...>`); after each diffing render it calls `syncCharts`,
// which reconciles the Plotly instances against the live placeholders:
//   - existing key  -> Plotly.react (diffs data, KEEPS zoom/pan via uirevision),
//   - new key       -> first react mounts it + we attach a ResizeObserver so the
//                      chart always fits its column (kills the overflow class and
//                      handles panel-resize, which window-resize-only never did),
//   - removed key   -> Plotly.purge + disconnect its observer.
// One manager instance per output host, cached on the host element. Plotly is
// loaded lazily through the bridge (same loader the rest of the notebook uses).

import { renderChartImpl } from "./PlotlyFFI.js";

const MANAGER = Symbol("verdictChartManager");

function scheduleResize(plotlyP, el) {
  // Debounce to a frame so a burst of layout changes triggers one resize.
  if (el.__resizePending) return;
  el.__resizePending = true;
  requestAnimationFrame(() => {
    el.__resizePending = false;
    if (!el.isConnected) return;
    plotlyP.then((Plotly) => {
      try {
        Plotly.Plots.resize(el);
      } catch {
        /* element torn down between frames — ignore */
      }
    });
  });
}

function purge(plotlyP, el) {
  plotlyP.then((Plotly) => {
    try {
      Plotly.purge(el);
    } catch {
      /* already gone */
    }
  });
}

function createManager(bridge) {
  const plotlyP = Promise.resolve(bridge.loadPlotly());
  const instances = new Map(); // key -> { el, observer }
  return {
    // specs: Array<{ key: string, spec: object }> in document order.
    async sync(host, specs) {
      const seen = new Set();
      for (const { key, spec } of specs) {
        seen.add(key);
        const el = host.querySelector(`[data-chart-key="${cssEscapeAttr(key)}"]`);
        if (!el) continue;
        // react draws (and on the first call, mounts) the plot in place; with the
        // layout's stable uirevision it preserves the viewer's zoom/pan.
        await renderChartImpl(el)(spec)(bridge)();
        if (!instances.has(key)) {
          const observer = new ResizeObserver(() => scheduleResize(plotlyP, el));
          observer.observe(el);
          instances.set(key, { el, observer });
        } else {
          instances.get(key).el = el;
        }
      }
      for (const [key, inst] of instances) {
        if (!seen.has(key)) {
          inst.observer.disconnect();
          purge(plotlyP, inst.el);
          instances.delete(key);
        }
      }
    },
    destroy() {
      for (const inst of instances.values()) {
        inst.observer.disconnect();
        purge(plotlyP, inst.el);
      }
      instances.clear();
    },
  };
}

// Attribute-selector escaping for arbitrary chart keys (paths like "0/1/2").
function cssEscapeAttr(s) {
  return String(s).replace(/["\\]/g, "\\$&");
}

/** Get-or-create the chart manager bound to `host`. */
export function chartManagerFor(host, bridge) {
  if (!host[MANAGER]) host[MANAGER] = createManager(bridge);
  return host[MANAGER];
}

/** Tear down the manager on `host` (cell removed / notebook reset). */
export function destroyChartManager(host) {
  if (host[MANAGER]) {
    host[MANAGER].destroy();
    delete host[MANAGER];
  }
}
