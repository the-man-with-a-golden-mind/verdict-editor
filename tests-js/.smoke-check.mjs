// Ad-hoc smoke check for the notebook strangler refactor. Not part of the test
// suite; run manually after each step. Asserts the spec's browser requirements.
import puppeteer from "puppeteer";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function withServer(fn) {
  const server = spawn("npm", ["run", "preview"], {
    cwd: root,
    stdio: "pipe",
    shell: true,
    env: { ...process.env, PATH: `${process.env.HOME}/.nvm/versions/node/v24.16.0/bin:${process.env.PATH}` },
  });
  let url = "";
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("server timeout")), 90000);
    server.stdout.on("data", (d) => {
      const m = d.toString().match(/http:\/\/localhost:\d+/);
      if (m) { url = m[0]; clearTimeout(t); resolve(); }
    });
    server.stderr.on("data", (d) => process.stderr.write(d));
  });
  try { await fn(url); } finally { server.kill(); }
}

function ok(cond, msg) { if (!cond) throw new Error("FAIL: " + msg); console.log("  ok:", msg); }

async function run(url, browser) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (msg) => { if (msg.type() === "error") errors.push("console: " + msg.text()); });

  await page.goto(`${url}/editor`, { waitUntil: "networkidle2", timeout: 90000 });
  await page.waitForSelector("[data-notebook-root]", { timeout: 45000 });
  ok(true, "[data-notebook-root] mounted");

  // Toolbar buttons render (from PureScript ps-spa component).
  await page.waitForSelector(".notebook-toolbar-host", { timeout: 10000 });
  const toolbarLabels = await page.evaluate(() => {
    const host = document.querySelector(".notebook-toolbar-host");
    return [...(host?.querySelectorAll("button") ?? [])].map((b) => b.textContent?.trim());
  });
  for (const label of ["Save", "+ Code", "+ Text", "Run", "Run all", "Reset", "Source", "Open"]) {
    ok(toolbarLabels.includes(label), `toolbar has "${label}" button`);
  }

  // Default example: at least 2 cells.
  const cellCount = await page.evaluate(() => document.querySelectorAll("[data-cell-id]").length);
  ok(cellCount >= 2, `default example renders >= 2 cells (got ${cellCount})`);

  // Cell gutter renders from the PureScript ps-spa component (mounted via rAF).
  await page.waitForSelector('[data-cell-id] [data-run-cell]', { timeout: 10000 });
  const gutter = await page.evaluate(() => {
    const cell = [...document.querySelectorAll('[data-cell-id]')].find((c) => c.querySelector('[data-run-cell]'));
    if (!cell) return null;
    return {
      id: cell.dataset.cellId,
      run: !!cell.querySelector('[data-run-cell]'),
      menu: !!cell.querySelector('[data-cell-menu]'),
      actions: !!cell.querySelector('[data-cell-actions]'),
      foldIcons: [...cell.querySelectorAll('.notebook-cell-gutter .notebook-gutter-btn')].map((b) => b.textContent?.trim()),
    };
  });
  ok(gutter?.run, "gutter has run button");
  ok(gutter?.menu, "gutter has ⋯ overflow menu");
  ok(gutter?.foldIcons?.some((t) => t === "▾" || t === "▸"), "gutter has fold-all icon");
  ok(gutter?.foldIcons?.includes("{}"), "gutter has fold-code icon");

  // Fold-all icon toggles the cell to a folded preview, then back.
  await page.evaluate((id) => {
    const cell = document.querySelector(`[data-cell-id="${id}"]`);
    const btn = [...cell.querySelectorAll('.notebook-cell-gutter .notebook-gutter-btn')].find((b) => b.textContent?.trim() === "▾");
    btn?.click();
  }, gutter.id);
  await delay(300);
  const foldedAfter = await page.evaluate((id) => {
    const fresh = document.querySelector(`[data-cell-id="${id}"]`);
    return fresh?.classList.contains("notebook-cell--folded");
  }, gutter.id);
  ok(foldedAfter, "fold-all icon collapses the cell");
  await page.evaluate((id) => {
    const cell = document.querySelector(`[data-cell-id="${id}"]`);
    const btn = [...cell.querySelectorAll('.notebook-cell-gutter .notebook-gutter-btn')].find((b) => b.textContent?.trim() === "▸");
    btn?.click();
  }, gutter.id);
  await delay(200);

  // Run all → charts render.
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll(".notebook-toolbar-host button")].find((b) => b.textContent?.trim() === "Run all");
    btn?.click();
  });
  await page.waitForSelector(".js-plotly-plot", { timeout: 60000 });
  const chartCount = await page.evaluate(() => document.querySelectorAll(".js-plotly-plot").length);
  ok(chartCount >= 1, `Plotly charts render after Run all (got ${chartCount})`);

  // A toolbar button handler works end-to-end: + Code adds a cell.
  const before = await page.evaluate(() => document.querySelectorAll("[data-cell-id]").length);
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll(".notebook-toolbar-host button")].find((b) => b.textContent?.trim() === "+ Code");
    btn?.click();
  });
  await delay(400);
  const after = await page.evaluate(() => document.querySelectorAll("[data-cell-id]").length);
  ok(after === before + 1, `"+ Code" toolbar handler adds a cell (${before} -> ${after})`);

  if (errors.length) throw new Error("page errors: " + errors.join(" | "));
  ok(true, "no page/console errors");
  await page.close();
}

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  try {
    console.log("Smoke check (preview)...");
    await withServer((url) => run(url, browser));
    console.log("SMOKE CHECK PASSED");
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
