"use client";

import { useState, useEffect, useCallback } from "react";
import type { StockAnalysis, SectorAnalysis, Horizon, FilterOptions } from "@/lib/analysis/types";

interface ScanResponse {
  stocks: StockAnalysis[];
  sectors: SectorAnalysis[];
  meta: {
    totalScanned: number;
    totalResults: number;
    horizon: string;
    timestamp: string;
  };
}

export function useStockScan(filters: FilterOptions) {
  const [data, setData] = useState<ScanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("horizon", filters.horizon);
      if (filters.sectors.length > 0) {
        params.set("sectors", filters.sectors.join(","));
      }
      if (filters.minScore > 0) {
        params.set("minScore", String(filters.minScore));
      }
      if (filters.phases.length < 4) {
        params.set("phases", filters.phases.join(","));
      }

      const res = await fetch(`/api/stocks/scan?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [filters.horizon, filters.sectors.join(","), filters.minScore, filters.phases.join(",")]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useWatchlist() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("helios-watchlist");
      if (stored) {
        setSymbols(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("helios-watchlist", JSON.stringify(symbols));
    }
  }, [symbols, loading]);

  const addSymbol = useCallback((symbol: string) => {
    setSymbols((prev) => {
      if (prev.includes(symbol)) return prev;
      return [...prev, symbol];
    });
  }, []);

  const removeSymbol = useCallback((symbol: string) => {
    setSymbols((prev) => prev.filter((s) => s !== symbol));
  }, []);

  const toggleSymbol = useCallback((symbol: string) => {
    setSymbols((prev) => {
      if (prev.includes(symbol)) {
        return prev.filter((s) => s !== symbol);
      }
      return [...prev, symbol];
    });
  }, []);

  const hasSymbol = useCallback(
    (symbol: string) => symbols.includes(symbol),
    [symbols]
  );

  return {
    symbols,
    loading,
    addSymbol,
    removeSymbol,
    toggleSymbol,
    hasSymbol,
  };
}

export function useStockDetail(symbol: string) {
  const [data, setData] = useState<StockAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStock() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/stocks/${symbol}`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    if (symbol) fetchStock();
  }, [symbol]);

  return { data, loading, error };
}
