"use client";

import React, { useMemo } from "react";
import { BarChart, Bar, ResponsiveContainer, YAxis, Cell } from "recharts";
import type { OHLCVData } from "@/lib/analysis/types";

interface MiniVolumeBarProps {
  data: OHLCVData[];
  bars?: number;
  height?: number;
  className?: string;
}

export function MiniVolumeBar({
  data,
  bars = 10,
  height = 28,
  className,
}: MiniVolumeBarProps) {
  const chartData = useMemo(() => {
    const slice = data.slice(-bars);
    return slice.map((d) => ({
      date: d.date,
      volume: d.volume,
      isUp: d.close >= d.open,
    }));
  }, [data, bars]);

  if (chartData.length < 2) return null;

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <YAxis hide domain={[0, "dataMax"]} />
          <Bar dataKey="volume" radius={[1, 1, 0, 0]} isAnimationActive={false}>
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.isUp ? "#22c55e40" : "#ef444440"}
                stroke={entry.isUp ? "#22c55e80" : "#ef444480"}
                strokeWidth={0.5}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
