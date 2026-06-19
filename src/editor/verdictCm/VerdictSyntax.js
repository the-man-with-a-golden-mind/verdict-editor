"use strict";

import { StreamLanguage, HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { styleTags } from "@lezer/highlight";

/** Verdict brand palette (shared across shell + notebook). */
export const VERDICT_COLORS = {
  keyword: "#a78bfa",
  type: "#5eead4",
  identifier: "#e2e8f0",
  string: "#fcd34d",
  stringEscape: "#fbbf24",
  number: "#f0abfc",
  comment: "#7c8596",
  operator: "#93c5fd",
  delimiter: "#94a3b8",
  background: "#0b0f1a",
  foreground: "#e2e8f0",
  lineHighlight: "#121829",
  lineNumber: "#334155",
  lineNumberActive: "#a78bfa",
  cursor: "#a78bfa",
  selection: "#3730a3aa",
};

const KEYWORDS = new Set([
  "module", "exposing", "if", "then", "else", "let", "in", "switch", "match", "type", "import",
]);

const TYPE_KEYWORDS = new Set([
  "Int", "Fixed", "Rational", "Bool", "String", "Unit", "Pid", "Json", "List", "Option",
  "Result", "Decoder", "Encoder", "Some", "None", "Ok", "Err", "ActorRef",
]);

export const VERDICT_KEYWORDS = [...KEYWORDS];
export const VERDICT_TYPES = [...TYPE_KEYWORDS];
export const VERDICT_PRELUDE_FUNCTIONS = [
  "mod", "length", "get", "append", "spawn", "send", "recv", "yield", "self",
  "and", "or", "not", "modPow", "modInv", "max", "min", "abs", "clamp", "gcd", "lcm", "pow", "sqrtFloor",
  "map", "filter", "foldl", "isEmpty", "range", "reverse", "concat", "sum", "product", "contains", "take", "drop", "all", "any", "count", "find", "flatMap", "replicate", "head", "last",
  "mapOption", "isNone", "andThen", "orElse", "withDefault", "isSome", "isOk", "okOr", "mapResult",
  "strLength", "strConcat", "strSlice", "indexOf", "strContains", "split", "toUpper", "toLower", "trim", "fromInt", "replace", "parseInt",
  "regexTest", "regexFindAll", "regexReplace", "regexSplit",
  "httpGet", "httpPost", "sysLog", "sysCwd", "sysReadText", "sysWriteText", "sysEnv",
  "dbInsert", "dbGet", "dbGetOpt", "dbUpdate", "dbDelete", "dbQuery", "dbCreateIndex", "dbHash",
  "cacheSet", "cacheGet", "cacheDelete",
  "sortInts", "distinctInts", "sumIntsFast", "averageFloor", "statsMin", "statsMax", "meanFloor", "median", "percentileNearest", "varianceFloor", "stddevFloor", "describeInts", "valueCountsInts", "rollingSumInts",
];

export const verdictLanguage = StreamLanguage.define({
  name: "verdict",
  token(stream) {
    if (stream.eatSpace()) return null;
    if (stream.match(/^--.*/)) return "comment";
    if (stream.match(/^\/\/.*/)) return "comment";
    if (stream.match(/^"/)) {
      while (!stream.eol()) {
        if (stream.next() === '"') break;
      }
      return "string";
    }
    if (stream.match(/^\d+\.\d+/)) return "number float";
    if (stream.match(/^\d+/)) return "number";
    if (stream.match(/^[{}()[\]]/)) return "bracket";
    if (stream.match(/^[+\-*\/%=<>!&|?:]+/)) return "operator";
    if (stream.match(/^[A-Z][\w$]*/)) return "typeName";
    if (stream.match(/^[a-z_$][\w$]*/)) {
      const word = stream.current();
      if (KEYWORDS.has(word)) return "keyword";
      return "variableName";
    }
    stream.next();
    return null;
  },
  tokenTable: styleTags({
    keyword: t.keyword,
    typeName: t.typeName,
    variableName: t.variableName,
    number: t.number,
    "number float": t.float,
    string: t.string,
    comment: t.lineComment,
    bracket: t.bracket,
    operator: t.operator,
  }),
});

/** Read-only FinVM bytecode / JSON panel highlighter (worker-free). */
export const bytecodeLanguage = StreamLanguage.define({
  name: "finvm-bytecode",
  token(stream) {
    if (stream.eatSpace()) return null;
    if (stream.match(/^"(?:[^"\\]|\\.)*"(?=\s*:)/)) return "propertyName";
    if (stream.match(/^"(?:[^"\\]|\\.)*"/)) return "string";
    if (stream.match(/^\b(?:true|false|null)\b/)) return "keyword";
    if (stream.match(/^-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/)) return "number";
    if (stream.match(/^[{}[\]]/)) return "bracket";
    if (stream.match(/^[:,]/)) return "punctuation";
    stream.next();
    return null;
  },
  tokenTable: styleTags({
    propertyName: t.propertyName,
    string: t.string,
    keyword: t.keyword,
    number: t.number,
    bracket: t.bracket,
    punctuation: t.punctuation,
  }),
});

export const verdictHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: VERDICT_COLORS.keyword, fontWeight: "bold" },
  { tag: t.typeName, color: VERDICT_COLORS.type },
  { tag: t.variableName, color: VERDICT_COLORS.identifier },
  { tag: t.string, color: VERDICT_COLORS.string },
  { tag: t.number, color: VERDICT_COLORS.number },
  { tag: t.float, color: VERDICT_COLORS.number },
  { tag: t.lineComment, color: VERDICT_COLORS.comment, fontStyle: "italic" },
  { tag: t.operator, color: VERDICT_COLORS.operator },
  { tag: t.bracket, color: VERDICT_COLORS.delimiter },
  { tag: t.invalid, color: "#fb7185" },
]);

