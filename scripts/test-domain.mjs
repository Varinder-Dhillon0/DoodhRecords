import assert from "node:assert/strict";
import {
  calculateEarnings,
  calculateEntryEarnings,
  calculateSummary,
  getStoredEntryEarnings,
} from "../src/utils/calculations.ts";
import { readFileSync } from "node:fs";
import {
  DATE_MONTH_NAMES,
  getLocalDateString,
  getYearAndMonth,
  parseLocalDate,
  formatDisplayDate,
} from "../src/utils/dateUtils.ts";
import { formatCurrency, formatNumber } from "../src/utils/formatters.ts";
import {
  escapeCsvField,
  parseCsvContent,
  parseCsvLine,
  serializeCsvRows,
} from "../src/data/csv.ts";
import {
  DEFAULT_ANIMAL_PRICING,
  getDefaultAnimalPricing,
  getMonthKey,
  mergePricingConfig,
  resolveAnimalPricing,
  resolveAnimalRate,
  resolveRatesForDate,
} from "../src/domain/pricing.ts";
import {
  filterEntriesForMonth,
  getCurrentMonthYear,
  getPricedEntries,
  sortEntriesByDateDescending,
} from "../src/domain/entries.ts";
import {
  createExportFileName,
  createExportPayload,
  serializeExportPayload,
} from "../src/domain/exportPayload.ts";
import {
  MAX_FAT_PERCENTAGE,
  MAX_MILK_QUANTITY,
  validateAnimalPrice,
  validateEntryInput,
} from "../src/domain/validation.ts";
import {
  aggregateDailyEarnings,
  aggregateDailyFat,
  aggregateDailyMilk,
  buildMonthlyChartData,
  getDaysInMonth,
  getMonthDayKey,
} from "../src/domain/reports.ts";
import { calculateDayInsight, shiftDateString } from "../src/domain/insights.ts";
import {
  formatFieldValue,
  getFieldStep,
  getFieldSuggestions,
  getNextCombination,
  isDayComplete,
} from "../src/utils/smartEntry.ts";

let passed = 0;
const check = (name, actual, expected) => {
  assert.deepEqual(actual, expected, name);
  passed += 1;
  console.log(`ok - ${name}`);
};

const entry = (overrides = {}) => ({
  id: 1,
  date: "2026-09-27",
  animal: "Cow",
  shift: "Morning",
  milk_quantity: 10,
  fat_percentage: 4.5,
  price: 8,
  notes: "",
  ...overrides,
});

// Pricing domain preserves the application's canonical fallbacks.
check("default pricing", getDefaultAnimalPricing(), { Cow: 8, Buffalo: 9 });
check("month key pads month", getMonthKey("2026", "9"), "2026-09");
check("missing month resolves defaults", resolveAnimalPricing({}, "2026", "9"), {
  Cow: 8,
  Buffalo: 9,
});
check(
  "explicit zero is preserved",
  resolveAnimalPricing({ "2026-09": { Cow: 0, Buffalo: 9 } }, "2026", "9"),
  { Cow: 0, Buffalo: 9 },
);
check(
  "non-finite values fall back",
  resolveAnimalRate(
    { "2026-09": { Cow: Number.NaN, Buffalo: Number.POSITIVE_INFINITY } },
    "2026",
    "9",
    "Cow",
  ),
  8,
);
check("rates for date", resolveRatesForDate("2026-09-27", {}), {
  cowPrice: 8,
  buffaloPrice: 9,
});
check("saved pricing wins", mergePricingConfig({ "2026-09": { Cow: 10, Buffalo: 11 } }), {
  "2026-09": { Cow: 10, Buffalo: 11 },
  "2026-08": { Cow: 7.5, Buffalo: 8.5 },
});
check("defaults are not shared", getDefaultAnimalPricing() === DEFAULT_ANIMAL_PRICING, false);

