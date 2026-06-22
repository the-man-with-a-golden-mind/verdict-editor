import { defineConfig } from "vite";

// Library build for embedding the editor in another service. Emits a
// self-contained <verdict-editor> element bundle + its CSS + the FinVM worker
// chunk into dist/embed. The runtime /lib/*.mjs bundles (compiler, FinVM,
// notebook UI, plotly, ast, hylograph) are copied alongside by
// scripts/copy-embed-lib.mjs. A host serves dist/embed and points
// EditorConfig.libBaseUrl at wherever it serves dist/embed/lib.
export default defineConfig({
  build: {
    outDir: "dist/embed",
    emptyOutDir: true,
    cssCodeSplit: false,
    target: "es2022",
    lib: {
      entry: "src/embed.ts",
      formats: ["es"],
      fileName: () => "verdict-editor.mjs",
      cssFileName: "verdict-editor",
    },
    rollupOptions: {
      // Keep the worker (and any lazy chunks) as separate files rather than
      // inlining, so `new Worker(new URL(...))` resolves to a real asset.
      output: { inlineDynamicImports: false },
    },
  },
  worker: { format: "es" },
  // Don't copy the whole public/ (the standalone app.js etc.) into the embed;
  // only the runtime lib bundles are copied, explicitly, by the build script.
  publicDir: false,
});
