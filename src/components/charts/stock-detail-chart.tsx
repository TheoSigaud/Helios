"use client";

import React, { useEffect, useRef } from "react";
import type { OHLCVData } from "@/lib/analysis/types";

interface StockDetailChartProps {
  data: OHLCVData[];
  height?: number;
  className?: string;
}

export function StockDetailChart({
  data,
  height = 480,
  className,
}: StockDetailChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const initChart = async () => {
      const lc = await import("lightweight-charts");

      if (!containerRef.current) return;

      // Cleanup previous chart
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }

      const chart = lc.createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height,
        layout: {
          background: { type: lc.ColorType.Solid, color: "transparent" },
          textColor: "#94a3b8",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.03)" },
          horzLines: { color: "rgba(255,255,255,0.03)" },
        },
        crosshair: {
          mode: lc.CrosshairMode.Normal,
          vertLine: { color: "rgba(255,255,255,0.1)", style: lc.LineStyle.Dashed },
          horzLine: { color: "rgba(255,255,255,0.1)", style: lc.LineStyle.Dashed },
        },
        timeScale: {
          borderColor: "rgba(255,255,255,0.06)",
          timeVisible: false,
        },
        rightPriceScale: {
          borderColor: "rgba(255,255,255,0.06)",
        },
      });

      // Candlestick series (v5 API)
      const candleSeries = chart.addSeries(lc.CandlestickSeries, {
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderVisible: false,
        wickUpColor: "#22c55e80",
        wickDownColor: "#ef444480",
      });

      const candleData = data.map((d) => ({
        time: d.date,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));
      candleSeries.setData(candleData as any);

      // MA overlay lines
      const closes = data.map((d) => d.close);
      const addMALine = (period: number, color: string, title: string) => {
        if (closes.length < period) return;
        const maData: { time: string; value: number }[] = [];
        for (let i = period - 1; i < closes.length; i++) {
          let sum = 0;
          for (let j = i - period + 1; j <= i; j++) sum += closes[j];
          maData.push({
            time: data[i].date,
            value: Math.round((sum / period) * 100) / 100,
          });
        }
        const lineSeries = chart.addSeries(lc.LineSeries, {
          color,
          lineWidth: 1,
          title,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
        });
        lineSeries.setData(maData as any);
      };

      addMALine(30, "#3b82f6", "MA30");
      addMALine(50, "#f59e0b", "MA50");
      addMALine(200, "#a855f7", "MA200");

      // Volume histogram
      const volumeSeries = chart.addSeries(lc.HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });
      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 },
      });
      const volumeData = data.map((d) => ({
        time: d.date,
        value: d.volume,
        color: d.close >= d.open ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
      }));
      volumeSeries.setData(volumeData as any);

      chart.timeScale().fitContent();
      chartInstanceRef.current = chart;
    };

    initChart();

    const handleResize = () => {
      if (containerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [data, height]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height }}
    />
  );
}
