// ---------------------------------------------------------------------------
// Stock Universe – default list of ~50 S&P 500 constituents
// ---------------------------------------------------------------------------

export interface StockInfo {
  symbol: string;
  name: string;
  sector: string;
}

export const SECTORS = [
  'Technology',
  'Healthcare',
  'Financials',
  'Consumer Discretionary',
  'Communication Services',
  'Industrials',
  'Consumer Staples',
  'Energy',
  'Utilities',
  'Real Estate',
  'Materials',
] as const;

export type SectorName = (typeof SECTORS)[number];

export const BENCHMARK_SYMBOL = 'SPY';

/**
 * ~50 hand-picked large-cap S&P 500 stocks with correct GICS sectors.
 */
export const DEFAULT_STOCKS: StockInfo[] = [
  // ── Technology ──────────────────────────────────────────────────────────
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
  { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'Technology' },
  { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Technology' },
  { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Technology' },
  { symbol: 'ACN', name: 'Accenture plc', sector: 'Technology' },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', sector: 'Technology' },
  { symbol: 'INTC', name: 'Intel Corporation', sector: 'Technology' },
  { symbol: 'QCOM', name: 'QUALCOMM Inc.', sector: 'Technology' },
  { symbol: 'TXN', name: 'Texas Instruments Inc.', sector: 'Technology' },

  // ── Healthcare ──────────────────────────────────────────────────────────
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', sector: 'Healthcare' },
  { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare' },
  { symbol: 'MRK', name: 'Merck & Co. Inc.', sector: 'Healthcare' },
  { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare' },
  { symbol: 'LLY', name: 'Eli Lilly and Company', sector: 'Healthcare' },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific Inc.', sector: 'Healthcare' },

  // ── Financials ──────────────────────────────────────────────────────────
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials' },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Financials' },
  { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Financials' },
  { symbol: 'BAC', name: 'Bank of America Corporation', sector: 'Financials' },
  { symbol: 'GS', name: 'The Goldman Sachs Group Inc.', sector: 'Financials' },
  { symbol: 'BLK', name: 'BlackRock Inc.', sector: 'Financials' },

  // ── Consumer Discretionary ──────────────────────────────────────────────
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary' },
  { symbol: 'HD', name: 'The Home Depot Inc.', sector: 'Consumer Discretionary' },
  { symbol: 'NKE', name: 'NIKE Inc.', sector: 'Consumer Discretionary' },
  { symbol: 'MCD', name: "McDonald's Corporation", sector: 'Consumer Discretionary' },
  { symbol: 'SBUX', name: 'Starbucks Corporation', sector: 'Consumer Discretionary' },

  // ── Communication Services ─────────────────────────────────────────────
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Communication Services' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Communication Services' },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication Services' },
  { symbol: 'DIS', name: 'The Walt Disney Company', sector: 'Communication Services' },
  { symbol: 'CMCSA', name: 'Comcast Corporation', sector: 'Communication Services' },

  // ── Industrials ─────────────────────────────────────────────────────────
  { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrials' },
  { symbol: 'BA', name: 'The Boeing Company', sector: 'Industrials' },
  { symbol: 'GE', name: 'GE Aerospace', sector: 'Industrials' },
  { symbol: 'UPS', name: 'United Parcel Service Inc.', sector: 'Industrials' },
  { symbol: 'HON', name: 'Honeywell International Inc.', sector: 'Industrials' },

  // ── Consumer Staples ────────────────────────────────────────────────────
  { symbol: 'PG', name: 'The Procter & Gamble Company', sector: 'Consumer Staples' },
  { symbol: 'KO', name: 'The Coca-Cola Company', sector: 'Consumer Staples' },
  { symbol: 'PEP', name: 'PepsiCo Inc.', sector: 'Consumer Staples' },
  { symbol: 'COST', name: 'Costco Wholesale Corporation', sector: 'Consumer Staples' },
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Staples' },

  // ── Energy ──────────────────────────────────────────────────────────────
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', sector: 'Energy' },
  { symbol: 'CVX', name: 'Chevron Corporation', sector: 'Energy' },
  { symbol: 'COP', name: 'ConocoPhillips', sector: 'Energy' },

  // ── Utilities ───────────────────────────────────────────────────────────
  { symbol: 'NEE', name: 'NextEra Energy Inc.', sector: 'Utilities' },
  { symbol: 'DUK', name: 'Duke Energy Corporation', sector: 'Utilities' },

  // ── Real Estate ─────────────────────────────────────────────────────────
  { symbol: 'AMT', name: 'American Tower Corporation', sector: 'Real Estate' },
  { symbol: 'PLD', name: 'Prologis Inc.', sector: 'Real Estate' },

  // ── Materials ───────────────────────────────────────────────────────────
  { symbol: 'SHW', name: 'The Sherwin-Williams Company', sector: 'Materials' },
  { symbol: 'APD', name: 'Air Products and Chemicals Inc.', sector: 'Materials' },
  // ── Additional US ───────────────────────────────────────────────────────
  { symbol: 'PLTR', name: 'Palantir Technologies Inc.', sector: 'Technology' },
  { symbol: 'SNOW', name: 'Snowflake Inc.', sector: 'Technology' },
  { symbol: 'CRWD', name: 'CrowdStrike Holdings Inc.', sector: 'Technology' },
  { symbol: 'UBER', name: 'Uber Technologies Inc.', sector: 'Industrials' },
  { symbol: 'ABNB', name: 'Airbnb Inc.', sector: 'Consumer Discretionary' },
  { symbol: 'ORCL', name: 'Oracle Corporation', sector: 'Technology' },
  { symbol: 'IBM', name: 'International Business Machines', sector: 'Technology' },
  { symbol: 'CSCO', name: 'Cisco Systems Inc.', sector: 'Technology' },
  { symbol: 'AMGN', name: 'Amgen Inc.', sector: 'Healthcare' },
  { symbol: 'GILD', name: 'Gilead Sciences Inc.', sector: 'Healthcare' },
  { symbol: 'WFC', name: 'Wells Fargo & Company', sector: 'Financials' },
  { symbol: 'MS', name: 'Morgan Stanley', sector: 'Financials' },
  { symbol: 'BKNG', name: 'Booking Holdings Inc.', sector: 'Consumer Discretionary' },
  { symbol: 'F', name: 'Ford Motor Company', sector: 'Consumer Discretionary' },
  { symbol: 'GM', name: 'General Motors Company', sector: 'Consumer Discretionary' },
  { symbol: 'TMUS', name: 'T-Mobile US Inc.', sector: 'Communication Services' },
  { symbol: 'VZ', name: 'Verizon Communications Inc.', sector: 'Communication Services' },
  { symbol: 'T', name: 'AT&T Inc.', sector: 'Communication Services' },
  { symbol: 'LMT', name: 'Lockheed Martin Corporation', sector: 'Industrials' },
  { symbol: 'RTX', name: 'RTX Corporation', sector: 'Industrials' },
  { symbol: 'PM', name: 'Philip Morris International', sector: 'Consumer Staples' },
  { symbol: 'MO', name: 'Altria Group Inc.', sector: 'Consumer Staples' },
  { symbol: 'EOG', name: 'EOG Resources Inc.', sector: 'Energy' },
  { symbol: 'SLB', name: 'Schlumberger N.V.', sector: 'Energy' },
  { symbol: 'SO', name: 'The Southern Company', sector: 'Utilities' },
  { symbol: 'D', name: 'Dominion Energy Inc.', sector: 'Utilities' },
  { symbol: 'SPG', name: 'Simon Property Group', sector: 'Real Estate' },
  { symbol: 'O', name: 'Realty Income Corporation', sector: 'Real Estate' },
  { symbol: 'LIN', name: 'Linde plc', sector: 'Materials' },
  { symbol: 'NEM', name: 'Newmont Corporation', sector: 'Materials' },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.', sector: 'Financials' },
  { symbol: 'SQ', name: 'Block Inc.', sector: 'Technology' },
  { symbol: 'COIN', name: 'Coinbase Global Inc.', sector: 'Financials' },
  { symbol: 'NOW', name: 'ServiceNow Inc.', sector: 'Technology' },
  { symbol: 'INTU', name: 'Intuit Inc.', sector: 'Technology' },
  { symbol: 'WDAY', name: 'Workday Inc.', sector: 'Technology' },
  { symbol: 'TEAM', name: 'Atlassian Corp', sector: 'Technology' },
  { symbol: 'DDOG', name: 'Datadog Inc.', sector: 'Technology' },
  { symbol: 'NET', name: 'Cloudflare Inc.', sector: 'Technology' },
  { symbol: 'PANW', name: 'Palo Alto Networks Inc.', sector: 'Technology' },
  { symbol: 'MSTR', name: 'MicroStrategy Inc.', sector: 'Technology' },

  // ── Canadian ────────────────────────────────────────────────────────────
  { symbol: 'SHOP', name: 'Shopify Inc.', sector: 'Technology' },
  { symbol: 'RY', name: 'Royal Bank of Canada', sector: 'Financials' },
  { symbol: 'TD', name: 'Toronto-Dominion Bank', sector: 'Financials' },
  { symbol: 'ENB', name: 'Enbridge Inc.', sector: 'Energy' },
  { symbol: 'CNR', name: 'Canadian National Railway', sector: 'Industrials' },
  { symbol: 'CNQ', name: 'Canadian Natural Resources', sector: 'Energy' },
  { symbol: 'CP', name: 'Canadian Pacific Kansas City', sector: 'Industrials' },

  // ── European ────────────────────────────────────────────────────────────
  { symbol: 'ASML', name: 'ASML Holding N.V.', sector: 'Technology' },
  { symbol: 'NVO', name: 'Novo Nordisk A/S', sector: 'Healthcare' },
  { symbol: 'SAP', name: 'SAP SE', sector: 'Technology' },
  { symbol: 'SHEL', name: 'Shell plc', sector: 'Energy' },
  { symbol: 'UL', name: 'Unilever PLC', sector: 'Consumer Staples' },
  { symbol: 'AZN', name: 'AstraZeneca PLC', sector: 'Healthcare' },
  { symbol: 'NVS', name: 'Novartis AG', sector: 'Healthcare' },
  { symbol: 'TTE', name: 'TotalEnergies SE', sector: 'Energy' },
  { symbol: 'LVMUY', name: 'LVMH Moët Hennessy', sector: 'Consumer Discretionary' },
  { symbol: 'ORAN', name: 'Orange S.A.', sector: 'Communication Services' },
  { symbol: 'SNY', name: 'Sanofi', sector: 'Healthcare' },
  { symbol: 'UBS', name: 'UBS Group AG', sector: 'Financials' },
  { symbol: 'HSBC', name: 'HSBC Holdings plc', sector: 'Financials' },
  { symbol: 'RIO', name: 'Rio Tinto Group', sector: 'Materials' },
  { symbol: 'BP', name: 'BP p.l.c.', sector: 'Energy' },
  { symbol: 'GSK', name: 'GSK plc', sector: 'Healthcare' },
  { symbol: 'VOD', name: 'Vodafone Group Public', sector: 'Communication Services' },
  { symbol: 'DEO', name: 'Diageo plc', sector: 'Consumer Staples' },
  { symbol: 'BUD', name: 'Anheuser-Busch InBev', sector: 'Consumer Staples' },
  { symbol: 'SIEGY', name: 'Siemens AG', sector: 'Industrials' },
  { symbol: 'VWAGY', name: 'Volkswagen AG', sector: 'Consumer Discretionary' },
  { symbol: 'NSRGY', name: 'Nestlé S.A.', sector: 'Consumer Staples' },
  { symbol: 'RHHBY', name: 'Roche Holding AG', sector: 'Healthcare' },
  { symbol: 'ADDYY', name: 'adidas AG', sector: 'Consumer Discretionary' },
  { symbol: 'HESAY', name: 'Hermès International', sector: 'Consumer Discretionary' },
  { symbol: 'LRLCY', name: "L'Oréal S.A.", sector: 'Consumer Staples' },
  { symbol: 'STLA', name: 'Stellantis N.V.', sector: 'Consumer Discretionary' },
  { symbol: 'RACE', name: 'Ferrari N.V.', sector: 'Consumer Discretionary' },
  { symbol: 'SPOT', name: 'Spotify Technology S.A.', sector: 'Communication Services' },
  { symbol: 'NOK', name: 'Nokia Oyj', sector: 'Technology' },
  { symbol: 'ERIC', name: 'Telefonaktiebolaget LM Ericsson', sector: 'Technology' },
];

/** Quick symbol → StockInfo lookup */
export const STOCK_MAP = new Map<string, StockInfo>(
  DEFAULT_STOCKS.map((s) => [s.symbol, s]),
);

/** Return all stocks belonging to a given sector. */
export function getStocksBySector(sector: SectorName): StockInfo[] {
  return DEFAULT_STOCKS.filter((s) => s.sector === sector);
}

/** All unique symbols in the default universe. */
export const DEFAULT_SYMBOLS: string[] = DEFAULT_STOCKS.map((s) => s.symbol);
