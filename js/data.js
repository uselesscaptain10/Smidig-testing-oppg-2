/**
 * data.js – Instrument database, portfolio storage & price simulation
 */

'use strict';

/* ─── INSTRUMENT DATABASE ──────────────────────────────────────────── */
const INSTRUMENTS = [
  // Norske aksjer (Oslo Børs)
  { ticker: 'EQNR',  name: 'Equinor ASA',        type: 'Aksje', sector: 'Energi',      currency: 'NOK', price: 285.40, change: 1.8 },
  { ticker: 'DNB',   name: 'DNB Bank ASA',        type: 'Aksje', sector: 'Finans',      currency: 'NOK', price: 222.60, change: 0.7 },
  { ticker: 'TEL',   name: 'Telenor ASA',         type: 'Aksje', sector: 'Telekom',     currency: 'NOK', price: 128.80, change: -0.4 },
  { ticker: 'NHY',   name: 'Norsk Hydro ASA',     type: 'Aksje', sector: 'Materialer',  currency: 'NOK', price: 58.30,  change: 2.1 },
  { ticker: 'SALM',  name: 'SalMar ASA',          type: 'Aksje', sector: 'Forbruker',   currency: 'NOK', price: 605.00, change: 1.2 },
  { ticker: 'MOWI',  name: 'Mowi ASA',            type: 'Aksje', sector: 'Forbruker',   currency: 'NOK', price: 192.40, change: -0.9 },
  { ticker: 'ORK',   name: 'Orkla ASA',           type: 'Aksje', sector: 'Forbruker',   currency: 'NOK', price: 89.90,  change: 0.3 },
  { ticker: 'YAR',   name: 'Yara International',  type: 'Aksje', sector: 'Materialer',  currency: 'NOK', price: 298.40, change: -1.4 },
  { ticker: 'AKRBP', name: 'Aker BP ASA',         type: 'Aksje', sector: 'Energi',      currency: 'NOK', price: 253.80, change: 2.6 },
  { ticker: 'SUBC',  name: 'Subsea 7 SA',         type: 'Aksje', sector: 'Energi',      currency: 'NOK', price: 165.20, change: 1.1 },
  { ticker: 'STB',   name: 'Storebrand ASA',      type: 'Aksje', sector: 'Finans',      currency: 'NOK', price: 108.60, change: 0.5 },
  { ticker: 'SCHIBSTED', name: 'Schibsted ASA',   type: 'Aksje', sector: 'Teknologi',   currency: 'NOK', price: 198.40, change: -0.7 },
  { ticker: 'ODF',   name: 'Odfjell SE',          type: 'Aksje', sector: 'Industri',    currency: 'NOK', price: 78.40,  change: 3.2 },
  { ticker: 'FRONTLINE', name: 'Frontline PLC',   type: 'Aksje', sector: 'Industri',    currency: 'NOK', price: 218.20, change: -1.2 },
  { ticker: 'KAHOT', name: 'Kahoot! AS',          type: 'Aksje', sector: 'Teknologi',   currency: 'NOK', price: 22.10,  change: -2.8 },

  // Globale aksjer (konvertert til NOK)
  { ticker: 'AAPL',  name: 'Apple Inc.',          type: 'Aksje', sector: 'Teknologi',   currency: 'USD', price: 2290.00, change: 0.9 },
  { ticker: 'MSFT',  name: 'Microsoft Corp.',     type: 'Aksje', sector: 'Teknologi',   currency: 'USD', price: 4380.00, change: 0.4 },
  { ticker: 'GOOGL', name: 'Alphabet Inc.',       type: 'Aksje', sector: 'Teknologi',   currency: 'USD', price: 1780.00, change: 1.5 },
  { ticker: 'AMZN',  name: 'Amazon.com Inc.',     type: 'Aksje', sector: 'Forbruker',   currency: 'USD', price: 2100.00, change: -0.3 },
  { ticker: 'NVDA',  name: 'NVIDIA Corp.',        type: 'Aksje', sector: 'Teknologi',   currency: 'USD', price: 1280.00, change: 3.4 },
  { ticker: 'META',  name: 'Meta Platforms',      type: 'Aksje', sector: 'Teknologi',   currency: 'USD', price: 6200.00, change: 1.1 },
  { ticker: 'TSLA',  name: 'Tesla Inc.',          type: 'Aksje', sector: 'Industri',    currency: 'USD', price: 2640.00, change: -2.1 },
  { ticker: 'NFLX',  name: 'Netflix Inc.',        type: 'Aksje', sector: 'Forbruker',   currency: 'USD', price: 9200.00, change: 0.7 },

  // ETF-er
  { ticker: 'EUNL',  name: 'iShares Core MSCI World ETF',   type: 'ETF', sector: 'Diversifisert', currency: 'EUR', price: 940.00,  change: 0.6 },
  { ticker: 'IS3N',  name: 'iShares Core MSCI EM ETF',      type: 'ETF', sector: 'Diversifisert', currency: 'EUR', price: 360.00,  change: -0.8 },
  { ticker: 'IUSN',  name: 'iShares MSCI World Small Cap',  type: 'ETF', sector: 'Diversifisert', currency: 'EUR', price: 580.00,  change: 0.3 },
  { ticker: 'SPY',   name: 'SPDR S&P 500 ETF',              type: 'ETF', sector: 'Diversifisert', currency: 'USD', price: 5580.00, change: 0.5 },
  { ticker: 'QQQ',   name: 'Invesco QQQ Trust',             type: 'ETF', sector: 'Teknologi',     currency: 'USD', price: 4720.00, change: 0.8 },
  { ticker: 'VTI',   name: 'Vanguard Total Stock Market',   type: 'ETF', sector: 'Diversifisert', currency: 'USD', price: 2960.00, change: 0.4 },
  { ticker: 'XACT',  name: 'XACT OSEBX',                    type: 'ETF', sector: 'Diversifisert', currency: 'NOK', price: 182.40,  change: 0.9 },
  { ticker: 'XTRACKERS', name: 'Xtrackers MSCI World',      type: 'ETF', sector: 'Diversifisert', currency: 'EUR', price: 510.00,  change: 0.6 },

  // Norske fond (DNB, Storebrand, KLP)
  { ticker: 'DNB-GLOBAL',  name: 'DNB Global Indeks',        type: 'Fond', sector: 'Diversifisert', currency: 'NOK', price: 2840.00, change: 0.5 },
  { ticker: 'DNB-TEKNOLOGI', name: 'DNB Teknologi',          type: 'Fond', sector: 'Teknologi',     currency: 'NOK', price: 1240.00, change: 1.2 },
  { ticker: 'DNB-NORGE',   name: 'DNB Norge Indeks',         type: 'Fond', sector: 'Diversifisert', currency: 'NOK', price: 1580.00, change: 0.8 },
  { ticker: 'SB-GLOBAL',   name: 'Storebrand Global Indeks', type: 'Fond', sector: 'Diversifisert', currency: 'NOK', price: 3120.00, change: 0.4 },
  { ticker: 'KLP-GLOBAL',  name: 'KLP AksjeGlobal Indeks',  type: 'Fond', sector: 'Diversifisert', currency: 'NOK', price: 1890.00, change: 0.6 },
  { ticker: 'KLP-NORGE',   name: 'KLP AksjeNorge Indeks',   type: 'Fond', sector: 'Diversifisert', currency: 'NOK', price: 1240.00, change: 1.0 },
  { ticker: 'ALFRED-GLOBAL', name: 'Alfred Berg Global',    type: 'Fond', sector: 'Diversifisert', currency: 'NOK', price: 760.00,  change: 0.5 },

  // Krypto
  { ticker: 'BTC',  name: 'Bitcoin',              type: 'Krypto', sector: 'Krypto', currency: 'USD', price: 870000, change: 2.4 },
  { ticker: 'ETH',  name: 'Ethereum',             type: 'Krypto', sector: 'Krypto', currency: 'USD', price: 44000,  change: 1.8 },
  { ticker: 'SOL',  name: 'Solana',               type: 'Krypto', sector: 'Krypto', currency: 'USD', price: 16200,  change: 3.6 },
];

