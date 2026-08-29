// ============================================================
// 查询宝宝 - 丸子の工作宝宝 集成版
// 原项目: CozyCc (product-search) 去除文件工具后移植
// 数据: Supabase omhtrpqdxdwbmwfdkgeg (与 CozyCc 同源)
// ============================================================
(function () {
  'use strict';

  // ===== 基础工具 =====
  const $ = (id) => document.getElementById(id);
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function toast(msg, ms = 1800) {
    const t = $('toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), ms);
  }
  function highlight(text, keyword) {
    text = esc(String(text == null ? '' : text));
    if (!text || !keyword) return text;
    const regex = new RegExp('(' + keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return text.replace(regex, '<mark style="background:#ffe4a8;padding:0 4px;border-radius:4px;">$1</mark>');
  }

  // ===== Supabase 配置 =====
  const SUPABASE_URL = 'https://omhtrpqdxdwbmwfdkgeg.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_GfN5hUFLP3PN7A14eVah3w_SbD12PjC';
  const SB_HEADERS = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json' };

  function getQPw() { try { return localStorage.getItem('wz_query_pwd') || ''; } catch (e) { return ''; } }
  function askQPw() {
    let pw = getQPw();
    if (!pw) { pw = prompt('请输入查询口令（首次输入后会记住）') || ''; if (pw) { try { localStorage.setItem('wz_query_pwd', pw); } catch (e) {} } }
    return pw;
  }

  // ============================================================
  // ① 参数查询
  // ============================================================
  let searchInput, searchBtn, resultsDiv, countDiv;

  function bindSearch() {
    searchInput = $('searchInput');
    searchBtn = $('searchBtn');
    resultsDiv = $('results');
    countDiv = $('count');
    if (!searchInput || !searchBtn) return;
    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') doSearch(); });
  }

  async function doSearch() {
    const keyword = searchInput.value.trim();
    if (!keyword) { resultsDiv.innerHTML = ''; countDiv.innerHTML = ''; return; }
    resultsDiv.innerHTML = '<div class="q-loading">🔍 搜索中...</div>';
    countDiv.innerHTML = '';
    const keywords = keyword.split(/[,，\s]+/).filter(k => k.trim());
    if (!keywords.length) { resultsDiv.innerHTML = ''; return; }
    try {
      let results = [];
      for (const kw of keywords) {
        const resp = await fetch(SUPABASE_URL + '/rest/v1/rpc/search_products_sec', { method: 'POST', headers: SB_HEADERS, body: JSON.stringify({ p_password: askQPw(), p_search: kw }) });
        if (!resp.ok) {
          let msg = 'API Error: ' + resp.status;
          try { const j = await resp.json(); if (j && j.message) msg = j.message; } catch (e) {}
          if (/口令/.test(msg)) { try { localStorage.removeItem('wz_query_pwd'); } catch (e) {} }
          throw new Error(msg);
        }
        const data = await resp.json();
        if (data) results = results.concat(data);
      }
      const seen = {}, unique = [];
      for (const item of results) {
        if (!seen[item.id]) { seen[item.id] = true; unique.push(item); }
        if (unique.length >= 20) break;
      }
      displayResults(unique, keywords);
    } catch (err) {
      console.error('Search error:', err);
      resultsDiv.innerHTML = '<div class="q-error">搜索出错: ' + esc(err.message) + '</div>';
    }
  }

  function displayResults(data, keywords) {
    if (!data || data.length === 0) {
      const searched = keywords ? keywords.join(' ') : '';
      resultsDiv.innerHTML = '<div class="q-empty">' +
        '<div class="q-empty-icon">🔍</div>' +
        '<div>未找到匹配的产品</div>' +
        (searched ? '<button class="btn btn-primary btn-mini" style="margin-top:10px;" onclick="window.__qAdd(\'' + esc(searched) + '\')">➕ 添加这个产品</button>' : '') +
        '</div>';
      countDiv.innerHTML = '';
      return;
    }
    countDiv.innerHTML = '<div class="q-count">找到 <b>' + data.length + '</b> 个结果</div>';
    const kwStr = keywords.join(' ');
    let html = '';
    for (const item of data) {
      const params = item.params ? String(item.params).replace(/[\r\n]+/g, '|').split('|').map(p => p.trim()).filter(p => p) : [];
      const paramsHtml = params.length ? params.map(p => '<p>' + esc(p) + '</p>').join('') : '<p>-</p>';
      html += '<div class="q-item">' +
        '<div class="q-item-title">' + highlight(item.model || '', kwStr) + '</div>' +
        '<div class="q-item-info">' +
          '<div class="q-item-cell"><span class="q-label">描述</span><span class="q-value">' + esc(item.name || '-') + '</span></div>' +
          '<div class="q-item-cell"><span class="q-label">尺寸</span><span class="q-value">' + esc(item.size || '-') + '</span></div>' +
          '<div class="q-item-cell"><span class="q-label">重量</span><span class="q-value">' + esc(item.weight || '-') + '</span></div>' +
        '</div>' +
        '<div class="q-params">' +
          '<div class="q-params-head">' +
            '<span class="q-params-title">📋 参数</span>' +
            '<span style="display:flex;gap:6px;">' +
              '<button class="btn btn-ghost btn-mini q-copy" data-text="' + esc(params.join('\n')) + '">复制</button>' +
              '<button class="btn btn-mini" style="background:linear-gradient(135deg,#ffb7d2,#cdb7f0);color:#fff;border:none;" onclick="window.__qPack(\'' + esc(item.model || '') + '\',\'' + esc(item.size || '') + '\',\'' + esc(item.weight || '') + '\')">📐 装箱</button>' +
            '</span>' +
          '</div>' +
          '<div class="q-params-list">' + paramsHtml + '</div>' +
        '</div>' +
      '</div>';
    }
    resultsDiv.innerHTML = html;
    resultsDiv.querySelectorAll('.q-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.getAttribute('data-text') || '').then(() => {
          btn.textContent = '已复制!'; btn.style.background = '#dff7e9';
          setTimeout(() => { btn.textContent = '复制'; btn.style.background = ''; }, 2000);
        });
      });
    });
  }

  // 添加产品（弹窗）
  function openAddModal(prefillModel) {
    const modal = $('addModal'); if (!modal) return;
    $('addFormContent').style.display = 'block';
    $('addSuccessContent').style.display = 'none';
    $('addModel').value = prefillModel || '';
    $('addSize').value = '';
    $('addWeight').value = '';
    $('addName').value = '';
    $('saveBtn').disabled = false;
    $('saveBtn').textContent = '保存入库';
    modal.classList.add('show');
    setTimeout(() => $('addModel').focus(), 100);
  }
  function closeAddModal() { const m = $('addModal'); if (m) m.classList.remove('show'); }

  async function saveProduct() {
    const model = $('addModel').value.trim();
    const size = $('addSize').value.trim();
    const weight = $('addWeight').value.trim();
    const name = $('addName').value.trim();
    if (!model) { toast('请输入型号'); return; }
    const btn = $('saveBtn');
    btn.disabled = true; btn.textContent = '保存中...';
    try {
      const resp = await fetch(SUPABASE_URL + '/rest/v1/rpc/admin_insert_products', {
        method: 'POST',
        headers: { ...SB_HEADERS },
        body: JSON.stringify({ p_password: askQPw(), p_rows: [{ model, name: name || null, size: size || null, weight: weight || null, params: null }] })
      });
      if (!resp.ok) {
        let msg = '添加失败: ' + resp.status;
        try { const j = await resp.json(); if (j && j.message) msg = j.message; } catch (e) {}
        if (/口令/.test(msg)) { try { localStorage.removeItem('wz_query_pwd'); } catch (e) {} }
        throw new Error(msg);
      }
      $('addFormContent').style.display = 'none';
      $('savedModelName').textContent = model;
      $('addSuccessContent').style.display = 'block';
    } catch (err) {
      toast('保存失败: ' + err.message);
      btn.disabled = false; btn.textContent = '保存入库';
    }
  }

  // ============================================================
  // ② 全球换算：汇率 + 时差
  // ============================================================
  const exRateCache = {};
  let exLastUpdate = null;

  function fetchHuilvCc(from, to) {
    return new Promise((resolve, reject) => {
      const cb = 'huilv_cb_' + Date.now();
      const url = 'https://webapi.huilv.cc/api/exchange?num=1&chiyouhuobi=' + from + '&duihuanhuobi=' + to + '&type=0&callback=' + cb;
      window[cb] = (data) => {
        try {
          delete window[cb];
          if (data.state === 'ok') resolve({ rate: parseFloat(data.dangqianhuilv), updateTime: data.huilvupdate });
          else reject(new Error('huilv.cc state: ' + data.state));
        } catch (e) { reject(e); }
      };
      const s = document.createElement('script');
      s.src = url;
      s.onerror = () => { delete window[cb]; reject(new Error('Script load error')); };
      document.head.appendChild(s);
      setTimeout(() => { if (window[cb]) { delete window[cb]; if (s.parentNode) s.parentNode.removeChild(s); reject(new Error('Timeout')); } }, 5000);
    });
  }

  async function fetchRate() {
    const from = $('exFrom').value, to = $('exTo').value;
    const resultEl = $('exResult'), rateEl = $('exRate');
    if (from === to) { resultEl.textContent = '1 : 1'; rateEl.textContent = '相同货币，无需换算'; return; }
    resultEl.textContent = '加载中...';
    rateEl.innerHTML = '<span class="q-loading">⏳ 正在获取实时汇率...</span>';
    const cacheKey = from + '_' + to;
    const ts = Date.now();
    const cacheValid = exRateCache[cacheKey] && (ts - exRateCache[cacheKey].ts < 600000);
    let rates, rateInfo = '';
    if (cacheValid) {
      rates = exRateCache[cacheKey].data;
      const up = exLastUpdate ? ' · 更新: ' + exLastUpdate : '';
      rateEl.innerHTML = '<span class="q-loading">📡 huilv.cc · 1 ' + from + ' ≈ ' + (rates[to] || '-').toFixed(4) + ' ' + to + ' · 已缓存' + up + '</span>';
    } else {
      try {
        rates = null;
        try {
          const hr = await fetchHuilvCc(from, to);
          if (hr && hr.rate) {
            rates = {}; rates[to] = hr.rate;
            exRateCache[cacheKey] = { data: rates, ts };
            exLastUpdate = hr.updateTime;
            rateInfo = '📡 huilv.cc(实时) · 更新: ' + exLastUpdate;
          }
        } catch (e1) { console.log('huilv.cc 失败:', e1.message); }
        if (!rates) {
          try {
            const r2 = await fetch('https://api.exchangerate-api.com/v4/latest/' + from, { signal: AbortSignal.timeout(8000) });
            if (r2.ok) {
              const j2 = await r2.json();
              if (j2.rates && j2.rates[to]) {
                rates = j2.rates; exRateCache[cacheKey] = { data: rates, ts };
                exLastUpdate = new Date().toLocaleTimeString('zh-CN');
                rateInfo = '📡 exchangerate-api.com · 更新: ' + exLastUpdate;
              }
            }
          } catch (e2) { console.log('exchangerate-api 失败:', e2.message); }
        }
        if (!rates) {
          try {
            const r3 = await fetch('https://api.frankfurter.app/latest?from=' + from + '&to=' + to, { signal: AbortSignal.timeout(8000) });
            if (r3.ok) {
              const j3 = await r3.json();
              if (j3.rates && j3.rates[to]) {
                rates = j3.rates; exRateCache[cacheKey] = { data: rates, ts };
                exLastUpdate = j3.date || new Date().toLocaleDateString('zh-CN');
                rateInfo = '📡 European Central Bank · 日期: ' + exLastUpdate;
              }
            }
          } catch (e3) { console.log('Frankfurter 失败:', e3.message); }
        }
        if (!rates) {
          try {
            const r4 = await fetch('https://open.er-api.com/v6/latest/' + from, { signal: AbortSignal.timeout(8000) });
            if (r4.ok) {
              const j4 = await r4.json();
              if (j4.result === 'success' && j4.rates && j4.rates[to]) {
                rates = j4.rates; exRateCache[cacheKey] = { data: rates, ts };
                exLastUpdate = new Date(j4.time_last_update_unix * 1000).toLocaleDateString('zh-CN');
                rateInfo = '📡 open.er-api.com · 更新: ' + exLastUpdate;
              }
            }
          } catch (e4) { console.log('er-api 失败:', e4.message); }
        }
        if (!rates) {
          resultEl.textContent = '获取失败';
          rateEl.innerHTML = '<span style="color:#e04a86;">⚠️ 所有汇率接口均不可用，请检查网络</span>';
          return;
        }
        rateEl.innerHTML = '<span class="q-loading">' + rateInfo + ' · 1 ' + from + ' ≈ ' + (rates[to] || '-').toFixed(4) + ' ' + to + '</span>';
      } catch (e) {
        resultEl.textContent = '获取失败';
        rateEl.innerHTML = '<span style="color:#e04a86;">⚠️ 获取异常: ' + esc(e.message) + '</span>';
        return;
      }
    }
    convert(rates);
  }

  function convert(rates) {
    const from = $('exFrom').value, to = $('exTo').value;
    const amount = parseFloat($('exInput').value) || 0;
    if (!rates) { fetchRate(); return; }
    if (from === to) { $('exResult').textContent = amount.toFixed(2) + ' ' + to; return; }
    const result = amount * rates[to];
    const decimals = (to === 'JPY') ? 2 : 4;
    $('exResult').textContent = result.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + to;
  }

  function swapCurrency() {
    const fromSel = $('exFrom'), toSel = $('exTo');
    const tmp = fromSel.value; fromSel.value = toSel.value; toSel.value = tmp;
    fetchRate();
  }

  // ===== 时差 =====
  const tzCities = window.__TZ_CITIES || [];
  const tzSelected = { A: null, B: null };

  function tzSearch(side) {
    const input = $('tzCity' + side);
    const suggest = $('tzSuggest' + side);
    const q = input.value.trim().toLowerCase();
    if (!q || q.length < 1) {
      suggest.classList.remove('active');
      tzSelected[side] = null;
      tzUpdateResult();
      return;
    }
    const matches = [];
    for (const city of tzCities) {
      const name = city[0], en = city[1], aliases = city[4];
      let score = 0;
      if (name.toLowerCase() === q || en.toLowerCase() === q) score = 100;
      if (name.toLowerCase().indexOf(q) === 0) score = 80;
      if (en.toLowerCase().indexOf(q) === 0) score = 70;
      for (const al of aliases) {
        if (al === q) { score = Math.max(score, 90); break; }
        if (al.indexOf(q) === 0) score = Math.max(score, 60);
        if (al.indexOf(q) !== -1) score = Math.max(score, 30);
      }
      if (name.toLowerCase().indexOf(q) !== -1) score = Math.max(score, 50);
      if (en.toLowerCase().indexOf(q) !== -1) score = Math.max(score, 40);
      if (score > 0) matches.push({ city, score });
    }
    matches.sort((a, b) => b.score - a.score);
    const top = matches.slice(0, 8);
    if (!top.length) { suggest.classList.remove('active'); return; }
    suggest.classList.add('active');
    suggest.innerHTML = '';
    top.forEach(m => {
      const c = m.city;
      const div = document.createElement('div');
      div.className = 'tz-suggest-item';
      div.innerHTML = '<span class="tz-name">' + esc(c[0]) + '</span><span class="tz-info">' + esc(c[1]) + '</span>';
      div.onmousedown = (e) => {
        e.preventDefault();
        $('tzCity' + side).value = c[0] + ', ' + c[1];
        tzSelected[side] = c;
        suggest.classList.remove('active');
        tzUpdateResult();
      };
      suggest.appendChild(div);
    });
  }

  function tzUpdateResult() {
    const r = $('tzResult');
    const a = tzSelected.A, b = tzSelected.B;
    if (!a || !b) { r.innerHTML = '<div style="padding:16px;color:#a08bb0;">输入两个城市或国家名称，自动计算时差</div>'; return; }
    const nowA = getTzTime(a[2]), nowB = getTzTime(b[2]);
    const diffHours = Math.round((nowB.utc - nowA.utc) / 3600000 * 10) / 10;
    let diffText, diffClass;
    if (diffHours === 0) { diffText = '无时差'; diffClass = 'same'; }
    else if (diffHours > 0) { diffText = '快 ' + diffHours + ' 小时'; diffClass = 'ahead'; }
    else { diffText = '慢 ' + Math.abs(diffHours) + ' 小时'; diffClass = 'behind'; }
    let html = '<div style="display:flex;gap:10px;text-align:center;">';
    html += '<div class="tz-card" style="flex:1;"><div style="font-size:13px;color:#a08bb0;">' + esc(a[0]) + ' (' + esc(a[1]) + ')</div><div class="tz-time">' + nowA.time + '</div><div class="tz-date">' + nowA.date + '</div></div>';
    html += '<div class="tz-card" style="flex:1;"><div style="font-size:13px;color:#a08bb0;">' + esc(b[0]) + ' (' + esc(b[1]) + ')</div><div class="tz-time">' + nowB.time + '</div><div class="tz-date">' + nowB.date + '</div></div>';
    html += '</div>';
    html += '<div style="text-align:center;margin-top:10px;">' + esc(b[0]) + ' 比 ' + esc(a[0]) + ' <span class="tz-diff ' + diffClass + '">' + diffText + '</span></div>';
    r.innerHTML = html;
  }

  function getTzTime(tz) {
    try {
      const d = new Date();
      const opts = { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
      const parts = new Intl.DateTimeFormat('en-US', opts).formatToParts(d);
      const map = {};
      parts.forEach(p => { if (p.type !== 'literal') map[p.type] = p.value; });
      const time = map.hour + ':' + map.minute + ':' + map.second;
      const date = map.year + '-' + map.month + '-' + map.day;
      const utcStr = d.toLocaleString('en-US', { timeZone: 'UTC', hour12: false });
      const tzStr = d.toLocaleString('en-US', { timeZone: tz, hour12: false });
      return { time, date, utc: new Date(tzStr).getTime() };
    } catch (e) { return { time: '--:--:--', date: '----', utc: Date.now() }; }
  }

  // ============================================================
  // ③ 物流工具：快递 + 包装预估（AI 已接入火山引擎，走服务端）
  // ============================================================
  const expCompanyMap = {
    'shunfeng': 'shunfeng', 'yunda': 'yunda', 'yuantong': 'yuantong',
    'zhongtong': 'zhongtong', 'shentong': 'shentong', 'jt': 'jtexpress',
    'ems': 'ems', 'china-post': 'youzhengguonei', 'debang': 'debangwuliu',
    'youzheng': 'youzhengguonei', 'zjs': 'zhaijisong',
    'fedex': 'fedex', 'dhl': 'dhl', 'ups': 'ups', 'usps': 'usps'
  };
  const expCompanyNames = {
    'shunfeng': '顺丰速运', 'yunda': '韵达快递', 'yuantong': '圆通速递',
    'zhongtong': '中通快递', 'shentong': '申通快递', 'jtexpress': '极兔速递',
    'ems': 'EMS', 'youzhengguonei': '中国邮政', 'debangwuliu': '德邦快递',
    'zhaijisong': '宅急送', 'fedex': 'FedEx', 'dhl': 'DHL', 'ups': 'UPS', 'usps': 'USPS'
  };
  const intlUrls = {
    'dhl': 'https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=',
    'ups': 'https://www.ups.com/track?tracknum=',
    'fedex': 'https://www.fedex.com/fedextrack/?trknbr='
  };

  function queryExpress() {
    const n = $('expNumber').value.trim();
    const c = $('expCompany').value;
    const r = $('expResult');
    if (!n) { r.innerHTML = '<div class="q-error">请输入快递单号～</div>'; return; }
    const type = expCompanyMap[c] || c;
    const companyName = expCompanyNames[type] || c;
    if (intlUrls[type]) {
      window.open(intlUrls[type] + encodeURIComponent(n), '_blank');
      r.innerHTML = '<div class="q-info-card"><div class="q-info-row"><span class="q-info-label">快递公司</span><span class="q-info-value">' + esc(companyName) + '</span></div>' +
        '<div class="q-info-row"><span class="q-info-label">快递单号</span><span class="q-info-value">' + esc(n) + '</span></div></div>' +
        '<div style="text-align:center;padding:14px;color:#c79a1a;font-size:14px;">✅ 已在新窗口打开 ' + esc(companyName) + ' 官网查询</div>' +
        '<div style="text-align:center;margin-top:4px;"><a href="https://t.17track.net/zh-cn/track?nums=' + encodeURIComponent(n) + '" target="_blank" style="color:#a08bb0;font-size:12px;">🌐 或在 17TRACK 查询</a></div>';
      return;
    }
    window.open('https://www.kuaidi100.com/chaxun?type=' + encodeURIComponent(type) + '&nu=' + encodeURIComponent(n), '_blank');
    r.innerHTML = '<div class="q-info-card"><div class="q-info-row"><span class="q-info-label">快递公司</span><span class="q-info-value">' + esc(companyName) + '</span></div>' +
      '<div class="q-info-row"><span class="q-info-label">快递单号</span><span class="q-info-value">' + esc(n) + '</span></div></div>' +
      '<div style="text-align:center;padding:14px;color:#c79a1a;font-size:14px;">✅ 已在新窗口打开快递100查询</div>';
  }

  function fillPackaging(model, size, weight) {
    const input = $('pkgInput');
    let text = model || '';
    if (size && size !== '-') text += ' ' + size;
    if (weight && weight !== '-') text += ' ' + weight;
    text += ' 个';
    input.value = text;
    input.focus();
    showLogisticsTool('packaging');
  }

  function estimatePackaging() {
    const input = $('pkgInput').value.trim();
    const r = $('pkgResult');
    if (!input) { r.innerHTML = '<div class="q-error">请输入产品信息～</div>'; return; }
    r.innerHTML = '<div class="q-loading">📦 正在计算装箱方案...</div>';
    const apiUrl = SUPABASE_URL + '/functions/v1/packaging-ai';
    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SUPABASE_KEY },
      body: JSON.stringify({ content: input })
    }).then(res => res.json())
      .then(data => {
        if (data.error) { r.innerHTML = '<div class="q-error">' + esc(data.error) + '</div>'; return; }
        const content = data.content || '';
        const html = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
        r.innerHTML = '<div class="q-ai-result">' + html + '</div>';
      })
      .catch(() => { r.innerHTML = '<div class="q-error">请求失败，请稍后重试</div>'; });
  }

  // ============================================================
  // ④ 链接抓取（Shopify 批量产品查找）
  // ============================================================
  const lfCacheMap = {};

  function lfGetStoreBase() {
    let u = $('lfStoreUrl').value.trim().replace(/\/+$/, '');
    if (!u) { toast('请输入店铺网址'); return null; }
    if (!u.startsWith('http')) u = 'https://' + u;
    return u;
  }

  async function lfLoadProducts(storeBase) {
    if (lfCacheMap[storeBase]) return lfCacheMap[storeBase];
    const all = [];
    for (let page = 1; ; page++) {
      try {
        const res = await fetch(storeBase + '/products.json?limit=250&page=' + page);
        if (!res.ok) break;
        const json = await res.json();
        if (!json.products || json.products.length === 0) break;
        json.products.forEach(p => all.push({ title: p.title, handle: p.handle }));
      } catch (e) { console.error('lfLoadProducts page ' + page + ':', e); break; }
    }
    lfCacheMap[storeBase] = all;
    return all;
  }

  async function linkFetcherSearch() {
    const storeBase = lfGetStoreBase();
    if (!storeBase) return;
    const input = $('lfInput').value.trim();
    if (!input) { toast('请先输入型号'); return; }
    const partNumbers = input.split(/[\n\r]+/).map(s => s.trim()).filter(s => s);
    if (!partNumbers.length) { toast('未识别到型号'); return; }
    const infoEl = $('lfInfo');
    const tbody = document.querySelector('#lfResultTable tbody');
    infoEl.textContent = '⏳ 正在抓取产品数据...';
    tbody.innerHTML = '';
    try {
      const products = await lfLoadProducts(storeBase);
      if (!products.length) { infoEl.textContent = '⚠️ 未获取到产品，该店铺可能不是 Shopify 或 API 未公开'; return; }
      tbody.innerHTML = '';
      let found = 0;
      partNumbers.forEach((pn, i) => {
        let match = null;
        for (const p of products) {
          if (p.title.toUpperCase().indexOf(pn.toUpperCase()) !== -1) { match = p; break; }
        }
        const tr = document.createElement('tr');
        if (match) {
          found++;
          const fullUrl = storeBase + '/products/' + match.handle;
          tr.innerHTML = '<td>' + (i + 1) + '</td><td><b>' + esc(pn) + '</b></td><td>' + esc(match.title) + '</td><td><a href="' + esc(fullUrl) + '" target="_blank">' + esc(fullUrl) + '</a></td>';
        } else {
          tr.className = 'notfound';
          tr.innerHTML = '<td>' + (i + 1) + '</td><td><b>' + esc(pn) + '</b></td><td colspan="2">❌ 未收录</td>';
        }
        tbody.appendChild(tr);
      });
      infoEl.innerHTML = '匹配 <b style="color:#c79a1a;">' + found + '</b> / ' + partNumbers.length + '，店铺共 <b style="color:#c79a1a;">' + products.length + '</b> 条产品';
    } catch (e) {
      console.error('linkFetcherSearch error:', e);
      infoEl.textContent = '❌ 错误：' + (e.message || '网络错误，请检查网址或网络');
    }
  }

  function linkFetcherClear() {
    $('lfInput').value = '';
    document.querySelector('#lfResultTable tbody').innerHTML = '';
    $('lfInfo').textContent = '';
  }

  function linkFetcherCopy() {
    const rows = document.querySelectorAll('#lfResultTable tr');
    if (rows.length <= 1) { toast('没有结果可复制'); return; }
    let text = '';
    rows.forEach(r => {
      const cells = r.querySelectorAll('td,th');
      const row = [];
      cells.forEach(c => row.push(c.textContent.replace(/\s+/g, ' ').trim()));
      text += row.join('\t') + '\n';
    });
    navigator.clipboard.writeText(text).then(() => toast('已复制到剪贴板！'));
  }

  // ============================================================
  // 面板切换
  // ============================================================
  function showGlobalTool(tool) {
    ['exchange', 'timezone'].forEach(t => {
      const el = $('gl-' + t);
      if (el) el.style.display = (t === tool) ? 'block' : 'none';
    });
    document.querySelectorAll('.global-card').forEach(c => {
      c.classList.toggle('active', (c.getAttribute('data-tool') || '') === tool);
    });
  }
  function showLogisticsTool(tool) {
    ['express', 'packaging'].forEach(t => {
      const el = $('lg-' + t);
      if (el) el.style.display = (t === tool) ? 'block' : 'none';
    });
    document.querySelectorAll('.logistics-card').forEach(c => {
      c.classList.toggle('active', (c.getAttribute('data-tool') || '') === tool);
    });
    // 若物流版块被折叠则自动展开
    const block = document.querySelector('.q-block[data-id="logistics"]');
    if (block && block.classList.contains('folded')) {
      block.classList.remove('folded');
      try {
        const folded = JSON.parse(localStorage.getItem('wz_query_fold_v1') || '[]');
        const idx = folded.indexOf('logistics');
        if (idx !== -1) folded.splice(idx, 1);
        localStorage.setItem('wz_query_fold_v1', JSON.stringify(folded));
      } catch(e){}
    }
  }

  // ============================================================
  // ⑤ 邮件回复（AI，走腾讯云函数 wz-mail）
  // ============================================================
  let mailChat = []; // 多轮对话历史 [{role, content}]
  async function mailReply() {
    const email = $('mailEmail').value.trim();
    const intent = $('mailIntent').value.trim();
    const sign = $('mailSign').value.trim();
    const status = $('mailStatus');
    const result = $('mailResult');
    if (!email && !intent) { toast('请输入客户邮件或回复意思'); return; }
    const btn = $('mailGenBtn');
    btn.disabled = true; btn.textContent = '生成中...';
    status.textContent = '✉️ AI 正在生成...';

    // 构造本轮用户消息（首轮带客户邮件，追问只带指令）
    let userMsg = intent;
    if (mailChat.length === 0 && email) {
      userMsg = '【客户邮件】\n' + email + '\n\n【用户中文回复意思/指令】\n' + intent;
    }
    mailChat.push({ role: 'user', content: userMsg });

    try {
      const resp = await fetch(SUPABASE_URL + '/functions/v1/mail-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SUPABASE_KEY },
        body: JSON.stringify({ messages: mailChat, sign })
      });
      const r = await resp.json();
      if (r && r.success) {
        const en = r.english || '';
        const zh = r.chinese || '';
        mailChat.push({ role: 'assistant', content: JSON.stringify({ english: en, chinese: zh }) });
        window.__mailEn = en;
        window.__mailZh = zh;
        status.textContent = '';
        result.innerHTML = renderMailResult(en, zh);
      } else {
        mailChat.pop();
        status.textContent = '';
        result.innerHTML = '<div class="q-error">' + esc((r && r.error) || '生成失败，请重试') + '</div>';
      }
    } catch (e) {
      mailChat.pop();
      status.textContent = '';
      result.innerHTML = '<div class="q-error">请求失败：' + esc(e.message || '网络错误') + '</div>';
    } finally {
      btn.disabled = false; btn.textContent = '✨ 生成回复';
      $('mailIntent').value = '';
    }
  }
  function renderMailResult(en, zh) {
    let html = '';
    if (en) {
      html += '<div style="background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin-bottom:8px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
        '<span style="font-size:12px;font-weight:500;color:var(--purple-d);">English</span>' +
        '<button class="btn btn-ghost btn-mini" onclick="queryBaby.mailCopyEn()">📋 复制英文</button></div>' +
        '<div style="white-space:pre-wrap;line-height:1.7;font-size:13px;">' + esc(en) + '</div></div>';
    }
    if (zh) {
      html += '<div style="background:#faf8fc;border:1px solid var(--line);border-radius:12px;padding:8px 12px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
        '<span style="font-size:11px;font-weight:500;color:#a08bb0;">中文</span>' +
        '<button class="btn btn-ghost btn-mini" onclick="queryBaby.mailCopyZh()">📋 复制中文</button></div>' +
        '<div style="white-space:pre-wrap;line-height:1.5;font-size:12px;color:#888;">' + esc(zh) + '</div></div>';
    }
    if (!en && !zh) html = '<div class="q-error">AI 未返回内容</div>';
    return html;
  }
  function mailClear() {
    mailChat = [];
    window.__mailEn = '';
    window.__mailZh = '';
    $('mailEmail').value = '';
    $('mailIntent').value = '';
    $('mailSign').value = '';
    $('mailResult').innerHTML = '';
    $('mailStatus').textContent = '';
  }
  function mailCopyEn() {
    const c = window.__mailEn;
    if (!c) { toast('没有英文可复制'); return; }
    navigator.clipboard.writeText(c).then(() => toast('英文已复制 ✓'));
  }
  function mailCopyZh() {
    const c = window.__mailZh;
    if (!c) { toast('没有中文可复制'); return; }
    navigator.clipboard.writeText(c).then(() => toast('中文已复制 ✓'));
  }

  // ============================================================
  // 对外暴露
  // ============================================================
  window.__qAdd = openAddModal;
  window.__qPack = fillPackaging;
  window.queryBaby = {
    doSearch, fetchRate, convert, swapCurrency, refreshRate: () => { for (const k in exRateCache) delete exRateCache[k]; fetchRate(); },
    tzSearch, queryExpress, estimatePackaging, linkFetcherSearch, linkFetcherClear, linkFetcherCopy,
    showGlobalTool, showLogisticsTool, openAddModal, closeAddModal, saveProduct,
    mailReply, mailClear, mailCopyEn, mailCopyZh
  };

  // ===== 初始化 =====
  document.addEventListener('DOMContentLoaded', () => {
    bindSearch();
    // 添加产品弹窗绑定
    const modal = $('addModal');
    if (modal) {
      modal.addEventListener('click', (e) => { if (e.target === modal) closeAddModal(); });
      const closeBtn = modal.querySelector('.modal-close');
      if (closeBtn) closeBtn.addEventListener('click', closeAddModal);
      const cancelBtn = modal.querySelector('.btn-cancel');
      if (cancelBtn) cancelBtn.addEventListener('click', closeAddModal);
      const saveBtn = $('saveBtn');
      if (saveBtn) saveBtn.addEventListener('click', saveProduct);
      const viewBtn = modal.querySelector('.btn-save.view-result');
      if (viewBtn) viewBtn.addEventListener('click', () => { closeAddModal(); doSearch(); });
    }
    // 时差点击外部关闭建议
    document.addEventListener('click', (e) => {
      if (!e.target.id || (e.target.id !== 'tzCityA' && e.target.id !== 'tzCityB')) {
        const sa = $('tzSuggestA'), sb = $('tzSuggestB');
        if (sa) sa.classList.remove('active');
        if (sb) sb.classList.remove('active');
      }
    });
    // 汇率初始化
    fetchRate();
    // 邮件回复绑定
    const mailGenBtn = $('mailGenBtn');
    if (mailGenBtn) mailGenBtn.addEventListener('click', mailReply);
    const mailClearBtn = $('mailClearBtn');
    if (mailClearBtn) mailClearBtn.addEventListener('click', mailClear);
    const mailIntentInput = $('mailIntent');
    if (mailIntentInput) mailIntentInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); mailReply(); } });
  });
})();
