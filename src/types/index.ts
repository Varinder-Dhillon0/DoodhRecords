import type { NavigatorScreenParams } from "@react-navigation/native";

export type Animal = "Cow" | "Buffalo";
export type Shift = "Morning" | "Evening";

export interface MilkEntry {
  id: number;
  date: string; // Format: 'YYYY-MM-DD'
  animal: Animal;
  shift: Shift;
  milk_quantity: number;
  fat_percentage: number;
  /** Rate per 1% fat applied when the entry was last saved. */
  price: number;
  notes?: string;
}

export interface AnimalPricing {
  Cow: number;
  Buffalo: number;
}

// Key format: 'YYYY-MM'
export type PricingConfig = Record<string, AnimalPricing>;

export interface SummaryMetrics {
  totalMilk: number;
  avgFat: string;
  totalEarnings: number;
}

export interface MonthOption {
  value: string;
}

export interface DoodhContextType {
  entries: MilkEntry[];
  pricingConfig: PricingConfig;
  isLoading: boolean;
  loadData: () => Promise<void>;
  refreshEntries: () => Promise<void>;
  saveConfig: (
    year: string,
    month: string,
    animal: Animal,
    price: number,
  ) => Promise<void>;
  addEntry: (
    entry: Omit<MilkEntry, "id" | "price"> & {
      id?: number;
      price?: number;
    },
  ) => Promise<MilkEntry>;
  updateEntry: (
    entry: MilkEntry,
    oldDate?: string | null,
  ) => Promise<MilkEntry>;
  deleteEntry: (entryId: number, dateString: string) => Promise<void>;
}

export type RootStackParamList = {
  Welcome: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  EntryForm: { entry?: MilkEntry } | undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Entries: undefined;
  Reports: undefined;
  Settings: undefined;
};
