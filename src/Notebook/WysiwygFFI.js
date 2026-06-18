"use strict";

import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TurndownService from "turndown";
import { marked } from "marked";

const turndown = new TurndownService({ headingStyle: "atx", bulletListMarker: "-" });
const wysiwygEditors = new Map();

function mountWysiwyg(host, markdown, onChange) {
  host.innerHTML = "";
  host.className =
    "notebook-wysiwyg min-h-[80px] rounded border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-400/60 prose prose-invert max-w-none";
  host.dataset.wysiwyg = "1";
  const html = markdown ? marked.parse(String(markdown), { async: false }) : "<p></p>";
  const editor = new Editor({
    element: host,
    extensions: [StarterKit],
    content: html,
    editorProps: {
      attributes: {
        class: "outline-none min-h-[60px]",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const md = turndown.turndown(ed.getHTML());
      onChange(md);
    },
  });
  wysiwygEditors.set(host, editor);
  return editor;
}

function destroyWysiwyg(host) {
  const ed = wysiwygEditors.get(host);
  if (ed) {
    ed.destroy();
    wysiwygEditors.delete(host);
  }
}

export function mountWysiwygImpl(host) {
  return function (markdown) {
    return function (onChange) {
      return mountWysiwyg(host, markdown, onChange);
    };
  };
}

export function destroyWysiwygImpl(host) {
  return function () {
    destroyWysiwyg(host);
  };
}

export { mountWysiwyg, destroyWysiwyg };
