"use server";

import { fetchTimeSeriesWithFallback, fetchBatchTimeSeriesWithFallback } from '@/lib/api/provider-manager';
import { setDiskCache, isCacheStale } from '@/lib/data/cache';
import { DEFAULT_STOCKS, MARKET_BENCHMARKS } from '@/lib/data/stock-universe';

export async function getSyncTargets() {
  const benchmarkSymbols = Array.from(new Set(Object.values(MARKET_BENCHMARKS)));
  return {
    benchmarks: benchmarkSymbols,
    symbols: DEFAULT_STOCKS.map(s => s.symbol)
  };
}

/**
 * Sync a single symbol — fetches from API providers and saves to disk cache.
 *
 * @param symbol  Ticker symbol
 * @param days    Number of calendar days of history to request from the API
 */
export async function syncSingleSymbol(symbol: string, days: number = 1825) {
  try {
    console.log(`[Sync] Fetching data for ${symbol}...`);
    const data = await fetchTimeSeriesWithFallback(symbol, days);
    if (data && data.length > 0) {
      await setDiskCache(symbol, data);
      return { success: true, symbol };
    }
    return { success: false, symbol, message: 'No data returned' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Sync] Failed to fetch data for ${symbol}:`, message);
    return { success: false, symbol, message: message };
  }
}

/**
 * Sync multiple symbols — uses batch fetching for efficiency.
 * Only re-fetches symbols whose cache is stale (older than TTL) or missing.
 *
 * @param symbols  Array of ticker symbols
 * @param days     Number of calendar days of history to request from the API
 * @param forceAll If true, re-fetches all symbols regardless of cache freshness
 */
export async function syncBatchSymbols(
  symbols: string[],
  days: number = 1825,
  forceAll: boolean = false,
) {
  try {
    // Determine which symbols actually need refreshing
    let symbolsToSync: string[];

    if (forceAll) {
      symbolsToSync = [...symbols];
    } else {
      const staleChecks = await Promise.all(
        symbols.map(async (sym) => ({
          sym,
          stale: await isCacheStale(sym),
        })),
      );
      symbolsToSync = staleChecks.filter((c) => c.stale).map((c) => c.sym);
    }

    if (symbolsToSync.length === 0) {
      console.log('[Sync] All symbols are fresh, nothing to sync.');
      return {
        success: true,
        successCount: 0,
        failedCount: 0,
        failedSymbols: [],
        skipped: symbols.length,
      };
    }

    console.log(`[Sync] Fetching batch data for ${symbolsToSync.length} symbols (${symbols.length - symbolsToSync.length} skipped as fresh)...`);
    const results = await fetchBatchTimeSeriesWithFallback(symbolsToSync, days);
    
    let successCount = 0;
    const failedSymbols: string[] = [];

    // Save results to cache in parallel
    const savePromises = symbolsToSync.map(async (sym) => {
      const data = results[sym];
      if (data && data.length > 0) {
        await setDiskCache(sym, data);
        return { sym, success: true };
      }
      return { sym, success: false };
    });

    const saveResults = await Promise.all(savePromises);
    for (const r of saveResults) {
      if (r.success) {
        successCount++;
      } else {
        failedSymbols.push(r.sym);
      }
    }

    return { 
      success: true, 
      successCount, 
      failedCount: failedSymbols.length,
      failedSymbols,
      skipped: symbols.length - symbolsToSync.length,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Sync] Failed to fetch batch data:`, message);
    return { success: false, message: message, failedSymbols: symbols };
  }
}
