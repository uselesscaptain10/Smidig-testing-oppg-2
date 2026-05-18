/**
 * app.js – Main application controller
 */

'use strict';

/* ─── STATE ─────────────────────────────────────────────────────── */
let holdings    = loadPortfolio();
let transactions = loadTransactions();
let watchlist   = loadWatchlist();
let currentPage = 'overview';
let activePeriod = '1M';
let editingId    = null;

/* ─── INIT ──────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initLivePrices();
  seedDemoData();
  bindEvents();
  navigateTo('overview');
  startPriceTicker();
  updateMarketStatus();
  setInterval(updateMarketStatus, 60000);
});

/* ─── DEMO SEED (first visit) ───────────────────────────────────── */
function seedDemoData() {
  if (holdings.length > 0) return; // already have data

  const demo = [
    { ticker: 'EQNR',       name: 'Equinor ASA',          type: 'Aksje', sector: 'Energi',       shares: 200, avgPrice: 252.00,  purchaseDate: '2022-06-15' },
    { ticker: 'DNB',        name: 'DNB Bank ASA',          type: 'Aksje', sector: 'Finans',       shares: 150, avgPrice: 195.00,  purchaseDate: '2022-09-01' },
    { ticker: 'EUNL',       name: 'iShares Core MSCI World ETF', type: 'ETF', sector: 'Diversifisert', shares: 50, avgPrice: 820.00, purchaseDate: '2021-03-10' },
    { ticker: 'DNB-GLOBAL', name: 'DNB Global Indeks',     type: 'Fond', sector: 'Diversifisert', shares: 10, avgPrice: 2400.00,  purchaseDate: '2020-01-05' },
    { ticker: 'NVDA',       name: 'NVIDIA Corp.',          type: 'Aksje', sector: 'Teknologi',    shares: 5,  avgPrice: 900.00,   purchaseDate: '2023-05-20' },
    { ticker: 'NHY',        name: 'Norsk Hydro ASA',       type: 'Aksje', sector: 'Materialer',   shares: 400,avgPrice: 52.00,    purchaseDate: '2022-11-08' },
    { ticker: 'BTC',        name: 'Bitcoin',               type: 'Krypto',sector: 'Krypto',       shares: 0.05, avgPrice: 620000, purchaseDate: '2021-07-01' },
  ];

  demo.forEach(d => addHolding(d, false));

  // Seed transactions
  const now = new Date();
  demo.forEach((d, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (i * 30 + 10));
    transactions.push({
      id: crypto.randomUUID(),
      type: 'buy',
      ticker: d.ticker,
      name: d.name,
      shares: d.shares,
      price: d.avgPrice,
      total: d.shares * d.avgPrice,
      date: date.toISOString().slice(0, 10),
    });
  });
  saveTransactions(transactions);
  showToast('Demo-portefølje lastet inn 🎉', 'success');
}

