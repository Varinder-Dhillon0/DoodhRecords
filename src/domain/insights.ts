import type { MilkEntry, SummaryMetrics } from "../types";
import { getLocalDateString } from "../utils/dateUtils";
import { getStoredEntryEarnings } from "../utils/calculations";

export const TREND_WINDOW_DAYS = 7;

export type DayInsight = {
  activeDays: number;
  earningsDelta: number | null;
  fatDelta: number | null;
};

export const shiftDateString = (
  dateString: string,
  offsetDays: number,
): string => {
  const [year, month, day] = dateString.split("-").map(Number);
  return getLocalDateString(new Date(year, month - 1, day + offsetDays));
};

export const calculateDayInsight = ({
  entries = [],
  selectedDate,
  summary,
  windowDays = TREND_WINDOW_DAYS,
}: {
  entries?: MilkEntry[];
  selectedDate: string;
  summary: SummaryMetrics;
  windowDays?: number;
}): DayInsight | null => {
  const selectedDayEntries = entries.filter(
    (entry) => entry.date === selectedDate,
  );
  if (entries.length === 0 || selectedDayEntries.length === 0) return null;

  const byDay = new Map<string, { milk: number; fatWeight: number; earnings: number }>();
  for (let offset = 1; offset <= windowDays; offset += 1) {
    const dayKey = shiftDateString(selectedDate, -offset);
    const dayEntries = entries.filter((entry) => entry.date === dayKey);
    if (dayEntries.length === 0) continue;

    let milk = 0;
    let fatWeight = 0;
    let earnings = 0;
    for (const entry of dayEntries) {
      const quantity = Number(entry.milk_quantity || 0);
      milk += quantity;
      fatWeight += quantity * Number(entry.fat_percentage || 0);
      earnings += getStoredEntryEarnings(entry);
    }
    byDay.set(dayKey, { milk, fatWeight, earnings });
  }

  if (byDay.size === 0) return null;

  const baselineEarnings =
    Array.from(byDay.values()).reduce((sum, day) => sum + day.earnings, 0) /
    byDay.size;
  const baselineFat =
    Array.from(byDay.values()).reduce((sum, day) => sum + day.fatWeight, 0) /
    Array.from(byDay.values()).reduce((sum, day) => sum + day.milk, 0);

  const currentFat = Number(summary.avgFat || 0);
  const fatDelta = Number((currentFat - baselineFat).toFixed(1));

  return {
    activeDays: byDay.size,
    earningsDelta:
      baselineEarnings > 0
        ? Number(
            (
              ((summary.totalEarnings - baselineEarnings) / baselineEarnings) *
              100
            ).toFixed(0),
          )
        : null,
    fatDelta:
      Number.isFinite(baselineFat) && baselineFat > 0 ? fatDelta : null,
  };
};
