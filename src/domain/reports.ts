import type { MilkEntry } from "../types";
import type { PricedMilkEntry } from "./entries";
import { getMonthKey } from "./pricing";

export type MonthlyChartData = {
  labels: string[];
  milkValues: number[];
  fatValues: number[];
  earningValues: number[];
};

export const getDaysInMonth = (year: string, month: string): number => {
  const yearNumber = Number(year);
  const monthNumber = Number(month);
  return new Date(yearNumber, monthNumber, 0).getDate();
};

export const getMonthDayKey = (
  year: string,
  month: string,
  day: number,
): string => `${getMonthKey(year, month)}-${String(day).padStart(2, "0")}`;

export const aggregateDailyMilk = (
  entries: MilkEntry[],
  year: string,
  month: string,
): number[] => {
  const days = getDaysInMonth(year, month);
  return Array.from({ length: days }, (_, index) => {
    const targetDate = getMonthDayKey(year, month, index + 1);
    return entries
      .filter((entry) => entry.date === targetDate)
      .reduce((sum, entry) => sum + Number(entry.milk_quantity || 0), 0);
  });
};

export const aggregateDailyFat = (
  entries: MilkEntry[],
  year: string,
  month: string,
): number[] => {
  const days = getDaysInMonth(year, month);
  return Array.from({ length: days }, (_, index) => {
    const targetDate = getMonthDayKey(year, month, index + 1);
    const dayEntries = entries.filter((entry) => entry.date === targetDate);
    const totalMilk = dayEntries.reduce(
      (sum, entry) => sum + Number(entry.milk_quantity || 0),
      0,
    );
    const totalFatProduct = dayEntries.reduce(
      (sum, entry) =>
        sum + Number(entry.fat_percentage || 0) * Number(entry.milk_quantity || 0),
      0,
    );
    return totalMilk > 0 ? Number((totalFatProduct / totalMilk).toFixed(1)) : 0;
  });
};

export const aggregateDailyEarnings = (
  entries: PricedMilkEntry[],
  year: string,
  month: string,
): number[] => {
  const days = getDaysInMonth(year, month);
  return Array.from({ length: days }, (_, index) => {
    const targetDate = getMonthDayKey(year, month, index + 1);
    return entries
      .filter((entry) => entry.date === targetDate)
      .reduce((sum, entry) => sum + Number(entry.earnings || 0), 0);
  });
};

export const buildMonthlyChartData = (
  entries: PricedMilkEntry[],
  year: string,
  month: string,
): MonthlyChartData => {
  const days = getDaysInMonth(year, month);
  return {
    labels: Array.from({ length: days }, (_, index) => `${index + 1}`),
    milkValues: aggregateDailyMilk(entries, year, month),
    fatValues: aggregateDailyFat(entries, year, month),
    earningValues: aggregateDailyEarnings(entries, year, month),
  };
};
