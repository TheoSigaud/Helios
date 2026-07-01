// ---------------------------------------------------------------------------
// Alpha Vantage API client
// Documentation: https://www.alphavantage.co/documentation/
// ---------------------------------------------------------------------------

import type { OHLCVData } from '@/lib/analysis/types';

const BASE_URL = 'https://www.alphavantage.co/query';

function getApiKey(): string {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) {
    throw new Error('ALPHA_VANTAGE_API_KEY is not set.');
  }
  return key;
}

interface AlphaVantageResponse {
  'Time Series (Daily)'?: Record<string, {
    '1. open': string;
    '2. high': string;
    '3. low': string;
    '4. close': string;
    '5. volume': string;
  }>;
  'Error Message'?: string;
  'Note'?: string;
  'Information'?: string;
}

/**
 * Fetch OHLCV time-series for a single symbol using Alpha Vantage.
 * 
 * Free tier rate limits: 25 requests per day.
 * Returns up to 20 years of historical data with outputsize=full (or 100 with compact).
 * 
 * @param symbol  Ticker symbol (e.g. "AAPL")
 * @param days    Number of calendar days of history to retrieve
 * @returns       Chronological array of OHLCV data
 */
export async function fetchTimeSeriesAlphaVantage(
  symbol: string,
  days: number = 365,
): Promise<OHLCVData[]> {
  const apiKey = getApiKey();
  
  // Use 'full' if we need more than 100 data points (trading days)
  // 100 trading days is approx 140 calendar days
  const outputsize = days > 140 ? 'full' : 'compact';
  
  const url = new URL(BASE_URL);
  url.searchParams.set('function', 'TIME_SERIES_DAILY');
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('outputsize', outputsize);
  url.searchParams.set('apikey', apiKey);

  const response = await fetch(url.toString(), { cache: 'no-store' });

  if (!response.ok) {
    // If the HTTP status is not ok, throw directly (e.g. 429)
    throw new Error(`Alpha Vantage API HTTP error for ${symbol}: ${response.status}`);
  }

  const data: AlphaVantageResponse = await response.json();

  if (data['Error Message']) {
    throw new Error(`Alpha Vantage API error for ${symbol}: ${data['Error Message']}`);
  }

  // Alpha Vantage returns rate limit errors with a 200 OK status but a 'Note' or 'Information' key.
  if (data['Information'] && data['Information'].includes('rate limit')) {
    // Throw a specific error code structure so the provider manager can detect rate limits
    const err = new Error(`Alpha Vantage API rate limit for ${symbol}: ${data['Information']}`);
    (err as any).status = 429;
    throw err;
  }
  
  if (data['Note'] && data['Note'].includes('API call frequency')) {
    const err = new Error(`Alpha Vantage API frequency limit for ${symbol}: ${data['Note']}`);
    (err as any).status = 429;
    throw err;
  }

  const timeSeries = data['Time Series (Daily)'];
  if (!timeSeries) {
    throw new Error(`No data returned from Alpha Vantage for symbol: ${symbol}`);
  }

  const parsed: OHLCVData[] = [];
  
  // Calculate a cutoff date to avoid returning 20 years of data if we only asked for 500 days
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  for (const [date, values] of Object.entries(timeSeries)) {
    if (date < cutoffStr) continue;

    parsed.push({
      date,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'], 10),
    });
  }

  // Sort chronologically (oldest first)
  parsed.sort((a, b) => a.date.localeCompare(b.date));

  return parsed;
}
