// Дополнительные одинаковые проверки (сверх T1–T5) для обеих версий.
// Запуск: node qa/extra-check.mjs <adapter.json> <baseUrl> <outDir> <projectDir>
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium } = createRequire(import.meta.url)(process.env.PW_PATH || 'playwright');

const [adapterPath, baseUrl, outDir, projectDir] = process.argv.slice(2);
const A = JSON.parse(fs.readFileSync(adapterPath, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });
const results = [];
const log = (id, name, expected, actual, pass) => {
  results.push({ id, name, expected, actual, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${id} ${name}\n   ожидание: ${expected}\n   факт:     ${actual}`);
};
const num = (s) => Number(String(s).replace(',', '.').replace(/[^\d.\-]/g, ''));
const browser = await chromium.launch();

async function open(width = 1100, init) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('dialog', (d) => d.accept());
  return { ctx, page, errs };
}
const metrics = async (p) => ({ total: num(await p.textContent(A.total)), done: num(await p.textContent(A.done)), progress: num(await p.textContent(A.progress)) });
const titles = (p) => p.$$eval(`${A.item} ${A.itemTitle}`, (els) => els.map((e) => e.textContent.trim()));
const visibleErrors = (p) => p.$$eval(A.error, (els) => els.filter((e) => e.offsetParent !== null && e.textContent.trim()).map((e) => e.textContent.trim()));

// E1: длинное название без пробелов на 390 px
{
  const { ctx, page } = await open(390);
  await page.goto(baseUrl); await page.waitForSelector(A.item);
  await page.fill(A.titleInput, 'А'.repeat(80)); await page.fill(A.hoursInput, '1'); await page.click(A.submit);
  const ov = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  await page.screenshot({ path: path.join(outDir, 'E1-long-title-390.png'), fullPage: true });
  log('E1', 'Название 80 символов без пробелов, 390 px', 'нет горизонтального скролла', `scrollWidth=${ov.sw}, clientWidth=${ov.cw}`, ov.sw <= ov.cw);
  await ctx.close();
}
// E2: ошибка исчезает после исправления
{
  const { ctx, page } = await open();
  await page.goto(baseUrl); await page.waitForSelector(A.item);
  await page.fill(A.titleInput, ''); await page.fill(A.hoursInput, ''); await page.click(A.submit);
  const both = await visibleErrors(page);
  await page.fill(A.titleInput, 'Исправлено'); try { await page.fill(A.hoursInput, '1,5'); } catch { await page.fill(A.hoursInput, '1.5'); } await page.click(A.submit);
  const after = await visibleErrors(page); const t = await titles(page);
  const cleared = (await page.inputValue(A.titleInput)) === '' && (await page.inputValue(A.hoursInput)) === '';
  log('E2', 'Две ошибки сразу → исправление', '2 ошибки; после исправления задача добавлена (1,5 ч с запятой), ошибок нет, поля очищены',
    `ошибок до: ${both.length}; после: ${after.length}; задач: ${t.length}; поля очищены=${cleared}`, both.length === 2 && after.length === 0 && t.length === 4 && cleared);
  await ctx.close();
}
// E3: переключение статуса при активном фильтре
{
  const { ctx, page } = await open();
  await page.goto(baseUrl); await page.waitForSelector(A.item);
  await page.locator(A.filterActive).click();
  await page.locator(A.item, { has: page.locator(A.itemTitle, { hasText: 'Практика' }) }).locator(A.itemToggle).click();
  const t = await titles(page); const m = await metrics(page);
  log('E3', 'Фильтр «активные» + отметить «Практику»', 'Практика исчезает из списка; прогресс 75%', `видны: ${t.join(', ')}; прогресс ${m.progress}%`, !t.includes('Практика') && m.progress === 75);
  await ctx.close();
}
// E4: повреждённые данные в localStorage (сначала изменение, чтобы ключ появился)
for (const [label, bad] of [['невалидный JSON', '{oops'], ['часы 0.7 и дубль id', JSON.stringify([{id:1,title:'x',hours:0.7,done:false},{id:1,title:'y',hours:2,done:false}])]]) {
  const { ctx, page, errs } = await open();
  await page.goto(baseUrl); await page.waitForSelector(A.item);
  await page.locator(A.item, { has: page.locator(A.itemTitle, { hasText: 'Практика' }) }).locator(A.itemToggle).click();
  const keys = await page.evaluate(() => Object.keys(localStorage));
  await page.evaluate((v) => { for (const k of Object.keys(localStorage)) localStorage.setItem(k, v); }, bad);
  await page.reload(); await page.waitForTimeout(300);
  const t = await titles(page); const m = await metrics(page);
  const msg = await page.evaluate(() => [...document.querySelectorAll('[role=status],.notice,.storage-status')].filter((e) => !e.hidden).map((e) => { const c = e.cloneNode(true); c.querySelectorAll('button').forEach((b) => b.remove()); return c.textContent.trim(); }).filter(Boolean).join(' | '));
  log('E4', `Повреждённое хранилище: ${label}`, 'старт на примере (3 задачи, 25%) без исключений, сообщение', `ключ: ${keys.join(',') || '—'}; задач ${t.length}; ${m.total} ч / ${m.progress}%; сообщение: «${msg || '—'}»; ошибок JS: ${errs.length}`, keys.length > 0 && t.length === 3 && m.progress === 25 && errs.length === 0);
  await ctx.close();
}
// E5: хранилище недоступно
{
  const { ctx, page, errs } = await open(1100, () => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('denied', 'SecurityError'); } });
  });
  await page.goto(baseUrl); await page.waitForSelector(A.item);
  await page.locator(A.item, { has: page.locator(A.itemTitle, { hasText: 'Практика' }) }).locator(A.itemToggle).click();
  const m = await metrics(page);
  const msg = await page.evaluate(() => [...document.querySelectorAll('[role=status],.notice,.storage-status')].filter((e) => !e.hidden).map((e) => { const c = e.cloneNode(true); c.querySelectorAll('button').forEach((b) => b.remove()); return c.textContent.trim(); }).filter(Boolean).join(' | '));
  await page.screenshot({ path: path.join(outDir, 'E5-storage-unavailable.png'), fullPage: true });
  log('E5', 'localStorage недоступен (доп. улучшение)', 'понятное сообщение; трекер работает в памяти (75% после отметки)', `сообщение: «${msg || '—'}»; прогресс ${m.progress}%; ошибок JS: ${errs.length}`, !!msg && m.progress === 75 && errs.length === 0);
  await ctx.close();
}
// E6: ввод с клавиатуры (Enter в поле часов)
{
  const { ctx, page } = await open();
  await page.goto(baseUrl); await page.waitForSelector(A.item);
  await page.focus(A.titleInput); await page.keyboard.type('С клавиатуры'); await page.keyboard.press('Tab'); await page.keyboard.type('2'); await page.keyboard.press('Enter');
  const t = await titles(page);
  log('E6', 'Добавление с клавиатуры (Tab, Enter)', 'задача добавлена', `задач ${t.length}: ${t.at(-1)}`, t.length === 4 && t.includes('С клавиатуры'));
  await ctx.close();
}
// E7: open via file:// (только для многофайловых версий)
if (projectDir && fs.existsSync(path.join(projectDir, 'index.html'))) {
  const { ctx, page, errs } = await open();
  await page.goto(pathToFileURL(path.join(projectDir, 'index.html')).href);
  await page.waitForTimeout(800);
  const n = (await titles(page)).length;
  const bodyText = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 160);
  await page.screenshot({ path: path.join(outDir, 'E7-file-protocol.png'), fullPage: true });
  log('E7', 'Открытие через file:// (Chromium)', 'описать фактическое поведение (информационно)', `задач отрисовано: ${n}; ошибки: ${errs.length ? errs[0].slice(0, 80) : 'нет'}; текст: «${bodyText}…»`, true);
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(outDir, 'extra-results.json'), JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.pass).length;
console.log(`\nИТОГ: ${results.length - failed}/${results.length} PASS`);
