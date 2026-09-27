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
