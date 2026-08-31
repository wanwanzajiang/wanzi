// ============================================================
// 我的资产 - 丸子の工作宝宝（记账，参考 iCost 简洁 + wanzi-mini 资产页）
// 一个菜单一个文件：公共函数（$ / esc / toast）统一用 common.js
// 数据：localStorage key `wz_asset_v1`
//   { accounts: [{id,name,kind,balance}], txs: [{id,type,amount,cat,icon,note,date,accId}] }
// ============================================================
(function () {
  'use strict';

  const STORE_KEY = 'wz_asset_v1';

  // 分类（emoji 图标，iCost 风格）
  const OUT_CATS = [
    { name: '餐饮', icon: '🍜' }, { name: '交通', icon: '🚗' }, { name: '购物', icon: '🛍️' },
    { name: '娱乐', icon: '🎮' }, { name: '医疗', icon: '💊' }, { name: '住房', icon: '🏠' },
    { name: '教育', icon: '📚' }, { name: '其他', icon: '📦' }
  ];
  const IN_CATS = [
    { name: '工资', icon: '💼' }, { name: '奖金', icon: '🎁' }, { name: '投资', icon: '📈' },
    { name: '红包', icon: '🧧' }, { name: '其他', icon: '💰' }
  ];

  let txType = 'out';       // 当前记账类型
  let selCat = null;        // 选中的分类名

  // ===== 日期工具 =====
  function pad(n) { return String(n).padStart(2, '0'); }
  function todayStr() { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  // ===== 存储 =====
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (d && typeof d === 'object' && Array.isArray(d.accounts)) return d;
    } catch (e) {}
    return { accounts: [], txs: [] };
  }
  function save(d) { try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); } catch (e) {} }

  function fmtMoney(n) {
    n = Number(n) || 0;
    const sign = n < 0 ? '-' : '';
    return sign + '¥' + Math.abs(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ===== 账户 =====
  function renderAccounts() {
    const d = load();
    const box = $('assetAccounts');
    const sel = $('assetAccount');
    if (!box) return;

    // 账户卡片
    if (!d.accounts.length) {
      box.innerHTML = '<div class="asset-empty">还没有账户，先添加一个吧～</div>';
    } else {
      box.innerHTML = d.accounts.map(a =>
        '<div class="asset-acc" data-id="' + a.id + '">' +
        '<span class="asset-acc-ico">' + accIcon(a.kind) + '</span>' +
        '<div class="asset-acc-info">' +
        '<div class="asset-acc-name">' + esc(a.name) + '</div>' +
        '<div class="asset-acc-kind">' + esc(a.kind) + '</div>' +
        '</div>' +
        '<div class="asset-acc-bal' + (a.balance < 0 ? ' neg' : '') + '">' + fmtMoney(a.balance) + '</div>' +
        '<button class="asset-acc-del" data-act="delAcc" title="删除账户">✕</button>' +
        '</div>'
      ).join('');
    }

    // 账户下拉（记一笔用）
    if (sel) {
      sel.innerHTML = d.accounts.map(a => '<option value="' + a.id + '">' + esc(a.name) + '</option>').join('') ||
        '<option value="">— 请先添加账户 —</option>';
    }
  }

  function accIcon(kind) {
    return ({ '现金': '💰', '储蓄卡': '💳', '信用卡': '💳', '花呗': '📱' })[kind] || '💰';
  }

  function showAccountForm(show) {
    const form = $('assetAccountForm');
    const btn = $('assetAddAccountBtn');
    if (form) form.style.display = show ? '' : 'none';
    if (btn) btn.textContent = show ? '收起' : '➕ 添加账户';
  }

  function addAccount() {
    const name = ($('assetNewAccName').value || '').trim();
    const kind = $('assetNewAccKind').value;
    if (!name) { toast('请填账户名称'); return; }
    const d = load();
    d.accounts.push({ id: Date.now(), name: name, kind: kind, balance: 0 });
    save(d);
    $('assetNewAccName').value = '';
    showAccountForm(false);
    render();
  }

  function delAccount(id) {
    const d = load();
    const hasTx = d.txs.some(t => String(t.accId) === String(id));
    if (hasTx) { toast('该账户已有账单，不能删除'); return; }
    d.accounts = d.accounts.filter(a => String(a.id) !== String(id));
    save(d);
    render();
  }

  // ===== 记账 =====
  function setType(type) {
    txType = type;
    selCat = null;
    const out = $('assetTypeOut'), inn = $('assetTypeIn');
    if (out) out.classList.toggle('on', type === 'out');
    if (inn) inn.classList.toggle('on', type === 'in');
    renderCats();
  }

  function renderCats() {
    const cats = txType === 'out' ? OUT_CATS : IN_CATS;
    const box = $('assetCats');
    if (!box) return;
    box.innerHTML = cats.map(c =>
      '<span class="asset-cat' + (selCat === c.name ? ' on' : '') + '" data-cat="' + c.name + '" data-icon="' + c.icon + '">' +
      '<span class="asset-cat-ico">' + c.icon + '</span>' +
      '<span class="asset-cat-name">' + c.name + '</span>' +
      '</span>'
    ).join('');
  }

  function addTx() {
    const amount = parseFloat($('assetAmount').value);
    if (!amount || amount <= 0) { toast('请输入金额'); return; }
    if (!selCat) { toast('请选一个分类'); return; }
    const accId = $('assetAccount').value;
    if (!accId) { toast('请先添加并选择账户'); return; }
    const note = ($('assetNote').value || '').trim();
    const date = $('assetDate').value || todayStr();

    const cat = (txType === 'out' ? OUT_CATS : IN_CATS).find(c => c.name === selCat);
    const d = load();
    const acc = d.accounts.find(a => String(a.id) === String(accId));
    if (!acc) { toast('账户不存在'); return; }

    const delta = txType === 'in' ? amount : -amount;
    acc.balance = (acc.balance || 0) + delta;

    d.txs.unshift({
      id: Date.now(), type: txType, amount: amount,
      cat: selCat, icon: cat ? cat.icon : '💰', note: note, date: date, accId: accId
    });
    save(d);

    // 清空输入
    $('assetAmount').value = '';
    $('assetNote').value = '';
    selCat = null;
    render();
    toast('已入账 ' + fmtMoney(amount) + ' ✓');
  }

  // ===== 汇总 =====
  function renderSummary() {
    const d = load();
    let totalAsset = 0, totalLiability = 0;
    d.accounts.forEach(a => {
      const b = a.balance || 0;
      if (b >= 0) totalAsset += b; else totalLiability += Math.abs(b);
    });
    const netWorth = totalAsset - totalLiability;
    const el = id => $(id);
    if (el('assetNetWorth')) el('assetNetWorth').textContent = fmtMoney(netWorth);
    if (el('assetTotalAsset')) el('assetTotalAsset').textContent = fmtMoney(totalAsset);
    if (el('assetTotalLiability')) el('assetTotalLiability').textContent = fmtMoney(totalLiability);
  }

  function renderMonthStats() {
    const d = load();
    const ym = todayStr().slice(0, 7); // YYYY-MM
    let out = 0, inn = 0;
    d.txs.forEach(t => {
      if ((t.date || '').slice(0, 7) === ym) {
        if (t.type === 'in') inn += t.amount; else out += t.amount;
      }
    });
    if ($('assetMonthOut')) $('assetMonthOut').textContent = fmtMoney(out);
    if ($('assetMonthIn')) $('assetMonthIn').textContent = fmtMoney(inn);
    if ($('assetMonthBalance')) $('assetMonthBalance').textContent = fmtMoney(inn - out);

    // 分类条形图（本月支出）
    const barsBox = $('assetCatBars');
    if (barsBox) {
      const catSum = {};
      d.txs.forEach(t => {
        if (t.type === 'out' && (t.date || '').slice(0, 7) === ym) {
          catSum[t.cat] = (catSum[t.cat] || 0) + t.amount;
        }
      });
      const entries = Object.entries(catSum).sort((a, b) => b[1] - a[1]);
      const max = entries.length ? entries[0][1] : 0;
      if (!entries.length) {
        barsBox.innerHTML = '<div class="asset-empty">本月还没有支出</div>';
      } else {
        barsBox.innerHTML = entries.map(([cat, total]) => {
          const pct = max > 0 ? Math.round((total / max) * 100) : 0;
          const icon = (OUT_CATS.find(c => c.name === cat) || {}).icon || '📦';
          return '<div class="asset-catbar">' +
            '<span class="asset-catbar-ico">' + icon + '</span>' +
            '<span class="asset-catbar-k">' + esc(cat) + '</span>' +
            '<div class="asset-catbar-track"><div class="asset-catbar-fill" style="width:' + pct + '%;"></div></div>' +
            '<span class="asset-catbar-v">' + fmtMoney(total) + '</span>' +
            '</div>';
        }).join('');
      }
    }
  }

  function renderTxs() {
    const d = load();
    const box = $('assetTxs');
    if (!box) return;
    const list = d.txs.slice(0, 20);
    if (!list.length) {
      box.innerHTML = '<div class="asset-empty">还没有账单，先记一笔吧～</div>';
      return;
    }
    const accName = id => { const a = d.accounts.find(x => String(x.id) === String(id)); return a ? a.name : ''; };
    box.innerHTML = list.map(t =>
      '<div class="asset-tx">' +
      '<span class="asset-tx-ico">' + (t.icon || '💰') + '</span>' +
      '<div class="asset-tx-main">' +
      '<div class="asset-tx-cat">' + esc(t.cat) + '</div>' +
      '<div class="asset-tx-sub">' + esc(t.date || '') + (t.note ? ' · ' + esc(t.note) : '') + '</div>' +
      '</div>' +
      '<div class="asset-tx-right">' +
      '<div class="asset-tx-amount ' + (t.type === 'in' ? 'in' : 'out') + '">' + (t.type === 'in' ? '+' : '-') + fmtMoney(t.amount) + '</div>' +
      '<div class="asset-tx-acc">' + esc(accName(t.accId)) + '</div>' +
      '</div>' +
      '</div>'
    ).join('');
  }

  function render() {
    renderAccounts();
    renderSummary();
    renderMonthStats();
    renderTxs();
    renderCats();
  }

  function boot() {
    const panel = $('panel-asset');
    if (!panel) return;
    // 日期默认今天
    const dateEl = $('assetDate');
    if (dateEl) dateEl.value = todayStr();

    render();

    // 类型切换
    const out = $('assetTypeOut'), inn = $('assetTypeIn');
    if (out) out.addEventListener('click', () => setType('out'));
    if (inn) inn.addEventListener('click', () => setType('in'));

    // 分类点击
    const cats = $('assetCats');
    if (cats) cats.addEventListener('click', (e) => {
      const el = e.target.closest('.asset-cat[data-cat]');
      if (!el) return;
      selCat = el.dataset.cat;
      renderCats();
    });

    // 入账
    const addBtn = $('assetAddBtn');
    if (addBtn) addBtn.addEventListener('click', addTx);

    // 账户：添加/删除
    const addAccBtn = $('assetAddAccountBtn');
    if (addAccBtn) addAccBtn.addEventListener('click', () => {
      const form = $('assetAccountForm');
      showAccountForm(!form || form.style.display === 'none');
    });
    const addAccOk = $('assetAddAccountOk');
    if (addAccOk) addAccOk.addEventListener('click', addAccount);
    const addAccCancel = $('assetAddAccountCancel');
    if (addAccCancel) addAccCancel.addEventListener('click', () => showAccountForm(false));
    const accBox = $('assetAccounts');
    if (accBox) accBox.addEventListener('click', (e) => {
      const del = e.target.closest('[data-act="delAcc"]');
      if (!del) return;
      const card = del.closest('.asset-acc');
      if (card) delAccount(card.dataset.id);
    });
  }

  window.assetBaby = { load, save, render, fmtMoney, addTx, addAccount, delAccount, setType };

  boot();
})();
