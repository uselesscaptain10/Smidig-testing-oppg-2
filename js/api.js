/**
 * api.js – Yahoo Finance integration via CORS proxy
 * Priser hentes fra Yahoo Finance og konverteres til NOK.
 * Faller tilbake til simulerte priser hvis API feiler.
 */

'use strict';

/* ─── TICKER-MAPPING: vår kode → Yahoo Finance-symbol ──────────── */
const YF_MAP = {
  // Oslo Børs (.OL)
  'EQNR':       'EQNR.OL',
  'DNB':        'DNB.OL',
  'TEL':        'TEL.OL',
  'NHY':        'NHY.OL',
  'SALM':       'SALM.OL',
  'MOWI':       'MOWI.OL',
  'ORK':        'ORK.OL',
  'YAR':        'YAR.OL',
  'AKRBP':      'AKRBP.OL',
  'SUBC':       'SUBC.OL',
  'STB':        'STB.OL',
  'SCHIBSTED':  'SCHA.OL',
  'ODF':        'ODF.OL',
  'FRONTLINE':  'FRO.OL',
  'KAHOT':      'KAHOT.OL',
  // Globale aksjer (USD)
  'AAPL':       'AAPL',
  'MSFT':       'MSFT',
  'GOOGL':      'GOOGL',
  'AMZN':       'AMZN',
  'NVDA':       'NVDA',
  'META':       'META',
  'TSLA':       'TSLA',
  'NFLX':       'NFLX',
  // ETF-er
  'EUNL':       'EUNL.DE',
  'IS3N':       'IS3N.DE',
  'IUSN':       'IUSN.DE',
  'SPY':        'SPY',
  'QQQ':        'QQQ',
  'VTI':        'VTI',
  'XACT':       'XACT.OL',
  'XTRACKERS':  'XDWD.DE',
  // Krypto (USD)
  'BTC':        'BTC-USD',
  'ETH':        'ETH-USD',
  'SOL':        'SOL-USD',
};

/* Norske fond finnes ikke på Yahoo Finance – beholder simulerte data */
const NO_YF = new Set([
  'DNB-GLOBAL', 'DNB-TEKNOLOGI', 'DNB-NORGE',
  'SB-GLOBAL', 'KLP-GLOBAL', 'KLP-NORGE', 'ALFRED-GLOBAL',
]);

/* Valutakurser (fallback-verdier) */
let usdNok = 10.8;
let eurNok = 11.8;

/* ─── API-STATUS ────────────────────────────────────────────────── */
let apiStatus = 'loading'; // 'live' | 'simulated' | 'loading'

function setApiStatus(status) {
  apiStatus = status;
  const el = document.getElementById('apiStatusBadge');
  if (!el) return;
  const map = {
    live:      { text: '● Live-data (Yahoo Finance)', cls: 'badge-live' },
    simulated: { text: '○ Simulerte priser',          cls: 'badge-sim'  },
    loading:   { text: '⟳ Henter priser…',            cls: 'badge-load' },
  };
  const { text, cls } = map[status] || map.simulated;
  el.textContent  = text;
  el.className    = `api-badge ${cls}`;
}

/* ─── CORS-PROXY FETCH ──────────────────────────────────────────── */
const PROXIES = [
  url => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  url => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
];

async function proxyFetch(url) {
  for (const makeProxy of PROXIES) {
    try {
      const proxyUrl = makeProxy(url);
      const res = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(9000),
      });
      if (!res.ok) continue;
      const text = await res.text();
      /* allorigins.win wraps response i {contents:"..."} */
      if (proxyUrl.includes('allorigins')) {
        const wrap = JSON.parse(text);
        return JSON.parse(wrap.contents);
      }
      return JSON.parse(text);
    } catch (_) { /* prøv neste proxy */ }
  }
  throw new Error('Alle CORS-proxyer feilet');
}

