// ---------------------------------------------------------------------------
// GET /api/stocks/[symbol] – Single stock analysis
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { analyzeStock } from '@/lib/analysis';
import { getStockData, getBenchmarkData } from '@/lib/data/data-provider';
import { STOCK_MAP, MARKET_BENCHMARKS } from '@/lib/data/stock-universe';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { symbol } = await params;
    const upperSymbol = symbol.toUpperCase();

    // ── Validate symbol ─────────────────────────────────────────────────
    const stockInfo = STOCK_MAP.get(upperSymbol);
    if (!stockInfo) {
      return NextResponse.json(
        {
          error: `Unknown symbol: ${upperSymbol}`,
          message: 'Symbol is not in the tracked universe.',
        },
        { status: 404 },
      );
    }

    // ── Fetch data ──────────────────────────────────────────────────────
    const benchmarkSymbol = stockInfo.market ? MARKET_BENCHMARKS[stockInfo.market] : undefined;
    const [stockData, benchmarkData] = await Promise.all([
      getStockData(upperSymbol),
      getBenchmarkData(benchmarkSymbol),
    ]);

    if (!stockData || stockData.length === 0) {
      return NextResponse.json(
        { error: `No data available for symbol: ${upperSymbol}` },
        { status: 404 },
      );
    }

    // ── Run analysis ────────────────────────────────────────────────────
    const analysis = analyzeStock(
      stockInfo.symbol,
      stockInfo.name,
      stockInfo.sector,
      stockData,
      benchmarkData,
      'medium',
    );

    return NextResponse.json({
      ...analysis,
      meta: {
        timestamp: new Date().toISOString(),
        dataPoints: stockData.length,
        dateRange: {
          from: stockData[0]?.date,
          to: stockData[stockData.length - 1]?.date,
        },
      },
    });
  } catch (error: unknown) {
    console.error('[/api/stocks/[symbol]] Error:', error);
    
    if (error instanceof Error && (error.name === 'NoDataError' || error.message.includes('No data available'))) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to analyze stock',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
