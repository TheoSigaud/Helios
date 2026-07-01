"use client";

import React, { useState } from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSyncTargets, syncSingleSymbol } from "@/app/actions/sync";

export function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const handleSync = async () => {
    setError(null);
    setProgress(null);
    setIsSyncing(true);
    
    try {
      const targets = await getSyncTargets();
      const allSymbols = [targets.benchmark, ...targets.symbols];
      setProgress({ current: 0, total: allSymbols.length });

      for (let i = 0; i < allSymbols.length; i++) {
        const symbol = allSymbols[i];
        const res = await syncSingleSymbol(symbol);
        if (!res.success) {
           console.error(`Failed to sync ${symbol}: ${res.message}`);
        }
        setProgress({ current: i + 1, total: allSymbols.length });
      }

      window.location.reload();
    } catch (err: any) {
      setError(err.message || "An error occurred during sync");
    } finally {
      setIsSyncing(false);
    }
  };

  const percentage = progress && progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="w-full flex items-center justify-center gap-2 relative overflow-hidden"
        onClick={handleSync}
        disabled={isSyncing}
        title="Synchroniser les données du marché"
      >
        {isSyncing && progress && (
          <div 
            className="absolute left-0 top-0 bottom-0 bg-primary/20 transition-all duration-300 ease-linear" 
            style={{ width: `${percentage}%` }}
          />
        )}
        <RefreshCcw className={`h-4 w-4 relative z-10 ${isSyncing ? "animate-spin" : ""}`} />
        <span className="relative z-10">
          {isSyncing && progress 
            ? `Synchronisation... (${progress.current}/${progress.total})` 
            : "Sync Données"}
        </span>
      </Button>
      {error && <span className="text-[10px] text-destructive px-1 text-center">{error}</span>}
    </div>
  );
}
