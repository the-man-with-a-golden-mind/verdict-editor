import { defineConfig } from "vite";
import { psSpaVite } from "ps-spa/scripts/vite-plugin.mjs";

// NOTE: ps-spa's current spago invocation requires a newer Node runtime
// (`node:sqlite`). Keep it opt-in so the checked-in `public/app.js` can run on
// machines with older Node; set `PS_SPA_BUILD=1` when you want live PureScript
// regeneration.
const usePsSpaBuild = process.env.PS_SPA_BUILD === "1";
export default defineConfig({
  plugins: [
    ...(usePsSpaBuild ? [psSpaVite()] : []),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("plotly.js-dist-min")) return "plotly";
          if (id.includes("@codemirror") || id.includes("/codemirror")) return "codemirror";
        },
      },
    },
  },
});
