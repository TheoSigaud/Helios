import type { OHLCVData } from '@/lib/analysis/types';

/**
 * Aggregates chronological daily OHLCV data into weekly OHLCV data.
 * A new week starts on Monday.
 * @param dailyData Chronological array of daily OHLCV data (oldest first)
 * @returns Chronological array of weekly OHLCV data
 */
export function aggregateToWeekly(dailyData: OHLCVData[]): OHLCVData[] {
  if (!dailyData || dailyData.length === 0) {
    return [];
  }

  const weeklyData: OHLCVData[] = [];
  
  let currentWeekStart: Date | null = null;
  let currentWeekData: OHLCVData | null = null;

  // Helper to get the Monday of a given date's week (assuming Monday is start of trading week)
  const getWeekStart = (dateStr: string): Date => {
    const d = new Date(dateStr);
    const day = d.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  for (const bar of dailyData) {
    const barWeekStart = getWeekStart(bar.date);

    if (!currentWeekStart || barWeekStart.getTime() !== currentWeekStart.getTime()) {
      // Push the finished week
      if (currentWeekData) {
        weeklyData.push(currentWeekData);
      }
      
      // Start a new week
      currentWeekStart = barWeekStart;
      currentWeekData = {
        date: bar.date, // The date of the first trading day of this week
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
      };
    } else if (currentWeekData) {
      // Update the current week
      currentWeekData.high = Math.max(currentWeekData.high, bar.high);
      currentWeekData.low = Math.min(currentWeekData.low, bar.low);
      currentWeekData.close = bar.close; // Update close to the latest day in the week
      currentWeekData.volume += bar.volume;
      // Note: we don't update 'date' or 'open' since they represent the start of the week
    }
  }

  // Push the last week
  if (currentWeekData) {
    weeklyData.push(currentWeekData);
  }

  return weeklyData;
}
