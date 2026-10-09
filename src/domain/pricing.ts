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

export const resolveAnimalPricing = (
  pricingConfig: PricingConfig = {},
  year: string,
  month: string,
): AnimalPricing => {
  const stored = pricingConfig?.[getMonthKey(year, month)];

  return {
    Cow: toFiniteRate(stored?.Cow, DEFAULT_ANIMAL_PRICING.Cow),
    Buffalo: toFiniteRate(stored?.Buffalo, DEFAULT_ANIMAL_PRICING.Buffalo),
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
