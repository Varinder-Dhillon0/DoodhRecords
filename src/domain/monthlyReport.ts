import type { AnimalPricing, PricingConfig } from "../types";
import type { PricedMilkEntry } from "./entries";
import { getDaysInMonth, getMonthDayKey } from "./reports";
import { getMonthKey, resolveAnimalPricing } from "./pricing";

export type MonthlyReportSlot = {
  quantity: number;
  fat: number;
  amount: number;
} | null;

export type MonthlyReportAnimalBlock = {
  day: MonthlyReportSlot;
  night: MonthlyReportSlot;
  total: number;
};

export type MonthlyReportDay = {
  date: string;
  label: string;
  buffalo: MonthlyReportAnimalBlock;
  cow: MonthlyReportAnimalBlock;
  dailyTotal: number;
};

export type MonthlyReport = {
  year: string;
  month: string;
  title: string;
  monthLabel: string;
  rates: AnimalPricing;
  days: MonthlyReportDay[];
  monthlyTotal: number;
};

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const LONG_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const formatReportDayLabel = (dateString: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!match) return dateString;
  const [, year, month, day] = match;
  const monthIndex = Number(month) - 1;
  const shortMonth = SHORT_MONTHS[monthIndex] ?? month;
  return `${day} ${shortMonth}, ${year}`;
};

export const getReportMonthLabel = (year: string, month: string): string => {
  const monthIndex = Number(month) - 1;
  const longMonth = LONG_MONTHS[monthIndex] ?? month;
  return `${longMonth} ${year}`;
};

type SlotAccumulator = {
  quantity: number;
  fatProduct: number;
  amount: number;
};

const accumulateSlot = (
  entries: PricedMilkEntry[],
  date: string,
  animal: "Cow" | "Buffalo",
  shift: "Morning" | "Evening",
): SlotAccumulator | null => {
  const matches = entries.filter(
    (entry) =>
      entry.date === date && entry.animal === animal && entry.shift === shift,
  );
  if (matches.length === 0) return null;

  return matches.reduce<SlotAccumulator>(
    (sum, entry) => {
      const quantity = Number(entry.milk_quantity || 0);
      const fat = Number(entry.fat_percentage || 0);
      return {
        quantity: sum.quantity + quantity,
        fatProduct: sum.fatProduct + quantity * fat,
        amount: sum.amount + Number(entry.earnings || 0),
      };
    },
    { quantity: 0, fatProduct: 0, amount: 0 },
  );
};

const toSlot = (accumulated: SlotAccumulator | null): MonthlyReportSlot => {
  if (!accumulated || accumulated.quantity <= 0) return null;
  const fat =
    accumulated.quantity > 0
      ? Number((accumulated.fatProduct / accumulated.quantity).toFixed(1))
      : 0;
  return {
    quantity: Number(accumulated.quantity.toFixed(1)),
    fat,
    amount: Math.round(accumulated.amount),
  };
};

/**
 * Builds the per-day DAY/NIGHT/TOTAL structure used by the monthly milk
 * report. Amounts come from priced-entry earnings (qty x fat x rate), so
 * totals stay consistent with Home and Reports screens.
 */
export const buildMonthlyMilkReport = (
  entries: PricedMilkEntry[] = [],
  pricingConfig: PricingConfig = {},
  year: string,
  month: string,
): MonthlyReport => {
  const monthKey = getMonthKey(year, month);
  const rates = resolveAnimalPricing(pricingConfig, year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const monthEntries = entries.filter(
    (entry) => entry.date && entry.date.startsWith(monthKey),
  );

  const days: MonthlyReportDay[] = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = getMonthDayKey(year, month, day);
    const hasEntries = monthEntries.some((entry) => entry.date === date);
    if (!hasEntries) continue;

    const buffaloDay = toSlot(accumulateSlot(monthEntries, date, "Buffalo", "Morning"));
    const buffaloNight = toSlot(
      accumulateSlot(monthEntries, date, "Buffalo", "Evening"),
    );
    const cowDay = toSlot(accumulateSlot(monthEntries, date, "Cow", "Morning"));
    const cowNight = toSlot(accumulateSlot(monthEntries, date, "Cow", "Evening"));

    const buffaloTotal = Math.round(
      (buffaloDay?.amount ?? 0) + (buffaloNight?.amount ?? 0),
    );
    const cowTotal = Math.round((cowDay?.amount ?? 0) + (cowNight?.amount ?? 0));

    days.push({
      date,
      label: formatReportDayLabel(date),
      buffalo: { day: buffaloDay, night: buffaloNight, total: buffaloTotal },
      cow: { day: cowDay, night: cowNight, total: cowTotal },
      dailyTotal: buffaloTotal + cowTotal,
    });
  }

  const monthlyTotal = days.reduce((sum, day) => sum + day.dailyTotal, 0);
  const monthLabel = getReportMonthLabel(year, month);

  return {
    year,
    month: String(month).padStart(2, "0"),
    title: `Monthly Milk Report - ${monthLabel}`,
    monthLabel,
    rates,
    days,
    monthlyTotal,
  };
};

export const createMonthlyReportFileName = (report: MonthlyReport): string => {
  const compactMonth = report.monthLabel.replace(/\s+/g, "-");
  return `DoodhRecords-${compactMonth}.pdf`;
};
