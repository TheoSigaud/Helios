// ---------------------------------------------------------------------------
// FinnHub API client – server-side only
// https://finnhub.io/docs
// Free tier: 60 requests/minute, API key required.
// ---------------------------------------------------------------------------

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

/** Default number of days to look back for news. */
const DEFAULT_DAYS_BACK = 7;

/** Maximum number of articles to return. */
const MAX_ARTICLES = 10;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FinnhubNewsArticle {
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  category: string;
  image: string;
}

interface FinnhubRawArticle {
  headline?: string;
  summary?: string;
  source?: string;
  url?: string;
  datetime?: number;
  category?: string;
  image?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getApiKey(): string | null {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) {
    console.warn('[FinnHub] FINNHUB_API_KEY is not set – returning empty results.');
    return null;
  }
  return key;
}

/**
 * Strip non-US exchange suffixes (e.g. ".PA", ".DE") from a ticker symbol.
 * FinnHub only supports US tickers.
 */
function toUsTicker(symbol: string): string {
  const dotIndex = symbol.indexOf('.');
  return dotIndex !== -1 ? symbol.substring(0, dotIndex) : symbol;
}

/**
 * Format a Date as YYYY-MM-DD for the FinnHub API.
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch recent company news for a given stock symbol.
 *
 * @param symbol    Ticker symbol (e.g. "AAPL"). Non-US suffixes are stripped.
 * @param daysBack  Number of days to look back – defaults to 7.
 * @returns         Array of up to 10 news articles, or empty array on failure.
 */
export async function getCompanyNews(
  symbol: string,
  daysBack: number = DEFAULT_DAYS_BACK,
): Promise<FinnhubNewsArticle[]> {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const ticker = toUsTicker(symbol);

  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - daysBack);

  const url = new URL(`${FINNHUB_BASE_URL}/company-news`);
  url.searchParams.set('symbol', ticker);
  url.searchParams.set('from', formatDate(from));
  url.searchParams.set('to', formatDate(to));
  url.searchParams.set('token', apiKey);

  try {
    console.log(`[FinnHub] Fetching company news for ${ticker}…`);
    const response = await fetch(url.toString(), { cache: 'no-store' });

    if (!response.ok) {
      console.error(
        `[FinnHub] API error for ${ticker}: ${response.status} ${response.statusText}`,
      );
      return [];
    }

    const data: FinnhubRawArticle[] = await response.json();

    if (!Array.isArray(data)) {
      console.error(`[FinnHub] Unexpected response format for ${ticker}.`);
      return [];
    }

    const articles: FinnhubNewsArticle[] = data
      .slice(0, MAX_ARTICLES)
      .map((item) => ({
        headline: item.headline ?? '',
        summary: item.summary ?? '',
        source: item.source ?? '',
        url: item.url ?? '',
        datetime: item.datetime ?? 0,
        category: item.category ?? '',
        image: item.image ?? '',
      }));

    console.log(
      `[FinnHub] Received ${articles.length} article(s) for ${ticker}.`,
    );
    return articles;
  } catch (error) {
    console.error(`[FinnHub] Failed to fetch news for ${ticker}:`, error);
    return [];
  }
}
