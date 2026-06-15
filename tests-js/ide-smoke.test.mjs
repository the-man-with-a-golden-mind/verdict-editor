import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

async function runTest() {
  console.log('🚀 Starting Vite dev server...');
  const vite = spawn('bun', ['run', 'dev'], {
    cwd: ROOT,
    stdio: 'pipe',
    shell: true,
  });

  let url = '';
  const serverStarted = new Promise((resolve) => {
    vite.stdout.on('data', (data) => {
      const msg = data.toString();
      const match = msg.match(/http:\/\/localhost:\d+/);
      if (match) {
        url = match[0];
        console.log(`✅ Vite started at ${url}`);
        resolve();
      }
    });
  });

  try {
    await serverStarted;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    console.log('🌐 Navigating to Editor...');
    await page.goto(`${url}/editor`, { waitUntil: 'networkidle2' });

    // 1. Check if Editor page loaded
    const title = await page.$eval('h1', el => el.innerText);
    console.log(`Page Title: ${title}`);
    if (title !== 'Verdict IDE') throw new Error('Failed to load Editor page');

    // 2. Click Run on the default code (main = 42)
    console.log('🖱️ Clicking Run Program...');
    const runBtn = await page.waitForSelector('button');
    await runBtn.click();

    // 3. Verify Output
    console.log('🔍 Verifying Output...');
    await page.waitForFunction(() => {
      const el = document.querySelector('.text-emerald-400');
      return el && el.innerText.includes('Program Result:');
    }, { timeout: 10000 });

    const resultValue = await page.$eval('.text-white.text-lg', el => el.innerText);
    console.log(`Raw Result: ${resultValue}`);
    const parsed = JSON.parse(resultValue);
    if (parsed.result.int !== '42') throw new Error(`Expected int 42, got ${parsed.result.int}`);

    // 4. Test Compilation Error
    console.log('⚠️ Testing Compilation Error...');
    // We'll use page.evaluate to set Monaco value since typing is slow
    await page.evaluate(() => {
        const editor = document.querySelector('verdict-editor').editor;
        editor.setValue('module Main exposing (main)\n\nmain : Int\nmain = undefined');
    });

    await runBtn.click();

    await page.waitForFunction(() => {
      const el = document.querySelector('.text-rose-400');
      return el && el.innerText.includes('Compilation Error:');
    }, { timeout: 5000 });
    
    const errorText = await page.$eval('.text-rose-200', el => el.innerText);
    console.log(`Expected Error Found: ${errorText.substring(0, 50)}...`);

    // 5. Check Bytecode
    console.log('📜 Checking Bytecode Editor...');
    const bytecode = await page.evaluate(() => {
        return document.querySelector('verdict-editor').bytecodeEditor.getValue();
    });
    if (!bytecode || bytecode.length < 10) throw new Error('Bytecode editor is empty');
    console.log('✅ Bytecode exists.');

    console.log('✨ All tests passed successfully!');
    await browser.close();
    vite.kill();
    process.exit(0);

  } catch (err) {
    console.error('❌ Test failed:', err);
    vite.kill();
    process.exit(1);
  }
}

runTest();