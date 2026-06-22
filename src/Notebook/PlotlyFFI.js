"use strict";

function loadPlotly(bridge) {
  if (bridge?.loadPlotly) return bridge.loadPlotly();
  return Promise.reject(new Error("Plotly loader not provided by bridge"));
}

const PALETTE = ["#34d399", "#60a5fa", "#f472b6", "#fbbf24", "#a78bfa", "#22d3ee"];

// Hex -> rgba string with alpha, for soft area fills.
function withAlpha(hex, alpha) {
  const h = String(hex || "").replace("#", "");
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function renderChartImpl(host) {
  return function (spec) {
    return function (bridge) {
      return async function () {
        const Plotly = await loadPlotly(bridge);
        const specTraces = spec?.traces ?? [];
        const hasY2 = specTraces.some((t) => t.axis === "y2" || t.yaxis === "y2");

        const traces = specTraces.map((t, i) => {
          const y = t.y ?? [];
          // Default the x axis to sample indices when a trace omits it.
          const x = t.x && t.x.length ? t.x : y.map((_, k) => k);
          const color = t.color ?? PALETTE[i % PALETTE.length];
          const kind = t.kind ?? "line";
          const onY2 = t.axis === "y2" || t.yaxis === "y2";
          const base = { name: t.name ?? `series ${i + 1}`, x, y, yaxis: onY2 ? "y2" : "y" };

          if (kind === "candlestick") {
            // OHLC candles: x + open/high/low/close lists.
            return {
              name: t.name ?? `series ${i + 1}`,
              x,
              open: t.open ?? [],
              high: t.high ?? [],
              low: t.low ?? [],
              close: t.close ?? [],
              type: "candlestick",
              yaxis: onY2 ? "y2" : "y",
              increasing: { line: { color: t.color || "#34d399" } },
              decreasing: { line: { color: "#f87171" } },
            };
          }
          if (kind === "histogram") {
            // Distribution of values (x = the samples).
            return { ...base, type: "histogram", marker: { color }, opacity: t.opacity ?? 0.78 };
          }
          if (kind === "bar") {
            return { ...base, type: "bar", marker: { color, line: { width: 0 } }, opacity: t.opacity ?? 0.85 };
          }
          const isArea = kind === "area";
          const isStep = kind === "step";
          const isMarkers = kind === "markers" || kind === "scatter";
          if (isMarkers) {
            // Buy/sell signal markers: colored symbols (e.g. triangle-up/down).
            const label = t.name ?? "trade";
            return {
              ...base,
              type: "scatter",
              mode: "markers+text",
              text: x.map(() => label),
              textposition: "top center",
              textfont: { size: 9, color },
              marker: {
                color,
                size: 14,
                symbol: t.symbol || "circle",
                line: { width: 2, color: "#0b0f1a" },
              },
              hovertemplate: `bar %{x}<br>%{y:,} cents<br>${label}<extra></extra>`,
            };
          }
          const trace = {
            ...base,
            type: "scatter",
            mode: "lines",
            line: {
              color,
              width: Number.isFinite(t.width) ? t.width : isStep ? 2.5 : 2,
              shape: isStep ? "hv" : "spline",
              dash: t.dash || "solid",
            },
            opacity: Number.isFinite(t.opacity) ? t.opacity : 1,
            hovertemplate: `bar %{x}<br>%{y:,}<extra>${t.name ?? ""}</extra>`,
          };
          if (isArea) {
            trace.fill = "tozeroy";
            trace.fillcolor = withAlpha(color, Number.isFinite(t.opacity) ? t.opacity : 0.22);
          }
          return trace;
        });

        // Vertical guides at buy/sell bars so trade timing is obvious on the price chart.
        const tradeGuides = [];
        for (const t of specTraces) {
          const kind = t.kind ?? "line";
          if (kind !== "markers" && kind !== "scatter") continue;
          const name = String(t.name ?? "").toLowerCase();
          const isBuy = name.includes("buy");
          const isSell = name.includes("sell");
          if (!isBuy && !isSell) continue;
          const guideColor = isBuy ? "rgba(52,211,153,0.35)" : "rgba(248,113,113,0.35)";
          for (const x of t.x ?? []) {
            tradeGuides.push({
              type: "line",
              x0: x,
              x1: x,
              y0: 0,
              y1: 1,
              yref: "paper",
              line: { color: guideColor, width: 1, dash: "dot" },
            });
          }
        }

        // Theme-aware palette: charts follow the IDE light/dark theme (class on
        // <html>) so they don't stay dark on a light page.
        const lightTheme =
          typeof document !== "undefined" && document.documentElement.classList.contains("theme-light");
        const T = lightTheme
          ? { paper: "#ffffff", plot: "#f8fafc", font: "#0f172a", grid: "#e2e8f0", zero: "#cbd5e1", line: "#cbd5e1", tick: "#475569", spike: "#94a3b8", hover: "#f1f5f9", hoverBorder: "#cbd5e1" }
          : { paper: "#0b0f1a", plot: "#0d1322", font: "#e2e8f0", grid: "#1e293b", zero: "#243049", line: "#243049", tick: "#94a3b8", spike: "#64748b", hover: "#0f172a", hoverBorder: "#334155" };

        const axisBase = {
          gridcolor: T.grid,
          zerolinecolor: T.zero,
          linecolor: T.line,
          tickfont: { size: 10, color: T.tick },
          showspikes: true,
          spikethickness: 1,
          spikedash: "dot",
          spikecolor: T.spike,
          spikemode: "across",
        };

        const compact = host?.dataset?.plotlyCompact === "1";
        const titleText = spec?.title ? String(spec.title) : "";
        const titleLines = titleText ? Math.ceil(titleText.length / (compact ? 28 : 48)) : 0;
        const legendPad = traces.length > 1 ? (compact ? 18 : 24) : 0;
        const titlePad = titleText ? 16 + titleLines * (compact ? 14 : 16) : 0;
        const topMargin = Math.max(compact ? 52 : 64, titlePad + legendPad);

        const layout = {
          title: titleText
            ? {
                text: titleText,
                font: { size: compact ? 11 : 14, color: T.font },
                pad: { t: 8, b: 4 },
                x: 0,
                xanchor: "left",
              }
            : "",
          paper_bgcolor: T.paper,
          plot_bgcolor: T.plot,
          font: { color: T.font, family: "JetBrains Mono, monospace", size: 11 },
          hovermode: "x unified",
          hoverlabel: { bgcolor: T.hover, bordercolor: T.hoverBorder, font: { size: 11 } },
          dragmode: "pan",
          // Preserve the viewer's zoom/pan/legend across live data updates: as long
          // as this is unchanged between Plotly.react calls on the same element,
          // Plotly keeps the current axis range instead of snapping to autorange.
          // Keyed by title so a genuinely different chart in the slot resets cleanly.
          uirevision: titleText || "verdict",
          showlegend: traces.length > 1,
          legend: {
            orientation: "h",
            y: compact ? 1.02 + titleLines * 0.06 : 1.08 + titleLines * 0.05,
            x: 0,
            font: { size: compact ? 9 : 10, color: "#cbd5e1" },
            bgcolor: "rgba(0,0,0,0)",
          },
          margin: { t: topMargin, r: hasY2 ? 56 : 22, b: 56, l: 58 },
          shapes: tradeGuides,
          xaxis: {
            ...axisBase,
            title: { text: spec?.xaxis?.title ?? "", font: { size: 10, color: "#64748b" } },
            ...(spec?.xaxis?.type === "log" ? { type: "log" } : {}),
            ...(Array.isArray(spec?.xaxis?.range) ? { range: spec.xaxis.range, autorange: false } : {}),
          },
          yaxis: {
            ...axisBase,
            title: { text: spec?.yaxis?.title ?? "", font: { size: 10, color: "#64748b" } },
            ...(spec?.yaxis?.type === "log" ? { type: "log" } : {}),
            ...(Array.isArray(spec?.yaxis?.range) ? { range: spec.yaxis.range, autorange: false } : {}),
          },
        };
        if (hasY2) {
          layout.yaxis2 = {
            title: { text: spec?.yaxis2?.title ?? "", font: { size: 10, color: "#64748b" } },
            overlaying: "y",
            side: "right",
            showgrid: false,
            zeroline: false,
            tickfont: { size: 10, color: "#94a3b8" },
          };
        }

        await Plotly.react(host, traces, layout, {
          responsive: true,
          displaylogo: false,
          scrollZoom: true,
          displayModeBar: true,
          modeBarButtons: [["zoomIn2d", "zoomOut2d"]],
        });
      };
    };
  };
}