// Entry selectors preserve list behavior used by Entries and Reports.
check("current month/year", getCurrentMonthYear("2026-09-27"), {
  year: "2026",
  month: "09",
});
check("month prefix", getMonthKey("2026", "9"), "2026-09");
check(
  "priced entries",
  getPricedEntries([entry()], { "2026-09": { Cow: 8, Buffalo: 9 } }),
  [{ ...entry(), earnings: 360 }],
);
check(
  "month filter preserves order",
  filterEntriesForMonth(
    [entry({ id: 2, date: "2026-09-05" }), entry({ id: 1, date: "2026-08-05" })],
    "2026",
    "9",
  ).map((item) => item.id),
  [2],
);
check(
  "month filter sorts descending",
  filterEntriesForMonth(
    [entry({ id: 1, date: "2026-09-05" }), entry({ id: 2, date: "2026-09-27" })],
    "2026",
    "9",
    { sort: "date-descending" },
  ).map((item) => item.id),
  [2, 1],
);
const unsorted = [entry({ id: 1, date: "2026-09-05" })];
sortEntriesByDateDescending(unsorted);
check("sorting does not mutate input", unsorted.map((item) => item.id), [1]);

// Calculations preserve earnings and summary semantics.
check("earnings formula", calculateEarnings(10, 4.5, 8), 360);
check("invalid earnings are zero", calculateEarnings("bad", 4.5, 8), 0);
check(
  "entry earnings use monthly pricing",
  calculateEntryEarnings(entry(), { "2026-09": { Cow: 8, Buffalo: 9 } }),
  360,
);
check(
  "summary weights fat by milk",
  calculateSummary([
    entry({ milk_quantity: 10, fat_percentage: 4, price: 8 }),
    entry({ milk_quantity: 20, fat_percentage: 5, price: 8 }),
  ]),
  { totalMilk: 30, avgFat: "4.7", totalEarnings: 1120 },
);

// Date utilities preserve timezone-safe local behavior.
assert.match(getLocalDateString("2026-09-27T00:00:00"), /^\d{4}-\d{2}-\d{2}$/);
passed += 1;
console.log("ok - local date shape");
check("year and month", getYearAndMonth("2026-09-27"), {
  year: "2026",
  month: "09",
});
const parsed = parseLocalDate("2026-09-27");
check("parsed local date", [parsed.getFullYear(), parsed.getMonth(), parsed.getDate()], [
  2026, 8, 27,
]);
check("display date", formatDisplayDate("2026-09-27", "en"), "27 September, 2026");
check("punjabi display date", formatDisplayDate("2026-09-27", "pa"), "27 ਸਤੰਬਰ, 2026");
check("default display date is english", formatDisplayDate("2026-01-05"), "05 January, 2026");
const localeMonths = (locale) =>
  JSON.parse(
    readFileSync(
      new URL(`../src/i18n/locales/${locale}.json`, import.meta.url),
      "utf8",
    ),
  ).months;
check("date month names match en locale", DATE_MONTH_NAMES.en, localeMonths("en"));
check("date month names match pa locale", DATE_MONTH_NAMES.pa, localeMonths("pa"));
check("currency", formatCurrency(1170), "₹1,170");
check("number", formatNumber(6.75, 1), "6.8");

// CSV helpers preserve storage-compatible quoting and trimming.
check("csv round trip", parseCsvContent(serializeCsvRows([
  ["id", "notes"],
  [1, 'Morning, "fresh" milk'],
])), [["id", "notes"], ["1", 'Morning, "fresh" milk']]);
check("csv line", parseCsvLine('a,"b, ""c"" ", d '), ["a", 'b, "c"', "d"]);
check("csv escape", escapeCsvField("plain"), "plain");

// Export payload preserves versioned backup shape.
const payload = createExportPayload({
  milkEntries: [entry()],
  pricingConfigurations: { "2026-09": { Cow: 8, Buffalo: 9 } },
  animalTypes: ["Cow", "Buffalo"],
  preferences: { language: "en", fontScale: 1 },
  appVersion: "1.0.0",
  exportedAt: "2026-10-09T00:00:00.000Z",
});
check("export payload", JSON.parse(serializeExportPayload(payload)), {
  format: "doodh-records-export",
  formatVersion: 1,
  exportedAt: "2026-10-09T00:00:00.000Z",
  appVersion: "1.0.0",
  data: {
    milkEntries: [entry()],
    pricingConfigurations: { "2026-09": { Cow: 8, Buffalo: 9 } },
    animalTypes: ["Cow", "Buffalo"],
    preferences: { language: "en", fontScale: 1 },
  },
});
check(
  "export filename",
  createExportFileName("2026-10-09T00:00:00.000Z"),
  "doodh_records_export_2026-10-09T00-00-00-000Z.json",
);