/* ─── HENT LIVE-KURSER (batch) ──────────────────────────────────── */
async function fetchLiveQuotes(tickers) {
  const yfSymbols = tickers
    .filter(t => !NO_YF.has(t))
    .map(t => YF_MAP[t] || t);

  if (yfSymbols.length === 0) return {};

  /* Legg til valutakurser */
  const symbols = [...new Set([...yfSymbols, 'USDNOK=X', 'EURNOK=X'])];
  const url = `https://query1.finance.yahoo.com/v7/finance/quote`
    + `?symbols=${symbols.join(',')}`
    + `&fields=regularMarketPrice,regularMarketChangePercent,shortName,currency`;

  const data = await proxyFetch(url);
  const results = data?.quoteResponse?.result || [];

  /* Oppdater valutakurser */
  const fxUsd = results.find(r => r.symbol === 'USDNOK=X');
  const fxEur = results.find(r => r.symbol === 'EURNOK=X');
  if (fxUsd?.regularMarketPrice) usdNok = fxUsd.regularMarketPrice;
  if (fxEur?.regularMarketPrice) eurNok = fxEur.regularMarketPrice;

  /* Reverser mapping: YF-symbol → vår ticker */
  const rev = {};
  tickers.forEach(t => { rev[YF_MAP[t] || t] = t; });

  const out = {};
  results.forEach(r => {
    const ourTicker = rev[r.symbol];
    if (!ourTicker) return;

    let price = r.regularMarketPrice ?? 0;
    const cur = r.currency || 'NOK';

    /* Konverter til NOK */
    if (cur === 'USD')     price *= usdNok;
    else if (cur === 'EUR') price *= eurNok;
    else if (cur === 'GBp') price = (price / 100) * eurNok * 0.87; // pence → £ → NOK

    out[ourTicker] = {
      price:  +price.toFixed(2),
      change: +(r.regularMarketChangePercent ?? 0).toFixed(2),
    };
  });

  return out;
}

/* ─── HENT HISTORISK DATA (ett instrument) ──────────────────────── */
async function fetchHistory(ticker, period) {
  if (NO_YF.has(ticker)) return null;

  const yfSymbol = YF_MAP[ticker] || ticker;
  const rangeMap = { '1W': '5d', '1M': '1mo', '3M': '3mo', '6M': '6mo', '1Y': '1y', 'ALL': '5y' };
  const range    = rangeMap[period] || '1mo';
  const interval = ['1W', '1M'].includes(period) ? '1d' : '1wk';

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yfSymbol}`
    + `?interval=${interval}&range=${range}`;

  const data   = await proxyFetch(url);
  const result = data?.chart?.result?.[0];
  if (!result) return null;

  const timestamps = result.timestamp || [];
  const closes     = result.indicators?.quote?.[0]?.close || [];
  const currency   = result.meta?.currency || 'NOK';

  return timestamps.map((ts, i) => {
    let price = closes[i];
    if (price == null) return null;
    if (currency === 'USD')     price *= usdNok;
    else if (currency === 'EUR') price *= eurNok;
    else if (currency === 'GBp') price = (price / 100) * eurNok * 0.87;
    return { date: new Date(ts * 1000).toISOString().slice(0, 10), price: +price.toFixed(2) };
  }).filter(Boolean);
}

/* ─── SKALÉR SIMULERT HISTORIKK TIL REAL PRIS ──────────────────── */
function scaleHistory(history, realPrice) {
  if (!history?.length || !realPrice) return history;
  const last = history[history.length - 1].price;
  if (!last) return history;
  const factor = realPrice / last;
  return history.map(p => ({ ...p, price: +(p.price * factor).toFixed(2) }));
}

/* ─── OPPDATER livePrices FRA API ───────────────────────────────── */
async function refreshPrices(tickers) {
  setApiStatus('loading');
  try {
    const quotes = await fetchLiveQuotes(tickers);
    if (Object.keys(quotes).length === 0) throw new Error('Ingen data returnert');

    Object.entries(quotes).forEach(([ticker, { price, change }]) => {
      const lp = livePrices[ticker];
      if (!lp) return;
      /* Skalér simulert historikk til den reelle kursen */
      lp.history = scaleHistory(lp.history, price);
      lp.price   = price;
      lp.change  = change;
    });

    setApiStatus('live');
    return true;
  } catch (err) {
    console.warn('Yahoo Finance-henting feilet, bruker simulerte priser:', err.message);
    setApiStatus('simulated');
    return false;
  }
}

/* ─── HENT HISTORIKK FOR CHART OG LAGRE I livePrices ────────────── */
async function refreshHistory(ticker, period) {
  if (NO_YF.has(ticker)) return;
  try {
    const hist = await fetchHistory(ticker, period);
    if (hist?.length) {
      const lp = livePrices[ticker];
      if (lp) lp.history = hist;
    }
  } catch (_) { /* silent fallback */ }
}
