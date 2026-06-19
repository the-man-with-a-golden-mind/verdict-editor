export const mountVerdictEditorImpl = (id) => () => {
  setTimeout(async () => {
    const el = document.getElementById(id);
    if (el) {
      if (!el.hasAttribute('data-verdict-editor-mounted')) {
        el.setAttribute('data-verdict-editor-mounted', 'true');
        const { initVerdictEditor } = await import('../VerdictEditor');
        initVerdictEditor(el);
      }
    }
  }, 100);
};
