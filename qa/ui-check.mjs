// Одинаковая браузерная проверка T1–T5 + 390 px для обеих версий.
// Запуск: node qa/ui-check.mjs <adapter.json> <baseUrl> <outDir>
// Адаптер содержит только селекторы конкретной версии; сценарии и ожидания общие.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PW_PATH || 'playwright');
import fs from 'node:fs';
import path from 'node:path';

const [adapterPath, baseUrl, outDir] = process.argv.slice(2);
const A = JSON.parse(fs.readFileSync(adapterPath, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });

const results = [];
const log = (id, name, expected, actual, pass) => {
  results.push({ id, name, expected, actual, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${id} ${name}\n   ожидание: ${expected}\n   факт:     ${actual}`);
};
const num = (s) => Number(String(s).replace(',', '.').replace(/[^\d.\-]/g, ''));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
const page = await ctx.newPage();
const consoleErrors = [];
page.on('pageerror', (e) => consoleErrors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

async function safeFill(sel, v) {
  try { await page.fill(sel, v); return true; } catch { return false; }
}
async function fresh() {
  await page.goto(baseUrl);
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  await page.reload();
  await page.waitForSelector(A.item);
}
async function metrics() {
  return {
    total: (await page.textContent(A.total)).trim(),
    done: (await page.textContent(A.done)).trim(),
    progress: (await page.textContent(A.progress)).trim(),
  };
}
async function titles() {
  return page.$$eval(`${A.item} ${A.itemTitle}`, (els) => els.map((e) => e.textContent.trim()));
}
async function item(title) {
  return page.locator(A.item, { has: page.locator(A.itemTitle, { hasText: title }) }).first();
}
const fmt = (m) => `всего ${num(m.total)} ч, выполнено ${num(m.done)} ч, прогресс ${num(m.progress)}%`;

// T1
await fresh();
let m = await metrics(); let t = await titles();
log('T1', 'Исходный пример', '3 задачи; 8 ч; 2 ч; 25%',
  `${t.length} задачи (${t.join(', ')}); ${fmt(m)}`,
  t.length === 3 && num(m.total) === 8 && num(m.done) === 2 && num(m.progress) === 25);
await page.screenshot({ path: path.join(outDir, 'T1-initial-1100.png'), fullPage: true });

// T2
await (await item('Практика')).locator(A.itemToggle).click();
m = await metrics();
const praktikaDone = await (await item('Практика')).locator(A.itemToggle).isChecked().catch(() => null);
log('T2', 'Статус «Практика» → готово', '6 из 8 ч; 75%; чекбокс отмечен',
  `${fmt(m)}; чекбокс=${praktikaDone}`, num(m.done) === 6 && num(m.total) === 8 && num(m.progress) === 75 && praktikaDone !== false);
await page.screenshot({ path: path.join(outDir, 'T2-praktika-done.png'), fullPage: true });

// T3
await fresh();
await page.locator(A.filterActive).click();
m = await metrics(); t = await titles();
log('T3', 'Фильтр «активные»', 'видны только Практика и Повторение; прогресс 25%; всего 8 ч',
  `видны: ${t.join(', ')}; ${fmt(m)}`,
  t.length === 2 && t.includes('Практика') && t.includes('Повторение') && num(m.progress) === 25 && num(m.total) === 8);
await page.screenshot({ path: path.join(outDir, 'T3-filter-active.png'), fullPage: true });

// T4
const bad = [
  ['', '2', 'пустое название'], ['   ', '2', 'пробелы'], ['Тест', '', 'пустые часы'],
  ['Тест', '-1', 'отрицательные часы'], ['Тест', '0', 'ноль'], ['Тест', '24.5', '24,5 > 24'],
  ['Тест', '0.3', 'шаг 0,3'], ['Тест', '1.3', 'шаг 1,3'], ['Тест', 'abc', 'не число'],
];
const t4 = [];
let t4ok = true;
for (const [title, hours, label] of bad) {
  await fresh();
  await page.fill(A.titleInput, title);
  const typed = await safeFill(A.hoursInput, hours);
  if (!typed) { t4.push(`✓ ${label}: поле часов не принимает такой ввод (type=number) — ввести нельзя`); continue; }
  await page.click(A.submit);
  const n = (await titles()).length;
  const errText = (await page.$$eval(A.error, (els) => els.filter((e) => e.offsetParent !== null && e.textContent.trim()).map((e) => e.textContent.trim()))).join(' | ');
  const keptT = await page.inputValue(A.titleInput); const keptH = await page.inputValue(A.hoursInput);
  const ok = n === 3 && errText.length > 0 && keptT === title && keptH === hours;
  t4ok &&= ok;
  t4.push(`${ok ? '✓' : '✗'} ${label}: задач ${n}, ошибка «${errText || '—'}», поля сохранены=${keptT === title && keptH === hours}`);
}
const good = [['Мин', '0.5'], ['Макс', '24'], ['Шаг', '1.5']];
for (const [title, hours] of good) {
  await fresh();
  await page.fill(A.titleInput, title); await page.fill(A.hoursInput, hours); await page.click(A.submit);
  const tt = await titles(); const mm = await metrics();
  const ok = tt.length === 4 && tt.includes(title) && num(mm.total) === 8 + Number(hours);
  t4ok &&= ok;
  t4.push(`${ok ? '✓' : '✗'} допустимо ${hours}: задач ${tt.length}, всего ${num(mm.total)} ч`);
}
// ошибка видна → скриншот
await fresh();
await page.fill(A.titleInput, '   '); await page.fill(A.hoursInput, '-1'); await page.click(A.submit);
await page.screenshot({ path: path.join(outDir, 'T4-errors.png'), fullPage: true });
log('T4', 'Ошибки ввода и границы', 'некорректное не добавляется, видна ошибка, ввод сохранён; 0,5/24/1,5 добавляются', '\n     ' + t4.join('\n     '), t4ok);

// T5
await fresh();
for (let i = 0; i < 10 && (await titles()).length; i++) {
  await page.locator(`${A.item} ${A.itemDelete}`).first().click();
  if (A.confirmDelete) await page.locator(A.confirmDelete).click().catch(() => {});
}
m = await metrics(); t = await titles();
const body = await page.textContent('body');
const nan = /NaN|Infinity/.test(body);
await page.fill(A.titleInput, 'После очистки'); await page.fill(A.hoursInput, '2'); await page.click(A.submit);
const after = await metrics();
log('T5', 'Пустое состояние', '0 ч и 0%; нет NaN/Infinity; интерфейс работает (добавление после очистки)',
  `${t.length} задач; ${fmt(m)}; NaN/Infinity в тексте=${nan}; после добавления: ${fmt(after)}`,
  t.length === 0 && num(m.total) === 0 && num(m.progress) === 0 && !nan && num(after.total) === 2);
await fresh();

// 390 px
await page.setViewportSize({ width: 390, height: 844 });
await fresh();
const ov = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
await page.screenshot({ path: path.join(outDir, 'narrow-390.png'), fullPage: true });
const labels = await page.evaluate(([ti, hi]) => {
  const lab = (sel) => { const el = document.querySelector(sel); if (!el) return false; return !!(el.labels?.length || el.getAttribute('aria-label')); };
  const btns = [...document.querySelectorAll('button')].every((b) => (b.textContent.trim() || b.getAttribute('aria-label')));
  return { title: lab(ti), hours: lab(hi), buttons: btns };
}, [A.titleInput, A.hoursInput]);
log('W390', 'Ширина 390 px, подписи', 'scrollWidth ≤ 390; поля и кнопки подписаны',
  `scrollWidth=${ov.sw}, clientWidth=${ov.cw}; подписи: ${JSON.stringify(labels)}`,
  ov.sw <= ov.cw && labels.title && labels.hours && labels.buttons);

// Сохранение между перезагрузками (доп.)
await page.setViewportSize({ width: 1100, height: 900 });
await fresh();
await (await item('Практика')).locator(A.itemToggle).click();
await page.reload(); await page.waitForSelector(A.item);
m = await metrics();
log('LS', 'localStorage после перезагрузки (доп.)', 'прогресс 75% сохраняется', fmt(m), num(m.progress) === 75);

log('CON', 'Ошибки JS в консоли', 'нет', consoleErrors.length ? consoleErrors.join(' | ') : 'нет', consoleErrors.length === 0);

await browser.close();
fs.writeFileSync(path.join(outDir, 'ui-results.json'), JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.pass).length;
console.log(`\nИТОГ: ${results.length - failed}/${results.length} PASS`);
