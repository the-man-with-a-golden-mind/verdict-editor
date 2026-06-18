import puppeteer from 'puppeteer';
import { writeFileSync } from 'node:fs';
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto('http://localhost:4173/editor', { waitUntil: 'networkidle2', timeout: 60000 });
await page.waitForSelector('[data-notebook-root]', { timeout: 30000 });
await new Promise((r) => setTimeout(r, 2500));
// Pull the Monaco model value (whole program) from the page.
const src = await page.evaluate(() => {
  const ed = document.querySelector('verdict-editor');
  // Try notebook api via a known global hook, else read all cell editor text.
  const cells = [...document.querySelectorAll('[data-notebook-root] .notebook-cell-editor, [data-notebook-root] .notebook-cell-folded-head')];
  return null; // placeholder
});
// Fallback: read first Monaco model
const model = await page.evaluate(() => {
  try {
    const monaco = window.monaco;
    if (monaco && monaco.editor) {
      const models = monaco.editor.getModels();
      return models.map((m) => m.getValue()).join('\n\n--MODEL--\n\n');
    }
  } catch (e) { return 'ERR ' + e.message; }
  return 'no-monaco';
});
writeFileSync('dumped-src.txt', model || 'null');
console.log('len', (model||'').length);
await browser.close();
