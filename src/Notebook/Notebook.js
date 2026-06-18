"use strict";

export function bindingNamesFromSource(source) {
  const names = [];
  for (const line of String(source ?? "").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("--")) continue;
    const eq = t.indexOf(" =");
    if (eq > 0) {
      const name = t.slice(0, eq).trim();
      if (/^[a-z][a-zA-Z0-9_]*$/.test(name)) names.push(name);
    }
  }
  return names;
}
