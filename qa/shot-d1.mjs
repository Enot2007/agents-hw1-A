// Скриншот дефекта D1 (v1): ввод «Тест» / 24.5 до и после исправления
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PW_PATH || 'playwright');
const [url, out] = process.argv.slice(2);
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await p.goto(url); await p.evaluate(() => localStorage.clear()); await p.reload();
await p.fill('#nameInput', 'Тест'); await p.fill('#hoursInput', '24.5'); await p.click('#form button[type=submit]');
await p.waitForTimeout(400); await p.screenshot({ path: out, fullPage: true }); await b.close();
