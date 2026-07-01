"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhaseBadge } from "@/components/stock/phase-badge";
import { ScoreBadge, ScoreGauge } from "@/components/stock/score-gauge";
import { MiniSparkline } from "@/components/charts/mini-sparkline";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  ChevronRight,
  Users,
} from "lucide-react";
import type { SectorAnalysis, StockAnalysis } from "@/lib/analysis/types";

interface SectorDashboardProps {
  sectors: SectorAnalysis[];
  className?: string;
}

const SECTOR_ICONS: Record<string, string> = {
  Technology: "💻",
  Healthcare: "🏥",
  Financials: "🏦",
  "Consumer Discretionary": "🛍",
  "Communication Services": "📡",
  Industrials: "🏭",
  "Consumer Staples": "🛒",
  Energy: "⚡",
  Utilities: "💡",
  "Real Estate": "🏠",
  Materials: "⛏",
};

function SectorCard({ sector }: { sector: SectorAnalysis }) {
  const sortedStocks = useMemo(
    () =>
      [...sector.stocks].sort(
        (a, b) => b.opportunityScore - a.opportunityScore
      ),
    [sector.stocks]
  );

  const top3 = sortedStocks.slice(0, 3);
  const icon = SECTOR_ICONS[sector.sector] || "📊";

  return (
    <Card className="group hover:border-primary/20 transition-all duration-300 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            {sector.sector}
          </CardTitle>
          <ScoreGauge score={sector.avgScore} size={44} strokeWidth={3} />
        </div>

        {/* Sector stats */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              {sector.stocks.length} actions
            </span>
          </div>
          {sector.phase2Count > 0 && (
            <Badge
              variant="outline"
              className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            >
              {sector.phase2Count} en Phase 2
            </Badge>
          )}
          {sector.phase4Count > 0 && (
            <Badge
              variant="outline"
              className="text-[9px] px-1.5 py-0 bg-red-500/10 text-red-400 border-red-500/20"
            >
              {sector.phase4Count} en Phase 4
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Top 3 stocks */}
        <div className="space-y-2">
          {top3.map((stock, idx) => (
            <Link
              key={stock.symbol}
              href={`/stock/${stock.symbol}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors group/row"
            >
              <span
                className={cn(
                  "text-[10px] font-bold w-4 text-center",
                  idx === 0
                    ? "text-amber-400"
                    : "text-muted-foreground"
                )}
              >
                {idx + 1}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs">
                    {stock.symbol}
                  </span>
                  <PhaseBadge phase={stock.phase} size="sm" />
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {stock.name}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-mono text-xs font-medium">
                  ${stock.currentPrice.toFixed(2)}
                </div>
                <div
                  className={cn(
                    "text-[10px] font-mono",
                    stock.changePercent >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  )}
                >
                  {stock.changePercent >= 0 ? "+" : ""}
                  {stock.changePercent.toFixed(2)}%
                </div>
              </div>

              <ScoreBadge
                score={stock.opportunityScore}
                className="shrink-0"
              />

              <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover/row:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>

        {/* Show remaining count */}
        {sector.stocks.length > 3 && (
          <div className="mt-2 pt-2 border-t border-border">
            <span className="text-[10px] text-muted-foreground">
              + {sector.stocks.length - 3} autres actions
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SectorDashboard({
  sectors,
  className,
}: SectorDashboardProps) {
  const sortedSectors = useMemo(
    () => [...sectors].sort((a, b) => b.avgScore - a.avgScore),
    [sectors]
  );

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4",
        className
      )}
    >
      {sortedSectors.map((sector) => (
        <SectorCard key={sector.sector} sector={sector} />
      ))}
    </div>
  );
}
