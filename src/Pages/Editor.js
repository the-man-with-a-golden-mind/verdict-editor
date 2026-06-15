export const mountMonacoImpl = (id) => () => {
  setTimeout(async () => {
    const el = document.getElementById(id);
    if (el) {
      if (!el.hasAttribute('data-monaco-mounted')) {
        el.setAttribute('data-monaco-mounted', 'true');
        const { initVerdictEditor } = await import('../VerdictEditor');
        initVerdictEditor(el);
      }
    }
  }, 100);
};