import type { Signal } from '@/lib/analysis/types';
import { calculateSMA } from '@/lib/analysis/moving-averages';

/**
 * Calculate the Mansfield Relative Strength (MRS).
 *
 * The Mansfield RS measures a stock's relative performance vs. a benchmark index.
 *
 * Formula:
 *   RS_ratio[i] = stockClose[i] / benchmarkClose[i]
 *   MA_RS = SMA(RS_ratio, period)
 *   MRS = ((currentRS / MA_RS) - 1) * 100
 *
 * A positive MRS indicates the stock is outperforming the benchmark.
 * A negative MRS indicates underperformance.
 *
 * @param stockCloses - Array of stock closing prices (oldest first)
 * @param benchmarkCloses - Array of benchmark closing prices (oldest first), same length
 * @param period - SMA period for smoothing the RS ratio (typically 52 for weekly or 200 for daily)
 * @returns The Mansfield RS value, or 0 if insufficient data
 */
export function calculateMansfieldRS(
  stockCloses: number[],
  benchmarkCloses: number[],
  period: number
): number {
  // Align arrays to the shorter length
  const length = Math.min(stockCloses.length, benchmarkCloses.length);

  if (length < period || period <= 0) {
    return 0;
  }

  const alignedStock = stockCloses.slice(stockCloses.length - length);
  const alignedBenchmark = benchmarkCloses.slice(benchmarkCloses.length - length);

  // Calculate RS ratio for each period
  const rsRatios: number[] = [];
  for (let i = 0; i < length; i++) {
    if (alignedBenchmark[i] === 0) {
      rsRatios.push(0);
    } else {
      rsRatios.push(alignedStock[i] / alignedBenchmark[i]);
    }
  }

  // Calculate SMA of the RS ratio
  const maRS = calculateSMA(rsRatios, period);
  const currentMARS = maRS[maRS.length - 1];
  const currentRS = rsRatios[rsRatios.length - 1];

  if (isNaN(currentMARS) || currentMARS === 0 || currentRS === 0) {
    return 0;
  }

  // Mansfield RS formula
  const mrs = ((currentRS / currentMARS) - 1) * 100;

  return Math.round(mrs * 100) / 100;
}

/**
 * Generate a trading signal based on the Mansfield RS value.
 *
 * Signal interpretation:
 *   MRS > 2   → Strong BUY  (stock strongly outperforming benchmark)
 *   MRS 0-2   → BUY         (stock outperforming benchmark)
 *   MRS -2-0  → HOLD        (stock roughly in line with benchmark)
 *   MRS < -2  → SELL        (stock underperforming benchmark)
 *
 * @param mrs - The Mansfield RS value
 * @returns A Signal object with type, strength, and description
 */
export function getMansfieldRSSignal(mrs: number): Signal {
  if (mrs > 2) {
    return {
      type: 'BUY',
      source: 'Mansfield RS',
      strength: Math.min(1, mrs / 5),
      description: `Strong relative strength (MRS: ${mrs.toFixed(2)}). Stock is significantly outperforming the benchmark.`,
    };
  }

  if (mrs >= 0) {
    return {
      type: 'BUY',
      source: 'Mansfield RS',
      strength: Math.min(0.6, mrs / 4),
      description: `Positive relative strength (MRS: ${mrs.toFixed(2)}). Stock is outperforming the benchmark.`,
    };
  }

  if (mrs >= -2) {
    return {
      type: 'HOLD',
      source: 'Mansfield RS',
      strength: 0.3,
      description: `Neutral relative strength (MRS: ${mrs.toFixed(2)}). Stock is roughly in line with the benchmark.`,
    };
  }

  return {
    type: 'SELL',
    source: 'Mansfield RS',
    strength: Math.min(1, Math.abs(mrs) / 5),
    description: `Weak relative strength (MRS: ${mrs.toFixed(2)}). Stock is underperforming the benchmark.`,
  };
}
