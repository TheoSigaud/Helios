import type { OHLCVData } from '@/lib/analysis/types';

/**
 * Result of a VCP (Volatility Contraction Pattern) detection.
 */
export interface VCPResult {
  /** Whether a valid VCP was detected */
  detected: boolean;
  /** Quality score from 0 to 1, based on contraction quality and volume dry-up */
  quality: number;
  /** Number of successive contractions found */
  contractions: number;
}

/**
 * Calculates the True Range (TR) for a given day.
 */
export function calculateTrueRange(current: OHLCVData, previous: OHLCVData | null): number {
  if (!previous) {
    return current.high - current.low;
  }
  
  const highLow = current.high - current.low;
  const highClose = Math.abs(current.high - previous.close);
  const lowClose = Math.abs(current.low - previous.close);
  
  return Math.max(highLow, highClose, lowClose);
}

/**
 * Calculates the Average True Range (ATR) over a specific period.
 * Uses a simple moving average for the initial value, then Wilder's smoothing.
 */
export function calculateATR(data: OHLCVData[], period: number = 14): number[] {
  if (data.length < period) return data.map(() => 0);

  const trueRanges = data.map((d, i) => calculateTrueRange(d, i > 0 ? data[i - 1] : null));
  const atr: number[] = new Array(data.length).fill(0);

  // Initial ATR is simple average of first 'period' TRs
  let sumTR = 0;
  for (let i = 0; i < period; i++) {
    sumTR += trueRanges[i];
  }
  atr[period - 1] = sumTR / period;

  // Wilder's smoothing for the rest
  for (let i = period; i < data.length; i++) {
    atr[i] = (atr[i - 1] * (period - 1) + trueRanges[i]) / period;
  }

  return atr;
}

/**
 * Detects Volatility Contraction Pattern (VCP) with progressive quality scoring.
 *
 * A true Minervini VCP has:
 * 1. Multiple successive price contractions where each pullback is shallower
 *    than the previous (e.g., -20% → -10% → -5%)
 * 2. Volume dry-up during contractions (declining volume on down-days)
 * 3. ATR contraction (recent volatility lower than past volatility)
 *
 * Quality is scored 0-1 based on:
 * - Number of contractions found (2=0.5, 3=0.75, 4+=1.0)
 * - Contraction depth ratio (each < 70% of previous is ideal)
 * - Volume dry-up quality (down-day volume declining vs up-day volume)
 *
 * @param data - OHLCV data (oldest first), weekly bars
 * @param atrPeriod - ATR calculation period (default 14)
 * @param lookback - Lookback period to search for contractions (default 30)
 * @returns VCPResult with detected flag, quality score, and contraction count
 */
