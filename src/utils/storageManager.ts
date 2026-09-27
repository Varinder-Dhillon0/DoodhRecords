import * as FileSystem from "expo-file-system";
import { Animal, AnimalPricing, MilkEntry, PricingConfig } from "../types";
import { getYearAndMonth } from "./dateUtils";
import { calculateEarnings as calcEarnings } from "./calculations";

const documentDir =
  (FileSystem as any).documentDirectory ||
  (FileSystem as any).cacheDirectory ||
  "";
const STORAGE_DIR = `${documentDir}doodh_records/`;
export const PRICING_FILE = `${STORAGE_DIR}pricing_config.csv`;

const csvEscape = (value: string | number | undefined | null): string => {
  const stringValue = String(value ?? "");
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values.map((value) => value.trim());
};

const readCsvFile = async (filePath: string): Promise<string[][]> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (!fileInfo.exists) {
      return [];
    }

    const content = await FileSystem.readAsStringAsync(filePath);
    if (!content.trim()) {
      return [];
    }

    return content
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .map((line) => parseCsvLine(line));
  } catch (err) {
    console.error(`Error reading CSV file at ${filePath}:`, err);
    return [];
  }
};

const writeCsvFile = async (
  filePath: string,
  rows: (string | number)[][],
): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(STORAGE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(STORAGE_DIR, { intermediates: true });
    }

    const content = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    await FileSystem.writeAsStringAsync(filePath, `${content}\n`);
  } catch (err) {
    console.error(`Error writing CSV file at ${filePath}:`, err);
  }
};

const getMonthlyFilePath = (yearStr: string, monthStr: string): string => {
  const year = String(yearStr);
  const month = String(monthStr).padStart(2, "0");
  return `${STORAGE_DIR}entries_${year}_${month}.csv`;
};

const getMonthlyPricingFilePath = (
  yearStr: string,
  monthStr: string,
): string => {
  const year = String(yearStr);
  const month = String(monthStr).padStart(2, "0");
  return `${STORAGE_DIR}pricing_${year}_${month}.csv`;
};

const getHeaders = (): string[] => [
  "id",
  "date",
  "animal",
  "shift",
  "milk_quantity",
  "fat_percentage",
  "earnings",
  "notes",
];

export const initializeStorage = async (): Promise<void> => {
  const dirInfo = await FileSystem.getInfoAsync(STORAGE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(STORAGE_DIR, { intermediates: true });
  }

  const pricingInfo = await FileSystem.getInfoAsync(PRICING_FILE);
  if (!pricingInfo.exists) {
    await FileSystem.writeAsStringAsync(
      PRICING_FILE,
      "month,year,animal,price_per_fat\n",
    );
  }

  const { year, month } = getYearAndMonth();
  const filePath = getMonthlyFilePath(year, month);
  const fileInfo = await FileSystem.getInfoAsync(filePath);
  if (!fileInfo.exists) {
    await writeCsvFile(filePath, [getHeaders()]);
  }
};

export const getPricingConfig = async (): Promise<PricingConfig> => {
  const config: PricingConfig = {};

  // 1. Read global pricing_config.csv
  const rows = await readCsvFile(PRICING_FILE);
  if (rows.length > 0) {
    const dataRows = rows[0][0] === "month" ? rows.slice(1) : rows;
    dataRows.forEach((row) => {
      if (row.length < 4) return;
      const [monthRaw, yearRaw, animal, price] = row;
      const month = String(monthRaw).padStart(2, "0");
      const year = String(yearRaw);
      const key = `${year}-${month}`;
      if (!config[key]) {
        config[key] = { Cow: 8, Buffalo: 9 };
      }
      if (animal === "Cow" || animal === "Buffalo") {
        config[key][animal as Animal] = Number(price) || 0;
      }
    });
  }

  // 2. Scan monthly pricing files pricing_YYYY_MM.csv
  try {
    const dirInfo = await FileSystem.getInfoAsync(STORAGE_DIR);
    if (dirInfo.exists) {
      const files = await FileSystem.readDirectoryAsync(STORAGE_DIR);
      const pricingFiles = files.filter(
        (f) =>
          f.startsWith("pricing_") &&
          f.endsWith(".csv") &&
          f !== "pricing_config.csv",
      );

      for (const file of pricingFiles) {
        const match = file.match(/^pricing_(\d{4})_(\d{2})\.csv$/);
        if (match) {
          const [, year, month] = match;
          const key = `${year}-${month}`;
          const monthlyRows = await readCsvFile(`${STORAGE_DIR}${file}`);
          const dataRows =
            monthlyRows.length > 0 && monthlyRows[0][0] === "animal"
              ? monthlyRows.slice(1)
              : monthlyRows;

          if (!config[key]) {
            config[key] = { Cow: 8, Buffalo: 9 };
          }

          dataRows.forEach((row) => {
            if (row.length >= 2) {
              const [animal, price] = row;
              if (animal === "Cow" || animal === "Buffalo") {
                config[key][animal as Animal] = Number(price) || 0;
              }
            }
          });
        }
      }
    }
  } catch (err) {
    console.error("Error scanning monthly pricing CSVs:", err);
  }

  return config;
};