/* ─── NAVIGATION ────────────────────────────────────────────────── */
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');

  const navEl = document.querySelector(`[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');

  currentPage = page;
  renderPage(page);

  // Close sidebar on mobile
  if (window.innerWidth <= 700) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

function renderPage(page) {
  switch (page) {
    case 'overview':     renderOverview();     break;
    case 'portfolio':    renderPortfolio();    break;
    case 'analysis':     renderAnalysis();     break;
    case 'transactions': renderTransactions(); break;
    case 'watchlist':    renderWatchlist();    break;
    case 'competitive':  renderCompetitiveAnalysis(); break;
  }
}

/* ─── OVERVIEW ──────────────────────────────────────────────────── */
function renderOverview() {
  const pf = computePortfolio(holdings);

  // KPIs
  el('totalValue').textContent   = fmtNOK(pf.totalValue);
  el('totalChange').textContent  = `Kostpris: ${fmtNOK(pf.totalCost)}`;
  el('totalGain').innerHTML      = `<span class="${colorClass(pf.totalGain)}">${fmtNOK(pf.totalGain)}</span>`;
  el('totalGainPct').innerHTML   = `<span class="${colorClass(pf.totalGainPct)}">${fmtPct(pf.totalGainPct)}</span>`;
  el('holdingsCount').textContent = holdings.length;
  el('dailyChange').innerHTML    = `<span class="${colorClass(pf.dailyChange)}">${fmtNOK(pf.dailyChange)}</span>`;
  el('dailyChangePct').innerHTML = `<span class="${colorClass(pf.dailyChangePct)}">${fmtPct(pf.dailyChangePct)} i dag</span>`;

  // Table
  const tbody = el('overviewTableBody');
  const empty = el('overviewEmpty');
  if (pf.holdings.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = '';
  } else {
    empty.style.display = 'none';
    tbody.innerHTML = pf.holdings
      .sort((a, b) => b.value - a.value)
      .map(h => `
        <tr onclick="openDetail('${h.id}')">
          <td><strong>${h.name}</strong></td>
          <td><span class="ticker-badge">${h.ticker}</span></td>
          <td><span class="type-badge type-${h.type}">${h.type}</span></td>
          <td class="num">${fmtNum(h.shares)}</td>
          <td class="num">${fmtNOK(h.currentPrice)}</td>
          <td class="num fw-bold">${fmtNOK(h.value)}</td>
          <td class="num muted">${fmtNOK(h.avgPrice)}</td>
          <td class="num"><span class="${colorClass(h.gain)}">${fmtNOK(h.gain)}</span><br><small class="${colorClass(h.gainPct)}">${fmtPct(h.gainPct)}</small></td>
          <td class="num"><span class="${colorClass(h.dailyChangePct)}">${fmtPct(h.dailyChangePct)}</span></td>
        </tr>
      `).join('');
  }

  // Charts
  if (pf.holdings.length > 0) {
    renderPerformanceChart(pf.holdings, activePeriod);
    renderAllocationChart(pf.holdings);
  }
}

/* ─── PORTFOLIO ─────────────────────────────────────────────────── */
function renderPortfolio() {
  const filter  = el('portfolioFilter').value.toLowerCase();
  const typeF   = el('typeFilter').value;
  const sortKey = el('sortBy').value;
  const pf      = computePortfolio(holdings);

  let filtered = pf.holdings.filter(h => {
    const matchText = !filter || h.name.toLowerCase().includes(filter) || h.ticker.toLowerCase().includes(filter);
    const matchType = !typeF  || h.type === typeF;
    return matchText && matchType;
  });

  if (sortKey === 'value')  filtered.sort((a, b) => b.value - a.value);
  if (sortKey === 'gain')   filtered.sort((a, b) => b.gain  - a.gain);
  if (sortKey === 'name')   filtered.sort((a, b) => a.name.localeCompare(b.name));
  if (sortKey === 'change') filtered.sort((a, b) => b.dailyChangePct - a.dailyChangePct);

  const grid  = el('holdingsGrid');
  const empty = el('portfolioEmpty');

  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty.style.display = '';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = filtered.map(h => `
    <div class="holding-card" onclick="openDetail('${h.id}')">
      <div class="holding-card-header">
        <div>
          <div class="holding-card-title">${h.name}</div>
          <div class="holding-card-ticker">
            <span class="ticker-badge">${h.ticker}</span>
            <span class="type-badge type-${h.type}" style="margin-left:4px">${h.type}</span>
          </div>
        </div>
        <div class="holding-card-actions" onclick="event.stopPropagation()">
          <button class="btn btn-icon btn-secondary" title="Rediger" onclick="openEdit('${h.id}')">✏️</button>
          <button class="btn btn-icon btn-danger" title="Slett" onclick="deleteHolding('${h.id}')">🗑</button>
        </div>
      </div>
      <div class="holding-stat">
        <span class="holding-stat-label">Antall</span>
        <span class="holding-stat-value">${fmtNum(h.shares)}</span>
      </div>
      <div class="holding-stat">
        <span class="holding-stat-label">Gjeldende kurs</span>
        <span class="holding-stat-value">${fmtNOK(h.currentPrice)}</span>
      </div>
      <div class="holding-stat">
        <span class="holding-stat-label">Verdi</span>
        <span class="holding-stat-value fw-bold">${fmtNOK(h.value)}</span>
      </div>
      <div class="holding-stat">
        <span class="holding-stat-label">Gj.snittpris</span>
        <span class="holding-stat-value muted">${fmtNOK(h.avgPrice)}</span>
      </div>
      <div class="holding-perf">
        <div>
          <div class="holding-perf-label">Gevinst / tap</div>
          <div class="holding-perf-value ${colorClass(h.gain)}">${fmtNOK(h.gain)} (${fmtPct(h.gainPct)})</div>
        </div>
        <div style="text-align:right">
          <div class="holding-perf-label">I dag</div>
          <div class="holding-perf-value ${colorClass(h.dailyChangePct)}">${fmtPct(h.dailyChangePct)}</div>
        </div>
      </div>
    </div>
  `).join('');
}

/* ─── ANALYSIS ──────────────────────────────────────────────────── */
function renderAnalysis() {
  const pf = computePortfolio(holdings);
  const h  = pf.holdings;

  renderSectorChart(h);
  renderTypeChart(h);
  renderGainChart(h);
  renderRiskChart(h);

  // Stats
  const winners = h.filter(x => x.gain > 0).length;
  const losers  = h.filter(x => x.gain < 0).length;
  const bestH   = h.reduce((b, x) => x.gainPct > (b?.gainPct || -Infinity) ? x : b, null);
  const worstH  = h.reduce((b, x) => x.gainPct < (b?.gainPct || Infinity)  ? x : b, null);
  const biggestPos = h.reduce((b, x) => x.value > (b?.value || 0) ? x : b, null);

  el('statsGrid').innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Vinnere / tapere</div>
      <div class="stat-value"><span class="pos">${winners}</span> / <span class="neg">${losers}</span></div>
      <div class="stat-sub">av ${h.length} beholdninger</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Beste posisjon</div>
      <div class="stat-value pos">${bestH ? fmtPct(bestH.gainPct) : '–'}</div>
      <div class="stat-sub">${bestH?.name || '–'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Svakeste posisjon</div>
      <div class="stat-value neg">${worstH ? fmtPct(worstH.gainPct) : '–'}</div>
      <div class="stat-sub">${worstH?.name || '–'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Største posisjon</div>
      <div class="stat-value">${biggestPos ? fmtNOK(biggestPos.value) : '–'}</div>
      <div class="stat-sub">${biggestPos?.name || '–'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total gevinst</div>
      <div class="stat-value ${colorClass(pf.totalGain)}">${fmtNOK(pf.totalGain)}</div>
      <div class="stat-sub">${fmtPct(pf.totalGainPct)} av kostpris</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Antall sektorer</div>
      <div class="stat-value">${new Set(h.map(x => x.sector)).size}</div>
      <div class="stat-sub">ulike sektorer</div>
    </div>
  `;
}