export function detectVCP(data: OHLCVData[], atrPeriod: number = 14, lookback: number = 30): VCPResult {
  const noVCP: VCPResult = { detected: false, quality: 0, contractions: 0 };

  if (data.length < lookback + atrPeriod) return noVCP;

  // ── 1. ATR Contraction Check ──
  const atrValues = calculateATR(data, atrPeriod);
  
  const recentAtrAvg = average(atrValues.slice(-5));
  const pastAtrAvg = average(atrValues.slice(-lookback, -lookback + 5));
  
  // Volatility must have contracted (recent ATR < 80% of past ATR)
  if (pastAtrAvg <= 0 || recentAtrAvg >= pastAtrAvg * 0.8) return noVCP;

  const atrContractionRatio = recentAtrAvg / pastAtrAvg; // Lower is better

  // ── 2. Detect Successive Price Contractions ──
  const recentData = data.slice(-lookback);
  const contractionDepths = findContractionDepths(recentData);

  // Need at least 2 contractions
  if (contractionDepths.length < 2) return noVCP;

  // Check if contractions are successively shallower
  let successiveCount = 1; // First contraction always counts
  let successiveRatioSum = 0;
  let successiveRatioCount = 0;

  for (let i = 1; i < contractionDepths.length; i++) {
    if (contractionDepths[i] < contractionDepths[i - 1]) {
      successiveCount++;
      const ratio = contractionDepths[i] / contractionDepths[i - 1];
      successiveRatioSum += ratio;
      successiveRatioCount++;
    }
  }

  // Need at least 2 successive shallower contractions
  if (successiveCount < 2) return noVCP;

  // ── 3. Volume Dry-Up Analysis ──
  // Split lookback into halves: compare volume behavior
  const firstHalf = recentData.slice(0, Math.floor(recentData.length / 2));
  const secondHalf = recentData.slice(Math.floor(recentData.length / 2));

  const firstHalfDownVol = averageDownDayVolume(firstHalf);
  const secondHalfDownVol = averageDownDayVolume(secondHalf);
  const secondHalfUpVol = averageUpDayVolume(secondHalf);

  // Down-day volume should be declining AND lower than up-day volume
  const volumeDryingUp = secondHalfDownVol < firstHalfDownVol && secondHalfDownVol < secondHalfUpVol;

  // ── 4. Calculate Quality Score ──
  // Contraction count score (2=0.4, 3=0.7, 4+=1.0)
  const contractionCountScore = Math.min(1, (successiveCount - 1) * 0.3 + 0.1);

  // Contraction ratio score (lower average ratio = better, ideal < 0.6)
  const avgRatio = successiveRatioCount > 0 ? successiveRatioSum / successiveRatioCount : 1;
  const ratioScore = Math.max(0, Math.min(1, (1 - avgRatio) * 1.5));

  // ATR contraction score (lower ratio = better contraction)
  const atrScore = Math.max(0, Math.min(1, (0.8 - atrContractionRatio) * 3));

  // Volume dry-up bonus
  const volumeBonus = volumeDryingUp ? 0.2 : 0;

  // Weighted quality
  const quality = Math.min(1, 
    contractionCountScore * 0.35 + 
    ratioScore * 0.25 + 
    atrScore * 0.2 + 
    volumeBonus + 
    0.0 // base
  );

  return {
    detected: true,
    quality: Math.round(quality * 100) / 100,
    contractions: successiveCount,
  };
}

// ── Helper Functions ──

/** Find the depth (% drop from local high to local low) of each contraction/pullback */
function findContractionDepths(data: OHLCVData[]): number[] {
  const depths: number[] = [];
  let localHigh = data[0].high;
  let localLow = data[0].low;
  let inPullback = false;

  for (let i = 1; i < data.length; i++) {
    const bar = data[i];

    if (!inPullback) {
      if (bar.high > localHigh) {
        localHigh = bar.high;
        localLow = bar.low;
      } else if (bar.close < localHigh * 0.97) {
        // Start of pullback (3% drop from local high)
        inPullback = true;
        localLow = bar.low;
      }
    } else {
      if (bar.low < localLow) {
        localLow = bar.low;
      }
      if (bar.close > localHigh * 0.99 || bar.high > localHigh) {
        // Recovery — record the pullback depth
        const depth = ((localHigh - localLow) / localHigh) * 100;
        if (depth > 1) { // Minimum 1% depth to count
          depths.push(depth);
        }
        localHigh = Math.max(localHigh, bar.high);
        localLow = bar.low;
        inPullback = false;
      }
    }
  }

  // If currently in a pullback, record it
  if (inPullback) {
    const depth = ((localHigh - localLow) / localHigh) * 100;
    if (depth > 1) {
      depths.push(depth);
    }
  }

  return depths;
}

function averageDownDayVolume(data: OHLCVData[]): number {
  let total = 0;
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i].close < data[i - 1].close) {
      total += data[i].volume;
      count++;
    }
  }
  return count > 0 ? total / count : 0;
}

function averageUpDayVolume(data: OHLCVData[]): number {
  let total = 0;
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i].close > data[i - 1].close) {
      total += data[i].volume;
      count++;
    }
  }
  return count > 0 ? total / count : 0;
}

function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}
