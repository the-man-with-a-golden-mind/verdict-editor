// Embeddable distribution entry. Importing this module:
//   - registers the <verdict-editor> custom element,
//   - pulls in the editor's styles (extracted to one CSS file by the lib build),
//   - re-exports the programmatic API + config types + storage adapters.
//
// The editor fetches its runtime bundles (compiler, FinVM, notebook UI, plotly)
// from `${libBaseUrl}/*.mjs` at runtime — the lib build copies them to
// dist/embed/lib, and a host serves them and points EditorConfig.libBaseUrl at
// that location. The notebook UI (cell gutter, cells-nav, spreadsheet) lives in
// notebook.mjs and self-registers on load, so no separate app shell is needed.
// See docs/embedding-the-editor.md.
import './styles/main.css';

export {
  mountVerdictEditor,
  localStorageAdapter,
  namespacedLocalStorageAdapter,
  inMemoryAdapter,
  restAdapter,
  financeConfig,
} from './VerdictEditor';
export type {
  EditorConfig,
  StorageAdapter,
  EffectBackendConfig,
  InputFieldSpec,
  NotebookDoc,
} from './VerdictEditor';