/* ─── TRANSACTIONS ──────────────────────────────────────────────── */
function renderTransactions() {
  const filter = el('txFilter').value.toLowerCase();
  const typeF  = el('txTypeFilter').value;

  const filtered = transactions.filter(tx => {
    const matchText = !filter || tx.name.toLowerCase().includes(filter) || tx.ticker.toLowerCase().includes(filter);
    const matchType = !typeF  || tx.type === typeF;
    return matchText && matchType;
  });

  const list  = el('txList');
  const empty = el('txEmpty');

  if (filtered.length === 0) {
    list.innerHTML = '';
    empty.style.display = '';
    return;
  }
  empty.style.display = 'none';

  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  const icons  = { buy: '📈', sell: '📉', dividend: '💰' };
  const labels = { buy: 'Kjøp', sell: 'Salg', dividend: 'Utbytte' };

  list.innerHTML = sorted.map(tx => `
    <div class="tx-item">
      <div class="tx-icon ${tx.type}">${icons[tx.type]}</div>
      <div class="tx-info">
        <div class="tx-title">${labels[tx.type] || tx.type}: ${tx.name} <span class="ticker-badge">${tx.ticker}</span></div>
        <div class="tx-sub">${fmtNum(tx.shares)} andeler @ ${fmtNOK(tx.price)} · ${fmtDate(tx.date)}</div>
      </div>
      <div class="tx-amount ${tx.type === 'sell' ? 'pos' : tx.type === 'buy' ? 'neg' : 'pos'}">${tx.type === 'buy' ? '-' : '+'}${fmtNOK(tx.total)}</div>
    </div>
  `).join('');
}