export const savePricingConfig = async (
  yearStr: string,
  monthStr: string,
  animal: Animal,
  price: number,
): Promise<void> => {
  const year = String(yearStr);
  const month = String(monthStr).padStart(2, "0");

  // 1. Update global pricing_config.csv
  const rows = await readCsvFile(PRICING_FILE);
  const dataRows =
    rows.length > 0 && rows[0][0] === "month" ? rows.slice(1) : rows;
  const filteredRows = dataRows.filter(
    (row) => !(row[0] === month && row[1] === year && row[2] === animal),
  );
  const mergedRows = [...filteredRows, [month, year, animal, String(price)]];
  const header = ["month", "year", "animal", "price_per_fat"];
  await writeCsvFile(PRICING_FILE, [
    header,
    ...mergedRows.filter((row) => row.length >= 4),
  ]);

  // 2. Maintain monthly pricing CSV: pricing_YYYY_MM.csv
  const monthlyFilePath = getMonthlyPricingFilePath(year, month);
  const currentConfig = await getPricingConfig();
  const existingMonthly = currentConfig[`${year}-${month}`] || {
    Cow: 8,
    Buffalo: 9,
  };
  const updatedMonthly: AnimalPricing = {
    ...existingMonthly,
    [animal]: Number(price),
  };

  const monthlyHeader = ["animal", "price_per_fat"];
  const monthlyRows = [
    monthlyHeader,
    ["Cow", String(updatedMonthly.Cow)],
    ["Buffalo", String(updatedMonthly.Buffalo)],
  ];
  await writeCsvFile(monthlyFilePath, monthlyRows);
};

export const getPricingForDate = async (
  dateString: string,
): Promise<{ cowPrice: number; buffaloPrice: number }> => {
  const { year, month } = getYearAndMonth(dateString);
  const config = await getPricingConfig();
  const key = `${year}-${month}`;
  const pricing = config[key] || { Cow: 8, Buffalo: 9 };
  return {
    cowPrice: Number(pricing.Cow ?? 8),
    buffaloPrice: Number(pricing.Buffalo ?? 9),
  };
};

export const calculateEarnings = async (
  milkQuantity: number | string,
  fatPercentage: number | string,
  animal: Animal,
  dateString: string,
): Promise<number> => {
  const pricing = await getPricingForDate(dateString);
  const pricePerFat =
    animal === "Cow" ? pricing.cowPrice : pricing.buffaloPrice;
  return calcEarnings(milkQuantity, fatPercentage, pricePerFat);
};

export const ensureMonthlyFile = async (
  yearStr: string,
  monthStr: string,
): Promise<string> => {
  const year = String(yearStr);
  const month = String(monthStr).padStart(2, "0");
  const filePath = getMonthlyFilePath(year, month);
  const fileInfo = await FileSystem.getInfoAsync(filePath);
  if (!fileInfo.exists) {
    await writeCsvFile(filePath, [getHeaders()]);
  }
  return filePath;
};

export const readEntriesForMonth = async (
  yearStr: string,
  monthStr: string,
): Promise<MilkEntry[]> => {
  const year = String(yearStr);
  const month = String(monthStr).padStart(2, "0");
  const filePath = await ensureMonthlyFile(year, month);
  const rows = await readCsvFile(filePath);
  if (rows.length <= 1) {
    return [];
  }

  const header = rows[0];
  return rows.slice(1).map((row) => {
    const entry: Record<string, string> = {};
    header.forEach((key, index) => {
      entry[key] = row[index] || "";
    });

    return {
      id: Number(entry.id) || 0,
      date: entry.date || `${year}-${month}-01`,
      animal: (entry.animal as Animal) || "Cow",
      shift: (entry.shift as any) || "Morning",
      milk_quantity: Number(entry.milk_quantity) || 0,
      fat_percentage: Number(entry.fat_percentage) || 0,
      earnings: Number(entry.earnings) || 0,
      notes: entry.notes || "",
    };
  });
};

