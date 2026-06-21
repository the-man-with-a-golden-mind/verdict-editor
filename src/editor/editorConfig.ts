// Host-facing configuration for embedding the Verdict notebook editor in
// different environments (browser localStorage, cloud editor backed by a DB,
// local server). The editor resolves a config from (in priority order):
//   1. an explicit `.config` property set on the <verdict-editor> element,
//   2. window.__verdictEditorConfig[ data-config-id ?? 'default' ],
//   3. a built-in fallback (the finance template, to keep the standalone app).
// See mountVerdictEditor() for the programmatic entry point.

import type { EffectStorage } from './effectDriver';
import type { NotebookDoc } from './notebookSeed';
import { loadVnbFromStorage, saveVnbToStorage } from './notebookBridge';

export type { NotebookDoc } from './notebookSeed';

/** Pluggable notebook persistence. The host owns listing/routing/auth. */
export interface StorageAdapter {
  load(notebookId: string): Promise<NotebookDoc | null>;
  save(notebookId: string, doc: NotebookDoc): Promise<void>;
}

export type EffectFetch = typeof fetch;
export type EffectHandlers = Record<string, (payload: any) => unknown | Promise<unknown>>;

/**
 * Where a running notebook's effects (db/cache/http) execute.
 * - `sandbox`: in-browser, in-memory, in a Web Worker (the default; ephemeral).
 * - `custom`: a host-provided EffectStorage / fetch / handler overrides; runs on
 *   the main thread so a server-backed store is reachable.
 */
export type EffectBackendConfig =
  | { kind: 'sandbox' }
  | {
      kind: 'custom';
      storage?: EffectStorage;
      fetchImpl?: EffectFetch;
      handlers?: EffectHandlers;
    };

/** One notebook-wide input field (replaces the previously hardcoded finance set). */
export interface InputFieldSpec {
  key: string;
  label?: string;
  type?: 'number' | 'string';
  default?: string | number;
  placeholder?: string;
  title?: string;
}

export interface EditorBranding {
  /** Heading shown in the workspace chrome (host-overridable). */
  title?: string;
}

export interface EditorConfig {
  /** Which notebook this editor instance loads/saves via the storage adapter. */
  notebookId?: string;
  storage?: StorageAdapter;
  effects?: EffectBackendConfig;
  inputs?: InputFieldSpec[];
  defaultDocument?: NotebookDoc | null;
  /** Base URL for the lazily-fetched /lib/*.mjs bundles (default '/lib'). */
  libBaseUrl?: string;
  branding?: EditorBranding;
  theme?: 'light' | 'dark';
}

export interface ResolvedEditorConfig {
  notebookId: string;
  storage: StorageAdapter;
  effects: EffectBackendConfig;
  inputs: InputFieldSpec[];
  defaultDocument: NotebookDoc | null;
  libBaseUrl: string;
  branding: EditorBranding;
  theme?: 'light' | 'dark';
}

declare global {
  interface Window {
    __verdictEditorConfig?: Record<string, EditorConfig>;
  }
}

/** Default persistence: the original single-key localStorage `.vnb` (backward compatible). */
export function localStorageAdapter(): StorageAdapter {
  return {
    async load() {
      return loadVnbFromStorage() as NotebookDoc | null;
    },
    async save(_notebookId, doc) {
      saveVnbToStorage(doc as { cells: NotebookDoc['cells']; seedSig?: string });
    },
  };
}

/** Fill defaults for any omitted fields. `defaultDocument` stays null here; the
 *  editor substitutes its own fallback (finance template) when nothing is set. */
export function resolveEditorConfig(raw: EditorConfig | null | undefined): ResolvedEditorConfig {
  const c = raw ?? {};
  return {
    notebookId: c.notebookId ?? 'default',
    storage: c.storage ?? localStorageAdapter(),
    effects: c.effects ?? { kind: 'sandbox' },
    inputs: c.inputs ?? [],
    defaultDocument: c.defaultDocument ?? null,
    libBaseUrl: c.libBaseUrl ?? '/lib',
    branding: c.branding ?? {},
    theme: c.theme,
  };
}

/** Read the raw config a host attached to an element (property or global registry). */
export function rawConfigForElement(
  el: HTMLElement & { config?: EditorConfig },
): EditorConfig | undefined {
  if (el.config) return el.config;
  const id = el.getAttribute('data-config-id') ?? 'default';
  const registry = (typeof window !== 'undefined' ? window.__verdictEditorConfig : undefined) ?? {};
  return registry[id];
}
