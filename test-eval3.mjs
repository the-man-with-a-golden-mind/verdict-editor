import { pathToFileURL } from 'node:url';
import path from 'node:path';
const root = process.cwd();
const finvm = await import(pathToFileURL(path.join(root, 'public/lib/finvm.mjs')).href);
const notebookLib = await import(pathToFileURL(path.join(root, 'public/lib/verdict-notebook.mjs')).href);

function jsToValue(x) {
  if (x === null || x === void 0) return null;
  if (typeof x === 'boolean') return { bool: x };
  if (typeof x === 'number') return Number.isInteger(x) ? { int: String(x) } : { string: String(x) };
  if (typeof x === 'string') return { string: x };
  if (Array.isArray(x)) return { list: x.map(jsToValue) };
  if (typeof x === 'object') { const rec = {}; for (const [k, v] of Object.entries(x)) rec[k] = jsToValue(v); return { record: rec }; }
  return { string: String(x) };
}
function valueToJs(v) {
  if (v === null || typeof v !== 'object') return v;
  if ('bool' in v) return v.bool;
  if ('int' in v) return Number(v.int);
  if ('string' in v) return v.string;
  if ('list' in v && Array.isArray(v.list)) return v.list.map(valueToJs);
  if ('record' in v && v.record) { const o = {}; for (const [k, val] of Object.entries(v.record)) o[k] = valueToJs(val); return o; }
  return v;
}
async function run(programJson, handlers) {
  let out = JSON.parse(finvm.runEffectStart(programJson)(JSON.stringify({ input: {}, state: {} })));
  for (let i = 0; i < 1000; i++) {
    if (out.status === 'completed') return { ok: true, result: valueToJs(out.result) };
    if (out.status !== 'suspended') return { ok: false, error: `${out.status}: ${out.error}` };
    const pending = out.pending || [];
    const results = await Promise.all(pending.map(async (e) => {
      const h = handlers[String(e.type_ ?? '')]; if (!h) throw new Error('no handler ' + e.type_);
      const pj = valueToJs(e.payload); const key = typeof e.key === 'string' ? e.key : undefined;
      return h(pj && typeof pj === 'object' && !Array.isArray(pj) ? { ...pj, ...(key ? { key } : {}) } : pj);
    }));
    const deliveries = pending.map((e, idx) => {
      const kind = e.kind || (e.key ? 'await_reply' : 'transport');
      if (kind === 'transport') return null;
      return { pid: e.pid || 'main', key: e.key || '', result: jsToValue(results[idx]) };
    }).filter(Boolean);
    out = JSON.parse(finvm.runEffectResume(programJson)(JSON.stringify(out.snapshot))(JSON.stringify(deliveries)));
  }
  return { ok: false, error: 'max iters' };
}

const handlers = {
  'cache.get': async () => '5,6,7',
  'sys.log': async () => true,
};

// Minimal: a nullary binding that reads cache (effect) then transforms (pure).
const minimal = [
  'module M exposing (raw, parsed, doubled)',
  '',
  'getCsv : String -> String',
  'getCsv k = withDefault("", cacheGet("ns", k))',
  '',
  'pushParsed : List Int -> String -> List Int',
  'pushParsed acc s = append(acc, withDefault(0, parseInt(trim(s))))',
  '',
  'parseCsvInts : String -> List Int',
  'parseCsvInts csv = foldl(pushParsed, [], split(csv, ","))',
  '',
  '-- raw: returns the effectful string directly',
  'raw : String',
  'raw = getCsv("k")',
  '',
  '-- parsed: effect THEN pure transform',
  'parsed : List Int',
  'parsed = parseCsvInts(getCsv("k"))',
  '',
  '-- doubled: pure transform of a pure list (no effect)',
  'doubled : List Int',
  'doubled = parseCsvInts("5,6,7")',
  '',
  '-- parsedLet: effect bound in a let (statement position), THEN transform',
  'parsedLet : List Int',
  'parsedLet =',
  '  let s = getCsv("k") in',
  '  parseCsvInts(s)',
  '',
  '-- bindReturn: bind the transform result too, then return it (non-tail)',
  'bindReturn : List Int',
  'bindReturn =',
  '  let s = getCsv("k") in',
  '  let r = parseCsvInts(s) in',
  '  r',
  '',
  '-- lenOf: returns an Int computed after the effect',
  'lenOf : Int',
  'lenOf =',
  '  let s = getCsv("k") in',
  '  length(parseCsvInts(s))',
].join('\n');

for (const name of ['raw', 'parsed', 'doubled', 'parsedLet', 'bindReturn', 'lenOf']) {
  const c = notebookLib.compileBindingEntryJS(minimal, name);
  if (!c.ok) { console.log(name, 'COMPILE ERR:', c.error); continue; }
  const p = JSON.parse(c.output); p.entrypoint = name;
  const o = await run(JSON.stringify(p), handlers);
  console.log(`${name} -> ok:${o.ok} result:${JSON.stringify(o.result)} err:${o.error || ''}`);
}

// HYPOTHESIS: the VM only continues post-await for the process named "main".
// Compile `parsed`, rename its function to "main", set entrypoint "main".
{
  const c = notebookLib.compileBindingEntryJS(minimal, 'parsed');
  const p = JSON.parse(c.output);
  p.functions.main = p.functions.parsed;
  delete p.functions.parsed;
  p.entrypoint = 'main';
  const o = await run(JSON.stringify(p), handlers);
  console.log(`RENAMED parsed->main -> ok:${o.ok} result:${JSON.stringify(o.result)} err:${o.error || ''}`);
}

console.log('\n--- compiled entrypoints per binding ---');
for (const name of ['parsed', 'parsedLet', 'doubled', 'raw']) {
  const c = notebookLib.compileBindingEntryJS(minimal, name);
  const p = JSON.parse(c.output);
  // find which function is lowered as entry: encodeProgram marks via proof.isInvariant? print entrypoint.
  console.log(`compileBindingEntry('${name}') -> program.entrypoint = ${p.entrypoint}`);
}
console.log('\n--- reordered source for parsed ---');
console.log(notebookLib.reorderBindingFirstInSource ? notebookLib.reorderBindingFirstInSource(minimal, 'parsed') : '(reorder not exported)');

console.log('\n--- compile target AS main (in source) ---');
// Build a source where the target binding is literally named `main`.
const asMain = minimal
  .replace('module M exposing (raw, parsed, doubled)', 'module M exposing (main)')
  .replace(/\bparsed\b/g, 'main');   // parsed : ... ; parsed = ...  -> main
{
  const c = notebookLib.compileBindingEntryJS(asMain, 'main');
  if (!c.ok) { console.log('COMPILE ERR:', c.error); }
  else {
    const p = JSON.parse(c.output);
    console.log('entrypoint:', p.entrypoint);
    const o = await run(c.output, handlers);
    console.log(`parsed-as-main -> ok:${o.ok} result:${JSON.stringify(o.result)} err:${o.error || ''}`);
  }
}
