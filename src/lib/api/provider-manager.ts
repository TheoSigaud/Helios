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
  { name: 'TwelveData', fetch: (sym, days) => fetchTimeSeriesTwelveData(sym, '1week', days) },
  { name: 'AlphaVantage', fetch: fetchTimeSeriesAlphaVantage },
  { name: 'MarketStack', fetch: fetchTimeSeriesMarketStack },
];

// Keep track of the currently working provider.
// If TwelveData rate limits us, we fallback to AlphaVantage.
// The next symbol should then start with AlphaVantage instead of hitting TwelveData again.
let currentProviderIndex = 0;

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
  const MAX_GLOBAL_RETRIES = 1;
  const BATCH_WAIT_MS = 60_000; // 60 seconds wait if all fail (wait for next rate limit batch)

  for (let globalAttempt = 0; globalAttempt <= MAX_GLOBAL_RETRIES; globalAttempt++) {
    const errors: Error[] = [];

    // Loop through providers, starting from currentProviderIndex
    for (let i = 0; i < PROVIDERS.length; i++) {
      const providerIdx = (currentProviderIndex + i) % PROVIDERS.length;
      const provider = PROVIDERS[providerIdx];

      try {
        console.log(`[ProviderManager] Attempting to fetch ${symbol} via ${provider.name} (Attempt ${globalAttempt + 1})...`);
        const data = await provider.fetch(symbol, days);
        console.log(`[ProviderManager] Successfully fetched ${symbol} via ${provider.name}.`);
        
        // Success! Keep this provider as the active one for subsequent calls
        currentProviderIndex = providerIdx;
        
        return data;
      } catch (error: any) {
        console.warn(`[ProviderManager] ${provider.name} failed for ${symbol}:`, error.message);
        errors.push(error);

        // If it's a rate limit or a missing API key error, we continue to the next provider
        continue;
      }
    }

    if (globalAttempt < MAX_GLOBAL_RETRIES) {
      console.warn(`[ProviderManager] All providers failed for ${symbol}. Waiting ${(BATCH_WAIT_MS / 1000).toFixed(0)}s before final retry...`);
      await new Promise(resolve => setTimeout(resolve, BATCH_WAIT_MS));
    } else {
      // If we exhaust all providers on the final attempt
      throw new Error(
        `All data providers failed for ${symbol} after retries. Errors:\n` +
          errors.map((e, i) => `[${PROVIDERS[(currentProviderIndex + i) % PROVIDERS.length].name}]: ${e.message}`).join('\n')
      );
    }
  }

  throw new Error(`Unexpected end of fetchTimeSeriesWithFallback`);
}

import { fetchBatchTimeSeries as fetchBatchTwelveData } from './twelve-data';

/**
 * Fetch OHLCV time-series for multiple symbols.
 * Tries Twelve Data's native batching first if it's the active provider.
 * Otherwise, falls back to fetching symbols individually sequentially with fallback logic.
 */
export async function fetchBatchTimeSeriesWithFallback(
  symbols: string[],
  days: number = 365,
): Promise<Record<string, OHLCVData[]>> {
  const results: Record<string, OHLCVData[]> = {};
  
  if (symbols.length === 0) return results;

  let symbolsToProcess = [...symbols];

  // If TwelveData is the current provider, try its native batching first.
  if (PROVIDERS[currentProviderIndex].name === 'TwelveData') {
    try {
      console.log(`[ProviderManager] Attempting native batch fetch for ${symbolsToProcess.length} symbols via TwelveData...`);
      const batchData = await fetchBatchTwelveData(symbolsToProcess, '1week', days);
      
      // Merge successful results
      for (const [sym, data] of Object.entries(batchData)) {
        results[sym] = data;
      }

      // Filter out symbols that succeeded
      symbolsToProcess = symbolsToProcess.filter(sym => !results[sym]);

      if (symbolsToProcess.length > 0) {
         console.warn(`[ProviderManager] TwelveData batch missed ${symbolsToProcess.length} symbols. Proceeding to individual fallback.`);
      }
    } catch (err: any) {
      console.warn(`[ProviderManager] TwelveData native batch failed:`, err.message);
      // We don't advance the global currentProviderIndex here immediately, 
      // the individual loop below will do it safely per-symbol.
    }
  }

  // For any remaining symbols (either batch failed, or we are on AlphaVantage/MarketStack)
  for (let i = 0; i < symbolsToProcess.length; i++) {
    const sym = symbolsToProcess[i];
    try {
      // Add a safety delay between individual fallback requests to avoid rate limits
      // Skip delay for the very first item to process it faster
      if (i > 0) {
        console.log(`[ProviderManager] Safety delay (2s) before fallback for ${sym}...`);
        await new Promise(res => setTimeout(res, 2000));
      }
      const data = await fetchTimeSeriesWithFallback(sym, days);
      results[sym] = data;
    } catch (e: any) {
      console.error(`[ProviderManager] Complete failure for ${sym}:`, e.message);
    }
  }

  return results;
}
