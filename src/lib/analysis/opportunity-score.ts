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
import { detectVCP } from '@/lib/analysis/volatility';

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
  isPhase1To2Transition: boolean;
  isVCP: boolean;
  distanceTo52WeekHigh: number;
}

/**
 * Horizon-specific parameters for adjusting analysis lookback periods.
 */
function getHorizonParams(horizon: Horizon) {
  switch (horizon) {
    case 'short':
      return { rsperiod: 10, srLookback: 12, maWeight: 1.2, breakoutWeight: 1.3 };
    case 'medium':
      return { rsperiod: 20, srLookback: 24, maWeight: 1.0, breakoutWeight: 1.0 };
    case 'long':
      return { rsperiod: 40, srLookback: 50, maWeight: 0.8, breakoutWeight: 0.7 };
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
      isPhase1To2Transition: false,
      isVCP: false,
      distanceTo52WeekHigh: 100,
    };
  }

  const closes = data.map((d) => d.close);
  const currentPrice = closes[closes.length - 1];

  // ── Moving Averages ──
  const ma30 = getLatestSMA(closes, 30);
  const ma50 = getLatestSMA(closes, 10);
  const ma200 = getLatestSMA(closes, 40);
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
  const avgVolume = calculateAverageVolume(data, 4);
  const currentVolume = data[data.length - 1].volume;
  const volumeRatio = getVolumeRatio(currentVolume, avgVolume);
  const volumeExpanding = isVolumeExpanding(data, 2, 10);
  const volumeSignal = getVolumeSignal(data);
  signals.push(volumeSignal);

  // ── Support / Resistance ──
  const { supports: supportLevels, resistances: resistanceLevels } =
    findSupportResistance(data, params.srLookback);

  // ── Breakout Signals ──
  const breakout30 = getBreakoutSignal(data, 30);
  const breakout50 = getBreakoutSignal(data, 10);
  const breakout200 = getBreakoutSignal(data, 40);
  if (breakout30) signals.push(breakout30);
  if (breakout50) signals.push(breakout50);
  if (breakout200) signals.push(breakout200);

  // ── VCP & 52-Week High (Minervini Trend Template) ──
  const isVCP = detectVCP(data, 14, 20);
  
  // Calculate 52-week high (approx 252 trading days)
  const lookback52w = Math.min(data.length, 252);
  const data52w = data.slice(-lookback52w);
  const high52Week = Math.max(...data52w.map(d => d.high));
  const distanceTo52WeekHigh = high52Week > 0 ? ((high52Week - currentPrice) / high52Week) * 100 : 0;

  // ════════════════════════════════════════════════
  //  SCORING
  // ════════════════════════════════════════════════

  // 1. Phase Score (max 20 pts)
  let phaseScore = 0;
  switch (phase.stage) {
    case 2:
      phaseScore = 20 * phase.confidence;
      break;
    case 1:
      phaseScore = 10 * phase.confidence; // Potential basing
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

  // 2. RS Score (max 15 pts)
  let rsScore = 0;
  if (mansfieldRS > 4) rsScore = 15;
  else if (mansfieldRS > 2) rsScore = 12;
  else if (mansfieldRS > 0) rsScore = 8 + (mansfieldRS / 2) * 4;
  else if (mansfieldRS > -2) rsScore = 3 + ((mansfieldRS + 2) / 2) * 5;
  else rsScore = Math.max(0, 3 + mansfieldRS);

  // 3. MA Score (max 10 pts)
  let maScore = 0;

  // Price above all MAs = fully bullish alignment
  if (currentPrice > ma30 && ma30 > 0) maScore += 3 * params.maWeight;
  if (currentPrice > ma50 && ma50 > 0) maScore += 3 * params.maWeight;
  if (currentPrice > ma200 && ma200 > 0) maScore += 2 * params.maWeight;

  // MA stacking (30 > 50 > 200) = bullish order
  if (ma30 > ma50 && ma50 > ma200 && ma200 > 0) maScore += 2 * params.maWeight;

  maScore = Math.min(10, maScore);

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

  // 4. Breakout Score (max 10 pts)
  let breakoutScore = 0;
  const breakouts = [breakout30, breakout50, breakout200].filter(Boolean);
  if (breakouts.length > 0) {
    // More breakouts = stronger signal
    breakoutScore = Math.min(10, breakouts.length * 4 * params.breakoutWeight);
    // Bonus for MA200 breakout (most significant)
    if (breakout200) breakoutScore = Math.min(10, breakoutScore + 2);
  }

  // 5. Volume Score (max 10 pts)
  let volumeScore = 0;

  // Volume confirming direction
  if (volumeSignal.type === 'BUY') {
    volumeScore = 7 + volumeSignal.strength * 3;
  } else if (volumeSignal.type === 'HOLD') {
    volumeScore = 4;
  } else {
    // Selling volume is bad for a long opportunity
    volumeScore = 1;
  }

  // Bonus for expanding volume in an uptrend
  if (volumeExpanding && phase.stage === 2) {
    volumeScore = Math.min(10, volumeScore + 2);
  }

  volumeScore = Math.min(10, volumeScore);

  // 6. S/R Score (Pivot Point Breakout) (max 10 pts)
  let srScore = 0; 
  let isPivotPointBreakout = false;

  if (resistanceLevels.length > 0) {
    const nearestResistance = resistanceLevels[0]; // Lowest resistance (closest above price or just broken)
    
    // Check if price is breaking through resistance (current price > resistance, but close enough)
    const distFromResistance = ((currentPrice - nearestResistance) / nearestResistance) * 100;
    
    if (distFromResistance >= 0 && distFromResistance < 3 && volumeSignal.type === 'BUY') {
      // Pivot Point Breakout! Breaking resistance with volume.
      srScore = 10;
      isPivotPointBreakout = true;
      signals.push({
        type: 'BUY',
        source: 'Pivot Point Breakout',
        strength: 1,
        description: 'Price is breaking through key resistance with expanding volume.',
      });
    } else if (distFromResistance < 0 && distFromResistance > -3) {
      // Very close to resistance, potential breakout soon
      srScore = 4;
    } else if (distFromResistance < -10) {
      // Far from resistance = more upside room, but no immediate trigger
      srScore = 5;
    } else {
      srScore = 2;
    }
  } else {
    // No resistance found, blue sky breakout potential
    srScore = 8;
  }
  
  if (supportLevels.length > 0 && srScore < 10) {
    const nearestSupport = supportLevels[0]; 
    const distToSupport = ((currentPrice - nearestSupport) / currentPrice) * 100;
    // Near support = good risk/reward
    if (distToSupport > 0 && distToSupport < 3) srScore = Math.max(srScore, 6);
  }

  srScore = Math.max(0, Math.min(10, srScore));

  // 7. Trend Template Score (Proximity to 52w High) (max 10 pts)
  let trendTemplateScore = 0;
  if (distanceTo52WeekHigh <= 10) {
    trendTemplateScore = 10; // At or very close to 52w high
  } else if (distanceTo52WeekHigh <= 25) {
    trendTemplateScore = 7; // Within 25% of 52w high (Minervini criteria)
  } else if (distanceTo52WeekHigh <= 40) {
    trendTemplateScore = 3;
  }

  // 8. Volatility Contraction Pattern (VCP) Bonus (max 15 pts)
  let vcpScore = 0;
  if (isVCP) {
    vcpScore = 15;
    signals.push({
      type: 'BUY',
      source: 'Volatility Contraction (VCP)',
      strength: 1,
      description: 'Volatility has contracted and volume dried up prior to this move (Minervini VCP).',
    });
  }

  // 7. Phase 1 to 2 Transition Bonus (max 20 pts)
  let transitionBonus = 0;
  // Perfect Weinstein buy signal: Price breaks out of MA30 on volume, while the MA30 slope is flat or just starting to turn up.
  const isPhase1To2Transition = breakout30 !== null && ma30Slope >= -0.5 && ma30Slope <= 1.5;

  if (isPhase1To2Transition) {
    transitionBonus = 20;
    signals.push({
      type: 'BUY',
      source: 'Phase 1 -> 2 Transition',
      strength: 1,
      description: 'Ideal Weinstein Buy: Breakout of MA30 with volume from a flat/basing MA30.',
    });
  }

  // 8. Late Phase 2 Penalty
  let latePhasePenalty = 0;
  if (phase.stage === 2) {
    if (priceVsMa30 > 25) {
      // Climax run / overextended
      latePhasePenalty = 20;
      signals.push({
        type: 'SELL',
        source: 'Late Phase 2',
        strength: 0.8,
        description: 'Price is excessively far above MA30 (Climax). High risk of sharp pullback.',
      });
    } else if (ma30Slope > 0 && ma30Slope < 1.5 && priceVsMa30 < 5) {
      // Losing momentum, nearing Phase 3
      latePhasePenalty = 15;
      signals.push({
        type: 'SELL',
        source: 'Late Phase 2',
        strength: 0.7,
        description: 'Momentum is fading. MA30 is flattening and price is nearing the average. Risk of Phase 3.',
      });
    }
  }

  // ── Total Score ──
  const totalScore = Math.round(
    Math.max(0, Math.min(100, phaseScore + rsScore + maScore + breakoutScore + volumeScore + srScore + trendTemplateScore + vcpScore + transitionBonus - latePhasePenalty))
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
    isPhase1To2Transition,
    isVCP,
    distanceTo52WeekHigh,
  };
}
