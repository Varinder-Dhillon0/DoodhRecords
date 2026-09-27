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
  addEntry as storageAddEntry,
  calculateEarnings,
  deleteEntry as storageDeleteEntry,
  getPricingConfig,
  initializeStorage,
  readAllEntries,
  savePricingConfig,
  updateEntry as storageUpdateEntry,
} from "../utils/storageManager";

const DoodhContext = createContext<DoodhContextType | null>(null);

export function DoodhProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<MilkEntry[]>([]);
  const [pricingConfig, setPricingConfig] =
    useState<PricingConfig>(defaultPricing);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await initializeStorage();
      const savedPricing = await getPricingConfig();
      const savedEntries = await readAllEntries();

      setPricingConfig({ ...defaultPricing, ...savedPricing });
      setEntries(savedEntries.length ? savedEntries : defaultEntries);
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
      const key = `${year}-${month}`;

      await savePricingConfig(year, month, animal, price);
      setPricingConfig((prev) => ({
        ...prev,
        [key]: {
          ...(prev[key] || { Cow: 8, Buffalo: 9 }),
          [animal]: Number(price),
        },
      }));
    },
    [],
  );

  const handleAddEntry = useCallback(
    async (
      entry: Omit<MilkEntry, "id" | "earnings"> & {
        id?: number;
        earnings?: number;
      },
    ): Promise<MilkEntry> => {
      const nextEarnings = await calculateEarnings(
        entry.milk_quantity,
        entry.fat_percentage,
        entry.animal,
        entry.date,
      );
      const newEntry = await storageAddEntry({
        ...entry,
        earnings: nextEarnings,
      });
      setEntries((prev) => [...prev, newEntry]);
      return newEntry;
    },
    [],
  );

  const handleUpdateEntry = useCallback(
    async (
      entry: MilkEntry,
      oldDate: string | null = null,
    ): Promise<MilkEntry> => {
      const nextEarnings = await calculateEarnings(
        entry.milk_quantity,
        entry.fat_percentage,
        entry.animal,
        entry.date,
      );
      const updatedEntry: MilkEntry = { ...entry, earnings: nextEarnings };
      await storageUpdateEntry(updatedEntry, oldDate);
      setEntries((prev) =>
        prev.map((item) =>
          Number(item.id) === Number(updatedEntry.id) ? updatedEntry : item,
        ),
      );
      return updatedEntry;
    },
    [],
  );

  const handleDeleteEntry = useCallback(
    async (entryId: number, dateString: string): Promise<void> => {
      await storageDeleteEntry(entryId, dateString);
      setEntries((prev) =>
        prev.filter(
          (item) =>
            !(Number(item.id) === Number(entryId) && item.date === dateString),
        ),
      );
    },
    [],
  );

  const refreshEntries = useCallback(async () => {
    const saved = await readAllEntries();
    setEntries(saved.length ? saved : defaultEntries);
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
