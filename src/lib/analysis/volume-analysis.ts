import type { OHLCVData, Signal } from '@/lib/analysis/types';

/**
 * Calculate the average volume over a given period from the end of the data.
 *
 * @param data - OHLCV data array (oldest first)
 * @param period - Number of bars to average over
 * @returns The average volume, or 0 if insufficient data
 */
export function calculateAverageVolume(
  data: OHLCVData[],
  period: number
): number {
  if (data.length === 0 || period <= 0) {
    return 0;
  }

  const effectivePeriod = Math.min(period, data.length);
  const slice = data.slice(-effectivePeriod);
  const totalVolume = slice.reduce((sum, bar) => sum + bar.volume, 0);

  return totalVolume / effectivePeriod;
}

/**
 * Calculate the ratio of current volume to average volume.
 *
 * @param currentVol - The current bar's volume
 * @param avgVol - The average volume
 * @returns The volume ratio (e.g., 2.0 means current is 2x average), or 0 if avgVol is 0
 */
export function getVolumeRatio(currentVol: number, avgVol: number): number {
  if (avgVol === 0) {
    return 0;
  }

  return Math.round((currentVol / avgVol) * 100) / 100;
}

/**
 * Determine if volume is expanding by comparing the short-period average
 * volume against the long-period average volume.
 *
 * Volume is considered expanding if the short-period average exceeds the
 * long-period average by at least 10%.
 *
 * @param data - OHLCV data array (oldest first)
 * @param shortPeriod - Short lookback period (e.g., 5 or 10 days)
 * @param longPeriod - Long lookback period (e.g., 50 days)
 * @returns True if volume is expanding
 */
export function isVolumeExpanding(
  data: OHLCVData[],
  shortPeriod: number,
  longPeriod: number
): boolean {
  if (data.length < longPeriod) {
    return false;
  }

  const shortAvg = calculateAverageVolume(data, shortPeriod);
  const longAvg = calculateAverageVolume(data, longPeriod);

  if (longAvg === 0) {
    return false;
  }

  return shortAvg > longAvg * 1.1;
}

/**
 * Generate a volume-based trading signal by analyzing:
 *  1. Current volume vs 20-day average
 *  2. Volume expansion trend (5-day vs 50-day average)
 *  3. Price direction (whether the volume supports a bullish or bearish move)
 *
 * @param data - OHLCV data array (oldest first), needs at least 10 bars
 * @returns A Signal with type, strength, and description
 */
export function getVolumeSignal(data: OHLCVData[]): Signal {
  if (data.length < 10) {
    return {
      type: 'HOLD',
      source: 'Volume Analysis',
      strength: 0,
      description: 'Insufficient data for volume analysis.',
    };
  }

  const currentBar = data[data.length - 1];
  const prevBar = data[data.length - 2];
  const currentVolume = currentBar.volume;
  const avgVolume4 = calculateAverageVolume(data, 4);
  const ratio = getVolumeRatio(currentVolume, avgVolume4);
  const expanding = isVolumeExpanding(data, 2, 10);

  // Determine price direction
  const priceUp = currentBar.close > prevBar.close;
  const priceDown = currentBar.close < prevBar.close;

  // High volume on up move = bullish signal
  if (ratio >= 1.5 && priceUp && expanding) {
    return {
      type: 'BUY',
      source: 'Volume Analysis',
      strength: Math.min(1, (ratio - 1) / 2),
      description: `Strong bullish volume: ${ratio.toFixed(1)}x average with expanding volume trend and rising price.`,
    };
  }

  if (ratio >= 1.5 && priceUp) {
    return {
      type: 'BUY',
      source: 'Volume Analysis',
      strength: Math.min(0.7, (ratio - 1) / 3),
      description: `Above-average volume (${ratio.toFixed(1)}x) on an up day suggests buying interest.`,
    };
  }

  // High volume on down move = bearish signal
  if (ratio >= 1.5 && priceDown) {
    return {
      type: 'SELL',
      source: 'Volume Analysis',
      strength: Math.min(0.8, (ratio - 1) / 2.5),
      description: `Heavy selling volume (${ratio.toFixed(1)}x average) on a down day indicates distribution.`,
    };
  }

  // Expanding volume with uptrend
  if (expanding && priceUp) {
    return {
      type: 'BUY',
      source: 'Volume Analysis',
      strength: 0.4,
      description: 'Volume trend is expanding with rising prices. Accumulation may be underway.',
    };
  }

  // Contracting volume
  if (!expanding && ratio < 0.7) {
    return {
      type: 'HOLD',
      source: 'Volume Analysis',
      strength: 0.2,
      description: `Low volume (${ratio.toFixed(1)}x average). Lack of conviction — wait for a volume catalyst.`,
    };
  }

  // Neutral
  return {
    type: 'HOLD',
    source: 'Volume Analysis',
    strength: 0.3,
    description: `Volume is near average (${ratio.toFixed(1)}x). No strong volume signal.`,
  };
}
