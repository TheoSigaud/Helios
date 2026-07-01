"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { WeinsteinPhase } from "@/lib/analysis/types";

const PHASE_CONFIG = {
  1: {
    label: "Phase 1",
    sublabel: "Base",
    color: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    dotColor: "bg-blue-400",
    description:
      "Accumulation — Le prix oscille autour de la MA30. Période de construction de base.",
  },
  2: {
    label: "Phase 2",
    sublabel: "Avancée",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    dotColor: "bg-emerald-400",
    description:
      "Avancée — Le prix est au-dessus de la MA30 montante. Signal d'ACHAT.",
  },
  3: {
    label: "Phase 3",
    sublabel: "Sommet",
    color: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    dotColor: "bg-amber-400",
    description:
      "Distribution — Le prix oscille autour de la MA30 qui s'aplatit. Prudence.",
  },
  4: {
    label: "Phase 4",
    sublabel: "Déclin",
    color: "bg-red-500/15 text-red-400 border-red-500/20",
    dotColor: "bg-red-400",
    description:
      "Déclin — Le prix est en-dessous de la MA30 descendante. Signal de VENTE.",
  },
};

interface PhaseBadgeProps {
  phase: WeinsteinPhase;
  size?: "sm" | "md" | "lg";
  showConfidence?: boolean;
  className?: string;
}

export function PhaseBadge({
  phase,
  size = "md",
  showConfidence = false,
  className,
}: PhaseBadgeProps) {
  const config = PHASE_CONFIG[phase.stage];

  return (
    <Tooltip>
      <TooltipTrigger>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 font-medium border rounded-full transition-all cursor-default",
            config.color,
            size === "sm" && "px-2 py-0.5 text-[10px]",
            size === "md" && "px-2.5 py-1 text-xs",
            size === "lg" && "px-3 py-1.5 text-sm",
            className
          )}
        >
          <span
            className={cn(
              "rounded-full shrink-0",
              config.dotColor,
              size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2"
            )}
          />
          <span>{config.label}</span>
          {size !== "sm" && (
            <span className="opacity-60">· {config.sublabel}</span>
          )}
          {showConfidence && (
            <span className="opacity-50 ml-0.5">
              {Math.round(phase.confidence * 100)}%
            </span>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="font-medium mb-1">
          {config.label} — {config.sublabel}
        </p>
        <p className="text-xs text-muted-foreground">{config.description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Confiance : {Math.round(phase.confidence * 100)}% · Action :{" "}
          {phase.action}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
