// ---------------------------------------------------------------------------
// Data Provider – abstraction layer over Twelve Data API
// ---------------------------------------------------------------------------

import type { OHLCVData } from '@/lib/analysis/types';
import { BENCHMARK_SYMBOL, DEFAULT_SYMBOLS } from '@/lib/data/stock-universe';
import { fetchTimeSeries, fetchBatchTimeSeries } from '@/lib/api/twelve-data';

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: OHLCVData[];
  timestamp: number;
}

/** Cache TTL – 15 minutes */
const CACHE_TTL_MS = 15 * 60 * 1000;

const cache = new Map<string, CacheEntry>();

function getCacheKey(symbol: string, days: number): string {
  return `${symbol}:${days}`;
}

function getCached(symbol: string, days: number): OHLCVData[] | null {
  const entry = cache.get(getCacheKey(symbol, days));
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(getCacheKey(symbol, days));
    return null;
  }
  return entry.data;
}

function setCache(symbol: string, days: number, data: OHLCVData[]): void {
  cache.set(getCacheKey(symbol, days), { data, timestamp: Date.now() });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch OHLCV data for a single stock via Twelve Data API.
 */
export async function getStockData(
  symbol: string,
  days: number = 500,
): Promise<OHLCVData[]> {
  const cached = getCached(symbol, days);
  if (cached) return cached;

  const data = await fetchTimeSeries(symbol, '1day', days);
  setCache(symbol, days, data);
  return data;
}

/**
 * Fetch OHLCV data for the benchmark (SPY by default).
 */
export async function getBenchmarkData(
  days: number = 500,
): Promise<OHLCVData[]> {
  const cached = getCached(BENCHMARK_SYMBOL, days);
  if (cached) return cached;

  const data = await fetchTimeSeries(BENCHMARK_SYMBOL, '1day', days);
  setCache(BENCHMARK_SYMBOL, days, data);
  return data;
}

/**
 * Fetch OHLCV data for multiple stocks at once.
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
  const uncached: string[] = [];

  // Serve what we can from cache
  for (const sym of symbols) {
    const cached = getCached(sym, days);
    if (cached) {
      result[sym] = cached;
    } else {
      uncached.push(sym);
    }
  }

  if (uncached.length === 0) return result;

  const batchData = await fetchBatchTimeSeries(uncached, '1day', days);
  for (const [sym, data] of Object.entries(batchData)) {
    setCache(sym, days, data);
    result[sym] = data;
  }

  return result;
}

/**
 * Clear the in-memory cache. Useful for testing or forced refresh.
 */
export function clearCache(): void {
  cache.clear();
}