// Smart entry preserves slot selection, formatting, and suggestions.
check(
  "next combination",
  getNextCombination("2026-09-27", [entry({ animal: "Cow", shift: "Morning" })]),
  { shift: "Morning", animal: "Buffalo" },
);
check("complete day", isDayComplete("2026-09-27", [
  entry({ animal: "Cow", shift: "Morning" }),
  entry({ animal: "Buffalo", shift: "Morning" }),
  entry({ animal: "Cow", shift: "Evening" }),
  entry({ animal: "Buffalo", shift: "Evening" }),
]), true);
check("milk step", getFieldStep("milk"), 0.5);
check("fat step", getFieldStep("fat"), 0.1);
check("milk formatting", formatFieldValue("milk", 6.75), "6.75");
check("fat formatting", formatFieldValue("fat", 4.25), "4.3");
const suggestions = getFieldSuggestions(
  [
    entry({ id: 1, milk_quantity: 10 }),
    entry({ id: 2, milk_quantity: 10 }),
    entry({ id: 3, milk_quantity: 10 }),
    entry({ id: 4, milk_quantity: 12 }),
    entry({
      id: 5,
      animal: "Buffalo",
      shift: "Evening",
      milk_quantity: 20,
    }),
  ],
  {
    animal: "Cow",
    shift: "Morning",
    field: "milk",
    current: 0,
    referenceDate: "2026-09-27",
  },
);
check("most frequent suggestion is primary", suggestions[0], {
  value: 10,
  isPrimary: true,
  count: 3,
});

// Validation preserves user-facing form behavior.
check("milk limit", MAX_MILK_QUANTITY, 500);
check("fat limit", MAX_FAT_PERCENTAGE, 25);
check("milk validation", validateEntryInput(0, 4), {
  titleKey: "entryForm.invalidMilkTitle",
  messageKey: "entryForm.invalidMilkMessage",
});
check("fat validation", validateEntryInput(10, 30), {
  titleKey: "entryForm.invalidFatTitle",
  messageKey: "entryForm.invalidFatMessage",
});
check("valid entry", validateEntryInput(10, 4), null);
check("valid price", validateAnimalPrice(8), true);
check("invalid price", validateAnimalPrice(0), false);

// Reports preserve daily aggregation behavior.
check("days in month", getDaysInMonth("2026", "9"), 30);
check("month day key", getMonthDayKey("2026", "9", 5), "2026-09-05");
const reportEntries = getPricedEntries(
  [
    entry({ id: 1, date: "2026-09-05", milk_quantity: 10, fat_percentage: 4, price: 8 }),
    entry({ id: 2, date: "2026-09-27", milk_quantity: 20, fat_percentage: 5, price: 8 }),
  ],
  { "2026-09": { Cow: 8, Buffalo: 9 } },
);
check("daily milk", aggregateDailyMilk(reportEntries, "2026", "9").slice(4, 5), [10]);
check("daily fat", aggregateDailyFat(reportEntries, "2026", "9").slice(4, 5), [4]);
check(
  "daily earnings",
  aggregateDailyEarnings(reportEntries, "2026", "9").slice(26, 27),
  [800],
);
const monthlyChart = buildMonthlyChartData(reportEntries, "2026", "9");
check("chart labels", monthlyChart.labels.length, 30);
check("chart milk total", monthlyChart.milkValues.reduce((sum, value) => sum + value, 0), 30);

// Insights preserve Home trend behavior.
check("shifted date", shiftDateString("2026-09-03", -1), "2026-09-02");
check(
  "day insight",
  calculateDayInsight({
    entries: [
      entry({ id: 1, date: "2026-09-02", milk_quantity: 10, fat_percentage: 4, price: 8 }),
      entry({ id: 2, date: "2026-09-03", milk_quantity: 20, fat_percentage: 5, price: 8 }),
    ],
    selectedDate: "2026-09-03",
    summary: calculateSummary([
      entry({ id: 2, date: "2026-09-03", milk_quantity: 20, fat_percentage: 5, price: 8 }),
    ]),
  }),
  { activeDays: 1, earningsDelta: 150, fatDelta: 1 },
);
check(
  "missing selected day has no insight",
  calculateDayInsight({
    entries: [entry({ id: 1, date: "2026-09-02" })],
    selectedDate: "2026-09-03",
    summary: calculateSummary([]),
  }),
  null,
);
check("stored earnings are raw", getStoredEntryEarnings(entry()), 360);

console.log(`\n${passed} domain checks passed`);
