import type { OHLCVData } from '@/lib/analysis/types';
import { BENCHMARK_SYMBOL, DEFAULT_SYMBOLS } from '@/lib/data/stock-universe';
import { getDiskCache, setDiskCache } from '@/lib/data/cache';

export class NoDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoDataError';
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch OHLCV data for a single stock from the local disk cache.
 * If the cache is missing, lazily loads it using the multi-provider fallback.
 */
export async function getStockData(
  symbol: string,
  days: number = 500,
): Promise<OHLCVData[]> {
  const cached = await getDiskCache(symbol, days);
  if (cached) {
    return cached;
  }

  // Auto-sync is disabled. The user must manually trigger a sync.
  throw new NoDataError(`No data available for ${symbol}. Please synchronize the data manually.`);
}

/**
 * Fetch OHLCV data for the benchmark (SPY by default).
 * Lazily loads if missing from cache.
 */
export async function getBenchmarkData(
  days: number = 500,
): Promise<OHLCVData[]> {
  const cached = await getDiskCache(BENCHMARK_SYMBOL, days);
  if (cached) {
    return cached;
  }

  // Auto-sync is disabled. The user must manually trigger a sync.
  throw new NoDataError(`No benchmark data available for ${BENCHMARK_SYMBOL}. Please synchronize the data manually.`);
}

/**
 * Fetch OHLCV data for multiple stocks at once.
 * Lazily loads any missing stocks.
 *
 * @param symbols  Array of ticker symbols. Defaults to the full universe.
 * @param days     Number of trading days of history.
 * @returns        Map of symbol → OHLCVData[]
 */
export async function getAllStocksData(
  symbols: string[] = DEFAULT_SYMBOLS,
  days: number = 500,
): Promise<Record<string, OHLCVData[]>> {
  const result: Record<string, OHLCVData[]> = {};
  
  // To avoid hitting API rate limits too hard if many are missing,
  // we fetch missing stocks sequentially. In a real world app,
  // we might want a background worker, but this is safe for our fallback system.
  for (const sym of symbols) {
    try {
      result[sym] = await getStockData(sym, days);
    } catch (error: any) {
      if (error instanceof NoDataError || error.name === 'NoDataError') {
        console.warn(`[getAllStocksData] Skipping ${sym}: ${error.message}`);
      } else {
        throw error;
      }
    }
  }

  return result;
}
