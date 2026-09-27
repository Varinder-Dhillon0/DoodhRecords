import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants";
import { useDoodhContext } from "../context/DoodhContext";
import { getLocalDateString } from "../utils/dateUtils";
import { calculateSummary } from "../utils/calculations";
import { formatCurrency, formatNumber } from "../utils/formatters";
import { MilkEntry, RootStackParamList } from "../types";

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { entries } = useDoodhContext();
  const dateToday = getLocalDateString();

  const todaysEntries = useMemo(
    () => (entries ? entries.filter((entry) => entry.date === dateToday) : []),
    [entries, dateToday],
  );

  const summary = useMemo(
    () => calculateSummary(todaysEntries),
    [todaysEntries],
  );

  const recentEntries = useMemo(() => {
    if (!entries) return [];
    return [...entries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [entries]);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.headerCard,
          { paddingTop: Math.max(insets.top + 16, 44) },
        ]}
      >
        <View style={styles.headerTop}>
          <Text style={styles.appTitle}>Doodh Records</Text>
          <Text style={styles.appSubtitle}>Dairy Management</Text>
        </View>
        <View style={styles.heroIllustration}>
          <MaterialCommunityIcons name="cow" size={90} color="#FFFFFF" />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryTitle}>Today's Summary</Text>
              <Text style={styles.summaryDate}>{dateToday}</Text>
            </View>
            <View style={styles.calendarBadge}>
              <MaterialCommunityIcons
                name="calendar-check"
                size={20}
                color={COLORS.brand}
              />
            </View>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricBoxBlue}>
              <View style={styles.metricIconBlue}>
                <MaterialCommunityIcons
                  name="glass-mug-variant"
                  size={20}
                  color="#2563EB"
                />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricLabel}>Total Milk</Text>
                <Text style={styles.metricValue}>
                  {formatNumber(summary.totalMilk, 1)}{" "}
                  <Text style={styles.metricUnit}>kg</Text>
                </Text>
              </View>
            </View>

            <View style={styles.metricBoxAmber}>
              <View style={styles.metricIconAmber}>
                <MaterialCommunityIcons
                  name="water"
                  size={20}
                  color="#D97706"
                />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricLabel}>Avg. Fat</Text>
                <Text style={styles.metricValue}>{summary.avgFat}%</Text>
              </View>
            </View>
          </View>

          <View style={styles.earningsBox}>
            <View style={styles.metricIconGreen}>
              <MaterialCommunityIcons
                name="currency-inr"
                size={20}
                color={COLORS.brand}
              />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Today's Earnings</Text>
              <Text style={styles.earningsValue}>
                {formatCurrency(summary.totalEarnings)}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => navigation.navigate("EntryForm")}
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <MaterialCommunityIcons name="plus-circle" size={22} color="#fff" />
          <Text style={styles.addButtonText}>Add New Entry</Text>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          <Pressable onPress={() => navigation.navigate("MainTabs")}>
            <Text style={styles.linkText}>View All</Text>
          </Pressable>
        </View>

        <View style={styles.listCard}>
          {recentEntries.length > 0 ? (
            recentEntries.map((entry: MilkEntry, index: number) => (
              <Pressable
                key={`${entry.id}-${entry.date}-${index}`}
                onPress={() => navigation.navigate("EntryForm", { entry })}
                style={({ pressed }) => [
                  styles.entryRow,
                  pressed && styles.rowPressed,
                ]}
              >
                <View style={styles.entryLeft}>
                  <View
                    style={[
                      styles.entryIcon,
                      entry.animal === "Buffalo" && styles.buffaloIconBg,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="cow"
                      size={20}
                      color={entry.animal === "Cow" ? COLORS.brand : "#334155"}
                    />
                  </View>
                  <View>
                    <Text style={styles.entryTitle}>
                      {entry.shift}{" "}
                      <Text
                        style={[
                          styles.entrySubtitle,
                          entry.animal === "Buffalo" && styles.buffaloText,
                        ]}
                      >
                        ({entry.animal})
                      </Text>
                    </Text>
                    <Text style={styles.entryDate}>{entry.date}</Text>
                  </View>
                </View>
                <View style={styles.entryRight}>
                  <Text style={styles.entryEarnings}>
                    {formatCurrency(entry.earnings)}
                  </Text>
                  <Text style={styles.entryMeta}>
                    {formatNumber(entry.milk_quantity, 1)}kg •{" "}
                    {formatNumber(entry.fat_percentage, 1)}% Fat
                  </Text>
                </View>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={36}
                color="#94A3B8"
              />
              <Text style={styles.emptyText}>No entries recorded yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  headerCard: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  headerTop: { flex: 1 },
  appTitle: { color: "#fff", fontSize: 24, fontWeight: "800" },
  appSubtitle: {
    color: "#E9F7EC",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  heroIllustration: {
    width: 90,
    height: 90,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 18, paddingBottom: 100 },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 18,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  summaryDate: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 2,
  },
  calendarBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.brandLight,
    justifyContent: "center",
    alignItems: "center",
  },
  metricsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  metricBoxBlue: {
    flex: 1,
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  metricIconBlue: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  metricBoxAmber: {
    flex: 1,
    backgroundColor: "#FFFBEB",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  metricIconAmber: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  metricContent: { flex: 1 },
  metricLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 2,
  },
  metricValue: { fontSize: 17, fontWeight: "800", color: "#0F172A" },
  metricUnit: { fontSize: 11, fontWeight: "600", color: "#64748B" },
  earningsBox: {
    backgroundColor: "#E9F7EC",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  metricIconGreen: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  earningsValue: { fontSize: 22, fontWeight: "900", color: COLORS.brand },
  addButton: {
    backgroundColor: COLORS.brand,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    shadowColor: COLORS.brand,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  addButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  linkText: { color: COLORS.brand, fontWeight: "700", fontSize: 13 },
  listCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  entryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  rowPressed: { backgroundColor: "#F8FAFC" },
  entryLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  entryIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: COLORS.brandLight,
    alignItems: "center",
    justifyContent: "center",
  },
  buffaloIconBg: { backgroundColor: "#F1F5F9" },
  entryTitle: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  entrySubtitle: { fontSize: 12, fontWeight: "600", color: COLORS.brand },
  buffaloText: { color: "#475569" },
  entryDate: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
    fontWeight: "500",
  },
  entryRight: { alignItems: "flex-end" },
  entryEarnings: { fontSize: 15, fontWeight: "800", color: COLORS.brand },
  entryMeta: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  emptyText: {
    textAlign: "center",
    color: "#94A3B8",
    fontWeight: "600",
    fontSize: 13,
  },
});
