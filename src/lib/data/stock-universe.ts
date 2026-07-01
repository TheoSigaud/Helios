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
