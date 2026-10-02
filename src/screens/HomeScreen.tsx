import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import DateTimePicker, {
  DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";

import { COLORS, RADII, SHADOWS, withAlpha } from "../constants";
import { TYPOGRAPHY } from "../constants/typography";
import { useDoodhContext } from "../context/DoodhContext";
import {
  formatDisplayDate,
  getLocalDateString,
  parseLocalDate,
} from "../utils/dateUtils";
import { calculateSummary } from "../utils/calculations";
import { formatCurrency, formatNumber } from "../utils/formatters";
import { MilkEntry, RootStackParamList } from "../types";
import Text from "../components/ScaledText";
import AppHeader from "../components/AppHeader";
import EntryRow from "../components/EntryRow";

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const TREND_WINDOW_DAYS = 7;
const shiftDateString = (dateString: string, offsetDays: number): string => {
  const [year, month, day] = dateString.split("-").map(Number);
  return getLocalDateString(new Date(year, month - 1, day + offsetDays));
};

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { entries } = useDoodhContext();
  const [selectedDate, setSelectedDate] =
    useState<string>(getLocalDateString());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const selectedDayEntries = useMemo(
    () =>
      entries ? entries.filter((entry) => entry.date === selectedDate) : [],
    [entries, selectedDate],
  );

  const summary = useMemo(
    () => calculateSummary(selectedDayEntries),
    [selectedDayEntries],
  );

  const insight = useMemo(() => {
    if (!entries || entries.length === 0 || selectedDayEntries.length === 0) {
      return null;
    }

    const byDay = new Map<
      string,
      { milk: number; fatWeight: number; earnings: number }
    >();
    for (let offset = 1; offset <= TREND_WINDOW_DAYS; offset += 1) {
      const dayKey = shiftDateString(selectedDate, -offset);
      const dayEntries = entries.filter((entry) => entry.date === dayKey);
      if (dayEntries.length === 0) continue;

      let milk = 0;
      let fatWeight = 0;
      let earnings = 0;
      for (const entry of dayEntries) {
        const qty = Number(entry.milk_quantity || 0);
        milk += qty;
        fatWeight += qty * Number(entry.fat_percentage || 0);
        earnings += Number(
          entry.fat_percentage * entry.milk_quantity * entry.price,
        );
      }
      byDay.set(dayKey, { milk, fatWeight, earnings });
    }

    if (byDay.size === 0) return null;

    const baselineEarnings =
      Array.from(byDay.values()).reduce((sum, day) => sum + day.earnings, 0) /
      byDay.size;
    const baselineFat =
      Array.from(byDay.values()).reduce((sum, day) => sum + day.fatWeight, 0) /
      Array.from(byDay.values()).reduce((sum, day) => sum + day.milk, 0);

    const currentFat = Number(summary.avgFat || 0);
    const fatDelta = Number((currentFat - baselineFat).toFixed(1));

    return {
      activeDays: byDay.size,
      earningsDelta:
        baselineEarnings > 0
          ? Number(
              (
                ((summary.totalEarnings - baselineEarnings) /
                  baselineEarnings) *
                100
              ).toFixed(0),
            )
          : null,
      fatDelta:
        Number.isFinite(baselineFat) && baselineFat > 0 ? fatDelta : null,
    };
  }, [entries, selectedDayEntries, selectedDate, summary]);

  const recentEntries = useMemo(() => {
    if (!entries) return [];
    return [...entries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [entries]);

  const handleDateChange = (_: DateTimePickerChangeEvent, value: Date) => {
    setShowDatePicker(false);
    if (value) setSelectedDate(getLocalDateString(value));
  };

  const isToday = selectedDate === getLocalDateString();

  return (
    <View style={styles.container}>
      <AppHeader eyebrow={t("home.appTitle")} title={t("home.screenTitle")} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.banner}>
          <View style={styles.bannerText}>
            <Text style={styles.bannerEyebrow}>{t("home.brandEyebrow")}</Text>
            <Text style={styles.bannerTitle}>{t("home.appTitle")}</Text>
            <Text style={styles.bannerTagline}>{t("home.brandTagline")}</Text>
          </View>
          <View style={styles.bannerIcon}>
            <MaterialCommunityIcons name="cow" size={40} color={COLORS.white} />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("home.addEntry")}
          onPress={() => navigation.navigate("EntryForm")}
          style={({ pressed }) => [
            styles.summaryAdd,
            pressed && styles.pressedAddButton,
          ]}
        >
          <MaterialCommunityIcons name="plus" size={16} color={COLORS.white} />
          <Text style={styles.summaryAddText} numberOfLines={1}>
            {t("home.addEntry")}
          </Text>
        </Pressable>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryHeading}>
              <Text style={styles.summaryTitle}>
                {isToday ? t("home.summaryTitle") : t("home.daySummaryTitle")}
              </Text>
              <Text style={styles.summaryDate}>
                {formatDisplayDate(selectedDate, i18n.language)}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("home.selectDate")}
              onPress={() => setShowDatePicker(true)}
              style={({ pressed }) => [
                styles.calendarBadge,
                pressed && styles.pressedControl,
              ]}
            >
              <MaterialCommunityIcons
                name="calendar-today"
                size={18}
                color={COLORS.brand}
              />
            </Pressable>
          </View>

          {showDatePicker ? (
            <DateTimePicker
              value={parseLocalDate(selectedDate)}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={parseLocalDate(getLocalDateString())}
              locale={i18n.language.startsWith("pa") ? "pa-IN" : undefined}
              onValueChange={handleDateChange}
              onDismiss={() => setShowDatePicker(false)}
              style={styles.datePicker}
            />
          ) : null}

          <View style={styles.metricsRow}>
            <View style={styles.metricBoxBlue}>
              <View style={styles.metricIconBlue}>
                <MaterialCommunityIcons
                  name="cup-water"
                  size={18}
                  color={COLORS.blue}
                />
              </View>
              <Text style={styles.metricLabel}>{t("home.totalMilk")}</Text>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValue}>
                  {formatNumber(summary.totalMilk, 1)}
                </Text>
                <Text style={styles.metricUnit}>{t("common.kg")}</Text>
              </View>
            </View>

            <View style={styles.metricBoxAmber}>
              <View style={styles.metricIconAmber}>
                <MaterialCommunityIcons
                  name="water"
                  size={18}
                  color={COLORS.amber}
                />
              </View>
              <Text style={styles.metricLabel}>{t("home.averageFat")}</Text>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValue}>{summary.avgFat}</Text>
                <Text style={styles.metricUnit}>%</Text>
              </View>
            </View>
          </View>

          <View style={styles.earningsBox}>
            <View style={styles.metricIconGreen}>
              <Text style={styles.rupeeMark}>₹</Text>
            </View>
            <View style={styles.earningsInfo}>
              <Text style={styles.earningsLabel}>
                {t("home.todaysEarnings")}
              </Text>
              <Text style={styles.earningsValue}>
                {formatCurrency(summary.totalEarnings)}
              </Text>
            </View>
            {insight?.earningsDelta != null ? (
              <View style={styles.deltaPill}>
                <MaterialCommunityIcons
                  name={
                    insight.earningsDelta >= 0 ? "trending-up" : "trending-down"
                  }
                  size={14}
                  color={COLORS.brand}
                />
                <Text style={styles.deltaText}>
                  {insight.earningsDelta >= 0 ? "+" : ""}
                  {insight.earningsDelta}%
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("home.recentEntries")}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              navigation.navigate("MainTabs", { screen: "Entries" })
            }
            style={styles.viewAll}
          >
            <Text style={styles.viewAllText}>{t("home.viewAll")}</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={COLORS.brand}
            />
          </Pressable>
        </View>

        <View style={styles.listCard}>
          {recentEntries.length > 0 ? (
            recentEntries.map((entry: MilkEntry, index: number) => (
              <EntryRow
                key={`${entry.id}-${entry.date}-${index}`}
                entry={entry}
                showDivider={index < recentEntries.length - 1}
                onPress={(selected) =>
                  navigation.navigate("EntryForm", { entry: selected })
                }
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons
                  name="cup-water"
                  size={32}
                  color={COLORS.muted}
                />
              </View>
              <Text style={styles.emptyText}>{t("home.empty")}</Text>
            </View>
          )}
        </View>

        {insight?.fatDelta != null && insight.fatDelta !== 0 ? (
          <View style={styles.insightBanner}>
            <View style={styles.insightIcon}>
              <MaterialCommunityIcons
                name="flask-outline"
                size={20}
                color={COLORS.white}
              />
            </View>
            <View style={styles.insightText}>
              <Text style={styles.insightTitle}>
                {t("home.qualityInsightTitle")}
              </Text>
              <Text style={styles.insightBody}>
                {t("home.qualityInsightBody", {
                  value: Math.abs(insight.fatDelta).toFixed(1),
                  direction: t(
                    insight.fatDelta > 0
                      ? "home.qualityAbove"
                      : "home.qualityBelow",
                  ),
                })}
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 16,
  },
  banner: {
    position: "relative",
    overflow: "hidden",
    borderRadius: RADII.card,
    backgroundColor: COLORS.brand,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...SHADOWS.control,
  },
  bannerText: { flex: 1 },
  bannerEyebrow: {
    fontSize: TYPOGRAPHY.micro,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: withAlpha(COLORS.brandLight, 0.9),
  },
  bannerTitle: {
    fontSize: TYPOGRAPHY.brandTitle,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: COLORS.white,
    marginTop: 2,
  },
  bannerTagline: {
    fontSize: TYPOGRAPHY.caption,
    color: withAlpha(COLORS.inversePrimary, 0.8),
    marginTop: 2,
  },
  bannerIcon: {
    width: 56,
    height: 56,
    borderRadius: RADII.card,
    backgroundColor: withAlpha(COLORS.greenAccent, 0.6),
    alignItems: "center",
    justifyContent: "center",
  },
  bannerGlow: {
    position: "absolute",
    right: -32,
    bottom: -40,
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: withAlpha(COLORS.brandLight, 0.1),
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.card,
    padding: 20,
    gap: 16,
    ...SHADOWS.card,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryHeading: { flex: 1 },
  summaryTitle: {
    fontSize: TYPOGRAPHY.headingSmall,
    fontWeight: "700",
    color: COLORS.text,
  },
  summaryDate: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.muted,
    fontWeight: "500",
    marginTop: 2,
  },
  calendarBadge: {
    width: 40,
    height: 40,
    borderRadius: RADII.control,
    backgroundColor: COLORS.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
  },
  datePicker: { alignSelf: "stretch" },
  metricsRow: { flexDirection: "row", alignItems: "stretch", gap: 8 },
  // Android renders an `elevation` shadow behind the view background, so a
  // translucent fill leaves a dark halo around the edge. Flat tint, no shadow.
  metricBoxBlue: {
    flex: 1,
    borderRadius: RADII.control,
    backgroundColor: COLORS.surfaceLow,
    padding: 12,
  },
  metricBoxAmber: {
    flex: 1,
    borderRadius: RADII.control,
    backgroundColor: withAlpha(COLORS.amberFixed, 0.4),
    padding: 12,
  },
  metricIconBlue: {
    width: 32,
    height: 32,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.blueFixed,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  metricIconAmber: {
    width: 32,
    height: 32,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.amberFixed,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: "600",
    color: COLORS.muted,
  },
  metricValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
    marginTop: 4,
  },
  metricValue: {
    fontSize: TYPOGRAPHY.display,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: COLORS.text,
  },
  metricUnit: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: "700",
    color: COLORS.muted,
  },
  earningsBox: {
    borderRadius: RADII.control,
    backgroundColor: withAlpha(COLORS.brandLight, 0.3),
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  metricIconGreen: {
    width: 40,
    height: 40,
    borderRadius: RADII.control,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  rupeeMark: {
    fontSize: TYPOGRAPHY.headingSmall,
    fontWeight: "800",
    color: COLORS.greenAccent,
  },
  earningsInfo: { flex: 1 },
  earningsLabel: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: "600",
    color: COLORS.muted,
  },
  earningsValue: {
    fontSize: TYPOGRAPHY.display,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: COLORS.brand,
  },
  deltaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: withAlpha(COLORS.surface, 0.8),
    borderRadius: RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  deltaText: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: "700",
    color: COLORS.brand,
  },
  summaryAdd: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.greenAccent,
  },
  pressedAddButton: {
    backgroundColor: COLORS.brand,
    transform: [{ scale: 0.99 }],
  },
  summaryAddText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: TYPOGRAPHY.caption,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.bodyLarge,
    fontWeight: "700",
    color: COLORS.text,
  },
  viewAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewAllText: {
    color: COLORS.brand,
    fontWeight: "700",
    fontSize: TYPOGRAPHY.caption,
  },
  listCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.card,
    overflow: "hidden",
    ...SHADOWS.card,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.muted,
    fontWeight: "500",
    fontSize: TYPOGRAPHY.caption,
  },
  insightBanner: {
    borderRadius: RADII.card,
    backgroundColor: withAlpha(COLORS.blueFixed, 0.4),
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: RADII.control,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  insightText: { flex: 1 },
  insightTitle: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: "700",
    color: COLORS.text,
  },
  insightBody: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.muted,
    marginTop: 2,
  },
  pressedControl: { opacity: 0.78 },
});
