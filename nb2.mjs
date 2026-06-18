import puppeteer from 'puppeteer';
const b = await puppeteer.launch({ headless: 'new' });
const p = await b.newPage(); await p.setViewport({width:1600,height:900});
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('c:'+m.text());});
await p.goto('http://localhost:4173/editor',{waitUntil:'networkidle2',timeout:30000});
await p.waitForSelector('[data-notebook-root]',{timeout:20000});
await p.waitForSelector('[data-notebook-nav]',{timeout:20000});
const struct = await p.evaluate(()=>({
  cells: document.querySelectorAll('[data-cell-id]').length,
  navCards: document.querySelectorAll('[data-nav-cell]').length,
  hasEditorResizer: !!document.querySelector('.notebook-cell-editor-resizer'),
  hasOutputResizerOrInline: !!document.querySelector('.notebook-cell-editor-resizer'),
  stackScrollClass: !!document.querySelector('.notebook-stack-scroll'),
  runBtns: document.querySelectorAll('[data-run-cell]').length,
}));
// click a nav card (add one first so there are 2) via menu
await p.click('[data-cell-menu]');
await p.waitForSelector('[data-cell-actions]');
await p.evaluate(()=>document.querySelectorAll('[data-cell-actions] button').forEach(x=>{if(x.textContent==='Insert code below')x.click();}));
await new Promise(r=>setTimeout(r,300));
const navAfter = await p.evaluate(()=>document.querySelectorAll('[data-nav-cell]').length);
// click nav card 2 -> it becomes active (focused)
await p.evaluate(()=>{ const cards=[...document.querySelectorAll('[data-nav-cell]')]; cards[1].click(); });
await new Promise(r=>setTimeout(r,300));
const activeNav = await p.evaluate(()=>{ const cards=[...document.querySelectorAll('[data-nav-cell]')]; return cards[1]?.className.includes('indigo'); });
// run first cell, expect output or eval (no crash)
await p.evaluate(()=>document.querySelector('[data-run-cell]').click());
await new Promise(r=>setTimeout(r,2500));
const ran = await p.evaluate(()=>!!document.querySelector('[data-cell-output]'));
console.log('struct:', JSON.stringify(struct));
console.log('navAfterInsert:', navAfter, '| nav card 2 active after click:', activeNav, '| ran(output host present):', ran);
console.log(errs.length?('ERRORS:'+errs.slice(0,4).join(' | ')):'no page errors');
await b.close();