/* ─── WATCHLIST ─────────────────────────────────────────────────── */
function renderWatchlist() {
  const grid  = el('watchlistGrid');
  const empty = el('watchlistEmpty');

  if (watchlist.length === 0) {
    grid.innerHTML = '';
    empty.style.display = '';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = watchlist.map(ticker => {
    const inst = INSTRUMENTS.find(i => i.ticker === ticker);
    const lp   = getLivePrice(ticker);
    if (!inst || !lp) return '';
    const cc = lp.change >= 0 ? 'pos' : 'neg';
    const sign = lp.change >= 0 ? '+' : '';
    return `
      <div class="watch-card">
        <button class="watch-card-remove" onclick="removeFromWatchlist('${ticker}')" title="Fjern">✕</button>
        <div class="watch-name">${inst.name}</div>
        <div class="watch-ticker">
          <span class="ticker-badge">${ticker}</span>
          <span class="type-badge type-${inst.type}" style="margin-left:4px">${inst.type}</span>
        </div>
        <div class="watch-price">${fmtNOK(lp.price)}</div>
        <div class="watch-change ${cc}">${sign}${fmtPct(lp.change)}</div>
        <hr class="divider" />
        <div style="font-size:12px;color:var(--text2)">Sektor: ${inst.sector}</div>
      </div>
    `;
  }).join('');
}

/* ─── ADD / EDIT HOLDING ────────────────────────────────────────── */
function addHolding(data, withTransaction = true) {
  const id   = crypto.randomUUID();
  const lp   = getLivePrice(data.ticker);
  const holding = {
    id,
    ticker:       data.ticker.toUpperCase(),
    name:         data.name,
    type:         data.type,
    sector:       data.sector || 'Diversifisert',
    shares:       +data.shares,
    avgPrice:     +data.avgPrice,
    currentPrice: +(data.currentPrice || (lp ? lp.price : data.avgPrice)),
    purchaseDate: data.purchaseDate || new Date().toISOString().slice(0, 10),
    note:         data.note || '',
  };
  holdings.push(holding);
  savePortfolio(holdings);

  if (withTransaction) {
    const tx = {
      id: crypto.randomUUID(),
      type: 'buy',
      ticker: holding.ticker,
      name:   holding.name,
      shares: holding.shares,
      price:  holding.avgPrice,
      total:  holding.shares * holding.avgPrice,
      date:   holding.purchaseDate,
    };
    transactions.push(tx);
    saveTransactions(transactions);
  }
  return holding;
}

function updateHolding(id, data) {
  const idx = holdings.findIndex(h => h.id === id);
  if (idx < 0) return;
  holdings[idx] = { ...holdings[idx], ...data, id };
  savePortfolio(holdings);
}

function deleteHolding(id) {
  if (!confirm('Er du sikker på at du vil slette denne beholdningen?')) return;
  holdings = holdings.filter(h => h.id !== id);
  savePortfolio(holdings);
  showToast('Beholdning slettet', 'success');
  renderPage(currentPage);
}

/* ─── DETAIL MODAL ──────────────────────────────────────────────── */
function openDetail(id) {
  const h = holdings.find(x => x.id === id);
  if (!h) return;
  const c = computeHolding(h);

  el('detailTitle').textContent = c.name;
  el('detailContent').innerHTML = `
    <div class="detail-kpis">
      <div class="detail-kpi">
        <div class="detail-kpi-label">Verdi</div>
        <div class="detail-kpi-value fw-bold">${fmtNOK(c.value)}</div>
      </div>
      <div class="detail-kpi">
        <div class="detail-kpi-label">Gjeldende kurs</div>
        <div class="detail-kpi-value">${fmtNOK(c.currentPrice)}</div>
      </div>
      <div class="detail-kpi">
        <div class="detail-kpi-label">Antall / andeler</div>
        <div class="detail-kpi-value">${fmtNum(c.shares)}</div>
      </div>
      <div class="detail-kpi">
        <div class="detail-kpi-label">Gj.snittpris</div>
        <div class="detail-kpi-value">${fmtNOK(c.avgPrice)}</div>
      </div>
      <div class="detail-kpi">
        <div class="detail-kpi-label">Kostpris</div>
        <div class="detail-kpi-value">${fmtNOK(c.cost)}</div>
      </div>
      <div class="detail-kpi">
        <div class="detail-kpi-label">Gevinst / tap</div>
        <div class="detail-kpi-value ${colorClass(c.gain)}">${fmtNOK(c.gain)}</div>
      </div>
      <div class="detail-kpi">
        <div class="detail-kpi-label">Avkastning %</div>
        <div class="detail-kpi-value ${colorClass(c.gainPct)}">${fmtPct(c.gainPct)}</div>
      </div>
      <div class="detail-kpi">
        <div class="detail-kpi-label">Daglig endring</div>
        <div class="detail-kpi-value ${colorClass(c.dailyChangePct)}">${fmtPct(c.dailyChangePct)}</div>
      </div>
    </div>
    <div style="font-size:13px;color:var(--text2);display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px">
      <span>Type: <strong style="color:var(--text)">${c.type}</strong></span>
      <span>Sektor: <strong style="color:var(--text)">${c.sector}</strong></span>
      <span>Kjøpsdato: <strong style="color:var(--text)">${c.purchaseDate ? fmtDate(c.purchaseDate) : '–'}</strong></span>
    </div>
    ${c.note ? `<div style="background:var(--bg3);border-radius:8px;padding:12px;font-size:13px;color:var(--text2)">${c.note}</div>` : ''}
    <div class="detail-actions">
      <button class="btn btn-secondary" onclick="openEdit('${id}');closeDetailModal()">✏️ Rediger</button>
      <button class="btn btn-secondary" onclick="addToWatchlist('${c.ticker}')">👁️ Overvåk</button>
      <button class="btn btn-danger"    onclick="deleteHolding('${id}');closeDetailModal()">🗑 Slett</button>
    </div>
  `;
  el('detailModal').classList.add('open');
}

function closeDetailModal() {
  el('detailModal').classList.remove('open');
}

/* ─── ADD / EDIT MODAL ──────────────────────────────────────────── */
function openAddModal(prefill) {
  editingId = null;
  el('modalTitle').textContent = 'Legg til beholdning';
  el('addForm').reset();
  el('dateInput').value = new Date().toISOString().slice(0, 10);

  if (prefill) {
    el('tickerInput').value = prefill.ticker || '';
    el('nameInput').value   = prefill.name   || '';
    el('typeInput').value   = prefill.type   || '';
    el('sectorInput').value = prefill.sector || '';
    if (prefill.price) el('currentPriceInput').value = prefill.price;
  }
  el('addModal').classList.add('open');
  setTimeout(() => el('searchInput').focus(), 100);
}

function openEdit(id) {
  const h = holdings.find(x => x.id === id);
  if (!h) return;
  editingId = id;
  el('modalTitle').textContent = 'Rediger beholdning';
  el('tickerInput').value       = h.ticker;
  el('nameInput').value         = h.name;
  el('typeInput').value         = h.type;
  el('sectorInput').value       = h.sector;
  el('sharesInput').value       = h.shares;
  el('priceInput').value        = h.avgPrice;
  el('currentPriceInput').value = h.currentPrice;
  el('dateInput').value         = h.purchaseDate || '';
  el('noteInput').value         = h.note || '';
  el('addModal').classList.add('open');
}

function closeAddModal() {
  el('addModal').classList.remove('open');
  editingId = null;
}

/* ─── WATCHLIST ─────────────────────────────────────────────────── */
function addToWatchlist(ticker) {
  if (!watchlist.includes(ticker)) {
    watchlist.push(ticker);
    saveWatchlist(watchlist);
    showToast(`${ticker} lagt til i overvåkningslisten`, 'success');
  }
}

function removeFromWatchlist(ticker) {
  watchlist = watchlist.filter(t => t !== ticker);
  saveWatchlist(watchlist);
  renderWatchlist();
}

/* ─── SEARCH ────────────────────────────────────────────────────── */
function buildSearchItem(inst) {
  const lp = getLivePrice(inst.ticker);
  const price = lp ? lp.price : inst.price;
  const change = lp ? lp.change : inst.change;
  const cc = change >= 0 ? 'pos' : 'neg';
  const sign = change >= 0 ? '+' : '';
  return `
    <div class="search-item" data-ticker="${inst.ticker}">
      <div class="search-item-ticker">${inst.ticker}</div>
      <div class="search-item-info">
        <div class="search-item-name">${inst.name}</div>
        <div class="search-item-meta">${inst.type} · ${inst.sector}</div>
      </div>
      <div class="search-item-price">
        ${fmtNOK(price)}<br>
        <small class="${cc}">${sign}${fmtPct(change)}</small>
      </div>
    </div>`;
}

function attachSearchDropdown(inputId, resultsId, onSelect) {
  const input   = el(inputId);
  const results = el(resultsId);
  if (!input || !results) return;

  let timeout;
  input.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const q = input.value.trim();
      if (!q) { results.classList.remove('open'); return; }
      const found = searchInstruments(q);
      if (!found.length) { results.classList.remove('open'); return; }
      results.innerHTML = found.map(buildSearchItem).join('');
      results.classList.add('open');
    }, 150);
  });

  results.addEventListener('click', e => {
    const item = e.target.closest('.search-item');
    if (!item) return;
    const ticker = item.dataset.ticker;
    const inst   = INSTRUMENTS.find(i => i.ticker === ticker);
    if (inst) onSelect(inst);
    results.classList.remove('open');
    input.value = '';
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !results.contains(e.target)) {
      results.classList.remove('open');
    }
  });
}

