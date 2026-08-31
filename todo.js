// ============================================================
// 每日计划 - 丸子の工作宝宝
// 一个菜单一个文件：公共函数（$ / esc / toast）统一用 common.js
// 简洁日期导航（参考 iCost）+ 进度条 + 时间标签 + 圆形勾选框 + 清除已完成
// 添加待办用 datetime-local（日历形式选任意日期时间）
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
  function dsByOffset(offset) { const d = new Date(); d.setDate(d.getDate() + offset); return dsOf(d); }

  // 当前查看日期偏移：-1 昨天 / 0 今天 / +1 明天 …
  let viewOffset = 0;
  function viewDs() { return dsByOffset(viewOffset); }

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

  // ===== 日期标签（今天 / 昨天 / 明天 / 具体日期）=====
  function dateLabel(ds) {
    if (ds === todayStr()) return '今天 · ' + ds.slice(5).replace('-', '月') + '日';
    if (ds === dsByOffset(-1)) return '昨天 · ' + ds.slice(5).replace('-', '月') + '日';
    if (ds === dsByOffset(1)) return '明天 · ' + ds.slice(5).replace('-', '月') + '日';
    return ds.slice(0, 4) + '年' + ds.slice(5).replace('-', '月') + '日';
  }

  // ===== 操作 =====
  function add(text, dtValue) {
    const t = String(text || '').trim();
    if (!t) { toast('先写点什么吧～'); return; }
    // 默认归属今天（当前查看日期）；若选了日期时间，则按所选日期 + 时间
    let targetDate = viewDs();
    let time = '';
    if (dtValue) {
      const m = String(dtValue).match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
      if (m) { targetDate = m[1]; time = m[2]; }
    }
    const list = loadDay(targetDate);
    list.push({ id: Date.now(), text: t, done: false, time: time });
    saveDay(targetDate, list);
    // 若加到了别的日期，把视图切过去，让用户看到
    if (targetDate !== todayStr()) {
      const today = new Date();
      const target = new Date(targetDate + 'T00:00:00');
      viewOffset = Math.round((target - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
    } else {
      viewOffset = 0;
    }
    render();
  }

  function toggle(id) {
    const ds = viewDs();
    const list = loadDay(ds);
    const item = list.find(x => String(x.id) === String(id));
    if (item) { item.done = !item.done; saveDay(ds, list); render(); }
  }

  function remove(id) {
    const ds = viewDs();
    saveDay(ds, loadDay(ds).filter(x => String(x.id) !== String(id)));
    render();
  }

  function clearDone() {
    const ds = viewDs();
    const list = loadDay(ds);
    const rest = list.filter(x => !x.done);
    if (rest.length === list.length) { toast('没有已完成的事项'); return; }
    saveDay(ds, rest);
    render();
    toast('已清除完成项 ✓');
  }

  function shiftDay(delta) { viewOffset += delta; render(); }
  function goToday() { viewOffset = 0; render(); }

  // ===== 渲染 =====
  function render() {
    const box = $('todoList');
    if (!box) return;
    const ds = viewDs();

    const label = $('todoDateLabel');
    if (label) label.textContent = dateLabel(ds);

    const list = loadDay(ds);
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

  function boot() {
    const panel = $('panel-todo');
    if (!panel) return;
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

    const prev = $('todoDayPrev'); if (prev) prev.addEventListener('click', () => shiftDay(-1));
    const next = $('todoDayNext'); if (next) next.addEventListener('click', () => shiftDay(1));
    const today = $('todoDayToday'); if (today) today.addEventListener('click', goToday);
    const clear = $('todoClearDoneBtn'); if (clear) clear.addEventListener('click', clearDone);

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

  window.todoBaby = { loadDay, saveDay, loadAll, render, add, toggle, remove, clearDone, shiftDay, goToday };

  boot();
})();
