import React, { useMemo, useState } from "react";
import { View, StyleSheet, Alert, useWindowDimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { COLORS, RADII, SHADOWS, withAlpha } from "../constants";
import { useDoodhContext } from "../context/DoodhContext";
import {
  useCurrentMonthYear,
  useEntriesForMonth,
  usePricedEntries,
} from "../hooks/useEntries";
import { calculateSummary } from "../utils/calculations";
import { buildMonthlyChartData } from "../domain/reports";
import { formatCurrency, formatNumber } from "../utils/formatters";
import MonthYearFilter from "../components/MonthYearFilter";
import EmptyState from "../components/ui/EmptyState";
import ExportCard from "../components/ui/ExportCard";
import ScreenContainer from "../components/ui/ScreenContainer";
import MetricCard from "../components/ui/MetricCard";
import ReportChartCard from "../components/ReportChartCard";
import AppHeader from "../components/AppHeader";
import Text from "../components/ScaledText";
import { TYPOGRAPHY } from "../constants/typography";
import { FONT_FAMILY } from "../constants/fonts";
import { useFontScale } from "../context/FontScaleContext";
import { useDataExport } from "../hooks/useDataExport";
import { useSnackbar } from "../context/SnackbarContext";

export default function ReportsScreen() {
  const { t } = useTranslation();
  const { showSnackbar } = useSnackbar();
  const { typography } = useFontScale();
  const { entries, pricingConfig } = useDoodhContext();
  const {
    month: selectedMonth,
    year: selectedYear,
    setMonth: setSelectedMonth,
    setYear: setSelectedYear,
  } = useCurrentMonthYear();
  const { isExporting, exportData: handleExport } = useDataExport({
    dialogTitle: t("settings.exportDialogTitle"),
    onExported: (exported) => {
      if (!exported) {
        Alert.alert(t("common.error"), t("settings.exportUnavailable"));
        return;
      }
      showSnackbar(t("settings.exportSuccess"));
    },
    onError: (error) => {
      console.error("Error exporting app data:", error);
      Alert.alert(t("common.error"), t("settings.exportError"));
    },
  });

  const pricedEntries = usePricedEntries(entries, pricingConfig);
  const filteredEntries = useEntriesForMonth(pricedEntries, selectedYear, selectedMonth);

  const reportSummary = useMemo(
    () => calculateSummary(filteredEntries),
    [filteredEntries],
  );

  const chartData = useMemo(
    () => buildMonthlyChartData(filteredEntries, selectedYear, selectedMonth),
    [filteredEntries, selectedMonth, selectedYear],
  );

  const peakLabel = (values: number[], suffix = "", decimals = 1) => {
    const peak = Math.max(...values, 0);
    if (!Number.isFinite(peak) || peak <= 0) return undefined;
    return t("reports.peak", { value: `${formatNumber(peak, decimals)}${suffix}` });
  };

  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = Math.max(screenWidth - 64, 280);

  const formatXLabel = (val: string) => {
    const day = Number(val);
    if (day === 1 || day % 5 === 0) return val;
    return "";
  };

  const chartConfigBase = {
    backgroundGradientFrom: COLORS.surface,
    backgroundGradientTo: COLORS.surface,
    decimalPlaces: 1,
    labelColor: (opacity = 1) => withAlpha(COLORS.muted, opacity),
    propsForBackgroundLines: {
      stroke: COLORS.surfaceContainer,
      strokeWidth: 1,
      strokeDasharray: "",
    },
    propsForDots: { r: "3", strokeWidth: "1" },
    propsForLabels: { fontSize: typography.caption, fontFamily: FONT_FAMILY.regular },
    propsForVerticalLabels: { fontSize: typography.caption, fontFamily: FONT_FAMILY.regular },
  };

  return (
    <ScreenContainer
      header={<AppHeader eyebrow={t("home.appTitle")} title={t("reports.title")} />}
      fixedContent={
        <View style={styles.filterBar}>
          <MonthYearFilter
            month={selectedMonth}
            year={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
          />
        </View>
      }
    >
      <View style={styles.summaryCard}>
          <View style={styles.summaryText}>
            <Text style={styles.summaryLabel}>
              {t("reports.totalMonthlyEarnings")}
            </Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(reportSummary.totalEarnings)}
            </Text>
          </View>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="currency-inr"
              size={24}
              color={COLORS.white}
            />
          </View>
          <View style={styles.summaryGlow} />
        </View>

        {filteredEntries.length === 0 ? (
          <EmptyState
            icon="chart-box-outline"
            title={t("reports.emptyTitle")}
            message={t("reports.emptySubtitle")}
          />
        ) : null}

        <View style={styles.metricsGrid}>
          <MetricCard
            icon="cup-water"
            iconBackground={COLORS.blueFixed}
            iconColor={COLORS.blue}
            label={t("reports.totalMilk")}
            value={formatNumber(reportSummary.totalMilk, 1)}
            unit={t("common.kg")}
            containerStyle={styles.metricCard}
            iconStyle={styles.metricIconBlue}
            labelStyle={styles.metricLabel}
            valueStyle={styles.metricValue}
            unitStyle={styles.metricUnit}
          />
          <MetricCard
            icon="water"
            iconBackground={COLORS.amberFixed}
            iconColor={COLORS.amber}
            label={t("reports.averageFat")}
            value={reportSummary.avgFat}
            unit="%"
            containerStyle={styles.metricCard}
            iconStyle={styles.metricIconAmber}
            labelStyle={styles.metricLabel}
            valueStyle={styles.metricValue}
            unitStyle={styles.metricUnit}
          />
        </View>

        <ReportChartCard
          icon="chart-bell-curve-cumulative"
          color={COLORS.blue}
          title={t("reports.dailyMilk")}
          peakLabel={peakLabel(chartData.milkValues, " kg")}
        >
          <LineChart
            data={{
              labels: chartData.labels,
              datasets: [{ data: chartData.milkValues }],
            }}
            width={chartWidth}
            height={190}
            formatXLabel={formatXLabel}
            chartConfig={{
              ...chartConfigBase,
              color: (opacity = 1) => withAlpha(COLORS.blue, opacity),
              propsForDots: { r: "3", strokeWidth: "1", stroke: COLORS.blue },
            }}
            bezier
            style={styles.chart}
          />
        </ReportChartCard>

        <ReportChartCard
          icon="water-percent"
          color={COLORS.amber}
          title={t("reports.dailyFat")}
          peakLabel={peakLabel(chartData.fatValues, "%")}
        >
          <LineChart
            data={{
              labels: chartData.labels,
              datasets: [{ data: chartData.fatValues }],
            }}
            width={chartWidth}
            height={190}
            formatXLabel={formatXLabel}
            chartConfig={{
              ...chartConfigBase,
              color: (opacity = 1) => withAlpha(COLORS.amber, opacity),
              propsForDots: { r: "3", strokeWidth: "1", stroke: COLORS.amber },
            }}
            bezier
            style={styles.chart}
          />
        </ReportChartCard>

        <ReportChartCard
          icon="cash-multiple"
          color={COLORS.greenAccent}
          title={t("reports.dailyEarnings")}
          peakLabel={peakLabel(chartData.earningValues, "", 0)}
        >
          <LineChart
            data={{
              labels: chartData.labels,
              datasets: [{ data: chartData.earningValues }],
            }}
            width={chartWidth}
            height={190}
            formatXLabel={formatXLabel}
            chartConfig={{
              ...chartConfigBase,
              decimalPlaces: 0,
              color: (opacity = 1) => withAlpha(COLORS.brand, opacity),
              propsForDots: { r: "3", strokeWidth: "1", stroke: COLORS.brand },
            }}
            bezier
            style={styles.chart}
          />
        </ReportChartCard>

        <ExportCard
          label={t("settings.exportData")}
          busyLabel={t("settings.exporting")}
          busy={isExporting}
          onPress={handleExport}
        />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filterBar: { paddingHorizontal: 16, paddingBottom: 12 },
  summaryCard: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: COLORS.greenAccent,
    borderRadius: RADII.card,
    padding: 20,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...SHADOWS.control,
  },
  summaryText: { zIndex: 1 },
  summaryLabel: {
    fontSize: TYPOGRAPHY.micro,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: COLORS.brandDim,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.display,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: COLORS.white,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: RADII.pill,
    backgroundColor: withAlpha(COLORS.white, 0.2),
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  summaryGlow: {
    position: "absolute",
    right: -40,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: withAlpha(COLORS.white, 0.06),
  },
  metricsGrid: { flexDirection: "row", alignItems: "stretch", gap: 12, marginBottom: 16 },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    padding: 12,
  },
  metricIconBlue: {
    width: 32,
    height: 32,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.blueFixed,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  metricIconAmber: {
    width: 32,
    height: 32,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.amberFixed,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  metricLabel: {
    color: COLORS.muted,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: "600",
    marginBottom: 4,
  },
  metricValueRow: { flexDirection: "row", alignItems: "baseline", gap: 3 },
  metricValue: {
    fontSize: TYPOGRAPHY.heading,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: COLORS.text,
  },
  metricUnit: { fontSize: TYPOGRAPHY.caption, fontWeight: "600", color: COLORS.muted },
  chart: { marginVertical: 4, borderRadius: RADII.control },
});
