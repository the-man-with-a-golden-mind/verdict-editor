import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import {
  evalNotebookCells,
  createEffectStorage,
  wrapVerdictLibForNotebook,
  vmValueToDisplay,
} from './tests-js/.notebook-eval-runner.mjs';

// --- reconstruct + materialize default program (same as test-compile) ---
const ts = readFileSync('src/VerdictEditor.ts', 'utf8').split('\n');
let start = -1, end = -1;
for (let i = 860; i < ts.length; i++) {
  if (start === -1 && ts[i].includes('value: [')) start = i;
  else if (start !== -1 && ts[i].trim().startsWith('].join(')) { end = i; break; }
}
const expr = ts.slice(start, end + 1).join('\n').replace(/^\s*value:\s*/, '').replace(/,\s*$/, '');
let src = eval('(' + expr + ')');
src = src.replaceAll('__INPUT_assetsCsv__', '"BTCUSD,ETHUSD"');
src = src.replaceAll('__INPUT_telegramBotToken__', '"tok"');
src = src.replaceAll('__INPUT_telegramChatId__', '"chat"');
src = src.replace(/__INPUT_[A-Za-z0-9_]+__/g, '0');

const root = process.cwd();
const finvm = await import(pathToFileURL(path.join(root, 'public/lib/finvm.mjs')).href);
const baseVlib = await import(pathToFileURL(path.join(root, 'public/lib/verdict.mjs')).href);
const notebookLib = await import(pathToFileURL(path.join(root, 'public/lib/verdict-notebook.mjs')).href);
const vlib = wrapVerdictLibForNotebook(baseVlib, notebookLib);

let storage = createEffectStorage();
// Seed a fake BTCUSD price history so equityCurve has data without a network call.
// (We probe the real cache key by running main once below; but first seed a guess.)
let state = {};
const ctx = {
  vlib,
  finvm,
  getFinvmState: () => state,
  setFinvmState: (s) => { state = s; },
  getEffectStorage: () => storage,
  setEffectStorage: (s) => { storage = s; },
  materialize: (s) => s,
};

console.log('--- run cell 2 (equityCurve) with EMPTY cache ---');
let out = await evalNotebookCells(ctx, src, ['equityCurve']);
for (const o of out) {
  console.log('name:', o.name, '| ok:', o.ok, '| typeSig:', o.typeSig, '| err:', o.error);
  console.log('  json:', JSON.stringify(o.json).slice(0, 200));
  console.log('  display.kind:', o.display && o.display.kind);
}

// Now seed cache with a multi-point history and re-run.
console.log('\n--- seed history & re-run ---');
// Probe key namespace by scanning histKey behavior: cacheSet(ns,key,val). Try common ns.
for (const ns of ['hist', 'history', 'default', 'cache']) {
  storage.cacheSet(ns, 'BTCUSD', '100,110,120,115,130,125,140');
  storage.cacheSet(ns, 'hist:BTCUSD', '100,110,120,115,130,125,140');
}
out = await evalNotebookCells(ctx, src, ['equityCurve']);
for (const o of out) {
  console.log('name:', o.name, '| ok:', o.ok, '| typeSig:', o.typeSig);
  console.log('  json:', JSON.stringify(o.json).slice(0, 300));
  console.log('  display.kind:', o.display && o.display.kind);
}
