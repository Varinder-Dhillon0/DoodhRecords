import type {
  MonthlyReport,
  MonthlyReportAnimalBlock,
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
  if (!slot) return "";
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

const dayBlock = (day: MonthlyReport["days"][number]): string => `
  <section class="day">
    <div class="row day-head">
      <div class="col-animal date">${escapeHtml(day.label)}</div>
      <div class="col-day head">DAY</div>
      <div class="col-night head">NIGHT</div>
      <div class="col-total head">TOTAL</div>
    </div>
    ${animalRow("BUFFALO", day.buffalo)}
    ${animalRow("COW", day.cow)}
    <div class="daily-total">Daily total: ${escapeHtml(formatRupee(day.dailyTotal))}</div>
  </section>`;

/**
 * Self-contained HTML for the monthly milk report, matching the approved
 * sample layout: centered title, two-line rates header, per-day
 * DAY/NIGHT/TOTAL blocks, daily totals, and a closing monthly total.
 */
export const buildMonthlyReportHtml = (report: MonthlyReport): string => {
  const days = report.days.map(dayBlock).join("\n");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4; margin: 36px 44px 60px 44px; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #ffffff; color: #000000; }
  body { font-family: Helvetica, Arial, sans-serif; padding-bottom: 24px; }
  .title { text-align: center; font-size: 30px; font-weight: 800; margin: 8px 0 10px 0; letter-spacing: 0.2px; }
  .rates { font-size: 14px; line-height: 1.45; margin: 0 0 4px 0; }
  .day { padding: 12px 0 10px 0; border-bottom: 1px solid #6f6f6f; page-break-inside: avoid; }
  .row { display: flex; align-items: baseline; padding: 5px 0; }
  .col-animal { width: 23%; font-size: 15px; font-weight: 800; }
  .col-animal.date { font-size: 17px; }
  .col-day { width: 29%; font-size: 14px; }
  .col-night { width: 32%; font-size: 14px; }
  .col-total { width: 16%; font-size: 15px; font-weight: 800; text-align: right; }
  .head { font-size: 15px; font-weight: 800; }
  .qty { font-weight: 800; }
  .daily-total { text-align: right; font-size: 15px; font-weight: 800; padding-top: 6px; }
  .grand { display: flex; justify-content: flex-end; align-items: center; border-top: 1px solid #000000; margin-top: 28px; padding: 14px 0 8px 0; }
  .grand-label { font-size: 20px; font-weight: 800; letter-spacing: 0.3px; }
  .footer { position: fixed; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; font-size: 11px; color: #000000; border-top: 1px solid #000000; padding: 6px 0 0 0; background: #ffffff; }
</style>
</head>
<body>
  <h1 class="title">${escapeHtml(report.title)}</h1>
  <p class="rates">Milk rates: Buffalo &mdash; ${escapeHtml(formatRupee(report.rates.Buffalo))} per fat<br />Cow &mdash; ${escapeHtml(formatRupee(report.rates.Cow))} per fat</p>
  ${days}
  <div class="grand"><div class="grand-label">MONTHLY TOTAL: ${escapeHtml(formatRupee(report.monthlyTotal))}</div></div>
  <div class="footer"><span>DoodhRecords</span></div>
</body>
</html>`;
};
