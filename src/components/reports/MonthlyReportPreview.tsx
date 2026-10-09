import React from "react";
import { StyleSheet, Text as RNText, View } from "react-native";
import type {
  MonthlyReport,
  MonthlyReportAnimalBlock,
  MonthlyReportSlot,
} from "../../domain/monthlyReport";
import { formatCurrency, formatNumber } from "../../utils/formatters";

type MonthlyReportPreviewProps = {
  report: MonthlyReport;
};

const renderSlot = (slot: MonthlyReportSlot) => {
  if (!slot) return <RNText style={styles.slot} />;
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

export default function MonthlyReportPreview({ report }: MonthlyReportPreviewProps) {
  return (
    <View style={styles.page}>
      <RNText style={styles.title}>{report.title}</RNText>
      <RNText style={styles.rates}>
        {`Milk rates: Buffalo — ${formatCurrency(report.rates.Buffalo)} per fat`}
      </RNText>
      <RNText style={styles.rates}>
        {`Cow — ${formatCurrency(report.rates.Cow)} per fat`}
      </RNText>

      {report.days.map((day) => (
        <View key={day.date} style={styles.day}>
          <View style={styles.row}>
            <RNText style={styles.date}>{day.label}</RNText>
            <RNText style={[styles.dayCol, styles.head]}>DAY</RNText>
            <RNText style={[styles.nightCol, styles.head]}>NIGHT</RNText>
            <RNText style={[styles.total, styles.headRight]}>TOTAL</RNText>
          </View>
          <AnimalRow label="BUFFALO" block={day.buffalo} />
          <AnimalRow label="COW" block={day.cow} />
          <RNText style={styles.dailyTotal}>
            {`Daily total: ${formatCurrency(day.dailyTotal)}`}
          </RNText>
        </View>
      ))}

      <View style={styles.grand}>
        <RNText style={styles.grandLabel}>
          {`MONTHLY TOTAL: ${formatCurrency(report.monthlyTotal)}`}
        </RNText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: "#ffffff", paddingHorizontal: 16, paddingVertical: 12 },
  title: {
    color: "#000000",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  rates: { color: "#000000", fontSize: 13, lineHeight: 18 },
  day: {
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#6f6f6f",
  },
  row: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 4 },
  date: { width: "23%", color: "#000000", fontSize: 14, fontWeight: "800" },
  animal: { width: "23%", color: "#000000", fontSize: 13, fontWeight: "800" },
  dayCol: { width: "29%", paddingRight: 4 },
  nightCol: { width: "32%", paddingRight: 4 },
  total: {
    width: "16%",
    color: "#000000",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
  },
  head: { color: "#000000", fontSize: 13, fontWeight: "800" },
  headRight: { color: "#000000", fontSize: 13, fontWeight: "800", textAlign: "right" },
  slot: { color: "#000000", fontSize: 12 },
  bold: { fontWeight: "800" },
  dailyTotal: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
    marginTop: 4,
  },
  grand: {
    borderTopWidth: 1,
    borderTopColor: "#000000",
    marginTop: 24,
    paddingTop: 12,
    alignItems: "flex-end",
  },
  grandLabel: { color: "#000000", fontSize: 17, fontWeight: "800" },
});
