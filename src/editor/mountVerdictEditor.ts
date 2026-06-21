// Convenience entry point for embedders: importing this registers the
// <verdict-editor> custom element (side effect of importing VerdictEditor) and
// re-exports the programmatic factory + config types/adapters.
export {
  mountVerdictEditor,
  localStorageAdapter,
  namespacedLocalStorageAdapter,
  inMemoryAdapter,
  restAdapter,
  financeConfig,
} from '../VerdictEditor';
export type {
  EditorConfig,
  StorageAdapter,
  EffectBackendConfig,
  InputFieldSpec,
  NotebookDoc,
} from '../VerdictEditor';
