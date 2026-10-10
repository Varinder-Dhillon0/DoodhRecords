import type {
  Animal,
  MilkEntry,
  OperationResult,
  PendingAppUpdate,
  PricingConfig,
} from "../types";
import {
  addEntry,
  clearStoredPendingUpdate,
  deleteEntry,
  getPriceForEntry,
  getPricingConfig,
  getStoredFontScale,
  getStoredLanguage,
  getStoredPendingUpdate,
  getStoredReportDirectory,
  initializeStorage,
  readAllEntries,
  readEntriesForMonth,
  savePricingConfig,
  saveStoredFontScale,
  saveStoredLanguage,
  saveStoredPendingUpdate,
  saveStoredReportDirectory,
  updateEntry,
  writeEntriesForMonth,
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
  listForMonth(year: string, month: string): Promise<MilkEntry[]>;
  writeMonth(year: string, month: string, entries: MilkEntry[]): Promise<void>;
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
  listForMonth: (year, month) => readEntriesForMonth(year, month),
  writeMonth: (year, month, entries) => writeEntriesForMonth(year, month, entries),
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
  loadReportDirectory(): Promise<string | null>;
  saveReportDirectory(directoryUri: string): Promise<void>;
  loadPendingUpdate(): Promise<PendingAppUpdate | null>;
  savePendingUpdate(pending: PendingAppUpdate): Promise<void>;
  clearPendingUpdate(): Promise<void>;
}

export const preferenceRepository: PreferenceRepository = {
  loadLanguage: () => getStoredLanguage(),
  saveLanguage: (language) => saveStoredLanguage(language),
  loadFontScale: () => getStoredFontScale(),
  saveFontScale: (scale) => saveStoredFontScale(scale),
  loadReportDirectory: () => getStoredReportDirectory(),
  saveReportDirectory: (directoryUri) =>
    saveStoredReportDirectory(directoryUri),
  loadPendingUpdate: () => getStoredPendingUpdate(),
  savePendingUpdate: (pending) => saveStoredPendingUpdate(pending),
  clearPendingUpdate: () => clearStoredPendingUpdate(),
};
