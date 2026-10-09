import type {
  MonthlyReport,
  MonthlyReportAnimalBlock,
  MonthlyReportLabels,
  MonthlyReportSlot,
} from "../domain/monthlyReport";

const escapeHtml = (value: string | number): string =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatRupee = (value: number): string =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const formatSlot = (slot: MonthlyReportSlot): string => {
  if (!slot) return '<span class="empty">___</span>';
  const quantity = `${Number(slot.quantity).toFixed(1)} kg`;
  const fat = `${Number(slot.fat).toFixed(1)}% fat`;
  return `<span class="qty">${escapeHtml(quantity)}</span> <span class="fat">${escapeHtml(fat)}</span> <span class="amt">${escapeHtml(formatRupee(slot.amount))}</span>`;
};

const animalRow = (
  label: string,
  block: MonthlyReportAnimalBlock,
): string => `
  <div class="row">
    <div class="col-animal">${escapeHtml(label)}</div>
    <div class="col-day">${formatSlot(block.day)}</div>
    <div class="col-night">${formatSlot(block.night)}</div>
    <div class="col-total">${escapeHtml(formatRupee(block.total))}</div>
  </div>`;

const dayBlock = (
  day: MonthlyReport["days"][number],
  labels: MonthlyReportLabels,
): string => `
  <section class="day">
    <div class="row day-head">
      <div class="col-animal date">${escapeHtml(day.label)}</div>
      <div class="col-day head">${escapeHtml(labels.day)}</div>
      <div class="col-night head">${escapeHtml(labels.night)}</div>
      <div class="col-total head">${escapeHtml(labels.total)}</div>
    </div>
    ${animalRow(labels.buffalo.toUpperCase(), day.buffalo)}
    ${animalRow(labels.cow.toUpperCase(), day.cow)}
    <div class="daily-total">${escapeHtml(labels.dailyTotal)}: ${escapeHtml(formatRupee(day.dailyTotal))}</div>
  </section>`;

/**
 * Self-contained HTML for the monthly milk report: centered title, rates
 * card, per-day DAY/NIGHT/TOTAL blocks, daily totals, and a closing
 * monthly total. All text comes from labels so the PDF follows the
 * selected language.
 */
export const buildMonthlyReportHtml = (
  report: MonthlyReport,
  labels: MonthlyReportLabels,
): string => {
  const days = report.days.map((day) => dayBlock(day, labels)).join("\n");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4; margin: 32px 40px 44px 40px; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #ffffff; color: #000000; }
  body { font-family: Helvetica, Arial, sans-serif; padding-bottom: 12px; }
  .title { text-align: center; font-size: 30px; font-weight: 800; margin: 8px 0 12px 0; letter-spacing: 0.2px; }
  .rates { border: 1px solid #000000; border-radius: 8px; padding: 8px 14px 10px 14px; margin: 0 0 6px 0; }
  .rates-caption { font-size: 12px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 4px; }
  .rate-row { display: flex; justify-content: space-between; align-items: baseline; font-size: 14px; padding: 2px 0; }
  .rate-val { font-weight: 800; }
  .day { padding: 12px 0 10px 0; border-bottom: 1px solid #6f6f6f; page-break-inside: avoid; }
  .row { display: flex; align-items: baseline; padding: 5px 0; }
  .col-animal { width: 23%; font-size: 15px; font-weight: 800; }
  .col-animal.date { font-size: 17px; }
  .col-day { width: 29%; font-size: 14px; }
  .col-night { width: 32%; font-size: 14px; }
  .col-total { width: 16%; font-size: 15px; font-weight: 800; text-align: right; }
  .head { font-size: 15px; font-weight: 800; }
  .qty { font-weight: 800; }
  .empty { font-size: 9px; letter-spacing: 1px; }
  .daily-total { text-align: right; font-size: 15px; font-weight: 800; padding-top: 6px; }
  .grand { display: flex; justify-content: flex-end; align-items: center; border-top: 1px solid #000000; margin-top: 28px; padding: 14px 0 8px 0; }
  .grand-label { font-size: 20px; font-weight: 800; letter-spacing: 0.3px; }
  .footer { position: fixed; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; font-size: 11px; color: #000000; border-top: 1px solid #000000; padding: 4px 0 0 0; background: #ffffff; }
</style>
</head>
<body>
  <h1 class="title">${escapeHtml(labels.title)}</h1>
  <div class="rates">
    <div class="rates-caption">${escapeHtml(labels.ratesTitle)}</div>
    <div class="rate-row"><span>${escapeHtml(labels.buffalo)}</span><span class="rate-val">${escapeHtml(formatRupee(report.rates.Buffalo))} ${escapeHtml(labels.perFat)}</span></div>
    <div class="rate-row"><span>${escapeHtml(labels.cow)}</span><span class="rate-val">${escapeHtml(formatRupee(report.rates.Cow))} ${escapeHtml(labels.perFat)}</span></div>
  </div>
  ${days}
  <div class="grand"><div class="grand-label">${escapeHtml(labels.monthlyTotal)}: ${escapeHtml(formatRupee(report.monthlyTotal))}</div></div>
  <div class="footer"><span>DoodhRecords</span></div>
</body>
</html>`;
};
