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
import { bracketMatching } from "@codemirror/language";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { forceLinting } from "@codemirror/lint";
import {
  VERDICT_COLORS,
  verdictSyntaxExtensions,
  bytecodeSyntaxExtensions,
} from "./VerdictSyntax.js";
import { verdictLanguageExtensions, languageRefreshEffect } from "./VerdictLanguageService.js";

const editableCompartment = new Compartment();
const FONT_MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

function buildTheme(variant, opts = {}) {
  const fontSize = opts.fontSize ?? (variant === "program" ? 14 : 12);
  const lineHeight = opts.lineHeight ?? (variant === "program" ? 1.55 : 1.35);

  return EditorView.theme(
    {
      "&": {
        height: "100%",
        maxHeight: variant === "cell" ? "100%" : undefined,
        overflow: variant === "cell" ? "hidden" : undefined,
        backgroundColor: VERDICT_COLORS.background,
        color: VERDICT_COLORS.foreground,
        fontSize: `${fontSize}px`,
        fontFamily: FONT_MONO,
      },
      ".cm-scroller": {
        overflow: "auto",
        fontFamily: "inherit",
        ...(variant === "cell" ? { height: "100%", maxHeight: "100%" } : {}),
      },
      ".cm-content": {
        caretColor: VERDICT_COLORS.cursor,
        padding: variant === "program" ? "18px 0" : "8px 0",
      },
      ".cm-line": {
        lineHeight: String(lineHeight),
        padding: variant === "program" ? "0 16px" : "0 12px",
        ...(variant === "cell" ? { whiteSpace: "pre" } : {}),
      },
      ".cm-gutters": {
        backgroundColor: VERDICT_COLORS.background,
        color: VERDICT_COLORS.lineNumber,
        border: "none",
      },
      ".cm-activeLineGutter": {
        color: VERDICT_COLORS.lineNumberActive,
      },
      ".cm-activeLine": { backgroundColor: VERDICT_COLORS.lineHighlight },
      ".cm-cursor, .cm-dropCursor": { borderLeftColor: VERDICT_COLORS.cursor },
      "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
        backgroundColor: `${VERDICT_COLORS.selection} !important`,
      },
      "&.cm-editor.cm-readonly .cm-cursor": { display: "none" },
    },
    { dark: true },
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
    buildTheme(variant, opts),
    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
    updateListener,
    focusListener,
    editableCompartment.of(EditorView.editable.of(editable)),
  ];

  if (variant === "program") {
    extensions.push(EditorView.lineWrapping);
  }

  if (variant === "bytecode") {
    extensions.push(...bytecodeSyntaxExtensions);
  } else {
    extensions.push(
      lineNumbers(),
      highlightActiveLine(),
      bracketMatching(),
      ...verdictSyntaxExtensions,
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

  return {
    view,
    destroy() {
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
