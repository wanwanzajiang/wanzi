// ============================================================
// 更多 - 丸子の工作宝宝
// 一个菜单一个文件：公共函数（$ / esc / toast）统一用 common.js
// 本文件承载「更多」菜单的全部逻辑（小工具 / 设置）
// ============================================================
(function () {
  'use strict';

  const NAV_KEY = 'wz_nav_order_v1';
  const FOLD_KEY = 'wz_query_fold_v1';

  // 重置导航排序，回到默认顺序
  function resetNavOrder() {
    try {
      localStorage.removeItem(NAV_KEY);
      toast('导航顺序已重置，刷新后生效');
    } catch (e) { toast('重置失败'); }
  }

  // 重置查询宝宝的区块折叠状态
  function resetFold() {
    try {
      localStorage.removeItem(FOLD_KEY);
      toast('折叠状态已重置，刷新后生效');
    } catch (e) { toast('重置失败'); }
  }

  function boot() {
    const panel = $('panel-more');
    if (!panel) return;
    const navBtn = $('moreResetNavBtn');
    if (navBtn) navBtn.addEventListener('click', resetNavOrder);
    const foldBtn = $('moreResetFoldBtn');
    if (foldBtn) foldBtn.addEventListener('click', resetFold);
  }

  window.moreBaby = { resetNavOrder, resetFold, boot };

  boot();
})();
