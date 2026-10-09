import type { Animal, AnimalPricing } from "../types";
import { getDefaultAnimalPricing } from "./pricing";
import { MAX_FAT_PERCENTAGE, MAX_MILK_QUANTITY } from "./validation";

export const MONTH_IMPORT_FORMAT = "doodh-records-month-import";
export const MONTH_IMPORT_VERSION = 1;

/** Guards against accidentally huge pastes/payloads. */
export const MAX_IMPORT_ENTRIES = 1000;
export const MAX_NOTES_LENGTH = 200;

export type MonthImportEntry = {
  date: string;
  animal: Animal;
  shift: "Morning" | "Evening";
  milk_quantity: number;
  fat_percentage: number;
  notes: string;
};

export type MonthImportPayload = {
  month: string;
  rates?: AnimalPricing;
  entries: MonthImportEntry[];
};

export type MonthImportIssue = {
  /** Full i18n key under settings.importIssues, e.g. "settings.importIssues.invalidJson". */
  key: string;
  params?: Record<string, string | number>;
};

export type MonthImportParseResult =
  | { ok: true; value: MonthImportPayload }
  | { ok: false; issues: MonthImportIssue[] };

const ANIMALS: Animal[] = ["Cow", "Buffalo"];
const SHIFTS = ["Morning", "Evening"] as const;

const isValidMonthKey = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

const isRealCalendarDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return false;
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
  );
};

/**
 * Canonical sample shown in (and loadable from) the import dialog. Prices
 * follow the same shape as the export pricing blocks.
 */
export const buildMonthImportSample = (monthKey: string): string =>
  JSON.stringify(
    {
      format: MONTH_IMPORT_FORMAT,
      formatVersion: MONTH_IMPORT_VERSION,
      month: monthKey,
      rates: getDefaultAnimalPricing(),
      entries: [
        {
          date: `${monthKey}-01`,
          animal: "Buffalo",
          shift: "Morning",
          milk_quantity: 15.5,
          fat_percentage: 6.5,
          notes: "",
        },
        {
          date: `${monthKey}-01`,
          animal: "Cow",
          shift: "Evening",
          milk_quantity: 20,
          fat_percentage: 4.2,
          notes: "",
        },
      ],
    },
    null,
    2,
  );

/**
 * Parses pasted/picked JSON and validates it against the per-month import
 * shape. Never throws: every problem (malformed JSON, wrong envelope,
 * month mismatch, bad rows) comes back as a translatable issue so the
 * dialog can list exactly what to fix.
 */
export const parseMonthImportPayload = (
  rawText: string,
  targetMonthKey: string,
): MonthImportParseResult => {
  const issues: MonthImportIssue[] = [];

  if (!rawText || !rawText.trim()) {
    return { ok: false, issues: [{ key: "settings.importIssues.emptyInput" }] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { ok: false, issues: [{ key: "settings.importIssues.invalidJson" }] };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, issues: [{ key: "settings.importIssues.notAnObject" }] };
  }

  const payload = parsed as Record<string, unknown>;

  if (payload.format !== MONTH_IMPORT_FORMAT) {
    issues.push({ key: "settings.importIssues.badFormat" });
  }
  if (payload.formatVersion !== MONTH_IMPORT_VERSION) {
    issues.push({
      key: "settings.importIssues.badVersion",
      params: { version: MONTH_IMPORT_VERSION },
    });
  }

  if (!isValidMonthKey(payload.month)) {
    issues.push({ key: "settings.importIssues.badMonth" });
  } else if (payload.month !== targetMonthKey) {
    issues.push({
      key: "settings.importIssues.monthMismatch",
      params: { expected: targetMonthKey, found: payload.month },
    });
  }

  let rates: AnimalPricing | undefined;
  if (payload.rates !== undefined) {
    const rawRates = payload.rates as Record<string, unknown>;
    const cow = Number(rawRates?.Cow);
    const buffalo = Number(rawRates?.Buffalo);
    const valid =
      rawRates &&
      typeof rawRates === "object" &&
      Number.isFinite(cow) &&
      cow > 0 &&
      Number.isFinite(buffalo) &&
      buffalo > 0;
    if (!valid) {
      issues.push({ key: "settings.importIssues.badRates" });
    } else {
      rates = { Cow: cow, Buffalo: buffalo };
    }
  }

  if (!Array.isArray(payload.entries)) {
    issues.push({ key: "settings.importIssues.entriesNotArray" });
  } else if (payload.entries.length === 0) {
    issues.push({ key: "settings.importIssues.noEntries" });
  } else if (payload.entries.length > MAX_IMPORT_ENTRIES) {
    issues.push({
      key: "settings.importIssues.tooManyEntries",
      params: { max: MAX_IMPORT_ENTRIES },
    });
  }

  const entries: MonthImportEntry[] = [];
  const seen = new Map<string, number>();
  if (Array.isArray(payload.entries) && payload.entries.length > 0) {
    payload.entries.forEach((raw, index) => {
      const row = index + 1;
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        issues.push({
          key: "settings.importIssues.badRow",
          params: { row },
        });
        return;
      }
      const item = raw as Record<string, unknown>;
      const date = typeof item.date === "string" ? item.date : "";
      const animal = item.animal as Animal;
      const shift = item.shift as MonthImportEntry["shift"];
      const milk = Number(item.milk_quantity);
      const fat = Number(item.fat_percentage);
      const notes = item.notes === undefined ? "" : item.notes;

      if (!isRealCalendarDate(date)) {
        issues.push({
          key: "settings.importIssues.badDate",
          params: { row, date: date || "—" },
        });
        return;
      }
      if (isValidMonthKey(payload.month) && !date.startsWith(`${payload.month}-`)) {
        issues.push({
          key: "settings.importIssues.dateOutsideMonth",
          params: { row, date, month: String(payload.month) },
        });
        return;
      }
      if (!ANIMALS.includes(animal)) {
        issues.push({
          key: "settings.importIssues.badAnimal",
          params: { row, value: String(item.animal ?? "—") },
        });
        return;
      }
      if (!SHIFTS.includes(shift)) {
        issues.push({
          key: "settings.importIssues.badShift",
          params: { row, value: String(item.shift ?? "—") },
        });
        return;
      }
      if (!Number.isFinite(milk) || milk <= 0 || milk > MAX_MILK_QUANTITY) {
        issues.push({
          key: "settings.importIssues.badMilk",
          params: { row, max: MAX_MILK_QUANTITY },
        });
        return;
      }
      if (!Number.isFinite(fat) || fat <= 0 || fat > MAX_FAT_PERCENTAGE) {
        issues.push({
          key: "settings.importIssues.badFat",
          params: { row, max: MAX_FAT_PERCENTAGE },
        });
        return;
      }
      if (typeof notes !== "string" || notes.length > MAX_NOTES_LENGTH) {
        issues.push({
          key: "settings.importIssues.badNotes",
          params: { row, max: MAX_NOTES_LENGTH },
        });
        return;
      }

      const dedupeKey = `${date}|${animal}|${shift}`;
      const firstRow = seen.get(dedupeKey);
      if (firstRow !== undefined) {
        issues.push({
          key: "settings.importIssues.duplicateRow",
          params: { row, firstRow },
        });
        return;
      }
      seen.set(dedupeKey, row);
      entries.push({ date, animal, shift, milk_quantity: milk, fat_percentage: fat, notes });
    });
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    value: {
      month: String(payload.month),
      ...(rates ? { rates } : {}),
      entries,
    },
  };
};
