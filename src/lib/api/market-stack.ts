// ---------------------------------------------------------------------------
// MarketStack API client
// Documentation: https://marketstack.com/documentation
// ---------------------------------------------------------------------------

import type { OHLCVData } from '@/lib/analysis/types';

const BASE_URL = 'http://api.marketstack.com/v1'; // Free tier doesn't support HTTPS

function getApiKey(): string {
  const key = process.env.MARKETSTACK_API_KEY;
  if (!key) {
    throw new Error('MARKETSTACK_API_KEY is not set.');
  }
  return key;
}

interface MarketStackResponse {
  data?: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    symbol: string;
  }>;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Fetch OHLCV time-series for a single symbol using MarketStack.
 * 
 * Free tier rate limits: 100 requests per month.
 * Does not support HTTPS on the free tier.
 * 
 * @param symbol  Ticker symbol (e.g. "AAPL")
 * @param days    Number of calendar days of history to retrieve
 * @returns       Chronological array of OHLCV data
 */
export async function fetchTimeSeriesMarketStack(
  symbol: string,
  days: number = 365,
): Promise<OHLCVData[]> {
  const apiKey = getApiKey();
  
  // MarketStack paginates to 100 items by default, we can set limit to requested days
  // Assuming 1 day ~ 1 data point, though trading days are less than calendar days
  const limit = Math.min(days, 1000); 

  const url = new URL(`${BASE_URL}/eod`);
  url.searchParams.set('access_key', apiKey);
  url.searchParams.set('symbols', symbol);
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url.toString(), { cache: 'no-store' });

  if (response.status === 429) {
    const err = new Error(`MarketStack API rate limit for ${symbol}`);
    (err as any).status = 429;
    throw err;
  }

  if (!response.ok) {
    throw new Error(`MarketStack API HTTP error for ${symbol}: ${response.status}`);
  }

  const result: MarketStackResponse = await response.json();

  if (result.error) {
    // E.g. usage_limit_reached -> mapped to 429
    if (result.error.code === 'usage_limit_reached') {
      const err = new Error(`MarketStack API rate limit for ${symbol}: ${result.error.message}`);
      (err as any).status = 429;
      throw err;
    }
    throw new Error(`MarketStack API error for ${symbol}: ${result.error.message}`);
  }

  if (!result.data || result.data.length === 0) {
    throw new Error(`No data returned from MarketStack for symbol: ${symbol}`);
  }

  const parsed: OHLCVData[] = result.data.map((row) => ({
    date: row.date.split('T')[0],
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
    volume: row.volume,
  }));

  // MarketStack returns newest first, so we sort chronologically (oldest first)
  parsed.sort((a, b) => a.date.localeCompare(b.date));

  return parsed;
}
