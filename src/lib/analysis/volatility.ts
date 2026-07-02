import type { OHLCVData } from '@/lib/analysis/types';

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
 * Detects Volatility Contraction Pattern (VCP) based on ATR and Volume dry-up.
 * Returns true if volatility has contracted significantly and volume on down-days is low.
 */
export function detectVCP(data: OHLCVData[], atrPeriod: number = 14, lookback: number = 20): boolean {
  if (data.length < lookback + atrPeriod) return false;

  const atrValues = calculateATR(data, atrPeriod);
  
  // Get recent ATR (e.g., last 5 days average)
  const recentAtrSum = atrValues.slice(-5).reduce((sum, val) => sum + val, 0);
  const recentAtrAvg = recentAtrSum / 5;
  
  // Get past ATR (e.g., from lookback to lookback-5)
  const pastAtrSum = atrValues.slice(-lookback, -lookback + 5).reduce((sum, val) => sum + val, 0);
  const pastAtrAvg = pastAtrSum / 5;
  
  // Volatility contraction: recent ATR should be significantly lower than past ATR (e.g., 30% lower)
  const volatilityContracted = pastAtrAvg > 0 && recentAtrAvg < pastAtrAvg * 0.7;
  
  if (!volatilityContracted) return false;

  // Volume dry-up analysis over the lookback period
  const recentData = data.slice(-lookback);
  let upVolume = 0;
  let upDays = 0;
  let downVolume = 0;
  let downDays = 0;

  for (let i = 1; i < recentData.length; i++) {
    const current = recentData[i];
    const previous = recentData[i - 1];
    
    if (current.close > previous.close) {
      upVolume += current.volume;
      upDays++;
    } else if (current.close < previous.close) {
      downVolume += current.volume;
      downDays++;
    }
  }

  const avgUpVolume = upDays > 0 ? upVolume / upDays : 0;
  const avgDownVolume = downDays > 0 ? downVolume / downDays : Infinity;
  
  // Volume dry-up: average volume on down days should be lower than average volume on up days
  const volumeDriedUp = avgDownVolume < avgUpVolume;

  return volumeDriedUp;
}
