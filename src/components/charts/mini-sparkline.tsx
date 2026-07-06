"use client";

import React, { useMemo, useId } from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  YAxis,
} from "recharts";
import type { OHLCVData } from "@/lib/analysis/types";

interface MiniSparklineProps {
  data: OHLCVData[];
  days?: number;
  height?: number;
  width?: number;
  className?: string;
}

export function MiniSparkline({
  data,
  days = 30,
  height = 40,
  width,
  className,
}: MiniSparklineProps) {
  const chartData = useMemo(() => {
    const slice = data.slice(-days);
    return slice.map((d) => ({
      date: d.date,
      close: d.close,
    }));
  }, [data, days]);

  const isPositive = useMemo(() => {
    if (chartData.length < 2) return true;
    return chartData[chartData.length - 1].close >= chartData[0].close;
  }, [chartData]);

  const color = isPositive ? "#22c55e" : "#ef4444";
  const id = useId();
  const gradientId = useMemo(
    () => `sparkline-${id}`,
    [id]
  );

  if (chartData.length < 2) return null;

  return (
    <div className={className} style={{ width: width || "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Area
            type="monotone"
            dataKey="close"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
