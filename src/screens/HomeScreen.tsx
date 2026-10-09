import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";

import { COLORS, INTERACTION, RADII, SHADOWS, withAlpha } from "../constants";
import { TYPOGRAPHY } from "../constants/typography";
import { useDoodhContext } from "../context/DoodhContext";
import {
  getLocalDateString,
} from "../utils/dateUtils";
import { calculateSummary } from "../utils/calculations";
import { calculateDayInsight } from "../domain/insights";
import { formatCurrency, formatNumber } from "../utils/formatters";
import { RootStackParamList } from "../types";
import Text from "../components/ScaledText";
import AppHeader from "../components/AppHeader";
import Button from "../components/Button";
import DateDisplay from "../components/ui/DateDisplay";
import ScreenContainer from "../components/ui/ScreenContainer";
import LocalizedDatePicker from "../components/ui/LocalizedDatePicker";
import EmptyState from "../components/ui/EmptyState";
import IconButton from "../components/ui/IconButton";
import MetricCard from "../components/ui/MetricCard";
import EntryList from "../components/entries/EntryList";
import SectionHeader from "../components/ui/SectionHeader";

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const { t } = useTranslation();
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

  const insight = useMemo(
    () =>
      calculateDayInsight({
        entries,
        selectedDate,
        summary,
      }),
    [entries, selectedDate, summary],
  );

  const recentEntries = useMemo(() => {
    if (!entries) return [];
    return [...entries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [entries]);

  const handleDateChange = (nextDate: string) => {
    setShowDatePicker(false);
    if (nextDate) setSelectedDate(nextDate);
  };

  const isToday = selectedDate === getLocalDateString();

  return (
    <ScreenContainer
      header={<AppHeader eyebrow={t("home.appTitle")} title={t("home.screenTitle")} />}
      contentStyle={styles.scrollContent}
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

        <Button
          variant="primary"
          size="md"
          fullWidth
          accessibilityLabel={t("home.addEntry")}
          onPress={() => navigation.navigate("EntryForm")}
          style={styles.summaryAdd}
          icon={
            <MaterialCommunityIcons name="plus" size={14} color={COLORS.white} />
          }
        >
          <Text style={styles.summaryAddText} numberOfLines={1}>
            {t("home.addEntry")}
          </Text>
        </Button>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryHeading}>
              <Text style={styles.summaryTitle}>
                {isToday ? t("home.summaryTitle") : t("home.daySummaryTitle")}
              </Text>
              <DateDisplay date={selectedDate} style={styles.summaryDate} />
            </View>
            <IconButton
              icon="calendar-today"
              accessibilityLabel={t("home.selectDate")}
              onPress={() => setShowDatePicker(true)}
              size={40}
              iconSize={18}
              backgroundColor={COLORS.surfaceLow}
              iconColor={COLORS.brand}
              borderRadius={RADII.control}
            />
          </View>

          <LocalizedDatePicker
            visible={showDatePicker}
            value={selectedDate}
            maximumDate={getLocalDateString()}
            onSelect={handleDateChange}
            onClose={() => setShowDatePicker(false)}
          />

          <View style={styles.metricsRow}>
            <MetricCard
              icon="cup-water"
              iconBackground={COLORS.blueFixed}
              iconColor={COLORS.blue}
              label={t("home.totalMilk")}
              value={formatNumber(summary.totalMilk, 1)}
              unit={t("common.kg")}
              containerStyle={styles.metricBoxBlue}
              iconStyle={styles.metricIconBlue}
              labelStyle={styles.metricLabel}
              valueStyle={styles.metricValue}
              unitStyle={styles.metricUnit}
            />
            <MetricCard
              icon="water"
              iconBackground={COLORS.amberFixed}
              iconColor={COLORS.amber}
              label={t("home.averageFat")}
              value={summary.avgFat}
              unit="%"
              containerStyle={styles.metricBoxAmber}
              iconStyle={styles.metricIconAmber}
              labelStyle={styles.metricLabel}
              valueStyle={styles.metricValue}
              unitStyle={styles.metricUnit}
            />
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

        <SectionHeader
          title={t("home.recentEntries")}
          actionLabel={t("home.viewAll")}
          onActionPress={() =>
            navigation.navigate("MainTabs", { screen: "Entries" })
          }
        />

        <EntryList
          entries={recentEntries}
          empty={<EmptyState icon="cup-water" message={t("home.empty")} />}
          onSelect={(selected) =>
            navigation.navigate("EntryForm", { entry: selected })
          }
        />

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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 16,
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
    borderRadius: RADII.pill,
  },
  summaryAddText: {
    color: COLORS.white,
    fontWeight: "700",
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
  pressedControl: { opacity: INTERACTION.pressedOpacity },
});
