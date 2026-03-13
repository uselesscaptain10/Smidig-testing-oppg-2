# PortfolioTracker – Fond & Aksjer

En komplett, norskspråklig nettside for å analysere og følge aksje- og fondporteføljer. Kjøres direkte i nettleseren – ingen installasjon eller backend nødvendig.

## Funksjoner

### Oversikt
- **KPI-kort** – total porteføljeverdi, gevinst/tap, daglig endring, antall beholdninger
- **Porteføljeutvikling** – interaktivt linjediagram med periodevelger (1U / 1M / 3M / 6M / 1Å / Alt)
- **Allokeringskart** – kakediagram med forklaring
- **Beholdningstabell** – sortert etter verdi med direkteklikkbare rader

### Portefølje
- Kortvisning for alle beholdninger med filtrering og sortering
- Rediger eller slett enkeltposisjoner
- Se gevinst/tap per posisjon

### Analyse
- Sektordistribusjon (polar area-chart)
- Type-fordeling: Aksje / ETF / Fond / Krypto
- Gevinst/tap per beholdning (stolpediagram)
- Risikoprofil-radar (konsentrasjon, volatilitet, diversifisering, likviditet, kryptoeksponering)
- Statistikkort (vinnere/tapere, beste/svakeste posisjon)

### Transaksjoner
- Logg over alle kjøp, salg og utbytter
- Filtrering etter type og søketekst

### Overvåkningsliste
- Legg til instrumenter for å følge kurs uten å eie dem
- Søk blant alle tilgjengelige aksjer, fond, ETF-er og krypto

### Generelt
- **42 forhåndsdefinerte instrumenter**: norske aksjer (EQNR, DNB, TEL, NHY, SALM…), globale aksjer (AAPL, MSFT, NVDA, TSLA…), ETF-er (EUNL, SPY, QQQ, XACT…), norske fond (DNB Global, KLP, Storebrand) og krypto (BTC, ETH, SOL)
- **Demo-portefølje** lastes automatisk ved første besøk
- **Simulert live-kurs** – prisene tikker hvert 5. sekund under sesjonen
- **Historiske prisdata** generert via geometrisk Brownsk bevegelse
- **Norsk formatering** – valuta i NOK, datoer på norsk bokmål
- **Eksport til CSV**
- **Mørkt tema** med responsivt layout for mobil og desktop
- **Persistent data** via `localStorage` – porteføljen huskes mellom besøk

## Kom i gang

Åpne `index.html` direkte i nettleseren – ingen bygg-steg nødvendig.

```
git clone <repo-url>
open index.html
```

## Struktur

```
├── index.html          # Hoved-HTML med alle sider (SPA)
├── css/
│   └── style.css       # Mørkt tema, responsivt design
└── js/
    ├── data.js         # Instrumentdatabase, prissimuling, localStorage-lagring
    ├── charts.js       # Chart.js-diagram-wrappere
    └── app.js          # Applikasjonslogikk og hendelseshåndtering
```

## Teknologier

- Vanilla JavaScript (ES2022, ingen rammeverk)
- [Chart.js 4](https://www.chartjs.org/) + Luxon (tidsakser)
- CSS Custom Properties, Grid, Flexbox
- Web Storage API (`localStorage`)
