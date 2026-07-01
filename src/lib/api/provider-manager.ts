// ---------------------------------------------------------------------------
// Provider Manager
// Orchestrates data fetching across multiple API providers with fallback
// ---------------------------------------------------------------------------

import type { OHLCVData } from '@/lib/analysis/types';
import { fetchTimeSeries as fetchTimeSeriesTwelveData } from './twelve-data';
import { fetchTimeSeriesAlphaVantage } from './alpha-vantage';
import { fetchTimeSeriesMarketStack } from './market-stack';

export type ProviderName = 'TwelveData' | 'AlphaVantage' | 'MarketStack';

// A standardized interface for a provider
interface DataProvider {
  name: ProviderName;
  fetch: (symbol: string, days: number) => Promise<OHLCVData[]>;
}

// Order of priority:
// If the user explicitly added API keys for TwelveData, we can try it first.
const PROVIDERS: DataProvider[] = [
  { name: 'TwelveData', fetch: (sym, days) => fetchTimeSeriesTwelveData(sym, '1day', days) },
  { name: 'AlphaVantage', fetch: fetchTimeSeriesAlphaVantage },
  { name: 'MarketStack', fetch: fetchTimeSeriesMarketStack },
];

/**
 * Fetch OHLCV time-series for a single symbol using the first available provider.
 * Automatically falls back to the next provider if the current one hits a rate limit (429/426)
 * or encounters any other error.
 * 
 * @param symbol  Ticker symbol (e.g. "AAPL")
 * @param days    Number of calendar days of history to retrieve
 * @returns       Chronological array of OHLCV data
 */
export async function fetchTimeSeriesWithFallback(
  symbol: string,
  days: number = 365,
): Promise<OHLCVData[]> {
  const errors: Error[] = [];

  for (const provider of PROVIDERS) {
    try {
      console.log(`[ProviderManager] Attempting to fetch ${symbol} via ${provider.name}...`);
      const data = await provider.fetch(symbol, days);
      console.log(`[ProviderManager] Successfully fetched ${symbol} via ${provider.name}.`);
      return data;
    } catch (error: any) {
      console.warn(`[ProviderManager] ${provider.name} failed for ${symbol}:`, error.message);
      errors.push(error);

      // If it's a rate limit or a missing API key error, we continue to the next provider
      // Even if it's a generic error (like network issue), trying the next one is generally safe
      continue;
    }
  }

  // If we exhaust all providers
  throw new Error(
    `All data providers failed for ${symbol}. Errors:\n` +
      errors.map((e, i) => `[${PROVIDERS[i].name}]: ${e.message}`).join('\n')
  );
}
