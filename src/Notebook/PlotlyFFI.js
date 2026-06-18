"use strict";

function loadPlotly(bridge) {
  if (bridge?.loadPlotly) return bridge.loadPlotly();
  return Promise.reject(new Error("Plotly loader not provided by bridge"));
}

export function renderChartImpl(host) {
  return function (spec) {
    return function (bridge) {
      return async function () {
        const Plotly = await loadPlotly(bridge);
        const traces = (spec?.traces ?? []).map((t) => ({
          name: t.name ?? "",
          type: t.kind === "bar" ? "bar" : "scatter",
          mode: t.kind === "bar" ? "" : t.kind === "line" ? "lines" : "markers",
          x: t.x ?? [],
          y: t.y ?? [],
        }));
        await Plotly.react(
          host,
          traces,
          {
            title: spec?.title ?? "",
            paper_bgcolor: "#0b0f1a",
            plot_bgcolor: "#121829",
            font: { color: "#e2e8f0", family: "JetBrains Mono, monospace", size: 11 },
            xaxis: { title: spec?.xaxis?.title ?? "", gridcolor: "#1e293b" },
            yaxis: { title: spec?.yaxis?.title ?? "", gridcolor: "#1e293b" },
            margin: { t: 40, r: 20, b: 40, l: 50 },
          },
          { responsive: true },
        );
      };
    };
  };
}
