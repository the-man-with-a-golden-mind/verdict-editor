"use strict";

export function colorizeImpl(code) {
  return function (bridge) {
    return async function () {
      const monacoEditor = bridge?.monaco?.editor ?? null;
      if (monacoEditor?.colorize) {
        return monacoEditor.colorize(String(code ?? ""), "verdict", { theme: "verdict-dark" });
      }
      return escapeHtml(code);
    };
  };
}

export function createEditorImpl(host) {
  return function (source) {
    return function (bridge) {
      return function () {
        const monacoEditor = bridge?.monaco?.editor ?? null;
        if (!monacoEditor?.create) return null;
        return monacoEditor.create(host, {
          value: source ?? "",
          language: "verdict",
          theme: "verdict-dark",
          minimap: { enabled: false },
          fontSize: 12,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
        });
      };
    };
  };
}

export function disposeEditorImpl(editor) {
  return function () {
    editor?.dispose?.();
  };
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
