// ============================================================
// 每日计划 - 丸子の工作宝宝
// 一个菜单一个文件：公共函数（$ / esc / toast）统一用 common.js
// 日历选日期（可点任意日期/翻月）+ 进度条 + 时间标签 + 圆形勾选框 + 清除已完成
// 数据：localStorage key `wz_todo_v1`，按日期分组存储
//   { "2026-08-31": [ { id, text, done, time } ] }
// ============================================================
(function () {
  'use strict';

  const STORE_KEY = 'wz_todo_v1';

  // ===== 日期工具 =====
  function pad(n) { return String(n).padStart(2, '0'); }
  function dsOf(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function todayStr() { return dsOf(new Date()); }

  // 日历显示的年月 + 当前选中日期
  let viewYear, viewMonth;
  let selectedDate = todayStr();

  function initDate() {
    const now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();
    selectedDate = todayStr();
  }

  // ===== 存储（含旧数据迁移） =====
  function loadAll() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { raw = null; }
    // 旧格式是数组 → 迁移成「今天」的分组，老数据不丢
    if (Array.isArray(raw)) {
      const migrated = {};
      if (raw.length) {
        migrated[todayStr()] = raw.map(x => ({
          id: x.id, text: String(x.text || ''), done: !!x.done, time: x.time || ''
        }));
      }
      saveAll(migrated);
      return migrated;
    }
    return (raw && typeof raw === 'object') ? raw : {};
  }

  function saveAll(all) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(all)); } catch (e) {}
  }

  function loadDay(ds) {
    const all = loadAll();
    return Array.isArray(all[ds]) ? all[ds] : [];
  }

  function saveDay(ds, list) {
    const all = loadAll();
    all[ds] = list;
    saveAll(all);
  }

  // ===== 操作 =====
  function add(text, dtValue) {
    const t = String(text || '').trim();
    if (!t) { toast('先写点什么吧～'); return; }
    // 默认归属当前月历选中的日期；若选了日期时间，则按所选日期 + 时间
    let targetDate = selectedDate;
    let time = '';
    if (dtValue) {
      const m = String(dtValue).match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
      if (m) { targetDate = m[1]; time = m[2]; }
    }
    const list = loadDay(targetDate);
    list.push({ id: Date.now(), text: t, done: false, time: time });
    saveDay(targetDate, list);
    // 若加到了别的日期，把月历切过去，让用户看到
    if (targetDate !== selectedDate) {
      const parts = targetDate.split('-').map(Number);
      selectedDate = targetDate;
      viewYear = parts[0]; viewMonth = parts[1] - 1;
    }
    render();
  }

  function toggle(id) {
    const list = loadDay(selectedDate);
    const item = list.find(x => String(x.id) === String(id));
    if (item) { item.done = !item.done; saveDay(selectedDate, list); render(); }
  }

  function remove(id) {
    saveDay(selectedDate, loadDay(selectedDate).filter(x => String(x.id) !== String(id)));
    render();
  }

  function clearDone() {
    const list = loadDay(selectedDate);
    const rest = list.filter(x => !x.done);
    if (rest.length === list.length) { toast('没有已完成的事项'); return; }
    saveDay(selectedDate, rest);
    render();
    toast('已清除完成项 ✓');
  }

  function selectDate(ds) {
    selectedDate = ds;
    // 若点的是其它月，切过去
    const [y, m] = ds.split('-').map(Number);
    viewYear = y;
    viewMonth = m - 1;
    render();
  }

  function shiftMonth(delta) {
    viewMonth += delta;
    if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
    if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
    renderCalendar();
  }

  function goToday() {
    const now = new Date();
    selectedDate = todayStr();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();
    render();
  }

  // ===== 日历渲染 =====
  function renderCalendar() {
    const title = $('todoCalTitle');
    if (title) title.textContent = viewYear + '年' + (viewMonth + 1) + '月';
    const grid = $('todoCalGrid');
    if (!grid) return;

    const all = loadAll();
    const today = todayStr();
    const startWeekday = new Date(viewYear, viewMonth, 1).getDay(); // 0=周日
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    let html = '';
    for (let i = 0; i < startWeekday; i++) html += '<span class="todo-cal-cell empty"></span>';
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = viewYear + '-' + pad(viewMonth + 1) + '-' + pad(d);
      const has = all[ds] && all[ds].length;
      const cls = (ds === today ? ' today' : '') + (ds === selectedDate ? ' sel' : '');
      html += '<span class="todo-cal-cell' + cls + '" data-ds="' + ds + '">' +
        d + (has ? '<i class="todo-cal-dot"></i>' : '') + '</span>';
    }
    grid.innerHTML = html;
  }

  // ===== 待办列表 + 进度渲染 =====
  function renderList() {
    const box = $('todoList');
    if (!box) return;
    const list = loadDay(selectedDate);
    const doneCount = list.filter(x => x.done).length;
    const total = list.length;
    const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    const wrap = $('todoProgressWrap');
    const fill = $('todoProgressFill');
    const ptext = $('todoProgressText');
    if (wrap) wrap.style.display = total > 0 ? '' : 'none';
    if (fill) fill.style.width = pct + '%';
    if (ptext) ptext.textContent = doneCount + '/' + total;

    if (!total) {
      box.innerHTML = '<div class="todo-empty">这一天还没有计划，添加一个吧～</div>';
      return;
    }
    box.innerHTML = list.map(t =>
      '<div class="todo-row' + (t.done ? ' done' : '') + '" data-id="' + t.id + '">' +
      '<span class="todo-chk" data-act="toggle">' + (t.done ? '<span class="todo-chk-mark">✓</span>' : '') + '</span>' +
      '<span class="todo-txt">' + esc(t.text) + '</span>' +
      (t.time ? '<span class="todo-time">' + esc(t.time) + '</span>' : '') +
      '<button class="todo-del" data-act="del" title="删除">✕</button>' +
      '</div>'
    ).join('');
  }

  function render() {
    renderCalendar();
    renderList();
  }

  function boot() {
    const panel = $('panel-todo');
    if (!panel) return;
    initDate();
    render();

    const input = $('todoInput');
    const timeInput = $('todoTime');
    if (input) input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') { add(input.value, timeInput ? timeInput.value : ''); input.value = ''; }
    });
    const btn = $('todoAddBtn');
    if (btn) btn.addEventListener('click', () => {
      const i = $('todoInput'), t = $('todoTime');
      if (i) { add(i.value, t ? t.value : ''); i.value = ''; i.focus(); }
    });

    const prevM = $('todoCalPrevMonth'); if (prevM) prevM.addEventListener('click', () => shiftMonth(-1));
    const nextM = $('todoCalNextMonth'); if (nextM) nextM.addEventListener('click', () => shiftMonth(1));
    const today = $('todoCalToday'); if (today) today.addEventListener('click', goToday);
    const clear = $('todoClearDoneBtn'); if (clear) clear.addEventListener('click', clearDone);

    // 日历格子点击 → 选日期
    const grid = $('todoCalGrid');
    if (grid) grid.addEventListener('click', (e) => {
      const cell = e.target.closest('.todo-cal-cell[data-ds]');
      if (cell) selectDate(cell.dataset.ds);
    });

    // 待办列表事件委托
    const box = $('todoList');
    if (box) box.addEventListener('click', (e) => {
      const el = e.target.closest('[data-act]');
      if (!el) return;
      const row = el.closest('.todo-row');
      if (!row) return;
      const id = row.dataset.id;
      if (el.dataset.act === 'toggle') toggle(id);
      if (el.dataset.act === 'del') remove(id);
    });
  }

  window.todoBaby = { loadDay, saveDay, loadAll, render, add, toggle, remove, clearDone, selectDate, goToday, shiftMonth };

  boot();
})();
