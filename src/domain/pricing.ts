import type { Animal, AnimalPricing, PricingConfig } from "../types";
import { getYearAndMonth } from "../utils/dateUtils";
import { defaultPricing } from "../data/defaultData";

export const DEFAULT_ANIMAL_PRICING: AnimalPricing = {
  Cow: 8,
  Buffalo: 9,
};

export const getDefaultAnimalPricing = (): AnimalPricing => ({
  ...DEFAULT_ANIMAL_PRICING,
});

export const getMonthKey = (year: string, month: string): string =>
  `${year}-${String(month).padStart(2, "0")}`;

const toFiniteRate = (value: unknown, fallback: number): number => {
  const rate = Number(value ?? fallback);
  return Number.isFinite(rate) ? rate : fallback;
};

/** How far back a month without its own rates inherits configuration. */
export const MAX_PRICING_LOOKBACK_MONTHS = 240;

const shiftMonthKey = (year: string, month: string, delta: number): string => {
  const total = Number(year) * 12 + (Number(month) - 1) + delta;
  const shiftedYear = Math.floor(total / 12);
  const shiftedMonth = (total % 12) + 1;
  return `${shiftedYear}-${String(shiftedMonth).padStart(2, "0")}`;
};

/**
 * Latest configured month at or before the target month. A new month with
 * no rates of its own always picks these up until its first entry (or an
 * explicit save) gives it its own configuration.
 */
export const findInheritedMonthKey = (
  pricingConfig: PricingConfig = {},
  year: string,
  month: string,
): string | null => {
  for (let back = 1; back <= MAX_PRICING_LOOKBACK_MONTHS; back += 1) {
    const key = shiftMonthKey(year, month, -back);
    if (pricingConfig?.[key]) return key;
  }
  return null;
};

export const resolveAnimalPricing = (
  pricingConfig: PricingConfig = {},
  year: string,
  month: string,
): AnimalPricing => {
  const stored = pricingConfig?.[getMonthKey(year, month)];
  if (stored) {
    return {
      Cow: toFiniteRate(stored.Cow, DEFAULT_ANIMAL_PRICING.Cow),
      Buffalo: toFiniteRate(stored.Buffalo, DEFAULT_ANIMAL_PRICING.Buffalo),
    };
  }

  const inheritedKey = findInheritedMonthKey(pricingConfig, year, month);
  const inherited = inheritedKey ? pricingConfig?.[inheritedKey] : undefined;

  return {
    Cow: toFiniteRate(inherited?.Cow, DEFAULT_ANIMAL_PRICING.Cow),
    Buffalo: toFiniteRate(inherited?.Buffalo, DEFAULT_ANIMAL_PRICING.Buffalo),
  };
};

export const resolveAnimalRate = (
  pricingConfig: PricingConfig = {},
  year: string,
  month: string,
  animal: Animal,
): number => resolveAnimalPricing(pricingConfig, year, month)[animal];

export const resolveRatesForDate = (
  dateString: string | undefined,
  pricingConfig: PricingConfig = {},
): { cowPrice: number; buffaloPrice: number } => {
  const { year, month } = getYearAndMonth(dateString);
  const pricing = resolveAnimalPricing(pricingConfig, year, month);

  return {
    cowPrice: pricing.Cow,
    buffaloPrice: pricing.Buffalo,
  };
};

export const mergePricingConfig = (
  savedPricing: PricingConfig = {},
): PricingConfig => ({
  ...defaultPricing,
  ...savedPricing,
});
