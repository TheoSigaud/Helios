import fs from 'fs/promises';
import path from 'path';
import type { OHLCVData } from '@/lib/analysis/types';

// The local data directory at the root of the project
const DATA_DIR = path.join(process.cwd(), '.data');

/** Default cache TTL in milliseconds (24 hours). */
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * The shape of data stored on disk — wraps the OHLCV array with metadata.
 */
interface CacheEntry {
  /** ISO timestamp of when this entry was last written. */
  updatedAt: string;
  /** The OHLCV data array (oldest first). */
  data: OHLCVData[];
}

/**
 * Ensures the data directory exists.
 */
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

/**
 * Get the cache file path for a given symbol.
 * One file per symbol — no `days` suffix.
 */
function getFilePath(symbol: string): string {
  // Replace invalid characters in symbol just in case (e.g. ^GSPC -> _GSPC)
  const safeSymbol = symbol.replace(/[^a-z0-9-]/gi, '_');
  return path.join(DATA_DIR, `${safeSymbol}.json`);
}

/**
 * Read the raw cache entry from disk (with metadata).
 * Returns null if the file doesn't exist.
 */
async function readCacheEntry(symbol: string): Promise<CacheEntry | null> {
  const filePath = getFilePath(symbol);
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(fileContent);

    // Support both new format (with metadata) and legacy bare arrays
    if (Array.isArray(parsed)) {
      // Legacy format — bare array (no metadata)
      return { updatedAt: '', data: parsed as OHLCVData[] };
    } else if (parsed && Array.isArray(parsed.data)) {
      return parsed as CacheEntry;
    }
    return null;
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
      return null;
    }
    console.error(`[Cache] Error reading cache for ${symbol}:`, err);
    return null;
  }
}

/**
 * Read data from the local file system cache.
 * Returns null if the file doesn't exist.
 *
 * @param symbol  Ticker symbol
 * @param days    Optional — if provided, only returns data points from the
 *                last `days` calendar days. Otherwise returns everything.
 */
export async function getDiskCache(
  symbol: string,
  days?: number,
): Promise<OHLCVData[] | null> {
  const entry = await readCacheEntry(symbol);
  if (!entry || !entry.data || entry.data.length === 0) return null;

  let data = entry.data;

  // Optionally trim to the requested number of calendar days
  if (days && days > 0 && data.length > 0) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    data = data.filter((d) => d.date >= cutoffStr);
  }

  return data;
}

/**
 * Save data to the local file system cache with an update timestamp.
 */
export async function setDiskCache(
  symbol: string,
  data: OHLCVData[],
): Promise<void> {
  await ensureDataDir();
  const filePath = getFilePath(symbol);
  const entry: CacheEntry = {
    updatedAt: new Date().toISOString(),
    data,
  };
  try {
    await fs.writeFile(filePath, JSON.stringify(entry), 'utf-8');
  } catch (err) {
    console.error(`[Cache] Error writing cache for ${symbol}:`, err);
  }
}

/**
 * Get the date of the last data point in the cache for a symbol.
 * Used for incremental sync — only fetch data after this date.
 *
 * @param symbol  Ticker symbol
 * @returns ISO date string (YYYY-MM-DD) of the last data point, or null if no cache
 */
export async function getLastDataDate(
  symbol: string,
): Promise<string | null> {
  const entry = await readCacheEntry(symbol);
  if (!entry || !entry.data || entry.data.length === 0) return null;

  // Data is in chronological order (oldest first), so last element is newest
  return entry.data[entry.data.length - 1].date;
}

/**
 * Merge new data with existing cache data for incremental sync.
 * Deduplicates by date and maintains chronological order.
 *
 * @param symbol   Ticker symbol
 * @param newData  New OHLCV data points to merge (oldest first)
 * @returns The merged data array
 */
