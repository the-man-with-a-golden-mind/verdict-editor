import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

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
const notebookLib = await import(pathToFileURL(path.join(root, 'public/lib/verdict-notebook.mjs')).href);

function jsToValue(x) {
  if (x === null || x === void 0) return null;
  if (typeof x === 'boolean') return { bool: x };
  if (typeof x === 'number') return Number.isInteger(x) ? { int: String(x) } : { string: String(x) };
  if (typeof x === 'string') return { string: x };
  if (Array.isArray(x)) return { list: x.map(jsToValue) };
  if (typeof x === 'object') {
    if ('tag' in x && 'payload' in x) return { variant: { tag: x.tag, payload: jsToValue(x.payload) } };
    const rec = {}; for (const [k, v] of Object.entries(x)) rec[k] = jsToValue(v); return { record: rec };
  }
  return { string: String(x) };
}
function valueToJs(v) {
  if (v === null || v === void 0) return null;
  if (typeof v !== 'object') return v;
  if ('bool' in v) return v.bool;
  if ('int' in v) return Number(v.int);
  if ('string' in v) return v.string;
  if ('list' in v && Array.isArray(v.list)) return v.list.map(valueToJs);
  if ('record' in v && v.record) { const o = {}; for (const [k, val] of Object.entries(v.record)) o[k] = valueToJs(val); return o; }
  if ('variant' in v && v.variant) return { tag: v.variant.tag, payload: valueToJs(v.variant.payload) };
  return v;
}
async function run(programJson, handlers) {
  let out = JSON.parse(finvm.runEffectStart(programJson)(JSON.stringify({ input: {}, state: {} })));
  for (let i = 0; i < 1e4; i++) {
    if (out.status === 'completed') return { ok: true, result: valueToJs(out.result) };
    if (out.status !== 'suspended') return { ok: false, error: `status ${out.status}: ${out.error}` };
    const pending = out.pending || [];
    const results = await Promise.all(pending.map(async (e) => {
      const h = handlers[String(e.type_ ?? '')];
      if (!h) throw new Error('no handler ' + e.type_);
      const pj = valueToJs(e.payload);
      const key = typeof e.key === 'string' ? e.key : undefined;
      const payload = pj && typeof pj === 'object' && !Array.isArray(pj) ? { ...pj, ...(key ? { key } : {}) } : pj;
      return h(payload);
    }));
    const deliveries = pending.map((e, idx) => {
      const pid = e.pid || 'main'; const key = e.key || '';
      const kind = e.kind || (key ? 'await_reply' : 'transport');
      if (kind === 'transport') return null;
      return { pid, key, result: jsToValue(results[idx]) };
    }).filter(Boolean);
    out = JSON.parse(finvm.runEffectResume(programJson)(JSON.stringify(out.snapshot))(JSON.stringify(deliveries)));
  }
  return { ok: false, error: 'max iters' };
}

const handlers = {
  'http.get': async () => ({ status: 200, ok: true, body: '{}' }),
  'sys.log': async () => true,
  'cache.get': async (p) => { console.log('  cache.get:', JSON.stringify(p)); return '100,110,120,115,130,125,140'; },
  'cache.set': async () => true,
  'db.insert': async () => 'rec0',
  'db.get': async () => null,
};

const r = notebookLib.compileBindingEntryJS(src, 'equityCurve');
const program = JSON.parse(r.output);
console.log('compiled default entrypoint:', program.entrypoint);

program.entrypoint = 'equityCurve';
const o1 = await run(JSON.stringify(program), handlers);
console.log('entrypoint=equityCurve -> ok:', o1.ok, '| result:', JSON.stringify(o1.result), '| err:', o1.error);

// Is the entrypoint override honored at all?
for (const ep of ['equityCurve', 'simulate', 'parseCsvInts', 'histCsvOrEmpty', 'NONEXISTENT_XYZ']) {
  const p = JSON.parse(r.output);
  p.entrypoint = ep;
  const o = await run(JSON.stringify(p), handlers).catch((e) => ({ ok: false, error: String(e) }));
  console.log(`entrypoint=${ep} -> ok:${o.ok} result:${JSON.stringify(o.result)} err:${o.error || ''}`);
}
// Dump simulate + parseCsvInts arity/instr count
const prog = JSON.parse(r.output);
console.log('simulate:', JSON.stringify(prog.functions.simulate).slice(0,400));
console.log('parseCsvInts:', JSON.stringify(prog.functions.parseCsvInts).slice(0,300));

// Does the REAL main compute post-effect, or also return a raw effect value?
const realHandlers = {
  'http.get': async () => ({ status: 200, ok: true, body: '{"price":"64301.38"}' }),
  'sys.log': async () => true,
  'cache.get': async () => '',
  'cache.set': async () => true,
  'db.insert': async () => 'rec0', 'db.get': async () => null,
  'db.update': async () => true, 'db.delete': async () => true,
  'http.post': async () => ({ status: 200, ok: true, body: '' }),
};
const mp = JSON.parse(notebookLib.compileBindingsJS(src).output); // main entrypoint
const mo = await run(JSON.stringify(mp), realHandlers).catch((e)=>({ok:false,error:String(e)}));
console.log('REAL main entrypoint:', mp.entrypoint, '| ok:', mo.ok);
console.log('  main result (first 120):', JSON.stringify(mo.result).slice(0,120));

// Decisive: make the REAL main return equityCurve's computation, compile naturally.
const src2 = src.replace(/main : [^\n]*/, 'main : List Int').replace(
  /main =[\s\S]*?(?=\n[A-Za-z][A-Za-z0-9_]* (:|=)|\n-- %%|\n*$)/,
  'main = simulate(parseCsvInts(histCsvOrEmpty("BTCUSD")))\n'
);
const hadMain = /\nmain =/.test(src2);
console.log('\nmain rewritten:', hadMain);
const c2 = notebookLib.compileBindingsJS(src2);
if (!c2.ok) console.log('COMPILE ERR:', c2.error);
else {
  const p2 = JSON.parse(c2.output);
  console.log('entrypoint:', p2.entrypoint);
  const o2 = await run(c2.output, realHandlers).catch((e)=>({ok:false,error:String(e)}));
  console.log('main-as-equityCurve -> ok:', o2.ok, '| result:', JSON.stringify(o2.result), '| err:', o2.error);
}
