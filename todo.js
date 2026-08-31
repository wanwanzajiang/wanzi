// ============================================================
// 每日计划 - 丸子の工作宝宝
// 一个菜单一个文件：公共函数（$ / esc / toast）统一用 common.js
// 结构先行：本文件承载「每日计划」菜单的全部逻辑
// ============================================================
(function () {
  'use strict';

  const STORE_KEY = 'wz_todo_v1';

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch (e) { return []; }
  }

  function save(list) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function add(text) {
    const t = String(text || '').trim();
    if (!t) { toast('先写点什么吧～'); return; }
    const list = load();
    list.push({ id: Date.now(), text: t, done: false });
    save(list);
    render();
  }

  function toggle(id) {
    const list = load();
    const item = list.find(x => String(x.id) === String(id));
    if (item) { item.done = !item.done; save(list); render(); }
  }

  function remove(id) {
    save(load().filter(x => String(x.id) !== String(id)));
    render();
  }

  function render() {
    const box = $('todoList');
    if (!box) return;
    const list = load();
    if (!list.length) {
      box.innerHTML = '<div class="hint">还没有计划，先记一条吧～</div>';
      return;
    }
    box.innerHTML = list.map(t =>
      '<div class="todo-row" data-id="' + t.id + '" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--line);' + (t.done ? 'opacity:.5;' : '') + '">' +
      '<span style="flex:1;font-size:13px;' + (t.done ? 'text-decoration:line-through;' : '') + '">' + esc(t.text) + '</span>' +
      '<button class="btn btn-ghost btn-mini" data-act="toggle">' + (t.done ? '↩︎' : '✓') + '</button>' +
      '<button class="btn btn-ghost btn-mini" data-act="del">✕</button>' +
      '</div>'
    ).join('');
  }

  function boot() {
    const panel = $('panel-todo');
    if (!panel) return;
    render();
    const input = $('todoInput');
    if (input) input.addEventListener('keypress', (e) => { if (e.key === 'Enter') add(input.value); });
    const btn = $('todoAddBtn');
    if (btn) btn.addEventListener('click', () => { const i = $('todoInput'); if (i) { add(i.value); i.value = ''; } });
    const box = $('todoList');
    if (box) box.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-act]');
      if (!b) return;
      const row = b.closest('.todo-row');
      if (!row) return;
      const id = row.dataset.id;
      if (b.dataset.act === 'toggle') toggle(id);
      if (b.dataset.act === 'del') remove(id);
    });
  }

  window.todoBaby = { load, save, render, add, toggle, remove };

  boot();
})();
