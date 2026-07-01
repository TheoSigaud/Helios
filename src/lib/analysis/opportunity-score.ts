import type { OHLCVData, Signal, WeinsteinPhase, Horizon } from '@/lib/analysis/types';
import { calculateSMA, getLatestSMA, getMASlope, getBreakoutSignal } from '@/lib/analysis/moving-averages';
import { detectPhase } from '@/lib/analysis/weinstein-phases';
import { calculateMansfieldRS, getMansfieldRSSignal } from '@/lib/analysis/mansfield-rs';
import {
  calculateAverageVolume,
  getVolumeRatio,
  isVolumeExpanding,
  getVolumeSignal,
} from '@/lib/analysis/volume-analysis';
import { findSupportResistance } from '@/lib/analysis/support-resistance';

export interface OpportunityResult {
  score: number;
  signals: Signal[];
  phase: WeinsteinPhase;
  ma30: number;
  ma50: number;
  ma200: number;
  mansfieldRS: number;
  volumeRatio: number;
  avgVolume: number;
  supportLevels: number[];
  resistanceLevels: number[];
  ma30Slope: number;
  volumeExpanding: boolean;
  priceVsMa30: number;
  priceVsMa50: number;
  priceVsMa200: number;
}

/**
 * Horizon-specific parameters for adjusting analysis lookback periods.
 */
function getHorizonParams(horizon: Horizon) {
  switch (horizon) {
    case 'short':
      return { rsperiod: 50, srLookback: 60, maWeight: 1.2, breakoutWeight: 1.3 };
    case 'medium':
      return { rsperiod: 100, srLookback: 120, maWeight: 1.0, breakoutWeight: 1.0 };
    case 'long':
      return { rsperiod: 200, srLookback: 250, maWeight: 0.8, breakoutWeight: 0.7 };
  }
}

/**
 * Calculate the comprehensive opportunity score for a stock.
 *
 * Scoring breakdown (max 100 points):
 *   - Phase score:    25 pts  (Weinstein phase alignment)
 *   - RS score:       20 pts  (Mansfield relative strength)
 *   - MA score:       15 pts  (Moving average alignment)
 *   - Breakout score: 15 pts  (MA breakout signals)
 *   - Volume score:   15 pts  (Volume confirmation)
 *   - S/R score:      10 pts  (Support/resistance positioning)
 *
 * @param data - Stock OHLCV data (oldest first)
 * @param benchmarkData - Benchmark OHLCV data (oldest first)
 * @param horizon - Investment horizon ('short', 'medium', 'long')
 * @returns OpportunityResult with score, signals, and all computed metrics
 */
