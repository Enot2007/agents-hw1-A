Ниже готовый файл. Сохраните его как `tracker.html` и откройте в браузере.

```html
<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Трекер учёбы</title>
<style>
  :root {
    --bg: #f4f5f7;
    --card: #ffffff;
    --text: #1d2129;
    --muted: #6b7280;
    --border: #e3e5e8;
    --track: #e7e9ec;
    --accent: #4f46e5;
    --accent-soft: #eef2ff;
    --on-accent: #ffffff;
    --ok: #16a34a;
    --ok-soft: #dcfce7;
    --on-ok: #ffffff;
    --danger: #dc2626;
    --danger-soft: #fee2e2;
    --shadow: 0 1px 2px rgba(0,0,0,.06);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #111318;
      --card: #1a1d24;
      --text: #e6e8ec;
      --muted: #9aa0aa;
      --border: #2a2e37;
      --track: #262a33;
      --accent: #8b93fb;
      --accent-soft: #25284a;
      --on-accent: #12131a;
      --ok: #4ade80;
      --ok-soft: #173224;
      --on-ok: #0b2a17;
      --danger: #f87171;
      --danger-soft: #3a1d1d;
      --shadow: none;
    }
  }

  * { box-sizing: border-box; }
  body {
    margin: 0;
    font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
  }
  .wrap { max-width: 640px; margin: 0 auto; padding: 32px 16px 64px; }
  h1 { font-size: 24px; margin: 0 0 4px; }
  .sub { color: var(--muted); margin: 0 0 20px; }
  :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 18px;
    box-shadow: var(--shadow);
  }

  /* Статистика */
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .stat .label {
    font-size: 12px; color: var(--muted);
    text-transform: uppercase; letter-spacing: .04em;
  }
  .stat .value {
    font-size: 24px; font-weight: 650;
    font-variant-numeric: tabular-nums;
  }
  .bar {
    height: 10px; background: var(--track);
    border-radius: 99px; overflow: hidden; margin-top: 16px;
  }
  .bar > span {
    display: block; height: 100%; width: 0;
    background: var(--ok); border-radius: 99px;
    transition: width .35s ease;
  }
  .bar-caption { margin-top: 8px; font-size: 13px; color: var(--muted); }

  /* Форма */
  .form { display: flex; gap: 8px; margin-top: 16px; }
  .form input {
    font: inherit; color: var(--text);
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 12px;
    min-width: 0;
  }
  .form input:focus { border-color: var(--accent); outline: none; }
  .form .name { flex: 1; }
  .form .hours { width: 100px; }
  .btn-primary {
    font: inherit; font-weight: 600;
    background: var(--accent); color: var(--on-accent);
    border: 0; border-radius: 10px;
    padding: 10px 18px; cursor: pointer;
    white-space: nowrap;
  }
  .btn-primary:hover { filter: brightness(1.07); }
  .error { color: var(--danger); font-size: 13px; min-height: 1.4em; margin: 6px 2px 0; }

  /* Фильтр */
  .toolbar {
    display: flex; justify-content: space-between; align-items: center;
    gap: 12px; flex-wrap: wrap; margin: 18px 0 10px;
  }
  .seg { display: inline-flex; background: var(--track); border-radius: 10px; padding: 3px; }
  .seg button {
    font: inherit; font-size: 14px;
    border: 0; background: transparent; color: var(--muted);
    padding: 6px 12px; border-radius: 8px; cursor: pointer;
  }
  .seg button[aria-pressed="true"] {
    background: var(--card); color: var(--text);
    box-shadow: 0 1px 2px rgba(0,0,0,.1);
  }
  .seg .count { opacity: .7; font-variant-numeric: tabular-nums; }
  .link-btn {
    font: inherit; font-size: 13px;
    background: none; border: 0; color: var(--muted);
    cursor: pointer; text-decoration: underline; padding: 4px;
  }

  /* Список */
  .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
  .item {
    display: flex; align-items: center; gap: 12px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 10px 10px 10px 14px;
    box-shadow: var(--shadow);
  }
  .item .title { flex: 1; min-width: 0; overflow-wrap: anywhere; cursor: pointer; }
  .item.done .title { text-decoration: line-through; color: var(--muted); }
  .pill {
    font-size: 13px; padding: 2px 10px; border-radius: 99px;
    background: var(--accent-soft); color: var(--accent);
    white-space: nowrap; font-variant-numeric: tabular-nums;
  }
  .item.done .pill { background: var(--ok-soft); color: var(--ok); }

  .check {
    appearance: none; -webkit-appearance: none;
    width: 22px; height: 22px; margin: 0; flex: none;
    border: 2px solid var(--border); border-radius: 6px;
    background: var(--card);
    display: grid; place-content: center; cursor: pointer;
    transition: background .15s, border-color .15s;
  }
  .check:hover { border-color: var(--ok); }
  .check:checked { background: var(--ok); border-color: var(--ok); }
  .check:checked::after {
    content: ""; width: 6px; height: 11px;
    border: solid var(--on-ok); border-width: 0 2.5px 2.5px 0;
    transform: translate(0, -1px) rotate(45deg);
  }

  .del {
    flex: none; width: 34px; height: 34px;
    border: 0; border-radius: 8px; background: transparent;
    color: var(--muted); font-size: 22px; line-height: 1; cursor: pointer;
  }
  .del:hover { background: var(--danger-soft); color: var(--danger); }

  .empty { text-align: center; color: var(--muted); padding: 28px 0; }

  /* Уведомление с отменой */
  .toast {
    position: fixed; left: 50%; bottom: 20px;
    transform: translate(-50%, 16px);
    opacity: 0; pointer-events: none;
    background: var(--text); color: var(--bg);
    padding: 10px 16px; border-radius: 10px;
    display: flex; gap: 14px; align-items: center;
    transition: opacity .2s, transform .2s;
    max-width: calc(100% - 32px);
  }
  .toast.show { opacity: 1; transform: translate(-50%, 0); pointer-events: auto; }
  .toast button {
    font: inherit; font-weight: 600; color: inherit;
    background: none; border: 0; text-decoration: underline; cursor: pointer;
  }

  @media (max-width: 480px) {
    .stat .value { font-size: 19px; }
    .form { flex-wrap: wrap; }
    .form .name { flex-basis: 100%; }
    .form .hours { flex: 1; width: auto; }
  }
</style>
</head>
<body>
<div class="wrap">
  <h1>Учебные задачи</h1>
  <p class="sub">Отмечайте выполненное, а прогресс считается сам.</p>

  <section class="card" aria-label="Сводка">
    <div class="stats">
      <div class="stat">
        <div class="label">Всего</div>
        <div class="value" id="totalHours">0 ч</div>
      </div>
      <div class="stat">
        <div class="label">Сделано</div>
        <div class="value" id="doneHours">0 ч</div>
      </div>
      <div class="stat">
        <div class="label">Выполнено</div>
        <div class="value" id="percent">0%</div>
      </div>
    </div>
    <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="bar">
      <span id="barFill"></span>
    </div>
    <div class="bar-caption" id="caption"></div>

    <form class="form" id="form" novalidate>
      <input class="name" id="nameInput" type="text" placeholder="Новая задача, например «Конспект лекции»" maxlength="120" aria-label="Название задачи" autocomplete="off">
      <input class="hours" id="hoursInput" type="number" placeholder="Часы" min="0.25" max="999" step="0.25" aria-label="Оценка в часах">
      <button class="btn-primary" type="submit">Добавить</button>
    </form>
    <p class="error" id="error" role="alert"></p>
  </section>

  <div class="toolbar">
    <div class="seg" role="group" aria-label="Фильтр задач" id="filters">
      <button type="button" data-filter="all" aria-pressed="true">Все <span class="count" data-count="all"></span></button>
      <button type="button" data-filter="active" aria-pressed="false">Активные <span class="count" data-count="active"></span></button>
      <button type="button" data-filter="done" aria-pressed="false">Готовые <span class="count" data-count="done"></span></button>
    </div>
    <button type="button" class="link-btn" id="resetBtn">Вернуть пример</button>
  </div>

  <ul class="list" id="list"></ul>
  <p class="empty" id="empty" hidden></p>
</div>

<div class="toast" id="toast" role="status" aria-live="polite">
  <span id="toastText"></span>
  <button type="button" id="undoBtn">Отменить</button>
</div>

<script>
(function () {
  const STORAGE_KEY = 'study-tracker-v1';
  const SAMPLE = [
    { name: 'Чтение',     hours: 2, done: true  },
    { name: 'Практика',   hours: 4, done: false },
    { name: 'Повторение', hours: 2, done: false }
  ];

  const $ = (id) => document.getElementById(id);
  const num = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
  const fmtH = (h) => num.format(h) + ' ч';

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
  function sample() {
    return SAMPLE.map((t) => ({ id: uid(), ...t }));
  }
  function isValidTask(t) {
    return t && typeof t.name === 'string' && typeof t.hours === 'number' &&
           isFinite(t.hours) && t.hours > 0 && typeof t.done === 'boolean';
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          return data.filter(isValidTask).map((t) => ({ id: t.id || uid(), ...t }));
        }
      }
    } catch (e) { /* хранилище недоступно, берём пример */ }
    return sample();
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch (e) {}
  }

  let tasks = load();
  let filter = 'all';
  let lastDeleted = null;
  let toastTimer = null;

  const listEl = $('list');
  const emptyEl = $('empty');

  function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }

  function render() {
    // Сводка
    const total = tasks.reduce((s, t) => s + t.hours, 0);
    const done = tasks.reduce((s, t) => s + (t.done ? t.hours : 0), 0);
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const doneCount = tasks.filter((t) => t.done).length;

    $('totalHours').textContent = fmtH(total);
    $('doneHours').textContent = fmtH(done);
    $('percent').textContent = pct + '%';
    $('barFill').style.width = pct + '%';
    $('bar').setAttribute('aria-valuenow', String(pct));
    $('caption').textContent = tasks.length
      ? `${doneCount} из ${tasks.length} ${plural(tasks.length, 'задачи', 'задач', 'задач')} готово · осталось ${fmtH(total - done)}`
      : 'Пока нет задач';

    // Счётчики фильтров
    const counts = { all: tasks.length, active: tasks.length - doneCount, done: doneCount };
    document.querySelectorAll('[data-count]').forEach((el) => {
      el.textContent = counts[el.dataset.count];
    });
    document.querySelectorAll('#filters button').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.filter === filter));
    });

    // Список
    const visible = tasks.filter((t) =>
      filter === 'all' ? true : filter === 'done' ? t.done : !t.done
    );
    listEl.textContent = '';
    for (const t of visible) {
      const li = document.createElement('li');
      li.className = 'item' + (t.done ? ' done' : '');
      li.dataset.id = t.id;

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'check';
      cb.checked = t.done;
      cb.id = 'cb-' + t.id;
      cb.setAttribute('aria-label', 'Готово: ' + t.name);

      const title = document.createElement('label');
      title.className = 'title';
      title.htmlFor = cb.id;
      title.textContent = t.name;

      const pill = document.createElement('span');
      pill.className = 'pill';
      pill.textContent = fmtH(t.hours);

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'del';
      del.innerHTML = '&times;';
      del.title = 'Удалить';
      del.setAttribute('aria-label', 'Удалить задачу «' + t.name + '»');

      li.append(cb, title, pill, del);
      listEl.appendChild(li);
    }

    const emptyText = {
      all: 'Задач нет. Добавьте первую в форме выше.',
      active: 'Активных задач нет. Всё сделано!',
      done: 'Готовых задач пока нет.'
    };
    emptyEl.hidden = visible.length > 0;
    emptyEl.textContent = emptyText[filter];
  }

  // Добавление
  $('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = $('nameInput');
    const hoursInput = $('hoursInput');
    const name = nameInput.value.trim();
    const hours = parseFloat(String(hoursInput.value).replace(',', '.'));

    if (!name) {
      $('error').textContent = 'Введите название задачи.';
      nameInput.focus();
      return;
    }
    if (!isFinite(hours) || hours <= 0 || hours > 999) {
      $('error').textContent = 'Укажите оценку в часах: число больше 0 (например, 1.5).';
      hoursInput.focus();
      return;
    }
    $('error').textContent = '';
    tasks.push({ id: uid(), name, hours: Math.round(hours * 100) / 100, done: false });
    if (filter === 'done') filter = 'all';
    save();
    render();
    nameInput.value = '';
    hoursInput.value = '';
    nameInput.focus();
  });

  ['nameInput', 'hoursInput'].forEach((id) =>
    $(id).addEventListener('input', () => { $('error').textContent = ''; })
  );

  // Отметка «готово»
  listEl.addEventListener('change', (e) => {
    if (!e.target.classList.contains('check')) return;
    const id = e.target.closest('.item').dataset.id;
    const t = tasks.find((x) => x.id === id);
    if (t) { t.done = e.target.checked; save(); render(); }
  });

  // Удаление
  listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.del');
    if (!btn) return;
    const id = btn.closest('.item').dataset.id;
    const index = tasks.findIndex((x) => x.id === id);
    if (index === -1) return;
    lastDeleted = { task: tasks[index], index };
    tasks.splice(index, 1);
    save();
    render();
    showToast('Удалено: «' + lastDeleted.task.name + '»');
  });

  // Фильтр
  $('filters').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-filter]');
    if (!b) return;
    filter = b.dataset.filter;
    render();
  });

  // Сброс к примеру
  $('resetBtn').addEventListener('click', () => {
    if (confirm('Заменить текущий список примером? Текущие задачи будут удалены.')) {
      tasks = sample();
      filter = 'all';
      save();
      render();
    }
  });

  // Уведомление и отмена удаления
  function showToast(text) {
    $('toastText').textContent = text;
    $('toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 5000);
  }
  function hideToast() {
    $('toast').classList.remove('show');
    lastDeleted = null;
  }
  $('undoBtn').addEventListener('click', () => {
    if (lastDeleted) {
      tasks.splice(Math.min(lastDeleted.index, tasks.length), 0, lastDeleted.task);
      save();
      render();
    }
    clearTimeout(toastTimer);
    hideToast();
  });

  render();
})();
</script>
</body>
</html>
```

**Что умеет трекер:**
- **Добавление задачи:** введите название и число часов, затем нажмите Enter или «Добавить». Если поле пустое или часы указаны неверно, появится подсказка.
- **Отметка «готово»:** нажмите на квадратик или на название задачи. Готовая задача становится зачёркнутой, а её часы окрашиваются в зелёный.
- **Удаление:** кнопка «×» справа. После удаления 5 секунд можно нажать «Отменить».
- **Фильтр:** переключатель «Все / Активные / Готовые», рядом с каждым пунктом показано число задач.
- **Сводка:** сколько часов всего, сколько сделано и процент выполнения. Процент считается по часам, а не по числу задач. В примере это 2 из 8 ч, то есть 25%.
- **Сохранение:** задачи сохраняются в браузере и не пропадают после перезагрузки страницы. Если сохранение недоступно (например, в режиме инкогнито), трекер всё равно работает. Кнопка «Вернуть пример» снова загружает три исходные задачи.
- **Тёмная тема** включается автоматически по настройке системы, а на телефоне раскладка подстраивается под узкий экран.