import { readFileSync } from 'node:fs';

// Extract the default program: lines between `value: [` and `].join('\n')`.
const ts = readFileSync('src/VerdictEditor.ts', 'utf8').split('\n');
let start = -1, end = -1;
for (let i = 860; i < ts.length; i++) {
  if (start === -1 && ts[i].includes('value: [')) start = i;
  else if (start !== -1 && ts[i].trim().startsWith("].join(")) { end = i; break; }
}
const body = ts.slice(start, end + 1).join('\n');
// body is `value: [ ... ].join('\n')` — eval the array+join as an expression.
const expr = body.replace(/^\s*value:\s*/, '').replace(/,\s*$/, '');
// eslint-disable-next-line no-eval
let src = eval('(' + expr + ')');
// Replicate materializeInputs: assetsCsv -> string literal, everything else -> 0.
src = src.replaceAll('__INPUT_assetsCsv__', '"BTCUSD,ETHUSD"');
src = src.replaceAll('__INPUT_telegramBotToken__', '"tok"');
src = src.replaceAll('__INPUT_telegramChatId__', '"chat"');
src = src.replace(/__INPUT_[A-Za-z0-9_]+__/g, '0');
console.log('SRC chars:', src.length, '| has equityCurve:', src.includes('equityCurve ='));

const m = await import('./public/lib/verdict-notebook.mjs');
console.log('exports:', Object.keys(m).filter((k) => /compile|nullary|signature/i.test(k)));

if (typeof m.nullaryBindingsJS === 'function') {
  console.log('nullary:', m.nullaryBindingsJS(src));
}

const r = m.compileBindingEntryJS(src, 'equityCurve');
console.log('compileBindingEntryJS ok:', r.ok, '| error:', r.error || '(none)');
if (r.ok) {
  const prog = JSON.parse(r.output);
  console.log('entrypoint:', prog.entrypoint);
  console.log('function keys:', Object.keys(prog.functions || {}));
  console.log('equityCurve present:', 'equityCurve' in (prog.functions || {}));
}

console.log('\n=== signatures ===');
const sigs = m.signaturesJS(src);
console.log('equityCurve sig:', JSON.stringify(sigs.find(s=>s.name==='equityCurve')));
console.log('simulate sig:', JSON.stringify(sigs.find(s=>s.name==='simulate')));

const prog2 = JSON.parse(r.output);
console.log('\n=== equityCurve fn (first 600 chars) ===');
console.log(JSON.stringify(prog2.functions.equityCurve).slice(0, 600));
