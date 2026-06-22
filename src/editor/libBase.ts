// Base URL for the lazily-fetched /lib/*.mjs bundles (compiler, FinVM, notebook,
// plotly, ast, hylograph-vis). A host can point this at a CDN or a different
// asset path via EditorConfig.libBaseUrl. The bundles are global singletons
// loaded once, so this is a module-level setting the element applies (in
// connectedCallback) before the first fetch.

let libBase = '/lib';

export function setLibBase(url: string): void {
  libBase = url.replace(/\/+$/, '') || '/lib';
}

export function getLibBase(): string {
  return libBase;
}

/** Map an absolute '/lib/x.mjs' URL onto the configured base; pass others through. */
export function resolveLibUrl(url: string): string {
  return url.startsWith('/lib/') ? `${libBase}${url.slice(4)}` : url;
}