/* ─── PRICE TICKER ──────────────────────────────────────────────── */
let tickerInterval;
function startPriceTicker() {
  tickerInterval = setInterval(() => {
    tickPrices();
    if (currentPage === 'overview')  renderOverview();
    if (currentPage === 'portfolio') renderPortfolio();
    if (currentPage === 'watchlist') renderWatchlist();
  }, 5000);
}

/* ─── MARKET STATUS ─────────────────────────────────────────────── */
function updateMarketStatus() {
  const now  = new Date();
  const day  = now.getDay();
  const hour = now.getHours();
  const isOpen = day >= 1 && day <= 5 && hour >= 9 && hour < 17;
  const dot  = document.querySelector('.status-dot');
  const txt  = document.querySelector('.status-text');
  if (dot && txt) {
    dot.style.background = isOpen ? 'var(--success)' : 'var(--warning)';
    txt.textContent = isOpen ? 'Markedet åpent' : 'Markedet stengt';
  }
}

/* ─── EVENT BINDING ─────────────────────────────────────────────── */
function bindEvents() {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => { e.preventDefault(); navigateTo(item.dataset.page); });
  });

  // Sidebar toggle
  el('menuToggle').addEventListener('click', () => {
    const s = el('sidebar');
    if (window.innerWidth <= 700) {
      s.classList.toggle('open');
    } else {
      s.classList.toggle('hidden');
      el('layout').classList.toggle('full');
    }
  });
  el('sidebarClose').addEventListener('click', () => el('sidebar').classList.remove('open'));

  // Add holding button
  el('addHoldingBtn').addEventListener('click', () => openAddModal());
  el('emptyAddBtn')?.addEventListener('click', () => openAddModal());

  // Modal close
  el('modalClose').addEventListener('click', closeAddModal);
  el('cancelBtn').addEventListener('click', closeAddModal);
  el('detailModalClose').addEventListener('click', closeDetailModal);
  el('addModal').addEventListener('click', e => { if (e.target === el('addModal')) closeAddModal(); });
  el('detailModal').addEventListener('click', e => { if (e.target === el('detailModal')) closeDetailModal(); });

  // Form submit
  el('addForm').addEventListener('submit', e => {
    e.preventDefault();
    const data = {
      ticker:       el('tickerInput').value.trim().toUpperCase(),
      name:         el('nameInput').value.trim(),
      type:         el('typeInput').value,
      sector:       el('sectorInput').value,
      shares:       +el('sharesInput').value,
      avgPrice:     +el('priceInput').value,
      currentPrice: +el('currentPriceInput').value || undefined,
      purchaseDate: el('dateInput').value,
      note:         el('noteInput').value.trim(),
    };

    if (editingId) {
      updateHolding(editingId, data);
      showToast('Beholdning oppdatert ✓', 'success');
    } else {
      addHolding(data);
      showToast(`${data.name} lagt til i porteføljen ✓`, 'success');
    }
    closeAddModal();
    renderPage(currentPage);
  });

  // Period tabs
  el('periodTabs').addEventListener('click', e => {
    const btn = e.target.closest('.period-btn');
    if (!btn) return;
    document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activePeriod = btn.dataset.period;
    const pf = computePortfolio(holdings);
    if (pf.holdings.length > 0) renderPerformanceChart(pf.holdings, activePeriod);
  });

  // Portfolio filters
  el('portfolioFilter').addEventListener('input', () => renderPortfolio());
  el('typeFilter').addEventListener('change', () => renderPortfolio());
  el('sortBy').addEventListener('change', () => renderPortfolio());

  // Transaction filters
  el('txFilter').addEventListener('input', () => renderTransactions());
  el('txTypeFilter').addEventListener('change', () => renderTransactions());

  // Export / Reset
  el('exportBtn').addEventListener('click', () => {
    exportPortfolioCSV(holdings);
    showToast('CSV-fil eksportert ✓', 'success');
  });
  el('resetBtn').addEventListener('click', () => {
    if (!confirm('Dette vil slette ALL data. Er du sikker?')) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TX_KEY);
    localStorage.removeItem(WATCH_KEY);
    holdings = []; transactions = []; watchlist = [];
    showToast('All data slettet', 'success');
    renderPage(currentPage);
  });

  // Global search (topbar)
  attachSearchDropdown('globalSearch', 'searchResults', inst => {
    openAddModal({ ticker: inst.ticker, name: inst.name, type: inst.type, sector: inst.sector, price: getLivePrice(inst.ticker)?.price });
  });

  // Modal search
  attachSearchDropdown('searchInput', 'modalSearchResults', inst => {
    el('tickerInput').value       = inst.ticker;
    el('nameInput').value         = inst.name;
    el('typeInput').value         = inst.type;
    el('sectorInput').value       = inst.sector;
    const lp = getLivePrice(inst.ticker);
    if (lp) el('currentPriceInput').value = lp.price;
  });

  // Watchlist search
  const watchInput   = el('watchSearch');
  const watchResults = el('watchSearchResults');

  let watchTimeout;
  watchInput.addEventListener('input', () => {
    clearTimeout(watchTimeout);
    watchTimeout = setTimeout(() => {
      const q = watchInput.value.trim();
      if (!q) { watchResults.classList.remove('open'); return; }
      const found = searchInstruments(q);
      watchResults.innerHTML = found.map(buildSearchItem).join('');
      watchResults.classList.add('open');
    }, 150);
  });

  watchResults.addEventListener('click', e => {
    const item = e.target.closest('.search-item');
    if (!item) return;
    const ticker = item.dataset.ticker;
    addToWatchlist(ticker);
    watchResults.classList.remove('open');
    watchInput.value = '';
    renderWatchlist();
  });

  el('watchAddBtn').addEventListener('click', () => {
    const ticker = watchInput.value.trim().toUpperCase();
    if (ticker && INSTRUMENTS.find(i => i.ticker === ticker)) {
      addToWatchlist(ticker);
      watchInput.value = '';
      renderWatchlist();
    }
  });

  document.addEventListener('click', e => {
    if (!watchInput.contains(e.target) && !watchResults.contains(e.target)) {
      watchResults.classList.remove('open');
    }
  });

  // Competitive analysis
  el('compsSector').addEventListener('change', () => {
    renderCompsTable();
    renderCompsBarChart(el('compsMetric').value);
  });
  el('compsMetric').addEventListener('change', () => {
    renderCompsBarChart(el('compsMetric').value);
  });
  el('dcfCalcBtn').addEventListener('click', calcDCF);
  el('dcfTickerSelect').addEventListener('change', () => {
    const ticker = el('dcfTickerSelect').value;
    if (!ticker) return;
    const comp = COMP_DATA.find(c => c.ticker === ticker);
    if (!comp) return;
    el('dcfFCF').value          = comp.fcfPS;
    el('dcfG1').value           = comp.g1;
    el('dcfG2').value           = comp.g2;
    el('dcfWACC').value         = comp.wacc;
    el('dcfTG').value           = comp.tg;
    const lp = getLivePrice(ticker);
    if (lp) el('dcfCurrentPrice').value = lp.price;
  });
}

