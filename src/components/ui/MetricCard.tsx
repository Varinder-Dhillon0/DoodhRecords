import React from "react";
import { StyleProp, StyleSheet, TextStyle, View, ViewStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, RADII } from "../../constants";
import Text from "../ScaledText";

type MetricCardProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  iconBackground: string;
  iconColor: string;
  label: string;
  value: React.ReactNode;
  unit?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  valueStyle?: StyleProp<TextStyle>;
  unitStyle?: StyleProp<TextStyle>;
};

export default function MetricCard({
  icon,
  iconBackground,
  iconColor,
  label,
  value,
  unit,
  containerStyle,
  iconStyle,
  labelStyle,
  valueStyle,
  unitStyle,
}: MetricCardProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.icon, iconStyle, { backgroundColor: iconBackground }]}>
        <MaterialCommunityIcons name={icon} size={18} color={iconColor} />
      </View>
      <Text textVariant="caption" style={[styles.label, labelStyle]}>{label}</Text>
      <View style={styles.valueRow}>
        <Text textVariant="display" style={[styles.value, valueStyle]}>{value}</Text>
        {unit ? <Text textVariant="caption" style={[styles.unit, unitStyle]}>{unit}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: RADII.control,
    padding: 12,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: RADII.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  label: {
    fontWeight: "600",
    color: COLORS.muted,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
    marginTop: 2,
  },
  value: {
    color: COLORS.text,
  },
  unit: {
    fontWeight: "700",
    color: COLORS.muted,
  },
});
