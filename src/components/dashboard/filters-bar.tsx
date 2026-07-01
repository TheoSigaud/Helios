"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Filter,
  RotateCcw,
  TrendingUp,
  Clock,
  Target,
} from "lucide-react";
import type { Horizon, FilterOptions } from "@/lib/analysis/types";

const SECTORS = [
  "Technology",
  "Healthcare",
  "Financials",
  "Consumer Discretionary",
  "Communication Services",
  "Industrials",
  "Consumer Staples",
  "Energy",
  "Utilities",
  "Real Estate",
  "Materials",
] as const;

const HORIZON_OPTIONS = [
  { value: "short", label: "Court terme", description: "MA30", icon: "⚡" },
  { value: "medium", label: "Moyen terme", description: "MA50", icon: "📊" },
  { value: "long", label: "Long terme", description: "MA200", icon: "🏛" },
] as const;

const PHASE_OPTIONS = [
  { value: 1, label: "Phase 1", color: "bg-blue-500/20 text-blue-400" },
  { value: 2, label: "Phase 2", color: "bg-emerald-500/20 text-emerald-400" },
  { value: 3, label: "Phase 3", color: "bg-amber-500/20 text-amber-400" },
  { value: 4, label: "Phase 4", color: "bg-red-500/20 text-red-400" },
] as const;

interface FiltersBarProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  className?: string;
}

export function FiltersBar({
  filters,
  onFiltersChange,
  className,
}: FiltersBarProps) {
  const update = (partial: Partial<FilterOptions>) => {
    onFiltersChange({ ...filters, ...partial });
  };

  const resetFilters = () => {
    onFiltersChange({
      horizon: "medium",
      sectors: [],
      minScore: 0,
      phases: [1, 2, 3, 4],
      breakoutOnly: false,
      maBreakout: null,
    });
  };

  const activeFilterCount = [
    filters.horizon !== "medium",
    filters.sectors.length > 0,
    filters.minScore > 0,
    filters.phases.length < 4,
    filters.breakoutOnly,
    filters.maBreakout !== null,
  ].filter(Boolean).length;

  return (
    <div
      className={cn(
        "bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 space-y-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtres</span>
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="px-1.5 py-0 text-[10px] bg-primary/10 text-primary"
            >
              {activeFilterCount}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground"
          onClick={resetFilters}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Réinitialiser
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        {/* Horizon */}
        <div className="space-y-1.5 min-w-[160px]">
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Horizon
          </label>
          <Select
            value={filters.horizon}
            onValueChange={(v) => { if (v) update({ horizon: v as Horizon }); }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HORIZON_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  <span className="mr-1">{opt.icon}</span>
                  {opt.label}
                  <span className="text-muted-foreground ml-1">
                    ({opt.description})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sector filter */}
        <div className="space-y-1.5 min-w-[180px]">
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            <Target className="h-3 w-3" />
            Secteur
          </label>
          <Select
            value={filters.sectors.length === 0 ? "all" : filters.sectors[0]}
            onValueChange={(v) =>
              update({ sectors: !v || v === "all" ? [] : [v] })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Tous les secteurs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                Tous les secteurs
              </SelectItem>
              {SECTORS.map((sector) => (
                <SelectItem key={sector} value={sector} className="text-xs">
                  {sector}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* MA Breakout filter */}
        <div className="space-y-1.5 min-w-[160px]">
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Breakout MA
          </label>
          <Select
            value={filters.maBreakout || "none"}
            onValueChange={(v) =>
              update({
                maBreakout:
                  !v || v === "none"
                    ? null
                    : (v as "ma30" | "ma50" | "ma200" | "any"),
              })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Aucun filtre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs">
                Aucun filtre
              </SelectItem>
              <SelectItem value="ma30" className="text-xs">
                Breakout MA30
              </SelectItem>
              <SelectItem value="ma50" className="text-xs">
                Breakout MA50
              </SelectItem>
              <SelectItem value="ma200" className="text-xs">
                Breakout MA200
              </SelectItem>
              <SelectItem value="any" className="text-xs">
                Tout breakout
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Min Score */}
        <div className="space-y-1.5 min-w-[140px]">
          <label className="text-xs text-muted-foreground">
            Score min : {filters.minScore}
          </label>
          <Slider
            value={[filters.minScore]}
            onValueChange={(v) => update({ minScore: Array.isArray(v) ? v[0] : v })}
            max={100}
            step={5}
            className="mt-2"
          />
        </div>

        {/* Phases */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Phases</label>
          <div className="flex gap-2">
            {PHASE_OPTIONS.map((phase) => {
              const isActive = filters.phases.includes(phase.value);
              return (
                <button
                  key={phase.value}
                  onClick={() =>
                    update({
                      phases: isActive
                        ? filters.phases.filter((p) => p !== phase.value)
                        : [...filters.phases, phase.value],
                    })
                  }
                  className={cn(
                    "px-2 py-1 rounded-md text-[10px] font-medium transition-all border",
                    isActive
                      ? phase.color + " border-current/20"
                      : "bg-muted/30 text-muted-foreground border-transparent opacity-50 hover:opacity-75"
                  )}
                >
                  {phase.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
