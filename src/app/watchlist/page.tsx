"use client";

import React, { useMemo } from "react";
import { StockRankingTable } from "@/components/dashboard/stock-ranking-table";
import { AddStockDialog } from "@/components/watchlist/add-stock-dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStockScan, useWatchlist } from "@/hooks/use-stocks";
import { DEFAULT_STOCKS } from "@/lib/data/stock-universe";
import type { FilterOptions } from "@/lib/analysis/types";
import { Star, AlertCircle, Plus, Trash2 } from "lucide-react";

const DEFAULT_FILTERS: FilterOptions = {
  horizon: "medium",
  sectors: [],
  minScore: 0,
  phases: [1, 2, 3, 4],
  breakoutOnly: false,
  maBreakout: null,
  phase1To2TransitionOnly: false,
};

export default function WatchlistPage() {
  const { data, loading, error } = useStockScan(DEFAULT_FILTERS);
  const { symbols: watchlist, addSymbol, removeSymbol, toggleSymbol } =
    useWatchlist();

  // Filter the scan results to only include watchlist stocks
  const watchlistStocks = useMemo(() => {
    if (!data?.stocks) return [];
    return data.stocks.filter((s) => watchlist.includes(s.symbol));
  }, [data, watchlist]);

  const allStockInfos = DEFAULT_STOCKS.map((s) => ({
    symbol: s.symbol,
    name: s.name,
    sector: s.sector,
  }));

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
            <Star className="h-6 w-6 text-amber-400" />
            Watchlist
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {watchlist.length} action{watchlist.length !== 1 ? "s" : ""}{" "}
            suivie{watchlist.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddStockDialog
            onAdd={addSymbol}
            existingSymbols={watchlist}
            allSymbols={allStockInfos}
          />
        </div>
      </div>

      {/* Empty state */}
      {watchlist.length === 0 ? (
        <Card className="p-12 text-center">
          <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">
            Votre watchlist est vide
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Ajoutez des actions pour les suivre et analyser leurs opportunités
            selon la méthode de Stan Weinstein.
          </p>
          <AddStockDialog
            onAdd={addSymbol}
            existingSymbols={watchlist}
            allSymbols={allStockInfos}
          >
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Ajouter votre première action
            </Button>
          </AddStockDialog>
        </Card>
      ) : loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Erreur : {error}</p>
        </Card>
      ) : (
        <>
          {/* Watchlist chips */}
          <div className="flex flex-wrap gap-2">
            {watchlist.map((symbol) => (
              <Badge
                key={symbol}
                variant="secondary"
                className="pl-2.5 pr-1 py-1 gap-1 text-xs"
              >
                {symbol}
                <button
                  onClick={() => removeSymbol(symbol)}
                  className="ml-0.5 p-0.5 rounded hover:bg-destructive/20 transition-colors"
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </button>
              </Badge>
            ))}
          </div>

          {/* Table */}
          <StockRankingTable
            stocks={watchlistStocks}
            watchlist={watchlist}
            onToggleWatchlist={toggleSymbol}
          />
        </>
      )}
    </div>
  );
}
