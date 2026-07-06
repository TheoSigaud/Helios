"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PhaseBadge } from "@/components/stock/phase-badge";
import { ScoreGauge } from "@/components/stock/score-gauge";
import { useStockDetail, useWatchlist } from "@/hooks/use-stocks";
import {
  ArrowLeft,
  Star,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  BarChart3,
  Target,
  Volume2,
  Activity,
  Shield,
} from "lucide-react";

const StockDetailChart = dynamic(
  () =>
    import("@/components/charts/stock-detail-chart").then(
      (m) => m.StockDetailChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[480px] bg-card rounded-xl animate-pulse" />
    ),
  }
);

function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatLargeNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function StockDetailPage() {
  const params = useParams();
  const symbol = (params.symbol as string)?.toUpperCase() || "";
  const { data: stock, loading, error } = useStockDetail(symbol);
  const { hasSymbol, toggleSymbol } = useWatchlist();
  const isWatched = hasSymbol(symbol);

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-4 max-w-[1400px] mx-auto">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[480px] rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="p-4 lg:p-6 max-w-[1400px] mx-auto">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
        </Link>
        <Card className="p-8 text-center">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {error || `Action ${symbol} non trouvée`}
          </p>
        </Card>
      </div>
    );
  }

  const recommendation =
    stock.opportunityScore >= 75
      ? { label: "ACHAT", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: TrendingUp }
      : stock.opportunityScore >= 50
        ? { label: "OBSERVER", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Activity }
        : stock.opportunityScore >= 30
          ? { label: "FAIBLE", color: "text-orange-400 bg-orange-500/10 border-orange-500/20", icon: AlertCircle }
          : { label: "ÉVITER", color: "text-red-400 bg-red-500/10 border-red-500/20", icon: Shield };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold">{stock.symbol}</h1>
            <PhaseBadge phase={stock.phase} size="md" showConfidence />
            <Badge variant="outline" className={cn("text-xs font-semibold border", recommendation.color)}>
              <recommendation.icon className="h-3 w-3 mr-1" />
              {recommendation.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {stock.name} · {stock.sector}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-bold font-mono">
              ${formatNumber(stock.currentPrice)}
            </div>
            <div
              className={cn(
                "text-sm font-mono font-medium flex items-center justify-end gap-1",
                stock.changePercent >= 0 ? "text-emerald-400" : "text-red-400"
              )}
            >
              {stock.changePercent >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {stock.changePercent >= 0 ? "+" : ""}
              {formatNumber(stock.changePercent)}%
            </div>
          </div>
          <ScoreGauge score={stock.opportunityScore} size={64} strokeWidth={4} showLabel />
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() => toggleSymbol(stock.symbol)}
          >
            <Star
              className={cn(
                "h-5 w-5",
                isWatched
                  ? "text-amber-400 fill-amber-400"
                  : "text-muted-foreground"
              )}
            />
          </Button>
        </div>
      </div>

      {/* Chart */}
      <Card className="overflow-hidden">
        <CardContent className="p-2 lg:p-4">
          <StockDetailChart data={stock.historicalData} height={480} />
        </CardContent>
      </Card>

      {/* Indicators Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* MAs */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Moyennes Mobiles
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {[
              { label: "MA30", value: stock.ma30, pct: stock.priceVsMa30, color: "#3b82f6" },
              { label: "MA50", value: stock.ma50, pct: stock.priceVsMa50, color: "#f59e0b" },
              { label: "MA200", value: stock.ma200, pct: stock.priceVsMa200, color: "#a855f7" },
            ].map((ma) => (
              <div key={ma.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: ma.color }}
                  />
                  <span className="text-xs font-medium">{ma.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono">
                    ${formatNumber(ma.value)}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-mono ml-1",
                      ma.pct >= 0 ? "text-emerald-400" : "text-red-400"
                    )}
                  >
                    ({ma.pct >= 0 ? "+" : ""}
                    {formatNumber(ma.pct)}%)
                  </span>
                </div>
              </div>
            ))}
            <Separator className="my-1" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Pente MA30</span>
              <span
                className={cn(
                  "font-mono font-medium",
                  stock.ma30Slope >= 0 ? "text-emerald-400" : "text-red-400"
                )}
              >
                {stock.ma30Slope >= 0 ? "+" : ""}
                {formatNumber(stock.ma30Slope)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* RS Mansfield */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" />
              Force Relative (Mansfield)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-center py-2">
              <div
                className={cn(
                  "text-3xl font-bold font-mono",
                  stock.mansfieldRS >= 0 ? "text-emerald-400" : "text-red-400"
                )}
              >
                {stock.mansfieldRS >= 0 ? "+" : ""}
                {formatNumber(stock.mansfieldRS, 1)}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {stock.mansfieldRS > 2
                  ? "Forte surperformance vs S&P 500"
                  : stock.mansfieldRS > 0
                    ? "Surperformance vs S&P 500"
                    : stock.mansfieldRS > -2
                      ? "Performance neutre vs S&P 500"
                      : "Sous-performance vs S&P 500"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Volume */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Volume2 className="h-3 w-3" />
              Volume
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Actuel</span>
              <span className="font-mono">{formatLargeNumber(stock.currentVolume)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Moy. 10 sem.</span>
              <span className="font-mono">{formatLargeNumber(stock.avgVolume)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Ratio</span>
              <span
                className={cn(
                  "font-mono font-medium",
                  stock.volumeRatio >= 1.5 ? "text-amber-400" : ""
                )}
              >
                {formatNumber(stock.volumeRatio, 1)}x
              </span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Tendance</span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] px-1.5 py-0",
                  stock.volumeExpanding
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-muted/30 text-muted-foreground"
                )}
              >
                {stock.volumeExpanding ? "En expansion" : "Stable"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Support / Resistance */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Support / Résistance
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1.5">
            <p className="text-[10px] text-red-400 uppercase tracking-wider mb-1">
              Résistances
            </p>
            {stock.resistanceLevels.length > 0 ? (
              stock.resistanceLevels.slice(0, 3).map((r, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">R{i + 1}</span>
                  <span className="font-mono text-red-400">${formatNumber(r)}</span>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-muted-foreground">—</p>
            )}
            <Separator className="my-1" />
            <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">
              Supports
            </p>
            {stock.supportLevels.length > 0 ? (
              stock.supportLevels.slice(0, 3).map((s, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">S{i + 1}</span>
                  <span className="font-mono text-emerald-400">${formatNumber(s)}</span>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Signals */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Signaux d&apos;analyse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {stock.signals.map((signal, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border",
                  signal.type === "BUY"
                    ? "bg-emerald-500/5 border-emerald-500/10"
                    : signal.type === "SELL"
                      ? "bg-red-500/5 border-red-500/10"
                      : "bg-muted/30 border-border"
                )}
              >
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] shrink-0 mt-0.5",
                    signal.type === "BUY"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : signal.type === "SELL"
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : "bg-muted/30"
                  )}
                >
                  {signal.type === "BUY" ? "ACHAT" : signal.type === "SELL" ? "VENTE" : "NEUTRE"}
                </Badge>
                <div className="min-w-0">
                  <p className="text-xs font-medium">{signal.source}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                    {signal.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
