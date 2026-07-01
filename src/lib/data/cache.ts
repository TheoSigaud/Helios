import fs from 'fs/promises';
import path from 'path';
import type { OHLCVData } from '@/lib/analysis/types';

// The local data directory at the root of the project
const DATA_DIR = path.join(process.cwd(), '.data');

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
 * Get the cache file path for a given symbol and timeframe (days).
 */
function getFilePath(symbol: string, days: number): string {
  // Replace invalid characters in symbol just in case (e.g. ^GSPC -> _GSPC)
  const safeSymbol = symbol.replace(/[^a-z0-9-]/gi, '_');
  return path.join(DATA_DIR, `${safeSymbol}-${days}d.json`);
}

/**
 * Read data from the local file system cache.
 * Returns null if the file doesn't exist.
 */
export async function getDiskCache(symbol: string, days: number): Promise<OHLCVData[] | null> {
  const filePath = getFilePath(symbol, days);
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data as OHLCVData[];
  } catch (err: any) {
    // If the file does not exist, return null
    if (err.code === 'ENOENT') {
      return null;
    }
    console.error(`[Cache] Error reading cache for ${symbol}:`, err);
    return null;
  }
}

/**
 * Save data to the local file system cache.
 */
export async function setDiskCache(symbol: string, days: number, data: OHLCVData[]): Promise<void> {
  await ensureDataDir();
  const filePath = getFilePath(symbol, days);
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[Cache] Error writing cache for ${symbol}:`, err);
  }
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
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      console.error('[Cache] Error clearing cache:', err);
    }
  }
}
