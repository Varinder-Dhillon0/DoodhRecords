/**
 * Number and currency formatting utilities
 */

export const formatCurrency = (
  value?: number | string | null,
  decimals = 0,
): string => {
  const num = Number(value || 0);
  if (isNaN(num)) return "₹0";
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

export const formatNumber = (
  value?: number | string | null,
  decimals = 1,
): string => {
  const num = Number(value || 0);
  if (isNaN(num)) return "0";
  return num.toFixed(decimals);
};
