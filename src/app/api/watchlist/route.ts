// ---------------------------------------------------------------------------
// /api/watchlist – Cookie-based watchlist management
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { STOCK_MAP } from '@/lib/data/stock-universe';

const WATCHLIST_COOKIE = 'watchlist';

/** Max age for the watchlist cookie – 1 year */
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getWatchlist(): Promise<string[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(WATCHLIST_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function createResponseWithCookie(
  body: object,
  watchlist: string[],
  status: number = 200,
): NextResponse {
  const response = NextResponse.json(body, { status });
  response.cookies.set(WATCHLIST_COOKIE, JSON.stringify(watchlist), {
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    httpOnly: false, // Allow client-side reads
    sameSite: 'lax',
  });
  return response;
}

// ---------------------------------------------------------------------------
// GET – Return the current watchlist
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const watchlist = await getWatchlist();

    // Enrich with stock info
    const enriched = watchlist.map((symbol) => ({
      symbol,
      info: STOCK_MAP.get(symbol) ?? null,
    }));

    return NextResponse.json({
      watchlist: enriched,
      symbols: watchlist,
      count: watchlist.length,
    });
  } catch (error) {
    console.error('[/api/watchlist] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to read watchlist' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST – Add a symbol to the watchlist
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const symbol: string | undefined = body?.symbol?.toUpperCase?.();

    if (!symbol) {
      return NextResponse.json(
        { error: 'Missing "symbol" in request body' },
        { status: 400 },
      );
    }

    // Validate symbol
    if (!STOCK_MAP.has(symbol)) {
      return NextResponse.json(
        { error: `Unknown symbol: ${symbol}` },
        { status: 400 },
      );
    }

    const watchlist = await getWatchlist();

    // Avoid duplicates
    if (watchlist.includes(symbol)) {
      return createResponseWithCookie(
        {
          message: `${symbol} is already in the watchlist`,
          watchlist,
        },
        watchlist,
      );
    }

    const updated = [...watchlist, symbol];

    return createResponseWithCookie(
      {
        message: `${symbol} added to watchlist`,
        watchlist: updated,
      },
      updated,
      201,
    );
  } catch (error) {
    console.error('[/api/watchlist] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to add to watchlist' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE – Remove a symbol from the watchlist
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const symbol: string | undefined = body?.symbol?.toUpperCase?.();

    if (!symbol) {
      return NextResponse.json(
        { error: 'Missing "symbol" in request body' },
        { status: 400 },
      );
    }

    const watchlist = await getWatchlist();
    const idx = watchlist.indexOf(symbol);

    if (idx === -1) {
      return NextResponse.json(
        {
          error: `${symbol} is not in the watchlist`,
          watchlist,
        },
        { status: 404 },
      );
    }

    const updated = watchlist.filter((s) => s !== symbol);

    return createResponseWithCookie(
      {
        message: `${symbol} removed from watchlist`,
        watchlist: updated,
      },
      updated,
    );
  } catch (error) {
    console.error('[/api/watchlist] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove from watchlist' },
      { status: 500 },
    );
  }
}
