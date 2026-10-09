import React from "react";
import { StyleSheet, Text as RNText, View } from "react-native";
import type {
  MonthlyReport,
  MonthlyReportAnimalBlock,
  MonthlyReportLabels,
  MonthlyReportSlot,
} from "../../domain/monthlyReport";
import { formatCurrency, formatNumber } from "../../utils/formatters";

type MonthlyReportPreviewProps = {
  report: MonthlyReport;
  labels: MonthlyReportLabels;
};

const renderSlot = (slot: MonthlyReportSlot) => {
  if (!slot) return <RNText style={[styles.slot, styles.emptySlot]}>___</RNText>;
  return (
    <RNText style={styles.slot}>
      <RNText style={styles.bold}>{`${formatNumber(slot.quantity, 1)} kg`}</RNText>
      {`  ${formatNumber(slot.fat, 1)}% fat  ${formatCurrency(slot.amount)}`}
    </RNText>
  );
};

const AnimalRow = ({
  label,
  block,
}: {
  label: string;
  block: MonthlyReportAnimalBlock;
}) => (
  <View style={styles.row}>
    <RNText style={styles.animal}>{label}</RNText>
    <View style={styles.dayCol}>{renderSlot(block.day)}</View>
    <View style={styles.nightCol}>{renderSlot(block.night)}</View>
    <RNText style={styles.total}>{formatCurrency(block.total)}</RNText>
  </View>
);

export default function MonthlyReportPreview({
  report,
  labels,
}: MonthlyReportPreviewProps) {
  return (
    <View style={styles.page}>
      <RNText style={styles.title}>{labels.title}</RNText>

      <View style={styles.rates}>
        <RNText style={styles.ratesCaption}>{labels.ratesTitle}</RNText>
        <View style={styles.rateRow}>
          <RNText style={styles.rateName}>{labels.buffalo}</RNText>
          <RNText style={styles.rateValue}>
            {`${formatCurrency(report.rates.Buffalo)} ${labels.perFat}`}
          </RNText>
        </View>
        <View style={styles.rateRow}>
          <RNText style={styles.rateName}>{labels.cow}</RNText>
          <RNText style={styles.rateValue}>
            {`${formatCurrency(report.rates.Cow)} ${labels.perFat}`}
          </RNText>
        </View>
      </View>

      {report.days.map((day) => (
        <View key={day.date} style={styles.day}>
          <View style={styles.row}>
            <RNText style={styles.date}>{day.label}</RNText>
            <RNText style={[styles.dayCol, styles.head]}>{labels.day}</RNText>
            <RNText style={[styles.nightCol, styles.head]}>{labels.night}</RNText>
            <RNText style={[styles.total, styles.headRight]}>{labels.total}</RNText>
          </View>
          <AnimalRow label={labels.buffalo.toUpperCase()} block={day.buffalo} />
          <AnimalRow label={labels.cow.toUpperCase()} block={day.cow} />
          <RNText style={styles.dailyTotal}>
            {`${labels.dailyTotal}: ${formatCurrency(day.dailyTotal)}`}
          </RNText>
        </View>
      ))}

      <View style={styles.grand}>
        <RNText style={styles.grandLabel}>
          {`${labels.monthlyTotal}: ${formatCurrency(report.monthlyTotal)}`}
        </RNText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: "#ffffff", paddingHorizontal: 12, paddingVertical: 10 },
  title: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  rates: {
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 8,
    marginBottom: 4,
  },
  ratesCaption: {
    color: "#000000",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  rateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingVertical: 1,
  },
  rateName: { color: "#000000", fontSize: 11 },
  rateValue: { color: "#000000", fontSize: 11, fontWeight: "800" },
  day: {
    paddingTop: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#6f6f6f",
  },
  row: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 3 },
  date: { width: "23%", color: "#000000", fontSize: 12, fontWeight: "800" },
  animal: { width: "23%", color: "#000000", fontSize: 11, fontWeight: "800" },
  dayCol: { width: "29%", paddingRight: 4 },
  nightCol: { width: "32%", paddingRight: 4 },
  total: {
    width: "16%",
    color: "#000000",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "right",
  },
  head: { color: "#000000", fontSize: 11, fontWeight: "800" },
  headRight: { color: "#000000", fontSize: 11, fontWeight: "800", textAlign: "right" },
  slot: { color: "#000000", fontSize: 10 },
  emptySlot: { fontSize: 8 },
  bold: { fontWeight: "800" },
  dailyTotal: {
    color: "#000000",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "right",
    marginTop: 3,
  },
  grand: {
    borderTopWidth: 1,
    borderTopColor: "#000000",
    marginTop: 20,
    paddingTop: 10,
    alignItems: "flex-end",
  },
  grandLabel: { color: "#000000", fontSize: 15, fontWeight: "800" },
});
