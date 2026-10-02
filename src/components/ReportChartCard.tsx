import React from "react";
import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Text from "./ScaledText";
import { COLORS, RADII, SHADOWS } from "../constants";
import { TYPOGRAPHY } from "../constants/typography";

type ReportChartCardProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
  title: string;
  peakLabel?: string;
  children: React.ReactNode;
};

export default function ReportChartCard({
  icon,
  color,
  title,
  peakLabel,
  children,
}: ReportChartCardProps) {
  return (
    <View style={styles.chartCard}>
      <View style={styles.chartTitleRow}>
        <View style={[styles.iconTile, { backgroundColor: color }]}>
          <MaterialCommunityIcons name={icon} size={18} color={COLORS.white} />
        </View>
        <Text style={styles.chartTitle}>{title}</Text>
        {peakLabel ? (
          <View style={styles.peakBadge}>
            <MaterialCommunityIcons
              name="trending-up"
              size={12}
              color={COLORS.brand}
            />
            <Text style={styles.peakText} numberOfLines={1}>
              {peakLabel}
            </Text>
          </View>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.card,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  chartTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  iconTile: {
    width: 32,
    height: 32,
    borderRadius: RADII.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  chartTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.bodyLarge,
    fontWeight: "700",
    color: COLORS.text,
  },
  peakBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    height: 22,
    paddingHorizontal: 10,
    backgroundColor: COLORS.brandLight,
    borderRadius: RADII.pill,
  },
  peakText: {
    fontSize: TYPOGRAPHY.micro,
    fontWeight: "700",
    lineHeight: TYPOGRAPHY.micro,
    color: COLORS.brand,
  },
});
