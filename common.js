// ============================================================
// 公共工具 - 丸子の工作宝宝
// 所有面板共用的基础函数，统一挂到 window 全局
// 供 app.js / publish.js / query.js / todo.js / more.js 共用
// ============================================================

window.$ = (id) => document.getElementById(id);

window.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

window.toast = (msg, ms = 1800) => {
  const t = window.$('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), ms);
};

window.highlight = (text, keyword) => {
  text = window.esc(String(text == null ? '' : text));
  if (!text || !keyword) return text;
  const regex = new RegExp('(' + keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
  return text.replace(regex, '<mark style="background:#ffe4a8;padding:0 4px;border-radius:4px;">$1</mark>');
};
