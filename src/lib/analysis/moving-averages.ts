import type { OHLCVData, Signal } from '@/lib/analysis/types';

/**
 * Calculate Simple Moving Average for an array of closing prices.
 * Returns an array of SMA values aligned with the input array.
 * The first (period - 1) entries will be NaN since there isn't enough data.
 */
export function calculateSMA(closes: number[], period: number): number[] {
  const result: number[] = new Array(closes.length).fill(NaN);

  if (closes.length < period || period <= 0) {
    return result;
  }

  // Calculate initial sum for the first window
  let windowSum = 0;
  for (let i = 0; i < period; i++) {
    windowSum += closes[i];
  }
  result[period - 1] = windowSum / period;

  // Slide the window forward
  for (let i = period; i < closes.length; i++) {
    windowSum += closes[i] - closes[i - period];
    result[i] = windowSum / period;
  }

  return result;
}

/**
 * Get the latest (most recent) SMA value from the closing prices.
 * Returns 0 if there isn't enough data.
 */
export function getLatestSMA(closes: number[], period: number): number {
  if (closes.length < period || period <= 0) {
    return 0;
  }

  let sum = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    sum += closes[i];
  }
  return sum / period;
}

/**
 * Calculate the slope of an MA line as a percentage change over a lookback period.
 * Positive slope = uptrend, Negative slope = downtrend.
 * Returns the percentage change between the MA value `lookback` bars ago and the current MA value.
 */
export function getMASlope(maValues: number[], lookback: number): number {
  // Filter out NaN values from the end of the array
  const validValues = maValues.filter((v) => !isNaN(v));

  if (validValues.length < lookback + 1 || lookback <= 0) {
    return 0;
  }

  const current = validValues[validValues.length - 1];
  const previous = validValues[validValues.length - 1 - lookback];

  if (previous === 0) {
    return 0;
  }

  return ((current - previous) / previous) * 100;
}

/**
 * Detect a bullish breakout signal where price crosses above an MA with
 * volume confirmation (current volume > 1.5x the 20-day average volume).
 *
 * Returns a BUY Signal if:
 *  - The previous close was at or below the MA
 *  - The current close is above the MA
 *  - Current volume is at least 1.5x the 20-day average volume
 *
 * Returns null if no breakout is detected.
 */
export function getBreakoutSignal(
  data: OHLCVData[],
  maPeriod: number
): Signal | null {
  if (data.length < Math.max(maPeriod, 21)) {
    return null;
  }

  const closes = data.map((d) => d.close);
  const smaValues = calculateSMA(closes, maPeriod);

  const currentIdx = data.length - 1;
  const prevIdx = data.length - 2;

  const currentSMA = smaValues[currentIdx];
  const prevSMA = smaValues[prevIdx];

  if (isNaN(currentSMA) || isNaN(prevSMA)) {
    return null;
  }

  const currentClose = data[currentIdx].close;
  const prevClose = data[prevIdx].close;
  const currentVolume = data[currentIdx].volume;

  // Calculate 20-day average volume
  const volumeSlice = data.slice(-21, -1);
  const avgVolume =
    volumeSlice.reduce((sum, d) => sum + d.volume, 0) / volumeSlice.length;

  const crossedAbove = prevClose <= prevSMA && currentClose > currentSMA;
  const volumeConfirmed = currentVolume >= avgVolume * 1.5;

  if (crossedAbove && volumeConfirmed) {
    const volumeMultiple = (currentVolume / avgVolume).toFixed(1);
    return {
      type: 'BUY',
      source: `MA${maPeriod} Breakout`,
      strength: Math.min(1, (currentVolume / avgVolume - 1) / 2),
      description: `Price broke above ${maPeriod}-day MA with ${volumeMultiple}x average volume`,
    };
  }

  return null;
}
