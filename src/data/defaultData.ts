import { MilkEntry, PricingConfig } from "../types";

export const defaultPricing: PricingConfig = {
  "2026-09": { Cow: 8, Buffalo: 9 },
  "2026-08": { Cow: 7.5, Buffalo: 8.5 },
};

export const defaultEntries: MilkEntry[] = [
  {
    id: 1,
    date: "2026-09-27",
    animal: "Buffalo",
    shift: "Morning",
    milk_quantity: 15,
    fat_percentage: 6.5,
    price: 9,
    notes: "Good quality morning yield",
  },
  {
    id: 2,
    date: "2026-09-27",
    animal: "Cow",
    shift: "Morning",
    milk_quantity: 20,
    fat_percentage: 4.2,
    price: 8,
    notes: "",
  },
  {
    id: 3,
    date: "2026-09-26",
    animal: "Buffalo",
    shift: "Evening",
    milk_quantity: 14,
    fat_percentage: 7,
    price: 9,
    notes: "",
  },
  {
    id: 4,
    date: "2026-09-26",
    animal: "Cow",
    shift: "Morning",
    milk_quantity: 22,
    fat_percentage: 4,
    price: 8,
    notes: "",
  },
  {
    id: 5,
    date: "2026-08-15",
    animal: "Cow",
    shift: "Morning",
    milk_quantity: 18,
    fat_percentage: 4.5,
    price: 7.5,
    notes: "Independence day collection",
  },
];