export const bytecodeHighlightStyle = HighlightStyle.define([
  { tag: t.propertyName, color: VERDICT_COLORS.type },
  { tag: t.string, color: VERDICT_COLORS.string },
  { tag: t.keyword, color: VERDICT_COLORS.keyword },
  { tag: t.number, color: VERDICT_COLORS.number },
  { tag: t.bracket, color: VERDICT_COLORS.delimiter },
  { tag: t.punctuation, color: VERDICT_COLORS.delimiter },
]);

export const verdictSyntaxExtensions = [
  verdictLanguage,
  syntaxHighlighting(verdictHighlightStyle),
];

export const bytecodeSyntaxExtensions = [
  bytecodeLanguage,
  syntaxHighlighting(bytecodeHighlightStyle),
];

const HTML_ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };

function escHtml(s) {
  return String(s).replace(/[&<>]/g, (c) => HTML_ESC[c] ?? c);
}

function clsForWord(w) {
  if (KEYWORDS.has(w)) return "verdict-hl-keyword";
  if (TYPE_KEYWORDS.has(w)) return "verdict-hl-type";
  if (/^[A-Z]/.test(w)) return "verdict-hl-type";
  return "verdict-hl-name";
}

export function highlightVerdictToHtml(source) {
  const lines = String(source ?? "").split("\n");
  return lines
    .map((line) => {
      const inner = highlightLine(line);
      return `<div class="verdict-hl-line">${inner || "&#8203;"}</div>`;
    })
    .join("");
}

function highlightLine(line) {
  if (!line) return "";
  let i = 0;
  let buf = "";
  let html = "";
  const flush = (cls) => {
    if (!buf) return;
    html += cls ? `<span class="${cls}">${escHtml(buf)}</span>` : escHtml(buf);
    buf = "";
  };
  while (i < line.length) {
    const rest = line.slice(i);
    if (rest.startsWith("--") || rest.startsWith("//")) {
      flush(null);
      html += `<span class="verdict-hl-comment">${escHtml(rest)}</span>`;
      break;
    }
    if (rest[0] === '"') {
      flush(null);
      let j = i + 1;
      while (j < line.length && line[j] !== '"') j += 1;
      if (j < line.length) j += 1;
      html += `<span class="verdict-hl-string">${escHtml(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    const num = rest.match(/^(\d+\.\d+|\d+)/);
    if (num) {
      flush(null);
      html += `<span class="verdict-hl-number">${escHtml(num[0])}</span>`;
      i += num[0].length;
      continue;
    }
    if (/^[+\-*\/%=<>!&|?:]/.test(rest)) {
      flush(null);
      let j = i;
      while (j < line.length && /[+\-*\/%=<>!&|?:]/.test(line[j])) j += 1;
      html += `<span class="verdict-hl-operator">${escHtml(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    if (/^[{}()[\]]/.test(rest)) {
      flush(null);
      html += `<span class="verdict-hl-bracket">${escHtml(rest[0])}</span>`;
      i += 1;
      continue;
    }
    const word = rest.match(/^([A-Za-z_$][\w$]*)/);
    if (word) {
      flush(null);
      html += `<span class="${clsForWord(word[0])}">${escHtml(word[0])}</span>`;
      i += word[0].length;
      continue;
    }
    buf += rest[0];
    i += 1;
  }
  flush(null);
  return html;
}