/* ─── PRICE SIMULATION ─────────────────────────────────────────────── */
// Stores live (in-memory) prices so they drift during the session
const livePrices = {};

function initLivePrices() {
  INSTRUMENTS.forEach(inst => {
    livePrices[inst.ticker] = {
      price: inst.price,
      change: inst.change,
      history: generateHistory(inst.price, 365)
    };
  });
}

/**
 * Generate synthetic historical prices using geometric Brownian motion.
 * @param {number} currentPrice – today's price
 * @param {number} days – how many trading days back
 */
function generateHistory(currentPrice, days) {
  const history = [];
  const volatility = 0.015; // 1.5% daily vol
  let price = currentPrice;

  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    // Skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    history.push({ date: d.toISOString().slice(0, 10), price: +price.toFixed(2) });
    const drift = (Math.random() - 0.49) * volatility;
    price *= (1 + drift);
    price = Math.max(price, 1);
  }

  return history;
}

/** Simulate a small tick update */
function tickPrices() {
  INSTRUMENTS.forEach(inst => {
    const lp = livePrices[inst.ticker];
    if (!lp) return;
    const move = (Math.random() - 0.5) * 0.002; // ±0.2%
    lp.price = +(lp.price * (1 + move)).toFixed(2);
    lp.change = +(lp.change + (Math.random() - 0.5) * 0.1).toFixed(2);
  });
}

