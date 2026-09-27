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

  const locale = language.startsWith("pa") ? "pa-IN" : "en-GB";
  const parts = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(utcDate);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("day")} ${part("month")}, ${part("year")}`;
};
