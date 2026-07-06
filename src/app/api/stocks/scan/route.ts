// ---------------------------------------------------------------------------
// GET /api/stocks/scan – Scan the universe and return ranked results
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Horizon, StockAnalysis, StockAnalysisSummary, SectorAnalysisSummary } from '@/lib/analysis/types';
import { analyzeUniverse } from '@/lib/analysis';
import { getAllStocksData, getBenchmarksData } from '@/lib/data/data-provider';
import { DEFAULT_STOCKS, MARKET_BENCHMARKS } from '@/lib/data/stock-universe';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// In-memory analysis cache
// ---------------------------------------------------------------------------

/** Cached analysis results to avoid re-reading disk + recalculating on every request. */
interface AnalysisCacheEntry {
  timestamp: number;
  results: StockAnalysis[];
}

const ANALYSIS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const analysisCache = new Map<string, AnalysisCacheEntry>();

/**
 * Convert a StockAnalysis to a lightweight summary by replacing
 * the full historicalData with a small sparkline subset.
 */
function toSummary(stock: StockAnalysis): StockAnalysisSummary {
  const { historicalData, ...rest } = stock;
  return {
    ...rest,
    sparklineData: historicalData.slice(-30),
  };
}

/**
 * Group summaries by sector (mirroring groupBySector but for summaries).
 */
function groupSummariesBySector(summaries: StockAnalysisSummary[]): SectorAnalysisSummary[] {
  const sectorMap = new Map<string, StockAnalysisSummary[]>();

  for (const analysis of summaries) {
    const existing = sectorMap.get(analysis.sector);
    if (existing) {
      existing.push(analysis);
    } else {
      sectorMap.set(analysis.sector, [analysis]);
    }
  }

  const sectors: SectorAnalysisSummary[] = [];

  for (const [sector, stocks] of sectorMap.entries()) {
    const avgScore =
      stocks.length > 0
        ? Math.round(
            stocks.reduce((sum, s) => sum + s.opportunityScore, 0) / stocks.length
          )
        : 0;

    const phase2Count = stocks.filter((s) => s.phase.stage === 2).length;
    const phase4Count = stocks.filter((s) => s.phase.stage === 4).length;

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // ── Parse query parameters ──────────────────────────────────────────
    const horizon = (searchParams.get('horizon') as Horizon) ?? 'medium';
    const sectorsParam = searchParams.get('sectors');
    const minScore = searchParams.get('minScore')
      ? parseFloat(searchParams.get('minScore')!)
      : 0;
    const phasesParam = searchParams.get('phases');
    const breakoutOnly = searchParams.get('breakoutOnly') === 'true';
    const maBreakout = searchParams.get('maBreakout');
    const phase1To2TransitionOnly = searchParams.get('phase1To2TransitionOnly') === 'true';

    // Validate horizon
    const validHorizons: Horizon[] = ['short', 'medium', 'long'];
    if (!validHorizons.includes(horizon)) {
      return NextResponse.json(
        { error: `Invalid horizon. Must be one of: ${validHorizons.join(', ')}` },
        { status: 400 },
      );
    }

    // Parse and validate sectors filter
    let selectedSectors: string[] = [];
    if (sectorsParam) {
      selectedSectors = sectorsParam.split(',').map((s) => s.trim());
    }

    // Parse phases filter
    let selectedPhases: number[] = [1, 2, 3, 4];
    if (phasesParam) {
      selectedPhases = phasesParam.split(',').map(Number).filter((n) => n >= 1 && n <= 4);
    }

    // ── Determine which symbols to scan ─────────────────────────────────
    let stocksToScan = DEFAULT_STOCKS;
    if (selectedSectors.length > 0) {
      stocksToScan = DEFAULT_STOCKS.filter((s) =>
        selectedSectors.includes(s.sector),
      );
    }
    const symbols = stocksToScan.map((s) => s.symbol);

    // ── Check in-memory cache ───────────────────────────────────────────
    const cacheKey = `${horizon}`;
    const cached = analysisCache.get(cacheKey);
    let results: StockAnalysis[];

    if (cached && Date.now() - cached.timestamp < ANALYSIS_CACHE_TTL_MS) {
      // Use cached results — filter by the requested symbols
      const symbolSet = new Set(symbols);
      results = cached.results.filter((r) => symbolSet.has(r.symbol));
    } else {
      // ── Fetch data (parallel disk reads) ────────────────────────────────
      const benchmarkSymbols = Array.from(new Set(Object.values(MARKET_BENCHMARKS)));
      const [allStocksData, benchmarkDataMap] = await Promise.all([
        getAllStocksData(symbols),
        getBenchmarksData(benchmarkSymbols),
      ]);

      // ── Run analysis ────────────────────────────────────────────────────
      const stockInputs = stocksToScan.map((stock) => ({
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector,
        market: stock.market,
        data: allStocksData[stock.symbol] || [],
      }));

      results = analyzeUniverse(stockInputs, benchmarkDataMap, horizon);

      // ── Store in memory cache ───────────────────────────────────────────
      analysisCache.set(cacheKey, {
        timestamp: Date.now(),
        results,
      });
    }

    // ── Apply filters ───────────────────────────────────────────────────
    let filtered = results.filter((r) => r.opportunityScore >= minScore);
    filtered = filtered.filter((r) => selectedPhases.includes(r.phase.stage));
    
    if (breakoutOnly) {
      filtered = filtered.filter((r) => r.signals.some(s => s.source.includes('Breakout')));
    }
    
    if (maBreakout) {
      filtered = filtered.filter((r) => r.signals.some(s => s.source.includes(`MA${maBreakout.replace('ma', '')} Breakout`)));
    }
    
    if (phase1To2TransitionOnly) {
      filtered = filtered.filter((r) => r.isPhase1To2Transition);
    }

    // ── Convert to lightweight summaries (strip historicalData) ──────────
    const summaries = filtered.map(toSummary);

    // ── Group by sector ─────────────────────────────────────────────────
    const sectorBreakdown = groupSummariesBySector(summaries);

    return NextResponse.json({
      stocks: summaries,
      sectors: sectorBreakdown,
      meta: {
        totalScanned: symbols.length,
        totalResults: summaries.length,
        horizon,
        selectedSectors: selectedSectors.length > 0 ? selectedSectors : 'all',
        minScore,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[/api/stocks/scan] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to scan stocks',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
