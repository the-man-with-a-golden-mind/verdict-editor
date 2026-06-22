// Cell-project logic now lives in PureScript (`Notebook.Project`, via its JS
// adapter `NotebookProject.js`). That source adapter imports PureScript output
// using the bundle's flattened layout, which only resolves inside the build.
// So expose the functions to tests/tooling through the committed bundle — the
// same way the other PureScript-backed notebook APIs are consumed.
export {
  buildNotebookProgramSource,
  buildRunnableCellSource,
  cellModuleName,
  importModuleNames,
  inferCellRole,
  isModuleCell,
  isRunnableCell,
  normalizeCellMeta,
  projectCellLabel,
} from "../../public/lib/notebook.mjs";
