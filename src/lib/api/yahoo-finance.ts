// ---------------------------------------------------------------------------
// Yahoo Finance API client – server-side only
// Uses yahoo-finance2 (unofficial, no API key required)
// ---------------------------------------------------------------------------

import type { OHLCVData } from '@/lib/analysis/types';

// yahoo-finance2 v3 requires instantiation
// eslint-disable-next-line @typescript-eslint/no-require-imports
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

/** Maximum concurrent requests to avoid IP throttling. */
export const MAX_CONCURRENCY = 15;

/** Delay (ms) between concurrent batches to be respectful. */
const INTER_BATCH_DELAY_MS = 500;

/** Simple async sleep helper. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface YahooChartQuote {
  date: Date;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
}

/**
 * Parse Yahoo Finance chart results into our OHLCVData format.
 * Filters out entries with null values and returns chronological order.
 */
function parseQuotes(quotes: YahooChartQuote[]): OHLCVData[] {
  const parsed: OHLCVData[] = [];

  for (const q of quotes) {
    if (
      q.date &&
      q.open != null &&
      q.high != null &&
      q.low != null &&
      q.close != null &&
      q.volume != null
    ) {
      parsed.push({
        date: q.date.toISOString().split('T')[0],
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume,
      });
    }
  }

  // Already in chronological order from yahoo-finance2
  return parsed;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch OHLCV time-series for a single symbol using Yahoo Finance.
 *
 * @param symbol    Ticker symbol (e.g. "AAPL", "AI.PA", "SAP.DE")
 * @param interval  Bar interval – defaults to "1wk" (weekly)
 * @param startDate Optional start date for incremental sync (ISO string or Date)
 * @param days      Number of calendar days of history (used if startDate not provided)
 */
export async function fetchTimeSeries(
  symbol: string,
  interval: string = '1wk',
  startDate?: string | Date,
  days: number = 1825,
): Promise<OHLCVData[]> {
  try {
    const period1 = startDate
      ? new Date(startDate)
      : new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await yahooFinance.chart(symbol, {
      period1,
      period2: new Date(),
      interval,
    });

    if (!result || !result.quotes || result.quotes.length === 0) {
      throw new Error(`No data returned for symbol: ${symbol}`);
    }

    return parseQuotes(result.quotes);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Yahoo Finance] Error fetching ${symbol}:`, errMsg);
    throw new Error(`Yahoo Finance API error for ${symbol}: ${errMsg}`);
  }
}

/**
 * Fetch OHLCV time-series for multiple symbols with aggressive parallelization.
 *
 * Processes symbols in concurrent batches of MAX_CONCURRENCY, with a small
 * delay between batches to avoid IP throttling.
 *
 * @param symbols    Array of ticker symbols
 * @param interval   Bar interval – defaults to "1wk"
 * @param startDates Optional map of symbol → start date for incremental sync
 * @param days       Number of calendar days of history (fallback if no startDate)
 * @param onProgress Optional callback for progress reporting (called with completed count)
 * @returns          Map of symbol → OHLCVData[] (only successful fetches)
 */
export async function fetchBatchTimeSeries(
  symbols: string[],
  interval: string = '1wk',
  startDates?: Map<string, string>,
  days: number = 1825,
  onProgress?: (completed: number, total: number, symbol: string, success: boolean) => void,
): Promise<Record<string, OHLCVData[]>> {
  if (symbols.length === 0) return {};

  const result: Record<string, OHLCVData[]> = {};
  let completedCount = 0;

  // Process in concurrent batches
  for (let i = 0; i < symbols.length; i += MAX_CONCURRENCY) {
    const batch = symbols.slice(i, i + MAX_CONCURRENCY);

    // Delay between batches (skip before first batch)
    if (i > 0) {
      await sleep(INTER_BATCH_DELAY_MS);
    }

    // Fetch all symbols in this batch concurrently
    const batchResults = await Promise.allSettled(
      batch.map(async (sym) => {
        const startDate = startDates?.get(sym);
        const data = await fetchTimeSeries(sym, interval, startDate, days);
        return { sym, data };
      }),
    );

    for (const entry of batchResults) {
      completedCount++;
      if (entry.status === 'fulfilled' && entry.value.data.length > 0) {
        result[entry.value.sym] = entry.value.data;
        onProgress?.(completedCount, symbols.length, entry.value.sym, true);
      } else {
        const failedSym = entry.status === 'fulfilled'
          ? entry.value.sym
          : batch[batchResults.indexOf(entry)];
        if (entry.status === 'rejected') {
          console.warn(`[Yahoo Finance] Failed to fetch ${failedSym}:`, entry.reason);
        }
        onProgress?.(completedCount, symbols.length, failedSym ?? 'unknown', false);
      }
    }

    console.log(
      `[Yahoo Finance] Batch progress: ${completedCount}/${symbols.length} symbols processed`,
    );
  }

  return result;
}
