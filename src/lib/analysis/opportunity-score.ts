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
 *   1. Phase score:         25 pts  (Weinstein phase alignment)
 *   2. RS score:            15 pts  (Mansfield relative strength)
 *   3. Trend Template:      15 pts  (Minervini 7-criteria trend template)
 *   4. Volume score:        10 pts  (Volume confirmation)
 *   5. Breakout score:      10 pts  (MA breakout signals)
 *   6. S/R score:           10 pts  (Support/resistance positioning)
 *   7. VCP bonus:            8 pts  (Volatility Contraction Pattern quality)
 *   8. Entry bonus:          7 pts  (Phase 1→2 transition OR MA30 pullback)
 *
 * Penalties (subtracted from total):
 *   - Phase 4 confirmed:        -20 pts
 *   - Phase 3 distribution:     -10 pts
 *   - Climax run (>25% above MA30): -15 pts
 *   - Fading momentum (Phase 2→3 transition): -10 pts
 *   - Market (SPY) in Phase 4:  -15 pts
 *   - Market (SPY) in Phase 1/3: -5 pts
 *
 * @param data - Stock OHLCV data (weekly bars, oldest first)
 * @param benchmarkData - Benchmark OHLCV data (weekly bars, oldest first)
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
  // MA30 = 30 weekly periods (Weinstein's primary 30-week MA)
  // ma10w = 10 weekly periods (~50 daily, used for Minervini Trend Template)
  // ma40w = 40 weekly periods (~200 daily, used for Minervini Trend Template)
  const ma30 = getLatestSMA(closes, 30);
  const ma10w = getLatestSMA(closes, 10);
  const ma40w = getLatestSMA(closes, 40);
  const ma30Values = calculateSMA(closes, 30);
  const ma30Slope = getMASlope(ma30Values, 10);

  // Calculate MA40w slope (needed for Trend Template: MA200 must be rising)
  const ma40wValues = calculateSMA(closes, 40);
  const ma40wSlope = getMASlope(ma40wValues, 4); // Rising over ~1 month (4 weeks)

  const priceVsMa30 = ma30 > 0 ? ((currentPrice - ma30) / ma30) * 100 : 0;
  const priceVsMa10w = ma10w > 0 ? ((currentPrice - ma10w) / ma10w) * 100 : 0;
  const priceVsMa40w = ma40w > 0 ? ((currentPrice - ma40w) / ma40w) * 100 : 0;

  // ── Weinstein Phase ──
  const phase = detectPhase(data);

  // ── Market Phase (SPY/Benchmark) ──
  const marketPhase = detectPhase(benchmarkData);

  // ── Mansfield RS ──
  const benchmarkCloses = benchmarkData.map((d) => d.close);
  const mansfieldRS = calculateMansfieldRS(closes, benchmarkCloses, params.rsperiod);
  const rsSignal = getMansfieldRSSignal(mansfieldRS);
  signals.push(rsSignal);

  // ── Volume (10-week average) ──
  const avgVolume = calculateAverageVolume(data, 10);
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
  const breakout10w = getBreakoutSignal(data, 10);
  const breakout40w = getBreakoutSignal(data, 40);
  if (breakout30) signals.push(breakout30);
  if (breakout10w) signals.push(breakout10w);
  if (breakout40w) signals.push(breakout40w);

  // ── VCP & 52-Week High (Minervini Trend Template) ──
  const vcpResult = detectVCP(data, 14, 30);

  // Calculate 52-week high (approx 52 weekly bars)
  const lookback52w = Math.min(data.length, 52);
  const data52w = data.slice(-lookback52w);
  const high52Week = Math.max(...data52w.map(d => d.high));
  const distanceTo52WeekHigh = high52Week > 0 ? ((high52Week - currentPrice) / high52Week) * 100 : 0;

  // Calculate 52-week low (for Trend Template)
  const low52Week = Math.min(...data52w.map(d => d.low));
  const distanceFrom52WeekLow = low52Week > 0 ? ((currentPrice - low52Week) / low52Week) * 100 : 0;

  // ════════════════════════════════════════════════
  //  SCORING (max 100 points)
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
      phaseScore = 3 * phase.confidence; // Caution
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

  // 3. Trend Template Score — Minervini 7 Criteria (max 15 pts)
  let trendTemplateCriteria = 0;

  // Criterion 1: Price above MA30w (~150 daily)
  if (currentPrice > ma30 && ma30 > 0) trendTemplateCriteria++;
  // Criterion 2: Price above MA40w (~200 daily)
  if (currentPrice > ma40w && ma40w > 0) trendTemplateCriteria++;
  // Criterion 3: MA30w > MA40w (bullish alignment)
  if (ma30 > ma40w && ma40w > 0) trendTemplateCriteria++;
  // Criterion 4: MA40w has been trending upward (~1 month)
  if (ma40wSlope > 0) trendTemplateCriteria++;
  // Criterion 5: Price above MA10w (~50 daily)
  if (currentPrice > ma10w && ma10w > 0) trendTemplateCriteria++;
  // Criterion 6: Within 25% of 52-week high
  if (distanceTo52WeekHigh <= 25) trendTemplateCriteria++;
  // Criterion 7: At least 30% above 52-week low
  if (distanceFrom52WeekLow >= 30) trendTemplateCriteria++;

  const trendTemplateScore = Math.round((trendTemplateCriteria / 7) * 15);

  // Add Trend Template signal
  signals.push({
    type: trendTemplateCriteria >= 5 ? 'BUY' : trendTemplateCriteria >= 3 ? 'HOLD' : 'SELL',
    source: 'Trend Template (Minervini)',
    strength: trendTemplateCriteria / 7,
    description: `${trendTemplateCriteria}/7 Minervini criteria met.${
      trendTemplateCriteria >= 5
        ? ' Strong trend template confirmation.'
        : trendTemplateCriteria >= 3
          ? ' Partial trend alignment.'
          : ' Weak trend structure.'
    }`,
  });

  // 4. Volume Score (max 10 pts)
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

  // 5. Breakout Score (max 10 pts)
  let breakoutScore = 0;
  const breakouts = [breakout30, breakout10w, breakout40w].filter(Boolean);
  if (breakouts.length > 0) {
    // More breakouts = stronger signal
    breakoutScore = Math.min(10, breakouts.length * 4 * params.breakoutWeight);
    // Bonus for MA40w breakout (most significant — equivalent to MA200 daily)
    if (breakout40w) breakoutScore = Math.min(10, breakoutScore + 2);
  }

  // Add MA alignment signal
  const maAboveCount = [ma30, ma10w, ma40w].filter(
    (ma) => ma > 0 && currentPrice > ma
  ).length;
  signals.push({
    type: maAboveCount >= 2 ? 'BUY' : maAboveCount === 0 ? 'SELL' : 'HOLD',
    source: 'MA Alignment',
    strength: maAboveCount / 3,
    description: `Price above ${maAboveCount}/3 key moving averages (MA30w, MA10w, MA40w).${
      ma30 > ma10w && ma10w > 0 && ma30 > ma40w && ma40w > 0
        ? ' MAs in bullish alignment.'
        : ''
    }`,
  });

  // 6. S/R Score (Pivot Point Breakout) (max 10 pts)
  let srScore = 0;

  if (resistanceLevels.length > 0) {
    const nearestResistance = resistanceLevels[0]; // Lowest resistance (closest above price or just broken)
    
    // Check if price is breaking through resistance
    const distFromResistance = ((currentPrice - nearestResistance) / nearestResistance) * 100;
    
    if (distFromResistance >= 0 && distFromResistance < 3 && volumeSignal.type === 'BUY') {
      // Pivot Point Breakout! Breaking resistance with volume.
      srScore = 10;
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

  // 7. VCP Bonus — Progressive (max 8 pts)
  let vcpScore = 0;
  if (vcpResult.detected) {
    vcpScore = Math.round(vcpResult.quality * 8);
    signals.push({
      type: 'BUY',
      source: 'Volatility Contraction (VCP)',
      strength: vcpResult.quality,
      description: `VCP detected: ${vcpResult.contractions} successive contractions (quality: ${Math.round(vcpResult.quality * 100)}%).`,
    });
  }

  // 8. Entry Bonus — Phase 1→2 Transition OR Pullback to MA30 (max 7 pts)
  let entryBonus = 0;

  // Perfect Weinstein buy signal: Price breaks out of MA30 on volume, while the MA30 slope is flat or just starting to turn up.
  const isPhase1To2Transition = breakout30 !== null && ma30Slope >= -0.5 && ma30Slope <= 1.5;

  // Pullback buy signal: Price pulling back to MA30 in Phase 2, with declining volume (healthy retest)
  const isPullbackEntry = phase.stage === 2
    && priceVsMa30 > 0 && priceVsMa30 < 5
    && ma30Slope > 1.0
    && !volumeExpanding;

  if (isPhase1To2Transition) {
    entryBonus = 7;
    signals.push({
      type: 'BUY',
      source: 'Phase 1 -> 2 Transition',
      strength: 1,
      description: 'Ideal Weinstein Buy: Breakout of MA30 with volume from a flat/basing MA30.',
    });
  } else if (isPullbackEntry) {
    entryBonus = 7;
    signals.push({
      type: 'BUY',
      source: 'Pullback to MA30',
      strength: 0.9,
      description: 'Healthy pullback to rising MA30 in Phase 2 with declining volume. Ideal re-entry point.',
    });
  }

  // ════════════════════════════════════════════════
  //  PENALTIES
  // ════════════════════════════════════════════════

  // 9. Late Phase 2 / Climax Penalty
  let latePhasePenalty = 0;
  if (phase.stage === 2) {
    if (priceVsMa30 > 25) {
      // Climax run / overextended
      latePhasePenalty = 15;
      signals.push({
        type: 'SELL',
        source: 'Climax Run',
        strength: 0.8,
        description: 'Price is excessively far above MA30 (>25%). High risk of sharp pullback.',
      });
    }
  }

  // 10. Phase 3 & Phase 4 Bearish Penalties
  let bearishPenalty = 0;
  if (phase.stage === 4) {
    bearishPenalty = 20;
    signals.push({
      type: 'SELL',
      source: 'Phase 4 Decline',
      strength: 0.9,
      description: 'Stock is in Phase 4 (declining). Price below falling MA30. Avoid long positions.',
    });
  } else if (phase.stage === 3 && volumeExpanding && volumeRatio > 1.2) {
    bearishPenalty = 10;
    signals.push({
      type: 'SELL',
      source: 'Phase 3 Distribution',
      strength: 0.7,
      description: 'Phase 3 topping with increasing volume suggests institutional distribution.',
    });
  }

  // 11. Market Trend Penalty (SPY phase)
  let marketPenalty = 0;
  if (marketPhase.stage === 4) {
    marketPenalty = 15;
    signals.push({
      type: 'SELL',
      source: 'Market Trend',
      strength: 0.8,
      description: 'Overall market (benchmark) is in Phase 4 decline. Most stocks follow the market trend.',
    });
  } else if (marketPhase.stage === 1 || marketPhase.stage === 3) {
    marketPenalty = 5;
    signals.push({
      type: 'HOLD',
      source: 'Market Trend',
      strength: 0.4,
      description: `Overall market is in Phase ${marketPhase.stage} (${marketPhase.stage === 1 ? 'basing' : 'topping'}). Exercise caution.`,
    });
  }

  // ── Total Score ──
  const totalPenalties = latePhasePenalty + bearishPenalty + marketPenalty;
  const totalScore = Math.round(
    Math.max(0, Math.min(100,
      phaseScore + rsScore + trendTemplateScore + volumeScore +
      breakoutScore + srScore + vcpScore + entryBonus - totalPenalties
    ))
  );

  return {
    score: totalScore,
    signals,
    phase,
    ma30,
    ma50: ma10w,   // Externally named ma50 for UI compatibility (~50 daily equivalent)
    ma200: ma40w,  // Externally named ma200 for UI compatibility (~200 daily equivalent)
    mansfieldRS,
    volumeRatio,
    avgVolume,
    supportLevels,
    resistanceLevels,
    ma30Slope,
    volumeExpanding,
    priceVsMa30,
    priceVsMa50: priceVsMa10w,   // Keep UI field name for compatibility
    priceVsMa200: priceVsMa40w,  // Keep UI field name for compatibility
    isPhase1To2Transition,
    isVCP: vcpResult.detected,
    distanceTo52WeekHigh,
  };
}
