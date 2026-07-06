// ---------------------------------------------------------------------------
// Provider Manager
// Orchestrates data fetching across API providers with fallback.
//
// Provider priority:
//   1. Yahoo Finance (primary) — no API key, no strict rate limit
//   2. Twelve Data (fallback)  — 800 req/day free tier
//
// Alpha Vantage (25 req/day) and MarketStack (100 req/month) were removed
// as they are too limited for batch operations on 1500+ stocks.
// ---------------------------------------------------------------------------

import type { OHLCVData } from '@/lib/analysis/types';
import {
  fetchTimeSeries as fetchYahoo,
  fetchBatchTimeSeries as fetchBatchYahoo,
} from '@/lib/api/yahoo-finance';
import {
  fetchTimeSeries as fetchTwelveData,
} from '@/lib/api/twelve-data';

export type ProviderName = 'YahooFinance' | 'TwelveData';

// A standardized interface for a provider
interface DataProvider {
  name: ProviderName;
  fetch: (symbol: string, days: number) => Promise<OHLCVData[]>;
}

// Priority order: Yahoo Finance first, Twelve Data as fallback
const PROVIDERS: DataProvider[] = [
  {
    name: 'YahooFinance',
    fetch: (sym, days) => fetchYahoo(sym, '1wk', undefined, days),
  },
  {
    name: 'TwelveData',
    fetch: (sym, days) => fetchTwelveData(sym, '1week', days),
  },
];

/**
 * Fetch OHLCV time-series for a single symbol using the first available provider.
 * Automatically falls back to the next provider on error.
 *
 * @param symbol  Ticker symbol (e.g. "AAPL")
 * @param days    Number of calendar days of history to retrieve
 * @returns       Chronological array of OHLCV data
 */
export async function fetchTimeSeriesWithFallback(
  symbol: string,
  days: number = 1825,
): Promise<OHLCVData[]> {
  const errors: Error[] = [];

  for (const provider of PROVIDERS) {
    try {
      console.log(`[ProviderManager] Fetching ${symbol} via ${provider.name}...`);
      const data = await provider.fetch(symbol, days);
      console.log(`[ProviderManager] ✓ ${symbol} via ${provider.name} (${data.length} bars)`);
      return data;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.warn(`[ProviderManager] ${provider.name} failed for ${symbol}:`, errMsg);
      errors.push(error instanceof Error ? error : new Error(errMsg));
    }
  }

  throw new Error(
    `All data providers failed for ${symbol}. Errors:\n` +
      errors.map((e, i) => `[${PROVIDERS[i].name}]: ${e.message}`).join('\n')
  );
}

/**
 * Fetch OHLCV time-series for multiple symbols with aggressive parallelization.
 *
 * Uses Yahoo Finance's batch fetcher (15 concurrent requests) as the primary
 * method. Falls back to Twelve Data for any symbols that Yahoo Finance fails on.
 *
 * @param symbols     Array of ticker symbols
 * @param days        Number of calendar days of history
 * @param startDates  Optional map of symbol → start date for incremental sync
 * @param onProgress  Optional callback for progress reporting
 * @returns           Map of symbol → OHLCVData[]
 */
export async function fetchBatchTimeSeriesWithFallback(
  symbols: string[],
  days: number = 1825,
  startDates?: Map<string, string>,
  onProgress?: (completed: number, total: number, symbol: string, success: boolean) => void,
): Promise<Record<string, OHLCVData[]>> {
  const results: Record<string, OHLCVData[]> = {};

  if (symbols.length === 0) return results;

  // ── Phase 1: Yahoo Finance batch (primary, aggressive parallelization) ──
  try {
    console.log(`[ProviderManager] Phase 1: Yahoo Finance batch for ${symbols.length} symbols...`);
    const yahooResults = await fetchBatchYahoo(
      symbols,
      '1wk',
      startDates,
      days,
      onProgress,
    );

    for (const [sym, data] of Object.entries(yahooResults)) {
      results[sym] = data;
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[ProviderManager] Yahoo Finance batch failed:`, errMsg);
  }

  // ── Phase 2: Twelve Data fallback for missing symbols ──
  const failedSymbols = symbols.filter((sym) => !results[sym]);

  if (failedSymbols.length > 0) {
    console.log(
      `[ProviderManager] Phase 2: Twelve Data fallback for ${failedSymbols.length} symbols...`,
    );

    for (const sym of failedSymbols) {
      try {
        const data = await fetchTwelveData(sym, '1week', days);
        if (data && data.length > 0) {
          results[sym] = data;
        }
      } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : String(e);
        console.error(`[ProviderManager] Complete failure for ${sym}:`, errMsg);
      }
    }
  }

  console.log(
    `[ProviderManager] Batch complete: ${Object.keys(results).length}/${symbols.length} symbols fetched`,
  );

  return results;
}
