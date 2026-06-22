# Embedding the Verdict notebook editor

The `<verdict-editor>` is a configurable component. The same build runs as the
standalone browser app, a cloud editor backed by a DB, or a local server — each
with its own notebook(s) and effect backend. Verdict code runs identically
off-IDE; the host only swaps adapters.

## Config resolution order

1. `element.config` — a property set on the `<verdict-editor>` instance before it connects.
2. `window.__verdictEditorConfig[ data-config-id ?? 'default' ]` — a global registry (declarative hosts).
3. Built-in fallback — the **finance template**, so the standalone app keeps its demo.

`libBaseUrl` is read in `connectedCallback` (before the lib bundles fetch); everything else in `build()`.

## Programmatic mount

```ts
import { mountVerdictEditor, restAdapter } from '@/editor/mountVerdictEditor';

mountVerdictEditor(document.getElementById('host')!, {
  notebookId: 'nb-42',
  storage: restAdapter({ baseUrl: '/api/notebooks', headers: () => ({ authorization: `Bearer ${token}` }) }),
  inputs: [{ key: 'symbol', default: 'BTCUSD' }, { key: 'window', type: 'number', default: 20 }],
  theme: 'light',
  branding: { title: 'Acme Notebooks' },
});
```

## `EditorConfig`

| field | default | purpose |
|---|---|---|
| `notebookId` | `'default'` | which notebook the storage adapter loads/saves |
| `storage` | localStorage | `StorageAdapter` — `load(id)` / `save(id, doc)` (async) |
| `effects` | `{ kind: 'sandbox' }` | where db/cache/http run (see below) |
| `inputs` | `[]` | `InputFieldSpec[]` — the notebook-wide `__INPUT_*` fields |
| `defaultDocument` | blank | cold-start `.vnb` when storage is empty |
| `libBaseUrl` | `'/lib'` | base URL for the lazily-fetched `/lib/*.mjs` bundles |
| `branding.title` | `'Workspace'` | workspace header label |
| `theme` | persisted/dark | `'light' \| 'dark'` |

### Storage adapters (`./editor/storageAdapters`)
- `localStorageAdapter()` — single fixed key (the default; backward compatible).
- `namespacedLocalStorageAdapter(prefix?)` — one key per `notebookId` (many notebooks in the browser).
- `inMemoryAdapter(seed?)` — ephemeral (tests/demos).
- `restAdapter({ baseUrl, headers?, fetchImpl? })` — `GET`/`PUT {baseUrl}/{notebookId}` (cloud DB / local server; `headers` injects auth).

A host can implement `StorageAdapter` directly for any backend.

### Effect backends
- `{ kind: 'sandbox' }` — in-browser, in-memory, in a Web Worker (ephemeral; the default).
- `{ kind: 'custom', storage?, fetchImpl?, handlers? }` — runs on the main thread so a host-provided backend is reachable:
  - `storage` — a persistent / server-backed `EffectStorage` (db.insert/cache.set survive reloads).
  - `fetchImpl` — used for runtime `httpGet`/`httpPost` (e.g. a CORS proxy or auth-injecting fetch).
  - `handlers` — extra/override effect handlers, merged over the built-ins (keyed by `'http.get'`, `'db.insert'`, …).

```ts
// Cloud: persistent notebooks + server-backed effects + a proxy for runtime http.
mountVerdictEditor(host, {
  notebookId,
  storage: restAdapter({ baseUrl: '/api/notebooks', headers }),
  effects: {
    kind: 'custom',
    storage: myServerBackedEffectStorage,           // implements EffectStorage
    fetchImpl: (url, init) => fetch('/api/proxy?u=' + encodeURIComponent(String(url)), init),
  },
});
```

## Build a distributable (`dist/embed`)

To drop the editor into another service without vendoring this repo's source,
build the embed bundle:

```
npm run embed:build
```

This produces a self-contained, servable directory `dist/embed/`:

| file | what it is |
|---|---|
| `verdict-editor.mjs` | the `<verdict-editor>` element + the programmatic API (ESM) |
| `style.css` | the editor's styles — include once |
| `assets/finvmWorker-*.js` | the FinVM Web Worker chunk (resolved relative to the `.mjs`) |
| `lib/*.mjs` | the runtime bundles the editor fetches at load (compiler, FinVM, notebook UI, plotly, ast, hylograph) |
| `index.html` | a minimal integration example (also `examples/embed/index.html`) |

The host serves `dist/embed/` (or copies the pieces into its own asset
pipeline), includes `style.css`, imports `verdict-editor.mjs`, and mounts:

```html
<link rel="stylesheet" href="/assets/verdict/style.css" />
<div id="host"></div>
<script type="module">
  import { mountVerdictEditor, restAdapter } from "/assets/verdict/verdict-editor.mjs";
  mountVerdictEditor(document.getElementById("host"), {
    notebookId: currentNotebookId,
    libBaseUrl: "/assets/verdict/lib",                 // where you serve dist/embed/lib
    storage: restAdapter({ baseUrl: "/api/notebooks", headers: () => ({ authorization: `Bearer ${token}` }) }),
  });
</script>
```

Notes:
- The notebook UI (cell gutter, cells-nav, spreadsheet) lives in `lib/notebook.mjs`
  and **self-registers on load** — no separate app shell (`app.js`) is required.
- The Web Worker is emitted as its own chunk and located via `import.meta.url`, so
  it resolves wherever the `.mjs` is served. If the worker can't start, the editor
  falls back to main-thread evaluation. Re-bundling `verdict-editor.mjs` through a
  host bundler is fine as long as that bundler preserves `new URL(..., import.meta.url)`
  worker resolution.
- `libBaseUrl` lets the lib bundles live anywhere (a CDN, a versioned asset path).

## Notes
- The effect/runtime layer (`effectDriver.ts`, `notebookEval.ts`, `finvmClient.ts`) is TypeScript; the PureScript pieces are the UI components (cell gutter, cells-nav, project). Config/adapters live in TS alongside them.
- The standalone app's `public/app.js` (the ps-spa shell) is a prebuilt artifact, so the zero-config fallback stays the finance template rather than relying on a shell change.
- A worker-side custom effect backend (delegating db/http to the host over a MessageChannel) is a possible future optimization if main-thread eval ever becomes a bottleneck.
