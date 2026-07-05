"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PhaseBadge } from "@/components/stock/phase-badge";
import { ScoreBadge } from "@/components/stock/score-gauge";
import { MiniSparkline } from "@/components/charts/mini-sparkline";
import { MiniVolumeBar } from "@/components/charts/mini-volume-bar";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Star,
  StarOff,
  TrendingUp,
  TrendingDown,
  Volume2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { StockAnalysis } from "@/lib/analysis/types";

type SortField =
  | "rank"
  | "symbol"
  | "score"
  | "phase"
  | "price"
  | "changePercent"
  | "mansfieldRS"
  | "volumeRatio";
type SortDirection = "asc" | "desc";

interface StockRankingTableProps {
  stocks: StockAnalysis[];
  watchlist?: string[];
  onToggleWatchlist?: (symbol: string) => void;
  className?: string;
}

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

export function StockRankingTable({
  stocks,
  watchlist = [],
  onToggleWatchlist,
  className,
}: StockRankingTableProps) {
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [stocks]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir(field === "symbol" ? "asc" : "desc");
    }
    setCurrentPage(1);
  };

  const sortedStocks = useMemo(() => {
    return [...stocks].sort((a, b) => {
      let valA: number | string;
      let valB: number | string;

      switch (sortField) {
        case "rank":
          valA = a.opportunityScore;
          valB = b.opportunityScore;
          break;
        case "symbol":
          valA = a.symbol;
          valB = b.symbol;
          break;
        case "score":
          valA = a.opportunityScore;
          valB = b.opportunityScore;
          break;
        case "phase":
          valA = a.phase.stage;
          valB = b.phase.stage;
          break;
        case "price":
          valA = a.currentPrice;
          valB = b.currentPrice;
          break;
        case "changePercent":
          valA = a.changePercent;
          valB = b.changePercent;
          break;
        case "mansfieldRS":
          valA = a.mansfieldRS;
          valB = b.mansfieldRS;
          break;
        case "volumeRatio":
          valA = a.volumeRatio;
          valB = b.volumeRatio;
          break;
        default:
          return 0;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        return sortDir === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return sortDir === "asc"
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });
  }, [stocks, sortField, sortDir]);

  const totalPages = Math.ceil(sortedStocks.length / pageSize);
  const paginatedStocks = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedStocks.slice(startIndex, startIndex + pageSize);
  }, [sortedStocks, currentPage]);

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors text-left"
    >
      {children}
      {sortField === field ? (
        sortDir === "asc" ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-30" />
      )}
    </button>
  );

  return (
    <div className={cn("rounded-xl border border-border overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-10 text-center text-[11px]">#</TableHead>
              <TableHead className="text-[11px] min-w-[140px]">
                <SortButton field="symbol">Action</SortButton>
              </TableHead>
              <TableHead className="text-[11px] text-center">
                <SortButton field="score">Score</SortButton>
              </TableHead>
              <TableHead className="text-[11px]">
                <SortButton field="phase">Phase</SortButton>
              </TableHead>
              <TableHead className="text-[11px] text-right">
                <SortButton field="price">Prix</SortButton>
              </TableHead>
              <TableHead className="text-[11px] text-right">
                <SortButton field="changePercent">Var %</SortButton>
              </TableHead>
              <TableHead className="text-[11px] text-center hidden md:table-cell">
                MAs
              </TableHead>
              <TableHead className="text-[11px] text-right hidden lg:table-cell">
                <SortButton field="mansfieldRS">RS</SortButton>
              </TableHead>
              <TableHead className="text-[11px] text-right hidden lg:table-cell">
                <SortButton field="volumeRatio">Vol</SortButton>
              </TableHead>
              <TableHead className="text-[11px] text-center hidden xl:table-cell w-[120px]">
                Tendance
              </TableHead>
              <TableHead className="text-[11px] w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedStocks.map((stock, idx) => {
              const isInWatchlist = watchlist.includes(stock.symbol);
              const rank = (currentPage - 1) * pageSize + idx + 1;

              return (
                <TableRow
                  key={stock.symbol}
                  className={cn(
                    "group transition-colors",
                    stock.phase.stage === 2 && "bg-emerald-500/[0.02]",
                    stock.phase.stage === 4 && "bg-red-500/[0.02]"
                  )}
                >
                  {/* Rank */}
                  <TableCell className="text-center">
                    <span
                      className={cn(
                        "text-xs font-medium tabular-nums",
                        rank <= 3
                          ? "text-amber-400 font-bold"
                          : "text-muted-foreground"
                      )}
                    >
                      {rank}
                    </span>
                  </TableCell>

                  {/* Symbol & Name */}
                  <TableCell>
                    <Link
                      href={`/stock/${stock.symbol}`}
                      className="group/link"
                    >
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm group-hover/link:text-primary transition-colors">
                              {stock.symbol}
                            </span>
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-50 transition-opacity" />
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                            {stock.name}
                          </div>
                          <div className="text-[9px] text-muted-foreground/60">
                            {stock.sector}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </TableCell>

                  {/* Score */}
                  <TableCell className="text-center">
                    <ScoreBadge score={stock.opportunityScore} />
                  </TableCell>

                  {/* Phase */}
                  <TableCell>
                    <PhaseBadge phase={stock.phase} size="sm" />
                  </TableCell>

                  {/* Price */}
                  <TableCell className="text-right">
                    <span className="font-mono text-sm font-medium">
                      ${formatNumber(stock.currentPrice)}
                    </span>
                  </TableCell>

                  {/* Change % */}
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 text-xs font-medium font-mono",
                        stock.changePercent >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      )}
                    >
                      {stock.changePercent >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {stock.changePercent >= 0 ? "+" : ""}
                      {formatNumber(stock.changePercent)}%
                    </span>
                  </TableCell>

                  {/* MAs Status */}
                  <TableCell className="text-center hidden md:table-cell">
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center justify-center gap-0.5">
                          {[
                            {
                              label: "30",
                              active: stock.currentPrice > stock.ma30,
                            },
                            {
                              label: "50",
                              active: stock.currentPrice > stock.ma50,
                            },
                            {
                              label: "200",
                              active: stock.currentPrice > stock.ma200,
                            },
                          ].map((ma) => (
                            <span
                              key={ma.label}
                              className={cn(
                                "w-5 h-5 rounded text-[8px] font-medium flex items-center justify-center",
                                ma.active
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-red-500/10 text-red-400/60"
                              )}
                            >
                              {ma.label}
                            </span>
                          ))}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <div className="text-xs space-y-1">
                          <div>
                            MA30: ${formatNumber(stock.ma30)} (
                            {stock.priceVsMa30 >= 0 ? "+" : ""}
                            {formatNumber(stock.priceVsMa30)}%)
                          </div>
                          <div>
                            MA50: ${formatNumber(stock.ma50)} (
                            {stock.priceVsMa50 >= 0 ? "+" : ""}
                            {formatNumber(stock.priceVsMa50)}%)
                          </div>
                          <div>
                            MA200: ${formatNumber(stock.ma200)} (
                            {stock.priceVsMa200 >= 0 ? "+" : ""}
                            {formatNumber(stock.priceVsMa200)}%)
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>

                  {/* Mansfield RS */}
                  <TableCell className="text-right hidden lg:table-cell">
                    <span
                      className={cn(
                        "text-xs font-mono font-medium",
                        stock.mansfieldRS >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      )}
                    >
                      {stock.mansfieldRS >= 0 ? "+" : ""}
                      {formatNumber(stock.mansfieldRS, 1)}
                    </span>
                  </TableCell>

                  {/* Volume */}
                  <TableCell className="text-right hidden lg:table-cell">
                    <Tooltip>
                      <TooltipTrigger>
                        <span
                          className={cn(
                            "text-xs font-mono",
                            stock.volumeRatio >= 1.5
                              ? "text-amber-400 font-medium"
                              : "text-muted-foreground"
                          )}
                        >
                          {formatNumber(stock.volumeRatio, 1)}x
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <div className="text-xs">
                          <div>Volume actuel : {formatLargeNumber(stock.currentVolume)}</div>
                          <div>Moy. 50j : {formatLargeNumber(stock.avgVolume)}</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>

                  {/* Sparkline */}
                  <TableCell className="hidden xl:table-cell">
                    {stock.historicalData.length > 0 && (
                      <MiniSparkline
                        data={stock.historicalData}
                        days={30}
                        height={32}
                        width={100}
                      />
                    )}
                  </TableCell>

                  {/* Watchlist toggle */}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onToggleWatchlist?.(stock.symbol)}
                    >
                      {isInWatchlist ? (
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      ) : (
                        <Star className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {sortedStocks.length === 0 && (
        <div className="py-12 text-center text-muted-foreground text-sm">
          Aucune action ne correspond aux filtres sélectionnés.
        </div>
      )}

      {sortedStocks.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-4 border-t border-border bg-muted/10">
          <div className="text-sm text-muted-foreground hidden sm:block">
            Affichage de {(currentPage - 1) * pageSize + 1} à {Math.min(currentPage * pageSize, sortedStocks.length)} sur {sortedStocks.length} actions
          </div>
          <div className="flex items-center justify-end sm:justify-between w-full sm:w-auto gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </Button>
            <div className="text-sm font-medium px-2">
              Page {currentPage} sur {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
