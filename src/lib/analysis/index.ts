import type {
  OHLCVData,
  StockAnalysis,
  SectorAnalysis,
  Horizon,
  Signal,
  WeinsteinPhase,
  FilterOptions,
} from '@/lib/analysis/types';
import { calculateOpportunityScore } from '@/lib/analysis/opportunity-score';

// ── Re-export all types ──
export type {
  OHLCVData,
  StockAnalysis,
  SectorAnalysis,
  Horizon,
  Signal,
  WeinsteinPhase,
  FilterOptions,
};

// ── Re-export module functions ──
export { calculateSMA, getLatestSMA, getMASlope, getBreakoutSignal } from '@/lib/analysis/moving-averages';
export { detectPhase } from '@/lib/analysis/weinstein-phases';
export { calculateMansfieldRS, getMansfieldRSSignal } from '@/lib/analysis/mansfield-rs';
export {
  calculateAverageVolume,
  getVolumeRatio,
  isVolumeExpanding,
  getVolumeSignal,
} from '@/lib/analysis/volume-analysis';
export { findSupportResistance } from '@/lib/analysis/support-resistance';
export { calculateOpportunityScore } from '@/lib/analysis/opportunity-score';

/**
 * Analyze a single stock with all technical analysis modules.
 *
 * @param symbol - Stock ticker symbol
 * @param name - Company name
 * @param sector - Sector classification
 * @param data - Stock OHLCV data (oldest first)
 * @param benchmarkData - Benchmark OHLCV data (oldest first)
 * @param horizon - Investment horizon
 * @returns Complete StockAnalysis object
 */
export function analyzeStock(
  symbol: string,
  name: string,
  sector: string,
  data: OHLCVData[],
  benchmarkData: OHLCVData[],
  horizon: Horizon
): StockAnalysis {
  if (data.length < 2) {
    return createEmptyAnalysis(symbol, name, sector, data);
  }

  const currentBar = data[data.length - 1];
  const prevBar = data[data.length - 2];
  const currentPrice = currentBar.close;
  const previousClose = prevBar.close;
  const change = currentPrice - previousClose;
  const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

  const result = calculateOpportunityScore(data, benchmarkData, horizon);

  return {
    symbol,
    name,
    sector,
    currentPrice,
    previousClose,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    ma30: result.ma30,
    ma50: result.ma50,
    ma200: result.ma200,
    phase: result.phase,
    mansfieldRS: result.mansfieldRS,
    volumeRatio: result.volumeRatio,
    avgVolume: result.avgVolume,
    currentVolume: currentBar.volume,
    opportunityScore: result.score,
    signals: result.signals,
    supportLevels: result.supportLevels,
    resistanceLevels: result.resistanceLevels,
    historicalData: data,
    priceVsMa30: Math.round(result.priceVsMa30 * 100) / 100,
    priceVsMa50: Math.round(result.priceVsMa50 * 100) / 100,
    priceVsMa200: Math.round(result.priceVsMa200 * 100) / 100,
    ma30Slope: Math.round(result.ma30Slope * 100) / 100,
    volumeExpanding: result.volumeExpanding,
    isPhase1To2Transition: result.isPhase1To2Transition,
  };
}

/**
 * Analyze a universe of stocks and return results sorted by opportunity score (descending).
 *
 * @param stocks - Array of stock data objects
 * @param benchmarkData - Benchmark OHLCV data
 * @param horizon - Investment horizon
 * @returns Array of StockAnalysis sorted by opportunity score descending
 */
export function analyzeUniverse(
  stocks: { symbol: string; name: string; sector: string; data: OHLCVData[] }[],
  benchmarkData: OHLCVData[],
  horizon: Horizon
): StockAnalysis[] {
  const analyses = stocks.map((stock) =>
    analyzeStock(stock.symbol, stock.name, stock.sector, stock.data, benchmarkData, horizon)
  );

  return analyses.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

/**
 * Group analyzed stocks by sector and compute sector-level statistics.
 *
 * @param analyses - Array of StockAnalysis objects
 * @returns Array of SectorAnalysis sorted by average score descending
 */
export function groupBySector(analyses: StockAnalysis[]): SectorAnalysis[] {
  const sectorMap = new Map<string, StockAnalysis[]>();

  for (const analysis of analyses) {
    const existing = sectorMap.get(analysis.sector);
    if (existing) {
      existing.push(analysis);
    } else {
      sectorMap.set(analysis.sector, [analysis]);
    }
  }

  const sectors: SectorAnalysis[] = [];

  for (const [sector, stocks] of sectorMap.entries()) {
    const avgScore =
      stocks.length > 0
        ? Math.round(
            stocks.reduce((sum, s) => sum + s.opportunityScore, 0) / stocks.length
          )
        : 0;

    const phase2Count = stocks.filter((s) => s.phase.stage === 2).length;
    const phase4Count = stocks.filter((s) => s.phase.stage === 4).length;

    // Sort stocks within sector by score descending
    const sortedStocks = [...stocks].sort(
      (a, b) => b.opportunityScore - a.opportunityScore
    );

    sectors.push({
      sector,
      stocks: sortedStocks,
      avgScore,
      phase2Count,
      phase4Count,
      topStock: sortedStocks.length > 0 ? sortedStocks[0] : null,
    });
  }

  return sectors.sort((a, b) => b.avgScore - a.avgScore);
}

/**
 * Create an empty/default analysis for a stock with insufficient data.
 */
function createEmptyAnalysis(
  symbol: string,
  name: string,
  sector: string,
  data: OHLCVData[]
): StockAnalysis {
  const currentPrice = data.length > 0 ? data[data.length - 1].close : 0;
  const currentVolume = data.length > 0 ? data[data.length - 1].volume : 0;

  return {
    symbol,
    name,
    sector,
    currentPrice,
    previousClose: 0,
    change: 0,
    changePercent: 0,
    ma30: 0,
    ma50: 0,
    ma200: 0,
    phase: {
      stage: 1,
      label: 'Unknown',
      description: 'Insufficient data for analysis.',
      confidence: 0,
      action: 'WATCH',
    },
    mansfieldRS: 0,
    volumeRatio: 0,
    avgVolume: 0,
    currentVolume,
    opportunityScore: 0,
    signals: [],
    supportLevels: [],
    resistanceLevels: [],
    historicalData: data,
    priceVsMa30: 0,
    priceVsMa50: 0,
    priceVsMa200: 0,
    ma30Slope: 0,
    volumeExpanding: false,
    isPhase1To2Transition: false,
  };
}
