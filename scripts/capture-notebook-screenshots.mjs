#!/usr/bin/env node
import puppeteer from "puppeteer";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "docs/notebook-screenshots");
fs.mkdirSync(outDir, { recursive: true });

const server = spawn("npm", ["run", "preview"], {
  cwd: root,
  stdio: "pipe",
  shell: true,
  env: { ...process.env, PATH: `${process.env.HOME}/.nvm/versions/node/v24.16.0/bin:${process.env.PATH}` },
});

let url = "";
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error("preview timeout")), 60000);
  server.stdout.on("data", (d) => {
    const m = d.toString().match(/http:\/\/localhost:\d+/);
    if (m) {
      url = m[0];
      clearTimeout(t);
      resolve();
    }
  });
});

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
await page.goto(`${url}/editor`, { waitUntil: "networkidle2", timeout: 90000 });
await page.waitForSelector("[data-notebook-root]", { timeout: 45000 });
await page.screenshot({ path: path.join(outDir, "01-notebook-stack.png") });

await page.evaluate(async () => {
  const res = await fetch("/lib/notebook.mjs");
  const blob = URL.createObjectURL(new Blob([await res.text()], { type: "text/javascript" }));
  const mod = await import(blob);
  URL.revokeObjectURL(blob);
  const host = document.createElement("div");
  host.className = "p-4 flex flex-col gap-3";
  document.querySelector("[data-notebook-root]")?.appendChild(host);
  await mod.renderDisplayInto(host, { kind: "text", text: "**Hello** notebook" }, {});
  const tableHost = document.createElement("div");
  host.appendChild(tableHost);
  await mod.renderDisplayInto(tableHost, { kind: "table", rows: [{ x: 1, y: 2 }] }, {});
});
await page.screenshot({ path: path.join(outDir, "02-text-table-output.png") });

await page.evaluate(async () => {
  const res = await fetch("/lib/notebook.mjs");
  const blob = URL.createObjectURL(new Blob([await res.text()], { type: "text/javascript" }));
  const mod = await import(blob);
  URL.revokeObjectURL(blob);
  const host = document.createElement("div");
  host.className = "p-4";
  document.querySelector("[data-notebook-root]")?.appendChild(host);
  const bridge = {
    loadPlotly: async () => {
      const p = await fetch("/lib/plotly.chunk.mjs");
      const b = URL.createObjectURL(new Blob([await p.text()], { type: "text/javascript" }));
      const m = await import(b);
      URL.revokeObjectURL(b);
      return m.default ?? m;
    },
  };
  await mod.renderDisplayInto(
    host,
    {
      kind: "chart",
      title: "Demo",
      traces: [{ name: "s", kind: "line", x: [1, 2, 3], y: [2, 4, 3] }],
      xaxis: { title: "x" },
      yaxis: { title: "y" },
    },
    bridge,
  );
});
await page.waitForSelector("[data-plotly-chart]", { timeout: 30000 });
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: path.join(outDir, "03-chart-plotly.png") });

await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === "+ Text")?.click();
});
await page.waitForSelector("[data-wysiwyg]", { timeout: 5000 });
await page.screenshot({ path: path.join(outDir, "04-wysiwyg-cell.png") });

await browser.close();
server.kill();
console.log("Wrote screenshots to", outDir);
