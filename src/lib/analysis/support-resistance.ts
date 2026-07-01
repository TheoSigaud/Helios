import type { OHLCVData } from '@/lib/analysis/types';

/**
 * Find support and resistance levels using pivot point detection and clustering.
 *
 * Algorithm:
 *  1. Identify local minima (supports) and maxima (resistances) using a 5-bar window.
 *  2. Cluster nearby levels that are within 1.5% of each other.
 *  3. Weight clusters by frequency (how many pivots formed at that level).
 *  4. Return the top 3 support and resistance levels sorted by proximity to current price.
 *
 * @param data - OHLCV data array (oldest first)
 * @param lookback - Number of bars to analyze from the end of the data
 * @returns Object containing arrays of support and resistance levels
 */
export function findSupportResistance(
  data: OHLCVData[],
  lookback: number
): { supports: number[]; resistances: number[] } {
  const empty = { supports: [], resistances: [] };

  if (data.length < 11) {
    return empty;
  }

  const effectiveLookback = Math.min(lookback, data.length);
  const slice = data.slice(-effectiveLookback);
  const currentPrice = slice[slice.length - 1].close;

  const localMinima: number[] = [];
  const localMaxima: number[] = [];

  // Find local minima and maxima using a 5-bar window (2 bars on each side)
  for (let i = 2; i < slice.length - 2; i++) {
    const prevPrevLow = slice[i - 2].low;
    const prevLow = slice[i - 1].low;
    const currLow = slice[i].low;
    const nextLow = slice[i + 1].low;
    const nextNextLow = slice[i + 2].low;

    const prevPrevHigh = slice[i - 2].high;
    const prevHigh = slice[i - 1].high;
    const currHigh = slice[i].high;
    const nextHigh = slice[i + 1].high;
    const nextNextHigh = slice[i + 2].high;

    // Local minimum: current low is lower than surrounding 2 bars' lows
    if (
      currLow <= prevLow &&
      currLow <= prevPrevLow &&
      currLow <= nextLow &&
      currLow <= nextNextLow
    ) {
      localMinima.push(currLow);
    }

    // Local maximum: current high is higher than surrounding 2 bars' highs
    if (
      currHigh >= prevHigh &&
      currHigh >= prevPrevHigh &&
      currHigh >= nextHigh &&
      currHigh >= nextNextHigh
    ) {
      localMaxima.push(currHigh);
    }
  }

  // Cluster nearby levels within a 1.5% threshold
  const clusterLevels = (levels: number[]): number[] => {
    if (levels.length === 0) return [];

    const sorted = [...levels].sort((a, b) => a - b);
    const clusters: { sum: number; count: number }[] = [];

    let currentCluster = { sum: sorted[0], count: 1 };

    for (let i = 1; i < sorted.length; i++) {
      const clusterAvg = currentCluster.sum / currentCluster.count;
      const diff = Math.abs(sorted[i] - clusterAvg) / clusterAvg;

      if (diff <= 0.015) {
        // Within 1.5% — merge into cluster
        currentCluster.sum += sorted[i];
        currentCluster.count++;
      } else {
        // New cluster
        clusters.push(currentCluster);
        currentCluster = { sum: sorted[i], count: 1 };
      }
    }
    clusters.push(currentCluster);

    // Return cluster averages, weighted by frequency (higher count = stronger level)
    return clusters.map((c) =>
      Math.round((c.sum / c.count) * 100) / 100
    );
  };

  const clusteredSupports = clusterLevels(localMinima);
  const clusteredResistances = clusterLevels(localMaxima);

  // Filter: supports must be below current price, resistances above
  const validSupports = clusteredSupports.filter((s) => s < currentPrice);
  const validResistances = clusteredResistances.filter((r) => r > currentPrice);

  // Sort by proximity to current price (closest first) and take top 3
  const sortedSupports = validSupports
    .sort((a, b) => Math.abs(currentPrice - a) - Math.abs(currentPrice - b))
    .slice(0, 3)
    .sort((a, b) => b - a); // Then sort descending (highest support first)

  const sortedResistances = validResistances
    .sort((a, b) => Math.abs(a - currentPrice) - Math.abs(b - currentPrice))
    .slice(0, 3)
    .sort((a, b) => a - b); // Sort ascending (lowest resistance first)

  return {
    supports: sortedSupports,
    resistances: sortedResistances,
  };
}
