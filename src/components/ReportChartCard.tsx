import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type ReportChartCardProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
  title: string;
  children: React.ReactNode;
};

export default function ReportChartCard({
  icon,
  color,
  title,
  children,
}: ReportChartCardProps) {
  return (
    <View style={styles.chartCard}>
      <View style={styles.chartTitleRow}>
        <MaterialCommunityIcons name={icon} size={18} color={color} />
        <Text style={styles.chartTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginBottom: 16,
  },
  chartTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  chartTitle: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
});
