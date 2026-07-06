// ---------------------------------------------------------------------------
// Financial Modeling Prep (FMP) API client – server-side only
// https://site.financialmodelingprep.com/developer/docs
// Free tier: 250 requests/day, API key required.
// ---------------------------------------------------------------------------

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FMPCompanyProfile {
  symbol: string;
  companyName: string;
  description: string;
  sector: string;
  industry: string;
  marketCap: number;
  price: number;
  beta: number;
  volAvg: number;
  exchange: string;
  website: string;
  image: string;
}

export interface FMPKeyMetrics {
  peRatioTTM: number;
  epsGrowthTTM: number;
  debtToEquityTTM: number;
  roeTTM: number;
  dividendYieldTTM: number;
  revenuePerShareTTM: number;
}

interface FMPRawProfile {
  symbol?: string;
  companyName?: string;
  description?: string;
  sector?: string;
  industry?: string;
  mktCap?: number;
  price?: number;
  beta?: number;
  volAvg?: number;
  exchange?: string;
  website?: string;
  image?: string;
}

interface FMPRawKeyMetrics {
  peRatioTTM?: number;
  netIncomePerShareTTM?: number;
  debtToEquityTTM?: number;
  roeTTM?: number;
  dividendYieldTTM?: number;
  revenuePerShareTTM?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getApiKey(): string | null {
  const key = process.env.FMP_API_KEY;
  if (!key) {
    console.warn('[FMP] FMP_API_KEY is not set – returning null.');
    return null;
  }
  return key;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch a company profile for a given stock symbol.
 *
 * @param symbol  Ticker symbol (e.g. "AAPL")
 * @returns       Company profile data, or null on failure.
 */
export async function getCompanyProfile(
  symbol: string,
): Promise<FMPCompanyProfile | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const url = `${FMP_BASE_URL}/profile/${encodeURIComponent(symbol)}?apikey=${apiKey}`;

  try {
    console.log(`[FMP] Fetching company profile for ${symbol}…`);
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      console.error(
        `[FMP] API error for profile ${symbol}: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const data: FMPRawProfile[] = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      console.error(`[FMP] No profile data returned for ${symbol}.`);
      return null;
    }

    const raw = data[0];

    const profile: FMPCompanyProfile = {
      symbol: raw.symbol ?? symbol,
      companyName: raw.companyName ?? '',
      description: raw.description ?? '',
      sector: raw.sector ?? '',
      industry: raw.industry ?? '',
      marketCap: raw.mktCap ?? 0,
      price: raw.price ?? 0,
      beta: raw.beta ?? 0,
      volAvg: raw.volAvg ?? 0,
      exchange: raw.exchange ?? '',
      website: raw.website ?? '',
      image: raw.image ?? '',
    };

    console.log(`[FMP] Received profile for ${symbol}: ${profile.companyName}.`);
    return profile;
  } catch (error) {
    console.error(`[FMP] Failed to fetch profile for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch trailing-twelve-month key metrics for a given stock symbol.
 *
 * @param symbol  Ticker symbol (e.g. "AAPL")
 * @returns       Key metrics data, or null on failure.
 */
export async function getKeyMetrics(
  symbol: string,
): Promise<FMPKeyMetrics | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const url = `${FMP_BASE_URL}/key-metrics-ttm/${encodeURIComponent(symbol)}?apikey=${apiKey}`;

  try {
    console.log(`[FMP] Fetching key metrics for ${symbol}…`);
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      console.error(
        `[FMP] API error for key metrics ${symbol}: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const data: FMPRawKeyMetrics[] = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      console.error(`[FMP] No key metrics data returned for ${symbol}.`);
      return null;
    }

    const raw = data[0];

    const metrics: FMPKeyMetrics = {
      peRatioTTM: raw.peRatioTTM ?? 0,
      epsGrowthTTM: raw.netIncomePerShareTTM ?? 0,
      debtToEquityTTM: raw.debtToEquityTTM ?? 0,
      roeTTM: raw.roeTTM ?? 0,
      dividendYieldTTM: raw.dividendYieldTTM ?? 0,
      revenuePerShareTTM: raw.revenuePerShareTTM ?? 0,
    };

    console.log(`[FMP] Received key metrics for ${symbol}.`);
    return metrics;
  } catch (error) {
    console.error(`[FMP] Failed to fetch key metrics for ${symbol}:`, error);
    return null;
  }
}