function getLivePrice(ticker) {
  return livePrices[ticker] || null;
}

function getHistoricalPrices(ticker, period) {
  const lp = livePrices[ticker];
  if (!lp) return [];
  const hist = lp.history;
  const periodMap = { '1W': 5, '1M': 21, '3M': 63, '6M': 126, '1Y': 252, 'ALL': 9999 };
  const days = periodMap[period] || 252;
  return hist.slice(-days);
}

/* ─── PORTFOLIO STORAGE ────────────────────────────────────────────── */
const STORAGE_KEY = 'pt_portfolio_v2';
const TX_KEY      = 'pt_transactions_v2';
const WATCH_KEY   = 'pt_watchlist_v2';

function loadPortfolio() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch { return []; }
}

function savePortfolio(holdings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
}

function loadTransactions() {
  try {
    return JSON.parse(localStorage.getItem(TX_KEY)) || [];
  } catch { return []; }
}

function saveTransactions(txs) {
  localStorage.setItem(TX_KEY, JSON.stringify(txs));
}

function loadWatchlist() {
  try {
    return JSON.parse(localStorage.getItem(WATCH_KEY)) || [];
  } catch { return []; }
}

function saveWatchlist(list) {
  localStorage.setItem(WATCH_KEY, JSON.stringify(list));
}

/* ─── PORTFOLIO COMPUTATIONS ───────────────────────────────────────── */

function computeHolding(h) {
  const lp = getLivePrice(h.ticker);
  const currentPrice = lp ? lp.price : (h.currentPrice || h.avgPrice);
  const dailyChangePct = lp ? lp.change : 0;

  const value       = currentPrice * h.shares;
  const cost        = h.avgPrice * h.shares;
  const gain        = value - cost;
  const gainPct     = cost > 0 ? (gain / cost) * 100 : 0;
  const dailyChange = value * (dailyChangePct / 100);

  return { ...h, currentPrice, dailyChangePct, value, cost, gain, gainPct, dailyChange };
}

function computePortfolio(holdings) {
  const computed = holdings.map(computeHolding);
  const totalValue  = computed.reduce((s, h) => s + h.value, 0);
  const totalCost   = computed.reduce((s, h) => s + h.cost, 0);
  const totalGain   = totalValue - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const dailyChange  = computed.reduce((s, h) => s + h.dailyChange, 0);
  const dailyChangePct = totalValue > 0 ? (dailyChange / totalValue) * 100 : 0;
  return { holdings: computed, totalValue, totalCost, totalGain, totalGainPct, dailyChange, dailyChangePct };
}

/* ─── SEARCH ───────────────────────────────────────────────────────── */
function searchInstruments(query) {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  return INSTRUMENTS.filter(i =>
    i.ticker.toLowerCase().includes(q) ||
    i.name.toLowerCase().includes(q) ||
    i.type.toLowerCase().includes(q)
  ).slice(0, 8);
}

/* ─── FORMATTING ───────────────────────────────────────────────────── */
const NOK = new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 2 });
const PCT  = new Intl.NumberFormat('nb-NO', { style: 'percent', maximumFractionDigits: 2, signDisplay: 'always' });
const NUM  = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const DATE_FMT = new Intl.DateTimeFormat('nb-NO', { dateStyle: 'medium' });

function fmtNOK(v) { return NOK.format(v); }
function fmtPct(v) { return PCT.format(v / 100); }
function fmtNum(v) { return NUM.format(v); }
function fmtDate(d) { return DATE_FMT.format(new Date(d)); }

function colorClass(v) { return v > 0 ? 'pos' : v < 0 ? 'neg' : ''; }

/* ─── EXPORT ───────────────────────────────────────────────────────── */
function exportPortfolioCSV(holdings) {
  const rows = [['Ticker','Navn','Type','Sektor','Antall','Gj.snittpris','Kurs','Verdi','Gevinst','Gevinst%']];
  holdings.forEach(h => {
    const c = computeHolding(h);
    rows.push([c.ticker, c.name, c.type, c.sector, c.shares, c.avgPrice, c.currentPrice, c.value.toFixed(2), c.gain.toFixed(2), c.gainPct.toFixed(2)+'%']);
  });
  const csv = rows.map(r => r.map(x => `"${x}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'portefolje.csv'; a.click();
  URL.revokeObjectURL(url);
}

/* ─── CHART PALETTE ────────────────────────────────────────────────── */
const CHART_COLORS = [
  '#3b82f6','#8b5cf6','#22c55e','#f59e0b','#ef4444',
  '#06b6d4','#ec4899','#84cc16','#f97316','#a855f7',
  '#14b8a6','#f43f5e','#0ea5e9','#d946ef','#10b981',
];

function getColor(i) { return CHART_COLORS[i % CHART_COLORS.length]; }
