// Regression test for the PureScript output system: widgets render, charts fit
// their column (no overlap) and re-fit on panel resize (ResizeObserver), dBox
// styling overrides defaults, tabs switch, fullscreen toggles, sheet export is
// present — all deterministic (no network). Run: node tests-js/output-regression-e2e.test.mjs
import puppeteer from "puppeteer";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
function check(cond, msg) {
  console.log(`${cond ? "ok  " : "FAIL"} - ${msg}`);
  if (!cond) failures += 1;
}

const GALLERY = [
  "module Main exposing (gallery)",
  "import Display exposing (..)",
  "",
  "gallery : Json",
  "gallery = dStack([",
  '  dSection("Grid", [ dGrid(2, [',
  '    dChartY("Line", [dLine("a", [0,1,2,3,4], [10,40,30,60,50], "#34d399")], "x", "y"),',
  '    dChartY("Bars", [dBar("b", [0,1,2,3], [5,9,3,7], "#60a5fa")], "x", "y") ]) ]),',
  '  dBox("text-amber-300 text-2xl", dText("Styled")),',
  '  dTabs([ dTab("First", dText("Tab ONE out")), dTab("Second", dText("Tab TWO out")) ]),',
  '  dFull(dText("FS body")),',
  '  dSheet([{ a = 1, b = 2 }])',
  "])",
].join("\n");

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
      const m = d.toString().match(/http:\/\/(?:localhost|127\.0\.0\.1):\d+/);
      if (m && !url) { url = m[0]; clearTimeout(t); resolve(); }
    });
    server.stderr.on("data", () => {});
  });
  try { await fn(url); } finally { server.kill(); }
}

await withServer(async (url) => {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await page.evaluateOnNewDocument((src) => {
    window.__verdictEditorConfig = { default: { inputs: [], defaultDocument: {
      formatVersion: 3, seedSig: "gallery",
      cells: [{ kind: "code", role: "runnable", path: "Main.verdict", moduleName: "Main", source: src }] } } };
  }, GALLERY);
  await page.goto(`${url}/editor`, { waitUntil: "networkidle2", timeout: 60000 });
  await delay(4500);
  await page.evaluate(() => {
    const t = [...document.querySelectorAll("button")].find((b) => /^run all$/i.test((b.textContent || "").trim()));
    t && t.click();
  });
  await delay(3000);

  const base = await page.evaluate(() => {
    const charts = [...document.querySelectorAll("[data-chart-key]")];
    const styled = [...document.querySelectorAll("[data-text-key]")].find((e) => /^Styled$/.test((e.textContent || "").trim()));
    return {
      section: !!document.querySelector("[data-displaysection]"),
      grid: !!document.querySelector("[data-displaygrid]"),
      chartsPlotted: charts.filter((c) => c._fullLayout).length,
      chartsFitted: charts.filter((c) => Math.round(c.getBoundingClientRect().width) === Math.round(c._fullLayout?.width || 0)).length,
      styledColor: styled ? getComputedStyle(styled).color : "",
      hasFsBtn: [...document.querySelectorAll("button")].some((b) => /fullscreen/i.test(b.textContent || "")),
      hasExport: [...document.querySelectorAll("button")].some((b) => /export csv/i.test(b.textContent || "")),
      activeTabText: ([...document.querySelectorAll("[data-text-key]")].map((e) => e.textContent || "").join(" ")),
    };
  });
  check(base.section && base.grid, "section + grid layouts render");
  check(base.chartsPlotted === 2, `both charts plotted (${base.chartsPlotted}/2)`);
  check(base.chartsFitted === 2, `both charts fit their column (${base.chartsFitted}/2)`);
  check(/amber|oklch\(0\.8/.test(base.styledColor) || base.styledColor.includes("251") , `dBox styling applied (color ${base.styledColor})`);
  check(base.hasFsBtn, "fullscreen toggle present");
  check(base.hasExport, "sheet export button present");
  check(base.activeTabText.includes("Tab ONE out") && !base.activeTabText.includes("Tab TWO out"), "only active tab content rendered");

  // tab switch
  await page.evaluate(() => { const t = [...document.querySelectorAll("button")].find((b) => (b.textContent || "").trim() === "Second"); t && t.click(); });
  await delay(400);
  const afterTab = await page.evaluate(() => [...document.querySelectorAll("[data-text-key]")].map((e) => e.textContent || "").join(" "));
  check(afterTab.includes("Tab TWO out") && !afterTab.includes("Tab ONE out"), "tab switch shows the other tab");

  // fullscreen toggle
  await page.evaluate(() => { const t = [...document.querySelectorAll("button")].find((b) => /fullscreen/i.test(b.textContent || "")); t && t.click(); });
  await delay(400);
  const fsOn = await page.evaluate(() => !!document.querySelector(".fixed.inset-0.z-50"));
  check(fsOn, "fullscreen overlay opens");
  await page.evaluate(() => { const t = [...document.querySelectorAll("button")].find((b) => /exit/i.test(b.textContent || "")); t && t.click(); });
  await delay(300);

  // panel resize -> charts re-fit (ResizeObserver)
  await page.setViewport({ width: 1000, height: 900 });
  await delay(800);
  const afterResize = await page.evaluate(() =>
    [...document.querySelectorAll("[data-chart-key]")].filter((c) => Math.round(c.getBoundingClientRect().width) === Math.round(c._fullLayout?.width || 0)).length);
  check(afterResize === 2, `charts re-fit after panel resize (${afterResize}/2)`);

  check(errs.length === 0, `no console errors (${errs.slice(0, 2).join(" | ")})`);
  await browser.close();
});

console.log(failures === 0 ? "\nOUTPUT REGRESSION: all checks passed" : `\nOUTPUT REGRESSION: ${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
