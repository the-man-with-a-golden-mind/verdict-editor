"use strict";

import { StateEffect } from "@codemirror/state";
import {
  Decoration,
  ViewPlugin,
  WidgetType,
  hoverTooltip,
} from "@codemirror/view";
import { linter } from "@codemirror/lint";
import { autocompletion, completeFromList } from "@codemirror/autocomplete";
import {
  VERDICT_KEYWORDS,
  VERDICT_TYPES,
  VERDICT_PRELUDE_FUNCTIONS,
} from "./VerdictSyntax.js";

const DECL_KEYWORDS = new Set(["module", "import", "type", "infixl", "infixr"]);

export function extractVerdictDocs(source) {
  const docs = new Map();
  let pending = [];
  for (const raw of String(source ?? "").split("\n")) {
    if (/^\s*--/.test(raw)) {
      pending.push(raw.replace(/^\s*--\s?\|?\s?/, "").trimEnd());
      continue;
    }
    if (raw.trim() === "") {
      pending = [];
      continue;
    }
    const m = raw.match(/^([a-z][A-Za-z0-9_]*)\s*(?::|[^=]*=)/);
    if (m && !DECL_KEYWORDS.has(m[1])) {
      const doc = pending.join("\n").trim();
      if (doc && !docs.has(m[1])) docs.set(m[1], doc);
    }
    pending = [];
  }
  return docs;
}

export function findDefinitionLine(source, name) {
  const escaped = String(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp("^" + escaped + "\\b(?!\\s*:)");
  const lines = String(source ?? "").split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) return i + 1;
  }
  return null;
}

function wordAt(doc, pos) {
  const line = doc.lineAt(pos);
  const text = line.text;
  const col = pos - line.from;
  const left = /[\w$]/.test(text[col - 1] ?? "") ? col - 1 : col;
  let start = left;
  while (start > 0 && /[\w$]/.test(text[start - 1])) start--;
  let end = col;
  while (end < text.length && /[\w$]/.test(text[end])) end++;
  if (start === end) return null;
  return { word: text.slice(start, end), from: line.from + start, to: line.from + end };
}

function diagRange(doc, d) {
  const lineNo = Math.max(1, Math.min(d.line | 0, doc.lines));
  const line = doc.line(lineNo);
  let from = line.from + Math.max(0, (d.column | 0) - 1);
  let to = from + 1;
  const word = wordAt(doc, from);
  if (word) {
    from = word.from;
    to = word.to;
  } else {
    to = Math.min(line.to, from + 1);
  }
  return { from, to };
}

class InlineResultWidget extends WidgetType {
  constructor(text, ok) {
    super();
    this.text = text;
    this.ok = ok;
  }

  eq(other) {
    return other.text === this.text && other.ok === this.ok;
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = this.ok ? "verdict-result verdict-cm-inline" : "verdict-result-error verdict-cm-inline";
    span.textContent = this.text;
    return span;
  }

  ignoreEvent() {
    return true;
  }
}

export const languageRefreshEffect = StateEffect.define();

function buildCompletionSource() {
  const items = [
    ...VERDICT_KEYWORDS.map((label) => ({ label, type: "keyword" })),
    ...VERDICT_TYPES.map((label) => ({ label, type: "type" })),
    ...VERDICT_PRELUDE_FUNCTIONS.map((label) => ({
      label,
      type: "function",
      apply: label + "()",
    })),
  ];
  return completeFromList(items);
}

function verdictLinter(service) {
  return linter(
    (view) => {
      const diags =
        service.getProgramDiagnostics?.() ?? service.getCellDiags?.() ?? [];
      return diags.map((d) => {
        const { from, to } = diagRange(view.state.doc, d);
        return {
          from,
          to: Math.max(from + 1, to),
          severity: d.severity === "warning" ? "warning" : "error",
          message: d.message,
        };
      });
    },
    { delay: 400 },
  );
}

function hoverExtension(service) {
  return hoverTooltip((view, pos) => {
    const word = wordAt(view.state.doc, pos);
    if (!word) return null;

    let signature = null;
    try {
      for (const s of service.getSignatures?.() ?? []) {
        if (s.name === word.word) signature = s.signature;
      }
    } catch {
      return null;
    }
    if (!signature) return null;

    const docs =
      service.getDocs?.() ??
      extractVerdictDocs(service.getCellSource?.() ?? view.state.doc.toString());
    const doc = docs instanceof Map ? docs.get(word.word) : undefined;

    return {
      pos: word.from,
      end: word.to,
      above: true,
      create() {
        const dom = document.createElement("div");
        dom.className = "verdict-cm-tooltip";
        const sig = document.createElement("div");
        sig.className = "verdict-cm-tooltip-sig";
        sig.textContent = `${word.word} : ${signature}`;
        dom.appendChild(sig);
        if (doc) {
          const body = document.createElement("div");
          body.className = "verdict-cm-tooltip-doc";
          body.textContent = doc;
          dom.appendChild(body);
        }
        return { dom };
      },
    };
  });
}

function inlineResultsPlugin(service) {
  return ViewPlugin.fromClass(
    class {
      decorations = Decoration.none;
      lastKey = "";

      constructor(view) {
        this.build(view);
      }

      update(update) {
        if (
          update.transactions.some((tr) => tr.effects.some((e) => e.is(languageRefreshEffect)))
        ) {
          this.build(update.view);
        }
      }

      build(view) {
        const source = view.state.doc.toString();
        const bindingFilter = service.getBindingNames?.();
        const filterByName =
          bindingFilter != null &&
          (Array.isArray(bindingFilter) || bindingFilter instanceof Set);

        let results = [];
        try {
          results = service.getEvalBindings?.() ?? [];
        } catch {
          this.decorations = Decoration.none;
          return;
        }

        const key = results.map((r) => `${r.name}:${r.ok}:${r.value ?? r.error}`).join("|");
        if (key === this.lastKey && this.decorations !== Decoration.none) return;
        this.lastKey = key;

        const names = filterByName ? new Set(bindingFilter) : null;
        const ranges = [];
        for (const r of results) {
          if (names && !names.has(r.name)) continue;
          const lineNo = findDefinitionLine(source, r.name);
          if (!lineNo || lineNo > view.state.doc.lines) continue;
          const line = view.state.doc.line(lineNo);
          const text = r.ok ? `   ⟹ ${r.value}` : `   ⚠ ${r.error}`;
          ranges.push(
            Decoration.widget({
              widget: new InlineResultWidget(text, r.ok),
              side: 1,
            }).range(line.to),
          );
        }
        this.decorations = Decoration.set(ranges, true);
      }
    },
    { decorations: (v) => v.decorations },
  );
}

/** Fake-LSP extensions: lint, hover, completion, inline eval (Monaco parity, no Monaco). */
export function verdictLanguageExtensions(service) {
  return [
    autocompletion({ activateOnTyping: true, override: [buildCompletionSource()] }),
    verdictLinter(service),
    hoverExtension(service),
    inlineResultsPlugin(service),
  ];
}
