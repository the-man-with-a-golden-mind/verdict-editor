import puppeteer from "puppeteer";
import { spawn } from "child_process";
import path from "path";
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
    const t = setTimeout(() => reject(new Error("timeout")), 90000);
    server.stdout.on("data", (d) => {
      const m = d.toString().match(/http:\/\/localhost:\d+/);
      if (m) {
        url = m[0];
        clearTimeout(t);
        resolve();
      }
    });
  });
  try {
    await fn(url);
  } finally {
    server.kill();
  }
}

async function runRegression(url, browser) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });

  await page.goto(`${url}/editor`, { waitUntil: "networkidle2", timeout: 90000 });
  await page.waitForSelector("verdict-editor", { timeout: 45000 });

  for (const tab of ["Editor", "DB", "Visual", "Debug"]) {
    await clickButton(page, tab);
    await delay(400);
  }

  await clickButton(page, "Editor");
  await clickButton(page, "Run");
  await page.waitForFunction(
    () => {
      const out = document.querySelector(".text-emerald-300, .text-rose-400, .text-slate-600");
      return out && (out.textContent?.length ?? 0) > 5;
    },
    { timeout: 45000 },
  );

  if (errors.length) throw new Error(errors.join("; "));
  await page.close();
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  for (const mode of ["dev", "preview"]) {
    console.log(`Regression e2e (${mode})…`);
    await withServer(mode, (url) => runRegression(url, browser));
    console.log(`✓ ${mode}`);
  }

  await browser.close();
  console.log("Regression e2e passed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
