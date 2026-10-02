import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { COLORS, RADII } from "../constants";
import { TYPOGRAPHY } from "../constants/typography";
import { MilkEntry } from "../types";
import { formatDisplayDate } from "../utils/dateUtils";
import { formatCurrency, formatNumber } from "../utils/formatters";
import Text from "./ScaledText";

type EntryRowProps = {
  entry: MilkEntry;
  onPress: (entry: MilkEntry) => void;
  showDivider?: boolean;
};

export default function EntryRow({
  entry,
  onPress,
  showDivider = true,
}: EntryRowProps) {
  const { t, i18n } = useTranslation();
  const isCow = entry.animal === "Cow";

  return (
    <Pressable
      onPress={() => onPress(entry)}
      style={({ pressed }) => [
        styles.row,
        showDivider && styles.divider,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.left}>
        <View style={styles.badge}>
          <MaterialCommunityIcons
            name="cow"
            size={24}
            color={isCow ? COLORS.brand : COLORS.muted}
          />
        </View>
        <View style={styles.center}>
          <View style={styles.titleLine}>
            <Text style={styles.title}>
              {t(`shifts.${entry.shift.toLowerCase()}`)}
            </Text>
            <Text style={styles.subtitle}>
              ({t(`animals.${entry.animal.toLowerCase()}`)})
            </Text>
          </View>
          <Text style={styles.date}>
            {formatDisplayDate(entry.date, i18n.language)}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.earnings}>
          {formatCurrency(
            entry.fat_percentage * entry.milk_quantity * entry.price,
          )}
        </Text>
        <Text style={styles.meta}>
          {t("home.milkAndFat", {
            quantity: formatNumber(entry.milk_quantity, 1),
            fat: formatNumber(entry.fat_percentage, 1),
          })}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.surfaceContainer,
  },
  pressed: { backgroundColor: COLORS.surfaceLow },
  left: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  badge: {
    width: 48,
    height: 48,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1 },
  titleLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: {
    fontSize: TYPOGRAPHY.bodyLarge,
    fontWeight: "700",
    color: COLORS.text,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: "500",
    color: COLORS.muted,
  },
  date: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.muted,
    marginTop: 2,
  },
  right: { alignItems: "flex-end" },
  earnings: {
    fontSize: TYPOGRAPHY.headingSmall,
    fontWeight: "800",
    color: COLORS.brand,
  },
  meta: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: "600",
    color: COLORS.muted,
    marginTop: 2,
  },
});