/* ─── COMPETITIVE ANALYSIS ──────────────────────────────────────── */
function renderCompetitiveAnalysis() {
  renderCompsTable();
  renderCompsBarChart(el('compsMetric').value || 'pe');
}

function renderCompsTable() {
  const sector = el('compsSector').value;
  const data   = sector ? COMP_DATA.filter(c => c.sector === sector) : COMP_DATA;
  const owned  = new Set(holdings.map(h => h.ticker));

  const fmtV  = v => v != null ? fmtNum(v) : '–';
  const fmtG  = v => v != null ? (v >= 0 ? '+' : '') + fmtNum(v) + '%' : '–';
  const gcG   = v => v == null ? '' : v >= 0 ? 'pos' : 'neg';

  el('compsTableBody').innerHTML = data.map(c => `
    <tr class="${owned.has(c.ticker) ? 'comps-row-owned' : ''}">
      <td>
        <span class="ticker-badge">${c.ticker}</span>
        <span style="margin-left:6px">${c.name}</span>
        ${owned.has(c.ticker) ? '<span class="badge-owned">I portefølje</span>' : ''}
      </td>
      <td>${c.sector}</td>
      <td class="num">${fmtV(c.pe)}</td>
      <td class="num">${fmtV(c.ps)}</td>
      <td class="num">${fmtV(c.evEbitda)}</td>
      <td class="num">${fmtV(c.pbv)}</td>
      <td class="num ${gcG(c.revGrowth)}">${fmtG(c.revGrowth)}</td>
      <td class="num pos">${fmtV(c.netMargin)}%</td>
      <td class="num pos">${fmtV(c.roe)}%</td>
    </tr>
  `).join('');
}

