export interface OHLCVData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface WeinsteinPhase {
  stage: 1 | 2 | 3 | 4;
  label: string;
  description: string;
  confidence: number;
  action: 'BUY' | 'SELL' | 'HOLD' | 'WATCH';
}

export interface Signal {
  type: 'BUY' | 'SELL' | 'HOLD';
  source: string;
  strength: number;
  description: string;
}

export interface StockAnalysis {
  symbol: string;
  name: string;
  sector: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  ma30: number;
  ma50: number;
  ma200: number;
  phase: WeinsteinPhase;
  mansfieldRS: number;
  volumeRatio: number;
  avgVolume: number;
  currentVolume: number;
  opportunityScore: number;
  signals: Signal[];
  supportLevels: number[];
  resistanceLevels: number[];
  historicalData: OHLCVData[];
  priceVsMa30: number;
  priceVsMa50: number;
  priceVsMa200: number;
  ma30Slope: number;
  volumeExpanding: boolean;
  isPhase1To2Transition: boolean;
  isVCP: boolean;
  distanceTo52WeekHigh: number;
}

export interface SectorAnalysis {
  sector: string;
  stocks: StockAnalysis[];
  avgScore: number;
  phase2Count: number;
  phase4Count: number;
  topStock: StockAnalysis | null;
}

/**
 * Lightweight version of StockAnalysis for the scan endpoint.
 * Replaces the full `historicalData` array with a small `sparklineData`
 * array (last 30 data points) to drastically reduce payload size.
 */
export type StockAnalysisSummary = Omit<StockAnalysis, 'historicalData'> & {
  /** Last 30 data points for dashboard sparklines */
  sparklineData: OHLCVData[];
};

/**
 * Lightweight version of SectorAnalysis using StockAnalysisSummary.
 */
export interface SectorAnalysisSummary {
  sector: string;
  stocks: StockAnalysisSummary[];
  avgScore: number;
  phase2Count: number;
  phase4Count: number;
  topStock: StockAnalysisSummary | null;
}

export type Horizon = 'short' | 'medium' | 'long';

export interface FilterOptions {
  horizon: Horizon;
  sectors: string[];
  minScore: number;
  phases: number[];
  breakoutOnly: boolean;
  maBreakout: 'ma30' | 'ma50' | 'ma200' | 'any' | null;
  phase1To2TransitionOnly: boolean;
}
