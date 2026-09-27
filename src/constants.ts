import { Animal, MonthOption, Shift } from "./types";

export const COLORS = {
  brand: "#1E5631",
  brandLight: "#E9F7EC",
  brandDark: "#123F22",
  greenAccent: "#2E7D32",
  white: "#FFFFFF",
  background: "#F3F4F6",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  muted: "#64748B",
  blueSoft: "#E0F2FE",
  amberSoft: "#FEF3C7",
  red: "#DC2626",
  gold: "#F59E0B",
};

export const ANIMALS: Animal[] = ["Cow", "Buffalo"];
export const SHIFTS: Shift[] = ["Morning", "Evening"];
export const APP_VERSION = "1.0.0";

export const MONTH_OPTIONS: MonthOption[] = [
  { label: "January", value: "01" },
  { label: "February", value: "02" },
  { label: "March", value: "03" },
  { label: "April", value: "04" },
  { label: "May", value: "05" },
  { label: "June", value: "06" },
  { label: "July", value: "07" },
  { label: "August", value: "08" },
  { label: "September", value: "09" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

const currentYear = new Date().getFullYear();
export const YEAR_OPTIONS: string[] = [
  String(currentYear - 2),
  String(currentYear - 1),
  String(currentYear),
  String(currentYear + 1),
  String(currentYear + 2),
];
