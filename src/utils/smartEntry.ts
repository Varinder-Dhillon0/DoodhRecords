/**
 * Smart entry helpers.
 *
 * Two independent concerns live here:
 *  - which (session, animal) slot the user should fill next for a given date
 *  - which values are worth offering as one-tap quick selections, learned from
 *    the user's own history instead of a hardcoded list
 */
import { Animal, MilkEntry, Shift } from "../types";
import { getLocalDateString, parseLocalDate } from "./dateUtils";

export type EntryCombination = {
  shift: Shift;
  animal: Animal;
};

export type SmartField = "milk" | "fat";

export type SmartSuggestion = {
  value: number;
  /** Most frequently used value for the current context. */
  isPrimary: boolean;
  count: number;
};

/** The order a day is filled in when the app advances automatically. */
export const ENTRY_COMBINATION_ORDER: EntryCombination[] = [
  { shift: "Morning", animal: "Cow" },
  { shift: "Morning", animal: "Buffalo" },
  { shift: "Evening", animal: "Cow" },
  { shift: "Evening", animal: "Buffalo" },
];

export const getCombinationKey = (shift: Shift, animal: Animal): string =>
  `${shift}-${animal}`;

const MS_PER_DAY = 86_400_000;

const daysSince = (date: string, referenceDate: string): number => {
  const from = parseLocalDate(date).getTime();
  const to = parseLocalDate(referenceDate).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.max(0, (to - from) / MS_PER_DAY);
};

/** Combinations already recorded for a date. */
export const getFilledCombinationKeys = (
  date: string,
  entries: MilkEntry[],
): Set<string> => {
  const filled = new Set<string>();

  entries.forEach((entry) => {
    if (entry.date === date) {
      filled.add(getCombinationKey(entry.shift, entry.animal));
    }
  });

  return filled;
};

/** First slot in the canonical order that has no record yet, or null when done. */
export const getNextCombination = (
  date: string,
  entries: MilkEntry[],
): EntryCombination | null => {
  const filled = getFilledCombinationKeys(date, entries);
  return (
    ENTRY_COMBINATION_ORDER.find(
      (combination) =>
        !filled.has(getCombinationKey(combination.shift, combination.animal)),
    ) ?? null
  );
};

export const isDayComplete = (date: string, entries: MilkEntry[]): boolean => {
  const filled = getFilledCombinationKeys(date, entries);
  return ENTRY_COMBINATION_ORDER.every((combination) =>
    filled.has(getCombinationKey(combination.shift, combination.animal)),
  );
};

const FIELD_CONFIG = {
  milk: {
    read: (entry: MilkEntry) => Number(entry.milk_quantity),
    decimals: 2,
    proximitySpan: 2.5,
    step: 0.5,
  },
  fat: {
    read: (entry: MilkEntry) => Number(entry.fat_percentage),
    decimals: 1,
    proximitySpan: 0.8,
    step: 0.1,
  },
} as const;

export const getFieldStep = (field: SmartField): number => FIELD_CONFIG[field].step;

/** Milk keeps up to two decimals so exact values like 6.75 survive a re-render. */
export const formatFieldValue = (field: SmartField, value: number): string => {
  const { decimals } = FIELD_CONFIG[field];
  const rounded = Number(Number(value).toFixed(decimals));
  if (!Number.isFinite(rounded)) return "0";
  return decimals === 1 ? rounded.toFixed(1) : String(rounded);
};

/** Occurrences older than a half-life are worth half as much as fresh ones. */
const RECENCY_HALF_LIFE_DAYS = 60;

const recencyWeight = (ageDays: number): number =>
  Math.pow(0.5, ageDays / RECENCY_HALF_LIFE_DAYS);

type Bucket = {
  value: number;
  count: number;
  /** Recency-weighted occurrences in the same animal + session. */
  contextWeight: number;
  /** Recency-weighted occurrences across every record. */
  anyWeight: number;
};

/**
 * Least-squares slope of value over time for a context's history, normalised to
 * roughly -1..1 so it can be mixed into the ranking score.
 */
