import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Animal, DoodhContextType, MilkEntry, PricingConfig } from "../types";
import { defaultEntries, defaultPricing } from "../data/defaultData";
import {
  getDefaultAnimalPricing,
  getMonthKey,
  resolveAnimalPricing,
} from "../domain/pricing";
import { getYearAndMonth } from "../utils/dateUtils";
import {
  createRecord,
  deleteRecord,
  initializeRecordStore,
  listRecords,
  updateRecord,
} from "../services/recordService";
import { getRateForRecord, loadPricing, saveRate } from "../services/pricingService";


const DoodhContext = createContext<DoodhContextType | null>(null);

export function DoodhProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<MilkEntry[]>([]);
  const [pricingConfig, setPricingConfig] =
    useState<PricingConfig>(defaultPricing);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const initializeResult = await initializeRecordStore();
      if (!initializeResult.ok) throw initializeResult.error;
      const [pricingResult, entriesResult] = await Promise.all([
        loadPricing(),
        listRecords(),
      ]);

      if (!pricingResult.ok) throw pricingResult.error;
      if (!entriesResult.ok) throw entriesResult.error;

      setPricingConfig(pricingResult.value);
      setEntries(
        entriesResult.value.length ? entriesResult.value : defaultEntries,
      );
    } catch (error) {
      console.error("Unable to load Doodh data:", error);
      setPricingConfig(defaultPricing);
      setEntries(defaultEntries);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveConfig = useCallback(
    async (
      yearStr: string,
      monthStr: string,
      animal: Animal,
      price: number,
    ) => {
      const month = String(monthStr).padStart(2, "0");
      const year = String(yearStr);
      const key = getMonthKey(year, month);

      const saveResult = await saveRate(year, month, animal, price);
      if (!saveResult.ok) return saveResult;
      setPricingConfig((prev) => ({
        ...prev,
        [key]: {
          ...(prev[key] || getDefaultAnimalPricing()),
          [animal]: Number(price),
        },
      }));
      return { ok: true as const, value: undefined };
    },
    [],
  );

  const handleAddEntry = useCallback(
    async (
      entry: Omit<MilkEntry, "id" | "price"> & {
        id?: number;
        price?: number;
      },
    ) => {
      const rateResult = await getRateForRecord(entry.animal, entry.date);
      if (!rateResult.ok) return rateResult;
      const createResult = await createRecord({
        ...entry,
        price: rateResult.value,
      });
      if (!createResult.ok) return createResult;
      setEntries((prev) => [...prev, createResult.value]);

      // The first entry created in a month without its own rates snapshots
      // the inherited previous-month rates as that month's own
      // configuration, so later changes to earlier months can't move it.
      const { year, month } = getYearAndMonth(entry.date);
      const key = getMonthKey(year, month);
      if (!pricingConfig[key]) {
        const inherited = resolveAnimalPricing(pricingConfig, year, month);
        const cowResult = await saveRate(year, month, "Cow", inherited.Cow);
        const buffaloResult = cowResult.ok
          ? await saveRate(year, month, "Buffalo", inherited.Buffalo)
          : cowResult;
        if (!cowResult.ok || !buffaloResult.ok) {
          console.error("Unable to snapshot month pricing:", {
            cowResult,
            buffaloResult,
          });
        } else {
          setPricingConfig((prev) =>
            prev[key] ? prev : { ...prev, [key]: inherited },
          );
        }
      }
      return { ok: true as const, value: createResult.value };
    },
    [pricingConfig],
  );

  const handleUpdateEntry = useCallback(
    async (entry: MilkEntry, oldDate: string | null = null) => {
      const rateResult = await getRateForRecord(entry.animal, entry.date);
      if (!rateResult.ok) return rateResult;
      const updatedEntry: MilkEntry = {
        ...entry,
        price: rateResult.value,
      };
      const updateResult = await updateRecord(updatedEntry, oldDate);
      if (!updateResult.ok) return updateResult;
      setEntries((prev) =>
        prev.map((item) =>
          Number(item.id) === Number(updateResult.value.id) ? updateResult.value : item,
        ),
      );
      return { ok: true as const, value: updateResult.value };
    },
    [],
  );

  const handleDeleteEntry = useCallback(
    async (entryId: number, dateString: string) => {
      const deleteResult = await deleteRecord(entryId, dateString);
      if (!deleteResult.ok) return deleteResult;
      setEntries((prev) =>
        prev.filter(
          (item) =>
            !(
              Number(item.id) === Number(entryId) &&
              item.date === dateString
            ),
        ),
      );
      return { ok: true as const, value: undefined };
    },
    [],
  );

  const refreshEntries = useCallback(async () => {
    const savedResult = await listRecords();
    if (!savedResult.ok) return savedResult;
    setEntries(
      savedResult.value.length ? savedResult.value : defaultEntries,
    );
    return { ok: true as const, value: undefined };
  }, []);

  const value: DoodhContextType = {
    entries,
    pricingConfig,
    isLoading,
    loadData,
    refreshEntries,
    saveConfig,
    addEntry: handleAddEntry,
    updateEntry: handleUpdateEntry,
    deleteEntry: handleDeleteEntry,
  };

  return (
    <DoodhContext.Provider value={value}>{children}</DoodhContext.Provider>
  );
}

export function useDoodhContext(): DoodhContextType {
  const context = useContext(DoodhContext);
  if (!context) {
    throw new Error("useDoodhContext must be used within a DoodhProvider");
  }
  return context;
}
