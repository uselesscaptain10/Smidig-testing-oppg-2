/**
 * charts.js – Chart.js wrappers for portfolio visualisations
 */

'use strict';

let performanceChartInst = null;
let allocationChartInst  = null;
let sectorChartInst      = null;
let typeChartInst        = null;
let gainChartInst        = null;
let riskChartInst        = null;
let compsChartInst       = null;

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e2538',
      borderColor: '#2a3347',
      borderWidth: 1,
      titleColor: '#94a3b8',
      bodyColor: '#e2e8f0',
      padding: 10,
    }
  }
};

/* ─── PERFORMANCE (line) ─────────────────────────────────────────── */
function renderPerformanceChart(holdings, period = '1M') {
  const ctx = document.getElementById('performanceChart');
  if (!ctx) return;

  // Build combined portfolio value time series
  const allDates = new Set();
  const holdingHistories = holdings.map(h => {
    const hist = getHistoricalPrices(h.ticker, period);
    hist.forEach(p => allDates.add(p.date));
    return { h, hist };
  });

  const sortedDates = [...allDates].sort();

  // For each date, sum up value of all holdings at that price
  const portfolioSeries = sortedDates.map(date => {
    let total = 0;
    holdingHistories.forEach(({ h, hist }) => {
      const point = hist.find(p => p.date === date);
      const price = point ? point.price : (hist.at(-1)?.price || h.avgPrice);
      total += price * h.shares;
    });
    return { x: date, y: +total.toFixed(2) };
  });

  // Compute benchmark (flat cost line)
  const totalCost = holdings.reduce((s, h) => s + h.avgPrice * h.shares, 0);

  if (performanceChartInst) performanceChartInst.destroy();

  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 280);
  gradient.addColorStop(0, 'rgba(59,130,246,0.35)');
  gradient.addColorStop(1, 'rgba(59,130,246,0.00)');

  performanceChartInst = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Porteføljeverdi',
          data: portfolioSeries,
          borderColor: '#3b82f6',
          backgroundColor: gradient,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#3b82f6',
          fill: true,
          tension: 0.3,
        },
        {
          label: 'Kostpris',
          data: sortedDates.map(d => ({ x: d, y: totalCost })),
          borderColor: '#2a3347',
          borderWidth: 1.5,
          borderDash: [6, 3],
          pointRadius: 0,
          fill: false,
        }
      ]
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        x: {
          type: 'time',
          time: { unit: period === '1W' ? 'day' : period === '1M' ? 'day' : period === '3M' ? 'week' : 'month', tooltipFormat: 'dd. MMM yyyy' },
          grid: { color: '#2a3347' },
          ticks: { color: '#64748b', maxTicksLimit: 7 },
        },
        y: {
          grid: { color: '#2a3347' },
          ticks: { color: '#64748b', callback: v => fmtNOK(v) },
        }
      },
      plugins: {
        ...CHART_DEFAULTS.plugins,
        tooltip: {
          ...CHART_DEFAULTS.plugins.tooltip,
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${fmtNOK(ctx.parsed.y)}`
          }
        }
      },
      interaction: { mode: 'index', intersect: false }
    }
  });
}

/* ─── ALLOCATION (doughnut) ──────────────────────────────────────── */
function renderAllocationChart(holdings) {
  const ctx = document.getElementById('allocationChart');
  const legendEl = document.getElementById('allocationLegend');
  if (!ctx) return;

  if (holdings.length === 0) {
    if (allocationChartInst) { allocationChartInst.destroy(); allocationChartInst = null; }
    if (legendEl) legendEl.innerHTML = '';
    return;
  }

  const totalValue = holdings.reduce((s, h) => s + h.value, 0);
  const labels  = holdings.map(h => h.name);
  const values  = holdings.map(h => h.value);
  const colors  = holdings.map((_, i) => getColor(i));

  if (allocationChartInst) allocationChartInst.destroy();

  allocationChartInst = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors, borderColor: '#0f1117', borderWidth: 2, hoverBorderWidth: 0 }]
    },
    options: {
      ...CHART_DEFAULTS,
      cutout: '65%',
      plugins: {
        ...CHART_DEFAULTS.plugins,
        legend: { display: false },
        tooltip: {
          ...CHART_DEFAULTS.plugins.tooltip,
          callbacks: {
            label: ctx => `${fmtNOK(ctx.parsed)} (${fmtPct((ctx.parsed / totalValue) * 100)})`
          }
        }
      }
    }
  });

  // Build legend
  if (legendEl) {
    legendEl.innerHTML = holdings.map((h, i) => `
      <div class="legend-item">
        <span class="legend-dot" style="background:${getColor(i)}"></span>
        <span class="legend-name">${h.name}</span>
        <span class="legend-pct">${fmtPct((h.value / totalValue) * 100)}</span>
      </div>
    `).join('');
  }
}

/* ─── SECTOR DISTRIBUTION (polar area) ──────────────────────────── */
function renderSectorChart(holdings) {
  const ctx = document.getElementById('sectorChart');
  if (!ctx) return;

  const sectorMap = {};
  holdings.forEach(h => {
    sectorMap[h.sector] = (sectorMap[h.sector] || 0) + h.value;
  });

  const labels = Object.keys(sectorMap);
  const values = Object.values(sectorMap);
  const colors = labels.map((_, i) => getColor(i));

  if (sectorChartInst) sectorChartInst.destroy();

  sectorChartInst = new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors.map(c => c + 'cc'), borderColor: colors, borderWidth: 1.5 }]
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: {
        ...CHART_DEFAULTS.plugins,
        legend: {
          display: true,
          position: 'right',
          labels: { color: '#94a3b8', boxWidth: 10, font: { size: 11 } }
        },
        tooltip: {
          ...CHART_DEFAULTS.plugins.tooltip,
          callbacks: { label: ctx => `${ctx.label}: ${fmtNOK(ctx.parsed.r)}` }
        }
      },
      scales: {
        r: {
          ticks: { display: false },
          grid: { color: '#2a3347' },
          pointLabels: { display: false }
        }
      }
    }
  });
}

/* ─── TYPE DISTRIBUTION (doughnut) ──────────────────────────────── */
function renderTypeChart(holdings) {
  const ctx = document.getElementById('typeChart');
  if (!ctx) return;

  const typeMap = {};
  holdings.forEach(h => {
    typeMap[h.type] = (typeMap[h.type] || 0) + h.value;
  });

  const labels = Object.keys(typeMap);
  const values = Object.values(typeMap);
  const typeColors = { 'Aksje': '#3b82f6', 'Fond': '#8b5cf6', 'ETF': '#06b6d4', 'Krypto': '#f59e0b' };
  const colors = labels.map(l => typeColors[l] || '#64748b');

  if (typeChartInst) typeChartInst.destroy();

  typeChartInst = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors, borderColor: '#0f1117', borderWidth: 2 }]
    },
    options: {
      ...CHART_DEFAULTS,
      cutout: '60%',
      plugins: {
        ...CHART_DEFAULTS.plugins,
        legend: {
          display: true,
          position: 'bottom',
          labels: { color: '#94a3b8', boxWidth: 10, font: { size: 12 } }
        },
        tooltip: {
          ...CHART_DEFAULTS.plugins.tooltip,
          callbacks: { label: ctx => `${ctx.label}: ${fmtNOK(ctx.parsed)}` }
        }
      }
    }
  });
}

/* ─── GAIN/LOSS BAR ──────────────────────────────────────────────── */
function renderGainChart(holdings) {
  const ctx = document.getElementById('gainChart');
  if (!ctx) return;

  const sorted = [...holdings].sort((a, b) => b.gain - a.gain);
  const labels = sorted.map(h => h.ticker);
  const values = sorted.map(h => +h.gain.toFixed(2));
  const colors = values.map(v => v >= 0 ? 'rgba(34,197,94,.75)' : 'rgba(239,68,68,.75)');

  if (gainChartInst) gainChartInst.destroy();

  gainChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Gevinst / tap (NOK)',
        data: values,
        backgroundColor: colors,
        borderRadius: 4,
      }]
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        x: { grid: { color: '#2a3347' }, ticks: { color: '#64748b' } },
        y: {
          grid: { color: '#2a3347' },
          ticks: { color: '#64748b', callback: v => fmtNOK(v) }
        }
      },
      plugins: {
        ...CHART_DEFAULTS.plugins,
        tooltip: {
          ...CHART_DEFAULTS.plugins.tooltip,
          callbacks: { label: ctx => `${ctx.dataset.label}: ${fmtNOK(ctx.parsed.y)}` }
        }
      }
    }
  });
}

/* ─── COMPS BAR CHART ────────────────────────────────────────────── */
function renderCompsBarChart(metric = 'pe') {
  const ctx = document.getElementById('compsChart');
  if (!ctx) return;

  const sector = document.getElementById('compsSector')?.value || '';
  const data   = sector ? COMP_DATA.filter(c => c.sector === sector) : COMP_DATA;

  const metricLabels = {
    pe: 'P/E', ps: 'P/S', evEbitda: 'EV/EBITDA',
    revGrowth: 'Omsetningsvekst %', netMargin: 'Nettomarg. %', roe: 'ROE %'
  };

  const positiveMetrics = ['revGrowth', 'netMargin', 'roe'];
  const labels = data.map(c => c.ticker);
  const values = data.map(c => c[metric]);
  const colors = values.map(v => {
    if (positiveMetrics.includes(metric))
      return v >= 0 ? 'rgba(34,197,94,.75)' : 'rgba(239,68,68,.75)';
    return 'rgba(59,130,246,.75)';
  });

  const titleEl = document.getElementById('compsChartTitle');
  if (titleEl) titleEl.textContent = `${metricLabels[metric] || metric} – Sammenligning`;

  if (compsChartInst) compsChartInst.destroy();

  compsChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: metricLabels[metric] || metric,
        data: values,
        backgroundColor: colors,
        borderRadius: 4,
      }]
    },
    options: {
      ...CHART_DEFAULTS,
      indexAxis: 'y',
      scales: {
        x: { grid: { color: '#2a3347' }, ticks: { color: '#64748b' } },
        y: { grid: { color: '#2a3347' }, ticks: { color: '#94a3b8' } }
      },
      plugins: {
        ...CHART_DEFAULTS.plugins,
        legend: { display: false },
      }
    }
  });
}

/* ─── RISK RADAR ─────────────────────────────────────────────────── */
function renderRiskChart(holdings) {
  const ctx = document.getElementById('riskChart');
  if (!ctx) return;

  // Compute naive risk metrics from holdings
  const typeRiskMap = { 'Aksje': 0.7, 'ETF': 0.5, 'Fond': 0.4, 'Krypto': 0.95 };
  const totalValue = holdings.reduce((s, h) => s + h.value, 0) || 1;

  const concentration = Math.min(1, Math.max(...holdings.map(h => h.value / totalValue)) * 1.5);
  const volatility    = holdings.reduce((s, h) => s + (typeRiskMap[h.type] || 0.5) * (h.value / totalValue), 0);
  const diversification = Math.min(1, (new Set(holdings.map(h => h.sector)).size) / 8);
  const liquidity     = holdings.reduce((s, h) => s + (h.type === 'Fond' ? 0.5 : 0.9) * (h.value / totalValue), 0);
  const cryptoExp     = holdings.filter(h => h.type === 'Krypto').reduce((s, h) => s + h.value / totalValue, 0);

  if (riskChartInst) riskChartInst.destroy();

  riskChartInst = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Konsentrasjon', 'Volatilitet', 'Diversifisering', 'Likviditet', 'Kryptoeksponering'],
      datasets: [{
        label: 'Risikoprofil',
        data: [concentration, volatility, diversification, liquidity, cryptoExp].map(v => +(v * 100).toFixed(1)),
        backgroundColor: 'rgba(59,130,246,.2)',
        borderColor: '#3b82f6',
        pointBackgroundColor: '#3b82f6',
        borderWidth: 2,
      }]
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        r: {
          min: 0, max: 100,
          grid: { color: '#2a3347' },
          angleLines: { color: '#2a3347' },
          pointLabels: { color: '#94a3b8', font: { size: 11 } },
          ticks: { display: false }
        }
      },
      plugins: {
        ...CHART_DEFAULTS.plugins,
        legend: { display: false },
      }
    }
  });
}