export function calculateOpportunityScore(
  data: OHLCVData[],
  benchmarkData: OHLCVData[],
  horizon: Horizon
): OpportunityResult {
  const signals: Signal[] = [];
  const params = getHorizonParams(horizon);

  if (data.length < 30) {
    return {
      score: 0,
      signals: [],
      phase: { stage: 1, label: 'Unknown', description: 'Insufficient data', confidence: 0, action: 'WATCH' },
      ma30: 0,
      ma50: 0,
      ma200: 0,
      mansfieldRS: 0,
      volumeRatio: 0,
      avgVolume: 0,
      supportLevels: [],
      resistanceLevels: [],
      ma30Slope: 0,
      volumeExpanding: false,
      priceVsMa30: 0,
      priceVsMa50: 0,
      priceVsMa200: 0,
    };
  }

  const closes = data.map((d) => d.close);
  const currentPrice = closes[closes.length - 1];

  // ── Moving Averages ──
  const ma30 = getLatestSMA(closes, 30);
  const ma50 = getLatestSMA(closes, 50);
  const ma200 = getLatestSMA(closes, 200);
  const ma30Values = calculateSMA(closes, 30);
  const ma30Slope = getMASlope(ma30Values, 10);

  const priceVsMa30 = ma30 > 0 ? ((currentPrice - ma30) / ma30) * 100 : 0;
  const priceVsMa50 = ma50 > 0 ? ((currentPrice - ma50) / ma50) * 100 : 0;
  const priceVsMa200 = ma200 > 0 ? ((currentPrice - ma200) / ma200) * 100 : 0;

  // ── Weinstein Phase ──
  const phase = detectPhase(data);

  // ── Mansfield RS ──
  const benchmarkCloses = benchmarkData.map((d) => d.close);
  const mansfieldRS = calculateMansfieldRS(closes, benchmarkCloses, params.rsperiod);
  const rsSignal = getMansfieldRSSignal(mansfieldRS);
  signals.push(rsSignal);

  // ── Volume ──
  const avgVolume = calculateAverageVolume(data, 20);
  const currentVolume = data[data.length - 1].volume;
  const volumeRatio = getVolumeRatio(currentVolume, avgVolume);
  const volumeExpanding = isVolumeExpanding(data, 5, 50);
  const volumeSignal = getVolumeSignal(data);
  signals.push(volumeSignal);

  // ── Support / Resistance ──
  const { supports: supportLevels, resistances: resistanceLevels } =
    findSupportResistance(data, params.srLookback);

  // ── Breakout Signals ──
  const breakout30 = getBreakoutSignal(data, 30);
  const breakout50 = getBreakoutSignal(data, 50);
  const breakout200 = getBreakoutSignal(data, 200);
  if (breakout30) signals.push(breakout30);
  if (breakout50) signals.push(breakout50);
  if (breakout200) signals.push(breakout200);

  // ════════════════════════════════════════════════
  //  SCORING
  // ════════════════════════════════════════════════

  // 1. Phase Score (max 25 pts)
  let phaseScore = 0;
  switch (phase.stage) {
    case 2:
      phaseScore = 25 * phase.confidence;
      break;
    case 1:
      phaseScore = 12 * phase.confidence; // Potential basing
      break;
    case 3:
      phaseScore = 5 * phase.confidence; // Caution
      break;
    case 4:
      phaseScore = 0; // Avoid
      break;
  }

  // Add phase signal
  signals.push({
    type: phase.action === 'BUY' ? 'BUY' : phase.action === 'SELL' ? 'SELL' : 'HOLD',
    source: 'Weinstein Phase',
    strength: phase.confidence,
    description: `${phase.label} (Stage ${phase.stage}) — ${phase.description.split('.')[0]}.`,
  });

  // 2. RS Score (max 20 pts)
  let rsScore = 0;
  if (mansfieldRS > 4) rsScore = 20;
  else if (mansfieldRS > 2) rsScore = 16;
  else if (mansfieldRS > 0) rsScore = 10 + (mansfieldRS / 2) * 6;
  else if (mansfieldRS > -2) rsScore = 5 + ((mansfieldRS + 2) / 2) * 5;
  else rsScore = Math.max(0, 5 + mansfieldRS);

  // 3. MA Score (max 15 pts)
  let maScore = 0;

  // Price above all MAs = fully bullish alignment
  if (currentPrice > ma30 && ma30 > 0) maScore += 4 * params.maWeight;
  if (currentPrice > ma50 && ma50 > 0) maScore += 4 * params.maWeight;
  if (currentPrice > ma200 && ma200 > 0) maScore += 4 * params.maWeight;

  // MA stacking (30 > 50 > 200) = bullish order
  if (ma30 > ma50 && ma50 > ma200 && ma200 > 0) maScore += 3 * params.maWeight;

  maScore = Math.min(15, maScore);

  // Add MA alignment signal
  const maAboveCount = [ma30, ma50, ma200].filter(
    (ma) => ma > 0 && currentPrice > ma
  ).length;
  signals.push({
    type: maAboveCount >= 2 ? 'BUY' : maAboveCount === 0 ? 'SELL' : 'HOLD',
    source: 'MA Alignment',
    strength: maAboveCount / 3,
    description: `Price above ${maAboveCount}/3 key moving averages.${
      ma30 > ma50 && ma50 > ma200 && ma200 > 0
        ? ' MAs in bullish stack (30 > 50 > 200).'
        : ''
    }`,
  });

  // 4. Breakout Score (max 15 pts)
  let breakoutScore = 0;
  const breakouts = [breakout30, breakout50, breakout200].filter(Boolean);
  if (breakouts.length > 0) {
    // More breakouts = stronger signal
    breakoutScore = Math.min(15, breakouts.length * 6 * params.breakoutWeight);
    // Bonus for MA200 breakout (most significant)
    if (breakout200) breakoutScore = Math.min(15, breakoutScore + 3);
  }

  // 5. Volume Score (max 15 pts)
  let volumeScore = 0;

  // Volume confirming direction
  if (volumeSignal.type === 'BUY') {
    volumeScore = 10 + volumeSignal.strength * 5;
  } else if (volumeSignal.type === 'HOLD') {
    volumeScore = 5;
  } else {
    // Selling volume is bad for a long opportunity
    volumeScore = 2;
  }

  // Bonus for expanding volume in an uptrend
  if (volumeExpanding && phase.stage === 2) {
    volumeScore = Math.min(15, volumeScore + 3);
  }

  volumeScore = Math.min(15, volumeScore);

  // 6. S/R Score (max 10 pts)
  let srScore = 5; // Neutral baseline

  if (supportLevels.length > 0) {
    const nearestSupport = supportLevels[0]; // Highest support (closest below price)
    const distToSupport = ((currentPrice - nearestSupport) / currentPrice) * 100;

    // Near support = good risk/reward
    if (distToSupport < 3) srScore += 3;
    else if (distToSupport < 5) srScore += 2;
    else srScore += 1;
  }

  if (resistanceLevels.length > 0) {
    const nearestResistance = resistanceLevels[0]; // Lowest resistance (closest above price)
    const distToResistance =
      ((nearestResistance - currentPrice) / currentPrice) * 100;

    // Far from resistance = more upside room
    if (distToResistance > 10) srScore += 2;
    else if (distToResistance > 5) srScore += 1;
    // Very close to resistance = ceiling concern, subtract
    else if (distToResistance < 2) srScore -= 2;
  }

  srScore = Math.max(0, Math.min(10, srScore));

  // ── Total Score ──
  const totalScore = Math.round(
    Math.max(0, Math.min(100, phaseScore + rsScore + maScore + breakoutScore + volumeScore + srScore))
  );

  return {
    score: totalScore,
    signals,
    phase,
    ma30,
    ma50,
    ma200,
    mansfieldRS,
    volumeRatio,
    avgVolume,
    supportLevels,
    resistanceLevels,
    ma30Slope,
    volumeExpanding,
    priceVsMa30,
    priceVsMa50,
    priceVsMa200,
  };
}
