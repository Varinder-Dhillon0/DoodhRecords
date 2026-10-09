import React from "react";
import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Text from "./ScaledText";
import Card from "./ui/Card";
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
    <Card style={styles.chartCard}>
      <View style={styles.chartTitleRow}>
        <View style={[styles.iconTile, { backgroundColor: color }]}>
          <MaterialCommunityIcons name={icon} size={18} color={COLORS.white} />
        </View>
        <Text style={styles.chartTitle}>{title}</Text>
        {peakLabel ? (
          <View style={styles.peakBadge}>
            <MaterialCommunityIcons
              name="trending-up"
              size={11}
              color={COLORS.brand}
            />
            <Text style={styles.peakText} numberOfLines={1}>
              {peakLabel}
            </Text>
          </View>
        ) : null}
      </View>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  chartCard: {
    marginBottom: 16,
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
    gap: 4,
    minHeight: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: COLORS.brandLight,
    borderRadius: RADII.pill,
    flexShrink: 1,
  },
  peakText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.brand,
    flexShrink: 1,
  },
});
