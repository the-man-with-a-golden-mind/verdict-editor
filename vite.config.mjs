import { defineConfig } from "vite";
import { psSpaVite } from "ps-spa/scripts/vite-plugin.mjs";

// Monaco workers are wired up via Vite's native `?worker` imports in
// src/VerdictEditor.ts (MonacoEnvironment.getWorker). That works in both dev
// and build, so we no longer need vite-plugin-monaco-editor.
//
// NOTE: ps-spa's current spago invocation requires a newer Node runtime
// (`node:sqlite`). Keep it opt-in so the checked-in `public/app.js` can run on
// machines with older Node; set `PS_SPA_BUILD=1` when you want live PureScript
// regeneration.
const usePsSpaBuild = process.env.PS_SPA_BUILD === "1";
export default defineConfig({
  plugins: [
    ...(usePsSpaBuild ? [psSpaVite()] : []),
  ],
  optimizeDeps: {
    // Pre-bundle Monaco with esbuild on first run. Without this, dev serves Monaco
    // as hundreds of individual ESM modules, so a cold load is hundreds of HTTP
    // round-trips (several seconds). Bundling collapses that to a handful of
    // requests; the result is cached in node_modules/.vite.
    include: ["monaco-editor/esm/vs/editor/editor.api"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("plotly.js-dist-min")) return "plotly";
          if (!id.includes("node_modules/monaco-editor/esm/")) return;
          // Keep Monaco in one chunk to avoid runtime TDZ/circular init issues
          // caused by aggressive cross-chunk splitting.
          return "monaco-editor";
        },
      },
    },
  },
  worker: {
    format: "es",
  },
});
