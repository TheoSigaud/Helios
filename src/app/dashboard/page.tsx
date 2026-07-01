"use client";

import React, { useState, useMemo } from "react";
import { StockRankingTable } from "@/components/dashboard/stock-ranking-table";
import { FiltersBar } from "@/components/dashboard/filters-bar";
import { ScoreGauge } from "@/components/stock/score-gauge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStockScan, useWatchlist } from "@/hooks/use-stocks";
import type { FilterOptions } from "@/lib/analysis/types";
import {
  TrendingUp,
  BarChart3,
  Zap,
  Shield,
  Activity,
  AlertCircle,
} from "lucide-react";

const DEFAULT_FILTERS: FilterOptions = {
  horizon: "medium",
  sectors: [],
  minScore: 0,
  phases: [1, 2, 3, 4],
  breakoutOnly: false,
  maBreakout: null,
  phase1To2TransitionOnly: false,
};

function StatsCards({
  stocks,
}: {
  stocks: { opportunityScore: number; phase: { stage: number }; changePercent: number }[];
}) {
  const stats = useMemo(() => {
    if (stocks.length === 0)
      return { avg: 0, phase2: 0, phase4: 0, bullish: 0 };
    const avg = Math.round(
      stocks.reduce((s, st) => s + st.opportunityScore, 0) / stocks.length
    );
    const phase2 = stocks.filter((s) => s.phase.stage === 2).length;
    const phase4 = stocks.filter((s) => s.phase.stage === 4).length;
    const bullish = stocks.filter((s) => s.changePercent > 0).length;
    return { avg, phase2, phase4, bullish };
  }, [stocks]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Score Moyen
              </p>
              <p className="text-2xl font-bold mt-1 tabular-nums">
                {stats.avg}
              </p>
            </div>
            <ScoreGauge score={stats.avg} size={40} strokeWidth={3} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Phase 2 (Achat)
              </p>
              <p className="text-2xl font-bold mt-1 text-emerald-400">
                {stats.phase2}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Phase 4 (Vente)
              </p>
              <p className="text-2xl font-bold mt-1 text-red-400">
                {stats.phase4}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-red-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                En hausse
              </p>
              <p className="text-2xl font-bold mt-1">
                {stats.bullish}
                <span className="text-sm text-muted-foreground font-normal">
                  /{stocks.length}
                </span>
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[72px] rounded-xl" />
      <Skeleton className="h-[600px] rounded-xl" />
    </div>
  );
}

export default function DashboardPage() {
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const { data, loading, error } = useStockScan(filters);
  const { symbols: watchlist, toggleSymbol } = useWatchlist();

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Classement des {data?.meta?.totalResults ?? 50} meilleures
            opportunités selon les critères de Stan Weinstein
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <Card className="p-8 text-center">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Erreur : {error}</p>
        </Card>
      ) : data ? (
        <>
          <StatsCards stocks={data.stocks} />
          <FiltersBar filters={filters} onFiltersChange={setFilters} />
          <StockRankingTable
            stocks={data.stocks}
            watchlist={watchlist}
            onToggleWatchlist={toggleSymbol}
          />
        </>
      ) : null}
    </div>
  );
}