export const writeEntriesForMonth = async (
  yearStr: string,
  monthStr: string,
  entries: MilkEntry[],
): Promise<void> => {
  const year = String(yearStr);
  const month = String(monthStr).padStart(2, "0");
  const filePath = await ensureMonthlyFile(year, month);
  const rows: (string | number)[][] = [getHeaders()];

  entries.forEach((entry) => {
    rows.push([
      entry.id,
      entry.date,
      entry.animal,
      entry.shift,
      Number(entry.milk_quantity).toString(),
      Number(entry.fat_percentage).toString(),
      Number(entry.earnings).toString(),
      entry.notes || "",
    ]);
  });

  await writeCsvFile(filePath, rows);
};

export const addEntry = async (
  entry: Omit<MilkEntry, "id" | "earnings"> & {
    id?: number;
    earnings?: number;
  },
): Promise<MilkEntry> => {
  const { year, month } = getYearAndMonth(entry.date);
  const existingEntries = await readEntriesForMonth(year, month);

  const allEntries = await readAllEntries();
  const nextId =
    entry.id ||
    allEntries.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) +
      1;

  let computedEarnings = entry.earnings;
  if (computedEarnings === undefined || computedEarnings === null) {
    computedEarnings = await calculateEarnings(
      entry.milk_quantity,
      entry.fat_percentage,
      entry.animal,
      entry.date,
    );
  }

  const newEntry: MilkEntry = {
    ...entry,
    id: nextId,
    earnings: Number(computedEarnings) || 0,
  };

  const updatedEntries = [...existingEntries, newEntry];
  await writeEntriesForMonth(year, month, updatedEntries);
  return newEntry;
};

export const updateEntry = async (
  entry: MilkEntry,
  oldDate: string | null = null,
): Promise<MilkEntry> => {
  const { year: newYear, month: newMonth } = getYearAndMonth(entry.date);

  if (oldDate && oldDate !== entry.date) {
    const { year: oldYear, month: oldMonth } = getYearAndMonth(oldDate);
    if (oldYear !== newYear || oldMonth !== newMonth) {
      await deleteEntry(entry.id, oldDate);
    }
  }

  const existingEntries = await readEntriesForMonth(newYear, newMonth);
  const exists = existingEntries.some(
    (item) => Number(item.id) === Number(entry.id),
  );

  let updatedEntries: MilkEntry[];
  if (exists) {
    updatedEntries = existingEntries.map((item) =>
      Number(item.id) === Number(entry.id)
        ? { ...item, ...entry, earnings: Number(entry.earnings) || 0 }
        : item,
    );
  } else {
    updatedEntries = [
      ...existingEntries,
      { ...entry, earnings: Number(entry.earnings) || 0 },
    ];
  }

  await writeEntriesForMonth(newYear, newMonth, updatedEntries);
  return entry;
};

export const deleteEntry = async (
  entryId: number,
  dateString: string,
): Promise<void> => {
  const { year, month } = getYearAndMonth(dateString);
  const existingEntries = await readEntriesForMonth(year, month);
  const filtered = existingEntries.filter(
    (item) => Number(item.id) !== Number(entryId),
  );
  await writeEntriesForMonth(year, month, filtered);
};

export const readAllEntries = async (): Promise<MilkEntry[]> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(STORAGE_DIR);
    if (!dirInfo.exists) return [];

    const files = await FileSystem.readDirectoryAsync(STORAGE_DIR);
    const entryFiles = files.filter(
      (f) => f.startsWith("entries_") && f.endsWith(".csv"),
    );

    const allEntries: MilkEntry[] = [];
    for (const file of entryFiles) {
      const match = file.match(/^entries_(\d{4})_(\d{2})\.csv$/);
      if (match) {
        const [, year, month] = match;
        const entries = await readEntriesForMonth(year, month);
        allEntries.push(...entries);
      }
    }

    return allEntries.filter((entry) => entry.date && entry.date.length >= 8);
  } catch (err) {
    console.error("Error in readAllEntries:", err);
    return [];
  }
};