export async function mergeWithCache(
  symbol: string,
  newData: OHLCVData[],
): Promise<OHLCVData[]> {
  const entry = await readCacheEntry(symbol);
  const existingData = entry?.data ?? [];

  if (existingData.length === 0) {
    // No existing data, just use the new data
    await setDiskCache(symbol, newData);
    return newData;
  }

  if (newData.length === 0) {
    return existingData;
  }

  // Build a set of existing dates for deduplication
  const existingDates = new Set(existingData.map((d) => d.date));

  // Filter out duplicates from new data, and also update the last existing
  // data point if it has the same date (to get the most recent close)
  const lastExistingDate = existingData[existingData.length - 1].date;
  const filteredNew = newData.filter((d) => {
    if (d.date === lastExistingDate) {
      // Update the last bar (it may have been incomplete)
      const idx = existingData.findIndex((e) => e.date === lastExistingDate);
      if (idx >= 0) existingData[idx] = d;
      return false;
    }
    return !existingDates.has(d.date);
  });

  // Merge and sort chronologically
  const merged = [...existingData, ...filteredNew].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  await setDiskCache(symbol, merged);
  return merged;
}

/**
 * Check if the cache for a symbol is stale (older than `ttlMs` or missing).
 *
 * @param symbol  Ticker symbol
 * @param ttlMs   Time-to-live in milliseconds (default: 24 hours)
 * @returns `true` if the cache is missing or older than `ttlMs`
 */
export async function isCacheStale(
  symbol: string,
  ttlMs: number = DEFAULT_CACHE_TTL_MS,
): Promise<boolean> {
  const filePath = getFilePath(symbol);
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(fileContent);

    // Legacy format (bare array) is always considered stale
    if (Array.isArray(parsed)) {
      return true;
    }

    if (parsed && parsed.updatedAt) {
      const updatedAt = new Date(parsed.updatedAt).getTime();
      return Date.now() - updatedAt > ttlMs;
    }

    return true;
  } catch {
    return true;
  }
}

/**
 * Get the last update timestamp for a symbol's cache.
 * Returns null if the cache doesn't exist or has no timestamp.
 */
export async function getCacheTimestamp(
  symbol: string,
): Promise<string | null> {
  const filePath = getFilePath(symbol);
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(fileContent);
    if (parsed && !Array.isArray(parsed) && parsed.updatedAt) {
      return parsed.updatedAt;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check multiple symbols for staleness in parallel.
 * Returns an array of symbols that need syncing.
 *
 * @param symbols  Array of ticker symbols to check
 * @param ttlMs    Time-to-live in milliseconds (default: 24 hours)
 * @returns Array of symbols that are stale or missing from cache
 */
export async function getStaleSymbols(
  symbols: string[],
  ttlMs: number = DEFAULT_CACHE_TTL_MS,
): Promise<string[]> {
  const checks = await Promise.all(
    symbols.map(async (sym) => ({
      sym,
      stale: await isCacheStale(sym, ttlMs),
    })),
  );
  return checks.filter((c) => c.stale).map((c) => c.sym);
}

/**
 * Get last data dates for multiple symbols in parallel.
 * Used for building incremental sync start dates.
 *
 * @param symbols  Array of ticker symbols
 * @returns Map of symbol → last data date (ISO string), only for symbols with cached data
 */
export async function getLastDataDates(
  symbols: string[],
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const entries = await Promise.all(
    symbols.map(async (sym) => ({
      sym,
      date: await getLastDataDate(sym),
    })),
  );
  for (const entry of entries) {
    if (entry.date) {
      results.set(entry.sym, entry.date);
    }
  }
  return results;
}

/**
 * Clear all cache files in the .data directory.
 */
export async function clearDiskCache(): Promise<void> {
  try {
    const files = await fs.readdir(DATA_DIR);
    for (const file of files) {
      if (file.endsWith('.json')) {
        await fs.unlink(path.join(DATA_DIR, file));
      }
    }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code !== 'ENOENT') {
      console.error('[Cache] Error clearing cache:', err);
    }
  }
}
