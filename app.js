// ============================================================
// 丸子の工作宝宝 - 工作台外壳（导航 / 拖拽排序 / 折叠 / 面板切换）
// 独立文件便于维护：发品看 publish.js，查询宝宝看 query.js
// ============================================================
(function () {
  'use strict';

  const NAV_KEY = 'wz_nav_order_v1';
  const FOLD_KEY = 'wz_query_fold_v1';

  let draggedItem = null;

  // ===== 报价宝宝 iframe：懒加载 + 常驻复用 =====
  // 旧实现每次切到报价面板都销毁重建 iframe，导致白屏重载 + 丢失登录态。
  // 改为：首次切到报价面板才设置 src（懒加载，不拖慢首屏），之后一直复用同一个 iframe。
  function ensurePriceFrame() {
    const f = document.getElementById('priceFrame');
    if (!f) return;
    if (f.getAttribute('data-loaded') === '1') return; // 已加载过 → 直接复用，保住登录态
    const src = f.getAttribute('data-src');
    if (!src) return;
    f.src = src;
    f.setAttribute('data-loaded', '1');
  }

  // ===== 面板切换 =====
  function showPanel(name) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('panel-' + name);
    if (panel) panel.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const nav = document.querySelector('.nav-item[data-panel="' + name + '"]');
    if (nav) nav.classList.add('active');
    // 报价宝宝：懒加载 + 常驻复用（不再销毁重建，保住登录态）
    if (name === 'price') ensurePriceFrame();
  }

  // ===== 查询宝宝：点击导航 = 全部收起/展开（目录模式） =====
  function toggleAllQueryBlocks() {
    const blocks = document.querySelectorAll('.q-block');
    if (!blocks.length) return;
    const anyOpen = Array.from(blocks).some(b => !b.classList.contains('folded'));
    // 有展开的 → 全部收起；全部收起 → 全部展开
    blocks.forEach(b => b.classList.toggle('folded', anyOpen));
    saveFold();
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = anyOpen ? '📂 查询宝宝已收起，点击再次展开' : '📖 查询宝宝已全部展开';
      toast.classList.add('show');
      clearTimeout(toast._t);
      toast._t = setTimeout(() => toast.classList.remove('show'), 1500);
    }
  }

  // 导航点击：查询宝宝已激活时再点 = 全部收起/展开；否则正常切换
  function onNavClick(item) {
    const name = item.dataset.panel;
    if (name === 'query' && document.getElementById('panel-query').classList.contains('active')) {
      toggleAllQueryBlocks();
      return;
    }
    showPanel(name);
  }

  // ===== 拖拽排序 =====
  function saveOrder() {
    const order = Array.from(document.querySelectorAll('.nav-item')).map(n => n.dataset.panel);
    try { localStorage.setItem(NAV_KEY, JSON.stringify(order)); } catch (e) {}
  }
  function loadOrder() {
    try {
      const saved = JSON.parse(localStorage.getItem(NAV_KEY) || '[]');
      if (!Array.isArray(saved) || saved.length < 2) return;
      const sidebar = document.querySelector('.sidebar');
      const items = {};
      document.querySelectorAll('.nav-item').forEach(n => items[n.dataset.panel] = n);
      let last = null;
      saved.forEach(name => {
        const el = items[name];
        if (!el) return;
        sidebar.insertBefore(el, last ? last.nextSibling : sidebar.firstChild);
        last = el;
      });
    } catch (e) {}
  }

  function initDrag() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.setAttribute('draggable', 'true');
      item.addEventListener('dragstart', (e) => {
        draggedItem = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', item.dataset.panel); } catch (err) {}
      });
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('drop-before', 'drop-after'));
        draggedItem = null;
        saveOrder();
      });
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!draggedItem || draggedItem === item) return;
        e.dataTransfer.dropEffect = 'move';
        const rect = item.getBoundingClientRect();
        const before = (e.clientY - rect.top) < rect.height / 2;
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('drop-before', 'drop-after'));
        item.classList.add(before ? 'drop-before' : 'drop-after');
      });
      item.addEventListener('dragleave', () => {
        item.classList.remove('drop-before', 'drop-after');
      });
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!draggedItem || draggedItem === item) return;
        const rect = item.getBoundingClientRect();
        const before = (e.clientY - rect.top) < rect.height / 2;
        const sidebar = item.parentNode;
        if (before) sidebar.insertBefore(draggedItem, item);
        else sidebar.insertBefore(draggedItem, item.nextSibling);
        item.classList.remove('drop-before', 'drop-after');
        saveOrder();
      });
    });
  }

  // ===== 查询宝宝：版块单独折叠（标题行点击） =====
  function saveFold() {
    const folded = Array.from(document.querySelectorAll('.q-block.folded')).map(b => b.dataset.id).filter(Boolean);
    try { localStorage.setItem(FOLD_KEY, JSON.stringify(folded)); } catch (e) {}
  }
  function initFold() {
    document.querySelectorAll('.q-block .q-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const block = toggle.closest('.q-block');
        if (!block) return;
        block.classList.toggle('folded');
        saveFold();
      });
    });
    // 恢复单个版块折叠状态（默认全部展开）
    try {
      const saved = JSON.parse(localStorage.getItem(FOLD_KEY) || '[]');
      document.querySelectorAll('.q-block').forEach(block => {
        const id = block.dataset.id;
        if (id && saved.indexOf(id) !== -1) block.classList.add('folded');
      });
    } catch (e) {}
  }

  function updateWsTime() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const el = document.getElementById('wsTime');
    if (el) el.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes());
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadOrder();
    initDrag();
    initFold();
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => onNavClick(item));
    });
  });

  updateWsTime();
  setInterval(updateWsTime, 1000);
})();
