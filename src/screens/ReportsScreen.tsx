import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants";
import { useDoodhContext } from "../context/DoodhContext";
import { getLocalDateString } from "../utils/dateUtils";
import { calculateEntryEarnings, calculateSummary } from "../utils/calculations";
import { formatCurrency, formatNumber } from "../utils/formatters";
import MonthYearFilter from "../components/MonthYearFilter";
import ReportChartCard from "../components/ReportChartCard";

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const { entries, pricingConfig } = useDoodhContext();

  const todayStr = getLocalDateString();
  const currentYear = todayStr.slice(0, 4);
  const currentMonth = todayStr.slice(5, 7);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);

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

  const screenWidth = Dimensions.get("window").width;
  const chartWidth = Math.max(screenWidth - 56, 280);

  const formatXLabel = (val: string) => {
    const day = Number(val);
    if (day === 1 || day % 5 === 0) return val;
    return "";
  };

  const chartConfigBase = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 1,
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    propsForBackgroundLines: {
      stroke: "#E2E8F0",
      strokeWidth: 1,
      strokeDasharray: "",
    },
    propsForDots: { r: "3", strokeWidth: "1" },
  };

  return (
    <View style={styles.container}>
      <View
        style={[styles.header, { paddingTop: Math.max(insets.top + 12, 44) }]}
      >
        <Text style={styles.title}>Monthly Reports</Text>
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
          <View>
            <Text style={styles.summaryLabel}>Total Monthly Earnings</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(reportSummary.totalEarnings)}
            </Text>
          </View>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="currency-inr"
              size={26}
              color="#fff"
            />
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricIconBlue}>
              <MaterialCommunityIcons
                name="glass-mug-variant"
                size={20}
                color="#2563EB"
              />
            </View>
            <Text style={styles.metricLabel}>Total Milk</Text>
            <Text style={styles.metricValue}>
              {formatNumber(reportSummary.totalMilk, 1)}{" "}
              <Text style={styles.metricUnit}>kg</Text>
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricIconAmber}>
              <MaterialCommunityIcons name="water" size={20} color="#D97706" />
            </View>
            <Text style={styles.metricLabel}>Average Fat</Text>
            <Text style={styles.metricValue}>{reportSummary.avgFat}%</Text>
          </View>
        </View>

        <ReportChartCard
          icon="chart-bell-curve-cumulative"
          color="#2563EB"
          title="Daily Milk Quantity (kg)"
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
              color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
              propsForDots: { r: "3", strokeWidth: "1", stroke: "#2563EB" },
            }}
            bezier
            style={styles.chart}
          />
        </ReportChartCard>

        <ReportChartCard
          icon="water-percent"
          color="#D97706"
          title="Daily Fat Percentage (%)"
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
              color: (opacity = 1) => `rgba(217, 119, 6, ${opacity})`,
              propsForDots: { r: "3", strokeWidth: "1", stroke: "#D97706" },
            }}
            bezier
            style={styles.chart}
          />
        </ReportChartCard>

        <ReportChartCard
          icon="cash-multiple"
          color={COLORS.brand}
          title="Daily Earnings (₹)"
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
              color: (opacity = 1) => `rgba(30, 86, 49, ${opacity})`,
              propsForDots: { r: "3", strokeWidth: "1", stroke: COLORS.brand },
            }}
            bezier
            style={styles.chart}
          />
        </ReportChartCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  title: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  content: { flex: 1 },
  contentPad: { padding: 18, paddingBottom: 100 },
  summaryCard: {
    backgroundColor: COLORS.brand,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: COLORS.brand,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E9F7EC",
    marginBottom: 4,
  },
  summaryValue: { fontSize: 28, fontWeight: "900", color: "#fff" },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  metricsGrid: { flexDirection: "row", gap: 12, marginBottom: 16 },
  metricCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
  },
  metricIconBlue: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  metricIconAmber: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFBEB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  metricLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  metricValue: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  metricUnit: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  chart: { marginVertical: 4, borderRadius: 12 },
});