const computeTrend = (history: { value: number; day: number }[]): number => {
  if (history.length < 3) return 0;

  const n = history.length;
  let sumX = 0;
  let sumY = 0;
  history.forEach((point) => {
    sumX += point.day;
    sumY += point.value;
  });
  const meanX = sumX / n;
  const meanY = sumY / n;

  let covariance = 0;
  let variance = 0;
  history.forEach((point) => {
    covariance += (point.day - meanX) * (point.value - meanY);
    variance += Math.pow(point.day - meanX, 2);
  });

  if (variance === 0) return 0;

  const slope = covariance / variance;
  const span = Math.max(...history.map((point) => point.value)) -
    Math.min(...history.map((point) => point.value));

  if (span === 0) return 0;
  return Math.max(-1, Math.min(1, (slope * span) / Math.max(1, meanY)));
};

/**
 * Ranks observed values for the current animal + session by frequency, recency,
 * context, trend and proximity to what is already in the field.
 */
export const getFieldSuggestions = (
  entries: MilkEntry[],
  options: {
    animal: Animal;
    shift: Shift;
    field: SmartField;
    current: number;
    limit?: number;
    referenceDate?: string;
  },
): SmartSuggestion[] => {
  const { animal, shift, field, current } = options;
  const limit = options.limit ?? 4;
  const referenceDate = options.referenceDate ?? getLocalDateString();
  const config = FIELD_CONFIG[field];
  const quantum = config.decimals === 1 ? 0.1 : 0.05;

  const buckets = new Map<number, Bucket>();
  const contextHistory: { value: number; day: number }[] = [];

  const bucketFor = (value: number): Bucket => {
    let bucket = buckets.get(value);
    if (!bucket) {
      bucket = { value, count: 0, contextWeight: 0, anyWeight: 0 };
      buckets.set(value, bucket);
    }
    return bucket;
  };

  entries.forEach((entry) => {
    const raw = config.read(entry);
    if (!Number.isFinite(raw) || raw <= 0) return;

    const value = Number((Math.round(raw / quantum) * quantum).toFixed(config.decimals));
    const age = daysSince(entry.date, referenceDate);
    const weight = recencyWeight(age);
    const isSameAnimal = entry.animal === animal;
    const isSameShift = entry.shift === shift;

    const bucket = bucketFor(value);
    bucket.count += 1;
    bucket.anyWeight += weight;
    if (isSameAnimal && isSameShift) {
      bucket.contextWeight += weight;
    }

    if (isSameAnimal && isSameShift) {
      contextHistory.push({ value, day: age });
    }
  });

  if (buckets.size === 0) return [];

  const trend = computeTrend(contextHistory);
  const meanValue =
    contextHistory.reduce((sum, point) => sum + point.value, 0) /
    Math.max(1, contextHistory.length);
  const safeCurrent = Number.isFinite(current) && current > 0 ? current : meanValue;

  const scored = Array.from(buckets.values()).map((bucket) => {
    const trendBonus = trend * (bucket.value - meanValue) * 0.6;
    const proximityBonus =
      0.5 * Math.exp(-Math.abs(bucket.value - safeCurrent) / config.proximitySpan);
    const score =
      2.4 * bucket.contextWeight +
      1 * bucket.anyWeight +
      0.5 * bucket.count +
      trendBonus +
      proximityBonus;

    return { ...bucket, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const primary = scored.reduce((best, candidate) => {
    if (!best) return candidate;
    if (candidate.count > best.count) return candidate;
    if (candidate.count === best.count && candidate.score > best.score) {
      return candidate;
    }
    return best;
  }, scored[0]);

  const ranked = scored.slice(0, limit);
  const hasPrimary = ranked.some((item) => item.value === primary.value);
  const suggestions = hasPrimary
    ? ranked
    : [...ranked.slice(0, limit - 1), primary];

  return suggestions.map((item) => ({
    value: item.value,
    isPrimary: item.value === primary.value,
    count: item.count,
  }));
};