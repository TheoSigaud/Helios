"use server";

import { fetchTimeSeriesWithFallback } from '@/lib/api/provider-manager';
import { setDiskCache, clearDiskCache } from '@/lib/data/cache';
import { DEFAULT_STOCKS, BENCHMARK_SYMBOL } from '@/lib/data/stock-universe';

export async function getSyncTargets() {
  return {
    benchmark: BENCHMARK_SYMBOL,
    symbols: DEFAULT_STOCKS.map(s => s.symbol)
  };
}

export async function syncSingleSymbol(symbol: string, days: number = 500) {
  try {
    console.log(`[Sync] Fetching data for ${symbol}...`);
    const data = await fetchTimeSeriesWithFallback(symbol, days);
    if (data && data.length > 0) {
      await setDiskCache(symbol, days, data);
      return { success: true, symbol };
    }
    return { success: false, symbol, message: 'No data returned' };
  } catch (error: any) {
    console.error(`[Sync] Failed to fetch data for ${symbol}:`, error.message);
    return { success: false, symbol, message: error.message };
  }
}
