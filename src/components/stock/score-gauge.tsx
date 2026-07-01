"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 75) return "#22c55e"; // green
  if (score >= 55) return "#84cc16"; // lime
  if (score >= 40) return "#eab308"; // yellow
  if (score >= 25) return "#f97316"; // orange
  return "#ef4444"; // red
}

function getScoreLabel(score: number): string {
  if (score >= 75) return "Excellent";
  if (score >= 55) return "Bon";
  if (score >= 40) return "Neutre";
  if (score >= 25) return "Faible";
  return "Éviter";
}

export function ScoreGauge({
  score,
  size = 56,
  strokeWidth = 4,
  className,
  showLabel = false,
}: ScoreGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score)) / 100;
  const dashOffset = circumference * (1 - progress);
  const color = getScoreColor(score);

  return (
    <div className={cn("relative inline-flex flex-col items-center", className)}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/40"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="animate-score-fill transition-all duration-700"
          style={
            {
              "--score-offset": dashOffset,
            } as React.CSSProperties
          }
        />
      </svg>
      {/* Score number */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-bold tabular-nums"
          style={{
            color,
            fontSize: size * 0.3,
          }}
        >
          {Math.round(score)}
        </span>
      </div>
      {showLabel && (
        <span
          className="text-[10px] font-medium mt-1"
          style={{ color }}
        >
          {getScoreLabel(score)}
        </span>
      )}
    </div>
  );
}

/** Compact inline score badge */
export function ScoreBadge({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const color = getScoreColor(score);
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-bold tabular-nums",
        className
      )}
      style={{
        backgroundColor: `${color}15`,
        color,
        border: `1px solid ${color}30`,
      }}
    >
      {Math.round(score)}
    </span>
  );
}
