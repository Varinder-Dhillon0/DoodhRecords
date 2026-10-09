import { useMemo, useState } from "react";
import type { MilkEntry, PricingConfig } from "../types";
import {
  filterEntriesForMonth,
  getCurrentMonthYear,
  getPricedEntries,
  type PricedMilkEntry,
} from "../domain/entries";

export const useCurrentMonthYear = () => {
  const current = getCurrentMonthYear();
  const [month, setMonth] = useState(current.month);
  const [year, setYear] = useState(current.year);

  return { month, year, setMonth, setYear };
};

export const usePricedEntries = (
  entries: MilkEntry[] = [],
  pricingConfig: PricingConfig = {},
): PricedMilkEntry[] =>
  useMemo(() => getPricedEntries(entries, pricingConfig), [entries, pricingConfig]);

export const useEntriesForMonth = <T extends MilkEntry>(
  entries: T[] = [],
  year: string,
  month: string,
  options: { sort?: "date-descending" | "preserve" } = {},
): T[] =>
  useMemo(
    () => filterEntriesForMonth(entries, year, month, options),
    // options is a small inline object at call sites; stringify keeps the memo stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, year, month, JSON.stringify(options)],
  );
