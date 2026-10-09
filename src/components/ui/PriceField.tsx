import React from "react";
import { StyleSheet, View } from "react-native";
import type { FocusEvent } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, RADII, SPACING } from "../../constants";
import { TYPOGRAPHY } from "../../constants/typography";
import Text, { ScaledTextInput as TextInput } from "../ScaledText";

type PriceFieldProps = {
  iconBackground: string;
  iconColor: string;
  title: string;
  subtitle: string;
  value: string;
  accessibilityLabel: string;
  onChange: (value: string) => void;
  onFocus: (event: FocusEvent) => void;
};

export default function PriceField({
  iconBackground,
  iconColor,
  title,
  subtitle,
  value,
  accessibilityLabel,
  onChange,
  onFocus,
}: PriceFieldProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={[styles.icon, { backgroundColor: iconBackground }]}>
          <MaterialCommunityIcons name="cow" size={20} color={iconColor} />
        </View>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.inputBox}>
        <Text style={styles.currency}>₹</Text>
        <TextInput
          value={value}
          onFocus={onFocus}
          keyboardType="decimal-pad"
          onChangeText={onChange}
          style={styles.input}
          accessibilityLabel={accessibilityLabel}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: SPACING.md,
  },
  left: { flexDirection: "row", alignItems: "center", gap: SPACING.md, flex: 1 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: RADII.control,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: TYPOGRAPHY.bodySmall, fontWeight: "700", color: COLORS.text },
  subtitle: {
    fontSize: TYPOGRAPHY.micro,
    color: COLORS.muted,
    fontWeight: "500",
    marginTop: 2,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    backgroundColor: COLORS.surfaceLow,
    paddingHorizontal: 8,
    height: 36,
    width: 104,
    flexShrink: 0,
  },
  currency: {
    color: COLORS.muted,
    fontWeight: "700",
    fontSize: TYPOGRAPHY.bodySmall,
    marginRight: 4,
  },
  input: {
    flex: 1,
    textAlign: "right",
    fontSize: TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    fontWeight: "800",
    height: 36,
  },
});
