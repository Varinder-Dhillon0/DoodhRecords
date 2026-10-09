import type { MilkEntry, PricingConfig, SummaryMetrics } from "../types";
import { getYearAndMonth } from "./dateUtils";
import { resolveAnimalRate } from "../domain/pricing";

/**
 * Mathematical calculations for dairy earnings and statistics
 */

export const calculateEarnings = (
  milkQuantity: number | string,
  fatPercentage: number | string,
  pricePerFat: number,
): number => {
  const qty = Number(milkQuantity || 0);
  const fat = Number(fatPercentage || 0);
  const price = Number(pricePerFat || 0);
  if (isNaN(qty) || isNaN(fat) || isNaN(price)) return 0;
  return Number((qty * fat * price).toFixed(2));
};

export const calculateEntryEarnings = (
  entry: Pick<
    MilkEntry,
    "date" | "animal" | "milk_quantity" | "fat_percentage"
  >,
  pricingConfig: PricingConfig,
): number => {
  const { year, month } = getYearAndMonth(entry.date);
  const price = resolveAnimalRate(pricingConfig, year, month, entry.animal);

  return calculateEarnings(entry.milk_quantity, entry.fat_percentage, price);
};

export const getStoredEntryEarnings = (
  entry: Pick<MilkEntry, "milk_quantity" | "fat_percentage" | "price">,
): number =>
  Number(entry.milk_quantity || 0) *
  Number(entry.fat_percentage || 0) *
  Number(entry.price || 0);

export const calculateSummary = (entries: MilkEntry[] = []): SummaryMetrics => {
  let totalMilk = 0;
  let totalFatWeight = 0;
  let totalEarnings = 0;

  if (Array.isArray(entries)) {
    entries.forEach((entry) => {
      const milk = Number(entry.milk_quantity || 0);
      const fat = Number(entry.fat_percentage || 0);
      const earnings = Number(
        entry.fat_percentage * entry.milk_quantity * entry.price,
      );

      totalMilk += milk;
      totalFatWeight += milk * fat;
      totalEarnings += earnings;
    });
  }

  const avgFat =
    totalMilk > 0 ? (totalFatWeight / totalMilk).toFixed(1) : "0.0";

  return {
    totalMilk: Number(totalMilk.toFixed(1)),
    avgFat,
    totalEarnings: Number(totalEarnings.toFixed(2)),
  };
};
