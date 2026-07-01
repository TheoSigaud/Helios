// ---------------------------------------------------------------------------
// GET /api/stocks/scan – Scan the universe and return ranked results
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Horizon, StockAnalysis } from '@/lib/analysis/types';
import { analyzeUniverse, groupBySector } from '@/lib/analysis';
import { getAllStocksData, getBenchmarkData } from '@/lib/data/data-provider';
import { DEFAULT_STOCKS, SECTORS, type SectorName } from '@/lib/data/stock-universe';

export const dynamic = 'force-dynamic';

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

    // ── Fetch data ──────────────────────────────────────────────────────
    const [allStocksData, benchmarkData] = await Promise.all([
      getAllStocksData(symbols),
      getBenchmarkData(),
    ]);

    // ── Run analysis ────────────────────────────────────────────────────
    const stockInputs = stocksToScan.map((stock) => ({
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      data: allStocksData[stock.symbol] || [],
    }));

    const results = analyzeUniverse(stockInputs, benchmarkData, horizon);

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

    // ── Group by sector ─────────────────────────────────────────────────
    const sectorBreakdown = groupBySector(filtered);

    return NextResponse.json({
      stocks: filtered,
      sectors: sectorBreakdown,
      meta: {
        totalScanned: symbols.length,
        totalResults: filtered.length,
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