function calcDCF() {
  const fcf   = +el('dcfFCF').value;
  const g1    = +el('dcfG1').value / 100;
  const g2    = +el('dcfG2').value / 100;
  const wacc  = +el('dcfWACC').value / 100;
  const tg    = +el('dcfTG').value / 100;
  const price = +el('dcfCurrentPrice').value;

  if (!fcf || wacc <= tg || wacc <= 0) {
    showToast('Ugyldig input – sjekk WACC og terminalvekst', 'error');
    return;
  }

  let cf = fcf, pvFCF = 0;
  for (let t = 1; t <= 10; t++) {
    cf = cf * (1 + (t <= 5 ? g1 : g2));
    pvFCF += cf / Math.pow(1 + wacc, t);
  }
  const tv   = cf * (1 + tg) / (wacc - tg);
  const pvTV = tv / Math.pow(1 + wacc, 10);
  const intrinsic = pvFCF + pvTV;
  const mos = price > 0 ? (intrinsic - price) / price * 100 : null;

  // Sensitivity: rows = WACC ± 2%, cols = g1 ± 2%
  const dSteps = [-2, -1, 0, 1, 2];
  const sensCols = dSteps.map(d => ((g1 + d / 100) * 100).toFixed(1) + '%');
  const sensRows = dSteps.map(dw => {
    const w = wacc + dw / 100;
    return {
      wacc: (w * 100).toFixed(1) + '%',
      vals: dSteps.map(dg => {
        const gg = g1 + dg / 100;
        if (w <= tg) return null;
        let c2 = fcf, pv2 = 0;
        for (let t = 1; t <= 10; t++) { c2 = c2 * (1 + (t <= 5 ? gg : g2)); pv2 += c2 / Math.pow(1 + w, t); }
        const tv2 = c2 * (1 + tg) / (w - tg);
        return pv2 + tv2 / Math.pow(1 + w, 10);
      })
    };
  });

  const mosClass = mos == null ? '' : mos > 20 ? 'pos' : mos < -20 ? 'neg' : '';
  const verdict  = mos == null ? '' : mos > 20
    ? '✅ Undervurdert – potensielt kjøpskandidat'
    : mos < -20 ? '⚠️ Overvurdert – vær forsiktig'
    : '⚖️ Tilnærmet rettferdig priset';

  el('dcfResults').innerHTML = `
    <div class="dcf-kpi-grid">
      <div class="dcf-kpi">
        <div class="dcf-kpi-label">Intrinsisk verdi</div>
        <div class="dcf-kpi-value fw-bold">${fmtNOK(intrinsic)}</div>
      </div>
      <div class="dcf-kpi">
        <div class="dcf-kpi-label">Markedspris</div>
        <div class="dcf-kpi-value">${fmtNOK(price)}</div>
      </div>
      <div class="dcf-kpi">
        <div class="dcf-kpi-label">Sikkerhetsmargin</div>
        <div class="dcf-kpi-value ${mosClass}">${mos != null ? (mos >= 0 ? '+' : '') + fmtNum(mos) + '%' : '–'}</div>
      </div>
      <div class="dcf-kpi">
        <div class="dcf-kpi-label">PV av FCF (år 1–10)</div>
        <div class="dcf-kpi-value">${fmtNOK(pvFCF)}</div>
      </div>
      <div class="dcf-kpi">
        <div class="dcf-kpi-label">PV av terminalverdi</div>
        <div class="dcf-kpi-value">${fmtNOK(pvTV)}</div>
      </div>
      <div class="dcf-kpi">
        <div class="dcf-kpi-label">TV-andel</div>
        <div class="dcf-kpi-value">${fmtPct(pvTV / intrinsic * 100)}</div>
      </div>
    </div>
    ${verdict ? `<div class="dcf-verdict ${mosClass}">${verdict}</div>` : ''}
    <div class="dcf-sens-header">Sensitivitetsanalyse – intrinsisk verdi per aksje (NOK)</div>
    <div class="sens-wrap">
      <table class="sens-table">
        <thead>
          <tr>
            <th>WACC \\ Vekst</th>
            ${sensCols.map(g => `<th>${g}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${sensRows.map((row, ri) => `
            <tr>
              <th>${row.wacc}</th>
              ${row.vals.map((v, ci) => {
                if (v == null) return '<td>–</td>';
                const isCtr = ri === 2 && ci === 2;
                const cls   = v > price * 1.2 ? 'pos' : v < price * 0.8 ? 'neg' : '';
                return `<td class="${cls}${isCtr ? ' sens-center' : ''}">${fmtNOK(v)}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ─── HELPERS ───────────────────────────────────────────────────── */
function el(id) { return document.getElementById(id); }

function showToast(msg, type = '') {
  const t = el('toast');
  t.textContent = msg;
  t.className   = `toast ${type} show`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3500);
}
