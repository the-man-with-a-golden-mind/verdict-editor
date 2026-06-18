import puppeteer from "puppeteer";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickButton(page, text) {
  await page.evaluate((label) => {
    const btn = [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === label);
    btn?.click();
  }, text);
}

async function withServer(mode, fn) {
  const cmd = mode === "preview" ? ["run", "preview"] : ["run", "dev"];
  const server = spawn("npm", cmd, {
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
      if (m) {
        url = m[0];
        clearTimeout(t);
        resolve();
      }
    });
    server.stderr.on("data", (d) => process.stderr.write(d));
  });
  try {
    await fn(url);
  } finally {
    server.kill();
  }
}

async function runE2E(url, browser) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  const context = browser.defaultBrowserContext();
  await context.overridePermissions(new URL(url).origin, ["clipboard-read", "clipboard-write"]);

  await page.goto(`${url}/editor`, { waitUntil: "networkidle2", timeout: 90000 });
  await page.waitForSelector("[data-notebook-root]", { timeout: 45000 });

  const tableSource = `module Main exposing (rows)

rows : List { val : String }
rows = [{ val = "a" }, { val = "b,b" }]
`;
  const tmpFile = path.join(os.tmpdir(), `notebook-table-${Date.now()}.verdict`);
  fs.writeFileSync(tmpFile, tableSource);
  const input = await page.waitForSelector("[data-notebook-file-input]", { timeout: 5000 });
  await input.uploadFile(tmpFile);
  fs.unlinkSync(tmpFile);
  await delay(500);

  const runCells = await page.$$("[data-run-cell]");
  await runCells[runCells.length - 1]?.click();
  await page.waitForSelector("[data-notebook-table]", { timeout: 30000 });

  const tableOk = await page.evaluate(() => {
    const cells = [...document.querySelectorAll("[data-notebook-table] td")].map((td) => td.textContent ?? "");
    return cells.some((c) => c.includes("a"));
  });
  assertOk(tableOk, "table cell should contain row data");

  const clipCsv = await page.evaluate(async () => {
    const btn = document.querySelector("[data-copy-csv]");
    if (!btn) return "";
    let written = "";
    const orig = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = (text) => {
      written = text;
      return Promise.resolve();
    };
    btn.click();
    await new Promise((r) => setTimeout(r, 50));
    navigator.clipboard.writeText = orig;
    return written;
  });
  assertOk(clipCsv.includes("val") && clipCsv.includes("a"), `clipboard CSV: ${clipCsv}`);

  await page.evaluate(async () => {
    const res = await fetch("/lib/notebook.mjs");
    const blob = URL.createObjectURL(new Blob([await res.text()], { type: "text/javascript" }));
    const mod = await import(blob);
    URL.revokeObjectURL(blob);
    const host = document.createElement("div");
    document.querySelector("[data-notebook-root]")?.appendChild(host);
    await mod.renderDisplayInto(
      host,
      {
        kind: "stack",
        items: [
          { kind: "text", text: "stack line" },
          { kind: "table", rows: [{ k: "v" }] },
        ],
      },
      {},
    );
  });
  await page.waitForSelector("[data-notebook-stack]", { timeout: 5000 });
  const stackOk = await page.evaluate(() => {
    const stacks = [...document.querySelectorAll("[data-notebook-stack]")];
    return stacks.some(
      (stack) =>
        !!stack.querySelector(".notebook-text-output") && !!stack.querySelector("[data-notebook-table]"),
    );
  });
  assertOk(stackOk, "stack should render nested text and table");

  await page.evaluate(async () => {
    const res = await fetch("/lib/notebook.mjs");
    const blob = URL.createObjectURL(new Blob([await res.text()], { type: "text/javascript" }));
    const mod = await import(blob);
    URL.revokeObjectURL(blob);
    const host = document.createElement("div");
    document.querySelector("[data-notebook-root]")?.appendChild(host);
    const chart = {
      kind: "chart",
      title: "E2E",
      traces: [{ name: "s", kind: "line", x: [1, 2, 3], y: [2, 4, 3] }],
      xaxis: { title: "x" },
      yaxis: { title: "y" },
    };
    const bridge = {
      loadPlotly: async () => {
        const p = await fetch("/lib/plotly.chunk.mjs");
        const b = URL.createObjectURL(new Blob([await p.text()], { type: "text/javascript" }));
        const m = await import(b);
        URL.revokeObjectURL(b);
        return m.default ?? m;
      },
    };
    await mod.renderDisplayInto(host, chart, bridge);
  });
  await page.waitForSelector("[data-plotly-chart]", { timeout: 30000 });
  const chartOk = await page.evaluate(() => {
    const el = document.querySelector("[data-plotly-chart]");
    return !!el && el.children.length > 0;
  });
  assertOk(chartOk, "Plotly chart host should render");

  await clickButton(page, "+ Text");
  await page.waitForSelector("[data-wysiwyg]", { timeout: 5000 });
  const wysiwygOk = await page.evaluate(() => {
    const host = document.querySelector("[data-wysiwyg]");
    return !!host?.querySelector("[contenteditable]") && !host.querySelector("textarea");
  });
  assertOk(wysiwygOk, "WYSIWYG shows rich text without raw Markdown");

  await clickButton(page, "Notebook ⇄ Source");
  await delay(800);
  await page.waitForSelector(".monaco-editor", { timeout: 10000 });
  const sourceText = await page.evaluate(() => {
    const lines = [...document.querySelectorAll(".monaco-editor .view-line")].map((el) => el.textContent ?? "");
    return lines.join("\n");
  });
  assertOk(sourceText.includes("rows") && sourceText.includes("List"), `Source mode should show concatenated program: ${sourceText.slice(0, 120)}`);

  await clickButton(page, "Notebook ⇄ Source");
  await delay(500);
  await page.waitForSelector("[data-notebook-stack]", { timeout: 5000 });

  if (errors.length) throw new Error(`console errors: ${errors.join("; ")}`);
  await page.close();
}

function assertOk(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    for (const mode of ["dev", "preview"]) {
      console.log(`E2E notebook (${mode})…`);
      await withServer(mode, (url) => runE2E(url, browser));
      console.log(`✓ ${mode}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
