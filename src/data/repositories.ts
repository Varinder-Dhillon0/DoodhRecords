import type {
  Animal,
  MilkEntry,
  OperationResult,
  PricingConfig,
} from "../types";
import {
  addEntry,
  deleteEntry,
  getPriceForEntry,
  getPricingConfig,
  getStoredFontScale,
  getStoredLanguage,
  initializeStorage,
  readAllEntries,
  savePricingConfig,
  saveStoredFontScale,
  saveStoredLanguage,
  updateEntry,
} from "../utils/storageManager";

export type RepositoryResult<T> = OperationResult<T>;

export const runRepository = async <T>(
  operation: () => Promise<T>,
): Promise<RepositoryResult<T>> => {
  try {
    return { ok: true, value: await operation() };
  } catch (error) {
    return { ok: false, error };
  }
};

export interface EntryRepository {
  initialize(): Promise<void>;
  listAll(): Promise<MilkEntry[]>;
  create(
    entry: Omit<MilkEntry, "id" | "price"> & {
      id?: number;
      price?: number;
    },
  ): Promise<MilkEntry>;
  replace(entry: MilkEntry, oldDate?: string | null): Promise<MilkEntry>;
  remove(entryId: number, dateString: string): Promise<void>;
}

export const entryRepository: EntryRepository = {
  initialize: () => initializeStorage(),
  listAll: () => readAllEntries(),
  create: (entry) => addEntry(entry),
  replace: (entry, oldDate = null) => updateEntry(entry, oldDate),
  remove: (entryId, dateString) => deleteEntry(entryId, dateString),
};

export interface PricingRepository {
  load(): Promise<PricingConfig>;
  rateForEntry(animal: Animal, dateString: string): Promise<number>;
  save(
    year: string,
    month: string,
    animal: Animal,
    price: number,
  ): Promise<void>;
}

export const pricingRepository: PricingRepository = {
  load: () => getPricingConfig(),
  rateForEntry: (animal, dateString) => getPriceForEntry(animal, dateString),
  save: (year, month, animal, price) =>
    savePricingConfig(year, month, animal, price),
};

export interface PreferenceRepository {
  loadLanguage(): Promise<string | null>;
  saveLanguage(language: string): Promise<void>;
  loadFontScale(): Promise<number | null>;
  saveFontScale(scale: number): Promise<void>;
}

export const preferenceRepository: PreferenceRepository = {
  loadLanguage: () => getStoredLanguage(),
  saveLanguage: (language) => saveStoredLanguage(language),
  loadFontScale: () => getStoredFontScale(),
  saveFontScale: (scale) => saveStoredFontScale(scale),
};
