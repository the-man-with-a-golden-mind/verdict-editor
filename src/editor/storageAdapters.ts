// Ready-made StorageAdapter implementations for common hosting environments.
// The editor's built-in default is `localStorageAdapter` (in editorConfig.ts);
// these cover multi-notebook localStorage, in-memory (tests/demos), and a REST
// backend (cloud editor over a DB / local server).

import type { StorageAdapter } from './editorConfig';
import type { NotebookDoc } from './notebookSeed';

export { localStorageAdapter } from './editorConfig';

/** One localStorage key per notebookId — supports many notebooks in the browser. */
export function namespacedLocalStorageAdapter(prefix = 'verdict-notebook'): StorageAdapter {
  return {
    async load(notebookId) {
      try {
        const raw = localStorage.getItem(`${prefix}:${notebookId}`);
        if (!raw) return null;
        const doc = JSON.parse(raw) as NotebookDoc;
        return doc?.cells?.length ? doc : null;
      } catch {
        return null;
      }
    },
    async save(notebookId, doc) {
      try {
        localStorage.setItem(`${prefix}:${notebookId}`, JSON.stringify(doc));
      } catch {
        /* quota / disabled storage — ignore */
      }
    },
  };
}

/** Ephemeral in-memory store (unit tests, throwaway demos). */
export function inMemoryAdapter(seed: Record<string, NotebookDoc> = {}): StorageAdapter {
  const store = new Map<string, NotebookDoc>(Object.entries(seed));
  return {
    async load(notebookId) {
      return store.get(notebookId) ?? null;
    },
    async save(notebookId, doc) {
      store.set(notebookId, doc);
    },
  };
}

/**
 * REST-backed persistence for a cloud editor or local server. Expects:
 *   GET    {baseUrl}/{notebookId}  -> 200 NotebookDoc JSON | 404
 *   PUT    {baseUrl}/{notebookId}  <- NotebookDoc JSON
 * `headers` lets the host inject auth (e.g. a bearer token).
 */
export function restAdapter(opts: {
  baseUrl: string;
  headers?: () => Record<string, string> | Promise<Record<string, string>>;
  fetchImpl?: typeof fetch;
}): StorageAdapter {
  const f = opts.fetchImpl ?? fetch;
  const base = opts.baseUrl.replace(/\/+$/, '');
  const auth = async () => (opts.headers ? await opts.headers() : {});
  return {
    async load(notebookId) {
      const res = await f(`${base}/${encodeURIComponent(notebookId)}`, {
        method: 'GET',
        headers: { accept: 'application/json', ...(await auth()) },
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`load ${notebookId}: ${res.status}`);
      const doc = (await res.json()) as NotebookDoc;
      return doc?.cells?.length ? doc : null;
    },
    async save(notebookId, doc) {
      const res = await f(`${base}/${encodeURIComponent(notebookId)}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', ...(await auth()) },
        body: JSON.stringify(doc),
      });
      if (!res.ok) throw new Error(`save ${notebookId}: ${res.status}`);
    },
  };
}
