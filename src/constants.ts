import { Animal, MonthOption, Shift } from "./types";

export const COLORS = {
  // Brand / emerald
  brand: "#004625",
  brandLight: "#aff2c2",
  brandDim: "#94d5a7",
  brandDark: "#00210f",
  brandDeep: "#0d512f",
  greenAccent: "#1e5e3a",
  surfaceTint: "#2b6a45",

  // Surfaces
  white: "#ffffff",
  background: "#faf8ff",
  surface: "#ffffff",
  surfaceLow: "#f2f3ff",
  surfaceContainer: "#eaedff",
  surfaceHigh: "#e2e7ff",
  surfaceVariant: "#dae2fd",
  surfaceDim: "#d2d9f4",

  // Content
  text: "#131b2e",
  muted: "#404941",
  outline: "#707971",
  border: "#c0c9bf",
  borderSoft: "#eaedff",

  // Milk volume (sky blue)
  blue: "#0051d5",
  blueContainer: "#316bf3",
  blueFixed: "#dbe1ff",
  blueFixedDim: "#b4c5ff",
  onBlueFixed: "#00174b",
  onBlueFixedVariant: "#003ea8",

  // Fat / butter amber
  amber: "#5a3300",
  amberContainer: "#7a4700",
  amberFixed: "#ffdcbd",
  amberFixedDim: "#ffb86e",
  onAmberFixed: "#2c1600",
  onAmberFixedVariant: "#693c00",

  // Status
  red: "#ba1a1a",
  redContainer: "#ffdad6",
  onRedContainer: "#93000a",

  // Inverse
  inverseSurface: "#283044",
  inverseOnSurface: "#eef0ff",
  inversePrimary: "#94d5a7",

  // Legacy aliases retained for existing call sites
  blueSoft: "#dbe1ff",
  amberSoft: "#ffdcbd",
  gold: "#7a4700",
  slateShade: "#334155",
  steel: "#64748b",
} as const;

export const RADII = {
  sm: 8,
  control: 12,
  card: 16,
  sheet: 28,
  pill: 999,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  gap: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const SHADOWS = {
  card: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  control: {
    shadowColor: COLORS.greenAccent,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sheet: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
  },
  tabBar: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
} as const;

export const withAlpha = (hex: string, alpha: number): string => {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  const clamped = Math.max(0, Math.min(1, alpha));
  return `rgba(${red}, ${green}, ${blue}, ${clamped})`;
};

export const ANIMALS: Animal[] = ["Cow", "Buffalo"];
export const SHIFTS: Shift[] = ["Morning", "Evening"];
export const APP_VERSION = "1.0.0";

export const MONTH_OPTIONS: MonthOption[] = [
  { value: "01" },
  { value: "02" },
  { value: "03" },
  { value: "04" },
  { value: "05" },
  { value: "06" },
  { value: "07" },
  { value: "08" },
  { value: "09" },
  { value: "10" },
  { value: "11" },
  { value: "12" },
];

const currentYear = new Date().getFullYear();
export const YEAR_OPTIONS: string[] = [
  String(currentYear - 2),
  String(currentYear - 1),
  String(currentYear),
  String(currentYear + 1),
  String(currentYear + 2),
];
