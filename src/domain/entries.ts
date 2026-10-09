import type { MilkEntry, PricingConfig } from "../types";
import { calculateEntryEarnings } from "../utils/calculations";
import { getLocalDateString } from "../utils/dateUtils";
import { getMonthKey } from "./pricing";

export type PricedMilkEntry = MilkEntry & { earnings: number };

export const getCurrentMonthYear = (
  today: string = getLocalDateString(),
): { year: string; month: string } => ({
  year: today.slice(0, 4),
  month: today.slice(5, 7),
});

export const sortEntriesByDateDescending = (
  entries: MilkEntry[],
): MilkEntry[] =>
  [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

export const getPricedEntries = (
  entries: MilkEntry[] = [],
  pricingConfig: PricingConfig = {},
): PricedMilkEntry[] =>
  entries.map((entry) => ({
    ...entry,
    earnings: calculateEntryEarnings(entry, pricingConfig),
  }));

export const filterEntriesForMonth = <T extends MilkEntry>(
  entries: T[] = [],
  year: string,
  month: string,
  options: { sort?: "date-descending" | "preserve" } = {},
): T[] => {
  const prefix = getMonthKey(year, month);
  const filtered = entries.filter(
    (entry) => entry.date && entry.date.startsWith(prefix),
  );

  if (options.sort === "date-descending") {
    return sortEntriesByDateDescending(filtered) as T[];
  }

  return filtered;
};
