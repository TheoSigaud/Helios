import type { OHLCVData, WeinsteinPhase } from '@/lib/analysis/types';
import { calculateSMA, getMASlope } from '@/lib/analysis/moving-averages';

const PHASE_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: 'Basing / Accumulation',
  2: 'Advancing / Markup',
  3: 'Topping / Distribution',
  4: 'Declining / Markdown',
};

const PHASE_DESCRIPTIONS: Record<1 | 2 | 3 | 4, string> = {
  1: 'Price is consolidating around a flattening MA30. Smart money may be accumulating. Watch for a breakout above MA30 with volume.',
  2: 'Price is above a rising MA30. This is the ideal stage for long positions. Ride the trend and manage risk with trailing stops.',
  3: 'Price is consolidating around a flattening MA30 after an advance. Distribution may be occurring. Tighten stops and consider reducing exposure.',
  4: 'Price is below a declining MA30. This is a bearish stage. Avoid long positions and consider short opportunities.',
};

const PHASE_ACTIONS: Record<1 | 2 | 3 | 4, 'BUY' | 'SELL' | 'HOLD' | 'WATCH'> = {
  1: 'WATCH',
  2: 'BUY',
  3: 'HOLD',
  4: 'SELL',
};

/**
 * Detect the Weinstein phase of a stock based on its OHLCV data.
 *
 * Phase determination logic:
 * - Phase 1 (Basing): |MA30 slope| < 0.5%, price within ±3% of MA30, relatively low volume
 * - Phase 2 (Advancing): MA30 slope > 0.5%, price above MA30
 * - Phase 3 (Topping): |MA30 slope| < 0.5%, price within ±3% of MA30, previously in Phase 2
 * - Phase 4 (Declining): MA30 slope < -0.5%, price below MA30
 *
 * Confidence is calculated as the proportion of matching criteria (0 to 1).
 */
export function detectPhase(data: OHLCVData[]): WeinsteinPhase {
  if (data.length < 60) {
    // Not enough data to determine phase reliably; default to Phase 1
    return {
      stage: 1,
      label: PHASE_LABELS[1],
      description: 'Insufficient data for reliable phase detection. Defaulting to basing phase.',
      confidence: 0,
      action: 'WATCH',
    };
  }

  const closes = data.map((d) => d.close);
  const ma30Values = calculateSMA(closes, 30);
  const currentClose = closes[closes.length - 1];
  const currentMA30 = ma30Values[ma30Values.length - 1];

  if (isNaN(currentMA30) || currentMA30 === 0) {
    return {
      stage: 1,
      label: PHASE_LABELS[1],
      description: 'Unable to compute MA30. Defaulting to basing phase.',
      confidence: 0,
      action: 'WATCH',
    };
  }

  // Calculate slope over 10 periods
  const slope = getMASlope(ma30Values, 10);

  // Price position relative to MA30
  const priceVsMa30Pct = ((currentClose - currentMA30) / currentMA30) * 100;
  const priceAboveMA = currentClose > currentMA30;
  const priceNearMA = Math.abs(priceVsMa30Pct) <= 3;

  // Volume analysis: compare recent 10-day avg volume to 50-day avg volume
  const recentVolumes = data.slice(-10).map((d) => d.volume);
  const longerVolumes = data.slice(-50).map((d) => d.volume);
  const recentAvgVol =
    recentVolumes.reduce((s, v) => s + v, 0) / recentVolumes.length;
  const longerAvgVol =
    longerVolumes.reduce((s, v) => s + v, 0) / longerVolumes.length;
  const volumeRatio = longerAvgVol > 0 ? recentAvgVol / longerAvgVol : 1;
  const lowVolume = volumeRatio < 1.1;

  // Check if MA30 was recently higher (indicating it was in an uptrend before flattening = Phase 3)
  const validMA30 = ma30Values.filter((v) => !isNaN(v));
  const wasRecentlyHigher =
    validMA30.length >= 30 &&
    validMA30[validMA30.length - 30] > currentMA30 * 1.01;

  // Flat slope check
  const slopeFlat = Math.abs(slope) < 0.5;
  const slopeUp = slope > 0.5;
  const slopeDown = slope < -0.5;

  // Evaluate each phase with confidence scoring
  let phase: 1 | 2 | 3 | 4;
  let confidence: number;

  // Phase 2: Advancing
  if (slopeUp && priceAboveMA) {
    phase = 2;
    let criteria = 0;
    let total = 4;

    if (slopeUp) criteria++;
    if (priceAboveMA) criteria++;
    if (priceVsMa30Pct > 1) criteria++; // Price meaningfully above MA
    if (volumeRatio >= 1.0) criteria++; // Decent volume

    confidence = criteria / total;
  }
  // Phase 4: Declining
  else if (slopeDown && !priceAboveMA) {
    phase = 4;
    let criteria = 0;
    let total = 4;

    if (slopeDown) criteria++;
    if (!priceAboveMA) criteria++;
    if (priceVsMa30Pct < -1) criteria++; // Price meaningfully below MA
    if (volumeRatio >= 1.0) criteria++; // Selling volume present

    confidence = criteria / total;
  }
  // Phase 3: Topping / Distribution
  else if (slopeFlat && priceNearMA && wasRecentlyHigher) {
    phase = 3;
    let criteria = 0;
    let total = 4;

    if (slopeFlat) criteria++;
    if (priceNearMA) criteria++;
    if (wasRecentlyHigher) criteria++;
    if (!lowVolume) criteria++; // Higher volume during topping

    confidence = criteria / total;
  }
  // Phase 1: Basing / Accumulation
  else if (slopeFlat && priceNearMA) {
    phase = 1;
    let criteria = 0;
    let total = 4;

    if (slopeFlat) criteria++;
    if (priceNearMA) criteria++;
    if (lowVolume) criteria++;
    if (!wasRecentlyHigher) criteria++; // Was not recently in uptrend

    confidence = criteria / total;
  }
  // Edge cases: determine by slope + price position
  else if (slopeUp) {
    phase = 2;
    confidence = 0.4;
  } else if (slopeDown) {
    phase = 4;
    confidence = 0.4;
  } else if (priceAboveMA) {
    phase = wasRecentlyHigher ? 3 : 1;
    confidence = 0.35;
  } else {
    phase = wasRecentlyHigher ? 4 : 1;
    confidence = 0.3;
  }

  return {
    stage: phase,
    label: PHASE_LABELS[phase],
    description: PHASE_DESCRIPTIONS[phase],
    confidence: Math.round(confidence * 100) / 100,
    action: PHASE_ACTIONS[phase],
  };
}
