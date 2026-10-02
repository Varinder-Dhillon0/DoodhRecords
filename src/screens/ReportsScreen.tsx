import React, { useMemo, useState } from "react";
import { View, ScrollView, StyleSheet, Dimensions, Alert, Pressable } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { COLORS, RADII, SHADOWS, withAlpha } from "../constants";
import { useDoodhContext } from "../context/DoodhContext";
import { getLocalDateString } from "../utils/dateUtils";
import { calculateEntryEarnings, calculateSummary } from "../utils/calculations";
import { formatCurrency, formatNumber } from "../utils/formatters";
import MonthYearFilter from "../components/MonthYearFilter";
import ReportChartCard from "../components/ReportChartCard";
import AppHeader from "../components/AppHeader";
import Text from "../components/ScaledText";
import { TYPOGRAPHY } from "../constants/typography";
import { FONT_FAMILY } from "../constants/fonts";
import { useFontScale } from "../context/FontScaleContext";
import { createDataExportFile } from "../utils/storageManager";
import { useSnackbar } from "../context/SnackbarContext";
import * as Sharing from "expo-sharing";

export default function ReportsScreen() {
  const { t } = useTranslation();
  const { showSnackbar } = useSnackbar();
  const { typography } = useFontScale();
  const { entries, pricingConfig } = useDoodhContext();

  const todayStr = getLocalDateString();
  const currentYear = todayStr.slice(0, 4);
  const currentMonth = todayStr.slice(5, 7);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(t("common.error"), t("settings.exportUnavailable"));
        return;
      }
      const { uri } = await createDataExportFile();
      await Sharing.shareAsync(uri, {
        dialogTitle: t("settings.exportDialogTitle"),
        mimeType: "application/json",
        UTI: "public.json",
      });
      showSnackbar(t("settings.exportSuccess"));
    } catch (error) {
      console.error("Error exporting app data:", error);
      Alert.alert(t("common.error"), t("settings.exportError"));
    } finally {
      setIsExporting(false);
    }
  };

  const pricedEntries = useMemo(
    () =>
      entries.map((entry) => ({
        ...entry,
        earnings: calculateEntryEarnings(entry, pricingConfig),
      })),
    [entries, pricingConfig],
  );

  const filteredEntries = useMemo(() => {
    const monthPad = selectedMonth.padStart(2, "0");
    const prefix = `${selectedYear}-${monthPad}`;
    return pricedEntries.filter(
      (entry) => entry.date && entry.date.startsWith(prefix),
    );
  }, [pricedEntries, selectedMonth, selectedYear]);

  const reportSummary = useMemo(
    () => calculateSummary(filteredEntries),
    [filteredEntries],
  );

  const chartData = useMemo(() => {
    const monthNum = Number(selectedMonth);
    const yearNum = Number(selectedYear);
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

    const labels = Array.from(
      { length: daysInMonth },
      (_, index) => `${index + 1}`,
    );

    const milkValues = Array.from({ length: daysInMonth }, (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      const targetDate = `${selectedYear}-${selectedMonth.padStart(2, "0")}-${day}`;
      return filteredEntries
        .filter((e) => e.date === targetDate)
        .reduce((sum, e) => sum + Number(e.milk_quantity || 0), 0);
    });

    const fatValues = Array.from({ length: daysInMonth }, (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      const targetDate = `${selectedYear}-${selectedMonth.padStart(2, "0")}-${day}`;
      const dayEntries = filteredEntries.filter((e) => e.date === targetDate);
      const totalMilkForDay = dayEntries.reduce(
        (sum, e) => sum + Number(e.milk_quantity || 0),
        0,
      );
      const totalFatProduct = dayEntries.reduce(
        (sum, e) =>
          sum + Number(e.fat_percentage || 0) * Number(e.milk_quantity || 0),
        0,
      );
      return totalMilkForDay > 0
        ? Number((totalFatProduct / totalMilkForDay).toFixed(1))
        : 0;
    });

    const earningValues = Array.from({ length: daysInMonth }, (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      const targetDate = `${selectedYear}-${selectedMonth.padStart(2, "0")}-${day}`;
      return filteredEntries
        .filter((e) => e.date === targetDate)
        .reduce((sum, e) => sum + Number(e.earnings || 0), 0);
    });

    return { labels, milkValues, fatValues, earningValues };
  }, [filteredEntries, selectedMonth, selectedYear]);

  const peakLabel = (values: number[], suffix = "", decimals = 1) => {
    const peak = Math.max(...values, 0);
    if (!Number.isFinite(peak) || peak <= 0) return undefined;
    return t("reports.peak", { value: `${formatNumber(peak, decimals)}${suffix}` });
  };

  const screenWidth = Dimensions.get("window").width;
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
    <View style={styles.container}>
      <AppHeader eyebrow={t("home.appTitle")} title={t("reports.title")} />

      <View style={styles.filterBar}>
        <MonthYearFilter
          month={selectedMonth}
          year={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentPad}
        showsVerticalScrollIndicator={false}
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

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricIconBlue}>
              <MaterialCommunityIcons
                name="cup-water"
                size={18}
                color={COLORS.blue}
              />
            </View>
            <Text style={styles.metricLabel}>{t("reports.totalMilk")}</Text>
            <View style={styles.metricValueRow}>
              <Text style={styles.metricValue}>
                {formatNumber(reportSummary.totalMilk, 1)}
              </Text>
              <Text style={styles.metricUnit}>{t("common.kg")}</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricIconAmber}>
              <MaterialCommunityIcons name="water" size={18} color={COLORS.amber} />
            </View>
            <Text style={styles.metricLabel}>{t("reports.averageFat")}</Text>
            <View style={styles.metricValueRow}>
              <Text style={styles.metricValue}>{reportSummary.avgFat}</Text>
              <Text style={styles.metricUnit}>%</Text>
            </View>
          </View>
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

        <Pressable
          accessibilityRole="button"
          disabled={isExporting}
          onPress={handleExport}
          style={({ pressed }) => [
            styles.exportButton,
            pressed && styles.exportButtonPressed,
            isExporting && styles.exportButtonDisabled,
          ]}
        >
          <View style={styles.exportLeft}>
            <MaterialCommunityIcons
              name="file-download-outline"
              size={20}
              color={COLORS.blue}
            />
            <Text style={styles.exportText}>
              {isExporting ? t("settings.exporting") : t("settings.exportData")}
            </Text>
          </View>
          <View style={styles.exportBadge}>
            <Text style={styles.exportBadgeText}>JSON</Text>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filterBar: { paddingHorizontal: 16, paddingBottom: 12 },
  content: { flex: 1 },
  contentPad: { paddingHorizontal: 16, paddingBottom: 100 },
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
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderRadius: RADII.card,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.blueFixed,
    ...SHADOWS.card,
  },
  exportButtonPressed: { backgroundColor: COLORS.blueFixed },
  exportButtonDisabled: { opacity: 0.6 },
  exportLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  exportText: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: "600",
    color: COLORS.text,
  },
  exportBadge: {
    alignItems: "center",
    justifyContent: "center",
    height: 22,
    paddingHorizontal: 8,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.blueFixed,
  },
  exportBadgeText: {
    fontSize: TYPOGRAPHY.micro,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: COLORS.blue,
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
