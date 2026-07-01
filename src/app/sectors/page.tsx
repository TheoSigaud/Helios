"use client";

import React, { useState } from "react";
import { SectorDashboard } from "@/components/dashboard/sector-dashboard";
import { FiltersBar } from "@/components/dashboard/filters-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useStockScan } from "@/hooks/use-stocks";
import type { FilterOptions } from "@/lib/analysis/types";
import { PieChart, AlertCircle } from "lucide-react";

const DEFAULT_FILTERS: FilterOptions = {
  horizon: "medium",
  sectors: [],
  minScore: 0,
  phases: [1, 2, 3, 4],
  breakoutOnly: false,
  maBreakout: null,
  phase1To2TransitionOnly: false,
};

export default function SectorsPage() {
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const { data, loading, error } = useStockScan(filters);

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
            <PieChart className="h-6 w-6 text-primary" />
            Analyse Sectorielle
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Performance et opportunités par secteur d&apos;activité
          </p>
        </div>
      </div>

      <FiltersBar filters={filters} onFiltersChange={setFilters} />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[300px] rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Erreur : {error}</p>
        </Card>
      ) : data ? (
        <SectorDashboard sectors={data.sectors} />
      ) : null}
    </div>
  );
}
