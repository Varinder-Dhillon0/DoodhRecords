import { entryRepository, pricingRepository } from "../data/repositories";
import { resolveAnimalPricing } from "../domain/pricing";
import {
  parseMonthImportPayload,
  type MonthImportEntry,
  type MonthImportIssue,
} from "../domain/monthImport";
import type { MilkEntry, OperationResult } from "../types";

export type MonthImportSummary = {
  month: string;
  imported: number;
  skipped: number;
};

export class MonthImportValidationError extends Error {
  issues: MonthImportIssue[];

  constructor(issues: MonthImportIssue[]) {
    super("Month import validation failed");
    this.name = "MonthImportValidationError";
    this.issues = issues;
  }
}

const entryKey = (date: string, animal: string, shift: string): string =>
  `${date}|${animal}|${shift}`;

const toPricedEntry = (
  item: MonthImportEntry,
  id: number,
  cowRate: number,
  buffaloRate: number,
): MilkEntry => ({
  id,
  date: item.date,
  animal: item.animal,
  shift: item.shift,
  milk_quantity: item.milk_quantity,
  fat_percentage: item.fat_percentage,
  price: item.animal === "Cow" ? cowRate : buffaloRate,
  notes: item.notes,
});

/**
 * Imports one month of entries from JSON text. New rows are priced with the
 * file's rates (or the inherited previous-month rates when omitted) and
 * appended to the month; rows already stored for the same
 * date/animal/shift are skipped and counted. Rates from the file become the
 * month's own configuration.
 */
export const importMonthData = async (
  rawText: string,
  targetMonthKey: string,
): Promise<OperationResult<MonthImportSummary>> => {
  try {
    const parsed = parseMonthImportPayload(rawText, targetMonthKey);
    if (!parsed.ok) {
      return { ok: false, error: new MonthImportValidationError(parsed.issues) };
    }

    const [year, month] = parsed.value.month.split("-");
    const [existing, pricingConfig] = await Promise.all([
      entryRepository.listForMonth(year, month),
      pricingRepository.load(),
    ]);

    const effective = parsed.value.rates ??
      resolveAnimalPricing(pricingConfig, year, month);

    const storedKeys = new Set(
      existing.map((item) => entryKey(item.date, item.animal, item.shift)),
    );
    let nextId = existing.reduce(
      (max, item) => Math.max(max, Number(item.id) || 0),
      0,
    );
    let skipped = 0;
    const merged = [...existing];
    for (const item of parsed.value.entries) {
      if (storedKeys.has(entryKey(item.date, item.animal, item.shift))) {
        skipped += 1;
        continue;
      }
      nextId += 1;
      merged.push(toPricedEntry(item, nextId, effective.Cow, effective.Buffalo));
      storedKeys.add(entryKey(item.date, item.animal, item.shift));
    }

    await entryRepository.writeMonth(year, month, merged);

    if (parsed.value.rates) {
      await pricingRepository.save(year, month, "Cow", effective.Cow);
      await pricingRepository.save(year, month, "Buffalo", effective.Buffalo);
    }

    return {
      ok: true,
      value: {
        month: parsed.value.month,
        imported: merged.length - existing.length,
        skipped,
      },
    };
  } catch (error) {
    return { ok: false, error };
  }
};
