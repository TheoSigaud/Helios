// ---------------------------------------------------------------------------
// Twelve Data API client – server-side only
// https://twelvedata.com/docs
// ---------------------------------------------------------------------------

import type { OHLCVData } from '@/lib/analysis/types';

const BASE_URL = 'https://api.twelvedata.com';

/** Maximum symbols Twelve Data accepts in a single batch call. */
const MAX_BATCH_SIZE = 8;

/**
 * Delay (ms) between consecutive batch chunk requests to stay within the
 * Twelve Data free-tier rate limit (~8 requests/minute).
 */
const INTER_CHUNK_DELAY_MS = 8_500;

/** Maximum number of retries on 429 (rate-limited) responses. */
const MAX_RETRIES = 1;

/** Base delay (ms) for exponential backoff on 429 errors. */
const RETRY_BASE_DELAY_MS = 1_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getApiKey(): string {
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) {
    throw new Error(
      'TWELVE_DATA_API_KEY is not set. Add it to your .env.local file.',
    );
  }
  return key;
}

/** Simple async sleep helper. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with automatic retry on 429 (Too Many Requests).
 * Uses exponential backoff: 15 s → 30 s → 60 s …
 */
async function fetchWithRetry(
  url: string,
  retries: number = MAX_RETRIES,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, { cache: 'no-store' });

    if (response.status !== 429) return response;

    if (attempt < retries) {
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
      console.warn(
        `[Twelve Data] 429 rate-limited – retrying in ${(delay / 1000).toFixed(0)}s (attempt ${attempt + 1}/${retries})…`,
      );
      await sleep(delay);
    }
  }

  // All retries exhausted – return the last 429 so the caller can handle it
  return fetch(url, { cache: 'no-store' });
}

interface TwelveDataValue {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

interface TwelveDataSingleResponse {
  meta?: { symbol?: string };
  values?: TwelveDataValue[];
  status?: string;
  code?: number;
  message?: string;
}

type TwelveDataBatchResponse = Record<string, TwelveDataSingleResponse>;

/**
 * Parse the string-based values returned by the API into numeric OHLCVData.
 * The API returns newest-first, so we reverse to get chronological order.
 */
function parseValues(raw: TwelveDataValue[]): OHLCVData[] {
  const parsed: OHLCVData[] = raw.map((v) => ({
    date: v.datetime,
    open: parseFloat(v.open),
    high: parseFloat(v.high),
    low: parseFloat(v.low),
    close: parseFloat(v.close),
    volume: parseInt(v.volume, 10),
  }));

  // Reverse so oldest comes first (chronological order)
  return parsed.reverse();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch OHLCV time-series for a single symbol.
 *
 * @param symbol      Ticker symbol (e.g. "AAPL")
 * @param interval    Bar interval – defaults to "1day"
 * @param outputsize  Number of data points – defaults to 365
 */
export async function fetchTimeSeries(
  symbol: string,
  interval: string = '1week',
  outputsize: number = 365,
): Promise<OHLCVData[]> {
  const apiKey = getApiKey();

  const url = new URL(`${BASE_URL}/time_series`);
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('interval', interval);
  url.searchParams.set('outputsize', String(outputsize));
  url.searchParams.set('apikey', apiKey);

  const response = await fetchWithRetry(url.toString());

  if (!response.ok) {
    throw new Error(
      `Twelve Data API error for ${symbol}: ${response.status} ${response.statusText}`,
    );
  }

  const data: TwelveDataSingleResponse = await response.json();

  if (data.code && data.code !== 200) {
    throw new Error(
      `Twelve Data API returned error for ${symbol}: ${data.message ?? 'Unknown error'} (code ${data.code})`,
    );
  }

  if (!data.values || data.values.length === 0) {
    throw new Error(`No data returned for symbol: ${symbol}`);
  }

  return parseValues(data.values);
}

/**
 * Fetch OHLCV time-series for multiple symbols in one call.
 *
 * Twelve Data supports up to 8 symbols per batch request. If more symbols
 * are supplied they are automatically chunked into multiple requests.
 *
 * Chunks are sent **sequentially** with a delay between them to respect the
 * Twelve Data free-tier rate limit. 429 responses are automatically retried
 * with exponential backoff.
 *
 * @param symbols     Array of ticker symbols
 * @param interval    Bar interval – defaults to "1day"
 * @param outputsize  Number of data points – defaults to 365
 * @returns           Map of symbol → OHLCVData[]
 */
export async function fetchBatchTimeSeries(
  symbols: string[],
  interval: string = '1week',
  outputsize: number = 365,
): Promise<Record<string, OHLCVData[]>> {
  if (symbols.length === 0) return {};

  // If only one symbol, use the single endpoint directly
  if (symbols.length === 1) {
    const data = await fetchTimeSeries(symbols[0], interval, outputsize);
    return { [symbols[0]]: data };
  }

  const apiKey = getApiKey();
  const result: Record<string, OHLCVData[]> = {};

  // Chunk symbols into batches of MAX_BATCH_SIZE
  const chunks: string[][] = [];
  for (let i = 0; i < symbols.length; i += MAX_BATCH_SIZE) {
    chunks.push(symbols.slice(i, i + MAX_BATCH_SIZE));
  }

  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci];

    // Rate-limit: wait between chunks (skip delay before the first one)
    if (ci > 0) {
      console.log(
        `[Twelve Data] Waiting ${(INTER_CHUNK_DELAY_MS / 1000).toFixed(1)}s before chunk ${ci + 1}/${chunks.length}…`,
      );
      await sleep(INTER_CHUNK_DELAY_MS);
    }

    const url = new URL(`${BASE_URL}/time_series`);
    url.searchParams.set('symbol', chunk.join(','));
    url.searchParams.set('interval', interval);
    url.searchParams.set('outputsize', String(outputsize));
    url.searchParams.set('apikey', apiKey);

    const response = await fetchWithRetry(url.toString());

    if (!response.ok) {
      // Log and skip this chunk instead of aborting the entire scan
      console.error(
        `[Twelve Data] Batch chunk [${chunk.join(', ')}] failed: ${response.status} ${response.statusText}`,
      );
      continue;
    }

    const data = await response.json();

    // When a batch request has exactly 2+ symbols, the response is keyed by symbol.
    // When there's only 1 symbol left in the chunk, the response is a single object.
    if (chunk.length === 1) {
      const singleData = data as TwelveDataSingleResponse;
      if (singleData.code && singleData.code !== 200) {
        console.error(
          `Twelve Data error for ${chunk[0]}: ${singleData.message}`,
        );
        continue;
      }
      if (singleData.values) {
        result[chunk[0]] = parseValues(singleData.values);
      }
    } else {
      const batchData = data as TwelveDataBatchResponse;
      for (const sym of chunk) {
        const entry = batchData[sym];
        if (!entry) {
          console.error(`No response entry for symbol: ${sym}`);
          continue;
        }
        if (entry.code && entry.code !== 200) {
          console.error(
            `Twelve Data error for ${sym}: ${entry.message}`,
          );
          continue;
        }
        if (entry.values) {
          result[sym] = parseValues(entry.values);
        }
      }
    }
  }

  return result;
}
