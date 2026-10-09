/**
 * Utility functions for local date handling (avoiding UTC timezone shift issues)
 */

export const getLocalDateString = (
  dateInput: Date | string | number = new Date(),
): string => {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getYearAndMonth = (
  dateString?: string,
): { year: string; month: string } => {
  if (!dateString || typeof dateString !== "string") {
    const today = getLocalDateString();
    return { year: today.slice(0, 4), month: today.slice(5, 7) };
  }
  const parts = dateString.split("-");
  const year = parts[0] || new Date().getFullYear().toString();
  const month = parts[1]
    ? parts[1].padStart(2, "0")
    : String(new Date().getMonth() + 1).padStart(2, "0");
  return { year, month };
};

export const parseLocalDate = (dateString?: string): Date => {
  if (!dateString) return new Date();
  const parts = dateString.split("-").map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
};

/**
 * Month names used by formatDisplayDate.
 *
 * Mirrors the `months` tables in src/i18n/locales/en.json and
 * src/i18n/locales/pa.json (kept here instead of imported so this util
 * stays dependency-free and renders identically on every platform,
 * including Hermes builds without full ICU data). Update together.
 * Digits stay Latin everywhere for consistency with quantities and ₹
 * amounts across the app.
 */
export const DATE_MONTH_NAMES: Record<string, Record<string, string>> = {
  en: {
    "01": "January",
    "02": "February",
    "03": "March",
    "04": "April",
    "05": "May",
    "06": "June",
    "07": "July",
    "08": "August",
    "09": "September",
    "10": "October",
    "11": "November",
    "12": "December",
  },
  pa: {
    "01": "ਜਨਵਰੀ",
    "02": "ਫ਼ਰਵਰੀ",
    "03": "ਮਾਰਚ",
    "04": "ਅਪ੍ਰੈਲ",
    "05": "ਮਈ",
    "06": "ਜੂਨ",
    "07": "ਜੁਲਾਈ",
    "08": "ਅਗਸਤ",
    "09": "ਸਤੰਬਰ",
    "10": "ਅਕਤੂਬਰ",
    "11": "ਨਵੰਬਰ",
    "12": "ਦਸੰਬਰ",
  },
};

/** Formats a stored YYYY-MM-DD date for display without interpreting it in local time. */
export const formatDisplayDate = (
  dateString?: string,
  language = "en",
): string => {
  if (!dateString) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!match) return dateString;

  const [, year, month, day] = match;
  const utcDate = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  );
  if (
    utcDate.getUTCFullYear() !== Number(year) ||
    utcDate.getUTCMonth() !== Number(month) - 1 ||
    utcDate.getUTCDate() !== Number(day)
  ) {
    return dateString;
  }

  const monthName =
    DATE_MONTH_NAMES[language.startsWith("pa") ? "pa" : "en"][month] ??
    DATE_MONTH_NAMES.en[month] ??
    month;

  return `${day} ${monthName}, ${year}`;
};
