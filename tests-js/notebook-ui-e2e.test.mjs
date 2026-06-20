import puppeteer from "puppeteer";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function assertOk(cond, msg) {
  if (!cond) throw new Error(msg);
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
      const m = d.toString().match(/http:\/\/(?:localhost|127\.0\.0\.1):\d+/);
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

async function clickButton(page, text) {
  const ok = await page.evaluate((label) => {
    const btn = [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === label);
    btn?.click();
    return !!btn;
  }, text);
  assertOk(ok, `button not found: ${text}`);
}

async function clickCellMenuItem(page, cellId, label) {
  const ok = await page.evaluate(
    ({ id, label }) => {
      const cell = document.querySelector(`[data-cell-id="${id}"]`);
      cell?.querySelector("summary[data-cell-menu]")?.click();
      const item = [...(cell?.querySelectorAll("[data-cell-actions] button") ?? [])].find(
        (b) => b.textContent?.trim() === label,
      );
      item?.click();
      return !!item;
    },
    { id: cellId, label },
  );
  assertOk(ok, `menu item not found for ${cellId}: ${label}`);
}

async function cellState(page) {
  return await page.evaluate(() => {
    const cells = [...document.querySelectorAll("[data-cell-id]")].map((el) => ({
      id: el.getAttribute("data-cell-id"),
      focused: el.getAttribute("data-cell-focused") === "1",
      folded: el.classList.contains("notebook-cell--folded"),
      maximized: el.classList.contains("notebook-cell--maximized"),
      text: el.textContent ?? "",
    }));
    return {
      cells,
      navIds: [...document.querySelectorAll("[data-cells-nav] [data-nav-cell]")].map((el) =>
        el.getAttribute("data-nav-cell"),
      ),
      inlineNavCount: document.querySelectorAll("[data-notebook-nav], .notebook-nav").length,
      outputResizeCount: document.querySelectorAll(".notebook-cell-output-resizer").length,
      editorResizeCount: document.querySelectorAll(".notebook-cell-editor-resizer").length,
      focusedIds: cells.filter((c) => c.focused).map((c) => c.id),
    };
  });
}

async function runNotebookUiE2E(url, browser) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });

  await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${url}/editor`, { waitUntil: "networkidle2", timeout: 90000 });
  await page.waitForSelector("[data-notebook-root]", { timeout: 45000 });
  await page.waitForFunction(() => document.querySelectorAll("[data-cell-id]").length >= 3, { timeout: 30000 });

  const initial = await cellState(page);
  assertOk(initial.cells.length === 3, `expected default three project cells, got ${initial.cells.length}`);
  assertOk(initial.navIds.length === 3, `expected three panel nav entries, got ${initial.navIds.length}`);
  assertOk(initial.inlineNavCount === 0, "dead inline notebook nav should not be rendered");
  assertOk(initial.outputResizeCount >= 2, "output resize handles should be present");
  assertOk(initial.editorResizeCount >= 3, "editor resize handles should be present");

  const secondId = initial.cells[2].id;
  await page.evaluate((id) => {
    document.querySelector(`[data-cells-nav] [data-nav-cell="${id}"] button`)?.click();
  }, secondId);
  await page.waitForFunction(
    (id) => document.querySelector(`[data-cell-id="${id}"]`)?.getAttribute("data-cell-focused") === "1",
    { timeout: 10000 },
    secondId,
  );
  const afterNav = await cellState(page);
  assertOk(afterNav.focusedIds.length === 1 && afterNav.focusedIds[0] === secondId, "panel nav should focus one cell");
  assertOk(
    afterNav.cells[0].text.includes("module Market exposing") && afterNav.cells[2].text.includes("simReport"),
    "moving the shared editor between cells must not corrupt cell source",
  );

  const cmTarget = await page.$(`[data-cell-id="${secondId}"] .cm-content`);
  assertOk(!!cmTarget, "focused cell should contain CodeMirror content");
  const box = await cmTarget.boundingBox();
  assertOk(!!box, "CodeMirror content should have a layout box");
  await page.evaluate(() => {
    const stack = document.querySelector("[data-notebook-stack]");
    if (stack) stack.scrollTop = 0;
  });
  await page.mouse.move(box.x + Math.min(box.width / 2, 80), box.y + Math.min(box.height / 2, 80));
  const beforeWheel = await page.evaluate(() => document.querySelector("[data-notebook-stack]")?.scrollTop ?? 0);
  await page.mouse.wheel({ deltaY: 500 });
  await delay(250);
  const wheel = await page.evaluate((before) => {
    const stack = document.querySelector("[data-notebook-stack]");
    return {
      before,
      after: stack?.scrollTop ?? 0,
      scrollHeight: stack?.scrollHeight ?? 0,
      clientHeight: stack?.clientHeight ?? 0,
    };
  }, beforeWheel);
  assertOk(wheel.scrollHeight > wheel.clientHeight, `notebook stack should be scrollable: ${JSON.stringify(wheel)}`);
  assertOk(wheel.after > wheel.before, `wheel over CodeMirror should scroll notebook stack: ${JSON.stringify(wheel)}`);

  await page.evaluate((id) => {
    document.querySelector(`[data-cells-nav] [data-nav-cell="${id}"] [data-run-cell]`)?.click();
  }, secondId);
  await page.waitForSelector(".js-plotly-plot, [data-plotly-chart]", { timeout: 45000 });
  const chartCount = await page.evaluate(() => document.querySelectorAll(".js-plotly-plot, [data-plotly-chart]").length);
  assertOk(chartCount > 0, "running the default display cell should render charts");

  await clickButton(page, "+ Code");
  await page.waitForFunction(() => document.querySelectorAll("[data-cell-id]").length === 4, { timeout: 10000 });
  await page.waitForFunction(() => document.querySelectorAll("[data-cells-nav] [data-nav-cell]").length === 4, {
    timeout: 10000,
  });
  const afterAdd = await cellState(page);
  const addedId = afterAdd.cells[3].id;
  assertOk(afterAdd.focusedIds.length === 1 && afterAdd.focusedIds[0] === addedId, "added code cell should be focused");

  await page.evaluate((id) => {
    document.querySelector(`[data-fold-cell="${id}"]`)?.click();
  }, addedId);
  await page.waitForFunction(
    (id) => document.querySelector(`[data-cell-id="${id}"]`)?.classList.contains("notebook-cell--folded"),
    { timeout: 10000 },
    addedId,
  );

  await clickCellMenuItem(page, addedId, "Delete cell");
  await page.waitForFunction(() => document.querySelectorAll("[data-cell-id]").length === 3, { timeout: 10000 });
  await page.waitForFunction(() => document.querySelectorAll("[data-cells-nav] [data-nav-cell]").length === 3, {
    timeout: 10000,
  });

  const firstId = (await cellState(page)).cells[0].id;
  await clickCellMenuItem(page, firstId, "Maximize");
  await page.waitForFunction(
    (id) => document.querySelector(`[data-cell-id="${id}"]`)?.classList.contains("notebook-cell--maximized"),
    { timeout: 10000 },
    firstId,
  );
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector(".notebook-cell--maximized"), { timeout: 10000 });

  await clickCellMenuItem(page, firstId, "Move down");
  await page.waitForFunction(
    (id) => document.querySelectorAll("[data-cell-id]")[1]?.getAttribute("data-cell-id") === id,
    { timeout: 10000 },
    firstId,
  );

  if (errors.length) throw new Error(errors.join("; "));
  await page.close();
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    for (const mode of ["dev", "preview"]) {
      console.log(`Notebook UI e2e (${mode})…`);
      await withServer(mode, (url) => runNotebookUiE2E(url, browser));
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
