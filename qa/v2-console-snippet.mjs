// Запуск сниппета самопроверки, который предложил чат 2, на странице tracker-v2.html
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PW_PATH || 'playwright');
const b = await chromium.launch(); const p = await b.newPage(); const out = [];
p.on('console', (m) => out.push(`${m.type()}: ${m.text()}`));
await p.goto(process.argv[2]);
await p.evaluate(() => {
const D = TrackerDomain, s = D.summarize; let t = D.createInitialTasks();
console.assert(s(t).progress === 25 && s(t).totalHours === 8, 'start');
console.assert(s(D.toggleTask(t, 't2')).progress === 75, 'toggle');
console.assert(D.filterTasks(t, 'active').length === 2 && s(t).progress === 25, 'filter');
console.assert(s([]).progress === 0 && s([]).totalHours === 0, 'empty');
['', '  ', '0', '-1', '0,25', '1,3', '24,5', 'abc', '1e1'].forEach(h => console.assert(!D.parseHours(h).ok, 'reject ' + h));
['0,5', '0.5', '2', '24'].forEach(h => console.assert(D.parseHours(h).ok, 'accept ' + h));
console.assert(!D.addTask(t, { title: '  ', hours: '2' }, 'x').ok, 'empty title');
console.log('done');
});
console.log(out.join('\n') || '(пусто)'); await b.close();
