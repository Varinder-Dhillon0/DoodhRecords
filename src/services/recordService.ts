import type { MilkEntry, OperationResult } from "../types";
import { entryRepository, runRepository } from "../data/repositories";

export const initializeRecordStore = (): Promise<OperationResult<void>> =>
  runRepository(() => entryRepository.initialize());

export const listRecords = (): Promise<OperationResult<MilkEntry[]>> =>
  runRepository(() => entryRepository.listAll());

export const createRecord = (
  entry: Omit<MilkEntry, "id" | "price"> & {
    id?: number;
    price?: number;
  },
): Promise<OperationResult<MilkEntry>> =>
  runRepository(() => entryRepository.create(entry));

export const updateRecord = (
  entry: MilkEntry,
  oldDate?: string | null,
): Promise<OperationResult<MilkEntry>> =>
  runRepository(() => entryRepository.replace(entry, oldDate));

export const deleteRecord = (
  entryId: number,
  dateString: string,
): Promise<OperationResult<void>> =>
  runRepository(() => entryRepository.remove(entryId, dateString));
