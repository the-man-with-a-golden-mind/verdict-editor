"use strict";

import { EditorState, Compartment } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  drawSelection,
  highlightActiveLine,
  placeholder,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { bracketMatching, syntaxHighlighting } from "@codemirror/language";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { forceLinting } from "@codemirror/lint";
import {
  VERDICT_COLORS,
  VERDICT_COLORS_LIGHT,
  verdictLanguage,
  bytecodeLanguage,
  verdictHighlightStyle,
  verdictHighlightStyleLight,
  bytecodeHighlightStyle,
  bytecodeHighlightStyleLight,
} from "./VerdictSyntax.js";
import { verdictLanguageExtensions, languageRefreshEffect } from "./VerdictLanguageService.js";

const editableCompartment = new Compartment();
const FONT_MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

// Theme + syntax-highlight live in compartments so the whole-environment
// light/dark toggle can re-skin every open editor (shell + notebook cells)
// without rebuilding them — driven by a `verdict-theme-change` window event.
const themeCompartment = new Compartment();
const highlightCompartment = new Compartment();
const liveEditors = new Set();
let themeListenerBound = false;

function currentLight() {
  return typeof document !== "undefined" && document.documentElement.classList.contains("theme-light");
}

function verdictHighlightFor(light) {
  return syntaxHighlighting(light ? verdictHighlightStyleLight : verdictHighlightStyle);
}

function bytecodeHighlightFor(light) {
  return syntaxHighlighting(light ? bytecodeHighlightStyleLight : bytecodeHighlightStyle);
}

function highlightFor(variant, light) {
  return variant === "bytecode" ? bytecodeHighlightFor(light) : verdictHighlightFor(light);
}

function bindThemeListener() {
  if (themeListenerBound || typeof window === "undefined") return;
  themeListenerBound = true;
  window.addEventListener("verdict-theme-change", (e) => {
    const light = !!(e && e.detail && e.detail.light);
    for (const entry of liveEditors) {
      entry.view.dispatch({
        effects: [
          themeCompartment.reconfigure(buildTheme(entry.variant, entry.opts, light)),
          highlightCompartment.reconfigure(highlightFor(entry.variant, light)),
        ],
      });
    }
  });
}

function buildTheme(variant, opts = {}, light = false) {
  const fontSize = opts.fontSize ?? (variant === "program" ? 14 : 12);
  const lineHeight = opts.lineHeight ?? (variant === "program" ? 1.55 : 1.35);
  const C = light ? VERDICT_COLORS_LIGHT : VERDICT_COLORS;

  return EditorView.theme(
    {
      "&": {
        height: "100%",
        maxHeight: variant === "cell" ? "100%" : undefined,
        overflow: variant === "cell" ? "hidden" : undefined,
        backgroundColor: C.background,
        color: C.foreground,
        fontSize: `${fontSize}px`,
        fontFamily: FONT_MONO,
      },
      ".cm-scroller": {
        overflow: "auto",
        fontFamily: "inherit",
        ...(variant === "cell" ? { height: "100%", maxHeight: "100%" } : {}),
      },
      ".cm-content": {
        caretColor: C.cursor,
        padding: variant === "program" ? "18px 0" : "8px 0",
      },
      ".cm-line": {
        lineHeight: String(lineHeight),
        padding: variant === "program" ? "0 16px" : "0 12px",
        ...(variant === "cell" ? { whiteSpace: "pre" } : {}),
      },
      ".cm-gutters": {
        backgroundColor: C.background,
        color: C.lineNumber,
        border: "none",
      },
      ".cm-activeLineGutter": {
        color: C.lineNumberActive,
      },
      ".cm-activeLine": { backgroundColor: C.lineHighlight },
      ".cm-cursor, .cm-dropCursor": { borderLeftColor: C.cursor },
      "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
        backgroundColor: `${C.selection} !important`,
      },
      "&.cm-editor.cm-readonly .cm-cursor": { display: "none" },
    },
    { dark: !light },
  );
}

/**
 * Unified Verdict editor (CodeMirror 6) — replaces Monaco everywhere.
 * @param {HTMLElement} host
 * @param {{
 *   variant?: 'cell' | 'program' | 'bytecode',
 *   value?: string,
 *   editable?: boolean,
 *   placeholder?: string,
 *   fontSize?: number,
 *   onChange?: (v: string) => void,
 *   onFocus?: () => void,
 *   onRun?: () => void,
 *   languageService?: object,
 * }} opts
 */
export function createVerdictEditor(host, opts = {}) {
  const variant = opts.variant ?? "cell";
  const onChange = opts.onChange ?? (() => {});
  const onFocus = opts.onFocus ?? (() => {});
  const editable = opts.editable !== false && variant !== "bytecode";
  const light = currentLight();

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) onChange(update.state.doc.toString());
  });

  const focusListener = EditorView.domEventHandlers({
    focus: () => {
      onFocus();
      return false;
    },
  });

  const extensions = [
    drawSelection(),
    history(),
    themeCompartment.of(buildTheme(variant, opts, light)),
    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
    updateListener,
    focusListener,
    editableCompartment.of(EditorView.editable.of(editable)),
  ];

  if (variant === "program") {
    extensions.push(EditorView.lineWrapping);
  }

  if (variant === "bytecode") {
    extensions.push(bytecodeLanguage, highlightCompartment.of(bytecodeHighlightFor(light)));
  } else {
    extensions.push(
      lineNumbers(),
      highlightActiveLine(),
      bracketMatching(),
      verdictLanguage,
      highlightCompartment.of(verdictHighlightFor(light)),
    );
    if (variant === "program") {
      extensions.push(highlightSelectionMatches(), keymap.of(searchKeymap));
      if (opts.onRun) {
        extensions.push(
          keymap.of([
            {
              key: "Mod-Enter",
              run: () => {
                opts.onRun();
                return true;
              },
            },
          ]),
        );
      }
    }
    if (opts.languageService) {
      extensions.push(...verdictLanguageExtensions(opts.languageService));
    }
  }

  if (opts.placeholder) extensions.push(placeholder(opts.placeholder));

  host.classList.add("verdict-cm-host");
  if (variant === "program") host.classList.add("verdict-cm-shell");
  if (variant === "cell") host.classList.add("notebook-cell-editor");

  const view = new EditorView({
    state: EditorState.create({
      doc: opts.value ?? "",
      extensions,
    }),
    parent: host,
  });

  const entry = { view, variant, opts };
  liveEditors.add(entry);
  bindThemeListener();

  return {
    view,
    destroy() {
      liveEditors.delete(entry);
      view.destroy();
    },
    getValue() {
      return view.state.doc.toString();
    },
    setValue(text) {
      const cur = view.state.doc.toString();
      if (cur === text) return;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text ?? "" },
      });
    },
    focus() {
      view.focus();
    },
    setEditable(isEditable) {
      view.dispatch({
        effects: editableCompartment.reconfigure(EditorView.editable.of(!!isEditable)),
      });
    },
    layout() {
      /* CM6 auto-layout; shell uses height:100% on host */
    },
    refreshLanguageService() {
      view.dispatch({ effects: languageRefreshEffect.of(null) });
      forceLinting(view);
    },
    revealLine(lineNum) {
      const n = Math.max(1, Math.min(lineNum | 0, view.state.doc.lines));
      const line = view.state.doc.line(n);
      view.dispatch({
        selection: { anchor: line.from },
        effects: EditorView.scrollIntoView(line.from, { y: "center" }),
      });
      view.focus();
    },
  };
}

export function disposeVerdictEditor(editor) {
  editor?.destroy?.();
}
