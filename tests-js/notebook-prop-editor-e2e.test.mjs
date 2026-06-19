import puppeteer from "puppeteer";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function assertOk(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function withServer(fn) {
  const server = spawn("npm", ["run", "dev"], {
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

async function runPropEditorE2E(url, browser) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto(`${url}/editor`, { waitUntil: "networkidle2", timeout: 90000 });
  await page.waitForSelector("[data-notebook-root]", { timeout: 45000 });

  const multiLineSource = `module Main exposing (a, b)

a : Int
a = 1

b : Int
b = 2
`;
  const tmpFile = path.join(os.tmpdir(), `prop-editor-${Date.now()}.verdict`);
  fs.writeFileSync(tmpFile, multiLineSource);
  const input = await page.waitForSelector("[data-notebook-file-input]", { timeout: 5000 });
  await input.uploadFile(tmpFile);
  fs.unlinkSync(tmpFile);
  await delay(600);

  const cmLineCount = await page.evaluate(() => {
    const cell = document.querySelector('[data-cell-focused="1"]');
    const lines = cell?.querySelectorAll(".cm-line");
    return lines?.length ?? 0;
  });
  assertOk(cmLineCount >= 4, `focused CM6 editor should show multiple lines, got ${cmLineCount}`);

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === "+ Code");
    btn?.click();
  });
  await delay(400);

  const readonlyCmLines = await page.evaluate(() => {
    const cell = [...document.querySelectorAll("[data-cell-id]")].find((c) => c.dataset.cellFocused !== "1");
    return cell?.querySelectorAll(".cm-line")?.length ?? 0;
  });
  assertOk(readonlyCmLines >= 4, `readonly CM6 cell should preserve line breaks, got ${readonlyCmLines} lines`);

  await page.evaluate(() => {
    const cell = [...document.querySelectorAll("[data-cell-id]")].find((c) => c.dataset.cellFocused !== "1");
    cell?.querySelector(".cm-content")?.click();
  });
  await delay(300);

  const cmAfterRefocus = await page.evaluate(() => {
    return document.querySelectorAll('[data-cell-focused="1"] .cm-line').length;
  });
  assertOk(cmAfterRefocus >= 4, `CM6 should restore after refocus, got ${cmAfterRefocus}`);

  if (errors.length) throw new Error(`console errors: ${errors.join("; ")}`);
  await page.close();
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    console.log("E2E Prop Editor (dev)…");
    await withServer((url) => runPropEditorE2E(url, browser));
    console.log("✓ Prop Editor formatting E2E passed");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
