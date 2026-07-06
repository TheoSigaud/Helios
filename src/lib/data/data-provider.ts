import type { OHLCVData } from '@/lib/analysis/types';
import { BENCHMARK_SYMBOL, DEFAULT_SYMBOLS } from '@/lib/data/stock-universe';
import { getDiskCache } from '@/lib/data/cache';

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
 * If the cache is missing, throws `NoDataError` — the user must sync manually.
 *
 * @param symbol  Ticker symbol
 * @param days    Optional — limit data to the last N calendar days
 */
export async function getStockData(
  symbol: string,
  days?: number,
): Promise<OHLCVData[]> {
  const cached = await getDiskCache(symbol, days);
  if (cached && cached.length > 0) {
    return cached;
  }

  // Auto-sync is disabled. The user must manually trigger a sync.
  throw new NoDataError(`No data available for ${symbol}. Please synchronize the data manually.`);
}

/**
 * Fetch OHLCV data for the benchmark (SPY by default).
 * Throws `NoDataError` if missing from cache.
 *
 * @param symbol  Optional — Benchmark symbol (defaults to BENCHMARK_SYMBOL)
 * @param days    Optional — limit data to the last N calendar days
 */
export async function getBenchmarkData(
  symbol: string = BENCHMARK_SYMBOL,
  days?: number,
): Promise<OHLCVData[]> {
  const cached = await getDiskCache(symbol, days);
  if (cached && cached.length > 0) {
    return cached;
  }

  // Auto-sync is disabled. The user must manually trigger a sync.
  throw new NoDataError(`No benchmark data available for ${symbol}. Please synchronize the data manually.`);
}

/**
 * Fetch OHLCV data for all regional benchmarks.
 */
export async function getBenchmarksData(
  benchmarkSymbols: string[],
  days?: number,
): Promise<Record<string, OHLCVData[]>> {
  const result: Record<string, OHLCVData[]> = {};
  const entries = await Promise.allSettled(
    benchmarkSymbols.map(async (sym) => {
      const data = await getDiskCache(sym, days);
      return { sym, data };
    }),
  );
  for (const entry of entries) {
    if (entry.status === 'fulfilled' && entry.value.data && entry.value.data.length > 0) {
      result[entry.value.sym] = entry.value.data;
    }
  }
  return result;
}

/**
 * Fetch OHLCV data for multiple stocks at once from the disk cache.
 * Reads all symbols in parallel for maximum performance.
 *
 * @param symbols  Array of ticker symbols. Defaults to the full universe.
 * @param days     Optional — limit data to the last N calendar days
 * @returns        Map of symbol → OHLCVData[]
 */
export async function getAllStocksData(
  symbols: string[] = DEFAULT_SYMBOLS,
  days?: number,
): Promise<Record<string, OHLCVData[]>> {
  const result: Record<string, OHLCVData[]> = {};

  // Read all symbols from disk cache in parallel
  const entries = await Promise.allSettled(
    symbols.map(async (sym) => {
      const data = await getDiskCache(sym, days);
      return { sym, data };
    }),
  );

  for (const entry of entries) {
    if (entry.status === 'fulfilled' && entry.value.data && entry.value.data.length > 0) {
      result[entry.value.sym] = entry.value.data;
    }
    // Silently skip missing/failed entries (no NoDataError thrown)
  }

  return result;
}
